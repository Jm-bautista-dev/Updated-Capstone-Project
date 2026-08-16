<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use App\Models\IngredientStock;
use App\Utils\UnitConverter;
use App\Events\OrderCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiOrderController extends Controller
{
    /**
     * List orders for the authenticated mobile user.
     */
    public function index(Request $request)
    {
        try {
            $orders = Order::with(['delivery'])
                ->where('user_id', $request->user()?->id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $orders
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
    public function store(Request $request)
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
                'branch_id'      => 'nullable|exists:branches,id'
            ]);

            $branchId = $validated['branch_id'] ?? 1;
            $userId = $request->user()?->id;

            // --- 0. DYNAMIC DISTANCE & FEE CALCULATION ---
            $distanceKm = $validated['distance_km'] ?? null;
            $deliveryFee = $validated['delivery_fee'] ?? 0;
            
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

                // Use branch delivery calculation logic if available
                if (method_exists($branch, 'calculateDeliveryFee')) {
                    $deliveryFee = $branch->calculateDeliveryFee($distanceKm);
                }
            }

            // --- 1. STRICT BATCH STOCK & INGREDIENT VALIDATION ---
            $batchStockCheck = Product::validateBatchStock($branchId, $validated['items']);
            if (!$batchStockCheck['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $batchStockCheck['message']
                ], 422);
            }

            // --- 2. BRANCH CONSISTENCY ---
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if ($product && $product->branch_id && (int) $product->branch_id !== (int) $branchId) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product '{$product->name}' is not available in the selected branch."
                    ], 400);
                }
            }

            // --- 3. TRANSACTIONAL CREATION ---
            $records = DB::transaction(function () use ($validated, $branchId, $userId, $distanceKm, $deliveryFee) {
                $itemsTotal = collect($validated['items'])->sum(fn($item) => $item['quantity'] * $item['price']);

                $order = Order::create([
                    'user_id'        => $userId,
                    'branch_id'      => $branchId,
                    'customer_name'  => $validated['customer_name'],
                    'contact_number' => $validated['mobile_number'],
                    'address'        => $validated['address'],
                    'latitude'       => $validated['latitude'],
                    'longitude'      => $validated['longitude'],
                    'landmark'       => $validated['landmark'] ?? null,
                    'notes'          => $validated['notes'] ?? null,
                    'total_amount'   => $itemsTotal + $deliveryFee, // Accurately calculate total from items + fee
                    'status'         => 'pending',
                ]);

                foreach ($validated['items'] as $itemData) {
                    $order->items()->create([
                        'product_id' => $itemData['product_id'],
                        'quantity'   => $itemData['quantity'],
                        'price'      => $itemData['price'],
                    ]);
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

            // --- 4. POST-COMMIT REALTIME BROADCASTING ---
            // Guaranteed to fire strictly AFTER database transaction has successfully committed
            try {
                broadcast(new OrderCreated($records['order']->load('branch')));
                broadcast(new \App\Events\OrderStatusUpdated($records['delivery']->fresh(), 'customer', null));
            } catch (\Throwable $e) {
                Log::warning('Broadcast failed but order saved: ' . $e->getMessage());
            }

            return response()->json([
                'success'  => true,
                'message'  => 'Order placed successfully',
                'order_id' => $records['order']->id
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
     * Retrieve order status for the tracking screen.
     */
    public function show(Request $request, $id)
    {
        try {
            $order = Order::with(['delivery.rider', 'items.product'])->find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found'], 404);
            }

            if ($order->user_id && $request->user() && $order->user_id !== $request->user()->id) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id'             => $order->id,
                    'status'         => $order->status,
                    'total_amount'   => $order->total_amount,
                    'customer_name'  => $order->customer_name,
                    'delivery' => $order->delivery ? [
                        'status'        => $order->delivery->status,
                        'status_label'  => $order->delivery->getStatusLabel(),
                        'status_color'  => $order->delivery->getStatusColor(),
                        'rider_name'    => $order->delivery->rider?->name,
                        'updated_at'    => $order->delivery->updated_at,
                    ] : null,
                    'items' => $order->items->map(fn($item) => [
                        'product_name' => $item->product?->name ?? 'Unknown Product',
                        'quantity'     => $item->quantity,
                        'price'        => $item->price,
                    ]),
                    'created_at' => $order->created_at,
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Order API Show Failure', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
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
    public function tracking(Request $request, $id)
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

            $routeData = null;
            if ($isTrackingAvailable && $rider && $rider->latitude && $rider->longitude && $destinationLat && $destinationLng) {
                $routeData = app(\App\Services\RoutingService::class)->getRoute(
                    (float) $rider->latitude,
                    (float) $rider->longitude,
                    (float) $destinationLat,
                    (float) $destinationLng
                );
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
                    'rider'                 => $riderData,
                    'destination' => [
                        'customer_name'    => $delivery->customer_name ?? $order->customer_name,
                        'customer_phone'   => $delivery->customer_phone ?? $order->contact_number,
                        'customer_address' => $delivery->customer_address ?? $order->address,
                        'latitude'         => $destinationLat,
                        'longitude'        => $destinationLng,
                        'landmark'         => $delivery->landmark ?? $order->landmark,
                    ],
                    'branch' => [
                        'id'        => $order->branch?->id,
                        'name'      => $order->branch?->name,
                        'latitude'  => $order->branch?->latitude ? (float) $order->branch->latitude : null,
                        'longitude' => $order->branch?->longitude ? (float) $order->branch->longitude : null,
                    ],
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
    public function route(Request $request, $id, \App\Services\RoutingService $routingService)
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

            if (!$destLat || !$destLng) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination coordinates are not set for this delivery.',
                ], 422);
            }

            $routeResult = $routingService->getRoute($originLat, $originLng, $destLat, $destLng);

            return response()->json([
                'success'      => true,
                'order_id'     => $order->id,
                'order_number' => $order->order_number ?? "ORD-{$order->id}",
                'status'       => $delivery->status,
                'rider'        => [
                    'id'        => $rider?->id,
                    'name'      => $rider?->name ?? 'Assigned Rider',
                    'latitude'  => $originLat,
                    'longitude' => $originLng,
                ],
                'destination'  => [
                    'customer_name'    => $delivery->customer_name ?? $order->customer_name,
                    'customer_address' => $delivery->customer_address ?? $order->address,
                    'latitude'         => $destLat,
                    'longitude'        => $destLng,
                ],
                'route'        => $routeResult,
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
