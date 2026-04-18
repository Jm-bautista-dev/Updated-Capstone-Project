<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * RestockService — Prescriptive, adaptive inventory optimization engine.
 *
 * Logic flow:
 *  1. Pull per-ingredient actual daily consumption from sale_items × recipes
 *  2. Detect each ingredient's trend (rising / stable / declining) via
 *     weighted regression on recent usage
 *  3. Compute volatility (CV = std / mean) — high CV → bigger safety buffer
 *  4. Blend tomorrow's revenue forecast with per-ingredient usage rates to
 *     estimate demand
 *  5. Derive adaptive safety buffer per ingredient (10–35%)
 *  6. Compare with current stock → prescriptive restock qty + status
 */
class RestockService
{
    // Lookback window for ingredient usage history (days)
    private const USAGE_LOOKBACK = 30;

    // Weights in safety buffer calculation:
    // safety_pct = BASE + VOLATILITY_FACTOR * CV + TREND_FACTOR * trend_pct
    private const BASE_SAFETY      = 0.10; // minimum 10%
    private const VOLATILITY_BONUS = 0.20; // up to +20% when CV is extreme
    private const TREND_BONUS      = 0.05; // +5% when demand is rising fast

    // Max safety cap to avoid absurd over-ordering
    private const MAX_SAFETY = 0.35;

    /**
     * Generate adaptive restock suggestions for a branch.
     *
     * @param int   $branchId         The branch to analyse
     * @param float $tomorrowForecast Tomorrow's predicted revenue (PHP)
     * @param float $forecastLower    Lower bound (worst case)
     * @param float $forecastUpper    Upper bound (best case)
     * @param array $forecastInsights Insights from ForecastService (passed through)
     */
    public function generate(
        int   $branchId,
        float $tomorrowForecast,
        float $forecastLower,
        float $forecastUpper,
        array $forecastInsights = []
    ): array {
        $since = Carbon::now()->subDays(self::USAGE_LOOKBACK);

        // ── 1. Compute average daily revenue in the lookback period ─────────────
        // Use pluck + PHP average to avoid fromSub column leakage bug.
        $dailyTotals = DB::table('sales')
            ->where('branch_id', $branchId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $since)
            ->select(DB::raw('SUM(total) as daily_total'))
            ->groupBy(DB::raw('DATE(created_at)'))
            ->pluck('daily_total')
            ->map(fn($v) => (float) $v)
            ->toArray();

        $avgDailyRevenue = count($dailyTotals) > 0
            ? array_sum($dailyTotals) / count($dailyTotals)
            : 1.0;

        // Demand multiplier: how much tomorrow differs from average
        $demandRatio = $avgDailyRevenue > 0 ? $tomorrowForecast / $avgDailyRevenue : 1.0;

        // ── 2. Load all products & their recipes for this branch ────────────────
        $products = DB::table('products')
            ->where('branch_id', $branchId)
            ->pluck('id')
            ->toArray();

        if (empty($products)) {
            return ['error' => 'No products found for this branch. Add products with recipes first.'];
        }

        // ingredient_id → total quantity_required across all recipes for this branch's products
        $recipes = DB::table('menu_item_ingredients')
            ->whereIn('menu_item_id', $products)
            ->select('ingredient_id', DB::raw('SUM(quantity_required) as qty_per_unit'))
            ->groupBy('ingredient_id')
            ->get()
            ->keyBy('ingredient_id');

        if ($recipes->isEmpty()) {
            return ['error' => 'No recipe data found. Link ingredients to products first.'];
        }

        // ── 3. Pull actual ingredient consumption history (30 days) ─────────────
        //  Join: sale_items × menu_item_ingredients to get real per-day usage
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
            ->orderBy('usage_date')
            ->get()
            ->groupBy('ingredient_id');

        // ── 4. Load current stock ────────────────────────────────────────────────
        $stocks = DB::table('ingredient_stocks')
            ->where('branch_id', $branchId)
            ->get()
            ->keyBy('ingredient_id');

        // Load ingredient metadata (name, unit, cost)
        $ingredientIds = $recipes->keys()->toArray();
        $ingredients = DB::table('ingredients')
            ->whereIn('id', $ingredientIds)
            ->get()
            ->keyBy('id');

        // ── 5. Build suggestion for each ingredient ──────────────────────────────
        $suggestions = [];

        foreach ($recipes as $ingredientId => $recipe) {
            $ingredient = $ingredients[$ingredientId] ?? null;
            if (!$ingredient) continue;

            $stockRow     = $stocks[$ingredientId] ?? null;
            $currentStock = $stockRow ? (float) $stockRow->stock : 0.0;
            $lowStockLevel = $stockRow ? (float) $stockRow->low_stock_level : 0.0;
            $costPerUnit  = (float) ($ingredient->cost_per_base_unit ?? 0);

            // ── a. Analyse per-day usage series ──────────────────────────────
            $dailyUsageSeries = $this->buildDailySeries(
                $usageHistory[$ingredientId] ?? collect(),
                $since
            );

            $meanUsage = $this->mean($dailyUsageSeries ?: [0]);
            $stdDev    = $this->stdDev($dailyUsageSeries ?: [0]);
            $cv        = $meanUsage > 0 ? $stdDev / $meanUsage : 0;

            // ── b. Trend detection (recent 7-day slope vs older average) ─────
            $recentUsageAvg = $this->mean(array_slice($dailyUsageSeries, -7) ?: [0]);
            $olderUsageAvg  = count($dailyUsageSeries) > 7
                ? $this->mean(array_slice($dailyUsageSeries, 0, -7))
                : $meanUsage;

            $trendDirection = 'stable';
            $trendMultiplier = 1.0;
            if ($olderUsageAvg > 0) {
                $relChange = ($recentUsageAvg - $olderUsageAvg) / $olderUsageAvg;
                if ($relChange > 0.10) {
                    $trendDirection  = 'rising';
                    $trendMultiplier = min(1.40, 1.0 + $relChange); // up to 40% boost
                } elseif ($relChange < -0.10) {
                    $trendDirection  = 'declining';
                    $trendMultiplier = max(0.70, 1.0 + $relChange); // down to 30% reduction
                }
            }

            // ── c. Adaptive safety buffer ─────────────────────────────────────
            $safetyPct = self::BASE_SAFETY
                + (min(1.0, $cv) * self::VOLATILITY_BONUS)
                + ($trendDirection === 'rising' ? self::TREND_BONUS : 0);
            $safetyPct = min(self::MAX_SAFETY, $safetyPct);

            // ── d. Demand-adjusted predicted usage ────────────────────────────
            // Use actual historical consumption rate × demand ratio × trend
            // If no history, fall back to recipe qty × demand ratio
            $baseUsage = $meanUsage > 0
                ? $recentUsageAvg * $demandRatio * $trendMultiplier
                : (float) $recipe->qty_per_unit * $tomorrowForecast;

            $predictedUsage = round($baseUsage, 4);
            $requiredWithBuffer = $predictedUsage * (1 + $safetyPct);

            // ── e. Gap analysis ───────────────────────────────────────────────
            $gap        = $requiredWithBuffer - $currentStock;
            $restockQty = max(0.0, $gap);

            // ── f. Coverage ratio for status classification ───────────────────
            // How many days worth of stock do we have?
            $avgDailyRate     = max(0.001, $recentUsageAvg > 0 ? $recentUsageAvg : $meanUsage);
            $daysOfStock      = $currentStock / $avgDailyRate;

            $status = $this->classifyStatus(
                $currentStock,
                $predictedUsage,
                $requiredWithBuffer,
                $daysOfStock,
                $lowStockLevel,
                $trendDirection
            );

            // Only include if action is needed (or already critical)
            if ($gap <= 0 && $status === 'Safe') continue;

            // ── g. Confidence: how reliable is this suggestion ───────────────
            $dataPoints  = count($dailyUsageSeries);
            $rawConf     = max(0, 1 - $cv) * 100;
            $dataBonus   = min(10, $dataPoints / 3);
            $confidence  = round(min(99, $rawConf + $dataBonus), 1);

            $suggestions[] = [
                'ingredient_id'      => (int)   $ingredientId,
                'name'               =>          $ingredient->name,
                'unit'               =>          $ingredient->unit ?? 'pcs',
                'current_stock'      => round($currentStock, 2),
                'low_stock_level'    => round($lowStockLevel, 2),
                'predicted_usage'    => round($predictedUsage, 2),
                'required_with_buffer' => round($requiredWithBuffer, 2),
                'suggested_restock'  => (float) ceil($restockQty * 100) / 100,
                'estimated_cost'     => round(ceil($restockQty) * $costPerUnit, 2),
                'status'             =>          $status,
                'trend'              =>          $trendDirection,
                'volatility'         =>          $cv > 0.4 ? 'high' : ($cv > 0.2 ? 'medium' : 'low'),
                'safety_buffer_pct'  => round($safetyPct * 100, 1),
                'confidence'         =>          $confidence,
                'days_of_stock'      => round($daysOfStock, 1),
                'days_of_data'       =>          $dataPoints,
                // Bounds using forecast range
                'predicted_usage_lower' => round($baseUsage * ($forecastLower / max(1, $tomorrowForecast)), 2),
                'predicted_usage_upper' => round($baseUsage * ($forecastUpper / max(1, $tomorrowForecast)), 2),
            ];
        }

        // Sort: Out of Stock → Critical → Warning → Safe
        usort($suggestions, function ($a, $b) {
            $order = ['Out of Stock' => 0, 'Critical' => 1, 'Warning' => 2, 'Safe' => 3];
            return ($order[$a['status']] ?? 9) <=> ($order[$b['status']] ?? 9);
        });

        return [
            'suggestions'        => $suggestions,
            'tomorrow_forecast'  => $tomorrowForecast,
            'forecast_lower'     => $forecastLower,
            'forecast_upper'     => $forecastUpper,
            'demand_ratio'       => round($demandRatio, 2),
            'forecast_insights'  => $forecastInsights,
        ];
    }

    // ── Private helpers ────────────────────────────────────────────────────────

    /**
     * Fill every calendar day in the lookback with a usage value (0 if no sales).
     */
    private function buildDailySeries($rows, Carbon $since): array
    {
        $map = [];
        foreach ($rows as $row) {
            $map[$row->usage_date] = (float) $row->qty_used;
        }

        $series  = [];
        $current = $since->copy();
        $today   = Carbon::today();

        while ($current->lte($today)) {
            $d         = $current->toDateString();
            $series[]  = $map[$d] ?? 0.0;
            $current->addDay();
        }

        return $series;
    }

    /**
     * Classify ingredient status based on multiple factors.
     */
    private function classifyStatus(
        float  $currentStock,
        float  $predictedUsage,
        float  $requiredWithBuffer,
        float  $daysOfStock,
        float  $lowStockLevel,
        string $trend
    ): string {
        if ($currentStock <= 0) {
            return 'Out of Stock';
        }

        // Critical: will run out before next restock cycle (< 1.5 days)
        if ($daysOfStock < 1.5 || $currentStock < ($predictedUsage * 0.3)) {
            return 'Critical';
        }

        // Critical for rising trend: less than 2 days even with trend
        if ($trend === 'rising' && $daysOfStock < 2.0) {
            return 'Critical';
        }

        // Warning: stock below required buffer OR below low_stock_level
        if ($currentStock < $requiredWithBuffer || ($lowStockLevel > 0 && $currentStock <= $lowStockLevel)) {
            return 'Warning';
        }

        return 'Safe';
    }

    private function mean(array $values): float
    {
        return count($values) > 0 ? array_sum($values) / count($values) : 0.0;
    }

    private function stdDev(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0.0;
        $mean = $this->mean($values);
        $sq   = array_map(fn($v) => ($v - $mean) ** 2, $values);
        return sqrt(array_sum($sq) / $n);
    }
}
