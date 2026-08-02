<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForecastBenchmark extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'dataset_range',
        'recommended_model',
        'mae',
        'rmse',
        'mape',
        'processing_time',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
