<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Product extends Model
{
    use BelongsToBranch;
    protected $fillable = ['name', 'sku', 'selling_price', 'description', 'cost_price', 'category_id', 'image_path', 'branch_id', 'type', 'created_by', 'stock', 'unit', 'unit_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_product');
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function unit_model()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function stockMovements()
    {
        return $this->hasMany(StockMovement::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients', 'menu_item_id', 'ingredient_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * Polymorphic relation to StockLog.
     */
    public function stockLogs()
    {
        return $this->morphMany(StockLog::class, 'storable');
    }

    /**
     * Strict check: Does this product have a recipe?
     */
    public function hasRecipe(): bool
    {
        return $this->ingredients()->exists();
    }

    /**
     * Compute available stock based on ingredient availability (branch-scoped).
     * If branch_id is set, only considers that branch's ingredient stock.
     */
    /**
     * Compute how many units of this product can be made, given ingredient stock.
     *
     * Pass $branchId to scope properly. Without it, returns 0 for recipe products.
     */
    public function computedStockForBranch(?int $branchId): int|float
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isNotEmpty()) {
            if (!$branchId) return 0;

            $possibleAmounts = [];
            foreach ($ingredients as $ingredient) {
                $required = (float) $ingredient->pivot->quantity_required;
                if ($required <= 0) continue;

                // Look up branch-scoped stock
                $stockRow = $ingredient->stocks()->where('branch_id', $branchId)->first();
                $available = $stockRow ? (float) $stockRow->stock : 0;
                $possibleAmounts[] = floor($available / $required);
            }
            return empty($possibleAmounts) ? 0 : (int) min($possibleAmounts);
        }

        // Direct product (no recipe): ledger-based calculation
        return (float) $this->stockMovements()
            ->selectRaw("SUM(CASE WHEN type = 'IN' THEN quantity WHEN type = 'OUT' THEN -quantity ELSE quantity END) as balance")
            ->value('balance') ?? 0;
    }

    /**
     * Legacy accessor — kept for backward compatibility.
     * Returns 0 for recipe products (branch context unknown).
     */
    public function getComputedStockAttribute(): int|float
    {
        return $this->computedStockForBranch(null);
    }
}
