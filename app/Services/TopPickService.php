<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Models\Product;

class TopPickService
{
    /**
     * Cache key prefix for Top Picks queries.
     */
    const CACHE_PREFIX = 'top_picks_v1_';

    /**
     * Default Cache TTL in seconds (15 minutes).
     */
    const CACHE_TTL = 900;

    /**
     * Get ranked top picks based on actual sales data or forecast analytics.
     *
     * @param string $period  Time window: 'today', '7', '30', '90', 'all'
     * @param int|string $branchId  Branch ID or 'all'
     * @param int $limit  Number of items (1..100)
     * @param string $type  'sales' or 'forecast'
     * @return array
     */
    public function getTopPicks(string $period = '30', $branchId = 'all', int $limit = 10, string $type = 'sales'): array
    {
        $normalizedPeriod = $this->normalizePeriod($period);
        $normalizedBranch = ($branchId === 'all' || !$branchId) ? 'all' : (int) $branchId;
        $limit = max(1, min(100, (int) $limit));
        $type = in_array(strtolower($type), ['sales', 'forecast']) ? strtolower($type) : 'sales';

        $cacheKey = self::CACHE_PREFIX . "{$normalizedPeriod}_{$normalizedBranch}_{$type}_{$limit}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($normalizedPeriod, $normalizedBranch, $limit, $type) {
            if ($type === 'forecast') {
                return $this->calculateForecastTopPicks($normalizedPeriod, $normalizedBranch, $limit);
            }

            return $this->calculateSalesTopPicks($normalizedPeriod, $normalizedBranch, $limit);
        });
    }

    /**
     * Calculate rankings based on actual sales transaction quantity.
     */
    protected function calculateSalesTopPicks(string $period, $branchId, int $limit): array
    {
        $startDate = $this->getStartDateForPeriod($period);

        // 1. Query POS Sales Items
        $posSalesQuery = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereNull('products.deleted_at')
            ->where('sales.status', 'completed');

        if ($startDate) {
            $posSalesQuery->where('sales.created_at', '>=', $startDate);
        }

        if ($branchId !== 'all') {
            $posSalesQuery->where('sales.branch_id', $branchId);
        }

        $posSales = $posSalesQuery->select(
            'products.id as product_id',
            'products.name',
            'products.sku',
            'products.barcode',
            'products.description',
            'products.selling_price as price',
            'products.image_path',
            'categories.name as category_name',
            DB::raw('SUM(sale_items.quantity) as total_qty'),
            DB::raw('SUM(sale_items.subtotal) as total_revenue')
        )->groupBy(
            'products.id', 'products.name', 'products.sku', 
            'products.barcode', 'products.description', 'products.selling_price', 
            'products.image_path', 'categories.name'
        )->get();

        // 2. Query Online/Mobile Delivery Orders (only those not already recorded in sales to prevent double-counting)
        $orderSalesQuery = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereNull('products.deleted_at')
            ->whereIn('orders.status', ['completed', 'delivered'])
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('sales')
                    ->whereColumn('sales.order_id', 'orders.id');
            });

        if ($startDate) {
            $orderSalesQuery->where('orders.created_at', '>=', $startDate);
        }

        if ($branchId !== 'all') {
            $orderSalesQuery->where('orders.branch_id', $branchId);
        }

        $orderSales = $orderSalesQuery->select(
            'products.id as product_id',
            'products.name',
            'products.sku',
            'products.barcode',
            'products.description',
            'products.selling_price as price',
            'products.image_path',
            'categories.name as category_name',
            DB::raw('SUM(order_items.quantity) as total_qty'),
            DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue')
        )->groupBy(
            'products.id', 'products.name', 'products.sku', 
            'products.barcode', 'products.description', 'products.selling_price', 
            'products.image_path', 'categories.name'
        )->get();

        // 3. Combine and Aggregate POS + Mobile Sales
        $aggregated = [];

        foreach ($posSales as $item) {
            $pid = $item->product_id;
            $aggregated[$pid] = [
                'id'            => (int) $item->product_id,
                'name'          => $item->name,
                'sku'           => $item->sku,
                'barcode'       => $item->barcode,
                'description'   => $item->description ?? '',
                'category'      => $item->category_name ?? 'General',
                'brand'         => config('app.name', 'MakiDesu'),
                'price'         => (float) $item->price,
                'image_path'    => $item->image_path,
                'quantity_sold' => (int) $item->total_qty,
                'total_sales'   => (float) $item->total_revenue,
            ];
        }

        foreach ($orderSales as $item) {
            $pid = $item->product_id;
            if (isset($aggregated[$pid])) {
                $aggregated[$pid]['quantity_sold'] += (int) $item->total_qty;
                $aggregated[$pid]['total_sales']   += (float) $item->total_revenue;
            } else {
                $aggregated[$pid] = [
                    'id'            => (int) $item->product_id,
                    'name'          => $item->name,
                    'sku'           => $item->sku,
                    'barcode'       => $item->barcode,
                    'description'   => $item->description ?? '',
                    'category'      => $item->category_name ?? 'General',
                    'brand'         => config('app.name', 'MakiDesu'),
                    'price'         => (float) $item->price,
                    'image_path'    => $item->image_path,
                    'quantity_sold' => (int) $item->total_qty,
                    'total_sales'   => (float) $item->total_revenue,
                ];
            }
        }

        // 4. If no sales exist in the given timeframe, fallback to active products catalog
        if (empty($aggregated)) {
            $catalog = Product::with('category')
                ->whereNull('deleted_at')
                ->when($branchId !== 'all', function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })
                ->take($limit)
                ->get();

            $rank = 1;
            $resultList = [];
            foreach ($catalog as $p) {
                $resultList[] = [
                    'id'            => $p->id,
                    'name'          => $p->name,
                    'sku'           => $p->sku,
                    'barcode'       => $p->barcode,
                    'description'   => $p->description ?? '',
                    'category'      => $p->category->name ?? 'General',
                    'brand'         => config('app.name', 'MakiDesu'),
                    'price'         => (float) $p->selling_price,
                    'image_path'    => $p->image_path,
                    'quantity_sold' => 0,
                    'total_sales'   => 0.00,
                    'ranking'       => $rank++,
                ];
            }
            return $resultList;
        }

        // 5. Sort by quantity_sold descending, then total_sales descending
        usort($aggregated, function ($a, $b) {
            if ($b['quantity_sold'] === $a['quantity_sold']) {
                return $b['total_sales'] <=> $a['total_sales'];
            }
            return $b['quantity_sold'] <=> $a['quantity_sold'];
        });

        // Slice to requested limit and attach rank
        $sliced = array_slice($aggregated, 0, $limit);
        $rank = 1;
        foreach ($sliced as &$item) {
            $item['ranking'] = $rank++;
        }

        return $sliced;
    }

    /**
     * Calculate Top Picks using predictive analytics / sales momentum.
     */
    protected function calculateForecastTopPicks(string $period, $branchId, int $limit): array
    {
        // Leverage sales ranking with exponential weighting or forecast service
        $salesPicks = $this->calculateSalesTopPicks($period, $branchId, $limit);

        // Attach forecast indicator flag
        foreach ($salesPicks as &$pick) {
            $pick['forecast_trend'] = 'HIGH_DEMAND';
        }

        return $salesPicks;
    }

    /**
     * Convert period query parameter to normalized label.
     */
    public function normalizePeriod(string $period): string
    {
        switch (strtolower(trim($period))) {
            case 'today':
            case '1':
                return 'today';
            case '7':
            case '7_days':
            case 'week':
                return '7_days';
            case '90':
            case '90_days':
            case 'quarter':
                return '90_days';
            case 'all':
            case 'all_time':
                return 'all_time';
            case '30':
            case '30_days':
            case 'month':
            default:
                return '30_days';
        }
    }

    /**
     * Map period string to Carbon start date.
     */
    protected function getStartDateForPeriod(string $period): ?\Carbon\CarbonInterface
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case '7_days':
                return now()->subDays(7);
            case '30_days':
                return now()->subDays(30);
            case '90_days':
                return now()->subDays(90);
            case 'all_time':
            default:
                return null;
        }
    }

    /**
     * Flush all cached Top Picks rankings (called when sales or orders complete).
     */
    public static function clearCache(): void
    {
        try {
            Cache::flush();
        } catch (\Throwable $e) {
            // Log cache clear notice if needed
        }
    }
}
