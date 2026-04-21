<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Sale;
use App\Models\Product;
use App\Services\ForecastService;
use App\Services\RestockService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $range     = (int) $request->input('range', 7);
        $startDate = Carbon::now()->subDays($range);
        $today     = Carbon::today();

        $branches = Branch::orderBy('name')->get();

        return Inertia::render('Admin/Dashboard', [
            'stats'                => $this->getGlobalStats($startDate),
            'branchStats'          => $this->getBranchStats($branches, $startDate, $today),
            'salesOverTime'        => $this->getSalesOverTime($range, $startDate),
            'salesPerProduct'      => $this->getTopProducts($startDate),
            'salesByPaymentMethod' => $this->getSalesByPayment($startDate),
            'range'                => $range,
        ]);
    }

    private function getGlobalStats($startDate)
    {
        return [
            'total_revenue'   => (float) Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('total'),
            'total_profit'    => (float) Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('profit'),
            'total_orders'    => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->count(),
            'low_stock_items' => IngredientStock::whereHas('ingredient')->whereColumn('stock', '<=', 'low_stock_level')->count(),
        ];
    }

    private function getBranchStats($branches, $startDate, $today)
    {
        return $branches->map(function (Branch $branch) use ($startDate, $today) {
            $salesQuery = Sale::where('branch_id', $branch->id)->where('status', 'completed');

            $lowStockIngredients = IngredientStock::with('ingredient')
                ->whereHas('ingredient')
                ->where('branch_id', $branch->id)
                ->whereColumn('stock', '<=', 'low_stock_level')
                ->get()
                ->map(fn($row) => [
                    'name'            => $row->ingredient->name ?? 'Unknown',
                    'stock'           => $row->stock,
                    'unit'            => $row->ingredient->unit ?? 'pcs',
                    'low_stock_level' => $row->low_stock_level,
                ]);

            return [
                'id'                   => $branch->id,
                'name'                 => $branch->name,
                'total_revenue'        => (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('total'),
                'total_profit'         => (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('profit'),
                'total_orders'         => (clone $salesQuery)->where('created_at', '>=', $startDate)->count(),
                'orders_today'         => (clone $salesQuery)->whereDate('created_at', $today)->count(),
                'revenue_today'        => (float) (clone $salesQuery)->whereDate('created_at', $today)->sum('total'),
                'inventory_count'      => IngredientStock::where('branch_id', $branch->id)->count(),
                'low_stock_count'      => $lowStockIngredients->count(),
                'low_stock_ingredients'=> $lowStockIngredients,
            ];
        });
    }

    private function getSalesOverTime($range, $startDate)
    {
        $salesData = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(profit) as profit'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $salesOverTime = collect();
        for ($i = $range; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $data = $salesData->get($date);
            
            $salesOverTime->push([
                'date'    => Carbon::parse($date)->format('M d'),
                'revenue' => (float) ($data->revenue ?? 0),
                'profit'  => (float) ($data->profit ?? 0),
            ]);
        }
        return $salesOverTime;
    }

    private function getTopProducts($startDate)
    {
        return DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $startDate)
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $item->total_sold = (float) $item->total_sold;
                $item->revenue = (float) $item->revenue;
                return $item;
            });
    }

    private function getSalesByPayment($startDate)
    {
        return Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                $item->count = (int) $item->count;
                $item->revenue = (float) $item->revenue;
                return $item;
            });
    }
    public function cashierPerformance(Request $request)
    {
        $range = $request->input('range', '7'); // Default 7 days
        $branchId = $request->input('branch_id');

        $query = DB::table('sales')
            ->join('users', 'sales.user_id', '=', 'users.id')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->where('users.role', 'cashier')
            ->where('sales.status', 'completed');

        // Date range filtering
        if ($range !== 'all') {
            $startDate = match ($range) {
                'today' => Carbon::today(),
                'yesterday' => Carbon::yesterday(),
                '30' => Carbon::now()->subDays(30),
                default => Carbon::now()->subDays((int)$range),
            };
            $query->where('sales.created_at', '>=', $startDate);
        }

        // Branch filtering
        if ($branchId && $branchId !== 'all') {
            $query->where('sales.branch_id', $branchId);
        }

        $performance = $query->select(
            'users.id',
            'users.name',
            'branches.name as branch_name',
            DB::raw('SUM(sales.total) as total_sales'),
            DB::raw('COUNT(sales.id) as total_transactions'),
            DB::raw('AVG(sales.total) as avg_order_value')
        )
        ->groupBy('users.id', 'users.name', 'branches.name')
        ->orderByDesc('total_sales')
        ->get();

        return Inertia::render('Analytics/CashierPerformance', [
            'performance' => $performance,
            'branches'    => Branch::all(),
            'filters'     => $request->only(['range', 'branch_id']),
        ]);
    }
    public function exportPerformance(Request $request)
    {
        $range = $request->input('range', '7');
        $branchId = $request->input('branch_id');

        $query = DB::table('sales')
            ->join('users', 'sales.user_id', '=', 'users.id')
            ->join('branches', 'sales.branch_id', '=', 'branches.id')
            ->where('users.role', 'cashier')
            ->where('sales.status', 'completed');

        if ($range !== 'all') {
            $startDate = match ($range) {
                'today' => Carbon::today(),
                'yesterday' => Carbon::yesterday(),
                '30' => Carbon::now()->subDays(30),
                default => Carbon::now()->subDays((int)$range),
            };
            $query->where('sales.created_at', '>=', $startDate);
        }

        if ($branchId && $branchId !== 'all') {
            $query->where('sales.branch_id', $branchId);
        }

        $data = $query->select(
            'users.name as cashier',
            'branches.name as branch',
            DB::raw('COUNT(sales.id) as transactions'),
            DB::raw('SUM(sales.total) as total_sales'),
            DB::raw('AVG(sales.total) as avg_order')
        )
        ->groupBy('users.id', 'users.name', 'branches.name')
        ->orderByDesc('total_sales')
        ->get();

        $filename = "cashier-performance-" . now()->format('Y-m-d') . ".csv";
        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = ['Cashier', 'Branch', 'Transactions', 'Total Sales', 'Avg Order Value'];

        $callback = function() use($data, $columns) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);

            foreach ($data as $row) {
                fputcsv($file, [
                    $row->cashier,
                    $row->branch,
                    $row->transactions,
                    number_format((float)$row->total_sales, 2, '.', ''),
                    number_format((float)$row->avg_order, 2, '.', '')
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function salesForecast(Request $request)
    {
        $days     = (int) $request->input('days', 30);
        $branchId = $request->input('branch_id') && $request->input('branch_id') !== 'all'
            ? (int) $request->input('branch_id')
            : null;

        $result = (new ForecastService())->generate($days, $branchId);

        if (isset($result['error'])) {
            return Inertia::render('Analytics/SalesForecast', [
                'error'    => $result['error'],
                'branches' => Branch::all(),
                'filters'  => $request->only(['days', 'branch_id']),
            ]);
        }

        return Inertia::render('Analytics/SalesForecast', array_merge($result, [
            'branches' => Branch::all(),
            'filters'  => $request->only(['days', 'branch_id']),
        ]));
    }

    public function restockSuggestions(Request $request)
    {
        $branchId = $request->input('branch_id');

        if (!$branchId || $branchId === 'all') {
            $branchId = Branch::first()?->id;
        }

        if (!$branchId) {
            return Inertia::render('Analytics/RestockSuggestions', [
                'error'    => 'No branches found in the system.',
                'branches' => Branch::all(),
            ]);
        }

        $branchId = (int) $branchId;

        // 1. Run hybrid forecast to get tomorrow's prediction + bounds + insights
        $forecastResult = (new ForecastService())->generate(30, $branchId);

        if (isset($forecastResult['error'])) {
            return Inertia::render('Analytics/RestockSuggestions', [
                'error'    => "Forecast error: {$forecastResult['error']}",
                'branches' => Branch::all(),
                'filters'  => ['branch_id' => $branchId],
            ]);
        }

        $tomorrowForecast = (float) ($forecastResult['prediction']        ?? 0);
        $forecastLower    = (float) ($forecastResult['prediction_lower']  ?? $tomorrowForecast * 0.9);
        $forecastUpper    = (float) ($forecastResult['prediction_upper']  ?? $tomorrowForecast * 1.1);
        $forecastInsights = $forecastResult['insights'] ?? [];

        // 2. Run prescriptive restock engine
        $restockResult = (new RestockService())->generate(
            $branchId,
            $tomorrowForecast,
            $forecastLower,
            $forecastUpper,
            $forecastInsights
        );

        if (isset($restockResult['error'])) {
            return Inertia::render('Analytics/RestockSuggestions', [
                'error'    => $restockResult['error'],
                'branches' => Branch::all(),
                'filters'  => ['branch_id' => $branchId],
            ]);
        }

        return Inertia::render('Analytics/RestockSuggestions', array_merge($restockResult, [
            'branches'         => Branch::all(),
            'filters'          => ['branch_id' => $branchId],
            'forecast_trend'   => $forecastResult['trend'] ?? null,
            'forecast_confidence' => $forecastResult['confidence'] ?? null,
        ]));
    }

}

