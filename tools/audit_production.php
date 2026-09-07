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

echo "\n--- BUSINESS & STRUCTURAL TABLES ---\n";
$prodCnt = DB::table('products')->count();
$catCnt  = DB::table('categories')->count();
$ingCnt  = DB::table('ingredients')->count();
$stkCnt  = DB::table('ingredient_stocks')->count();

echo sprintf(" %-30s: %s\n", 'products', ($prodCnt === 0) ? '✅ 0 records (CLEAN - No demo products)' : "⚠️ {$prodCnt} records");
echo sprintf(" %-30s: %s\n", 'categories', ($catCnt === 0) ? '✅ 0 records (CLEAN - No demo categories)' : "⚠️ {$catCnt} records");
echo sprintf(" %-30s: %s\n", 'ingredients', ($ingCnt === 0) ? '✅ 0 records (CLEAN - No demo ingredients)' : "⚠️ {$ingCnt} records");
echo sprintf(" %-30s: %s\n", 'ingredient_stocks', ($stkCnt === 0) ? '✅ 0 records (CLEAN - No demo stocks)' : "⚠️ {$stkCnt} records");
echo sprintf(" %-30s: %d records (Victoria, Sta Cruz)\n", 'branches', DB::table('branches')->count());
echo sprintf(" %-30s: %d records\n", 'system_settings', DB::table('system_settings')->count());
echo sprintf(" %-30s: %d records\n", 'feature_flags', DB::table('feature_flags')->count());

echo "\n=======================================================\n";
$isBusinessClean = ($prodCnt === 0 && $catCnt === 0 && $ingCnt === 0 && $stkCnt === 0);
if ($allZero && $isBusinessClean && $users->count() === 2) {
    echo "  ✅ VERIFICATION PASSED: PRODUCTION IS 100% CLEAN!     \n";
    echo "     Admin Account Ready: jmbautista0228@gmail.com     \n";
    echo "     Super Admin Ready:   superadmin@makidesu           \n";
    echo "     Business Data:       EMPTY (Ready for Client)      \n";
} else {
    echo "  ⚠️ VERIFICATION FAILED!                                \n";
}
echo "=======================================================\n\n";
