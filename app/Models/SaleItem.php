<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_id',
        'quantity',
        'unit_price',
        'cost_price',
        'subtotal',
        'profit',
        'created_at',
        'updated_at',
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !$user->isAdmin()) {
            unset(
                $array['cost_price'],
                $array['profit']
            );
        }
        return $array;
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
