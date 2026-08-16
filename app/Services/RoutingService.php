<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RoutingService
{
    /**
     * Calculate a road-network route between origin and destination.
     *
     * @param float $originLat
     * @param float $originLng
     * @param float $destLat
     * @param float $destLng
     * @param string $profile 'driving' | 'motorcycle' | 'cycling'
     * @return array
     */
    public function getRoute(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng,
        string $profile = 'driving'
    ): array {
        // Validate coordinates
        if ($originLat < -90 || $originLat > 90 || $originLng < -180 || $originLng > 180 ||
            $destLat < -90 || $destLat > 90 || $destLng < -180 || $destLng > 180) {
            return [
                'success' => false,
                'message' => 'Invalid coordinates provided.',
            ];
        }

        // Cache key with 4-decimal precision (~11 meters) to reduce redundant routing calls
        $cacheKey = sprintf(
            'route_%s_%s_%s_%s_%s',
            round($originLat, 4),
            round($originLng, 4),
            round($destLat, 4),
            round($destLng, 4),
            $profile
        );

        $lastKnownKey = sprintf(
            'last_known_route_%s_%s_%s',
            round($destLat, 4),
            round($destLng, 4),
            $profile
        );

        return Cache::remember($cacheKey, 60, function () use ($originLat, $originLng, $destLat, $destLng, $profile, $lastKnownKey) {
            // 1. Try OpenRouteService if API key is configured
            $orsKey = config('services.openrouteservice.key');
            if (!empty($orsKey)) {
                $orsResult = $this->queryOpenRouteService($originLat, $originLng, $destLat, $destLng, $profile, $orsKey);
                if ($orsResult['success']) {
                    Cache::put($lastKnownKey, $orsResult, 3600);
                    return $orsResult;
                }
            }

            // 2. Query OSRM (Open Source Routing Machine) as primary/fallback OpenStreetMap engine
            $osrmResult = $this->queryOsrm($originLat, $originLng, $destLat, $destLng, $profile);
            if ($osrmResult['success']) {
                Cache::put($lastKnownKey, $osrmResult, 3600);
                return $osrmResult;
            }

            // 3. Last-Known-Route Fallback: if we have a previously calculated route to this destination, preserve it!
            $lastKnown = Cache::get($lastKnownKey);
            if ($lastKnown && !empty($lastKnown['coordinates']) && count($lastKnown['coordinates']) > 2) {
                $lastKnown['is_stale'] = true;
                $lastKnown['message'] = 'Route update delayed — showing last known route.';
                return $lastKnown;
            }

            // 4. Linear Fallback when all routing providers are unreachable and no cached route exists
            Log::warning('Road routing providers unreachable. Using linear fallback.', [
                'origin' => [$originLat, $originLng],
                'destination' => [$destLat, $destLng],
            ]);

            // Calculate approximate Haversine distance
            $earthRadius = 6371000; // meters
            $latFrom = deg2rad($originLat);
            $lonFrom = deg2rad($originLng);
            $latTo = deg2rad($destLat);
            $lonTo = deg2rad($destLng);
            $latDelta = $latTo - $latFrom;
            $lonDelta = $lonTo - $lonFrom;
            $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) + cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
            $approxMeters = round($angle * $earthRadius, 1);
            $approxSeconds = round(($approxMeters / 1000) / 30 * 3600); // estimated at 30 km/h avg speed

            return [
                'success'          => false,
                'is_fallback'      => true,
                'is_stale'         => false,
                'message'          => 'Live location active — road route temporarily unavailable.',
                'provider'         => 'fallback_linear',
                'distance_meters'  => $approxMeters,
                'distance_km'      => round($approxMeters / 1000, 2),
                'duration_seconds' => (int) $approxSeconds,
                'duration_minutes' => (int) max(1, round($approxSeconds / 60)),
                'coordinates'      => [
                    [(float) $originLat, (float) $originLng],
                    [(float) $destLat, (float) $destLng],
                ],
                'summary' => [
                    'distance_text' => $approxMeters < 1000 ? round($approxMeters) . ' m' : round($approxMeters / 1000, 1) . ' km',
                    'duration_text' => max(1, round($approxSeconds / 60)) . ' mins',
                ],
            ];
        });
    }

    /**
     * Query OpenRouteService Directions API.
     */
    protected function queryOpenRouteService(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng,
        string $profile,
        string $apiKey
    ): array {
        try {
            $orsProfile = match ($profile) {
                'motorcycle' => 'driving-motorcycle',
                'cycling'    => 'cycling-regular',
                default      => 'driving-car',
            };

            $url = "https://api.openrouteservice.org/v2/directions/{$orsProfile}/geojson";

            $response = Http::withoutVerifying()
                ->timeout(5)
                ->withHeaders([
                    'Authorization' => $apiKey,
                    'Content-Type'  => 'application/json',
                    'Accept'        => 'application/geo+json, application/json',
                    'User-Agent'    => 'MakiDesuDelivery/1.0 (Laravel)',
                ])
                ->post($url, [
                    'coordinates' => [
                        [(float) $originLng, (float) $originLat],
                        [(float) $destLng, (float) $destLat],
                    ],
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $feature = $data['features'][0] ?? null;

                if ($feature && isset($feature['geometry']['coordinates'])) {
                    $rawCoords = $feature['geometry']['coordinates']; // [[lng, lat], ...]
                    $latLngs = array_map(fn($pt) => [(float) $pt[1], (float) $pt[0]], $rawCoords);

                    $summary = $feature['properties']['summary'] ?? [];
                    $distanceMeters = (float) ($summary['distance'] ?? 0);
                    $durationSeconds = (float) ($summary['duration'] ?? 0);

                    return $this->formatNormalizedRoute(
                        'openrouteservice',
                        $latLngs,
                        $distanceMeters,
                        $durationSeconds
                    );
                }
            }
        } catch (\Throwable $e) {
            Log::info('OpenRouteService query failed: ' . $e->getMessage());
        }

        return ['success' => false];
    }

    /**
     * Query OSRM (Open Source Routing Machine) free OpenStreetMap routing engine with mirror support.
     */
    protected function queryOsrm(
        float $originLat,
        float $originLng,
        float $destLat,
        float $destLng,
        string $profile
    ): array {
        $endpoints = [
            config('services.osrm.base_url', 'https://router.project-osrm.org/route/v1/driving'),
            'https://routing.openstreetmap.de/routed-car/route/v1/driving',
        ];

        foreach ($endpoints as $baseUrl) {
            try {
                $url = "{$baseUrl}/{$originLng},{$originLat};{$destLng},{$destLat}?overview=full&geometries=geojson";

                $response = Http::withoutVerifying()
                    ->timeout(6)
                    ->withHeaders([
                        'Accept'     => 'application/json',
                        'User-Agent' => 'MakiDesuDelivery/1.0 (OpenStreetMap Road Routing)',
                    ])
                    ->get($url);

                if ($response->successful()) {
                    $data = $response->json();
                    $route = $data['routes'][0] ?? null;

                    if ($route && isset($route['geometry']['coordinates']) && !empty($route['geometry']['coordinates'])) {
                        $rawCoords = $route['geometry']['coordinates']; // [[lng, lat], ...]
                        $latLngs = array_map(fn($pt) => [(float) $pt[1], (float) $pt[0]], $rawCoords);

                        $distanceMeters = (float) ($route['distance'] ?? 0);
                        $durationSeconds = (float) ($route['duration'] ?? 0);

                        return $this->formatNormalizedRoute(
                            'osrm',
                            $latLngs,
                            $distanceMeters,
                            $durationSeconds
                        );
                    }
                }
            } catch (\Throwable $e) {
                Log::info("OSRM endpoint ($baseUrl) failed: " . $e->getMessage());
            }
        }

        return ['success' => false];
    }

    /**
     * Format normalized route response.
     */
    protected function formatNormalizedRoute(
        string $provider,
        array $latLngCoordinates,
        float $distanceMeters,
        float $durationSeconds
    ): array {
        $distanceKm = round($distanceMeters / 1000, 2);
        $durationMinutes = (int) max(1, round($durationSeconds / 60));

        $distanceText = $distanceKm < 1
            ? round($distanceMeters) . ' m'
            : round($distanceKm, 1) . ' km';

        $durationText = $durationMinutes . ' mins';

        return [
            'success'          => true,
            'is_fallback'      => false,
            'is_stale'         => false,
            'provider'         => $provider,
            'distance_meters'  => round($distanceMeters, 1),
            'distance_km'      => $distanceKm,
            'duration_seconds' => (int) round($durationSeconds),
            'duration_minutes' => $durationMinutes,
            'coordinates'      => $latLngCoordinates, // Array of [lat, lng]
            'summary'          => [
                'distance_text' => $distanceText,
                'duration_text' => $durationText,
            ],
        ];
    }
}
