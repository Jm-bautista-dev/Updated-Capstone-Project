<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Branch extends Model
{
    protected $fillable = [
        'name',
        'address',
        'latitude',
        'longitude',
        'delivery_radius_km',
        'has_internal_riders',
        'base_delivery_fee',
        'per_km_fee',
    ];

    protected $casts = [
        'has_internal_riders' => 'boolean',
        'latitude'            => 'decimal:7',
        'longitude'           => 'decimal:7',
        'delivery_radius_km'  => 'decimal:2',
        'base_delivery_fee'   => 'decimal:2',
        'per_km_fee'          => 'decimal:2',
    ];

    /* ── Relationships ─────────────────────────────── */

    public function employees()
    {
        return $this->hasMany(User::class);
    }

    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function ingredients()
    {
        return $this->hasMany(Ingredient::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function riders()
    {
        return $this->hasMany(Rider::class);
    }

    public function suppliers()
    {
        return $this->hasMany(Supplier::class);
    }

    /* ── Delivery Helpers ──────────────────────────── */

    /**
     * Check if this branch can do internal deliveries.
     */
    public function canDeliverInternally(): bool
    {
        return $this->has_internal_riders && $this->riders()->available()->exists();
    }

    /**
     * Check if a given distance is within the branch delivery radius.
     */
    public function isWithinRadius(float $distanceKm): bool
    {
        return $distanceKm > 0 && $distanceKm <= (float) $this->delivery_radius_km;
    }

    /**
     * Calculate delivery fee using Grab-style pricing.
     * Base fee + per-km rate for distance beyond the configured free km.
     */
    public function calculateDeliveryFee(float $distanceKm): float
    {
        $base = (float) $this->base_delivery_fee;
        $perKm = (float) $this->per_km_fee;
        $freeKm = (float) config('delivery.free_distance_km', 2);
        $distanceKm = max(0, $distanceKm);

        $fee = $distanceKm <= $freeKm
            ? $base
            : $base + (($distanceKm - $freeKm) * $perKm);

        $fee = max($base, round($fee, 2));

        $maxFee = config('delivery.max_delivery_fee');
        if ($maxFee !== null) {
            $fee = min($fee, (float) $maxFee);
        }

        return $fee;
    }
}
