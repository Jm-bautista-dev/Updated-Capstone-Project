<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Get products based on the nearest branch to the user's GPS location.
     */
    public function getProductsByLocation(Request $request)
    {
        $lat = $request->lat;
        $lng = $request->lng;

        if (!$lat || !$lng) {
            return response()->json([
                'status' => 'error',
                'message' => 'Latitude and longitude are required',
                'products' => []
            ], 400);
        }

        $branches = Branch::all();

        $nearestBranch = null;
        $minDistance = INF;

        foreach ($branches as $branch) {
            $distance = $this->haversine(
                (float) $lat,
                (float) $lng,
                (float) $branch->latitude,
                (float) $branch->longitude
            );

            if ($distance <= (float) $branch->delivery_radius_km && $distance < $minDistance) {
                $nearestBranch = $branch;
                $minDistance = $distance;
            }
        }

        if (!$nearestBranch) {
            return response()->json([
                'status' => 'success',
                'message' => 'No delivery available in your area',
                'products' => []
            ]);
        }

        // Get products belonging to the nearest branch
        $products = Product::where('branch_id', $nearestBranch->id)
            ->whereNull('deleted_at')
            ->with(['category', 'unit_model'])
            ->get();

        // Format products to include dynamic stock calculation
        $formattedProducts = $products->map(function ($product) use ($nearestBranch) {
            $availability = $product->dynamicAvailability($nearestBranch->id);
            
            return [
                'id'            => $product->id,
                'name'          => $product->name,
                'price'         => (float) $product->selling_price,
                'description'   => $product->description,
                'image'         => $this->resolveImageUrl($product->image_path),
                'category'      => $product->category?->name ?? 'Uncategorized',
                'unit'          => $product->unit_model?->abbreviation ?? ($product->unit ?? 'pcs'),
                'stock'         => (float) $availability['available'], // This is the calculated stock
                'is_low_stock'  => $availability['is_low_stock'],
                'limiting_item' => $availability['limiting_ingredient'],
            ];
        });

        return response()->json([
            'status' => 'success',
            'branch' => [
                'id' => $nearestBranch->id,
                'name' => $nearestBranch->name,
                'address' => $nearestBranch->address,
            ],
            'distance_km' => round($minDistance, 2),
            'products' => $formattedProducts
        ]);
    }

    private function resolveImageUrl(?string $imagePath): ?string
    {
        if (!$imagePath) return null;
        try {
            return Storage::disk('public')->url($imagePath);
        } catch (\Exception $e) {
            return rtrim(config('app.url'), '/') . '/storage/' . $imagePath;
        }
    }

    private function haversine($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }
}
