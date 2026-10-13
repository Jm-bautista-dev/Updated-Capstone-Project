<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ForecastModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'benchmark_id',
        'model_name',
        'version',
        'is_active',
        'status', // 'training', 'ready', 'failed', 'archived'
        'dataset_range',
        'dataset_start_date',
        'dataset_end_date',
        'training_points',
        'selection_metric',
        'evaluation_metrics',
        'hyperparameters',
        'fitted_parameters',
        'trained_at',
        'trained_by',
        'notes',
        'error_message',
    ];

    protected $casts = [
        'is_active'          => 'boolean',
        'version'            => 'integer',
        'training_points'    => 'integer',
        'dataset_start_date' => 'date',
        'dataset_end_date'   => 'date',
        'trained_at'         => 'datetime',
        'evaluation_metrics' => 'array',
        'hyperparameters'    => 'array',
        'fitted_parameters'  => 'array',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function benchmark(): BelongsTo
    {
        return $this->belongsTo(ForecastBenchmark::class, 'benchmark_id');
    }

    public function trainedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'trained_by');
    }

    /**
     * Scope for specific branch or global (null/0).
     */
    public function scopeForBranch(Builder $query, ?int $branchId): Builder
    {
        if ($branchId && $branchId !== 0) {
            return $query->where('branch_id', $branchId);
        }
        return $query->where(function ($q) {
            $q->whereNull('branch_id')->orWhere('branch_id', 0);
        });
    }

    /**
     * Scope active production models.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true)->where('status', 'ready');
    }

    /**
     * Get currently active model for branch.
     */
    public static function getActiveModel(?int $branchId): ?self
    {
        return static::forBranch($branchId)
            ->active()
            ->latest('id')
            ->first();
    }
}
