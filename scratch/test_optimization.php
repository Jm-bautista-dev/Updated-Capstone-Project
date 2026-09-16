<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

$adminUser = User::where('role', 'admin')->first() ?: User::first();
Auth::login($adminUser);

function makeRequest(array $params = []): Request {
    $req = Request::create('/products', 'GET', $params, [], [], [
        'REMOTE_ADDR' => '127.0.0.1',
        'HTTP_HOST' => 'localhost',
        'HTTP_USER_AGENT' => 'PerformanceProfiler',
        'HTTP_ACCEPT' => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    ]);
    $req->setUserResolver(fn() => Auth::user());
    return $req;
}

// Test with current implementation
DB::flushQueryLog();
DB::enableQueryLog();

$startTime = microtime(true);
$productsController = app(\App\Http\Controllers\ProductsController::class);
$response = $productsController->index(makeRequest());
$httpResponse = $response->toResponse(makeRequest());
$content = $httpResponse->getContent();
$endTime = microtime(true);

$queriesBefore = DB::getQueryLog();
DB::disableQueryLog();

echo "BEFORE OPTIMIZATION:\n";
echo "Queries: " . count($queriesBefore) . "\n";
echo "Time: " . round(($endTime - $startTime) * 1000, 2) . " ms\n";
echo "Response Size: " . round(strlen($content) / 1024, 2) . " KB\n\n";

class OptimizedProduct extends Product {
    protected $table = 'products';
    protected $appends = ['image_url'];

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_product', 'product_id', 'branch_id')
                    ->withPivot(['stock', 'price', 'is_active'])
                    ->withTimestamps();
    }

    public function addons()
    {
        return $this->belongsToMany(\App\Models\AddOn::class, 'product_addons', 'product_id', 'addon_id')
                    ->withPivot(['is_required', 'max_quantity', 'sort_order', 'is_active'])
                    ->withTimestamps();
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients', 'menu_item_id', 'ingredient_id')
                    ->withPivot('quantity_required', 'unit')
                    ->withTimestamps();
    }

    public function hasRecipe(): bool
    {
        if ($this->relationLoaded('ingredients')) {
            return $this->ingredients->isNotEmpty();
        }
        return $this->ingredients()->exists();
    }

    public function getAutomaticCost(?int $branchId = null): float
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
            $pivot = $this->relationLoaded('branches')
                ? $this->branches->firstWhere('id', $branchId)?->pivot
                : DB::table('branch_product')->where('product_id', $this->id)->where('branch_id', $branchId)->first();
            if ($pivot && (float)($pivot->cost_price ?? 0) > 0) {
                return round((float) $pivot->cost_price, 4);
            }
        }

        return round((float) ($this->cost_price ?? 0.0), 4);
    }

    public function dynamicAvailability(?int $branchId = null, $allBranches = null): array
    {
        $ingredients = $this->relationLoaded('ingredients') ? $this->ingredients : $this->ingredients()->with('stocks')->get();

        // 1. Direct Physical Products (No Recipe)
        if ($ingredients->isEmpty()) {
            if ($branchId) {
                $pivot = $this->relationLoaded('branches')
                    ? $this->branches->firstWhere('id', $branchId)?->pivot
                    : DB::table('branch_product')->where('product_id', $this->id)->where('branch_id', $branchId)->first();

                $stock = $pivot ? (float) $pivot->stock : 0.0;
                $isActive = $pivot ? (bool) $pivot->is_active : false;
                $safeStock = max(0.0, $stock);
                $isAvail = $isActive && $safeStock >= 1;
                $status = !$isAvail ? 'OUT_OF_STOCK' : ($safeStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK');
                $statusLabel = !$isAvail ? 'Out of Stock' : ($safeStock <= 5 ? 'Low Stock' : 'In Stock');

                $insufficientIngredients = [];
                if (!$isAvail) {
                    $shortage = (float) max(0.0, round(1.0 - $safeStock, 4));
                    $insufficientIngredients[] = [
                        'ingredient_id'        => null,
                        'ingredient_name'      => 'Physical Stock',
                        'name'                 => 'Physical Stock',
                        'required_quantity'    => 1.0,
                        'required'             => 1.0,
                        'available_quantity'   => $safeStock,
                        'stock'                => $safeStock,
                        'shortage_quantity'    => $shortage,
                        'shortage'             => $shortage,
                        'unit'                 => $this->unit ?? 'pcs',
                        'status'               => $pivot ? 'INSUFFICIENT_STOCK' : 'NO_INVENTORY_RECORD',
                        'has_inventory_record' => $pivot !== null,
                        'reason'               => $pivot ? 'INSUFFICIENT_STOCK' : 'NO_INVENTORY_RECORD',
                        'reason_display'       => $pivot
                            ? "Physical stock is insufficient. Required: 1 {$this->unit}, Available: {$safeStock} {$this->unit}."
                            : "No inventory record found for this branch.",
                    ];
                }

                return [
                    'available'                 => $safeStock,
                    'is_available'              => $isAvail,
                    'status'                    => $status,
                    'status_label'              => $statusLabel,
                    'max_servings'              => $safeStock,
                    'limiting_ingredient'       => $safeStock < 1 ? 'Physical Stock' : null,
                    'blocking_ingredients'      => $insufficientIngredients,
                    'insufficient_ingredients'  => $insufficientIngredients,
                    'is_low_stock'              => $safeStock > 0 && $safeStock <= 5,
                    'scope'                     => 'branch',
                ];
            }

            // All branches aggregation for direct products
            $allBranches = $allBranches ?: ($this->relationLoaded('branches') ? $this->branches : Branch::all());
            $branchBreakdown = [];
            $totalStock = 0;
            $hasAnyStock = false;
            $allInsufficient = [];

            foreach ($allBranches as $branch) {
                $bAvail = $this->dynamicAvailability($branch->id, $allBranches);
                $bStock = (float) $bAvail['available'];
                $branchBreakdown[$branch->id] = [
                    'branch_id'                => $branch->id,
                    'branch_name'              => $branch->name,
                    'stock'                    => $bStock,
                    'available'                => $bStock,
                    'is_available'             => (bool) $bAvail['is_available'],
                    'status'                   => $bAvail['status'],
                    'status_label'             => $bAvail['status_label'],
                    'is_low_stock'             => (bool) $bAvail['is_low_stock'],
                    'limiting_ingredient'      => $bAvail['limiting_ingredient'] ?? null,
                    'insufficient_ingredients' => $bAvail['insufficient_ingredients'] ?? [],
                    'blocking_ingredients'     => $bAvail['blocking_ingredients'] ?? [],
                ];
                $totalStock += $bStock;
                if ($bAvail['is_available']) {
                    $hasAnyStock = true;
                } else {
                    foreach ($bAvail['insufficient_ingredients'] as $ins) {
                        $allInsufficient[] = array_merge($ins, [
                            'branch_id'   => $branch->id,
                            'branch_name' => $branch->name,
                        ]);
                    }
                }
            }

            $overallStatus = !$hasAnyStock ? 'OUT_OF_STOCK' : ($totalStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK');
            $overallStatusLabel = !$hasAnyStock ? 'Out of Stock' : ($totalStock <= 5 ? 'Low Stock' : 'In Stock');

            return [
                'available'                 => $totalStock,
                'total_stock'               => $totalStock,
                'branch_breakdown'          => $branchBreakdown,
                'is_available'              => $hasAnyStock,
                'status'                    => $overallStatus,
                'status_label'              => $overallStatusLabel,
                'max_servings'              => $totalStock,
                'limiting_ingredient'       => !$hasAnyStock ? 'Physical Stock' : null,
                'blocking_ingredients'      => $allInsufficient,
                'insufficient_ingredients'  => $allInsufficient,
                'is_low_stock'              => $totalStock > 0 && $totalStock <= 5,
                'scope'                     => 'all_branches',
            ];
        }

        // 2. All Branches Aggregation for Recipe Products
        if (!$branchId) {
            $allBranches = $allBranches ?: ($this->relationLoaded('branches') ? $this->branches : Branch::all());
            $branchBreakdown = [];
            $totalProducibleStock = 0;
            $hasAnyStock = false;
            $allInsufficient = [];

            foreach ($allBranches as $branch) {
                $bAvail = $this->dynamicAvailability($branch->id, $allBranches);
                $availCount = (float) $bAvail['available'];
                $branchBreakdown[$branch->id] = [
                    'branch_id'                => $branch->id,
                    'branch_name'              => $branch->name,
                    'stock'                    => $availCount,
                    'available'                => $availCount,
                    'is_available'             => (bool) $bAvail['is_available'],
                    'status'                   => $bAvail['status'],
                    'status_label'             => $bAvail['status_label'],
                    'is_low_stock'             => (bool) $bAvail['is_low_stock'],
                    'limiting_ingredient'      => $bAvail['limiting_ingredient'] ?? null,
                    'insufficient_ingredients' => $bAvail['insufficient_ingredients'] ?? [],
                    'blocking_ingredients'     => $bAvail['blocking_ingredients'] ?? [],
                ];
                $totalProducibleStock += $availCount;
                if ($bAvail['is_available']) {
                    $hasAnyStock = true;
                } else {
                    foreach ($bAvail['insufficient_ingredients'] as $ins) {
                        $allInsufficient[] = array_merge($ins, [
                            'branch_id'   => $branch->id,
                            'branch_name' => $branch->name,
                        ]);
                    }
                }
            }

            $overallStatus = !$hasAnyStock ? 'OUT_OF_STOCK' : ($totalProducibleStock <= 5 ? 'LOW_STOCK' : 'IN_STOCK');
            $overallStatusLabel = !$hasAnyStock ? 'Out of Stock' : ($totalProducibleStock <= 5 ? 'Low Stock' : 'In Stock');

            return [
                'available'                 => $totalProducibleStock,
                'total_stock'               => $totalProducibleStock,
                'branch_breakdown'          => $branchBreakdown,
                'is_available'              => $hasAnyStock,
                'status'                    => $overallStatus,
                'status_label'              => $overallStatusLabel,
                'max_servings'              => $totalProducibleStock,
                'limiting_ingredient'       => !$hasAnyStock ? 'Out of Stock in all branches' : null,
                'blocking_ingredients'      => $allInsufficient,
                'insufficient_ingredients'  => $allInsufficient,
                'is_low_stock'              => $totalProducibleStock > 0 && $totalProducibleStock <= 5,
                'scope'                     => 'all_branches',
            ];
        }

        // 3. Single Branch-Specific Availability Calculation (Core Business Truth)
        $pivot = $this->relationLoaded('branches')
            ? $this->branches->firstWhere('id', $branchId)?->pivot
            : DB::table('branch_product')->where('product_id', $this->id)->where('branch_id', $branchId)->first();

        $branchStock = $pivot ? (float) $pivot->stock : 0.0;
        $isActive = $pivot ? (bool) $pivot->is_active : true;

        $minPossible = PHP_FLOAT_MAX;
        $limitingIngredient = null;
        $insufficientIngredients = [];

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
                continue;
            }

            // Read branch stock row
            $stockRow = $ingredient->relationLoaded('stocks')
                ? $ingredient->stocks->firstWhere('branch_id', $branchId)
                : $ingredient->stocks()->where('branch_id', $branchId)->first();

            $hasInventoryRecord = ($stockRow !== null);
            $availableInStock = $stockRow ? max(0.0, (float) $stockRow->stock) : 0.0;

            $unitsPossible = floor($availableInStock / $requiredPerUnit);

            if ($unitsPossible < $minPossible) {
                $minPossible = $unitsPossible;
                $limitingIngredient = $ingredient->name;
            }

            if ($availableInStock < $requiredPerUnit) {
                $isCrossUnit = strtolower(trim($unitInput)) !== strtolower(trim($ingredient->unit));
                if ($isCrossUnit) {
                    $displayUnit = $unitInput;
                    $displayStock = max(0.0, (float) \App\Utils\UnitConverter::convertQuantity($availableInStock, $ingredient->unit, $unitInput, $ingredient->avg_weight_per_piece));
                    $displayRequired = (float) $qtyInput;
                    $shortage = (float) max(0.0, round($displayRequired - $displayStock, 4));
                } else {
                    $displayUnit = $ingredient->unit ?? 'pcs';
                    $displayStock = max(0.0, (float) \App\Utils\UnitConverter::convertFromBaseQuantity($availableInStock, $displayUnit));
                    $displayRequired = (float) \App\Utils\UnitConverter::convertFromBaseQuantity($requiredPerUnit, $displayUnit);
                    $shortage = (float) max(0.0, round($displayRequired - $displayStock, 4));
                }

                $statusReason = $hasInventoryRecord ? 'INSUFFICIENT_STOCK' : 'NO_INVENTORY_RECORD';
                $reasonDisplay = $hasInventoryRecord
                    ? "{$ingredient->name} is short by {$shortage} {$displayUnit}. Required: {$displayRequired} {$displayUnit}, Available: {$displayStock} {$displayUnit}."
                    : "{$ingredient->name} — Inventory record unavailable for this branch.";

                $insufficientIngredients[] = [
                    'ingredient_id'        => $ingredient->id,
                    'ingredient_name'      => $ingredient->name,
                    'name'                 => $ingredient->name,
                    'required_quantity'    => $displayRequired,
                    'required'             => $displayRequired,
                    'available_quantity'   => $displayStock,
                    'stock'                => $displayStock,
                    'shortage_quantity'    => $shortage,
                    'shortage'             => $shortage,
                    'unit'                 => $displayUnit,
                    'status'               => $statusReason,
                    'has_inventory_record' => $hasInventoryRecord,
                    'reason'               => $statusReason,
                    'reason_display'       => $reasonDisplay,
                ];
            }
        }

        $recipeUnits = ($minPossible === PHP_FLOAT_MAX) ? 0 : max(0, (float) $minPossible);
        $available = $branchStock > 0 ? ($branchStock + $recipeUnits) : $recipeUnits;
        $isAvail = $isActive && $available >= 1;
        $status = !$isAvail ? 'OUT_OF_STOCK' : ($available <= 5 ? 'LOW_STOCK' : 'IN_STOCK');
        $statusLabel = !$isAvail ? 'Out of Stock' : ($available <= 5 ? 'Low Stock' : 'In Stock');

        return [
            'available'                 => $available,
            'is_available'              => $isAvail,
            'status'                    => $status,
            'status_label'              => $statusLabel,
            'max_servings'              => $available,
            'limiting_ingredient'       => $available < 1 ? ($limitingIngredient ?? 'Insufficient Ingredients') : ($available <= 5 ? $limitingIngredient : null),
            'blocking_ingredients'      => $insufficientIngredients,
            'insufficient_ingredients'  => $insufficientIngredients,
            'is_low_stock'              => $available > 0 && $available <= 5,
            'scope'                     => 'branch',
        ];
    }
}

// Run test with simulated controller logic using OptimizedProduct
DB::flushQueryLog();
DB::enableQueryLog();
$startOptTime = microtime(true);

$branches = Branch::orderBy('name')->get();
$branchId = null;

$query = OptimizedProduct::query()->with(['category', 'ingredients.stocks', 'branch', 'branches', 'addons']);
$products = $query->orderBy('name')->get()->map(function ($product) use ($branchId, $branches, $adminUser) {
    $availability = $product->dynamicAvailability($branchId, $branches);
    $product->stock = (float) $availability['available'];
    $product->is_available = (bool) $availability['is_available'];
    $product->limiting_ingredient = $availability['limiting_ingredient'] ?? null;
    $product->blocking_ingredients = $availability['blocking_ingredients'] ?? [];
    $product->insufficient_ingredients = $availability['insufficient_ingredients'] ?? [];
    $product->max_servings = $availability['max_servings'] ?? $product->stock;
    $product->is_low_stock = (bool) $availability['is_low_stock'];
    $product->status = $availability['status_label'] ?? ($product->is_available ? ($product->stock <= 5 ? 'Low Stock' : 'In Stock') : 'Out of Stock');
    $product->availability_status = $availability['status'] ?? (!$product->is_available ? 'OUT_OF_STOCK' : ($product->stock <= 5 ? 'LOW_STOCK' : 'IN_STOCK'));
    $product->branch_breakdown = $availability['branch_breakdown'] ?? [];

    $automaticCost = $product->getAutomaticCost($branchId);
    $costPrice = ($product->isManualCosting() && $product->manual_cost !== null) ? round((float)$product->manual_cost, 4) : $automaticCost;
    $product->cost_price = $costPrice;
    $product->cost = $costPrice;
    $product->has_cost = $costPrice > 0;
    $product->costing_method = $product->costing_method ?? 'automatic';
    $product->manual_cost = $product->manual_cost !== null ? (float) $product->manual_cost : null;
    $product->automatic_cost = $automaticCost;

    $product->is_direct = !$product->hasRecipe();
    return $product;
});

$summary = [
    'total_products' => $products->count(),
    'low_stock'      => $products->filter(fn($p) => $p->stock > 0 && $p->stock <= 5)->count(),
    'out_of_stock'   => $products->filter(fn($p) => $p->stock <= 0)->count(),
];

$categoriesQuery = Category::query()->orderBy('name');
$ingredientsQuery = Ingredient::orderBy('name')->with('stocks');

$inertiaResponse = inertia('Products/Index', [
    'products'        => $products,
    'categories'      => $categoriesQuery->get(),
    'ingredients'     => $ingredientsQuery->get(),
    'globalAddons'    => \App\Models\AddOn::active()->orderBy('name')->get(['id', 'name', 'price', 'cost_price', 'is_active', 'stock_linked']),
    'summary'         => $summary,
    'branches'        => $branches,
    'allowedUnits'    => \App\Utils\UnitConverter::getAllowedUnits(),
    'currentBranchId' => $branchId,
    'isAdmin'         => true,
    'filters'         => [],
])->toResponse(makeRequest());

$optContent = $inertiaResponse->getContent();
$endOptTime = microtime(true);

$queriesAfter = DB::getQueryLog();
DB::disableQueryLog();

echo "AFTER OPTIMIZATION (SIMULATED):\n";
echo "Queries: " . count($queriesAfter) . " (Reduced from " . count($queriesBefore) . " — " . round((1 - count($queriesAfter)/count($queriesBefore)) * 100, 1) . "% reduction!)\n";
echo "Time: " . round(($endOptTime - $startOptTime) * 1000, 2) . " ms (Reduced from " . round(($endTime - $startTime) * 1000, 2) . " ms)\n";
echo "Response Size: " . round(strlen($optContent) / 1024, 2) . " KB (Reduced from " . round(strlen($content) / 1024, 2) . " KB)\n";

echo "\nRemaining queries:\n";
foreach ($queriesAfter as $i => $q) {
    echo "[" . ($i + 1) . "] " . substr($q['query'], 0, 100) . "...\n";
}
