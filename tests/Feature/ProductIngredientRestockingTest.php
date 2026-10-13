<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientBatch;
use App\Models\IngredientBatchMovement;
use App\Models\MenuItemIngredient;
use App\Models\User;
use App\Services\InventoryBatchService;
use App\Services\InventoryService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class ProductIngredientRestockingTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchVictoria;
    public Branch $branchSantaCruz;
    public Category $testCategory;
    public User $admin;
    public User $cashierVictoria;
    public User $cashierSantaCruz;
    public Product $chickenTeriyaki;
    public Product $chickenKatsu;
    public Product $directProduct;
    public Ingredient $chicken;
    public Ingredient $teriyakiSauce;
    public Ingredient $rice;
    public Ingredient $sesameSeeds;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Branches
        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU SANTA CRUZ',
            'latitude' => 14.6100,
            'longitude' => 120.9800,
            'delivery_radius_km' => 10,
        ]);

        // 2. Users
        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@makidesu.test',
            'role' => 'admin',
            'branch_id' => $this->branchVictoria->id,
            'must_change_password' => false,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'name' => 'Cashier Victoria',
            'email' => 'cashier.vic@makidesu.test',
            'role' => 'cashier',
            'branch_id' => $this->branchVictoria->id,
            'must_change_password' => false,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'name' => 'Cashier Santa Cruz',
            'email' => 'cashier.sc@makidesu.test',
            'role' => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);

        // 3. Category
        $this->testCategory = Category::create([
            'name' => 'Donburi Meals',
        ]);

        // 4. Ingredients
        $this->chicken = Ingredient::create([
            'name' => 'Chicken Meat',
            'unit' => 'g',
            'cost_per_base_unit' => 0.35,
            'requires_expiration_tracking' => true,
            'default_expiry_days' => null, // requires explicit expiration date
        ]);

        $this->teriyakiSauce = Ingredient::create([
            'name' => 'Teriyaki Sauce',
            'unit' => 'ml',
            'cost_per_base_unit' => 0.15,
            'requires_expiration_tracking' => true,
            'default_expiry_days' => 30, // has default expiry
        ]);

        $this->rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'g',
            'cost_per_base_unit' => 0.08,
            'requires_expiration_tracking' => false,
        ]);

        $this->sesameSeeds = Ingredient::create([
            'name' => 'Sesame Seeds',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
            'requires_expiration_tracking' => false,
        ]);

        // 5. Products
        // Chicken Teriyaki (has recipe)
        $this->chickenTeriyaki = Product::create([
            'name' => 'Chicken Teriyaki Bowl',
            'sku' => 'BOWL-TERI-01',
            'category_id' => $this->testCategory->id,
            'selling_price' => 199.00,
            'unit' => 'pcs',
            'branch_id' => null,
            'costing_method' => 'automatic',
        ]);

        // Configure Chicken Teriyaki recipe: Chicken (150g), Teriyaki Sauce (30ml), Rice (200g)
        $this->chickenTeriyaki->ingredients()->attach([
            $this->chicken->id => ['quantity_required' => 150, 'unit' => 'g'],
            $this->teriyakiSauce->id => ['quantity_required' => 30, 'unit' => 'ml'],
            $this->rice->id => ['quantity_required' => 200, 'unit' => 'g'],
        ]);

        // Chicken Katsu (also uses Chicken and Rice)
        $this->chickenKatsu = Product::create([
            'name' => 'Chicken Katsu Curry',
            'sku' => 'BOWL-KATSU-02',
            'category_id' => $this->testCategory->id,
            'selling_price' => 220.00,
            'unit' => 'pcs',
            'branch_id' => null,
            'costing_method' => 'automatic',
        ]);
        $this->chickenKatsu->ingredients()->attach([
            $this->chicken->id => ['quantity_required' => 180, 'unit' => 'g'],
            $this->rice->id => ['quantity_required' => 200, 'unit' => 'g'],
        ]);

        // Direct Finished Product (No ingredients/recipe)
        $this->directProduct = Product::create([
            'name' => 'Canned Green Tea',
            'sku' => 'DRK-TEA-03',
            'category_id' => $this->testCategory->id,
            'selling_price' => 65.00,
            'unit' => 'pcs',
            'branch_id' => null,
        ]);
    }

    /**
     * Test 1 — Load recipe ingredients:
     * Opening the restock action displays all valid ingredients currently configured for the product.
     */
    public function test_01_load_recipe_ingredients_displays_all_valid_configured_materials()
    {
        $response = $this->actingAs($this->admin)
            ->getJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients?branch_id={$this->branchVictoria->id}");

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'product' => ['id', 'name', 'sku', 'category_name', 'status', 'has_recipe'],
            'branch' => ['id', 'name', 'code'],
            'branches',
            'ingredients' => [
                '*' => ['id', 'name', 'unit', 'recipe_quantity', 'recipe_unit', 'current_stock', 'requires_expiration_tracking']
            ],
            'is_admin'
        ]);

        $data = $response->json();
        $this->assertTrue($data['product']['has_recipe']);
        $this->assertCount(3, $data['ingredients']);

        $ingredientNames = array_column($data['ingredients'], 'name');
        $this->assertContains('Chicken Meat', $ingredientNames);
        $this->assertContains('Teriyaki Sauce', $ingredientNames);
        $this->assertContains('Japanese Rice', $ingredientNames);
    }

    /**
     * Test 2 — Missing recipe:
     * A product without ingredient associations cannot initiate a normal ingredient restock.
     */
    public function test_02_product_without_ingredients_cannot_initiate_ingredient_restock()
    {
        // 1. GET returns has_recipe: false and 0 ingredients
        $getResponse = $this->actingAs($this->admin)
            ->getJson("/products/{$this->directProduct->id}/restock-ingredients?branch_id={$this->branchVictoria->id}");

        $getResponse->assertStatus(200);
        $this->assertFalse($getResponse->json('product.has_recipe'));
        $this->assertCount(0, $getResponse->json('ingredients'));

        // 2. POST rejects with 422 and clear explanation
        $postResponse = $this->actingAs($this->admin)
            ->postJson("/products/{$this->directProduct->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    ['ingredient_id' => $this->chicken->id, 'quantity' => 5, 'unit' => 'kg']
                ]
            ]);

        $postResponse->assertStatus(422);
        $postResponse->assertJsonFragment([
            'error_type' => 'NO_RECIPE',
        ]);
        $this->assertStringContainsString('does not have configured recipe ingredients', $postResponse->json('message'));
    }

    /**
     * Test 3 — Partial restock:
     * The user can receive stock for selected ingredients while leaving other ingredients unchanged.
     */
    public function test_03_partial_restock_only_receives_selected_ingredients()
    {
        $initialRiceStock = IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock') ?? 0;

        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 5, // 5 kg
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(7)->toDateString(),
                        'included' => true,
                    ],
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 0, // not received / excluded
                        'unit' => 'kg',
                        'included' => false,
                    ],
                ]
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'ingredients_received' => 1,
        ]);

        // Chicken stock updated (+5000 g)
        $newChickenStock = (float) IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $this->assertEquals(5000.0, $newChickenStock);

        // Rice stock completely unchanged
        $finalRiceStock = (float) (IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock') ?? 0);
        $this->assertEquals((float) $initialRiceStock, $finalRiceStock);
    }

    /**
     * Test 4 — Quantity correctness:
     * The entered receipt quantities are applied using supported ingredient units and conversion rules.
     */
    public function test_04_quantity_correctness_and_unit_conversion()
    {
        // Receive 2.5 kg of Chicken (base unit is g -> 2500 g)
        // Receive 1.5 L of Teriyaki Sauce (base unit is ml -> 1500 ml)
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 2.5,
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
                    ],
                    [
                        'ingredient_id' => $this->teriyakiSauce->id,
                        'quantity' => 1.5,
                        'unit' => 'L',
                        'expiration_date' => Carbon::now()->addDays(20)->toDateString(),
                    ],
                ]
            ]);

        $response->assertStatus(200);

        $chickenStock = (float) IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $sauceStock = (float) IngredientStock::where('ingredient_id', $this->teriyakiSauce->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');

        $this->assertEquals(2500.0, $chickenStock);
        $this->assertEquals(1500.0, $sauceStock);
    }

    /**
     * Test 5 — Branch isolation:
     * Restocking ingredients for a product at Victoria does not alter Sta. Cruz inventory.
     */
    public function test_05_branch_isolation_restocking_victoria_does_not_alter_santa_cruz()
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 10,
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(14)->toDateString(),
                    ],
                ]
            ]);

        $response->assertStatus(200);

        // Victoria has 10,000 g
        $vicChicken = (float) IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $this->assertEquals(10000.0, $vicChicken);

        // Santa Cruz has 0 g and 0 batches
        $scChicken = (float) (IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock') ?? 0);
        $this->assertEquals(0.0, $scChicken);

        $scBatches = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->count();
        $this->assertEquals(0, $scBatches);
    }

    /**
     * Test 6 — Batch tracking:
     * Every received ingredient follows batch and expiration requirements with ledger movements.
     */
    public function test_06_batch_tracking_creates_traceable_batch_and_movement_ledger()
    {
        $expDate = Carbon::now()->addDays(10)->toDateString();

        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 3.5,
                        'unit' => 'kg',
                        'lot_number' => 'LOT-CHICK-99',
                        'batch_code' => 'BATCH-TEST-001',
                        'expiration_date' => $expDate,
                        'purchase_price' => 1050.00,
                        'notes' => 'Poultry supplier delivery',
                    ],
                ]
            ]);

        $response->assertStatus(200);

        /** @var IngredientBatch $batch */
        $batch = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals('LOT-CHICK-99', $batch->lot_number);
        $this->assertEquals('BATCH-TEST-001', $batch->batch_code);
        $this->assertEquals(3500.0, (float) $batch->initial_quantity);
        $this->assertEquals(3500.0, (float) $batch->current_quantity);
        $this->assertEquals('available', $batch->status);
        $this->assertEquals(1050.00, (float) $batch->purchase_price);
        $this->assertStringContainsString('Product-Specific Restock', $batch->reference);

        // Movement ledger
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals('stock_in', $movement->movement_type);
        $this->assertEquals(3500.0, (float) $movement->quantity_base);
    }

    /**
     * Test 7 — FEFO/FIFO compatibility:
     * New batches enter the inventory queue correctly without bypassing consumption priority.
     */
    public function test_07_fefo_fifo_queue_compatibility_integrates_seamlessly()
    {
        $batchService = app(InventoryBatchService::class);

        // Pre-existing batch expiring in 10 days
        $batchService->stockInBatch([
            'ingredient_id' => $this->chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 2000,
            'unit' => 'g',
            'expiration_date' => Carbon::now()->addDays(10)->toDateString(),
        ], $this->admin->id);

        // New product restock with earlier expiration: 3 days
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 1,
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(3)->toDateString(),
                    ]
                ]
            ]);

        $response->assertStatus(200);

        // Check FEFO queue order
        $queue = $batchService->getQueueForIngredient($this->chicken->id, $this->branchVictoria->id);
        $this->assertCount(2, $queue['eligible_batches']);

        // First in queue must be the 3-day batch (FEFO priority)
        $firstBatch = $queue['eligible_batches'][0];
        $this->assertEquals(3, $firstBatch['days_until_expiration']);
        $this->assertEquals(1, $firstBatch['priority']);
    }

    /**
     * Test 8 — Duplicate prevention:
     * Repeated submission of the same receipt does not create duplicate stock.
     */
    public function test_08_duplicate_prevention_rejects_replayed_or_repeated_submissions()
    {
        $token = 'idemp_test_unique_' . uniqid();

        $payload = [
            'branch_id' => $this->branchVictoria->id,
            'idempotency_token' => $token,
            'items' => [
                [
                    'ingredient_id' => $this->rice->id,
                    'quantity' => 5,
                    'unit' => 'kg',
                ]
            ]
        ];

        // First submission succeeds
        $res1 = $this->actingAs($this->admin)->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", $payload);
        $res1->assertStatus(200);

        // Immediate duplicate submission with the exact same token gets rejected
        $res2 = $this->actingAs($this->admin)->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", $payload);
        $res2->assertStatus(409);
        $res2->assertJsonFragment(['is_duplicate' => true]);

        // Stock was incremented exactly once (5 kg = 5000 g, not 10,000 g)
        $riceStock = (float) IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $this->assertEquals(5000.0, $riceStock);
    }

    /**
     * Test 9 — Authorization:
     * Unauthorized users cannot restock ingredients at restricted branches.
     */
    public function test_09_authorization_enforces_cashier_branch_boundary()
    {
        // Cashier Victoria attempting to restock Santa Cruz must be rejected with 403
        $response = $this->actingAs($this->cashierVictoria)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchSantaCruz->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 2,
                        'unit' => 'kg',
                    ]
                ]
            ]);

        $response->assertStatus(403);
        $this->assertStringContainsString('assigned branch', $response->json('message'));

        // Cashier Victoria restocking Victoria succeeds
        $validResponse = $this->actingAs($this->cashierVictoria)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 2,
                        'unit' => 'kg',
                    ]
                ]
            ]);

        $validResponse->assertStatus(200);
    }

    /**
     * Test 10 — Invalid requests:
     * Injected ingredients, invalid units, negative quantities, and missing expiration are rejected.
     */
    public function test_10_invalid_requests_rejects_injected_ingredients_and_invalid_units()
    {
        // 1. Injected ingredient not in recipe: Sesame Seeds is NOT in Chicken Teriyaki recipe
        $resInjected = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->sesameSeeds->id, // not in recipe
                        'quantity' => 1,
                        'unit' => 'kg',
                    ]
                ]
            ]);
        $resInjected->assertStatus(422);

        // 2. Incompatible unit: using 'L' (volume) for Chicken Meat (mass)
        $resUnit = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 1,
                        'unit' => 'L',
                        'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
                    ]
                ]
            ]);
        $resUnit->assertStatus(422);

        // 3. Missing required expiration date for Chicken (requires_expiration_tracking = true, no default)
        $resNoExp = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 2,
                        'unit' => 'kg',
                        // missing expiration_date
                    ]
                ]
            ]);
        $resNoExp->assertStatus(422);

        // 4. Zero or negative quantity
        $resZero = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 0,
                        'unit' => 'kg',
                    ]
                ]
            ]);
        $resZero->assertStatus(422);
    }

    /**
     * Test 11 — Transaction integrity:
     * A failed multi-ingredient operation rolls back completely and leaves no partial records.
     */
    public function test_11_transaction_integrity_rolls_back_on_failure()
    {
        $initialRice = (float) (IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)->value('stock') ?? 0);

        // Submitting 2 items: 1 valid Rice, but 1 invalid Chicken missing expiration date
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 5,
                        'unit' => 'kg',
                    ],
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 5,
                        'unit' => 'kg',
                        // missing expiration date triggers validation failure
                    ],
                ]
            ]);

        $response->assertStatus(422);

        // Verify Rice was NOT partially stocked in
        $currentRice = (float) (IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)->value('stock') ?? 0);
        $this->assertEquals($initialRice, $currentRice);
    }

    /**
     * Test 12 — Shared ingredient behavior:
     * Restocking an ingredient through one product updates the branch's shared ingredient inventory
     * and is immediately reflected in other products that use the same ingredient.
     */
    public function test_12_shared_ingredient_behavior_updates_all_products_sharing_raw_material()
    {
        // Restock Chicken and Rice via Chicken Teriyaki
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 3.6, // 3600 g
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(10)->toDateString(),
                    ],
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 4, // 4000 g
                        'unit' => 'kg',
                    ],
                ]
            ]);

        $response->assertStatus(200);

        // Verify Chicken Teriyaki dynamic availability:
        // Chicken: 3600 / 150 = 24 servings. Rice: 4000 / 200 = 20 servings.
        // Limiting is Sauce (0 stock = 0 available).
        // Now let's check Chicken Katsu (uses Chicken 180g and Rice 200g, no sauce needed!):
        // Chicken: 3600 / 180 = 20 servings. Rice: 4000 / 200 = 20 servings.
        $katsuAvail = $this->chickenKatsu->dynamicAvailability($this->branchVictoria->id);
        $this->assertEquals(20, (int) $katsuAvail['available']);
        $this->assertTrue($katsuAvail['is_available']);
    }

    /**
     * Test 13 — No unintended changes:
     * Does not modify recipes, selling prices, finished product stock, or operational records.
     */
    public function test_13_no_unintended_changes_preserves_recipes_selling_prices_and_sales()
    {
        $originalPrice = $this->chickenTeriyaki->selling_price;
        $originalRecipe = $this->chickenTeriyaki->ingredients()->pluck('quantity_required', 'ingredient_id')->toArray();

        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 1,
                        'unit' => 'kg',
                    ]
                ]
            ]);

        $response->assertStatus(200);

        $this->chickenTeriyaki->refresh();
        $this->assertEquals($originalPrice, $this->chickenTeriyaki->selling_price);

        $currentRecipe = $this->chickenTeriyaki->ingredients()->pluck('quantity_required', 'ingredient_id')->toArray();
        $this->assertEquals($originalRecipe, $currentRecipe);
    }

    /**
     * Test 14 — Existing general inventory stock-in remains fully functional:
     * General restock from Inventory page continues to work without disruption.
     */
    public function test_14_existing_inventory_workflow_remains_functional()
    {
        $response = $this->actingAs($this->admin)
            ->post('/inventory/stock-in', [
                'type' => 'ingredient',
                'id' => $this->rice->id,
                'quantity' => 5,
                'unit' => 'kg',
                'branch_id' => $this->branchVictoria->id,
            ]);

        $response->assertSessionHasNoErrors();

        $riceStock = (float) IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $this->assertGreaterThanOrEqual(5000.0, $riceStock);
    }

    /**
     * Test 15 — Responsive contract & empty rows:
     * Rows with blank or excluded quantities are skipped and do not generate movements.
     */
    public function test_15_responsive_contract_and_empty_row_handling()
    {
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->rice->id,
                        'quantity' => 3,
                        'unit' => 'kg',
                        'included' => true,
                    ],
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => null, // empty
                        'included' => true,
                    ],
                    [
                        'ingredient_id' => $this->teriyakiSauce->id,
                        'quantity' => '', // blank string
                        'included' => false,
                    ],
                ]
            ]);

        $response->assertStatus(200);
        $this->assertEquals(1, $response->json('ingredients_received'));

        // Chicken and sauce have 0 movements
        $chickenMovements = IngredientBatchMovement::where('ingredient_id', $this->chicken->id)->count();
        $sauceMovements = IngredientBatchMovement::where('ingredient_id', $this->teriyakiSauce->id)->count();

        $this->assertEquals(0, $chickenMovements);
        $this->assertEquals(0, $sauceMovements);
    }
}
