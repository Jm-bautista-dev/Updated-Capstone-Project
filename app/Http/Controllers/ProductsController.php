<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItemIngredient;
use App\Models\IngredientStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Services\ProductService;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

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

        $query = Product::query()->with(['category', 'ingredients.stocks', 'branch', 'branches']);

        if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', function ($bq) use ($branchId) {
                      $bq->where('branches.id', $branchId);
                  });
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('filter_category')) {
            $query->where('category_id', $request->filter_category);
        }

        $products = $query->orderBy('name')->get()->map(function (Product $product) use ($branchId, $branches, $user) {
            if ($branchId) {
                // Scoped to a specific single branch
                $availability = $product->dynamicAvailability($branchId);
                $product->stock = (float) $availability['available'];
                $product->is_available = (bool) $availability['is_available'];
                $product->limiting_ingredient = $availability['limiting_ingredient'] ?? null;
                $product->blocking_ingredients = $availability['blocking_ingredients'] ?? [];
                $product->max_servings = $availability['max_servings'] ?? $product->stock;
                $product->is_low_stock = (bool) $availability['is_low_stock'];
                $product->status = $this->getStockStatus($product->stock);
                $product->branch_breakdown = null;
            } else {
                // Admin viewing "All Branches"
                $availability = $product->dynamicAvailability(null);
                $product->stock = (float) $availability['available'];
                $product->is_available = (bool) $availability['is_available'];
                $product->limiting_ingredient = $availability['limiting_ingredient'] ?? null;
                $product->blocking_ingredients = $availability['blocking_ingredients'] ?? [];
                $product->max_servings = $availability['max_servings'] ?? $product->stock;
                $product->is_low_stock = (bool) $availability['is_low_stock'];
                $product->status = $product->is_available
                    ? ($product->stock <= 5 ? 'Low Stock' : 'In Stock')
                    : 'Out of Stock';
                $product->branch_breakdown = $availability['branch_breakdown'] ?? [];
            }

<<<<<<< HEAD
            if ($user->isAdmin()) {
=======
            if ($user && $user->isAdmin()) {
>>>>>>> c1bcda7f (update)
                $costPrice = $product->computeProductCost($branchId);
                $product->cost_price = $costPrice;
                $product->cost = $costPrice;
                $product->has_cost = $costPrice > 0;
            } else {
                $product->cost_price = null;
                $product->cost = null;
                $product->has_cost = false;
<<<<<<< HEAD
=======
                $product->makeHidden(['cost_price']);
>>>>>>> c1bcda7f (update)
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
        $ingredientsQuery = Ingredient::orderBy('name');
        if (!$user->isAdmin() && $user->branch_id) {
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
                    function ($attribute, $value, $fail) use ($request, $user, $branchOption, $branchId, $branchIds) {
                        $targetBranches = [];
                        if ($user->isAdmin()) {
                            if (!empty($branchIds) && is_array($branchIds)) {
                                $targetBranches = $branchIds;
                            } elseif ($branchOption === 'both') {
                                $targetBranches = Branch::pluck('id')->toArray();
                            } elseif (!empty($branchId)) {
                                $targetBranches = [$branchId];
                            }
                        } else {
                            $targetBranches = [$user->branch_id];
                        }

                        if (!empty($targetBranches)) {
                            $exists = Product::where('sku', $value)
                                ->whereIn('branch_id', $targetBranches)
                                ->exists();

                            if ($exists) {
                                $fail('The SKU "' . $value . '" is already in use in one of the selected branches.');
                            }
                        }
                    }
                ],
                'category_id'                => 'required|exists:categories,id',
                'selling_price'              => 'required|numeric|min:0|max:999999.99',
                'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'description'                => 'nullable|string',
                'recipe'                     => 'required|array|min:1',
                'recipe.*.ingredient_id'     => 'required|exists:ingredients,id',
                'recipe.*.quantity_required' => 'required|numeric|gt:0|max:10000',
                'recipe.*.unit'              => 'required|string',
                'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
                'branch_option'              => 'required|in:single,both',
                'branch_id'                  => 'required_if:branch_option,single|nullable|exists:branches,id',
                'branch_ids'                 => 'nullable|array',
                'branch_ids.*'               => 'exists:branches,id',
            ], [
                'branch_option.required' => 'Please select at least one branch for this product.',
                'branch_id.required_if'  => 'Please select a valid branch for this product.',
            ]);

            // Strip manual cost_price/stock if sent in request
            unset($validated['cost_price'], $validated['stock']);

            // ✅ Prevent Duplicate Ingredients in Recipe
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
                $ing = Ingredient::find($item['ingredient_id']);
                if (!$ing) continue;

                $usedUnit = strtolower(trim($item['unit']));
                $baseUnit = strtolower(trim($ing->unit));

                if (!UnitConverter::areUnitsCompatible($usedUnit, $baseUnit, $ing->avg_weight_per_piece)) {
                    $family = UnitConverter::getMeasurementFamily($baseUnit) ?? 'compatible';
                    $validUnits = implode(', ', UnitConverter::getCompatibleUnits($baseUnit));
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "recipe.{$idx}.unit" => "Invalid unit '{$item['unit']}' for ingredient '{$ing->name}'. Please select a {$family} unit ({$validUnits})."
                    ]);
                }

                // Verify base cost exists
                if ($ing->cost_per_base_unit <= 0 && $ing->stocks()->where('cost_per_unit', '>', 0)->doesntExist()) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "recipe" => "Missing base cost for ingredient '{$ing->name}'. Cannot compute live cost without a valid cost_per_base_unit."
                    ]);
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

                foreach ($targetBranches as $branch) {
                    // ✅ Validate ingredients exist in this branch
                    if (!empty($validated['recipe'])) {
                        foreach ($validated['recipe'] as $item) {
                            $exists = IngredientStock::where('ingredient_id', $item['ingredient_id'])
                                ->where('branch_id', $branch->id)
                                ->exists();

                            if (!$exists) {
                                /** @var Ingredient $ing */
                                $ing = Ingredient::find($item['ingredient_id']);
                                $ingName = $ing ? $ing->name : "ID #{$item['ingredient_id']}";
                                throw \Illuminate\Validation\ValidationException::withMessages([
                                    'recipe' => "Ingredient '{$ingName}' is not available in branch: {$branch->name}"
                                ]);
                            }
                        }
                    }

                    // ✅ Create separate product per branch via service
                    $this->productService->store($validated, $request->file('image'), $branch->id);
                }

                return redirect()->back()->with('success', 'Product(s) created successfully.');
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
                'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'recipe'                     => 'nullable|array',
                'recipe.*.ingredient_id'     => 'required|exists:ingredients,id',
                'recipe.*.quantity_required' => 'required|numeric|gt:0|max:10000',
                'recipe.*.unit'              => 'nullable|string',
                'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            ]);

            // Strip manual cost_price/stock if sent in request
            unset($validated['cost_price'], $validated['stock']);

            // Infer missing recipe unit from ingredient base unit
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $idx => &$item) {
                    if (empty($item['unit'])) {
                        $ing = Ingredient::find($item['ingredient_id']);
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
                    $ing = Ingredient::find($item['ingredient_id']);
                    if (!$ing) continue;

                    $usedUnit = strtolower(trim($item['unit']));
                    $baseUnit = strtolower(trim($ing->unit));

                    if (!UnitConverter::areUnitsCompatible($usedUnit, $baseUnit, $ing->avg_weight_per_piece)) {
                        $family = UnitConverter::getMeasurementFamily($baseUnit) ?? 'compatible';
                        $validUnits = implode(', ', UnitConverter::getCompatibleUnits($baseUnit));
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe.{$idx}.unit" => "Invalid unit '{$item['unit']}' for ingredient '{$ing->name}'. Please select a {$family} unit ({$validUnits})."
                        ]);
                    }

                    // Verify base cost exists
                    if ($ing->cost_per_base_unit <= 0 && $ing->stocks()->where('cost_per_unit', '>', 0)->doesntExist()) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe" => "Unable to calculate product cost because '{$ing->name}' does not have a valid inventory cost."
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
                        $ing = Ingredient::find($item['ingredient_id']);
                        $ingName = $ing ? $ing->name : "ID #{$item['ingredient_id']}";
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'recipe' => "Ingredient '{$ingName}' is not available in branch: {$branchName}"
                        ]);
                    }
                }
            }

            $this->productService->update($product, $validated, $request->file('image'));

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
            Storage::disk('public')->delete($product->image_path);
        }

        MenuItemIngredient::where('menu_item_id', $id)->delete();
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted.');
    }
}
