<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @property int $id
 * @property string $batch_code
 * @property string|null $lot_number
 * @property int $ingredient_id
 * @property int $branch_id
 * @property int|null $supplier_id
 * @property string|null $supplier_name
 * @property Carbon|null $received_at
 * @property Carbon|null $manufacture_date
 * @property Carbon|null $expiration_date
 * @property string $expiration_type
 * @property float $initial_quantity
 * @property float $current_quantity
 * @property string $unit
 * @property float $cost_per_base_unit
 * @property float $purchase_price
 * @property string $status
 * @property string|null $notes
 * @property string|null $reference
 * @property bool $is_legacy
 * @property-read Ingredient|null $ingredient
 * @property-read Branch|null $branch
 * @property-read Supplier|null $supplier
 * @property-read string $expiration_status
 * @property-read bool $is_eligible
 * @property-read int|null $days_until_expiration
 * @method bool isExpired(?Carbon $asOf = null)
 * @method bool isExpiringToday(?Carbon $asOf = null)
 * @method bool isExpiringSoon(int $warningDays = 3, ?Carbon $asOf = null)
 */
class IngredientBatch extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'batch_code',
        'lot_number',
        'ingredient_id',
        'branch_id',
        'supplier_id',
        'supplier_name',
        'received_at',
        'manufacture_date',
        'expiration_date',
        'expiration_type', // 'use_by', 'best_before', 'none'
        'initial_quantity',
        'current_quantity',
        'unit',
        'cost_per_base_unit',
        'purchase_price',
        'status', // 'available', 'depleted', 'expired', 'quarantined', 'recalled', 'damaged'
        'received_by',
        'reference',
        'notes',
        'is_legacy',
    ];

    protected $casts = [
        'received_at'        => 'datetime',
        'manufacture_date'   => 'date',
        'expiration_date'    => 'datetime',
        'initial_quantity'   => 'float',
        'current_quantity'   => 'float',
        'cost_per_base_unit' => 'float',
        'purchase_price'     => 'float',
        'is_legacy'          => 'boolean',
    ];

    protected $appends = [
        'expiration_status',
        'is_eligible',
        'days_until_expiration',
    ];

    /* ── Relationships ──────────────────────────────── */

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(IngredientBatchMovement::class, 'batch_id')->orderBy('id', 'desc');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(BatchAllocation::class, 'batch_id')->orderBy('id', 'desc');
    }

    /* ── Scopes ─────────────────────────────────────── */

    public function scopeForBranch(Builder $query, int $branchId): Builder
    {
        return $query->where('branch_id', $branchId);
    }

    /**
     * Scope to only batches eligible for automatic sale/recipe consumption.
     * Excludes:
     * - Batches with status != 'available' (quarantined, recalled, damaged, depleted, expired)
     * - Batches with current_quantity <= 0
     * - Batches that have passed expiration/use-by cutoff
     */
    public function scopeEligibleForConsumption(Builder $query, ?Carbon $asOf = null): Builder
    {
        $cutoff = $asOf ?: Carbon::now(config('app.timezone', 'Asia/Manila'));

        return $query->where('status', 'available')
                     ->where('current_quantity', '>', 0)
                     ->where(function (Builder $q) use ($cutoff) {
                         $q->whereNull('expiration_date')
                           ->orWhereDate('expiration_date', '>=', $cutoff->toDateString());
                     });
    }

    /**
     * Order batches strictly by FEFO (First Expired, First Out)
     * with FIFO (First In, First Out by received_at) as tie-breaker,
     * and ID ASC as deterministic final tie-breaker.
     */
    public function scopeOrderByFefoFifo(Builder $query): Builder
    {
        return $query->orderByRaw('CASE WHEN expiration_date IS NOT NULL THEN 0 ELSE 1 END ASC')
                     ->orderBy('expiration_date', 'asc')
                     ->orderBy('received_at', 'asc')
                     ->orderBy('id', 'asc');
    }

    /* ── Helper Methods ─────────────────────────────── */

    /**
     * Check if batch is currently expired.
     * For date expiration values, a batch is expired only once the expiration day has fully ended.
     */
    public function isExpired(?Carbon $asOf = null): bool
    {
        if (!$this->expiration_date) {
            return false;
        }

        $now = $asOf ?: Carbon::now(config('app.timezone', 'Asia/Manila'));
        return $this->expiration_date->copy()->endOfDay()->lt($now);
    }

    /**
     * Check if batch expires today.
     */
    public function isExpiringToday(?Carbon $asOf = null): bool
    {
        if (!$this->expiration_date) {
            return false;
        }

        $now = $asOf ?: Carbon::now(config('app.timezone', 'Asia/Manila'));
        return $this->expiration_date->isSameDay($now) && !$this->isExpired($now);
    }

    /**
     * Check if batch is nearing expiration within $days window.
     */
    public function isExpiringSoon(int $days = 7, ?Carbon $asOf = null): bool
    {
        if (!$this->expiration_date) {
            return false;
        }

        $now = $asOf ?: Carbon::now(config('app.timezone', 'Asia/Manila'));

        if ($this->isExpired($now) || $this->isExpiringToday($now)) {
            return false;
        }

        return $this->expiration_date->lte($now->copy()->addDays($days));
    }

    /**
     * Determine if this batch is eligible for consumption.
     */
    public function isEligibleForConsumption(?Carbon $asOf = null): bool
    {
        if ($this->status !== 'available' || $this->current_quantity <= 0) {
            return false;
        }

        return !$this->isExpired($asOf);
    }

    /* ── Accessors ──────────────────────────────────── */

    public function getIsEligibleAttribute(): bool
    {
        return $this->isEligibleForConsumption();
    }

    public function getDaysUntilExpirationAttribute(): ?int
    {
        if (!$this->expiration_date) {
            return null;
        }

        $now = Carbon::now(config('app.timezone', 'Asia/Manila'))->startOfDay();
        $exp = $this->expiration_date->copy()->startOfDay();

        return (int) $now->diffInDays($exp, false);
    }

    public function getExpirationStatusAttribute(): string
    {
        if (!$this->expiration_date) {
            return 'no_expiry';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        if ($this->isExpiringToday()) {
            return 'expiring_today';
        }

        $warningDays = $this->ingredient?->expiry_warning_days ?? 7;
        if ($this->isExpiringSoon($warningDays)) {
            return 'expiring_soon';
        }

        return 'valid';
    }
}
