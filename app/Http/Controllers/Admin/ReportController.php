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

        $todayQuery = Sale::where('status', 'completed')
            ->whereDate('created_at', today())
            ->when(!$user->isAdmin(), fn($q) => $q->where('branch_id', $user->branch_id))
            ->when($branchId && $user->isAdmin(), fn($q) => $q->where('branch_id', $branchId));

        $todaySales = (float) (clone $todayQuery)->sum('total');

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

        return Inertia::render('Admin/Reports/Index', array_merge(
            [
                'sales'       => $sales,
                'shifts'      => $shifts,
                'cashiers'    => User::where('role', 'cashier')->get(),
                'branches'    => Branch::orderBy('name')->get(),
                'filters'     => array_merge(
                    $request->only(['date_from', 'date_to', 'cashier_id', 'status']),
                    ['branch_id' => $branchId ? (string) $branchId : 'all']
                ),
                'today_sales' => $todaySales,
            ],
            $this->buildAnalytics($request, $branchId)
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
        
        // Cache the formatted report payload for 5 minutes
        \Illuminate\Support\Facades\Cache::put('report_export_' . $token, $payload, 300);

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
            $sales = Sale::with(['cashier', 'items.product', 'branch'])
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
                $saleProfit = (float) $sale->total - $saleCogs;

                return [
                    'order_number' => $sale->order_number,
                    'date' => $sale->created_at->format('M d, Y H:i'),
                    'cashier' => $sale->cashier?->name ?? 'N/A',
                    'branch' => $sale->branch?->name ?? 'N/A',
                    'status' => ucfirst($sale->status),
                    'total' => '₱' . number_format($sale->total, 2),
                    'profit' => '₱' . number_format($saleProfit, 2),
                ];
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
                    'opened_at' => $shift->opened_at ? Carbon::parse($shift->opened_at)->format('M d, Y H:i') : 'N/A',
                    'closed_at' => $shift->closed_at ? Carbon::parse($shift->closed_at)->format('M d, Y H:i') : 'Active',
                    'opening' => '₱' . number_format($shift->opening_cash, 2),
                    'ending' => '₱' . number_format($shift->expected_cash, 2),
                    'actual' => '₱' . number_format($shift->actual_cash, 2),
                    'diff' => '₱' . number_format($shift->actual_cash - $shift->expected_cash, 2),
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
        $fallback  = now()->subDays(14)->startOfDay(); // default window when no filter set

        $metricsService = new \App\Services\FinancialMetricsService();
        $startDate = $dateFrom ?: $fallback;
        $endDate   = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

        $metrics = $metricsService->getSummaryMetrics($startDate, $endDate, $branchId);

        // ── 1. Daily revenue / profit trend ───────────────────────────────────
        $salesQuery = Sale::with(['items.product.ingredients.stocks'])
            ->where('status', 'completed')
            ->when($branchId, fn($q) => $q->where('branch_id', $branchId))
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at', '>=', $fallback));

        $sales = $salesQuery->get();
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

        // ── 2. Top products by revenue (for pie chart) ────────────────────────
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

        $pieColors           = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#ef4444'];
        $totalProductRevenue = $topProducts->sum('revenue') ?: 1;

        $categoryData = $topProducts->values()->map(fn($p, int $i) => [
            'name'  => $p->name,
            'value' => round(($p->revenue / $totalProductRevenue) * 100, 1),
            'color' => $pieColors[$i % 6],
        ]);

        // ── 3. Top performer & peak day ───────────────────────────────────────
        $topProduct = $topProducts->sortByDesc('total_sold')->first();
        $peakDay    = $trendData->sortByDesc('Revenue')->first();
        $cancelledCount = $this->cancelledCount($dateFrom, $dateTo, $fallback, $branchId);

        return [
            'trend_data'         => $trendData->values(),
            'category_data'      => $categoryData->values(),
            'top_product'        => $topProduct
                ? ['name' => $topProduct->name, 'units' => (int) $topProduct->total_sold]
                : null,
            'peak_day'           => $peakDay
                ? ['date' => $peakDay['date'], 'revenue' => $peakDay['Revenue']]
                : null,
            'total_revenue'      => $metrics['revenue'],
            'cogs'               => $metrics['cogs'],
            'operating_expenses' => $metrics['operating_expenses'],
            'total_expenses'     => $metrics['total_expenses'],
            'total_profit'       => $metrics['net_profit'],
            'gross_profit'       => $metrics['gross_profit'],
            'profit_margin'      => $metrics['net_margin'],
            'total_orders'       => $metrics['total_orders'],
            'cancelled_count'    => $cancelledCount,
        ];
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
