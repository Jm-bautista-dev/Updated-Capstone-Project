<?php

namespace Tests\Feature;

use App\Events\ExpiredIngredientDisposed;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientBatchMovement;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\User;
use App\Services\InventoryExpirationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ExpiredIngredientNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branchVictoria;
    protected Branch $branchStaCruz;
    protected User $adminUser;
    protected User $victoriaCashier;
    protected User $staCruzCashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVictoria = Branch::create([
            'name'       => 'Victoria Branch',
            'code'       => 'VIC',
            'address'    => 'Victoria Laguna',
            'is_active'  => true,
        ]);

        $this->branchStaCruz = Branch::create([
            'name'       => 'Sta. Cruz Branch',
            'code'       => 'STC',
            'address'    => 'Sta. Cruz Laguna',
            'is_active'  => true,
        ]);

        $this->adminUser = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => null,
        ]);

        $this->victoriaCashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->staCruzCashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchStaCruz->id,
        ]);
    }

    public function test_expired_batch_disposal_broadcasts_event_and_records_movement(): void
    {
        Event::fake([ExpiredIngredientDisposed::class]);

        $ingredient = Ingredient::create([
            'name' => 'Breaded Chicken',
            'unit' => 'kg',
        ]);

        IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->update([
                'stock'                 => 5000.0,
                'low_stock_level'       => 1000.0,
                'is_low_stock_notified' => false,
                'is_out_of_stock_notified' => false,
            ]);

        $batch = IngredientBatch::create([
            'ingredient_id'        => $ingredient->id,
            'branch_id'            => $this->branchVictoria->id,
            'batch_code'           => 'BATCH-VIC-001',
            'current_quantity'     => 2500.0,
            'initial_quantity'     => 2500.0,
            'unit'                 => 'kg',
            'cost_per_base_unit'   => 0.15,
            'expiration_date'      => Carbon::now('Asia/Manila')->subDays(3),
            'received_at'          => Carbon::now('Asia/Manila')->subDays(5),
            'status'               => 'available',
        ]);

        $service = app(InventoryExpirationService::class);
        $result = $service->processExpiredBatches($this->branchVictoria->id, $this->victoriaCashier->id);

        $this->assertTrue($result['success']);
        $this->assertEquals(1, $result['disposed_count']);

        // Assert movement record exists
        $movement = IngredientBatchMovement::where('batch_id', $batch->id)
            ->where('movement_type', 'expired_removal')
            ->first();

        $this->assertNotNull($movement);
        $this->assertEquals(2.5, (float) $movement->quantity);
        $this->assertEquals('kg', $movement->unit);

        // Assert event broadcast
        Event::assertDispatched(ExpiredIngredientDisposed::class, function ($event) use ($batch, $ingredient) {
            $channels = array_map(fn($c) => $c->name, $event->broadcastOn());
            $this->assertContains("private-branch.{$this->branchVictoria->id}", $channels);
            $this->assertContains("private-branch.{$this->branchVictoria->id}.orders", $channels);
            $this->assertContains("private-admin.orders", $channels);

            $data = $event->broadcastWith();
            $this->assertEquals($batch->id, $data['batch_id']);
            $this->assertEquals($ingredient->name, $data['ingredient_name']);
            $this->assertEquals('Removed from usable inventory.', $data['status']);
            $this->assertEquals('expired_ingredient', $data['type']);
            return true;
        });
    }

    public function test_notification_bell_delivers_expired_notifications_with_strict_branch_isolation(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Salmon Slice',
            'unit' => 'pcs',
        ]);

        IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->update([
                'stock'                 => 20.0,
                'low_stock_level'       => 5.0,
                'is_low_stock_notified' => false,
                'is_out_of_stock_notified' => false,
            ]);

        $batch = IngredientBatch::create([
            'ingredient_id'        => $ingredient->id,
            'branch_id'            => $this->branchVictoria->id,
            'batch_code'           => 'BATCH-VIC-SALMON',
            'current_quantity'     => 10.0,
            'initial_quantity'     => 10.0,
            'unit'                 => 'pcs',
            'cost_per_base_unit'   => 25.0,
            'expiration_date'      => Carbon::now('Asia/Manila')->subDays(3),
            'received_at'          => Carbon::now('Asia/Manila')->subDays(5),
            'status'               => 'available',
        ]);

        $service = app(InventoryExpirationService::class);
        $service->processExpiredBatches($this->branchVictoria->id, $this->victoriaCashier->id);

        // 1. Victoria Cashier accesses notifications -> should see the expired notification
        $responseVictoria = $this->actingAs($this->victoriaCashier)->getJson('/api/v1/notifications');
        $responseVictoria->assertOk();
        $dataVic = $responseVictoria->json();

        $this->assertGreaterThan(0, $dataVic['unread_count']);
        $expiredNotifs = collect($dataVic['notifications'])->where('type', 'expired_ingredient');
        $this->assertCount(1, $expiredNotifs);

        $notif = $expiredNotifs->first();
        $this->assertEquals('Salmon Slice', $notif['ingredient_name']);
        $this->assertEquals($this->branchVictoria->id, $notif['branch_id']);
        $this->assertTrue($notif['is_unread']);
        $this->assertEquals('Removed from inventory', $notif['remaining']);

        // 2. Sta. Cruz Cashier accesses notifications -> should NOT see Victoria's expired notification
        $responseStaCruz = $this->actingAs($this->staCruzCashier)->getJson('/api/v1/notifications');
        $responseStaCruz->assertOk();
        $dataStaCruz = $responseStaCruz->json();

        $staCruzExpired = collect($dataStaCruz['notifications'])->where('type', 'expired_ingredient');
        $this->assertCount(0, $staCruzExpired);

        // 3. Admin accesses notifications -> should see all branches
        $responseAdmin = $this->actingAs($this->adminUser)->getJson('/api/v1/notifications');
        $responseAdmin->assertOk();
        $dataAdmin = $responseAdmin->json();

        $adminExpired = collect($dataAdmin['notifications'])->where('type', 'expired_ingredient');
        $this->assertCount(1, $adminExpired);
    }

    public function test_marking_notifications_as_read_clears_unread_status(): void
    {
        $ingredient = Ingredient::create([
            'name' => 'Tuna Sashimi',
            'unit' => 'pcs',
        ]);

        IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->update([
                'stock'                 => 15.0,
                'low_stock_level'       => 2.0,
                'is_low_stock_notified' => false,
                'is_out_of_stock_notified' => false,
            ]);

        IngredientBatch::create([
            'ingredient_id'        => $ingredient->id,
            'branch_id'            => $this->branchVictoria->id,
            'batch_code'           => 'BATCH-VIC-TUNA',
            'current_quantity'     => 5.0,
            'initial_quantity'     => 5.0,
            'unit'                 => 'pcs',
            'cost_per_base_unit'   => 30.0,
            'expiration_date'      => Carbon::now('Asia/Manila')->subDays(3),
            'received_at'          => Carbon::now('Asia/Manila')->subDays(5),
            'status'               => 'available',
        ]);

        app(InventoryExpirationService::class)->processExpiredBatches($this->branchVictoria->id, $this->victoriaCashier->id);

        // Verify unread before
        $resBefore = $this->actingAs($this->victoriaCashier)->getJson('/api/v1/notifications');
        $this->assertGreaterThan(0, $resBefore->json('unread_count'));

        // Mark as read
        $markRes = $this->actingAs($this->victoriaCashier)->postJson('/api/v1/notifications/mark-as-read');
        $markRes->assertOk();

        // Verify read after
        $resAfter = $this->actingAs($this->victoriaCashier)->getJson('/api/v1/notifications');
        $this->assertEquals(0, $resAfter->json('unread_count'));
        $expiredNotif = collect($resAfter->json('notifications'))->where('type', 'expired_ingredient')->first();
        $this->assertFalse($expiredNotif['is_unread']);
    }

    public function test_zero_stock_expired_batch_does_not_generate_disposal_notification(): void
    {
        Event::fake([ExpiredIngredientDisposed::class]);

        $ingredient = Ingredient::create([
            'name' => 'Nori Sheets',
            'unit' => 'packs',
        ]);

        IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branchVictoria->id)
            ->update([
                'stock'                 => 0.0,
                'low_stock_level'       => 1.0,
                'is_low_stock_notified' => true,
                'is_out_of_stock_notified' => true,
            ]);

        $batch = IngredientBatch::create([
            'ingredient_id'        => $ingredient->id,
            'branch_id'            => $this->branchVictoria->id,
            'batch_code'           => 'BATCH-VIC-NORI-ZERO',
            'current_quantity'     => 0.0,
            'initial_quantity'     => 10.0,
            'unit'                 => 'packs',
            'cost_per_base_unit'   => 80.0,
            'expiration_date'      => Carbon::now('Asia/Manila')->subDays(3),
            'received_at'          => Carbon::now('Asia/Manila')->subDays(5),
            'status'               => 'available',
        ]);

        $service = app(InventoryExpirationService::class);
        $result = $service->processExpiredBatches($this->branchVictoria->id, $this->victoriaCashier->id);

        $this->assertEquals(0, $result['disposed_count']);

        // Batch status updated to expired
        $batch->refresh();
        $this->assertEquals('expired', $batch->status);

        // No movement record created
        $movements = IngredientBatchMovement::where('batch_id', $batch->id)->count();
        $this->assertEquals(0, $movements);

        // No disposal event dispatched
        Event::assertNotDispatched(ExpiredIngredientDisposed::class);
    }
}
