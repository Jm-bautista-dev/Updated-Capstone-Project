<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "=== SCANNING FOR 'voided' ACROSS ALL TABLES IN " . DB::connection()->getDatabaseName() . " ===\n";

$tables = DB::select('SHOW TABLES');
$dbName = DB::connection()->getDatabaseName();
$prop = "Tables_in_{$dbName}";

foreach ($tables as $t) {
    $tableName = $t->$prop;
    $columns = Schema::getColumnListing($tableName);
    
    foreach ($columns as $col) {
        try {
            $count = DB::table($tableName)->whereRaw("LOWER(CAST(`{$col}` AS CHAR)) LIKE '%voided%'")->count();
            if ($count > 0) {
                echo "Found in Table `{$tableName}`, Column `{$col}`: {$count} matching rows\n";
                $samples = DB::table($tableName)->whereRaw("LOWER(CAST(`{$col}` AS CHAR)) LIKE '%voided%'")->limit(5)->get();
                echo json_encode($samples, JSON_PRETTY_PRINT) . "\n";
            }
        } catch (\Exception $e) {
            // Ignore column type errors (e.g. blobs or json)
        }
    }
}

// Also check for 'void' as a status or value
echo "\n=== SCANNING FOR status = 'void' or 'voided' ===\n";
foreach ($tables as $t) {
    $tableName = $t->$prop;
    if (Schema::hasColumn($tableName, 'status')) {
        $statuses = DB::table($tableName)->select('status', DB::raw('count(*) as c'))->groupBy('status')->get();
        echo "Table `{$tableName}` status counts:\n";
        foreach ($statuses as $st) {
            echo "  - {$st->status}: {$st->c}\n";
        }
    }
}

