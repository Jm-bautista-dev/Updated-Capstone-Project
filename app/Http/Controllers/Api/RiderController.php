<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\RiderLocationLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class RiderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | RIDER FEED
    |--------------------------------------------------------------------------
    */

    /**
     * GET /api/v1/rider/orders
     * Returns all orders in 'ready_for_pickup' state — available for any rider to accept.
     */
    public function getOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->whereNull('rider_id')
                ->whereHas('order', fn($q) => $q->whereIn('status', ['ready_for_pickup', 'preparing']))
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn(Delivery $d) => $this->formatDelivery($d));

            return response()->json(['success' => true, 'data' => $deliveries]);
        } catch (\Throwable $e) {
            Log::error('Rider::getOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch orders'], 500);
        }
    }

    /**
     * GET /api/v1/rider/my-orders
     * Returns orders assigned to THIS rider that are active.
     */
    public function getMyOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit']))
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(fn(Delivery $d) => $this->formatDelivery($d));

            return response()->json(['success' => true, 'data' => $deliveries]);
        } catch (\Throwable $e) {
            Log::error('Rider::getMyOrders failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch orders'], 500);
        }
    }

    /**
     * GET /api/v1/rider/completed-orders
     * Returns completed delivery history for this rider (paginated).
     */
    public function getCompletedOrders(Request $request): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $deliveries = Delivery::with(['order.items.product', 'order.branch'])
                ->where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->where('status', 'delivered'))
                ->orderBy('updated_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data'    => collect($deliveries->items())->map(fn(Delivery $d) => $this->formatDelivery($d)),
                'meta'    => [
                    'current_page' => $deliveries->currentPage(),
                    'last_page'    => $deliveries->lastPage(),
                    'total'        => $deliveries->total(),
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
     * Transition: ready_for_pickup → assigned_to_rider
     * Rider accepts an available order. Locked with DB transaction.
     */
    public function acceptOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            return DB::transaction(function () use ($rider, $id) {
                // Pessimistic lock — prevents two riders accepting the same order simultaneously
                $delivery = Delivery::with('order')
                    ->whereNull('rider_id')
                    ->lockForUpdate()
                    ->findOrFail($id);

                $order = $delivery->order;
                if (!$order) {
                    return response()->json(['success' => false, 'message' => 'Order not found'], 404);
                }

                // Enforce state machine
                $order->transitionTo('assigned_to_rider', 'Rider accepted order', null, $rider->id);

                // Assign rider to delivery record
                $delivery->update([
                    'rider_id' => $rider->id,
                    'status'   => 'assigned_to_rider',
                ]);

                // Mark rider busy
                $rider->update(['status' => 'busy']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order accepted! Head to the branch for pickup.',
                    'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch'])),
                ]);
            });
        } catch (\RuntimeException $e) {
            // State machine violation
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::acceptOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to accept order'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/pickup
     * Transition: assigned_to_rider → picked_up
     * Rider has arrived at branch and picked up the order.
     */
    public function pickupOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            return DB::transaction(function () use ($rider, $id) {
                $delivery = Delivery::with('order')
                    ->where('rider_id', $rider->id)
                    ->lockForUpdate()
                    ->findOrFail($id);

                $order = $delivery->order;
                $order->transitionTo('picked_up', 'Rider picked up the order', null, $rider->id);

                $delivery->update(['status' => 'picked_up']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order picked up! Now head to the customer.',
                    'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch'])),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::pickupOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to update pickup status'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/transit
     * Transition: picked_up → in_transit
     * Rider has left the branch and is now delivering.
     */
    public function startTransit(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            return DB::transaction(function () use ($rider, $id) {
                $delivery = Delivery::with('order')
                    ->where('rider_id', $rider->id)
                    ->lockForUpdate()
                    ->findOrFail($id);

                $order = $delivery->order;
                $order->transitionTo('in_transit', 'Rider is on the way', null, $rider->id);

                $delivery->update(['status' => 'in_transit']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order is now in transit!',
                    'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch'])),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::startTransit failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to update transit status'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/deliver
     * Transition: in_transit → delivered
     * Rider delivered the order. Optionally requires proof_of_delivery photo.
     */
    public function deliverOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'proof_of_delivery' => 'nullable|image|max:5120', // 5MB max
            ]);

            return DB::transaction(function () use ($rider, $id, $request) {
                $delivery = Delivery::with('order')
                    ->where('rider_id', $rider->id)
                    ->lockForUpdate()
                    ->findOrFail($id);

                $order = $delivery->order;
                $order->transitionTo('delivered', 'Order delivered successfully', null, $rider->id);

                $updateData = ['status' => 'delivered'];

                // Store proof of delivery photo if provided
                if ($request->hasFile('proof_of_delivery')) {
                    $path = $request->file('proof_of_delivery')->store('proof_of_delivery', 'public');
                    $updateData['proof_of_delivery'] = $path;
                }

                $delivery->update($updateData);

                // Free up the rider
                $rider->update(['status' => 'available']);

                return response()->json([
                    'success' => true,
                    'message' => 'Delivery confirmed! Great job!',
                    'data'    => $this->formatDelivery($delivery->fresh(['order.items.product', 'order.branch'])),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            Log::error('Rider::deliverOrder failed', ['error' => $e->getMessage(), 'id' => $id]);
            return response()->json(['success' => false, 'message' => 'Failed to confirm delivery'], 500);
        }
    }

    /**
     * POST /api/v1/rider/orders/{id}/reject
     * Rider rejects an assigned order (returns it to the pool).
     */
    public function rejectOrder(Request $request, $id): JsonResponse
    {
        try {
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            return DB::transaction(function () use ($rider, $id) {
                $delivery = Delivery::with('order')
                    ->where('rider_id', $rider->id)
                    ->whereHas('order', fn($q) => $q->where('status', 'assigned_to_rider'))
                    ->lockForUpdate()
                    ->findOrFail($id);

                $order = $delivery->order;
                // Return to ready_for_pickup so another rider can accept it
                $order->transitionTo('ready_for_pickup', 'Rider rejected the order', null, $rider->id);
                $order->update(['rider_id' => null]);

                $delivery->update(['rider_id' => null, 'status' => 'ready_for_pickup']);
                $rider->update(['status' => 'available']);

                return response()->json([
                    'success' => true,
                    'message' => 'Order returned to the available pool.',
                ]);
            });
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
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $request->validate([
                'latitude'  => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'speed'     => 'nullable|numeric|min:0',
                'heading'   => 'nullable|numeric|between:0,360',
            ]);

            // Find active delivery for this rider
            $delivery = Delivery::where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit']))
                ->latest()
                ->first();

            // Store location log
            RiderLocationLog::create([
                'rider_id'    => $rider->id,
                'delivery_id' => $delivery?->id,
                'latitude'    => $request->latitude,
                'longitude'   => $request->longitude,
                'speed'       => $request->speed,
                'heading'     => $request->heading,
                'recorded_at' => now(),
            ]);

            // Update rider's last known position on the riders table
            $rider->update([
                'last_active_at' => now(),
                'latitude'       => $request->latitude,
                'longitude'      => $request->longitude,
            ]);

            return response()->json(['success' => true, 'message' => 'Location updated']);
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
     */
    public function updateStatus(Request $request): JsonResponse
    {
        try {
            $request->validate(['status' => 'required|in:available,busy,offline']);
            $rider = $request->user();

            if (!$rider instanceof Rider) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
            }

            $rider->update([
                'status'         => $request->status,
                'last_active_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'status'  => $rider->status,
            ]);
        } catch (\Throwable $e) {
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
            $rider = $request->user();
            if (!$rider instanceof Rider) {
                return response()->json(['success' => false], 403);
            }

            $totalCompleted = Delivery::where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->where('status', 'delivered'))
                ->count();

            $totalEarnings = Delivery::where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->where('status', 'delivered'))
                ->sum('delivery_fee');

            $activeOrders = Delivery::where('rider_id', $rider->id)
                ->whereHas('order', fn($q) => $q->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit']))
                ->count();

            return response()->json([
                'success' => true,
                'data'    => [
                    'total_orders'     => Delivery::where('rider_id', $rider->id)->count(),
                    'completed_orders' => $totalCompleted,
                    'active_orders'    => $activeOrders,
                    'earnings'         => (float) $totalEarnings,
                    'rating'           => 5.0,
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Failed to fetch stats'], 500);
        }
    }

    /**
     * POST /api/v1/rider/ping
     */
    public function ping(Request $request): JsonResponse
    {
        $rider = $request->user();
        if (!$rider instanceof Rider) {
            return response()->json(['success' => false], 403);
        }

        $rider->update(['last_active_at' => now()]);

        return response()->json([
            'success'        => true,
            'status'         => $rider->status,
            'last_active_at' => $rider->last_active_at,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Standardized delivery response formatter.
     */
    private function formatDelivery(Delivery $delivery): array
    {
        $order = $delivery->order;
        $lat   = $delivery->latitude ?? $order?->latitude;
        $lng   = $delivery->longitude ?? $order?->longitude;

        return [
            'delivery_id'      => $delivery->id,
            'order_id'         => $delivery->order_id,
            'status'           => $delivery->status,
            'order_status'     => $order?->status,
            'status_label'     => $delivery->getStatusLabel(),

            // Customer Info
            'customer_name'    => $delivery->customer_name,
            'customer_phone'   => $delivery->customer_phone,
            'customer_address' => $delivery->customer_address,

            // Location for maps
            'latitude'         => $lat,
            'longitude'        => $lng,
            'landmark'         => $delivery->landmark ?? $order?->landmark,
            'notes'            => $delivery->notes ?? $order?->notes,
            'maps_url'         => ($lat && $lng)
                ? "https://www.google.com/maps/dir/?api=1&destination={$lat},{$lng}"
                : null,

            // Financial
            'delivery_fee'     => (float) $delivery->delivery_fee,
            'distance_km'      => (float) $delivery->distance_km,
            'total_amount'     => (float) ($order?->total_amount ?? 0),

            // Branch (pickup point)
            'branch_name'      => $order?->branch?->name ?? 'N/A',
            'branch_address'   => $order?->branch?->address ?? null,
            'branch_latitude'  => (float) ($order?->branch?->latitude ?? 0),
            'branch_longitude' => (float) ($order?->branch?->longitude ?? 0),
            'branch_maps_url'  => ($order?->branch?->latitude && $order?->branch?->longitude)
                ? "https://www.google.com/maps/dir/?api=1&destination={$order->branch->latitude},{$order->branch->longitude}"
                : null,

            // Proof of delivery
            'proof_of_delivery_url' => $delivery->proof_of_delivery_url,

            // Order Items
            'items'            => $order?->items?->map(fn($item) => [
                'product_name' => $item->product?->name ?? 'Item',
                'quantity'     => $item->quantity,
                'price'        => (float) $item->price,
                'subtotal'     => (float) ($item->quantity * $item->price),
            ]) ?? [],
            'items_count'      => $order?->items?->count() ?? 0,

            'created_at'       => $delivery->created_at?->toIso8601String(),
            'updated_at'       => $delivery->updated_at?->toIso8601String(),
        ];
    }
}
