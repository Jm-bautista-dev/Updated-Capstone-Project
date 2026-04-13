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
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id');
        } else {
            $branchId = $user->branch_id;
        }

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

        $products = $query->orderBy('name')->get()->map(function (Product $product) {
            $product->stock = $product->computed_stock;
            $product->status = $this->getStockStatus($product->stock);
            $product->is_direct = !$product->hasRecipe();

            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $product->image_url = $product->image_path
                ? $disk->url($product->image_path)
                : null;

            return $product;
        });

        $summary = [
            'total_products' => $products->count(),
            'low_stock'      => $products->filter(fn($p) => $p->stock > 0 && $p->stock <= 5)->count(),
            'out_of_stock'   => $products->filter(fn($p) => $p->stock <= 0)->count(),
        ];

        // Ingredients for the recipe builder
        $ingredientsQuery = Ingredient::orderBy('name');
        
        // Categories for the product form
        $categoriesQuery = Category::query()->with('branches')->orderBy('name');

        $user = $request->user();
        if (!$user->isAdmin()) {
            // For non-admins, we strictly filter by their branch
            $ingredientsQuery->where('branch_id', $user->branch_id);
            $categoriesQuery->where(function($q) use ($user) {
                $q->where('branch_id', $user->branch_id)
                  ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $user->branch_id));
            });
        }

        return Inertia::render('Products/Index', [
            'products'        => $products,
            'categories'      => $categoriesQuery->get(),
            'ingredients'     => $ingredientsQuery->get(),
            'summary'         => $summary,
            'branches'        => $branches,
            'allowedUnits'    => UnitConverter::getAllowedUnits(),
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'filters'         => $request->only(['search', 'filter_category', 'branch_id']),
        ]);
    }

    private function getStockStatus($stock)
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
                'name'                        => 'required|string|max:255',
                'sku'                         => 'nullable|string|unique:products,sku',
                'category_id'                 => [
                    'required',
                    Rule::exists('categories', 'id')->where(function($q) use ($branchId, $user) {
                        if ($user->isAdmin()) return; // Admins can use any category
                        $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                    })
                ],
                'cost_price'                  => 'required|numeric|min:0',
                'selling_price'               => 'required|numeric|min:0',
                'image'                       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
                'description'                 => 'nullable|string',
                'recipe'                      => 'nullable|array',
                'recipe.*.ingredient_id' => [
    'required_with:recipe',
    Rule::exists('ingredient_stocks', 'ingredient_id')->where(function($q) use ($branchId) {
        $q->where('branch_id', $branchId);
    })
],
                'recipe.*.quantity_required'  => 'required_with:recipe|numeric|min:0.0001',
                'branch_ids'                  => 'nullable|array',
                'branch_ids.*'                => 'exists:branches,id',
                'unit'                        => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            ]);

            // Strict Validation for Branch Isolation
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $item) {
                    $ingredient = Ingredient::find($item['ingredient_id']);
                    if ($ingredient && $ingredient->branch_id != $branchId) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'recipe' => 'Invalid ingredient selection: ingredient does not belong to this branch.'
                        ]);
                    }
                }
            }

            $this->productService->store($validated, $request->file('image'), $user->branch_id);

            Log::info('Product Registered Successfully');
            return redirect()->back();
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
        $product = Product::findOrFail($id);
        $this->authorize('update', $product);
        $branchId = $product->branch_id;

        $validated = $request->validate([
            'name'                        => 'required|string|max:255',
            'sku'                         => 'nullable|string|unique:products,sku,' . $id,
            'description'                 => 'nullable|string',
            'category_id'                 => [
                'required',
                Rule::exists('categories', 'id')->where(function($q) use ($branchId) {
                    $q->where('branch_id', $branchId)->orWhereNull('branch_id');
                })
            ],
            'cost_price'                  => 'required|numeric|min:0',
            'selling_price'               => 'required|numeric|min:0',
            'image'                       => 'nullable|image|mimes:jpeg,png,webp,jpg|max:2048',
            'recipe'                      => 'required|array|min:1',
            'recipe.*.ingredient_id' => [
    'required',
    Rule::exists('ingredient_stocks', 'ingredient_id')->where(function($q) use ($branchId) {
        $q->where('branch_id', $branchId);
    })
],
            'recipe.*.quantity_required'  => 'required|numeric|min:0.0001',
            'branch_ids'                  => 'nullable|array',
            'branch_ids.*'                => 'exists:branches,id',
            'unit'                        => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
        ], [
            'recipe.required' => 'At least one ingredient is required.',
            'recipe.min'      => 'At least one ingredient is required.',
        ]);

        // Strict Validation for Branch Isolation
        if (!empty($validated['recipe'])) {
            foreach ($validated['recipe'] as $item) {
                $ingredient = Ingredient::find($item['ingredient_id']);
                if ($ingredient && $ingredient->branch_id != $branchId) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'recipe' => 'Invalid ingredient selection: ingredient does not belong to this branch.'
                    ]);
                }
            }
        }

        $this->productService->update($product, $validated, $request->file('image'));

        return redirect()->back();
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

        return redirect()->back();
    }
}
