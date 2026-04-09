<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'storable_type',
        'storable_id',
        'branch_id',
        'user_id',
        'action_type',
        'quantity',
        'quantity_base',
        'unit',
        'previous_stock',
        'new_stock',
        'reference'
    ];

    /**
     * Polymorphic relation to Product or Ingredient.
     */
    public function storable()
    {
        return $this->morphTo();
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
