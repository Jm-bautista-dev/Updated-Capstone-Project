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
    public function __construct(protected \App\Http\Controllers\Api\RiderController $riderController)
    {
    }

    /**
     * GET /api/v1/rider/my-orders
     * Returns the rider's currently active orders with standardized canonical delivery schema.
     */
    public function myOrders(Request $request)
    {
        return $this->riderController->getMyOrders($request);
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
