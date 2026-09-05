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
class AddonGroup extends Model
{
    use HasFactory;

    protected $table = 'addon_groups';

    protected $fillable = [
        'name',
        'product_id',
        'selection_type',
        'is_required',
        'min_selections',
        'max_selections',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_required'    => 'boolean',
        'min_selections' => 'integer',
        'max_selections' => 'integer',
        'is_active'      => 'boolean',
        'sort_order'     => 'integer',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Optional direct single product relation.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Many-to-Many linked products.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_addon_groups')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }

    /**
     * Modifiers / Add-ons belonging to this group.
     */
    public function addOns(): BelongsToMany
    {
        return $this->belongsToMany(AddOn::class, 'addon_group_items', 'addon_group_id', 'add_on_id')
                    ->withPivot(['price_override', 'sort_order'])
                    ->withTimestamps()
                    ->orderBy('addon_group_items.sort_order', 'asc');
    }

    /**
     * Alias for addOns
     */
    public function items(): BelongsToMany
    {
        return $this->addOns();
    }
}
