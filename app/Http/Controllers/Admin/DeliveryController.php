<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDeliveryRequest;
use App\Models\Delivery;
use App\Models\Branch;
use App\Models\Rider;
use App\Services\DeliveryService;
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
        $query = Delivery::with(['sale.cashier', 'sale.branch', 'rider', 'creator'])
            ->latest();

        // Status filter
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        // Delivery type filter
        if ($request->filled('type') && $request->input('type') !== 'all') {
            $query->where('delivery_type', $request->input('type'));
        }

        // Branch filter
        if ($request->filled('branch_id') && $request->input('branch_id') !== 'all') {
            $query->whereHas('sale', fn($q) => $q->where('branch_id', $request->input('branch_id')));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('customer_name', 'like', "%{$search}%")
                  ->orWhere('customer_address', 'like', "%{$search}%")
                  ->orWhere('tracking_number', 'like', "%{$search}%")
                  ->orWhereHas('sale', fn($sq) => $sq->where('order_number', 'like', "%{$search}%"));
            });
        }

        $deliveries = $query->paginate(50)->withQueryString();

        // Transform for frontend
        $deliveries->getCollection()->transform(function ($delivery) {
            $delivery->status_label = $delivery->getStatusLabel();
            $delivery->status_color = $delivery->getStatusColor();
            $delivery->next_statuses = $delivery->getNextStatuses();
            return $delivery;
        });

        return Inertia::render('Admin/Deliveries', [
            'deliveries' => $deliveries,
            'filters'    => $request->only(['status', 'type', 'branch_id', 'search']),
            'branches'   => Branch::orderBy('name')->get(['id', 'name']),
            'stats'      => [
                'pending'   => Delivery::where('status', 'pending')->count(),
                'active'    => Delivery::whereNotIn('status', ['pending', 'delivered'])->count(),
                'delivered' => Delivery::where('status', 'delivered')->whereDate('created_at', today())->count(),
                'delayed'   => Delivery::whereNotIn('status', ['delivered'])->where('created_at', '<', now()->subHour())->count(),
            ],
        ]);
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
