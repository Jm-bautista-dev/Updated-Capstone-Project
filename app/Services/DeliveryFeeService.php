<?php

namespace App\Services;

use App\Models\Branch;
use InvalidArgumentException;

class DeliveryFeeService
{
    /**
     * Compute authoritative delivery fee and comprehensive breakdown.
     *
     * @param Branch $branch Originating store branch
     * @param float $distanceKm Customer distance from branch in kilometers
     * @param float|null $subtotal Optional product food subtotal for ratio analysis
     * @return array<string, mixed>
     */
    public function calculateFee(Branch $branch, float $distanceKm, ?float $subtotal = null): array
    {
        if ($distanceKm < 0 || !is_finite($distanceKm)) {
            throw new InvalidArgumentException("Delivery distance must be a valid non-negative finite number. Received: {$distanceKm}");
        }

        $base = (float) ($branch->base_delivery_fee ?? 49.00);
        $perKm = (float) ($branch->per_km_fee ?? 15.00);
        $freeKm = (float) config('delivery.free_distance_km', 1.0);
        $maxDistance = (float) ($branch->delivery_radius_km ?: config('delivery.max_distance_km', 50.0));
        $maxFee = (float) (config('delivery.max_delivery_fee') ?: 300.00);
        $warningRatio = (float) config('delivery.delivery_fee_warning_ratio', 0.75);

        // Sanitize and round distance to 1 decimal place like Grab / Foodpanda
        $sanitizedDistance = max(0.0, round($distanceKm, 2));
        $roundedDistance = ceil($sanitizedDistance * 10) / 10;

        $chargeableKm = max(0.0, round($roundedDistance - $freeKm, 1));
        $distanceCharge = round($chargeableKm * $perKm, 2);

        $uncappedFee = $roundedDistance <= $freeKm
            ? $base
            : round($base + $distanceCharge, 2);

        $isCapped = $maxFee > 0 && $uncappedFee > $maxFee;
        $finalFee = $isCapped ? $maxFee : max($base, $uncappedFee);

        $isWithinRadius = $sanitizedDistance <= $maxDistance;

        $ratio = ($subtotal !== null && $subtotal > 0)
            ? round(($finalFee / $subtotal) * 100, 2)
            : null;

        $isHighRatio = $ratio !== null && ($ratio / 100) >= $warningRatio;

        return [
            'delivery_fee'         => $finalFee,
            'uncapped_fee'         => $uncappedFee,
            'base_fee'             => $base,
            'per_km_fee'           => $perKm,
            'free_distance_km'     => $freeKm,
            'actual_distance_km'   => $sanitizedDistance,
            'rounded_distance_km'  => $roundedDistance,
            'chargeable_distance'  => $chargeableKm,
            'distance_charge'      => $distanceCharge,
            'is_within_radius'     => $isWithinRadius,
            'max_radius_km'        => $maxDistance,
            'is_capped'            => $isCapped,
            'max_delivery_fee'     => $maxFee,
            'warning_ratio'        => $warningRatio,
            'fee_to_subtotal_pct'  => $ratio,
            'is_high_fee_ratio'    => $isHighRatio,
            'warning_message'      => $isHighRatio
                ? "Delivery fee (₱" . number_format($finalFee, 2) . ") is {$ratio}% of food subtotal (₱" . number_format($subtotal, 2) . ") due to distance ({$roundedDistance} km)."
                : null,
            'formula_description'  => "₱" . number_format($base, 2) . " base (first {$freeKm}km) + (({$roundedDistance}km - {$freeKm}km) × ₱" . number_format($perKm, 2) . "/km) = ₱" . number_format($finalFee, 2),
        ];
    }

    /**
     * Validate client delivery fee against server authoritative pricing.
     */
    public function validateClientFee(Branch $branch, float $distanceKm, float $clientFee, float $tolerance = 1.00): array
    {
        $authoritative = $this->calculateFee($branch, $distanceKm);
        $expectedFee = $authoritative['delivery_fee'];

        $difference = abs($clientFee - $expectedFee);
        $isValid = $difference <= $tolerance;

        return [
            'is_valid'          => $isValid,
            'authoritative_fee' => $expectedFee,
            'client_fee'        => $clientFee,
            'difference'        => round($difference, 2),
            'breakdown'         => $authoritative,
        ];
    }
}
