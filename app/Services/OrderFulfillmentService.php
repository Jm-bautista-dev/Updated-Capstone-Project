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

                // ── Guard: Only process once per order ──────────────────
                // Re-fetch with a lock to prevent race conditions if two
                // requests somehow fire simultaneously.
                $order = Order::lockForUpdate()->findOrFail($order->id);

                if ($order->inventory_deducted) {
                    Log::info('OrderFulfillment: already processed, skipping.', [
                        'order_id' => $order->id,
                    ]);
                    return;
                }

                // ── Step 1: Deduct inventory ─────────────────────────────
                // Uses the existing InventoryService which handles branch-specific
                // stock, unit conversion, and WAC cost tracking.
                $this->inventoryService->deductForOrder($order);

                Log::info('OrderFulfillment: inventory deducted.', [
                    'order_id'  => $order->id,
                    'branch_id' => $order->branch_id,
                ]);

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
     * Record the delivered order as a Sale record for the analytics dashboard.
     * Uses the same pattern as DeliveryService::recordOrderAsSale to stay consistent.
     *
     * Idempotent: checks for existing order_number before inserting.
     */
    private function recordAsSale(Order $order, Delivery $delivery): void
    {
        $orderNum = 'MOB-' . str_pad($order->id, 6, '0', STR_PAD_LEFT);

        // ── Guard: Prevent duplicate sales records ───────────────────────
        if (Sale::where('order_number', $orderNum)->exists()) {
            Log::info('OrderFulfillment: sale already recorded, skipping.', [
                'order_id'     => $order->id,
                'order_number' => $orderNum,
            ]);
            return;
        }

        // Load relationships needed for cost calculation
        $order->loadMissing(['items.product', 'branch']);

        // ── Calculate cost and profit ────────────────────────────────────
        $costTotal = 0;
        foreach ($order->items as $item) {
            $itemCost   = (float) ($item->product->computeProductCost($order->branch_id) ?? 0);
            $costTotal += $itemCost * $item->quantity;
        }

        $profit = (float) $order->total_amount - $costTotal;

        // ── Create Sale record ───────────────────────────────────────────
        $sale = Sale::create([
            'order_number'   => $orderNum,
            'user_id'        => $order->user_id ?? 1,
            'branch_id'      => $order->branch_id,
            'type'           => 'delivery',
            'total'          => $order->total_amount,
            'cost_total'     => $costTotal,
            'profit'         => $profit,
            'paid_amount'    => $order->total_amount,
            'change_amount'  => 0,
            'payment_method' => $order->payment_method ?? 'online',
            'status'         => 'completed',
            'created_at'     => $order->created_at, // preserve original order date
            'updated_at'     => now(),
        ]);

        // ── Create Sale Items ────────────────────────────────────────────
        foreach ($order->items as $item) {
            $itemCost = (float) ($item->product->computeProductCost($order->branch_id) ?? 0);

            SaleItem::create([
                'sale_id'    => $sale->id,
                'product_id' => $item->product_id,
                'quantity'   => $item->quantity,
                'unit_price' => $item->price,
                'cost_price' => $itemCost,
                'subtotal'   => $item->price * $item->quantity,
                'profit'     => ($item->price - $itemCost) * $item->quantity,
                'created_at' => $order->created_at,
            ]);
        }

        // ── Link Sale back to the Delivery record ────────────────────────
        if (!$delivery->sale_id) {
            $delivery->update(['sale_id' => $sale->id]);
        }

        Log::info('OrderFulfillment: sale recorded.', [
            'order_id'     => $order->id,
            'sale_id'      => $sale->id,
            'order_number' => $orderNum,
            'total'        => $order->total_amount,
            'profit'       => $profit,
        ]);
    }
}
