<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Delivery;
use App\Events\OrderStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class CustomerOrderController extends Controller
{
    /**
     * Cancel an active customer order before kitchen preparation begins.
     *
     * Endpoint: POST /api/v1/customer/orders/{orderId}/cancel
     */
    public function cancel(Request $request, $orderId)
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
        $currentOrderStatus = strtolower((string) $order->status);
        $currentDeliveryStatus = $order->delivery ? strtolower((string) $order->delivery->status) : null;

        $isOrderCancellable = in_array($currentOrderStatus, $cancellableStatuses, true);
        $isDeliveryCancellable = $currentDeliveryStatus === null || in_array($currentDeliveryStatus, $cancellableStatuses, true);

        if (!$isOrderCancellable || !$isDeliveryCancellable) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled because the kitchen has already started preparing it.'
            ], 422);
        }

        $previousStatus = $order->status;
        $reason = $request->input('reason', 'Cancelled by customer');
        $now = now();

        DB::beginTransaction();
        try {
            // 1. Update Order record
            $order->status = 'cancelled';
            $order->cancellation_reason = $reason;
            $order->cancelled_at = $now;
            $order->save();

            // 2. Update Delivery record & release rider if pre-assigned
            $delivery = $order->delivery;
            if (!$delivery) {
                $delivery = Delivery::firstOrCreate(
                    ['order_id' => $order->id],
                    [
                        'customer_name'    => $order->customer_name,
                        'customer_phone'   => $order->contact_number,
                        'customer_address' => $order->address,
                        'latitude'         => $order->latitude,
                        'longitude'        => $order->longitude,
                        'delivery_type'    => 'internal',
                        'status'           => 'cancelled',
                        'cancellation_reason' => $reason,
                        'cancelled_at'     => $now,
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

            // 3. Restore Product Stock
            foreach ($order->items as $item) {
                if (!empty($item->product_id)) {
                    DB::table('products')
                        ->where('id', $item->product_id)
                        ->increment('stock', $item->quantity ?? 1);
                }
            }

            DB::commit();

            // 4. Real-Time WebSocket Broadcast
            try {
                broadcast(new OrderStatusUpdated($delivery->fresh(['order', 'sale', 'rider']), 'customer', $previousStatus));
            } catch (\Throwable $e) {
                Log::warning('OrderStatusUpdated broadcast warning: ' . $e->getMessage());
            }

            $orderNumber = $order->order_number ?? ('ORD-' . $order->id);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully.',
                'order' => [
                    'id'           => $order->id,
                    'order_number' => $orderNumber,
                    'status'       => 'cancelled',
                    'status_label' => 'Cancelled',
                ]
            ], 200);

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Failed to cancel customer order', [
                'order_id' => $orderId,
                'user_id'  => $userId,
                'error'    => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order: ' . $e->getMessage()
            ], 500);
        }
    }
}
