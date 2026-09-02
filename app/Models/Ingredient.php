<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * GLOBAL Ingredient — no branch_id here.
 * Stock per branch lives in ingredient_stocks.
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Ingredient extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'unit',
        'cost_per_base_unit',
        'avg_weight_per_piece',
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !$user->isAdmin()) {
            unset($array['cost_per_base_unit']);
        }
        return $array;
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted()
    {
        static::created(function ($ingredient) {
            // Ensure every new ingredient has a stock record for every branch (defaulting to 0)
            $branches = \App\Models\Branch::all();
            $defaultLowStock = \App\Utils\UnitConverter::convertToBaseQuantity(5, $ingredient->unit ?? 'g');
            foreach ($branches as $branch) {
                \App\Models\IngredientStock::firstOrCreate([
                    'ingredient_id' => $ingredient->id,
                    'branch_id'     => $branch->id,
                ], [
                    'stock'           => 0,
                    'low_stock_level' => $defaultLowStock, // canonical default
                ]);
            }
        });
    }

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
