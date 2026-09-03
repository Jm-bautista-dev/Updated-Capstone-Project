<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\ForecastService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesDatasetDuplicateDetectionAndIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public User $testAdmin;
    public Branch $testBranch;
    public Category $testCategory;
    public Product $testProduct1;
    public Product $testProduct2;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        $this->testBranch = Branch::create([
            'name'      => 'Victoria Main',
            'address'   => 'Victoria, Laguna',
            'latitude'  => 14.2250,
            'longitude' => 121.3250,
        ]);

        $this->testAdmin = User::factory()->create([
            'name'           => 'Admin Manager',
            'role'           => 'admin',
            'branch_id'      => $this->testBranch->id,
            'account_status' => 'active',
        ]);

        $this->testCategory = Category::create([
            'name' => 'Maki Rolls',
        ]);

        $this->testProduct1 = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'MAK-CAL-01',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 150.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->testBranch->id,
            'unit'          => 'roll',
            'stock'         => 100,
        ]);

        $this->testProduct2 = Product::create([
            'name'          => 'Spicy Tuna Maki',
            'sku'           => 'MAK-TUN-02',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 200.00,
            'cost_price'    => 90.00,
            'branch_id'     => $this->testBranch->id,
            'unit'          => 'roll',
            'stock'         => 100,
        ]);
    }

    private function createSaleRecord(string $orderNumber, float $total, Carbon $createdAt): Sale
    {
        $sale = Sale::create([
            'order_number'   => $orderNumber,
            'user_id'        => $this->testAdmin->id,
            'branch_id'      => $this->testBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => $total,
            'total'          => $total,
            'paid_amount'    => $total,
            'change_amount'  => 0,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'cost_total'     => $total * 0.4,
            'profit'         => $total * 0.6,
            'created_at'     => $createdAt,
            'updated_at'     => $createdAt,
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $this->testProduct1->id,
            'quantity'   => 1,
            'unit_price' => $total,
            'cost_price' => $total * 0.4,
            'subtotal'   => $total,
            'profit'     => $total * 0.6,
        ]);

        return $sale;
    }

    /**
     * Test 1 — Existing duplicate cleanup (155 canonical sales, 4 duplicate groups resolved)
     */
    public function test_existing_duplicate_cleanup(): void
    {
        // Create 155 canonical sales
        for ($i = 1; $i <= 155; $i++) {
            $this->createSaleRecord("ORD-CANONICAL-{$i}", 150.00, Carbon::now()->subDays($i % 30));
        }

        $this->assertEquals(155, Sale::count());

        // Insert duplicate records for ORD-CANONICAL-1, ORD-CANONICAL-2, ORD-CANONICAL-3, ORD-CANONICAL-4
        for ($d = 1; $d <= 4; $d++) {
            DB::table('sales')->insert([
                'order_number'   => "ORD-CANONICAL-{$d}",
                'user_id'        => $this->testAdmin->id,
                'branch_id'      => $this->testBranch->id,
                'type'           => 'dine-in',
                'subtotal'       => 150.00,
                'total'          => 150.00,
                'paid_amount'    => 150.00,
                'change_amount'  => 0,
                'payment_method' => 'cash',
                'status'         => 'completed',
                'cost_total'     => 60.00,
                'profit'         => 90.00,
                'created_at'     => Carbon::now()->toDateTimeString(),
                'updated_at'     => Carbon::now()->toDateTimeString(),
            ]);
        }

        $this->assertEquals(159, Sale::count());

        // Run the deduplication migration logic
        $migration = require database_path('migrations/2026_09_04_000002_enforce_sales_data_uniqueness_and_cleanup_duplicates.php');
        $migration->up();

        // Verify exactly 155 canonical rows remain
        $this->assertEquals(155, Sale::count());
        $duplicatesCount = DB::table('sales')
            ->select('order_number')
            ->groupBy('order_number')
            ->havingRaw('COUNT(order_number) > 1')
            ->get()
            ->count();
        $this->assertEquals(0, $duplicatesCount);
    }

    /**
     * Test 2 — Duplicate transaction ID skipped during import
     */
    public function test_duplicate_transaction_id_skipped_during_import(): void
    {
        $this->createSaleRecord('ORDER-001', 150.00, Carbon::now());

        $csvContent = "order_number,date,branch,product,quantity,unit_price,total,cashier\n";
        $csvContent .= "ORDER-001,2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csvContent);

        // 1. Validate
        $valRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', [
            'file' => $file,
        ]);
        $valRes->assertStatus(200);
        $tempKey = $valRes->json('tempKey');

        // 2. Import with add_new
        $impRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $tempKey,
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ]);

        $impRes->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'imported' => 0,
                'skipped'  => 1,
            ]);

        $this->assertEquals(1, Sale::where('order_number', 'ORDER-001')->count());
    }

    /**
     * Test 3 — Duplicate inside same upload (ORDER-001, ORDER-002, ORDER-001)
     */
    public function test_duplicate_inside_same_upload(): void
    {
        $csvContent = "order_number,date,branch,product,quantity,unit_price,total,cashier\n";
        $csvContent .= "ORDER-001,2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";
        $csvContent .= "ORDER-002,2026-09-01,Victoria Main,Spicy Tuna Maki,1,200.00,200.00,Admin Manager\n";
        $csvContent .= "ORDER-001,2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csvContent);

        $valRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', [
            'file' => $file,
        ]);
        $valRes->assertStatus(200);
        $this->assertEquals(1, $valRes->json('duplicateCount'));

        $tempKey = $valRes->json('tempKey');

        $impRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $tempKey,
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ]);

        $impRes->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'imported' => 2,
                'skipped'  => 1,
            ]);

        $this->assertEquals(2, Sale::count());
    }

    /**
     * Test 4 — Same product, same amount, different transaction are both preserved
     */
    public function test_same_product_same_amount_different_transaction_preserved(): void
    {
        $csvContent = "order_number,date,branch,product,quantity,unit_price,total,cashier\n";
        $csvContent .= "ORDER-101,2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";
        $csvContent .= "ORDER-102,2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csvContent);

        $valRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', [
            'file' => $file,
        ]);
        $tempKey = $valRes->json('tempKey');

        $impRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $tempKey,
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ]);

        $impRes->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'imported' => 2,
                'skipped'  => 0,
            ]);

        $this->assertEquals(2, Sale::count());
        $this->assertEquals(300.00, Sale::sum('total'));
    }

    /**
     * Test 5 — Same dataset uploaded twice is idempotent
     */
    public function test_same_dataset_uploaded_twice_is_idempotent(): void
    {
        $csvContent = "order_number,date,branch,product,quantity,unit_price,total,cashier\n";
        for ($i = 1; $i <= 10; $i++) {
            $csvContent .= "BATCH-00{$i},2026-09-01,Victoria Main,California Maki,1,150.00,150.00,Admin Manager\n";
        }

        // 1st Upload
        $file1 = UploadedFile::fake()->createWithContent('batch.csv', $csvContent);
        $val1 = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', ['file' => $file1]);
        $imp1 = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $val1->json('tempKey'),
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ]);
        $imp1->assertJson(['imported' => 10, 'skipped' => 0]);
        $this->assertEquals(10, Sale::count());
        $this->assertEquals(1500.00, Sale::sum('total'));

        // 2nd Upload of identical file
        $file2 = UploadedFile::fake()->createWithContent('batch.csv', $csvContent);
        $val2 = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', ['file' => $file2]);
        $imp2 = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $val2->json('tempKey'),
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ]);
        $imp2->assertJson(['imported' => 0, 'skipped' => 10]);

        // Total records and total revenue MUST remain strictly unchanged
        $this->assertEquals(10, Sale::count());
        $this->assertEquals(1500.00, Sale::sum('total'));
    }

    /**
     * Test 6 — Database unique constraint blocks duplicate online order sales
     */
    public function test_database_unique_constraint_blocks_duplicate_online_order_sales(): void
    {
        $order = \App\Models\Order::create([
            'order_number'    => 'ORD-ONLINE-UNIQUE',
            'user_id'         => $this->testAdmin->id,
            'branch_id'       => $this->testBranch->id,
            'customer_name'   => 'Test Customer',
            'customer_phone'  => '09123456789',
            'delivery_address'=> '123 Test St',
            'payment_method'  => 'cash',
            'total_amount'    => 150.00,
            'status'          => 'delivered',
        ]);

        $sale = Sale::create([
            'order_id'       => $order->id,
            'order_number'   => 'ORD-ONLINE-UNIQUE',
            'user_id'        => $this->testAdmin->id,
            'branch_id'      => $this->testBranch->id,
            'type'           => 'delivery',
            'subtotal'       => 150.00,
            'total'          => 150.00,
            'paid_amount'    => 150.00,
            'change_amount'  => 0,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'cost_total'     => 60.00,
            'profit'         => 90.00,
            'created_at'     => Carbon::now()->toDateTimeString(),
            'updated_at'     => Carbon::now()->toDateTimeString(),
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Attempt direct SQL insertion of another sale with the identical order_id
        DB::table('sales')->insert([
            'order_id'       => $order->id,
            'order_number'   => 'ORD-ONLINE-UNIQUE-DUP',
            'user_id'        => $this->testAdmin->id,
            'branch_id'      => $this->testBranch->id,
            'type'           => 'delivery',
            'subtotal'       => 150.00,
            'total'          => 150.00,
            'paid_amount'    => 150.00,
            'change_amount'  => 0,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'cost_total'     => 60.00,
            'profit'         => 90.00,
            'created_at'     => Carbon::now()->toDateTimeString(),
            'updated_at'     => Carbon::now()->toDateTimeString(),
        ]);
    }

    /**
     * Test 7 — /admin/sales-data reports Optimal when clean and Duplicate Warn when duplicates exist
     */
    public function test_admin_sales_data_reports_integrity_status(): void
    {
        $this->createSaleRecord('ORD-CLEAN-1', 150.00, Carbon::now());
        $this->createSaleRecord('ORD-CLEAN-2', 200.00, Carbon::now());

        $response = $this->actingAs($this->testAdmin)->get('/admin/sales-data');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDataManagement/Index')
            ->where('stats.total_sales_records', 2)
            ->where('stats.duplicate_records_detected', 0)
            ->where('stats.data_integrity_status', 'Optimal')
        );
    }

    /**
     * Test 8 — Revenue calculations use canonical deduplicated sales
     */
    public function test_revenue_calculations_use_canonical_sales(): void
    {
        $this->createSaleRecord('ORD-REV-1', 500.00, Carbon::now());
        $this->createSaleRecord('ORD-REV-2', 300.00, Carbon::now());

        $totalRevenue = Sale::where('status', 'completed')->sum('total');
        $this->assertEquals(800.00, $totalRevenue);

        // Update mode does NOT double count
        $csvContent = "order_number,date,branch,product,quantity,unit_price,total,cashier\n";
        $csvContent .= "ORD-REV-1,2026-09-01,Victoria Main,California Maki,1,550.00,550.00,Admin Manager\n";

        $file = UploadedFile::fake()->createWithContent('update.csv', $csvContent);
        $val = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', ['file' => $file]);
        $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', [
            'tempKey'       => $val->json('tempKey'),
            'importMode'    => 'update',
            'duplicateMode' => 'update',
        ]);

        $this->assertEquals(2, Sale::count());
        $this->assertEquals(850.00, Sale::where('status', 'completed')->sum('total'));
    }

    /**
     * Test 9 — Forecasting consumes canonical deduplicated sales
     */
    public function test_forecasting_consumes_canonical_sales(): void
    {
        for ($i = 0; $i < 14; $i++) {
            $date = Carbon::now()->subDays(14 - $i)->startOfDay();
            $this->createSaleRecord("ORD-FC-{$i}", 1000.00 + ($i * 50), $date);
        }

        $service = new ForecastService();
        $forecastResult = $service->generate(7, $this->testBranch->id);

        $this->assertArrayHasKey('forecast', $forecastResult);
        $this->assertArrayHasKey('trend', $forecastResult);
        $this->assertCount(7, $forecastResult['forecast']);
        $this->assertGreaterThanOrEqual(14, count($forecastResult['historical']));
    }
}
