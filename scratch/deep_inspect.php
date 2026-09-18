<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "===============================================================\n";
echo "DEEP DATABASE INSPECTION: SALES & STATUSES\n";
echo "===============================================================\n\n";

// 1. Check all accessible databases
$databases = DB::select("SHOW DATABASES");
echo "Accessible Databases:\n";
foreach ($databases as $db) {
    echo " - " . $db->Database . "\n";
}
echo "\n";

// 2. Current database
$currentDb = DB::connection()->getDatabaseName();
echo "Current Database: {$currentDb}\n\n";

// 3. Inspect sales table
echo "--- ALL DISTINCT STATUSES IN SALES TABLE ---\n";
$salesStatuses = DB::table('sales')
    ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as sum_total'), DB::raw('MIN(created_at) as earliest'), DB::raw('MAX(created_at) as latest'))
    ->groupBy('status')
    ->get();

foreach ($salesStatuses as $st) {
    echo sprintf("Status: '%s' | Count: %d | Sum Total: ₱%s | Range: %s to %s\n",
        $st->status,
        $st->count,
        number_format((float)$st->sum_total, 2),
        $st->earliest,
        $st->latest
    );
}
echo "\n";

// 4. Check if there are any case variations or spaces in status column of sales
$allSales = DB::table('sales')->select('id', 'order_number', 'status', 'total', 'created_at')->get();
$statusFrequency = [];
foreach ($allSales as $s) {
    $rawStatus = $s->status;
    $statusFrequency[$rawStatus] = ($statusFrequency[$rawStatus] ?? 0) + 1;
}
echo "Raw status string counts:\n";
print_r($statusFrequency);
echo "\n";

// 5. Inspect orders table
if (Schema::hasTable('orders')) {
    echo "--- ALL DISTINCT STATUSES IN ORDERS TABLE ---\n";
    $orderStatuses = DB::table('orders')
        ->select('status', DB::raw('COUNT(*) as count'))
        ->groupBy('status')
        ->get();
    foreach ($orderStatuses as $ost) {
        echo sprintf("Status: '%s' | Count: %d\n", $ost->status, $ost->count);
    }
    echo "\n";
}

// 6. Inspect deliveries table
if (Schema::hasTable('deliveries')) {
    echo "--- ALL DISTINCT STATUSES IN DELIVERIES TABLE ---\n";
    $deliveryStatuses = DB::table('deliveries')
        ->select('status', DB::raw('COUNT(*) as count'))
        ->groupBy('status')
        ->get();
    foreach ($deliveryStatuses as $dst) {
        echo sprintf("Status: '%s' | Count: %d\n", $dst->status, $dst->count);
    }
    echo "\n";
}

// 7. Check if there are any records with status = 'voided' in sales
$voidedSales = DB::table('sales')->whereRaw("LOWER(TRIM(status)) = 'voided'")->get();
echo "Total sales where LOWER(TRIM(status)) = 'voided': " . $voidedSales->count() . "\n";

// 8. Check if there are any records with status = 'cancelled' in sales
$cancelledSales = DB::table('sales')->whereRaw("LOWER(TRIM(status)) = 'cancelled'")->get();
echo "Total sales where LOWER(TRIM(status)) = 'cancelled': " . $cancelledSales->count() . "\n";

// 9. Inspect sample cancelled sales
echo "\nSample Cancelled Sales (first 5):\n";
foreach ($cancelledSales->take(5) as $cs) {
    echo sprintf("ID: %d | Order: %s | Total: ₱%s | Type: %s | Created: %s\n",
        $cs->id,
        $cs->order_number,
        number_format((float)$cs->total, 2),
        $cs->type ?? 'N/A',
        $cs->created_at
    );
}

// 10. Inspect sample completed sales
$completedSales = DB::table('sales')->whereRaw("LOWER(TRIM(status)) = 'completed'")->get();
echo "\nCompleted Sales (all " . $completedSales->count() . "):\n";
foreach ($completedSales as $cs) {
    echo sprintf("ID: %d | Order: %s | Subtotal: ₱%s | Disc: ₱%s | Fee: ₱%s | Total: ₱%s | Created: %s\n",
        $cs->id,
        $cs->order_number,
        number_format((float)($cs->subtotal ?? 0), 2),
        number_format((float)($cs->discount ?? 0), 2),
        number_format((float)($cs->delivery_fee ?? 0), 2),
        number_format((float)$cs->total, 2),
        $cs->created_at
    );
}

echo "\nInspection completed successfully.\n";
