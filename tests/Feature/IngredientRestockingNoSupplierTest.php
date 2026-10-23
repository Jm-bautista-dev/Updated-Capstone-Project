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
use App\Models\StockLog;
use App\Models\User;
use App\Services\InventoryBatchService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;

class IngredientRestockingNoSupplierTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchVictoria;
    public Branch $branchSantaCruz;
    public User $admin;
    public User $cashierVictoria;
    public Ingredient $salmon;
    public Ingredient $nori;
    public Ingredient $rice;

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
            'name' => 'MAKI DESU SANTA CRUZ',
            'latitude' => 14.6100,
            'longitude' => 120.9800,
            'delivery_radius_km' => 10,
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin Manager',
            'email' => 'admin@makidesu.test',
            'role' => 'admin',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'name' => 'Cashier Victoria',
            'email' => 'cashier.vic@makidesu.test',
            'role' => 'cashier',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->salmon = Ingredient::create([
            'name' => 'Fresh Atlantic Salmon',
            'unit' => 'g',
            'cost_per_base_unit' => 0.85,
            'requires_expiration_tracking' => true,
            'default_expiry_days' => null, // Strictly requires explicit date
        ]);

        $this->nori = Ingredient::create([
            'name' => 'Nori Seaweed Sheets',
            'unit' => 'pcs',
            'cost_per_base_unit' => 2.50,
            'requires_expiration_tracking' => false,
            'default_expiry_days' => null,
        ]);

        $this->rice = Ingredient::create([
            'name' => 'Sushi Rice Grain',
            'unit' => 'g',
            'cost_per_base_unit' => 0.06,
            'requires_expiration_tracking' => true,
            'default_expiry_days' => 14,
        ]);
    }

    /**
     * Test 1: Successful restock without supplier name, supplier ID, or supplier lot number.
     * System assigns an internal batch code and creates traceable inventory records.
     */
    public function test_01_successful_restock_without_supplier_or_supplier_lot_information(): void
    {
        Carbon::setTestNow('2026-10-23 10:00:00');

        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->salmon->id,
            'quantity'        => 2.5,
            'unit'            => 'kg',
            'branch_id'       => $this->branchVictoria->id,
            'purchase_price'  => 2125.00,
            'expiration_type' => 'use_by',
            'expiration_date' => '2026-10-28',
            'notes'           => 'Standard fresh fish morning intake',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertSessionHas('success');

        // Verify branch aggregate stock increased correctly (2.5 kg = 2500 g)
        $stock = IngredientStock::where('ingredient_id', $this->salmon->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($stock);
        $this->assertEquals(2500.0, (float) $stock->stock);

        // Verify internal batch was created with auto-generated internal batch code
        $batch = IngredientBatch::where('ingredient_id', $this->salmon->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($batch);
        $this->assertStringStartsWith('BATCH-', $batch->batch_code);
        $this->assertNull($batch->lot_number, 'Supplier lot number should be null since none was provided');
        $this->assertNull($batch->supplier_id, 'Supplier ID should be null');
        $this->assertNull($batch->supplier_name, 'Supplier name should be null');
        $this->assertEquals(2500.0, (float) $batch->current_quantity);
        $this->assertEquals('available', $batch->status);

        // Verify movement ledger entry was created
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals('stock_in', $movement->movement_type);
        $this->assertEquals(2500.0, (float) $movement->quantity_base);

        // Verify StockLog was created
        $log = StockLog::where('storable_id', $this->salmon->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->latest('id')
            ->first();
        $this->assertNotNull($log);
        $this->assertEquals('stock_in', $log->action_type);
        $this->assertEquals(2500.0, (float) $log->quantity_base);
    }

    /**
     * Test 2: Internal FEFO queue prioritizes earlier expiring batches without needing supplier lot info.
     */
    public function test_02_internal_fefo_queue_prioritization_without_supplier_info(): void
    {
        Carbon::setTestNow('2026-10-23 09:00:00');

        // Stock in Batch A: Expires later (Oct 31)
        $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->salmon->id,
            'quantity'        => 1000,
            'unit'            => 'g',
            'branch_id'       => $this->branchVictoria->id,
            'purchase_price'  => 850.00,
            'expiration_type' => 'use_by',
            'expiration_date' => '2026-10-31',
        ]);

        // Stock in Batch B: Expires earlier (Oct 26)
        $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->salmon->id,
            'quantity'        => 500,
            'unit'            => 'g',
            'branch_id'       => $this->branchVictoria->id,
            'purchase_price'  => 425.00,
            'expiration_type' => 'use_by',
            'expiration_date' => '2026-10-26',
        ]);

        $batchService = app(InventoryBatchService::class);
        $queue = $batchService->getQueueForIngredient($this->salmon->id, $this->branchVictoria->id);

        $this->assertCount(2, $queue['eligible_batches']);
        // Batch B (earlier expiry Oct 26) must be rank 1
        $this->assertEquals(1, $queue['eligible_batches'][0]['priority']);
        $this->assertEquals('2026-10-26', Carbon::parse($queue['eligible_batches'][0]['expiration_date'])->toDateString());

        // Batch A (later expiry Oct 31) must be rank 2
        $this->assertEquals(2, $queue['eligible_batches'][1]['priority']);
        $this->assertEquals('2026-10-31', Carbon::parse($queue['eligible_batches'][1]['expiration_date'])->toDateString());

        // Allocate 300g — should be deducted from Batch B (the earliest expiring batch)
        $allocations = $batchService->allocateStock(
            $this->salmon->id,
            $this->branchVictoria->id,
            300.0,
            'TestOrder',
            999
        );

        $this->assertCount(1, $allocations);
        $firstBatch = IngredientBatch::where('expiration_date', 'like', '2026-10-26%')->first();
        $this->assertEquals(200.0, (float) $firstBatch->current_quantity);

        // Later batch remains untouched at 1000g
        $secondBatch = IngredientBatch::where('expiration_date', 'like', '2026-10-31%')->first();
        $this->assertEquals(1000.0, (float) $secondBatch->current_quantity);
    }

    /**
     * Test 3: Non-perishable ingredient restocking (FIFO) without expiration date or supplier information.
     */
    public function test_03_non_perishable_fifo_restock_without_supplier_or_expiry(): void
    {
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->nori->id,
            'quantity'        => 100,
            'unit'            => 'pcs',
            'branch_id'       => $this->branchVictoria->id,
            'purchase_price'  => 250.00,
            'expiration_type' => 'none',
            'expiration_date' => '',
            'notes'           => 'Dry pantry replenishment',
        ]);

        $response->assertSessionHasNoErrors();

        $batch = IngredientBatch::where('ingredient_id', $this->nori->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();
        $this->assertNotNull($batch);
        $this->assertNull($batch->expiration_date);
        $this->assertEquals('none', $batch->expiration_type);
        $this->assertNull($batch->supplier_name);
        $this->assertEquals(100.0, (float) $batch->current_quantity);
    }

    /**
     * Test 4: Weighted Average Costing (WAC) updates correctly on restock without modifying past transaction records.
     */
    public function test_04_weighted_average_costing_wac_calculated_correctly_without_altering_history(): void
    {
        // Initial state: 1000g @ total value 1000 => WAC = 1.00/g
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->rice->id, 'branch_id' => $this->branchVictoria->id],
            [
                'stock'               => 1000.0,
                'total_stock_value'   => 1000.0,
                'cost_per_unit'       => 1.00,
                'last_purchase_price' => 1000.0,
            ]
        );

        // Restock: 1000g @ purchase_price 500 => new total stock 2000g, total value 1500 => WAC = 1500/2000 = 0.75/g
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->rice->id,
            'quantity'        => 1000,
            'unit'            => 'g',
            'branch_id'       => $this->branchVictoria->id,
            'purchase_price'  => 500.00,
            'expiration_type' => 'best_before',
            'expiration_date' => Carbon::now()->addDays(30)->toDateString(),
        ]);

        $response->assertSessionHasNoErrors();

        $stock = IngredientStock::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->first();

        $this->assertEquals(2000.0, (float) $stock->stock);
        $this->assertEquals(1500.0, (float) $stock->total_stock_value);
        $this->assertEquals(0.75, (float) $stock->cost_per_unit);
        $this->assertEquals(500.00, (float) $stock->last_purchase_price);
    }

    /**
     * Test 5: Quantity and receipt unit conversions are accurate (e.g. kg to g).
     */
    public function test_05_unit_conversion_accuracy(): void
    {
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->salmon->id,
            'quantity'        => 3.75,
            'unit'            => 'kg',
            'branch_id'       => $this->branchVictoria->id,
            'expiration_type' => 'use_by',
            'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
        ]);

        $response->assertSessionHasNoErrors();

        $batch = IngredientBatch::where('ingredient_id', $this->salmon->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->latest('id')
            ->first();

        // 3.75 kg = 3750 g base units
        $this->assertEquals(3750.0, (float) $batch->current_quantity);
        $this->assertEquals(3750.0, (float) $batch->initial_quantity);
    }

    /**
     * Test 6: Validation requires expiration date when the ingredient requires expiration tracking.
     */
    public function test_06_validation_requires_expiry_date_when_ingredient_policy_demands_it(): void
    {
        // Salmon requires expiration tracking and has no default expiry days
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->salmon->id,
            'quantity'        => 500,
            'unit'            => 'g',
            'branch_id'       => $this->branchVictoria->id,
            'expiration_type' => 'use_by',
            'expiration_date' => '', // Missing!
        ]);

        $response->assertSessionHasErrors('expiration_date');
    }

    /**
     * Test 7: Validation rejects zero or negative quantities.
     */
    public function test_07_validation_rejects_negative_or_zero_quantity(): void
    {
        $responseZero = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'      => 'ingredient',
            'id'        => $this->nori->id,
            'quantity'  => 0,
            'unit'      => 'pcs',
            'branch_id' => $this->branchVictoria->id,
        ]);
        $responseZero->assertSessionHasErrors('quantity');

        $responseNegative = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'      => 'ingredient',
            'id'        => $this->nori->id,
            'quantity'  => -5,
            'unit'      => 'pcs',
            'branch_id' => $this->branchVictoria->id,
        ]);
        $responseNegative->assertSessionHasErrors('quantity');
    }

    /**
     * Test 8: Repeated submission prevention with the same idempotency token.
     */
    public function test_08_duplicate_submission_prevention_via_idempotency_token(): void
    {
        $token = 'idemp-' . uniqid();

        $payload = [
            'type'              => 'ingredient',
            'id'                => $this->nori->id,
            'quantity'          => 20,
            'unit'              => 'pcs',
            'branch_id'         => $this->branchVictoria->id,
            'expiration_type'   => 'none',
            'idempotency_token' => $token,
        ];

        // First submission succeeds
        $firstResponse = $this->actingAs($this->admin)->post('/inventory/stock-in', $payload);
        $firstResponse->assertSessionHasNoErrors();

        // Immediate second submission with identical token is rejected
        $secondResponse = $this->actingAs($this->admin)->post('/inventory/stock-in', $payload);
        $secondResponse->assertSessionHasErrors('error');

        // Only one batch must have been created
        $batchesCount = IngredientBatch::where('ingredient_id', $this->nori->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->count();
        $this->assertEquals(1, $batchesCount);
    }

    /**
     * Test 9: Branch isolation — restocking Victoria does not modify Santa Cruz stock.
     */
    public function test_09_branch_isolation_restock_only_affects_targeted_branch(): void
    {
        $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->nori->id,
            'quantity'        => 50,
            'unit'            => 'pcs',
            'branch_id'       => $this->branchVictoria->id,
            'expiration_type' => 'none',
        ]);

        $vicStock = IngredientStock::where('ingredient_id', $this->nori->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->value('stock');
        $this->assertEquals(50.0, (float) $vicStock);

        $scStock = IngredientStock::where('ingredient_id', $this->nori->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->value('stock');
        $this->assertEquals(0.0, (float) $scStock);
    }

    /**
     * Test 10: Cashier can only restock for their assigned branch, not other branches.
     */
    public function test_10_cashier_cannot_restock_for_other_branches(): void
    {
        $response = $this->actingAs($this->cashierVictoria)->post('/inventory/stock-in', [
            'type'            => 'ingredient',
            'id'              => $this->nori->id,
            'quantity'        => 10,
            'unit'            => 'pcs',
            'branch_id'       => $this->branchSantaCruz->id, // Unauthorized branch
            'expiration_type' => 'none',
        ]);

        $response->assertSessionHasErrors('branch_id');
    }
}
