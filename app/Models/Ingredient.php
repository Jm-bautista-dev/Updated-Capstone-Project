<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * GLOBAL Ingredient — no branch_id here.
 * Stock per branch lives in ingredient_stocks.
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'unit',
        'cost_price',
    ];

    /* ── Relationships ──────────────────────────────── */

    /**
     * Branch-scoped stock rows for this ingredient.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(IngredientStock::class);
    }

    /**
     * Convenience: get the stock record for a specific branch.
     */
    public function stockForBranch(int $branchId): ?IngredientStock
    {
        return $this->stocks()->where('branch_id', $branchId)->first();
    }

    /**
     * The menu items (products) that use this ingredient.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'menu_item_ingredients', 'ingredient_id', 'menu_item_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * The logs for this ingredient.
     */
    public function logs(): HasMany
    {
        return $this->hasMany(IngredientLog::class);
    }

    /**
     * Polymorphic relation to StockLog.
     */
    public function stockLogs()
    {
        return $this->morphMany(StockLog::class, 'storable');
    }

    /**
     * The suppliers that provide this ingredient.
     */
    public function suppliers(): BelongsToMany
    {
        return $this->belongsToMany(Supplier::class, 'supplier_ingredient', 'ingredient_id', 'supplier_id')
                    ->withTimestamps();
    }
}
