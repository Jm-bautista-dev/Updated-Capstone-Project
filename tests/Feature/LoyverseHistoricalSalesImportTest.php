<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
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
use Tests\TestCase;

class LoyverseHistoricalSalesImportTest extends TestCase
{
    use RefreshDatabase;

    public User $testAdmin;
    public Branch $branchStaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public Product $prodStudentMeal;
    public Product $prodMangoCali;
    public Product $prodClassicCali;
    public Product $prodKaniSalad;
    public Product $prodCrazyTenders;
    public Product $prodCaliforniaMaki;
    public Product $prodCaliforniaMakiLarge;
    public Ingredient $testIngredient;
    public IngredientStock $testIngredientStock;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');

        // Create Branches
        $this->branchVictoria = Branch::create([
            'id'        => 1,
            'name'      => 'Maki Desu Victoria',
            'code'      => 'VIC',
            'address'   => 'Victoria, Laguna',
            'latitude'  => 14.2250,
            'longitude' => 121.3250,
        ]);

        $this->branchStaCruz = Branch::create([
            'id'        => 2,
            'name'      => 'Maki Desu Sta Cruz',
            'code'      => 'SC',
            'address'   => 'Sta Cruz, Laguna',
            'latitude'  => 14.2800,
            'longitude' => 121.4150,
        ]);

        // Create Admin
        $this->testAdmin = User::factory()->create([
            'name'           => 'Admin Manager',
            'role'           => 'admin',
            'branch_id'      => $this->branchStaCruz->id,
            'account_status' => 'active',
        ]);

        // Create Category
        $this->testCategory = Category::create([
            'name' => 'Meals & Rolls',
        ]);

        // Create Products matching prompt's Loyverse examples
        $this->prodStudentMeal = Product::create([
            'name'          => 'Student Meal',
            'sku'           => 'MEAL-STU',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 99.00,
            'cost_price'    => 40.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 150,
        ]);

        $this->prodMangoCali = Product::create([
            'name'          => 'Mango Cali Maki (4pc)',
            'sku'           => 'MAK-MNG-4',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 279.00,
            'cost_price'    => 110.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 120,
        ]);

        $this->prodClassicCali = Product::create([
            'name'          => 'Classic California Maki (8pcs)',
            'sku'           => 'MAK-CAL-8',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 189.00,
            'cost_price'    => 75.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 100,
        ]);

        $this->prodKaniSalad = Product::create([
            'name'          => 'Kani Salad (Solo)',
            'sku'           => 'SAL-KAN-S',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 179.00,
            'cost_price'    => 65.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 80,
        ]);

        $this->prodCrazyTenders = Product::create([
            'name'          => 'Crazy Tenders Overload (Bento)',
            'sku'           => 'BTO-CRZ-T',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 329.00,
            'cost_price'    => 130.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 50,
        ]);

        // Products for ambiguity testing
        $this->prodCaliforniaMaki = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'MAK-CAL-REG',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 160.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 100,
        ]);

        $this->prodCaliforniaMakiLarge = Product::create([
            'name'          => 'California Maki Large',
            'sku'           => 'MAK-CAL-LRG',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 250.00,
            'cost_price'    => 100.00,
            'branch_id'     => $this->branchStaCruz->id,
            'unit'          => 'order',
            'stock'         => 100,
        ]);

        // Create Ingredient and IngredientStock to test inventory protection
        $this->testIngredient = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'kg',
            'branch_id' => $this->branchStaCruz->id,
        ]);

        // Retrieve auto-seeded IngredientStock and set stock level
        $this->testIngredientStock = IngredientStock::where('ingredient_id', $this->testIngredient->id)
            ->where('branch_id', $this->branchStaCruz->id)
            ->first();
        $this->testIngredientStock->update([
            'stock'           => 500.00,
            'low_stock_level' => 50.00,
        ]);
    }

    private function validateAndImport(string $csvContent, array $importParams = []): array
    {
        $file = UploadedFile::fake()->createWithContent('loyverse_export.csv', $csvContent);

        $valRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', array_merge([
            'file' => $file,
        ], $importParams['validatePayload'] ?? []));

        if ($valRes->status() !== 200) {
            return [
                'valStatus' => $valRes->status(),
                'valJson'   => $valRes->json(),
                'impStatus' => null,
                'impJson'   => null,
            ];
        }

        $tempKey = $valRes->json('tempKey');

        $impPayload = array_merge([
            'tempKey'       => $tempKey,
            'importMode'    => 'add_new',
            'duplicateMode' => 'skip',
        ], $importParams['importPayload'] ?? []);

        $impRes = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/import', $impPayload);

        return [
            'valStatus' => $valRes->status(),
            'valJson'   => $valRes->json(),
            'impStatus' => $impRes->status(),
            'impJson'   => $impRes->json(),
        ];
    }

    /**
     * TEST 1 — Normal import with 5 Loyverse columns
     */
    public function test_1_normal_import_5_columns(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,1782,September 9 2026\n";
        $csv .= "Sta Cruz,Mango Cali Maki (4pc),3,837,September 9 2026\n";
        $csv .= "Sta Cruz,Classic California Maki (8pcs),2,378,September 9 2026\n";
        $csv .= "Sta Cruz,Kani Salad (Solo),2,358,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(4, $res['valJson']['validRowsCount']);
        $this->assertEquals(0, $res['valJson']['invalidRowsCount']);

        $this->assertEquals(200, $res['impStatus']);
        $this->assertTrue($res['impJson']['success']);
        $this->assertEquals(4, $res['impJson']['imported']);
        $this->assertEquals(4, Sale::count());
        $this->assertEquals(4, SaleItem::count());

        // Verify total price is preserved, not calculated from current price
        $sale1 = Sale::where('total', 1782.00)->first();
        $this->assertNotNull($sale1);
        $this->assertEquals('historical_import', $sale1->source);
        $this->assertEquals('Loyverse', $sale1->source_system);
        $this->assertEquals('2026-09-09', Carbon::parse($sale1->created_at)->format('Y-m-d'));
        $this->assertEquals($this->branchStaCruz->id, $sale1->branch_id);

        $item1 = $sale1->items->first();
        $this->assertEquals($this->prodStudentMeal->id, $item1->product_id);
        $this->assertEquals(18, $item1->quantity);
        $this->assertEquals(99.00, $item1->unit_price);
        $this->assertEquals(1782.00, $item1->subtotal);
        $this->assertEquals(0.00, $item1->cost_price);
    }

    /**
     * TEST 2 — Currency symbol parsing (₱1782 -> 1782.00)
     */
    public function test_2_currency_symbol(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,₱1782,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(1, $res['valJson']['validRowsCount']);
        $this->assertEquals(200, $res['impStatus']);

        $sale = Sale::first();
        $this->assertEquals(1782.00, (float) $sale->total);
    }

    /**
     * TEST 3 — Currency formatting (₱1,782.00 -> 1782.00)
     */
    public function test_3_currency_formatting(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,\"₱1,782.00\",September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(1, $res['valJson']['validRowsCount']);
        $this->assertEquals(200, $res['impStatus']);

        $sale = Sale::first();
        $this->assertEquals(1782.00, (float) $sale->total);
    }

    /**
     * TEST 4 — Plain numeric price (1782 -> 1782.00)
     */
    public function test_4_plain_numeric_price(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,1782,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(1, $res['valJson']['validRowsCount']);
        $this->assertEquals(200, $res['impStatus']);

        $sale = Sale::first();
        $this->assertEquals(1782.00, (float) $sale->total);
    }

    /**
     * TEST 5 — Historical date format ("September 9 2026" -> 2026-09-09)
     */
    public function test_5_historical_date(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,1782,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['impStatus']);
        $sale = Sale::first();
        $this->assertEquals('2026-09-09', Carbon::parse($sale->created_at)->format('Y-m-d'));
        // Does not invent fake time
        $this->assertEquals('00:00:00', Carbon::parse($sale->created_at)->format('H:i:s'));
    }

    /**
     * TEST 6 — Excel date parsing (numeric serial date)
     */
    public function test_6_excel_date(): void
    {
        // 46274 in Excel is 2026-09-09
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,1782,46274\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(1, $res['valJson']['validRowsCount']);
        $this->assertEquals(200, $res['impStatus']);

        $sale = Sale::first();
        $this->assertEquals('2026-09-09', Carbon::parse($sale->created_at)->format('Y-m-d'));
    }

    /**
     * TEST 7 — Unknown branch rejected, no branch auto-created
     */
    public function test_7_unknown_branch(): void
    {
        $initialBranchCount = Branch::count();

        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz 2,Student Meal,18,1782,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(0, $res['valJson']['validRowsCount']);
        $this->assertEquals(1, $res['valJson']['invalidRowsCount']);
        $this->assertStringContainsString("Unknown branch: 'Sta Cruz 2'", $res['valJson']['errors'][0]['errors'][0]);

        // Branch count untouched
        $this->assertEquals($initialBranchCount, Branch::count());
    }

    /**
     * TEST 8 — Unknown product rejected, no product auto-created
     */
    public function test_8_unknown_product(): void
    {
        $initialProductCount = Product::count();

        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Unicorn Roll Deluxe,3,999,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(0, $res['valJson']['validRowsCount']);
        $this->assertEquals(1, $res['valJson']['invalidRowsCount']);
        $this->assertStringContainsString("Product not found: 'Unicorn Roll Deluxe'", $res['valJson']['errors'][0]['errors'][0]);

        // Product count untouched
        $this->assertEquals($initialProductCount, Product::count());
    }

    /**
     * TEST 9 — Ambiguous product requires explicit mapping, does not guess
     */
    public function test_9_ambiguous_product(): void
    {
        // "California Maki Special" does not exist; system must not guess "California Maki"
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,California Maki Special,5,500,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(0, $res['valJson']['validRowsCount']);
        $this->assertEquals(1, $res['valJson']['invalidRowsCount']);
        $this->assertStringContainsString("Product not found: 'California Maki Special'", $res['valJson']['errors'][0]['errors'][0]);

        // Now test with explicit user mapping provided
        $resWithMapping = $this->validateAndImport($csv, [
            'validatePayload' => [
                'productMappings' => ['California Maki Special' => $this->prodCaliforniaMaki->id],
            ],
            'importPayload' => [
                'productMappings' => ['California Maki Special' => $this->prodCaliforniaMaki->id],
            ],
        ]);

        $this->assertEquals(1, $resWithMapping['valJson']['validRowsCount']);
        $this->assertEquals(200, $resWithMapping['impStatus']);
        $this->assertEquals(1, Sale::count());
        $this->assertEquals($this->prodCaliforniaMaki->id, SaleItem::first()->product_id);
    }

    /**
     * TEST 10 — Invalid quantity rejected
     */
    public function test_10_invalid_quantity(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,abc,1782,September 9 2026\n";
        $csv .= "Sta Cruz,Student Meal,-5,1782,September 9 2026\n";
        $csv .= "Sta Cruz,Student Meal,0,1782,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(0, $res['valJson']['validRowsCount']);
        $this->assertEquals(3, $res['valJson']['invalidRowsCount']);
        $this->assertStringContainsString("Invalid quantity", $res['valJson']['errors'][0]['errors'][0]);
    }

    /**
     * TEST 11 — Invalid price rejected (e.g. ₱abc)
     */
    public function test_11_invalid_price(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,₱abc,September 9 2026\n";

        $res = $this->validateAndImport($csv);

        $this->assertEquals(0, $res['valJson']['validRowsCount']);
        $this->assertEquals(1, $res['valJson']['invalidRowsCount']);
        $this->assertStringContainsString("Invalid Total Price on row 2", $res['valJson']['errors'][0]['errors'][0]);
    }

    /**
     * TEST 12 — Missing column (e.g. remove Product) rejected before insertion
     */
    public function test_12_missing_column(): void
    {
        $csv = "Branch,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,18,1782,September 9 2026\n";

        $file = UploadedFile::fake()->createWithContent('missing_col.csv', $csv);

        $res = $this->actingAs($this->testAdmin)->postJson('/admin/sales-data/validate', [
            'file' => $file,
        ]);

        $res->assertStatus(422);
        $this->assertStringContainsString("Missing required column: Product", $res->json('error'));
        $this->assertEquals(0, Sale::count());
    }

    /**
     * TEST 13 — Duplicate import protection (re-importing same file skips duplicates)
     */
    public function test_13_duplicate_import_protection(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,18,1782,September 9 2026\n";
        $csv .= "Sta Cruz,Mango Cali Maki (4pc),3,837,September 9 2026\n";

        // First import
        $res1 = $this->validateAndImport($csv);
        $this->assertEquals(2, $res1['impJson']['imported']);
        $this->assertEquals(0, $res1['impJson']['skipped']);
        $this->assertEquals(2, Sale::count());

        // Second import of the exact same file in add_new mode
        $res2 = $this->validateAndImport($csv, [
            'importPayload' => [
                'importMode'    => 'add_new',
                'duplicateMode' => 'skip',
            ],
        ]);

        $this->assertEquals(0, $res2['impJson']['imported']);
        $this->assertEquals(2, $res2['impJson']['skipped']);
        $this->assertEquals(2, Sale::count()); // Still 2, no double-counting!
    }

    /**
     * TEST 14 — Historical inventory protection (ingredient inventory unchanged)
     */
    public function test_14_historical_inventory_protection(): void
    {
        $initialStock = (float) $this->testIngredientStock->fresh()->stock;

        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,50,4950,September 9 2026\n";

        $res = $this->validateAndImport($csv);
        $this->assertEquals(1, $res['impJson']['imported']);

        // Ingredient stock must remain exactly 500.00
        $finalStock = (float) $this->testIngredientStock->fresh()->stock;
        $this->assertEquals($initialStock, $finalStock);
    }

    /**
     * TEST 15 — Current product stock protection (product stock unchanged)
     */
    public function test_15_current_product_stock_protection(): void
    {
        $initialProductStock = $this->prodStudentMeal->fresh()->stock;

        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,50,4950,September 9 2026\n";

        $res = $this->validateAndImport($csv);
        $this->assertEquals(1, $res['impJson']['imported']);

        // Product stock must remain exactly 150
        $finalProductStock = $this->prodStudentMeal->fresh()->stock;
        $this->assertEquals($initialProductStock, $finalProductStock);
    }

    /**
     * TEST 16 — Live POS protection (no orders, deliveries, pickups, printer jobs)
     */
    public function test_16_live_pos_protection(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,10,990,September 9 2026\n";

        $res = $this->validateAndImport($csv);
        $this->assertEquals(1, $res['impJson']['imported']);

        // Assert no deliveries, orders, print jobs created
        $this->assertEquals(0, DB::table('orders')->count());
        $this->assertEquals(0, DB::table('deliveries')->count());
        $this->assertEquals(0, DB::table('print_jobs')->count());
        $this->assertEquals(0, DB::table('customer_notifications')->count());
    }

    /**
     * TEST 17 — Analytics compatibility (imported rows appear in sales queries)
     */
    public function test_17_analytics_compatibility(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,10,1000,September 9 2026\n";
        $csv .= "Sta Cruz,Mango Cali Maki (4pc),5,1500,September 9 2026\n";

        $res = $this->validateAndImport($csv);
        $this->assertEquals(2, $res['impJson']['imported']);

        // Query sales total as AnalyticsController does
        $totalSales = DB::table('sales')
            ->where('status', 'completed')
            ->sum('total');

        $this->assertEquals(2500.00, (float) $totalSales);

        // Product sales aggregation
        $productTotal = DB::table('sale_items')
            ->where('product_id', $this->prodStudentMeal->id)
            ->sum('subtotal');

        $this->assertEquals(1000.00, (float) $productTotal);
    }

    /**
     * TEST 18 — Forecasting compatibility (imported rows feed ForecastService)
     */
    public function test_18_forecasting_compatibility(): void
    {
        // Seed 14 days of historical sales across dates
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        for ($i = 1; $i <= 14; $i++) {
            $day = str_pad($i, 2, '0', STR_PAD_LEFT);
            $csv .= "Sta Cruz,Student Meal,10,1000,2026-08-{$day}\n";
        }

        $res = $this->validateAndImport($csv);
        $this->assertEquals(14, $res['impJson']['imported']);

        $forecastService = new ForecastService();
        $result = $forecastService->benchmark($this->branchStaCruz->id);

        $this->assertArrayNotHasKey('error', $result);
        $this->assertArrayHasKey('best_model', $result);
        $this->assertArrayHasKey('rankings', $result);
        $this->assertGreaterThanOrEqual(1, count($result['rankings']));
    }

    /**
     * TEST 19 — Branch isolation preserved
     */
    public function test_19_branch_isolation(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        $csv .= "Sta Cruz,Student Meal,10,1000,September 9 2026\n";
        $csv .= "Victoria,Student Meal,5,500,September 9 2026\n";

        $res = $this->validateAndImport($csv);
        $this->assertEquals(2, $res['impJson']['imported']);

        // Check Sta Cruz sales
        $scSales = Sale::where('branch_id', $this->branchStaCruz->id)->get();
        $this->assertEquals(1, $scSales->count());
        $this->assertEquals(1000.00, (float) $scSales->first()->total);

        // Check Victoria sales
        $vicSales = Sale::where('branch_id', $this->branchVictoria->id)->get();
        $this->assertEquals(1, $vicSales->count());
        $this->assertEquals(500.00, (float) $vicSales->first()->total);
    }

    /**
     * TEST 20 — Large import performance and transaction safety
     */
    public function test_20_large_import_performance_and_safety(): void
    {
        $csv = "Branch,Product,Quantity,Total Price,Date\n";
        for ($i = 1; $i <= 120; $i++) {
            $day = ($i % 28) + 1;
            $csv .= "Sta Cruz,Student Meal,2,200,2026-08-{$day}\n";
        }

        $res = $this->validateAndImport($csv);

        $this->assertEquals(200, $res['valStatus']);
        $this->assertEquals(120, $res['valJson']['validRowsCount']);
        $this->assertEquals(200, $res['impStatus']);
        $this->assertEquals(120, $res['impJson']['imported']);
        $this->assertEquals(120, Sale::count());
        $this->assertEquals(120, SaleItem::count());
    }

    /**
     * Downloadable template endpoint test
     */
    public function test_downloadable_template_endpoint(): void
    {
        $res = $this->actingAs($this->testAdmin)->get('/admin/sales-data/template');

        $res->assertStatus(200);
        $res->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $content = $res->getContent();

        // Must contain exactly the 5 required columns
        $this->assertStringStartsWith("Branch,Product,Quantity,Total Price,Date", $content);
        $this->assertStringContainsString("Sta Cruz,Student Meal,18,1782,September 9 2026", $content);
    }

    /**
     * Sales data management index page renders successfully with branches and products
     */
    public function test_admin_sales_data_index_renders_successfully(): void
    {
        $res = $this->actingAs($this->testAdmin)->get('/admin/sales-data');

        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page
            ->component('Admin/SalesDataManagement/Index')
            ->has('branches')
            ->has('products')
            ->has('stats')
        );
    }
}
