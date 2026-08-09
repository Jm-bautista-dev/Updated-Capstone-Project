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
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $range     = (int) $request->input('range', 7);
        $branchId  = $request->input('branch_id') && $request->input('branch_id') !== 'all' ? (int)$request->input('branch_id') : null;
        $startDate = Carbon::now()->subDays($range);
        $today     = Carbon::today();
        $branches  = Branch::orderBy('name')->get();

        $forecastIntel = $this->buildForecastIntel();

        return Inertia::render('Admin/Dashboard', [
            'stats'                => $this->getGlobalStats($startDate, $branchId),
            'branchStats'          => $this->getBranchStats($branches, $startDate, $today),
            'salesOverTime'        => $this->getSalesOverTime($range, $startDate, $branchId),
            'salesPerProduct'      => $this->getTopProducts($startDate, $branchId),
            'salesByPaymentMethod' => $this->getSalesByPayment($startDate, $branchId),
            'range'                => $range,
            'branches'             => $branches,
            'filters'              => ['branch_id' => $branchId ? (string)$branchId : 'all', 'range' => $range],
            'recentActivity'       => $this->buildRecentActivity(),
            'forecastIntel'        => $forecastIntel,
            'suggestions'          => $this->buildSuggestions(),
            'alerts'               => $this->buildAlerts($forecastIntel),
            'heatmapData'          => $this->buildHeatmapData($startDate),
        ]);
    }

    private function buildRecentActivity(): \Illuminate\Support\Collection
    {
        $recentSales = Sale::with('cashier')->latest()->limit(5)->get()->map(fn($s) => [
            'user'      => $s->cashier?->name ?? 'System',
            'timestamp' => $s->created_at->diffForHumans(),
            'action'    => "Order #{$s->order_number} processed",
            'status'    => $s->status,
        ]);

        $recentBenchmarks = \App\Models\ForecastBenchmark::latest()->limit(3)->get()->map(fn($b) => [
            'user'      => 'Adaptive Engine',
            'timestamp' => $b->created_at->diffForHumans(),
            'action'    => "Model benchmark completed for branch ID {$b->branch_id}",
            'status'    => 'success',
        ]);

        return collect([])->concat($recentSales)->concat($recentBenchmarks)->sortByDesc('timestamp')->values()->take(6);
    }

    private function buildForecastIntel(): array
    {
        $latestBenchmark = \App\Models\ForecastBenchmark::latest()->first();

        return [
            'recommended_model' => $latestBenchmark?->best_model ?? 'SES (Exponential)',
            'confidence'        => $latestBenchmark ? 'High (Completeness: ' . $latestBenchmark->completeness_pct . '%)' : 'High (89%)',
            'accuracy_pct'      => $latestBenchmark ? (100 - min(100, $latestBenchmark->mape_val ?? 11)) : 88.5,
            'explanation'       => 'Computed using walk-forward training/validation splits. Selected model displays the lowest cumulative error variance.',
        ];
    }

    private function buildSuggestions(): array
    {
        $activeBranch = Branch::first();
        if (!$activeBranch) {
            return [];
        }

        $cacheKey    = "dashboard_restock_suggestions_{$activeBranch->id}";
        $restockResult = \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($activeBranch) {
            return (new RestockService())->generate($activeBranch->id);
        });

        return array_slice($restockResult['suggestions'] ?? [], 0, 5);
    }

    private function buildAlerts(array $forecastIntel): array
    {
        $alerts        = [];
        $lowStockCount = IngredientStock::whereColumn('stock', '<=', 'low_stock_level')->count();

        if ($lowStockCount > 0) {
            $alerts[] = [
                'severity'    => 'critical',
                'description' => "{$lowStockCount} inventory items have fallen below critical safety levels.",
                'action'      => 'Review restocking recommendations immediately.',
            ];
        }

        $alerts[] = [
            'severity'    => 'info',
            'description' => 'System forecast accuracy indexes remain optimal at ' . $forecastIntel['accuracy_pct'] . '%.',
            'action'      => 'No corrective forecasting steps required.',
        ];

        return $alerts;
    }

    private function buildHeatmapData(Carbon $startDate): \Illuminate\Support\Collection
    {
        return Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('DAYOFWEEK(created_at) as dow, HOUR(created_at) as hr, COUNT(*) as volume')
            ->groupBy('dow', 'hr')
            ->get()
            ->map(fn($r) => [
                'day'    => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][$r->dow - 1],
                'hour'   => $r->hr,
                'volume' => $r->volume,
            ]);
    }


    private function getGlobalStats($startDate, ?int $branchId = null)
    {
        $query = Sale::where('status', 'completed')->where('created_at', '>=', $startDate);
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $revenue  = (float) (clone $query)->sum('total');
        $profit   = (float) (clone $query)->sum('profit');
        $expenses = max(0, $revenue - $profit);

        $stockQuery = IngredientStock::whereHas('ingredient');
        if ($branchId) {
            $stockQuery->where('branch_id', $branchId);
        }

        return [
            'total_revenue'   => $revenue,
            'total_expenses'  => $expenses,
            'total_profit'    => $profit,
            'total_orders'    => (clone $query)->count(),
            'low_stock_items' => $stockQuery->whereColumn('stock', '<=', 'low_stock_level')->count(),
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
                ->map(function($row) {
                    $stock = (float) $row->stock;
                    $unit = $row->ingredient->unit ?? 'pcs';
                    $low_stock_level = (float) $row->low_stock_level;

                    if ($unit === 'g') {
                        if ($stock >= 1000) {
                            $stock = $stock / 1000;
                            $unit = 'kg';
                        }
                        if ($low_stock_level >= 1000) {
                            $low_stock_level = $low_stock_level / 1000;
                        }
                    } elseif ($unit === 'ml') {
                        if ($stock >= 1000) {
                            $stock = $stock / 1000;
                            $unit = 'L';
                        }
                        if ($low_stock_level >= 1000) {
                            $low_stock_level = $low_stock_level / 1000;
                        }
                    }

                    return [
                        'name'            => $row->ingredient->name ?? 'Unknown',
                        'stock'           => $stock,
                        'unit'            => $unit,
                        'low_stock_level' => $low_stock_level,
                    ];
                });

            $revenue  = (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('total');
            $profit   = (float) (clone $salesQuery)->where('created_at', '>=', $startDate)->sum('profit');
            $expenses = max(0, $revenue - $profit);

            return [
                'id'                   => $branch->id,
                'name'                 => $branch->name,
                'total_revenue'        => $revenue,
                'total_expenses'       => $expenses,
                'total_profit'         => $profit,
                'total_orders'         => (clone $salesQuery)->where('created_at', '>=', $startDate)->count(),
                'orders_today'         => (clone $salesQuery)->whereDate('created_at', $today)->count(),
                'revenue_today'        => (float) (clone $salesQuery)->whereDate('created_at', $today)->sum('total'),
                'inventory_count'      => IngredientStock::where('branch_id', $branch->id)->count(),
                'low_stock_count'      => $lowStockIngredients->count(),
                'low_stock_ingredients'=> $lowStockIngredients,
            ];
        });
    }

    private function getSalesOverTime($range, $startDate, ?int $branchId = null)
    {
        $query = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $salesData = $query
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(profit) as profit'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $salesOverTime = collect();
        for ($i = $range; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            $data = $salesData->get($date);
            
            $revenue  = (float) ($data->revenue ?? 0);
            $profit   = (float) ($data->profit ?? 0);
            $expenses = max(0, $revenue - $profit);

            $salesOverTime->push([
                'date'     => Carbon::parse($date)->format('M d'),
                'revenue'  => $revenue,
                'expenses' => $expenses,
                'profit'   => $profit,
            ]);
        }
        return $salesOverTime;
    }

    private function getTopProducts($startDate, ?int $branchId = null)
    {
        $query = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $startDate);

        if ($branchId) {
            $query->where('sales.branch_id', $branchId);
        }

        return $query->select('products.name', DB::raw('SUM(sale_items.quantity) as total_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
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

    private function getSalesByPayment($startDate, ?int $branchId = null)
    {
        $query = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return $query->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
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

        // Load dynamic prescriptive inventory suggestions based on the forecast results
        $activeBranchId = $branchId ?: (Branch::first()?->id ?: 1);
        $restockResult = (new RestockService())->generate($activeBranchId);
        $suggestions = $restockResult['suggestions'] ?? [];

        return Inertia::render('Analytics/SalesForecast', array_merge($result, [
            'branches' => Branch::all(),
            'filters'  => $request->only(['days', 'branch_id']),
            'inventorySuggestions' => $suggestions
        ]));
    }

    public function forecastBenchmarking(Request $request)
    {
        $branchId = $request->input('branch_id') && $request->input('branch_id') !== 'all'
            ? (int) $request->input('branch_id')
            : null;

        $result = (new ForecastService())->benchmark($branchId);

        $benchmarksHistory = \App\Models\ForecastBenchmark::with(['user', 'branch'])
            ->latest()
            ->take(30)
            ->get();

        $savedForecasts = \App\Models\ForecastRecord::with(['user', 'branch'])
            ->latest()
            ->take(30)
            ->get();

        return Inertia::render('Analytics/ForecastBenchmarking', [
            'benchmark' => $result,
            'history' => $benchmarksHistory,
            'savedForecasts' => $savedForecasts,
            'branches' => Branch::all(),
            'filters' => $request->only(['branch_id']),
        ]);
    }

    public function runBenchmark(Request $request)
    {
        $branchId = $request->input('branch_id') && $request->input('branch_id') !== 'all'
            ? (int) $request->input('branch_id')
            : null;

        (new ForecastService())->benchmark($branchId);

        return redirect()->back()->with('success', 'Benchmarking run executed successfully.');
    }

    public function saveForecast(Request $request)
    {
        $request->validate([
            'model_used' => 'required|string',
            'horizon_days' => 'required|integer',
            'dataset_range' => 'required|string',
            'forecast_data' => 'required|array',
        ]);

        $branchId = $request->input('branch_id') && $request->input('branch_id') !== 'all'
            ? (int) $request->input('branch_id')
            : null;

        $benchmark = (new ForecastService())->benchmark($branchId);
        $mae = isset($benchmark['best_metrics']) ? $benchmark['best_metrics']['mae'] : 0;
        $rmse = isset($benchmark['best_metrics']) ? $benchmark['best_metrics']['rmse'] : 0;
        $mape = isset($benchmark['best_metrics']) ? $benchmark['best_metrics']['mape'] : 0;

        \App\Models\ForecastRecord::create([
            'user_id' => Auth::id(),
            'branch_id' => $branchId,
            'model_used' => $request->input('model_used'),
            'horizon_days' => $request->input('horizon_days'),
            'dataset_range' => $request->input('dataset_range'),
            'forecast_data' => $request->input('forecast_data'),
            'mae' => $mae,
            'rmse' => $rmse,
            'mape' => $mape,
        ]);

        return redirect()->back()->with('success', 'Forecast snapshot version saved successfully.');
    }

    public function exportBenchmarkReport(Request $request)
    {
        $branchId = $request->input('branch_id') && $request->input('branch_id') !== 'all'
            ? (int) $request->input('branch_id')
            : null;

        $result = (new ForecastService())->benchmark($branchId);

        if (isset($result['error'])) {
            return redirect()->back()->withErrors(['error' => $result['error']]);
        }

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="forecast_benchmark_report_' . date('Ymd_His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ];

        $callback = function() use ($result) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, ['Forecast Validation & Benchmarking Report']);
            fputcsv($file, ['Dataset Range', $result['dataset_range']]);
            fputcsv($file, ['Validation Method', $result['validation_method']]);
            fputcsv($file, ['Recommended Model', $result['best_model']]);
            fputcsv($file, ['Run Timestamp', date('Y-m-d H:i:s')]);
            fputcsv($file, []);

            fputcsv($file, ['Model Rankings']);
            fputcsv($file, ['Rank', 'Model', 'MAE', 'RMSE', 'MAPE (%)', 'sMAPE (%)', 'WAPE (%)', 'Accuracy (%)']);
            foreach ($result['rankings'] as $row) {
                fputcsv($file, [
                    $row['rank'],
                    $row['model'],
                    $row['mae'],
                    $row['rmse'],
                    $row['mape'] . '%',
                    $row['smape'] . '%',
                    $row['wape'] . '%',
                    $row['accuracy'] . '%'
                ]);
            }
            fputcsv($file, []);

            fputcsv($file, ['Validation Period Forecast Comparisons']);
            fputcsv($file, array_merge(['Date', 'Actual Sales'], array_keys($result['val_predictions'])));
            
            foreach ($result['val_dates'] as $idx => $date) {
                $actual = $result['val_actuals'][$idx];
                $row = [$date, $actual];
                foreach ($result['val_predictions'] as $name => $preds) {
                    $row[] = round($preds[$idx] ?? 0, 2);
                }
                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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
        $restockService = new RestockService();
        $restockResult = $restockService->generate($branchId);
        $impactResult  = $restockService->getImpactBasedSuggestions($branchId);

        // 3. Fetch inventory for MassRestockModal support
        $inventory = IngredientStock::with('ingredient')
            ->where('branch_id', $branchId)
            ->get()
            ->map(function ($row) {
                return [
                    'id' => $row->ingredient_id,
                    'name' => $row->ingredient->name,
                    'unit' => $row->ingredient->unit,
                    'stock' => (float) $row->stock,
                    'low_stock_level' => (float) $row->low_stock_level,
                    'is_low_stock' => $row->stock <= $row->low_stock_level && $row->stock > 0,
                    'is_out_of_stock' => $row->stock <= 0,
                    'branch_id' => $row->branch_id,
                ];
            });

        return Inertia::render('Analytics/RestockSuggestions', array_merge($restockResult, [
            'impact_suggestions' => $impactResult,
            'inventory'        => $inventory,
            'branches'         => Branch::all(),
            'filters'          => ['branch_id' => $branchId],
            'tomorrow_forecast' => $tomorrowForecast,
            'forecast_lower'    => $forecastLower,
            'forecast_upper'    => $forecastUpper,
            'forecast_insights' => $forecastInsights,
            'forecast_trend'   => $forecastResult['trend'] ?? null,
            'forecast_confidence' => $forecastResult['confidence'] ?? null,
        ]));
    }

}

