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
            ? ($request->filled('branch_id') ? $request->input('branch_id') : null)
            : $user->branch_id;

        $query = Product::query()->with(['category', 'ingredients', 'branch']); // Included branch ownership info

        if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id');
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('filter_category')) {
            $query->where('category_id', $request->filter_category);
        }

        $products = $query->orderBy('name')->get()->map(function (Product $product) {
            // Compute dynamic availability (ingredient-based truth)
            $availability = $product->dynamicAvailability($product->branch_id);
            
            $product->stock = $availability['available'];
            $product->limiting_ingredient = $availability['limiting_ingredient'];
            $product->is_low_stock = $availability['is_low_stock'];
            
            $product->status = $this->getStockStatus($product->stock);
            $product->is_direct = !$product->hasRecipe();

            $product->image_url = $product->image_path
                ? asset('storage/' . $product->image_path)
                : null;

            return $product;
        });

        $summary = [
            'total_products' => $products->count(),
            'low_stock'      => $products->filter(fn($p) => $p->stock > 0 && $p->stock <= 5)->count(),
            'out_of_stock'   => $products->filter(fn($p) => $p->stock <= 0)->count(),
        ];

        // ── Ingredients for the recipe builder ──────────────────────────────
        $ingredientsQuery = Ingredient::orderBy('name');

        // Categories for the product form
        $categoriesQuery = Category::query()->orderBy('name');

        return Inertia::render('Products/Index', [
            'products'        => $products,
            'categories'      => $categoriesQuery->get(),
            'ingredients'     => $ingredientsQuery->with('stocks')->get(),
            'summary'         => $summary,
            'branches'        => $branches,
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
        Log::info('Product Registration Attempt:', $request->all());

        try {
            $user = Auth::user();

            $validated = $request->validate([
                'name'                       => [
                    'required',
                    'string',
                    'max:80',
                    'regex:/^[A-Za-z0-9\s\-\.\(\)\'\&\/]+$/'
                ],
                'sku'                        => 'nullable|string',
                'category_id'                => 'required|exists:categories,id',
                'cost_price'                 => 'nullable|numeric|min:0|max:999999.99',
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
            ]);

            // ✅ Prevent Duplicate Ingredients in Recipe
            $ingredientIds = array_column($validated['recipe'], 'ingredient_id');
            if (count($ingredientIds) !== count(array_unique($ingredientIds))) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'recipe' => 'Duplicate ingredients are not allowed in the same product recipe.'
                ]);
            }

            // ✅ Strict Recipe and Cost Consistency Validations
            $pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'half', 'whole'];
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
                $normUsed = UnitConverter::normalizeUnit($usedUnit);
                $normBase = UnitConverter::normalizeUnit($baseUnit);

                // If cross-converting (e.g., pcs to g/ml) without avg_weight_per_piece
                if (in_array($usedUnit, $pieceUnits) && !in_array($baseUnit, $pieceUnits)) {
                    if (!$ing->avg_weight_per_piece || $ing->avg_weight_per_piece <= 0) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe" => "Piece-based ingredient '{$ing->name}' requires an average weight per piece to compute cost accurately."
                        ]);
                    }
                } elseif (!in_array($usedUnit, $pieceUnits) && !in_array($baseUnit, $pieceUnits)) {
                    if ($normUsed !== $normBase) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            "recipe" => "Invalid unit conversion: Cannot convert '{$usedUnit}' to base unit '{$baseUnit}' for ingredient '{$ing->name}'."
                        ]);
                    }
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
                
                if ($user->isAdmin() && $validated['branch_option'] === 'both') {
                    $targetBranches = Branch::all();
                } else {
                    $branchId = $user->isAdmin() ? $validated['branch_id'] : $user->branch_id;
                    $targetBranches = Branch::where('id', $branchId)->get();
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
                                throw \Illuminate\Validation\ValidationException::withMessages([
                                    'recipe' => "Ingredient '{$ing->name}' is not available in branch: {$branch->name}"
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

        $validated = $request->validate([
            'name'                       => [
                'required',
                'string',
                'max:80',
                'regex:/^[A-Za-z0-9\s\-]+$/'
            ],
            'sku'                        => 'nullable|string|unique:products,sku,' . $id,
            'description'                => 'nullable|string',
            'category_id'                => 'required|exists:categories,id',
            'cost_price'                 => 'nullable|numeric|min:0|max:999999.99',
            'selling_price'              => 'required|numeric|min:0|max:999999.99',
            'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'recipe'                     => 'required|array|min:1',
            'recipe.*.ingredient_id'     => 'required|exists:ingredients,id',
            'recipe.*.quantity_required' => 'required|numeric|gt:0|max:10000',
            'recipe.*.unit'              => 'required|string',
            'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
        ]);
        // ✅ Prevent Duplicate Ingredients
        $ingredientIds = array_column($validated['recipe'], 'ingredient_id');
        if (count($ingredientIds) !== count(array_unique($ingredientIds))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'recipe' => 'Duplicate ingredients are not allowed.'
            ]);
        }

        // ✅ Strict Recipe and Cost Consistency Validations
        $pieceUnits = ['pcs', 'pc', 'pieces', 'piece', 'cloves', 'clove', 'half', 'whole'];
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
            $normUsed = UnitConverter::normalizeUnit($usedUnit);
            $normBase = UnitConverter::normalizeUnit($baseUnit);

            // If cross-converting (e.g., pcs to g/ml) without avg_weight_per_piece
            if (in_array($usedUnit, $pieceUnits) && !in_array($baseUnit, $pieceUnits)) {
                if (!$ing->avg_weight_per_piece || $ing->avg_weight_per_piece <= 0) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "recipe" => "Piece-based ingredient '{$ing->name}' requires an average weight per piece to compute cost accurately."
                    ]);
                }
            } elseif (!in_array($usedUnit, $pieceUnits) && !in_array($baseUnit, $pieceUnits)) {
                if ($normUsed !== $normBase) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "recipe" => "Invalid unit conversion: Cannot convert '{$usedUnit}' to base unit '{$baseUnit}' for ingredient '{$ing->name}'."
                    ]);
                }
            }

            // Verify base cost exists
            if ($ing->cost_per_base_unit <= 0 && $ing->stocks()->where('cost_per_unit', '>', 0)->doesntExist()) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    "recipe" => "Missing base cost for ingredient '{$ing->name}'. Cannot compute live cost without a valid cost_per_base_unit."
                ]);
            }
        }

        // ✅ Strict Branch-Stock Validation (updates only affect the product's owner branch)
        if (!empty($validated['recipe'])) {
            foreach ($validated['recipe'] as $item) {
                $exists = IngredientStock::where('ingredient_id', $item['ingredient_id'])
                    ->where('branch_id', $product->branch_id)
                    ->exists();

                if (!$exists) {
                    /** @var Ingredient $ing */
                    $ing = Ingredient::find($item['ingredient_id']);
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'recipe' => "Ingredient '{$ing->name}' is not available in branch: " . $product->branch->name
                    ]);
                }
            }
        }

        $this->productService->update($product, $validated, $request->file('image'));

        return redirect()->back()->with('success', 'Product updated.');
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
