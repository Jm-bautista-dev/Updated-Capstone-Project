<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;

use App\Traits\HasImageResolution;

class ProductController extends Controller
{
    use HasImageResolution;

    /**
     * Display a listing of products for customers.
     * Safely scoped to prevent data leaks.
     */
    public function index(Request $request)
    {
        $branchId = $request->branch_id ?? 1;

        $query = Product::where(function($q) use ($branchId) {
            $q->where('branch_id', $branchId)
              ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
        });

        // Filter by category slug if provided
        if ($request->filled('category')) {
            $slug = $request->category;
            $query->whereHas('category', function ($q) use ($slug) {
                $q->whereRaw("LOWER(REPLACE(name, ' ', '-')) = ?", [strtolower($slug)]);
            });
        }

        $products = $query->latest()
            ->select(['id', 'name', 'selling_price', 'image_path', 'description', 'category_id'])
            ->get()
            ->map(function ($product) use ($branchId) {
                /** @var \App\Models\Product $product */
                $availability = $product->dynamicAvailability($branchId);
                
                return [
                    'id'            => $product->id,
                    'name'          => $product->name,
                    'price'         => (float) $product->selling_price,
                    'selling_price' => (float) $product->selling_price,
                    'description'   => $product->description,
                    'image'         => $this->resolveImageUrl($product->image_path),
                    'category_id'   => $product->category_id,
                    'available_to_sell' => $availability['available'],
                    'limiting_ingredient' => $availability['limiting_ingredient'],
                    'is_low_stock' => $availability['is_low_stock'],
                ];
            });

        return response()->json($products);
    }
}
