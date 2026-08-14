<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

use App\Traits\BelongsToBranch;

/**
 * @mixin Builder
 */
class Product extends Model
{
    use BelongsToBranch, SoftDeletes;
    protected $fillable = ['name', 'sku', 'selling_price', 'description', 'cost_price', 'category_id', 'image_path', 'branch_id', 'type', 'created_by', 'stock', 'unit', 'unit_id', 'barcode'];

    protected $appends = ['computed_stock', 'image_url', 'average_rating', 'review_count', 'quantity_sold'];

    protected static function booted()
    {
        static::creating(function ($product) {
            if (!$product->barcode) {
                do {
                    $barcode = '888' . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);
                } while (static::withTrashed()->where(['barcode' => $barcode])->exists());
                $product->barcode = $barcode;
            }
        });
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image_path) {
            return null;
        }
        return \Illuminate\Support\Facades\Storage::disk('public')->exists($this->image_path)
            ? asset('storage/' . $this->image_path)
            : null;
    }

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
        return $this->belongsToMany(Branch::class, 'branch_product')
                    ->withPivot(['stock', 'price', 'is_active'])
                    ->withTimestamps();
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
     * Reviews for this product.
     */
    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
    }

    /**
     * Compute average star rating (published reviews only).
     */
    public function getAverageRatingAttribute(): float
    {
        if (!$this->exists) return 0.0;
        $avg = $this->reviews()->published()->avg('rating');
        return $avg ? (float) round($avg, 1) : 0.0;
    }

    /**
     * Count of published reviews.
     */
    public function getReviewCountAttribute(): int
    {
        if (!$this->exists) return 0;
        return (int) $this->reviews()->published()->count();
    }

    /**
     * Total quantity of this product sold/delivered.
     */
    public function getQuantitySoldAttribute(): int
    {
        if (!$this->exists) return 0;

        return (int) \App\Models\OrderItem::where('product_id', $this->id)
            ->whereHas('order', function ($query) {
                $query->whereIn('status', ['delivered', 'completed']);
            })
            ->sum('quantity');
    }

    /**
     * Rating distribution summary (counts and percentages for 1..5 stars).
     */
    public function getRatingDistributionAttribute(): array
    {
        if (!$this->exists) {
            return [
                'counts' => [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0],
                'percentages' => [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0],
            ];
        }

        $total = $this->review_count;
        $counts = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];
        $percentages = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

        if ($total > 0) {
            $grouped = $this->reviews()
                ->published()
                ->selectRaw('rating, count(*) as count')
                ->groupBy('rating')
                ->pluck('count', 'rating')
                ->toArray();

            foreach ([5, 4, 3, 2, 1] as $star) {
                $c = (int) ($grouped[$star] ?? 0);
                $counts[$star] = $c;
                $percentages[$star] = (int) round(($c / $total) * 100);
            }
        }

        return [
            'counts' => $counts,
            'percentages' => $percentages,
        ];
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
            if ($branchId) {
                $pivot = DB::table('branch_product')
                    ->where('product_id', $this->id)
                    ->where('branch_id', $branchId)
                    ->first();
                $stock = $pivot ? (float) $pivot->stock : (float) ($this->stock ?? 0);
            } else {
                $pivotSum = (float) DB::table('branch_product')
                    ->where('product_id', $this->id)
                    ->sum('stock');
                $stock = $pivotSum > 0 ? $pivotSum : (float) ($this->stock ?? 0);
            }

            return [
                'available'            => max(0, $stock),
                'is_available'         => $stock >= 1,
                'max_servings'         => max(0, $stock),
                'limiting_ingredient'  => $stock < 1 ? 'Physical Stock' : null,
                'blocking_ingredients' => $stock < 1 ? ['Physical Stock'] : [],
                'is_low_stock'         => $stock > 0 && $stock <= 5
            ];
        }

        if (!$branchId) {
            // Aggregate stock across all branches for "All Branches" view
            $minPossible = PHP_FLOAT_MAX;
            $limitingIngredient = null;
            $blockingIngredients = [];

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
                    continue;
                }

                // Sum stock across ALL branches
                $availableInStock = (float) $ingredient->stocks()->sum('stock');

                $unitsPossible = floor($availableInStock / $requiredPerUnit);

                if ($unitsPossible < $minPossible) {
                    $minPossible = $unitsPossible;
                    $limitingIngredient = $ingredient->name;
                }

                if ($availableInStock < $requiredPerUnit) {
                    $blockingIngredients[] = $ingredient->name;
                }
            }

            $finalAvailable = ($minPossible === PHP_FLOAT_MAX) ? 0 : max(0, (int) $minPossible);

            return [
                'available' => $finalAvailable,
                'is_available' => $finalAvailable >= 1,
                'max_servings' => $finalAvailable,
                'limiting_ingredient' => $finalAvailable < 1 ? ($limitingIngredient ?? 'Insufficient Stock') : $limitingIngredient,
                'blocking_ingredients' => $blockingIngredients,
                'is_low_stock' => $finalAvailable > 0 && $finalAvailable <= 5
            ];
        }

        $minPossible = PHP_FLOAT_MAX;
        $limitingIngredient = null;
        $blockingIngredients = [];

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
            $availableInStock = $stockRow ? (float) $stockRow->stock : 0.0;
            
            $unitsPossible = floor($availableInStock / $requiredPerUnit);
            
            if ($unitsPossible < $minPossible) {
                $minPossible = $unitsPossible;
                $limitingIngredient = $ingredient->name;
            }

            if ($availableInStock < $requiredPerUnit) {
                $displayUnit = $ingredient->unit ?? 'pcs';
                $displayStock = $availableInStock;
                $displayRequired = $requiredPerUnit;

                if ($displayUnit === 'g' && ($displayStock >= 1000 || $displayRequired >= 1000)) {
                    $displayStock = $displayStock / 1000;
                    $displayRequired = $displayRequired / 1000;
                    $displayUnit = 'kg';
                } elseif ($displayUnit === 'ml' && ($displayStock >= 1000 || $displayRequired >= 1000)) {
                    $displayStock = $displayStock / 1000;
                    $displayRequired = $displayRequired / 1000;
                    $displayUnit = 'L';
                }

                $blockingIngredients[] = [
                    'name' => $ingredient->name,
                    'stock' => $displayStock,
                    'required' => $displayRequired,
                    'unit' => $displayUnit
                ];
            }
        }

        $available = ($minPossible === PHP_FLOAT_MAX) ? 0 : max(0, (float) $minPossible);

        return [
            'available' => $available,
            'is_available' => $available >= 1,
            'max_servings' => $available,
            'limiting_ingredient' => $available < 1 ? ($limitingIngredient ?? 'Insufficient Stock') : ($available <= 10 ? $limitingIngredient : null),
            'blocking_ingredients' => $blockingIngredients,
            'is_low_stock' => $available > 0 && $available <= 5
        ];
    }

    /**
     * PRODUCTION-LEVEL STOCK VALIDATION (Safe, Stable, Fail-safe)
     * 
     * Validates whether a requested quantity of this product can be fulfilled
     * based on branch-specific inventory stock.
     * 
     * @param float $requestedQuantity The quantity being ordered.
     * @param int $branchId The branch ID for stock scoping.
     * @return array { success: bool, message: string|null }
     */
    public function simpleStockCheck(float $requestedQuantity, int $branchId): array
    {
        if ($requestedQuantity <= 0) {
            return ['success' => false, 'message' => "Quantity must be greater than 0."];
        }

        $ingredients = $this->ingredients;

        // 1. Fallback for items with no recipe (direct physical stock)
        if ($ingredients->isEmpty()) {
            $pivot = DB::table('branch_product')
                ->where('product_id', $this->id)
                ->where('branch_id', $branchId)
                ->first();
            $currentStock = $pivot ? (float) $pivot->stock : (float) ($this->stock ?? 0);

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
                $qtyPerUnit = (float) ($ingredient->pivot->quantity_required ?? 0);
                $unitInput  = $ingredient->pivot->unit ?? $ingredient->unit;

                $requiredPerOrderUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyPerUnit,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );

                $totalNeeded = $requiredPerOrderUnit * $requestedQuantity;

                if ($totalNeeded <= 0) continue;

                $stockRecord = $ingredient->stocks()->where('branch_id', $branchId)->first();
                $availableStock = $stockRecord ? (float) $stockRecord->stock : 0.0;

                if ($availableStock < $totalNeeded) {
                    $unit = $ingredient->unit ?? 'unit(s)';
                    return [
                        'success' => false,
                        'message' => "Unable to order '{$this->name}'. Ingredient '{$ingredient->name}' is insufficient in this branch (Available: {$availableStock} {$unit}, Required: {$totalNeeded} {$unit})."
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
     * Batch validate multi-product stock requirements across all items in an order.
     * Prevents multi-product race conditions or cumulative stock over-allocation.
     *
     * @param int $branchId
     * @param array $items Array of items with 'product_id' (or 'id') and 'quantity'
     * @return array { success: bool, message: string|null }
     */
    public static function validateBatchStock(int $branchId, array $items): array
    {
        if (empty($items)) {
            return ['success' => false, 'message' => 'No items provided for validation.'];
        }

        $productIds = [];
        $quantitiesByProduct = [];

        foreach ($items as $item) {
            $pId = (int) ($item['product_id'] ?? $item['id'] ?? 0);
            $qty = (float) ($item['quantity'] ?? 0);

            if ($pId <= 0 || $qty <= 0) {
                return ['success' => false, 'message' => 'Invalid product or quantity in order items.'];
            }

            $productIds[] = $pId;
            $quantitiesByProduct[$pId] = ($quantitiesByProduct[$pId] ?? 0) + $qty;
        }

        $products = static::with(['ingredients'])->whereIn('id', array_unique($productIds))->get()->keyBy('id');

        $ingredientRequirements = []; // [ingredient_id => ['name' => ..., 'unit' => ..., 'needed' => ...]]
        $directProductRequirements = []; // [product_id => ['product' => ..., 'needed' => ...]]

        foreach ($quantitiesByProduct as $pId => $qty) {
            $product = $products->get($pId);
            if (!$product) {
                return ['success' => false, 'message' => "Product #{$pId} not found."];
            }

            if ($product->ingredients->isNotEmpty()) {
                foreach ($product->ingredients as $ingredient) {
                    $qtyInput = (float) ($ingredient->pivot->quantity_required ?? 0);
                    $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;

                    $requiredPerUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyInput,
                        $unitInput,
                        $ingredient->unit,
                        $ingredient->avg_weight_per_piece
                    );

                    $totalNeeded = $requiredPerUnit * $qty;
                    if ($totalNeeded <= 0) continue;

                    if (!isset($ingredientRequirements[$ingredient->id])) {
                        $ingredientRequirements[$ingredient->id] = [
                            'name' => $ingredient->name,
                            'unit' => $ingredient->unit ?? 'unit(s)',
                            'needed' => 0.0,
                        ];
                    }
                    $ingredientRequirements[$ingredient->id]['needed'] += $totalNeeded;
                }
            } else {
                $directProductRequirements[$pId] = [
                    'product' => $product,
                    'needed' => $qty,
                ];
            }
        }

        // 1. Check cumulative ingredient requirements
        foreach ($ingredientRequirements as $ingId => $req) {
            $stockRow = \App\Models\IngredientStock::where('ingredient_id', $ingId)
                ->where('branch_id', $branchId)
                ->first();

            $available = $stockRow ? (float) $stockRow->stock : 0.0;
            if ($available < $req['needed']) {
                return [
                    'success' => false,
                    'message' => "Insufficient stock in this branch for '{$req['name']}'. (Available: {$available} {$req['unit']}, Required: {$req['needed']} {$req['unit']})."
                ];
            }
        }

        // 2. Check direct products
        foreach ($directProductRequirements as $pId => $req) {
            /** @var Product $p */
            $p = $req['product'];
            $pivot = DB::table('branch_product')
                ->where('product_id', $pId)
                ->where('branch_id', $branchId)
                ->first();
            $available = $pivot ? (float) $pivot->stock : (float) ($p->stock ?? 0);

            if ($available < $req['needed']) {
                return [
                    'success' => false,
                    'message' => "Insufficient physical stock for '{$p->name}'. (Available: {$available}, Required: {$req['needed']})."
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
    public function computeProductCost(?int $branchId = null): float
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isNotEmpty()) {
            $totalCost = 0.0;
            foreach ($ingredients as $ingredient) {
                $qtyInput = (float) $ingredient->pivot->quantity_required;
                $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                $required = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyInput,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );
                
                $costPerUnit = 0.0;
                if ($branchId) {
                    $stockRow = $ingredient->stocks()->where('branch_id', $branchId)->first();
                    if ($stockRow && (float)$stockRow->cost_per_unit > 0) {
                        $costPerUnit = (float) $stockRow->cost_per_unit;
                    }
                } else {
                    // All branches: take average cost_per_unit of branches with positive cost
                    $avgCost = (float) $ingredient->stocks()->where('cost_per_unit', '>', 0)->avg('cost_per_unit');
                    if ($avgCost > 0) {
                        $costPerUnit = $avgCost;
                    }
                }

                // Fallback to ingredient master cost_per_base_unit if branch stock cost is 0
                if ($costPerUnit <= 0 && (float)$ingredient->cost_per_base_unit > 0) {
                    $costPerUnit = (float) $ingredient->cost_per_base_unit;
                }
                
                $totalCost += ($required * $costPerUnit);
            }

            if ($totalCost > 0) {
                return $totalCost;
            }
        }

        // Direct product fallback
        if ($branchId) {
            $pivot = DB::table('branch_product')
                ->where('product_id', $this->id)
                ->where('branch_id', $branchId)
                ->first();
            if ($pivot && (float)($pivot->cost_price ?? 0) > 0) {
                return (float) $pivot->cost_price;
            }
        }

        return (float) ($this->cost_price ?? 0.0);
    }
}
