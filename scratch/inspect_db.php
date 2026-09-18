<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "========================================================\n";
echo "DATABASE SALES & RELATIONSHIPS COMPREHENSIVE INSPECTION\n";
echo "========================================================\n\n";

// 1. Database and Environment info
echo "DB Connection: " . config('database.default') . "\n";
echo "DB Name: " . DB::connection()->getDatabaseName() . "\n\n";

// 2. Sales table status summary
echo "--- SALES STATUS BREAKDOWN ---\n";
$salesByStatus = DB::table('sales')
    ->select('status', DB::raw('count(*) as count'), DB::raw('sum(total) as sum_total'))
    ->groupBy('status')
    ->get();

foreach ($salesByStatus as $row) {
    echo sprintf("Status: %-15s | Count: %-6d | Total Sum: ₱%s\n", 
        $row->status, 
        $row->count, 
        number_format((float)($row->sum_total ?? 0), 2)
    );
}

$totalSalesCount = DB::table('sales')->count();
echo "Total sales rows in table: {$totalSalesCount}\n\n";

// 3. Specifically inspect 'voided' records
echo "--- VOIDED SALES DETAILS ---\n";
$voidedSales = DB::table('sales')
    ->whereRaw("LOWER(TRIM(status)) = 'voided'")
    ->get();

echo "Total records with status 'voided': " . $voidedSales->count() . "\n";

if ($voidedSales->count() > 0) {
    foreach ($voidedSales as $vs) {
        echo sprintf("ID: %-5d | Order #: %-16s | Date: %s | Total: ₱%s | Type: %s | Branch ID: %s | User ID: %s\n",
            $vs->id,
            $vs->order_number ?? 'N/A',
            $vs->created_at ?? 'N/A',
            number_format((float)($vs->total ?? 0), 2),
            $vs->type ?? 'N/A',
            $vs->branch_id ?? 'N/A',
            $vs->user_id ?? 'N/A'
        );
    }
} else {
    echo "No sales records with status 'voided' found currently in this database.\n";
}
echo "\n";

// 4. Also check for 'cancelled' or similar statuses just to be clear on distinction
$cancelledSalesCount = DB::table('sales')->whereRaw("LOWER(TRIM(status)) = 'cancelled'")->count();
echo "Total records with status 'cancelled': {$cancelledSalesCount}\n\n";

// 5. Foreign keys referencing `sales` table
echo "--- FOREIGN KEY CONSTRAINTS REFERENCING `sales` ---\n";
$fks = DB::select("
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

$referencingTables = [];
foreach ($fks as $fk) {
    echo sprintf("Table: %-25s | Column: %-15s | Constraint: %s\n",
        $fk->TABLE_NAME,
        $fk->COLUMN_NAME,
        $fk->CONSTRAINT_NAME
    );
    $referencingTables[] = [
        'table' => $fk->TABLE_NAME,
        'column' => $fk->COLUMN_NAME,
        'fk' => $fk->CONSTRAINT_NAME
    ];
}

// 6. Check onDelete action for each FK constraint
echo "\n--- REFERENTIAL ACTIONS (ON DELETE) ---\n";
$referentialActions = DB::select("
    SELECT 
        TABLE_NAME, 
        CONSTRAINT_NAME, 
        DELETE_RULE, 
        UPDATE_RULE 
    FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
    WHERE REFERENCED_TABLE_NAME = 'sales' 
      AND CONSTRAINT_SCHEMA = DATABASE()
");

foreach ($referentialActions as $ra) {
    echo sprintf("Table: %-25s | Constraint: %-30s | ON DELETE: %s\n",
        $ra->TABLE_NAME,
        $ra->CONSTRAINT_NAME,
        $ra->DELETE_RULE
    );
}

// 7. Check if any voided sales have child records in other tables
if ($voidedSales->count() > 0) {
    echo "\n--- CHILD RECORDS ATTACHED TO VOIDED SALES ---\n";
    $voidedIds = $voidedSales->pluck('id')->toArray();
    
    foreach ($referencingTables as $ref) {
        $table = $ref['table'];
        $col = $ref['column'];
        $childCount = DB::table($table)->whereIn($col, $voidedIds)->count();
        echo "Table `{$table}`.`{$col}` records linked to voided sales: {$childCount}\n";
    }
}

echo "\nInspection completed successfully.\n";
