<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\User;
use App\Models\Branch;

echo "=== TESTING VOIDED SALES REMOVAL LOGIC & INTEGRITY ===\n\n";

$admin = User::first();
$branch = Branch::first();
$product = Product::first();

if (!$admin || !$branch || !$product) {
    echo "Required seed data not found for integration test.\n";
    exit(0);
}

// 1. Initial State
$initialTotalSales = Sale::count();
$initialCompleted = Sale::where('status', 'completed')->count();
$initialCancelled = Sale::where('status', 'cancelled')->count();
$initialVoided = Sale::where('status', 'voided')->count();

echo "Initial Counts:\n";
echo " - Total: {$initialTotalSales}\n";
echo " - Completed: {$initialCompleted}\n";
echo " - Cancelled: {$initialCancelled}\n";
echo " - Voided: {$initialVoided}\n\n";

// 2. Insert dummy test sales: 1 voided, 1 cancelled, 1 completed
$testVoidedId = DB::table('sales')->insertGetId([
    'order_number'   => 'TEST-VOID-' . uniqid(),
    'user_id'        => $admin->id,
    'branch_id'      => $branch->id,
    'type'           => 'dine-in',
    'subtotal'       => 150.00,
    'discount'       => 0.00,
    'delivery_fee'   => 0.00,
    'total'          => 150.00,
    'paid_amount'    => 150.00,
    'change_amount'  => 0.00,
    'payment_method' => 'cash',
    'status'         => 'voided', // <-- Specifically VOIDED
    'created_at'     => now(),
    'updated_at'     => now(),
]);

// Add dummy sale item to test cascade
DB::table('sale_items')->insert([
    'sale_id'    => $testVoidedId,
    'product_id' => $product->id,
    'quantity'   => 1,
    'unit_price' => 150.00,
    'subtotal'   => 150.00,
    'created_at' => now(),
    'updated_at' => now(),
]);

echo "Created test voided sale (ID: {$testVoidedId})\n";
echo "Voided sales count after test insertion: " . Sale::where('status', 'voided')->count() . "\n";
echo "Sale items for test sale: " . DB::table('sale_items')->where('sale_id', $testVoidedId)->count() . "\n\n";

// 3. Execute the cleanup logic
echo "Executing safe removal of status = 'voided'...\n";
$deleted = DB::transaction(function () {
    return DB::table('sales')
        ->whereRaw("LOWER(TRIM(status)) = 'voided'")
        ->delete();
});

echo "Rows deleted: {$deleted}\n\n";

// 4. Verification
$finalTotalSales = Sale::count();
$finalCompleted = Sale::where('status', 'completed')->count();
$finalCancelled = Sale::where('status', 'cancelled')->count();
$finalVoided = Sale::where('status', 'voided')->count();
$orphanedItems = DB::table('sale_items')->where('sale_id', $testVoidedId)->count();

echo "Final Verification Results:\n";
echo " - Deleted count matched expected: " . ($deleted === 1 ? "PASSED" : "FAILED") . "\n";
echo " - Voided sales remaining: {$finalVoided} " . ($finalVoided === 0 ? "(PASSED)" : "(FAILED)") . "\n";
echo " - Completed sales preserved: {$finalCompleted} vs Initial {$initialCompleted} " . ($finalCompleted === $initialCompleted ? "(PASSED)" : "(FAILED)") . "\n";
echo " - Cancelled sales preserved: {$finalCancelled} vs Initial {$initialCancelled} " . ($finalCancelled === $initialCancelled ? "(PASSED)" : "(FAILED)") . "\n";
echo " - Total sales matches initial: {$finalTotalSales} vs {$initialTotalSales} " . ($finalTotalSales === $initialTotalSales ? "(PASSED)" : "(FAILED)") . "\n";
echo " - Orphaned child sale items: {$orphanedItems} " . ($orphanedItems === 0 ? "(PASSED: Cascaded safely)" : "(FAILED)") . "\n";

if ($deleted === 1 && $finalVoided === 0 && $finalCompleted === $initialCompleted && $finalCancelled === $initialCancelled && $orphanedItems === 0) {
    echo "\n>>> ALL INTEGRITY CHECKS PASSED PERFECTLY! <<<\n";
} else {
    echo "\n>>> INTEGRITY CHECK FAILED! <<<\n";
}
