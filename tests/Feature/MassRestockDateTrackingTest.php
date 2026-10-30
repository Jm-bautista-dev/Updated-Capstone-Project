<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientBatch;
use App\Models\IngredientBatchMovement;
use App\Models\IngredientLog;
use App\Models\StockLog;
use App\Models\User;
use App\Services\InventoryBatchService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MassRestockDateTrackingTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $admin;
    protected User $cashier;
    protected Ingredient $salmon;
    protected Ingredient $rice;
    protected Ingredient $nori;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'               => 'MAKI DESU VICTORIA',
            'address'            => 'Victoria Branch',
            'latitude'           => 14.6000,
            'longitude'          => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->admin = User::factory()->create([
            'name'      => 'Admin User',
            'email'     => 'admin@makidesu.test',
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
            'must_change_password' => false,
        ]);

        $this->cashier = User::factory()->create([
            'name'      => 'Cashier Victoria',
            'email'     => 'cashier@makidesu.test',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
            'must_change_password' => false,
        ]);

        $this->salmon = Ingredient::create([
            'name'                         => 'Fresh Salmon',
            'unit'                         => 'g',
            'cost_per_base_unit'           => 0.75,
            'requires_expiration_tracking' => true,
            'default_expiry_days'          => 7,
        ]);

        $this->rice = Ingredient::create([
            'name'                         => 'Sushi Rice',
            'unit'                         => 'kg',
            'cost_per_base_unit'           => 0.05,
            'requires_expiration_tracking' => false,
        ]);

        $this->nori = Ingredient::create([
            'name'                         => 'Nori Sheets',
            'unit'                         => 'pcs',
            'cost_per_base_unit'           => 2.50,
            'requires_expiration_tracking' => false,
        ]);
    }

    /**
     * Test 1: Mass restock without explicit received_at records authoritative server timestamp in Asia/Manila.
     */
    public function test_mass_restock_records_accurate_server_authoritative_timestamp_in_philippine_time(): void
    {
        $manilaNow = Carbon::now('Asia/Manila');

        $payload = [
            'branch_id' => $this->branch->id,
            'items'     => [
                [
                    'id'             => $this->salmon->id,
                    'type'           => 'ingredient',
                    'quantity'       => 1000,
                    'unit'           => 'g',
                    'purchase_price' => 750.00,
                    'expiration_date' => $manilaNow->copy()->addDays(5)->toDateString(),
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        // Verify batch was created with authoritative received_at
        $batch = IngredientBatch::where('ingredient_id', $this->salmon->id)
            ->where('branch_id', $this->branch->id)
            ->first();

        $this->assertNotNull($batch);
        $this->assertNotNull($batch->received_at);
        $this->assertEquals($manilaNow->toDateString(), $batch->received_at->copy()->setTimezone('Asia/Manila')->toDateString());

        // Verify batch movement ledger entry matches received_at
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals($batch->received_at->toDateTimeString(), $movement->created_at->toDateTimeString());

        // Verify IngredientLog was created for inventory history
        $log = IngredientLog::where('ingredient_id', $this->salmon->id)
            ->where('branch_id', $this->branch->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertEquals(1000, $log->change_qty);
        $this->assertStringContainsString('MASS-RESTOCK', $log->reason);
    }

    /**
     * Test 2: Mass restock with explicit received date persists that date and traces the operation reference.
     */
    public function test_mass_restock_records_explicit_valid_received_date_and_traces_operation(): void
    {
        $pastDate = Carbon::now('Asia/Manila')->subDays(2)->toDateString();
        $customRef = 'DR-MANILA-2026-99';

        $payload = [
            'branch_id'   => $this->branch->id,
            'received_at' => $pastDate,
            'reference'   => $customRef,
            'items'       => [
                [
                    'id'             => $this->rice->id,
                    'type'           => 'ingredient',
                    'quantity'       => 50,
                    'unit'           => 'kg',
                    'purchase_price' => 2500.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);

        $response->assertSessionHasNoErrors();

        $batch = IngredientBatch::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branch->id)
            ->first();

        $this->assertNotNull($batch);
        $this->assertEquals($pastDate, $batch->received_at->copy()->setTimezone('Asia/Manila')->toDateString());
        $this->assertEquals($customRef, $batch->reference);

        // Verify IngredientLog has the custom reference
        $log = IngredientLog::where('ingredient_id', $this->rice->id)
            ->where('branch_id', $this->branch->id)
            ->first();

        $this->assertNotNull($log);
        $this->assertStringContainsString($customRef, $log->reason);
    }

    /**
     * Test 3: Multi-ingredient restock links all created batches to the exact same operation reference & timestamp.
     */
    public function test_multi_ingredient_mass_restock_links_all_batches_with_shared_operation_reference(): void
    {
        $payload = [
            'branch_id' => $this->branch->id,
            'items'     => [
                [
                    'id'             => $this->salmon->id,
                    'type'           => 'ingredient',
                    'quantity'       => 500,
                    'unit'           => 'g',
                    'purchase_price' => 375.00,
                ],
                [
                    'id'             => $this->rice->id,
                    'type'           => 'ingredient',
                    'quantity'       => 20,
                    'unit'           => 'kg',
                    'purchase_price' => 1000.00,
                ],
                [
                    'id'             => $this->nori->id,
                    'type'           => 'ingredient',
                    'quantity'       => 100,
                    'unit'           => 'pcs',
                    'purchase_price' => 250.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->cashier)->post(route('inventory.mass-stock-in'), $payload);

        $response->assertSessionHasNoErrors();

        $batches = IngredientBatch::whereIn('ingredient_id', [$this->salmon->id, $this->rice->id, $this->nori->id])
            ->where('branch_id', $this->branch->id)
            ->get();

        $this->assertCount(3, $batches);

        // Verify all 3 batches have identical reference and identical received_at
        $ref1 = $batches[0]->reference;
        $time1 = $batches[0]->received_at->toDateTimeString();

        $this->assertStringStartsWith('MASS-RESTOCK-', $ref1);
        $this->assertEquals($ref1, $batches[1]->reference);
        $this->assertEquals($ref1, $batches[2]->reference);

        $this->assertEquals($time1, $batches[1]->received_at->toDateTimeString());
        $this->assertEquals($time1, $batches[2]->received_at->toDateTimeString());
    }

    /**
     * Test 4: Restock date cannot be in the future beyond today.
     */
    public function test_mass_restock_future_date_fails_validation(): void
    {
        $futureDate = Carbon::now('Asia/Manila')->addDays(3)->toDateString();

        $payload = [
            'branch_id'   => $this->branch->id,
            'received_at' => $futureDate,
            'items'       => [
                [
                    'id'             => $this->rice->id,
                    'type'           => 'ingredient',
                    'quantity'       => 10,
                    'unit'           => 'kg',
                    'purchase_price' => 500.00,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);

        $response->assertSessionHasErrors('received_at');
        $this->assertEquals(0, IngredientBatch::count());
    }

    /**
     * Test 5: Idempotency token prevents duplicate mass-restock submissions.
     */
    public function test_mass_restock_idempotency_prevents_duplicate_submission(): void
    {
        $token = 'idemp-test-' . uniqid();

        $payload = [
            'branch_id'         => $this->branch->id,
            'idempotency_token' => $token,
            'items'             => [
                [
                    'id'             => $this->nori->id,
                    'type'           => 'ingredient',
                    'quantity'       => 50,
                    'unit'           => 'pcs',
                    'purchase_price' => 125.00,
                ],
            ],
        ];

        // First attempt succeeds
        $res1 = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);
        $res1->assertSessionHasNoErrors();
        $this->assertEquals(1, IngredientBatch::count());

        // Immediate duplicate attempt is blocked by idempotency guard
        $res2 = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);
        $res2->assertSessionHasErrors('error');
        $this->assertEquals(1, IngredientBatch::count());
    }

    /**
     * Test 6: Expiration dates remain completely independent from restock date, preserving FEFO.
     */
    public function test_expiration_date_remains_independent_from_restock_date_and_preserves_fefo(): void
    {
        $manilaNow = Carbon::now('Asia/Manila');
        $restockDate = $manilaNow->copy()->subDays(1)->toDateString();
        $expDate = $manilaNow->copy()->addDays(10)->toDateString();

        $payload = [
            'branch_id'   => $this->branch->id,
            'received_at' => $restockDate,
            'items'       => [
                [
                    'id'              => $this->salmon->id,
                    'type'            => 'ingredient',
                    'quantity'        => 500,
                    'unit'            => 'g',
                    'purchase_price'  => 375.00,
                    'expiration_date' => $expDate,
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);
        $response->assertSessionHasNoErrors();

        $batch = IngredientBatch::where('ingredient_id', $this->salmon->id)->first();
        $this->assertNotNull($batch);

        // Restock date matches past date
        $this->assertEquals($restockDate, $batch->received_at->copy()->setTimezone('Asia/Manila')->toDateString());
        // Expiration date matches future date
        $this->assertEquals($expDate, $batch->expiration_date->copy()->setTimezone('Asia/Manila')->toDateString());
        $this->assertNotEquals($batch->received_at->toDateString(), $batch->expiration_date->toDateString());

        // Verify consumption queue endpoint returns formatted Philippine time
        $batchService = app(InventoryBatchService::class);
        $queue = $batchService->getQueueForIngredient($this->salmon->id, $this->branch->id, true);

        $this->assertNotEmpty($queue['eligible_batches']);
        $queueItem = $queue['eligible_batches'][0];
        $this->assertNotNull($queueItem['received_at_formatted']);
        $this->assertStringContainsString(Carbon::parse($restockDate)->format('M d, Y'), $queueItem['received_at_formatted']);
    }

    /**
     * Test 7: Activity logs endpoint displays mass restock operation in inventory history.
     */
    public function test_activity_logs_endpoint_displays_mass_restock_history(): void
    {
        $payload = [
            'branch_id' => $this->branch->id,
            'reference' => 'INVOICE-888',
            'items'     => [
                [
                    'id'             => $this->rice->id,
                    'type'           => 'ingredient',
                    'quantity'       => 25,
                    'unit'           => 'kg',
                    'purchase_price' => 1250.00,
                ],
            ],
        ];

        $this->actingAs($this->admin)->post(route('inventory.mass-stock-in'), $payload);

        // Fetch activity logs
        $res = $this->actingAs($this->admin)->getJson(route('inventory.activity-logs', [
            'ingredient_id' => $this->rice->id,
            'branch_id'     => $this->branch->id,
        ]));

        $res->assertStatus(200);
        $data = $res->json('logs');
        $this->assertNotEmpty($data);

        $firstLog = $data[0];
        $this->assertEquals('Added', $firstLog['action']);
        $this->assertStringContainsString('INVOICE-888', $firstLog['source']);
        $this->assertNotNull($firstLog['created_at']);
    }
}
