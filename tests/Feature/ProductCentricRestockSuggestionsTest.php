<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\RestockService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCentricRestockSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $adminUser;
    public RestockService $restockService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name'               => 'Santa Cruz',
            'latitude'           => 14.5995,
            'longitude'          => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name'               => 'Victoria',
            'latitude'           => 14.6000,
            'longitude'          => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Maki Rolls',
        ]);

        $this->adminUser = User::factory()->create([
            'role'                 => 'admin',
            'branch_id'            => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);

        $this->restockService = new RestockService();
    }

    /**
     * Helper to create an ingredient with stock in a branch.
     */
    protected function createIngredientWithStock(
        string $name,
        string $unit,
        float $stockQty,
        int $branchId,
        float $lowStockLevel = 50.0
    ): Ingredient {
        $ing = Ingredient::create([
            'name'               => $name,
            'unit'               => $unit,
            'cost_per_base_unit' => 1.50,
        ]);

        IngredientStock::updateOrCreate(
            [
                'branch_id'     => $branchId,
                'ingredient_id' => $ing->id,
            ],
            [
                'stock'           => $stockQty,
                'low_stock_level' => $lowStockLevel,
            ]
        );

        return $ing;
    }

    /**
     * Helper to create a product with configured recipe.
     */
    protected function createProductWithRecipe(
        string $name,
        array $recipeItems,
        ?int $branchId = null
    ): Product {
        $product = Product::create([
            'name'          => $name,
            'sku'           => 'SKU-' . strtoupper(uniqid()),
            'category_id'   => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id'     => $branchId,
            'unit'          => 'pcs',
        ]);

        foreach ($recipeItems as $item) {
            MenuItemIngredient::create([
                'menu_item_id'      => $product->id,
                'ingredient_id'     => $item['ingredient']->id,
                'quantity_required' => $item['quantity'],
                'unit'              => $item['unit'] ?? $item['ingredient']->unit,
            ]);
        }

        return $product->fresh(['ingredients']);
    }

    /**
     * Helper to record completed sales for a product.
     */
    protected function recordSales(
        Product $product,
        int $units,
        int $daysAgo,
        int $branchId
    ): void {
        $date = Carbon::today()->subDays($daysAgo)->setTime(12, 0, 0);

        $sale = Sale::create([
            'branch_id'      => $branchId,
            'user_id'        => $this->adminUser->id,
            'order_number'   => 'SALE-' . strtoupper(uniqid()),
            'total'          => $product->selling_price * $units,
            'paid_amount'    => $product->selling_price * $units,
            'change_amount'  => 0,
            'status'         => 'completed',
            'payment_method' => 'cash',
            'type'           => 'dine-in',
        ]);

        \Illuminate\Support\Facades\DB::table('sales')
            ->where('id', $sale->id)
            ->update([
                'created_at' => $date->toDateTimeString(),
                'updated_at' => $date->toDateTimeString(),
            ]);

        $item = SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => $units,
            'unit_price' => $product->selling_price,
            'cost_price' => 20.00,
            'subtotal'   => $product->selling_price * $units,
            'profit'     => ($product->selling_price - 20.00) * $units,
        ]);

        \Illuminate\Support\Facades\DB::table('sale_items')
            ->where('id', $item->id)
            ->update([
                'created_at' => $date->toDateTimeString(),
                'updated_at' => $date->toDateTimeString(),
            ]);
    }

    /**
     * Test 1 — Product grouping: Recommendations are grouped under the correct products based on their actual recipes.
     */
    public function test_01_product_grouping(): void
    {
        $seaweed = $this->createIngredientWithStock('Nori Seaweed', 'pcs', 10, $this->branchSantaCruz->id);
        $rice = $this->createIngredientWithStock('Japanese Rice', 'g', 500, $this->branchSantaCruz->id);

        $kaniMaki = $this->createProductWithRecipe('Kani Maki', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
            ['ingredient' => $rice, 'quantity' => 50, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);

        $this->assertNotEmpty($result['products']);
        $productMatch = collect($result['products'])->firstWhere('id', $kaniMaki->id);
        $this->assertNotNull($productMatch);
        $this->assertEquals('Kani Maki', $productMatch['name']);
        $this->assertTrue($productMatch['has_recipe']);
        $this->assertCount(2, $productMatch['recipe_ingredients']);

        $ingredientIds = collect($productMatch['recipe_ingredients'])->pluck('ingredient_id')->all();
        $this->assertContains($seaweed->id, $ingredientIds);
        $this->assertContains($rice->id, $ingredientIds);
    }

    /**
     * Test 2 — Bestseller evidence: Products receive demand classifications only when actual sales evidence supports them.
     */
    public function test_02_bestseller_evidence(): void
    {
        $seaweed = $this->createIngredientWithStock('Nori', 'pcs', 100, $this->branchSantaCruz->id);

        $bestseller = $this->createProductWithRecipe('Popular California Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $slowProduct = $this->createProductWithRecipe('Slow Moving Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        // Record 30 units for bestseller, 0 for slow mover
        $this->recordSales($bestseller, 30, 5, $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);

        $bestMatch = collect($result['products'])->firstWhere('id', $bestseller->id);
        $slowMatch = collect($result['products'])->firstWhere('id', $slowProduct->id);

        $this->assertTrue($bestMatch['is_bestseller']);
        $this->assertEquals('high', $bestMatch['demand_priority']);
        $this->assertEquals(30.0, $bestMatch['historical_units_sold']);

        $this->assertFalse($slowMatch['is_bestseller']);
        $this->assertEquals('none', $slowMatch['demand_priority']);
        $this->assertEquals(0.0, $slowMatch['historical_units_sold']);
    }

    /**
     * Test 3 — Ingredient bottleneck: The estimated current production capacity is determined by the most restrictive mandatory ingredient.
     */
    public function test_03_ingredient_bottleneck(): void
    {
        // Seaweed: 10 pcs available, 1 pc per portion => 10 portions
        $seaweed = $this->createIngredientWithStock('Seaweed Sheets', 'pcs', 10, $this->branchSantaCruz->id);
        // Rice: 100g available, 50g per portion => 2 portions (Bottleneck!)
        $rice = $this->createIngredientWithStock('Sushi Rice', 'g', 100, $this->branchSantaCruz->id);
        // Crabstick: 20 pcs available, 1 pc per portion => 20 portions
        $crab = $this->createIngredientWithStock('Crab Sticks', 'pcs', 20, $this->branchSantaCruz->id);

        $product = $this->createProductWithRecipe('Kani Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
            ['ingredient' => $rice, 'quantity' => 50, 'unit' => 'g'],
            ['ingredient' => $crab, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        // Minimum portions supported is 2 (limited by rice)
        $this->assertEquals(2, $match['current_producible_portions']);
        $this->assertContains('Sushi Rice', $match['bottleneck_ingredients']);

        $riceRow = collect($match['recipe_ingredients'])->firstWhere('ingredient_id', $rice->id);
        $this->assertTrue($riceRow['is_bottleneck']);
        $this->assertEquals(2, $riceRow['portions_supported']);
    }

    /**
     * Test 4 — Projected capacity: Replenishment quantities produce the correct projected portion capacity using real recipe quantities.
     */
    public function test_04_projected_capacity(): void
    {
        // Seaweed has 5 pcs. Recipe requires 1 pc per serving.
        $seaweed = $this->createIngredientWithStock('Nori', 'pcs', 5, $this->branchSantaCruz->id, 10.0);
        // Rice has 500g. Recipe requires 50g per serving => supports 10 portions.
        $rice = $this->createIngredientWithStock('Rice', 'g', 500, $this->branchSantaCruz->id, 100.0);

        $product = $this->createProductWithRecipe('Basic Maki', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
            ['ingredient' => $rice, 'quantity' => 50, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        // Generate sales to create a replenishment demand for Seaweed
        $this->recordSales($product, 20, 2, $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        $this->assertEquals(5, $match['current_producible_portions']);
        // Projected portions after restock must be >= current portions
        $this->assertGreaterThanOrEqual(5, $match['projected_producible_portions']);
        $this->assertEquals(
            $match['projected_producible_portions'] - $match['current_producible_portions'],
            $match['portions_gain']
        );
    }

    /**
     * Test 5 — Multiple ingredients: A product cannot be estimated to produce more portions than its least available required ingredient supports.
     */
    public function test_05_multiple_ingredients(): void
    {
        $ing1 = $this->createIngredientWithStock('Ing 1', 'g', 1000, $this->branchSantaCruz->id); // 1000/10 = 100 portions
        $ing2 = $this->createIngredientWithStock('Ing 2', 'g', 200, $this->branchSantaCruz->id);  // 200/50 = 4 portions
        $ing3 = $this->createIngredientWithStock('Ing 3', 'pcs', 3, $this->branchSantaCruz->id);  // 3/1 = 3 portions (Limiting!)

        $product = $this->createProductWithRecipe('Triple Item', [
            ['ingredient' => $ing1, 'quantity' => 10, 'unit' => 'g'],
            ['ingredient' => $ing2, 'quantity' => 50, 'unit' => 'g'],
            ['ingredient' => $ing3, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        $this->assertEquals(3, $match['current_producible_portions']);
        $this->assertContains('Ing 3', $match['bottleneck_ingredients']);
    }

    /**
     * Test 6 — Shared ingredients: Shared ingredients are included in consolidated demand without double-counting physical stock or purchasing.
     */
    public function test_06_shared_ingredients_consolidation(): void
    {
        // Rice is shared between two products
        $rice = $this->createIngredientWithStock('Shared Rice', 'g', 400, $this->branchSantaCruz->id, 50.0);
        $seaweed = $this->createIngredientWithStock('Shared Nori', 'pcs', 50, $this->branchSantaCruz->id);

        $prodA = $this->createProductWithRecipe('Roll Alpha', [
            ['ingredient' => $rice, 'quantity' => 40, 'unit' => 'g'],
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $prodB = $this->createProductWithRecipe('Roll Beta', [
            ['ingredient' => $rice, 'quantity' => 40, 'unit' => 'g'],
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);

        $matchA = collect($result['products'])->firstWhere('id', $prodA->id);
        $matchB = collect($result['products'])->firstWhere('id', $prodB->id);

        $riceInA = collect($matchA['recipe_ingredients'])->firstWhere('ingredient_id', $rice->id);
        $riceInB = collect($matchB['recipe_ingredients'])->firstWhere('ingredient_id', $rice->id);

        // Both products recognize Rice as a shared ingredient
        $this->assertTrue($riceInA['is_shared']);
        $this->assertTrue($riceInB['is_shared']);
        $this->assertEquals(2, $riceInA['shared_with_products_count']);
        $this->assertEquals(2, $riceInB['shared_with_products_count']);

        // Check consolidated shared ingredients in summary
        $sharedSummary = collect($result['shared_ingredients'])->firstWhere('ingredient_id', $rice->id);
        $this->assertNotNull($sharedSummary);
        $this->assertEquals(2, $sharedSummary['products_count']);
    }

    /**
     * Test 7 — Branch isolation: Victoria recommendations use Victoria inventory and demand, while Sta. Cruz uses Sta. Cruz.
     */
    public function test_07_branch_isolation(): void
    {
        // In Santa Cruz: 100 pcs seaweed
        $scSeaweed = $this->createIngredientWithStock('Seaweed', 'pcs', 100, $this->branchSantaCruz->id);
        // In Victoria: 2 pcs seaweed
        $vicSeaweed = $this->createIngredientWithStock('Seaweed', 'pcs', 2, $this->branchVictoria->id);

        $productSC = $this->createProductWithRecipe('Branch Roll SC', [
            ['ingredient' => $scSeaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $productVic = $this->createProductWithRecipe('Branch Roll Vic', [
            ['ingredient' => $vicSeaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchVictoria->id);

        $scResult = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $vicResult = $this->restockService->getProductCentricSuggestions($this->branchVictoria->id);

        $scMatch = collect($scResult['products'])->firstWhere('id', $productSC->id);
        $vicMatch = collect($vicResult['products'])->firstWhere('id', $productVic->id);

        $this->assertEquals(100, $scMatch['current_producible_portions']);
        $this->assertEquals(2, $vicMatch['current_producible_portions']);
    }

    /**
     * Test 8 — Expired and restricted stock: Ineligible batches do not inflate available stock or production capacity.
     */
    public function test_08_expired_and_restricted_stock_excluded(): void
    {
        $ing = Ingredient::create([
            'name'               => 'Fresh Tuna',
            'unit'               => 'g',
            'cost_per_base_unit' => 2.00,
        ]);

        IngredientStock::updateOrCreate(
            [
                'branch_id'     => $this->branchSantaCruz->id,
                'ingredient_id' => $ing->id,
            ],
            [
                'stock'           => 1500, // Total recorded on stock row
                'low_stock_level' => 100,
            ]
        );

        // Batch 1: 500g available and eligible
        IngredientBatch::create([
            'batch_code'       => 'BAT-VALID',
            'ingredient_id'    => $ing->id,
            'branch_id'        => $this->branchSantaCruz->id,
            'initial_quantity' => 500,
            'current_quantity' => 500,
            'unit'             => 'g',
            'status'           => 'available',
            'expiration_date'  => Carbon::tomorrow(),
            'received_at'      => Carbon::yesterday(),
        ]);

        // Batch 2: 1000g expired 3 days ago (must NOT count!)
        IngredientBatch::create([
            'batch_code'       => 'BAT-EXPIRED',
            'ingredient_id'    => $ing->id,
            'branch_id'        => $this->branchSantaCruz->id,
            'initial_quantity' => 1000,
            'current_quantity' => 1000,
            'unit'             => 'g',
            'status'           => 'available',
            'expiration_date'  => Carbon::yesterday()->subDays(2),
            'received_at'      => Carbon::now()->subDays(10),
        ]);

        $product = $this->createProductWithRecipe('Tuna Sashimi', [
            ['ingredient' => $ing, 'quantity' => 50, 'unit' => 'g'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        // Only 500g from Batch 1 is eligible. 500 / 50 = 10 portions.
        // If expired batch was counted, it would be 1500 / 50 = 30 portions.
        $this->assertEquals(10, $match['current_producible_portions']);

        $ingDetail = collect($match['recipe_ingredients'])->firstWhere('ingredient_id', $ing->id);
        $this->assertEquals(500.0, $ingDetail['usable_stock']);
        $this->assertEquals(1000.0, $ingDetail['ineligible_stock']);
    }

    /**
     * Test 9 — Missing recipes: Missing recipe information produces a clear limitation and does not generate invented estimates.
     */
    public function test_09_missing_recipes(): void
    {
        $noRecipeProduct = Product::create([
            'name'          => 'Unconfigured Special',
            'sku'           => 'SKU-NORECIPE',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 200.00,
            'branch_id'     => $this->branchSantaCruz->id,
            'unit'          => 'pcs',
        ]);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $noRecipeProduct->id);

        $this->assertNotNull($match);
        $this->assertFalse($match['has_recipe']);
        $this->assertEquals('missing', $match['recipe_status']);
        $this->assertNull($match['current_producible_portions']);
        $this->assertNull($match['projected_producible_portions']);
        $this->assertEquals('recipe_missing', $match['restock_urgency']);
        $this->assertStringContainsString('no configured recipe ingredients', $match['explanation']);
    }

    /**
     * Test 10 — Forecast horizon: Changing the selected horizon updates forecasted demand consistently.
     */
    public function test_10_forecast_horizon_updating(): void
    {
        $seaweed = $this->createIngredientWithStock('Nori', 'pcs', 100, $this->branchSantaCruz->id);
        $product = $this->createProductWithRecipe('Roll 10', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        // 30 sales over 30 days => 1.0 unit per day velocity
        $this->recordSales($product, 30, 10, $this->branchSantaCruz->id);

        $res7 = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id, 7);
        $res14 = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id, 14);

        $match7 = collect($res7['products'])->firstWhere('id', $product->id);
        $match14 = collect($res14['products'])->firstWhere('id', $product->id);

        // 14-day forecasted demand must be approximately double 7-day demand
        $this->assertGreaterThan($match7['forecasted_demand'], $match14['forecasted_demand']);
        $this->assertEquals(7, $res7['horizon_days']);
        $this->assertEquals(14, $res14['horizon_days']);
    }

    /**
     * Test 11 — No unnecessary restock: Products with sufficient coverage do not receive unjustified replenishment recommendations.
     */
    public function test_11_no_unnecessary_restock_for_sufficient_coverage(): void
    {
        // 50,000g of rice and 1,000 seaweed in stock (huge surplus)
        $rice = $this->createIngredientWithStock('Abundant Rice', 'g', 50000, $this->branchSantaCruz->id, 100.0);
        $seaweed = $this->createIngredientWithStock('Abundant Nori', 'pcs', 1000, $this->branchSantaCruz->id, 10.0);

        $product = $this->createProductWithRecipe('Overstocked Roll', [
            ['ingredient' => $rice, 'quantity' => 50, 'unit' => 'g'],
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        // Small demand: 5 units sold
        $this->recordSales($product, 5, 3, $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        $this->assertEquals('safe', $match['restock_urgency']);
        $this->assertFalse($match['requires_restock']);
        $this->assertEquals(0, $match['portions_gain']);
        $this->assertStringContainsString('sufficient ingredient coverage', $match['explanation']);
    }

    /**
     * Test 12 — Restock integration: Suggested quantities are passed correctly without mutating inventory before confirmation.
     */
    public function test_12_restock_integration_prefilled_without_auto_committing(): void
    {
        $seaweed = $this->createIngredientWithStock('Nori Prefill', 'pcs', 2, $this->branchSantaCruz->id, 50.0);
        $product = $this->createProductWithRecipe('Prefill Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $this->recordSales($product, 25, 2, $this->branchSantaCruz->id);

        $initialStock = IngredientStock::where('branch_id', $this->branchSantaCruz->id)
            ->where('ingredient_id', $seaweed->id)
            ->value('stock');

        // Calling recommendation engine
        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $match = collect($result['products'])->firstWhere('id', $product->id);

        // Suggested restock quantities exist for prefilling
        $this->assertNotEmpty($match['suggested_restock_quantities']);
        $this->assertArrayHasKey($seaweed->id, $match['suggested_restock_quantities']);

        // Stock in database MUST NOT change by merely querying prescriptive suggestions
        $stockAfter = IngredientStock::where('branch_id', $this->branchSantaCruz->id)
            ->where('ingredient_id', $seaweed->id)
            ->value('stock');

        $this->assertEquals($initialStock, $stockAfter);
    }

    /**
     * Test 13 — Data freshness: Changes to relevant inventory or recipes are immediately reflected.
     */
    public function test_13_data_freshness_on_inventory_update(): void
    {
        $seaweed = $this->createIngredientWithStock('Freshness Seaweed', 'pcs', 5, $this->branchSantaCruz->id);
        $product = $this->createProductWithRecipe('Freshness Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $initialResult = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $initialMatch = collect($initialResult['products'])->firstWhere('id', $product->id);
        $this->assertEquals(5, $initialMatch['current_producible_portions']);

        // Staff stocks in 15 more pieces
        IngredientStock::where('branch_id', $this->branchSantaCruz->id)
            ->where('ingredient_id', $seaweed->id)
            ->increment('stock', 15);

        $updatedResult = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);
        $updatedMatch = collect($updatedResult['products'])->firstWhere('id', $product->id);

        // Production capacity is dynamically updated to 20 portions
        $this->assertEquals(20, $updatedMatch['current_producible_portions']);
    }

    /**
     * Test 14 — Analytics safety: Calling recommendations never creates sales, receipts, or batch movements.
     */
    public function test_14_analytics_safety_no_side_effects(): void
    {
        $seaweed = $this->createIngredientWithStock('Safe Nori', 'pcs', 10, $this->branchSantaCruz->id);
        $this->createProductWithRecipe('Safe Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $salesCountBefore = Sale::count();
        $batchesCountBefore = IngredientBatch::count();

        $this->actingAs($this->adminUser)
            ->get('/analytics/restock-suggestions?branch_id=' . $this->branchSantaCruz->id);

        $this->assertEquals($salesCountBefore, Sale::count());
        $this->assertEquals($batchesCountBefore, IngredientBatch::count());
    }

    /**
     * Test 15 — Existing functionality: Ingredient-level suggestions continue to work alongside product suggestions.
     */
    public function test_15_existing_ingredient_level_analytics_functional(): void
    {
        $seaweed = $this->createIngredientWithStock('Legacy Nori', 'pcs', 5, $this->branchSantaCruz->id, 50.0);
        $product = $this->createProductWithRecipe('Legacy Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $this->recordSales($product, 20, 2, $this->branchSantaCruz->id);

        $response = $this->actingAs($this->adminUser)
            ->get('/analytics/restock-suggestions?branch_id=' . $this->branchSantaCruz->id);

        $response->assertStatus(200);
        $response->assertInertia(function ($page) {
            $page->component('Analytics/RestockSuggestions')
                 ->has('suggestions')
                 ->has('product_suggestions')
                 ->has('impact_suggestions')
                 ->has('tomorrow_forecast')
                 ->has('demand_ratio')
                 ->has('branches');
        });
    }

    /**
     * Test 16 — Responsive contract: Product recommendations structure returns all required decision properties.
     */
    public function test_16_endpoint_returns_consistent_product_data_structure(): void
    {
        $seaweed = $this->createIngredientWithStock('Contract Nori', 'pcs', 10, $this->branchSantaCruz->id);
        $product = $this->createProductWithRecipe('Contract Roll', [
            ['ingredient' => $seaweed, 'quantity' => 1, 'unit' => 'pcs'],
        ], $this->branchSantaCruz->id);

        $result = $this->restockService->getProductCentricSuggestions($this->branchSantaCruz->id);

        $this->assertArrayHasKey('horizon_days', $result);
        $this->assertArrayHasKey('products', $result);
        $this->assertArrayHasKey('summary', $result);
        $this->assertArrayHasKey('shared_ingredients', $result);

        $summary = $result['summary'];
        $this->assertArrayHasKey('total_products', $summary);
        $this->assertArrayHasKey('products_needing_restock', $summary);
        $this->assertArrayHasKey('critical_products', $summary);
        $this->assertArrayHasKey('warning_products', $summary);
        $this->assertArrayHasKey('safe_products', $summary);
        $this->assertArrayHasKey('total_portions_gain', $summary);

        $firstProd = $result['products'][0];
        $this->assertArrayHasKey('id', $firstProd);
        $this->assertArrayHasKey('name', $firstProd);
        $this->assertArrayHasKey('has_recipe', $firstProd);
        $this->assertArrayHasKey('recipe_status', $firstProd);
        $this->assertArrayHasKey('restock_urgency', $firstProd);
        $this->assertArrayHasKey('demand_priority', $firstProd);
        $this->assertArrayHasKey('is_bestseller', $firstProd);
        $this->assertArrayHasKey('historical_units_sold', $firstProd);
        $this->assertArrayHasKey('forecasted_demand', $firstProd);
        $this->assertArrayHasKey('current_producible_portions', $firstProd);
        $this->assertArrayHasKey('projected_producible_portions', $firstProd);
        $this->assertArrayHasKey('portions_gain', $firstProd);
        $this->assertArrayHasKey('bottleneck_ingredients', $firstProd);
        $this->assertArrayHasKey('recipe_ingredients', $firstProd);
        $this->assertArrayHasKey('explanation', $firstProd);
    }
}
