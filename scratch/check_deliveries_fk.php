<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== CHECKING DELIVERIES & ORDERS LINKED TO CANCELLED SALES ===\n\n";

$fkDeliveries = DB::select("
    SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_NAME = 'deliveries' AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_SCHEMA = DATABASE()
");

print_r($fkDeliveries);

$fkActions = DB::select("
    SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        DELETE_RULE, 
        UPDATE_RULE 
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
    WHERE TABLE_NAME = 'deliveries' 
      AND CONSTRAINT_SCHEMA = DATABASE()
");

print_r($fkActions);

$cancelledSaleIds = DB::table('sales')->where('status', 'cancelled')->pluck('id');
$linkedDeliveriesCount = DB::table('deliveries')->whereIn('sale_id', $cancelledSaleIds)->count();
$totalDeliveriesCount = DB::table('deliveries')->count();
$totalOrdersCount = DB::table('orders')->count();

echo "Total deliveries in DB: {$totalDeliveriesCount}\n";
echo "Deliveries linked to cancelled sales: {$linkedDeliveriesCount}\n";
echo "Total orders in DB: {$totalOrdersCount}\n";
