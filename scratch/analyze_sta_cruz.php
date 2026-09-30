<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$staCruzBranch = Branch::where('name', 'like', '%Sta Cruz%')
    ->orWhere('name', 'like', '%Santa Cruz%')
    ->first();

$victoriaBranch = Branch::where('name', 'like', '%Victoria%')
    ->first();

echo "Branches:\n";
echo "Sta Cruz ID: " . ($staCruzBranch ? $staCruzBranch->id . " (" . $staCruzBranch->name . ")" : "NOT FOUND") . "\n";
echo "Victoria ID: " . ($victoriaBranch ? $victoriaBranch->id . " (" . $victoriaBranch->name . ")" : "NOT FOUND") . "\n\n";

if ($staCruzBranch) {
    $startDate = '2026-09-10 00:00:00';
    $endDate = '2026-09-30 23:59:59';

    $staCruzSales = Sale::where('branch_id', $staCruzBranch->id)
        ->whereBetween('created_at', [$startDate, $endDate])
        ->with('items')
        ->orderBy('created_at')
        ->get();

    $totalRevenue = $staCruzSales->sum('total');
    $totalOrders = $staCruzSales->count();
    $totalQuantity = 0;
    
    $dailyStats = [];

    foreach ($staCruzSales as $sale) {
        $date = substr($sale->created_at->toDateTimeString(), 0, 10);
        if (!isset($dailyStats[$date])) {
            $dailyStats[$date] = [
                'date' => $date,
                'orders' => 0,
                'revenue' => 0.0,
                'quantity' => 0,
                'items' => [],
            ];
        }
        $dailyStats[$date]['orders']++;
        $dailyStats[$date]['revenue'] += (float)$sale->total;
        
        foreach ($sale->items as $item) {
            $dailyStats[$date]['quantity'] += (float)$item->quantity;
            $totalQuantity += (float)$item->quantity;
            $dailyStats[$date]['items'][] = [
                'product_id' => $item->product_id,
                'quantity' => (float)$item->quantity,
                'price' => (float)$item->unit_price,
            ];
        }
    }

    echo "=== STA CRUZ (Sept 10 - Sept 30) ===\n";
    echo "Total Revenue: ₱" . number_format($totalRevenue, 2) . "\n";
    echo "Total Orders / Transactions: " . $totalOrders . "\n";
    echo "Total Quantity Sold: " . $totalQuantity . "\n";
    echo "Avg Daily Revenue: ₱" . number_format($totalRevenue / max(1, count($dailyStats)), 2) . "\n";
    echo "Avg Daily Quantity: " . round($totalQuantity / max(1, count($dailyStats)), 1) . "\n";
    echo "Days active: " . count($dailyStats) . "\n\n";

    echo "Daily Breakdown:\n";
    foreach ($dailyStats as $date => $stat) {
        echo " - {$date}: Orders: {$stat['orders']}, Qty: {$stat['quantity']}, Revenue: ₱" . number_format($stat['revenue'], 2) . "\n";
    }
}

$availableProducts = Product::whereNull('deleted_at')->get(['id', 'name', 'selling_price', 'cost_price']);
echo "\nTotal Available Products in DB: " . $availableProducts->count() . "\n";
foreach ($availableProducts as $p) {
    // Check branch_product price for Victoria
    $pivot = DB::table('branch_product')->where('branch_id', $victoriaBranch->id)->where('product_id', $p->id)->first();
    $vicPrice = $pivot && $pivot->price !== null ? (float)$pivot->price : (float)$p->selling_price;
    $vicActive = $pivot ? (bool)$pivot->is_active : true;
    echo " - ID: {$p->id} | {$p->name} | Base: ₱{$p->selling_price} | Vic: ₱{$vicPrice} | VicActive: " . ($vicActive ? 'YES' : 'NO') . "\n";
}

