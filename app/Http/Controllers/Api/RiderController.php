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
        $request->validate([
            'status' => 'required|in:available,busy,offline',
        ]);

        $user = $request->user();

        // Ensure the authenticated user is actually a Rider instance
        if (!$user instanceof Rider) {
            return response()->json([
                'success' => false,
                'message' => 'Only riders can update operational status.'
            ], 403);
        }

        $user->update([
            'status' => $request->status,
            'last_active_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated to ' . $request->status,
            'status' => $user->status,
        ]);
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
