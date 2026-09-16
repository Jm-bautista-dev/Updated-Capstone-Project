<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$tables = ['products', 'menu_item_ingredients', 'branch_product', 'ingredient_stocks', 'categories', 'product_addons'];

foreach ($tables as $table) {
    echo "=== INDEXES FOR TABLE: $table ===\n";
    $indexes = DB::select("SHOW INDEX FROM `$table`");
    $grouped = [];
    foreach ($indexes as $idx) {
        $grouped[$idx->Key_name][] = $idx->Column_name;
    }
    foreach ($grouped as $key => $cols) {
        echo "  - $key: (" . implode(', ', $cols) . ")\n";
    }
    echo "\n";
}
