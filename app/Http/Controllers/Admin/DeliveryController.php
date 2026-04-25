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
        $query = Delivery::with([
            'sale.cashier', 
            'sale.branch', 
            'sale.items.product',
            'order.items.product',
            'order.branch',
            'rider', 
            'creator', 
            'cancelledBy'
        ])
            ->latest();

        // ... existing filters ...

        $deliveries = $query->paginate(50)->withQueryString();

        // Transform for frontend
        $deliveries->getCollection()->transform(function ($delivery) {
            $delivery->status_label = $delivery->getStatusLabel();
            $delivery->status_color = $delivery->getStatusColor();
            $delivery->next_statuses = $delivery->getNextStatuses();
            $delivery->is_cancelled = $delivery->isCancelled();
            $delivery->is_delivered = $delivery->isDelivered();
            $delivery->cancelled_by_name = $delivery->cancelledBy?->name;
            return $delivery;
        });

        // Get all active riders for manual assignment
        $availableRiders = Rider::where('is_active', true)
            ->withCount(['deliveries' => function ($q) {
                $q->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED]);
            }])
            ->get()
            ->map(function ($rider) {
                return [
                    'id' => $rider->id,
                    'name' => $rider->name,
                    'status' => $rider->status,
                    'branch_name' => $rider->branch?->name ?? 'Global',
                    'active_deliveries' => $rider->deliveries_count,
                ];
            });

        return Inertia::render('Admin/Deliveries', [
            'deliveries' => $deliveries,
            'availableRiders' => $availableRiders,
            'filters'    => $request->only(['status', 'type', 'branch_id', 'search']),
            'branches'   => Branch::orderBy('name')->get(['id', 'name']),
            'stats'      => [
                'pending'   => Delivery::where('status', 'pending')->count(),
                'active'    => Delivery::whereNotIn('status', ['pending', 'delivered', 'cancelled'])->count(),
                'delivered' => Delivery::where('status', 'delivered')->whereDate('created_at', today())->count(),
                'delayed'   => Delivery::whereNotIn('status', ['delivered', 'cancelled'])->where('created_at', '<', now()->subHour())->count(),
            ],
        ]);
    }

    /**
     * Manually assign or reassign a rider to a delivery.
     */
    public function assignRider(Request $request, Delivery $delivery)
    {
        $request->validate([
            'rider_id' => 'required|exists:riders,id',
        ]);

        try {
            $this->deliveryService->assignRider($delivery, $request->rider_id);
            return back()->with('success', 'Rider assigned successfully.');
        } catch (\Exception $e) {
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
        // Check if Cashier is restricted to their branch
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
                'status' => Delivery::STATUS_CANCELLED,
                'cancellation_reason' => $request->input('reason', 'Customer requested cancellation'),
                'cancelled_by' => $user->id,
                'cancelled_at' => now(),
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
     * Get delivery recommendation based on branch and distance.
     * Used via AJAX from the POS checkout.
     */
    public function recommend(Request $request)
    {
        $request->validate([
            'branch_id'   => 'required|exists:branches,id',
            'distance_km' => ['nullable', 'numeric', 'gt:0', 'max:'.config('delivery.max_distance_km', 50)],
        ]);

        $branch = Branch::with('riders')->findOrFail($request->input('branch_id'));
        $distance = $request->input('distance_km') ? (float) $request->input('distance_km') : null;

        $recommendation = $this->deliveryService->recommend($branch, $distance);

        // Also return available riders for internal option
        $riders = $branch->riders()->available()->get(['id', 'name', 'phone']);

        return response()->json([
            'recommendation' => $recommendation,
            'riders'         => $riders,
            'branch'         => [
                'delivery_radius_km' => $branch->delivery_radius_km,
                'has_internal_riders' => $branch->has_internal_riders,
                'base_delivery_fee'  => $branch->base_delivery_fee,
                'per_km_fee'         => $branch->per_km_fee,
            ],
        ]);
    }
}
