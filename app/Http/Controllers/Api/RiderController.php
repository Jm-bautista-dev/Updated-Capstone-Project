<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\RiderLocationLog;
use App\Services\OrderFulfillmentService;
use App\Services\InventoryService;
use App\Models\OrderCancellationRequest;
use App\Events\OrderStatusUpdated;
use App\Events\CancellationRequested;
use App\Events\RiderStatusUpdated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RiderController extends Controller
{
    public function __construct(
        protected OrderFulfillmentService $fulfillmentService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION / FIRST LOGIN
    |--------------------------------------------------------------------------
    */

    /**
     * Change password (mandatory first-login requirement).
     * POST /api/v1/rider/change-password
     *
     * Request body:
     *   password         : string, min 8
     *   password_confirmation : string, must match password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $rider = $this->resolveRider($request);

        if (!$rider) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $rider->password = \Illuminate\Support\Facades\Hash::make($request->password);
        $rider->must_change_password = false;
        $rider->save();

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully. Welcome aboard!',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RIDER FEED
    |--------------------------------------------------------------------------
    */

    /**
     * GET /api/v1/rider/available-deliveries
     * GET /api/v1/rider/orders
     * Returns all orders in 'ready_for_pickup' state with rider_id = null — available for eligible riders to accept.
     */
    public function availableDeliveries(Request $request): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            if (!$rider->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your rider account is inactive. Please contact your branch administrator.',
                    'data'    => [],
                ], 403);
            }

            if ($rider->status === 'offline') {
                return response()->json([
                    'success' => false,
                    'message' => 'You are currently offline. Change your status to available to view and accept delivery jobs.',
                    'data'    => [],
                ], 422);
            }

            if ($rider->hasInTransitDelivery()) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are currently on an active delivery route. Complete your route before viewing new jobs.',
                    'data'    => [],
                ], 422);
            }

            $riderBranchId = $rider->branch_id;

            $deliveries = Delivery::with([
                'order.items.product',
                'order.branch',
                'sale.items.product',
                'sale.branch'
            ])
                ->where('delivery_type', 'internal')
                ->where('status', Delivery::STATUS_READY)
                ->whereNull('rider_id')
                ->where(function ($query) use ($riderBranchId) {
                    if ($riderBranchId) {
                        $query->where(function ($q) use ($riderBranchId) {
                            $q->whereHas('order', fn($oq) => $oq->where('branch_id', $riderBranchId))
                              ->orWhereHas('sale', fn($sq) => $sq->where('branch_id', $riderBranchId));
                        });
                    }
                })
                ->orderBy('created_at', 'asc')
                ->get();

            // Check unlinked ready_for_pickup orders
            $unlinkedOrders = Order::with(['items.product', 'branch'])
                ->where('status', 'ready_for_pickup')
                ->whereNull('rider_id')
                ->when($riderBranchId, fn($bq) => $bq->where('branch_id', $riderBranchId))
                ->whereDoesntHave('delivery')
                ->get();

            foreach ($unlinkedOrders as $uo) {
                $d = Delivery::firstOrCreate(
                    ['order_id' => $uo->id],
                    [
                        'rider_id'         => null,
                        'status'           => 'ready_for_pickup',
                        'customer_name'    => $uo->customer_name,
                        'customer_phone'   => $uo->contact_number,
                        'customer_address' => $uo->address,
                        'latitude'         => $uo->latitude,
                        'longitude'        => $uo->longitude,
                        'landmark'         => $uo->landmark,
                        'notes'            => $uo->notes,
                    ]
                );
                $deliveries->push($d->load(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch']));
            }

            $formatted = $deliveries->map(fn(Delivery $d) => $this->formatDelivery($d));

            return response()->json([
                'success'              => true,
                'data'                 => $formatted,
                'deliveries'           => $formatted,
                'orders'               => $formatted,
                'available_deliveries' => $formatted,
                'count'                => $formatted->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider::availableDeliveries failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch available deliveries'], 500);
        }
    }

    /**
     * Aliases for external and mobile app conventions
     */
    public function getOrders(Request $request): JsonResponse
    {
        return $this->availableDeliveries($request);
    }

    public function availableOrders(Request $request): JsonResponse
    {
        return $this->availableDeliveries($request);
    }

    public function myOrders(Request $request): JsonResponse
    {
        return $this->getMyOrders($request);
    }

    public function completedOrders(Request $request): JsonResponse
    {
        return $this->getCompletedOrders($request);
    }

    /**
     * GET /api/v1/rider/my-orders
     * Returns orders assigned to THIS rider that are active (assigned_to_rider, picked_up, in_transit).
     */
    public function getMyOrders(Request $request): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider'])
                ->where('rider_id', $rider->id)
                ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit', 'cancellation_requested'])
                ->orderByRaw("CASE WHEN status = 'in_transit' THEN 1 WHEN status = 'picked_up' THEN 2 WHEN status = 'assigned_to_rider' THEN 3 ELSE 4 END")
                ->orderBy('updated_at', 'desc')
                ->get();

            $assignedOrders = Order::with(['items.product', 'branch', 'delivery'])
                ->where('rider_id', $rider->id)
                ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit', 'cancellation_requested'])
                ->orderBy('updated_at', 'desc')
                ->get();

            foreach ($assignedOrders as $ao) {
                if (!$deliveries->contains('order_id', $ao->id)) {
                    $d = Delivery::firstOrCreate(
                        ['order_id' => $ao->id],
                        [
                            'rider_id'         => $rider->id,
                            'status'           => $ao->status,
                            'customer_name'    => $ao->customer_name,
                            'customer_phone'   => $ao->contact_number,
                            'customer_address' => $ao->address,
                            'latitude'         => $ao->latitude,
                            'longitude'        => $ao->longitude,
                            'landmark'         => $ao->landmark,
                            'notes'            => $ao->notes,
                        ]
                    );
                    $deliveries->push($d->load(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider']));
                }
            }

            $formatted = $deliveries->map(fn(Delivery $d) => $this->formatDelivery($d));

            return response()->json([
                'success'    => true,
                'data'       => $formatted,
                'deliveries' => $formatted,
                'orders'     => $formatted,
                'my_orders'  => $formatted,
                'count'      => $formatted->count(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider::getMyOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch orders'], 500);
        }
    }

    /**
     * GET /api/v1/rider/completed-orders
     * Returns completed delivery history for this rider (both paginated & flat).
     */
    public function getCompletedOrders(Request $request): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Look up all delivered and cancelled deliveries for this rider
            $deliveries = Delivery::with(['order.items.product', 'order.branch', 'cancellationRequest'])
                ->where(function ($query) use ($rider) {
                    $query->where('rider_id', $rider->id)
                          ->orWhereHas('cancellationRequest', function ($q) use ($rider) {
                              $q->where('rider_id', $rider->id)
                                ->orWhere('requested_by_rider_id', $rider->id);
                          });
                })
                ->whereIn('status', ['delivered', 'completed', 'cancelled', 'failed_delivery'])
                ->orderBy('updated_at', 'desc')
                ->get();

            $formatted = $deliveries->map(fn(Delivery $d) => $this->formatDelivery($d));
            $totalEarnings = (float) $deliveries->sum(fn(Delivery $d) => (float) ($d->delivery_fee ?: 50.00));

            return response()->json([
                'success'           => true,
                'status'            => 'success',
                'data'              => $formatted,
                'deliveries'        => $formatted,
                'orders'            => $formatted,
                'history'           => $formatted,
                'earnings'          => $totalEarnings,
                'total_earnings'    => $totalEarnings,
                'totalEarnings'     => $totalEarnings,
                'completed_orders'  => $formatted->count(),
                'completedOrders'   => $formatted->count(),
                'meta'              => [
                    'current_page'  => 1,
                    'last_page'     => 1,
                    'total'         => $formatted->count(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider::getCompletedOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch history'], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STRICT WORKFLOW ENDPOINTS
    |--------------------------------------------------------------------------
    | Each endpoint handles EXACTLY ONE state transition.
    | No generic PATCH /status allowed — prevents race conditions.
    |--------------------------------------------------------------------------
    */

    /**
     * POST /api/v1/rider/orders/{id}/accept
     * POST /api/v1/rider/deliveries/{id}/accept
     * Transition: ready_for_pickup → assigned_to_rider
     * Rider claims/self-accepts an available delivery job.
     */
    public function acceptOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            /** @var Delivery|null $delivery */
            $delivery = Delivery::with(['order', 'sale'])
                ->where(function ($q) use ($id) {
                    $q->where('id', $id)->orWhere('order_id', $id)->orWhere('sale_id', $id);
                })
                ->first();

            if (!$delivery) {
                $order = Order::where('id', $id)->orWhere('order_number', $id)->first();
                if ($order) {
                    $delivery = Delivery::firstOrCreate(
                        ['order_id' => $order->id],
                        [
                            'rider_id'         => null,
                            'status'           => $order->status,
                            'customer_name'    => $order->customer_name,
                            'customer_phone'   => $order->contact_number,
                            'customer_address' => $order->address,
                            'latitude'         => $order->latitude,
                            'longitude'        => $order->longitude,
                            'landmark'         => $order->landmark,
                            'notes'            => $order->notes,
                        ]
                    );
                }
            }

            if (!$delivery) {
                return response()->json(['success' => false, 'message' => "Delivery #{$id} not found."], 404);
            }

            $deliveryService = app(\App\Services\DeliveryService::class);
            $result = $deliveryService->acceptDelivery($delivery, $rider);

            $freshDelivery = $result['delivery']->fresh([
                'order.items.product',
                'order.branch',
                'sale.items.product',
                'sale.branch',
                'rider',
            ]);

            return response()->json([
                'success'  => true,
                'message'  => $result['message'],
                'data'     => $this->formatDelivery($freshDelivery),
                'delivery' => $freshDelivery,
                'order'    => $freshDelivery->order,
            ], 200);
        } catch (\RuntimeException $e) {
            $code = $e->getCode();
            $statusCode = ($code >= 400 && $code < 600) ? $code : 422;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
        } catch (\Throwable $e) {
            Log::error('Rider::acceptOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to accept order'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/pickup
     * POST /api/v1/rider/deliveries/{id}/pickup
     * POST /api/v1/rider/pickup/{id}
     * Transition: assigned_to_rider → picked_up
     * Rider has arrived at branch and collected the food items.
     */
    public function pickupOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveryToBroadcast = null;
            $riderToBroadcast = null;

            $response = DB::transaction(function () use ($rider, $id, &$deliveryToBroadcast, &$riderToBroadcast) {
                // Strict Business Rule: Rider cannot pick up orders if they are currently OUT FOR DELIVERY (in_transit)
                if ($rider->hasInTransitDelivery()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You are currently out for delivery on an active route and cannot pick up additional orders.',
                    ], 422);
                }

                // Look up delivery by Delivery id, Order id, or Sale id
                $delivery = Delivery::with(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch'])
                    ->where(function ($q) use ($id) {
                        $q->where('id', $id)->orWhere('order_id', $id)->orWhere('sale_id', $id);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$delivery) {
                    $order = Order::with(['items.product', 'branch', 'delivery'])
                        ->where('id', $id)
                        ->orWhere('order_number', $id)
                        ->first();

                    if ($order) {
                        $delivery = Delivery::firstOrCreate(
                            ['order_id' => $order->id],
                            [
                                'rider_id'         => $order->rider_id,
                                'status'           => $order->status,
                                'customer_name'    => $order->customer_name,
                                'customer_phone'   => $order->contact_number,
                                'customer_address' => $order->address,
                                'latitude'         => $order->latitude,
                                'longitude'        => $order->longitude,
                                'landmark'         => $order->landmark,
                                'notes'            => $order->notes,
                            ]
                        );
                    }
                }

                if (!$delivery) {
                    return response()->json(['success' => false, 'message' => "Delivery #{$id} not found."], 404);
                }

                // Verify rider assignment
                if ($delivery->rider_id !== null && (int) $delivery->rider_id !== (int) $rider->id) {
                    return response()->json(['success' => false, 'message' => 'This delivery is assigned to another rider.'], 403);
                }

                if ($delivery->rider_id === null || $delivery->status === 'ready_for_pickup') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Delivery must be accepted before it can be picked up.',
                    ], 422);
                }

                // Idempotency: If already in picked_up status, return success cleanly
                if ($delivery->status === 'picked_up') {
                    return response()->json([
                        'success'  => true,
                        'message'  => 'Order is already marked as picked up.',
                        'data'     => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider'])),
                        'delivery' => $delivery,
                    ], 200);
                }

                // If already beyond picked_up
                if (in_array($delivery->status, ['in_transit', 'delivered'])) {
                    return response()->json([
                        'success' => false,
                        'message' => "Delivery is already in {$delivery->status} status and cannot be picked up again.",
                    ], 422);
                }

                // Strict state machine: must be assigned_to_rider
                if ($delivery->status !== 'assigned_to_rider') {
                    return response()->json([
                        'success' => false,
                        'message' => "Invalid state transition: Cannot pick up order in '{$delivery->status}' status.",
                    ], 422);
                }

                if ($delivery->order) {
                    if ($delivery->order->canTransitionTo('picked_up')) {
                        $delivery->order->transitionTo('picked_up', 'Rider picked up the order', null, $rider->id);
                    }
                    $delivery->order->update([
                        'rider_id' => $rider->id,
                        'status'   => 'picked_up',
                    ]);
                }

                $delivery->update([
                    'rider_id'     => $rider->id,
                    'status'       => 'picked_up',
                    'picked_up_at' => now(),
                    'updated_by'   => $rider->id,
                ]);

                $deliveryToBroadcast = $delivery->fresh(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider']);
                $riderToBroadcast = $rider->fresh(['branch']);

                return response()->json([
                    'success'  => true,
                    'message'  => 'Order marked as picked up! Please head to the customer.',
                    'data'     => $this->formatDelivery($deliveryToBroadcast),
                    'delivery' => $deliveryToBroadcast,
                ], 200);
            });

            // ── COMMIT GUARANTEE: Broadcast AFTER Transaction Successfully Commits ──
            if ($deliveryToBroadcast) {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            }
            if ($riderToBroadcast) {
                event(new RiderStatusUpdated($riderToBroadcast));
            }

            return $response;
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::pickupOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to update pickup status'], 500);
        }
    }

    /**
     * Generic status updater fallback for mobile apps that send status payloads.
     */
    public function updateOrderStatus(Request $request, $id): JsonResponse
    {
        $status = $request->input('status', $request->input('order_status'));
        return match ($status) {
            'picked_up'                           => $this->pickupOrder($request, $id),
            'in_transit', 'out_for_delivery'      => $this->startTransit($request, $id),
            'delivered'                           => $this->deliverOrder($request, $id),
            'assigned_to_rider', 'accepted'       => $this->acceptOrder($request, $id),
            'cancelled', 'cancellation_requested' => $this->cancelOrder($request, $id),
            'rejected'                            => $this->rejectOrder($request, $id),
            default                               => response()->json([
                'success' => false,
                'message' => 'Invalid status transition: ' . ($status ?? 'none provided'),
            ], 422),
        };
    }

    /**
     * POST /api/v1/rider/orders/{id}/transit
     * POST /api/v1/rider/deliveries/{id}/transit
     * POST /api/v1/rider/transit/{id}
     * Transition: picked_up → in_transit
     * Rider has left the branch and is now delivering to customer.
     */
    public function startTransit(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveryToBroadcast = null;
            $riderToBroadcast = null;

            $response = DB::transaction(function () use ($rider, $id, &$deliveryToBroadcast, &$riderToBroadcast) {
                $delivery = Delivery::with(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch'])
                    ->where(function ($q) use ($id) {
                        $q->where('id', $id)->orWhere('order_id', $id)->orWhere('sale_id', $id);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$delivery) {
                    $order = Order::where('id', $id)->orWhere('order_number', $id)->first();
                    if ($order) {
                        $delivery = Delivery::where('order_id', $order->id)->first();
                    }
                }

                if (!$delivery) {
                    return response()->json(['success' => false, 'message' => "Delivery #{$id} not found."], 404);
                }

                // Verify rider assignment
                if ($delivery->rider_id !== null && (int) $delivery->rider_id !== (int) $rider->id) {
                    return response()->json(['success' => false, 'message' => 'This delivery is assigned to another rider.'], 403);
                }

                if ($delivery->rider_id === null || $delivery->status === 'ready_for_pickup') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Delivery must be accepted and picked up before starting transit.',
                    ], 422);
                }

                if ($delivery->status === 'assigned_to_rider') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Delivery must be picked up at the store before starting transit.',
                    ], 422);
                }

                // Idempotency: If already in transit, return success
                if ($delivery->status === 'in_transit') {
                    return response()->json([
                        'success'  => true,
                        'message'  => 'Delivery is already in transit.',
                        'data'     => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider'])),
                        'delivery' => $delivery,
                    ], 200);
                }

                if ($delivery->status === 'delivered') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Delivery has already been completed.',
                    ], 422);
                }

                // Legal transition MUST be from picked_up
                if ($delivery->status !== 'picked_up') {
                    return response()->json([
                        'success' => false,
                        'message' => "Invalid state transition: Cannot start transit from '{$delivery->status}' status.",
                    ], 422);
                }

                if ($delivery->order) {
                    if ($delivery->order->canTransitionTo('in_transit')) {
                        $delivery->order->transitionTo('in_transit', 'Rider is on the way', null, $rider->id);
                    }
                    $delivery->order->update([
                        'rider_id' => $rider->id,
                        'status'   => 'in_transit',
                    ]);
                }

                $delivery->update([
                    'status'     => 'in_transit',
                    'transit_at' => now(),
                    'updated_by' => $rider->id,
                ]);

                $deliveryToBroadcast = $delivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);
                $riderToBroadcast = $rider->fresh(['branch']);

                return response()->json([
                    'success'  => true,
                    'message'  => 'You are on your way!',
                    'data'     => $this->formatDelivery($deliveryToBroadcast),
                    'delivery' => $deliveryToBroadcast,
                ], 200);
            });

            // ── COMMIT GUARANTEE: Broadcast AFTER Transaction Successfully Commits ──
            if ($deliveryToBroadcast) {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            }
            if ($riderToBroadcast) {
                event(new RiderStatusUpdated($riderToBroadcast));
            }

            return $response;
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::startTransit failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to update transit status'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/deliver
     * POST /api/v1/rider/deliveries/{id}/deliver
     * POST /api/v1/rider/deliver/{id}
     * Transition: in_transit → delivered
     * Rider delivered the order to customer.
     */
    public function deliverOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'proof_of_delivery' => 'nullable|image|max:5120', // 5MB max
            ]);

            $deliveryToBroadcast = null;
            $riderToBroadcast = null;

            $response = DB::transaction(function () use ($rider, $id, $request, &$deliveryToBroadcast, &$riderToBroadcast) {
                $delivery = Delivery::with(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch'])
                    ->where(function ($q) use ($id) {
                        $q->where('id', $id)->orWhere('order_id', $id)->orWhere('sale_id', $id);
                    })
                    ->lockForUpdate()
                    ->first();

                if (!$delivery) {
                    $order = Order::where('id', $id)->orWhere('order_number', $id)->first();
                    if ($order) {
                        $delivery = Delivery::where('order_id', $order->id)->first();
                    }
                }

                if (!$delivery) {
                    return response()->json(['success' => false, 'message' => "Delivery #{$id} not found."], 404);
                }

                // Verify rider assignment
                if ($delivery->rider_id !== null && (int) $delivery->rider_id !== (int) $rider->id) {
                    return response()->json(['success' => false, 'message' => 'This delivery is assigned to another rider.'], 403);
                }

                // IDEMPOTENCY: If already marked as delivered, return success cleanly without re-running financial hooks
                if ($delivery->status === 'delivered') {
                    return response()->json([
                        'success'  => true,
                        'message'  => 'Delivery already marked as delivered.',
                        'data'     => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch', 'sale.items.product', 'sale.branch', 'rider'])),
                        'delivery' => $delivery,
                    ], 200);
                }

                // Legal transition MUST be from in_transit
                if ($delivery->status !== 'in_transit') {
                    return response()->json([
                        'success' => false,
                        'message' => "Delivery must be in transit before it can be marked as delivered (current status: {$delivery->status}).",
                    ], 422);
                }

                $order = $delivery->order ?: ($delivery->order_id ? Order::find($delivery->order_id) : null);
                if ($order) {
                    if ($order->canTransitionTo('delivered')) {
                        $order->transitionTo('delivered', 'Order delivered successfully', null, $rider->id);
                    }
                    $order->update([
                        'rider_id' => $rider->id,
                        'status'   => 'delivered',
                    ]);
                }

                if ($delivery->sale && $delivery->sale->status !== 'completed') {
                    $delivery->sale->update(['status' => 'completed']);
                }

                $updateData = [
                    'status'       => 'delivered',
                    'delivered_at' => now(),
                    'updated_by'   => $rider->id,
                ];

                // Store proof of delivery photo if provided
                if ($request->hasFile('proof_of_delivery')) {
                    $path = $request->file('proof_of_delivery')->store('proof_of_delivery', 'public');
                    $this->syncToPublicStorage($path);
                    $updateData['proof_of_delivery'] = $path;
                }

                $delivery->update($updateData);

                // Free up the rider ONLY if all active deliveries are completed
                $remainingActive = Delivery::where('rider_id', $rider->id)
                    ->whereNotIn('status', ['delivered', 'cancelled', 'failed_delivery'])
                    ->count();

                if ($remainingActive === 0) {
                    Rider::where('id', $rider->id)->update(['status' => 'available']);
                    $rider->status = 'available';
                } else {
                    Rider::where('id', $rider->id)->update(['status' => 'busy']);
                    $rider->status = 'busy';
                }

                // ── POST-DELIVERY HOOK: Financial Recognition & Authoritative Sale ──
                if ($order) {
                    $this->fulfillmentService->onOrderDelivered(
                        $order->fresh(['items.product.ingredients.stocks', 'branch']),
                        $delivery
                    );
                }

                $deliveryToBroadcast = $delivery->fresh(['order.branch', 'order.items.product', 'sale.branch', 'sale.items.product', 'rider']);
                $riderToBroadcast = $rider->fresh(['branch']);

                return response()->json([
                    'success'  => true,
                    'message'  => 'Delivery confirmed! Great job!',
                    'data'     => $this->formatDelivery($deliveryToBroadcast),
                    'delivery' => $deliveryToBroadcast,
                ], 200);
            });

            // ── COMMIT GUARANTEE: Broadcast AFTER Transaction Successfully Commits ──
            if ($deliveryToBroadcast) {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            }
            if ($riderToBroadcast) {
                event(new RiderStatusUpdated($riderToBroadcast));
            }

            return $response;
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::deliverOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to confirm delivery'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/cancel
     * Rider submits a cancellation request (does NOT directly cancel).
     */
    public function cancelOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'reason' => 'required|string|max:255',
                'notes'  => 'nullable|string|max:500',
            ]);

            return DB::transaction(function () use ($rider, $id, $request) {
                $delivery = Delivery::with(['order.branch', 'order'])
                    ->where(function ($q) use ($id) {
                        $q->where('id', $id)
                            ->orWhere('order_id', $id);
                    })
                    ->where('rider_id', $rider->id)
                    ->lockForUpdate()
                    ->first();

                if (!$delivery) {
                    $order = Order::where('id', $id)->where('rider_id', $rider->id)->first();
                    if (!$order) {
                        return response()->json(['success' => false, 'message' => 'Delivery or order not found.'], 404);
                    }
                    $delivery = Delivery::firstOrCreate(
                        ['order_id' => $order->id],
                        [
                            'rider_id'         => $rider->id,
                            'status'           => $order->status,
                            'customer_name'    => $order->customer_name,
                            'customer_phone'   => $order->contact_number,
                            'customer_address' => $order->address,
                        ]
                    );
                }

                if ($delivery->isDelivered()) {
                    return response()->json(['success' => false, 'message' => 'Cannot request cancellation for a delivered order.'], 422);
                }

                if ($delivery->status === 'cancelled') {
                    return response()->json(['success' => false, 'message' => 'Order is already cancelled.'], 422);
                }

                $order = $delivery->order ?: Order::find($delivery->order_id);
                if (!$order) {
                    return response()->json(['success' => false, 'message' => 'Order not found for this delivery.'], 404);
                }

                // Check for existing pending cancellation request
                $existingRequest = OrderCancellationRequest::where('order_id', $order->id)
                    ->where('status', 'pending')
                    ->first();

                if (!$existingRequest) {
                    $existingRequest = \App\Models\CancellationRequest::where('order_id', $order->id)
                        ->where('status', 'pending')
                        ->first();
                }

                if ($existingRequest) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A cancellation request is already pending for this order.',
                        'status'  => 'cancellation_requested',
                        'request' => $existingRequest,
                    ], 422);
                }

                $prevOrderStatus = $order->status;
                $prevDeliveryStatus = $delivery->status;

                // Update Order & Delivery status
                $order->update([
                    'status'                  => 'cancellation_requested',
                    'is_cancellation_pending' => true,
                    'cancellation_status'     => 'pending',
                ]);
                $delivery->update(['status' => 'cancellation_requested']);

                // Create in cancellation_requests table
                \App\Models\CancellationRequest::create([
                    'order_id' => $order->id,
                    'rider_id' => $rider->id,
                    'reason'   => $request->reason,
                    'notes'    => $request->input('notes'),
                    'status'   => 'pending',
                ]);

                // Create in order_cancellation_requests table
                $cancellationRequest = OrderCancellationRequest::create([
                    'order_id'                 => $order->id,
                    'delivery_id'              => $delivery->id,
                    'requested_by_rider_id'    => $rider->id,
                    'branch_id'                => $order->branch_id,
                    'reason'                   => $request->reason,
                    'notes'                    => $request->input('notes'),
                    'previous_order_status'    => $prevOrderStatus,
                    'previous_delivery_status' => $prevDeliveryStatus,
                    'status'                   => 'pending',
                    'requested_at'             => now(),
                ]);

                // Real-Time Broadcasts
                try {
                    event(new CancellationRequested($cancellationRequest->fresh()));
                    event(new OrderStatusUpdated($delivery->fresh(), 'rider'));
                } catch (\Throwable $e) {
                    Log::warning('Broadcast failed for CancellationRequested: ' . $e->getMessage());
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Cancellation request submitted successfully. Waiting for cashier approval.',
                    'status'  => 'cancellation_requested',
                    'request' => $cancellationRequest->fresh(),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::cancelOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to submit cancellation request'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/reject
     * Rider rejects an assigned order (returns it to the pool).
     */
    public function rejectOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveryToBroadcast = null;
            $riderToBroadcast = null;

            $response = DB::transaction(function () use ($rider, $id, &$deliveryToBroadcast, &$riderToBroadcast) {
                $delivery = Delivery::with('order')
                    ->where(function ($q) use ($id) {
                        $q->where('id', $id)->orWhere('order_id', $id);
                    })
                    ->where('rider_id', $rider->id)
                    ->whereHas('order', fn($q) => $q->where('status', 'assigned_to_rider'))
                    ->lockForUpdate()
                    ->first();

                if (!$delivery) {
                    return response()->json(['success' => false, 'message' => 'Delivery not found.'], 404);
                }

                $order = $delivery->order;
                // Return to ready_for_pickup so another rider can accept it
                $order->transitionTo('ready_for_pickup', 'Rider rejected the order', null, $rider->id);
                $order->update(['rider_id' => null]);

                $delivery->update(['rider_id' => null, 'status' => 'ready_for_pickup']);
                $rider->update(['status' => 'available']);

                $deliveryToBroadcast = $delivery->fresh(['order.branch', 'sale.branch', 'rider']);
                $riderToBroadcast = $rider->fresh(['branch']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order returned to the available pool.',
                ]);
            });

            // ── COMMIT GUARANTEE: Broadcast AFTER Transaction Successfully Commits ──
            if ($deliveryToBroadcast) {
                event(new OrderStatusUpdated($deliveryToBroadcast, 'rider'));
            }
            if ($riderToBroadcast) {
                event(new RiderStatusUpdated($riderToBroadcast));
            }

            return $response;
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to reject order'], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GPS TRACKING
    |--------------------------------------------------------------------------
    */

    /**
     * POST /api/v1/rider/location
     * Rider pings their GPS location every 5-10 seconds while on a delivery.
     * Stores in rider_location_logs for route history.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'latitude'    => 'required|numeric|between:-90,90',
                'longitude'   => 'required|numeric|between:-180,180',
                'accuracy'    => 'nullable|numeric|min:0',
                'speed'       => 'nullable|numeric|min:0',
                'heading'     => 'nullable|numeric|between:0,360',
                'recorded_at' => 'nullable|date',
            ]);

            // Find active delivery for this rider
            $delivery = Delivery::where('rider_id', $rider->id)
                ->where(function ($q) {
                    $q->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                        ->orWhereHas('order', fn($oq) => $oq->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit']));
                })
                ->latest()
                ->first();

            $recordedAt = $request->recorded_at ? \Carbon\Carbon::parse($request->recorded_at) : now();

            // Store location log
            RiderLocationLog::create([
                'rider_id'    => $rider->id,
                'delivery_id' => $delivery?->id,
                'latitude'    => $request->latitude,
                'longitude'   => $request->longitude,
                'speed'       => $request->speed,
                'heading'     => $request->heading,
                'recorded_at' => $recordedAt,
            ]);

            // Update rider's current position on riders table
            $rider->update([
                'last_active_at'      => now(),
                'location_updated_at' => $recordedAt,
                'latitude'            => $request->latitude,
                'longitude'           => $request->longitude,
                'accuracy'            => $request->accuracy,
                'speed'               => $request->speed,
                'heading'             => $request->heading,
            ]);

            // Broadcast real-time location update event
            try {
                event(new \App\Events\RiderLocationUpdated($rider, $delivery));
            } catch (\Throwable $e) {
                // Non-blocking fallback if broadcast fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'data'    => [
                    'latitude'            => (float) $rider->latitude,
                    'longitude'           => (float) $rider->longitude,
                    'location_updated_at' => $rider->location_updated_at?->toIso8601String(),
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider::updateLocation failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to update location'], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS & HEARTBEAT
    |--------------------------------------------------------------------------
    */

    /**
     * PATCH /api/v1/rider/status
     * Updates rider account status (active/inactive) and operational status (available/busy/offline).
     * Broadcasts RiderStatusUpdated to admin and branch private channels in real-time.
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'status'         => 'nullable|string|in:active,inactive,ACTIVE,INACTIVE,available,busy,offline',
                'account_status' => 'nullable|string|in:active,inactive,ACTIVE,INACTIVE',
                'is_active'      => 'nullable|boolean',
            ]);

            $rider = $this->resolveRider($request);

            if (!$rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            // Determine target account status (is_active) and operational status
            $currentIsActive = (bool) $rider->is_active;
            $currentStatus   = $rider->status ?: 'offline';

            $targetIsActive = $currentIsActive;
            $targetStatus   = $currentStatus;

            // 1. Check explicit is_active boolean
            if ($request->has('is_active')) {
                $targetIsActive = $request->boolean('is_active');
            }

            // 2. Check account_status string
            if ($request->filled('account_status')) {
                $targetIsActive = strtolower($request->account_status) === 'active';
            }

            // 3. Check status string
            if ($request->filled('status')) {
                $statusInput = strtolower($request->status);
                if ($statusInput === 'active') {
                    $targetIsActive = true;
                    if ($targetStatus === 'offline') {
                        $targetStatus = 'available';
                    }
                } elseif ($statusInput === 'inactive') {
                    $targetIsActive = false;
                    $targetStatus = 'offline';
                } elseif ($statusInput === 'available') {
                    $targetIsActive = true;
                    $targetStatus = 'available';
                } elseif ($statusInput === 'offline') {
                    $targetIsActive = false;
                    $targetStatus = 'offline';
                } elseif ($statusInput === 'busy') {
                    $targetStatus = 'busy';
                }
            }

            // Harmonize status with account activity
            if (!$targetIsActive) {
                $targetStatus = 'offline';
            } elseif ($targetIsActive && $targetStatus === 'offline') {
                $targetStatus = 'available';
            }

            // Execute update inside DB transaction to guarantee consistency
            DB::transaction(function () use ($rider, $targetIsActive, $targetStatus) {
                $rider->update([
                    'is_active'      => $targetIsActive,
                    'status'         => $targetStatus,
                    'last_active_at' => now(),
                ]);
            });

            $freshRider = $rider->fresh(['branch']);

            // Broadcast real-time event only after DB transaction commits
            try {
                event(new RiderStatusUpdated($freshRider));
            } catch (\Throwable $broadcastError) {
                Log::warning('RiderStatusUpdated broadcast failed: ' . $broadcastError->getMessage());
            }

            $isOutForDelivery = $freshRider->hasInTransitDelivery();
            $canBeAssigned    = (bool) ($freshRider->is_active && $freshRider->status !== 'offline' && !$isOutForDelivery);

            return response()->json([
                'success'        => true,
                'message'        => 'Rider status updated successfully.',
                'is_active'      => (bool) $freshRider->is_active,
                'account_status' => $freshRider->is_active ? 'active' : 'inactive',
                'status'         => $freshRider->status,
                'rider'          => [
                    'id'                  => $freshRider->id,
                    'name'                => $freshRider->name,
                    'branch_id'           => $freshRider->branch_id,
                    'branch_name'         => $freshRider->branch?->name ?? 'Global',
                    'is_active'           => (bool) $freshRider->is_active,
                    'account_status'      => $freshRider->is_active ? 'active' : 'inactive',
                    'status'              => $freshRider->status,
                    'is_out_for_delivery' => $isOutForDelivery,
                    'can_be_assigned'     => $canBeAssigned,
                    'active_deliveries'   => $freshRider->activeDeliveriesCount(),
                    'last_active_at'      => $freshRider->last_active_at?->toIso8601String(),
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $ve->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::updateStatus failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Update failed'], 500);
        }
    }

    /**
     * GET /api/v1/rider/stats
     * Returns rider statistics for their dashboard.
     */
    public function getStats(Request $request): JsonResponse
    {
        try {
            $rider = $this->resolveRider($request);
            if (!$rider) {
                return response()->json(['success' => false], 403);
            }

            $totalCompleted = Delivery::where('rider_id', $rider->id)
                ->where('status', 'delivered')
                ->count();

            $totalEarnings = (float) Delivery::where('rider_id', $rider->id)
                ->where('status', 'delivered')
                ->sum('delivery_fee');

            $todayEarnings = (float) Delivery::where('rider_id', $rider->id)
                ->where('status', 'delivered')
                ->whereDate('updated_at', now()->toDateString())
                ->sum('delivery_fee');

            $activeOrders = Delivery::where('rider_id', $rider->id)
                ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                ->count();

            $statsData = [
                'total_orders'      => $totalCompleted + $activeOrders,
                'totalOrders'       => $totalCompleted + $activeOrders,
                'completed_orders'  => $totalCompleted,
                'completedOrders'   => $totalCompleted,
                'active_orders'     => $activeOrders,
                'activeOrders'      => $activeOrders,
                'earnings'          => $totalEarnings,
                'total_earnings'    => $totalEarnings,
                'totalEarnings'     => $totalEarnings,
                'today_earnings'    => $todayEarnings,
                'todayEarnings'     => $todayEarnings,
                'rating'            => 5.0,
            ];

            return response()->json([
                'success'           => true,
                'status'            => 'success',
                'data'              => $statsData,
                'stats'             => $statsData,
                'earnings'          => $totalEarnings,
                'total_earnings'    => $totalEarnings,
                'totalEarnings'     => $totalEarnings,
                'today_earnings'    => $todayEarnings,
                'todayEarnings'     => $todayEarnings,
                'completed_orders'  => $totalCompleted,
                'completedOrders'   => $totalCompleted,
                'total_orders'      => $totalCompleted + $activeOrders,
                'totalOrders'       => $totalCompleted + $activeOrders,
                'active_orders'     => $activeOrders,
                'activeOrders'      => $activeOrders,
            ]);
        } catch (\Throwable $e) {
            Log::error('Rider::getStats failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch stats'], 500);
        }
    }

    /**
     * POST /api/v1/rider/ping
     */
    public function ping(Request $request): JsonResponse
    {
        $rider = $this->resolveRider($request);
        if (!$rider) {
            return response()->json(['success' => false], 403);
        }

        $requestedStatus = $request->input('rider_status') 
            ?? $request->input('status') 
            ?? ($request->input('is_active') !== null ? ($request->input('is_active') ? 'available' : 'offline') : null);

        $status = in_array($requestedStatus, ['available', 'busy', 'offline']) 
            ? $requestedStatus 
            : ($rider->status ?: 'available');

        $rider->update([
            'status'         => $status,
            'is_active'      => $status !== 'offline',
            'last_active_at' => now(),
        ]);

        return response()->json([
            'success'        => true,
            'status'         => $rider->status,
            'rider_status'   => $rider->status,
            'is_active'      => (bool) $rider->is_active,
            'last_active_at' => $rider->last_active_at,
            'message'        => 'Heartbeat acknowledged',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve authenticated rider instance from either Rider model or User model.
     */
    private function resolveRider(Request $request): ?Rider
    {
        $user = $request->user();
        if ($user instanceof Rider) {
            return $user;
        }
        if ($user) {
            return Rider::where('id', $user->id)
                ->orWhere('user_id', $user->id)
                ->orWhere('email', $user->email)
                ->first();
        }
        return null;
    }

    /**
     * Standardized delivery response formatter.
     */
    private function formatDelivery(Delivery $delivery): array
    {
        $order = $delivery->order;
        $sale  = $delivery->sale;

        $lat = $delivery->latitude ?? $order?->latitude;
        $lng = $delivery->longitude ?? $order?->longitude;

        $fee = (float) ($delivery->delivery_fee ?: ($order?->delivery_fee ?: 50.00));
        $totalAmount = (float) ($sale?->total ?? $order?->total_amount ?? 0);
        $orderNumber = $sale?->order_number ?? $order?->order_number ?? ($delivery->tracking_number ?? 'DEL-' . $delivery->id);
        $orderSource = $sale ? 'pos' : 'mobile';

        $branch = $sale?->branch ?? $order?->branch;
        $branchName = $branch?->name ?? 'Store Branch';
        $branchAddress = $branch?->address ?? null;
        $branchLat = (float) ($branch?->latitude ?? 0);
        $branchLng = (float) ($branch?->longitude ?? 0);

        $createdAt = $delivery->created_at?->toIso8601String() ?? $order?->created_at?->toIso8601String() ?? $sale?->created_at?->toIso8601String();
        $updatedAt = $delivery->updated_at?->toIso8601String() ?? $order?->updated_at?->toIso8601String() ?? $sale?->updated_at?->toIso8601String();

        // Format items from either Order or Sale
        $items = [];
        if ($order && $order->items) {
            $items = $order->items->map(fn($item) => [
                'product_name' => $item->product?->name ?? 'Item',
                'quantity'     => $item->quantity,
                'price'        => (float) $item->price,
                'subtotal'     => (float) ($item->quantity * $item->price),
            ])->values()->all();
        } elseif ($sale && $sale->items) {
            $items = $sale->items->map(fn($item) => [
                'product_name' => $item->product?->name ?? 'Item',
                'quantity'     => $item->quantity,
                'price'        => (float) $item->unit_price,
                'subtotal'     => (float) ($item->quantity * $item->unit_price),
            ])->values()->all();
        }

        $isUnassigned = ($delivery->rider_id === null);
        $customerName = $delivery->customer_name;
        $customerPhone = $isUnassigned ? null : $delivery->customer_phone;
        $customerAddress = $isUnassigned 
            ? ($delivery->landmark ? "Near {$delivery->landmark}" : ($delivery->customer_address ? explode(',', $delivery->customer_address)[0] : 'Customer Location'))
            : $delivery->customer_address;

        $status = $delivery->status;

        $nextAction = match ($status) {
            'ready_for_pickup'  => ($delivery->rider_id === null) ? 'accept' : null,
            'assigned_to_rider' => 'pickup',
            'picked_up'         => 'transit',
            'in_transit'        => 'deliver',
            default             => null,
        };

        $nextActionLabel = match ($status) {
            'ready_for_pickup'  => ($delivery->rider_id === null) ? 'Accept Delivery' : 'Waiting for Pickup',
            'assigned_to_rider' => 'Pick Up Order',
            'picked_up'         => 'Start Delivery',
            'in_transit'        => 'Mark as Delivered',
            'delivered'         => 'Delivered',
            'cancelled'         => 'Cancelled',
            default             => null,
        };

        $nextEndpoint = match ($status) {
            'ready_for_pickup'  => ($delivery->rider_id === null) ? "/api/v1/rider/deliveries/{$delivery->id}/accept" : null,
            'assigned_to_rider' => "/api/v1/rider/deliveries/{$delivery->id}/pickup",
            'picked_up'         => "/api/v1/rider/deliveries/{$delivery->id}/transit",
            'in_transit'        => "/api/v1/rider/deliveries/{$delivery->id}/deliver",
            default             => null,
        };

        $routePhase = match ($status) {
            'ready_for_pickup'  => 'unassigned',
            'assigned_to_rider' => 'rider_to_store',
            'picked_up'         => 'store_to_customer',
            'in_transit'        => 'rider_to_customer',
            'delivered'         => 'completed',
            default             => 'unassigned',
        };

        $pickupLocation = [
            'branch_id' => $branch?->id,
            'name'      => $branchName,
            'address'   => $branchAddress,
            'latitude'  => $branchLat,
            'longitude' => $branchLng,
            'maps_url'  => ($branchLat && $branchLng)
                ? "https://www.google.com/maps/dir/?api=1&destination={$branchLat},{$branchLng}"
                : null,
        ];

        $customerDestination = [
            'customer_name'    => $customerName,
            'customer_phone'   => $customerPhone,
            'customer_address' => $customerAddress,
            'latitude'         => $lat,
            'longitude'        => $lng,
            'landmark'         => $delivery->landmark ?? $order?->landmark,
            'maps_url'         => ($lat && $lng)
                ? "https://www.google.com/maps/dir/?api=1&destination={$lat},{$lng}"
                : null,
        ];

        $routeDestination = match ($routePhase) {
            'rider_to_store'                         => $pickupLocation,
            'store_to_customer', 'rider_to_customer' => $customerDestination,
            default                                  => null,
        };

        $activeMapsUrl = match ($routePhase) {
            'rider_to_store'                         => $pickupLocation['maps_url'],
            'store_to_customer', 'rider_to_customer' => $customerDestination['maps_url'],
            default                                  => null,
        };

        return [
            'id'                      => $order?->id ?? $delivery->id,
            'delivery_id'             => $delivery->id,
            'deliveryId'              => $delivery->id,
            'order_id'                => $delivery->order_id,
            'orderId'                 => $delivery->order_id,
            'sale_id'                 => $delivery->sale_id,
            'order_number'            => $orderNumber,
            'orderNumber'             => $orderNumber,
            'order_source'            => $orderSource,
            'status'                  => $delivery->status,
            'current_state'           => $delivery->status,
            'order_status'            => $order?->status ?? $delivery->status,
            'orderStatus'             => $order?->status ?? $delivery->status,
            'status_label'            => $delivery->getStatusLabel(),
            'statusLabel'             => $delivery->getStatusLabel(),
            'is_available'            => $delivery->isAvailableForRiders(),
            'isAvailable'             => $delivery->isAvailableForRiders(),
            'next_action'             => $nextAction,
            'nextAction'              => $nextAction,
            'next_action_label'       => $nextActionLabel,
            'nextActionLabel'         => $nextActionLabel,
            'next_endpoint'           => $nextEndpoint,
            'route_phase'             => $routePhase,
            'routePhase'              => $routePhase,
            'route_destination'       => $routeDestination,
            'active_destination'      => $routeDestination,
            'pickup'                  => $pickupLocation,
            'pickup_location'         => $pickupLocation,
            'pickup_branch'           => $pickupLocation,
            'customer_destination'    => $customerDestination,
            'rider_id'                => $delivery->rider_id,
            'rider_name'              => $delivery->rider?->name,
            'accepted_at'             => $delivery->accepted_at?->toIso8601String(),
            'picked_up_at'            => $delivery->picked_up_at?->toIso8601String(),
            'transit_at'              => $delivery->transit_at?->toIso8601String(),
            'delivered_at'            => $delivery->delivered_at?->toIso8601String(),
            'cancellation_status'     => $order?->cancellation_status,
            'is_cancellation_pending' => (bool) ($order?->is_cancellation_pending ?? false),

            // Customer Info (safeguarded before acceptance)
            'customer_name'           => $customerName,
            'customerName'            => $customerName,
            'customer_phone'          => $customerPhone,
            'customerPhone'           => $customerPhone,
            'customer_address'        => $customerAddress,
            'customerAddress'         => $customerAddress,
            'full_customer_address'   => $isUnassigned ? null : $delivery->customer_address,

            // Location for maps
            'latitude'                => $lat,
            'longitude'               => $lng,
            'landmark'                => $delivery->landmark ?? $order?->landmark,
            'notes'                   => $isUnassigned ? null : ($delivery->notes ?? $order?->notes),
            'maps_url'                => $activeMapsUrl ?? (($lat && $lng) ? "https://www.google.com/maps/dir/?api=1&destination={$lat},{$lng}" : null),
            'customer_maps_url'       => ($lat && $lng) ? "https://www.google.com/maps/dir/?api=1&destination={$lat},{$lng}" : null,

            // Financial & Earnings
            'delivery_fee'            => $fee,
            'deliveryFee'             => $fee,
            'earnings'                => $fee,
            'fee'                     => $fee,
            'distance_km'             => (float) $delivery->distance_km,
            'total_amount'            => $totalAmount,
            'totalAmount'             => $totalAmount,
            'payment_method'          => $sale?->payment_method ?? $order?->payment_method ?? 'cash',

            // Branch (pickup point)
            'branch_id'               => $branch?->id,
            'branch_name'             => $branchName,
            'branchName'              => $branchName,
            'branch_address'          => $branchAddress,
            'branch_latitude'         => $branchLat,
            'branch_longitude'        => $branchLng,
            'branch_maps_url'         => $pickupLocation['maps_url'],

            // Proof of delivery
            'proof_of_delivery_url'   => $delivery->proof_of_delivery_url,

            // Order Items
            'items'                   => $items,
            'items_count'             => count($items),

            'created_at'              => $createdAt,
            'createdAt'               => $createdAt,
            'updated_at'              => $updatedAt,
            'updatedAt'               => $updatedAt,
            'date'                    => $createdAt,
            'completed_at'            => $updatedAt,
            'completedAt'             => $updatedAt,
        ];
    }

    /**
     * Copy uploaded image to public/storage if storage link is a physical folder.
     */
    private function syncToPublicStorage(?string $imagePath): void
    {
        \App\Utils\ImageHelper::syncToPublicStorage($imagePath);
    }
}
