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
        $user     = Auth::user();
        $branchId = $user->branch_id;

        // Load products scoped to the cashier's branch via many-to-many relationship
        $productsQuery = Product::with(['category', 'ingredients', 'branches']);
        if ($branchId) {
            $productsQuery->whereHas('branches', function ($query) use ($branchId) {
                $query->where('branches.id', $branchId);
            });
        }

        $products = $productsQuery->get()->map(function ($product) {
            $product->stock    = $product->computed_stock;
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $product->image_url = $product->image_path
                ? $disk->url($product->image_path)
                : null;
            return $product;
        });

        // Load categories scoped to the cashier's branch via many-to-many relationship
        $categoriesQuery = Category::orderBy('name');
        if ($branchId) {
            $categoriesQuery->whereHas('branches', function ($query) use ($branchId) {
                $query->where('branches.id', $branchId);
            });
        }

        $categories = $categoriesQuery->get()->map(function ($category) {
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            $category->image_url = $category->image_path
                ? $disk->url($category->image_path)
                : null;
            return $category;
        });

        $recentOrders = Sale::with('items.product')
            ->where('user_id', Auth::id())
            ->latest()
            ->limit(10)
            ->get();

        $availableRiders = [];
        if ($branchId) {
            $availableRiders = Rider::where('branch_id', $branchId)
                ->available()
                ->get(['id', 'name', 'phone']);
        }

        return Inertia::render('Pos/Index', [
            'products'        => $products,
            'categories'      => $categories,
            'recentOrders'    => $recentOrders,
            'branch'          => $user->branch,
            'availableRiders' => $availableRiders,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'          => 'required|string',
            'items'         => 'required|array|min:1',
            'items.*.id'    => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'total'         => 'required|numeric',
            'payment_method'=> 'required|string',
            'paid_amount'   => 'required|numeric',
            'change_amount' => 'nullable|numeric',
            'delivery_info'  => 'nullable|array',
            'delivery_info.customer_name' => 'required_if:type,delivery|string',
            'delivery_info.customer_address' => 'required_if:type,delivery|string',
            'delivery_info.customer_phone' => 'nullable|string',
            'delivery_info.delivery_type' => 'required_if:type,delivery|in:internal,external',
            'delivery_info.rider_id' => 'required_if:delivery_info.delivery_type,internal|nullable|exists:riders,id',
            'delivery_info.external_service' => 'required_if:delivery_info.delivery_type,external|nullable|in:grab,lalamove',
            'delivery_info.tracking_number' => 'required_if:delivery_info.delivery_type,external|nullable|string',
            'delivery_info.distance_km' => ['required_if:type,delivery', 'numeric', 'gt:0', 'max:'.config('delivery.max_distance_km', 50)],
            'delivery_info.delivery_fee' => 'nullable|numeric',
            'delivery_info.external_notes' => 'nullable|string|max:1000',
            'delivery_info.proof_of_delivery' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        if ($request->hasFile('delivery_info.proof_of_delivery')) {
            $validated['delivery_info']['proof_of_delivery'] = $request->file('delivery_info.proof_of_delivery');
        }

        try {
            $orderNumber = 'POS-' . strtoupper(uniqid());
            $this->saleService->processSale(array_merge($validated, [
                'order_number' => $orderNumber,
                'status'       => 'completed',
            ]));

            return redirect()->back()->with('success', 'Order processed successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
