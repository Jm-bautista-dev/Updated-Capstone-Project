<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Delivery;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * OrderFulfillmentService
 *
 * ─────────────────────────────────────────────────────────────────
 * PURPOSE: Post-delivery business logic layer.
 *
 * This service is the ONLY place that:
 *   1. Deducts inventory for a delivered mobile order
 *   2. Records it as a Sale for analytics
 *
 * It is INTENTIONALLY separated from:
 *   - Rider workflow (RiderController)
 *   - Order status transitions (Order state machine)
 *   - Web admin delivery controls (DeliveryService)
 *
 * SAFETY GUARANTEE:
 *   - Guarded by `inventory_deducted` flag → runs exactly ONCE per order.
 *   - Wrapped in a DB transaction → no partial states.
 *   - All failures are caught and logged → delivery response is never broken.
 * ─────────────────────────────────────────────────────────────────
 */
class OrderFulfillmentService
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Main entry point. Call this after any order transitions to 'delivered'.
     * Safe to call multiple times — idempotent via `inventory_deducted` flag.
     *
     * @param  Order    $order    The delivered order (with items loaded if possible)
     * @param  Delivery $delivery The linked delivery record
     */
    public function onOrderDelivered(Order $order, Delivery $delivery): void
    {
        try {
            DB::transaction(function () use ($order, $delivery) {

                // ── Step 1: Deduct inventory ─────────────────────────────
                if (!$order->inventory_deducted) {
                    $this->inventoryService->deductForOrder($order);
                    Log::info('OrderFulfillment: inventory deducted.', [
                        'order_id'  => $order->id,
                        'branch_id' => $order->branch_id,
                    ]);
                } else {
                    Log::info('OrderFulfillment: inventory already deducted, skipping deduction.', [
                        'order_id' => $order->id,
                    ]);
                }

                // ── Step 2: Record as Sale for analytics ─────────────────
                $this->recordAsSale($order, $delivery);

            });
        } catch (\Throwable $e) {
            // CRITICAL: Never break the delivery response.
            // Log the error for manual review and move on.
            Log::error('OrderFulfillment: post-delivery hook failed.', [
                'order_id' => $order->id,
                'error'    => $e->getMessage(),
                'trace'    => $e->getTraceAsString(),
            ]);
        }
    }

    /**
     * Record the delivered order as an authoritative Sale record for Sales, Reports, and Dashboard.
     *
     * Idempotent: Enforces uniqueness via permanent internal order_id.
     */
    private function recordAsSale(Order $order, Delivery $delivery): void
    {
        // ── Guard: Prevent duplicate sales records via permanent Order ID & Delivery Link ─────
        if ($delivery->sale_id) {
            $existingSale = Sale::find($delivery->sale_id);
            if ($existingSale) {
                Log::info('OrderFulfillment: sale already recorded for delivery, skipping.', [
                    'order_id' => $order->id,
                    'sale_id'  => $delivery->sale_id,
                ]);
                return;
            }
        }

        $existingSaleByOrderId = Sale::where('order_id', $order->id)->first();
        if ($existingSaleByOrderId) {
            if ($delivery->sale_id !== $existingSaleByOrderId->id) {
                $delivery->update(['sale_id' => $existingSaleByOrderId->id]);
            }
            Log::info('OrderFulfillment: sale already exists for order_id, linked delivery and skipped.', [
                'order_id' => $order->id,
                'sale_id'  => $existingSaleByOrderId->id,
            ]);
            return;
        }

        $orderNum = $order->order_number ?: ('ORD-' . $order->id);

        // Load relationships needed for cost calculation
        $order->loadMissing(['items.product.ingredients.stocks', 'branch']);

        // ── Calculate accurate product recipe cost and profit ────────────
        $costTotal = 0;
        $itemsData = [];
        $saleDate  = $delivery->delivered_at ?? now();

        foreach ($order->items as $item) {
            $product  = $item->product;
            $itemCost = $product ? (float) ($product->computeProductCost($order->branch_id) ?? 0) : 0;
            $costTotal += $itemCost * (float) $item->quantity;

            $itemsData[] = [
                'product_id' => $item->product_id,
                'quantity'   => $item->quantity,
                'unit_price' => $item->price,
                'cost_price' => $itemCost,
                'subtotal'   => (float) $item->price * (float) $item->quantity,
                'profit'     => ((float) $item->price - $itemCost) * (float) $item->quantity,
                'created_at' => $saleDate,
                'updated_at' => now(),
            ];
        }

        $productSubtotal = array_sum(array_column($itemsData, 'subtotal'));
        $deliveryFee     = (float) ($delivery->delivery_fee ?? 0.00);
        $profit          = $productSubtotal - $costTotal;

        // ── Create authoritative Sale record ─────────────────────────────
        $sale = Sale::create([
            'order_id'       => $order->id,
            'order_number'   => $orderNum,
            'user_id'        => $order->user_id ?? 1,
            'branch_id'      => $order->branch_id,
            'type'           => 'delivery',
            'subtotal'       => $productSubtotal,
            'delivery_fee'   => $deliveryFee,
            'total'          => $order->total_amount,
            'cost_total'     => $costTotal,
            'profit'         => $profit,
            'paid_amount'    => $order->total_amount,
            'change_amount'  => 0,
            'payment_method' => $order->payment_method ?? 'online',
            'status'         => 'completed',
            'created_at'     => $saleDate,
            'updated_at'     => now(),
        ]);

        // ── Create Sale Items ────────────────────────────────────────────
        foreach ($itemsData as $itemData) {
            $itemData['sale_id'] = $sale->id;
            SaleItem::create($itemData);
        }

        // ── Link Sale back to the Delivery record ────────────────────────
        $delivery->update(['sale_id' => $sale->id]);

        // ── 🔥 Real-time Broadcast & Cache Clearing ──────────────────────
        try {
            event(new \App\Events\SaleCreated($sale->fresh(['branch'])));
            \App\Services\TopPickService::clearCache();
        } catch (\Throwable $e) {
            Log::warning('OrderFulfillment: SaleCreated broadcast warning: ' . $e->getMessage());
        }

        Log::info('OrderFulfillment: sale recorded successfully.', [
            'order_id'     => $order->id,
            'sale_id'      => $sale->id,
            'order_number' => $orderNum,
            'branch_id'    => $order->branch_id,
            'total'        => $order->total_amount,
            'cogs'         => $costTotal,
            'profit'       => $profit,
        ]);
    }
}
