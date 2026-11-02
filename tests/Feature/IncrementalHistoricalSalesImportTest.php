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

class IncrementalHistoricalSalesImportTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoriaBranch;
    protected Branch $staCruzBranch;
    protected User $victoriaCashier;
    protected User $cindyCashier;
    protected Product $studentMeal;
    protected Product $caliMaki;
    protected string $tempVicCsv;
    protected string $tempScCsv;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoriaBranch = Branch::create([
            'id' => 1,
            'name' => 'Maki Desu Victoria',
            'code' => 'VIC',
            'address' => 'Victoria, Laguna',
            'latitude' => 14.2200,
            'longitude' => 121.3200,
            'delivery_radius_km' => 10,
        ]);

        $this->staCruzBranch = Branch::create([
            'id' => 2,
            'name' => 'Maki Desu Sta Cruz',
            'code' => 'SC',
            'address' => 'Sta Cruz, Laguna',
            'latitude' => 14.2800,
            'longitude' => 121.4150,
            'delivery_radius_km' => 10,
        ]);

        $this->victoriaCashier = User::factory()->create([
            'name' => 'Victoria Cashier',
            'email' => 'cashier.vic@makidesu.test',
            'role' => 'cashier',
            'branch_id' => $this->victoriaBranch->id,
        ]);

        $this->cindyCashier = User::factory()->create([
            'name' => 'Cindy Masangkay',
            'email' => 'cindy.masangkay@makidesu.test',
            'role' => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
        ]);

        $cat = Category::create([
            'id' => 1,
            'name' => 'Main Meals',
            'description' => 'Meals',
        ]);

        $this->studentMeal = Product::create([
            'id' => 32,
            'name' => 'Student Meal',
            'selling_price' => 99.00,
            'cost_price' => 50.00,
            'unit' => 'pcs',
            'category_id' => $cat->id,
        ]);

        $this->caliMaki = Product::create([
            'id' => 38,
            'name' => 'California Maki (Bento)',
            'selling_price' => 269.00,
            'cost_price' => 150.00,
            'unit' => 'pcs',
            'category_id' => $cat->id,
        ]);

        $this->tempVicCsv = sys_get_temp_dir() . '/test_vic_' . uniqid() . '.csv';
        $this->tempScCsv  = sys_get_temp_dir() . '/test_sc_' . uniqid() . '.csv';
    }

    protected function tearDown(): void
    {
        if (file_exists($this->tempVicCsv)) {
            @unlink($this->tempVicCsv);
        }
        if (file_exists($this->tempScCsv)) {
            @unlink($this->tempScCsv);
        }
        parent::tearDown();
    }

    /**
     * Test 1: Additive import preserves previous sales records.
     */
    public function test_01_import_is_additive_and_preserves_existing_sales(): void
    {
        // Create an existing legitimate sale from previous month
        $priorSale = Sale::create([
            'order_number' => 'POS-VIC-20260910-101500-PRIO',
            'user_id' => $this->victoriaCashier->id,
            'branch_id' => $this->victoriaBranch->id,
            'type' => 'dine-in',
            'subtotal' => 99.00,
            'total' => 99.00,
            'paid_amount' => 99.00,
            'payment_method' => 'cash',
            'status' => 'completed',
            'source' => 'pos',
            'source_system' => 'Loyverse',
            'created_at' => Carbon::parse('2026-09-10 10:15:00', 'Asia/Manila')->setTimezone('UTC'),
            'updated_at' => Carbon::parse('2026-09-10 10:15:00', 'Asia/Manila')->setTimezone('UTC'),
        ]);

        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Student Meal,2,₱198,Cash,October 15 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,Student Meal,3,₱297,Cash,October 15 2026\n");

        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        // Prior sale must remain completely untouched
        $this->assertDatabaseHas('sales', [
            'id' => $priorSale->id,
            'order_number' => 'POS-VIC-20260910-101500-PRIO',
            'total' => 99.00,
        ]);

        // Total sales is now 3 (1 prior + 1 new Vic + 1 new SC)
        $this->assertEquals(3, Sale::count());
    }

    /**
     * Test 2: Idempotent re-import does not duplicate records.
     */
    public function test_02_idempotency_prevents_duplicate_records_on_reimport(): void
    {
        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Student Meal,2,₱198,Cash,October 15 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,Student Meal,3,₱297,Cash,October 15 2026\n");

        // First import
        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        $initialCount = Sale::count();
        $this->assertEquals(2, $initialCount);

        // Second import of same files
        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        // Count must remain exactly 2
        $this->assertEquals($initialCount, Sale::count());
    }

    /**
     * Test 3: Cashier attribution: Victoria to Victoria Cashier, Sta. Cruz to Cindy Masangkay.
     */
    public function test_03_cashier_attribution_is_branch_specific(): void
    {
        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Student Meal,1,₱99,Cash,October 16 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,California Maki (Bento),1,₱269,Cash,October 16 2026\n");

        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        $vicSale = Sale::where('branch_id', $this->victoriaBranch->id)->first();
        $this->assertNotNull($vicSale);
        $this->assertEquals($this->victoriaCashier->id, $vicSale->user_id);

        $scSale = Sale::where('branch_id', $this->staCruzBranch->id)->first();
        $this->assertNotNull($scSale);
        $this->assertEquals($this->cindyCashier->id, $scSale->user_id);
    }

    /**
     * Test 4: All generated missing timestamps are strictly 09:00 AM to 07:00 PM Manila.
     */
    public function test_04_timestamps_strictly_within_nine_to_seven_window(): void
    {
        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Student Meal,1,₱99,Cash,October 17 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,Student Meal,1,₱99,Cash,October 17 2026\n");

        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        foreach (Sale::all() as $sale) {
            $manilaTime = Carbon::parse($sale->created_at)->setTimezone('Asia/Manila')->format('H:i:s');
            $this->assertGreaterThanOrEqual('09:00:00', $manilaTime);
            $this->assertLessThanOrEqual('19:00:00', $manilaTime);
            $this->assertEquals('2026-10-17', Carbon::parse($sale->created_at)->setTimezone('Asia/Manila')->format('Y-m-d'));
        }
    }

    /**
     * Test 5: Cashier shifts cover sales activity and do not duplicate.
     */
    public function test_05_cashier_shift_covers_workday_and_does_not_duplicate(): void
    {
        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Student Meal,1,₱99,Cash,October 18 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,Student Meal,1,₱99,Cash,October 18 2026\n");

        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        $vicShift = CashierShift::where('branch_id', $this->victoriaBranch->id)->first();
        $this->assertNotNull($vicShift);
        $this->assertEquals($this->victoriaCashier->id, $vicShift->cashier_id);
        $this->assertEquals(1500.00, (float)$vicShift->opening_balance);
        $this->assertEquals(1599.00, (float)$vicShift->closing_balance);
        $this->assertEquals('closed', $vicShift->status);

        $scShift = CashierShift::where('branch_id', $this->staCruzBranch->id)->first();
        $this->assertNotNull($scShift);
        $this->assertEquals($this->cindyCashier->id, $scShift->cashier_id);
        $this->assertEquals(1500.00, (float)$scShift->opening_balance);
        $this->assertEquals(1599.00, (float)$scShift->closing_balance);
        $this->assertEquals('closed', $scShift->status);
    }

    /**
     * Test 6: Unmatched products are safely skipped and no new products are invented.
     */
    public function test_06_unmatched_products_are_skipped_without_inventing_products(): void
    {
        $initialProductCount = Product::count();
        $initialCategoryCount = Category::count();

        // CSV with an uncatalogued product
        file_put_contents($this->tempVicCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nVictoria,Invented Dragon Ramen,1,₱999,Cash,October 19 2026\n");
        file_put_contents($this->tempScCsv, "Branch,Product,Quantity,Total Price ,Payment Method,Date\nSta Cruz,Student Meal,1,₱99,Cash,October 19 2026\n");

        $this->artisan('makidesu:import-incremental-historical-sales', [
            'victoria-file' => $this->tempVicCsv,
            'sta-cruz-file' => $this->tempScCsv,
            '--force' => true,
        ])->assertExitCode(0);

        // Only Sta Cruz valid product was imported
        $this->assertEquals(1, Sale::count());
        $this->assertDatabaseMissing('sales', ['branch_id' => $this->victoriaBranch->id]);

        // No new products or categories created
        $this->assertEquals($initialProductCount, Product::count());
        $this->assertEquals($initialCategoryCount, Category::count());
    }
}

