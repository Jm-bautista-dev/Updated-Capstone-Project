<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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

class ReportController extends Controller
{
    // ── Public actions ────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $user = Auth::user();

        $sales = Sale::with(['cashier', 'items.product'])
            ->when(!$user->isAdmin(), fn($q) => $q
                ->where('user_id',   $user->id)
                ->where('branch_id', $user->branch_id)
            )
            ->when($request->date_from, fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,   fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->cashier_id && $user->isAdmin(), fn($q) => $q->where('user_id', $request->cashier_id))
            ->when($request->status,    fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Reports/Index', array_merge(
            [
                'sales'    => $sales,
                'cashiers' => User::where('role', 'cashier')->get(),
                'filters'  => $request->only(['date_from', 'date_to', 'cashier_id', 'status']),
            ],
            $this->buildAnalytics($request)
        ));
    }

    public function exportPdf(Request $request)
    {
        $user = Auth::user();

        $sales = Sale::with(['cashier', 'items.product'])
            ->when(!$user->isAdmin(), fn($q) => $q
                ->where('user_id',   $user->id)
                ->where('branch_id', $user->branch_id)
            )
            ->when($request->date_from,  fn($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,    fn($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->when($request->cashier_id && $user->isAdmin(), fn($q) => $q->where('user_id', $request->cashier_id))
            ->latest()
            ->get();

        $pdf = Pdf::loadView('reports.sales_pdf', compact('sales'));
        return $pdf->download('sales_report_' . now()->format('Y-m-d') . '.pdf');
    }

    public function exportExcel(Request $request)
    {
        return Excel::download(
            new SalesExport($request->all()),
            'sales_report_' . now()->format('Y-m-d') . '.xlsx'
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Build all analytics payload for the admin dashboard.
     * Extracted so that index() stays under the IDE type-complexity limit.
     *
     * @return array<string, mixed>
     */
    private function buildAnalytics(Request $request): array
    {
        $dateFrom  = $request->date_from;
        $dateTo    = $request->date_to;
        $fallback  = now()->subDays(14); // default window when no filter set

        // ── 1. Daily revenue / profit trend ───────────────────────────────────
        /** @var Collection $trendData */
        $trendData = Sale::where('status', 'completed')
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at', '>=', $fallback))
            ->selectRaw('DATE(created_at) as sale_date,
                         SUM(total)   as revenue,
                         SUM(profit)  as profit,
                         COUNT(*)     as orders')
            ->groupBy('sale_date')
            ->orderBy('sale_date')
            ->get()
            ->map(fn($r) => [
                'date'    => Carbon::parse($r->sale_date)->format('M d'),
                'Revenue' => (float) $r->revenue,
                'Profit'  => (float) $r->profit,
                'Orders'  => (int)   $r->orders,
            ]);

        // ── 2. Top products by revenue (for pie chart) ────────────────────────
        /** @var Collection $topProducts */
        $topProducts = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales',    'sale_items.sale_id',    '=', 'sales.id')
            ->where('sales.status', 'completed')
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

        // ── 4. KPI aggregates ─────────────────────────────────────────────────
        [$totalRevenue, $totalProfit, $totalOrders] = $this->kpiAggregates($dateFrom, $dateTo, $fallback);
        $cancelledCount = $this->cancelledCount($dateFrom, $dateTo, $fallback);

        return [
            'trend_data'      => $trendData->values(),
            'category_data'   => $categoryData->values(),
            'top_product'     => $topProduct
                ? ['name' => $topProduct->name, 'units' => (int) $topProduct->total_sold]
                : null,
            'peak_day'        => $peakDay
                ? ['date' => $peakDay['date'], 'revenue' => $peakDay['Revenue']]
                : null,
            'total_revenue'   => $totalRevenue,
            'total_profit'    => $totalProfit,
            'total_orders'    => $totalOrders,
            'cancelled_count' => $cancelledCount,
        ];
    }

    /**
     * Returns [total_revenue, total_profit, total_orders] for completed sales.
     *
     * @return array{float, float, int}
     */
    private function kpiAggregates(?string $dateFrom, ?string $dateTo, \DateTimeInterface $fallback): array
    {
        $base = Sale::where('status', 'completed')
            ->when($dateFrom, fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,   fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at', '>=', $fallback));

        return [
            (float) (clone $base)->sum('total'),
            (float) (clone $base)->sum('profit'),
            (int)   (clone $base)->count(),
        ];
    }

    /**
     * Count cancelled sales in the active period.
     */
    private function cancelledCount(?string $dateFrom, ?string $dateTo, \DateTimeInterface $fallback): int
    {
        return Sale::where('status', 'cancelled')
            ->when($dateFrom,  fn($q) => $q->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo,    fn($q) => $q->whereDate('created_at', '<=', $dateTo))
            ->when(!$dateFrom, fn($q) => $q->where('created_at',     '>=', $fallback))
            ->count();
    }
}
