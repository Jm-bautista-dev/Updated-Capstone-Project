<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * List products for the mobile app.
     * GET /api/v1/products
     *
     * Modes:
     *   ?mode=merged        → All branches, grouped by product name
     *   ?branch_id=1        → Filter to a specific branch
     *   (no params)         → All branches, flat list with branch info
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['unit_model', 'category', 'branch'])
            ->orderBy('name');

        // ── Branch filter ─────────────────────────────────────────────────
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->integer('branch_id'));
        }

        // ── Category filter ───────────────────────────────────────────────
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        // ── Search filter ─────────────────────────────────────────────────
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $products = $query->get();

        // ── Mode: merged — group by product name across branches ──────────
        if ($request->input('mode') === 'merged') {
            $grouped = $products
                ->groupBy('name')
                ->map(function ($group, $name) {
                    /** @var Product $first */
                    $first = $group->first();
                    return [
                        'name'        => $name,
                        'category_id' => $first->category_id,
                        'category'    => $first->category?->name ?? 'Uncategorized',
                        'description' => $first->description,
                        'image'       => $this->resolveImageUrl($first->image_path),
                        'unit'        => $first->unit_model?->abbreviation ?? ($first->unit ?? 'pcs'),
                        'branches'    => $group->map(fn(Product $p) => [
                            'branch_id'   => $p->branch_id,
                            'branch_name' => $p->branch?->name ?? 'Unknown',
                            'product_id'  => $p->id,
                            'price'       => (float) ($p->selling_price ?? 0),
                            'sku'         => $p->sku,
                        ])->values(),
                    ];
                })
                ->values();

            return response()->json([
                'mode'     => 'merged',
                'count'    => $grouped->count(),
                'products' => $grouped,
            ]);
        }

        // ── Default: flat list with branch info ───────────────────────────
        $formatted = $products->map(fn(Product $p) => $this->formatProduct($p));

        return response()->json([
            'mode'     => $request->filled('branch_id') ? 'branch' : 'all',
            'count'    => $formatted->count(),
            'products' => $formatted,
        ]);
    }

    /**
     * Get a single product (detailed).
     * GET /api/v1/products/{id}
     */
    public function show(int $id): JsonResponse
    {
        $product = Product::with(['category', 'ingredients', 'branch', 'unit_model'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatProduct($product),
        ]);
    }

    /**
     * Format a single product for the mobile API response.
     */
    private function formatProduct(Product $product): array
    {
        return [
            'id'            => $product->id,
            'name'          => $product->name,
            'sku'           => $product->sku,
            'price'         => (float) ($product->selling_price ?? 0),
            'selling_price' => (float) ($product->selling_price ?? 0),
            'cost_price'    => (float) ($product->cost_price ?? 0),
            'image'         => $this->resolveImageUrl($product->image_path),
            'category_id'   => $product->category_id,
            'category'      => $product->category?->name ?? 'Uncategorized',
            'description'   => $product->description,
            'unit'          => $product->unit_model?->abbreviation ?? ($product->unit ?? 'pcs'),
            'stock'         => (float) ($product->computed_stock ?? 0),
            'branch_id'     => $product->branch_id,
            'branch_name'   => $product->branch?->name ?? 'Unknown',
        ];
    }

    /**
     * Resolve a stored image path to a public URL.
     * Works on both local (symlinked) and Hostinger shared hosting.
     */
    private function resolveImageUrl(?string $imagePath): ?string
    {
        if (! $imagePath) return null;

        try {
            return Storage::disk('public')->url($imagePath);
        } catch (\Exception $e) {
            // Fallback: build URL manually using APP_URL
            return rtrim(config('app.url'), '/') . '/storage/' . $imagePath;
        }
    }
}
