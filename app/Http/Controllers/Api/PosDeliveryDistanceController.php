<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Services\RoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PosDeliveryDistanceController extends Controller
{
    protected RoutingService $routingService;

    public function __construct(RoutingService $routingService)
    {
        $this->routingService = $routingService;
    }

    /**
     * POST /api/pos/calculate-delivery-distance
     *
     * Calculates geocoded customer coordinates, road distance from the POS branch,
     * estimated travel time, and exact delivery fee.
     */
    public function calculate(Request $request): JsonResponse
    {
        $request->validate([
            'address'   => 'required|string|min:3|max:500',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'latitude'  => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
        ]);

        $user = Auth::user();
        $branchId = $request->input('branch_id', $user?->branch_id);

        /** @var Branch|null $branch */
        $branch = null;
        if ($branchId) {
            $branch = Branch::find($branchId);
        }

        // Fallback to first branch if no branch associated
        if (!$branch) {
            $branch = Branch::first();
        }

        if (!$branch || !$branch->latitude || !$branch->longitude) {
            return response()->json([
                'success' => false,
                'message' => 'Branch location coordinates are not configured. Please contact the administrator.',
            ], 422);
        }

        $branchLat = (float) $branch->latitude;
        $branchLng = (float) $branch->longitude;

        $destLat = $request->filled('latitude') ? (float) $request->input('latitude') : null;
        $destLng = $request->filled('longitude') ? (float) $request->input('longitude') : null;
        $formattedAddress = $request->input('address');

        // 1. Geocode address if coordinates not supplied
        if ($destLat === null || $destLng === null) {
            $geocodeResult = $this->geocodeAddress($request->input('address'), $branch);

            if (!$geocodeResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unable to locate this address. Please check spelling or enter a more specific location (e.g. Barangay, Town).',
                ], 422);
            }

            $destLat = $geocodeResult['latitude'];
            $destLng = $geocodeResult['longitude'];
            $formattedAddress = $geocodeResult['formatted_address'] ?? $request->input('address');
        }

        // 2. Calculate Road Routing via RoutingService (OSRM / OpenRouteService)
        $routeResult = $this->routingService->getRoute($branchLat, $branchLng, $destLat, $destLng);

        $distanceKm = 0.0;
        $durationSeconds = 0;
        $durationText = '5–10 min';
        $routeCoordinates = [];

        if (!empty($routeResult['distance_meters'])) {
            $distanceKm = round($routeResult['distance_meters'] / 1000, 1);
            $durationSeconds = (int) ($routeResult['duration_seconds'] ?? 0);
            $durationText = $this->formatDuration($durationSeconds, $distanceKm);
            $routeCoordinates = $routeResult['coordinates'] ?? [];
        } else {
            // Straight-line fallback distance
            $earthRadius = 6371; // km
            $dLat = deg2rad($destLat - $branchLat);
            $dLng = deg2rad($destLng - $branchLng);
            $a = sin($dLat / 2) * sin($dLat / 2) +
                 cos(deg2rad($branchLat)) * cos(deg2rad($destLat)) *
                 sin($dLng / 2) * sin($dLng / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distanceKm = round($earthRadius * $c, 1);
            $durationSeconds = (int) round(($distanceKm / 30) * 3600);
            $durationText = $this->formatDuration($durationSeconds, $distanceKm);
            $routeCoordinates = [
                [$branchLat, $branchLng],
                [$destLat, $destLng],
            ];
        }

        // Ensure minimum 0.5km for local delivery
        $distanceKm = max(0.5, $distanceKm);

        // 3. Compute Delivery Fee using DeliveryFeeService
        $feeService = app(\App\Services\DeliveryFeeService::class);
        $subtotal = $request->filled('subtotal') ? (float) $request->input('subtotal') : null;
        $breakdown = $feeService->calculateFee($branch, $distanceKm, $subtotal);

        $deliveryFee = $breakdown['delivery_fee'];
        $isWithinRadius = $breakdown['is_within_radius'];

        return response()->json([
            'success'            => true,
            'distance_km'        => $distanceKm,
            'distance_text'      => sprintf('%.1f km', $distanceKm),
            'duration_seconds'   => $durationSeconds,
            'duration_text'      => $durationText,
            'delivery_fee'       => $deliveryFee,
            'breakdown'          => $breakdown,
            'is_within_radius'   => $isWithinRadius,
            'delivery_radius_km' => (float) ($branch->delivery_radius_km ?? 15),
            'branch'             => [
                'id'        => $branch->id,
                'name'      => $branch->name,
                'latitude'  => $branchLat,
                'longitude' => $branchLng,
            ],
            'customer'           => [
                'latitude'          => $destLat,
                'longitude'         => $destLng,
                'formatted_address' => $formattedAddress,
            ],
            'route_coordinates'  => $routeCoordinates,
        ]);
    }

    /**
     * Geocodes an address string with Philippine region biasing using Nominatim.
     */
    protected function geocodeAddress(string $address, Branch $branch): array
    {
        $cacheKey = 'geocode_' . md5(strtolower(trim($address)));

        return Cache::remember($cacheKey, 86400, function () use ($address, $branch) {
            try {
                $query = trim($address);

                // If address doesn't explicitly mention Philippines/Laguna, bias search query
                if (!preg_match('/(philippines|laguna|victoria|sta\.?\s*cruz|pila|calamba|manila)/i', $query)) {
                    $query .= ', Laguna, Philippines';
                } elseif (!preg_match('/(philippines)/i', $query)) {
                    $query .= ', Philippines';
                }

                $response = Http::withoutVerifying()
                    ->timeout(5)
                    ->withHeaders([
                        'User-Agent'      => 'MakiDesuPOSDelivery/1.0 (contact: admin@makidesuoperation.site)',
                        'Accept-Language' => 'en-PH,en;q=0.9',
                    ])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'q'              => $query,
                        'format'         => 'json',
                        'addressdetails' => 1,
                        'limit'          => 1,
                        'countrycodes'   => 'ph',
                    ]);

                if ($response->successful()) {
                    $data = $response->json();
                    if (!empty($data) && isset($data[0]['lat']) && isset($data[0]['lon'])) {
                        return [
                            'success'           => true,
                            'latitude'          => (float) $data[0]['lat'],
                            'longitude'         => (float) $data[0]['lon'],
                            'formatted_address' => $data[0]['display_name'] ?? $address,
                        ];
                    }
                }

                // Secondary attempt without adding Laguna
                $fallbackResponse = Http::withoutVerifying()
                    ->timeout(5)
                    ->withHeaders([
                        'User-Agent' => 'MakiDesuPOSDelivery/1.0',
                    ])
                    ->get('https://nominatim.openstreetmap.org/search', [
                        'q'            => $address,
                        'format'       => 'json',
                        'limit'        => 1,
                        'countrycodes' => 'ph',
                    ]);

                if ($fallbackResponse->successful()) {
                    $fbData = $fallbackResponse->json();
                    if (!empty($fbData) && isset($fbData[0]['lat']) && isset($fbData[0]['lon'])) {
                        return [
                            'success'           => true,
                            'latitude'          => (float) $fbData[0]['lat'],
                            'longitude'         => (float) $fbData[0]['lon'],
                            'formatted_address' => $fbData[0]['display_name'] ?? $address,
                        ];
                    }
                }

                return ['success' => false];
            } catch (\Throwable $e) {
                Log::warning('Geocoding service error: ' . $e->getMessage(), ['address' => $address]);
                return ['success' => false];
            }
        });
    }

    /**
     * Format duration seconds to human-friendly delivery time window.
     */
    protected function formatDuration(int $seconds, float $distanceKm): string
    {
        $minutes = max(5, (int) round($seconds / 60));
        $minWindow = max(5, $minutes - 3);
        $maxWindow = $minutes + 5;

        return "{$minWindow}–{$maxWindow} min";
    }
}
