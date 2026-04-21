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
     * Logic:
     *   1. If lat/lng provided → detect nearest branch.
     *   2. If branch_id provided → use specific branch.
     *   3. Scopes products via branch_product relationship (No duplication).
     */
    public function index(Request $request): JsonResponse
    {
        $branchId = $request->integer('branch_id');
        $resolvedBranch = null;
        $distanceKm = null;

        // ── Step 1: Resolve Nearest Branch if coordinates provided ──────────
        if ($request->filled(['lat', 'lng'])) {
            $lat = $request->float('lat');
            $lng = $request->float('lng');

            // Find nearest branch WHERE distance is within its delivery_radius_km
            $resolvedBranch = \App\Models\Branch::select('*')
                ->selectRaw(
                    "(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance",
                    [$lat, $lng, $lat]
                )
                ->havingRaw('distance <= delivery_radius_km') // 👈 KEY FIX: Check radius here
                ->orderBy('distance')
                ->first();

            if ($resolvedBranch) {
                $branchId = $resolvedBranch->id;
                $distanceKm = round($resolvedBranch->distance, 2);
            } else {
                // If the nearest branches are all too far away for their radius
                return response()->json([
                    'success' => false,
                    'message' => 'Your location is outside our delivery zones.',
                    'products' => []
                ], 200); 
            }
        }

        // ── Step 2: Fetch Products (Branch-Aware Scoping) ───────────────────
        $query = Product::with(['unit_model', 'category', 'branches']);

        if ($branchId) {
            // Scope to specific branch via pivot table
            $query->whereHas('branches', function ($q) use ($branchId) {
                $q->where('branches.id', $branchId);
            });
        }

        // Search filter
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        $products = $query->orderBy('name')->get();

        // ── Mode: merged — group by product name across branches ──────────
        if ($request->input('mode') === 'merged') {
            $grouped = $products
                ->groupBy('name')
                ->map(function ($group, $name) {
                    $first = $group->first();
                    return [
                        'name'        => $name,
                        'category'    => $first->category?->name ?? 'Uncategorized',
                        'image'       => $this->resolveImageUrl($first->image_path),
                        'branches'    => $group->map(fn(Product $p) => [
                            'branch_id'   => $p->branch_id,
                            'price'       => (float) $p->selling_price,
                        ])->values(),
                    ];
                })->values();

            return response()->json([
                'mode'     => 'merged',
                'products' => $grouped,
            ]);
        }

        // ── Default: Return scoped menu with location context ─────────────
        $formatted = $products->map(fn(Product $p) => $this->formatProduct($p, $branchId));

        return response()->json([
            'success'     => true,
            'branch'      => $resolvedBranch ? $resolvedBranch->name : ($branchId ? \App\Models\Branch::find($branchId)?->name : 'Global'),
            'branch_id'   => $branchId,
            'distance_km' => $distanceKm,
            'count'       => $formatted->count(),
            'products'    => $formatted,
        ]);
    }

    /**
     * Get a single product (detailed).
     * GET /api/v1/products/{id}
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $branchId = $request->integer('branch_id');
        $product = Product::with(['category', 'ingredients', 'branches', 'unit_model'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $this->formatProduct($product, $branchId),
        ]);
    }

    /**
     * Unified Menu Fetch — get EVERYTHING in one call based on location.
     * GET /api/v1/customer/menu
     */
    public function getUnifiedMenu(Request $request): JsonResponse
    {
        $lat = $request->float('lat');
        $lng = $request->float('lng');

        if (!$lat || !$lng) {
            return response()->json(['success' => false, 'message' => 'Coordinates required'], 400);
        }

        // 1. Find Nearest Branch within its own radius
        $nearestBranch = \App\Models\Branch::select('*')
            ->selectRaw("(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance", [$lat, $lng, $lat])
            ->havingRaw('distance <= delivery_radius_km')
            ->orderBy('distance', 'asc')
            ->first();

        if (!$nearestBranch) {
            return response()->json(['success' => false, 'message' => 'No delivery available in your area'], 404);
        }

        // 2. Fetch Strictly local data (Categories and Products)
        $categories = \App\Models\Category::whereHas('branches', function($q) use ($nearestBranch) {
            $q->where('branches.id', $nearestBranch->id);
        })->get(['id', 'name', 'image_path']);

        $products = Product::whereHas('branches', function($q) use ($nearestBranch) {
            $q->where('branches.id', $nearestBranch->id);
        })->with(['unit_model', 'category'])->get();

        return response()->json([
            'success'    => true,
            'branch'     => $nearestBranch,
            'distance'   => round($nearestBranch->distance, 2),
            'categories' => $categories->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'image' => $this->resolveImageUrl($c->image_path)
            ]),
            'products'   => $products->map(fn($p) => $this->formatProduct($p, $nearestBranch->id)),
        ]);
    }

    /**
     * Format a single product for the mobile API response.
     */
    private function formatProduct(Product $product, ?int $branchId = null): array
    {
        // Compute availability based on branch context
        $availability = $product->dynamicAvailability($branchId);

        return [
            'id'            => $product->id,
            'name'          => $product->name,
            'sku'           => $product->sku,
            'price'         => (float) ($product->selling_price ?? 0),
            'image'         => $this->resolveImageUrl($product->image_path),
            'category'      => $product->category?->name ?? 'Uncategorized',
            'description'   => $product->description,
            'unit'          => $product->unit_model?->abbreviation ?? ($product->unit ?? 'pcs'),
            'stock'         => (float) $availability['available'],
            'is_low_stock'  => $availability['is_low_stock'],
            'limiting_item' => $availability['limiting_ingredient'],
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
            /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
            $disk = Storage::disk('public');
            return $disk->url($imagePath);
        } catch (\Exception $e) {
            // Fallback: build URL manually using APP_URL
            return rtrim(config('app.url'), '/') . '/storage/' . $imagePath;
        }
    }
}
