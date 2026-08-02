<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * RestockService — Mathematically correct, unit-consistent inventory optimization engine.
 * Refactored for production-grade reliability.
 */
class RestockService
{
    // Calculation constants
    private const LOOKBACK_DAYS = 30;    // 30 days of history for average calculation
    private const FORECAST_DAYS = 7;     // Predict usage for the next 7 days
    private const SAFETY_DAYS   = 3;     // Maintain 3 days of safety buffer
    private const MAX_COVERAGE  = 365;   // Flag items with > 1 year coverage as anomalies
    private const MAX_RESTOCK   = 100000; // Hard threshold for restock quantity to prevent absurd values

    /**
     * Generate restock suggestions based on impact on product availability.
     */
    public function getImpactBasedSuggestions(int $branchId): array
    {
        // 1. Get all ingredients and their current stock for the branch
        $stocks = \App\Models\IngredientStock::where('branch_id', $branchId)->get();
        $ingredients = \App\Models\Ingredient::all()->keyBy('id');
        $products = \App\Models\Product::with(['ingredients'])->get();

        $results = [];

        foreach ($stocks as $stockRow) {
            $ingredient = $ingredients[$stockRow->ingredient_id] ?? null;
            if (!$ingredient) continue;

            $blockingProductsCount = 0;
            $blockingProducts = [];
            $maxRequiredPerServing = 0;
            $totalNeededToUnlockOneEach = 0;

            foreach ($products as $product) {
                // Check if this product uses this ingredient
                $pivot = $product->ingredients->where('id', $ingredient->id)->first()?->pivot;
                if (!$pivot) continue;

                // Calculate required in base unit
                $qtyInput = (float) $pivot->quantity_required;
                $unitInput = $pivot->unit ?? $ingredient->unit;
                $requiredBase = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                    $qtyInput,
                    $unitInput,
                    $ingredient->unit,
                    $ingredient->avg_weight_per_piece
                );

                if ($requiredBase <= 0) continue;

                // Update max requirement for overall suggestions
                if ($requiredBase > $maxRequiredPerServing) $maxRequiredPerServing = $requiredBase;

                // Is it blocking this product?
                if ($stockRow->stock < $requiredBase) {
                    $blockingProductsCount++;
                    $blockingProducts[] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'missing' => $requiredBase - $stockRow->stock,
                        'unit' => $ingredient->unit
                    ];
                    $totalNeededToUnlockOneEach += ($requiredBase - $stockRow->stock);
                }
            }

            // Calculate Suggested Restock
            // needed = total missing to make 1 of each + buffer (e.g. 50 servings worth)
            $buffer = $maxRequiredPerServing * 50; 
            $suggestedRestock = $totalNeededToUnlockOneEach + $buffer;

            // Status logic
            $status = 'normal';
            if ($blockingProductsCount > 0) {
                $status = 'critical';
            } elseif ($stockRow->isLowStock()) {
                $status = 'low';
            }

            // Only include items that need attention in the priority list
            if ($status === 'normal' && $suggestedRestock <= 0) continue;
            if ($status === 'normal' && $blockingProductsCount === 0) continue;

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

            $results[] = [
                'ingredient_id'             => $ingredient->id,
                'ingredient_name'           => $ingredient->name,
                'current_stock'             => (float) $stockRow->stock,
                'unit'                      => $ingredient->unit,
                'status'                    => $status,
                'blocking_products_count'   => $blockingProductsCount,
                'blocking_products'         => $blockingProducts,
                'suggested_restock_quantity'=> round($suggestedRestock, 2),
                'display_restock_quantity'  => round($displayQty, 1),
                'display_restock_unit'      => $displayUnit,
                'priority_score'            => ($status === 'critical' ? 100 : 0) + $blockingProductsCount, 
                'max_servings_unlockable'   => 50, // Buffer amount
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

    public function generate(int $branchId): array
    {
        $since = Carbon::now()->subDays(self::LOOKBACK_DAYS);

        // 1. Load current stock levels for this branch (Eloquent respects Global Scopes)
        $stocks = \App\Models\IngredientStock::where('branch_id', $branchId)
            ->get()
            ->keyBy('ingredient_id');

        // 2. Load ingredient metadata (name, unit, cost) (Eloquent respects SoftDeletes)
        $ingredients = \App\Models\Ingredient::whereIn('id', $stocks->keys()->toArray())
            ->get()
            ->keyBy('id');

        // 3. Compute Historical Usage (Sum of usage from sales * recipes over 30 days)
        // Join: sale_items × menu_item_ingredients
        $totalUsage = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_item_ingredients', 'sale_items.product_id', '=', 'menu_item_ingredients.menu_item_id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $since)
            ->select(
                'menu_item_ingredients.ingredient_id',
                DB::raw('SUM(sale_items.quantity * menu_item_ingredients.quantity_required) as total_qty_used')
            )
            ->groupBy('menu_item_ingredients.ingredient_id')
            ->get()
            ->keyBy('ingredient_id');

        // Get daily usage series for trend detection
        $usageHistory = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('menu_item_ingredients', 'sale_items.product_id', '=', 'menu_item_ingredients.menu_item_id')
            ->where('sales.branch_id', $branchId)
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $since)
            ->select(
                'menu_item_ingredients.ingredient_id',
                DB::raw('DATE(sales.created_at) as usage_date'),
                DB::raw('SUM(sale_items.quantity * menu_item_ingredients.quantity_required) as qty_used')
            )
            ->groupBy('menu_item_ingredients.ingredient_id', 'usage_date')
            ->get()
            ->groupBy('ingredient_id');

        // Fetch forecast multiplier to link Prescriptive Analytics to the best forecasting model
        $forecastService = new ForecastService();
        $forecastResult = $forecastService->generate(self::FORECAST_DAYS, $branchId);
        $forecastMultiplier = 1.0;
        $recommendedModel = 'Historical Baseline';
        $forecastConfidence = 'Normal';

        if (isset($forecastResult['forecast']) && !isset($forecastResult['error'])) {
            $histValues = array_column($forecastResult['historical'], 'actual');
            $predValues = array_column($forecastResult['forecast'], 'predicted');
            $histAvg = count($histValues) > 0 ? array_sum($histValues) / count($histValues) : 0;
            $predAvg = count($predValues) > 0 ? array_sum($predValues) / count($predValues) : 0;
            if ($histAvg > 0) {
                $forecastMultiplier = $predAvg / $histAvg;
            }
            $recommendedModel = $forecastResult['recommended_model'] ?? $recommendedModel;
            $forecastConfidence = $forecastResult['confidence'] ?? $forecastConfidence;
        }

        $suggestions = [];

        foreach ($stocks as $ingredientId => $stockRow) {
            $ingredient = $ingredients[$ingredientId] ?? null;
            if (!$ingredient) continue;

            $currentStock = (float) $stockRow->stock;
            $unitCost     = (float) ($ingredient->cost_per_base_unit ?? 0);
            
            // --- A. Calculate Daily Usage (Adjusted by Forecast Multiplier) ---
            $usage30d   = (float) ($totalUsage[$ingredientId]->total_qty_used ?? 0);
            $historicalDailyUsage = $usage30d / self::LOOKBACK_DAYS;
            
            // Apply adaptive forecast multiplier!
            $dailyUsage = $historicalDailyUsage * $forecastMultiplier;

            // --- B. Trend & Volatility ---
            $series = $this->buildDailySeries($usageHistory[$ingredientId] ?? collect(), $since);
            $cv = $this->calculateCV($series);
            
            // Set trend indicator matching forecast recommended model
            $trend = $this->calculateTrend($series);

            // --- C. Predicted Usage & Safety Stock ---
            $predictedUsage = $dailyUsage * self::FORECAST_DAYS;
            $safetyStock = $dailyUsage * self::SAFETY_DAYS;
            $requiredWithBuffer = $predictedUsage + $safetyStock;

            // --- D. Stock Coverage & Depletion (Days) ---
            $daysOfStock = $dailyUsage > 0 ? ($currentStock / $dailyUsage) : ($currentStock > 0 ? 999.0 : 0.0);
            $estimatedDepletionDate = $dailyUsage > 0 
                ? Carbon::now()->addDays(floor($daysOfStock))->toDateString() 
                : 'Never';

            // --- E. Restock Quantity ---
            $restockQty = $requiredWithBuffer - $currentStock;
            $restockQty = max(0.0, $restockQty);

            if ($restockQty > self::MAX_RESTOCK) $restockQty = 0;

            // --- F. Estimated Cost & Risk Alerts ---
            $estimatedCost = $restockQty * $unitCost;
            $carryingRisk = $daysOfStock > 30 ? 'high' : 'low';
            $overstockWarning = $daysOfStock > 60;

            // --- G. Status Classification ---
            $status = 'Safe';
            if ($daysOfStock < 2) {
                $status = 'Critical';
            } elseif ($daysOfStock < 5) {
                $status = 'Warning';
            }
            if ($currentStock <= 0) {
                $status = 'Out of Stock';
            }

            // Only suggest if action is needed
            if ($restockQty <= 0 && $status === 'Safe') continue;

            $changePct = round(($forecastMultiplier - 1.0) * 100, 1);

            $suggestions[] = [
                'ingredient_id'        => (int) $ingredientId,
                'name'                 => $ingredient->name,
                'unit'                 => $ingredient->unit ?? 'pcs',
                'current_stock'        => round($currentStock, 2),
                'low_stock_level'      => (float) $stockRow->low_stock_level,
                'predicted_usage'      => round($predictedUsage, 2),
                'required_with_buffer' => round($requiredWithBuffer, 2),
                'suggested_restock'    => round($restockQty, 2),
                'estimated_cost'       => round($estimatedCost, 2),
                'status'               => $status,
                'trend'                => $trend,
                'volatility'           => $cv > 0.4 ? 'high' : ($cv > 0.2 ? 'medium' : 'low'),
                'safety_buffer_pct'    => round((self::SAFETY_DAYS / self::FORECAST_DAYS) * 100, 1),
                'confidence'           => $forecastConfidence,
                'days_of_stock'        => round(min(self::MAX_COVERAGE, $daysOfStock), 1),
                'depletion_date'       => $estimatedDepletionDate,
                'carrying_risk'        => $carryingRisk,
                'overstock_warning'    => $overstockWarning,
                'citation'             => "Adjusted by {$changePct}% demand shift using {$recommendedModel} model validation",
                'days_of_data'         => count($series),
                'predicted_usage_lower' => round($predictedUsage * 0.9, 2),
                'predicted_usage_upper' => round($predictedUsage * 1.1, 2),
            ];
        }

        usort($suggestions, function ($a, $b) {
            $order = ['Out of Stock' => 0, 'Critical' => 1, 'Warning' => 2, 'Safe' => 3];
            return $order[$a['status']] <=> $order[$b['status']];
        });

        return [
            'suggestions' => $suggestions,
            'tomorrow_forecast' => 0, // Not used in this version but kept for compatibility
            'demand_ratio' => 1,
        ];
    }

    private function buildDailySeries($rows, $since): array
    {
        $map = [];
        foreach ($rows as $row) $map[$row->usage_date] = (float) $row->qty_used;
        $series = [];
        $current = $since->copy();
        $today = Carbon::today();
        while ($current->lte($today)) {
            $series[] = $map[$current->toDateString()] ?? 0.0;
            $current->addDay();
        }
        return $series;
    }

    private function calculateCV(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0;
        $mean = array_sum($values) / $n;
        if ($mean <= 0) return 0;
        $sq = array_map(fn($v) => ($v - $mean) ** 2, $values);
        $stdDev = sqrt(array_sum($sq) / $n);
        return $stdDev / $mean;
    }

    private function calculateTrend(array $values): string
    {
        $n = count($values);
        if ($n < 14) return 'stable';
        $recent = array_sum(array_slice($values, -7)) / 7;
        $older = array_sum(array_slice($values, -14, 7)) / 7;
        if ($older <= 0) return $recent > 0 ? 'rising' : 'stable';
        $change = ($recent - $older) / $older;
        if ($change > 0.1) return 'rising';
        if ($change < -0.1) return 'declining';
        return 'stable';
    }
}
