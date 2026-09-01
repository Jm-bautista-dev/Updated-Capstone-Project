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
            $validated = $request->validate([
                'customer_name'  => 'required|string|max:255',
                'mobile_number'  => 'required|string|max:20',
                'address'        => 'required|string',
                'items'          => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity'   => 'required|numeric|min:0.1',
                'items.*.price'      => 'required|numeric|min:0',
                'total_amount'   => 'required|numeric|min:0',
                'delivery_fee'   => 'nullable|numeric|min:0',
                'distance_km'    => 'nullable|numeric|min:0',
                'latitude'       => 'required|numeric|between:-90,90',
                'longitude'      => 'required|numeric|between:-180,180',
                'landmark'       => 'nullable|string|max:255',
                'notes'          => 'nullable|string',
                'payment_method' => 'nullable|string|max:50',
                'branch_id'      => 'nullable|exists:branches,id'
            ]);

            $branchId = $validated['branch_id'] ?? 1;
            $user = $request->user();
            $userId = $user?->id;
            $mobileNumber = $validated['mobile_number'];

            // --- 0. ACCOUNT GOVERNANCE & RESTRICTION CHECK ---
            if ($user) {
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

            // --- 1. DYNAMIC DISTANCE & AUTHORITATIVE FEE CALCULATION ---
            $distanceKm = $validated['distance_km'] ?? null;
            $deliveryFee = 0.0;
            
            /** @var \App\Models\Branch|null $branch */
            $branch = \App\Models\Branch::find($branchId);

            if ($branch && $branch->latitude && $branch->longitude) {
                // Haversine Formula
                $earthRadius = 6371; // km
                $latFrom = deg2rad((float) $branch->latitude);
                $lonFrom = deg2rad((float) $branch->longitude);
                $latTo = deg2rad((float) $validated['latitude']);
                $lonTo = deg2rad((float) $validated['longitude']);

                $latDelta = $latTo - $latFrom;
                $lonDelta = $lonTo - $lonFrom;

                $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                    cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
                
                $calculatedDistance = $angle * $earthRadius;
                $distanceKm = round($calculatedDistance, 2);

                // STRICT DELIVERY RADIUS ENFORCEMENT
                if (!$branch->isWithinRadius($distanceKm)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Out of delivery range. The maximum distance is ' . $branch->delivery_radius_km . 'km.'
                    ], 400);
                }

                if (method_exists($branch, 'calculateDeliveryFee')) {
                    $deliveryFee = (float) $branch->calculateDeliveryFee($distanceKm);
                }
            }

            // --- 2. AUTHORITATIVE SERVER-SIDE PRICE & TOTAL CALCULATION ---
            // Never trust client-submitted prices or totals
            $productIds = collect($validated['items'])->pluck('product_id')->unique()->all();
            $products   = Product::whereIn('id', $productIds)->get()->keyBy('id');

            $itemsTotal = 0.0;
            $resolvedItems = [];
            foreach ($validated['items'] as $itemData) {
                $product   = $products->get($itemData['product_id']);
                if (!$product) {
                    return response()->json(['success' => false, 'message' => "Product not found."], 422);
                }

                $unitPrice = (float) $product->selling_price;
                $qty       = (int) $itemData['quantity'];
                $lineTotal = round($unitPrice * $qty, 2);
                $itemsTotal += $lineTotal;

                $resolvedItems[] = [
                    'product_id'   => (int) $itemData['product_id'],
                    'quantity'     => $qty,
                    'price'        => $unitPrice,
                    'unit_price'   => $unitPrice,
                    'line_total'   => $lineTotal,
                    'product_name' => $product->name,
                    'image_path'   => $product->image_path,
                    'notes'        => $itemData['notes'] ?? null,
                ];
            }

            $authoritativeTotal = round($itemsTotal + $deliveryFee, 2);

            // --- 3. COD & PAYMENT METHOD FRAUD ELIGIBILITY CHECK ---
            $paymentMethod = strtolower((string) ($validated['payment_method'] ?? 'online'));
            $isCod = in_array($paymentMethod, ['cash', 'cod', 'cash_on_delivery']);

            $codEligibilityService = new \App\Services\CodEligibilityService(
                new \App\Services\CustomerRiskService(new \App\Services\CustomerTrustService())
            );

            $eligibility = $codEligibilityService->checkEligibility($user ?? $userId, $authoritativeTotal, $mobileNumber);
            $riskLevel = $eligibility['risk_level'];

            if ($isCod && !$eligibility['eligible']) {
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

                return response()->json([
                    'success'               => false,
                    'cod_eligible'          => false,
                    'risk_level'            => $riskLevel,
                    'requires_verification' => $eligibility['requires_verification'],
                    'message'               => $eligibility['reason'],
                ], 422);
            }

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

            // --- 6. TRANSACTIONAL CREATION WITH ROW-LEVEL LOCKS ---
            $records = DB::transaction(function () use (
                $validated, $branchId, $userId, $distanceKm, $deliveryFee,
                $resolvedItems, $authoritativeTotal, $isCod, $riskLevel, $idempotencyKey
            ) {
                // Strict row-level lock on ingredient stocks during transaction
                $lockedBatchCheck = Product::validateBatchStock($branchId, $validated['items'], true);
                if (!$lockedBatchCheck['success']) {
                    throw new \Exception($lockedBatchCheck['message']);
                }

                $orderNumberService = new \App\Services\OrderNumberService();
                $customerOrderNumber = $orderNumberService->allocateForBranch($branchId);

                $order = Order::create([
                    'order_number'    => $customerOrderNumber,
                    'idempotency_key' => $idempotencyKey,
                    'user_id'         => $userId,
                    'branch_id'       => $branchId,
                    'customer_name'   => $validated['customer_name'],
                    'contact_number'  => $validated['mobile_number'],
                    'address'         => $validated['address'],
                    'latitude'        => $validated['latitude'],
                    'longitude'       => $validated['longitude'],
                    'landmark'        => $validated['landmark'] ?? null,
                    'notes'           => $validated['notes'] ?? null,
                    'payment_method'  => $validated['payment_method'] ?? 'cash',
                    'is_cod'          => $isCod,
                    'risk_level'      => $riskLevel,
                    'total_amount'    => $authoritativeTotal,
                    'status'          => 'pending',
                ]);

                foreach ($resolvedItems as $resolved) {
                    $order->items()->create($resolved);
                }

                $delivery = Delivery::create([
                    'order_id'         => $order->id,
                    'customer_name'    => $validated['customer_name'],
                    'customer_phone'   => $validated['mobile_number'],
                    'customer_address' => $validated['address'],
                    'latitude'         => $validated['latitude'],
                    'longitude'        => $validated['longitude'],
                    'landmark'         => $validated['landmark'] ?? null,
                    'notes'            => $validated['notes'] ?? null,
                    'delivery_type'    => 'internal',
                    'delivery_fee'     => $deliveryFee,
                    'distance_km'      => $distanceKm,
                    'status'           => 'waiting_for_kitchen',
                ]);

                return [
                    'order'    => $order,
                    'delivery' => $delivery,
                ];
            });

            if ($isCod) {
                \App\Services\SecurityAuditLogger::logSecurityEvent(
                    event: 'COD_ORDER_CREATED',
                    target: "order:{$records['order']->id}",
                    details: [
                        'order_number' => $records['order']->order_number,
                        'total_amount' => $authoritativeTotal,
                        'risk_level'   => $riskLevel,
                        'user_id'      => $userId,
                    ],
                    level: 'info'
                );
            }

            // --- 7. POST-COMMIT REALTIME BROADCASTING ---
            try {
                broadcast(new OrderCreated($records['order']->load('branch')));
                broadcast(new \App\Events\OrderStatusUpdated($records['delivery']->fresh(), 'customer', null));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed but order saved: ' . $e->getMessage());
            }

            return response()->json([
                'success'      => true,
                'message'      => 'Order placed successfully',
                'order_id'     => $records['order']->id,
                'order_number' => $records['order']->order_number,
                'total_amount' => $records['order']->total_amount,
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
}
