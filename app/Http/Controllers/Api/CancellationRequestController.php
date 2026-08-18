<?php

namespace App\Http\Controllers\Api;

use App\Events\CancellationResolved;
use App\Events\OrderStatusUpdated;
use App\Http\Controllers\Controller;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderCancellationRequest;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancellationRequestController extends Controller
{
    /**
     * GET /api/v1/cancellation-requests/pending
     * Get active pending cancellation requests for the user's branch.
     */
    public function pending(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $query = OrderCancellationRequest::with([
            'order.branch',
            'order.items.product',
            'delivery',
            'requestedByRider',
            'branch',
        ])->where('status', 'pending');

        if (!$user->isAdmin()) {
            $query->where('branch_id', $user->branch_id);
        }

        $requests = $query->latest('requested_at')->get()->map(function ($req) {
            $orderNum = $req->order?->order_number ?? ("ORD-" . $req->order_id);
            return [
                'id'                      => $req->id,
                'order_id'                => $req->order_id,
                'order_number'            => $orderNum,
                'delivery_id'             => $req->delivery_id,
                'rider_id'                => $req->requested_by_rider_id,
                'rider_name'              => $req->requestedByRider?->name ?? 'Rider',
                'customer_name'           => $req->order?->customer_name ?? 'Customer',
                'total_amount'            => $req->order ? (float)$req->order->total_amount : 0,
                'branch_id'               => $req->branch_id,
                'branch_name'             => $req->branch?->name ?? $req->order?->branch?->name ?? 'N/A',
                'reason'                  => $req->reason,
                'notes'                   => $req->notes,
                'previous_order_status'   => $req->previous_order_status,
                'previous_delivery_status'=> $req->previous_delivery_status,
                'status'                  => $req->status,
                'requested_at'            => $req->requested_at ? $req->requested_at->toDateTimeString() : null,
            ];
        });

        return response()->json([
            'success'  => true,
            'count'    => $requests->count(),
            'requests' => $requests,
        ]);
    }

    /**
     * POST /api/v1/cancellation-requests/{id}/accept
     * Authorized Cashier/Admin accepts order cancellation request.
     */
    public function accept(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        try {
            return DB::transaction(function () use ($user, $id) {
                /** @var OrderCancellationRequest|null $req */
                $req = OrderCancellationRequest::with(['order', 'delivery', 'requestedByRider', 'branch'])
                    ->lockForUpdate()
                    ->find($id);

                if (!$req) {
                    return response()->json(['success' => false, 'message' => 'Cancellation request not found.'], 404);
                }

                // Branch authorization check: Cashiers can only review requests for their branch
                if (!$user->isAdmin() && (int)$user->branch_id !== (int)$req->branch_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized: You can only review cancellation requests for your own branch.'
                    ], 403);
                }

                // Concurrent Decision Safeguard
                if ($req->status !== 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This cancellation request has already been resolved.'
                    ], 409);
                }

                $order = $req->order;
                $delivery = $req->delivery;

                if ($order && $order->status === 'cancelled') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This order has already been cancelled.'
                    ], 409);
                }

                $now = now();

                // 1. Update Request
                $req->update([
                    'status'      => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => $now,
                ]);

                // 2. Update Order
                if ($order) {
                    $order->update([
                        'status'                  => 'cancelled',
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => 'approved',
                        'cancellation_reason'     => $req->reason,
                        'cancelled_at'            => $now,
                    ]);

                    // Restore Product Inventory (guarded to prevent double-restoration)
                    if (!$order->inventory_deducted === false) {
                        try {
                            app(InventoryService::class)->restoreForOrder($order);
                        } catch (\Throwable $e) {
                            Log::warning('Inventory restoration failed during cancellation accept: ' . $e->getMessage());
                        }
                    }
                }

                // 3. Update Delivery
                if ($delivery) {
                    $delivery->update([
                        'status'              => 'cancelled',
                        'cancellation_reason' => $req->reason,
                        'cancelled_by'        => $user->id,
                        'cancelled_at'        => $now,
                    ]);
                }

                // 4. Update Rider Status according to multi-delivery rules
                $rider = $req->requestedByRider;
                if ($rider) {
                    $hasOtherActive = Delivery::where('rider_id', $rider->id)
                        ->where('id', '!=', $req->delivery_id)
                        ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                        ->exists();

                    if (!$hasOtherActive) {
                        $rider->update(['status' => 'available']);
                    }
                }

                // 5. Post-Commit Real-Time Broadcasts
                try {
                    broadcast(new CancellationResolved($req->fresh()));
                    if ($delivery) {
                        broadcast(new OrderStatusUpdated($delivery->fresh(), 'cashier'));
                    }
                } catch (\Throwable $e) {
                    Log::warning('Broadcast failed during cancellation accept: ' . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Cancellation request ACCEPTED. Order cancelled and inventory processed.',
                    'request' => $req->fresh(),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CancellationRequestController::accept failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to accept cancellation request'], 500);
        }
    }

    /**
     * POST /api/v1/cancellation-requests/{id}/reject
     * Authorized Cashier/Admin rejects order cancellation request.
     */
    public function reject(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        try {
            $rejectionReason = $request->input('rejection_reason', 'Cancellation request rejected by cashier');

            return DB::transaction(function () use ($user, $id, $rejectionReason) {
                /** @var OrderCancellationRequest|null $req */
                $req = OrderCancellationRequest::with(['order', 'delivery', 'requestedByRider', 'branch'])
                    ->lockForUpdate()
                    ->find($id);

                if (!$req) {
                    return response()->json(['success' => false, 'message' => 'Cancellation request not found.'], 404);
                }

                // Branch authorization check
                if (!$user->isAdmin() && (int)$user->branch_id !== (int)$req->branch_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Unauthorized: You can only review cancellation requests for your own branch.'
                    ], 403);
                }

                // Concurrent Decision Safeguard
                if ($req->status !== 'pending') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This cancellation request has already been resolved.'
                    ], 409);
                }

                $now = now();

                // 1. Update Request
                $req->update([
                    'status'           => 'rejected',
                    'rejection_reason' => $rejectionReason,
                    'reviewed_by'      => $user->id,
                    'reviewed_at'      => $now,
                ]);

                // 2. Revert Order to previous active state
                $order = $req->order;
                if ($order && $req->previous_order_status) {
                    $order->update([
                        'status'                  => $req->previous_order_status,
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => 'rejected',
                    ]);
                } elseif ($order) {
                    $order->update([
                        'is_cancellation_pending' => false,
                        'cancellation_status'     => 'rejected',
                    ]);
                }

                // 3. Revert Delivery to previous active state
                $delivery = $req->delivery;
                if ($delivery && $req->previous_delivery_status) {
                    $delivery->update([
                        'status' => $req->previous_delivery_status,
                    ]);
                }

                // 4. Post-Commit Real-Time Broadcasts
                try {
                    broadcast(new CancellationResolved($req->fresh()));
                    if ($order) {
                        broadcast(new \App\Events\CancellationRejectedEvent($req, $order->fresh()));
                    }
                    if ($delivery) {
                        broadcast(new OrderStatusUpdated($delivery->fresh(), 'cashier'));
                    }
                } catch (\Throwable $e) {
                    Log::warning('Broadcast failed during cancellation reject: ' . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Cancellation request REJECTED. Order restored to previous active state.',
                    'request' => $req->fresh(),
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('CancellationRequestController::reject failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to reject cancellation request'], 500);
        }
    }
}
