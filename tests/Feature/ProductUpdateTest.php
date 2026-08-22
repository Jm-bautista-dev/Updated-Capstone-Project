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
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductUpdateTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;
    public User $cashierSantaCruz;
    public User $customer;

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

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * TEST 1: Update global product (branch_id = null) name only -> 200/302 success, no 500 error!
     */
    public function test_update_global_product_name_succeeds_without_exception()
    {
        $product = Product::create([
            'id' => 13, // Test exact ID 13
            'name' => 'Edamame Original',
            'sku' => 'SKU-EDAMAME-13',
            'category_id' => $this->testCategory->id,
            'selling_price' => 90.00,
            'branch_id' => null, // Global product
            'unit' => 'pcs',
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->put("/products/{$product->id}", [
                'name' => 'Edamame Premium Salted',
                'sku' => 'SKU-EDAMAME-13',
                'category_id' => $this->testCategory->id,
                'selling_price' => 95.00,
                'unit' => 'pcs',
            ]);

        $response->assertStatus(302);
        $product->refresh();
        $this->assertEquals('Edamame Premium Salted', $product->name);
        $this->assertEquals(95.00, (float) $product->selling_price);
    }

    /**
     * TEST 2: Update global product with recipe -> converts units, derives cost & stock, no 500 error!
     */
    public function test_update_global_product_with_recipe_derives_cost_and_stock()
    {
        $edamameBeans = Ingredient::create([
            'name' => 'Edamame Beans',
            'unit' => 'g',
            'cost_per_base_unit' => 0.20, // ₱0.20/g
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $edamameBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000, 'cost_per_unit' => 0.20] // 5,000g in Santa Cruz
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $edamameBeans->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 2000, 'cost_per_unit' => 0.20] // 2,000g in Victoria
        );

        $product = Product::create([
            'id' => 13,
            'name' => 'Edamame',
            'sku' => 'SKU-EDA-13',
            'category_id' => $this->testCategory->id,
            'selling_price' => 90.00,
            'branch_id' => null,
            'unit' => 'pcs',
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->put("/products/{$product->id}", [
                'name' => 'Steamed Edamame Bowl',
                'sku' => 'SKU-EDA-13',
                'category_id' => $this->testCategory->id,
                'selling_price' => 110.00,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $edamameBeans->id,
                        'quantity_required' => 100, // 100g
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(302);

        $product->refresh();
        $this->assertEquals('Steamed Edamame Bowl', $product->name);

        // Recipe: 100g * ₱0.20/g = ₱20.00
        $this->assertEquals(20.00, (float) $product->cost_price);

        // Stock in Santa Cruz: 5000 / 100 = 50 units
        $availSC = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($availSC['is_available']);
        $this->assertEquals(50, $availSC['available']);

        // Stock in Victoria: 2000 / 100 = 20 units
        $availVIC = $product->dynamicAvailability($this->branchVictoria->id);
        $this->assertTrue($availVIC['is_available']);
        $this->assertEquals(20, $availVIC['available']);
    }

    /**
     * TEST 3: Update recipe unit (e.g. from 100g to 0.2kg) -> converts base unit accurately.
     */
    public function test_update_recipe_unit_conversion_recalculates_cost_and_capacity()
    {
        $edamameBeans = Ingredient::create([
            'name' => 'Edamame Beans 2',
            'unit' => 'g',
            'cost_per_base_unit' => 0.20,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $edamameBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000, 'cost_per_unit' => 0.20]
        );

        $product = Product::create([
            'name' => 'Large Edamame',
            'sku' => 'SKU-LE-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 180.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
        ]);

        // Update with 0.2 kg (= 200 g)
        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->put("/products/{$product->id}", [
                'name' => 'Large Edamame Portion',
                'category_id' => $this->testCategory->id,
                'selling_price' => 180.00,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $edamameBeans->id,
                        'quantity_required' => 0.2, // 0.2 kg = 200g
                        'unit' => 'kg',
                    ]
                ]
            ]);

        $response->assertStatus(302);
        $product->refresh();

        // 200g * 0.20 = ₱40.00 cost
        $this->assertEquals(40.00, (float) $product->cost_price);

        // Capacity: 5000g / 200g = 25 units
        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertEquals(25, $avail['available']);
    }

    /**
     * TEST 4: Invalid recipe unit (mass ingredient with volume unit 'L') returns 422 validation error, not 500.
     */
    public function test_invalid_recipe_unit_returns_422_validation_error()
    {
        $sugar = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);

        $product = Product::create([
            'name' => 'Sweet Snack',
            'sku' => 'SKU-SS-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => null,
            'unit' => 'pcs',
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->putJson("/products/{$product->id}", [
                'name' => 'Sweet Snack',
                'category_id' => $this->testCategory->id,
                'selling_price' => 50.00,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $sugar->id,
                        'quantity_required' => 2,
                        'unit' => 'L', // Incompatible unit!
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recipe.0.unit']);
    }

    /**
     * TEST 5: Duplicate ingredients in recipe returns 422 validation error, not 500.
     */
    public function test_duplicate_ingredients_in_recipe_returns_422_validation_error()
    {
        $rice = Ingredient::create([
            'name' => 'Rice',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);

        $product = Product::create([
            'name' => 'Rice Dish',
            'sku' => 'SKU-RD-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => null,
            'unit' => 'pcs',
        ]);

        $response = $this->actingAs($this->admin)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->putJson("/products/{$product->id}", [
                'name' => 'Rice Dish',
                'category_id' => $this->testCategory->id,
                'selling_price' => 50.00,
                'unit' => 'pcs',
                'recipe' => [
                    [
                        'ingredient_id' => $rice->id,
                        'quantity_required' => 100,
                        'unit' => 'g',
                    ],
                    [
                        'ingredient_id' => $rice->id, // Duplicate!
                        'quantity_required' => 50,
                        'unit' => 'g',
                    ]
                ]
            ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['recipe']);
    }

    /**
     * TEST 6: Unauthorized user (customer) attempting to update product returns 403 Forbidden.
     */
    public function test_customer_cannot_update_product()
    {
        $product = Product::create([
            'name' => 'Secret Dish',
            'sku' => 'SKU-SD-99',
            'category_id' => $this->testCategory->id,
            'selling_price' => 50.00,
            'branch_id' => null,
            'unit' => 'pcs',
        ]);

        $response = $this->actingAs($this->customer)
            ->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class)
            ->putJson("/products/{$product->id}", [
                'name' => 'Hacked Dish',
                'category_id' => $this->testCategory->id,
                'selling_price' => 1.00,
                'unit' => 'pcs',
            ]);

        $response->assertStatus(403);
    }
}
