<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @mixin Builder
 */
class ProductAddon extends Model
{
    use HasFactory;

    protected $table = 'product_addons';

    protected $fillable = [
        'product_id',
        'name',
        'price',
        'cost_price',
        'ingredient_id',
        'ingredient_quantity',
        'is_active',
    ];

    protected $casts = [
        'price'               => 'float',
        'cost_price'          => 'float',
        'ingredient_quantity' => 'float',
        'is_active'           => 'boolean',
    ];

    /**
     * Scope: only active add-ons.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Parent product (optional, null if global).
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Linked inventory ingredient (optional, null if financial-only line item).
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }
}
