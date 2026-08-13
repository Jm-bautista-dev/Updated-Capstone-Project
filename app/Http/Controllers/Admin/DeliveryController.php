<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeliveryRequest;
use App\Models\Delivery;
use App\Models\Branch;
use App\Models\Rider;
use App\Services\DeliveryService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class DeliveryController extends Controller
{
    protected DeliveryService $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Delivery dashboard — paginated list with filters.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Delivery::with([
            'sale.cashier',
            'sale.branch',
            'sale.items.product',
            'order.items.product',
            'order.branch',
            'rider',
            'creator',
            'cancelledBy'
        ]);

        // ── Branch Isolation: Cashiers only see their own branch ────────────
        if (!$user->isAdmin()) {
            $query->where(function ($q) use ($user) {
                $q->whereHas('order', fn($oq) => $oq->where('branch_id', $user->branch_id))
                  ->orWhereHas('sale', fn($sq) => $sq->where('branch_id', $user->branch_id));
            });
        }

        // ── Queue-first ordering: active states by age, then completed ──────
        // Active queue states sorted oldest-first (FIFO by wait time)
        $activeStatuses = [
            'waiting_for_kitchen',
            'pending',
            'preparing',
            'ready_for_pickup',
            'assigned_to_rider',
            'picked_up',
            'in_transit',
            'failed_delivery',
        ];

        $query->orderByRaw(
            "CASE WHEN status IN ('" . implode("','",$activeStatuses) . "') THEN 0 ELSE 1 END ASC"
        )->orderBy('created_at', 'asc');

        // ── Filters ────────────────────────────────────────────────────────
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('delivery_type', $request->type);
        }

        if ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $branchId = $request->branch_id;
            $query->where(function ($q) use ($branchId) {
                $q->whereHas('sale', fn($sq) => $sq->where('branch_id', $branchId))
                    ->orWhereHas('order', fn($oq) => $oq->where('branch_id', $branchId));
            });
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_address', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%")
                    ->orWhere('landmark', 'like', "%{$search}%")
                    ->orWhereHas('sale', fn($sq) => $sq->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('order', fn($oq) => $oq->where('id', 'like', "%{$search}%"));
            });
        }

        $deliveries = $query->paginate(50)->withQueryString();

        // ── Queue position counter (only for active statuses) ───────────────
        $queuePosition = 1;
        $deliveries->getCollection()->transform(function ($delivery) use (&$queuePosition, $activeStatuses) {
            $delivery->status_label    = $delivery->getStatusLabel();
            $delivery->status_color    = $delivery->getStatusColor();
            $delivery->next_statuses   = $delivery->getNextStatuses();
            $delivery->is_cancelled    = $delivery->isCancelled();
            $delivery->is_delivered    = $delivery->isDelivered();
            $delivery->is_failed       = $delivery->status === Delivery::STATUS_FAILED;
            $delivery->can_mark_failed = $delivery->canMarkFailed();
            $delivery->cancelled_by_name = $delivery->cancelledBy?->name;

            // Waiting time in minutes
            $delivery->waiting_minutes = (int) now()->diffInMinutes($delivery->created_at);

            // Queue position (only for active/in-flight deliveries)
            if (in_array($delivery->status, $activeStatuses)) {
                $delivery->queue_position = $queuePosition++;
            } else {
                $delivery->queue_position = null;
            }

            return $delivery;
        });

        // Get all active riders for manual assignment with out-for-delivery lock status
        $availableRiders = Rider::where('is_active', true)
            ->withCount([
                'deliveries as active_deliveries_count' => function ($q) {
                    $q->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED]);
                },
                'deliveries as active_in_transit_count' => function ($q) {
                    $q->where('status', Delivery::STATUS_OUT_FOR_DELIVERY);
                },
                'deliveries as active_pickup_count' => function ($q) {
                    $q->whereIn('status', [Delivery::STATUS_ASSIGNED, Delivery::STATUS_PICKED_UP]);
                }
            ])
            ->get()
            ->map(function ($rider) {
                $isOutForDelivery = $rider->active_in_transit_count > 0;
                return [
                    'id'                     => $rider->id,
                    'name'                   => $rider->name,
                    'status'                 => $isOutForDelivery ? 'busy' : $rider->status,
                    'branch_name'            => $rider->branch?->name ?? 'Global',
                    'active_deliveries'      => $rider->active_deliveries_count,
                    'active_in_transit_count'=> $rider->active_in_transit_count,
                    'active_pickup_count'    => $rider->active_pickup_count,
                    'is_out_for_delivery'    => $isOutForDelivery,
                    'can_be_assigned'        => !$isOutForDelivery && $rider->is_active && $rider->status !== 'offline',
                ];
            });

        // ── Accurate stats across all queue states ─────────────────────────
        $baseQuery = Delivery::query();
        if (!$user->isAdmin()) {
            $baseQuery->where(function ($q) use ($user) {
                $q->whereHas('order', fn($oq) => $oq->where('branch_id', $user->branch_id))
                  ->orWhereHas('sale', fn($sq) => $sq->where('branch_id', $user->branch_id));
            });
        }

        $stats = [
            'waiting'    => (clone $baseQuery)->whereIn('status', ['waiting_for_kitchen', 'pending'])->count(),
            'preparing'  => (clone $baseQuery)->where('status', 'preparing')->count(),
            'ready'      => (clone $baseQuery)->where('status', 'ready_for_pickup')->count(),
            'assigned'   => (clone $baseQuery)->where('status', 'assigned_to_rider')->count(),
            'in_transit' => (clone $baseQuery)->whereIn('status', ['picked_up', 'in_transit'])->count(),
            'delivered'  => (clone $baseQuery)->where('status', 'delivered')->whereDate('created_at', today())->count(),
            'failed'     => (clone $baseQuery)->where('status', 'failed_delivery')->count(),
            'delayed'    => (clone $baseQuery)
                ->whereNotIn('status', ['delivered', 'cancelled', 'failed_delivery'])
                ->where('created_at', '<', now()->subMinutes(45))
                ->count(),
            // Legacy aliases for backward compatibility
            'pending'    => (clone $baseQuery)->whereIn('status', ['waiting_for_kitchen', 'pending'])->count(),
            'active'     => (clone $baseQuery)->whereNotIn('status', ['pending', 'waiting_for_kitchen', 'delivered', 'cancelled'])->count(),
        ];

        return Inertia::render('Admin/Deliveries', [
            'deliveries'     => $deliveries,
            'availableRiders'=> $availableRiders,
            'filters'        => $request->only(['status', 'type', 'branch_id', 'search']),
            'branches'       => Branch::orderBy('name')->get(['id', 'name']),
            'stats'          => $stats,
        ]);
    }

    /**
     * Manually assign or reassign a rider to a delivery.
     * POST /deliveries/{delivery}/assign-rider
     */
    public function assignRider(Request $request, Delivery $delivery)
    {
        $request->validate([
            'rider_id' => 'required|exists:riders,id',
        ]);

        try {
            $updated = $this->deliveryService->assignRider($delivery, $request->rider_id);

            // Return JSON if the request expects it (e.g. from AJAX / mobile admin)
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Rider assigned successfully.',
                    'order' => [
                        'id' => $updated->order_id,
                        'rider_id' => $updated->rider_id,
                        'status' => $updated->order?->status ?? 'assigned_to_rider',
                    ],
                    'delivery' => [
                        'id' => $updated->id,
                        'rider_id' => $updated->rider_id,
                        'rider_name' => $updated->rider?->name,
                        'status' => $updated->status,
                    ],
                ]);
            }

            return back()->with('success', 'Rider assigned successfully.');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }
    /**
     * Store a new delivery.
     */
    public function store(StoreDeliveryRequest $request)
    {
        $this->deliveryService->createDelivery($request->validated());

        return back()->with('success', 'Delivery created successfully.');
    }

    /**
     * Advance delivery status to next step.
     */
    public function updateStatus(Delivery $delivery)
    {
        try {
            $this->deliveryService->advanceStatus($delivery);
            return back()->with('success', 'Delivery status updated.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel a delivery.
     */
    public function cancel(Request $request, Delivery $delivery)
    {
        $user = Auth::user();

        // ── Step 1: Authorization & Branch Check ────────────────────────────
        if ($user->role === 'Cashier') {
            $branchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
            if ($branchId && $user->branch_id !== $branchId) {
                return back()->with('error', 'Unauthorized: You can only cancel deliveries for your own branch.');
            }
        }

        // ── Step 2: Guard against illogical cancellations ───────────────────
        if ($delivery->isDelivered()) {
            return back()->with('error', 'Cannot cancel a delivery that has already been delivered.');
        }

        if ($delivery->isCancelled()) {
            return back()->with('error', 'Delivery is already cancelled.');
        }

        // ── Step 3: Execute Cancellation ───────────────────────────────────
        try {
            $delivery->update([
                'status'              => Delivery::STATUS_CANCELLED,
                'cancellation_reason' => $request->input('reason', 'Customer requested cancellation'),
                'cancelled_by'        => $user->id,
                'cancelled_at'        => now(),
            ]);

            // Sync with parent order if applicable
            if ($delivery->order) {
                $delivery->order->update(['status' => 'cancelled']);

                // Restore inventory if it was deducted
                app(InventoryService::class)->restoreForOrder($delivery->order);
            }

            return back()->with('success', 'Delivery cancelled successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to cancel delivery: ' . $e->getMessage());
        }
    }

    /**
     * Mark a delivery as failed (rider could not complete).
     * POST /deliveries/{delivery}/fail
     */
    public function failDelivery(Request $request, Delivery $delivery)
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $this->deliveryService->handleFailedDelivery(
                $delivery,
                $request->input('reason', 'Delivery could not be completed')
            );

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Delivery marked as failed. Please reassign a rider.',
                ]);
            }

            return back()->with('success', 'Delivery marked as failed. Please reassign a rider.');
        } catch (\Exception $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Get delivery recommendation based on branch and distance.
     * Used via AJAX from the POS checkout.
     */
    public function recommend(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'distance_km' => ['nullable', 'numeric', 'gt:0', 'max:' . config('delivery.max_distance_km', 50)],
        ]);

        $branch = Branch::with('riders')->findOrFail($request->input('branch_id'));
        $distance = $request->input('distance_km') ? (float) $request->input('distance_km') : null;

        $recommendation = $this->deliveryService->recommend($branch, $distance);

        // Also return available riders for internal option
        $riders = $branch->riders()->available()->get(['id', 'name', 'phone']);

        return response()->json([
            'recommendation' => $recommendation,
            'riders' => $riders,
            'branch' => [
                'delivery_radius_km' => $branch->delivery_radius_km,
                'has_internal_riders' => $branch->has_internal_riders,
                'base_delivery_fee' => $branch->base_delivery_fee,
                'per_km_fee' => $branch->per_km_fee,
            ],
        ]);
    }

    /**
     * API endpoint to get real-time active rider location telemetry for Leaflet Map.
     * GET /api/v1/deliveries/live-riders
     */
    public function getLiveRiderLocations(Request $request)
    {
        $user = Auth::user();

        // Query active riders with location data
        $riderQuery = Rider::query()
            ->with(['branch', 'deliveries' => function ($q) {
                $q->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED])
                  ->with(['order', 'sale'])
                  ->latest();
            }]);

        // Branch permission filtering
        if (!$user->isAdmin()) {
            $riderQuery->where('branch_id', $user->branch_id);
        } elseif ($request->filled('branch_id') && $request->branch_id !== 'all') {
            $riderQuery->where('branch_id', $request->branch_id);
        }

        $riders = $riderQuery->get();

        $activeRiders = [];
        $totalLive = 0;
        $totalDelayed = 0;
        $totalOffline = 0;

        foreach ($riders as $rider) {
            // Find current active delivery (if any)
            $activeDelivery = $rider->deliveries->first();

            // Only include riders who have an active delivery assignment or are currently active
            if (!$activeDelivery && $rider->status === 'offline') {
                continue;
            }

            $lastUpdated = $rider->location_updated_at ?? $rider->last_active_at;
            $secondsAgo = $lastUpdated ? (int) now()->diffInSeconds($lastUpdated) : 9999;

            // Stale Location Classification
            if ($secondsAgo < 30) {
                $signalStatus = 'live'; // 🟢 Live
                $totalLive++;
            } elseif ($secondsAgo <= 120) {
                $signalStatus = 'signal_delayed'; // 🟡 Signal Delayed
                $totalDelayed++;
            } else {
                $signalStatus = 'offline'; // 🔴 Offline
                $totalOffline++;
            }

            $orderNumber = $activeDelivery?->order?->order_number 
                ?? $activeDelivery?->sale?->order_number 
                ?? ($activeDelivery ? "DEL-{$activeDelivery->id}" : null);

            $customerName = $activeDelivery?->customer_name ?? $activeDelivery?->order?->customer_name ?? 'Guest Customer';
            $customerAddress = $activeDelivery?->customer_address ?? $activeDelivery?->order?->address ?? null;
            $customerLat = $activeDelivery?->latitude ?? $activeDelivery?->order?->latitude ?? null;
            $customerLng = $activeDelivery?->longitude ?? $activeDelivery?->order?->longitude ?? null;

            // Default branch lat/lng coordinates (Victoria HQ fallback: 14.229371, 121.328383)
            $branchLat = (float) ($rider->branch?->latitude ?? 14.229371);
            $branchLng = (float) ($rider->branch?->longitude ?? 121.328383);

            // Fallback rider coordinates near branch if GPS location not recorded yet
            $riderLat = $rider->latitude ? (float) $rider->latitude : $branchLat;
            $riderLng = $rider->longitude ? (float) $rider->longitude : $branchLng;

            $activeRiders[] = [
                'id'                  => $rider->id,
                'name'                => $rider->name,
                'phone'               => $rider->phone,
                'status'              => $rider->status,
                'is_active'           => $rider->is_active,
                'signal_status'       => $signalStatus,
                'latitude'            => $riderLat,
                'longitude'           => $riderLng,
                'accuracy'            => (float) ($rider->accuracy ?? 10),
                'speed'               => (float) ($rider->speed ?? 0),
                'heading'             => (float) ($rider->heading ?? 0),
                'seconds_ago'         => $secondsAgo,
                'last_updated_at'     => $lastUpdated ? $lastUpdated->diffForHumans() : 'No signal',
                'raw_timestamp'       => $lastUpdated?->toIso8601String(),
                'branch' => [
                    'id'        => $rider->branch?->id,
                    'name'      => $rider->branch?->name ?? 'Maki Desu HQ',
                    'latitude'  => $branchLat,
                    'longitude' => $branchLng,
                ],
                'delivery' => $activeDelivery ? [
                    'id'               => $activeDelivery->id,
                    'order_number'     => $orderNumber,
                    'status'           => $activeDelivery->status,
                    'status_label'     => $activeDelivery->getStatusLabel(),
                    'customer_name'    => $customerName,
                    'customer_address' => $customerAddress,
                    'latitude'         => $customerLat ? (float) $customerLat : null,
                    'longitude'        => $customerLng ? (float) $customerLng : null,
                ] : null,
            ];
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'total_active' => count($activeRiders),
                'live'         => $totalLive,
                'delayed'      => $totalDelayed,
                'offline'      => $totalOffline,
            ],
            'riders' => $activeRiders,
        ]);
    }
}
