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
use App\Models\CashierShift;
use App\Services\SaleService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class ProductIngredientStockAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;
    public User $cashierSantaCruz;
    public User $cashierVictoria;
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
            'name' => 'Japanese Cuisine',
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

        $this->cashierVictoria = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchVictoria->id,
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
            $inputUnit = $item['unit'] ?? $item['ingredient']->unit;
            $baseUnit = UnitConverter::normalizeUnit($item['ingredient']->unit);
            $baseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                (float) $item['quantity'],
                $inputUnit,
                $item['ingredient']->unit,
                $item['ingredient']->avg_weight_per_piece ?? null
            );

            MenuItemIngredient::create([
                'menu_item_id' => $product->id,
                'ingredient_id' => $item['ingredient']->id,
                'quantity_required' => $baseQty,
                'unit' => $baseUnit,
            ]);
        }

        return $product->fresh(['ingredients']);
    }

    /**
     * TEST 1: Ingredient available -> Product AVAILABLE
     */
    public function test_test1_ingredient_available_makes_product_available()
    {
        $rice = Ingredient::create(['name' => 'Japanese Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 2000, 'cost_per_unit' => 0.05] // 2,000g in stock
        );

        $maki = $this->createProductWithRecipe('Maki Roll', [
            ['ingredient' => $rice, 'quantity' => 200, 'unit' => 'g'], // 200g per roll
        ], $this->branchSantaCruz->id);

        $avail = $maki->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($avail['is_available']);
        $this->assertEquals(10, $avail['available']); // 2000 / 200 = 10
    }

    /**
     * TEST 2: One ingredient zero -> Product OUT OF STOCK
     */
    public function test_test2_one_ingredient_zero_makes_product_out_of_stock()
    {
        $rice = Ingredient::create(['name' => 'Japanese Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $nori = Ingredient::create(['name' => 'Nori Seaweed', 'unit' => 'pcs', 'cost_per_base_unit' => 5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 5000] // Plenty of rice
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0] // 0 Nori
        );

        $maki = $this->createProductWithRecipe('Maki Roll', [
            ['ingredient' => $rice, 'quantity' => 200, 'unit' => 'g'],
            ['ingredient' => $nori, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $avail = $maki->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);
        $this->assertEquals('Nori Seaweed', $avail['limiting_ingredient']);
    }

    /**
     * TEST 3: One ingredient insufficient (< 1 unit) -> Product OUT OF STOCK
     */
    public function test_test3_one_ingredient_insufficient_for_single_unit_makes_product_out_of_stock()
    {
        $beef = Ingredient::create(['name' => 'Beef', 'unit' => 'g', 'cost_per_base_unit' => 0.4]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $beef->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50] // 50g available, but recipe needs 150g
        );

        $gyudon = $this->createProductWithRecipe('Gyudon', [
            ['ingredient' => $beef, 'quantity' => 150, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $avail = $gyudon->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);
    }

    /**
     * TEST 4: Multiple ingredients -> Minimum capacity determines product stock
     */
    public function test_test4_multiple_ingredients_minimum_capacity_determines_product_stock()
    {
        $rice = Ingredient::create(['name' => 'Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $salmon = Ingredient::create(['name' => 'Salmon', 'unit' => 'g', 'cost_per_base_unit' => 0.8]);
        $nori = Ingredient::create(['name' => 'Nori', 'unit' => 'pcs', 'cost_per_base_unit' => 2]);

        // Rice: 1000g / 200g = 5 servings
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 1000]
        );
        // Salmon: 300g / 100g = 3 servings (Limiting!)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $salmon->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 300]
        );
        // Nori: 20 pcs / 1 pc = 20 servings
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $nori->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 20]
        );

        $salmonRoll = $this->createProductWithRecipe('Salmon Roll', [
            ['ingredient' => $rice, 'quantity' => 200, 'unit' => 'g'],
            ['ingredient' => $salmon, 'quantity' => 100, 'unit' => 'g'],
            ['ingredient' => $nori, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $avail = $salmonRoll->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($avail['is_available']);
        $this->assertEquals(3, $avail['available']);
        $this->assertEquals('Salmon', $avail['limiting_ingredient']);
    }

    /**
     * TEST 5: Santa Cruz available / Victoria unavailable -> Separate branch statuses
     */
    public function test_test5_santa_cruz_available_and_victoria_unavailable()
    {
        $tomato = Ingredient::create(['name' => 'Tomato', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $pasta = Ingredient::create(['name' => 'Pasta', 'unit' => 'g', 'cost_per_base_unit' => 0.03]);

        // Santa Cruz: 10 kg Tomato (10,000g), 10 kg Pasta (10,000g) -> 10 available
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tomato->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10000]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $pasta->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10000]
        );

        // Victoria: 0 kg Tomato, 20 kg Pasta (20,000g) -> 0 available (OUT OF STOCK)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tomato->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 0]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $pasta->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 20000]
        );

        $tomatoPasta = $this->createProductWithRecipe('Tomato Pasta', [
            ['ingredient' => $tomato, 'quantity' => 1, 'unit' => 'kg'], // 1000g
            ['ingredient' => $pasta, 'quantity' => 500, 'unit' => 'g'], // 500g
        ]);

        $availSC = $tomatoPasta->dynamicAvailability($this->branchSantaCruz->id);
        $availVIC = $tomatoPasta->dynamicAvailability($this->branchVictoria->id);

        $this->assertTrue($availSC['is_available']);
        $this->assertEquals(10, $availSC['available']);

        $this->assertFalse($availVIC['is_available']);
        $this->assertEquals(0, $availVIC['available']);
        $this->assertEquals('Tomato', $availVIC['limiting_ingredient']);
    }

    /**
     * TEST 6: Victoria restock -> Victoria product becomes available
     */
    public function test_test6_victoria_restock_makes_product_available()
    {
        $tomato = Ingredient::create(['name' => 'Tomato', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);

        $vicStock = IngredientStock::updateOrCreate(
            ['ingredient_id' => $tomato->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 0]
        );

        $soup = $this->createProductWithRecipe('Tomato Soup', [
            ['ingredient' => $tomato, 'quantity' => 500, 'unit' => 'g'],
        ], $this->branchVictoria->id);

        // Before restock: 0 available
        $this->assertFalse($soup->dynamicAvailability($this->branchVictoria->id)['is_available']);

        // Restock Victoria: +5,000g (5 kg)
        $vicStock->update(['stock' => 5000]);

        // After restock: 10 available
        $avail = $soup->dynamicAvailability($this->branchVictoria->id);
        $this->assertTrue($avail['is_available']);
        $this->assertEquals(10, $avail['available']);
    }

    /**
     * TEST 7: Santa Cruz stock must not affect Victoria
     */
    public function test_test7_santa_cruz_stock_must_not_affect_victoria()
    {
        $tea = Ingredient::create(['name' => 'Tea Leaves', 'unit' => 'g', 'cost_per_base_unit' => 0.1]);

        // Santa Cruz has 50,000g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tea->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50000]
        );
        // Victoria has 0g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $tea->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 0]
        );

        $hotTea = $this->createProductWithRecipe('Hot Tea', [
            ['ingredient' => $tea, 'quantity' => 10, 'unit' => 'g'],
        ]);

        $vicAvail = $hotTea->dynamicAvailability($this->branchVictoria->id);
        $this->assertFalse($vicAvail['is_available']);
        $this->assertEquals(0, $vicAvail['available']);
    }

    /**
     * TEST 8: Victoria stock must not affect Santa Cruz
     */
    public function test_test8_victoria_stock_must_not_affect_santa_cruz()
    {
        $coffee = Ingredient::create(['name' => 'Coffee', 'unit' => 'g', 'cost_per_base_unit' => 0.2]);

        // Victoria has 50,000g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffee->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 50000]
        );
        // Santa Cruz has 0g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffee->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );

        $blackCoffee = $this->createProductWithRecipe('Black Coffee', [
            ['ingredient' => $coffee, 'quantity' => 20, 'unit' => 'g'],
        ]);

        $scAvail = $blackCoffee->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($scAvail['is_available']);
        $this->assertEquals(0, $scAvail['available']);
    }

    /**
     * TEST 9: Customer order for unavailable product is rejected (422)
     */
    public function test_test9_customer_order_for_unavailable_product_is_rejected()
    {
        $beans = Ingredient::create(['name' => 'Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $beans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );

        $americano = $this->createProductWithRecipe('Americano', [
            ['ingredient' => $beans, 'quantity' => 20, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/orders', [
            'customer_name' => 'Jane Doe',
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
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * TEST 10: POS order for unavailable product is rejected
     */
    public function test_test10_pos_order_for_unavailable_product_is_rejected()
    {
        $beef = Ingredient::create(['name' => 'Beef', 'unit' => 'g', 'cost_per_base_unit' => 0.5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $beef->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );

        $gyudon = $this->createProductWithRecipe('Gyudon POS', [
            ['ingredient' => $beef, 'quantity' => 100, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        CashierShift::create([
            'cashier_id' => $this->cashierSantaCruz->id,
            'branch_id' => $this->branchSantaCruz->id,
            'opening_balance' => 1000,
            'status' => 'open',
            'opened_at' => now(),
        ]);

        $this->actingAs($this->cashierSantaCruz);
        $saleService = app(SaleService::class);

        $this->expectException(\Exception::class);
        $saleService->processSale([
            'items' => [
                [
                    'id' => $gyudon->id,
                    'quantity' => 1,
                ]
            ],
            'total' => 100.00,
            'paid_amount' => 100.00,
            'payment_method' => 'cash',
        ]);
    }

    /**
     * TEST 11: Inventory stock changes are immediately reflected in product availability
     */
    public function test_test11_inventory_stock_changes_are_immediately_reflected()
    {
        $sugar = Ingredient::create(['name' => 'Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.02]);
        $stock = IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100] // 100g / 10g = 10 servings
        );

        $sweetTea = $this->createProductWithRecipe('Sweet Tea', [
            ['ingredient' => $sugar, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $this->assertEquals(10, $sweetTea->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Stock increases to 500g -> 50 servings
        $stock->update(['stock' => 500]);
        $this->assertEquals(50, $sweetTea->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Stock decreases to 20g -> 2 servings
        $stock->update(['stock' => 20]);
        $this->assertEquals(2, $sweetTea->dynamicAvailability($this->branchSantaCruz->id)['available']);

        // Stock decreases to 5g -> 0 servings (OUT OF STOCK)
        $stock->update(['stock' => 5]);
        $avail = $sweetTea->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);
    }

    /**
     * TEST 12: Unit conversion works correctly (kg <-> g, L <-> ml, pcs)
     */
    public function test_test12_unit_conversion_works_correctly()
    {
        $flour = Ingredient::create(['name' => 'Flour', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);
        $milk = Ingredient::create(['name' => 'Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.08]);
        $eggs = Ingredient::create(['name' => 'Eggs', 'unit' => 'pcs', 'cost_per_base_unit' => 8]);

        // Inventory: 2 kg Flour (2000g), 1 Liter Milk (1000ml), 10 pcs Eggs
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $flour->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(2, 'kg')]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => UnitConverter::convertToBaseQuantity(1, 'L')]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $eggs->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 10]
        );

        // Recipe: 200g Flour, 100ml Milk, 2 pcs Eggs -> Yields min(2000/200=10, 1000/100=10, 10/2=5) = 5
        $pancake = $this->createProductWithRecipe('Pancake Stack', [
            ['ingredient' => $flour, 'quantity' => 200, 'unit' => 'g'],
            ['ingredient' => $milk, 'quantity' => 100, 'unit' => 'ml'],
            ['ingredient' => $eggs, 'quantity' => 2, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $avail = $pancake->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($avail['is_available']);
        $this->assertEquals(5, $avail['available']);
    }

    /**
     * TEST 13: Branch filtering/authorization cannot be bypassed
     */
    public function test_test13_branch_filtering_cannot_be_bypassed()
    {
        $rice = Ingredient::create(['name' => 'Rice', 'unit' => 'g', 'cost_per_base_unit' => 0.05]);

        // Only Victoria has stock
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 0]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $rice->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 5000]
        );

        $riceBowl = $this->createProductWithRecipe('Rice Bowl', [
            ['ingredient' => $rice, 'quantity' => 200, 'unit' => 'g'],
        ]);

        // Customer in Santa Cruz branch context queries products
        $response = $this->actingAs($this->customer, 'sanctum')->getJson('/api/v1/customer/products?branch_id=' . $this->branchSantaCruz->id);
        $response->assertStatus(200);

        $products = $response->json('products');
        $data = collect($products)->firstWhere('id', $riceBowl->id);
        $this->assertNotNull($data);
        $this->assertFalse((bool) $data['is_available']);
        $this->assertEquals(0, (float) $data['stock']);
    }

    /**
     * TEST 14: Last available ingredient cannot be consumed by two concurrent orders (concurrency locking)
     */
    public function test_test14_last_available_ingredient_concurrency_locking()
    {
        $cheese = Ingredient::create(['name' => 'Special Cheese', 'unit' => 'g', 'cost_per_base_unit' => 1]);

        // Stock exactly enough for 1 serving (50g)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $cheese->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50]
        );

        $cheeseRoll = $this->createProductWithRecipe('Cheese Roll', [
            ['ingredient' => $cheese, 'quantity' => 50, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // First order validates and locks inside transaction
        $order1Success = false;
        DB::transaction(function () use ($cheeseRoll, &$order1Success, $cheese) {
            $check = Product::validateBatchStock($this->branchSantaCruz->id, [
                ['product_id' => $cheeseRoll->id, 'quantity' => 1]
            ], true);

            $this->assertTrue($check['success']);
            $order1Success = true;

            // Deduct stock for order 1
            IngredientStock::where('ingredient_id', $cheese->id)
                ->where('branch_id', $this->branchSantaCruz->id)
                ->decrement('stock', 50);
        });

        $this->assertTrue($order1Success);

        // Second order attempts to purchase the same product now that stock is 0
        $check2 = Product::validateBatchStock($this->branchSantaCruz->id, [
            ['product_id' => $cheeseRoll->id, 'quantity' => 1]
        ], true);

        $this->assertFalse($check2['success']);
        $this->assertStringContainsString('Insufficient stock', $check2['message']);
    }
}
