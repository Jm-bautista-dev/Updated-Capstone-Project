<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SalesExport;
use Carbon\Carbon;
use App\Models\CashierShift;

class ReportController extends Controller
{
    // ── Public actions ────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user = Auth::user();
        $branchId = $user->isAdmin()
            ? ($request->input('branch_id') && $request->input('branch_id') !== 'all' ? (int) $request->input('branch_id') : null)
            : (int) $user->branch_id;

        $sales = Sale::with(['cashier', 'items.product', 'branch'])
            ->when(!$user->isAdmin(), fn($q) => $q->where('branch_id', $user->branch_id))
            ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId))
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->cashier_id && $user->isAdmin(), fn($q) => $q->where('user_id', $request->cashier_id))
            ->when($request->status,    fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $todayMetrics = app(\App\Services\FinancialMetricsService::class)->getTodayRevenueMetrics(
            $branchId ? (int) $branchId : null,
            $user
        );
        $todaySales = $todayMetrics['today_revenue'];

        $shifts = CashierShift::with('cashier')
            ->when(!$user->isAdmin(), fn($q) => $q
                ->where('cashier_id', $user->id)
                ->where('branch_id',  $user->branch_id)
            )
            ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId))
            ->when($request->date_from, fn($q) => $q->whereDate('opened_at', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('opened_at', '<=', $request->date_to))
            ->when($request->cashier_id && $user->isAdmin(), fn($q) => $q->where('cashier_id', $request->cashier_id))
            ->latest()
            ->paginate(20, ['*'], 'shifts_page')
            ->withQueryString();

        if (!$user->isAdmin()) {
            $sales->getCollection()->transform(function ($sale) {
                $sale->cost_total = null;
                $sale->profit = null;
                $sale->makeHidden(['cost_total', 'profit']);
                if ($sale->items) {
                    $sale->items->transform(function ($item) {
                        $item->cost_price = null;
                        $item->profit = null;
                        $item->makeHidden(['cost_price', 'profit']);
                        if ($item->product) {
                            $item->product->cost_price = null;
                            $item->product->makeHidden(['cost_price']);
                        }
                        return $item;
                    });
                }
                return $sale;
            });
        }

        $analytics = $this->buildAnalytics($request, $branchId);

        return Inertia::render('Admin/Reports/Index', array_merge(
            [
                'sales'       => $sales,
                'shifts'      => $shifts,
                'cashiers'    => $user->isAdmin() ? User::where('role', 'cashier')->get() : [],
                'branches'    => Branch::orderBy('name')->get(),
                'filters'     => array_merge(
                    $request->only(['date_from', 'date_to', 'cashier_id', 'status']),
                    ['branch_id' => $branchId ? (string) $branchId : 'all']
                ),
                'today_sales' => $todaySales,
                'isAdmin'     => $user->isAdmin(),
            ],
            $analytics
        ));
    }

    public function prepareExport(Request $request)
    {
        $token = 'export_' . bin2hex(random_bytes(16));
        $payload = $request->all();

        // If the user requests to export all records, dynamically query them on the server
        if (isset($payload['scope']) && $payload['scope'] === 'all') {
            $payload['rows'] = $this->compileAllRows($payload, Auth::user());
        }
        
        // Cache the formatted report payload for 2 hours
        \Illuminate\Support\Facades\Cache::put('report_export_' . $token, $payload, now()->addHours(2));

        return response()->json(['token' => $token]);
    }

    private function compileAllRows(array $payload, $user)
    {
        $filters   = $payload['filters'] ?? [];
        $activeTab = $payload['activeTab'] ?? 'sales';
        $branchId  = isset($filters['branch_id']) && $filters['branch_id'] !== 'all'
            ? (int) $filters['branch_id']
            : null;

        if ($activeTab === 'sales') {
            $sales = Sale::with(['cashier', 'items.product', 'branch', 'delivery'])
                ->when(!$user->isAdmin(), fn($q) => $q->where('branch_id', $user->branch_id))
                ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId))
                ->when($filters['date_from'] ?? null, fn($q) => $q->whereDate('created_at', '>=', $filters['date_from']))
                ->when($filters['date_to'] ?? null,   fn($q) => $q->whereDate('created_at', '<=', $filters['date_to']))
                ->when(isset($filters['cashier_id']) && $filters['cashier_id'] !== 'all' && $user->isAdmin(), fn($q) => $q->where('user_id', $filters['cashier_id']))
                ->when(isset($filters['status']) && $filters['status'] !== 'all', fn($q) => $q->where('status', $filters['status']))
                ->latest()
                ->get();

            return $sales->map(function ($sale) {
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

                $deliveryFee = (float) ($sale->delivery_fee ?? $sale->delivery?->delivery_fee ?? 0.0);
                if ($sale->subtotal !== null) {
                    $productSubtotal = (float) $sale->subtotal;
                } elseif ($sale->items->isNotEmpty()) {
                    $productSubtotal = (float) $sale->items->sum('subtotal');
                } else {
                    $productSubtotal = max(0.0, (float) $sale->total - $deliveryFee);
                }

                $saleProfit = $productSubtotal - $saleCogs;

                $row = [
                    'order_number'     => $sale->order_number,
                    'date'             => $sale->created_at->format('M d, Y H:i'),
                    'cashier'          => $sale->cashier?->name ?? 'N/A',
                    'branch'           => $sale->branch?->name ?? 'N/A',
                    'status'           => ucfirst($sale->status),
                    'product_subtotal' => '₱' . number_format($productSubtotal, 2),
                    'delivery_fee'     => '₱' . number_format($deliveryFee, 2),
                    'total'            => '₱' . number_format((float) $sale->total, 2),
                    'profit'           => $user->isAdmin() ? ('₱' . number_format($saleProfit, 2)) : 'N/A',
                ];

                if ($user->isAdmin()) {
                    $row['profit'] = '₱' . number_format($saleProfit, 2);
                }

                return $row;
            })->toArray();
        } else {
            $shifts = CashierShift::with('cashier')
                ->when(!$user->isAdmin(), fn($q) => $q
                    ->where('cashier_id', $user->id)
                    ->where('branch_id',  $user->branch_id)
                )
                ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId))
                ->when($filters['date_from'] ?? null, fn($q) => $q->whereDate('opened_at', '>=', $filters['date_from']))
                ->when($filters['date_to'] ?? null,   fn($q) => $q->whereDate('opened_at', '<=', $filters['date_to']))
                ->when(isset($filters['cashier_id']) && $filters['cashier_id'] !== 'all' && $user->isAdmin(), fn($q) => $q->where('cashier_id', $filters['cashier_id']))
                ->latest()
                ->get();

            return $shifts->map(function ($shift) {
                return [
                    'cashier' => $shift->cashier?->name ?? 'N/A',
                    'opened_at' => $shift->opened_at->format('M d, Y H:i'),
                    'closed_at' => $shift->closed_at ? $shift->closed_at->format('M d, Y H:i') : 'Active',
                    'starting_cash' => '₱' . number_format((float) $shift->starting_cash, 2),
                    'cash_sales' => '₱' . number_format((float) ($shift->total_cash_sales ?? 0), 2),
                    'expected_balance' => '₱' . number_format((float) ($shift->expected_balance ?? 0), 2),
                    'actual_cash' => $shift->actual_cash !== null ? '₱' . number_format((float) $shift->actual_cash, 2) : 'N/A',
                    'difference' => $shift->difference !== null ? '₱' . number_format((float) $shift->difference, 2) : 'N/A',
                    'status' => ucfirst($shift->status),
                ];
            })->toArray();
        }
    }

    public function exportPdf(Request $request)
    {
        $token = $request->input('token');
        if (!$token || !\Illuminate\Support\Facades\Cache::has('report_export_' . $token)) {
            abort(400, 'Expired or invalid export request token.');
        }

        $payload = \Illuminate\Support\Facades\Cache::get('report_export_' . $token);
        
        $filename = str_replace([' ', '/'], '_', $payload['reportName'] ?? 'report') . '_' . date('Y-m-d') . '.pdf';

        $pdf = Pdf::loadView('reports.dynamic_pdf', compact('payload'));
        
        if (isset($payload['orientation']) && $payload['orientation'] === 'landscape') {
            $pdf->setPaper($payload['paperSize'] ?? 'A4', 'landscape');
        } else {
            $pdf->setPaper($payload['paperSize'] ?? 'A4', 'portrait');
        }

        return $pdf->download($filename);
    }

    public function exportExcel(Request $request)
    {
        $token = $request->input('token');
        if (!$token || !\Illuminate\Support\Facades\Cache::has('report_export_' . $token)) {
            abort(400, 'Expired or invalid export request token.');
        }

        $payload = \Illuminate\Support\Facades\Cache::get('report_export_' . $token);
        
        $filename = str_replace([' ', '/'], '_', $payload['reportName'] ?? 'report') . '_' . date('Y-m-d') . '.xlsx';

        return Excel::download(
            new \App\Exports\DynamicExport($payload),
            $filename
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build all analytics payload for the admin dashboard.
     * Extracted so that index() stays under the IDE type-complexity limit.
     *
     * @return array<string, mixed>
     */
    private function buildAnalytics(Request $request, ?int $branchId = null): array
    {
        $dateFrom  = $request->date_from;
        $dateTo    = $request->date_to;
        $fallback  = now()->subDays(14)->startOfDay();

        $metricsService = new \App\Services\FinancialMetricsService();
        $startDate = $dateFrom ?: $fallback;
        $endDate   = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

        $metrics = $metricsService->getSummaryMetrics($startDate, $endDate, $branchId);

        // 1. Daily revenue / profit trend
        $trendData = $this->buildDailyTrend($branchId, $dateFrom, $dateTo, $fallback);

        // 2. Top products and category breakdown
        [$categoryData, $topProduct] = $this->buildCategoryAndTopProductData($branchId, $dateFrom, $dateTo, $fallback);

        // 3. Peak day & cancellations
        $peakDay = $trendData->sortByDesc('Revenue')->first();
        $cancelledCount = $this->cancelledCount($dateFrom, $dateTo, $fallback, $branchId);
        $popMetrics = $metricsService->getPeriodOverPeriodMetrics($dateFrom, $dateTo, $branchId, Auth::user());
        $dodMetrics = $metricsService->getDayOverDayMetrics($branchId, Auth::user());

        $isAdmin = Auth::user()?->isAdmin() ?? false;

        return [
            'trend_data'          => $trendData->values(),
            'category_data'       => $categoryData->values(),
            'top_product'         => $topProduct,
            'peak_day'            => $peakDay ? ['date' => $peakDay['date'], 'revenue' => $peakDay['Revenue']] : null,
            'total_revenue'       => $metrics['revenue'],
            'cogs'                => $isAdmin ? $metrics['cogs'] : 0,
            'operating_expenses'  => $isAdmin ? $metrics['operating_expenses'] : 0,
            'total_expenses'      => $isAdmin ? $metrics['total_expenses'] : 0,
            'total_profit'        => $metrics['net_profit'],
            'gross_profit'        => $isAdmin ? $metrics['gross_profit'] : 0,
            'profit_margin'       => $isAdmin ? $metrics['net_margin'] : 0,
            'total_orders'        => $metrics['total_orders'],
            'cancelled_count'     => $cancelledCount,
            'revenue_delta'       => $popMetrics['revenue'],
            'orders_delta'        => $popMetrics['orders'],
            'expenses_delta'      => $popMetrics['expenses'],
            'profit_delta'        => $popMetrics['profit'],
            'today_revenue_delta' => $dodMetrics['revenue'],
            'today_orders_delta'  => $dodMetrics['orders'],
            'dod_metrics'         => $dodMetrics,
            'pop_metrics'         => $popMetrics,
        ];
    }

    /**
     * Build daily revenue and profit trend collection.
     */
    private function buildDailyTrend(?int $branchId, ?string $dateFrom, ?string $dateTo, \DateTimeInterface $fallback)
    {
        $sales = Sale::with(['items.product.ingredients.stocks'])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at', '>=', $fallback))
            ->get();

        $dailyTrendMap = [];
        foreach ($sales as $sale) {
            $dateKey = $sale->created_at->toDateString();
            if (!isset($dailyTrendMap[$dateKey])) {
                $dailyTrendMap[$dateKey] = ['revenue' => 0.0, 'cogs' => 0.0, 'orders' => 0];
            }
            $dailyTrendMap[$dateKey]['revenue'] += (float) $sale->total;
            $dailyTrendMap[$dateKey]['orders']++;

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
            $dailyTrendMap[$dateKey]['cogs'] += $saleCogs;
        }

        ksort($dailyTrendMap);
        $trendData = collect();
        foreach ($dailyTrendMap as $dateStr => $data) {
            $rev = $data['revenue'];
            $prof = max(0.0, $rev - $data['cogs']);
            $trendData->push([
                'date'    => Carbon::parse($dateStr)->format('M d'),
                'Revenue' => round($rev, 2),
                'Profit'  => round($prof, 2),
                'Orders'  => (int) $data['orders'],
            ]);
        }

        return $trendData;
    }

    /**
     * Build top product metrics and category pie chart dataset.
     */
    private function buildCategoryAndTopProductData(?int $branchId, ?string $dateFrom, ?string $dateTo, \DateTimeInterface $fallback): array
    {
        $topProducts = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales',    'sale_items.sale_id',    '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->when($branchId,  fn($q) => $q->where('sales.branch_id', $branchId))
            ->when($dateFrom,  fn($q) => $q->whereDate('sales.created_at', '>=', $dateFrom))
            ->when($dateTo,    fn($q) => $q->whereDate('sales.created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('sales.created_at', '>=', $fallback))
            ->selectRaw('products.name,
                         SUM(sale_items.quantity) as total_sold,
                         SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('revenue')
            ->limit(6)
            ->get();

        $pieColors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'];
        $totalProductRevenue = $topProducts->sum('revenue') ?: 1;

        $categoryData = $topProducts->values()->map(fn($p, int $i) => [
            'name'  => $p->name,
            'value' => round(($p->revenue / $totalProductRevenue) * 100, 1),
            'color' => $pieColors[$i % 6],
        ]);

        $bestSeller = $topProducts->sortByDesc('total_sold')->first();
        $topProduct = $bestSeller ? ['name' => $bestSeller->name, 'units' => (int) $bestSeller->total_sold] : null;

        return [$categoryData, $topProduct];
    }

    /**
     * Count cancelled sales in the active period.
     */
    private function cancelledCount(?string $dateFrom, ?string $dateTo, \DateTimeInterface $fallback, ?int $branchId = null): int
    {
        return Sale::where('status', 'cancelled')
            ->when($branchId,  fn($q) => $q->where('branch_id', $branchId))
            ->when($dateFrom,  fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,    fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at',     '>=', $fallback))
            ->count();
    }
}
