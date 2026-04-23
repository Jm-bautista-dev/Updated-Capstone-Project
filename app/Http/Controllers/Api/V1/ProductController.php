<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use Illuminate\Http\Request;

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

            // Check if distance is within delivery radius and is the closest so far
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
        // Note: Using with('category') for better React Native integration if needed
        $products = Product::where('branch_id', $nearestBranch->id)
            ->whereNull('deleted_at')
            ->get();

        return response()->json([
            'status' => 'success',
            'branch' => $nearestBranch,
            'distance_km' => round($minDistance, 2),
            'products' => $products
        ]);
    }

    /**
     * Helper function to calculate distance between two GPS coordinates using Haversine formula.
     */
    private function haversine($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371; // Earth's radius in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
