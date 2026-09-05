<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use App\Models\PosOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Services\SaleService;
use App\Models\Sale;
use App\Models\Rider;
use Illuminate\Support\Facades\Auth;

class PosController extends Controller
{
    protected $saleService;

    public function __construct(SaleService $saleService)
    {
        $this->saleService = $saleService;
    }

    public function index()
    {
        $user = Auth::user();
        $branchId = $user->branch_id;

        // Load products scoped to the cashier's branch via direct branch_id ownership
        $productsQuery = Product::with(['category', 'ingredients']);
        if ($branchId) {
            $productsQuery->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                    ->orWhereNull('branch_id')
                    ->orWhereHas('branches', function ($bq) use ($branchId) {
                        $bq->where('branches.id', $branchId);
                    });
            });
        }

        $products = $productsQuery->get()->map(function (Product $product) use ($branchId) {
            // Compute dynamic availability (ingredient-based truth)
            $availability = $product->dynamicAvailability($branchId);

            $product->stock = $availability['available'];
            $product->limiting_ingredient = $availability['limiting_ingredient'];
            $product->is_low_stock = $availability['is_low_stock'];

            $product->image_url = \App\Utils\ImageHelper::resolveUrl($product->image_path, 'products');
            $product->cost_price = null;
            $product->makeHidden(['cost_price']);

            $activeGroups = $product->getActiveAddonGroups();
            $product->addon_groups = $activeGroups->map(function ($group) {
                return [
                    'id'             => $group->id,
                    'name'           => $group->name,
                    'selection_type' => $group->selection_type,
                    'is_required'    => (bool) $group->is_required,
                    'min_selections' => (int) $group->min_selections,
                    'max_selections' => $group->max_selections !== null ? (int) $group->max_selections : null,
                    'addons'         => $group->addOns->map(function ($ad) {
                        return [
                            'id'           => $ad->id,
                            'name'         => $ad->name,
                            'price'        => $ad->pivot?->price_override !== null ? (float) $ad->pivot->price_override : (float) $ad->price,
                            'stock_linked' => (bool) $ad->stock_linked,
                        ];
                    })->values(),
                ];
            })->values();

            // Also provide flat list of available add-ons
            $flatAddons = collect();
            foreach ($activeGroups as $group) {
                foreach ($group->addOns as $ad) {
                    $flatAddons->push([
                        'id'    => $ad->id,
                        'name'  => $ad->name,
                        'price' => $ad->pivot?->price_override !== null ? (float) $ad->pivot->price_override : (float) $ad->price,
                    ]);
                }
            }
            if ($flatAddons->isEmpty()) {
                $flatAddons = \App\Models\AddOn::where('is_active', true)->get()->map(fn($ad) => [
                    'id'    => $ad->id,
                    'name'  => $ad->name,
                    'price' => (float) $ad->price,
                ]);
            }
            $product->available_addons = $flatAddons->unique('id')->values();
            return $product;
        });

        // Load categories globally (shared across branches)
        $categories = Category::orderBy('name')->get()->map(function ($category) {
            $category->image_url = \App\Utils\ImageHelper::resolveUrl($category->image_path, 'categories');
            return $category;
        });

        $recentOrders = Sale::with('items.product')
            ->where('user_id', Auth::id())
            ->latest()
            ->limit(10)
            ->get();

        $allRiders = [];
        $availableRiders = [];

        if ($branchId) {
            $allRiders = Rider::where('branch_id', $branchId)
                ->get()
                ->map(function ($rider) {
                    $inTransit = $rider->hasInTransitDelivery();
                    $activeCount = $rider->deliveries()
                        ->whereIn('status', ['assigned_to_rider', 'picked_up', 'in_transit'])
                        ->count();
                    $isAssignable = $rider->is_active && $rider->status !== 'offline' && !$inTransit;

                    return [
                        'id'                      => $rider->id,
                        'name'                    => $rider->name,
                        'phone'                   => $rider->phone,
                        'is_active'               => (bool) $rider->is_active,
                        'status'                  => $rider->status, // 'available' | 'busy' | 'offline'
                        'in_transit'              => $inTransit,
                        'active_deliveries_count' => $activeCount,
                        'is_assignable'           => $isAssignable,
                    ];
                });

            $availableRiders = $allRiders->where('is_assignable', true)->values()->all();
        }

        $activeShift = \App\Models\CashierShift::where('cashier_id', Auth::id())
            ->where('status', 'open')
            ->first();

        return Inertia::render('Pos/Index', [
            'products'        => $products,
            'categories'      => $categories,
            'recentOrders'    => $recentOrders,
            'branch'          => $user->branch,
            'availableRiders' => $availableRiders,
            'allRiders'       => $allRiders,
            'activeShift'     => $activeShift,
        ]);
    }

    public function store(Request $request)
    {
        // When submitted via FormData (e.g. proof of delivery attachment or forceFormData),
        // nested objects like discount_details or items may arrive as serialized JSON strings.
        if ($request->has('discount_details') && is_string($request->input('discount_details'))) {
            $decoded = json_decode($request->input('discount_details'), true);
            if (is_array($decoded)) {
                $request->merge(['discount_details' => $decoded]);
            }
        }

        if ($request->has('items') && is_string($request->input('items'))) {
            $decoded = json_decode($request->input('items'), true);
            if (is_array($decoded)) {
                $request->merge(['items' => $decoded]);
            }
        }

        if ($request->has('delivery_info') && is_string($request->input('delivery_info'))) {
            $decoded = json_decode($request->input('delivery_info'), true);
            if (is_array($decoded)) {
                $request->merge(['delivery_info' => $decoded]);
            }
        }

        $validated = $request->validate([
            'type' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'total' => 'nullable|numeric',
            'payment_method' => 'required|string',
            'paid_amount' => 'required|numeric|min:0',
            'change_amount' => 'nullable|numeric',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|string|max:100',
            'discount_details' => 'nullable|array',
            'delivery_info' => 'nullable|array',
            'delivery_info.customer_name' => 'required_if:type,delivery|nullable|string',
            'delivery_info.customer_address' => 'required_if:type,delivery|nullable|string',
            'delivery_info.customer_phone' => 'nullable|string',
            'delivery_info.delivery_type' => 'required_if:type,delivery|nullable|in:internal,external',
            'delivery_info.rider_id' => 'nullable|exists:riders,id',
            'delivery_info.external_service' => 'nullable|in:grab,lalamove',
            'delivery_info.tracking_number' => 'nullable|string',
            'delivery_info.distance_km' => ['nullable', 'numeric', 'gt:0', 'max:' . config('delivery.max_distance_km', 50)],
            'delivery_info.delivery_fee' => 'nullable|numeric',
            'delivery_info.external_notes' => 'nullable|string|max:1000',
            'delivery_info.proof_of_delivery' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if (in_array($request->input('discount_type'), ['twenty_percent', 'senior_citizen', 'pwd', 'solo_parent', 'national_athlete'], true)) {
            $request->validate([
                'discount_details.customer_name' => 'required|string|min:2',
                'discount_details.id_number'     => 'required|string|min:2',
            ], [
                'discount_details.customer_name.required' => 'Customer Name is required for 20% statutory discount.',
                'discount_details.id_number.required'     => 'Customer / Statutory ID Number is required for 20% statutory discount.',
            ]);
        }

        if ($request->hasFile('delivery_info.proof_of_delivery')) {
            $validated['delivery_info']['proof_of_delivery'] = $request->file('delivery_info.proof_of_delivery');
        }

        try {
            $orderNumber = 'POS-' . strtoupper(uniqid());
            $sale = $this->saleService->processSale(array_merge($validated, [
                'order_number'    => $orderNumber,
                'status'          => 'completed',
                'idempotency_key' => $request->input('idempotency_key'),
                'terminal_id'     => $request->input('terminal_id', 'POS-1'),
            ]));

            $printJob = $sale->printJob ?? null;

            // 1. Inertia requests MUST receive a valid Inertia response (redirect back with session flash)
            if ($request->header('X-Inertia')) {
                return redirect()->back()
                    ->with('success', 'Order processed successfully')
                    ->with('print_job', $printJob ? [
                        'id'                => $printJob->id,
                        'job_uuid'          => $printJob->job_uuid,
                        'order_number'      => $printJob->order_number,
                        'paper_width'       => $printJob->paper_width,
                        'raw_escpos_base64' => $printJob->raw_escpos_base64,
                        'formatted_text'    => $printJob->formatted_text,
                    ] : null);
            }

            // 2. Pure API / non-Inertia requests receive JSON response
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success'   => true,
                    'message'   => 'Order processed successfully',
                    'sale'      => $sale->load(['items.product', 'branch']),
                    'print_job' => $printJob,
                ]);
            }

            return redirect()->back()
                ->with('success', 'Order processed successfully')
                ->with('print_job', $printJob ? [
                    'id'                => $printJob->id,
                    'job_uuid'          => $printJob->job_uuid,
                    'order_number'      => $printJob->order_number,
                    'paper_width'       => $printJob->paper_width,
                    'raw_escpos_base64' => $printJob->raw_escpos_base64,
                    'formatted_text'    => $printJob->formatted_text,
                ] : null);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('POS Checkout Failed', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
                'trace'   => $e->getTraceAsString(),
            ]);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors([
                    'error' => $e->getMessage() ?: 'Checkout failed. Please try again.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $e->getMessage() ?: 'Checkout failed. Please try again.',
            ], 422);
        }
    }
}
