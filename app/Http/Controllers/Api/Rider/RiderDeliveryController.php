<?php

namespace App\Http\Controllers\Api\Rider;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\CancellationRequest;
use App\Models\OrderCancellationRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RiderDeliveryController extends Controller
{
    /**
     * GET /api/v1/rider/my-orders
     * Returns the rider's currently active orders.
     */
    public function myOrders(Request $request)
    {
        $riderId = Auth::id();

        // Must include in_transit orders even if cancellation_status is 'rejected'
        $orders = Order::with(['branch', 'items.product', 'user', 'delivery'])
            ->where(function ($q) use ($riderId) {
                $q->where('rider_id', $riderId)
                  ->orWhereHas('delivery', fn($dq) => $dq->where('rider_id', $riderId));
            })
            ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit', 'cancellation_requested'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ]);
    }

    /**
     * GET /api/v1/rider/cancellation-requests
     * Returns the rider's cancellation requests ledger (Pending, Approved, Rejected).
     */
    public function cancellationRequests(Request $request)
    {
        $riderId = Auth::id();

        $cancellations = CancellationRequest::with('order.branch')
            ->where('rider_id', $riderId)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($cancellations->isEmpty()) {
            $cancellations = OrderCancellationRequest::with('order.branch')
                ->where('requested_by_rider_id', $riderId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data'    => $cancellations,
        ]);
    }
}
