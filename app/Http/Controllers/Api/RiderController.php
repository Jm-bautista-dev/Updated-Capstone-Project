<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Delivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RiderController extends Controller
{
    /**
     * GET /api/v1/rider/orders
     * 
     * Returns ALL orders with status = "preparing" that are available for pickup.
     * This is the "Active Orders" tab in the Rider App.
     * Riders poll this endpoint every 5-10 seconds.
     */
    public function getOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Fetch all "preparing" orders available for any rider to pick up
            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->whereNull('rider_id')             // not yet assigned
                ->where('status', 'preparing')      // POS marked as preparing
                ->orderBy('created_at', 'asc')      // oldest first (FIFO)
                ->get()
                ->map(function (Delivery $d) { return $this->formatDelivery($d); });

            return response()->json([
                'success' => true,
                'data' => $deliveries
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider getOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/rider/my-orders
     * 
     * Returns orders assigned to THIS rider (assigned/delivering).
     * This is the "My Orders" tab in the Rider App.
     */
    public function getMyOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->where('rider_id', $rider->id)
                ->whereIn('status', ['assigned', 'delivering'])
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(function (Delivery $d) { return $this->formatDelivery($d); });

            return response()->json([
                'success' => true,
                'data' => $deliveries
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider getMyOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/v1/rider/completed-orders
     * 
     * Returns completed/delivered orders for THIS rider.
     * This is the "Completed Orders" tab in the Rider App.
     */
    public function getCompletedOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->where('rider_id', $rider->id)
                ->whereIn('status', ['delivered', 'completed'])
                ->orderBy('updated_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function (Delivery $d) { return $this->formatDelivery($d); });

            return response()->json([
                'success' => true,
                'data' => $deliveries
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider getCompletedOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/accept
     * 
     * Rider accepts an available order.
     * - Sets rider_id = authenticated rider
     * - Changes delivery status to "assigned"
     * - Changes order status to "assigned"
     */
    public function acceptOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $delivery = Delivery::with('order')
                ->whereNull('rider_id')
                ->where('status', 'preparing')
                ->findOrFail($id);

            // Assign rider to delivery
            $delivery->update([
                'rider_id' => $rider->id,
                'status'   => 'assigned',
            ]);

            // Sync order status
            if ($delivery->order) {
                $delivery->order->update(['status' => 'assigned', 'rider_id' => $rider->id]);
            }

            // Mark rider as busy
            $rider->update(['status' => 'busy']);

            return response()->json([
                'success' => true,
                'message' => 'Order accepted successfully',
                'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch']))
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider acceptOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Failed to accept order'
            ], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/update-status
     * 
     * Rider updates delivery progress:
     *   assigned → delivering
     *   delivering → delivered
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'status' => 'required|in:delivering,delivered'
            ]);

            $delivery = Delivery::with('order')
                ->where('rider_id', $rider->id)
                ->findOrFail($id);

            // Validate flow
            $allowedTransitions = [
                'assigned'   => 'delivering',
                'delivering' => 'delivered',
            ];

            $newStatus = $request->status;
            $currentStatus = $delivery->status;

            if (!isset($allowedTransitions[$currentStatus]) || $allowedTransitions[$currentStatus] !== $newStatus) {
                return response()->json([
                    'success' => false,
                    'message' => "Cannot transition from '{$currentStatus}' to '{$newStatus}'"
                ], 422);
            }

            $delivery->update(['status' => $newStatus]);

            // Sync order status
            if ($delivery->order) {
                $orderStatus = $newStatus === 'delivered' ? 'completed' : $newStatus;
                $delivery->order->update(['status' => $orderStatus]);
            }

            // Mark rider available again when delivery is complete
            if ($newStatus === 'delivered') {
                $rider->update(['status' => 'available']);
            }

            return response()->json([
                'success' => true,
                'message' => "Status updated to {$newStatus}",
                'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch']))
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider updateOrderStatus failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Failed to update status'
            ], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/reject
     * Unassign rider from order.
     */
    public function rejectOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $delivery = Delivery::where('rider_id', $rider->id)
                ->where('status', 'assigned')
                ->findOrFail($id);

            $delivery->update(['rider_id' => null, 'status' => 'preparing']);

            if ($delivery->order) {
                $delivery->order->update(['status' => 'preparing', 'rider_id' => null]);
            }

            $rider->update(['status' => 'available']);

            return response()->json(['success' => true, 'message' => 'Order returned to available pool']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to reject order'], 500);
        }
    }

    /**
     * PATCH /api/v1/rider/status
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            $request->validate(['status' => 'required|in:available,busy,offline']);
            $rider = $request->user();

            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $rider->update([
                'status'         => $request->status,
                'last_active_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'status'  => $rider->status,
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Update failed'], 500);
        }
    }

    /**
     * GET /api/v1/rider/stats
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total_orders'     => Delivery::where('rider_id', $rider->id)->count(),
                    'completed_orders' => Delivery::where('rider_id', $rider->id)->whereIn('status', ['delivered', 'completed'])->count(),
                    'active_orders'    => Delivery::where('rider_id', $rider->id)->whereIn('status', ['assigned', 'delivering'])->count(),
                    'earnings'         => (float) Delivery::where('rider_id', $rider->id)->whereIn('status', ['delivered', 'completed'])->sum('delivery_fee'),
                    'rating'           => 5.0,
                ]
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch stats'], 500);
        }
    }

    /**
     * POST /api/v1/rider/ping
     */
    public function ping(Request $request): JsonResponse
    {
        $rider = $request->user();
        if (!$rider instanceof Rider) {
            return response()->json(['success' => false], 403);
        }

        $rider->update(['last_active_at' => now()]);

        return response()->json([
            'success'        => true,
            'status'         => $rider->status,
            'last_active_at' => $rider->last_active_at,
        ]);
    }

    /**
     * Standardized delivery response formatter.
     */
    private function formatDelivery(Delivery $delivery): array
    {
        $order = $delivery->order;
        return [
            'delivery_id'      => $delivery->id,
            'order_id'         => $delivery->order_id,
            'status'           => $delivery->status,
            'status_label'     => $delivery->getStatusLabel(),

            // Customer Info
            'customer_name'    => $delivery->customer_name,
            'customer_phone'   => $delivery->customer_phone,
            'customer_address' => $delivery->customer_address,

            // Location for maps
            'latitude'         => $order?->latitude,
            'longitude'        => $order?->longitude,
            'maps_url'         => $order?->latitude && $order?->longitude
                ? "https://www.google.com/maps/dir/?api=1&destination={$order->latitude},{$order->longitude}"
                : null,

            // Financial
            'delivery_fee'     => (float) $delivery->delivery_fee,
            'total_amount'     => (float) ($order?->total_amount ?? 0),

            // Branch
            'branch_name'      => $order?->branch?->name ?? 'N/A',
            'branch_address'   => $order?->branch?->address ?? null,

            // Order Items
            'items'            => $order?->items?->map(fn($item) => [
                'product_name' => $item->product?->name ?? $item->product_name ?? 'Item',
                'quantity'     => $item->quantity,
                'price'        => (float) $item->price,
                'subtotal'     => (float) ($item->quantity * $item->price),
            ]) ?? [],
            'items_count'      => $order?->items?->count() ?? 0,

            'created_at'       => $delivery->created_at?->toIso8601String(),
            'updated_at'       => $delivery->updated_at?->toIso8601String(),
        ];
    }
}
