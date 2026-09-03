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
        'addon_total',
        'selected_addons',
        'profit',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'quantity'        => 'float',
        'unit_price'      => 'float',
        'cost_price'      => 'float',
        'subtotal'        => 'float',
        'addon_total'     => 'float',
        'profit'          => 'float',
        'selected_addons' => 'array',
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
