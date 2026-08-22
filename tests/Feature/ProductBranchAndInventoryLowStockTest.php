<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\User;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductBranchAndInventoryLowStockTest extends TestCase
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
            'name' => 'Main Dishes',
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

    /* ── ISSUE 1: PRODUCT BRANCH SELECTION TESTS ───────────────────────────── */

    /**
     * TEST 1: Select Sta Cruz -> Product creation succeeds for Sta Cruz.
     */
    public function test_create_product_with_single_branch_santa_cruz_succeeds()
    {
        $rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 10000, // 10kg
            'low_stock_level' => 2000,
            'cost_per_unit' => 0.05,
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/products', [
                'name' => 'Santa Cruz Rice Roll',
                'category_id' => $this->testCategory->id,
                'selling_price' => 120.00,
                'unit' => 'pcs',
                'branch_ids' => [(string) $this->branchSantaCruz->id],
                'branch_id' => (string) $this->branchSantaCruz->id,
                'branch_option' => 'single',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 100,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('products', [
            'name' => 'Santa Cruz Rice Roll',
            'branch_id' => $this->branchSantaCruz->id,
        ]);
    }

    /**
     * TEST 2: Select Victoria -> Product creation succeeds for Victoria.
     */
    public function test_create_product_with_single_branch_victoria_succeeds()
    {
        $rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchVictoria->id,
        ], [
            'stock' => 8000, // 8kg
            'low_stock_level' => 2000,
            'cost_per_unit' => 0.05,
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/products', [
                'name' => 'Victoria Rice Roll',
                'category_id' => $this->testCategory->id,
                'selling_price' => 130.00,
                'unit' => 'pcs',
                'branch_ids' => [(string) $this->branchVictoria->id],
                'branch_id' => (string) $this->branchVictoria->id,
                'branch_option' => 'single',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 100,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('products', [
            'name' => 'Victoria Rice Roll',
            'branch_id' => $this->branchVictoria->id,
        ]);
    }

    /**
     * TEST 3: Select Both Branches -> Creates separate product per branch with both relationships.
     */
    public function test_create_product_with_both_branches_succeeds()
    {
        $rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 10000,
            'low_stock_level' => 2000,
            'cost_per_unit' => 0.05,
        ]);
        IngredientStock::updateOrCreate([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchVictoria->id,
        ], [
            'stock' => 10000,
            'low_stock_level' => 2000,
            'cost_per_unit' => 0.05,
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/products', [
                'name' => 'Global Specialty Maki',
                'category_id' => $this->testCategory->id,
                'selling_price' => 180.00,
                'unit' => 'pcs',
                'branch_ids' => [(string) $this->branchSantaCruz->id, (string) $this->branchVictoria->id],
                'branch_option' => 'both',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 100,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302);
        $this->assertEquals(2, Product::where('name', 'Global Specialty Maki')->count());
        $this->assertDatabaseHas('products', ['name' => 'Global Specialty Maki', 'branch_id' => $this->branchSantaCruz->id]);
        $this->assertDatabaseHas('products', ['name' => 'Global Specialty Maki', 'branch_id' => $this->branchVictoria->id]);
    }

    /**
     * TEST 4: Do not select branch -> Returns proper branch validation error.
     */
    public function test_create_product_without_branch_returns_validation_error()
    {
        $rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05,
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->postJson('/products', [
                'name' => 'No Branch Maki',
                'category_id' => $this->testCategory->id,
                'selling_price' => 150.00,
                'unit' => 'pcs',
                'branch_ids' => [],
                'branch_id' => '',
                'branch_option' => '',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 100,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['branch_option']);
    }

    /* ── ISSUE 2: LOW STOCK THRESHOLD TESTS ────────────────────────────────── */

    /**
     * TEST 6: Base Unit kg, Stock: 4 kg (4000g), Threshold: 5 kg (5000g) -> LOW STOCK
     */
    public function test_ingredient_kg_low_stock_threshold_comparison()
    {
        $tomato = Ingredient::create([
            'name' => 'Tomato',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.03,
        ]);

        // 4 kg stock, 5 kg low stock threshold
        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id' => $tomato->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => UnitConverter::convertToBaseQuantity(4, 'kg'), // 4,000 g
            'low_stock_level' => UnitConverter::convertToBaseQuantity(5, 'kg'), // 5,000 g
            'cost_per_unit' => 0.03,
        ]);

        $this->assertTrue($stockRow->isLowStock());
        $this->assertFalse($stockRow->isOutOfStock());
    }

    /**
     * TEST 7: Base Unit kg, Stock: 10 kg (10000g), Threshold: 5 kg (5000g) -> NOT LOW STOCK
     */
    public function test_ingredient_kg_normal_stock_above_threshold()
    {
        $tomato = Ingredient::create([
            'name' => 'Tomato High',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.03,
        ]);

        // 10 kg stock, 5 kg low stock threshold
        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id' => $tomato->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => UnitConverter::convertToBaseQuantity(10, 'kg'), // 10,000 g
            'low_stock_level' => UnitConverter::convertToBaseQuantity(5, 'kg'), // 5,000 g
            'cost_per_unit' => 0.03,
        ]);

        $this->assertFalse($stockRow->isLowStock());
        $this->assertFalse($stockRow->isOutOfStock());
    }

    /**
     * TEST 8: Base Unit L, Stock: 2 L (2000ml), Threshold: 5 L (5000ml) -> LOW STOCK
     */
    public function test_ingredient_liter_low_stock_threshold_comparison()
    {
        $milk = Ingredient::create([
            'name' => 'Fresh Milk',
            'unit' => 'L',
            'cost_per_base_unit' => 0.08,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id' => $milk->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => UnitConverter::convertToBaseQuantity(2, 'L'), // 2,000 ml
            'low_stock_level' => UnitConverter::convertToBaseQuantity(5, 'L'), // 5,000 ml
            'cost_per_unit' => 0.08,
        ]);

        $this->assertTrue($stockRow->isLowStock());
    }

    /**
     * TEST 9: Base Unit pcs, Stock: 15 pcs, Threshold: 20 pcs -> LOW STOCK
     */
    public function test_ingredient_pcs_low_stock_threshold_comparison()
    {
        $egg = Ingredient::create([
            'name' => 'Farm Fresh Egg',
            'unit' => 'pcs',
            'cost_per_base_unit' => 8.00,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id' => $egg->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 15,
            'low_stock_level' => 20,
            'cost_per_unit' => 8.00,
        ]);

        $this->assertTrue($stockRow->isLowStock());
    }

    /**
     * TEST 10: Base Unit g, Stock: 400 g, Threshold: 500 g -> LOW STOCK
     */
    public function test_ingredient_gram_low_stock_threshold_comparison()
    {
        $cheese = Ingredient::create([
            'name' => 'Cheddar Cheese',
            'unit' => 'g',
            'cost_per_base_unit' => 0.40,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id' => $cheese->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 400,
            'low_stock_level' => 500,
            'cost_per_unit' => 0.40,
        ]);

        $this->assertTrue($stockRow->isLowStock());
    }

    /**
     * TEST 11: Inventory API returns converted display units and proper low_stock_level.
     */
    public function test_inventory_api_returns_display_units_and_low_stock_level()
    {
        $tomato = Ingredient::create([
            'name' => 'Roma Tomato',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.03, // ₱30/kg
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $tomato->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 4000, // 4 kg
            'low_stock_level' => 5000, // 5 kg
            'cost_per_unit' => 0.03,
        ]);

        $response = $this->actingAs($this->admin)->get('/inventory');
        $response->assertStatus(200);

        $inventory = $response->viewData('page')['props']['inventory'];
        $item = collect($inventory)->firstWhere('name', 'Roma Tomato');

        $this->assertNotNull($item);
        $this->assertEquals('kg', $item['unit']);
        $this->assertEquals(4.0, (float) $item['stock']);
        $this->assertEquals(5.0, (float) $item['low_stock_level']);
        $this->assertTrue($item['is_low_stock']);
    }

    /**
     * TEST 12: Branch-specific Low Stock Isolation: Santa Cruz Tomato 10kg (Normal), Victoria Tomato 2kg (Low).
     */
    public function test_branch_specific_low_stock_isolation()
    {
        $tomato = Ingredient::create([
            'name' => 'Branch Tomato',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.03,
        ]);

        // Santa Cruz has 10 kg (Normal)
        $stockSantaCruz = IngredientStock::updateOrCreate([
            'ingredient_id' => $tomato->id,
            'branch_id' => $this->branchSantaCruz->id,
        ], [
            'stock' => 10000, // 10 kg
            'low_stock_level' => 5000, // 5 kg threshold
            'cost_per_unit' => 0.03,
        ]);

        // Victoria has 2 kg (Low Stock)
        $stockVictoria = IngredientStock::updateOrCreate([
            'ingredient_id' => $tomato->id,
            'branch_id' => $this->branchVictoria->id,
        ], [
            'stock' => 2000, // 2 kg
            'low_stock_level' => 5000, // 5 kg threshold
            'cost_per_unit' => 0.03,
        ]);

        $this->assertFalse($stockSantaCruz->isLowStock());
        $this->assertTrue($stockVictoria->isLowStock());
    }

    /**
     * TEST 13: Store ingredient via HTTP request converts threshold to canonical units.
     */
    public function test_store_ingredient_converts_low_stock_level_to_canonical()
    {
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->post('/inventory', [
                'name' => 'Premium Olive Oil',
                'unit' => 'liters',
                'initial_stock' => 10, // 10 L
                'low_stock_level' => 3, // 3 L
                'cost_per_base_unit' => 1500, // 1500 for 10L = 0.15/ml
                'branch_id' => $this->branchSantaCruz->id,
            ]);

        $response->assertStatus(302);

        $ingredient = Ingredient::where('name', 'Premium Olive Oil')->first();
        $this->assertNotNull($ingredient);

        $stockRow = IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->first();

        $this->assertNotNull($stockRow);
        // Stored canonical stock: 10,000 ml
        $this->assertEquals(10000.0, (float) $stockRow->stock);
        // Stored canonical threshold: 3,000 ml
        $this->assertEquals(3000.0, (float) $stockRow->low_stock_level);
        $this->assertFalse($stockRow->isLowStock());
    }
}
