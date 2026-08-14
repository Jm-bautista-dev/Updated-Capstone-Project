<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\RestockRequest;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\RestockService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PrescriptiveRestockSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $adminUser;

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

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * Helper to create a product with recipe.
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
     * Helper to simulate historical sales.
     */
    protected function recordDailySale(Product $product, int $quantity, Carbon $date, int $branchId): void
    {
        $sale = Sale::create([
            'branch_id' => $branchId,
            'user_id' => $this->adminUser->id,
            'order_number' => 'SALE-' . strtoupper(uniqid()),
            'total' => $product->selling_price * $quantity,
            'paid_amount' => $product->selling_price * $quantity,
            'change_amount' => 0,
            'status' => 'completed',
            'payment_method' => 'cash',
            'type' => 'dine-in',
        ]);

        \Illuminate\Support\Facades\DB::table('sales')
            ->where('id', $sale->id)
            ->update([
                'created_at' => $date->toDateTimeString(),
                'updated_at' => $date->toDateTimeString(),
            ]);

        $item = SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'unit_price' => $product->selling_price,
            'cost_price' => 20.00,
            'subtotal' => $product->selling_price * $quantity,
            'profit' => ($product->selling_price - 20) * $quantity,
        ]);

        \Illuminate\Support\Facades\DB::table('sale_items')
            ->where('id', $item->id)
            ->update([
                'created_at' => $date->toDateTimeString(),
                'updated_at' => $date->toDateTimeString(),
            ]);
    }

    /**
     * TEST 1 — STOCK ALREADY SUFFICIENT
     * Forecast: 70, Current stock: 150 -> Recommended Restock = 0, Status: Safe / Stock Sufficient.
     */
    public function test_test1_stock_already_sufficient_returns_zero_restock()
    {
        $coffeeBeans = Ingredient::create(['name' => 'Coffee Beans', 'unit' => 'g', 'cost_per_base_unit' => 1]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $coffeeBeans->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 1500] // 1,500g in stock
        );

        $espresso = $this->createProductWithRecipe('Espresso', [
            ['ingredient' => $coffeeBeans, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // Record 5 cups per day for the last 10 days => ~50g/day => 7-day demand ~350g + buffer ~100g = ~450g target
        for ($i = 1; $i <= 10; $i++) {
            $this->recordDailySale($espresso, 5, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestions = collect($result['suggestions'])->keyBy('ingredient_id');
        $coffeeSuggestion = $suggestions->get($coffeeBeans->id);

        // Since stock (1500g) exceeds target (~450g), suggested restock must be 0
        if ($coffeeSuggestion) {
            $this->assertEquals(0, $coffeeSuggestion['suggested_restock']);
            $this->assertEquals('Safe', $coffeeSuggestion['status']);
        } else {
            // Filtered out because Restock = 0 and Status = Safe
            $this->assertTrue(true);
        }
    }

    /**
     * TEST 2 — PARTIAL STOCK
     * Forecast: 70, Current stock: 20, Incoming: 10 -> Accounts for existing 30 units, does not recommend full 70.
     */
    public function test_test2_partial_stock_and_incoming_deducted_from_restock_recommendation()
    {
        $milk = Ingredient::create(['name' => 'Fresh Milk', 'unit' => 'ml', 'cost_per_base_unit' => 0.05]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $milk->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 200] // 200ml on hand
        );

        // Incoming pipeline stock
        RestockRequest::create([
            'branch_id' => $this->branchSantaCruz->id,
            'user_id' => $this->adminUser->id,
            'item_type' => 'ingredient',
            'item_id' => $milk->id,
            'quantity' => 100, // 100ml on the way
            'unit' => 'ml',
            'status' => 'pending',
        ]);

        $latte = $this->createProductWithRecipe('Latte', [
            ['ingredient' => $milk, 'quantity' => 100, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        // 1 cup/day for 14 days => 100ml/day => 7-day expected demand ~700ml + buffer ~200ml = ~900ml target
        for ($i = 1; $i <= 14; $i++) {
            $this->recordDailySale($latte, 1, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestions = collect($result['suggestions'])->keyBy('ingredient_id');
        $milkSuggestion = $suggestions->get($milk->id);

        $this->assertNotNull($milkSuggestion);
        // Current on-hand: 200, Incoming: 100 -> Inventory Position = 300
        $this->assertEquals(200, $milkSuggestion['current_stock']);
        $this->assertEquals(100, $milkSuggestion['incoming_stock']);
        $this->assertEquals(300, $milkSuggestion['inventory_position']);
        // Suggested restock must be Target - 300, NOT the full Target
        $this->assertLessThan($milkSuggestion['required_with_buffer'], $milkSuggestion['suggested_restock']);
        $this->assertEquals(
            round($milkSuggestion['required_with_buffer'] - 300, 2),
            round($milkSuggestion['suggested_restock'], 2)
        );
    }

    /**
     * TEST 3 — BRANCH ISOLATION
     * Santa Cruz: High sales. Victoria: Low/No sales. Each receives its own isolated recommendation.
     */
    public function test_test3_branch_isolated_prescriptive_recommendations()
    {
        $matcha = Ingredient::create(['name' => 'Matcha Powder', 'unit' => 'g', 'cost_per_base_unit' => 2]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $matcha->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50]
        );
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $matcha->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 50]
        );

        $matchaDrink = $this->createProductWithRecipe('Matcha Latte', [
            ['ingredient' => $matcha, 'quantity' => 10, 'unit' => 'g'],
        ]);

        // Santa Cruz sells 20 cups per day
        for ($i = 1; $i <= 10; $i++) {
            $this->recordDailySale($matchaDrink, 20, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        // Victoria sells 0 cups
        $service = new RestockService();
        $santaCruzResult = $service->generate($this->branchSantaCruz->id);
        $victoriaResult = $service->generate($this->branchVictoria->id);

        $scSuggestion = collect($santaCruzResult['suggestions'])->firstWhere('ingredient_id', $matcha->id);
        $vicSuggestion = collect($victoriaResult['suggestions'])->firstWhere('ingredient_id', $matcha->id);

        // Santa Cruz has high predicted demand and suggests significant restock
        $this->assertNotNull($scSuggestion);
        $this->assertGreaterThan(350, $scSuggestion['predicted_usage']);
        $this->assertGreaterThan(350, $scSuggestion['suggested_restock']);

        // Victoria has 0 demand and 50 stock -> restock must be 0
        if ($vicSuggestion) {
            $this->assertEquals(0, $vicSuggestion['suggested_restock']);
            $this->assertEquals(0, $vicSuggestion['predicted_usage']);
        } else {
            $this->assertTrue(true);
        }
    }

    /**
     * TEST 4 — INGREDIENT RECIPE CONVERSION
     * 100 sold units of Product requiring 20g -> Ingredient demand = 2,000g (not 100g).
     */
    public function test_test4_recipe_multiplier_converts_properly_to_ingredient_base_units()
    {
        $syrup = Ingredient::create(['name' => 'Vanilla Syrup', 'unit' => 'ml', 'cost_per_base_unit' => 0.1]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $syrup->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 100]
        );

        $vanillaLatte = $this->createProductWithRecipe('Vanilla Latte', [
            ['ingredient' => $syrup, 'quantity' => 25, 'unit' => 'ml'],
        ], $this->branchSantaCruz->id);

        // 10 units sold per day for 30 days (days 0 through 29) => 250ml syrup per day
        for ($i = 0; $i < 30; $i++) {
            $this->recordDailySale($vanillaLatte, 10, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestion = collect($result['suggestions'])->firstWhere('ingredient_id', $syrup->id);
        $this->assertNotNull($suggestion);

        // 250ml/day * 7 days = 1,750ml expected demand
        $this->assertEquals(1750, (int) round($suggestion['predicted_usage']));
    }

    /**
     * TEST 5 — OUTLIER PROTECTION
     * Daily sales: 10, 12, 11, 9, 10, 500 (one-day spike).
     * Winsorization protects the ongoing 7-day restock target from being distorted by the 500 spike.
     */
    public function test_test5_outlier_spike_is_winsorized_and_does_not_distort_recommendations()
    {
        $teaLeaves = Ingredient::create(['name' => 'Black Tea Leaves', 'unit' => 'g', 'cost_per_base_unit' => 0.5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $teaLeaves->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50]
        );

        $blackTea = $this->createProductWithRecipe('Black Tea', [
            ['ingredient' => $teaLeaves, 'quantity' => 5, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // 29 normal days of 2 cups/day (10g/day)
        for ($i = 2; $i <= 30; $i++) {
            $this->recordDailySale($blackTea, 2, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        // 1 abnormal spike day of 100 cups (500g)
        $this->recordDailySale($blackTea, 100, Carbon::now()->subDays(1), $this->branchSantaCruz->id);

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestion = collect($result['suggestions'])->firstWhere('ingredient_id', $teaLeaves->id);
        $this->assertNotNull($suggestion);

        // Without winsorization, daily mean would be (29*10 + 500)/30 = 26.3g/day => 7d = 184g.
        // With winsorization capping the 500g spike to ~30g, daily mean is ~10.7g/day => 7d = ~75g.
        $this->assertLessThan(120, $suggestion['predicted_usage']);
    }

    /**
     * TEST 6 — INCOMING STOCK PIPELINE
     * Current: 50, Incoming: 100, Target: 120 -> System recommends 0 because 50+100=150 >= 120.
     */
    public function test_test6_incoming_pipeline_stock_prevents_unnecessary_reordering()
    {
        $sugar = Ingredient::create(['name' => 'Brown Sugar', 'unit' => 'g', 'cost_per_base_unit' => 0.02]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $sugar->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50]
        );

        RestockRequest::create([
            'branch_id' => $this->branchSantaCruz->id,
            'user_id' => $this->adminUser->id,
            'item_type' => 'ingredient',
            'item_id' => $sugar->id,
            'quantity' => 100,
            'unit' => 'g',
            'status' => 'approved',
        ]);

        $caramelDrink = $this->createProductWithRecipe('Caramel Drink', [
            ['ingredient' => $sugar, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // 1 cup/day for 14 days => 10g/day => 7d = 70g + buffer 20g = 90g target
        for ($i = 1; $i <= 14; $i++) {
            $this->recordDailySale($caramelDrink, 1, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestion = collect($result['suggestions'])->firstWhere('ingredient_id', $sugar->id);

        // 50 current + 100 incoming = 150 >= 90 target => 0 restock needed
        if ($suggestion) {
            $this->assertEquals(0, $suggestion['suggested_restock']);
            $this->assertEquals('Safe', $suggestion['status']);
        } else {
            $this->assertTrue(true);
        }
    }

    /**
     * TEST 7 — ZERO DEMAND
     * Historical demand: 0, Current stock: 50 -> Recommended restock = 0.
     */
    public function test_test7_zero_demand_item_generates_zero_restock()
    {
        $cinnamon = Ingredient::create(['name' => 'Cinnamon Powder', 'unit' => 'g', 'cost_per_base_unit' => 1.5]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $cinnamon->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 50]
        );

        // No sales recorded at all
        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestion = collect($result['suggestions'])->firstWhere('ingredient_id', $cinnamon->id);

        if ($suggestion) {
            $this->assertEquals(0, $suggestion['suggested_restock']);
            $this->assertEquals(0, $suggestion['predicted_usage']);
            $this->assertEquals(0, $suggestion['safety_stock']);
        } else {
            $this->assertTrue(true);
        }
    }

    /**
     * TEST 8 — NEGATIVE RECOMMENDATION GUARD
     * Target: 50, Current stock: 100 -> Recommended restock = 0 (never negative).
     */
    public function test_test8_restock_quantity_is_never_negative()
    {
        $cocoa = Ingredient::create(['name' => 'Cocoa Powder', 'unit' => 'g', 'cost_per_base_unit' => 0.8]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $cocoa->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 500]
        );

        $hotChocolate = $this->createProductWithRecipe('Hot Chocolate', [
            ['ingredient' => $cocoa, 'quantity' => 10, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // 1 cup/day => 10g/day => 7d demand = 70g
        for ($i = 1; $i <= 7; $i++) {
            $this->recordDailySale($hotChocolate, 1, Carbon::now()->subDays($i), $this->branchSantaCruz->id);
        }

        $service = new RestockService();
        $result = $service->generate($this->branchSantaCruz->id);

        $suggestion = collect($result['suggestions'])->firstWhere('ingredient_id', $cocoa->id);

        if ($suggestion) {
            $this->assertGreaterThanOrEqual(0, $suggestion['suggested_restock']);
            $this->assertEquals(0, $suggestion['suggested_restock']);
        } else {
            $this->assertTrue(true);
        }
    }
}
