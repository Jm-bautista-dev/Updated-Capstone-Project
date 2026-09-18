<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Sale;

echo "=== LOCAL DATABASE SALES STATUS REPORT ===\n";
try {
    $counts = Sale::select('status', DB::raw('count(*) as count'))
        ->groupBy('status')
        ->get();
    
    foreach ($counts as $c) {
        echo "Status: '{$c->status}' => {$c->count}\n";
    }
    echo "Total sales: " . Sale::count() . "\n";
    
    // Check distinct statuses
    $distinctStatuses = Sale::distinct()->pluck('status')->toArray();
    echo "Distinct statuses in sales table: " . implode(', ', $distinctStatuses) . "\n";

    // Check specifically for voided / cancelled
    $voidedCount = Sale::where('status', 'voided')->count();
    $cancelledCount = Sale::where('status', 'cancelled')->count();
    echo "Count where status = 'voided': {$voidedCount}\n";
    echo "Count where status = 'cancelled': {$cancelledCount}\n";

    // Also inspect foreign keys / relations referencing sales table
    $foreignKeys = DB::select("
        SELECT 
            TABLE_NAME, 
            COLUMN_NAME, 
            CONSTRAINT_NAME, 
            REFERENCED_TABLE_NAME, 
            REFERENCED_COLUMN_NAME 
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_NAME = 'sales' 
          AND TABLE_SCHEMA = DATABASE()
    ");
    echo "\n=== FOREIGN KEYS REFERENCING SALES TABLE ===\n";
    foreach ($foreignKeys as $fk) {
        echo "- Table: {$fk->TABLE_NAME}, Column: {$fk->COLUMN_NAME} (FK: {$fk->CONSTRAINT_NAME})\n";
    }

} catch (\Exception $e) {
    echo "Database Error: " . $e->getMessage() . "\n";
}
