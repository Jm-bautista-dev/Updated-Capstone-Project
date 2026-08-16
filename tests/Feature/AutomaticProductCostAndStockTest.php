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
use App\Services\ProductService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AutomaticProductCostAndStockTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;

    protected function setUp(): void
    {
        parent::setUp();

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
            'name' => 'Japanese Specialties',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);
    }

    /**
     * TEST 1: Inventory: Sugar = 10 kg, Total Cost = ₱1,000 (Unit cost = ₱100/kg).
     * Recipe: Sugar = 1 kg.
     * Expected: Cost Price = ₱100, Available Stock = 10.
     */
    public function test_test1_sugar_10kg_cost_1000_recipe_1kg_yields_cost_100_and_stock_10()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.10, // ₱100 / 1,000g = ₱0.10/g
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(10, 'kg'), 'cost_per_unit' => 0.10]
        );

        $product = Product::create([
            'name' => 'Sweet Rice Cake',
            'sku' => 'SKU-SRC-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 250.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(1, 'kg', $sugar->unit), // 1000g
            'unit' => 'g',
        ]);

        // 1. Cost derivation
        $cost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(100.00, $cost);

        // 2. Stock derivation
        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($availability['is_available']);
        $this->assertEquals(10, $availability['available']);
    }

    /**
     * TEST 2: Inventory: Sugar = 10 kg, Total Cost = ₱1,000 (Unit cost = ₱100/kg).
     * Recipe: Sugar = 2 kg.
     * Expected: Cost Price = ₱200, Available Stock = 5.
     */
    public function test_test2_sugar_10kg_recipe_2kg_yields_cost_200_and_stock_5()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.10,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(10, 'kg'), 'cost_per_unit' => 0.10]
        );

        $product = Product::create([
            'name' => 'Heavy Syrup Cake',
            'sku' => 'SKU-HSC-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 350.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => UnitConverter::convertToBaseQuantityWithIngredient(2, 'kg', $sugar->unit), // 2000g
            'unit' => 'g',
        ]);

        $cost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(200.00, $cost);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(5, $availability['available']);
    }

    /**
     * TEST 3: Recipe: Sugar = 1 kg, Nori = 1 pc.
     * Inventory: Sugar = 10 kg (10 capacity), Nori = 5 pcs (5 capacity).
     * Expected: Product Stock = 5 (Nori is the limiting ingredient).
     */
    public function test_test3_nori_5pcs_is_limiting_ingredient_capping_stock_to_5()
    {
        $sugar = Ingredient::create(['name' => 'Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.10]);
        $nori = Ingredient::create(['name' => 'Nori', 'unit' => 'pcs', 'cost_per_base_unit' => 15.00]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(10, 'kg'), 'cost_per_unit' => 0.10]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5, 'cost_per_unit' => 15.00]
        );

        $product = Product::create([
            'name' => 'Sweet Onigiri',
            'sku' => 'SKU-SO-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 200.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 1000, // 1 kg
            'unit' => 'g',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $nori->id,
            'quantity_required' => 1, // 1 pc
            'unit' => 'pcs',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(5, $availability['available']);
        $this->assertEquals('Nori', $availability['limiting_ingredient']);

        // Cost = (1000g * 0.10) + (1 * 15) = ₱115.00
        $this->assertEquals(115.00, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * TEST 4: One required ingredient has Stock = 0.
     * Expected: Product Stock = 0, OUT OF STOCK.
     */
    public function test_test4_zero_stock_ingredient_makes_product_out_of_stock()
    {
        $rice = Ingredient::create(['name' => 'Japanese Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $nori = Ingredient::create(['name' => 'Nori Sheets', 'unit' => 'pcs', 'cost_per_base_unit' => 10.00]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000, 'cost_per_unit' => 0.05]
        );

        // Nori is 0 stock
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0, 'cost_per_unit' => 10.00]
        );

        $product = Product::create([
            'name' => 'Classic Onigiri',
            'sku' => 'SKU-CO-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $rice->id,
            'quantity_required' => 200,
            'unit' => 'g',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $nori->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($availability['is_available']);
        $this->assertEquals(0, $availability['available']);
        $this->assertEquals('Nori Sheets', $availability['limiting_ingredient']);
    }

    /**
     * TEST 5: Restock a limiting ingredient -> Product availability automatically increases.
     */
    public function test_test5_restocking_limiting_ingredient_automatically_increases_product_stock()
    {
        $nori = Ingredient::create(['name' => 'Nori', 'unit' => 'pcs', 'cost_per_base_unit' => 10.00]);

        $noriStock = IngredientStock::updateOrCreate(
            ['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0, 'cost_per_unit' => 10.00]
        );

        $product = Product::create([
            'name' => 'Nori Roll',
            'sku' => 'SKU-NR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $nori->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        // Before restock: 0 available
        $this->assertEquals(0, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Restock Nori by 25 pcs
        $inventoryService = app(InventoryService::class);
        $inventoryService->stockIn('ingredient', $nori->id, 25, 'pcs', $this->branchSantaCruz->id, 250.00, $this->admin->id);

        // After restock: automatically becomes 25
        $this->assertEquals(25, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * TEST 6: Change recipe quantity -> Cost and Available Stock update automatically.
     */
    public function test_test6_changing_recipe_quantity_updates_cost_and_stock_automatically()
    {
        $sugar = Ingredient::create(['name' => 'Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.10]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10000, 'cost_per_unit' => 0.10]
        );

        $product = Product::create([
            'name' => 'Dynamic Syrup',
            'sku' => 'SKU-DS-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 300.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        $recipeRow = MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 1000, // 1 kg
            'unit' => 'g',
        ]);

        // 1 kg recipe -> Cost = ₱100, Stock = 10
        $this->assertEquals(100.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(10, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Update recipe to 2 kg (2000g)
        $recipeRow->update(['quantity_required' => 2000]);
        $product->unsetRelation('ingredients');

        // 2 kg recipe -> Cost = ₱200, Stock = 5
        $this->assertEquals(200.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(5, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * TEST 7: Manipulated API Request submitting cost_price = 999999 and initial_stock = 999999.
     * Expected: Backend ignores manual values and derives actual calculated values.
     */
    public function test_test7_manipulated_api_request_ignores_manual_cost_and_stock()
    {
        $rice = Ingredient::create(['name' => 'Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000, 'cost_per_unit' => 0.05]
        );

        // Client attempts to submit manipulated cost_price and initial_stock
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'API Manipulated Product',
                'sku' => 'SKU-AMP-999',
                'category_id' => $this->testCategory->id,
                'selling_price' => 150.00,
                'cost_price' => 999999.99, // Fake cost!
                'stock' => 999999, // Fake stock!
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 200, // 200g * 0.05 = ₱10.00 cost
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302); // Redirect back on success web response

        /** @var Product $product */
        $product = Product::where('sku', 'SKU-AMP-999')->firstOrFail();

        // 1. Cost price MUST NOT be 999999.99! It MUST be calculated from recipe (200g * ₱0.05/g = ₱10.00).
        $this->assertEquals(10.00, (float) $product->cost_price);

        // 2. Product stock MUST NOT be 999999! It MUST be derived from ingredient stock (5,000g / 200g = 25).
        $availability = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(25, $availability['available']);
    }

    /**
     * TEST SCENARIO: User's exact Egg scenario
     * Inventory: Egg = 100 pcs, Cost = ₱5.00/pc (Total ₱500)
     * Recipe: Egg = 1 pc
     * Expected: Available stock = 100 products, Cost = ₱5.00
     */
    public function test_user_egg_scenario_100pcs_yields_100_producible_stock_and_cost_5()
    {
        $egg = Ingredient::create([
            'name' => 'new egg',
            'unit' => 'pcs',
            'cost_per_base_unit' => 5.00,
        ]);

        $eggStock = IngredientStock::updateOrCreate(
            ['ingredient_id' => $egg->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100, 'cost_per_unit' => 5.00]
        );

        $product = Product::create([
            'name' => 'Boiled Egg Bowl',
            'sku' => 'SKU-BEB-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        $recipeRow = MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $egg->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        // 1. Stock = 100 pcs, Recipe = 1 pc -> 100 products
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($avail['is_available']);
        $this->assertEquals(100, $avail['available']);
        $this->assertEquals(5.00, $product->computeProductCost($this->branchSantaCruz->id));

        // 2. Change stock to 50 pcs -> 50 products
        $eggStock->update(['stock' => 50]);
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(50, $avail['available']);

        // 3. Change stock to 0 pcs -> 0 products (OUT OF STOCK)
        $eggStock->update(['stock' => 0]);
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);

        // 4. Reset stock to 100 pcs, Recipe = 2 pcs -> 50 products
        $eggStock->update(['stock' => 100]);
        $recipeRow->update(['quantity_required' => 2]);
        $product->unsetRelation('ingredients');
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(50, $avail['available']);
        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));

        // 5. Recipe = 101 pcs -> 0 products (Insufficient stock)
        $recipeRow->update(['quantity_required' => 101]);
        $product->unsetRelation('ingredients');
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(0, $avail['available']);
    }
}
