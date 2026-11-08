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

        try {
            app(\App\Services\InventoryExpirationService::class)->processExpiredBatches($branchId);
        } catch (\Throwable $e) {
            // non-blocking
        }

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

            // Provide product-specific add-ons
            $effectiveAddons = $product->getEffectiveAddons();
            $product->available_addons = $effectiveAddons->map(fn($ad) => [
                'id'           => $ad->id,
                'name'         => $ad->name,
                'price'        => (float) $ad->price,
                'stock_linked' => (bool) $ad->stock_linked,
            ])->values();

            // If product has direct addons but no groups, wrap them into a default modifier group for the POS modal
            if ($product->addon_groups->isEmpty() && $effectiveAddons->isNotEmpty()) {
                $product->addon_groups = collect([
                    [
                        'id'             => 'direct_' . $product->id,
                        'name'           => 'Available Customizations',
                        'selection_type' => 'multi',
                        'is_required'    => false,
                        'min_selections' => 0,
                        'max_selections' => null,
                        'addons'         => $effectiveAddons->map(fn($ad) => [
                            'id'           => $ad->id,
                            'name'         => $ad->name,
                            'price'        => (float) $ad->price,
                            'stock_linked' => (bool) $ad->stock_linked,
                        ])->values(),
                    ]
                ]);
            }

            return $product;
        });

        // Load categories globally (shared across branches)
        $categories = Category::orderBy('name')->get()->map(function ($category) {
            $category->image_url = \App\Utils\ImageHelper::resolveUrl($category->image_path, 'categories');
            return $category;
        });

        $recentOrdersQuery = Sale::with(['items.product', 'cashier', 'branch', 'order']);
        if ($branchId) {
            $recentOrdersQuery->where('branch_id', $branchId);
        } elseif (!$user->isAdmin()) {
            $recentOrdersQuery->where('user_id', $user->id);
        }
        $recentOrders = $recentOrdersQuery->latest()->limit(10)->get();

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

        if ($request->has('items')) {
            $items = $request->input('items');
            if (is_string($items)) {
                $decoded = json_decode($items, true);
                if (is_array($decoded)) {
                    $items = $decoded;
                }
            }
            if (is_array($items)) {
                foreach ($items as &$it) {
                    if (isset($it['selected_addons']) && is_string($it['selected_addons'])) {
                        $decodedAddons = json_decode($it['selected_addons'], true);
                        if (is_array($decodedAddons)) {
                            $it['selected_addons'] = $decodedAddons;
                        }
                    }
                }
                unset($it);
                $request->merge(['items' => $items]);
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
            'items.*.quantity' => [
                'required',
                'numeric',
                'min:1',
                'max:99999',
                function ($attribute, $value, $fail) {
                    if ((float) $value <= 0) {
                        $fail('Quantity must be greater than zero.');
                    }
                    if ((float) $value != (int) $value) {
                        $fail('Product quantity must be a whole number.');
                    }
                },
            ],
            'items.*.selected_addons' => 'nullable|array',
            'items.*.selected_addons.*' => 'nullable',
            'total' => 'nullable|numeric|min:0|max:99999999.99',
            'payment_method' => 'required|string',
            'paid_amount' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
                'regex:/^\d+(\.\d{1,2})?$/',
            ],
            'change_amount' => 'nullable|numeric|min:0|max:99999999.99',
            'discount' => 'nullable|numeric|min:0|max:99999999.99',
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
            'delivery_info.delivery_fee' => 'nullable|numeric|min:0|max:99999999.99',
            'delivery_info.external_notes' => 'nullable|string|max:1000',
            'delivery_info.proof_of_delivery' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ], [
            'paid_amount.required' => 'Checkout failed. Please enter a valid cash amount.',
            'paid_amount.numeric'  => 'Checkout failed. Please enter a valid cash amount.',
            'paid_amount.min'      => 'Checkout failed. Cash amount cannot be negative.',
            'paid_amount.max'      => 'Checkout failed. Cash amount cannot exceed ₱99,999,999.99.',
            'paid_amount.regex'    => 'Checkout failed. Please enter a valid monetary amount with up to 2 decimal places.',
            'total.max'            => 'Checkout failed. Total amount exceeds allowable limit.',
            'change_amount.max'    => 'Checkout failed. Change amount exceeds allowable limit.',
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

        $user = Auth::user();
        $branchId = (int) ($user?->branch_id ?? 0);
        if ($branchId) {
            $productQuantities = [];
            foreach ($validated['items'] as $it) {
                $pId = (int) ($it['id'] ?? 0);
                $qty = (float) ($it['quantity'] ?? 0);
                $productQuantities[$pId] = ($productQuantities[$pId] ?? 0) + $qty;
            }

            foreach ($productQuantities as $pId => $totalRequested) {
                $prod = Product::find($pId);
                if ($prod) {
                    $avail = $prod->dynamicAvailability($branchId);
                    $maxAvail = (float) ($avail['available'] ?? 0);
                    if ($totalRequested > $maxAvail) {
                        $msg = "Insufficient stock. Only {$maxAvail} units are available for {$prod->name}.";
                        if ($request->wantsJson() || $request->is('api/*')) {
                            return response()->json([
                                'success' => false,
                                'message' => $msg,
                            ], 422);
                        }
                        return redirect()->back()->withErrors(['error' => $msg]);
                    }
                }
            }
        }

        try {
            $orderNumber = 'POS-' . strtoupper(uniqid());
            $sale = $this->saleService->processSale(array_merge($validated, [
                'order_number'    => $orderNumber,
                'status'          => 'completed',
                'idempotency_key' => $request->input('idempotency_key'),
                'terminal_id'     => $request->input('terminal_id', 'POS-1'),
            ]));

            $printJob = ($sale->relationLoaded('printJob') ? $sale->printJob : null) 
                ?: $sale->printJobs()->latest()->first();

            if (!$printJob) {
                try {
                    /** @var \App\Services\PrintJobService $printJobService */
                    $printJobService = app(\App\Services\PrintJobService::class);
                    $printJob = $printJobService->createForSale(
                        $sale,
                        $request->input('idempotency_key'),
                        $request->input('terminal_id', 'POS-1')
                    );
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('PosController print job fallback failed: ' . $e->getMessage());
                }
            }

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
                        'receipt_data'      => $printJob->receipt_data,
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
                    'receipt_data'      => $printJob->receipt_data,
                ] : null);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('POS Checkout Failed', [
                'error'   => $e->getMessage(),
                'user_id' => Auth::id(),
                'trace'   => $e->getTraceAsString(),
            ]);

            $userMessage = $e->getMessage();
            if ($e instanceof \Illuminate\Database\QueryException || 
                $e instanceof \PDOException || 
                str_contains($userMessage, 'SQLSTATE') || 
                str_contains($userMessage, 'Connection') ||
                str_contains($userMessage, 'SQL') ||
                str_contains($userMessage, 'Integrity constraint violation')) {
                $userMessage = 'Checkout failed. Please enter a valid cash amount.';
            }

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $userMessage ?: 'Checkout failed. Please enter a valid cash amount.',
                ], 422);
            }

            return redirect()->back()->withErrors([
                'error' => $userMessage ?: 'Checkout failed. Please enter a valid cash amount.',
            ]);
        }
    }

    /**
     * Real-time server-side validation of cart items against branch inventory truth.
     * Checks recipe ingredient requirements, physical stock, and dynamic serving availability.
     */
    public function validateCart(Request $request)
    {
        $user = Auth::user();
        $branchId = (int) ($user?->branch_id ?? 0);

        if (!$branchId) {
            return response()->json([
                'valid' => false,
                'message' => 'Cashier is not assigned to a branch.',
            ], 422);
        }

        $rawItems = $request->input('items', []);
        if (!is_array($rawItems) || empty($rawItems)) {
            return response()->json([
                'valid' => false,
                'message' => 'The items field is required.',
            ], 422);
        }

        $normalizedItems = [];
        foreach ($rawItems as $idx => $it) {
            $pId = $it['id'] ?? $it['product_id'] ?? null;
            $qty = $it['quantity'] ?? null;

            if (!$pId || !is_numeric($pId)) {
                return response()->json([
                    'valid' => false,
                    'message' => "The items.{$idx}.id field is required.",
                ], 422);
            }

            if (!is_numeric($qty) || $qty <= 0) {
                return response()->json([
                    'valid' => false,
                    'message' => "The items.{$idx}.quantity must be greater than zero.",
                ], 422);
            }

            if (floor($qty) != $qty) {
                return response()->json([
                    'valid' => false,
                    'message' => "The items.{$idx}.quantity must be a whole number.",
                ], 422);
            }

            $normalizedItems[] = [
                'id' => (int) $pId,
                'quantity' => (float) $qty,
            ];
        }

        try {
            app(\App\Services\InventoryExpirationService::class)->processExpiredBatches($branchId);
        } catch (\Throwable $e) {
            // non-blocking
        }

        $batchService = app(\App\Services\InventoryBatchService::class);
        $productIds = array_column($normalizedItems, 'id');
        $products = Product::with(['ingredients.stocks', 'branches'])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $ingredientRequirements = [];
        $directRequirements = [];
        $productTotalQty = [];

        foreach ($normalizedItems as $it) {
            $pId = (int) $it['id'];
            $qty = (float) $it['quantity'];
            $productTotalQty[$pId] = ($productTotalQty[$pId] ?? 0) + $qty;

            /** @var Product|null $product */
            $product = $products->get($pId);
            if (!$product) {
                return response()->json([
                    'valid' => false,
                    'message' => "Product #{$pId} was not found.",
                ], 422);
            }

            // Check branch accessibility
            if ($product->branch_id !== null && (int)$product->branch_id !== $branchId) {
                $hasBranchRelation = $product->branches->contains('id', $branchId);
                if (!$hasBranchRelation) {
                    return response()->json([
                        'valid' => false,
                        'message' => "Product '{$product->name}' is not available in your branch.",
                    ], 422);
                }
            }

            if ($product->ingredients->isNotEmpty()) {
                foreach ($product->ingredients as $ingredient) {
                    $qtyInput = (float) $ingredient->pivot->quantity_required;
                    $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                    $baseNeeded = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyInput,
                        $unitInput,
                        $ingredient->unit,
                        $ingredient->avg_weight_per_piece
                    );
                    $ingredientRequirements[$ingredient->id] = ($ingredientRequirements[$ingredient->id] ?? 0) + ($baseNeeded * $qty);
                }
            } else {
                $directRequirements[$pId] = ($directRequirements[$pId] ?? 0) + $qty;
            }
        }

        // Validate aggregate total quantity against dynamic availability per product
        foreach ($productTotalQty as $pId => $totalNeeded) {
            $product = $products->get($pId);
            if (!$product) continue;

            $avail = $product->dynamicAvailability($branchId);
            $maxAvailable = (float) ($avail['available'] ?? 0);
            if ($totalNeeded > $maxAvailable) {
                return response()->json([
                    'valid' => false,
                    'product_id' => $pId,
                    'product_name' => $product->name,
                    'available' => $maxAvailable,
                    'message' => "Insufficient stock. Only {$maxAvailable} units are available for {$product->name}.",
                ], 422);
            }
        }

        // Validate direct stock
        foreach ($directRequirements as $pId => $needed) {
            $pivot = DB::table('branch_product')
                ->where('product_id', $pId)
                ->where('branch_id', $branchId)
                ->first();
            $product = $products->get($pId);
            $avail = $pivot ? (float) $pivot->stock : (($product && ($product->branch_id === null || (int)$product->branch_id === $branchId)) ? (float) ($product->stock ?? 0) : 0.0);
            if ($avail < $needed) {
                return response()->json([
                    'valid' => false,
                    'product_id' => $pId,
                    'product_name' => $product?->name ?? 'Product',
                    'available' => $avail,
                    'message' => "Insufficient stock. Only {$avail} units are available for " . ($product?->name ?? 'Product') . ".",
                ], 422);
            }
        }

        // Validate ingredient requirements
        foreach ($ingredientRequirements as $ingredientId => $needed) {
            $eligibleStock = $batchService->getAvailableEligibleStock($ingredientId, $branchId);
            if ($eligibleStock < $needed) {
                $affectedProduct = $products->first(fn($p) => $p->ingredients->contains('id', $ingredientId));
                $availServings = 0;
                if ($affectedProduct) {
                    $avail = $affectedProduct->dynamicAvailability($branchId);
                    $availServings = (int) $avail['available'];
                }

                $ingredient = Ingredient::find($ingredientId);
                $unit = $ingredient?->unit ?? 'unit(s)';
                $displayStock = \App\Utils\UnitConverter::convertFromBaseQuantity($eligibleStock, $unit);

                return response()->json([
                    'valid' => false,
                    'product_id' => $affectedProduct?->id,
                    'product_name' => $affectedProduct?->name ?? 'Item',
                    'available' => $availServings,
                    'message' => "Insufficient stock. Only {$availServings} units are available for " . ($affectedProduct?->name ?? 'Item') . " (limiting ingredient: {$ingredient?->name}).",
                ], 422);
            }
        }

        return response()->json([
            'valid' => true,
        ]);
    }
}
