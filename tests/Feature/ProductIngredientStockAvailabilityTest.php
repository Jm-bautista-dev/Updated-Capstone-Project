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
use App\Models\Cart;
use App\Services\SaleService;
use App\Services\DeliveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductIngredientStockAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public $testCategory;
    public User $cashierSantaCruz;
    public User $customer;

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
            'name' => 'Beverages',
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
     * Helper to create a product with a recipe.
     */
    protected function createProductWithRecipe(string $name, array $recipe, ?int $branchId = null): Product
    {
        $product = Product::create([
            'name' => $name,
            'sku' => 'SKU-' . strtoupper(uniqid()),
            'category_id' => $this->testCategory->id,
            'selling_price' => 100.00,
            'branch_id' => $branchId,
            'unit' => 'pcs',
        ]);

        foreach ($recipe as $item) {
            MenuItemIngredient::create([
                'menu_item_id' => $product->id,
                'ingredient_id' => $item['ingredient']->id,
                'quantity_required' => $item['quantity'],
                'unit' => $item['unit'] ?? $item['ingredient']->unit,
            ]);
        }

        return $product->fresh(['ingredients']);
    }

    /**
     * TEST 1: All ingredients have sufficient stock -> Product AVAILABLE.
     */
    public function test_test1_all_ingredients_sufficient_stock_makes_product_available()
    {
        $coffeeBeans = Ingredient::create(['name' => 'Coffee Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);
        $milk = Ingredient::create(['name' => 'Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.5]);
        $sugar = Ingredient::create(['name' => 'Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.2]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffeeBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100] // Need 20g
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500] // Need 150ml
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100] // Need 10g
        );

        $icedCoffee = $this->createProductWithRecipe('Iced Coffee', [
            ['ingredient' => $coffeeBeans, 'quantity' => 20, 'unit' => 'g'],
            ['ingredient' => $milk, 'quantity' => 150, 'unit' => 'ml'],
            ['ingredient' => $sugar, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $availability = $icedCoffee->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($availability['is_available']);
        $this->assertGreaterThanOrEqual(1, $availability['available']);
        $this->assertEquals(3, (int) $availability['available']); // min(100/20=5, 500/150=3, 100/10=10) = 3
    }

    /**
     * TEST 2: One required ingredient has zero stock -> Product OUT OF STOCK.
     */
    public function test_test2_one_ingredient_zero_stock_makes_product_out_of_stock()
    {
        $coffeeBeans = Ingredient::create(['name' => 'Coffee Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);
        $milk = Ingredient::create(['name' => 'Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.5]);
        $sugar = Ingredient::create(['name' => 'Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.2]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffeeBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0] // 0 stock!
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100]
        );

        $icedCoffee = $this->createProductWithRecipe('Iced Coffee', [
            ['ingredient' => $coffeeBeans, 'quantity' => 20, 'unit' => 'g'],
            ['ingredient' => $milk, 'quantity' => 150, 'unit' => 'ml'],
            ['ingredient' => $sugar, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $availability = $icedCoffee->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($availability['is_available']);
        $this->assertEquals(0, $availability['available']);
        $this->assertEquals('Coffee Beans', $availability['limiting_ingredient']);

        // Check simpleStockCheck
        $check = $icedCoffee->simpleStockCheck(1, $this->branchSantaCruz->id);
        $this->assertFalse($check['success']);
    }

    /**
     * TEST 3: One required ingredient has insufficient stock (< 1 unit) -> Product OUT OF STOCK.
     */
    public function test_test3_insufficient_stock_for_single_unit_makes_product_out_of_stock()
    {
        $coffeeBeans = Ingredient::create(['name' => 'Coffee Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);
        $milk = Ingredient::create(['name' => 'Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffeeBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10] // Needs 20g, only 10g available
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500]
        );

        $icedCoffee = $this->createProductWithRecipe('Iced Coffee', [
            ['ingredient' => $coffeeBeans, 'quantity' => 20, 'unit' => 'g'],
            ['ingredient' => $milk, 'quantity' => 150, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        $availability = $icedCoffee->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($availability['is_available']);
        $this->assertEquals(0, $availability['available']);
    }

    /**
     * TEST 4: All ingredients have enough stock for 5 units but not 6 -> 5 allowed, 6 rejected.
     */
    public function test_test4_order_quantity_boundary_validation()
    {
        $milk = Ingredient::create(['name' => 'Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500] // 100ml per unit => exactly 5 units
        );

        $milkTea = $this->createProductWithRecipe('Milk Tea', [
            ['ingredient' => $milk, 'quantity' => 100, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        $check5 = $milkTea->simpleStockCheck(5, $this->branchSantaCruz->id);
        $this->assertTrue($check5['success']);

        $check6 = $milkTea->simpleStockCheck(6, $this->branchSantaCruz->id);
        $this->assertFalse($check6['success']);
    }

    /**
     * TEST 5: Ingredient is restocked -> Product becomes AVAILABLE again.
     */
    public function test_test5_restocked_ingredient_dynamically_makes_product_available()
    {
        $coffeeBeans = Ingredient::create(['name' => 'Coffee Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);

        $stockRecord = IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffeeBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );

        $espresso = $this->createProductWithRecipe('Espresso', [
            ['ingredient' => $coffeeBeans, 'quantity' => 20, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // Before restock
        $this->assertFalse($espresso->dynamicAvailability($this->branchSantaCruz->id)['is_available']);

        // Restock
        $stockRecord->update(['stock' => 100]);

        // After restock (dynamic calculation, no stale status)
        $avail = $espresso->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($avail['is_available']);
        $this->assertEquals(5, (int) $avail['available']);
    }

    /**
     * TEST 6: Santa Cruz ingredient is out of stock but Victoria has stock -> Santa Cruz OUT OF STOCK, Victoria AVAILABLE.
     */
    public function test_test6_branch_isolated_inventory_stock()
    {
        $matcha = Ingredient::create(['name' => 'Matcha Powder', 'unit' => 'g', 'cost_per_base_unit' => 2]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $matcha->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0] // Santa Cruz is out
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $matcha->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 100] // Victoria has 100g
        );

        $matchaLatte = $this->createProductWithRecipe('Matcha Latte', [
            ['ingredient' => $matcha, 'quantity' => 10, 'unit' => 'g'],
        ]);

        $santaCruzAvail = $matchaLatte->dynamicAvailability($this->branchSantaCruz->id);
        $victoriaAvail = $matchaLatte->dynamicAvailability($this->branchVictoria->id);

        $this->assertFalse($santaCruzAvail['is_available']);
        $this->assertEquals(0, $santaCruzAvail['available']);

        $this->assertTrue($victoriaAvail['is_available']);
        $this->assertEquals(10, (int) $victoriaAvail['available']);
    }

    /**
     * TEST 7: Frontend says product is available but backend rejects when inventory is insufficient.
     */
    public function test_test7_backend_validates_and_rejects_order_if_inventory_insufficient()
    {
        $beans = Ingredient::create(['name' => 'Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $beans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );

        $americano = $this->createProductWithRecipe('Americano', [
            ['ingredient' => $beans, 'quantity' => 20, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // Attempt API order submission
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/orders', [
            'customer_name' => 'John Doe',
            'mobile_number' => '09123456789',
            'address' => 'Santa Cruz, Manila',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'branch_id' => $this->branchSantaCruz->id,
            'items' => [
                [
                    'product_id' => $americano->id,
                    'quantity' => 1,
                    'price' => 100,
                ]
            ],
            'total_amount' => 100,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
        ]);

        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * TEST 8: Multi-product / batch validation prevents cumulative stock over-allocation.
     */
    public function test_test8_multi_item_cumulative_stock_over_allocation_rejected()
    {
        $milk = Ingredient::create(['name' => 'Fresh Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.05]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500] // Only 500ml available
        );

        $latte = $this->createProductWithRecipe('Cafe Latte', [
            ['ingredient' => $milk, 'quantity' => 300, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        $cappuccino = $this->createProductWithRecipe('Cappuccino', [
            ['ingredient' => $milk, 'quantity' => 300, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        // Item 1 requires 300ml, Item 2 requires 300ml -> Total 600ml needed, but only 500ml in stock
        $items = [
            ['product_id' => $latte->id, 'quantity' => 1],
            ['product_id' => $cappuccino->id, 'quantity' => 1],
        ];

        $batchCheck = Product::validateBatchStock($this->branchSantaCruz->id, $items);
        $this->assertFalse($batchCheck['success']);

        // Check Cart validation
        $cart = Cart::create([
            'user_id' => $this->customer->id,
            'branch_id' => $this->branchSantaCruz->id,
        ]);

        $cart->items()->create([
            'product_id' => $latte->id,
            'quantity' => 1,
            'branch_id' => $this->branchSantaCruz->id,
        ]);
        $cart->items()->create([
            'product_id' => $cappuccino->id,
            'quantity' => 1,
            'branch_id' => $this->branchSantaCruz->id,
        ]);

        $cartValidationResponse = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/cart/validate');
        $cartValidationResponse->assertStatus(422);
        $cartValidationResponse->assertJson(['success' => false]);
    }
}
