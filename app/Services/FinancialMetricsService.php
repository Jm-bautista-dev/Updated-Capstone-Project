<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Wastage;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * FinancialMetricsService — Centralized, mathematically sound, branch-isolated financial intelligence engine.
 */
class FinancialMetricsService
{
    /**
     * Compute comprehensive financial metrics for completed sales and operational expenses.
     */
    public function getSummaryMetrics($startDate = null, $endDate = null, ?int $branchId = null): array
    {
        $salesQuery = Sale::with(['items.product.ingredients.stocks'])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate));

        $sales = $salesQuery->get();

        $revenue = 0.0;
        $cogs = 0.0;
        $totalOrders = $sales->count();

        foreach ($sales as $sale) {
            $revenue += (float) $sale->total;

            $saleCogs = 0.0;
            if ($sale->items->isNotEmpty()) {
                foreach ($sale->items as $item) {
                    $itemCost = (float) $item->cost_price;
                    if ($itemCost <= 0 && $item->product) {
                        $itemCost = (float) $item->product->computeProductCost($sale->branch_id);
                    }
                    $saleCogs += ($itemCost * (float) $item->quantity);
                }
            } elseif ((float) $sale->cost_total > 0) {
                $saleCogs = (float) $sale->cost_total;
            }

            $cogs += $saleCogs;
        }

        // Operating Expenses from Wastage / Losses
        $operatingExpenses = (float) Wastage::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate))
            ->sum('cost_at_loss');

        $grossProfit = $revenue - $cogs;
        $totalExpenses = $cogs + $operatingExpenses;
        $netProfit = $revenue - $totalExpenses;
        $grossMargin = $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : 0.0;
        $netMargin = $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0.0;

        return [
            'revenue'            => round($revenue, 2),
            'cogs'               => round($cogs, 2),
            'operating_expenses' => round($operatingExpenses, 2),
            'total_expenses'     => round($totalExpenses, 2),
            'gross_profit'       => round($grossProfit, 2),
            'net_profit'         => round($netProfit, 2),
            'gross_margin'       => $grossMargin,
            'net_margin'         => $netMargin,
            'total_orders'       => $totalOrders,
        ];
    }

    /**
     * Compute day-by-day sales, COGS, operating expenses, and profit margin for charts.
     */
    public function getDailySalesTrajectory(int $rangeDays, ?int $branchId = null): Collection
    {
        $startDate = Carbon::today()->subDays($rangeDays)->startOfDay();
        $endDate = Carbon::today()->endOfDay();

        $sales = Sale::with(['items.product.ingredients.stocks'])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->get();

        $wastages = Wastage::when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->get();

        // Group by Date Y-m-d
        $dailySalesMap = [];
        foreach ($sales as $sale) {
            $date = $sale->created_at->toDateString();
            if (!isset($dailySalesMap[$date])) {
                $dailySalesMap[$date] = ['revenue' => 0.0, 'cogs' => 0.0, 'orders' => 0];
            }

            $dailySalesMap[$date]['revenue'] += (float) $sale->total;
            $dailySalesMap[$date]['orders']++;

            $saleCogs = 0.0;
            if ($sale->items->isNotEmpty()) {
                foreach ($sale->items as $item) {
                    $itemCost = (float) $item->cost_price;
                    if ($itemCost <= 0 && $item->product) {
                        $itemCost = (float) $item->product->computeProductCost($sale->branch_id);
                    }
                    $saleCogs += ($itemCost * (float) $item->quantity);
                }
            } elseif ((float) $sale->cost_total > 0) {
                $saleCogs = (float) $sale->cost_total;
            }

            $dailySalesMap[$date]['cogs'] += $saleCogs;
        }

        $dailyWastageMap = [];
        foreach ($wastages as $waste) {
            $date = $waste->created_at->toDateString();
            $dailyWastageMap[$date] = ($dailyWastageMap[$date] ?? 0.0) + (float) $waste->cost_at_loss;
        }

        $trajectory = collect();
        for ($i = $rangeDays; $i >= 0; $i--) {
            $dateObj = Carbon::today()->subDays($i);
            $dateKey = $dateObj->toDateString();

            $dayData = $dailySalesMap[$dateKey] ?? ['revenue' => 0.0, 'cogs' => 0.0, 'orders' => 0];
            $dayWastage = (float) ($dailyWastageMap[$dateKey] ?? 0.0);

            $revenue = (float) $dayData['revenue'];
            $cogs = (float) $dayData['cogs'];
            $totalExpenses = $cogs + $dayWastage;
            $netProfit = $revenue - $totalExpenses;
            $marginPct = $revenue > 0 ? round(($netProfit / $revenue) * 100, 1) : 0.0;

            $trajectory->push([
                'date'         => $dateObj->format('M d'),
                'raw_date'     => $dateKey,
                'revenue'      => round($revenue, 2),
                'cogs'         => round($cogs, 2),
                'expenses'     => round($totalExpenses, 2),
                'profit'       => round($netProfit, 2),
                'margin_pct'   => $marginPct,
                'orders'       => $dayData['orders'],
            ]);
        }

        return $trajectory;
    }

    /**
     * Compute branch-by-branch financial and inventory metrics.
     */
    public function getBranchStats(Collection $branches, $startDate = null, $endDate = null): Collection
    {
        $today = Carbon::today();

        return $branches->map(function (Branch $branch) use ($startDate, $endDate, $today) {
            $metrics = $this->getSummaryMetrics($startDate, $endDate, $branch->id);

            // Orders and Revenue today
            $todaySales = Sale::where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->whereDate('created_at', $today)
                ->get();

            $ordersToday = $todaySales->count();
            $revenueToday = (float) $todaySales->sum('total');

            // Low stock count
            $lowStockCount = \App\Models\IngredientStock::where('branch_id', $branch->id)
                ->whereColumn('stock', '<=', 'low_stock_level')
                ->count();

            return [
                'id'                   => $branch->id,
                'name'                 => $branch->name,
                'total_revenue'        => $metrics['revenue'],
                'cogs'                 => $metrics['cogs'],
                'total_expenses'       => $metrics['total_expenses'],
                'total_profit'         => $metrics['net_profit'],
                'profit_margin'        => $metrics['net_margin'],
                'total_orders'         => $metrics['total_orders'],
                'orders_today'         => $ordersToday,
                'revenue_today'        => round($revenueToday, 2),
                'inventory_count'      => \App\Models\IngredientStock::where('branch_id', $branch->id)->count(),
                'low_stock_count'      => $lowStockCount,
            ];
        });
    }
}
