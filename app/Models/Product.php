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

    protected $appends = ['computed_stock'];

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
    /**
     * Compute dynamic availability based on ingredient stock in a specific branch.
     * Returns an array with available quantity and the limiting ingredient name.
     * 
     * @note Used ONLY for Analytics, Suggestions, and Reports.
     */
    public function dynamicAvailability(?int $branchId): array
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isEmpty()) {
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

        $minPossible = PHP_FLOAT_MAX;
        $limitingIngredient = null;

        foreach ($ingredients as $ingredient) {
            $qtyInput = (float) $ingredient->pivot->quantity_required;
            $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
            
            $requiredPerUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                $qtyInput, 
                $unitInput, 
                $ingredient->unit, 
                $ingredient->avg_weight_per_piece
            );

            if ($requiredPerUnit <= 0) {
                \Log::warning("Product '{$this->name}' has ingredient '{$ingredient->name}' with zero base quantity requirement.");
                continue;
            }

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
            'limiting_ingredient' => $available <= 10 ? $limitingIngredient : null,
            'is_low_stock' => $available > 0 && $available <= 5
        ];
    }

    /**
     * PRODUCTION-LEVEL STOCK VALIDATION (Safe, Stable, Fail-safe)
     * 
     * This method is ONLY for Order Checkout and Payment validation.
     * It avoids complex math, division, and analytics.
     * 
     * @param float $requestedQuantity The quantity being ordered.
     * @param int $branchId The branch ID for stock scoping.
     * @return array { success: bool, message: string|null }
     */
    public function simpleStockCheck(float $requestedQuantity, int $branchId): array
    {
        $ingredients = $this->ingredients;

        // 1. Fallback for items with no recipe (direct stock)
        if ($ingredients->isEmpty()) {
            $currentStock = (float) ($this->stock ?? 0);
            if ($currentStock < $requestedQuantity) {
                return [
                    'success' => false,
                    'message' => "Insufficient physical stock for '{$this->name}' (Requested: {$requestedQuantity}, Available: {$currentStock})"
                ];
            }
            return ['success' => true, 'message' => null];
        }

        // 2. Recipe-based validation
        foreach ($ingredients as $ingredient) {
            try {
                // Get requirement from pivot
                $qtyPerUnit = (float) ($ingredient->pivot->quantity_required ?? 0);
                $unitInput  = $ingredient->pivot->unit ?? $ingredient->unit;

                // Normalize requirement to base unit (e.g. g, ml, pcs)
                $requiredPerOrderUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyPerUnit,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );

                // Total requirement for the order
                $totalNeeded = $requiredPerOrderUnit * $requestedQuantity;

                // Skip if no requirement (safety)
                if ($totalNeeded <= 0) continue;

                // Get branch stock (safe fallback to 0)
                $stockRecord = $ingredient->stocks()->where('branch_id', $branchId)->first();
                $availableStock = (float) ($stockRecord->stock ?? 0);

                // Validation Check (Simple comparison, no division)
                if ($availableStock < $totalNeeded) {
                    return [
                        'success' => false,
                        'message' => "Insufficient ingredients for '{$this->name}': Missing '{$ingredient->name}'"
                    ];
                }

            } catch (\Exception $e) {
                \Log::error("SimpleStockCheck error for '{$this->name}': " . $e->getMessage());
                return [
                    'success' => false, 
                    'message' => "Stock system error during validation for '{$ingredient->name}'"
                ];
            }
        }

        return ['success' => true, 'message' => null];
    }

    /**
     * Legacy shorthand for basic stock check.
     */
    public function getComputedStockAttribute(): int|float
    {
        // Safety check: If product is new or doesn't have a branch context, return 0
        if (!$this->exists || !$this->branch_id) {
            return (float) ($this->stock ?? 0);
        }

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
