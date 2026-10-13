<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RestockRequest;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * RestockService — Mathematically sound, branch-isolated, inventory-aware, and outlier-resistant prescriptive engine.
 */
class RestockService
{
    // Calculation constants
    public const LOOKBACK_DAYS    = 30;   // 30 days of sales history for baseline demand
    public const FORECAST_DAYS    = 7;    // Default 7-day coverage horizon
    public const LEAD_TIME_DAYS   = 3;    // Realistic 3-day supplier lead time buffer
    public const Z_SERVICE_LEVEL  = 1.65; // 95% service level factor (Z-score)
    public const MAX_COVERAGE_DAYS = 365;  // Upper bound for display

    /**
     * Generate restock suggestions based on impact on product availability.
     * Recommends realistic quantities to unblock products up to optimal target coverage.
     */
    public function getImpactBasedSuggestions(int $branchId): array
    {
        // 1. Load restock suggestions from the main engine
        $restockData = $this->generate($branchId);
        $suggestionsByIngredient = collect($restockData['suggestions'] ?? [])->keyBy('ingredient_id');

        // 2. Load branch stocks, ingredients, and products with recipes
        $stocks = IngredientStock::where('branch_id', $branchId)->get();
        $ingredients = Ingredient::whereNull('deleted_at')->get()->keyBy('id');
        $products = Product::whereNull('deleted_at')
            ->with(['ingredients'])
            ->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', function ($bq) use ($branchId) {
                      $bq->where('branches.id', $branchId);
                  });
            })
            ->get();

        $results = [];

        foreach ($stocks as $stockRow) {
            $ingredient = $ingredients->get($stockRow->ingredient_id);
            if (!$ingredient) {
                continue;
            }

            $currentStock = (float) $stockRow->stock;
            $blockingProductsCount = 0;
            $blockingProducts = [];
            $maxRequiredPerServing = 0;
            $totalNeededToUnlockOneEach = 0;

            foreach ($products as $product) {
                $pivot = $product->ingredients->where('id', $ingredient->id)->first()?->pivot;
                if (!$pivot) {
                    continue;
                }

                $qtyInput = (float) $pivot->quantity_required;
                $unitInput = $pivot->unit ?? $ingredient->unit;
                $requiredBase = UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyInput,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );

                if ($requiredBase <= 0) {
                    continue;
                }

                if ($requiredBase > $maxRequiredPerServing) {
                    $maxRequiredPerServing = $requiredBase;
                }

                if ($currentStock < $requiredBase) {
                    $blockingProductsCount++;
                    $missing = $requiredBase - $currentStock;
                    $blockingProducts[] = [
                        'id'      => $product->id,
                        'name'    => $product->name,
                        'missing' => round($missing, 2),
                        'unit'    => $ingredient->unit,
                    ];
                    $totalNeededToUnlockOneEach += $missing;
                }
            }

            // Derive realistic suggested restock quantity from the prescriptive engine
            $mainSuggestion = $suggestionsByIngredient->get($ingredient->id);
            $suggestedRestock = $mainSuggestion
                ? (float) $mainSuggestion['suggested_restock']
                : max(0.0, $totalNeededToUnlockOneEach);

            // If blocking products exist but restock is 0 (e.g. zero demand baseline), ensure at least enough to unlock
            if ($blockingProductsCount > 0 && $suggestedRestock < $totalNeededToUnlockOneEach) {
                $suggestedRestock = max($suggestedRestock, $totalNeededToUnlockOneEach);
            }

            // Status logic
            $status = 'normal';
            if ($blockingProductsCount > 0 || $currentStock <= 0) {
                $status = 'critical';
            } elseif ($stockRow->isLowStock()) {
                $status = 'low';
            }

            // Only include items needing attention
            if ($status === 'normal' && $suggestedRestock <= 0) {
                continue;
            }
            if ($status === 'normal' && $blockingProductsCount === 0) {
                continue;
            }

            // Format suggested quantity for display (kg/L conversion)
            $displayQty = $suggestedRestock;
            $displayUnit = $ingredient->unit;
            if ($displayUnit === 'g' && $displayQty >= 1000) {
                $displayQty = $displayQty / 1000;
                $displayUnit = 'kg';
            } elseif ($displayUnit === 'ml' && $displayQty >= 1000) {
                $displayQty = $displayQty / 1000;
                $displayUnit = 'L';
            }

            $servingsUnlockable = $maxRequiredPerServing > 0
                ? (int) floor($suggestedRestock / $maxRequiredPerServing)
                : 0;

            $results[] = [
                'ingredient_id'              => $ingredient->id,
                'ingredient_name'            => $ingredient->name,
                'current_stock'              => round($currentStock, 2),
                'unit'                       => $ingredient->unit,
                'status'                     => $status,
                'blocking_products_count'    => $blockingProductsCount,
                'blocking_products'          => $blockingProducts,
                'suggested_restock_quantity' => round($suggestedRestock, 2),
                'display_restock_quantity'   => round($displayQty, 1),
                'display_restock_unit'       => $displayUnit,
                'priority_score'             => ($status === 'critical' ? 100 : 0) + ($blockingProductsCount * 10),
                'max_servings_unlockable'    => max(1, $servingsUnlockable),
            ];
        }

        // Sort by Priority Score DESC, then by Stock ASC
        usort($results, function ($a, $b) {
            if ($b['priority_score'] !== $a['priority_score']) {
                return $b['priority_score'] <=> $a['priority_score'];
            }
            return $a['current_stock'] <=> $b['current_stock'];
        });

        return $results;
    }

    /**
     * Generate prescriptive restock suggestions for a branch.
     *
     * Formula:
     *   Inventory Position = Current Usable Stock + Incoming Pipeline Stock - Reserved Active Orders
     *   Target Stock = Expected Demand During Coverage Period + Safety Stock
     *   Recommended Restock = max(0, Target Stock - Inventory Position)
     */
    public function generate(int $branchId, int $horizonDays = self::FORECAST_DAYS): array
    {
        $since = Carbon::today()->subDays(self::LOOKBACK_DAYS - 1)->startOfDay();

        // 1. Current On-Hand Stock for Branch
        $stocks = IngredientStock::where('branch_id', $branchId)
            ->get()
            ->keyBy('ingredient_id');

        // 2. Ingredients metadata
        $ingredients = Ingredient::whereNull('deleted_at')
            ->whereIn('id', $stocks->keys()->toArray())
            ->get()
            ->keyBy('id');

        // 3. Incoming Pipeline Stock (approved or pending restock requests for this branch)
        $incomingStockMap = DB::table('restock_requests')
            ->where('branch_id', $branchId)
            ->where('item_type', 'ingredient')
            ->whereIn('status', ['pending', 'approved'])
            ->select('item_id', DB::raw('SUM(quantity) as total_incoming'))
            ->groupBy('item_id')
            ->pluck('total_incoming', 'item_id')
            ->map(fn($v) => (float) $v)
            ->toArray();

        // 4. Reserved Stock from active, un-deducted orders for this branch
        $reservedStockMap = $this->calculateReservedOrderStock($branchId);

        // 5. Query Completed Sales for this Branch in Lookback Period
        $saleItems = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $since)
            ->select(
                'sale_items.product_id',
                'sale_items.quantity as sold_quantity',
                DB::raw('DATE(sales.created_at) as sale_date')
            )
            ->get();

        // 6. Map Sold Items to Ingredients via Recipes with Unit Normalization
        $productIds = $saleItems->pluck('product_id')->unique()->filter()->values();
        $productsWithRecipes = Product::with(['ingredients'])
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        // Daily usage matrix: [ingredient_id => [date => base_quantity_used]]
        $dailyUsageByIngredient = [];

        foreach ($saleItems as $saleItem) {
            $product = $productsWithRecipes->get($saleItem->product_id);
            if (!$product) {
                continue;
            }

            $soldQty = (float) $saleItem->sold_quantity;
            $saleDate = $saleItem->sale_date;

            if ($product->ingredients->isNotEmpty()) {
                foreach ($product->ingredients as $ing) {
                    $qtyInput = (float) $ing->pivot->quantity_required;
                    $unitInput = $ing->pivot->unit ?? $ing->unit;
                    $basePerServing = UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyInput,
                        $unitInput,
                        $ing->unit,
                        $ing->avg_weight_per_piece
                    );

                    $needed = $soldQty * $basePerServing;
                    $dailyUsageByIngredient[$ing->id][$saleDate] =
                        ($dailyUsageByIngredient[$ing->id][$saleDate] ?? 0.0) + $needed;
                }
            }
        }

        // 7. Forecast Trend Factor Integration (Branch-scoped, bounded)
        $forecastTrendFactor = 1.0;
        $recommendedModel = 'Historical Baseline';
        $forecastConfidence = 'Normal';

        try {
            $forecastService = new ForecastService();
            $forecastResult = $forecastService->generate($horizonDays, $branchId);

            if (isset($forecastResult['forecast']) && !isset($forecastResult['error'])) {
                $histValues = array_column($forecastResult['historical'] ?? [], 'actual');
                $predValues = array_column($forecastResult['forecast'] ?? [], 'predicted');
                $histAvg = count($histValues) > 0 ? array_sum($histValues) / count($histValues) : 0;
                $predAvg = count($predValues) > 0 ? array_sum($predValues) / count($predValues) : 0;

                if ($histAvg > 0) {
                    $rawRatio = $predAvg / $histAvg;
                    // Clamp trend factor safely to prevent runaway projection distortion
                    $forecastTrendFactor = max(0.8, min(1.3, $rawRatio));
                }

                $recommendedModel = $forecastResult['recommended_model'] ?? $recommendedModel;
                $forecastConfidence = $forecastResult['confidence'] ?? $forecastConfidence;
            }
        } catch (\Throwable $e) {
            $forecastTrendFactor = 1.0;
        }

        $suggestions = [];

        // 8. Generate Suggestions for Each Branch Ingredient
        foreach ($stocks as $ingredientId => $stockRow) {
            $ingredient = $ingredients->get($ingredientId);
            if (!$ingredient) {
                continue;
            }

            // Check if batch tracking exists for this ingredient at this branch
            $batchesExist = DB::table('ingredient_batches')
                ->where('branch_id', $branchId)
                ->where('ingredient_id', $ingredientId)
                ->whereNull('deleted_at')
                ->exists();

            if ($batchesExist) {
                $now = Carbon::now(config('app.timezone', 'Asia/Manila'));
                $currentStock = (float) DB::table('ingredient_batches')
                    ->where('branch_id', $branchId)
                    ->where('ingredient_id', $ingredientId)
                    ->whereNull('deleted_at')
                    ->where('status', 'available')
                    ->where('current_quantity', '>', 0)
                    ->where(function ($q) use ($now) {
                        $q->whereNull('expiration_date')
                          ->orWhereDate('expiration_date', '>=', $now->toDateString());
                    })
                    ->sum('current_quantity');
            } else {
                $currentStock = (float) $stockRow->stock;
            }

            $incomingStock  = (float) ($incomingStockMap[$ingredientId] ?? 0.0);
            $reservedStock  = (float) ($reservedStockMap[$ingredientId] ?? 0.0);
            $unitCost       = (float) ($ingredient->cost_per_base_unit ?? 0.0);

            // A. Build 30-day time series and apply outlier protection (IQR Winsorization)
            $seriesRaw = $this->buildFullDailySeries($dailyUsageByIngredient[$ingredientId] ?? [], $since);
            $seriesWinsorized = $this->winsorizeOutliers($seriesRaw);

            $nDays = count($seriesWinsorized);
            $totalUsageWinsorized = array_sum($seriesWinsorized);
            $dailyMean = $nDays > 0 ? ($totalUsageWinsorized / $nDays) : 0.0;
            $dailyStdDev = $this->calculateStdDev($seriesWinsorized, $dailyMean);

            // B. Expected Demand over the coverage horizon
            $trendFactor = ($dailyMean > 0 && $nDays >= 3) ? $forecastTrendFactor : 1.0;
            $predictedUsage = $dailyMean * $horizonDays * $trendFactor;

            // C. Statistical Safety Stock (Lead Time + Service Level)
            if ($dailyMean <= 0) {
                $safetyStock = 0.0;
            } else {
                $rawSafetyStock = self::Z_SERVICE_LEVEL * $dailyStdDev * sqrt(self::LEAD_TIME_DAYS);
                // Bounded between 10% and 50% of expected demand
                $minBuffer = $predictedUsage * 0.10;
                $maxBuffer = $predictedUsage * 0.50;
                $safetyStock = max($minBuffer, min($maxBuffer, $rawSafetyStock));
            }

            // D. Target Stock Level & Net Inventory Position
            $targetStock = $predictedUsage + $safetyStock;
            $inventoryPosition = $currentStock + $incomingStock - $reservedStock;

            // E. Recommended Restock Quantity
            $restockQty = max(0.0, $targetStock - $inventoryPosition);

            // F. Days of Stock Coverage
            $daysOfStock = $dailyMean > 0
                ? ($currentStock / $dailyMean)
                : ($currentStock > 0 ? 999.0 : 0.0);

            $estimatedDepletionDate = $dailyMean > 0
                ? Carbon::now()->addDays((int) floor($daysOfStock))->toDateString()
                : 'Never';

            // G. Status Classification
            $status = 'Safe';
            if ($inventoryPosition <= 0) {
                $status = 'Out of Stock';
            } elseif ($inventoryPosition < $safetyStock || $daysOfStock < 2.0) {
                $status = 'Critical';
            } elseif ($inventoryPosition < $targetStock || $daysOfStock < 5.0) {
                $status = 'Warning';
            }

            // Skip items with zero restock needed and safe stock status
            if ($restockQty <= 0 && $status === 'Safe') {
                continue;
            }

            $estimatedCost = $restockQty * $unitCost;
            $cv = $dailyMean > 0 ? ($dailyStdDev / $dailyMean) : 0.0;
            $trend = $this->calculateTrend($seriesWinsorized);
            $safetyBufferPct = $predictedUsage > 0
                ? round(($safetyStock / $predictedUsage) * 100, 1)
                : 0.0;

            // Build transparent, explainable reasoning string
            $reasonParts = [];
            $reasonParts[] = "Forecast Demand: " . round($predictedUsage, 2);
            $reasonParts[] = "Safety Buffer: " . round($safetyStock, 2);
            $reasonParts[] = "Target Stock: " . round($targetStock, 2);
            $reasonParts[] = "Current Usable: " . round($currentStock, 2);
            if ($incomingStock > 0) {
                $reasonParts[] = "Incoming: " . round($incomingStock, 2);
            }
            if ($reservedStock > 0) {
                $reasonParts[] = "Reserved: " . round($reservedStock, 2);
            }
            $reasonParts[] = "Net Position: " . round($inventoryPosition, 2);
            $reasonParts[] = "Recommended Restock: " . round($restockQty, 2) . " " . ($ingredient->unit ?? 'units');
            $reasonString = implode(' | ', $reasonParts);

            $suggestions[] = [
                'ingredient_id'        => (int) $ingredientId,
                'name'                 => $ingredient->name,
                'unit'                 => $ingredient->unit ?? 'pcs',
                'current_stock'        => round($currentStock, 2),
                'incoming_stock'       => round($incomingStock, 2),
                'reserved_stock'       => round($reservedStock, 2),
                'inventory_position'   => round($inventoryPosition, 2),
                'low_stock_level'      => (float) $stockRow->low_stock_level,
                'predicted_usage'      => round($predictedUsage, 2),
                'safety_stock'         => round($safetyStock, 2),
                'required_with_buffer' => round($targetStock, 2),
                'suggested_restock'    => round($restockQty, 2),
                'estimated_cost'       => round($estimatedCost, 2),
                'status'               => $status,
                'trend'                => $trend,
                'volatility'           => $cv > 0.4 ? 'high' : ($cv > 0.2 ? 'medium' : 'low'),
                'safety_buffer_pct'    => $safetyBufferPct,
                'confidence'           => $forecastConfidence,
                'days_of_stock'        => round(min(self::MAX_COVERAGE_DAYS, $daysOfStock), 1),
                'depletion_date'       => $estimatedDepletionDate,
                'carrying_risk'        => $daysOfStock > 30 ? 'high' : 'low',
                'overstock_warning'    => $daysOfStock > 60,
                'citation'             => $reasonString,
                'reason'               => $reasonString,
                'days_of_data'         => $nDays,
                'predicted_usage_lower' => round(max(0.0, $predictedUsage * 0.9), 2),
                'predicted_usage_upper' => round($predictedUsage * 1.1, 2),
            ];
        }

        // Sort by urgency: Out of Stock -> Critical -> Warning -> Safe
        usort($suggestions, function ($a, $b) {
            $order = ['Out of Stock' => 0, 'Critical' => 1, 'Warning' => 2, 'Safe' => 3];
            $orderDiff = ($order[$a['status']] ?? 99) <=> ($order[$b['status']] ?? 99);
            if ($orderDiff !== 0) {
                return $orderDiff;
            }
            return $b['suggested_restock'] <=> $a['suggested_restock'];
        });

        return [
            'suggestions'       => $suggestions,
            'tomorrow_forecast' => 0,
            'demand_ratio'      => $forecastTrendFactor,
        ];
    }

    /**
     * Compute reserved ingredient stock for un-deducted orders in this branch.
     */
    private function calculateReservedOrderStock(int $branchId): array
    {
        $reserved = [];

        try {
            $activeOrders = Order::where('branch_id', $branchId)
                ->whereNotIn('status', ['delivered', 'cancelled'])
                ->where('inventory_deducted', false)
                ->get();

            if ($activeOrders->isEmpty()) {
                return [];
            }

            $orderIds = $activeOrders->pluck('id');
            $orderItems = DB::table('order_items')
                ->whereIn('order_id', $orderIds)
                ->select('product_id', DB::raw('SUM(quantity) as total_qty'))
                ->groupBy('product_id')
                ->get();

            $productIds = $orderItems->pluck('product_id')->unique();
            $products = Product::with('ingredients')->whereIn('id', $productIds)->get()->keyBy('id');

            foreach ($orderItems as $item) {
                $product = $products->get($item->product_id);
                if (!$product || $product->ingredients->isEmpty()) {
                    continue;
                }

                $orderQty = (float) $item->total_qty;

                foreach ($product->ingredients as $ing) {
                    $qtyRequired = (float) $ing->pivot->quantity_required;
                    $unitRequired = $ing->pivot->unit ?? $ing->unit;
                    $baseNeeded = UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyRequired,
                        $unitRequired,
                        $ing->unit,
                        $ing->avg_weight_per_piece
                    );

                    $reserved[$ing->id] = ($reserved[$ing->id] ?? 0.0) + ($orderQty * $baseNeeded);
                }
            }
        } catch (\Throwable $e) {
            // Safe fallback if order_items table structure differs
        }

        return $reserved;
    }

    /**
     * Build continuous daily time series for the lookback window.
     */
    private function buildFullDailySeries(array $dailyUsageMap, Carbon $since): array
    {
        $series = [];
        $cursor = $since->copy()->startOfDay();
        $today = Carbon::today()->endOfDay();

        while ($cursor->lte($today)) {
            $dateKey = $cursor->toDateString();
            $series[] = (float) ($dailyUsageMap[$dateKey] ?? 0.0);
            $cursor->addDay();
        }

        return $series;
    }

    /**
     * Outlier protection: Winsorize abnormal spikes using IQR / 3-sigma thresholds.
     * Prevents single-day artificial spikes (e.g. 500 units) from inflating ongoing restock recommendations.
     */
    public function winsorizeOutliers(array $values): array
    {
        $n = count($values);
        if ($n < 4) {
            return $values;
        }

        $nonZero = array_values(array_filter($values, fn($v) => $v > 0.0001));
        $m = count($nonZero);

        if ($m < 3) {
            return $values;
        }

        sort($nonZero);

        $q1 = $nonZero[(int) floor($m * 0.25)];
        $q3 = $nonZero[(int) floor($m * 0.75)];
        $iqr = $q3 - $q1;

        if ($iqr > 0) {
            $upperThreshold = $q3 + (2.5 * $iqr);
        } else {
            $median = $nonZero[(int) floor($m * 0.5)];
            $upperThreshold = $median * 2.5;
        }

        if ($upperThreshold <= 0) {
            return $values;
        }

        $winsorized = [];
        foreach ($values as $val) {
            $winsorized[] = $val > $upperThreshold ? $upperThreshold : $val;
        }

        return $winsorized;
    }

    /**
     * Calculate sample standard deviation.
     */
    private function calculateStdDev(array $values, float $mean): float
    {
        $n = count($values);
        if ($n < 2) {
            return 0.0;
        }

        $sumSq = 0.0;
        foreach ($values as $val) {
            $sumSq += ($val - $mean) ** 2;
        }

        return sqrt($sumSq / ($n - 1));
    }

    /**
     * Determine demand trend direction.
     */
    private function calculateTrend(array $values): string
    {
        $n = count($values);
        if ($n < 14) {
            return 'stable';
        }

        $recent = array_sum(array_slice($values, -7)) / 7;
        $older = array_sum(array_slice($values, -14, 7)) / 7;

        if ($older <= 0) {
            return $recent > 0 ? 'rising' : 'stable';
        }

        $change = ($recent - $older) / $older;
        if ($change > 0.15) {
            return 'rising';
        }
        if ($change < -0.15) {
            return 'declining';
        }

        return 'stable';
    }

    /**
     * Generate product-centric prescriptive restock suggestions.
     * Evaluates real configured recipes, branch-isolated eligible inventory (FEFO/FIFO aware),
     * sales demand forecasting, bottleneck ingredients, and producible portions before & after restock.
     */
    public function getProductCentricSuggestions(int $branchId, int $horizonDays = self::FORECAST_DAYS): array
    {
        $since = Carbon::today()->subDays(self::LOOKBACK_DAYS - 1)->startOfDay();
        $sevenDaysAgo = Carbon::today()->subDays(6)->startOfDay();

        // 1. Authoritative branch-level ingredient suggestions (reconciled consolidated replenishment)
        $baseEngine = $this->generate($branchId, $horizonDays);
        $ingredientSuggestions = collect($baseEngine['suggestions'] ?? [])->keyBy('ingredient_id');
        $forecastTrendFactor = (float) ($baseEngine['demand_ratio'] ?? 1.0);

        // 2. Fetch all products eligible for this branch
        $products = Product::whereNull('deleted_at')
            ->with([
                'category',
                'ingredients' => function ($q) {
                    $q->whereNull('ingredients.deleted_at');
                },
                'branches',
            ])
            ->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', function ($bq) use ($branchId) {
                      $bq->where('branches.id', $branchId);
                  });
            })
            ->orderBy('name')
            ->get();

        // 3. 30-day Completed Sales Query for this branch
        $saleRows = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $since)
            ->select('sale_items.product_id', 'sale_items.quantity', 'sales.created_at')
            ->get();

        $salesByProduct = [];
        $sevenDaysTimestamp = $sevenDaysAgo->timestamp;
        foreach ($saleRows as $row) {
            $pid = (int) $row->product_id;
            if (!isset($salesByProduct[$pid])) {
                $salesByProduct[$pid] = [
                    'total_units' => 0.0,
                    'units_7d'    => 0.0,
                    'units_prior' => 0.0,
                ];
            }
            $qty = (float) $row->quantity;
            $salesByProduct[$pid]['total_units'] += $qty;
            $rowTs = Carbon::parse($row->created_at)->timestamp;
            if ($rowTs >= $sevenDaysTimestamp) {
                $salesByProduct[$pid]['units_7d'] += $qty;
            } else {
                $salesByProduct[$pid]['units_prior'] += $qty;
            }
        }

        // 4. Bestseller identification & Demand priority mapping
        $soldProducts = collect($salesByProduct)
            ->filter(fn($d) => $d['total_units'] > 0)
            ->sortByDesc('total_units');

        $bestsellerProductIds = [];
        $totalSoldProductsCount = $soldProducts->count();
        if ($totalSoldProductsCount > 0) {
            $topCount = max(1, (int) ceil($totalSoldProductsCount * 0.20));
            $topProducts = $soldProducts->take(max(3, $topCount));
            foreach ($topProducts as $pid => $data) {
                if ($data['total_units'] >= 5.0) {
                    $bestsellerProductIds[] = $pid;
                }
            }
        }

        // 5. Shared ingredients map across branch products
        $ingredientToProductsMap = [];
        foreach ($products as $prod) {
            if ($prod->ingredients->isEmpty()) {
                continue;
            }
            foreach ($prod->ingredients as $ing) {
                $ingredientToProductsMap[$ing->id][] = [
                    'id'   => $prod->id,
                    'name' => $prod->name,
                ];
            }
        }

        // 6. Branch batch and stock aggregates (FEFO/FIFO eligible vs ineligible)
        $branchStocks = IngredientStock::where('branch_id', $branchId)->get()->keyBy('ingredient_id');
        $reservedStockMap = $this->calculateReservedOrderStock($branchId);
        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        $batchEligibleAggregates = DB::table('ingredient_batches')
            ->where('branch_id', $branchId)
            ->whereNull('deleted_at')
            ->where('status', 'available')
            ->where('current_quantity', '>', 0)
            ->where(function ($q) use ($now) {
                $q->whereNull('expiration_date')
                  ->orWhereDate('expiration_date', '>=', $now->toDateString());
            })
            ->select('ingredient_id', DB::raw('SUM(current_quantity) as total_eligible'))
            ->groupBy('ingredient_id')
            ->pluck('total_eligible', 'ingredient_id')
            ->toArray();

        $batchIneligibleAggregates = DB::table('ingredient_batches')
            ->where('branch_id', $branchId)
            ->whereNull('deleted_at')
            ->where(function ($q) use ($now) {
                $q->where('status', '!=', 'available')
                  ->orWhere(function ($eq) use ($now) {
                      $eq->whereNotNull('expiration_date')
                         ->whereDate('expiration_date', '<', $now->toDateString());
                  });
            })
            ->where('current_quantity', '>', 0)
            ->select('ingredient_id', DB::raw('SUM(current_quantity) as total_ineligible'))
            ->groupBy('ingredient_id')
            ->pluck('total_ineligible', 'ingredient_id')
            ->toArray();

        $batchesExistPerIngredient = DB::table('ingredient_batches')
            ->where('branch_id', $branchId)
            ->whereNull('deleted_at')
            ->select('ingredient_id', DB::raw('COUNT(*) as batch_cnt'))
            ->groupBy('ingredient_id')
            ->pluck('batch_cnt', 'ingredient_id')
            ->toArray();

        $productResults = [];

        // 7. Process each product
        foreach ($products as $prod) {
            $salesData = $salesByProduct[$prod->id] ?? null;
            $units30d = (float) ($salesData['total_units'] ?? 0.0);
            $units7d = (float) ($salesData['units_7d'] ?? 0.0);
            $unitsPrior = (float) ($salesData['units_prior'] ?? 0.0);

            $velocity = $units30d / (float) self::LOOKBACK_DAYS;
            $forecastedUnits = round($velocity * $horizonDays * $forecastTrendFactor, 1);

            // Sales Trend
            $salesTrend = 'stable';
            $daily7d = $units7d / 7.0;
            $dailyPrior = $unitsPrior / 23.0;
            if ($dailyPrior > 0) {
                if ($daily7d > ($dailyPrior * 1.15)) {
                    $salesTrend = 'rising';
                } elseif ($daily7d < ($dailyPrior * 0.85)) {
                    $salesTrend = 'declining';
                }
            } elseif ($daily7d > 0) {
                $salesTrend = 'rising';
            }

            // Demand Priority
            $isBestseller = in_array($prod->id, $bestsellerProductIds);
            if ($isBestseller || $forecastedUnits >= 15.0 || $velocity >= 0.5) {
                $demandPriority = 'high';
            } elseif ($forecastedUnits >= 5.0 || $units30d >= 3.0) {
                $demandPriority = 'medium';
            } elseif ($units30d > 0) {
                $demandPriority = 'low';
            } else {
                $demandPriority = 'none';
            }

            // Missing recipe handling
            if ($prod->ingredients->isEmpty()) {
                $productResults[] = [
                    'id'                            => $prod->id,
                    'name'                          => $prod->name,
                    'sku'                           => $prod->sku,
                    'category_name'                 => $prod->category?->name ?? 'Uncategorized',
                    'image_url'                     => $prod->image_url,
                    'has_recipe'                    => false,
                    'recipe_status'                 => 'missing',
                    'restock_urgency'               => 'recipe_missing',
                    'demand_priority'               => $demandPriority,
                    'is_bestseller'                 => false,
                    'historical_units_sold'         => round($units30d, 1),
                    'daily_sales_velocity'          => round($velocity, 2),
                    'sales_trend'                   => $salesTrend,
                    'forecasted_demand'             => round($forecastedUnits, 1),
                    'current_producible_portions'   => null,
                    'projected_producible_portions' => null,
                    'portions_gain'                 => 0,
                    'bottleneck_ingredients'        => [],
                    'bottleneck_details'            => [],
                    'requires_restock'              => false,
                    'recipe_ingredients'            => [],
                    'suggested_restock_quantities'  => [],
                    'explanation'                   => "{$prod->name} has no configured recipe ingredients. Configure recipe in Product Management before production capacity can be calculated.",
                ];
                continue;
            }

            $portionsSupportedList = [];
            $projectedPortionsList = [];
            $recipeIngredientsData = [];
            $productSuggestedRestocks = [];
            $anyIngredientNeedsRestock = false;

            foreach ($prod->ingredients as $ing) {
                $pivot = $ing->pivot;
                $qtyRequired = (float) $pivot->quantity_required;
                $unitRequired = $pivot->unit ?: $ing->unit;
                $basePerServing = UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyRequired,
                    $unitRequired,
                    $ing->unit,
                    $ing->avg_weight_per_piece
                );

                if ($basePerServing <= 0) {
                    continue;
                }

                $ingId = $ing->id;
                $hasBatches = !empty($batchesExistPerIngredient[$ingId]);
                $eligibleStock = $hasBatches
                    ? (float) ($batchEligibleAggregates[$ingId] ?? 0.0)
                    : max(0.0, (float) ($branchStocks->get($ingId)?->stock ?? 0.0));
                $ineligibleStock = $hasBatches
                    ? (float) ($batchIneligibleAggregates[$ingId] ?? 0.0)
                    : 0.0;
                $reserved = (float) ($reservedStockMap[$ingId] ?? 0.0);
                $usableStock = max(0.0, $eligibleStock - $reserved);

                $mainSuggestion = $ingredientSuggestions->get($ingId);
                $suggestedRestock = $mainSuggestion ? (float) $mainSuggestion['suggested_restock'] : 0.0;
                $projectedStock = $usableStock + $suggestedRestock;

                $currentPortions = (int) floor($usableStock / $basePerServing);
                $projectedPortions = (int) floor($projectedStock / $basePerServing);

                $portionsSupportedList[$ingId] = $currentPortions;
                $projectedPortionsList[$ingId] = $projectedPortions;

                if ($suggestedRestock > 0) {
                    $anyIngredientNeedsRestock = true;
                    $productSuggestedRestocks[$ingId] = round($suggestedRestock, 2);
                }

                $sharedProds = $ingredientToProductsMap[$ingId] ?? [];
                $isShared = count($sharedProds) > 1;
                $otherProdNames = array_values(array_filter(
                    array_column($sharedProds, 'name'),
                    fn($nm) => $nm !== $prod->name
                ));

                $recipeIngredientsData[] = [
                    'ingredient_id'                => $ingId,
                    'name'                         => $ing->name,
                    'category'                     => $ing->category ?? null,
                    'recipe_quantity'              => $qtyRequired,
                    'recipe_unit'                  => $unitRequired,
                    'base_quantity_per_portion'    => round($basePerServing, 4),
                    'base_unit'                    => $ing->unit,
                    'usable_stock'                 => round($usableStock, 2),
                    'ineligible_stock'             => round($ineligibleStock, 2),
                    'portions_supported'           => $currentPortions,
                    'suggested_restock'            => round($suggestedRestock, 2),
                    'projected_stock'              => round($projectedStock, 2),
                    'projected_portions_supported' => $projectedPortions,
                    'is_shared'                    => $isShared,
                    'shared_with_products_count'   => count($sharedProds),
                    'shared_product_names'         => $otherProdNames,
                    'status'                       => $mainSuggestion['status'] ?? ($usableStock <= 0 ? 'Out of Stock' : 'Safe'),
                    'days_of_stock'                => $mainSuggestion['days_of_stock'] ?? 999,
                ];
            }

            if (empty($portionsSupportedList)) {
                continue;
            }

            $currentProducible = min($portionsSupportedList);
            $projectedProducible = min($projectedPortionsList);
            $portionsGain = max(0, $projectedProducible - $currentProducible);

            $bottleneckNames = [];
            $bottleneckDetails = [];
            foreach ($recipeIngredientsData as &$rIng) {
                if ($rIng['portions_supported'] === $currentProducible) {
                    $rIng['is_bottleneck'] = true;
                    $bottleneckNames[] = $rIng['name'];
                    $bottleneckDetails[] = [
                        'ingredient_id'        => $rIng['ingredient_id'],
                        'name'                 => $rIng['name'],
                        'unit'                 => $rIng['base_unit'],
                        'usable_stock'         => $rIng['usable_stock'],
                        'required_per_portion' => $rIng['base_quantity_per_portion'],
                        'portions_supported'   => $rIng['portions_supported'],
                    ];
                } else {
                    $rIng['is_bottleneck'] = false;
                }
            }
            unset($rIng);

            // Urgency determination
            $hasOosIngredient = collect($recipeIngredientsData)->contains('usable_stock', '<=', 0);
            $isCapacityInsufficient = $currentProducible < ceil($forecastedUnits);

            if (($currentProducible <= 2 && $forecastedUnits >= 1.0)
                || ($hasOosIngredient && $forecastedUnits >= 1.0)
                || ($forecastedUnits >= 5.0 && $currentProducible < ($forecastedUnits * 0.3))) {
                $urgency = 'critical';
            } elseif ($isCapacityInsufficient || $anyIngredientNeedsRestock) {
                $urgency = 'warning';
            } else {
                $urgency = 'safe';
            }

            $requiresRestock = ($urgency === 'critical' || $urgency === 'warning' || $anyIngredientNeedsRestock);

            $explanation = $this->buildProductExplanation(
                $prod->name,
                $isBestseller,
                $demandPriority,
                $forecastedUnits,
                $horizonDays,
                $currentProducible,
                $projectedProducible,
                $portionsGain,
                $bottleneckNames,
                $urgency
            );

            $productResults[] = [
                'id'                            => $prod->id,
                'name'                          => $prod->name,
                'sku'                           => $prod->sku,
                'category_name'                 => $prod->category?->name ?? 'Uncategorized',
                'image_url'                     => $prod->image_url,
                'has_recipe'                    => true,
                'recipe_status'                 => 'configured',
                'restock_urgency'               => $urgency,
                'demand_priority'               => $demandPriority,
                'is_bestseller'                 => $isBestseller,
                'historical_units_sold'         => round($units30d, 1),
                'daily_sales_velocity'          => round($velocity, 2),
                'sales_trend'                   => $salesTrend,
                'forecasted_demand'             => round($forecastedUnits, 1),
                'current_producible_portions'   => $currentProducible,
                'projected_producible_portions' => $projectedProducible,
                'portions_gain'                 => $portionsGain,
                'bottleneck_ingredients'        => $bottleneckNames,
                'bottleneck_details'            => $bottleneckDetails,
                'requires_restock'              => $requiresRestock,
                'recipe_ingredients'            => $recipeIngredientsData,
                'suggested_restock_quantities'  => $productSuggestedRestocks,
                'explanation'                   => $explanation,
            ];
        }

        // 8. Deterministic sorting: Urgency -> Bestseller -> Forecasted Demand -> Portions Gain
        usort($productResults, function ($a, $b) {
            $urgencyRank = ['critical' => 0, 'warning' => 1, 'safe' => 2, 'recipe_missing' => 3];
            $rankA = $urgencyRank[$a['restock_urgency']] ?? 99;
            $rankB = $urgencyRank[$b['restock_urgency']] ?? 99;
            if ($rankA !== $rankB) {
                return $rankA <=> $rankB;
            }

            if ($a['is_bestseller'] !== $b['is_bestseller']) {
                return $b['is_bestseller'] ? 1 : -1;
            }

            if ($b['forecasted_demand'] !== $a['forecasted_demand']) {
                return $b['forecasted_demand'] <=> $a['forecasted_demand'];
            }

            return $b['portions_gain'] <=> $a['portions_gain'];
        });

        // 9. Consolidated summary
        $sharedIngredientsSummary = [];
        foreach ($ingredientToProductsMap as $ingId => $prods) {
            if (count($prods) > 1) {
                $mainSug = $ingredientSuggestions->get($ingId);
                $sharedIngredientsSummary[] = [
                    'ingredient_id'     => $ingId,
                    'name'              => $mainSug['name'] ?? ('Ingredient #' . $ingId),
                    'unit'              => $mainSug['unit'] ?? 'units',
                    'products_count'    => count($prods),
                    'products'          => $prods,
                    'suggested_restock' => (float) ($mainSug['suggested_restock'] ?? 0.0),
                    'status'            => $mainSug['status'] ?? 'Safe',
                    'current_stock'     => (float) ($mainSug['current_stock'] ?? 0.0),
                ];
            }
        }

        $summary = [
            'total_products'           => count($productResults),
            'products_needing_restock' => count(array_filter($productResults, fn($p) => $p['requires_restock'])),
            'critical_products'        => count(array_filter($productResults, fn($p) => $p['restock_urgency'] === 'critical')),
            'warning_products'         => count(array_filter($productResults, fn($p) => $p['restock_urgency'] === 'warning')),
            'safe_products'            => count(array_filter($productResults, fn($p) => $p['restock_urgency'] === 'safe')),
            'missing_recipes_count'    => count(array_filter($productResults, fn($p) => $p['restock_urgency'] === 'recipe_missing')),
            'bestsellers_at_risk'      => count(array_filter($productResults, fn($p) => $p['is_bestseller'] && $p['requires_restock'])),
            'total_portions_gain'      => array_sum(array_column($productResults, 'portions_gain')),
            'shared_ingredients_count' => count($sharedIngredientsSummary),
        ];

        return [
            'horizon_days'       => $horizonDays,
            'products'           => $productResults,
            'summary'            => $summary,
            'shared_ingredients' => $sharedIngredientsSummary,
        ];
    }

    /**
     * Build explainable rationale for product restocking.
     */
    private function buildProductExplanation(
        string $productName,
        bool $isBestseller,
        string $demandPriority,
        float $forecastDemand,
        int $horizonDays,
        int $currentPortions,
        int $projectedPortions,
        int $portionsGain,
        array $bottlenecks,
        string $urgency
    ): string {
        $bottleneckText = count($bottlenecks) > 0 ? implode(', ', $bottlenecks) : 'current inventory';

        if ($urgency === 'critical') {
            $prefix = $isBestseller ? "{$productName} is a proven bestseller with " : "{$productName} has ";
            return "{$prefix}{$demandPriority} predicted demand ({$forecastDemand} portions over {$horizonDays} days). Current inventory permits only {$currentPortions} complete portions. {$bottleneckText} is currently the primary limiting factor. Replenishing recommended ingredients could support up to {$projectedPortions} portions (+{$portionsGain} additional portions) based on configured recipe and eligible branch inventory.";
        }

        if ($urgency === 'warning') {
            return "Predicted demand is {$forecastDemand} portions over {$horizonDays} days. Current eligible ingredients support {$currentPortions} portions. Feasible capacity is constrained by {$bottleneckText}. Replenishing recommended stock expands feasible production capacity to {$projectedPortions} portions (+{$portionsGain} portions).";
        }

        return "{$productName} has sufficient ingredient coverage. Current eligible inventory supports {$currentPortions} complete portions against a forecasted demand of {$forecastDemand} portions over {$horizonDays} days. No restocking is currently required.";
    }
}
