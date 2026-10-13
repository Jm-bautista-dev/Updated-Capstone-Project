<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItemIngredient;
use App\Models\IngredientStock;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Services\ProductService;
use App\Services\InventoryService;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Carbon\Carbon;

class ProductsController extends Controller
{
    use AuthorizesRequests;

    protected ProductService $productService;

    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();

        // Determine branch filter (Strict multi-branch)
        $branchId = $user->isAdmin()
            ? ($request->filled('branch_id') && $request->input('branch_id') !== 'all' ? (int) $request->input('branch_id') : null)
            : (int) $user->branch_id;

        $query = Product::query()->with(['category', 'ingredients.stocks', 'branch', 'branches', 'addons']);

        if ($branchId) {
            $query->forBranch($branchId);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('filter_category')) {
            $query->where('category_id', $request->filter_category);
        }

        $products = $query->orderBy('name')->get()->map(function (Product $product) use ($branchId, $branches, $user) {
            $availability = $product->dynamicAvailability($branchId, $branches);
            $product->stock = (float) $availability['available'];
            $product->is_available = (bool) $availability['is_available'];
            $product->limiting_ingredient = $availability['limiting_ingredient'] ?? null;
            $product->blocking_ingredients = $availability['blocking_ingredients'] ?? [];
            $product->insufficient_ingredients = $availability['insufficient_ingredients'] ?? [];
            $product->max_servings = $availability['max_servings'] ?? $product->stock;
            $product->is_low_stock = (bool) $availability['is_low_stock'];

            if ($branchId) {
                // Scoped to a specific single branch
                $product->status = $availability['status_label'] ?? $this->getStockStatus($product->stock);
                $product->availability_status = $availability['status'] ?? ($product->stock <= 0 ? 'OUT_OF_STOCK' : ($product->stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'));
                $product->branch_breakdown = null;
            } else {
                // Admin viewing "All Branches"
                $product->status = $availability['status_label'] ?? ($product->is_available
                    ? ($product->stock <= 5 ? 'Low Stock' : 'In Stock')
                    : 'Out of Stock');
                $product->availability_status = $availability['status'] ?? (!$product->is_available ? 'OUT_OF_STOCK' : ($product->stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'));
                $product->branch_breakdown = $availability['branch_breakdown'] ?? [];
            }

            if ($user && $user->isAdmin()) {
                $automaticCost = $product->getAutomaticCost($branchId);
                $costPrice = ($product->isManualCosting() && $product->manual_cost !== null)
                    ? round((float) $product->manual_cost, 4)
                    : $automaticCost;
                $product->cost_price = $costPrice;
                $product->cost = $costPrice;
                $product->has_cost = $costPrice > 0;
                $product->costing_method = $product->costing_method ?? 'automatic';
                $product->manual_cost = $product->manual_cost !== null ? (float) $product->manual_cost : null;
                $product->automatic_cost = $automaticCost;
            } else {
                $product->cost_price = null;
                $product->cost = null;
                $product->has_cost = false;
                $product->costing_method = null;
                $product->manual_cost = null;
                $product->automatic_cost = null;
                $product->makeHidden(['cost_price', 'manual_cost', 'costing_method']);
            }
            $product->is_direct = !$product->hasRecipe();

            $product->image_url = \App\Utils\ImageHelper::resolveUrl($product->image_path, 'products');

            return $product;
        });

        $summary = [
            'total_products' => $products->count(),
            'low_stock'      => $products->filter(fn($p) => $p->stock > 0 && $p->stock <= 5)->count(),
            'out_of_stock'   => $products->filter(fn($p) => $p->stock <= 0)->count(),
        ];

        // ── Ingredients for the recipe builder ──────────────────────────────
        $ingredientsQuery = Ingredient::whereNull('deleted_at')->orderBy('name');
        if (!$user->isAdmin() && $user->branch_id) {
            $ingredientsQuery->whereHas('stocks', fn($q) => $q->where('branch_id', $user->branch_id));
            $ingredientsQuery->with(['stocks' => fn($q) => $q->where('branch_id', $user->branch_id)]);
        } else {
            $ingredientsQuery->with('stocks');
        }

        // Categories for the product form
        $categoriesQuery = Category::query()->orderBy('name');

        return Inertia::render('Products/Index', [
            'products'        => $products,
            'categories'      => $categoriesQuery->get(),
            'ingredients'     => $ingredientsQuery->get(),
            'globalAddons'    => \App\Models\AddOn::active()->orderBy('name')->get(['id', 'name', 'price', 'cost_price', 'is_active', 'stock_linked']),
            'summary'         => $summary,
            'branches'        => $user->isAdmin() ? $branches : $branches->where('id', $user->branch_id)->values(),
            'allowedUnits'    => UnitConverter::getAllowedUnits(),
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'filters'         => $request->only(['search', 'filter_category', 'branch_id']),
        ]);
    }

    private function getStockStatus($stock): string
    {
        if ($stock <= 0) return 'Out of Stock';
        if ($stock <= 5) return 'Low Stock';
        return 'In Stock';
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $this->authorize('create', Product::class);

        try {
            // Normalize branch selection from request
            $branchOption = $request->input('branch_option');
            $branchId = $request->input('branch_id');
            $branchIds = $request->input('branch_ids');

            if (is_array($branchIds) && count($branchIds) > 0) {
                if (count($branchIds) === 1 && empty($branchId)) {
                    $branchId = $branchIds[0];
                    $branchOption = $branchOption ?: 'single';
                } elseif (count($branchIds) > 1) {
                    $branchOption = 'both';
                }
            } elseif (!empty($branchId) && empty($branchOption)) {
                $branchOption = 'single';
            }

            if ($branchOption !== null || $branchId !== null) {
                $request->merge([
                    'branch_option' => $branchOption,
                    'branch_id'     => $branchId,
                ]);
            }

            $validated = $request->validate([
                'name'                       => [
                    'required',
                    'string',
                    'max:80',
                    'regex:/^[A-Za-z0-9\s\-\.\(\)\'\&\/]+$/'
                ],
                'sku' => [
                    'nullable',
                    'string',
                    function ($attribute, $value, $fail) use ($request) {
                        $exists = Product::where('sku', strtoupper(trim($value)))->first();
                        if ($exists && strtolower(trim($exists->name)) !== strtolower(trim($request->input('name')))) {
                            $fail('The SKU "' . $value . '" is already in use by product: ' . $exists->name);
                        }
                    }
                ],
                'category_id'                => 'required|exists:categories,id',
                'selling_price'              => 'required|numeric|min:0|max:999999.99',
                'costing_method'             => 'nullable|string|in:automatic,manual',
                'manual_cost'                => 'required_if:costing_method,manual|nullable|numeric|min:0|max:999999.99',
                'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'description'                => 'nullable|string',
                'recipe'                     => 'nullable|array',
                'recipe.*.ingredient_id'     => [
                    'required',
                    Rule::exists('ingredients', 'id')->whereNull('deleted_at'),
                ],
                'recipe.*.quantity_required' => 'required|numeric|gt:0|max:10000',
                'recipe.*.unit'              => 'required|string',
                'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
                'branch_option'              => 'required|in:single,both',
                'branch_id'                  => 'required_if:branch_option,single|nullable|exists:branches,id',
                'branch_ids'                 => 'nullable|array',
                'branch_ids.*'               => 'exists:branches,id',
                'addon_ids'                  => 'nullable|array',
                'addon_ids.*'                => 'exists:add_ons,id',
                'stock'                      => 'nullable|numeric|min:0',
            ], [
                'branch_option.required'        => 'Please select at least one branch for this product.',
                'branch_id.required_if'         => 'Please select a valid branch for this product.',
                'manual_cost.required_if'        => 'Manual product cost is required when Manual Costing is selected.',
                'manual_cost.min'                => 'Manual product cost must be at least 0.',
                'recipe.*.ingredient_id.exists' => 'The selected ingredient is invalid, deleted, or inactive.',
            ]);

            // Strip manual cost_price if sent in request; strip stock if recipe is present
            unset($validated['cost_price']);
            if (!empty($validated['recipe'])) {
                unset($validated['stock']);
            }

            // ✅ Prevent Duplicate Ingredients in Recipe if recipe is present
            if (!empty($validated['recipe'])) {
                $ingredientIds = array_column($validated['recipe'], 'ingredient_id');
                if (count($ingredientIds) !== count(array_unique($ingredientIds))) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'recipe' => 'Duplicate ingredients are not allowed in the same product recipe.'
                    ]);
                }

                // ✅ Strict Recipe and Cost Consistency Validations
                foreach ($validated['recipe'] as $idx => $item) {
                    if (!isset($item['quantity_required']) || $item['quantity_required'] <= 0) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.quantity_required" => "Cannot compute cost: missing ingredient quantity."
                        ]);
                    }

                    /** @var Ingredient $ing */
                    $ing = Ingredient::where('id', $item['ingredient_id'])->whereNull('deleted_at')->first();
                    if (!$ing) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.ingredient_id" => "The selected ingredient is deleted or inactive and cannot be assigned to a new product.",
                            'recipe' => "One or more selected ingredients are deleted or inactive and cannot be assigned."
                        ]);
                    }

                    $usedUnit = strtolower(trim($item['unit']));
                    $baseUnit = strtolower(trim($ing->unit));

                    $familyUsed = UnitConverter::getMeasurementFamily($usedUnit);
                    $familyBase = UnitConverter::getMeasurementFamily($baseUnit);

                    // Average weight is required when a count (pcs) ingredient is consumed in grams (mass)
                    if ($familyBase === 'count' && $familyUsed === 'mass') {
                        if (empty($ing->avg_weight_per_piece) || (float) $ing->avg_weight_per_piece <= 0) {
                            throw \Illuminate\Validation\ValidationException::withMessages([
                                "recipe.{$idx}.unit" => "Average weight per piece is required to use this ingredient in grams.",
                                "recipe" => "Average weight per piece is required to use '{$ing->name}' in grams."
                            ]);
                        }
                    }

                    if (!UnitConverter::areUnitsCompatible($usedUnit, $baseUnit, $ing->avg_weight_per_piece)) {
                        $family = UnitConverter::getMeasurementFamily($baseUnit) ?? 'compatible';
                        $validUnits = implode(', ', UnitConverter::getCompatibleUnits($baseUnit));
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.unit" => "Invalid unit '{$item['unit']}' for ingredient '{$ing->name}'. Please select a {$family} unit ({$validUnits})."
                        ]);
                    }

                    // Verify base cost exists when in automatic costing mode
                    $isManualMode = ($validated['costing_method'] ?? 'automatic') === 'manual';
                    if (!$isManualMode && $ing->cost_per_base_unit <= 0 && $ing->stocks()->where('cost_per_unit', '>', 0)->doesntExist()) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe" => "Missing base cost for ingredient '{$ing->name}'. Cannot compute live cost without a valid cost_per_base_unit. Select Manual Costing to enter a manual cost."
                        ]);
                    }
                }
            }

            return DB::transaction(function () use ($request, $validated, $user) {
                $targetBranches = [];
                
                if ($user->isAdmin()) {
                    if (!empty($validated['branch_ids']) && is_array($validated['branch_ids'])) {
                        $targetBranches = Branch::whereIn('id', $validated['branch_ids'])->get();
                    } elseif ($validated['branch_option'] === 'both') {
                        $targetBranches = Branch::all();
                    } else {
                        $targetBranches = Branch::where('id', $validated['branch_id'])->get();
                    }
                } else {
                    $targetBranches = Branch::where('id', $user->branch_id)->get();
                }

                if ($targetBranches->isEmpty()) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'branch_id' => 'Please select at least one valid branch.'
                    ]);
                }

                if (!empty($validated['recipe'])) {
                    foreach ($targetBranches as $branch) {
                        foreach ($validated['recipe'] as $idx => $item) {
                            $exists = IngredientStock::where('ingredient_id', $item['ingredient_id'])
                                ->where('branch_id', $branch->id)
                                ->exists();

                            if (!$exists) {
                                /** @var Ingredient $ing */
                                $ing = Ingredient::where('id', $item['ingredient_id'])->whereNull('deleted_at')->first();
                                $ingName = $ing ? $ing->name : "ID #{$item['ingredient_id']}";
                                throw \Illuminate\Validation\ValidationException::withMessages([
                                    "recipe.{$idx}.ingredient_id" => "Ingredient '{$ingName}' is not available in branch: {$branch->name}",
                                    'recipe' => "Ingredient '{$ingName}' is not available in branch: {$branch->name}"
                                ]);
                            }
                        }
                    }
                }

                // ✅ Create ONE single global product record with branch inventory
                $this->productService->store($validated, $request->file('image'), $targetBranches);

                return redirect()->back()->with('success', 'Product registered successfully in the Global Catalog.');
            });

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Product Validation Failed:', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Product Registration Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $this->authorize('update', $product);

        try {
            $validated = $request->validate([
                'name'                       => [
                    'required',
                    'string',
                    'max:80',
                    'regex:/^[A-Za-z0-9\s\-\.\(\)\'\&\/]+$/'
                ],
                'sku' => [
                    'nullable',
                    'string',
                    Rule::unique('products')->where(function ($query) use ($product) {
                        if ($product->branch_id) {
                            return $query->where('branch_id', $product->branch_id);
                        }
                        return $query->whereNull('branch_id');
                    })->ignore($id),
                ],
                'description'                => 'nullable|string',
                'category_id'                => 'required|exists:categories,id',
                'selling_price'              => 'required|numeric|min:0|max:999999.99',
                'costing_method'             => 'nullable|string|in:automatic,manual',
                'manual_cost'                => 'required_if:costing_method,manual|nullable|numeric|min:0|max:999999.99',
                'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'remove_image'               => 'nullable|boolean',
                'recipe'                     => 'nullable|array',
                'recipe.*.ingredient_id'     => [
                    'required',
                    Rule::exists('ingredients', 'id')->whereNull('deleted_at'),
                ],
                'recipe.*.quantity_required' => 'required|numeric|gt:0|max:10000',
                'recipe.*.unit'              => 'nullable|string',
                'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
                'addon_ids'                  => 'nullable|array',
                'addon_ids.*'                => 'exists:add_ons,id',
            ], [
                'manual_cost.required_if'        => 'Manual product cost is required when Manual Costing is selected.',
                'manual_cost.min'                => 'Manual product cost must be at least 0.',
                'recipe.*.ingredient_id.exists' => 'The selected ingredient is invalid, deleted, or inactive.',
            ]);

            // Strip manual cost_price/stock if sent in request
            unset($validated['cost_price'], $validated['stock']);

            // Infer missing recipe unit from ingredient base unit
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $idx => &$item) {
                    if (empty($item['unit'])) {
                        $ing = Ingredient::where('id', $item['ingredient_id'])->whereNull('deleted_at')->first();
                        $item['unit'] = $ing ? $ing->unit : 'pcs';
                    }
                }
                unset($item);
            }

            // ✅ Prevent Duplicate Ingredients
            if (!empty($validated['recipe'])) {
                $ingredientIds = array_column($validated['recipe'], 'ingredient_id');
                if (count($ingredientIds) !== count(array_unique($ingredientIds))) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'recipe' => 'Duplicate ingredients are not allowed in the same product recipe.'
                    ]);
                }

                // ✅ Strict Recipe and Cost Consistency Validations
                foreach ($validated['recipe'] as $idx => $item) {
                    if (!isset($item['quantity_required']) || $item['quantity_required'] <= 0) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.quantity_required" => "Cannot compute cost: missing ingredient quantity."
                        ]);
                    }

                    /** @var Ingredient $ing */
                    $ing = Ingredient::where('id', $item['ingredient_id'])->whereNull('deleted_at')->first();
                    if (!$ing) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.ingredient_id" => "The selected ingredient is deleted or inactive and cannot be assigned to a product recipe.",
                            'recipe' => "One or more selected ingredients are deleted or inactive and cannot be assigned."
                        ]);
                    }

                    $usedUnit = strtolower(trim($item['unit']));
                    $baseUnit = strtolower(trim($ing->unit));

                    $familyUsed = UnitConverter::getMeasurementFamily($usedUnit);
                    $familyBase = UnitConverter::getMeasurementFamily($baseUnit);

                    // Average weight is required when a count (pcs) ingredient is consumed in grams (mass)
                    if ($familyBase === 'count' && $familyUsed === 'mass') {
                        if (empty($ing->avg_weight_per_piece) || (float) $ing->avg_weight_per_piece <= 0) {
                            throw \Illuminate\Validation\ValidationException::withMessages([
                                "recipe.{$idx}.unit" => "Average weight per piece is required to use this ingredient in grams.",
                                "recipe" => "Average weight per piece is required to use '{$ing->name}' in grams."
                            ]);
                        }
                    }

                    if (!UnitConverter::areUnitsCompatible($usedUnit, $baseUnit, $ing->avg_weight_per_piece)) {
                        $family = UnitConverter::getMeasurementFamily($baseUnit) ?? 'compatible';
                        $validUnits = implode(', ', UnitConverter::getCompatibleUnits($baseUnit));
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.unit" => "Invalid unit '{$item['unit']}' for ingredient '{$ing->name}'. Please select a {$family} unit ({$validUnits})."
                        ]);
                    }

                    // Verify base cost exists when in automatic costing mode
                    $isManualMode = ($validated['costing_method'] ?? $product->costing_method ?? 'automatic') === 'manual';
                    if (!$isManualMode && $ing->cost_per_base_unit <= 0 && $ing->stocks()->where('cost_per_unit', '>', 0)->doesntExist()) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe" => "Unable to calculate product cost because '{$ing->name}' does not have a valid inventory cost. Select Manual Costing to specify a temporary cost."
                        ]);
                    }
                }
            }

            // ✅ Strict Branch-Stock Validation (only when updating a branch-specific product)
            if (!empty($validated['recipe']) && $product->branch_id) {
                $branch = $product->branch ?? Branch::find($product->branch_id);
                $branchName = $branch ? $branch->name : "Branch #{$product->branch_id}";
                foreach ($validated['recipe'] as $item) {
                    $exists = IngredientStock::where('ingredient_id', $item['ingredient_id'])
                        ->where('branch_id', $product->branch_id)
                        ->exists();

                    if (!$exists) {
                        /** @var Ingredient $ing */
                        $ing = Ingredient::where('id', $item['ingredient_id'])->whereNull('deleted_at')->first();
                        $ingName = $ing ? $ing->name : "ID #{$item['ingredient_id']}";
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'recipe' => "Ingredient '{$ingName}' is not available in branch: {$branchName}"
                        ]);
                    }
                }
            }

            $targetBranches = null;
            if ($request->has('branch_ids') || $request->has('branch_id')) {
                $branchIds = $request->input('branch_ids') ?: ($request->filled('branch_id') ? [$request->input('branch_id')] : null);
                if ($branchIds) {
                    $targetBranches = Branch::whereIn('id', $branchIds)->get();
                }
            }

            $this->productService->update($product, $validated, $request->file('image'), $targetBranches);

            return redirect()->back()->with('success', 'Product updated successfully.');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Product Update Validation Failed:', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Product Update Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $this->authorize('delete', $product);

        if ($product->image_path) {
            \App\Utils\ImageHelper::deleteImageFile($product->image_path);
        }

        MenuItemIngredient::where('menu_item_id', $id)->delete();
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted.');
    }

    /**
     * Get authoritative ingredients, stock, and batch policies for a product to restock.
     */
    public function getRestockIngredients(Request $request, Product $product)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();

        // Branch resolution & authorization
        if (!$isAdmin) {
            $branchId = (int) $user->branch_id;
            $branches = Branch::where('id', $branchId)->get(['id', 'name', 'code']);
        } else {
            $branchId = $request->filled('branch_id') && $request->input('branch_id') !== 'all'
                ? (int) $request->input('branch_id')
                : ($user->branch_id ?: (Branch::first()?->id ?? 1));
            $branches = Branch::orderBy('name')->get(['id', 'name', 'code']);
        }

        $branch = Branch::find($branchId);
        if (!$branch) {
            return response()->json(['message' => 'Destination branch not found.'], 404);
        }

        // Load fresh product details with category
        $product->load('category');

        // Retrieve configured recipe ingredients
        $recipeIngredients = $product->ingredients()
            ->whereNull('ingredients.deleted_at')
            ->with(['stocks' => function ($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            }])
            ->get();

        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);

        $ingredients = $recipeIngredients->map(function (Ingredient $ing) use ($branchId, $isAdmin) {
            $stockRow = $ing->stocks->first();
            $rawStockBase = $stockRow ? (float) $stockRow->stock : 0.0;
            $displayUnit = $ing->unit ?: 'pcs';
            $displayStock = UnitConverter::convertFromBaseQuantity($rawStockBase, $displayUnit);

            return [
                'id'                           => $ing->id,
                'name'                         => $ing->name,
                'unit'                         => $displayUnit,
                'recipe_quantity'              => (float) ($ing->pivot->quantity_required ?? 0),
                'recipe_unit'                  => $ing->pivot->unit ?? $displayUnit,
                'current_stock'                => round($displayStock, 3),
                'current_stock_base'           => $rawStockBase,
                'requires_expiration_tracking' => (bool) $ing->requires_expiration_tracking,
                'default_expiry_days'          => $ing->default_expiry_days,
                'cost_per_base_unit'           => $isAdmin ? (float) $ing->cost_per_base_unit : null,
                'compatible_units'             => UnitConverter::getCompatibleUnits($displayUnit),
                'is_composite'                 => (bool) $ing->is_composite,
            ];
        });

        return response()->json([
            'product' => [
                'id'            => $product->id,
                'name'          => $product->name,
                'sku'           => $product->sku,
                'category_name' => $product->category?->name ?? 'Uncategorized',
                'image_url'     => $product->image_url,
                'status'        => $product->status,
                'has_recipe'    => $recipeIngredients->isNotEmpty(),
            ],
            'branch'       => [
                'id'   => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
            ],
            'branches'     => $branches,
            'ingredients'  => $ingredients,
            'suppliers'    => $suppliers,
            'is_admin'     => $isAdmin,
        ]);
    }

    /**
     * Submit product-specific ingredient restocking directly to branch inventory.
     */
    public function restockIngredients(Request $request, Product $product)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $isAdmin = method_exists($user, 'isAdmin') && $user->isAdmin();

        // 1. Authorization & Branch Validation
        $reqBranchId = (int) $request->input('branch_id');
        if (!$isAdmin) {
            if ($reqBranchId !== (int) $user->branch_id) {
                return response()->json(['message' => 'You are only authorized to restock for your assigned branch.'], 403);
            }
            $branchId = (int) $user->branch_id;
        } else {
            if (!$reqBranchId || !Branch::where('id', $reqBranchId)->exists()) {
                return response()->json(['message' => 'Please select a valid destination branch.'], 422);
            }
            $branchId = $reqBranchId;
        }

        $branch = Branch::findOrFail($branchId);

        // 2. Validate Product Has Recipe Ingredients
        $configuredRecipeIngredientIds = $product->ingredients()
            ->whereNull('ingredients.deleted_at')
            ->pluck('ingredients.id')
            ->all();

        if (empty($configuredRecipeIngredientIds)) {
            return response()->json([
                'message' => "Product '{$product->name}' does not have configured recipe ingredients. Please configure its recipe before restocking.",
                'error_type' => 'NO_RECIPE',
            ], 422);
        }

        // 3. Idempotency & Duplicate Prevention
        $idempotencyToken = $request->input('idempotency_token');
        $lockKey = null;
        if ($idempotencyToken) {
            $lockKey = 'restock_lock_' . md5($idempotencyToken);
            if (!Cache::add($lockKey, 'in_flight', 60)) {
                return response()->json([
                    'message' => 'Duplicate submission detected. This restock operation is already being processed or has already completed.',
                    'is_duplicate' => true,
                ], 409);
            }
        }

        // 4. Validate Request Structure
        $validated = $request->validate([
            'branch_id'                   => 'required|integer|exists:branches,id',
            'items'                       => 'required|array|min:1',
            'items.*.ingredient_id'       => 'required|integer',
            'items.*.quantity'            => 'nullable|numeric|min:0|max:1000000',
            'items.*.unit'                => ['nullable', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'items.*.purchase_price'      => 'nullable|numeric|min:0|max:9999999',
            'items.*.unit_cost'           => 'nullable|numeric|min:0|max:9999999',
            'items.*.lot_number'          => 'nullable|string|max:100',
            'items.*.batch_code'          => 'nullable|string|max:64',
            'items.*.expiration_date'     => 'nullable|date',
            'items.*.expiration_type'     => 'nullable|string|in:use_by,best_before,none',
            'items.*.supplier_id'         => 'nullable|exists:suppliers,id',
            'items.*.supplier_name'       => 'nullable|string|max:150',
            'items.*.notes'               => 'nullable|string|max:500',
            'items.*.included'            => 'nullable|boolean',
        ]);

        // 5. Filter included & positive quantity items
        $rawItems = $validated['items'];
        $validItems = [];
        foreach ($rawItems as $rawItem) {
            $isIncluded = isset($rawItem['included']) ? (bool)$rawItem['included'] : true;
            $qty = isset($rawItem['quantity']) && is_numeric($rawItem['quantity']) ? (float)$rawItem['quantity'] : 0.0;
            if ($isIncluded && $qty > 0) {
                $validItems[] = $rawItem;
            }
        }

        if (empty($validItems)) {
            if ($lockKey) {
                Cache::forget($lockKey);
            }
            return response()->json([
                'message' => 'Please enter a received quantity greater than zero for at least one ingredient.',
            ], 422);
        }

        // 6. Strict Ingredient & Expiration Policy Validation
        $errors = [];
        $preparedItems = [];

        foreach ($validItems as $index => $item) {
            $ingredientId = (int) $item['ingredient_id'];

            // Security: Injected ingredient check
            if (!in_array($ingredientId, $configuredRecipeIngredientIds)) {
                $errors["items.{$index}.ingredient_id"] = "Ingredient ID #{$ingredientId} is not part of {$product->name}'s configured recipe.";
                continue;
            }

            /** @var Ingredient|null $ing */
            $ing = Ingredient::where('id', $ingredientId)->whereNull('deleted_at')->first();
            if (!$ing) {
                $errors["items.{$index}.ingredient_id"] = "The ingredient ID #{$ingredientId} was deleted or does not exist.";
                continue;
            }

            $quantity = (float) $item['quantity'];
            $unit = !empty($item['unit']) ? trim($item['unit']) : $ing->unit;

            // Unit compatibility
            if (!UnitConverter::areUnitsCompatible($unit, $ing->unit, $ing->avg_weight_per_piece)) {
                $errors["items.{$index}.unit"] = "The unit '{$unit}' is not compatible with {$ing->name} (base unit: {$ing->unit}).";
                continue;
            }

            // Expiration requirement
            $expDate = !empty($item['expiration_date']) ? Carbon::parse($item['expiration_date']) : null;
            $expType = !empty($item['expiration_type']) ? $item['expiration_type'] : ($ing->requires_expiration_tracking ? 'use_by' : 'none');

            if ($ing->requires_expiration_tracking && !$expDate) {
                if (!$ing->default_expiry_days) {
                    $errors["items.{$index}.expiration_date"] = "Expiration date is required for '{$ing->name}'. Each stock-in is tracked as an individual batch for FEFO/FIFO queue priority.";
                    continue;
                }
            }

            $price = isset($item['purchase_price']) && is_numeric($item['purchase_price'])
                ? (float)$item['purchase_price']
                : (isset($item['unit_cost']) && is_numeric($item['unit_cost']) ? (float)$item['unit_cost'] : 0.0);

            $preparedItems[] = [
                'ingredient'      => $ing,
                'quantity'        => $quantity,
                'unit'            => $unit,
                'price'           => $price,
                'lot_number'      => !empty($item['lot_number']) ? trim($item['lot_number']) : null,
                'batch_code'      => !empty($item['batch_code']) ? trim($item['batch_code']) : null,
                'expiration_date' => $item['expiration_date'] ?? null,
                'expiration_type' => $expType,
                'supplier_id'     => !empty($item['supplier_id']) ? (int)$item['supplier_id'] : null,
                'supplier_name'   => !empty($item['supplier_name']) ? trim($item['supplier_name']) : null,
                'notes'           => !empty($item['notes']) ? trim($item['notes']) : "Product-Specific Restock from {$product->name}",
            ];
        }

        if (!empty($errors)) {
            if ($lockKey) {
                Cache::forget($lockKey);
            }
            return response()->json([
                'message' => 'One or more ingredients failed validation.',
                'errors'  => $errors,
            ], 422);
        }

        // 7. Atomic Stock-In Execution via Existing InventoryService
        $inventoryService = app(InventoryService::class);
        $receipts = [];

        try {
            DB::transaction(function () use ($preparedItems, $branchId, $user, $product, $inventoryService, &$receipts) {
                foreach ($preparedItems as $prep) {
                    /** @var Ingredient $ing */
                    $ing = $prep['ingredient'];
                    $reference = sprintf('Product-Specific Restock: %s (Product #%d)', $product->name, $product->id);

                    $batchMeta = [
                        'lot_number'      => $prep['lot_number'],
                        'batch_code'      => $prep['batch_code'],
                        'expiration_date' => $prep['expiration_date'],
                        'expiration_type' => $prep['expiration_type'],
                        'supplier_id'     => $prep['supplier_id'],
                        'supplier_name'   => $prep['supplier_name'],
                        'notes'           => $prep['notes'],
                    ];

                    $log = $inventoryService->stockIn(
                        type: 'ingredient',
                        id: $ing->id,
                        quantity: $prep['quantity'],
                        unit: $prep['unit'],
                        branchId: $branchId,
                        purchasePrice: $prep['price'],
                        userId: $user->id,
                        reference: $reference,
                        batchMeta: $batchMeta
                    );

                    $stockRow = IngredientStock::where('ingredient_id', $ing->id)->where('branch_id', $branchId)->first();
                    $newStock = $stockRow ? UnitConverter::convertFromBaseQuantity((float)$stockRow->stock, $ing->unit) : 0.0;

                    $receipts[] = [
                        'ingredient_id'   => $ing->id,
                        'ingredient_name' => $ing->name,
                        'quantity'        => $prep['quantity'],
                        'unit'            => $prep['unit'],
                        'new_stock'       => round($newStock, 3),
                        'stock_unit'      => $ing->unit,
                        'reference'       => $reference,
                        'batch_code'      => $batchMeta['batch_code'] ?? null,
                    ];
                }
            });
        } catch (\Exception $e) {
            if ($lockKey) {
                Cache::forget($lockKey);
            }
            Log::error('Product Ingredient Restock Failed:', [
                'product_id' => $product->id,
                'branch_id'  => $branchId,
                'error'      => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'Restock operation failed: ' . $e->getMessage(),
            ], 500);
        }

        $successMsg = sprintf(
            'Restock completed successfully for %s at %s. %d ingredient(s) received.',
            $product->name,
            $branch->name,
            count($receipts)
        );

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success'              => true,
                'message'              => $successMsg,
                'product'              => [
                    'id'   => $product->id,
                    'name' => $product->name,
                ],
                'branch'               => [
                    'id'   => $branch->id,
                    'name' => $branch->name,
                ],
                'ingredients_received' => count($receipts),
                'receipts'             => $receipts,
            ]);
        }

        return redirect()->back()->with('success', $successMsg);
    }
}
