<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * List latest products for the mobile POS menu (No Caching).
     * GET /api/v1/products
     */
    public function index(Request $request): JsonResponse
    {
        // Use optional sanctum auth to identify user even on public routes
        $user = auth('sanctum')->user();
        
        // Priority: Request Param -> User Profile -> Default to Branch 1 (Victoria)
        $branchId = $request->branch_id ?? $user?->branch_id ?? 1;

        $query = Product::with(['unit_model', 'category'])
            ->where(function($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereHas('branches', fn($bq) => $bq->where('branches.id', $branchId));
            });

        // Filter by category if requested
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->latest()
            ->get()
            ->map(fn(Product $product) => $this->formatForMobileMenu($product));

        return response()->json($products);
    }

    /**
     * Get a single product (Detailed).
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::with(['category', 'ingredients', 'branches', 'unit_model'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatForMobileMenu($product),
        ]);
    }

    /**
     * Format product data exactly as requested for mobile POS menu.
     */
    private function formatForMobileMenu(Product $product): array
    {
        $imagePath = $product->image_path;
        
        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $imageUrl = $imagePath ? $disk->url($imagePath) : null;

        return [
            'id'          => $product->id,
            'name'        => $product->name,
            'sku'         => $product->sku,
            'price'       => (float) ($product->selling_price ?? 0),
            'image'       => $imageUrl,
            'category_id' => $product->category_id,
            'category'    => $product->category ? $product->category->name : 'Uncategorized',
            'description' => $product->description,
            'unit'        => $product->unit_model ? $product->unit_model->abbreviation : ($product->unit ?? 'pcs'),
            'stock'       => (float) $product->computed_stock,
        ];
    }
}
