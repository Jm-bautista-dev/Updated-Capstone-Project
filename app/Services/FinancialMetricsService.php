<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
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
     * Compute authoritative Today's Revenue and transaction telemetry for a specific branch scope and user.
     * Respects Manila timezone [startOfToday, endOfToday], qualifying 'completed' status, discounts, and delivery fees.
     */
    public function getTodayRevenueMetrics(?int $branchId = null, ?User $user = null): array
    {
        $manilaTz = 'Asia/Manila';
        $startToday = Carbon::now($manilaTz)->startOfDay()->utc();
        $endToday = Carbon::now($manilaTz)->endOfDay()->utc();

        $query = Sale::with(['items', 'delivery'])
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startToday, $endToday]);

        // Authorization scoping
        if ($user && !$user->isAdmin()) {
            $query->where('branch_id', $user->branch_id);
            $effectiveBranchId = (int) $user->branch_id;
        } else {
            if ($branchId && $branchId !== 0) {
                $query->where('branch_id', $branchId);
                $effectiveBranchId = $branchId;
            } else {
                $effectiveBranchId = null;
            }
        }

        $sales = $query->get();

        $todayRevenue = 0.0;
        $totalDeliveryFees = 0.0;
        $completedCount = $sales->count();

        foreach ($sales as $sale) {
            $saleDeliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
            $saleDiscount = (float) ($sale->discount ?? 0.0);
            $totalDeliveryFees += $saleDeliveryFee;

            if ($sale->subtotal !== null) {
                $productRev = max(0.0, (float) $sale->subtotal - $saleDiscount);
            } elseif ($sale->items->isNotEmpty()) {
                $productRev = max(0.0, (float) $sale->items->sum('subtotal') - $saleDiscount);
            } else {
                $productRev = max(0.0, (float) $sale->total - $saleDeliveryFee);
            }

            $todayRevenue += $productRev;
        }

        // Active Queue Counts for Today
        $queueQuery = Sale::whereBetween('created_at', [$startToday, $endToday]);
        if ($user && !$user->isAdmin()) {
            $queueQuery->where('branch_id', $user->branch_id);
        } elseif ($effectiveBranchId) {
            $queueQuery->where('branch_id', $effectiveBranchId);
        }

        $pendingCount = (clone $queueQuery)->where('status', 'pending')->count();
        $preparingCount = (clone $queueQuery)->where('status', 'preparing')->count();
        $cancelledCount = (clone $queueQuery)->where('status', 'cancelled')->count();

        $avgOrderValue = $completedCount > 0 ? round($todayRevenue / $completedCount, 2) : 0.0;

        $dodMetrics = $this->getDayOverDayMetrics($effectiveBranchId, $user);

        return [
            'today_revenue'     => round($todayRevenue, 2),
            'delivery_fees'     => round($totalDeliveryFees, 2),
            'total_collected'   => round($todayRevenue + $totalDeliveryFees, 2),
            'completed_today'   => $completedCount,
            'pending'           => $pendingCount,
            'preparing'         => $preparingCount,
            'cancelled_today'   => $cancelledCount,
            'avg_order_value'   => $avgOrderValue,
            'revenue_delta'     => $dodMetrics['revenue'],
            'orders_delta'      => $dodMetrics['orders'],
            'expenses_delta'    => $dodMetrics['expenses'],
            'profit_delta'      => $dodMetrics['profit'],
            'dod_metrics'       => $dodMetrics,
            'branch_id'         => $effectiveBranchId,
            'timezone'          => 'Asia/Manila',
            'metric_label'      => "Today's Revenue",
            'definition'        => 'Recognized net product revenue from completed transactions today (after discounts, excluding delivery fees)',
        ];
    }

    /**
     * Mathematically compute delta between current and previous values with zero-baseline safety.
     *
     * @return array<string, mixed>
     */
    public function calculateDelta(float $current, float $previous, string $comparisonLabel = 'vs yesterday'): array
    {
        $current = round($current, 2);
        $previous = round($previous, 2);
        $difference = round($current - $previous, 2);

        if ($previous == 0.0) {
            if ($current == 0.0) {
                return [
                    'current_value'    => $current,
                    'previous_value'   => $previous,
                    'difference'       => 0.0,
                    'delta_percentage' => 0.0,
                    'formatted_delta'  => '0.0%',
                    'trend'            => 'neutral',
                    'comparison_label' => $comparisonLabel,
                    'state'            => 'zero',
                    'badge_text'       => 'No change',
                ];
            }

            return [
                'current_value'    => $current,
                'previous_value'   => $previous,
                'difference'       => $difference,
                'delta_percentage' => null,
                'formatted_delta'  => 'New',
                'trend'            => 'up',
                'comparison_label' => $comparisonLabel,
                'state'            => 'new',
                'badge_text'       => 'New today',
            ];
        }

        $pct = (($current - $previous) / $previous) * 100;
        $roundedPct = round($pct, 1);

        if ($roundedPct > 0) {
            $trend = 'up';
            $formatted = '+' . number_format($roundedPct, 1) . '%';
            $state = 'positive';
        } elseif ($roundedPct < 0) {
            $trend = 'down';
            $formatted = number_format($roundedPct, 1) . '%';
            $state = 'negative';
        } else {
            $trend = 'neutral';
            $formatted = '0.0%';
            $state = 'neutral';
        }

        return [
            'current_value'    => $current,
            'previous_value'   => $previous,
            'difference'       => $difference,
            'delta_percentage' => $roundedPct,
            'formatted_delta'  => $formatted,
            'trend'            => $trend,
            'comparison_label' => $comparisonLabel,
            'state'            => $state,
            'badge_text'       => $formatted,
        ];
    }

    /**
     * Compute authoritative Day-over-Day (DoD) metrics comparing Asia/Manila today vs yesterday.
     *
     * @return array<string, mixed>
     */
    public function getDayOverDayMetrics(?int $branchId = null, ?User $user = null): array
    {
        $manilaTz = 'Asia/Manila';
        $todayStart = Carbon::now($manilaTz)->startOfDay();
        $todayEnd = Carbon::now($manilaTz)->endOfDay();
        $yesterdayStart = Carbon::now($manilaTz)->subDay()->startOfDay();
        $yesterdayEnd = Carbon::now($manilaTz)->subDay()->endOfDay();

        $effectiveBranchId = ($user && !$user->isAdmin()) ? (int) $user->branch_id : ($branchId ?: null);

        $todaySummary = $this->getPeriodSummary($todayStart, $todayEnd, $effectiveBranchId);
        $yesterdaySummary = $this->getPeriodSummary($yesterdayStart, $yesterdayEnd, $effectiveBranchId);

        return [
            'revenue'  => array_merge(
                $this->calculateDelta($todaySummary['revenue'], $yesterdaySummary['revenue'], 'vs yesterday'),
                ['metric_name' => "Today's Revenue"]
            ),
            'orders'   => array_merge(
                $this->calculateDelta((float) $todaySummary['total_orders'], (float) $yesterdaySummary['total_orders'], 'vs yesterday'),
                ['metric_name' => "Today's Orders"]
            ),
            'expenses' => array_merge(
                $this->calculateDelta($todaySummary['total_expenses'], $yesterdaySummary['total_expenses'], 'vs yesterday'),
                ['metric_name' => "Operating Expenses"]
            ),
            'profit'   => array_merge(
                $this->calculateDelta($todaySummary['net_profit'], $yesterdaySummary['net_profit'], 'vs yesterday'),
                ['metric_name' => "Net Profit"]
            ),
            'today'     => $todaySummary,
            'yesterday' => $yesterdaySummary,
            'timezone'  => $manilaTz,
        ];
    }

    /**
     * Compute period summary and period-over-period comparison against an equal preceding timeframe.
     *
     * @return array<string, mixed>
     */
    public function getPeriodOverPeriodMetrics($startDate = null, $endDate = null, ?int $branchId = null, ?User $user = null): array
    {
        $manilaTz = 'Asia/Manila';
        $effectiveBranchId = ($user && !$user->isAdmin()) ? (int) $user->branch_id : ($branchId ?: null);

        if (!$startDate && !$endDate) {
            // Default to past 14 days
            $currentEnd = Carbon::now($manilaTz)->endOfDay();
            $currentStart = Carbon::now($manilaTz)->subDays(13)->startOfDay();
        } else {
            $currentStart = Carbon::parse($startDate, $manilaTz)->startOfDay();
            $currentEnd = $endDate ? Carbon::parse($endDate, $manilaTz)->endOfDay() : Carbon::parse($startDate, $manilaTz)->endOfDay();
        }

        // Duration in whole days
        $days = max(1, (int) $currentStart->diffInDays($currentEnd) + 1);

        $previousEnd = (clone $currentStart)->subSecond();
        $previousStart = (clone $previousEnd)->subDays($days - 1)->startOfDay();

        $comparisonLabel = $days === 1
            ? ($currentStart->isToday() ? 'vs yesterday' : 'vs previous day')
            : "vs previous {$days} days";

        $currentSummary = $this->getPeriodSummary($currentStart, $currentEnd, $effectiveBranchId);
        $previousSummary = $this->getPeriodSummary($previousStart, $previousEnd, $effectiveBranchId);

        return [
            'revenue' => array_merge(
                $this->calculateDelta($currentSummary['revenue'], $previousSummary['revenue'], $comparisonLabel),
                ['metric_name' => 'Revenue']
            ),
            'orders' => array_merge(
                $this->calculateDelta((float) $currentSummary['total_orders'], (float) $previousSummary['total_orders'], $comparisonLabel),
                ['metric_name' => 'Orders']
            ),
            'expenses' => array_merge(
                $this->calculateDelta($currentSummary['total_expenses'], $previousSummary['total_expenses'], $comparisonLabel),
                ['metric_name' => 'Operating Expenses']
            ),
            'profit' => array_merge(
                $this->calculateDelta($currentSummary['net_profit'], $previousSummary['net_profit'], $comparisonLabel),
                ['metric_name' => 'Net Profit']
            ),
            'current_period' => [
                'start' => $currentStart->toIso8601String(),
                'end'   => $currentEnd->toIso8601String(),
                'days'  => $days,
            ],
            'previous_period' => [
                'start' => $previousStart->toIso8601String(),
                'end'   => $previousEnd->toIso8601String(),
                'days'  => $days,
            ],
            'current'  => $currentSummary,
            'previous' => $previousSummary,
            'timezone' => $manilaTz,
        ];
    }

    /**
     * Compute comprehensive financial metrics for completed sales and operational expenses across a specific datetime boundary.
     *
     * @return array<string, mixed>
     */
    public function getPeriodSummary($startDate, $endDate, ?int $branchId = null): array
    {
        return $this->getSummaryMetrics($startDate, $endDate, $branchId);
    }
    /**
     * Compute comprehensive financial metrics for completed sales and operational expenses.
     */
    public function getSummaryMetrics($startDate = null, $endDate = null, ?int $branchId = null): array
    {
        $salesQuery = Sale::with(['items.product.ingredients.stocks', 'delivery'])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($startDate, fn($q) => $q->whereDate('created_at', '>=', $startDate))
            ->when($endDate, fn($q) => $q->whereDate('created_at', '<=', $endDate));

        $sales = $salesQuery->get();

        $revenue = 0.0;
        $deliveryFees = 0.0;
        $cogs = 0.0;
        $totalOrders = $sales->count();

        foreach ($sales as $sale) {
            $saleDeliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
            $saleDiscount = (float) ($sale->discount ?? 0.0);
            $deliveryFees += $saleDeliveryFee;

            if ($sale->subtotal !== null) {
                $productRevenue = max(0.0, (float) $sale->subtotal - $saleDiscount);
            } elseif ($sale->items->isNotEmpty()) {
                $productRevenue = max(0.0, (float) $sale->items->sum('subtotal') - $saleDiscount);
            } else {
                $productRevenue = max(0.0, (float) $sale->total - $saleDeliveryFee);
            }

            $revenue += $productRevenue;

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
            'delivery_fees'      => round($deliveryFees, 2),
            'total_collected'    => round($revenue + $deliveryFees, 2),
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

        $sales = Sale::with(['items.product.ingredients.stocks', 'delivery'])
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
                $dailySalesMap[$date] = ['revenue' => 0.0, 'delivery_fees' => 0.0, 'cogs' => 0.0, 'orders' => 0];
            }

            $saleDeliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
            $saleDiscount = (float) ($sale->discount ?? 0.0);
            if ($sale->subtotal !== null) {
                $productRevenue = max(0.0, (float) $sale->subtotal - $saleDiscount);
            } elseif ($sale->items->isNotEmpty()) {
                $productRevenue = max(0.0, (float) $sale->items->sum('subtotal') - $saleDiscount);
            } else {
                $productRevenue = max(0.0, (float) $sale->total - $saleDeliveryFee);
            }

            $dailySalesMap[$date]['revenue'] += $productRevenue;
            $dailySalesMap[$date]['delivery_fees'] += $saleDeliveryFee;
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
        $manilaTz = 'Asia/Manila';
        $startToday = Carbon::now($manilaTz)->startOfDay()->utc();
        $endToday = Carbon::now($manilaTz)->endOfDay()->utc();

        return $branches->map(function (Branch $branch) use ($startDate, $endDate, $startToday, $endToday) {
            $metrics = $this->getSummaryMetrics($startDate, $endDate, $branch->id);

            // Orders and Product Revenue today
            $todaySales = Sale::with(['items', 'delivery'])
                ->where('branch_id', $branch->id)
                ->where('status', 'completed')
                ->whereBetween('created_at', [$startToday, $endToday])
                ->get();

            $ordersToday = $todaySales->count();
            $revenueToday = 0.0;
            foreach ($todaySales as $sale) {
                $saleDeliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
                $saleDiscount = (float) ($sale->discount ?? 0.0);
                if ($sale->subtotal !== null) {
                    $revenueToday += max(0.0, (float) $sale->subtotal - $saleDiscount);
                } elseif ($sale->items->isNotEmpty()) {
                    $revenueToday += max(0.0, (float) $sale->items->sum('subtotal') - $saleDiscount);
                } else {
                    $revenueToday += max(0.0, (float) $sale->total - $saleDeliveryFee);
                }
            }

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
