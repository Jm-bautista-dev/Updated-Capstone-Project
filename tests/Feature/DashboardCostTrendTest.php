<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\FinancialMetricsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardCostTrendTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Branch $branchSantaCruz;
    protected Branch $branchVictoria;
    protected FinancialMetricsService $metricsService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create(['name' => 'MAKI DESU STA CRUZ', 'address' => 'Santa Cruz']);
        $this->branchVictoria  = Branch::create(['name' => 'MAKI DESU VICTORIA', 'address' => 'Victoria']);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => null,
        ]);

        $this->metricsService = new FinancialMetricsService();
    }

    /**
     * TEST 1 — REVENUE + COGS + MARGIN
     * Verify Revenue, COGS, and Margin are mathematically consistent.
     */
    public function test_revenue_cogs_and_margin_are_mathematically_consistent(): void
    {
        $product = Product::create([
            'name' => 'Chicken Teriyaki',
            'selling_price' => 200.00,
            'cost_price' => 80.00,
        ]);

        $sale = Sale::create([
            'branch_id' => $this->branchSantaCruz->id,
            'status' => 'completed',
            'total' => 400.00,
            'paid_amount' => 400.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1001',
            'created_at' => Carbon::now(),
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 200.00,
            'cost_price' => 80.00,
            'subtotal' => 400.00,
        ]);

        $metrics = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchSantaCruz->id);

        $this->assertEquals(400.00, $metrics['revenue']);
        $this->assertEquals(160.00, $metrics['cogs']); // 2 * 80
        $this->assertEquals(240.00, $metrics['gross_profit']);
        $this->assertEquals(60.0, $metrics['gross_margin']); // 240/400 * 100
    }

    /**
     * TEST 2 — INGREDIENT UNIT CONVERSION
     * Tomato: 100 kg for ₱1,000 => ₱10/kg (₱0.01/g). Recipe: 1 kg (1000g).
     * Verify Dashboard COGS uses ₱10 per sold product.
     */
    public function test_cogs_uses_canonical_ingredient_unit_conversion(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Tomato',
            'unit' => 'g',
            'cost_per_base_unit' => 0.01, // ₱10/kg = ₱0.01/g
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 100000, // 100 kg in grams
            'cost_per_unit' => 0.01,
            'total_stock_value' => 1000.00,
        ]);

        $product = Product::create([
            'name' => 'Tomato Pasta',
            'selling_price' => 150.00,
        ]);

        // Attach recipe: 1000g tomato
        $product->ingredients()->attach($ingredient->id, [
            'quantity_required' => 1000,
            'unit' => 'g',
        ]);

        $computedCost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(10.00, $computedCost);

        // Record a sale of 3 Tomato Pastas
        $sale = Sale::create([
            'branch_id' => $this->branchSantaCruz->id,
            'status' => 'completed',
            'total' => 450.00,
            'paid_amount' => 450.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1002',
            'created_at' => Carbon::now(),
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 3,
            'unit_price' => 150.00,
            'cost_price' => 10.00,
            'subtotal' => 450.00,
        ]);

        $metrics = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchSantaCruz->id);

        $this->assertEquals(450.00, $metrics['revenue']);
        $this->assertEquals(30.00, $metrics['cogs']); // 3 * ₱10 = ₱30
    }

    /**
     * TEST 3 — BRANCH ISOLATION
     * Sta Cruz sales/costs vs Victoria sales/costs remain separated.
     */
    public function test_branch_sales_and_cogs_remain_strictly_separated(): void
    {
        $product = Product::create([
            'name' => 'Bento Box',
            'selling_price' => 500.00,
            'cost_price' => 200.00,
        ]);

        // Sta Cruz sale: Revenue 500, COGS 200
        $saleStaCruz = Sale::create([
            'branch_id' => $this->branchSantaCruz->id,
            'status' => 'completed',
            'total' => 500.00,
            'paid_amount' => 500.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1003',
            'created_at' => Carbon::now(),
        ]);
        SaleItem::create([
            'sale_id' => $saleStaCruz->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 500.00,
            'cost_price' => 200.00,
            'subtotal' => 500.00,
        ]);

        // Victoria sale: Revenue 1000, COGS 400
        $saleVictoria = Sale::create([
            'branch_id' => $this->branchVictoria->id,
            'status' => 'completed',
            'total' => 1000.00,
            'paid_amount' => 1000.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1004',
            'created_at' => Carbon::now(),
        ]);
        SaleItem::create([
            'sale_id' => $saleVictoria->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 500.00,
            'cost_price' => 200.00,
            'subtotal' => 1000.00,
        ]);

        $metricsStaCruz = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchSantaCruz->id);
        $metricsVictoria = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchVictoria->id);

        $this->assertEquals(500.00, $metricsStaCruz['revenue']);
        $this->assertEquals(200.00, $metricsStaCruz['cogs']);

        $this->assertEquals(1000.00, $metricsVictoria['revenue']);
        $this->assertEquals(400.00, $metricsVictoria['cogs']);
    }

    /**
     * TEST 4 — DATE RANGE
     * Verify Revenue and COGS use the exact same selected date range.
     */
    public function test_date_range_filtering_aligns_revenue_and_cogs(): void
    {
        $product = Product::create([
            'name' => 'Ramen',
            'selling_price' => 300.00,
            'cost_price' => 100.00,
        ]);

        // Sale 5 days ago
        $oldSale = Sale::create([
            'branch_id' => $this->branchSantaCruz->id,
            'status' => 'completed',
            'total' => 300.00,
            'paid_amount' => 300.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1005',
            'created_at' => Carbon::now()->subDays(5),
        ]);
        SaleItem::create([
            'sale_id' => $oldSale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 300.00,
            'cost_price' => 100.00,
            'subtotal' => 300.00,
        ]);

        // Today sale
        $todaySale = Sale::create([
            'branch_id' => $this->branchSantaCruz->id,
            'status' => 'completed',
            'total' => 600.00,
            'paid_amount' => 600.00,
            'payment_method' => 'cash',
            'user_id' => $this->admin->id,
            'order_number' => 'ORD-1006',
            'created_at' => Carbon::now(),
        ]);
        SaleItem::create([
            'sale_id' => $todaySale->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 300.00,
            'cost_price' => 125.00,
            'subtotal' => 600.00,
        ]);

        // Query only today
        $todayMetrics = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchSantaCruz->id);

        $this->assertEquals(600.00, $todayMetrics['revenue']);
        $this->assertEquals(250.00, $todayMetrics['cogs']);
    }

    /**
     * TEST 5 — RESTOCK VS COGS
     * Purchase a large ingredient quantity. Verify the entire purchase is NOT automatically treated as COGS.
     */
    public function test_restock_purchases_are_not_incorrectly_summed_as_cogs(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Sugar Bag 25kg',
            'unit' => 'kg',
            'cost_per_base_unit' => 50.00,
        ]);

        // Heavy restock of 100kg = ₱5,000
        IngredientStock::updateOrCreate([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 100,
            'cost_per_unit' => 50.00,
            'total_stock_value' => 5000.00,
        ]);

        // No sales made today
        $metrics = $this->metricsService->getSummaryMetrics(Carbon::today(), Carbon::today(), $this->branchSantaCruz->id);

        // COGS should be 0, NOT ₱5,000
        $this->assertEquals(0.00, $metrics['cogs']);
        $this->assertEquals(0.00, $metrics['revenue']);
    }

    /**
     * TEST 6 — INDIVIDUAL INGREDIENT COST ANALYTICS
     * Verify Dashboard API endpoint returns ingredient unit cost details correctly.
     */
    public function test_dashboard_api_returns_ingredient_cost_trends_prop(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Premium Tomato',
            'unit' => 'kg',
            'cost_per_base_unit' => 12.50,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 80,
            'cost_per_unit' => 12.50,
            'total_stock_value' => 1000.00,
        ]);

        $response = $this->actingAs($this->admin)->get('/dashboard?branch_id=' . $this->branchSantaCruz->id);

        $response->assertOk();
        $response->assertInertia(fn ($page) =>
            $page->component('Admin/Dashboard')
                ->has('ingredientCostTrends')
                ->has('salesOverTime')
        );
    }
}
