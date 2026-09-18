<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\Delivery;
use App\Models\Order;

echo "=== SIMULATING SAFE REMOVAL OF 80 VOIDED/CANCELLED SALES ===\n\n";

DB::beginTransaction();

try {
    $cancelledSaleIds = DB::table('sales')->where('status', 'cancelled')->pluck('id')->toArray();
    echo "Found " . count($cancelledSaleIds) . " sales with status 'cancelled' (displayed as 'Voided / Cancelled' in UI).\n";

    // 1. Check pre counts
    $preSalesCount = DB::table('sales')->count();
    $preCompletedCount = DB::table('sales')->where('status', 'completed')->count();
    $preDeliveriesCount = DB::table('deliveries')->count();
    $preOrdersCount = DB::table('orders')->count();

    echo "Pre-Counts:\n";
    echo " - Total Sales: {$preSalesCount}\n";
    echo " - Completed Sales: {$preCompletedCount}\n";
    echo " - Total Deliveries: {$preDeliveriesCount}\n";
    echo " - Total Orders: {$preOrdersCount}\n\n";

    // 2. Disassociate deliveries so they are NOT cascade deleted
    $updatedDeliveries = DB::table('deliveries')
        ->whereIn('sale_id', $cancelledSaleIds)
        ->update(['sale_id' => null]);
    echo "Safely decoupled {$updatedDeliveries} delivery records by setting sale_id = NULL (preserving delivery data).\n";

    // 3. Disassociate print_jobs / delivery logs if any
    DB::table('print_jobs')->whereIn('sale_id', $cancelledSaleIds)->update(['sale_id' => null]);
    DB::table('delivery_assignment_logs')->whereIn('sale_id', $cancelledSaleIds)->update(['sale_id' => null]);

    // 4. Delete sale_items and sales
    $deletedSaleItems = DB::table('sale_items')->whereIn('sale_id', $cancelledSaleIds)->delete();
    $deletedSales = DB::table('sales')->whereIn('id', $cancelledSaleIds)->delete();

    echo "Deleted {$deletedSaleItems} sale_items rows.\n";
    echo "Deleted {$deletedSales} sales rows.\n\n";

    // 5. Post counts
    $postSalesCount = DB::table('sales')->count();
    $postCompletedCount = DB::table('sales')->where('status', 'completed')->count();
    $postDeliveriesCount = DB::table('deliveries')->count();
    $postOrdersCount = DB::table('orders')->count();

    echo "Post-Counts:\n";
    echo " - Total Sales: {$postSalesCount} (all completed: {$postCompletedCount})\n";
    echo " - Total Deliveries: {$postDeliveriesCount} (matches pre: " . ($preDeliveriesCount === $postDeliveriesCount ? "YES" : "NO") . ")\n";
    echo " - Total Orders: {$postOrdersCount} (matches pre: " . ($preOrdersCount === $postOrdersCount ? "YES" : "NO") . ")\n\n";

    echo "Simulation successful. Rolling back transaction so no changes applied yet.\n";
    DB::rollBack();
} catch (\Exception $e) {
    DB::rollBack();
    echo "Simulation Error: " . $e->getMessage() . "\n";
}
