<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupOrderService;
use App\Services\PickupPreparationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PickupOrderController extends Controller
{
    public function __construct(
        protected PickupOrderService $pickupService,
        protected PickupPreparationService $prepService
    ) {
    }

    /**
     * Display the Pickup Orders Dashboard & Kitchen Queue.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();
        $view = $request->input('view', 'today'); // 'today' | 'prep_queue' | 'all'
        $branchId = $user->isAdmin() ? $request->input('branch_id') : $user->branch_id;

        // Idempotent background reminder evaluation fallback
        try {
            $this->prepService->evaluateAndDispatchReminders($branchId ? (int) $branchId : null);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning("PickupOrderController: Reminder evaluation fallback failed: " . $e->getMessage());
        }

        $query = Order::with(['items.product', 'branch', 'user'])
            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        // Status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Order Source filter
        if ($request->filled('source') && $request->source !== 'all') {
            $query->where('order_source', $request->source);
        }

        // Search by customer name, phone, order number, verification code
        if ($request->filled('search')) {
            $search = trim($request->search);
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhere('pickup_verification_code', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%")
                  ->orWhere('contact_number', 'like', "%{$search}%")
                  ->orWhere('source_reference', 'like', "%{$search}%");
            });
        }

        $now = Carbon::now(PickupOrderService::DEFAULT_TIMEZONE);

        // Support both local and UTC boundaries for "today" to handle both server and database timezone setups
        $todayStartLocal = $now->copy()->startOfDay();
        $todayEndLocal   = $now->copy()->endOfDay();
        $todayStartUtc   = $todayStartLocal->copy()->utc();
        $todayEndUtc     = $todayEndLocal->copy()->utc();

        if ($request->filled('order_id')) {
            // Direct notification routing lookup for specific order
            $query->where('id', $request->order_id);
        } elseif ($request->filled('order_number') && !$request->filled('search')) {
            $query->where('order_number', $request->order_number);
        } elseif ($view === 'today') {
            // All pickups scheduled for today or active from earlier
            $query->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('scheduled_pickup_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('scheduled_pickup_at', [$todayStartUtc, $todayEndUtc])
                  ->orWhereIn('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'customer_arrived']);
            })->orderByRaw("
                CASE 
                    WHEN status IN ('preparing', 'ready_for_pickup', 'customer_arrived') THEN 0
                    WHEN status IN ('pending', 'confirmed') THEN 1
                    ELSE 2
                END ASC
            ")->orderBy('scheduled_pickup_at', 'asc');
        } elseif ($view === 'prep_queue') {
            // Kitchen preparation queue (active orders only, sorted strictly by prep_start_at)
            $query->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup'])
                  ->orderBy('prep_start_at', 'asc')
                  ->orderBy('scheduled_pickup_at', 'asc');
        } else {
            // Archive / All Pickups
            $query->latest();
        }

        $pickups = $query->paginate(20)->withQueryString();

        // Compute dashboard quick stats
        $statsQuery = Order::where('fulfillment_type', Order::FULFILLMENT_PICKUP);
        if ($branchId) {
            $statsQuery->where('branch_id', $branchId);
        }

        $prepMetrics = $this->prepService->getQueueMetrics($branchId ? (int) $branchId : null);

        $stats = [
            'today_total'      => (clone $statsQuery)->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('scheduled_pickup_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('scheduled_pickup_at', [$todayStartUtc, $todayEndUtc]);
            })->count(),
            'pending_prep'     => (clone $statsQuery)->whereIn('status', ['pending', 'confirmed'])->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('scheduled_pickup_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('scheduled_pickup_at', [$todayStartUtc, $todayEndUtc]);
            })->count(),
            'due_prep'         => $prepMetrics['due_for_prep'] ?? 0,
            'overdue_prep'     => $prepMetrics['overdue_prep'] ?? 0,
            'scheduled_future' => $prepMetrics['awaiting_prep'] ?? 0,
            'preparing'        => (clone $statsQuery)->where('status', 'preparing')->count(),
            'ready'            => (clone $statsQuery)->where('status', 'ready_for_pickup')->count(),
            'completed_today'  => (clone $statsQuery)->where('status', 'completed')->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('pickup_completed_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('pickup_completed_at', [$todayStartUtc, $todayEndUtc]);
            })->count(),
            'no_shows'         => (clone $statsQuery)->where('status', 'no_show')->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('updated_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('updated_at', [$todayStartUtc, $todayEndUtc]);
            })->count(),
        ];

        // Branches list with full pickup operational settings
        $branches = Branch::where('pickup_enabled', true)->get([
            'id', 
            'name', 
            'address',
            'pickup_opening_time',
            'pickup_closing_time',
            'pickup_lead_time_minutes',
            'pickup_slot_interval_minutes',
            'pickup_max_orders_per_slot',
            'pickup_cutoff_before_close_minutes',
        ]);

        // Products for manual order creation modal
        $productsQuery = Product::with('category');
        if ($branchId) {
            $productsQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', fn ($bq) => $bq->where('branches.id', $branchId));
            });
        }
        $products = $productsQuery->get()->map(function (Product $product) use ($branchId) {
            $avail = $product->dynamicAvailability($branchId);
            return [
                'id'            => $product->id,
                'name'          => $product->name,
                'selling_price' => (float) $product->selling_price,
                'category'      => $product->category?->name ?? 'General',
                'stock'         => $avail['available'],
                'image_url'     => \App\Utils\ImageHelper::resolveUrl($product->image_path, 'products'),
            ];
        });

        return Inertia::render('Admin/Pickups/Index', [
            'pickups'  => $pickups,
            'stats'    => $stats,
            'branches' => $branches,
            'products' => $products,
            'filters'  => [
                'view'      => $view,
                'status'    => $request->input('status', 'all'),
                'source'    => $request->input('source', 'all'),
                'branch_id' => $branchId,
                'search'    => $request->input('search', ''),
            ],
            'authBranchId' => $user->branch_id,
            'isAdmin'      => $user->isAdmin(),
        ]);
    }

    /**
     * Store a manually created pickup order (Facebook Messenger, Walk-in, Phone).
     */
    public function storeManual(Request $request)
    {
        $validated = $request->validate([
            'customer_name'               => 'required|string|max:255',
            'contact_number'              => 'nullable|string|max:30',
            'order_source'                => 'required|string|in:facebook_messenger,walk_in,phone_call,web_pos,other',
            'source_reference'            => 'nullable|string|max:255',
            'branch_id'                   => 'required|integer|exists:branches,id',
            'scheduled_pickup_at'         => 'required|date',
            'estimated_prep_time_minutes' => 'nullable|integer|min:5|max:180',
            'payment_method'              => 'required|string',
            'payment_status'              => 'required|string|in:unpaid,paid',
            'pickup_notes'                => 'nullable|string|max:1000',
            'internal_notes'              => 'nullable|string|max:1000',
            'items'                       => 'required|array|min:1',
            'items.*.product_id'          => 'required|exists:products,id',
            'items.*.quantity'            => 'required|numeric|min:1',
            'items.*.price'               => 'required|numeric|min:0',
            'total_amount'                => 'required|numeric|min:0',
        ]);

        try {
            $order = $this->pickupService->createManualPickupOrder($validated, Auth::user());

            return redirect()->back()->with('success', "Manual pickup order #{$order->order_number} created successfully!");
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', "Failed to create order: " . $e->getMessage());
        }
    }

    /**
     * Transition pickup order state.
     */
    public function updateStatus(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'status'            => 'required|string|in:confirmed,preparing,ready_for_pickup,customer_arrived,completed,no_show,cancelled',
            'reason'            => 'nullable|string|max:500',
            'is_early_override' => 'nullable|boolean',
        ]);

        $order = Order::where('fulfillment_type', Order::FULFILLMENT_PICKUP)->findOrFail($id);

        try {
            if ($validated['status'] === 'preparing') {
                $this->prepService->startPreparation(
                    order: $order,
                    actor: Auth::user(),
                    isEarlyOverride: (bool) ($validated['is_early_override'] ?? false),
                    reason: $validated['reason'] ?? null
                );
            } else {
                $this->pickupService->transitionPickupStatus(
                    order: $order,
                    newStatus: $validated['status'],
                    reason: $validated['reason'] ?? null,
                    actor: Auth::user()
                );
            }

            return redirect()->back()->with('success', "Order #{$order->order_number} status updated to " . strtoupper(str_replace('_', ' ', $validated['status'])));
        } catch (\InvalidArgumentException $e) {
            return redirect()->back()->with('early_override_required', true)->with('early_override_order_id', $order->id)->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', "Status transition failed: " . $e->getMessage());
        }
    }

    /**
     * Verify pickup verification code / order number and complete order.
     */
    public function verifyComplete(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'verification_code' => 'required|string|max:50',
            'paid_amount'       => 'nullable|numeric|min:0',
        ]);

        $order = Order::where('fulfillment_type', Order::FULFILLMENT_PICKUP)->findOrFail($id);

        $result = $this->pickupService->verifyAndCompletePickup(
            order: $order,
            verificationInput: $validated['verification_code'],
            cashier: Auth::user(),
            paidAmount: isset($validated['paid_amount']) ? (float) $validated['paid_amount'] : null
        );

        if (!$result['success']) {
            return redirect()->back()->with('error', $result['message']);
        }

        return redirect()->back()->with('success', "Pickup verified and Order #{$order->order_number} completed!");
    }

    /**
     * Reschedule pickup time with reason.
     */
    public function reschedule(Request $request, int|string $id)
    {
        $validated = $request->validate([
            'new_scheduled_pickup_at' => 'required|date',
            'reason'                  => 'required|string|max:500',
        ]);

        $order = Order::where('fulfillment_type', Order::FULFILLMENT_PICKUP)->findOrFail($id);

        $prevTime = $order->scheduled_pickup_display ?? $order->scheduled_pickup_at?->format('Y-m-d H:i:s');
        $newTime = Carbon::parse($validated['new_scheduled_pickup_at'], PickupOrderService::DEFAULT_TIMEZONE);

        $this->prepService->reschedulePickup($order, $newTime);

        \App\Models\OrderAuditLog::create([
            'order_id'   => $order->id,
            'user_id'    => Auth::id(),
            'old_status' => $order->status,
            'new_status' => $order->status,
            'reason'     => "Rescheduled from {$prevTime} to {$newTime->format('M d, Y • g:i A')}. Reason: {$validated['reason']}",
        ]);

        return redirect()->back()->with('success', "Order #{$order->order_number} rescheduled to {$newTime->format('M d, Y • g:i A')}");
    }

    /**
     * GET /pickups/slots
     * Return available pickup time slots and capacity for a specific branch and date.
     */
    public function slots(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'date'      => 'nullable|date_format:Y-m-d',
        ]);

        $slotsData = $this->pickupService->getAvailableTimeSlots(
            branchId: (int) $validated['branch_id'],
            date: $validated['date'] ?? null
        );

        return response()->json([
            'success' => true,
            'data'    => $slotsData,
        ]);
    }
}
