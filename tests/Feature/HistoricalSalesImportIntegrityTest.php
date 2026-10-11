<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\CashierShift;
use Illuminate\Support\Facades\DB;

class HistoricalSalesImportIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected string $tempCsvPath;
    protected Branch $staCruzBranch;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempCsvPath = sys_get_temp_dir() . '/test_import_integrity_' . uniqid() . '.csv';

        $this->staCruzBranch = Branch::create([
            'name' => 'Maki Desu Sta Cruz',
            'code' => 'SC',
            'address' => 'Sta Cruz, Laguna',
            'latitude' => 14.2800,
            'longitude' => 121.4150,
            'delivery_radius_km' => 10,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
        ]);
    }

    protected function tearDown(): void
    {
        if (file_exists($this->tempCsvPath)) {
            @unlink($this->tempCsvPath);
        }
        parent::tearDown();
    }

    protected function createProduct(string $name, float $price = 100.0, ?int $categoryId = null): Product
    {
        return Product::create([
            'name' => $name,
            'selling_price' => $price,
            'cost_price' => 50.0,
            'unit' => 'pcs',
            'category_id' => $categoryId,
        ]);
    }

    /**
     * 1. Test an Excel row referencing an existing, valid product.
     */
    public function test_01_row_referencing_existing_valid_product_imports_successfully(): void
    {
        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Student Meal,2,198,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $this->assertDatabaseHas('sales', [
            'branch_id' => $this->staCruzBranch->id,
            'total' => 198.00,
            'source_system' => 'Loyverse',
        ]);

        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'quantity' => 2,
            'subtotal' => 198.00,
        ]);
    }

    /**
     * 2. Test a product name that differs only in capitalization or harmless whitespace.
     */
    public function test_02_product_name_with_casing_or_whitespace_resolves_without_creating_new_product(): void
    {
        $product = $this->createProduct('Classic California Maki (8pcs)', 189.0);
        $initialProductCount = Product::count();

        // Variations: mixed casing and extra leading/trailing/multiple internal whitespace
        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,  cLaSsIc   cALiFoRnIa   MaKi   (8pcs)  ,1,189,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        // Ensure no new product was created
        $this->assertEquals($initialProductCount, Product::count());
        $this->assertDatabaseHas('sale_items', [
            'product_id' => $product->id,
            'subtotal' => 189.00,
        ]);
    }

    /**
     * 3. Test an unknown product name: rejected and never created.
     */
    public function test_03_unknown_product_is_rejected_and_never_created_in_catalog(): void
    {
        $initialProductCount = Product::count();

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Nonexistent Sushi Roll,1,999,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        // Import should fail or report failure when 0 valid rows
        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(1);

        $this->assertEquals($initialProductCount, Product::count());
        $this->assertDatabaseMissing('products', ['name' => 'Nonexistent Sushi Roll']);
        $this->assertDatabaseMissing('sales', ['total' => 999]);
    }

    /**
     * 4. Test two existing products with ambiguous similar names.
     */
    public function test_04_ambiguous_similar_products_strictly_require_explicit_resolution(): void
    {
        $p4 = $this->createProduct('Torched Ham (4pcs)', 135.0);
        $p8 = $this->createProduct('Torched Ham (8pcs)', 269.0);

        // Exact match resolves accurately to p4
        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Torched Ham (4pcs),1,135,Cash,September 15 2026\n"
             . "Sta Cruz,Torched Ham (8pcs),1,269,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $this->assertDatabaseHas('sale_items', ['product_id' => $p4->id, 'subtotal' => 135.00]);
        $this->assertDatabaseHas('sale_items', ['product_id' => $p8->id, 'subtotal' => 269.00]);
    }

    /**
     * 5. Test a product without a category: category is preserved as null and not auto-created.
     */
    public function test_05_product_without_category_preserves_null_without_auto_creating_category(): void
    {
        $product = $this->createProduct('Uncategorized Special Roll', 150.0, null);
        $initialCatCount = Category::count();

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Uncategorized Special Roll,1,150,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $this->assertEquals($initialCatCount, Category::count());
        $this->assertNull($product->fresh()->category_id);
    }

    protected function createSale(array $attributes = []): Sale
    {
        $total = $attributes['total'] ?? 100.00;
        $timestamp = $attributes['created_at'] ?? now();

        $sale = Sale::create(array_merge([
            'order_number' => 'POS-SC-' . now()->format('Ymd-His') . '-' . strtoupper(substr(md5((string)mt_rand()), 0, 4)),
            'user_id' => $this->cashier->id,
            'branch_id' => $this->staCruzBranch->id,
            'type' => 'dine-in',
            'subtotal' => $total,
            'total' => $total,
            'paid_amount' => $total,
            'change_amount' => 0.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ], $attributes));

        $sale->created_at = $timestamp;
        $sale->updated_at = $timestamp;
        $sale->saveQuietly();

        return $sale;
    }

    /**
     * 6. Test a sales timestamp at exactly 09:00:00 AM (inclusive lower bound).
     */
    public function test_06_sales_timestamp_at_exactly_09_00_00_am_is_valid(): void
    {
        $product = $this->createProduct('Miso Soup', 50.0);
        $manilaTime = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-15 09:00:00', 'Asia/Manila');
        $utcTime = $manilaTime->copy()->setTimezone('UTC');

        $sale = $this->createSale([
            'order_number' => 'POS-SC-20260915-090000-TEST',
            'subtotal' => 50.00,
            'total' => 50.00,
            'paid_amount' => 50.00,
            'created_at' => $utcTime,
            'updated_at' => $utcTime,
        ]);

        $timeStr = Carbon::parse($sale->fresh()->created_at)->setTimezone('Asia/Manila')->format('H:i:s');
        $this->assertEquals('09:00:00', $timeStr);
        $this->assertGreaterThanOrEqual('09:00:00', $timeStr);
        $this->assertLessThanOrEqual('19:00:00', $timeStr);
    }

    /**
     * 7. Test a sales timestamp at exactly 07:00:00 PM (19:00:00 inclusive upper bound).
     */
    public function test_07_sales_timestamp_at_exactly_19_00_00_pm_is_valid(): void
    {
        $product = $this->createProduct('Gyoza', 80.0);
        $manilaTime = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-15 19:00:00', 'Asia/Manila');
        $utcTime = $manilaTime->copy()->setTimezone('UTC');

        $sale = $this->createSale([
            'order_number' => 'POS-SC-20260915-190000-TEST',
            'subtotal' => 80.00,
            'total' => 80.00,
            'paid_amount' => 80.00,
            'created_at' => $utcTime,
            'updated_at' => $utcTime,
        ]);

        $timeStr = Carbon::parse($sale->fresh()->created_at)->setTimezone('Asia/Manila')->format('H:i:s');
        $this->assertEquals('19:00:00', $timeStr);
        $this->assertGreaterThanOrEqual('09:00:00', $timeStr);
        $this->assertLessThanOrEqual('19:00:00', $timeStr);
    }

    /**
     * 8. Test detection and correction of timestamp earlier than 09:00 AM.
     */
    public function test_08_timestamp_earlier_than_09_00_am_is_detected_and_corrected(): void
    {
        $product = $this->createProduct('Early Maki', 120.0);
        // 08:30:00 AM in Manila
        $manilaEarly = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-15 08:30:00', 'Asia/Manila');
        $earlyTimestamp = $manilaEarly->copy()->setTimezone('UTC');

        $sale = $this->createSale([
            'order_number' => 'POS-SC-20260915-083000-EARL',
            'subtotal' => 120.00,
            'total' => 120.00,
            'paid_amount' => 120.00,
            'created_at' => $earlyTimestamp,
            'updated_at' => $earlyTimestamp,
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 120.00,
            'subtotal' => 120.00,
            'profit' => 120.00,
            'created_at' => $earlyTimestamp,
            'updated_at' => $earlyTimestamp,
        ]);

        // Run correction command
        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        $corrected = Carbon::parse($sale->fresh()->created_at)->setTimezone('Asia/Manila');
        $correctedTime = $corrected->format('H:i:s');
        $this->assertGreaterThanOrEqual('09:00:00', $correctedTime);
        $this->assertLessThanOrEqual('19:00:00', $correctedTime);
        $this->assertEquals('2026-09-15', $corrected->format('Y-m-d'));
    }

    /**
     * 9. Test detection and correction of timestamp later than 07:00 PM (19:00:00).
     */
    public function test_09_timestamp_later_than_19_00_00_is_detected_and_corrected(): void
    {
        $product = $this->createProduct('Late Maki', 140.0);
        // 21:15:00 in Manila
        $manilaLate = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-15 21:15:00', 'Asia/Manila');
        $lateTimestamp = $manilaLate->copy()->setTimezone('UTC');

        $sale = $this->createSale([
            'order_number' => 'POS-SC-20260915-211500-LATE',
            'subtotal' => 140.00,
            'total' => 140.00,
            'paid_amount' => 140.00,
            'created_at' => $lateTimestamp,
            'updated_at' => $lateTimestamp,
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 140.00,
            'subtotal' => 140.00,
            'profit' => 140.00,
            'created_at' => $lateTimestamp,
            'updated_at' => $lateTimestamp,
        ]);

        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        $corrected = Carbon::parse($sale->fresh()->created_at)->setTimezone('Asia/Manila');
        $correctedTime = $corrected->format('H:i:s');
        $this->assertGreaterThanOrEqual('09:00:00', $correctedTime);
        $this->assertLessThanOrEqual('19:00:00', $correctedTime);
        $this->assertEquals('2026-09-15', $corrected->format('Y-m-d'));
    }

    /**
     * 10. Test that a timestamp never crosses a UTC/local date boundary.
     */
    public function test_10_timestamp_preserves_local_calendar_date(): void
    {
        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Student Meal,1,99,Cash,September 28 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $sale = Sale::where('source_system', 'Loyverse')->latest('id')->first();
        $this->assertNotNull($sale);
        $this->assertEquals('2026-09-28', Carbon::parse($sale->created_at)->setTimezone('Asia/Manila')->format('Y-m-d'));
    }

    /**
     * 11. Test an import retried after successful processing (idempotency, no duplicate records).
     */
    public function test_11_import_retried_with_skip_duplicates_does_not_create_duplicates(): void
    {
        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Student Meal,2,198,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        // Run 1
        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
            '--skip-duplicates' => true,
        ])->assertExitCode(0);

        $salesCountAfterFirst = Sale::count();
        $this->assertEquals(1, $salesCountAfterFirst);

        // Run 2 (retry)
        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
            '--skip-duplicates' => true,
        ])->assertExitCode(0);

        $this->assertEquals(1, Sale::count(), 'Retrying import created duplicate sales');
    }

    /**
     * 12. Test that existing legitimate transactions outside the historical seed batch are untouched.
     */
    public function test_12_existing_legitimate_orders_outside_historical_batch_are_preserved(): void
    {
        $product = $this->createProduct('Authentic Bento', 250.0);

        // Legitimate live order from customer
        $legitimateSale = $this->createSale([
            'order_number' => 'ORD-LIVE-001',
            'type' => 'pickup',
            'subtotal' => 250.00,
            'total' => 250.00,
            'paid_amount' => 250.00,
            'source' => 'web',
            'source_system' => null, // Not Loyverse!
            'created_at' => Carbon::parse('2026-10-01 14:30:00'),
            'updated_at' => Carbon::parse('2026-10-01 14:30:00'),
        ]);

        // Run correction command
        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        $reloaded = Sale::find($legitimateSale->id);
        $this->assertNotNull($reloaded);
        $this->assertEquals('ORD-LIVE-001', $reloaded->order_number);
        $this->assertEquals('2026-10-01 14:30:00', $reloaded->created_at->format('Y-m-d H:i:s'));
    }

    /**
     * 13. Test that seed-created unauthorized products are safely removed along with dependent test records.
     */
    public function test_13_unauthorized_seed_product_and_dependent_sale_are_safely_removed(): void
    {
        // Simulate previous erroneous seed creating Torched Ham Platter
        $unauthProduct = Product::create([
            'id' => 121,
            'name' => 'Torched Ham Platter',
            'selling_price' => 999.00,
            'cost_price' => 0.0,
            'unit' => 'pcs',
            'created_at' => '2026-10-11 13:04:50',
        ]);

        $unauthSale = $this->createSale([
            'order_number' => 'POS-SC-20260920-120951-TEST',
            'subtotal' => 999.00,
            'total' => 999.00,
            'paid_amount' => 999.00,
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => Carbon::parse('2026-09-20 12:09:51'),
            'updated_at' => Carbon::parse('2026-09-20 12:09:51'),
        ]);

        SaleItem::create([
            'sale_id' => $unauthSale->id,
            'product_id' => $unauthProduct->id,
            'quantity' => 1,
            'unit_price' => 999.00,
            'subtotal' => 999.00,
            'profit' => 999.00,
            'created_at' => '2026-09-20 12:09:51',
            'updated_at' => '2026-09-20 12:09:51',
        ]);

        // Run correction
        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        // Verify unauthorized product and sale were removed
        $this->assertDatabaseMissing('products', ['id' => 121]);
        $this->assertDatabaseMissing('sales', ['id' => $unauthSale->id]);
        $this->assertDatabaseMissing('sale_items', ['product_id' => 121]);
    }

    /**
     * 14. Test that a branch mapping that cannot be resolved safely rejects the row.
     */
    public function test_14_unresolvable_branch_mapping_is_safely_rejected(): void
    {
        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Unknown Mysterious Branch,Student Meal,1,99,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(1);

        $this->assertDatabaseMissing('sales', ['total' => 99]);
    }

    /**
     * 15. Test that Sta. Cruz sales and daily attendance shifts are attributed to Cindy Masangkay.
     */
    public function test_15_sta_cruz_sales_and_shifts_are_attributed_to_cindy_masangkay(): void
    {
        $cindy = User::create([
            'name' => 'Cindy Masangkay',
            'email' => 'mmasangkaycindy750@gmail.com',
            'role' => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
            'password' => bcrypt('secret'),
        ]);

        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Sta Cruz,Student Meal,1,99,Cash,September 15 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $sale = Sale::where('source_system', 'Loyverse')->first();
        $this->assertNotNull($sale);
        $this->assertEquals($cindy->id, $sale->user_id);
        $this->assertEquals($this->staCruzBranch->id, $sale->branch_id);

        $shift = CashierShift::where('branch_id', $this->staCruzBranch->id)->first();
        $this->assertNotNull($shift);
        $this->assertEquals($cindy->id, $shift->cashier_id);
        $this->assertEquals('1500.00', number_format($shift->opening_balance, 2, '.', ''));
        $this->assertEquals('closed', $shift->status);
    }

    /**
     * 16. Test that Victoria sales and attendance shifts are attributed to verified Victoria cashier.
     */
    public function test_16_victoria_sales_and_shifts_are_attributed_to_victoria_cashier(): void
    {
        $vicBranch = Branch::create([
            'id' => 1,
            'name' => 'Maki Desu Victoria',
            'code' => 'VIC',
            'address' => 'Victoria, Laguna',
            'latitude' => 14.2280,
            'longitude' => 121.3280,
            'delivery_radius_km' => 10,
        ]);

        $vicCashier = User::create([
            'name' => 'Victoria',
            'email' => 'victoria@gmail.com',
            'role' => 'cashier',
            'branch_id' => $vicBranch->id,
            'password' => bcrypt('secret'),
            'account_status' => 'active',
        ]);

        $product = $this->createProduct('Student Meal', 99.0);

        $csv = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
             . "Victoria,Student Meal,1,99,Cash,September 16 2026\n";
        file_put_contents($this->tempCsvPath, $csv);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
        ])->assertExitCode(0);

        $sale = Sale::where('branch_id', $vicBranch->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals($vicCashier->id, $sale->user_id);

        $shift = CashierShift::where('branch_id', $vicBranch->id)->first();
        $this->assertNotNull($shift);
        $this->assertEquals($vicCashier->id, $shift->cashier_id);
        $this->assertEquals('closed', $shift->status);
    }

    /**
     * 17. Test that cashier shift covers all sales on that date and remains within 9am-7pm Manila window.
     */
    public function test_17_cashier_shift_covers_all_sales_activity_within_nine_to_seven_window(): void
    {
        $cindy = User::create([
            'name' => 'Cindy Masangkay',
            'email' => 'cindy.test@example.com',
            'role' => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
            'password' => bcrypt('secret'),
        ]);

        $product = $this->createProduct('Student Meal', 99.0);

        // First sale at 09:30 AM Manila (01:30 UTC), second sale at 06:30 PM Manila (10:30 UTC)
        $t1 = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-20 09:30:00', 'Asia/Manila')->setTimezone('UTC');
        $t2 = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-20 18:30:00', 'Asia/Manila')->setTimezone('UTC');

        $s1 = Sale::create([
            'order_number' => 'POS-SC-20260920-093000-AAAA',
            'user_id' => 1,
            'branch_id' => $this->staCruzBranch->id,
            'type' => 'dine-in',
            'subtotal' => 99.00,
            'total' => 99.00,
            'paid_amount' => 99.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => $t1,
            'updated_at' => $t1,
        ]);
        SaleItem::create([
            'sale_id' => $s1->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 99.00,
            'subtotal' => 99.00,
            'profit' => 99.00,
            'created_at' => $t1,
            'updated_at' => $t1,
        ]);

        $s2 = Sale::create([
            'order_number' => 'POS-SC-20260920-183000-BBBB',
            'user_id' => 1,
            'branch_id' => $this->staCruzBranch->id,
            'type' => 'dine-in',
            'subtotal' => 99.00,
            'total' => 99.00,
            'paid_amount' => 99.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => $t2,
            'updated_at' => $t2,
        ]);
        SaleItem::create([
            'sale_id' => $s2->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 99.00,
            'subtotal' => 99.00,
            'profit' => 99.00,
            'created_at' => $t2,
            'updated_at' => $t2,
        ]);

        // Run correction command
        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        // Reload sales: must now be attributed to Cindy Masangkay
        $reloadedS1 = Sale::find($s1->id);
        $reloadedS2 = Sale::find($s2->id);
        $this->assertEquals($cindy->id, $reloadedS1->user_id);
        $this->assertEquals($cindy->id, $reloadedS2->user_id);

        // Find shift: must cover both sales
        $shift = CashierShift::where('branch_id', $this->staCruzBranch->id)->first();
        $this->assertNotNull($shift);
        $this->assertEquals($cindy->id, $shift->cashier_id);
        $this->assertTrue($shift->opened_at <= $reloadedS1->created_at, "Shift opened_at must be <= first sale");
        $this->assertTrue($shift->closed_at >= $reloadedS2->created_at, "Shift closed_at must be >= last sale");

        // Verify shift hours in Manila are 09:00:00 to 19:00:00
        $openManila = $shift->opened_at->copy()->setTimezone('Asia/Manila')->format('H:i:s');
        $closeManila = $shift->closed_at->copy()->setTimezone('Asia/Manila')->format('H:i:s');
        $this->assertEquals('09:00:00', $openManila);
        $this->assertEquals('19:00:00', $closeManila);
    }

    /**
     * 18. Test that duplicate seed shifts are consolidated while real operational shifts are preserved.
     */
    public function test_18_duplicate_seed_shifts_are_deduplicated_while_real_operational_shifts_are_preserved(): void
    {
        $cindy = User::create([
            'name' => 'Cindy Masangkay',
            'email' => 'cindy.shift@example.com',
            'role' => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
            'password' => bcrypt('secret'),
        ]);

        $product = $this->createProduct('Student Meal', 99.0);

        $tSale = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-25 12:00:00', 'Asia/Manila')->setTimezone('UTC');
        $sale = Sale::create([
            'order_number' => 'POS-SC-20260925-120000-CCCC',
            'user_id' => $cindy->id,
            'branch_id' => $this->staCruzBranch->id,
            'type' => 'dine-in',
            'subtotal' => 99.00,
            'total' => 99.00,
            'paid_amount' => 99.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => $tSale,
            'updated_at' => $tSale,
        ]);
        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 99.00,
            'subtotal' => 99.00,
            'profit' => 99.00,
            'created_at' => $tSale,
            'updated_at' => $tSale,
        ]);

        // Real operational shift on that day (e.g. created live, open, notes is null)
        $realShift = CashierShift::create([
            'branch_id' => $this->staCruzBranch->id,
            'cashier_id' => $cindy->id,
            'opening_balance' => 500.00,
            'status' => 'open',
            'opened_at' => Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-25 14:00:00', 'Asia/Manila')->setTimezone('UTC'),
            'notes' => null,
        ]);

        // Two duplicate historical seed shifts from flawed previous runs
        $dupShift1 = CashierShift::create([
            'branch_id' => $this->staCruzBranch->id,
            'cashier_id' => 1,
            'opening_balance' => 1500.00,
            'status' => 'closed',
            'opened_at' => Carbon::parse('2026-09-25 10:00:00'),
            'closed_at' => Carbon::parse('2026-09-25 19:00:00'),
            'notes' => 'Daily shift logged with ₱1,500 cash drawer opening float',
        ]);
        $dupShift2 = CashierShift::create([
            'branch_id' => $this->staCruzBranch->id,
            'cashier_id' => 1,
            'opening_balance' => 1500.00,
            'status' => 'closed',
            'opened_at' => Carbon::parse('2026-09-25 09:00:00'),
            'closed_at' => Carbon::parse('2026-09-25 19:00:00'),
            'notes' => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00)',
        ]);

        // Run correction command
        $this->artisan('makidesu:correct-historical-sales-and-catalog')
            ->assertExitCode(0);

        // 1. Real operational shift MUST still exist untouched!
        $this->assertDatabaseHas('cashier_shifts', [
            'id' => $realShift->id,
            'opening_balance' => 500.00,
            'status' => 'open',
        ]);

        // 2. Exactly ONE historical seed shift exists for this date and attributed to Cindy Masangkay
        $startOfDay = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-25 00:00:00', 'Asia/Manila')->setTimezone('UTC');
        $endOfDay = Carbon::createFromFormat('Y-m-d H:i:s', '2026-09-25 23:59:59', 'Asia/Manila')->setTimezone('UTC');

        $historicalShifts = CashierShift::where('branch_id', $this->staCruzBranch->id)
            ->whereBetween('opened_at', [$startOfDay, $endOfDay])
            ->where('opening_balance', 1500.00)
            ->get();

        $this->assertCount(1, $historicalShifts);
        $this->assertEquals($cindy->id, $historicalShifts->first()->cashier_id);
    }
}
