<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ForecastRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'model_used',
        'horizon_days',
        'dataset_range',
        'forecast_data',
        'mae',
        'rmse',
        'mape',
    ];

    protected $casts = [
        'forecast_data' => 'array',
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
