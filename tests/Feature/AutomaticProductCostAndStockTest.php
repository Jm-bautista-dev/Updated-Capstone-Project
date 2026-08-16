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
     * PROMPT TEST 1:
     * 100 kg Tomato, Total Purchase Cost = ₱1,000 (Unit Cost = ₱10/kg = ₱0.01/g).
     * Recipe: 1 kg Tomato.
     * Expected: Product Cost = ₱10.00, Available Stock = 100.
     */
    public function test_prompt_test_1_tomato_100kg_cost_1000_recipe_1kg_yields_cost_10_and_stock_100()
    {
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/inventory', [
                'name' => 'Tomato',
                'unit' => 'kg',
                'initial_stock' => 100,
                'low_stock_level' => 5,
                'cost_per_base_unit' => 1000, // ₱1,000 total
                'branch_ids' => [$this->branchSantaCruz->id],
            ]);

        $response->assertStatus(302);

        $tomato = Ingredient::where('name', 'Tomato')->firstOrFail();
        $stockRow = IngredientStock::where('ingredient_id', $tomato->id)->where('branch_id', $this->branchSantaCruz->id)->firstOrFail();

        // Base Stock = 100,000g, Cost per base unit (g) = 1,000 / 100,000 = ₱0.01/g
        $this->assertEquals(100000, (float) $stockRow->stock);
        $this->assertEquals(0.01, (float) $stockRow->cost_per_unit);

        $product = Product::create([
            'name' => 'Tomato Salad',
            'sku' => 'SKU-TS-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $tomato->id,
            'quantity_required' => 1,
            'unit' => 'kg',
        ]);

        // Recipe: 1 kg (1,000 g) * ₱0.01/g = ₱10.00
        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));

        // Available Stock: 100,000 g / 1,000 g = 100 products
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(100, $avail['available']);
    }

    /**
     * PROMPT TEST 2:
     * 100 kg Tomato, Total Purchase Cost = ₱1,000.
     * Recipe: 500 g Tomato.
     * Expected: Product Cost = ₱5.00, Available Stock = 200.
     */
    public function test_prompt_test_2_tomato_100kg_cost_1000_recipe_500g_yields_cost_5_and_stock_200()
    {
        $tomato = Ingredient::create(['name' => 'Tomato2', 'unit' => 'g', 'cost_per_base_unit' => 0.01]);
        IngredientStock::updateOrCreate(['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 100000, 'cost_per_unit' => 0.01, 'total_stock_value' => 1000]);

        $product = Product::create([
            'name' => 'Tomato Soup',
            'sku' => 'SKU-TS-2',
            'category_id' => $this->testCategory->id,
            'selling_price' => 40.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $tomato->id,
            'quantity_required' => 500,
            'unit' => 'g',
        ]);

        $this->assertEquals(5.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(200, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 3:
     * 100 kg Tomato, Total Purchase Cost = ₱1,000.
     * Recipe: 100 g Tomato.
     * Expected: Product Cost = ₱1.00, Available Stock = 1,000.
     */
    public function test_prompt_test_3_tomato_100kg_cost_1000_recipe_100g_yields_cost_1_and_stock_1000()
    {
        $tomato = Ingredient::create(['name' => 'Tomato3', 'unit' => 'g', 'cost_per_base_unit' => 0.01]);
        IngredientStock::updateOrCreate(['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 100000, 'cost_per_unit' => 0.01, 'total_stock_value' => 1000]);

        $product = Product::create([
            'name' => 'Tomato Garnish',
            'sku' => 'SKU-TS-3',
            'category_id' => $this->testCategory->id,
            'selling_price' => 20.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $tomato->id,
            'quantity_required' => 100,
            'unit' => 'g',
        ]);

        $this->assertEquals(1.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(1000, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 4:
     * 100 pcs Egg, Total Purchase Cost = ₱1,000.
     * Recipe: 1 pcs Egg.
     * Expected: Product Cost = ₱10.00, Available Stock = 100.
     */
    public function test_prompt_test_4_egg_100pcs_cost_1000_recipe_1pc_yields_cost_10_and_stock_100()
    {
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/inventory', [
                'name' => 'Egg',
                'unit' => 'pcs',
                'initial_stock' => 100,
                'low_stock_level' => 5,
                'cost_per_base_unit' => 1000,
                'branch_ids' => [$this->branchSantaCruz->id],
            ]);

        $response->assertStatus(302);

        $egg = Ingredient::where('name', 'Egg')->firstOrFail();
        $stockRow = IngredientStock::where('ingredient_id', $egg->id)->where('branch_id', $this->branchSantaCruz->id)->firstOrFail();

        $this->assertEquals(100, (float) $stockRow->stock);
        $this->assertEquals(10.00, (float) $stockRow->cost_per_unit);

        $product = Product::create([
            'name' => 'Fried Egg',
            'sku' => 'SKU-FE-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 30.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $egg->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(100, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 5:
     * 100 pcs Egg, Total Purchase Cost = ₱1,000.
     * Recipe: 2 pcs Egg.
     * Expected: Product Cost = ₱20.00, Available Stock = 50.
     */
    public function test_prompt_test_5_egg_100pcs_cost_1000_recipe_2pcs_yields_cost_20_and_stock_50()
    {
        $egg = Ingredient::create(['name' => 'Egg5', 'unit' => 'pcs', 'cost_per_base_unit' => 10.00]);
        IngredientStock::updateOrCreate(['ingredient_id' => $egg->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 100, 'cost_per_unit' => 10.00, 'total_stock_value' => 1000]);

        $product = Product::create([
            'name' => 'Double Egg Omelet',
            'sku' => 'SKU-DEO-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 60.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $egg->id,
            'quantity_required' => 2,
            'unit' => 'pcs',
        ]);

        $this->assertEquals(20.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(50, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 6:
     * 0 Stock handling.
     * Expected: Handled safely, Stock = 0, OUT OF STOCK.
     */
    public function test_prompt_test_6_zero_stock_handled_safely()
    {
        $sugar = Ingredient::create(['name' => 'ZeroSugar', 'unit' => 'g', 'cost_per_base_unit' => 0.10]);
        IngredientStock::updateOrCreate(['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 0, 'cost_per_unit' => 0.10, 'total_stock_value' => 0]);

        $product = Product::create([
            'name' => 'Zero Product',
            'sku' => 'SKU-ZP-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 100,
            'unit' => 'g',
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);
        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * PROMPT TEST 7:
     * Invalid unit conversion (kg ingredient vs pcs recipe without avg weight).
     * Expected: Validation error. Never silently calculate.
     */
    public function test_prompt_test_7_invalid_unit_conversion_rejected_with_validation_error()
    {
        $flour = Ingredient::create(['name' => 'Flour', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        IngredientStock::updateOrCreate(['ingredient_id' => $flour->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 10000, 'cost_per_unit' => 0.05]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'Invalid Unit Bread',
                'sku' => 'SKU-IUB-1',
                'category_id' => $this->testCategory->id,
                'selling_price' => 150.00,
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $flour->id,
                        'quantity_required' => 1,
                        'unit' => 'pcs', // Incompatible with mass (g)
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recipe.0.unit']);
    }

    /**
     * PROMPT TEST 8:
     * 10 kg Sugar, Total Purchase Cost = ₱1,000.
     * Recipe: 1 kg Sugar.
     * Expected: Cost = ₱100.00, Stock = 10.
     */
    public function test_prompt_test_8_sugar_10kg_cost_1000_recipe_1kg_yields_cost_100_and_stock_10()
    {
        $sugar = Ingredient::create(['name' => 'Sugar8', 'unit' => 'g', 'cost_per_base_unit' => 0.10]);
        IngredientStock::updateOrCreate(['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 10000, 'cost_per_unit' => 0.10, 'total_stock_value' => 1000]);

        $product = Product::create([
            'name' => 'Sweet Cake',
            'sku' => 'SKU-SC-8',
            'category_id' => $this->testCategory->id,
            'selling_price' => 200.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 1,
            'unit' => 'kg',
        ]);

        $this->assertEquals(100.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(10, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 9:
     * 10 kg Sugar, Total Purchase Cost = ₱1,000.
     * Recipe: 2 kg Sugar.
     * Expected: Cost = ₱200.00, Stock = 5.
     */
    public function test_prompt_test_9_sugar_10kg_cost_1000_recipe_2kg_yields_cost_200_and_stock_5()
    {
        $sugar = Ingredient::create(['name' => 'Sugar9', 'unit' => 'g', 'cost_per_base_unit' => 0.10]);
        IngredientStock::updateOrCreate(['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 10000, 'cost_per_unit' => 0.10, 'total_stock_value' => 1000]);

        $product = Product::create([
            'name' => 'Heavy Sweet Cake',
            'sku' => 'SKU-HSC-9',
            'category_id' => $this->testCategory->id,
            'selling_price' => 300.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $sugar->id,
            'quantity_required' => 2,
            'unit' => 'kg',
        ]);

        $this->assertEquals(200.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(5, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 10:
     * Multiple ingredients: Product cost = sum of ingredient costs, Stock = minimum ingredient capacity.
     */
    public function test_prompt_test_10_multiple_ingredients_sum_costs_and_limit_stock()
    {
        $rice = Ingredient::create(['name' => 'MultiRice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $nori = Ingredient::create(['name' => 'MultiNori', 'unit' => 'pcs', 'cost_per_base_unit' => 15.00]);

        IngredientStock::updateOrCreate(['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 10000, 'cost_per_unit' => 0.05]); // 10,000g / 1,000g = 10 capacity
        IngredientStock::updateOrCreate(['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 5, 'cost_per_unit' => 15.00]);    // 5 pcs / 1 pc = 5 capacity

        $product = Product::create([
            'name' => 'Combo Roll',
            'sku' => 'SKU-CR-10',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create(['menu_item_id' => $product->id, 'ingredient_id' => $rice->id, 'quantity_required' => 1, 'unit' => 'kg']); // 1,000g * 0.05 = ₱50
        MenuItemIngredient::create(['menu_item_id' => $product->id, 'ingredient_id' => $nori->id, 'quantity_required' => 1, 'unit' => 'pcs']);  // 1 pc * 15 = ₱15

        // Product Cost = ₱50 + ₱15 = ₱65.00
        $this->assertEquals(65.00, $product->computeProductCost($this->branchSantaCruz->id));

        // Available Stock = MIN(10, 5) = 5
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(5, $avail['available']);
        $this->assertEquals('MultiNori', $avail['limiting_ingredient']);
    }

    /**
     * PROMPT TEST 11:
     * Branch isolation: Sta Cruz = 100 kg, Victoria = 20 kg.
     * Expected: Sta Cruz calculation = 100 capacity, Victoria calculation = 20 capacity. Never combine.
     */
    public function test_prompt_test_11_branch_isolation_never_combines_stock()
    {
        $tomato = Ingredient::create(['name' => 'IsoTomato', 'unit' => 'g', 'cost_per_base_unit' => 0.01]);
        IngredientStock::updateOrCreate(['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id], ['stock' => 100000, 'cost_per_unit' => 0.01]); // 100kg
        IngredientStock::updateOrCreate(['ingredient_id' => $tomato->id, 'branch_id' => $this->branchVictoria->id], ['stock' => 20000, 'cost_per_unit' => 0.01]);   // 20kg

        $product = Product::create([
            'name' => 'Isolated Salad',
            'sku' => 'SKU-IS-11',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => null,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create(['menu_item_id' => $product->id, 'ingredient_id' => $tomato->id, 'quantity_required' => 1, 'unit' => 'kg']);

        $this->assertEquals(100, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
        $this->assertEquals(20, $product->dynamicAvailability($this->branchVictoria->id)['available']);
    }

    /**
     * PROMPT TEST 12:
     * Database audit / backfill verification:
     * Existing Egg stock record with incorrect cost_per_unit = ₱0.10 but total_stock_value = ₱1,000 and stock = 100 pcs.
     * Expected: Migration / recalculation corrects cost_per_unit to ₱10.00.
     */
    public function test_prompt_test_12_existing_incorrect_egg_cost_recalculated_by_backfill()
    {
        $egg = Ingredient::create(['name' => 'Legacy Egg', 'unit' => 'pcs', 'cost_per_base_unit' => 0.10]);
        $stockRow = IngredientStock::updateOrCreate(
            ['ingredient_id' => $egg->id, 'branch_id' => $this->branchSantaCruz->id],
            [
                'stock' => 100,
                'cost_per_unit' => 0.10, // Incorrect legacy value
                'total_stock_value' => 1000, // Authoritative total cost = ₱1,000
            ]
        );

        // Run the backfill migration logic
        $migration = require database_path('migrations/2026_08_16_000001_recalculate_ingredient_stock_costs.php');
        $migration->up();

        $stockRow->refresh();
        $egg->refresh();

        // Corrected cost_per_unit = ₱1,000 / 100 pcs = ₱10.00/pc
        $this->assertEquals(10.00, (float) $stockRow->cost_per_unit);
        $this->assertEquals(10.00, (float) $egg->cost_per_base_unit);

        $product = Product::create([
            'name' => 'Legacy Egg Bowl',
            'sku' => 'SKU-LEB-12',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create(['menu_item_id' => $product->id, 'ingredient_id' => $egg->id, 'quantity_required' => 1, 'unit' => 'pcs']);

        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(100, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 13:
     * Restocking using Weighted Average Costing (WAC):
     * Existing: 100 kg @ ₱10/kg (₱1,000 total).
     * New Batch: 20 kg @ ₱15/kg (₱300 total).
     * New WAC = ₱1,300 / 120 kg = ₱10.8333/kg = ₱0.0108333/g.
     * Product recipe (1 kg) recalculates to ₱10.83.
     */
    public function test_prompt_test_13_wac_restocking_updates_cost_and_stock_correctly()
    {
        $inventoryService = app(\App\Services\InventoryService::class);

        $tomato = Ingredient::create(['name' => 'WACTomato', 'unit' => 'kg', 'cost_per_base_unit' => 0.01]);
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100000, 'cost_per_unit' => 0.01, 'total_stock_value' => 1000]
        );

        $product = Product::create([
            'name' => 'WAC Salad',
            'sku' => 'SKU-WAC-13',
            'category_id' => $this->testCategory->id,
            'selling_price' => 80.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create(['menu_item_id' => $product->id, 'ingredient_id' => $tomato->id, 'quantity_required' => 1, 'unit' => 'kg']);

        $this->assertEquals(10.00, $product->computeProductCost($this->branchSantaCruz->id));

        // Restock +20 kg @ ₱300 total purchase cost
        $inventoryService->stockIn(
            Ingredient::class,
            $tomato->id,
            20,
            'kg',
            $this->branchSantaCruz->id,
            300,
            $this->admin->id
        );

        $product->unsetRelation('ingredients');
        $stockRow = IngredientStock::where('ingredient_id', $tomato->id)->where('branch_id', $this->branchSantaCruz->id)->firstOrFail();

        // 120,000 grams total stock
        $this->assertEquals(120000, (float) $stockRow->stock);
        // ₱1,300 total value
        $this->assertEquals(1300, (float) $stockRow->total_stock_value);
        // ₱0.0108/g
        $this->assertEquals(0.0108, round((float) $stockRow->cost_per_unit, 4));

        // Recipe: 1 kg (1,000 g) * 0.0108/g = ₱10.80
        $this->assertEquals(10.80, round($product->computeProductCost($this->branchSantaCruz->id), 2));
        // Available stock: 120,000 / 1,000 = 120 products
        $this->assertEquals(120, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);
    }

    /**
     * PROMPT TEST 14:
     * API Manipulation Resistance:
     * Submitting manual cost_price = 999999 and stock = 888888 in POST /products is ignored and derived automatically.
     */
    public function test_prompt_test_14_api_manipulation_is_ignored_and_recalculated()
    {
        $egg = Ingredient::create(['name' => 'Secure Egg', 'unit' => 'pcs', 'cost_per_base_unit' => 10.00]);
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $egg->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100, 'cost_per_unit' => 10.00, 'total_stock_value' => 1000]
        );

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/products', [
                'name' => 'Hacked Product',
                'sku' => 'SKU-HACK-14',
                'category_id' => $this->testCategory->id,
                'selling_price' => 100.00,
                'cost_price' => 999999.99, // Attempted hack
                'stock' => 888888,          // Attempted hack
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $egg->id,
                        'quantity_required' => 1,
                        'unit' => 'pcs',
                    ]
                ]
            ]);

        $response->assertStatus(302);

        /** @var Product $product */
        $product = Product::where('name', 'Hacked Product')->firstOrFail();
        $this->assertEquals(10.00, (float) $product->cost_price);
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(100, $avail['available']);
    }
}
