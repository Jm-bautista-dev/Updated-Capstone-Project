<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeliveryRequest;
use App\Models\Delivery;
use App\Models\Branch;
use App\Models\Order;
use App\Models\Rider;
use App\Services\DeliveryService;
use App\Services\InventoryService;
use App\Services\PickupOrderService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;

class DeliveryController extends Controller
{
    protected DeliveryService $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Delivery & Operations dashboard — paginated list for Delivery orders ONLY.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $view = $request->input('view', 'today');
        $filterType = $request->input('type', 'all'); // 'all' | 'internal' | 'external'
        $branchIdFilter = ($request->filled('branch_id') && $request->branch_id !== 'all') ? $request->branch_id : null;
        $statusFilter = ($request->filled('status') && $request->status !== 'all') ? $request->status : null;
        $riderIdFilter = ($request->filled('rider_id') && $request->rider_id !== 'all') ? $request->rider_id : null;
        $search = $request->filled('search') ? trim($request->search) : null;
        $datePreset = $request->input('date_preset', 'all');

        $activeDeliveryStatuses = [
            'waiting_for_kitchen',
            'pending',
            'preparing',
            'ready_for_pickup',
            'assigned_to_rider',
            'picked_up',
            'in_transit',
            'cancellation_requested',
            'failed_delivery',
        ];

        // 1. Fetch Deliveries ONLY
        $deliveriesCollection = $this->fetchDeliveriesCollection($user, $filterType, $branchIdFilter, $view, $statusFilter, $riderIdFilter, $datePreset, $search, $request, $activeDeliveryStatuses);

        // 2. Sort & Paginate
        $deliveries = $this->paginateDeliveriesCollection($deliveriesCollection, $view, $request);

        // 3. Fleet & Delivery Statistics
        $availableRiders = $this->getAvailableRidersData($user);
        $allRiders = Rider::orderBy('name')->get(['id', 'name']);
        $stats = $this->calculateDeliveryStats($user, $activeDeliveryStatuses);

        return Inertia::render('Admin/Deliveries', [
            'deliveries'     => $deliveries,
            'availableRiders'=> $availableRiders,
            'allRiders'      => $allRiders,
            'filters'        => array_merge([
                'view'        => $view,
                'status'      => 'all',
                'type'        => $filterType,
                'branch_id'   => 'all',
                'rider_id'    => 'all',
                'search'      => '',
                'date_preset' => 'all',
                'start_date'  => '',
                'end_date'    => '',
            ], array_filter($request->only(['view', 'status', 'type', 'branch_id', 'rider_id', 'search', 'date_preset', 'start_date', 'end_date']))),
            'branches'       => Branch::orderBy('name')->get(['id', 'name']),
            'stats'          => $stats,
        ]);
    }

    /**
     * Sort and paginate deliveries collection for operations queue.
     */
    private function paginateDeliveriesCollection(Collection $deliveriesCollection, string $view, Request $request): LengthAwarePaginator
    {
        if ($view === 'today') {
            $sortedDeliveries = $deliveriesCollection->sort(function ($a, $b) {
                $aActive = $a->is_active_op ? 0 : 1;
                $bActive = $b->is_active_op ? 0 : 1;
                if ($aActive !== $bActive) {
                    return $aActive <=> $bActive;
                }
                return strtotime((string) $a->created_at) <=> strtotime((string) $b->created_at);
            })->values();
        } else {
            $sortedDeliveries = $deliveriesCollection->sortByDesc('created_at')->values();
        }

        $queuePos = 1;
        $sortedDeliveries->transform(function ($item) use (&$queuePos) {
            $item->queue_position = $item->is_active_op ? $queuePos++ : null;
            return $item;
        });

        $page = LengthAwarePaginator::resolveCurrentPage();
        $perPage = 50;
        $pagedItems = $sortedDeliveries->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator(
            $pagedItems,
            $sortedDeliveries->count(),
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath(), 'query' => $request->query()]
        );
    }

    /**
     * Query and format Delivery records for operations queue.
     */
    private function fetchDeliveriesCollection($user, $filterType, $branchIdFilter, $view, $statusFilter, $riderIdFilter, $datePreset, $search, $request, $activeDeliveryStatuses)
    {
        if (!in_array($filterType, ['all', 'delivery', 'internal', 'external'])) {
            return collect();
        }

        $delQuery = Delivery::with([
            'sale.cashier',
            'sale.branch',
            'sale.items.product',
            'order.items.product',
            'order.branch',
            'order.cancellationRequest.requestedByRider',
            'cancellationRequest.requestedByRider',
            'rider',
            'creator',
            'cancelledBy',
            'attempts.rider',
            'order.deliveryAttempts.rider'
        ]);

        if (!$user->isAdmin()) {
            $delQuery->where(function ($q) use ($user) {
                $q->whereHas('order', fn($oq) => $oq->where('branch_id', $user->branch_id))
                  ->orWhereHas('sale', fn($sq) => $sq->where('branch_id', $user->branch_id));
            });
        } elseif ($branchIdFilter) {
            $delQuery->where(function ($q) use ($branchIdFilter) {
                $q->whereHas('sale', fn($sq) => $sq->where('branch_id', $branchIdFilter))
                  ->orWhereHas('order', fn($oq) => $oq->where('branch_id', $branchIdFilter));
            });
        }

        if ($view === 'today') {
            $delQuery->where(function ($q) use ($activeDeliveryStatuses) {
                $q->whereIn('status', $activeDeliveryStatuses)
                  ->orWhere(function ($subQ) {
                      $subQ->whereIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED])
                           ->where(function ($dateQ) {
                               $dateQ->whereDate('delivered_at', today())
                                     ->orWhere(function ($fallbackQ) {
                                         $fallbackQ->whereNull('delivered_at')
                                                   ->whereDate('created_at', today());
                                     });
                           });
                  });
            });
        } else {
            if ($statusFilter) {
                $delQuery->where('status', $statusFilter);
            } else {
                $delQuery->whereIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED, Delivery::STATUS_FAILED]);
            }

            if ($riderIdFilter) {
                $delQuery->where('rider_id', $riderIdFilter);
            }

            if ($datePreset === 'today') {
                $delQuery->where(function ($dq) {
                    $dq->whereDate('delivered_at', today())
                       ->orWhere(fn($f) => $f->whereNull('delivered_at')->whereDate('created_at', today()));
                });
            } elseif ($datePreset === 'yesterday') {
                $yesterday = today()->subDay();
                $delQuery->where(function ($dq) use ($yesterday) {
                    $dq->whereDate('delivered_at', $yesterday)
                       ->orWhere(fn($f) => $f->whereNull('delivered_at')->whereDate('created_at', $yesterday));
                });
            } elseif ($datePreset === 'last_7_days') {
                $sevenDaysAgo = today()->subDays(7);
                $delQuery->where(function ($dq) use ($sevenDaysAgo) {
                    $dq->where('delivered_at', '>=', $sevenDaysAgo)
                       ->orWhere(fn($f) => $f->whereNull('delivered_at')->where('created_at', '>=', $sevenDaysAgo));
                });
            } elseif ($datePreset === 'this_month') {
                $delQuery->where(function ($dq) {
                    $dq->whereMonth('delivered_at', today()->month)
                       ->whereYear('delivered_at', today()->year)
                       ->orWhere(fn($f) => $f->whereNull('delivered_at')->whereMonth('created_at', today()->month)->whereYear('created_at', today()->year));
                });
            } elseif ($datePreset === 'custom' && $request->filled('start_date')) {
                $startDate = $request->start_date;
                $endDate = $request->input('end_date', $startDate);
                $delQuery->where(function ($dq) use ($startDate, $endDate) {
                    $dq->whereBetween('delivered_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                       ->orWhere(fn($f) => $f->whereNull('delivered_at')->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']));
                });
            }
        }

        if ($view !== 'archive' && $statusFilter) {
            $delQuery->where('status', $statusFilter);
        }

        if (in_array($filterType, ['internal', 'external'])) {
            $delQuery->where('delivery_type', $filterType);
        }

        if ($search) {
            $delQuery->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                    ->orWhere('customer_phone', 'like', "%{$search}%")
                    ->orWhere('customer_address', 'like', "%{$search}%")
                    ->orWhere('tracking_number', 'like', "%{$search}%")
                    ->orWhere('landmark', 'like', "%{$search}%")
                    ->orWhereHas('sale', fn($sq) => $sq->where('order_number', 'like', "%{$search}%"))
                    ->orWhereHas('order', fn($oq) => $oq->where('order_number', 'like', "%{$search}%")->orWhere('id', 'like', "%{$search}%"))
                    ->orWhereHas('rider', fn($rq) => $rq->where('name', 'like', "%{$search}%"));
            });
        }

        return $delQuery->get()->map(function (Delivery $delivery) use ($activeDeliveryStatuses) {
            $delivery->fulfillment_type   = 'delivery';
            $delivery->is_pickup          = false;
            $delivery->status_label       = $delivery->getStatusLabel();
            $delivery->status_color       = $delivery->getStatusColor();
            $delivery->next_statuses      = $delivery->getNextStatuses();
            $delivery->is_cancelled       = $delivery->isCancelled();
            $delivery->is_delivered       = $delivery->isDelivered();
            $delivery->is_failed          = $delivery->status === Delivery::STATUS_FAILED;
            $delivery->can_mark_failed    = $delivery->canMarkFailed();
            $delivery->cancelled_by_name  = $delivery->cancelledBy?->name;
            $delivery->waiting_minutes    = (int) now()->diffInMinutes($delivery->created_at);
            $delivery->is_active_op       = in_array($delivery->status, $activeDeliveryStatuses);

            return $delivery;
        });
    }

    /**
     * Retrieve available riders with status counts.
     */
    private function getAvailableRidersData($user)
    {
        $riderQuery = Rider::query();
        if (!$user->isAdmin() && $user->branch_id) {
            $riderQuery->where(function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id)->orWhereNull('branch_id');
            });
        }

        return $riderQuery
            ->with(['branch'])
            ->withCount([
                'deliveries as active_deliveries_count' => function ($q) {
                    $q->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED]);
                },
                'deliveries as active_in_transit_count' => function ($q) {
                    $q->whereIn('status', [Delivery::STATUS_OUT_FOR_DELIVERY, 'in_transit']);
                },
                'deliveries as active_pickup_count' => function ($q) {
                    $q->whereIn('status', [Delivery::STATUS_ASSIGNED, Delivery::STATUS_PICKED_UP, 'assigned_to_rider', 'picked_up']);
                }
            ])
            ->orderBy('name')
            ->get()
            ->map(function ($rider) {
                $isOutForDelivery = $rider->active_in_transit_count > 0;
                $isOnline = (bool) $rider->is_active && $rider->status !== 'offline';
                $canBeAssigned = $isOnline && !$isOutForDelivery;

                return [
                    'id'                      => $rider->id,
                    'name'                    => $rider->name,
                    'phone'                   => $rider->phone,
                    'is_active'               => (bool) $rider->is_active,
                    'account_status'          => $rider->account_status ?? 'active',
                    'status'                  => $isOutForDelivery ? 'busy' : ($rider->status ?: ($rider->is_active ? 'available' : 'offline')),
                    'branch_id'               => $rider->branch_id,
                    'branch_name'             => $rider->branch?->name ?? 'Global',
                    'active_deliveries'       => $rider->active_deliveries_count,
                    'active_in_transit_count' => $rider->active_in_transit_count,
                    'active_pickup_count'     => $rider->active_pickup_count,
                    'is_out_for_delivery'     => $isOutForDelivery,
                    'can_be_assigned'         => $canBeAssigned,
                ];
            });
    }

    /**
     * Compute statistics for Delivery pipeline only.
     */
    private function calculateDeliveryStats($user, $activeDeliveryStatuses): array
    {
        $baseDeliveryQuery = Delivery::query();

        if (!$user->isAdmin()) {
            $baseDeliveryQuery->where(function ($q) use ($user) {
                $q->whereHas('order', fn($oq) => $oq->where('branch_id', $user->branch_id))
                  ->orWhereHas('sale', fn($sq) => $sq->where('branch_id', $user->branch_id));
            });
        }

        $activeDelivCount = (clone $baseDeliveryQuery)->whereIn('status', $activeDeliveryStatuses)->count();

        return [
            'all_count'        => $activeDelivCount,
            'delivery_count'   => $activeDelivCount,
            'waiting'          => (clone $baseDeliveryQuery)->whereIn('status', ['waiting_for_kitchen', 'pending'])->count(),
            'preparing'        => (clone $baseDeliveryQuery)->where('status', 'preparing')->count(),
            'ready'            => (clone $baseDeliveryQuery)->where('status', 'ready_for_pickup')->count(),
            'assigned'         => (clone $baseDeliveryQuery)->where('status', 'assigned_to_rider')->count(),
            'in_transit'       => (clone $baseDeliveryQuery)->whereIn('status', ['picked_up', 'in_transit'])->count(),
            'delivered'        => (clone $baseDeliveryQuery)->where('status', 'delivered')->whereDate('delivered_at', today())->count(),
            'delivered_today'  => (clone $baseDeliveryQuery)->where('status', 'delivered')->where(function ($dq) {
                                      $dq->whereDate('delivered_at', today())
                                         ->orWhere(fn($f) => $f->whereNull('delivered_at')->whereDate('created_at', today()));
                                  })->count(),
            'total_historical' => (clone $baseDeliveryQuery)->whereIn('status', ['delivered', 'cancelled', 'failed_delivery'])->count(),
            'failed'           => (clone $baseDeliveryQuery)->where('status', 'failed_delivery')->count(),
            'delayed'          => (clone $baseDeliveryQuery)
                ->whereNotIn('status', ['delivered', 'cancelled', 'failed_delivery'])
                ->where('created_at', '<', now()->subMinutes(45))
                ->count(),
            'pending'          => (clone $baseDeliveryQuery)->whereIn('status', ['waiting_for_kitchen', 'pending'])->count(),
            'active'           => $activeDelivCount,
        ];
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

    /**
     * Get real road-network route between assigned rider and delivery destination.
     * GET /deliveries/{id}/route
     * GET /api/v1/deliveries/{id}/route
     */
    public function getRoute(Request $request, $id, \App\Services\RoutingService $routingService)
    {
        $user = Auth::user();

        /** @var Delivery|null $delivery */
        $delivery = Delivery::with(['rider.branch', 'order.branch', 'sale.branch'])->find($id);

        if (!$delivery) {
            return response()->json(['success' => false, 'message' => 'Delivery not found.'], 404);
        }

        // Branch Isolation: Cashier only for own branch
        if ($user && method_exists($user, 'isAdmin') && !$user->isAdmin()) {
            $branchId = $delivery->order?->branch_id ?? $delivery->sale?->branch_id;
            if ($branchId && (int) $user->branch_id !== (int) $branchId) {
                return response()->json(['success' => false, 'message' => 'Unauthorized branch access.'], 403);
            }
        }

        $rider = $delivery->rider;
        $branch = $delivery->order?->branch ?? $delivery->sale?->branch ?? $rider?->branch;

        // Determine origin coordinates (Rider GPS or Branch origin fallback)
        $originLat = $rider?->latitude ? (float) $rider->latitude : ($branch?->latitude ? (float) $branch->latitude : 14.229371);
        $originLng = $rider?->longitude ? (float) $rider->longitude : ($branch?->longitude ? (float) $branch->longitude : 121.328383);

        // Determine destination coordinates
        $destLat = $delivery->latitude ? (float) $delivery->latitude : ($delivery->order?->latitude ? (float) $delivery->order->latitude : null);
        $destLng = $delivery->longitude ? (float) $delivery->longitude : ($delivery->order?->longitude ? (float) $delivery->order->longitude : null);

        if (!$destLat || !$destLng) {
            return response()->json([
                'success' => false,
                'message' => 'Delivery destination coordinates are not available.',
            ], 422);
        }

        $routeResult = $routingService->getRoute($originLat, $originLng, $destLat, $destLng);

        return response()->json([
            'success'     => true,
            'delivery_id' => $delivery->id,
            'status'      => $delivery->status,
            'rider'       => [
                'id'        => $rider?->id,
                'name'      => $rider?->name ?? 'Assigned Rider',
                'latitude'  => $originLat,
                'longitude' => $originLng,
            ],
            'destination' => [
                'customer_name'    => $delivery->customer_name,
                'customer_address' => $delivery->customer_address,
                'latitude'         => $destLat,
                'longitude'        => $destLng,
            ],
            'route' => $routeResult,
        ]);
    }
}
