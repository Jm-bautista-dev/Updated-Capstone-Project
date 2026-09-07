<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\User;

echo "\n=======================================================\n";
echo "             PRODUCTION DATA CLEANLINESS AUDIT         \n";
echo "=======================================================\n\n";

echo "--- USERS TABLE ---\n";
$users = User::all();
echo "Total Users: " . $users->count() . "\n";
foreach ($users as $u) {
    echo " - ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role} | Branch ID: " . ($u->branch_id ?? 'NULL') . "\n";
}

echo "\n--- TRANSACTIONAL TABLES (MUST ALL BE 0) ---\n";
$tables = [
    'orders', 'order_items', 'deliveries', 'delivery_attempts', 'riders',
    'product_reviews', 'sales', 'sale_items', 'carts', 'cart_items',
    'customer_device_tokens', 'customer_notifications', 'system_error_logs',
    'cashier_shifts', 'scanned_receipts', 'cancellation_requests'
];

$allZero = true;
foreach ($tables as $tbl) {
    $cnt = DB::table($tbl)->count();
    $status = ($cnt === 0) ? '✅ 0 records (CLEAN)' : '❌ ' . $cnt . ' records';
    if ($cnt > 0) $allZero = false;
    echo sprintf(" %-30s: %s\n", $tbl, $status);
}

echo "\n--- STRUCTURAL SEEDED TABLES ---\n";
echo sprintf(" %-30s: %d records\n", 'branches', DB::table('branches')->count());
echo sprintf(" %-30s: %d records\n", 'categories', DB::table('categories')->count());
echo sprintf(" %-30s: %d records\n", 'products', DB::table('products')->count());
echo sprintf(" %-30s: %d records\n", 'ingredients', DB::table('ingredients')->count());
echo sprintf(" %-30s: %d records\n", 'ingredient_stocks', DB::table('ingredient_stocks')->count());
echo sprintf(" %-30s: %d records\n", 'system_settings', DB::table('system_settings')->count());
echo sprintf(" %-30s: %d records\n", 'feature_flags', DB::table('feature_flags')->count());

echo "\n=======================================================\n";
if ($allZero && $users->count() === 2) {
    echo "  ✅ VERIFICATION PASSED: PRODUCTION IS 100% CLEAN!     \n";
} else {
    echo "  ⚠️ VERIFICATION FAILED!                                \n";
}
echo "=======================================================\n\n";
