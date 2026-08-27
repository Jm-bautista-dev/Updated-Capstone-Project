<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Delivery;
use App\Events\OrderStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CustomerOrderController extends Controller
{
    /**
     * GET /api/v1/customer/orders/{id}
     * Full order detail with Buy Again item snapshots + live product status.
     * Scoped strictly to the authenticated customer.
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $order = Order::with(['items.product', 'branch', 'delivery.rider'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found or unauthorized.'], 404);
        }

        $statusLabel = match ($order->status) {
            'pending'                => 'Order Received',
            'confirmed'              => 'Confirmed',
            'preparing'              => 'Preparing',
            'ready_for_pickup'       => 'Ready for Pickup',
            'assigned_to_rider'      => 'Rider Assigned',
            'picked_up'              => 'Picked Up',
            'in_transit'             => 'Out for Delivery',
            'delivered'              => 'Delivered',
            'cancelled'              => 'Cancelled',
            'cancellation_requested' => 'Cancellation Requested',
            default                  => ucfirst(str_replace('_', ' ', $order->status)),
        };

        return response()->json([
            'success' => true,
            'data' => [
                'id'             => $order->id,
                'order_number'   => $order->order_number ?? "ORD-{$order->id}",
                'status'         => $order->status,
                'status_label'   => $statusLabel,
                'branch_id'      => $order->branch_id,
                'branch_name'    => $order->branch?->name ?? 'Maki Store',
                'subtotal'       => (float) $order->items->sum(fn($i) => $i->line_total),
                'delivery_fee'   => (float) ($order->delivery?->delivery_fee ?? 0),
                'total_amount'   => (float) $order->total_amount,
                'payment_method' => $order->payment_method ?? 'cash',
                'customer_name'  => $order->customer_name,
                'address'        => $order->address,
                'created_at'     => $order->created_at->toIso8601String(),
                'delivery'       => $order->delivery ? [
                    'status'       => $order->delivery->status,
                    'status_label' => $order->delivery->getStatusLabel(),
                    'status_color' => $order->delivery->getStatusColor(),
                    'rider_name'   => $order->delivery->rider?->name,
                    'updated_at'   => $order->delivery->updated_at,
                ] : null,
                'items' => $order->items->map(function ($item) {
                    $product   = $item->product;
                    $unitPrice = $item->unit_price;
                    $lineTotal = $item->line_total;
                    $inStock   = $product && $product->is_available && $product->stock > 0;

                    return [
                        'order_item_id' => $item->id,
                        'product_id'    => (int) ($item->product_id ?? 0),
                        'product_name'  => $item->product_name ?? $product?->name ?? 'Item',
                        'title'         => $item->product_name ?? $product?->name ?? 'Item',
                        'quantity'      => (int) $item->quantity,
                        'unit_price'    => $unitPrice,
                        'line_total'    => $lineTotal,
                        'image_path'    => $item->image_path ?? $product?->image_path ?? null,
                        'notes'         => $item->notes,
                        // Live product availability — used by the "Buy Again" button
                        'is_available'  => $inStock,
                        'current_price' => $product ? (float) $product->selling_price : $unitPrice,
                        'current_stock' => $product ? (int) $product->stock : 0,
                    ];
                }),
            ],
        ]);
    }

    /**
     * POST /api/v1/customer/orders/{id}/reorder-check
     * Server-side validation of a reorder: checks each item for availability
     * and returns valid + unavailable item lists.
     */
    public function checkReorder(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $order = Order::with(['items.product', 'branch'])
            ->where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order not found or unauthorized.'], 404);
        }

        $validItems       = [];
        $unavailableItems = [];

        foreach ($order->items as $item) {
            $product = $item->product;

            if (!$product || !$product->is_available || $product->stock <= 0) {
                $unavailableItems[] = [
                    'product_id'   => $item->product_id,
                    'product_name' => $item->product_name ?? $product?->name ?? 'Item',
                    'image_path'   => $item->image_path ?? $product?->image_path ?? null,
                    'reason'       => !$product ? 'Discontinued' : 'Out of stock',
                ];
                continue;
            }

            // Clamp requested quantity to available stock
            $availableQty = min((int) $item->quantity, (int) $product->stock);

            $validItems[] = [
                'product_id'          => $product->id,
                'title'               => $product->name,
                'product_name'        => $product->name,
                'image_path'          => $product->image_path,
                'historical_quantity' => (int) $item->quantity,
                'available_quantity'  => $availableQty,
                'current_price'       => (float) $product->selling_price,
                'historical_price'    => $item->unit_price,
                'price_changed'       => abs($item->unit_price - (float) $product->selling_price) > 0.01,
            ];
        }

        return response()->json([
            'success'           => count($validItems) > 0,
            'branch_id'         => $order->branch_id,
            'branch_name'       => $order->branch?->name ?? 'Maki Store',
            'all_available'     => count($unavailableItems) === 0,
            'valid_items'       => $validItems,
            'unavailable_items' => $unavailableItems,
        ]);
    }

    /**
     * POST /api/v1/customer/orders/{orderId}/cancel
     * Cancel an active customer order before kitchen preparation begins.
     */
    public function cancel(Request $request, $orderId): JsonResponse
    {
        $userId = Auth::id() ?? $request->user()?->id;

        $order = Order::with(['items', 'delivery'])
            ->where('id', $orderId)
            ->where('user_id', $userId)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or unauthorized.'
            ], 404);
        }

        $cancellableStatuses = ['pending', 'order_received', 'received', 'unpaid', 'placed', 'waiting_for_kitchen'];
        $currentOrderStatus    = strtolower((string) $order->status);
        $currentDeliveryStatus = $order->delivery ? strtolower((string) $order->delivery->status) : null;

        $isOrderCancellable    = in_array($currentOrderStatus, $cancellableStatuses, true);
        $isDeliveryCancellable = $currentDeliveryStatus === null || in_array($currentDeliveryStatus, $cancellableStatuses, true);

        if (!$isOrderCancellable || !$isDeliveryCancellable) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled because the kitchen has already started preparing it.'
            ], 422);
        }

        $previousStatus = $order->status;
        $reason         = $request->input('reason', 'Cancelled by customer');
        $now            = now();

        DB::beginTransaction();
        try {
            $order->status             = 'cancelled';
            $order->cancellation_reason = $reason;
            $order->cancelled_at       = $now;
            $order->save();

            $delivery = $order->delivery;
            if (!$delivery) {
                $delivery = Delivery::firstOrCreate(
                    ['order_id' => $order->id],
                    [
                        'customer_name'       => $order->customer_name,
                        'customer_phone'      => $order->contact_number,
                        'customer_address'    => $order->address,
                        'latitude'            => $order->latitude,
                        'longitude'           => $order->longitude,
                        'delivery_type'       => 'internal',
                        'status'              => 'cancelled',
                        'cancellation_reason' => $reason,
                        'cancelled_at'        => $now,
                    ]
                );
            } else {
                $delivery->update([
                    'status'              => 'cancelled',
                    'cancellation_reason' => $reason,
                    'cancelled_at'        => $now,
                    'rider_id'            => null,
                ]);
            }

            // Restore product stock
            foreach ($order->items as $item) {
                if (!empty($item->product_id)) {
                    DB::table('products')
                        ->where('id', $item->product_id)
                        ->increment('stock', $item->quantity ?? 1);
                }
            }

            DB::commit();

            try {
                broadcast(new OrderStatusUpdated($delivery->fresh(['order', 'sale', 'rider']), 'customer', $previousStatus));
            } catch (\Throwable $e) {
                Log::warning('OrderStatusUpdated broadcast warning: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully.',
                'order'   => [
                    'id'           => $order->id,
                    'order_number' => $order->order_number ?? ('ORD-' . $order->id),
                    'status'       => 'cancelled',
                    'status_label' => 'Cancelled',
                ],
            ]);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Failed to cancel customer order', [
                'order_id' => $orderId,
                'user_id'  => $userId,
                'error'    => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage(),
            ], 500);
        }
    }
}
