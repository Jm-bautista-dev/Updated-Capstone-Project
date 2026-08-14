<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Branch;
use App\Models\User;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Wastage;
use App\Services\FinancialMetricsService;
use App\Services\InventoryService;
use App\Services\SaleService;
use App\Services\DeliveryService;
use Carbon\Carbon;

class FinancialProfitabilityCalculationsTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $santaCruz;
    protected Branch $victoria;
    protected User $admin;
    protected User $cashierSC;
    protected FinancialMetricsService $financialService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->santaCruz = Branch::create(['name' => 'Santa Cruz', 'address' => 'Santa Cruz, Laguna']);
        $this->victoria  = Branch::create(['name' => 'Victoria', 'address' => 'Victoria, Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->santaCruz->id,
        ]);

        $this->cashierSC = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->santaCruz->id,
        ]);

        $this->financialService = new FinancialMetricsService();
    }

    /** @test */
    public function test_recipe_based_ingredient_cost_calculation_prevents_100_percent_margin()
    {
        // 1. Create Ingredients
        $coffee = Ingredient::create([
            'name'                => 'Coffee Beans',
            'unit'                => 'g',
            'cost_per_base_unit'  => 0.50, // ₱0.50 per gram
        ]);

        $sugar = Ingredient::create([
            'name'                => 'Refined Sugar',
            'unit'                => 'g',
            'cost_per_base_unit'  => 0.024, // ₱0.024 per gram (25kg for ₱600)
        ]);

        // Seed stock & WAC costs for Santa Cruz
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffee->id, 'branch_id' => $this->santaCruz->id],
            [
                'stock'             => 10000,
                'cost_per_unit'     => 0.50,
                'total_stock_value' => 5000,
                'low_stock_level'   => 500,
            ]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->santaCruz->id],
            [
                'stock'             => 25000,
                'cost_per_unit'     => 0.024,
                'total_stock_value' => 600,
                'low_stock_level'   => 1000,
            ]
        );

        // 2. Create Product with recipe: 20g coffee (₱10) + 25g sugar (₱0.60) = ₱10.60 per cup
        $latte = Product::create([
            'name'          => 'Iced Spanish Latte',
            'selling_price' => 120.00,
            'cost_price'    => 0, // dynamic
            'branch_id'     => $this->santaCruz->id,
            'status'        => 'available',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $latte->id,
            'ingredient_id'     => $coffee->id,
            'quantity_required' => 20,
            'unit'              => 'g',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $latte->id,
            'ingredient_id'     => $sugar->id,
            'quantity_required' => 25,
            'unit'              => 'g',
        ]);

        $computedUnitCost = $latte->computeProductCost($this->santaCruz->id);
        $this->assertEquals(10.60, round($computedUnitCost, 2));

        // 3. Process Sale of 10 cups: Revenue = ₱1,200.00, Expected COGS = ₱106.00, Expected Profit = ₱1,094.00
        $sale = Sale::create([
            'order_number'   => 'ORD-TEST-001',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1200.00,
            'cost_total'     => 106.00,
            'profit'         => 1094.00,
            'paid_amount'    => 1200.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $latte->id,
            'quantity'   => 10,
            'unit_price' => 120.00,
            'cost_price' => 10.60,
            'subtotal'   => 1200.00,
            'profit'     => 1094.00,
        ]);

        // 4. Calculate Financial Metrics
        $metrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);

        $this->assertEquals(1200.00, $metrics['revenue']);
        $this->assertEquals(106.00, $metrics['cogs']);
        $this->assertEquals(106.00, $metrics['total_expenses']);
        $this->assertEquals(1094.00, $metrics['gross_profit']);
        $this->assertEquals(1094.00, $metrics['net_profit']);
        // Margin: (1094 / 1200) * 100 = 91.2% (NOT 100%)
        $this->assertEquals(91.2, $metrics['gross_margin']);
        $this->assertEquals(91.2, $metrics['net_margin']);
        $this->assertNotEquals(100.0, $metrics['net_margin']);
    }

    /** @test */
    public function test_operating_expense_from_wastage_deducted_from_net_profit()
    {
        // 1. Create simple Sale: Revenue = ₱1,000, COGS = ₱200, Gross Profit = ₱800
        $product = Product::create([
            'name'          => 'Bottled Water',
            'selling_price' => 50.00,
            'cost_price'    => 10.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        $sale = Sale::create([
            'order_number'   => 'ORD-TEST-002',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1000.00,
            'cost_total'     => 200.00,
            'profit'         => 800.00,
            'paid_amount'    => 1000.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 20,
            'unit_price' => 50.00,
            'cost_price' => 10.00,
            'subtotal'   => 1000.00,
            'profit'     => 800.00,
        ]);

        // 2. Log Operating Loss / Wastage of ₱150 (e.g. 15 damaged bottles)
        Wastage::create([
            'branch_id'     => $this->santaCruz->id,
            'user_id'       => $this->cashierSC->id,
            'wastable_type' => Product::class,
            'wastable_id'   => $product->id,
            'quantity'      => 15,
            'unit'          => 'pcs',
            'cost_at_loss'  => 150.00,
            'reason'        => 'damaged',
        ]);

        // 3. Compute Metrics
        $metrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);

        $this->assertEquals(1000.00, $metrics['revenue']);
        $this->assertEquals(200.00, $metrics['cogs']);
        $this->assertEquals(150.00, $metrics['operating_expenses']);
        $this->assertEquals(350.00, $metrics['total_expenses']); // COGS (200) + Wastage (150)
        $this->assertEquals(800.00, $metrics['gross_profit']);   // 1000 - 200
        $this->assertEquals(650.00, $metrics['net_profit']);     // 1000 - 350
        $this->assertEquals(80.0, $metrics['gross_margin']);    // (800/1000)*100
        $this->assertEquals(65.0, $metrics['net_margin']);      // (650/1000)*100
    }

    /** @test */
    public function test_zero_cost_scenario_allows_100_percent_margin_legitimately()
    {
        // Zero cost service item
        $service = Product::create([
            'name'          => 'Custom Workshop / Consultation',
            'selling_price' => 500.00,
            'cost_price'    => 0.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        $sale = Sale::create([
            'order_number'   => 'ORD-TEST-003',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 500.00,
            'cost_total'     => 0.00,
            'profit'         => 500.00,
            'paid_amount'    => 500.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $service->id,
            'quantity'   => 1,
            'unit_price' => 500.00,
            'cost_price' => 0.00,
            'subtotal'   => 500.00,
            'profit'     => 500.00,
        ]);

        $metrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);

        $this->assertEquals(500.00, $metrics['revenue']);
        $this->assertEquals(0.00, $metrics['cogs']);
        $this->assertEquals(500.00, $metrics['net_profit']);
        $this->assertEquals(100.0, $metrics['net_margin']);
    }

    /** @test */
    public function test_branch_isolation_in_financial_metrics()
    {
        // Santa Cruz Sale: Rev ₱1,000, COGS ₱300 -> Profit ₱700
        $scProduct = Product::create([
            'name'          => 'SC Product',
            'selling_price' => 100.00,
            'cost_price'    => 30.00,
            'branch_id'     => $this->santaCruz->id,
        ]);
        Sale::create([
            'order_number'   => 'ORD-SC-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1000.00,
            'cost_total'     => 300.00,
            'profit'         => 700.00,
            'paid_amount'    => 1000.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        // Victoria Sale: Rev ₱2,000, COGS ₱800 -> Profit ₱1,200
        $vicProduct = Product::create([
            'name'          => 'Victoria Product',
            'selling_price' => 200.00,
            'cost_price'    => 80.00,
            'branch_id'     => $this->victoria->id,
        ]);
        Sale::create([
            'order_number'   => 'ORD-VIC-01',
            'user_id'        => $this->admin->id,
            'branch_id'      => $this->victoria->id,
            'type'           => 'dine-in',
            'total'          => 2000.00,
            'cost_total'     => 800.00,
            'profit'         => 1200.00,
            'paid_amount'    => 2000.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        // Test Santa Cruz isolated
        $scMetrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);
        $this->assertEquals(1000.00, $scMetrics['revenue']);
        $this->assertEquals(300.00, $scMetrics['cogs']);
        $this->assertEquals(700.00, $scMetrics['net_profit']);
        $this->assertEquals(70.0, $scMetrics['net_margin']);

        // Test Victoria isolated
        $vicMetrics = $this->financialService->getSummaryMetrics(null, null, $this->victoria->id);
        $this->assertEquals(2000.00, $vicMetrics['revenue']);
        $this->assertEquals(800.00, $vicMetrics['cogs']);
        $this->assertEquals(1200.00, $vicMetrics['net_profit']);
        $this->assertEquals(60.0, $vicMetrics['net_margin']);

        // Test All Branches aggregated
        $allMetrics = $this->financialService->getSummaryMetrics(null, null, null);
        $this->assertEquals(3000.00, $allMetrics['revenue']);
        $this->assertEquals(1100.00, $allMetrics['cogs']);
        $this->assertEquals(1900.00, $allMetrics['net_profit']);
        $this->assertEquals(63.3, $allMetrics['net_margin']);
    }

    /** @test */
    public function test_daily_trajectory_chart_accurate_margins()
    {
        $product = Product::create([
            'name'          => 'Espresso',
            'selling_price' => 80.00,
            'cost_price'    => 20.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        $sale = Sale::create([
            'order_number'   => 'ORD-TRAJ-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 800.00,
            'cost_total'     => 200.00,
            'profit'         => 600.00,
            'paid_amount'    => 800.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => Carbon::today(),
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 10,
            'unit_price' => 80.00,
            'cost_price' => 20.00,
            'subtotal'   => 800.00,
            'profit'     => 600.00,
            'created_at' => Carbon::today(),
        ]);

        $trajectory = $this->financialService->getDailySalesTrajectory(7, $this->santaCruz->id);
        $todayEntry = $trajectory->firstWhere('raw_date', Carbon::today()->toDateString());

        $this->assertNotNull($todayEntry);
        $this->assertEquals(800.00, $todayEntry['revenue']);
        $this->assertEquals(200.00, $todayEntry['cogs']);
        $this->assertEquals(600.00, $todayEntry['profit']);
        $this->assertEquals(75.0, $todayEntry['margin_pct']);
    }

    /** @test */
    public function test_dynamic_cogs_fallback_for_historical_sales_with_zero_cost_total()
    {
        // Product with cost_price = 25
        $product = Product::create([
            'name'          => 'Historical Legacy Product',
            'selling_price' => 100.00,
            'cost_price'    => 25.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        // Historical sale imported with 0 cost_total
        $legacySale = Sale::create([
            'order_number'   => 'ORD-LEGACY-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1000.00,
            'cost_total'     => 0.00, // unpopulated in legacy DB
            'profit'         => 0.00,
            'paid_amount'    => 1000.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'    => $legacySale->id,
            'product_id' => $product->id,
            'quantity'   => 10,
            'unit_price' => 100.00,
            'cost_price' => 0.00, // unpopulated
            'subtotal'   => 1000.00,
            'profit'     => 0.00,
        ]);

        // Financial service dynamically calculates 10 * 25 = ₱250 COGS
        $metrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);

        $this->assertEquals(1000.00, $metrics['revenue']);
        $this->assertEquals(250.00, $metrics['cogs']);
        $this->assertEquals(750.00, $metrics['net_profit']);
        $this->assertEquals(75.0, $metrics['net_margin']);
        $this->assertNotEquals(100.0, $metrics['net_margin']);
    }

    /** @test */
    public function test_date_filtering_consistency()
    {
        $product = Product::create([
            'name'          => 'Croissant',
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        // Yesterday sale
        $yesterdaySale = Sale::create([
            'order_number'   => 'ORD-YEST-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1500.00,
            'cost_total'     => 500.00,
            'profit'         => 1000.00,
            'paid_amount'    => 1500.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => Carbon::yesterday(),
        ]);
        SaleItem::create([
            'sale_id'    => $yesterdaySale->id,
            'product_id' => $product->id,
            'quantity'   => 10,
            'unit_price' => 150.00,
            'cost_price' => 50.00,
            'subtotal'   => 1500.00,
            'profit'     => 1000.00,
            'created_at' => Carbon::yesterday(),
        ]);

        // Today sale
        $todaySale = Sale::create([
            'order_number'   => 'ORD-TODAY-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 3000.00,
            'cost_total'     => 1000.00,
            'profit'         => 2000.00,
            'paid_amount'    => 3000.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => Carbon::today(),
        ]);
        SaleItem::create([
            'sale_id'    => $todaySale->id,
            'product_id' => $product->id,
            'quantity'   => 20,
            'unit_price' => 150.00,
            'cost_price' => 50.00,
            'subtotal'   => 3000.00,
            'profit'     => 2000.00,
            'created_at' => Carbon::today(),
        ]);

        // Filter only today
        $todayMetrics = $this->financialService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->santaCruz->id);
        $this->assertEquals(3000.00, $todayMetrics['revenue']);
        $this->assertEquals(1000.00, $todayMetrics['cogs']);
        $this->assertEquals(2000.00, $todayMetrics['net_profit']);

        // Filter All Time
        $allMetrics = $this->financialService->getSummaryMetrics(null, null, $this->santaCruz->id);
        $this->assertEquals(4500.00, $allMetrics['revenue']);
        $this->assertEquals(1500.00, $allMetrics['cogs']);
        $this->assertEquals(3000.00, $allMetrics['net_profit']);
    }

    /** @test */
    public function test_dashboard_and_reports_controller_parity()
    {
        $product = Product::create([
            'name'          => 'Matcha Latte',
            'selling_price' => 180.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->santaCruz->id,
        ]);

        $sale = Sale::create([
            'order_number'   => 'ORD-PARITY-01',
            'user_id'        => $this->cashierSC->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'dine-in',
            'total'          => 1800.00,
            'cost_total'     => 600.00,
            'profit'         => 1200.00,
            'paid_amount'    => 1800.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => Carbon::today(),
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 10,
            'unit_price' => 180.00,
            'cost_price' => 60.00,
            'subtotal'   => 1800.00,
            'profit'     => 1200.00,
            'created_at' => Carbon::today(),
        ]);

        $dashResponse = $this->actingAs($this->admin)->get('/dashboard?branch_id=' . $this->santaCruz->id);
        $dashResponse->assertStatus(200);
        $dashStats = $dashResponse->original->getData()['page']['props']['stats'];

        $repResponse = $this->actingAs($this->admin)->get('/reports?branch_id=' . $this->santaCruz->id . '&date_from=' . Carbon::today()->format('Y-m-d') . '&date_to=' . Carbon::today()->format('Y-m-d'));
        $repResponse->assertStatus(200);
        $repProps = $repResponse->original->getData()['page']['props'];

        $this->assertEquals($dashStats['total_revenue'], $repProps['total_revenue']);
        $this->assertEquals($dashStats['total_profit'], $repProps['total_profit']);
        $this->assertEquals($dashStats['total_expenses'], $repProps['total_expenses']);
    }
}
