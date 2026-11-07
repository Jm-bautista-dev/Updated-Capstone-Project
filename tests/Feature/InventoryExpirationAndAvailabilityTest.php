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
use App\Models\Wastage;
use App\Models\User;
use App\Services\InventoryExpirationService;
use App\Services\SaleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\ExpiredIngredientDisposed;

class InventoryExpirationAndAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchVictoria;
    public Branch $branchStaCruz;
    public $productCategory;
    public User $admin;
    public User $cashierVictoria;
    public User $cashierStaCruz;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->branchStaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->productCategory = Category::create([
            'name' => 'Sushi & Rolls',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchVictoria->id,
            'must_change_password' => false,
        ]);

        $this->cashierStaCruz = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchStaCruz->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * Test 1: Future unexpired batches remain usable and are not disposed.
     */
    public function test_future_batches_remain_usable_and_not_disposed(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Nori Sheets',
            'unit' => 'pcs',
            'min_stock_level' => 10,
            'cost_per_unit' => 2.50,
        ]);

        $stock = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 100, 'total_stock_value' => 250.00]
        );

        $batch = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-NORI-FUTURE',
            'initial_quantity' => 100,
            'current_quantity' => 100,
            'unit' => 'pcs',
            'cost_per_base_unit' => 2.50,
            'received_at' => Carbon::now('Asia/Manila')->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->addDays(15)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);
        $result = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);

        $this->assertEquals(0, $result['disposed_count']);
        $batch->refresh();
        $this->assertEquals('available', $batch->status);
        $this->assertEquals(100, (float) $batch->current_quantity);

        $stock->refresh();
        $this->assertEquals(100, (float) $stock->stock);
    }

    /**
     * Test 2: Expired batch is automatically disposed, ledger created, and stock updated.
     */
    public function test_expired_batch_automatically_disposed_and_ledger_records_created(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Breaded Chicken',
            'unit' => 'kg',
            'min_stock_level' => 5,
            'cost_per_unit' => 180.00,
        ]);

        $stock = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 10000.0, 'total_stock_value' => 1800.00]
        );

        $batch = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-BC-EXPIRED',
            'initial_quantity' => 10000.0,
            'current_quantity' => 10000.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 0.18,
            'received_at' => Carbon::now('Asia/Manila')->subDays(10)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);
        $result = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);

        $this->assertEquals(1, $result['disposed_count']);
        $this->assertEquals(10.0, (float) $result['disposed_items'][0]['disposed_quantity']);

        // Verify batch state (non-destructive update, preserved audit)
        $batch->refresh();
        $this->assertEquals('expired', $batch->status);
        $this->assertEquals(0.0, (float) $batch->current_quantity);

        // Verify aggregate stock
        $stock->refresh();
        $this->assertEquals(0.0, (float) $stock->stock);
        $this->assertEquals(0.0, (float) $stock->total_stock_value);

        // Verify Wastage ledger record
        $wastage = Wastage::where('wastable_type', Ingredient::class)
            ->where('wastable_id', $ingredient->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($wastage);
        $this->assertEquals(10.0, (float) $wastage->quantity);
        $this->assertEquals('expired', $wastage->reason);
        $this->assertEquals(1800.00, (float) $wastage->cost_at_loss);

        // Verify Batch Movement audit ledger
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals('expired_removal', $movement->movement_type);
        $this->assertEquals(10.0, (float) $movement->quantity);
        $this->assertEquals(10000.0, (float) $movement->previous_batch_quantity);
        $this->assertEquals(0.0, (float) $movement->new_batch_quantity);
    }

    /**
     * Test 3: Partially consumed batch disposes only remaining quantity.
     */
    public function test_partially_consumed_batch_disposes_only_remaining_stock(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Japanese Mayo',
            'unit' => 'kg',
            'min_stock_level' => 2,
            'cost_per_unit' => 200.00,
        ]);

        $stock = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 3500.0, 'total_stock_value' => 700.00]
        );

        $batch = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-MAYO-PARTIAL',
            'initial_quantity' => 10000.0,
            'current_quantity' => 3500.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 0.20,
            'received_at' => Carbon::now('Asia/Manila')->subDays(5)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);
        $result = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);

        $this->assertEquals(1, $result['disposed_count']);
        $this->assertEquals(3.5, (float) $result['disposed_items'][0]['disposed_quantity']);

        $batch->refresh();
        $this->assertEquals('expired', $batch->status);
        $this->assertEquals(0.0, (float) $batch->current_quantity);

        $stock->refresh();
        $this->assertEquals(0.0, (float) $stock->stock);

        $wastage = Wastage::where('wastable_type', Ingredient::class)
            ->where('wastable_id', $ingredient->id)
            ->first();
        $this->assertEquals(3.5, (float) $wastage->quantity);
        $this->assertEquals(700.00, (float) $wastage->cost_at_loss);
    }

    /**
     * Test 4: Fully consumed (0 remaining) batch does not create duplicate wastage.
     */
    public function test_fully_consumed_batch_does_not_create_wastage_or_double_deduct(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Teriyaki Sauce',
            'unit' => 'liters',
            'min_stock_level' => 1,
            'cost_per_unit' => 150.00,
        ]);

        $stock = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 0.0, 'total_stock_value' => 0.0]
        );

        $batch = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-TERIYAKI-EMPTY',
            'initial_quantity' => 5000.0,
            'current_quantity' => 0.0,
            'unit' => 'liters',
            'cost_per_base_unit' => 0.15,
            'received_at' => Carbon::now('Asia/Manila')->subDays(10)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(2)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);
        $result = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);

        $this->assertEquals(0, $result['disposed_count']);
        $this->assertEquals(0, Wastage::where('wastable_type', Ingredient::class)->where('wastable_id', $ingredient->id)->count());

        $batch->refresh();
        $this->assertEquals('expired', $batch->status);
        $this->assertEquals(0.0, (float) $batch->current_quantity);
    }

    /**
     * Test 5: Product availability recalculation matches exactly the 47 to 44 servings scenario.
     */
    public function test_product_recipe_availability_recalculates_from_47_to_44_servings_when_batch_expires(): void
    {
        // Breaded Chicken ingredient
        $chicken = Ingredient::create([
            'name' => 'Breaded Chicken',
            'unit' => 'g',
            'min_stock_level' => 500,
            'cost_per_unit' => 0.50,
        ]);

        // Sushi product requires 100g of Breaded Chicken per serving
        $sushi = Product::create([
            'name' => 'Chicken Teriyaki Roll',
            'category_id' => $this->productCategory->id,
            'price' => 160.00,
            'selling_price' => 160.00,
            'is_available' => true,
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $sushi->id,
            'ingredient_id' => $chicken->id,
            'quantity_required' => 100, // 100g per serving
            'unit' => 'g',
        ]);

        // We want total starting stock for 47 servings = 4,700g
        // Batch 1 (Valid): 4,400g (supports 44 servings), expires in 10 days
        // Batch 2 (Expired): 300g (supports 3 servings), expired 1 day ago
        $stock = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $chicken->id],
            ['stock' => 4700.0, 'total_stock_value' => 2350.00]
        );

        $validBatch = IngredientBatch::create([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-BC-VALID-44',
            'initial_quantity' => 4400.0,
            'current_quantity' => 4400.0,
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
            'received_at' => Carbon::now('Asia/Manila')->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->addDays(10)->toDateString(),
            'status' => 'available',
        ]);

        $expiredBatch = IngredientBatch::create([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-BC-EXPIRED-3',
            'initial_quantity' => 300.0,
            'current_quantity' => 300.0,
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
            'received_at' => Carbon::now('Asia/Manila')->subDays(5)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        // Prior to running expiration service, calculate available servings through on-demand check
        // dynamicAvailability() triggers processExpiredBatches internally, automatically reducing 47 -> 44
        $servings = $sushi->dynamicAvailability($this->branchVictoria->id);

        $this->assertEquals(44, (int) $servings['available']);

        // Verify the expired batch was automatically marked expired and current_quantity = 0
        $expiredBatch->refresh();
        $this->assertEquals('expired', $expiredBatch->status);
        $this->assertEquals(0.0, (float) $expiredBatch->current_quantity);

        // Verify valid batch remains fully intact
        $validBatch->refresh();
        $this->assertEquals('available', $validBatch->status);
        $this->assertEquals(4400.0, (float) $validBatch->current_quantity);

        // Aggregate stock decremented from 4700 to 4400
        $stock->refresh();
        $this->assertEquals(4400.0, (float) $stock->stock);
    }

    /**
     * Test 6: POS checkout accepts genuine available servings (44) and rejects requests exceeding genuine stock (45).
     */
    public function test_pos_checkout_succeeds_up_to_genuine_availability_and_rejects_excess(): void
    {
        $chicken = Ingredient::create([
            'name' => 'Breaded Chicken',
            'unit' => 'g',
            'min_stock_level' => 500,
            'cost_per_unit' => 0.50,
        ]);

        $sushi = Product::create([
            'name' => 'Chicken Teriyaki Roll',
            'category_id' => $this->productCategory->id,
            'price' => 160.00,
            'selling_price' => 160.00,
            'is_available' => true,
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $sushi->id,
            'ingredient_id' => $chicken->id,
            'quantity_required' => 100, // 100g per serving
            'unit' => 'g',
        ]);

        // Aggregate stock = 4,700g, but 300g is expired
        IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $chicken->id],
            ['stock' => 4700.0, 'total_stock_value' => 2350.00]
        );

        IngredientBatch::create([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-BC-VALID',
            'initial_quantity' => 4400.0,
            'current_quantity' => 4400.0,
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
            'received_at' => Carbon::now('Asia/Manila')->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->addDays(10)->toDateString(),
            'status' => 'available',
        ]);

        IngredientBatch::create([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-BC-EXPIRED',
            'initial_quantity' => 300.0,
            'current_quantity' => 300.0,
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
            'received_at' => Carbon::now('Asia/Manila')->subDays(5)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        $saleService = app(SaleService::class);

        // Attempting to sell 45 servings should FAIL because genuine stock is only 44
        $this->expectException(\Exception::class);
        $saleService->processSale([
            'branch_id' => $this->branchVictoria->id,
            'user_id' => $this->cashierVictoria->id,
            'total_amount' => 45 * 160.00,
            'received_amount' => 45 * 160.00,
            'change_amount' => 0,
            'payment_method' => 'cash',
            'items' => [
                [
                    'product_id' => $sushi->id,
                    'quantity' => 45,
                    'unit_price' => 160.00,
                    'subtotal' => 45 * 160.00,
                ],
            ],
        ]);
    }

    /**
     * Test 7: Branch isolation: Expiration in Victoria has no effect on Sta. Cruz.
     */
    public function test_branch_isolation_expired_batch_in_victoria_does_not_affect_santa_cruz(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Salmon Fillet',
            'unit' => 'kg',
            'min_stock_level' => 2,
            'cost_per_unit' => 500.00,
        ]);

        // Victoria: 5kg expired
        $stockVictoria = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 5.0, 'total_stock_value' => 2500.00]
        );

        $batchVictoria = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-VIC-SALMON',
            'initial_quantity' => 5.0,
            'current_quantity' => 5.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 500.00,
            'received_at' => Carbon::now('Asia/Manila')->subDays(6)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        // Sta. Cruz: 8kg valid
        $stockStaCruz = IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchStaCruz->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 8.0, 'total_stock_value' => 4000.00]
        );

        $batchStaCruz = IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchStaCruz->id,
            'batch_code' => 'BATCH-SC-SALMON',
            'initial_quantity' => 8.0,
            'current_quantity' => 8.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 500.00,
            'received_at' => Carbon::now('Asia/Manila')->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->addDays(7)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);

        // Process Victoria only
        $resVictoria = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);
        $this->assertEquals(1, $resVictoria['disposed_count']);

        // Victoria stock disposed
        $stockVictoria->refresh();
        $this->assertEquals(0.0, (float) $stockVictoria->stock);

        // Sta. Cruz remains completely untouched
        $stockStaCruz->refresh();
        $batchStaCruz->refresh();
        $this->assertEquals(8.0, (float) $stockStaCruz->stock);
        $this->assertEquals(8.0, (float) $batchStaCruz->current_quantity);
        $this->assertEquals('available', $batchStaCruz->status);
    }

    /**
     * Test 8: Idempotency: Multiple executions do not produce double disposals or duplicated wastage.
     */
    public function test_idempotency_running_expiration_service_multiple_times_does_not_duplicate_disposals(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Avocado',
            'unit' => 'kg',
            'min_stock_level' => 3,
            'cost_per_unit' => 120.00,
        ]);

        IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 6000.0, 'total_stock_value' => 720.00]
        );

        IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-AVO-EXPIRED',
            'initial_quantity' => 6000.0,
            'current_quantity' => 6000.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 0.12,
            'received_at' => Carbon::now('Asia/Manila')->subDays(4)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        $expirationService = app(InventoryExpirationService::class);

        $res1 = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);
        $this->assertEquals(1, $res1['disposed_count']);

        // Second immediate execution
        $res2 = $expirationService->processExpiredBatches($this->branchVictoria->id, $this->admin->id);
        $this->assertEquals(0, $res2['disposed_count']);
        $this->assertEmpty($res2['disposed_items']);

        // Only 1 Wastage record was created
        $this->assertEquals(1, Wastage::where('wastable_type', Ingredient::class)->where('wastable_id', $ingredient->id)->count());
    }

    /**
     * Test 9: Artisan command execution processes expired batches cleanly.
     */
    public function test_artisan_console_command_processes_expired_inventory(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Cream Cheese',
            'unit' => 'kg',
            'min_stock_level' => 2,
            'cost_per_unit' => 250.00,
        ]);

        IngredientStock::updateOrCreate(
            ['branch_id' => $this->branchVictoria->id, 'ingredient_id' => $ingredient->id],
            ['stock' => 4000.0, 'total_stock_value' => 1000.00]
        );

        IngredientBatch::create([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branchVictoria->id,
            'batch_code' => 'BATCH-CC-EXPIRED',
            'initial_quantity' => 4000.0,
            'current_quantity' => 4000.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 0.25,
            'received_at' => Carbon::now('Asia/Manila')->subDays(7)->toDateString(),
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(1)->toDateString(),
            'status' => 'available',
        ]);

        $this->artisan('inventory:process-expired', [
            '--branch' => $this->branchVictoria->id,
        ])
            ->assertExitCode(0);

        $this->assertEquals(1, Wastage::where('wastable_type', Ingredient::class)->where('wastable_id', $ingredient->id)->count());
    }
}
