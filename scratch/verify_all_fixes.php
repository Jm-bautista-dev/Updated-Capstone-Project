<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\CashierShift;
use App\Models\Wastage;
use App\Services\SaleService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

echo "=== STARTING VERIFICATION ===\n\n";

DB::beginTransaction();

try {
    // 1. Setup test branch and users
    $branch = Branch::first() ?? Branch::create(['name' => 'Test Branch', 'address' => '123 Test St']);
    
    $admin = User::where('role', 'admin')->first();
    if (!$admin) {
        $admin = User::create([
            'name' => 'Test Admin',
            'email' => 'admin_test_' . time() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);
    }

    $cashier = User::where('role', 'cashier')->first();
    if (!$cashier) {
        $cashier = User::create([
            'name' => 'Test Cashier',
            'email' => 'cashier_test_' . time() . '@example.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
            'branch_id' => $branch->id,
        ]);
    }

    // 2. Setup Category and Product
    $category = Category::first() ?? Category::create(['name' => 'Test Category']);
    $product = Product::create([
        'name' => 'Discountable Milk Tea',
        'category_id' => $category->id,
        'selling_price' => 120.00,
        'cost_price' => 45.00,
        'is_active' => true,
        'branch_id' => $branch->id,
    ]);

    // Test Model Serialization for Non-Admin (Cashier) vs Admin
    echo "--- TEST 1: Cost Redaction in Model Serialization ---\n";
    Auth::login($cashier);
    $cashierProductArray = $product->fresh()->toArray();
    assert(!isset($cashierProductArray['cost_price']), "FAIL: cost_price exposed to Cashier!");
    assert(!isset($cashierProductArray['cost']), "FAIL: cost exposed to Cashier!");
    assert(!isset($cashierProductArray['has_cost']), "FAIL: has_cost exposed to Cashier!");
    echo "PASS: Product cost hidden from Cashier array serialization.\n";

    Auth::login($admin);
    $adminProductArray = $product->fresh()->toArray();
    assert(isset($adminProductArray['cost_price']), "FAIL: cost_price hidden from Admin!");
    echo "PASS: Product cost accessible to Admin array serialization.\n";

    // Test Ingredient and IngredientStock Serialization
    $ingredient = Ingredient::create([
        'name' => 'Tapioca Pearls Test ' . time(),
        'unit' => 'kg',
        'cost_per_base_unit' => 150.00,
        'low_stock_level' => 5,
        'branch_id' => $branch->id,
    ]);

    $stock = IngredientStock::firstOrCreate(
        ['ingredient_id' => $ingredient->id, 'branch_id' => $branch->id],
        ['quantity' => 20, 'cost_per_unit' => 150.00, 'last_purchase_price' => 140.00]
    );

    Auth::login($cashier);
    $cashierIngArray = $ingredient->fresh()->toArray();
    $cashierStockArray = $stock->fresh()->toArray();
    assert(!isset($cashierIngArray['cost_per_base_unit']), "FAIL: ingredient cost exposed to Cashier!");
    assert(!isset($cashierStockArray['cost_per_unit']), "FAIL: stock cost_per_unit exposed to Cashier!");
    assert(!isset($cashierStockArray['last_purchase_price']), "FAIL: stock last_purchase_price exposed to Cashier!");
    echo "PASS: Ingredient and Stock costs hidden from Cashier serialization.\n";

    // 3. Test POS Checkout with Percentage Discount
    echo "\n--- TEST 2: POS Checkout with Percentage Discount ---\n";
    Auth::login($cashier);
    
    // Create an open shift for the cashier
    $shift = CashierShift::create([
        'cashier_id' => $cashier->id,
        'branch_id' => $branch->id,
        'opened_at' => now(),
        'opening_balance' => 1000.00,
        'expected_balance' => 1000.00,
        'total_cash_sales' => 0.00,
        'status' => 'open',
    ]);

    $saleService = app(SaleService::class);

    // Buy 2 items @ 120 = 240. Apply 10% discount = 24. Final total = 216. Paid = 250. Change = 34.
    $payloadPercentage = [
        'user_id' => $cashier->id,
        'branch_id' => $branch->id,
        'items' => [
            [
                'id' => $product->id,
                'quantity' => 2,
                'selling_price' => 120.00,
            ]
        ],
        'discount' => 10,
        'discount_type' => 'percentage',
        'discount_details' => [
            'type' => 'percentage',
            'value' => 10,
            'name' => '10% Senior/PWD',
        ],
        'payment_method' => 'cash',
        'amount_paid' => 250.00,
        'status' => 'completed',
        'force' => true,
    ];

    $sale1 = $saleService->processSale($payloadPercentage);

    echo "Subtotal: {$sale1->subtotal} (Expected: 240.00)\n";
    echo "Discount: {$sale1->discount} (Expected: 24.00)\n";
    echo "Total: {$sale1->total} (Expected: 216.00)\n";
    echo "Amount Paid: {$sale1->amount_paid} (Expected: 250.00)\n";
    echo "Change: {$sale1->change} (Expected: 34.00)\n";

    assert((float)$sale1->subtotal === 240.00, "FAIL: Subtotal mismatch");
    assert((float)$sale1->discount === 24.00, "FAIL: Discount mismatch");
    assert((float)$sale1->total === 216.00, "FAIL: Total mismatch");
    assert((float)$sale1->amount_paid === 250.00, "FAIL: Amount paid mismatch");
    assert((float)$sale1->change === 34.00, "FAIL: Change mismatch");

    $shift->refresh();
    echo "Shift cash sales: {$shift->total_cash_sales} (Expected: 216.00)\n";
    echo "Shift expected balance: {$shift->expected_balance} (Expected: 1216.00)\n";
    assert((float)$shift->total_cash_sales === 216.00, "FAIL: Shift cash sales mismatch");
    assert((float)$shift->expected_balance === 1216.00, "FAIL: Shift expected balance mismatch");
    echo "PASS: Percentage discount checkout & shift balance increment verified.\n";

    // 4. Test POS Checkout with Fixed Amount Discount
    echo "\n--- TEST 3: POS Checkout with Fixed Amount Discount ---\n";
    // Buy 3 items @ 120 = 360. Apply 50.00 fixed discount. Final total = 310. Paid = 500. Change = 190.
    $payloadFixed = [
        'user_id' => $cashier->id,
        'branch_id' => $branch->id,
        'items' => [
            [
                'id' => $product->id,
                'quantity' => 3,
                'selling_price' => 120.00,
            ]
        ],
        'discount' => 50.00,
        'discount_type' => 'fixed',
        'discount_details' => [
            'type' => 'fixed',
            'value' => 50.00,
            'name' => 'Php 50 Promo Voucher',
        ],
        'payment_method' => 'cash',
        'amount_paid' => 500.00,
        'status' => 'completed',
        'force' => true,
    ];

    $sale2 = $saleService->processSale($payloadFixed);

    echo "Subtotal: {$sale2->subtotal} (Expected: 360.00)\n";
    echo "Discount: {$sale2->discount} (Expected: 50.00)\n";
    echo "Total: {$sale2->total} (Expected: 310.00)\n";
    echo "Amount Paid: {$sale2->amount_paid} (Expected: 500.00)\n";
    echo "Change: {$sale2->change} (Expected: 190.00)\n";

    assert((float)$sale2->subtotal === 360.00, "FAIL: Subtotal mismatch");
    assert((float)$sale2->discount === 50.00, "FAIL: Discount mismatch");
    assert((float)$sale2->total === 310.00, "FAIL: Total mismatch");
    assert((float)$sale2->amount_paid === 500.00, "FAIL: Amount paid mismatch");
    assert((float)$sale2->change === 190.00, "FAIL: Change mismatch");

    // 5. Test Sale and SaleItem Serialization for Cashier vs Admin
    echo "\n--- TEST 4: Sale Cost/Profit Redaction for Cashier ---\n";
    Auth::login($cashier);
    $cashierSaleArray = $sale2->fresh(['items'])->toArray();
    assert(!isset($cashierSaleArray['cost_total']), "FAIL: cost_total exposed to Cashier!");
    assert(!isset($cashierSaleArray['profit']), "FAIL: profit exposed to Cashier!");
    assert(!isset($cashierSaleArray['items'][0]['cost_price']), "FAIL: sale item cost_price exposed to Cashier!");
    assert(!isset($cashierSaleArray['items'][0]['profit']), "FAIL: sale item profit exposed to Cashier!");
    echo "PASS: Sale cost_total and profit hidden from Cashier serialization.\n";

    Auth::login($admin);
    $adminSaleArray = $sale2->fresh(['items'])->toArray();
    assert(isset($adminSaleArray['cost_total']), "FAIL: cost_total hidden from Admin!");
    assert(isset($adminSaleArray['profit']), "FAIL: profit hidden from Admin!");
    assert(isset($adminSaleArray['items'][0]['cost_price']), "FAIL: sale item cost_price hidden from Admin!");
    assert(isset($adminSaleArray['items'][0]['profit']), "FAIL: sale item profit hidden from Admin!");
    echo "PASS: Sale cost_total and profit accessible to Admin serialization.\n";

    echo "\n=== ALL VERIFICATIONS PASSED SUCCESSFULLY! ===\n";

} catch (\Throwable $e) {
    echo "\nERROR EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
} finally {
    DB::rollBack();
    echo "\nDatabase rolled back cleanly.\n";
}
