<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Builder;

/**
 * @mixin Builder
 */
class AddOn extends Model
{
    use HasFactory;

    protected $table = 'add_ons';

    protected $fillable = [
        'name',
        'price',
        'cost_price',
        'is_active',
        'branch_id',
        'stock_linked',
        'ingredient_id',
        'ingredient_quantity',
    ];

    protected $casts = [
        'price'               => 'float',
        'cost_price'          => 'float',
        'ingredient_quantity' => 'float',
        'is_active'           => 'boolean',
        'stock_linked'        => 'boolean',
    ];

    /**
     * Scope: only active add-ons.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Branch context (optional, null if universal across all branches).
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Linked inventory ingredient for stock deduction when stock_linked is true.
     */
    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    /**
     * Groups that include this add-on.
     */
    public function groups(): BelongsToMany
    {
        return $this->belongsToMany(AddonGroup::class, 'addon_group_items', 'add_on_id', 'addon_group_id')
                    ->withPivot(['price_override', 'sort_order'])
                    ->withTimestamps();
    }

    /**
     * Products directly assigned to this add-on.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_addons', 'addon_id', 'product_id')
                    ->withPivot(['is_required', 'max_quantity', 'sort_order', 'is_active'])
                    ->withTimestamps();
    }
}
