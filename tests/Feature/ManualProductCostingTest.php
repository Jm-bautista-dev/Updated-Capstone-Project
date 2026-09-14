<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\ProductService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

class ManualProductCostingTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;
    public User $cashier;
    public ProductService $productService;
    public SaleService $saleService;

    public Ingredient $ingChicken;
    public Ingredient $ingRice;
    public Ingredient $ingSauce;

    protected function setUp(): void
    {
        parent::setUp();

        $this->productService = app(ProductService::class);
        $this->saleService = app(SaleService::class);

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Bento Meals',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
            'branch_id' => null,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'must_change_password' => false,
            'branch_id' => $this->branchSantaCruz->id,
        ]);

        // Ingredients
        $this->ingChicken = Ingredient::create([
            'name' => 'Chicken Patty',
            'category' => 'Meat',
            'unit' => 'pcs',
            'cost_per_base_unit' => 40.00,
            'is_composite' => false,
        ]);

        $this->ingRice = Ingredient::create([
            'name' => 'Steamed Rice',
            'category' => 'Grains',
            'unit' => 'pcs',
            'cost_per_base_unit' => 15.00,
            'is_composite' => false,
        ]);

        $this->ingSauce = Ingredient::create([
            'name' => 'Teriyaki Sauce',
            'category' => 'Condiments',
            'unit' => 'pcs',
            'cost_per_base_unit' => 5.00,
            'is_composite' => false,
        ]);

        // Branch Stocks
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingChicken->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100, 'cost_per_unit' => 40.00]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingRice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100, 'cost_per_unit' => 15.00]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingSauce->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100, 'cost_per_unit' => 5.00]
        );

        // Active Cashier Shift for Cash Sales
        \App\Models\CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'branch_id' => $this->branchSantaCruz->id,
            'opening_balance' => 1000.00,
            'status' => 'open',
            'opened_at' => now(),
        ]);
    }

    /**
     * Helper to create standard Chicken Bento product with recipe.
     */
    private function createChickenBentoProduct(array $overrides = []): Product
    {
        $payload = array_merge([
            'name' => 'Chicken Bento',
            'sku' => 'BENTO-CHK-01',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'unit' => 'pcs',
            'costing_method' => 'automatic',
            'manual_cost' => null,
            'branch_option' => 'both',
            'recipe' => [
                ['ingredient_id' => $this->ingChicken->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingRice->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingSauce->id, 'quantity_required' => 1, 'unit' => 'pcs'],
            ],
        ], $overrides);

        return $this->productService->store($payload, null, [$this->branchSantaCruz, $this->branchVictoria]);
    }

    /**
     * TEST 1: Default Costing Mode is Automatic for new and existing products.
     */
    public function test_1_default_costing_method_is_automatic(): void
    {
        $product = Product::create([
            'name' => 'Direct Product',
            'sku' => 'DIR-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'cost_price' => 20.00,
            'unit' => 'pcs',
        ]);

        $this->assertEquals('automatic', $product->costing_method);
        $this->assertFalse($product->isManualCosting());
        $this->assertNull($product->manual_cost);
    }

    /**
     * TEST 2: Existing Automatic Costing calculates from ingredients correctly.
     */
    public function test_2_automatic_costing_calculates_from_ingredients(): void
    {
        $product = $this->createChickenBentoProduct();

        // 40 + 15 + 5 = 60.00
        $this->assertEquals('automatic', $product->costing_method);
        $this->assertEquals(60.00, $product->getAutomaticCost());
        $this->assertEquals(60.00, $product->getActiveCost());
        $this->assertEquals(60.00, $product->computeProductCost());
        $this->assertEquals(60.00, (float) $product->cost_price);
    }

    /**
     * TEST 3: Manual Costing overrides active cost with manual_cost.
     */
    public function test_3_manual_costing_overrides_active_cost(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'manual',
            'manual_cost' => 65.50,
        ]);

        $this->assertEquals('manual', $product->costing_method);
        $this->assertTrue($product->isManualCosting());
        $this->assertEquals(65.50, (float) $product->manual_cost);

        // Active cost and computeProductCost should be manual cost
        $this->assertEquals(65.50, $product->getActiveCost());
        $this->assertEquals(65.50, $product->computeProductCost());
        $this->assertEquals(65.50, (float) $product->cost_price);

        // Underlying automatic recipe cost is still preserved and available
        $this->assertEquals(60.00, $product->getAutomaticCost());
    }

    /**
     * TEST 4: Manual Costing preserves recipe ingredients intact.
     */
    public function test_4_manual_costing_preserves_recipe_ingredients(): void
    {
        $product = $this->createChickenBentoProduct();
        $this->assertCount(3, $product->ingredients);

        // Update to manual costing
        $this->actingAs($this->admin);
        $response = $this->put(route('products.update', $product->id), [
            'name' => 'Chicken Bento',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'unit' => 'pcs',
            'costing_method' => 'manual',
            'manual_cost' => 62.00,
            'recipe' => [
                ['ingredient_id' => $this->ingChicken->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingRice->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingSauce->id, 'quantity_required' => 1, 'unit' => 'pcs'],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $product->refresh();

        $this->assertEquals('manual', $product->costing_method);
        $this->assertEquals(62.00, (float) $product->manual_cost);
        $this->assertEquals(62.00, (float) $product->cost_price);

        // Recipe MUST still have all 3 ingredients
        $this->assertCount(3, $product->ingredients);
        $this->assertEquals(60.00, $product->getAutomaticCost());
    }

    /**
     * TEST 5: Switching back to Automatic Costing immediately resumes ingredient calculations.
     */
    public function test_5_switching_back_to_automatic_immediately_resumes_recipe_costing(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'manual',
            'manual_cost' => 70.00,
        ]);

        $this->assertEquals(70.00, $product->computeProductCost());

        // Switch back to automatic
        $this->actingAs($this->admin);
        $response = $this->put(route('products.update', $product->id), [
            'name' => 'Chicken Bento',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'unit' => 'pcs',
            'costing_method' => 'automatic',
            'manual_cost' => 70.00, // Preserved in DB
            'recipe' => [
                ['ingredient_id' => $this->ingChicken->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingRice->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingSauce->id, 'quantity_required' => 1, 'unit' => 'pcs'],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $product->refresh();

        $this->assertEquals('automatic', $product->costing_method);
        $this->assertEquals(60.00, $product->computeProductCost());
        $this->assertEquals(60.00, $product->getActiveCost());
        $this->assertEquals(60.00, (float) $product->cost_price);
    }

    /**
     * TEST 6: Inventory deduction during sales works identically under Manual Costing.
     */
    public function test_6_inventory_deduction_works_identically_with_manual_costing(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'manual',
            'manual_cost' => 65.00,
        ]);

        $stockChickenBefore = IngredientStock::where('ingredient_id', $this->ingChicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');

        $stockRiceBefore = IngredientStock::where('ingredient_id', $this->ingRice->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');

        // Execute Sale of 3 Chicken Bentos
        $this->actingAs($this->cashier);
        $this->saleService->processSale([
            'branch_id' => $this->branchSantaCruz->id,
            'cashier_id' => $this->cashier->id,
            'payment_method' => 'cash',
            'amount_paid' => 500.00,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 3,
                    'unit_price' => 120.00,
                ],
            ],
        ]);

        $stockChickenAfter = IngredientStock::where('ingredient_id', $this->ingChicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');

        $stockRiceAfter = IngredientStock::where('ingredient_id', $this->ingRice->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');

        // Exactly 3 chicken and 3 rice deducted despite manual costing mode
        $this->assertEquals($stockChickenBefore - 3, $stockChickenAfter);
        $this->assertEquals($stockRiceBefore - 3, $stockRiceAfter);
    }

    /**
     * TEST 7: Sales line items and profit calculations use the active cost.
     */
    public function test_7_sales_cost_and_profit_use_active_cost(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'manual',
            'manual_cost' => 65.00,
        ]);

        $this->actingAs($this->cashier);
        $sale = $this->saleService->processSale([
            'branch_id' => $this->branchSantaCruz->id,
            'cashier_id' => $this->cashier->id,
            'payment_method' => 'cash',
            'amount_paid' => 500.00,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'unit_price' => 120.00,
                ],
            ],
        ]);

        $item = $sale->items->first();
        // Item cost per unit should be active cost = 65.00
        $this->assertEquals(65.00, (float) $item->cost_price);
        $this->assertEquals(130.00, (float) $sale->cost_total);
        // Total profit = (120 - 65) * 2 = 110.00
        $this->assertEquals(110.00, (float) $sale->profit);
    }

    /**
     * TEST 8: Backend server-side validation enforces manual cost constraints.
     */
    public function test_8_validation_rejects_invalid_manual_cost_inputs(): void
    {
        $this->actingAs($this->admin);

        // Missing manual cost when method is manual
        $response1 = $this->post(route('products.store'), [
            'name' => 'Validation Product',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->branchSantaCruz->id,
            'costing_method' => 'manual',
            'manual_cost' => '',
        ]);
        $response1->assertSessionHasErrors(['manual_cost']);

        // Negative manual cost
        $response2 = $this->post(route('products.store'), [
            'name' => 'Negative Cost Product',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->branchSantaCruz->id,
            'costing_method' => 'manual',
            'manual_cost' => -25.00,
        ]);
        $response2->assertSessionHasErrors(['manual_cost']);

        // Non-numeric manual cost
        $response3 = $this->post(route('products.store'), [
            'name' => 'Invalid Text Product',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->branchSantaCruz->id,
            'costing_method' => 'manual',
            'manual_cost' => 'invalid_text',
        ]);
        $response3->assertSessionHasErrors(['manual_cost']);
    }

    /**
     * TEST 9: Non-admin users cannot see raw product cost fields in API responses.
     */
    public function test_9_non_admin_cannot_view_cost_fields(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'manual',
            'manual_cost' => 65.00,
        ]);

        // When viewed by cashier
        $this->actingAs($this->cashier);
        $array = $product->toArray();

        $this->assertArrayNotHasKey('cost_price', $array);
        $this->assertArrayNotHasKey('manual_cost', $array);
        $this->assertArrayNotHasKey('costing_method', $array);
        $this->assertArrayNotHasKey('automatic_cost', $array);

        // When viewed by admin
        $this->actingAs($this->admin);
        $adminArray = $product->toArray();

        $this->assertArrayHasKey('cost_price', $adminArray);
        $this->assertArrayHasKey('manual_cost', $adminArray);
        $this->assertArrayHasKey('costing_method', $adminArray);
    }

    /**
     * TEST 10: Audit Log records costing method and manual cost updates.
     */
    public function test_10_audit_trail_records_costing_changes(): void
    {
        $product = $this->createChickenBentoProduct([
            'costing_method' => 'automatic',
        ]);

        $this->actingAs($this->admin);
        $this->put(route('products.update', $product->id), [
            'name' => 'Chicken Bento',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'unit' => 'pcs',
            'costing_method' => 'manual',
            'manual_cost' => 68.00,
            'recipe' => [
                ['ingredient_id' => $this->ingChicken->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingRice->id, 'quantity_required' => 1, 'unit' => 'pcs'],
                ['ingredient_id' => $this->ingSauce->id, 'quantity_required' => 1, 'unit' => 'pcs'],
            ],
        ]);

        $auditLog = AuditLog::where('action', 'product_costing_updated')->latest()->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals($this->admin->id, $auditLog->actor_id);
        $this->assertStringContainsString((string) $product->id, $auditLog->target);
        $this->assertEquals('automatic', $auditLog->before_state['costing_method']);
        $this->assertEquals('manual', $auditLog->after_state['costing_method']);
        $this->assertEquals(68.00, (float) $auditLog->after_state['manual_cost']);
    }
}
