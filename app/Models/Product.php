<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Product extends Model
{
    use BelongsToBranch, SoftDeletes;
    protected $fillable = ['name', 'sku', 'selling_price', 'description', 'cost_price', 'category_id', 'image_path', 'branch_id', 'type', 'created_by', 'stock', 'unit', 'unit_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Many-to-Many relationship with branches.
     */
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_product');
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
                    ->withPivot('quantity_required', 'unit')
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
    /**
     * Compute dynamic availability based on ingredient stock in a specific branch.
     * Returns an array with available quantity and the limiting ingredient name.
     */
    public function dynamicAvailability(?int $branchId): array
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isEmpty()) {
            // Direct product (no recipe): use legacy stock column or movement ledger
            $stock = (float) ($this->stock ?? 0);
            return [
                'available' => $stock,
                'limiting_ingredient' => $stock <= 0 ? 'Physical Stock' : null,
                'is_low_stock' => $stock > 0 && $stock <= 5
            ];
        }

        if (!$branchId) {
            return ['available' => 0, 'limiting_ingredient' => 'No Branch Context', 'is_low_stock' => false];
        }

        $possibleAmounts = [];
        $limitingIngredient = null;
        $minPossible = PHP_FLOAT_MAX;

        foreach ($ingredients as $ingredient) {
            $qtyInput = (float) $ingredient->pivot->quantity_required;
            $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
            
            // Normalize all quantities to base units (g, ml, pcs)
            $requiredPerUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                $qtyInput, 
                $unitInput, 
                $ingredient->unit, 
                $ingredient->avg_weight_per_piece
            );

            if ($requiredPerUnit <= 0) continue;

            $stockRow = $ingredient->stocks()->where('branch_id', $branchId)->first();
            $availableInStock = $stockRow ? (float) $stockRow->stock : 0;
            
            $unitsPossible = floor($availableInStock / $requiredPerUnit);
            
            if ($unitsPossible < $minPossible) {
                $minPossible = $unitsPossible;
                $limitingIngredient = $ingredient->name;
            }
        }

        $available = $minPossible === PHP_FLOAT_MAX ? 0 : (float) $minPossible;

        return [
            'available' => $available,
            'limiting_ingredient' => $available <= 10 ? $limitingIngredient : null, // Show limiting only when getting low
            'is_low_stock' => $available > 0 && $available <= 5
        ];
    }

    /**
     * Legacy shorthand for basic stock check.
     */
    public function getComputedStockAttribute(): int|float
    {
        $data = $this->dynamicAvailability($this->branch_id);
        return $data['available'];
    }

    /**
     * Compute the cost of this product based on its ingredients and their branch-specific cost.
     * If branch_id is not provided or the product has no ingredients, falls back to legacy cost_price.
     *
     * @param int|null $branchId
     * @return float
     */
    public function computeProductCost(?int $branchId): float
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isNotEmpty()) {
            if (!$branchId) {
                return (float) $this->cost_price;
            }

            $totalCost = 0.0;
            foreach ($ingredients as $ingredient) {
                $qtyInput = (float) $ingredient->pivot->quantity_required;
                $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                $required = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient($qtyInput, $unitInput, $ingredient->unit, $ingredient->avg_weight_per_piece);
                
                $stockRow = $ingredient->stocks()->where('branch_id', $branchId)->first();
                $costPerUnit = $stockRow && $stockRow->cost_per_unit > 0 
                                ? (float) $stockRow->cost_per_unit 
                                : (float) $ingredient->cost_per_base_unit;
                
                $totalCost += ($required * $costPerUnit);
            }
            return $totalCost;
        }

        return (float) $this->cost_price;
    }
}
