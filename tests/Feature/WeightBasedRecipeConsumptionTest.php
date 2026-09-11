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
use App\Services\ProductService;
use App\Services\SaleService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;

class WeightBasedRecipeConsumptionTest extends TestCase
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
            'name' => 'Sushi Rolls',
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
     * TEST A: Exact conversion.
     * Average weight = 50g, Recipe = 10g -> Expected: 0.2 pcs.
     */
    public function test_a_exact_conversion_50g_avg_weight_and_10g_recipe_yields_0_point_2_pcs()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        $converted = UnitConverter::convertToBaseQuantityWithIngredient(
            10,
            'g',
            $seaweed->unit,
            $seaweed->avg_weight_per_piece
        );

        $this->assertEquals(0.2, $converted);
    }

    /**
     * TEST B: Fractional conversion.
     * Average weight = 50g, Recipe = 8g -> Expected: 0.16 pcs.
     */
    public function test_b_fractional_conversion_50g_avg_weight_and_8g_recipe_yields_0_point_16_pcs()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        $converted = UnitConverter::convertToBaseQuantityWithIngredient(
            8,
            'g',
            $seaweed->unit,
            $seaweed->avg_weight_per_piece
        );

        $this->assertEquals(0.16, $converted);
    }

    /**
     * TEST C: Exact weight.
     * Average weight = 50g, Recipe = 50g -> Expected: 1 pcs.
     */
    public function test_c_exact_weight_50g_avg_weight_and_50g_recipe_yields_1_pcs()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        $converted = UnitConverter::convertToBaseQuantityWithIngredient(
            50,
            'g',
            $seaweed->unit,
            $seaweed->avg_weight_per_piece
        );

        $this->assertEquals(1.0, $converted);
    }

    /**
     * TEST D: Multiple ingredients.
     * Garlic = 4 pcs, Seaweed = 8g (50g/pc -> 0.16 pcs), Tomato = 5 pcs.
     * Independent consumption calculation.
     */
    public function test_d_multiple_ingredients_calculate_consumption_independently()
    {
        $garlic = Ingredient::create([
            'name' => 'Garlic',
            'unit' => 'pcs',
            'cost_per_base_unit' => 5.00,
        ]);
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);
        $tomato = Ingredient::create([
            'name' => 'Tomato',
            'unit' => 'pcs',
            'cost_per_base_unit' => 10.00,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $garlic->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 40, 'cost_per_unit' => 5.00]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10, 'cost_per_unit' => 50.00]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50, 'cost_per_unit' => 10.00]
        );

        $product = Product::create([
            'name' => 'Special Combo Roll',
            'sku' => 'SKU-SCR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 200.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $garlic->id,
            'quantity_required' => 4,
            'unit' => 'pcs',
        ]);
        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 8,
            'unit' => 'g',
        ]);
        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $tomato->id,
            'quantity_required' => 5,
            'unit' => 'pcs',
        ]);

        // Garlic capacity: 40 / 4 = 10
        // Seaweed capacity: 10 / 0.16 = 62.5 -> 62
        // Tomato capacity: 50 / 5 = 10
        // Limiting ingredient should be Garlic (or Tomato), producible capacity = 10
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(10, $avail['available']);

        // Product cost: (4 * ₱5) + (0.16 * ₱50) + (5 * ₱10) = 20 + 8 + 50 = ₱78.00
        $cost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(78.00, $cost);
    }

    /**
     * TEST E: Missing average weight on PCS ingredient when using grams.
     * Expected: Validation error rejecting recipe save.
     */
    public function test_e_missing_average_weight_rejects_recipe_with_validation_error()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => null, // NO average weight
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'Invalid Seaweed Product',
                'category_id' => $this->testCategory->id,
                'selling_price' => 150.00,
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $seaweed->id,
                        'quantity_required' => 8,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recipe.0.unit']);
        $this->assertStringContainsString(
            'Average weight per piece is required to use this ingredient in grams.',
            $response->json('errors')['recipe.0.unit'][0]
        );
    }

    /**
     * TEST F: Existing recipe.
     * Existing recipe using Seaweed = 2 pcs must remain 2 pcs and not become grams.
     */
    public function test_f_existing_recipe_using_pcs_remains_unchanged()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Traditional Maki',
            'sku' => 'SKU-TM-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 2,
            'unit' => 'pcs',
        ]);

        $item = $product->ingredients()->first();
        $this->assertEquals('pcs', $item->pivot->unit);
        $this->assertEquals(2.0, (float) $item->pivot->quantity_required);

        // Capacity: 10 / 2 = 5
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(5, $avail['available']);

        // Cost: 2 * ₱50 = ₱100
        $this->assertEquals(100.00, $product->computeProductCost($this->branchSantaCruz->id));
    }

    /**
     * TEST G: Inventory deduction.
     * Stock = 10 pcs, Recipe = 8g (0.16 pcs).
     * Selling 6 products -> 6 * 0.16 = 0.96 pcs.
     * Inventory deduction: 10 pcs - 0.96 pcs = 9.04 pcs.
     */
    public function test_g_inventory_deduction_uses_converted_quantity()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        $stockRow = IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Crispy Seaweed Roll',
            'sku' => 'SKU-CSR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 8,
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
        $this->actingAs($this->cashierSantaCruz);

        // Sell 6 products
        $saleService->processSale([
            'items' => [
                [
                    'id' => $product->id,
                    'quantity' => 6,
                ]
            ],
            'total' => 720.00,
            'paid_amount' => 720.00,
            'payment_method' => 'cash',
        ]);

        $stockRow->refresh();
        // 10 - 0.96 = 9.04 pcs
        $this->assertEquals(9.04, (float) $stockRow->stock);
    }

    /**
     * TEST H: Product availability and shortage explanation.
     * Case 1: Seaweed stock = 10 pcs, avg_weight = 50g, recipe = 8g -> 62 available.
     * Case 2: Seaweed stock = 0.1 pcs (5g), recipe = 8g -> short by 3g.
     */
    public function test_h_product_availability_and_shortage_in_recipe_units()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        $stockRow = IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Seaweed Roll',
            'sku' => 'SKU-SR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 8,
            'unit' => 'g',
        ]);

        // 10 pcs / 0.16 pcs = 62 servings
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($avail['is_available']);
        $this->assertEquals(62, $avail['available']);

        // Now reduce stock to 0.1 pcs (0.1 * 50g = 5g)
        $stockRow->update(['stock' => 0.1]);

        $availInsufficient = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($availInsufficient['is_available']);
        $this->assertEquals(0, $availInsufficient['available']);
        $this->assertEquals('OUT_OF_STOCK', $availInsufficient['status']);
        $this->assertCount(1, $availInsufficient['insufficient_ingredients']);

        $shortage = $availInsufficient['insufficient_ingredients'][0];
        $this->assertEquals(8.0, $shortage['required_quantity']);
        $this->assertEquals(5.0, $shortage['available_quantity']);
        $this->assertEquals(3.0, $shortage['shortage_quantity']);
        $this->assertEquals('g', $shortage['unit']);
        $this->assertStringContainsString('short by 3', $shortage['reason_display']);
        $this->assertStringContainsString('Required: 8', $shortage['reason_display']);
        $this->assertStringContainsString('Available: 5', $shortage['reason_display']);
    }

    /**
     * TEST I: Branch inventory isolation.
     * Santa Cruz Seaweed = 10 pcs (62 servings), Victoria Seaweed = 0 pcs (0 servings).
     */
    public function test_i_branch_inventories_remain_isolated_for_weight_based_recipes()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        // Santa Cruz has 10 pcs
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        // Victoria has 0 pcs
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 0.0, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Global Seaweed Roll',
            'sku' => 'SKU-GSR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => null, // Global product
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 8,
            'unit' => 'g',
        ]);

        $availSC = $product->dynamicAvailability($this->branchSantaCruz->id);
        $availVIC = $product->dynamicAvailability($this->branchVictoria->id);

        $this->assertTrue($availSC['is_available']);
        $this->assertEquals(62, $availSC['available']);

        $this->assertFalse($availVIC['is_available']);
        $this->assertEquals(0, $availVIC['available']);
    }

    /**
     * TEST J: Automatic cost calculation.
     * Inventory: Seaweed = ₱50 per pcs, avg_weight = 50g.
     * Recipe: Seaweed = 8g -> Converted = 0.16 pcs -> Cost = ₱8.00.
     */
    public function test_j_automatic_cost_calculation_uses_converted_quantity()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Nori Roll',
            'sku' => 'SKU-NR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 8,
            'unit' => 'g',
        ]);

        $cost = $product->computeProductCost($this->branchSantaCruz->id);
        $this->assertEquals(8.00, $cost);
    }

    /**
     * TEST K: Product creation via ProductService preserves original unit and quantity.
     */
    public function test_k_product_creation_and_update_retains_original_recipe_configuration()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed Sheet',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        $productService = app(ProductService::class);

        $product = $productService->store([
            'name' => 'Fresh Handroll',
            'sku' => 'SKU-FHR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_option' => 'single',
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
            'recipe' => [
                [
                    'ingredient_id' => $seaweed->id,
                    'quantity_required' => 8,
                    'unit' => 'g',
                ]
            ]
        ], null, [$this->branchSantaCruz->id]);

        $rawRecipeItem = MenuItemIngredient::where('menu_item_id', $product->id)->first();
        $this->assertNotNull($rawRecipeItem);
        $this->assertEquals(8.0, (float) $rawRecipeItem->quantity_required);
        $this->assertEquals('g', $rawRecipeItem->unit);

        // Product cost was automatically computed: 8g / 50g = 0.16 * 50 = ₱8.00
        $this->assertEquals(8.00, (float) $product->cost_price);
    }

    /**
     * TEST L: Updating existing product from PCS to Grams recalculates cost and capacity.
     */
    public function test_l_product_update_from_pcs_to_grams_recalculates_cost_and_stock()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed Sheet 2',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $seaweed->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10.0, 'cost_per_unit' => 50.00]
        );

        $product = Product::create([
            'name' => 'Modifiable Roll',
            'sku' => 'SKU-MR-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $seaweed->id,
            'quantity_required' => 2,
            'unit' => 'pcs',
        ]);

        // Initial: 2 pcs -> cost ₱100, capacity 5
        $this->assertEquals(100.00, $product->computeProductCost($this->branchSantaCruz->id));
        $this->assertEquals(5, $product->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Update to 8 grams
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->put("/products/{$product->id}", [
                'name' => 'Modifiable Roll',
                'category_id' => $this->testCategory->id,
                'selling_price' => 100.00,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $seaweed->id,
                        'quantity_required' => 8,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302);
        $product->refresh();

        // 8g / 50g = 0.16 * 50 = ₱8.00 cost
        $this->assertEquals(8.00, (float) $product->cost_price);

        // Capacity: 10 / 0.16 = 62 servings
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(62, $avail['available']);

        // Raw recipe item stores 8g
        $rawItem = MenuItemIngredient::where('menu_item_id', $product->id)->first();
        $this->assertEquals(8.0, (float) $rawItem->quantity_required);
        $this->assertEquals('g', $rawItem->unit);
    }

    /**
     * TEST M: Validate negative and zero quantities are rejected.
     */
    public function test_m_negative_and_zero_quantities_are_rejected()
    {
        $seaweed = Ingredient::create([
            'name' => 'Seaweed Sheet 3',
            'unit' => 'pcs',
            'cost_per_base_unit' => 50.00,
            'avg_weight_per_piece' => 50.0,
        ]);

        // Zero quantity
        $responseZero = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'Zero Qty Product',
                'category_id' => $this->testCategory->id,
                'selling_price' => 100.00,
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $seaweed->id,
                        'quantity_required' => 0,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $responseZero->assertStatus(422);

        // Negative quantity
        $responseNeg = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'Negative Qty Product',
                'category_id' => $this->testCategory->id,
                'selling_price' => 100.00,
                'branch_option' => 'single',
                'branch_id' => $this->branchSantaCruz->id,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $seaweed->id,
                        'quantity_required' => -5,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $responseNeg->assertStatus(422);
    }
}
