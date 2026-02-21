<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
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
        $range = $request->input('range', 7); // Default to Last 7 Days
        $startDate = Carbon::now()->subDays((int) $range);
        $today = Carbon::today();

        // Summary Cards (Filtered by range)
        $stats = [
            'total_revenue' => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('total'),
            'total_profit' => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->sum('profit'),
            'total_orders' => Sale::where('status', 'completed')->where('created_at', '>=', $startDate)->count(),
            'low_stock_items' => Product::get()->filter(fn($p) => $p->computed_stock <= 5)->count(),
        ];

        // Line Chart: Sales over time (Filtered by range)
        $salesOverTime = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total) as revenue'), DB::raw('SUM(profit) as profit'))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Bar Chart: Sales per product (Top 10)
        $salesPerProduct = DB::table('sale_items')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $startDate)
            ->select('products.name', DB::raw('SUM(sale_items.quantity) as total_sold'), DB::raw('SUM(sale_items.subtotal) as revenue'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get();

        // Pie Chart: Sales by payment method (Filtered by range)
        $salesByPaymentMethod = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select('payment_method', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as revenue'))
            ->groupBy('payment_method')
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'salesOverTime' => $salesOverTime,
            'salesPerProduct' => $salesPerProduct,
            'salesByPaymentMethod' => $salesByPaymentMethod,
            'range' => (int) $range,
        ]);
    }
}
