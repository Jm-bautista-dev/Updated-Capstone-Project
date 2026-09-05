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
        return \App\Utils\ImageHelper::resolveUrl($this->image_path, 'products');
    }

    public function toArray(): array
    {
        $array = parent::toArray();
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !method_exists($user, 'isAdmin') || !$user->isAdmin()) {
            unset(
                $array['cost_price'],
                $array['cost'],
                $array['has_cost'],
                $array['costPrice']
            );
        }
        return $array;
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
     * Direct addon groups belonging to this product.
     */
    public function direct_addon_groups()
    {
        return $this->hasMany(AddonGroup::class, 'product_id');
    }

    /**
     * Many-to-many linked addon groups.
     */
    public function addon_groups()
    {
        return $this->belongsToMany(AddonGroup::class, 'product_addon_groups')
                    ->withPivot('sort_order')
                    ->withTimestamps();
    }

    /**
     * Direct many-to-many assigned add-ons from global catalog.
     */
    public function addons()
    {
        return $this->belongsToMany(AddOn::class, 'product_addons', 'product_id', 'addon_id')
                    ->withPivot(['is_required', 'max_quantity', 'sort_order', 'is_active'])
                    ->withTimestamps();
    }

    /**
     * Fetch all effective modifier groups (direct + linked) with their active add-ons.
     */
    public function getActiveAddonGroups()
    {
        $direct = $this->direct_addon_groups()
            ->where('is_active', true)
            ->with(['addOns' => fn($q) => $q->where('is_active', true)])
            ->get();

        $linked = $this->addon_groups()
            ->where('addon_groups.is_active', true)
            ->with(['addOns' => fn($q) => $q->where('is_active', true)])
            ->get();

        return $direct->merge($linked)->unique('id')->values();
    }

    /**
     * Fetch all effective add-ons specifically assigned to this product
     * (via direct product_addons OR active addon_groups).
     * Returns empty collection if nothing is assigned.
     */
    public function getEffectiveAddons()
    {
        // 1. Direct active assigned add-ons
        $directAddons = $this->addons()
            ->where('add_ons.is_active', true)
            ->where('product_addons.is_active', true)
            ->get();

        // 2. Add-ons from active modifier groups
        $groupAddons = collect();
        $activeGroups = $this->getActiveAddonGroups();
        foreach ($activeGroups as $g) {
            foreach ($g->addOns as $ad) {
                if ($ad->is_active) {
                    $groupAddons->push($ad);
                }
            }
        }

        return $directAddons->merge($groupAddons)->unique('id')->values();
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
    /**
     * Compute dynamic availability based on ingredient stock in a specific branch.
     * Returns an array with available quantity, limiting ingredient name, and blocking ingredients.
     *
     * @param int|null $branchId When null, aggregates and provides per-branch breakdown.
     * @return array
     */
    public function dynamicAvailability(?int $branchId = null): array
    {
        $ingredients = $this->relationLoaded('ingredients') ? $this->ingredients : $this->ingredients()->with('stocks')->get();

        // 1. Direct Physical Products (No Recipe)
        if ($ingredients->isEmpty()) {
            if ($branchId) {
                $pivot = DB::table('branch_product')
                    ->where('product_id', $this->id)
                    ->where('branch_id', $branchId)
                    ->first();
                $stock = $pivot ? (float) $pivot->stock : (float) ($this->stock ?? 0);

                return [
                    'available'            => max(0, $stock),
                    'is_available'         => $stock >= 1,
                    'max_servings'         => max(0, $stock),
                    'limiting_ingredient'  => $stock < 1 ? 'Physical Stock' : null,
                    'blocking_ingredients' => $stock < 1 ? ['Physical Stock'] : [],
                    'is_low_stock'         => $stock > 0 && $stock <= 5,
                    'scope'                => 'branch',
                ];
            }

            // All branches aggregation for direct products
            $allBranches = \App\Models\Branch::all();
            $branchBreakdown = [];
            $totalStock = 0;
            $hasAnyStock = false;

            foreach ($allBranches as $branch) {
                $bAvail = $this->dynamicAvailability($branch->id);
                $bStock = (float) $bAvail['available'];
                $branchBreakdown[$branch->id] = [
                    'branch_id'    => $branch->id,
                    'branch_name'  => $branch->name,
                    'stock'        => $bStock,
                    'available'    => $bStock,
                    'is_available' => $bAvail['is_available'],
                ];
                $totalStock += $bStock;
                if ($bAvail['is_available']) {
                    $hasAnyStock = true;
                }
            }

            return [
                'available'                   => $totalStock,
                'total_stock'                 => $totalStock,
                'branch_breakdown'            => $branchBreakdown,
                'is_available'                => $hasAnyStock,
                'max_servings'                => $totalStock,
                'limiting_ingredient'         => !$hasAnyStock ? 'Physical Stock' : null,
                'blocking_ingredients'        => !$hasAnyStock ? ['Physical Stock'] : [],
                'is_low_stock'                => $totalStock > 0 && $totalStock <= 5,
                'scope'                       => 'all_branches',
            ];
        }

        // 2. All Branches Aggregation for Recipe Products
        if (!$branchId) {
            $allBranches = \App\Models\Branch::all();
            $branchBreakdown = [];
            $totalProducibleStock = 0;
            $hasAnyStock = false;

            foreach ($allBranches as $branch) {
                $bAvail = $this->dynamicAvailability($branch->id);
                $availCount = (float) $bAvail['available'];
                $branchBreakdown[$branch->id] = [
                    'branch_id'           => $branch->id,
                    'branch_name'         => $branch->name,
                    'stock'               => $availCount,
                    'available'           => $availCount,
                    'is_available'        => $bAvail['is_available'],
                    'is_low_stock'        => $bAvail['is_low_stock'],
                    'limiting_ingredient' => $bAvail['limiting_ingredient'],
                ];
                $totalProducibleStock += $availCount;
                if ($bAvail['is_available']) {
                    $hasAnyStock = true;
                }
            }

            return [
                'available'                   => $totalProducibleStock,
                'total_stock'                 => $totalProducibleStock,
                'branch_breakdown'            => $branchBreakdown,
                'is_available'                => $hasAnyStock,
                'max_servings'                => $totalProducibleStock,
                'limiting_ingredient'         => !$hasAnyStock ? 'Out of Stock in all branches' : null,
                'blocking_ingredients'        => [],
                'is_low_stock'                => $totalProducibleStock > 0 && $totalProducibleStock <= 5,
                'scope'                       => 'all_branches',
            ];
        }

        // 3. Single Branch-Specific Availability Calculation (Core Business Truth)
        $minPossible = PHP_FLOAT_MAX;
        $limitingIngredient = null;
        $blockingIngredients = [];

        foreach ($ingredients as $ingredient) {
            $qtyInput = (float) ($ingredient->pivot->quantity_required ?? 0);
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

            // Read branch stock row
            $stockRow = $ingredient->relationLoaded('stocks')
                ? $ingredient->stocks->firstWhere('branch_id', $branchId)
                : $ingredient->stocks()->where('branch_id', $branchId)->first();

            $availableInStock = $stockRow ? (float) $stockRow->stock : 0.0;

            $unitsPossible = floor($availableInStock / $requiredPerUnit);

            if ($unitsPossible < $minPossible) {
                $minPossible = $unitsPossible;
                $limitingIngredient = $ingredient->name;
            }

            if ($availableInStock < $requiredPerUnit) {
                $displayUnit = $ingredient->unit ?? 'pcs';
                $displayStock = \App\Utils\UnitConverter::convertFromBaseQuantity($availableInStock, $displayUnit);
                $displayRequired = \App\Utils\UnitConverter::convertFromBaseQuantity($requiredPerUnit, $displayUnit);

                $blockingIngredients[] = [
                    'name'     => $ingredient->name,
                    'stock'    => $displayStock,
                    'required' => $displayRequired,
                    'unit'     => $displayUnit
                ];
            }
        }

        $available = ($minPossible === PHP_FLOAT_MAX) ? 0 : max(0, (float) $minPossible);

        return [
            'available'            => $available,
            'is_available'         => $available >= 1,
            'max_servings'         => $available,
            'limiting_ingredient'  => $available < 1 ? ($limitingIngredient ?? 'Insufficient Stock') : ($available <= 5 ? $limitingIngredient : null),
            'blocking_ingredients' => $blockingIngredients,
            'is_low_stock'         => $available > 0 && $available <= 5,
            'scope'                => 'branch',
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

        $ingredients = $this->relationLoaded('ingredients') ? $this->ingredients : $this->ingredients()->with('stocks')->get();

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

                $stockRecord = $ingredient->relationLoaded('stocks')
                    ? $ingredient->stocks->firstWhere('branch_id', $branchId)
                    : $ingredient->stocks()->where('branch_id', $branchId)->first();

                $availableStock = $stockRecord ? (float) $stockRecord->stock : 0.0;

                if ($availableStock < $totalNeeded) {
                    $displayUnit = $ingredient->unit ?? 'unit(s)';
                    $displayAvailable = \App\Utils\UnitConverter::convertFromBaseQuantity($availableStock, $displayUnit);
                    $displayNeeded = \App\Utils\UnitConverter::convertFromBaseQuantity($totalNeeded, $displayUnit);

                    return [
                        'success' => false,
                        'message' => "Unable to order '{$this->name}'. Ingredient '{$ingredient->name}' is insufficient in this branch (Available: {$displayAvailable} {$displayUnit}, Required: {$displayNeeded} {$displayUnit})."
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
     * @param bool $lockForUpdate Set to true within DB transactions to acquire row locks
     * @return array { success: bool, message: string|null }
     */
    public static function validateBatchStock(int $branchId, array $items, bool $lockForUpdate = false): array
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
                            'name'   => $ingredient->name,
                            'unit'   => $ingredient->unit ?? 'unit(s)',
                            'needed' => 0.0,
                        ];
                    }
                    $ingredientRequirements[$ingredient->id]['needed'] += $totalNeeded;
                }
            } else {
                $directProductRequirements[$pId] = [
                    'product' => $product,
                    'needed'  => $qty,
                ];
            }
        }

        // 1. Check cumulative ingredient requirements
        foreach ($ingredientRequirements as $ingId => $req) {
            $query = \App\Models\IngredientStock::where('ingredient_id', $ingId)
                ->where('branch_id', $branchId);

            if ($lockForUpdate) {
                $query->lockForUpdate();
            }

            $stockRow = $query->first();

            $available = $stockRow ? (float) $stockRow->stock : 0.0;
            if ($available < $req['needed']) {
                $displayUnit = $req['unit'];
                $displayAvailable = \App\Utils\UnitConverter::convertFromBaseQuantity($available, $displayUnit);
                $displayNeeded = \App\Utils\UnitConverter::convertFromBaseQuantity($req['needed'], $displayUnit);

                return [
                    'success' => false,
                    'message' => "Insufficient stock in this branch for '{$req['name']}'. (Available: {$displayAvailable} {$displayUnit}, Required: {$displayNeeded} {$displayUnit})."
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
     * Dynamic shorthand for basic stock check.
     */
    public function getComputedStockAttribute(): int|float
    {
        if (!$this->exists) {
            return 0;
        }

        $data = $this->dynamicAvailability($this->branch_id);
        return $data['available'];
    }

    /**
     * Compute the cost of this product based on its ingredients and their branch-specific cost.
     * If branch_id is not provided or the product has no ingredients, falls back to direct cost_price.
     *
     * @param int|null $branchId
     * @return float
     */
    public function computeProductCost(?int $branchId = null): float
    {
        $ingredients = $this->relationLoaded('ingredients') ? $this->ingredients : $this->ingredients()->with('stocks')->get();

        if ($ingredients->isNotEmpty()) {
            $totalCost = 0.0;
            foreach ($ingredients as $ingredient) {
                $qtyInput = (float) ($ingredient->pivot->quantity_required ?? 0);
                $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                $required = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyInput,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );

                $costPerUnit = 0.0;
                if ($branchId) {
                    $stockRow = $ingredient->relationLoaded('stocks')
                        ? $ingredient->stocks->firstWhere('branch_id', $branchId)
                        : $ingredient->stocks()->where('branch_id', $branchId)->first();

                    if ($stockRow && (float)$stockRow->cost_per_unit > 0) {
                        $costPerUnit = (float) $stockRow->cost_per_unit;
                    }
                } else {
                    // All branches: take average cost_per_unit of branches with positive cost
                    if ($ingredient->relationLoaded('stocks')) {
                        $positiveStocks = $ingredient->stocks->where('cost_per_unit', '>', 0);
                        $avgCost = $positiveStocks->isNotEmpty() ? (float) $positiveStocks->avg('cost_per_unit') : 0.0;
                    } else {
                        $avgCost = (float) $ingredient->stocks()->where('cost_per_unit', '>', 0)->avg('cost_per_unit');
                    }

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
                return round($totalCost, 4);
            }
        }

        // Direct product fallback
        if ($branchId) {
            $pivot = DB::table('branch_product')
                ->where('product_id', $this->id)
                ->where('branch_id', $branchId)
                ->first();
            if ($pivot && (float)($pivot->cost_price ?? 0) > 0) {
                return round((float) $pivot->cost_price, 4);
            }
        }

        return round((float) ($this->cost_price ?? 0.0), 4);
    }
}

