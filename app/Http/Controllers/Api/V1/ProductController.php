<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Traits\HasImageResolution;

class ProductController extends Controller
{
    use HasImageResolution;

    /**
     * Get products based on the nearest branch to the user's GPS location.
     */
    public function getProductsByLocation(Request $request)
    {
        $lat = $request->lat;
        $lng = $request->lng;

        $branches = Branch::all();
        $nearestBranch = null;
        $minDistance = INF;

        if ($lat && $lng) {
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
        } elseif ($request->filled('branch_id')) {
            $nearestBranch = Branch::find($request->branch_id);
            $minDistance = 0;
        } else {
            $nearestBranch = Branch::first();
            $minDistance = 0;
        }

        if (!$nearestBranch) {
            return response()->json([
                'status' => 'success',
                'message' => 'No delivery available in your area',
                'products' => []
            ]);
        }

        // Get products belonging to the nearest branch or global products
        $query = Product::where(function($q) use ($nearestBranch) {
                $q->where('branch_id', $nearestBranch->id)
                  ->orWhereNull('branch_id');
            })
            ->whereNull('deleted_at')
            ->with(['category', 'unit_model']);

        // Support category filtering
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->get();

        // Format products to include dynamic stock calculation
        $formattedProducts = $products->map(function (Product $product) use ($nearestBranch) {
            $availability = $product->dynamicAvailability($nearestBranch->id);
            
            return [
                'id'             => $product->id,
                'name'           => $product->name,
                'price'          => (float) $product->selling_price,
                'selling_price'  => (float) $product->selling_price,
                'description'    => $product->description,
                'image'          => $this->resolveImageUrl($product->image_path),
                'category'       => $product->category?->name ?? 'Uncategorized',
                'unit'           => $product->unit_model?->abbreviation ?? ($product->unit ?? 'pcs'),
                'stock'          => (float) $availability['available'],
                'is_available'   => (bool) $availability['is_available'],
                'is_low_stock'   => $availability['is_low_stock'],
                'limiting_item'  => $availability['limiting_ingredient'],
                'average_rating' => $product->average_rating,
                'review_count'   => $product->review_count,
                'quantity_sold'  => $product->quantity_sold,
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
