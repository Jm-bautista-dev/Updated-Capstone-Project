<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\MenuItemIngredient;
use App\Models\Unit;
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

        // Determine branch filter
        $branchId = $user->isAdmin()
            ? $request->input('branch_id')
            : $user->branch_id;

        $query = Product::query()->with(['category', 'ingredients', 'branches']);

        if ($branchId) {
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branches.id', $branchId);
            });
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('filter_category')) {
            $query->where('category_id', $request->filter_category);
        }

        $products = $query->orderBy('name')->get()->map(function (Product $product) use ($branchId) {
            // Use branch-scoped stock computation
            $product->stock  = $product->computedStockForBranch($branchId);
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
        // Ingredients are GLOBAL — show all without branch label.
        // Filter to only those that have a stock row in the user's branch
        // (so cashier doesn't see unstocked ingredients).
        $ingredientsQuery = Ingredient::orderBy('name');

        if (!$user->isAdmin() && $user->branch_id) {
            // For non-admin: only global ingredients that have stock in their branch
            $ingredientsQuery->whereHas('stocks', function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id);
            });
        }

        // Categories for the product form
        $categoriesQuery = Category::query()->with('branches')->orderBy('name');
        if (!$user->isAdmin()) {
            $categoriesQuery->where(function ($q) use ($user) {
                $q->where('branch_id', $user->branch_id)
                  ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $user->branch_id));
            });
        }

        return Inertia::render('Products/Index', [
            'products'        => $products,
            'categories'      => $categoriesQuery->get(),
            'ingredients'     => $ingredientsQuery->with('stocks')->get(), // Include stocks for branch-scoped visibility in frontend
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

            $branchId = $user->isAdmin()
                ? ($request->filled('branch_id') ? $request->input('branch_id') : $user->branch_id)
                : $user->branch_id;

            $validated = $request->validate([
                'name'                       => 'required|string|max:255',
                'sku'                        => 'nullable|string|unique:products,sku',
                'category_id'                => [
                    'required',
                    Rule::exists('categories', 'id')->where(function ($q) use ($branchId, $user) {
                        if ($user->isAdmin()) return;
                        $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                    }),
                ],
                'cost_price'                 => 'required|numeric|min:0',
                'selling_price'              => 'required|numeric|min:0',
                'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'description'                => 'nullable|string',
                'recipe'                     => 'nullable|array',
                // Ingredients are GLOBAL — validate existence in global ingredients table only
                'recipe.*.ingredient_id'     => 'required_with:recipe|exists:ingredients,id',
                'recipe.*.quantity_required' => 'required_with:recipe|numeric|min:0.0001',
                'branch_ids'                 => 'nullable|array',
                'branch_ids.*'               => 'exists:branches,id',
                'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            ]);

            // ── Strict Branch-Stock Validation ───────────────────────────────────
            // Before creating the product, ensure all recipe ingredients have a stock
            // row in the branch this product will belong to.
            if (!empty($validated['recipe']) && $branchId) {
                foreach ($validated['recipe'] as $item) {
                    $hasStock = \App\Models\IngredientStock::where('ingredient_id', $item['ingredient_id'])
                        ->where('branch_id', $branchId)
                        ->exists();

                    if (!$hasStock) {
                        $ingredient = Ingredient::find($item['ingredient_id']);
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'recipe' => "Ingredient '{$ingredient->name}' has no stock record for this branch. Please stock-in first.",
                        ]);
                    }
                }
            }

            $this->productService->store($validated, $request->file('image'), $user->branch_id);

            Log::info('Product Registered Successfully');
            return redirect()->back()->with('success', 'Product created successfully.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Product Validation Failed:', $e->errors());
            throw $e;
        } catch (\Exception $e) {
            Log::error('Product Registration Error:', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return redirect()->back()->withErrors(['error' => 'An unexpected error occurred. Please try again.']);
        }
    }

    public function update(Request $request, $id)
    {
        $product  = Product::findOrFail($id);
        $this->authorize('update', $product);
        $branchId = $product->branch_id;

        $validated = $request->validate([
            'name'                       => 'required|string|max:255',
            'sku'                        => 'nullable|string|unique:products,sku,' . $id,
            'description'                => 'nullable|string',
            'category_id'                => [
                'required',
                Rule::exists('categories', 'id')->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                }),
            ],
            'cost_price'                 => 'required|numeric|min:0',
            'selling_price'              => 'required|numeric|min:0',
            'image'                      => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'recipe'                     => 'required|array|min:1',
            // Ingredients are GLOBAL — only validate against global table
            'recipe.*.ingredient_id'     => 'required|exists:ingredients,id',
            'recipe.*.quantity_required' => 'required|numeric|min:0.0001',
            'branch_ids'                 => 'nullable|array',
            'branch_ids.*'               => 'exists:branches,id',
            'unit'                       => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
        ], [
            'recipe.required' => 'At least one ingredient is required.',
            'recipe.min'      => 'At least one ingredient is required.',
        ]);

        // ── Strict Branch-Stock Validation ───────────────────────────────────
        if (!empty($validated['recipe']) && $branchId) {
            foreach ($validated['recipe'] as $item) {
                $hasStock = \App\Models\IngredientStock::where('ingredient_id', $item['ingredient_id'])
                    ->where('branch_id', $branchId)
                    ->exists();

                if (!$hasStock) {
                    $ingredient = Ingredient::find($item['ingredient_id']);
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'recipe' => "Ingredient '{$ingredient->name}' has no stock record for branch #{$branchId}. Please stock-in first.",
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
