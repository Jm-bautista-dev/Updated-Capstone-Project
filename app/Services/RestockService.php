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
     * Generate restock suggestions based on historical usage and safety buffers.
     */
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

        $suggestions = [];

        foreach ($stocks as $ingredientId => $stockRow) {
            $ingredient = $ingredients[$ingredientId] ?? null;
            if (!$ingredient) continue;

            $currentStock = (float) $stockRow->stock;
            $unitCost     = (float) ($ingredient->cost_per_base_unit ?? 0);
            
            // --- A. Calculate Daily Usage ---
            // usage_total / 30 days
            $usage30d   = (float) ($totalUsage[$ingredientId]->total_qty_used ?? 0);
            $dailyUsage = $usage30d / self::LOOKBACK_DAYS;

            // --- B. Trend & Volatility (Simplified) ---
            $series = $this->buildDailySeries($usageHistory[$ingredientId] ?? collect(), $since);
            $cv = $this->calculateCV($series);
            $trend = $this->calculateTrend($series);

            // --- C. Predicted Usage & Safety Stock ---
            // predicted = daily * forecast_days (7 days)
            $predictedUsage = $dailyUsage * self::FORECAST_DAYS;
            
            // safety = daily * safety_days (3 days)
            $safetyStock = $dailyUsage * self::SAFETY_DAYS;
            $requiredWithBuffer = $predictedUsage + $safetyStock;

            // --- D. Stock Coverage (Days) ---
            $daysOfStock = $dailyUsage > 0 ? ($currentStock / $dailyUsage) : ($currentStock > 0 ? 999 : 0);

            // --- E. Restock Quantity ---
            $restockQty = $requiredWithBuffer - $currentStock;
            $restockQty = max(0.0, $restockQty);

            // Validation: block unrealistic values
            if ($restockQty > self::MAX_RESTOCK) $restockQty = 0;

            // --- F. Estimated Cost ---
            $estimatedCost = $restockQty * $unitCost;

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
                'confidence'           => round(max(0, 100 - ($cv * 100)), 1),
                'days_of_stock'        => round(min(self::MAX_COVERAGE, $daysOfStock), 1),
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
