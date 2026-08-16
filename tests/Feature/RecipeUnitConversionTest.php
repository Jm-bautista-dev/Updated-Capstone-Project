<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\User;
use App\Services\InventoryService;
use App\Services\SaleService;
use App\Services\ProductService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RecipeUnitConversionTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;
    public User $cashierSantaCruz;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name' => 'Santa Cruz',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'Victoria',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Desserts & Drinks',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * TEST 1: Inventory: Sugar = 20 kg, Recipe: Sugar = 10 g -> 2,000 possible servings.
     */
    public function test_test1_sugar_20kg_inventory_and_10g_recipe_yields_2000_servings()
    {
        // Ingredient canonical unit is 'g'. 20 kg = 20,000 g
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03, // ₱30/kg = ₱0.03/g
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(20, 'kg'), 'cost_per_unit' => 0.03]
        );

        $product = Product::create([
            'name' => 'Sweet Milk Tea',
            'sku' => 'SKU-SMT-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(10, 'g', $sugar->unit),
            'unit' => 'g',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($availability['is_available']);
        $this->assertEquals(2000, $availability['available']);
        $this->assertEquals(2000, $availability['max_servings']);

        // Cost check: 10g * ₱0.03/g = ₱0.30
        $cost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(0.30, $cost);
    }

    /**
     * TEST 2: Inventory: Sugar = 20 kg, Recipe: Sugar = 0.01 kg -> Same result as 10 g (2,000 servings).
     */
    public function test_test2_sugar_20kg_inventory_and_001kg_recipe_yields_same_2000_servings()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(20, 'kg'), 'cost_per_unit' => 0.03]
        );

        $product = Product::create([
            'name' => 'Sweet Milk Tea 2',
            'sku' => 'SKU-SMT-2',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        // User enters 0.01 kg in recipe
        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(0.01, 'kg', $sugar->unit),
            'unit' => 'g',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($availability['is_available']);
        $this->assertEquals(2000, $availability['available']);
        $this->assertEquals(0.30, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * TEST 3: Inventory: Sugar = 500 g, Recipe: Sugar = 1 kg -> Product unavailable (0 servings).
     */
    public function test_test3_sugar_500g_inventory_and_1kg_recipe_is_unavailable()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500, 'cost_per_unit' => 0.03]
        );

        $product = Product::create([
            'name' => 'Bulk Sugar Bag',
            'sku' => 'SKU-BSB-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(1, 'kg', $sugar->unit), // 1000g
            'unit' => 'g',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($availability['is_available']);
        $this->assertEquals(0, $availability['available']);
    }

    /**
     * TEST 4: Inventory: Milk = 2 L, Recipe: Milk = 100 ml -> 20 servings possible from milk.
     */
    public function test_test4_milk_2l_inventory_and_100ml_recipe_yields_20_servings()
    {
        // Canonical unit is 'ml'. 2 L = 2,000 ml
        $milk = Ingredient::create([
            'name' => 'Fresh Milk',
            'unit' => 'ml',
            'cost_per_base_unit' => 0.08, // ₱80/L = ₱0.08/ml
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(2, 'L'), 'cost_per_unit' => 0.08]
        );

        $product = Product::create([
            'name' => 'Iced Latte',
            'sku' => 'SKU-LATTE-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $milk->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(100, 'ml', $milk->unit),
            'unit' => 'ml',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($availability['is_available']);
        $this->assertEquals(20, $availability['available']);

        // Cost check: 100ml * ₱0.08/ml = ₱8.00
        $this->assertEquals(8.00, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * TEST 5: Inventory: Eggs = 10 pcs, Recipe: Eggs = 2 pcs -> 5 servings possible.
     */
    public function test_test5_eggs_10pcs_inventory_and_2pcs_recipe_yields_5_servings()
    {
        $eggs = Ingredient::create([
            'name' => 'Fresh Eggs',
            'unit' => 'pcs',
            'cost_per_base_unit' => 8.50, // ₱8.50 per egg
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $eggs->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10, 'cost_per_unit' => 8.50]
        );

        $product = Product::create([
            'name' => 'Tamagoyaki',
            'sku' => 'SKU-TAMA-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 80.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $eggs->id,
            'quantity_required' => 2,
            'unit' => 'pcs',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($availability['is_available']);
        $this->assertEquals(5, $availability['available']);
        $this->assertEquals(17.00, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * TEST 6: Incompatible: Sugar (Mass) with Recipe unit 'L' (Volume) -> Validation error rejected.
     */
    public function test_test6_sugar_with_liter_unit_is_rejected_with_validation_error()
    {
        $sugar = Ingredient::create([
            'name' => 'Refined Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000, 'cost_per_unit' => 0.03]
        );

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'Invalid Recipe Product',
                'category_id' => $this->testCategory->id,
                'selling_price' => 100,
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $sugar->id,
                        'quantity_required' => 2,
                        'unit' => 'L', // Incompatible!
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recipe.0.unit']);
    }

    /**
     * TEST 7: Branch separation: Santa Cruz Sugar = 20 kg, Victoria Sugar = 5 kg -> independent.
     */
    public function test_test7_branch_stocks_are_isolated_and_independent()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        // Santa Cruz: 20 kg = 20,000 g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 20000, 'cost_per_unit' => 0.03]
        );

        // Victoria: 5 kg = 5,000 g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 5000, 'cost_per_unit' => 0.03]
        );

        $productSantaCruz = Product::create([
            'name' => 'Sweet Drink SC',
            'sku' => 'SKU-SD-SC',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);
        MenuItemIngredient::create([
            'menu_item_id' => $productSantaCruz->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 10, // 10g per serving
            'unit' => 'g',
        ]);

        $productVictoria = Product::create([
            'name' => 'Sweet Drink VIC',
            'sku' => 'SKU-SD-VIC',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchVictoria->id,
            'unit' => 'pcs',
        ]);
        MenuItemIngredient::create([
            'menu_item_id' => $productVictoria->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 10, // 10g per serving
            'unit' => 'g',
        ]);

        $availSC = $productSantaCruz->dynamicAvailability($this->branchSantaCruz->id);
        $availVIC = $productVictoria->dynamicAvailability($this->branchVictoria->id);

        $this->assertEquals(2000, $availSC['available']);
        $this->assertEquals(500, $availVIC['available']);
    }

    /**
     * TEST 8: Restock: Current 10 kg + Restock 500 g -> 10.5 kg (10,500 g).
     */
    public function test_test8_restock_10kg_with_500g_yields_10_point_5kg()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        $stockRow = IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(10, 'kg'), 'cost_per_unit' => 0.03, 'total_stock_value' => 300]
        );

        $inventoryService = app(InventoryService::class);

        // Restock 500 g
        $inventoryService->stockIn(
            'ingredient',
            $sugar->id,
            500,
            'g',
            $this->branchSantaCruz->id,
            15.00, // ₱15 total cost
            $this->admin->id
        );

        $stockRow->refresh();

        // 10,000 g + 500 g = 10,500 g (10.5 kg)
        $this->assertEquals(10500, $stockRow->stock);
    }

    /**
     * TEST 9: Product sale deduction: Current 20 kg, Recipe 10 g -> 19.99 kg (19,990 g).
     */
    public function test_test9_product_sale_deducts_10g_from_20kg_leaving_19990g()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.03,
        ]);

        $stockRow = IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(20, 'kg'), 'cost_per_unit' => 0.03, 'total_stock_value' => 600]
        );

        $product = Product::create([
            'name' => 'Single Serving Milk Tea',
            'sku' => 'SKU-SSMT-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 10, // 10 g
            'unit' => 'g',
        ]);

        \App\Models\CashierShift::create([
            'cashier_id' => $this->cashierSantaCruz->id,
            'branch_id' => $this->branchSantaCruz->id,
            'opening_balance' => 1000,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        $saleService = app(SaleService::class);

        // Record a sale of 1 item
        $this->actingAs($this->cashierSantaCruz);
        $sale = $saleService->processSale([
            'items' => [
                [
                    'id' => $product->id,
                    'quantity' => 1,
                ]
            ],
            'total' => 100.00,
            'paid_amount' => 100.00,
            'payment_method' => 'cash',
        ]);

        $this->assertNotNull($sale);

        $stockRow->refresh();

        // 20,000 g - 10 g = 19,990 g (19.99 kg)
        $this->assertEquals(19990, $stockRow->stock);
    }
}
