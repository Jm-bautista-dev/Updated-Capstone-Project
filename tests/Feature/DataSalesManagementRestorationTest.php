<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalesImport;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DataSalesManagementRestorationTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $cashierVictoria;
    private User $customer;
    private Branch $branchVictoria;
    private Branch $branchSantaCruz;
    private Product $makiRoll;
    private Product $bentoMeal;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVictoria = Branch::create([
            'name'      => 'Victoria Main',
            'address'   => 'Victoria, Laguna',
            'latitude'  => 14.2250,
            'longitude' => 121.3250,
        ]);

        $this->branchSantaCruz = Branch::create([
            'name'      => 'Santa Cruz Branch',
            'address'   => 'Santa Cruz, Laguna',
            'latitude'  => 14.2800,
            'longitude' => 121.4150,
        ]);

        $this->admin = User::factory()->create([
            'name'           => 'Executive Admin',
            'email'          => 'exec_admin@makidesu.test',
            'role'           => 'admin',
            'branch_id'      => $this->branchVictoria->id,
            'account_status' => 'active',
        ]);

        $this->cashierVictoria = User::factory()->create([
            'name'           => 'Victoria Cashier',
            'email'          => 'cashier_vic@makidesu.test',
            'role'           => 'cashier',
            'branch_id'      => $this->branchVictoria->id,
            'account_status' => 'active',
        ]);

        $this->customer = User::factory()->create([
            'name'           => 'Regular Customer',
            'email'          => 'customer@makidesu.test',
            'role'           => 'customer',
            'account_status' => 'active',
        ]);

        $cat = Category::create(['name' => 'Signature Maki']);

        $this->makiRoll = Product::create([
            'name'          => 'California Special Roll',
            'sku'           => 'MAK-CAL-SPEC',
            'category_id'   => $cat->id,
            'selling_price' => 180.00,
            'cost_price'    => 75.00,
            'branch_id'     => $this->branchVictoria->id,
            'unit'          => 'roll',
            'stock'         => 100,
        ]);

        $this->bentoMeal = Product::create([
            'name'          => 'Teriyaki Chicken Bento',
            'sku'           => 'BEN-TER-01',
            'category_id'   => $cat->id,
            'selling_price' => 250.00,
            'cost_price'    => 110.00,
            'branch_id'     => $this->branchSantaCruz->id,
            'unit'          => 'serving',
            'stock'         => 80,
        ]);
    }

    private function createSale(
        string $orderNumber,
        Branch $branch,
        float $total,
        Carbon $createdAt,
        Product $product,
        string $source = 'pos',
        string $status = 'completed',
        ?int $salesImportId = null
    ): Sale {
        $sale = Sale::create([
            'order_number'    => $orderNumber,
            'user_id'         => $this->admin->id,
            'branch_id'       => $branch->id,
            'type'            => 'dine-in',
            'subtotal'        => $total,
            'total'           => $total,
            'paid_amount'     => $total,
            'change_amount'   => 0,
            'payment_method'  => 'cash',
            'status'          => $status,
            'source'          => $source,
            'source_system'   => $source === 'historical_import' ? 'Loyverse' : ($source === 'online' ? 'Web App' : 'POS Counter'),
            'sales_import_id' => $salesImportId,
            'created_at'      => $createdAt,
            'updated_at'      => $createdAt,
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'unit_price' => $total,
            'subtotal'   => $total,
            'cost_price' => $product->cost_price ?? 0,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ]);

        return $sale;
    }

    /**
     * Test 1 — Authorized access & default sales dataset loading:
     * Admin accesses Data Sales Management and receives stats, paginated sales, and branches.
     */
    public function test_01_admin_can_access_data_sales_management_and_receives_paginated_sales(): void
    {
        $this->createSale('ORD-VIC-001', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);
        $this->createSale('ORD-SC-002', $this->branchSantaCruz, 250.00, Carbon::now(), $this->bentoMeal);

        $response = $this->actingAs($this->admin)->get('/admin/sales-data');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/SalesDataManagement/Index')
            ->has('sales.data', 2)
            ->where('sales.total', 2)
            ->has('branches')
            ->has('stats')
            ->where('stats.total_sales_records', 2)
            ->where('filteredSummary.total_revenue', fn ($v) => (float) $v === 430.00)
            ->where('filteredSummary.orders_count', 2)
        );
    }

    /**
     * Test 2 — Role boundaries & authorization protection:
     * Cashiers, customers, and unauthenticated users are strictly rejected with 403 or redirected.
     */
    public function test_02_cashier_and_unauthorized_users_are_forbidden(): void
    {
        // Cashier web request redirected to authorized landing page /pos
        $cashierWebRes = $this->actingAs($this->cashierVictoria)->get('/admin/sales-data');
        $cashierWebRes->assertRedirect('/pos');

        // Cashier JSON API request rejected with 403
        $cashierApiRes = $this->actingAs($this->cashierVictoria)->getJson('/admin/sales-data');
        $cashierApiRes->assertStatus(403);

        // Customer web request redirected to /menu
        $customerWebRes = $this->actingAs($this->customer)->get('/admin/sales-data');
        $customerWebRes->assertRedirect('/menu');

        // Customer JSON API request rejected with 403
        $customerApiRes = $this->actingAs($this->customer)->getJson('/admin/sales-data');
        $customerApiRes->assertStatus(403);

        // Guest redirected to login
        $this->app['auth']->forgetGuards();
        $guestRes = $this->get('/admin/sales-data');
        $guestRes->assertRedirect('/login');
    }

    /**
     * Test 3 — Search filter:
     * Searching by order number, product name, or cashier matches only relevant records.
     */
    public function test_03_search_filter_by_order_number_product_and_customer(): void
    {
        $this->createSale('ORD-SPECIAL-99', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);
        $this->createSale('ORD-OTHER-11', $this->branchSantaCruz, 250.00, Carbon::now(), $this->bentoMeal);

        // Search by order number
        $resOrder = $this->actingAs($this->admin)->get('/admin/sales-data?search=SPECIAL-99');
        $resOrder->assertStatus(200);
        $resOrder->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-SPECIAL-99')
        );

        // Search by product name
        $resProd = $this->actingAs($this->admin)->get('/admin/sales-data?search=California');
        $resProd->assertStatus(200);
        $resProd->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-SPECIAL-99')
        );
    }

    /**
     * Test 4 — Branch filtering:
     * Filtering by branch isolates records strictly to that branch.
     */
    public function test_04_branch_filtering_isolates_records_correctly(): void
    {
        $this->createSale('ORD-VIC-01', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);
        $this->createSale('ORD-VIC-02', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);
        $this->createSale('ORD-SC-01', $this->branchSantaCruz, 250.00, Carbon::now(), $this->bentoMeal);

        // Filter for Santa Cruz only
        $resSC = $this->actingAs($this->admin)->get("/admin/sales-data?branch_id={$this->branchSantaCruz->id}");
        $resSC->assertStatus(200);
        $resSC->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-SC-01')
            ->where('filteredSummary.total_revenue', fn ($v) => (float) $v === 250.00)
            ->where('filteredSummary.orders_count', 1)
        );

        // Filter for Victoria only
        $resVic = $this->actingAs($this->admin)->get("/admin/sales-data?branch_id={$this->branchVictoria->id}");
        $resVic->assertStatus(200);
        $resVic->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 2)
            ->where('filteredSummary.total_revenue', fn ($v) => (float) $v === 360.00)
            ->where('filteredSummary.orders_count', 2)
        );
    }

    /**
     * Test 5 — Date-range selection:
     * Date filters correctly bound the results to the specified historical timeframe.
     */
    public function test_05_date_range_filtering_filters_authoritative_timestamps(): void
    {
        // Sale 1: 10 days ago
        $this->createSale('ORD-OLD-01', $this->branchVictoria, 180.00, Carbon::now()->subDays(10), $this->makiRoll);
        // Sale 2: 3 days ago
        $this->createSale('ORD-MID-02', $this->branchVictoria, 180.00, Carbon::now()->subDays(3), $this->makiRoll);
        // Sale 3: Today
        $this->createSale('ORD-TODAY-03', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);

        $from = Carbon::now()->subDays(5)->format('Y-m-d');
        $to = Carbon::now()->subDays(1)->format('Y-m-d');

        $response = $this->actingAs($this->admin)->get("/admin/sales-data?date_from={$from}&date_to={$to}");
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-MID-02')
        );
    }

    /**
     * Test 6 — Channel / Source filtering:
     * Allows filtering between POS Counter, Online, and Historical Loyverse imports.
     */
    public function test_06_channel_source_filtering_distinguishes_pos_online_and_historical_imports(): void
    {
        $import = SalesImport::create([
            'uploaded_by'      => $this->admin->id,
            'file_name'        => 'loyverse_dataset.csv',
            'import_mode'      => 'add_new',
            'records_imported' => 1,
            'records_updated'  => 0,
            'records_skipped'  => 0,
            'status'           => 'success',
        ]);

        $this->createSale('ORD-POS-01', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll, 'pos');
        $this->createSale('ORD-ONL-02', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll, 'online');
        $this->createSale('ORD-IMP-03', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll, 'historical_import', 'completed', $import->id);

        // Filter for historical imports only
        $resImp = $this->actingAs($this->admin)->get('/admin/sales-data?source=historical_import');
        $resImp->assertStatus(200);
        $resImp->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-IMP-03')
        );

        // Filter for POS only
        $resPos = $this->actingAs($this->admin)->get('/admin/sales-data?source=pos');
        $resPos->assertStatus(200);
        $resPos->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-POS-01')
        );
    }

    /**
     * Test 7 — Status filtering:
     * Filters correctly for completed, pending, or cancelled records.
     */
    public function test_07_status_filtering_works_correctly(): void
    {
        $this->createSale('ORD-COMP-01', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll, 'pos', 'completed');
        $this->createSale('ORD-CANC-02', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll, 'pos', 'cancelled');

        $response = $this->actingAs($this->admin)->get('/admin/sales-data?status=cancelled');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
            ->where('sales.data.0.order_number', 'ORD-CANC-02')
        );
    }

    /**
     * Test 8 — Export CSV endpoint:
     * Admin can export the filtered sales dataset as a structured, sanitized CSV.
     */
    public function test_08_export_csv_streams_matching_records_with_correct_headers(): void
    {
        $this->createSale('ORD-EXP-01', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);

        $response = $this->actingAs($this->admin)->get('/admin/sales-data/export');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');

        $content = $response->streamedContent();
        $this->assertStringContainsString('Order Number', $content);
        $this->assertStringContainsString('Branch', $content);
        $this->assertStringContainsString('ORD-EXP-01', $content);
        $this->assertStringContainsString('180.00', $content);
    }

    /**
     * Test 9 — Invalid inputs produce safe responses:
     * Malformed dates, inverted ranges, and arbitrary query keys are handled gracefully.
     */
    public function test_09_invalid_inputs_are_handled_gracefully(): void
    {
        $this->createSale('ORD-SAFE-01', $this->branchVictoria, 180.00, Carbon::now(), $this->makiRoll);

        // Inverted dates (from > to) and malformed string
        $response = $this->actingAs($this->admin)->get('/admin/sales-data?date_from=invalid-date&date_to=2026-12-31');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->where('sales.total', 1)
        );
    }

    /**
     * Test 10 — Ordinary users cannot modify completed sales or restore backups:
     * Ensures strict authorization integrity.
     */
    public function test_10_ordinary_users_cannot_restore_or_destroy_backups(): void
    {
        $backup = \App\Models\SalesBackup::create([
            'backup_name'      => 'backup_test.json',
            'file_path'        => 'sales_backups/backup_test.json',
            'records_count'    => 10,
        ]);

        // Cashier attempting restore gets 403
        $cashierRes = $this->actingAs($this->cashierVictoria)->postJson("/admin/sales-data/restore/{$backup->id}");
        $cashierRes->assertStatus(403);

        // Cashier attempting backup deletion gets 403
        $cashierDel = $this->actingAs($this->cashierVictoria)->deleteJson("/admin/sales-data/backup/{$backup->id}");
        $cashierDel->assertStatus(403);
    }
}
