<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

use App\Traits\BelongsToBranch;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Rider extends Authenticatable
{
    use HasFactory, SoftDeletes, BelongsToBranch, HasApiTokens, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'branch_id',
        'status',
        'is_active',
        'role',
        'last_active_at',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'password' => 'hashed',
        'is_active' => 'boolean',
        'last_active_at' => 'datetime',
        'must_change_password' => 'boolean',
    ];

    /* ── Relationships ─────────────────────────────── */

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function deliveries(): HasMany
    {
        return $this->hasMany(Delivery::class);
    }

    /* ── Scopes ────────────────────────────────────── */

    public function scopeAvailable(Builder $query): Builder
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope riders eligible to accept/be assigned new orders.
     * Excludes riders who are offline, inactive, or currently OUT FOR DELIVERY (in_transit).
     */
    public function scopeAvailableForAssignment(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('status', '!=', 'offline')
            ->whereDoesntHave('deliveries', function ($q) {
                $q->where('status', Delivery::STATUS_OUT_FOR_DELIVERY);
            });
    }

    /* ── Helpers ───────────────────────────────────── */

    public function markBusy(): void
    {
        $this->update(['status' => 'busy']);
    }

    public function markAvailable(): void
    {
        $this->update(['status' => 'available']);
    }

    /**
     * Whether this rider is currently OUT FOR DELIVERY (in_transit).
     * Once in_transit, rider is locked from accepting/picking up new orders.
     */
    public function hasInTransitDelivery(): bool
    {
        return $this->deliveries()
            ->where('status', Delivery::STATUS_OUT_FOR_DELIVERY)
            ->exists();
    }

    /**
     * Count of active in-transit deliveries.
     */
    public function activeInTransitCount(): int
    {
        return $this->deliveries()
            ->where('status', Delivery::STATUS_OUT_FOR_DELIVERY)
            ->count();
    }

    /**
     * Count of all active (non-terminal) deliveries for this rider.
     */
    public function activeDeliveriesCount(): int
    {
        return $this->deliveries()
            ->whereNotIn('status', [Delivery::STATUS_DELIVERED, Delivery::STATUS_CANCELLED])
            ->count();
    }
}
