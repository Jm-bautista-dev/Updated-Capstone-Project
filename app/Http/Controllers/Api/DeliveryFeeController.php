<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeliveryFeeController extends Controller
{
    /**
     * Calculate exact delivery fee based on GPS coordinates.
     * POST /api/v1/delivery/check-fee
     */
    public function checkFee(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'latitude'  => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
        ]);

        $branchId = $validated['branch_id'] ?? 1;
        
        /** @var \App\Models\Branch|null $branch */
        $branch = Branch::find($branchId);

        if (!$branch || !$branch->latitude || !$branch->longitude) {
            return response()->json([
                'success' => false,
                'message' => 'Branch location not configured correctly.'
            ], 500);
        }

        // Haversine Formula
        $earthRadius = 6371; // km
        $latFrom = deg2rad((float) $branch->latitude);
        $lonFrom = deg2rad((float) $branch->longitude);
        $latTo   = deg2rad((float) $validated['latitude']);
        $lonTo   = deg2rad((float) $validated['longitude']);

        $latDelta = $latTo - $latFrom;
        $lonDelta = $lonTo - $lonFrom;

        $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
            cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
        
        $distanceKm = round($angle * $earthRadius, 2);

        $feeService = app(\App\Services\DeliveryFeeService::class);
        $subtotal = $request->filled('subtotal') ? (float) $request->input('subtotal') : null;
        $breakdown = $feeService->calculateFee($branch, $distanceKm, $subtotal);

        $isWithinRadius = $breakdown['is_within_radius'];
        $fee = $breakdown['delivery_fee'];

        return response()->json([
            'success'        => true,
            'is_deliverable' => $isWithinRadius,
            'distance_km'    => $distanceKm,
            'delivery_fee'   => $fee,
            'max_radius_km'  => $breakdown['max_radius_km'],
            'breakdown'      => $breakdown,
            'message'        => $isWithinRadius 
                                ? 'Address is deliverable.' 
                                : 'Out of delivery range. Max distance is ' . $breakdown['max_radius_km'] . 'km.'
        ]);
    }
}
