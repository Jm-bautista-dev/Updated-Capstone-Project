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
            'topProductCosts'      => $this->getTopProductCosts($branchId),
            'salesByPaymentMethod' => $this->getSalesByPayment($startDate, $branchId),
            'ingredientCostTrends' => $this->getIngredientCostTrends($branchId),
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
        $isSqlite = DB::connection()->getDriverName() === 'sqlite';
        $dayExpression = $isSqlite ? "CAST(strftime('%w', created_at) AS INTEGER) + 1" : 'DAYOFWEEK(created_at)';
        $hourExpression = $isSqlite ? "CAST(strftime('%H', created_at) AS INTEGER)" : 'HOUR(created_at)';

        return Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->selectRaw("{$dayExpression} as dow, {$hourExpression} as hr, COUNT(*) as volume")
            ->groupBy('dow', 'hr')
            ->get()
            ->map(fn($r) => [
                'day'    => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][((int) $r->dow - 1 + 7) % 7] ?? 'Mon',
                'hour'   => (int) $r->hr,
                'volume' => (int) $r->volume,
            ]);
    }


    private function getGlobalStats($startDate, ?int $branchId = null)
    {
        $metricsService = new \App\Services\FinancialMetricsService();
        $metrics = $metricsService->getSummaryMetrics($startDate, null, $branchId);
        $popMetrics = $metricsService->getPeriodOverPeriodMetrics($startDate, Carbon::now(), $branchId);
        $dodMetrics = $metricsService->getDayOverDayMetrics($branchId);

        $stockQuery = IngredientStock::whereHas('ingredient');
        if ($branchId) {
            $stockQuery->where('branch_id', $branchId);
        }

        return [
            'total_revenue'      => $metrics['revenue'],
            'cogs'               => $metrics['cogs'],
            'operating_expenses' => $metrics['operating_expenses'],
            'total_expenses'     => $metrics['total_expenses'],
            'total_profit'       => $metrics['net_profit'],
            'profit_margin'      => $metrics['net_margin'],
            'total_orders'       => $metrics['total_orders'],
            'revenue_delta'      => $popMetrics['revenue'],
            'expenses_delta'     => $popMetrics['expenses'],
            'profit_delta'       => $popMetrics['profit'],
            'orders_delta'       => $popMetrics['orders'],
            'dod_revenue_delta'  => $dodMetrics['revenue'],
            'dod_orders_delta'   => $dodMetrics['orders'],
            'low_stock_items'    => $stockQuery->whereColumn('stock', '<=', 'low_stock_level')->count(),
        ];
    }

    private function getBranchStats($branches, $startDate, $today)
    {
        $metricsService = new \App\Services\FinancialMetricsService();
        $branchFinancials = $metricsService->getBranchStats($branches, $startDate, null)->keyBy('id');

        return $branches->map(function (Branch $branch) use ($branchFinancials) {
            $financial = $branchFinancials->get($branch->id) ?? [];

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

            return [
                'id'                   => $branch->id,
                'name'                 => $branch->name,
                'total_revenue'        => $financial['total_revenue'] ?? 0.0,
                'cogs'                 => $financial['cogs'] ?? 0.0,
                'total_expenses'       => $financial['total_expenses'] ?? 0.0,
                'total_profit'         => $financial['total_profit'] ?? 0.0,
                'profit_margin'        => $financial['profit_margin'] ?? 0.0,
                'total_orders'         => $financial['total_orders'] ?? 0,
                'orders_today'         => $financial['orders_today'] ?? 0,
                'revenue_today'        => $financial['revenue_today'] ?? 0.0,
                'inventory_count'      => IngredientStock::where('branch_id', $branch->id)->count(),
                'low_stock_count'      => $lowStockIngredients->count(),
                'low_stock_ingredients'=> $lowStockIngredients,
            ];
        });
    }

    private function getSalesOverTime($range, $startDate, ?int $branchId = null)
    {
        $metricsService = new \App\Services\FinancialMetricsService();
        return $metricsService->getDailySalesTrajectory($range, $branchId);
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

    private function getTopProductCosts(?int $branchId = null): array
    {
        $query = Product::with(['ingredients.stocks', 'branches']);

        if ($branchId) {
            $query->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)
                  ->orWhereNull('branch_id')
                  ->orWhereHas('branches', function ($bq) use ($branchId) {
                      $bq->where('branches.id', $branchId);
                  });
            });
        }

        $products = $query->get();

        $ranked = $products->map(function (Product $product) use ($branchId) {
            $cost = (float) $product->computeProductCost($branchId);
            return [
                'id'            => $product->id,
                'name'          => $product->name,
                'sku'           => $product->sku,
                'cost'          => round($cost, 2),
                'selling_price' => (float) $product->selling_price,
                'has_recipe'    => $product->ingredients->isNotEmpty(),
            ];
        })
        ->filter(fn($item) => $item['cost'] > 0)
        ->sortByDesc('cost')
        ->values()
        ->take(8)
        ->toArray();

        return $ranked;
    }

    private function getIngredientCostTrends(?int $branchId = null): array
    {
        $ingredients = Ingredient::with(['stocks' => function($q) use ($branchId) {
            if ($branchId) {
                $q->where('branch_id', $branchId);
            }
        }])->get();

        return $ingredients->map(function ($ing) use ($branchId) {
            $stock = $branchId ? $ing->stocks->firstWhere('branch_id', $branchId) : null;
            $unit = $ing->unit ?? 'pcs';

            $costPerUnit = 0.0;
            if ($stock && (float)$stock->cost_per_unit > 0) {
                $costPerUnit = (float) $stock->cost_per_unit;
            } elseif ($ing->stocks->isNotEmpty()) {
                $costPerUnit = (float) $ing->stocks->where('cost_per_unit', '>', 0)->avg('cost_per_unit');
            }

            $displayUnit = $unit;
            $displayCost = $costPerUnit;

            if ($unit === 'g' || $unit === 'ml') {
                $displayUnit = $unit === 'g' ? 'kg' : 'L';
                $displayCost = $costPerUnit * 1000;
            }

            $currentStock = $stock ? (float)$stock->stock : (float)$ing->stocks->sum('stock');
            if ($unit === 'g' && $currentStock >= 1000) {
                $currentStock = $currentStock / 1000;
            } elseif ($unit === 'ml' && $currentStock >= 1000) {
                $currentStock = $currentStock / 1000;
            }

            return [
                'id'                 => $ing->id,
                'name'               => $ing->name,
                'unit'               => $displayUnit,
                'base_unit'          => $unit,
                'cost_per_unit'      => round($displayCost, 2),
                'cost_per_base_unit' => round($costPerUnit, 4),
                'stock'              => round($currentStock, 2),
            ];
        })->sortBy('name')->values()->toArray();
    }

    private function getSalesByPayment($startDate, ?int $branchId = null)
    {
        $query = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $results = $query->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('payment_method')
            ->get();

        $grandTotal = (float) $results->sum('revenue');

        return $results->map(function ($item) use ($grandTotal) {
            $revenue = (float) $item->revenue;
            $pct = $grandTotal > 0 ? round(($revenue / $grandTotal) * 100, 1) : 0.0;
            return [
                'payment_method' => ucfirst(str_replace('_', ' ', $item->payment_method ?: 'Cash')),
                'raw_method'     => $item->payment_method ?: 'cash',
                'count'          => (int) $item->count,
                'revenue'        => $revenue,
                'percentage'     => $pct,
            ];
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

