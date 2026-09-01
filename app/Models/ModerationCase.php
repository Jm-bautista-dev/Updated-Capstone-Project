<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ModerationCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_number',
        'target_type',
        'target_id',
        'reported_by_id',
        'reason_category',
        'title',
        'description',
        'evidence_notes',
        'status',
        'resolution_decision',
        'resolution_notes',
        'resolved_by_id',
        'resolved_at',
    ];

    protected $casts = [
        'resolved_at' => 'datetime',
    ];

    const STATUS_OPEN         = 'open';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_RESOLVED     = 'resolved';
    const STATUS_DISMISSED    = 'dismissed';

    const REASON_SUSPECTED_FRAUD       = 'suspected_fraud';
    const REASON_FAKE_DELIVERY         = 'fake_delivery';
    const REASON_COD_ABUSE             = 'cod_abuse';
    const REASON_CUSTOMER_COMPLAINT    = 'customer_complaint';
    const REASON_UNAUTHORIZED_BEHAVIOR = 'unauthorized_behavior';
    const REASON_GPS_MANIPULATION      = 'gps_manipulation';
    const REASON_OTHER                 = 'other';

    protected static function booted()
    {
        static::creating(function ($case) {
            if (!$case->case_number) {
                $count = static::count() + 1;
                $case->case_number = 'MOD-' . str_pad((string)$count, 6, '0', STR_PAD_LEFT);
            }
        });
    }

    public function reportedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by_id');
    }

    /**
     * Polymorphic-like resolver for target user or rider.
     */
    public function target()
    {
        if ($this->target_type === 'rider') {
            return $this->belongsTo(Rider::class, 'target_id');
        }
        return $this->belongsTo(User::class, 'target_id');
    }

    public function targetUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'target_id');
    }

    public function targetRider(): BelongsTo
    {
        return $this->belongsTo(Rider::class, 'target_id');
    }

    /* ── Scopes ────────────────────────────────── */

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_OPEN, self::STATUS_UNDER_REVIEW]);
    }

    public function scopeResolved(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_RESOLVED, self::STATUS_DISMISSED]);
    }

    /* ── Helpers ───────────────────────────────── */

    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_OPEN, self::STATUS_UNDER_REVIEW]);
    }

    public function isResolved(): bool
    {
        return $this->status === self::STATUS_RESOLVED;
    }

    public function isDismissed(): bool
    {
        return $this->status === self::STATUS_DISMISSED;
    }
}
