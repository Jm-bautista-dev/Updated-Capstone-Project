<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use App\Events\OrderCreated;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiOrderController extends Controller
{
    /**
     * List orders for the authenticated mobile user.
     */
    /**
     * List orders for the authenticated mobile user.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $userId = $user?->id ?? $request->input('user_id', $request->input('customer_id'));
            $phone = $request->input('phone', $request->input('contact_number', $user?->phone_number ?? $user?->phone));

            $query = Order::with(['delivery', 'items.product', 'branch']);

            if ($request->filled('status')) {
                $status = $request->input('status');
                $statuses = is_array($status) ? $status : explode(',', $status);
                $query->whereIn('status', $statuses);
            } elseif ($userId) {
                $query->where(function ($q) use ($userId, $phone) {
                    $q->where('user_id', $userId);
                    if ($phone) {
                        $q->orWhere('contact_number', $phone);
                    }
                });
            } elseif ($phone) {
                $query->where('contact_number', $phone);
            } else {
                return response()->json([
                    'success' => true,
                    'data'    => [],
                    'orders'  => [],
                ]);
            }

            $orders = $query->latest()->get();

            return response()->json([
                'success' => true,
                'data'    => $orders,
                'orders'  => $orders,
            ]);
        } catch (\Throwable $e) {
            Log::error('API Order Index Failure', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Something went wrong.'
            ], 500);
        }
    }

    /**
     * Store a newly created order from the mobile application.
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('Order submission payload', $request->all());

        try {
            $fulfillmentType = $request->input('fulfillment_type', Order::FULFILLMENT_DELIVERY);
            $isPickup = ($fulfillmentType === Order::FULFILLMENT_PICKUP);

            $validated = $request->validate([
                'fulfillment_type'    => 'nullable|string|in:delivery,pickup',
                'scheduled_pickup_at' => $isPickup ? 'required' : 'nullable',
                'pickup_notes'        => 'nullable|string',
                'customer_name'       => 'required|string|max:255',
                'mobile_number'       => 'required|string|max:20',
                'address'             => $isPickup ? 'nullable|string' : 'required|string',
                'items'               => 'required|array|min:1',
                'items.*.product_id'  => 'required|exists:products,id',
                'items.*.quantity'    => 'required|numeric|min:0.1',
                'items.*.price'       => 'required|numeric|min:0',
                'items.*.selected_addons' => 'nullable|array',
                'total_amount'        => 'required|numeric|min:0',
                'delivery_fee'        => 'nullable|numeric|min:0',
                'distance_km'         => 'nullable|numeric|min:0',
                'latitude'            => $isPickup ? 'nullable|numeric|between:-90,90' : 'required|numeric|between:-90,90',
                'longitude'           => $isPickup ? 'nullable|numeric|between:-180,180' : 'required|numeric|between:-180,180',
                'landmark'            => 'nullable|string|max:255',
                'notes'               => 'nullable|string',
                'payment_method'      => 'nullable|string|max:50',
                'branch_id'           => 'nullable|exists:branches,id'
            ]);

            $branchId = $validated['branch_id'] ?? 1;
            $user = $request->user();
            $userId = $user?->id;
            $mobileNumber = $validated['mobile_number'];

            // --- 0. ACCOUNT GOVERNANCE CHECK ---
            $restrictionError = $this->checkAccountRestrictions($user);
            if ($restrictionError) {
                return $restrictionError;
            }

            // --- 0. IDEMPOTENCY CHECK ---
            $idempotencyService = new \App\Services\IdempotencyService();
            $idempotencyKey = $idempotencyService->extractKey($request);

            if ($idempotencyKey) {
                $existingOrder = $idempotencyService->findExistingOrder($idempotencyKey, $userId, $mobileNumber);
                if ($existingOrder) {
                    \App\Services\SecurityAuditLogger::logSecurityEvent(
                        event: 'DUPLICATE_ORDER_BLOCKED',
                        target: "order:{$existingOrder->id}",
                        details: ['idempotency_key' => $idempotencyKey, 'user_id' => $userId],
                        level: 'info'
                    );

                    return response()->json([
                        'success'      => true,
                        'is_duplicate' => true,
                        'message'      => 'Order already placed (idempotent response).',
                        'order_id'     => $existingOrder->id,
                        'order_number' => $existingOrder->order_number ?? ("ORD-" . $existingOrder->id),
                    ], 200);
                }
            }

            /** @var \App\Models\Branch|null $branch */
            $branch = \App\Models\Branch::find($branchId);

            // --- 1. DYNAMIC DISTANCE & FEE CALCULATION ---
            $deliveryEval = $this->evaluateDeliveryParameters($isPickup, $branch, $validated);
            if (!$deliveryEval['success']) {
                return response()->json(['success' => false, 'message' => $deliveryEval['message']], 400);
            }
            $distanceKm = $deliveryEval['distance_km'];
            $deliveryFee = $deliveryEval['delivery_fee'];

            // --- 2. AUTHORITATIVE PRICE & TOTAL CALCULATION ---
            $itemsEval = $this->resolveItemsAndTotal($validated['items']);
            if (!$itemsEval['success']) {
                return response()->json(['success' => false, 'message' => $itemsEval['message']], 422);
            }
            $resolvedItems = $itemsEval['resolved_items'];
            $itemsTotal = $itemsEval['items_total'];
            $products = $itemsEval['products'];
            $authoritativeTotal = round($itemsTotal + $deliveryFee, 2);

            // --- 3. COD & PAYMENT METHOD FRAUD CHECK ---
            $paymentMethod = strtolower((string) ($validated['payment_method'] ?? 'online'));
            $isCod = in_array($paymentMethod, ['cash', 'cod', 'cash_on_delivery']);

            $codEval = $this->evaluateCodEligibility($user, $userId, $mobileNumber, $authoritativeTotal, $isPickup, $isCod);
            if (!$codEval['success']) {
                return response()->json($codEval['response'], 422);
            }
            $riskLevel = $codEval['risk_level'];

            // --- 4. STRICT BATCH STOCK & INGREDIENT VALIDATION ---
            $batchStockCheck = Product::validateBatchStock($branchId, $validated['items']);
            if (!$batchStockCheck['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $batchStockCheck['message']
                ], 422);
            }

            // --- 5. BRANCH CONSISTENCY ---
            foreach ($validated['items'] as $item) {
                $product = $products->get($item['product_id']);
                if ($product && $product->branch_id && (int) $product->branch_id !== (int) $branchId) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product '{$product->name}' is not available in the selected branch."
                    ], 400);
                }
            }

            // --- 6. SCHEDULED PICKUP DETAILS ---
            $scheduledPickupAt = null;
            $prepStartAt = null;
            $verificationCode = null;
            $prepTimeMinutes = 20;

            if ($isPickup) {
                $tz = \App\Services\PickupOrderService::DEFAULT_TIMEZONE;
                $scheduledPickupAt = \Carbon\Carbon::parse($validated['scheduled_pickup_at'], $tz);
                $prepTimeMinutes = (int) ($branch?->pickup_lead_time_minutes ?? 20);
                $prepStartAt = $scheduledPickupAt->copy()->subMinutes($prepTimeMinutes);

                $pickupService = new \App\Services\PickupOrderService(
                    new \App\Services\InventoryService(),
                    new \App\Services\OrderFulfillmentService(new \App\Services\InventoryService())
                );
                $verificationCode = $pickupService->generateVerificationCode();
            }

            // --- 7. TRANSACTIONAL CREATION WITH ROW-LEVEL LOCKS ---
            $records = DB::transaction(function () use (
                $validated, $branchId, $userId, $distanceKm, $deliveryFee,
                $resolvedItems, $authoritativeTotal, $isCod, $riskLevel, $idempotencyKey,
                $fulfillmentType, $isPickup, $scheduledPickupAt, $prepStartAt, $prepTimeMinutes, $verificationCode
            ) {
                $lockedBatchCheck = Product::validateBatchStock($branchId, $validated['items'], true);
                if (!$lockedBatchCheck['success']) {
                    throw new \Exception($lockedBatchCheck['message']);
                }

                $orderNumberService = new \App\Services\OrderNumberService();
                $customerOrderNumber = $orderNumberService->allocateForBranch($branchId);

                $order = Order::create([
                    'order_number'                => $customerOrderNumber,
                    'idempotency_key'             => $idempotencyKey,
                    'fulfillment_type'            => $fulfillmentType,
                    'order_source'                => Order::SOURCE_MOBILE_APP,
                    'user_id'                     => $userId,
                    'branch_id'                   => $branchId,
                    'customer_name'               => $validated['customer_name'],
                    'contact_number'              => $validated['mobile_number'],
                    'address'                     => $validated['address'] ?? null,
                    'latitude'                    => $validated['latitude'] ?? null,
                    'longitude'                   => $validated['longitude'] ?? null,
                    'landmark'                    => $validated['landmark'] ?? null,
                    'notes'                       => $validated['notes'] ?? null,
                    'pickup_notes'                => $validated['pickup_notes'] ?? null,
                    'payment_method'              => $validated['payment_method'] ?? 'cash',
                    'payment_status'              => Order::PAYMENT_STATUS_UNPAID,
                    'is_cod'                      => $isCod,
                    'risk_level'                  => $riskLevel,
                    'total_amount'                => $authoritativeTotal,
                    'scheduled_pickup_at'         => $scheduledPickupAt,
                    'estimated_prep_time_minutes' => $prepTimeMinutes,
                    'prep_start_at'               => $prepStartAt,
                    'pickup_verification_code'    => $verificationCode,
                    'status'                      => 'pending',
                ]);

                foreach ($resolvedItems as $resolved) {
                    $order->items()->create($resolved);
                }

                $delivery = null;
                if (!$isPickup) {
                    $delivery = Delivery::create([
                        'order_id'         => $order->id,
                        'customer_name'    => $validated['customer_name'],
                        'customer_phone'   => $validated['mobile_number'],
                        'customer_address' => $validated['address'],
                        'latitude'         => $validated['latitude'],
                        'longitude'        => $validated['longitude'],
                        'landmark'         => $validated['landmark'] ?? null,
                        'notes'            => $validated['notes'] ?? null,
                        'delivery_fee'     => $deliveryFee,
                        'distance_km'      => $distanceKm,
                        'status'           => Delivery::STATUS_PENDING,
                        'is_active'        => true,
                    ]);
                }

                return ['order' => $order, 'delivery' => $delivery];
            });

            $order = $records['order'];
            $delivery = $records['delivery'];

            // --- 8. AUDIT LOGGING ---
            \App\Services\SecurityAuditLogger::logSecurityEvent(
                event: $isPickup ? 'PICKUP_ORDER_CREATED' : 'COD_ORDER_CREATED',
                target: "order:{$order->id}",
                details: [
                    'order_number'        => $order->order_number,
                    'fulfillment_type'    => $fulfillmentType,
                    'total_amount'        => (float) $authoritativeTotal,
                    'risk_level'          => $riskLevel,
                    'user_id'             => $userId,
                    'scheduled_pickup_at' => $scheduledPickupAt?->toIso8601String(),
                ],
                level: 'info'
            );

            // --- 9. POST-COMMIT REALTIME BROADCASTING ---
            try {
                event(new OrderCreated($order->load('branch')));
                if ($delivery) {
                    event(new \App\Events\OrderStatusUpdated($delivery->fresh(), 'customer', null));
                }
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed but order saved: ' . $e->getMessage());
            }

            return response()->json([
                'success'                  => true,
                'message'                  => $isPickup ? 'Pickup order placed successfully.' : 'Order placed successfully',
                'order_id'                 => $order->id,
                'order_number'             => $order->order_number,
                'fulfillment_type'         => $order->fulfillment_type,
                'scheduled_pickup_at'      => $order->scheduled_pickup_at?->toIso8601String(),
                'pickup_verification_code' => $order->pickup_verification_code,
                'status'                   => $order->status,
                'total_amount'             => (float) $order->total_amount,
                'delivery_fee'             => (float) $deliveryFee,
                'delivery_id'              => $delivery?->id,
            ], 201);

        } catch (\Throwable $e) {
            Log::error('Order API Critical Failure', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('local') 
                    ? $e->getMessage() 
                    : 'Order submission failed. Please check your internet or ingredients.'
            ], 500);
        }
    }

    /**
     * Retrieve order details with full Buy Again item snapshots.
     * GET /api/v1/orders/{id}
     * GET /api/v1/customer/orders/{id}
     */
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $order = Order::with(['delivery.rider', 'items.product', 'branch'])->find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found'], 404);
            }

            $user = $request->user();
            if ($user && $user->role === 'customer') {
                $isOwner = ((int)$order->user_id === (int)$user->id) || ($user->mobile_number && $order->contact_number === $user->mobile_number);
                if (!$isOwner) {
                    \App\Services\SecurityAuditLogger::logSecurityEvent(
                        event: 'IDOR_ATTEMPT_BLOCKED',
                        target: "order:{$id}",
                        details: ['requesting_user_id' => $user->id, 'order_owner_id' => $order->user_id],
                        level: 'warning'
                    );

                    return response()->json(['success' => false, 'message' => 'Unauthorized access to order.'], 403);
                }
            } elseif (!$user && $order->user_id) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
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
                    'id'            => $order->id,
                    'order_number'  => $order->order_number ?? "ORD-{$order->id}",
                    'status'        => $order->status,
                    'status_label'  => $statusLabel,
                    'branch_id'     => $order->branch_id,
                    'branch_name'   => $order->branch?->name ?? 'Maki Store',
                    'subtotal'       => (float) $order->items->sum('line_total'),
                    'delivery_fee'  => (float) ($order->delivery?->delivery_fee ?? 0),
                    'total_amount'  => (float) $order->total_amount,
                    'payment_method'=> $order->payment_method ?? 'cash',
                    'customer_name' => $order->customer_name,
                    'address'       => $order->address,
                    'created_at'    => $order->created_at->toIso8601String(),
                    'delivery'      => $order->delivery ? [
                        'status'        => $order->delivery->status,
                        'status_label'  => $order->delivery->getStatusLabel(),
                        'status_color'  => $order->delivery->getStatusColor(),
                        'rider_name'    => $order->delivery->rider?->name,
                        'updated_at'    => $order->delivery->updated_at,
                    ] : null,
                    'items' => $order->items->map(function ($item) {
                        $product    = $item->product;
                        $unitPrice  = $item->unit_price;
                        $lineTotal  = $item->line_total;
                        $inStock    = $product && $product->is_available && $product->stock > 0;

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
                            // Live product status (for Buy Again checks)
                            'is_available'  => $inStock,
                            'current_price' => $product ? (float) $product->selling_price : $unitPrice,
                            'current_stock' => $product ? (int) $product->stock : 0,
                        ];
                    }),
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Order API Show Failure', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Error retrieving order.'
            ], 500);
        }
    }

    /**
     * Customer-Safe Real-time Delivery Tracking endpoint.
     * GET /api/v1/customer/orders/{id}/tracking
     * GET /api/v1/orders/{id}/tracking
     */
    public function tracking(Request $request, $id): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            /** @var Order|null $order */
            $order = Order::with(['delivery.rider', 'branch', 'items.product'])->find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
            }

            // Strict Customer Authorization: Only the owner of the order or Admin can track
            $isOwner = (int) $order->user_id === (int) $user->id;
            $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();

            if (!$isOwner && !$isAdmin) {
                return response()->json(['success' => false, 'message' => 'You are not authorized to track this order.'], 403);
            }

            $delivery = $order->delivery;
            if (!$delivery) {
                if ($order->isPickup()) {
                    $statusInstructions = match ($order->status) {
                        'pending'          => 'Your pickup order has been placed and is awaiting branch confirmation.',
                        'confirmed'        => 'Your order is confirmed and scheduled for preparation.',
                        'preparing'        => 'The kitchen is currently preparing your order.',
                        'ready_for_pickup' => 'Your order is ready! Please proceed to the counter and present your verification code.',
                        'customer_arrived' => 'Staff has noted your arrival. Your order will be handed to you shortly.',
                        'completed'        => 'Pickup completed. Thank you for ordering at MAKI DESU!',
                        'no_show'          => 'Pickup marked as missed / no-show. Please contact branch support.',
                        'cancelled'        => 'This order has been cancelled.',
                        default            => 'Order status updated.',
                    };

                    return response()->json([
                        'success' => true,
                        'data' => [
                            'order_id'                 => $order->id,
                            'order_number'             => $order->order_number ?? "ORD-{$order->id}",
                            'order_status'             => $order->status,
                            'fulfillment_type'         => Order::FULFILLMENT_PICKUP,
                            'is_pickup'                => true,
                            'delivery_id'              => null,
                            'delivery_status'          => null,
                            'delivery_status_label'    => 'Store Pickup',
                            'is_tracking_available'    => false,
                            'tracking_state'           => 'pickup',
                            'pickup_status'            => $order->status,
                            'status_instruction'       => $statusInstructions,
                            'scheduled_pickup_at'      => $order->scheduled_pickup_at?->toIso8601String(),
                            'scheduled_pickup_display' => $order->scheduled_pickup_at ? $order->scheduled_pickup_at->timezone(\App\Services\PickupOrderService::DEFAULT_TIMEZONE)->format('M d, Y • g:i A') : null,
                            'pickup_verification_code' => $order->pickup_verification_code,
                            'pickup_notes'             => $order->pickup_notes,
                            'branch'                   => [
                                'id'        => $order->branch?->id,
                                'name'      => $order->branch?->name,
                                'address'   => $order->branch?->address,
                                'latitude'  => $order->branch?->latitude ? (float) $order->branch->latitude : null,
                                'longitude' => $order->branch?->longitude ? (float) $order->branch->longitude : null,
                            ],
                            'message'                  => $statusInstructions,
                        ]
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'data' => [
                        'order_id'              => $order->id,
                        'order_number'          => $order->order_number ?? "ORD-{$order->id}",
                        'order_status'          => $order->status,
                        'delivery_id'           => null,
                        'delivery_status'       => null,
                        'delivery_status_label' => 'No Delivery',
                        'is_tracking_available' => false,
                        'tracking_state'        => 'no_delivery',
                        'message'               => 'No delivery record has been initiated for this order.',
                    ]
                ]);
            }

            // Determine tracking state
            $deliveryStatus = $delivery->status;
            $isDelivered = in_array($deliveryStatus, [Delivery::STATUS_DELIVERED]);
            $isCancelled = in_array($deliveryStatus, [Delivery::STATUS_CANCELLED, Delivery::STATUS_FAILED]) || $order->status === 'cancelled';
            $isActiveTransit = in_array($deliveryStatus, [Delivery::STATUS_PICKED_UP, Delivery::STATUS_OUT_FOR_DELIVERY]) && !$isDelivered && !$isCancelled;
            $isRiderAssigned = in_array($deliveryStatus, [Delivery::STATUS_ASSIGNED]) && !$isDelivered && !$isCancelled;

            $trackingState = match (true) {
                $isDelivered     => 'delivered',
                $isCancelled     => 'cancelled',
                $isActiveTransit => 'active',
                $isRiderAssigned => 'assigned',
                default          => 'waiting',
            };

            $isTrackingAvailable = $isActiveTransit;

            $rider = $delivery->rider;
            $riderData = null;

            if ($rider) {
                $lastUpdated = $rider->location_updated_at ?? $rider->last_active_at;
                $secondsAgo = $lastUpdated ? (int) now()->diffInSeconds($lastUpdated) : 9999;

                if ($secondsAgo < 30) {
                    $signalStatus = 'live';
                } elseif ($secondsAgo <= 120) {
                    $signalStatus = 'signal_delayed';
                } else {
                    $signalStatus = 'offline';
                }

                $riderData = [
                    'id'                 => $rider->id,
                    'name'               => $rider->name,
                    'phone'              => $rider->phone,
                    'latitude'           => $isTrackingAvailable ? ($rider->latitude ? (float) $rider->latitude : null) : null,
                    'longitude'          => $isTrackingAvailable ? ($rider->longitude ? (float) $rider->longitude : null) : null,
                    'accuracy'           => $isTrackingAvailable ? (float) ($rider->accuracy ?? 10) : null,
                    'speed'              => $isTrackingAvailable ? (float) ($rider->speed ?? 0) : null,
                    'heading'            => $isTrackingAvailable ? (float) ($rider->heading ?? 0) : null,
                    'signal_status'      => $isTrackingAvailable ? $signalStatus : null,
                    'seconds_ago'        => $isTrackingAvailable ? $secondsAgo : null,
                    'last_updated_at'    => $isTrackingAvailable && $lastUpdated ? $lastUpdated->toIso8601String() : null,
                    'last_updated_human' => $isTrackingAvailable && $lastUpdated ? $lastUpdated->diffForHumans() : null,
                ];
            }

            $destinationLat = $delivery->latitude ? (float) $delivery->latitude : ($order->latitude ? (float) $order->latitude : null);
            $destinationLng = $delivery->longitude ? (float) $delivery->longitude : ($order->longitude ? (float) $order->longitude : null);

            $proofOfDeliveryUrl = $delivery->proof_of_delivery_url;

            $branch = $order->branch;
            $branchId = $branch?->id;
            $branchName = $branch?->name ?? 'Store Branch';
            $branchAddress = $branch?->address;
            $branchLat = $branch?->latitude ? (float) $branch->latitude : null;
            $branchLng = $branch?->longitude ? (float) $branch->longitude : null;

            $pickupBranch = [
                'id'        => $branchId,
                'name'      => $branchName,
                'address'   => $branchAddress,
                'latitude'  => $branchLat,
                'longitude' => $branchLng,
                'maps_url'  => ($branchLat && $branchLng)
                    ? "https://www.google.com/maps/dir/?api=1&destination={$branchLat},{$branchLng}"
                    : null,
            ];

            $customerDestination = [
                'customer_name'    => $delivery->customer_name ?? $order->customer_name,
                'customer_phone'   => $delivery->customer_phone ?? $order->contact_number,
                'customer_address' => $delivery->customer_address ?? $order->address,
                'latitude'         => $destinationLat,
                'longitude'        => $destinationLng,
                'landmark'         => $delivery->landmark ?? $order->landmark,
                'maps_url'         => ($destinationLat && $destinationLng)
                    ? "https://www.google.com/maps/dir/?api=1&destination={$destinationLat},{$destinationLng}"
                    : null,
            ];

            $routePhase = match ($deliveryStatus) {
                'ready_for_pickup'  => 'unassigned',
                'assigned_to_rider' => 'rider_to_store',
                'picked_up'         => 'store_to_customer',
                'in_transit'        => 'rider_to_customer',
                'delivered'         => 'completed',
                default             => 'unassigned',
            };

            $activeDestination = match ($routePhase) {
                'rider_to_store' => $pickupBranch,
                'store_to_customer', 'rider_to_customer' => $customerDestination,
                default => null,
            };

            $routeData = null;
            if ($isTrackingAvailable && $rider && $rider->latitude && $rider->longitude) {
                $targetLat = ($routePhase === 'rider_to_store' && $branchLat) ? $branchLat : $destinationLat;
                $targetLng = ($routePhase === 'rider_to_store' && $branchLng) ? $branchLng : $destinationLng;

                if ($targetLat && $targetLng) {
                    $routeData = app(\App\Services\RoutingService::class)->getRoute(
                        (float) $rider->latitude,
                        (float) $rider->longitude,
                        (float) $targetLat,
                        (float) $targetLng
                    );
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id'              => $order->id,
                    'order_number'          => $order->order_number ?? "ORD-{$order->id}",
                    'order_status'          => $order->status,
                    'delivery_id'           => $delivery->id,
                    'delivery_status'       => $delivery->status,
                    'delivery_status_label' => $delivery->getStatusLabel(),
                    'delivery_type'         => $delivery->delivery_type,
                    'is_tracking_available' => $isTrackingAvailable,
                    'tracking_state'        => $trackingState,
                    'route_phase'           => $routePhase,
                    'active_destination'    => $activeDestination,
                    'pickup_branch'         => $pickupBranch,
                    'customer_destination'  => $customerDestination,
                    'rider'                 => $riderData,
                    'destination'           => $customerDestination,
                    'branch'                => $pickupBranch,
                    'route'                 => $routeData,
                    'realtime' => [
                        'channel'      => 'private-customer.order.' . $order->id,
                        'event'        => 'rider.location.updated',
                        'status_event' => 'order-status-updated',
                    ],
                    'proof_of_delivery_url' => $proofOfDeliveryUrl,
                    'created_at'            => $order->created_at?->toIso8601String(),
                    'updated_at'            => $order->updated_at?->toIso8601String(),
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Order API Tracking Failure', [
                'message'  => $e->getMessage(),
                'order_id' => $id,
                'trace'    => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Error retrieving order tracking.'
            ], 500);
        }
    }

    /**
     * Customer-Safe Road Route Calculation endpoint.
     * GET /api/v1/customer/orders/{id}/route
     * GET /api/v1/orders/{id}/route
     */
    public function route(Request $request, $id, \App\Services\RoutingService $routingService): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
            }

            /** @var Order|null $order */
            $order = Order::with(['delivery.rider', 'branch'])->find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found.'], 404);
            }

            // Strict Customer Authorization: Only the owner of the order or Admin can view route
            $isOwner = (int) $order->user_id === (int) $user->id;
            $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();

            if (!$isOwner && !$isAdmin) {
                return response()->json(['success' => false, 'message' => 'You are not authorized to access this route.'], 403);
            }

            $delivery = $order->delivery;
            if (!$delivery) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active delivery for this order.',
                ], 404);
            }

            $rider = $delivery->rider;
            $branch = $order->branch ?? $rider?->branch;

            // Determine origin coordinates (Rider GPS or Branch origin fallback)
            $originLat = $rider?->latitude ? (float) $rider->latitude : ($branch?->latitude ? (float) $branch->latitude : 14.229371);
            $originLng = $rider?->longitude ? (float) $rider->longitude : ($branch?->longitude ? (float) $branch->longitude : 121.328383);

            // Determine destination coordinates
            $destLat = $delivery->latitude ? (float) $delivery->latitude : ($order->latitude ? (float) $order->latitude : null);
            $destLng = $delivery->longitude ? (float) $delivery->longitude : ($order->longitude ? (float) $order->longitude : null);

            $branchLat = $branch?->latitude ? (float) $branch->latitude : null;
            $branchLng = $branch?->longitude ? (float) $branch->longitude : null;

            $pickupBranch = [
                'id'        => $branch?->id,
                'name'      => $branch?->name ?? 'Store Branch',
                'address'   => $branch?->address,
                'latitude'  => $branchLat,
                'longitude' => $branchLng,
            ];

            $customerDestination = [
                'customer_name'    => $delivery->customer_name ?? $order->customer_name,
                'customer_address' => $delivery->customer_address ?? $order->address,
                'latitude'         => $destLat,
                'longitude'        => $destLng,
            ];

            $routePhase = match ($delivery->status) {
                'ready_for_pickup', 'assigned_to_rider' => 'rider_to_store',
                'picked_up', 'in_transit'               => 'rider_to_customer',
                'delivered'                             => 'completed',
                default                                 => 'rider_to_store',
            };

            // In Phase 1 (assigned_to_rider), the destination of the route is the STORE
            // In Phase 2 (picked_up, in_transit), the destination of the route is the CUSTOMER
            $targetLat = ($routePhase === 'rider_to_store' && $branchLat) ? $branchLat : $destLat;
            $targetLng = ($routePhase === 'rider_to_store' && $branchLng) ? $branchLng : $destLng;

            if (!$targetLat || !$targetLng) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination coordinates are not set for this delivery phase.',
                ], 422);
            }

            $routeResult = $routingService->getRoute($originLat, $originLng, $targetLat, $targetLng);

            $activeDestination = ($routePhase === 'rider_to_store') ? $pickupBranch : $customerDestination;

            return response()->json([
                'success'              => true,
                'order_id'             => $order->id,
                'order_number'         => $order->order_number ?? "ORD-{$order->id}",
                'status'               => $delivery->status,
                'route_phase'          => $routePhase,
                'active_destination'   => $activeDestination,
                'pickup_branch'        => $pickupBranch,
                'customer_destination' => $customerDestination,
                'rider'                => [
                    'id'        => $rider?->id,
                    'name'      => $rider?->name ?? 'Assigned Rider',
                    'latitude'  => $originLat,
                    'longitude' => $originLng,
                ],
                'destination'          => $activeDestination,
                'route'                => $routeResult,
            ]);
        } catch (\Throwable $e) {
            Log::error('Order API Route Calculation Failure', [
                'message'  => $e->getMessage(),
                'order_id' => $id,
                'trace'    => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Error calculating route.'
            ], 500);
        }
    }

    /**
     * Check if the customer account is restricted, suspended, or deactivated.
     */
    private function checkAccountRestrictions(?\App\Models\User $user): ?JsonResponse
    {
        if (!$user) {
            return null;
        }

        if (method_exists($user, 'isSuspended') && $user->isSuspended()) {
            return response()->json([
                'success'        => false,
                'account_status' => 'suspended',
                'message'        => 'Your account has been suspended. Please contact MAKI DESU support.',
            ], 403);
        }

        if (method_exists($user, 'isDeactivated') && $user->isDeactivated()) {
            return response()->json([
                'success'        => false,
                'account_status' => 'deactivated',
                'message'        => 'This account is currently inactive. Please contact MAKI DESU support.',
            ], 403);
        }

        if (!empty($user->is_order_restricted)) {
            return response()->json([
                'success'        => false,
                'account_status' => 'restricted',
                'message'        => 'Order placement is temporarily restricted on your account. Please contact support.',
            ], 403);
        }

        return null;
    }

    /**
     * Calculate delivery distance and authoritative delivery fee for delivery fulfillment.
     */
    private function evaluateDeliveryParameters(bool $isPickup, ?\App\Models\Branch $branch, array $validated): array
    {
        $distanceKm = 0.0;
        $deliveryFee = 0.0;
        $breakdown = null;

        if (!$isPickup) {
            if (!$branch || !$branch->latitude || !$branch->longitude) {
                return [
                    'success' => false,
                    'message' => 'Store branch delivery location is not configured. Please contact support.',
                ];
            }

            if (!isset($validated['latitude'], $validated['longitude']) || $validated['latitude'] === null || $validated['longitude'] === null) {
                return [
                    'success' => false,
                    'message' => 'Delivery location coordinates are required for delivery orders.',
                ];
            }

            $earthRadius = 6371; // km
            $latFrom = deg2rad((float) $branch->latitude);
            $lonFrom = deg2rad((float) $branch->longitude);
            $latTo = deg2rad((float) $validated['latitude']);
            $lonTo = deg2rad((float) $validated['longitude']);

            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;

            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
            
            $distanceKm = round($angle * $earthRadius, 2);

            if ($distanceKm < 0 || !is_finite($distanceKm)) {
                return [
                    'success' => false,
                    'message' => 'Invalid delivery distance calculated. Please verify destination coordinates.',
                ];
            }

            if (!$branch->isWithinRadius($distanceKm)) {
                return [
                    'success' => false,
                    'message' => 'Out of delivery range. The maximum distance is ' . ($branch->delivery_radius_km ?? 15) . 'km.',
                ];
            }

            $feeService = app(\App\Services\DeliveryFeeService::class);
            $breakdown = $feeService->calculateFee($branch, $distanceKm);
            $deliveryFee = $breakdown['delivery_fee'];
        }

        return [
            'success'      => true,
            'distance_km'  => $distanceKm,
            'delivery_fee' => $deliveryFee,
            'breakdown'    => $breakdown,
        ];
    }

    /**
     * Resolve items from authoritative database prices.
     */
    private function resolveItemsAndTotal(array $rawItems): array
    {
        $productIds = collect($rawItems)->pluck('product_id')->unique()->all();
        $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $itemsTotal = 0.0;
        $resolvedItems = [];
        foreach ($rawItems as $itemData) {
            $product = $products->get($itemData['product_id']);
            if (!$product) {
                return ['success' => false, 'message' => 'Product not found.'];
            }

            $unitPrice = (float) $product->selling_price;
            $qty       = (int) $itemData['quantity'];

            $addonTotal = 0.0;
            $normalizedAddons = [];
            if (!empty($itemData['selected_addons'])) {
                $rawAddons = is_string($itemData['selected_addons']) 
                    ? json_decode($itemData['selected_addons'], true) 
                    : $itemData['selected_addons'];

                if (is_array($rawAddons)) {
                    $effectiveProductAddons = $product->getEffectiveAddons()->keyBy('id');

                    foreach ($rawAddons as $rawAd) {
                        $addonId = $rawAd['addon_id'] ?? $rawAd['id'] ?? null;
                        if (!$addonId) continue;

                        /** @var \App\Models\AddOn|null $adModel */
                        $adModel = \App\Models\AddOn::find($addonId);
                        if (!$adModel || !$adModel->is_active) {
                            return ['success' => false, 'message' => "Selected add-on (#{$addonId}) is currently inactive or not found."];
                        }

                        // Verify that this add-on is assigned to the selected product
                        if (!$effectiveProductAddons->has($adModel->id)) {
                            return [
                                'success' => false,
                                'message' => "Add-on '{$adModel->name}' is not assigned to product '{$product->name}'."
                            ];
                        }

                        $adName = $adModel->name;
                        // Authoritative backend pricing (client price discarded)
                        $adPrice = (float) $adModel->price;
                        $adQty = max(1, (float) ($rawAd['quantity'] ?? 1));

                        // Validate max_quantity if defined on pivot
                        $pivot = $product->addons()->where('addon_id', $adModel->id)->first()?->pivot;
                        if ($pivot && $pivot->max_quantity && $adQty > $pivot->max_quantity) {
                            return [
                                'success' => false,
                                'message' => "Maximum quantity for '{$adModel->name}' is {$pivot->max_quantity}."
                            ];
                        }

                        $adLineTotal = round($adPrice * $adQty, 2);
                        $addonTotal += $adLineTotal;

                        $normalizedAddons[] = [
                            'addon_id'   => $adModel->id,
                            'name'       => $adName,
                            'price'      => $adPrice,
                            'unit_price' => $adPrice,
                            'quantity'   => $adQty,
                            'subtotal'   => $adLineTotal,
                            'group_id'   => $rawAd['group_id'] ?? null,
                            'group_name' => $rawAd['group_name'] ?? null,
                        ];
                    }
                }
            }

            $lineTotal = round(($unitPrice + $addonTotal) * $qty, 2);
            $itemsTotal += $lineTotal;

            $resolvedItems[] = [
                'product_id'      => (int) $itemData['product_id'],
                'quantity'        => $qty,
                'price'           => $unitPrice,
                'unit_price'      => $unitPrice,
                'line_total'      => $lineTotal,
                'addon_total'     => round($addonTotal * $qty, 2),
                'selected_addons' => $normalizedAddons,
                'product_name'    => $product->name,
                'image_path'      => $product->image_path,
                'notes'           => $itemData['notes'] ?? null,
            ];
        }

        return [
            'success'        => true,
            'products'       => $products,
            'resolved_items' => $resolvedItems,
            'items_total'    => $itemsTotal,
        ];
    }

    /**
     * Check COD eligibility and risk assessment.
     */
    private function evaluateCodEligibility(
        ?\App\Models\User $user,
        ?int $userId,
        string $mobileNumber,
        float $authoritativeTotal,
        bool $isPickup,
        bool $isCod
    ): array {
        $riskLevel = 'LOW_RISK';

        if (!$isPickup && $isCod) {
            $codEligibilityService = new \App\Services\CodEligibilityService(
                new \App\Services\CustomerRiskService(new \App\Services\CustomerTrustService())
            );

            $eligibility = $codEligibilityService->checkEligibility($user ?? $userId, $authoritativeTotal, $mobileNumber);
            $riskLevel = $eligibility['risk_level'];

            if (!$eligibility['eligible']) {
                \App\Services\SecurityAuditLogger::logSecurityEvent(
                    event: 'COD_ORDER_REJECTED',
                    target: "user:" . ($userId ?? $mobileNumber),
                    details: [
                        'order_amount' => $authoritativeTotal,
                        'risk_level'   => $riskLevel,
                        'reason'       => $eligibility['reason'],
                    ],
                    level: 'warning'
                );

                return [
                    'success'  => false,
                    'response' => [
                        'success'               => false,
                        'cod_eligible'          => false,
                        'risk_level'            => $riskLevel,
                        'requires_verification' => $eligibility['requires_verification'],
                        'message'               => $eligibility['reason'],
                    ],
                ];
            }
        }

        return [
            'success'    => true,
            'risk_level' => $riskLevel,
        ];
    }
}

