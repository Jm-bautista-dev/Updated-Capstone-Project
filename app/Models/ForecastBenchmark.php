<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ForecastBenchmark extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'status', // 'pending', 'running', 'completed', 'failed'
        'dataset_range',
        'dataset_start_date',
        'dataset_end_date',
        'total_days',
        'experiment_number',
        'recommended_model',
        'selection_metric',
        'mae',
        'rmse',
        'mape',
        'wape',
        'rankings_data',
        'validation_data',
        'processing_time',
        'error_message',
    ];

    protected $casts = [
        'dataset_start_date' => 'date',
        'dataset_end_date'   => 'date',
        'total_days'         => 'integer',
        'experiment_number'  => 'integer',
        'mae'                => 'float',
        'rmse'               => 'float',
        'mape'               => 'float',
        'wape'               => 'float',
        'processing_time'    => 'float',
        'rankings_data'      => 'array',
        'validation_data'    => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function models(): HasMany
    {
        return $this->hasMany(ForecastModel::class, 'benchmark_id');
    }

    public function activeModel(): HasOne
    {
        return $this->hasOne(ForecastModel::class, 'benchmark_id')->where('is_active', true);
    }
}
