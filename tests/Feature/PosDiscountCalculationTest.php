<?php

namespace Tests\Feature;

use App\Events\SaleCreated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\FinancialMetricsService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PosDiscountCalculationTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $testBranch;
    protected User $cashier;
    protected Product $ramen;
    protected Ingredient $noodles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'                => 'MAKI DESU VICTORIA',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.2250,
            'longitude'           => 121.3280,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->testBranch->id,
        ]);

        $this->noodles = Ingredient::create([
            'name'               => 'Noodles',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.40,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->noodles->id, 'branch_id' => $this->testBranch->id],
            [
                'stock'             => 50000,
                'cost_per_unit'     => 0.40,
                'total_stock_value' => 20000,
                'low_stock_level'   => 1000,
            ]
        );

        $category = Category::create(['name' => 'Ramen']);

        // Selling Price: ₱200, 200g * ₱0.40 = ₱80 COGS
        $this->ramen = Product::create([
            'name'          => 'Tonkotsu Ramen',
            'sku'           => 'RAM-200',
            'category_id'   => $category->id,
            'selling_price' => 200.00,
            'cost_price'    => 0,
            'branch_id'     => $this->testBranch->id,
            'unit'          => 'bowl',
            'stock'         => 100,
            'status'        => 'available',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $this->ramen->id,
            'ingredient_id'     => $this->noodles->id,
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);

        \App\Models\CashierShift::create([
            'cashier_id'    => $this->cashier->id,
            'branch_id'     => $this->testBranch->id,
            'starting_cash' => 1000.00,
            'opened_at'     => now(),
            'status'        => 'open',
        ]);
    }

    /**
     * TEST 1: Senior Citizen 20% discount on POS Sale
     * Subtotal: ₱200, Discount: ₱40 (20%), Total Paid: ₱160, COGS: ₱80, Gross Profit: ₱80
     */
    public function test_senior_citizen_discount_calculation_and_persistence(): void
    {
        Event::fake([SaleCreated::class]);

        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'             => 'dine-in',
            'items'            => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => 1,
                ],
            ],
            'discount'         => 40.00,
            'discount_type'    => 'senior_citizen',
            'discount_details' => [
                'type_name'     => 'Senior Citizen (20%)',
                'percentage'    => 20,
                'customer_name' => 'Lola Maria Santos',
                'id_number'     => 'OSCA-2024-8891',
                'notes'         => 'Verified Senior ID',
            ],
            'paid_amount'      => 200.00,
            'change_amount'    => 40.00,
            'payment_method'   => 'cash',
            'status'           => 'completed',
        ]);

        $this->assertEquals(200.00, (float) $sale->subtotal, 'Subtotal is gross ₱200.00');
        $this->assertEquals(40.00, (float) $sale->discount, 'Discount is ₱40.00');
        $this->assertEquals('senior_citizen', $sale->discount_type);
        $this->assertEquals(160.00, (float) $sale->total, 'Total customer payable is ₱160.00');
        $this->assertEquals(80.00, (float) $sale->cost_total, 'COGS is ₱80.00');
        $this->assertEquals(80.00, (float) $sale->profit, 'Gross Profit is ₱80.00 (₱160 net sales - ₱80 COGS)');
        $this->assertEquals('Lola Maria Santos', $sale->discount_details['customer_name']);
        $this->assertEquals('OSCA-2024-8891', $sale->discount_details['id_number']);

        // Check Product Revenue accessor
        $this->assertEquals(160.00, $sale->product_revenue, 'Authoritative Product Revenue is ₱160.00');

        // Check Financial Metrics Engine
        $metricsService = new FinancialMetricsService();
        $metrics = $metricsService->getSummaryMetrics(null, null, $this->testBranch->id);
        $this->assertEquals(160.00, $metrics['revenue']);
        $this->assertEquals(80.00, $metrics['cogs']);
        $this->assertEquals(80.00, $metrics['gross_profit']);
        $this->assertEquals(80.00, $metrics['net_profit']);
    }

    /**
     * TEST 2: Discount on POS Walk-in Delivery preserves delivery fee separation
     * Subtotal: ₱400 (2 ramen), Discount: ₱80 (20%), Net Product Sales: ₱320, Delivery Fee: ₱50, Total Paid: ₱370
     */
    public function test_discount_on_pos_delivery_order(): void
    {
        Event::fake([SaleCreated::class]);

        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'             => 'delivery',
            'items'            => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => 2,
                ],
            ],
            'discount'         => 80.00,
            'discount_type'    => 'pwd',
            'discount_details' => [
                'type_name'     => 'Person with Disability / PWD (20%)',
                'percentage'    => 20,
                'customer_name' => 'Pedro Penduko',
                'id_number'     => 'PWD-9912-B',
            ],
            'delivery_info'    => [
                'customer_name'    => 'Pedro Penduko',
                'customer_phone'   => '09171234567',
                'customer_address' => 'Victoria Laguna',
                'delivery_fee'     => 50.00,
                'delivery_type'    => 'internal',
            ],
            'paid_amount'      => 400.00,
            'change_amount'    => 30.00,
            'payment_method'   => 'cash',
            'status'           => 'completed',
        ]);

        $this->assertEquals(400.00, (float) $sale->subtotal, 'Subtotal is ₱400.00');
        $this->assertEquals(80.00, (float) $sale->discount, 'Discount is ₱80.00');
        $this->assertEquals(50.00, (float) $sale->delivery_fee, 'Delivery Fee remains ₱50.00');
        $this->assertEquals(370.00, (float) $sale->total, 'Customer Total = ₱320 net items + ₱50 delivery = ₱370.00');
        $this->assertEquals(160.00, (float) $sale->cost_total, 'COGS for 2 bowls = ₱160.00');
        $this->assertEquals(160.00, (float) $sale->profit, 'Profit = ₱320 net items - ₱160 COGS = ₱160.00');
    }

    /**
     * TEST 3: Controller endpoint /pos accepts discount and creates sale
     */
    public function test_pos_controller_store_with_discount(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos', [
            'type'             => 'take-out',
            'items'            => [
                ['id' => $this->ramen->id, 'quantity' => 1],
            ],
            'total'            => 160.00,
            'discount'         => 40.00,
            'discount_type'    => 'solo_parent',
            'discount_details' => [
                'type_name'     => 'Solo Parent (20%)',
                'customer_name' => 'Ana Reyes',
                'id_number'     => 'SP-2023-001',
            ],
            'payment_method'   => 'cash',
            'paid_amount'      => 200.00,
            'change_amount'    => 40.00,
        ]);

        $response->assertSessionHas('success');

        $sale = Sale::latest()->first();
        $this->assertNotNull($sale);
        $this->assertEquals(200.00, (float) $sale->subtotal);
        $this->assertEquals(40.00, (float) $sale->discount);
        $this->assertEquals(160.00, (float) $sale->total);
        $this->assertEquals('solo_parent', $sale->discount_type);
    }
}
