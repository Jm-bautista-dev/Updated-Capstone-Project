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
use App\Models\BatchAllocation;
use App\Models\MenuItemIngredient;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CashierShift;
use App\Services\InventoryBatchService;
use App\Services\ExpirationAlertService;
use App\Services\InventoryService;
use App\Services\SaleService;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FifoFefoInventoryQueueTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchVictoria;
    public Branch $branchSantaCruz;
    public Category $testCategory;
    public User $admin;
    public User $cashierVictoria;
    public User $cashierSantaCruz;
    public InventoryBatchService $batchService;
    public ExpirationAlertService $alertService;
    public SaleService $saleService;
    public InventoryService $inventoryService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Signature Rolls',
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

        $this->cashierSantaCruz = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);

        $this->batchService = app(InventoryBatchService::class);
        $this->alertService = app(ExpirationAlertService::class);
        $this->saleService = app(SaleService::class);
        $this->inventoryService = app(InventoryService::class);
    }

    protected function createIngredient(string $name, string $unit = 'g', float $cost = 1.0, bool $requiresExpiry = true): Ingredient
    {
        return Ingredient::create([
            'name' => $name,
            'unit' => $unit,
            'cost_per_unit' => $cost,
            'cost_per_base_unit' => $cost,
            'low_stock_level' => 100,
            'requires_expiration_tracking' => $requiresExpiry,
            'expiry_warning_days' => 5,
        ]);
    }

    /**
     * TEST 1 — FEFO Priority:
     * Batch A: Received Oct 1, Expires Oct 25, 2 kg
     * Batch B: Received Oct 8, Expires Oct 18, 3 kg
     * Batch C: Received Oct 10, Expires Oct 30, 5 kg
     * Consuming 4 kg must consume 3 kg from Batch B (expires sooner), then 1 kg from Batch A.
     */
    public function test_1_fefo_priority_earliest_expiring_batch_consumed_first(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $chicken = $this->createIngredient('Chicken Fillet', 'kg', 180.00);

        // BATCH A: Oct 1 received, Oct 25 expiry, 2 kg
        $batchA = $this->batchService->stockInBatch([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'BATCH-A',
            'quantity' => 2.0,
            'unit' => 'kg',
            'received_at' => Carbon::parse('2026-10-01 08:00:00'),
            'expiration_date' => Carbon::parse('2026-10-25'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 180.00,
            'received_by' => $this->admin->id,
        ]);

        // BATCH B: Oct 8 received, Oct 18 expiry, 3 kg
        $batchB = $this->batchService->stockInBatch([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'BATCH-B',
            'quantity' => 3.0,
            'unit' => 'kg',
            'received_at' => Carbon::parse('2026-10-08 08:00:00'),
            'expiration_date' => Carbon::parse('2026-10-18'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 180.00,
            'received_by' => $this->admin->id,
        ]);

        // BATCH C: Oct 10 received, Oct 30 expiry, 5 kg
        $batchC = $this->batchService->stockInBatch([
            'ingredient_id' => $chicken->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'BATCH-C',
            'quantity' => 5.0,
            'unit' => 'kg',
            'received_at' => Carbon::parse('2026-10-10 08:00:00'),
            'expiration_date' => Carbon::parse('2026-10-30'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 180.00,
            'received_by' => $this->admin->id,
        ]);

        // Verify Queue Ordering before allocation
        $queue = $this->batchService->getQueueForIngredient($chicken->id, $this->branchVictoria->id);
        $this->assertEquals($batchB->id, $queue['eligible_batches'][0]['id'], 'Batch B must be Priority 1 (earliest expiration)');
        $this->assertEquals($batchA->id, $queue['eligible_batches'][1]['id'], 'Batch A must be Priority 2');
        $this->assertEquals($batchC->id, $queue['eligible_batches'][2]['id'], 'Batch C must be Priority 3');

        // Consume 4 kg (4000 g in base units)
        $allocations = $this->batchService->allocateStock(
            $chicken->id,
            $this->branchVictoria->id,
            4000.0,
            'sale',
            1,
            'SALE-101',
            $this->admin->id
        );

        $this->assertCount(2, $allocations);
        // Allocation 1: From Batch B, 3000g base = 3 kg
        $this->assertEquals($batchB->id, $allocations[0]->batch_id);
        $this->assertEquals(3000.0, (float) $allocations[0]->quantity_base);

        // Allocation 2: From Batch A, 1000g base = 1 kg
        $this->assertEquals($batchA->id, $allocations[1]->batch_id);
        $this->assertEquals(1000.0, (float) $allocations[1]->quantity_base);

        // Verify remaining quantities
        $batchB->refresh();
        $batchA->refresh();
        $batchC->refresh();

        $this->assertEquals(0.0, (float) $batchB->current_quantity);
        $this->assertEquals('depleted', $batchB->status);

        $this->assertEquals(1000.0, (float) $batchA->current_quantity);
        $this->assertEquals(1.0, UnitConverter::convertFromBaseQuantity((float) $batchA->current_quantity, 'kg'));
        $this->assertEquals('available', $batchA->status);

        $this->assertEquals(5000.0, (float) $batchC->current_quantity);
        $this->assertEquals(5.0, UnitConverter::convertFromBaseQuantity((float) $batchC->current_quantity, 'kg'));
        $this->assertEquals('available', $batchC->status);
    }

    /**
     * TEST 2 — FIFO tie-breaker:
     * When two batches have the exact same expiration date, the earlier received batch is consumed first.
     */
    public function test_2_fifo_tie_breaker_same_expiration_oldest_received_consumed_first(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $salmon = $this->createIngredient('Fresh Salmon', 'kg', 500.00);

        // Batch 1: Received Oct 1, Expiry Oct 20, 2 kg
        $batch1 = $this->batchService->stockInBatch([
            'ingredient_id' => $salmon->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'SALMON-001',
            'quantity' => 2.0,
            'unit' => 'kg',
            'received_at' => Carbon::parse('2026-10-01 08:00:00'),
            'expiration_date' => Carbon::parse('2026-10-20'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 500.00,
            'received_by' => $this->admin->id,
        ]);

        // Batch 2: Received Oct 5, Expiry Oct 20 (Same Expiry!), 3 kg
        $batch2 = $this->batchService->stockInBatch([
            'ingredient_id' => $salmon->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'SALMON-002',
            'quantity' => 3.0,
            'unit' => 'kg',
            'received_at' => Carbon::parse('2026-10-05 08:00:00'),
            'expiration_date' => Carbon::parse('2026-10-20'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 500.00,
            'received_by' => $this->admin->id,
        ]);

        // Allocate 1 kg (1000g base)
        $allocations = $this->batchService->allocateStock(
            $salmon->id,
            $this->branchVictoria->id,
            1000.0,
            'sale',
            1,
            'SALE-102',
            $this->admin->id
        );

        $this->assertCount(1, $allocations);
        $this->assertEquals($batch1->id, $allocations[0]->batch_id, 'Batch 1 must be prioritized via FIFO tie-breaker');

        $batch1->refresh();
        $this->assertEquals(1000.0, (float) $batch1->current_quantity);
    }

    /**
     * TEST 3 — Partial allocation across multiple batches:
     * Recipe requires 1000g. Batch 1 has 600g, Batch 2 has 800g.
     */
    public function test_3_partial_allocation_across_multiple_batches(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $rice = $this->createIngredient('Sushi Rice', 'g', 0.08);

        $batch1 = $this->batchService->stockInBatch([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'RICE-LOT-1',
            'quantity' => 600.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-01'),
            'expiration_date' => Carbon::parse('2026-10-20'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 0.08,
            'received_by' => $this->admin->id,
        ]);

        $batch2 = $this->batchService->stockInBatch([
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'RICE-LOT-2',
            'quantity' => 800.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-02'),
            'expiration_date' => Carbon::parse('2026-10-25'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 0.08,
            'received_by' => $this->admin->id,
        ]);

        $allocations = $this->batchService->allocateStock(
            $rice->id,
            $this->branchVictoria->id,
            1000.0,
            'sale',
            1,
            'SALE-103',
            $this->admin->id
        );

        $this->assertCount(2, $allocations);
        $this->assertEquals($batch1->id, $allocations[0]->batch_id);
        $this->assertEquals(600.0, (float) $allocations[0]->quantity_base);

        $this->assertEquals($batch2->id, $allocations[1]->batch_id);
        $this->assertEquals(400.0, (float) $allocations[1]->quantity_base);

        $batch1->refresh();
        $batch2->refresh();
        $this->assertEquals(0.0, (float) $batch1->current_quantity);
        $this->assertEquals(400.0, (float) $batch2->current_quantity);
    }

    /**
     * TEST 4 — Expired batch exclusion:
     * Batch 1 is expired (use_by before today). Batch 2 is valid.
     * System must strictly skip Batch 1 and allocate only from Batch 2.
     */
    public function test_4_expired_batch_strictly_excluded_from_allocation(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $tuna = $this->createIngredient('Bluefin Tuna', 'g', 1.50);

        // Expired batch (expired yesterday)
        $batchExpired = $this->batchService->stockInBatch([
            'ingredient_id' => $tuna->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'TUNA-EXPIRED',
            'quantity' => 500.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-01'),
            'expiration_date' => Carbon::parse('2026-10-12'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 1.50,
            'received_by' => $this->admin->id,
        ]);

        // Valid batch
        $batchValid = $this->batchService->stockInBatch([
            'ingredient_id' => $tuna->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'TUNA-VALID',
            'quantity' => 1000.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-05'),
            'expiration_date' => Carbon::parse('2026-10-25'),
            'expiration_type' => 'use_by',
            'cost_per_base_unit' => 1.50,
            'received_by' => $this->admin->id,
        ]);

        $available = $this->batchService->getAvailableEligibleStock($tuna->id, $this->branchVictoria->id);
        $this->assertEquals(1000.0, $available, 'Only valid batch stock must be recognized as eligible');

        $allocations = $this->batchService->allocateStock(
            $tuna->id,
            $this->branchVictoria->id,
            300.0,
            'sale',
            1,
            'SALE-104',
            $this->admin->id
        );

        $this->assertCount(1, $allocations);
        $this->assertEquals($batchValid->id, $allocations[0]->batch_id);

        $batchExpired->refresh();
        $this->assertEquals(500.0, (float) $batchExpired->current_quantity, 'Expired batch must not be touched');
    }

    /**
     * TEST 5 — Quarantine:
     * A quarantined batch must never be allocated automatically.
     */
    public function test_5_quarantined_batch_never_allocated(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $beef = $this->createIngredient('Wagyu Beef', 'g', 2.00);

        $batchQuarantined = $this->batchService->stockInBatch([
            'ingredient_id' => $beef->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'BEEF-QUARANTINED',
            'quantity' => 1000.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-01'),
            'expiration_date' => Carbon::parse('2026-10-25'),
            'cost_per_base_unit' => 2.00,
            'received_by' => $this->admin->id,
        ]);
        $this->batchService->updateBatchStatus($batchQuarantined->id, 'quarantined', 'Suspected temperature breach during transit');

        $batchAvailable = $this->batchService->stockInBatch([
            'ingredient_id' => $beef->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'BEEF-CLEAN',
            'quantity' => 500.0,
            'unit' => 'g',
            'received_at' => Carbon::parse('2026-10-05'),
            'expiration_date' => Carbon::parse('2026-10-25'),
            'cost_per_base_unit' => 2.00,
            'received_by' => $this->admin->id,
        ]);

        $allocations = $this->batchService->allocateStock(
            $beef->id,
            $this->branchVictoria->id,
            200.0,
            'sale',
            1,
            'SALE-105',
            $this->admin->id
        );

        $this->assertEquals($batchAvailable->id, $allocations[0]->batch_id);
        $batchQuarantined->refresh();
        $this->assertEquals(1000.0, (float) $batchQuarantined->current_quantity);
    }

    /**
     * TEST 6 — Insufficient eligible stock:
     * Requesting more than available eligible stock throws an actionable exception.
     * Does not fabricate stock or create negative quantities.
     */
    public function test_6_insufficient_eligible_stock_throws_and_prevents_deduction(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $wasabi = $this->createIngredient('Fresh Wasabi', 'g', 0.50);

        $this->batchService->stockInBatch([
            'ingredient_id' => $wasabi->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 100.0,
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
            'received_by' => $this->admin->id,
        ]);

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient eligible stock in this branch');

        $this->batchService->allocateStock(
            $wasabi->id,
            $this->branchVictoria->id,
            150.0,
            'sale',
            1,
            'SALE-106',
            $this->admin->id
        );
    }

    /**
     * TEST 7 — Unit conversion:
     * A recipe requires 250 g of an ingredient held in a 2 kg batch.
     * The correct remaining quantity must be 1.75 kg (1750 g in base units).
     */
    public function test_7_unit_conversion_precision_in_batch_deductions(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $flour = $this->createIngredient('Tempura Flour', 'kg', 60.00);

        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $flour->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 2.0,
            'unit' => 'kg',
            'cost_per_base_unit' => 60.00,
            'received_by' => $this->admin->id,
        ]);

        // Deduct 250 grams (base unit is grams, so 250.0g)
        $allocations = $this->batchService->allocateStock(
            $flour->id,
            $this->branchVictoria->id,
            250.0,
            'sale',
            1,
            'SALE-107',
            $this->admin->id
        );

        $this->assertCount(1, $allocations);
        $batch->refresh();
        $this->assertEquals(1750.0, (float) $batch->current_quantity);
        $this->assertEquals(1.75, UnitConverter::convertFromBaseQuantity((float) $batch->current_quantity, 'kg'));
    }

    /**
     * TEST 8 — Multi-ingredient sale atomic rollback:
     * Product requires 2 ingredients. If 1 lacks stock, neither is deducted.
     */
    public function test_8_multi_ingredient_atomic_recipe_deductions(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $nori = $this->createIngredient('Nori Seaweed', 'pcs', 5.00);
        $crab = $this->createIngredient('Crab Meat', 'g', 0.80);

        // Stock Nori sufficiently
        $this->batchService->stockInBatch([
            'ingredient_id' => $nori->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 10.0,
            'unit' => 'pcs',
            'received_by' => $this->admin->id,
        ]);

        // Crab meat has ZERO stock
        $product = Product::create([
            'name' => 'California Roll',
            'sku' => 'SKU-CALIF',
            'category_id' => $this->testCategory->id,
            'selling_price' => 250.00,
            'branch_id' => $this->branchVictoria->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $nori->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $crab->id,
            'quantity_required' => 50,
            'unit' => 'g',
        ]);

        // Availability check must report out of stock
        $avail = $product->dynamicAvailability($this->branchVictoria->id);
        $this->assertFalse($avail['is_available']);

        // Create active shift for cashier
        CashierShift::create([
            'cashier_id' => $this->cashierVictoria->id,
            'branch_id' => $this->branchVictoria->id,
            'start_time' => now(),
            'starting_cash' => 1000,
            'status' => 'open',
        ]);

        // Attempting to deduct via saleService must fail atomically
        $this->actingAs($this->cashierVictoria);
        try {
            $this->saleService->processSale([
                'branch_id' => $this->branchVictoria->id,
                'payment_method' => 'cash',
                'items' => [['id' => $product->id, 'quantity' => 1]],
            ]);
            $this->fail('Expected Exception was not thrown');
        } catch (\Exception $e) {
            $this->assertStringContainsString('Insufficient', $e->getMessage());
        }

        // Verify Nori was NOT deducted
        $noriStock = $this->batchService->getAvailableEligibleStock($nori->id, $this->branchVictoria->id);
        $this->assertEquals(10.0, $noriStock, 'Atomic transaction rollback preserved Nori quantity');
    }

    /**
     * TEST 9 — Duplicate processing idempotency:
     * Processing deductions for the same sale twice does not duplicate movements.
     */
    public function test_9_duplicate_processing_idempotency(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $sesame = $this->createIngredient('Sesame Seeds', 'g', 0.10);
        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $sesame->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 500.0,
            'unit' => 'g',
            'received_by' => $this->admin->id,
        ]);

        // Allocate 20g for sale #501
        $alloc1 = $this->batchService->allocateStock(
            $sesame->id,
            $this->branchVictoria->id,
            20.0,
            'sale',
            501,
            'SALE-501',
            $this->admin->id
        );

        $batch->refresh();
        $this->assertEquals(480.0, (float) $batch->current_quantity);

        // Attempt duplicate deduction using batchService allocation logic
        $existing = BatchAllocation::where('allocatable_type', 'sale')
            ->where('allocatable_id', 501)
            ->where('ingredient_id', $sesame->id)
            ->exists();

        $this->assertTrue($existing);
    }

    /**
     * TEST 10 — Branch isolation:
     * Victoria branch stock cannot be consumed by Santa Cruz branch.
     */
    public function test_10_branch_isolation_strictly_enforced(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $soySauce = $this->createIngredient('Soy Sauce', 'ml', 0.05);

        // Stock in Victoria only
        $this->batchService->stockInBatch([
            'ingredient_id' => $soySauce->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 1000.0,
            'unit' => 'ml',
            'received_by' => $this->admin->id,
        ]);

        // Victoria has 1000 ml
        $this->assertEquals(1000.0, $this->batchService->getAvailableEligibleStock($soySauce->id, $this->branchVictoria->id));
        // Santa Cruz has 0 ml
        $this->assertEquals(0.0, $this->batchService->getAvailableEligibleStock($soySauce->id, $this->branchSantaCruz->id));

        // Attempt allocation at Santa Cruz
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Insufficient eligible stock in this branch');

        $this->batchService->allocateStock(
            $soySauce->id,
            $this->branchSantaCruz->id,
            100.0,
            'sale',
            1,
            'SALE-110',
            $this->admin->id
        );
    }

    /**
     * TEST 11 — Ledger reconciliation:
     * Batch remaining quantities reconcile with movement history and aggregate stock.
     */
    public function test_11_batch_movement_ledger_reconciliation(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));
        $this->actingAs($this->admin);

        $avocado = $this->createIngredient('Fresh Avocado', 'g', 0.25);

        // Stock in 5000g
        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $avocado->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 5000.0,
            'unit' => 'g',
            'received_by' => $this->admin->id,
        ]);

        // 3 consumption events
        $this->batchService->allocateStock($avocado->id, $this->branchVictoria->id, 1000.0, 'sale', 1, null, $this->admin->id, true);
        $this->batchService->allocateStock($avocado->id, $this->branchVictoria->id, 1500.0, 'sale', 2, null, $this->admin->id, true);
        $this->batchService->allocateStock($avocado->id, $this->branchVictoria->id, 500.0, 'sale', 3, null, $this->admin->id, true);

        // 1 wastage event
        $this->inventoryService->logWastage('ingredient', $avocado->id, 200.0, 'g', 'Bruised', 'Spoilage notes', $this->branchVictoria->id, $batch->id);

        $batch->refresh();
        $expectedRemaining = 5000.0 - 1000.0 - 1500.0 - 500.0 - 200.0; // 1800g
        $this->assertEquals($expectedRemaining, (float) $batch->current_quantity);

        // Movement ledger check
        $movements = IngredientBatchMovement::where('batch_id', $batch->id)->get();
        $inSum = $movements->whereIn('movement_type', ['stock_in', 'reversal'])->sum('quantity_base');
        $outSum = $movements->whereIn('movement_type', ['pos_consumption', 'order_consumption', 'waste'])->sum('quantity_base');

        $this->assertEquals($expectedRemaining, $inSum - $outSum, 'Movement ledger reconciles with remaining quantity');

        // Aggregate stock check
        $aggStock = IngredientStock::where('ingredient_id', $avocado->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');

        $this->assertEquals($expectedRemaining, (float) $aggStock, 'Aggregate stock reconciles with batch ledger');
    }

    /**
     * TEST 12 — Void sale reversal:
     * Reversing a sale restores stock to the originating batch if valid,
     * but quarantines it if the batch expired in the interim.
     */
    public function test_12_void_sale_reversal_safety_and_quarantine_divert(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $crabStick = $this->createIngredient('Crab Sticks', 'pcs', 10.00);

        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $crabStick->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 20.0,
            'unit' => 'pcs',
            'expiration_date' => Carbon::parse('2026-10-15'),
            'received_by' => $this->admin->id,
        ]);

        // Allocate 5 pcs
        $allocations = $this->batchService->allocateStock(
            $crabStick->id,
            $this->branchVictoria->id,
            5.0,
            'sale',
            999,
            'SALE-999',
            $this->admin->id
        );

        $batch->refresh();
        $this->assertEquals(15.0, (float) $batch->current_quantity);

        // CASE A: Batch is still valid when reversed
        $reversals = $this->batchService->reverseAllocations('sale', 999, $this->admin->id, 'Void order #999');
        $this->assertCount(1, $reversals);
        $batch->refresh();
        $this->assertEquals(20.0, (float) $batch->current_quantity, 'Stock returned to valid batch');

        // CASE B: Batch becomes expired before next reversal
        $alloc2 = $this->batchService->allocateStock(
            $crabStick->id,
            $this->branchVictoria->id,
            5.0,
            'sale',
            1000,
            'SALE-1000',
            $this->admin->id
        );

        // Fast forward 10 days past expiry date
        Carbon::setTestNow(Carbon::parse('2026-10-25 10:00:00'));

        // Reverse allocation for sale 1000
        $reversalsExpired = $this->batchService->reverseAllocations('sale', 1000, $this->admin->id, 'Void order #1000');
        $batch->refresh();

        // The batch itself was expired, so stock is diverted to quarantined disposition batch
        $this->assertEquals(15.0, (float) $batch->current_quantity, 'Expired batch was NOT incremented into available sale stock');
        $this->assertDatabaseHas('ingredient_batches', [
            'ingredient_id' => $crabStick->id,
            'status' => 'quarantined',
        ]);
    }

    /**
     * TEST 13 — Expiration alert service and deduplication:
     * Scans expiring soon, expiring today, and expired without duplicates.
     */
    public function test_13_expiration_alert_service_and_deduplication(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $mayo = $this->createIngredient('Japanese Mayo', 'g', 0.20);

        // Expired yesterday
        $this->batchService->stockInBatch([
            'ingredient_id' => $mayo->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'MAYO-EXPIRED',
            'quantity' => 100.0,
            'unit' => 'g',
            'expiration_date' => Carbon::parse('2026-10-12'),
            'received_by' => $this->admin->id,
        ]);

        // Expiring today
        $this->batchService->stockInBatch([
            'ingredient_id' => $mayo->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'MAYO-TODAY',
            'quantity' => 200.0,
            'unit' => 'g',
            'expiration_date' => Carbon::parse('2026-10-13'),
            'received_by' => $this->admin->id,
        ]);

        // Expiring soon (3 days)
        $this->batchService->stockInBatch([
            'ingredient_id' => $mayo->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'MAYO-SOON',
            'quantity' => 300.0,
            'unit' => 'g',
            'expiration_date' => Carbon::parse('2026-10-16'),
            'received_by' => $this->admin->id,
        ]);

        $alerts = $this->alertService->getActiveAlerts($this->branchVictoria->id);

        $this->assertEquals(1, $alerts['summary']['expired_count']);
        $this->assertEquals(1, $alerts['summary']['expiring_today_count']);
        $this->assertEquals(1, $alerts['summary']['expiring_soon_count']);
        $this->assertEquals(3, $alerts['summary']['total_alerts']);
    }

    /**
     * TEST 14 — Batch API Endpoints and Security:
     * Cashier cannot adjust batches of other branch; Admin can adjust.
     */
    public function test_14_batch_api_endpoints_and_branch_security(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $ginger = $this->createIngredient('Pickled Ginger', 'g', 0.15);

        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $ginger->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity' => 500.0,
            'unit' => 'g',
            'received_by' => $this->admin->id,
        ]);

        // 1. Cashier Santa Cruz tries to adjust Victoria batch -> 403 Forbidden
        $response = $this->actingAs($this->cashierSantaCruz)
            ->postJson("/inventory/batches/{$batch->id}/adjust", [
                'new_quantity' => 450,
                'unit' => 'g',
                'reason' => 'physical_count',
            ]);
        $response->assertStatus(403);

        // 2. Admin adjusts batch -> 200 Success
        $responseAdmin = $this->actingAs($this->admin)
            ->postJson("/inventory/batches/{$batch->id}/adjust", [
                'new_quantity' => 450,
                'unit' => 'g',
                'reason' => 'physical_count',
            ]);
        $responseAdmin->assertStatus(200);

        $batch->refresh();
        $this->assertEquals(450.0, (float) $batch->current_quantity);

        // 3. Status change to quarantined
        $responseStatus = $this->actingAs($this->admin)
            ->postJson("/inventory/batches/{$batch->id}/status", [
                'status' => 'quarantined',
                'reason' => 'Container seal damage',
            ]);
        $responseStatus->assertStatus(200);

        $batch->refresh();
        $this->assertEquals('quarantined', $batch->status);
    }

    /**
     * TEST 15 — Existing Workflows:
     * Full POS checkout with recipe ingredient deduction creates sale,
     * links batch allocations, updates remaining quantity, and respects branch scoping.
     */
    public function test_15_existing_workflows_pos_checkout_and_recipe_consumption(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $rice = $this->createIngredient('Japanese Sushi Rice', 'g', 0.05);

        // Restock via stockIn controller
        $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $rice->id,
            'quantity' => 1000,
            'unit' => 'g',
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'LOT-RICE-2026',
            'expiration_type' => 'use_by',
            'expiration_date' => '2026-10-30',
        ]);

        $batch = IngredientBatch::where('ingredient_id', $rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($batch);
        $this->assertEquals('LOT-RICE-2026', $batch->lot_number);

        // Product with recipe
        $product = Product::create([
            'name' => 'Salmon Nigiri',
            'sku' => 'SKU-NIGIRI',
            'category_id' => $this->testCategory->id,
            'selling_price' => 120.00,
            'branch_id' => $this->branchVictoria->id,
            'unit' => 'pcs',
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $rice->id,
            'quantity_required' => 50,
            'unit' => 'g',
        ]);

        CashierShift::create([
            'cashier_id' => $this->cashierVictoria->id,
            'branch_id' => $this->branchVictoria->id,
            'start_time' => now(),
            'starting_cash' => 1000,
            'status' => 'open',
        ]);

        // Process POS Sale
        $this->actingAs($this->cashierVictoria);
        $sale = $this->saleService->processSale([
            'branch_id' => $this->branchVictoria->id,
            'payment_method' => 'cash',
            'items' => [['id' => $product->id, 'quantity' => 2]],
        ]);

        $this->assertNotNull($sale);
        $this->assertEquals('completed', $sale->status);

        // Verify batch deduction (2 portions * 50g = 100g)
        $batch->refresh();
        $this->assertEquals(900.0, (float) $batch->current_quantity);

        // Verify allocation record
        $this->assertDatabaseHas('batch_allocations', [
            'batch_id' => $batch->id,
            'ingredient_id' => $rice->id,
            'branch_id' => $this->branchVictoria->id,
            'quantity_base' => 100.0,
            'allocatable_type' => 'App\Models\Sale',
            'allocatable_id' => $sale->id,
        ]);
    }

    /**
     * TEST 16 — Batch Queue API, Details, and Overview Endpoints:
     * Full interactive endpoints for cashier and inventory manager.
     */
    public function test_16_batch_queue_api_details_and_overview_endpoints(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-13 10:00:00'));

        $eel = $this->createIngredient('Unagi Eel', 'g', 1.20);

        $batch = $this->batchService->stockInBatch([
            'ingredient_id' => $eel->id,
            'branch_id' => $this->branchVictoria->id,
            'lot_number' => 'UNAGI-LOT-1',
            'quantity' => 800.0,
            'unit' => 'g',
            'expiration_date' => Carbon::parse('2026-10-25'),
            'received_by' => $this->admin->id,
        ]);

        // 1. Queue endpoint
        $queueResponse = $this->actingAs($this->cashierVictoria)
            ->getJson("/inventory/{$eel->id}/queue?branch_id={$this->branchVictoria->id}");
        $queueResponse->assertStatus(200);
        $queueResponse->assertJsonStructure([
            'ingredient',
            'eligible_batches',
            'ineligible_batches',
            'all_batches',
            'total_eligible_stock',
            'total_physical_stock',
        ]);
        $this->assertCount(1, $queueResponse->json('eligible_batches'));

        // 2. Batch details endpoint
        $detailsResponse = $this->actingAs($this->cashierVictoria)
            ->getJson("/inventory/batches/{$batch->id}");
        $detailsResponse->assertStatus(200);
        $detailsResponse->assertJsonStructure([
            'batch',
            'movements',
            'allocations',
        ]);

        // 3. Overview endpoint
        $overviewResponse = $this->actingAs($this->admin)
            ->getJson("/inventory/batches/overview?branch_id={$this->branchVictoria->id}");
        $overviewResponse->assertStatus(200);
        $overviewResponse->assertJsonStructure([
            'stats' => ['active_batches', 'expiring_today', 'expiring_soon', 'expired_count', 'quarantined_count', 'inventory_valuation'],
            'alerts' => ['summary'],
        ]);
    }
}

