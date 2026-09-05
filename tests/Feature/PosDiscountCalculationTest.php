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
    protected Product $sideDish;
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

        // Low value product: ₱30 base sale (Item #1)
        $this->sideDish = Product::create([
            'name'          => 'Extra Tamago Egg',
            'sku'           => 'EGG-030',
            'category_id'   => $category->id,
            'selling_price' => 30.00,
            'cost_price'    => 10.00,
            'branch_id'     => $this->testBranch->id,
            'unit'          => 'piece',
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
     * TEST 1: Generic 20% statutory discount on POS Sale
     * Subtotal: ₱200, Discount: ₱40 (20%), Total Paid: ₱160, COGS: ₱80, Gross Profit: ₱80
     */
    public function test_twenty_percent_discount_calculation_and_persistence(): void
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
            'discount_type'    => 'twenty_percent',
            'discount_details' => [
                'type_name'     => '20% Discount',
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
        $this->assertEquals('twenty_percent', $sale->discount_type);
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
     * TEST 2: Small-value sale (₱30 base) with custom fixed discount exceeding subtotal (Item #1)
     * Subtotal: ₱30, Fixed Discount Input: ₱50. Clamped to ₱30. Net total: ₱0.00, never negative.
     */
    public function test_small_value_sale_fixed_discount_clamped_and_never_negative(): void
    {
        Event::fake([SaleCreated::class]);

        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'             => 'dine-in',
            'items'            => [
                [
                    'id'       => $this->sideDish->id,
                    'quantity' => 1,
                ],
            ],
            'discount'         => 50.00, // Exceeds ₱30 subtotal
            'discount_type'    => 'custom',
            'discount_details' => [
                'type_name'    => 'Custom Fixed Amount',
                'mode'         => 'fixed',
                'fixed_amount' => 50.00,
            ],
            'paid_amount'      => 0.00,
            'change_amount'    => 0.00,
            'payment_method'   => 'cash',
            'status'           => 'completed',
        ]);

        $this->assertEquals(30.00, (float) $sale->subtotal, 'Subtotal is ₱30.00');
        $this->assertEquals(30.00, (float) $sale->discount, 'Discount is clamped to ₱30.00 (not ₱50.00)');
        $this->assertEquals(0.00, (float) $sale->total, 'Total customer payable is ₱0.00 (never negative)');
        $this->assertGreaterThanOrEqual(0.0, (float) $sale->total, 'Net total is non-negative');
    }

    /**
     * TEST 3: Small-value sale (₱30 base) with custom percentage discount (Item #1)
     * Subtotal: ₱30, Custom Rate: 15%, Discount: ₱4.50, Net Total: ₱25.50
     */
    public function test_small_value_sale_custom_percentage_discount(): void
    {
        Event::fake([SaleCreated::class]);

        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'             => 'take-out',
            'items'            => [
                [
                    'id'       => $this->sideDish->id,
                    'quantity' => 1,
                ],
            ],
            'discount_type'    => 'custom',
            'discount_details' => [
                'type_name'  => 'Custom (15%)',
                'mode'       => 'percentage',
                'percentage' => 15,
            ],
            'paid_amount'      => 30.00,
            'change_amount'    => 4.50,
            'payment_method'   => 'cash',
            'status'           => 'completed',
        ]);

        $this->assertEquals(30.00, (float) $sale->subtotal, 'Subtotal is ₱30.00');
        $this->assertEquals(4.50, (float) $sale->discount, '15% of ₱30 is ₱4.50');
        $this->assertEquals(25.50, (float) $sale->total, 'Net total is ₱25.50');
    }

    /**
     * TEST 4: 5% promotional discount does not require customer ID
     */
    public function test_five_percent_discount_without_customer_id(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos', [
            'type'             => 'take-out',
            'items'            => [
                ['id' => $this->ramen->id, 'quantity' => 1],
            ],
            'total'            => 190.00,
            'discount'         => 10.00,
            'discount_type'    => 'five_percent',
            'discount_details' => [
                'type_name'  => '5% Discount',
                'percentage' => 5,
            ],
            'payment_method'   => 'cash',
            'paid_amount'      => 200.00,
            'change_amount'    => 10.00,
        ]);

        $response->assertSessionHas('success');

        $sale = Sale::latest()->first();
        $this->assertNotNull($sale);
        $this->assertEquals(200.00, (float) $sale->subtotal);
        $this->assertEquals(10.00, (float) $sale->discount);
        $this->assertEquals(190.00, (float) $sale->total);
        $this->assertEquals('five_percent', $sale->discount_type);
    }

    /**
     * TEST 5: Controller endpoint /pos requires customer name and ID for 20% statutory discount
     */
    public function test_twenty_percent_discount_validation_fails_without_id(): void
    {
        $response = $this->actingAs($this->cashier)->post('/pos', [
            'type'             => 'take-out',
            'items'            => [
                ['id' => $this->ramen->id, 'quantity' => 1],
            ],
            'total'            => 160.00,
            'discount'         => 40.00,
            'discount_type'    => 'twenty_percent',
            'discount_details' => [
                'type_name' => '20% Discount',
            ],
            'payment_method'   => 'cash',
            'paid_amount'      => 200.00,
        ]);

        $response->assertSessionHasErrors(['discount_details.customer_name', 'discount_details.id_number']);
    }
}
