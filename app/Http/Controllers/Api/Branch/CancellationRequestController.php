<?php

namespace App\Http\Controllers\Api\Branch;

use App\Http\Controllers\Controller;
use App\Models\CancellationRequest;
use App\Models\OrderCancellationRequest;
use App\Models\Order;
use App\Models\Delivery;
use App\Events\CancellationRejectedEvent;
use App\Events\CancellationApprovedEvent;
use App\Events\CancellationResolved;
use App\Events\OrderStatusUpdated;
use App\Services\InventoryService;
use App\Services\DeliveryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancellationRequestController extends Controller
{
    public function __construct(
        protected DeliveryService $deliveryService
    ) {
    }

    /**
     * POS / Branch Manager REJECTS rider cancellation request
     */
    public function reject(Request $request, $id)
    {
        return DB::transaction(function () use ($id, $request) {
            /** @var CancellationRequest|null $cancellation */
            $cancellation = CancellationRequest::lockForUpdate()->find($id);
            /** @var OrderCancellationRequest|null $orderCancellation */
            $orderCancellation = null;

            if (!$cancellation) {
                $orderCancellation = OrderCancellationRequest::lockForUpdate()->find($id);
            }

            if (!$cancellation && !$orderCancellation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cancellation request not found.',
                ], 404);
            }

            /** @var CancellationRequest|OrderCancellationRequest $activeReq */
            $activeReq = $cancellation ?: $orderCancellation;

            // Guard against duplicate resolution
            if ($activeReq->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This cancellation request has already been ' . $activeReq->status . '.',
                ], 409);
            }

            $user = Auth::user();
            $managerNotes = $request->input('notes', $request->input('rejection_reason', 'Please continue the delivery.'));
            $now = now();

            // 1. Update Cancellation Request to REJECTED
            if ($cancellation) {
                $cancellation->update([
                    'status'        => 'rejected',
                    'reviewed_by'   => $user?->id,
                    'reviewed_at'   => $now,
                    'manager_notes' => $managerNotes,
                ]);
            }

            if ($orderCancellation) {
                $orderCancellation->update([
                    'status'           => 'rejected',
                    'rejection_reason' => $managerNotes,
                    'reviewed_by'      => $user?->id,
                    'reviewed_at'      => $now,
                ]);
            }

            // 2. Update Order: CLEAR pending flag, keep order IN_TRANSIT / active state
            /** @var Order $order */
            $order = Order::findOrFail($activeReq->order_id);
            
            // Restore previous status if available, else keep current active status (do NOT set to rejected)
            $newStatus = ($orderCancellation && $orderCancellation->previous_order_status) 
                ? $orderCancellation->previous_order_status 
                : ($order->status === 'cancellation_requested' ? 'in_transit' : $order->status);

            $order->update([
                'status'                  => $newStatus,
                'is_cancellation_pending' => false,
                'cancellation_status'     => 'rejected',
            ]);

            // 3. Revert delivery if exists
            /** @var Delivery|null $delivery */
            $delivery = Delivery::where('order_id', $order->id)->first();
            if ($delivery) {
                $newDelivStatus = ($orderCancellation && $orderCancellation->previous_delivery_status)
                    ? $orderCancellation->previous_delivery_status
                    : ($delivery->status === 'cancellation_requested' ? 'in_transit' : $delivery->status);

                $delivery->update([
                    'status' => $newDelivStatus,
                ]);
            }

            // 4. Broadcast events to Rider & Branch
            try {
                broadcast(new CancellationRejectedEvent($activeReq, $order->fresh()));
                if ($orderCancellation) {
                    broadcast(new CancellationResolved($orderCancellation->fresh()));
                }
                if ($delivery) {
                    broadcast(new OrderStatusUpdated($delivery->fresh(), 'cashier'));
                }
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed during cancellation reject: ' . $e->getMessage());
            }

            return response()->json([
                'success'              => true,
                'message'              => 'Cancellation request rejected. Order remains active.',
                'cancellation_request' => $activeReq->fresh(),
                'order'                => $order->fresh(),
            ]);
        });
    }

    /**
     * POS / Branch Manager APPROVES rider cancellation request
     */
    public function approve(Request $request, $id)
    {
        return DB::transaction(function () use ($id, $request) {
            /** @var CancellationRequest|null $cancellation */
            $cancellation = CancellationRequest::lockForUpdate()->find($id);
            /** @var OrderCancellationRequest|null $orderCancellation */
            $orderCancellation = null;

            if (!$cancellation) {
                $orderCancellation = OrderCancellationRequest::lockForUpdate()->find($id);
            }

            if (!$cancellation && !$orderCancellation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cancellation request not found.',
                ], 404);
            }

            /** @var CancellationRequest|OrderCancellationRequest $activeReq */
            $activeReq = $cancellation ?: $orderCancellation;

            if ($activeReq->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This cancellation request has already been ' . $activeReq->status . '.',
                ], 409);
            }

            $user = Auth::user();
            $managerNotes = $request->input('notes', $request->input('reason'));
            $now = now();

            // 1. Update Cancellation Request to APPROVED
            if ($cancellation) {
                $cancellation->update([
                    'status'        => 'approved',
                    'reviewed_by'   => $user?->id,
                    'reviewed_at'   => $now,
                    'manager_notes' => $managerNotes,
                ]);
            }

            if ($orderCancellation) {
                $orderCancellation->update([
                    'status'      => 'approved',
                    'reviewed_by' => $user?->id,
                    'reviewed_at' => $now,
                ]);
            }

            // 2. Cancel the Order
            /** @var Order $order */
            $order = Order::findOrFail($activeReq->order_id);
            $order->update([
                'status'                  => 'cancelled',
                'is_cancellation_pending' => false,
                'cancellation_status'     => 'approved',
                'cancellation_reason'     => $activeReq->reason,
                'cancelled_at'            => $now,
            ]);

            // Restore Product Inventory if deducted
            if ($order->inventory_deducted) {
                try {
                    app(InventoryService::class)->restoreForOrder($order);
                } catch (\Throwable $e) {
                    Log::warning('Inventory restoration failed during cancellation approve: ' . $e->getMessage());
                }
            }

            // 3. Cancel delivery if exists
            /** @var Delivery|null $delivery */
            $delivery = Delivery::where('order_id', $order->id)->first();
            if ($delivery) {
                $delivery->update([
                    'status'              => 'cancelled',
                    'cancellation_reason' => $activeReq->reason,
                    'cancelled_by'        => $user?->id,
                    'cancelled_at'        => $now,
                ]);
            }

            // 4. Update Rider availability
            $riderId = $activeReq->rider_id ?? $activeReq->requested_by_rider_id ?? $order->rider_id;
            if ($riderId) {
                /** @var \App\Models\Rider|null $rider */
                $rider = \App\Models\Rider::find($riderId);
                if ($rider) {
                    $hasOtherActive = Delivery::where('rider_id', $rider->id)
                        ->where('order_id', '!=', $order->id)
                        ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                        ->exists();

                    if (!$hasOtherActive) {
                        $rider->update(['status' => 'available']);
                    }
                }
            }

            // 5. Broadcast approval events
            try {
                broadcast(new CancellationApprovedEvent($activeReq, $order->fresh()));
                if ($orderCancellation) {
                    broadcast(new CancellationResolved($orderCancellation->fresh()));
                }
                if ($delivery) {
                    broadcast(new OrderStatusUpdated($delivery->fresh(), 'cashier'));
                }
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed during cancellation approve: ' . $e->getMessage());
            }

            return response()->json([
                'success'              => true,
                'message'              => 'Cancellation request approved. Delivery cancelled.',
                'cancellation_request' => $activeReq->fresh(),
                'order'                => $order->fresh(),
            ]);
        });
    }

    /**
     * POS / Branch Manager confirms returned order items and chooses resolution (reassign or cancel)
     * POST /api/v1/branch/deliveries/{id}/confirm-return
     * POST /api/v1/branch/deliveries/{id}/verify-return
     */
    public function confirmReturn(Request $request, $id)
    {
        $request->validate([
            'decision' => 'nullable|in:reassign,cancel,reject',
            'action'   => 'nullable|in:reassign,cancel,reject,confirm_and_reassign,confirm_and_cancel',
            'notes'    => 'nullable|string|max:500',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $delivery = Delivery::with(['order.branch', 'sale.branch', 'rider'])->find($id);
        if (!$delivery) {
            return response()->json(['success' => false, 'message' => 'Delivery not found.'], 404);
        }

        // Branch authorization check
        if (!$user->isAdmin() && $user->branch_id) {
            $branchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
            if ($branchId && (int) $user->branch_id !== (int) $branchId) {
                return response()->json(['success' => false, 'message' => 'Unauthorized for this branch.'], 403);
            }
        }

        $decision = $request->input('decision') ?? ($request->input('action') === 'confirm_and_cancel' ? 'cancel' : 'reassign');
        $notes = $request->input('notes');

        try {
            if ($decision === 'reject') {
                $result = $this->deliveryService->rejectReturn($delivery, $user, $notes ?? 'Return rejected by cashier.');
                return response()->json([
                    'success'  => true,
                    'message'  => 'Return rejected. Order restored to active state.',
                    'delivery' => $result['delivery'],
                ]);
            }

            $result = $this->deliveryService->verifyReturn($delivery, $user, $decision, $notes);

            $msg = ($decision === 'cancel')
                ? 'Returned items verified. Order and delivery permanently cancelled.'
                : 'Returned items verified. Order returned to pool for rider reassignment.';

            return response()->json([
                'success'  => true,
                'message'  => $msg,
                'decision' => $decision,
                'delivery' => $result['delivery'],
            ]);
        } catch (\DomainException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Branch::confirmReturn failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to process return: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cashier directly reassigns delivery to available pool after physical return.
     * POST /api/v1/branch/deliveries/{id}/reassign
     */
    public function reassign(Request $request, $id)
    {
        $request->merge(['decision' => 'reassign']);
        return $this->confirmReturn($request, $id);
    }

    /**
     * Cashier permanently cancels order after physical return.
     * POST /api/v1/branch/deliveries/{id}/cancel-order
     */
    public function cancelOrderAfterReturn(Request $request, $id)
    {
        $request->merge(['decision' => 'cancel']);
        return $this->confirmReturn($request, $id);
    }

    /**
     * Cashier rejects return if food items were not physically returned.
     * POST /api/v1/branch/deliveries/{id}/reject-return
     */
    public function rejectReturn(Request $request, $id)
    {
        $request->merge(['decision' => 'reject']);
        return $this->confirmReturn($request, $id);
    }
}
