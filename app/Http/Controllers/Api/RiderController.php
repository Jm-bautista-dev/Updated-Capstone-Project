<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    /**
     * Update the rider's operational status.
     * PATCH /api/v1/rider/status
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'status' => 'required|in:available,busy,offline',
            ]);

            $user = $request->user();

            /** @var Rider $user */
            if (!$user instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Super simple update
            $user->status = $request->status;
            $user->last_active_at = \Illuminate\Support\Carbon::now();
            $user->save();

            return response()->json([
                'success' => true,
                'status' => $user->status,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Status update failed'
            ], 500);
        }
    }

    /**
     * Get orders assigned to the rider.
     * GET /api/v1/rider/orders
     */
    public function orders(Request $request): JsonResponse
    {
        $rider = $request->user();

        if (!$rider instanceof Rider) {
            return response()->json([
                'success' => false,
                'message' => 'Only riders can access this resource.'
            ], 403);
        }

        // Get deliveries assigned to this rider
        $deliveries = \App\Models\Delivery::with(['order.items', 'order.branch'])
            ->where('rider_id', $rider->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($delivery) {
                return [
                    'id' => $delivery->id,
                    'order_id' => $delivery->order_id,
                    'customer_name' => $delivery->customer_name,
                    'customer_phone' => $delivery->customer_phone,
                    'customer_address' => $delivery->customer_address,
                    'status' => $delivery->status,
                    'delivery_fee' => $delivery->delivery_fee,
                    'total_amount' => $delivery->order->total_amount ?? 0,
                    'items_count' => $delivery->order->items->count() ?? 0,
                    'branch_name' => $delivery->order->branch->name ?? 'N/A',
                    'created_at' => $delivery->created_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $deliveries
        ]);
    }

    /**
     * Get rider performance statistics.
     * GET /api/v1/rider/stats
     */
    public function stats(Request $request): JsonResponse
    {
        $rider = $request->user();

        if (!$rider instanceof Rider) {
            return response()->json(['success' => false], 403);
        }

        $totalOrders = \App\Models\Delivery::where('rider_id', $rider->id)->count();
        $completedOrders = \App\Models\Delivery::where('rider_id', $rider->id)->where('status', 'delivered')->count();
        $pendingOrders = \App\Models\Delivery::where('rider_id', $rider->id)->whereIn('status', ['pending', 'preparing', 'out_for_delivery'])->count();

        // Placeholder logic for earnings and rating
        $earnings = \App\Models\Delivery::where('rider_id', $rider->id)
            ->where('status', 'delivered')
            ->sum('delivery_fee');

        return response()->json([
            'success' => true,
            'data' => [
                'total_orders' => $totalOrders,
                'completed_orders' => $completedOrders,
                'pending_orders' => $pendingOrders,
                'rating' => 5.0,
                'earnings' => (float)$earnings,
            ]
        ]);
    }

    /**
     * Get orders assigned to the rider (Alias for mobile app).
     */
    public function getOrders(Request $request): JsonResponse
    {
        return $this->orders($request);
    }

    /**
     * Get rider performance statistics (Alias for mobile app).
     */
    public function getStats(Request $request): JsonResponse
    {
        return $this->stats($request);
    }

    /**
     * Accept an assigned order.
     * POST /api/v1/rider/orders/{id}/accept
     */
    public function acceptOrder(Request $request, $id): JsonResponse
    {
        $rider = $request->user();
        if (!$rider instanceof Rider) return response()->json(['success' => false], 403);

        /** @var \App\Models\Delivery $delivery */
        $delivery = \App\Models\Delivery::where('id', $id)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        // Update status to preparing or out_for_delivery depending on flow
        // For now, move to 'preparing' or keep as is if already preparing
        $delivery->update(['status' => 'preparing']);

        return response()->json([
            'success' => true,
            'message' => 'Order accepted',
            'data' => $delivery
        ]);
    }

    /**
     * Reject an assigned order.
     * POST /api/v1/rider/orders/{id}/reject
     */
    public function rejectOrder(Request $request, $id): JsonResponse
    {
        $rider = $request->user();
        if (!$rider instanceof Rider) return response()->json(['success' => false], 403);

        /** @var \App\Models\Delivery $delivery */
        $delivery = \App\Models\Delivery::where('id', $id)
            ->where('rider_id', $rider->id)
            ->firstOrFail();

        // Unassign rider
        $delivery->update(['rider_id' => null]);
        
        // Mark rider as available
        $rider->markAvailable();

        return response()->json([
            'success' => true,
            'message' => 'Order rejected and unassigned'
        ]);
    }

    /**
     * Heartbeat/Ping to update last_active_at.
     * POST /api/v1/rider/ping
     */
    public function ping(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user instanceof Rider) {
            return response()->json(['success' => false], 403);
        }

        $user->update(['last_active_at' => now()]);

        return response()->json([
            'success' => true,
            'status' => $user->status,
            'last_active_at' => $user->last_active_at,
        ]);
    }
}
