<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Rider extends Model
{
    use HasFactory, SoftDeletes, BelongsToBranch;

    protected $fillable = [
        'name',
        'phone',
        'branch_id',
        'status',
        'last_active_at',
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

    /* ── Helpers ───────────────────────────────────── */

    public function markBusy(): void
    {
        $this->update(['status' => 'busy']);
    }

    public function markAvailable(): void
    {
        $this->update(['status' => 'available']);
    }
}
