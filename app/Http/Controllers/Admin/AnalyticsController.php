<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AnalyticsController extends Controller
{
    public function index(Request $request)
    {
        $range     = $request->input('range', 7);
        $startDate = Carbon::now()->subDays((int) $range);
        $today     = Carbon::today();

        $branches = Branch::orderBy('name')->get();

        // ─── Global Stats (aggregate over all branches) ───────────────────────
        $stats = [
            'total_revenue'   => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('total'),
            'total_profit'    => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('profit'),
            'total_orders'    => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->count(),
            'low_stock_items' => IngredientStock::whereHas('ingredient')->whereColumn('stock', '<=', 'low_stock_level')->count(),
        ];

        // ─── Per-Branch Stats (for the split dashboard view) ─────────────────
        $branchStats = $branches->map(function (Branch $branch) use ($startDate, $today) {
            $salesQuery = Sale::where('branch_id', $branch->id)->where('status', 'completed');

            $lowStockRows = IngredientStock::with('ingredient')
                ->whereHas('ingredient')
                ->where('branch_id', $branch->id)
                ->whereColumn('stock', '<=', 'low_stock_level')
                ->get();

            $lowStockIngredients = $lowStockRows->map(function($row) {
                return [
                    'name'            => $row->ingredient->name ?? 'Unknown',
                    'stock'           => $row->stock,
                    'unit'            => $row->ingredient->unit ?? 'pcs',
                    'low_stock_level' => $row->low_stock_level,
                ];
            });

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

        // ─── Line Chart: Sales over time ──────────────────────────────────────
        $salesOverTime = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(profit) as profit'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                $item->revenue = (float) $item->revenue;
                $item->profit = (float) $item->profit;
                return $item;
            });

        // ─── Bar Chart: Top 10 selling products ───────────────────────────────
        $salesPerProduct = DB::table('sale_items')
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

        // ─── Pie Chart: Sales by payment method ───────────────────────────────
        $salesByPaymentMethod = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('payment_method')
            ->get()
            ->map(function ($item) {
                $item->count = (int) $item->count;
                $item->revenue = (float) $item->revenue;
                return $item;
            });

        return Inertia::render('Admin/Dashboard', [
            'stats'                => $stats,
            'branchStats'          => $branchStats,
            'salesOverTime'        => $salesOverTime,
            'salesPerProduct'      => $salesPerProduct,
            'salesByPaymentMethod' => $salesByPaymentMethod,
            'range'                => (int) $range,
        ]);
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
    public function salesForecast(Request $request)
    {
        $days = (int) $request->input('days', 30);
        $branchId = $request->input('branch_id');

        $result = $this->calculateForecast($days, $branchId);

        if (isset($result['error'])) {
            return Inertia::render('Analytics/SalesForecast', [
                'error' => $result['error'],
                'branches' => Branch::all(),
                'filters' => $request->only(['days', 'branch_id']),
            ]);
        }

        return Inertia::render('Analytics/SalesForecast', array_merge($result, [
            'branches' => Branch::all(),
            'filters' => $request->only(['days', 'branch_id']),
        ]));
    }

    public function restockSuggestions(Request $request)
    {
        $branchId = $request->input('branch_id');

        if (!$branchId || $branchId === 'all') {
            // Default to first branch if none selected for specific restock suggestions
            $branchId = Branch::first()?->id;
        }

        if (!$branchId) {
            return Inertia::render('Analytics/RestockSuggestions', [
                'error' => 'No branches found in the system.',
                'branches' => Branch::all(),
            ]);
        }

        // 1. Get Forecast for tomorrow (using a 30-day lookback for accuracy)
        $forecastResult = $this->calculateForecast(30, $branchId);

        if (isset($forecastResult['error'])) {
            return Inertia::render('Analytics/RestockSuggestions', [
                'error' => "Forecast error: {$forecastResult['error']}",
                'branches' => Branch::all(),
                'filters' => ['branch_id' => $branchId],
            ]);
        }

        $tomorrowPrediction = $forecastResult['prediction'];

        // 2. Load Products with Recipes for this branch
        $products = Product::where('branch_id', $branchId)
            ->with('ingredients') // Has pivot quantity_required
            ->get();

        // 3. Aggregate Usage Requirements
        $usage = [];
        foreach ($products as $product) {
            foreach ($product->ingredients as $ingredient) {
                $requiredPerUnit = (float) $ingredient->pivot->quantity_required;
                $totalExpectedUsage = $tomorrowPrediction * $requiredPerUnit;

                if (!isset($usage[$ingredient->id])) {
                    $usage[$ingredient->id] = [
                        'id' => $ingredient->id,
                        'name' => $ingredient->name,
                        'unit' => $ingredient->unit,
                        'cost_per_base_unit' => $ingredient->cost_per_base_unit ?? 0,
                        'required_qty' => 0
                    ];
                }
                $usage[$ingredient->id]['required_qty'] += $totalExpectedUsage;
            }
        }

        // 4. Compare with Current Stock and Generate Suggestions
        $suggestions = [];
        foreach ($usage as $ingredientId => $data) {
            $stockRecord = IngredientStock::where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->first();

            $currentStock = $stockRecord ? (float) $stockRecord->stock : 0;
            $required = $data['required_qty'];
            
            // Apply 10% Safety Buffer
            $safeRequired = $required * 1.1;
            $gap = $safeRequired - $currentStock;

            if ($gap > 0 || ($stockRecord && $stockRecord->isLowStock())) {
                $restockQty = max(0, $gap);
                
                $status = 'Safe';
                if ($currentStock <= 0) $status = 'Out of Stock';
                elseif ($currentStock <= ($safeRequired * 0.2)) $status = 'Critical';
                elseif ($currentStock <= ($safeRequired * 0.5)) $status = 'Warning';

                $suggestions[] = [
                    'ingredient_id' => $ingredientId,
                    'name' => $data['name'],
                    'unit' => $data['unit'],
                    'current_stock' => round($currentStock, 2),
                    'predicted_usage' => round($required, 2),
                    'suggested_restock' => ceil($restockQty),
                    'estimated_cost' => round(ceil($restockQty) * $data['cost_per_base_unit'], 2),
                    'status' => $status
                ];
            }
        }

        return Inertia::render('Analytics/RestockSuggestions', [
            'suggestions' => $suggestions,
            'branches' => Branch::all(),
            'tomorrow_forecast' => $tomorrowPrediction,
            'filters' => ['branch_id' => $branchId],
        ]);
    }

    private function calculateForecast(int $days, ?int $branchId)
    {
        $forecastData = DB::table('sales')
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as daily_total')
            )
            ->when($branchId && $branchId !== 'all', function($q) use ($branchId) {
                return $q->where('branch_id', $branchId);
            })
            ->where('created_at', '>=', Carbon::now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        if ($forecastData->count() < 5) {
            return ['error' => 'Not enough data for AI prediction. Minimum 5 days of sales records required.'];
        }

        $startDate = Carbon::parse($forecastData->first()->date);
        $endDate = Carbon::now();
        $processedData = collect();
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dateStr = $currentDate->toDateString();
            $match = $forecastData->firstWhere('date', $dateStr);
            $processedData->push([
                'date' => $dateStr,
                'total' => $match ? (float) $match->daily_total : 0.0
            ]);
            $currentDate->addDay();
        }

        $n = $processedData->count();
        $sumX = 0; $sumY = 0; $sumXY = 0; $sumX2 = 0;
        foreach ($processedData as $index => $row) {
            $xi = $index + 1;
            $yi = $row['total'];
            $sumX += $xi;
            $sumY += $yi;
            $sumXY += ($xi * $yi);
            $sumX2 += ($xi * $xi);
        }

        $denominator = ($n * $sumX2) - ($sumX * $sumX);
        $m = $denominator != 0 ? (($n * $sumXY) - ($sumX * $sumY)) / $denominator : 0;
        $b = ($sumY - ($m * $sumX)) / $n;

        $futureForecast = [];
        $lastDate = Carbon::parse($processedData->last()['date']);
        for ($i = 1; $i <= 7; $i++) {
            $nextXi = $n + $i;
            $predictedValue = ($m * $nextXi) + $b;
            $futureForecast[] = [
                'date' => $lastDate->copy()->addDays($i)->toDateString(),
                'predicted' => max(0, round($predictedValue, 2))
            ];
        }

        $trendPercentage = $processedData->first()['total'] > 0 
            ? (($processedData->last()['total'] - $processedData->first()['total']) / $processedData->first()['total']) * 100 
            : 0;

        return [
            'historical' => $processedData,
            'prediction' => max(0, round(($m * ($n + 1)) + $b, 2)), 
            'forecast'   => $futureForecast,
            'trend' => [
                'type' => $m >= 0 ? 'upward' : 'downward',
                'slope' => round($m, 2),
                'percentage' => round($trendPercentage, 1)
            ],
        ];
    }
}
