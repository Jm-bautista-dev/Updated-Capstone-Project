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

    /**
     * Test 16 — Destination branch switching:
     * Loading recipe ingredients dynamically returns accurate branch-specific balances
     * for Victoria and Santa Cruz, and rejects unauthorized branch queries by cashiers.
     */
    public function test_16_destination_branch_switching_loads_branch_specific_balances_for_both_victoria_and_santa_cruz()
    {
        // Setup distinct initial stock balances
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->chicken->id, 'branch_id' => $this->branchVictoria->id],
            ['stock' => 1250.0, 'low_stock_level' => 5]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->chicken->id, 'branch_id' => $this->branchSantaCruz->id],
            ['stock' => 4500.0, 'low_stock_level' => 5]
        );

        // 1. Fetch Victoria balances as admin
        $vicResponse = $this->actingAs($this->admin)
            ->getJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients?branch_id={$this->branchVictoria->id}");

        $vicResponse->assertStatus(200);
        $vicResponse->assertJsonPath('branch.id', $this->branchVictoria->id);
        $vicResponse->assertJsonPath('branch.name', $this->branchVictoria->name);

        $vicIngredients = collect($vicResponse->json('ingredients'));
        $vicChicken = $vicIngredients->firstWhere('id', $this->chicken->id);
        $this->assertNotNull($vicChicken);
        $this->assertEquals(1250.0, (float) $vicChicken['current_stock']);

        // 2. Switch to Santa Cruz as admin
        $scResponse = $this->actingAs($this->admin)
            ->getJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients?branch_id={$this->branchSantaCruz->id}");

        $scResponse->assertStatus(200);
        $scResponse->assertJsonPath('branch.id', $this->branchSantaCruz->id);
        $scResponse->assertJsonPath('branch.name', $this->branchSantaCruz->name);

        $scIngredients = collect($scResponse->json('ingredients'));
        $scChicken = $scIngredients->firstWhere('id', $this->chicken->id);
        $this->assertNotNull($scChicken);
        $this->assertEquals(4500.0, (float) $scChicken['current_stock']);

        // 3. Confirm available branches list includes both Victoria and Santa Cruz
        $branches = collect($scResponse->json('branches'));
        $this->assertTrue($branches->contains('id', $this->branchVictoria->id));
        $this->assertTrue($branches->contains('id', $this->branchSantaCruz->id));

        // 4. Cashier Victoria attempting to query Santa Cruz must receive 403 Forbidden
        $unauthResponse = $this->actingAs($this->cashierVictoria)
            ->getJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients?branch_id={$this->branchSantaCruz->id}");

        $unauthResponse->assertStatus(403);
    }

    /**
     * Test 17 — Santa Cruz restocking updates only Santa Cruz:
     * Restocking ingredients with destination Santa Cruz increases Santa Cruz inventory
     * while leaving Victoria inventory unchanged.
     */
    public function test_17_restocking_santa_cruz_updates_only_santa_cruz_inventory()
    {
        $initialVicChicken = (float) (IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock') ?? 0);

        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchSantaCruz->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 4, // 4 kg
                        'unit' => 'kg',
                        'expiration_date' => Carbon::now()->addDays(10)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'branch' => [
                'id' => $this->branchSantaCruz->id,
                'name' => $this->branchSantaCruz->name,
            ],
            'ingredients_received' => 1,
        ]);

        // Santa Cruz stock updated (+4000 g)
        $newScChicken = (float) IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');
        $this->assertEquals(4000.0, $newScChicken);

        // Victoria stock remains exactly the same
        $finalVicChicken = (float) (IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock') ?? 0);
        $this->assertEquals($initialVicChicken, $finalVicChicken);

        // Batch is attached to Santa Cruz
        $batch = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->first();
        $this->assertNotNull($batch);
        $this->assertEquals(4000.0, (float) $batch->initial_quantity);
    }

    /**
     * Test 18 — Restock without user-entered batch number:
     * Submitting a restock request without lot_number or batch_code succeeds,
     * generates an internal traceable batch identifier (BATCH-YYYYMMDD-XXXXX),
     * keeps lot_number null, and preserves FEFO priority queue ordering.
     */
    public function test_18_restock_without_user_entered_batch_number_generates_internal_batch_and_preserves_fefo()
    {
        $batchService = app(InventoryBatchService::class);

        // Pre-existing batch expiring in 15 days
        $batchService->stockInBatch([
            'ingredient_id' => $this->chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 1500,
            'unit' => 'g',
            'expiration_date' => Carbon::now()->addDays(15)->toDateString(),
        ], $this->admin->id);

        $expDate = Carbon::now()->addDays(5)->toDateString();

        // Submit product restock without any batch_code or lot_number
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 2.5, // 2500 g
                        'unit' => 'kg',
                        'expiration_date' => $expDate,
                        'included' => true,
                        // Note: lot_number and batch_code are completely omitted
                    ],
                ],
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'ingredients_received' => 1,
        ]);

        // Find the newly created batch
        $batch = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->whereDate('expiration_date', $expDate)
            ->first();

        $this->assertNotNull($batch);
        $this->assertNull($batch->lot_number, 'User-entered lot number must be null when not provided');
        $this->assertNotEmpty($batch->batch_code, 'Internal batch code must be generated');
        $this->assertMatchesRegularExpression('/^BATCH-\d{8}-[A-Z0-9]+$/', $batch->batch_code, 'Batch code must follow system-generated format');
        $this->assertEquals(2500.0, (float) $batch->initial_quantity);
        $this->assertEquals(2500.0, (float) $batch->current_quantity);
        $this->assertEquals('available', $batch->status);

        // Movement audit record
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals('stock_in', $movement->movement_type);
        $this->assertEquals(2500.0, (float) $movement->quantity_base);

        // Verify FEFO queue ordering: the 5-day batch should have priority 1 over the 15-day batch
        $queue = $batchService->getQueueForIngredient($this->chicken->id, $this->branchVictoria->id);
        $this->assertCount(2, $queue['eligible_batches']);
        $this->assertEquals($batch->id, $queue['eligible_batches'][0]['id']);
        $this->assertEquals(1, $queue['eligible_batches'][0]['priority']);
        $this->assertEquals(5, $queue['eligible_batches'][0]['days_until_expiration']);
    }

    /**
     * Test 19 — Restock with unit acquisition cost:
     * Restocking an ingredient with unit_cost and quantity calculates batch purchase price,
     * updates weighted-average cost (WAC), stores movements, and returns enriched cost receipt metadata.
     */
    public function test_19_restock_with_unit_acquisition_cost_updates_batch_price_and_wac()
    {
        // 1. Check GET returns authoritative costing fields
        $getResponse = $this->actingAs($this->admin)
            ->getJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients?branch_id={$this->branchVictoria->id}");

        $getResponse->assertStatus(200);
        $getResponse->assertJsonStructure([
            'ingredients' => [
                '*' => [
                    'id', 'name', 'unit', 'recipe_quantity', 'recipe_unit', 'current_stock',
                    'cost_per_base_unit', 'current_cost_per_base_unit', 'current_unit_cost',
                    'total_stock_value', 'last_purchase_price'
                ]
            ]
        ]);

        // Pre-condition: Victoria has existing chicken stock: 3600g @ 0.18/g = 648.00
        $stockRowBefore = IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($stockRowBefore);
        $oldStock = (float) $stockRowBefore->stock;
        $oldValue = (float) $stockRowBefore->total_stock_value;

        // 2. Restock 4 kg @ ₱200/kg (unit_cost = 200, purchase_price = 800)
        $qty = 4.0;
        $unitCost = 200.0;
        $expectedBatchPrice = 800.0;
        $qtyBase = 4000.0; // 4 kg -> 4000 g

        $postResponse = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => $qty,
                        'unit' => 'kg',
                        'unit_cost' => $unitCost,
                        'purchase_price' => $expectedBatchPrice,
                        'expiration_date' => Carbon::now()->addDays(10)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $postResponse->assertStatus(200);
        $postResponse->assertJson([
            'success' => true,
            'ingredients_received' => 1,
        ]);

        // Verify receipt item structure and values
        $receipt = $postResponse->json('receipts.0');
        $this->assertEquals($this->chicken->id, $receipt['ingredient_id']);
        $this->assertEquals($qty, (float) $receipt['quantity']);
        $this->assertEquals('kg', $receipt['unit']);
        $this->assertEquals($unitCost, (float) $receipt['unit_cost']);
        $this->assertEquals($expectedBatchPrice, (float) $receipt['purchase_price']);

        // 3. Verify batch record
        $batch = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->latest('id')
            ->first();
        $this->assertNotNull($batch);
        $this->assertEquals($expectedBatchPrice, (float) $batch->purchase_price);
        $this->assertEquals(round($expectedBatchPrice / $qtyBase, 4), round((float) $batch->cost_per_base_unit, 4));

        // 4. Verify WAC on IngredientStock
        $stockRowAfter = IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $expectedNewStock = $oldStock + $qtyBase;
        $expectedNewValue = $oldValue + $expectedBatchPrice;
        $expectedWac = $expectedNewValue / $expectedNewStock;

        $this->assertEquals($expectedNewStock, (float) $stockRowAfter->stock);
        $this->assertEquals($expectedNewValue, (float) $stockRowAfter->total_stock_value);
        $this->assertEquals(round($expectedWac, 4), round((float) $stockRowAfter->cost_per_unit, 4));
        $this->assertEquals($expectedBatchPrice, (float) $stockRowAfter->last_purchase_price);
    }

    /**
     * Test 20 — Unit conversion preserves monetary acquisition costs:
     * When restocking in a larger unit (e.g., L for ml, kg for g), unit acquisition costs
     * scale appropriately without erroneously inflating or deflating the batch purchase price.
     */
    public function test_20_receipt_unit_conversions_preserve_monetary_acquisition_costs()
    {
        // Teriyaki Sauce base unit is 'ml'. We receive 2.5 Liters @ ₱300.00 per Liter.
        $qtyLiters = 2.5;
        $unitCostPerLiter = 300.0;
        $expectedBatchCost = 750.0; // 2.5 * 300 = 750
        $qtyBaseMl = 2500.0;

        $stockRowBefore = IngredientStock::where('ingredient_id', $this->teriyakiSauce->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $oldStock = (float) $stockRowBefore->stock;
        $oldValue = (float) $stockRowBefore->total_stock_value;

        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->teriyakiSauce->id,
                        'quantity' => $qtyLiters,
                        'unit' => 'L',
                        'unit_cost' => $unitCostPerLiter,
                        'purchase_price' => $expectedBatchCost,
                        'expiration_date' => Carbon::now()->addDays(30)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $response->assertStatus(200);

        // Batch created with 2500 ml base quantity and 750.00 purchase price
        $batch = IngredientBatch::where('ingredient_id', $this->teriyakiSauce->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals($qtyBaseMl, (float) $batch->initial_quantity);
        $this->assertEquals($expectedBatchCost, (float) $batch->purchase_price);
        $this->assertEquals(round(750.0 / 2500.0, 4), round((float) $batch->cost_per_base_unit, 4)); // ₱0.30/ml

        // Movement audit
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertEquals(0.30, round((float) $movement->cost_at_movement, 4));

        // Resulting stock value
        $stockRowAfter = IngredientStock::where('ingredient_id', $this->teriyakiSauce->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertEquals($oldStock + $qtyBaseMl, (float) $stockRowAfter->stock);
        $this->assertEquals($oldValue + $expectedBatchCost, (float) $stockRowAfter->total_stock_value);
    }

    /**
     * Test 21 — Branch-specific costing isolation:
     * Updating acquisition cost and restock quantities at Victoria leaves Santa Cruz
     * costs, total values, and quantities completely unaffected.
     */
    public function test_21_branch_specific_costing_isolation()
    {
        // Snapshot Santa Cruz stock before
        $scStockBefore = IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->first();
        $scOldQty = (float) ($scStockBefore?->stock ?? 0);
        $scOldVal = (float) ($scStockBefore?->total_stock_value ?? 0);
        $scOldCost = (float) ($scStockBefore?->cost_per_unit ?? 0);

        // Restock Victoria with distinct unit cost
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 5,
                        'unit' => 'kg',
                        'unit_cost' => 220.0, // ₱220/kg
                        'purchase_price' => 1100.0,
                        'expiration_date' => Carbon::now()->addDays(14)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $response->assertStatus(200);

        // Santa Cruz stock must remain strictly identical
        $scStockAfter = IngredientStock::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->first();

        $this->assertEquals($scOldQty, (float) ($scStockAfter?->stock ?? 0));
        $this->assertEquals($scOldVal, (float) ($scStockAfter?->total_stock_value ?? 0));
        $this->assertEquals($scOldCost, (float) ($scStockAfter?->cost_per_unit ?? 0));
    }

    /**
     * Test 22 — Zero-cost handling and negative cost rejection:
     * Negative unit cost or purchase price is rejected with 422 validation error.
     * Zero-cost restock is supported (e.g., complimentary promotional inventory).
     */
    public function test_22_zero_cost_handling_and_negative_cost_rejection()
    {
        // 1. Negative unit cost is rejected
        $negativeResponse = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 2,
                        'unit' => 'kg',
                        'unit_cost' => -100,
                        'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $negativeResponse->assertStatus(422);

        // 2. Zero-cost restock succeeds
        $zeroCostResponse = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => $this->chicken->id,
                        'quantity' => 1,
                        'unit' => 'kg',
                        'unit_cost' => 0,
                        'purchase_price' => 0,
                        'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
                        'included' => true,
                    ]
                ]
            ]);

        $zeroCostResponse->assertStatus(200);
        $this->assertEquals(0.0, (float) $zeroCostResponse->json('receipts.0.purchase_price'));
        $this->assertEquals(0.0, (float) $zeroCostResponse->json('receipts.0.unit_cost'));
    }

    /**
     * Test 23 — Failed restocking leaves costing and inventory unchanged:
     * When validation or processing fails, no batches or movements are persisted and
     * stock/cost values are untouched.
     */
    public function test_23_failed_restocking_leaves_costing_and_inventory_unchanged()
    {
        $stockBefore = IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $oldStock = (float) $stockBefore->stock;
        $oldVal = (float) $stockBefore->total_stock_value;
        $oldCost = (float) $stockBefore->cost_per_unit;

        // Attempt restock with an invalid ingredient not in recipe
        $response = $this->actingAs($this->admin)
            ->postJson("/products/{$this->chickenTeriyaki->id}/restock-ingredients", [
                'branch_id' => $this->branchVictoria->id,
                'items' => [
                    [
                        'ingredient_id' => 999999, // Injected invalid ingredient
                        'quantity' => 5,
                        'unit' => 'kg',
                        'unit_cost' => 150,
                        'included' => true,
                    ]
                ]
            ]);

        $response->assertStatus(422);

        $stockAfter = IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();

        $this->assertEquals($oldStock, (float) $stockAfter->stock);
        $this->assertEquals($oldVal, (float) $stockAfter->total_stock_value);
        $this->assertEquals($oldCost, (float) $stockAfter->cost_per_unit);
    }

    /**
     * Test 24 — Standard inventory restocking remains functional with costing:
     * The general inventory stock-in endpoint continues to function seamlessly with purchase_price.
     */
    public function test_24_standard_inventory_restocking_remains_functional_with_costing()
    {
        $response = $this->actingAs($this->admin)
            ->post('/inventory/stock-in', [
                'type' => 'ingredient',
                'id' => $this->chicken->id,
                'quantity' => 3,
                'unit' => 'kg',
                'branch_id' => $this->branchVictoria->id,
                'purchase_price' => 600.0,
                'expiration_date' => Carbon::now()->addDays(7)->toDateString(),
            ]);

        $response->assertSessionHasNoErrors();

        $batch = IngredientBatch::where('ingredient_id', $this->chicken->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals(600.0, (float) $batch->purchase_price);
    }
}

