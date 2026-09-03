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
 * @mixin Builder
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
        'account_status',
        'status_reason',
        'restricted_at',
        'suspended_at',
        'deactivated_at',
        'status_changed_by',
        'is_delivery_restricted',
        'consecutive_delivery_failures',
        'restriction_source',
        'restriction_reason',
        'restriction_removed_at',
        'restriction_removed_by',
        'is_active',
        'role',
        'last_active_at',
        'must_change_password',
        'latitude',
        'longitude',
        'accuracy',
        'speed',
        'heading',
        'location_updated_at',
    ];

    const STATUS_ACTIVE       = 'active';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_RESTRICTED   = 'restricted';
    const STATUS_SUSPENDED    = 'suspended';
    const STATUS_DEACTIVATED  = 'deactivated';

    protected $hidden = [
        'password',
        'remember_token',
    ];

    public function isAdmin(): bool
    {
        return false;
    }

    public function isSuperAdmin(): bool
    {
        return false;
    }

    protected $casts = [
        'password'               => 'hashed',
        'is_active'              => 'boolean',
        'is_delivery_restricted' => 'boolean',
        'restricted_at'          => 'datetime',
        'suspended_at'           => 'datetime',
        'deactivated_at'         => 'datetime',
        'last_active_at'         => 'datetime',
        'location_updated_at'    => 'datetime',
        'must_change_password'   => 'boolean',
        'latitude'               => 'float',
        'longitude'              => 'float',
        'accuracy'               => 'float',
        'speed'                  => 'float',
        'heading'                => 'float',
    ];

    /* ── Governance Helpers ────────────────────────── */

    public function isActive(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_ACTIVE;
    }

    public function isUnderReview(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_UNDER_REVIEW;
    }

    public function isRestricted(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_RESTRICTED;
    }

    public function isSuspended(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_SUSPENDED;
    }

    public function isDeactivated(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_DEACTIVATED;
    }

    public function canLogin(): bool
    {
        return !$this->isSuspended() && !$this->isDeactivated();
    }

    public function canAcceptDeliveries(): bool
    {
        return $this->canLogin() && !(bool) $this->is_delivery_restricted && (bool) $this->is_active && $this->status !== 'offline';
    }

    public function hasHistoricalBusinessRecords(): bool
    {
        return $this->deliveries()->exists()
            || \App\Models\DeliveryAttempt::where('rider_id', $this->id)->exists();
    }

    /* ── Relationships ─────────────────────────────── */

    public function statusChangedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'status_changed_by');
    }

    public function restrictionRemovedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'restriction_removed_by');
    }

    /**
     * Lift any active account restriction and reset the consecutive streak.
     */
    public function liftAccountRestriction(User $actor, ?string $reason = null): void
    {
        $this->update([
            'account_status'                 => self::STATUS_ACTIVE,
            'is_delivery_restricted'         => false,
            'status_reason'                  => null,
            'restricted_at'                  => null,
            'consecutive_delivery_failures'  => 0,
            'restriction_source'             => null,
            'restriction_reason'             => null,
            'restriction_removed_at'         => now(),
            'restriction_removed_by'         => $actor->id,
            'status_changed_by'              => $actor->id,
        ]);
    }

    /**
     * Apply manual restriction by an administrator.
     */
    public function applyManualAccountRestriction(User $actor, string $reason): void
    {
        $this->update([
            'account_status'         => self::STATUS_RESTRICTED,
            'is_delivery_restricted' => true,
            'status_reason'          => $reason,
            'restriction_source'     => 'MANUAL',
            'restriction_reason'     => $reason,
            'restricted_at'          => now(),
            'status_changed_by'      => $actor->id,
        ]);
    }

    /**
     * Apply automatic restriction from consecutive failure threshold (5 failures).
     */
    public function applyConsecutiveFailureRestriction(string $reason = '5 consecutive failed deliveries'): void
    {
        $this->update([
            'account_status'         => self::STATUS_RESTRICTED,
            'is_delivery_restricted' => true,
            'status_reason'          => $reason,
            'restriction_source'     => 'AUTOMATIC',
            'restriction_reason'     => $reason,
            'restricted_at'          => now(),
        ]);
    }

    /**
     * Reset failure streak to 0 upon successful delivery completion.
     */
    public function resetFailureStreak(): void
    {
        if ((int) $this->consecutive_delivery_failures > 0) {
            $this->update(['consecutive_delivery_failures' => 0]);
        }
    }

    public function moderationCases(): HasMany
    {
        return $this->hasMany(ModerationCase::class, 'target_id')->where('target_type', 'rider');
    }

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
