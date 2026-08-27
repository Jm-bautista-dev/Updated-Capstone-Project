<?php

namespace Tests\Feature;

use App\Events\RiderStatusUpdated;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\User;
use App\Services\DeliveryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RealTimeRiderStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branchVictoria;
    protected Branch $branchSantaCruz;
    protected User $adminUser;
    protected User $cashierVictoria;
    protected Rider $riderVictoria;
    protected Product $testProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVictoria = Branch::create([
            'name'        => 'Victoria Branch',
            'code'        => 'VIC',
            'address'     => 'Victoria, Tarlac',
            'is_active'   => true,
        ]);

        $this->branchSantaCruz = Branch::create([
            'name'        => 'Santa Cruz Branch',
            'code'        => 'STC',
            'address'     => 'Santa Cruz, Zambales',
            'is_active'   => true,
        ]);

        $this->adminUser = User::factory()->create([
            'name'      => 'Admin User',
            'email'     => 'admin@milktea.com',
            'role'      => 'admin',
            'branch_id' => null,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'name'      => 'Victoria Cashier',
            'email'     => 'cashier.vic@milktea.com',
            'role'      => 'cashier',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->riderVictoria = Rider::create([
            'name'           => 'Victoria Rider John',
            'email'          => 'john.rider@milktea.com',
            'phone'          => '09171234567',
            'password'       => bcrypt('password'),
            'branch_id'      => $this->branchVictoria->id,
            'status'         => 'available',
            'is_active'      => true,
            'last_active_at' => now(),
        ]);

        $this->testProduct = Product::create([
            'name'          => 'Classic Milk Tea',
            'sku'           => 'CMT-001',
            'selling_price' => 120.00,
            'cost_price'    => 45.00,
            'is_active'     => true,
            'branch_id'     => $this->branchVictoria->id,
        ]);
    }

    private function createReadyDelivery(Branch $branch): Delivery
    {
        $order = Order::create([
            'order_number'    => 'ORD-' . strtoupper(uniqid()),
            'branch_id'       => $branch->id,
            'customer_name'   => 'Juan Dela Cruz',
            'contact_number'  => '09189876543',
            'address'         => '123 Rizal St, Victoria',
            'status'          => 'ready_for_pickup',
            'payment_method'  => 'cod',
            'total_amount'    => 290.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->testProduct->id,
            'quantity'   => 2,
            'price'      => 120.00,
        ]);

        return Delivery::create([
            'order_id'         => $order->id,
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_READY,
            'customer_name'    => $order->customer_name,
            'customer_address' => $order->address,
            'customer_phone'   => $order->contact_number,
            'delivery_fee'     => 50.00,
        ]);
    }

    /**
     * TEST 1: Mobile API ACTIVE -> INACTIVE updates DB and broadcasts RiderStatusUpdated
     */
    public function test_mobile_api_can_switch_rider_from_active_to_inactive_and_broadcasts_event(): void
    {
        Event::fake([RiderStatusUpdated::class]);

        Sanctum::actingAs($this->riderVictoria, ['rider']);

        $response = $this->patchJson('/api/v1/rider/status', [
            'status' => 'inactive',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'        => true,
                'is_active'      => false,
                'account_status' => 'inactive',
                'status'         => 'offline',
            ]);

        $this->riderVictoria->refresh();
        $this->assertFalse((bool) $this->riderVictoria->is_active);
        $this->assertEquals('offline', $this->riderVictoria->status);

        Event::assertDispatched(RiderStatusUpdated::class, function (RiderStatusUpdated $event) {
            $payload = $event->broadcastWith();
            return $event->rider->id === $this->riderVictoria->id &&
                   $payload['is_active'] === false &&
                   $payload['account_status'] === 'inactive' &&
                   $payload['status'] === 'offline' &&
                   $payload['can_be_assigned'] === false;
        });
    }

    /**
     * TEST 2: Mobile API INACTIVE -> ACTIVE updates DB and broadcasts RiderStatusUpdated
     */
    public function test_mobile_api_can_switch_rider_from_inactive_to_active_and_broadcasts_event(): void
    {
        $this->riderVictoria->update(['is_active' => false, 'status' => 'offline']);

        Event::fake([RiderStatusUpdated::class]);

        Sanctum::actingAs($this->riderVictoria, ['rider']);

        $response = $this->patchJson('/api/v1/rider/status', [
            'is_active' => true,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success'        => true,
                'is_active'      => true,
                'account_status' => 'active',
                'status'         => 'available',
            ]);

        $this->riderVictoria->refresh();
        $this->assertTrue((bool) $this->riderVictoria->is_active);
        $this->assertEquals('available', $this->riderVictoria->status);

        Event::assertDispatched(RiderStatusUpdated::class, function (RiderStatusUpdated $event) {
            $payload = $event->broadcastWith();
            return $event->rider->id === $this->riderVictoria->id &&
                   $payload['is_active'] === true &&
                   $payload['account_status'] === 'active' &&
                   $payload['status'] === 'available' &&
                   $payload['can_be_assigned'] === true;
        });
    }

    /**
     * TEST 3: Backend strictly rejects delivery assignment to inactive rider
     */
    public function test_admin_cannot_assign_delivery_to_inactive_rider(): void
    {
        $this->riderVictoria->update(['is_active' => false, 'status' => 'offline']);

        $delivery = $this->createReadyDelivery($this->branchVictoria);

        $this->actingAs($this->adminUser);

        $response = $this->post("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $this->riderVictoria->id,
        ]);

        $response->assertSessionHas('error');
        $this->assertNull($delivery->fresh()->rider_id);
        $this->assertEquals(Delivery::STATUS_READY, $delivery->fresh()->status);
    }

    /**
     * TEST 4: Backend allows assigning active available rider
     */
    public function test_admin_can_assign_delivery_to_active_available_rider(): void
    {
        Event::fake([RiderStatusUpdated::class]);

        $delivery = $this->createReadyDelivery($this->branchVictoria);

        $this->actingAs($this->adminUser);

        $response = $this->post("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $this->riderVictoria->id,
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals($this->riderVictoria->id, $delivery->fresh()->rider_id);
        $this->assertEquals(Delivery::STATUS_ASSIGNED, $delivery->fresh()->status);
        $this->assertEquals('busy', $this->riderVictoria->fresh()->status);

        Event::assertDispatched(RiderStatusUpdated::class);
    }

    /**
     * TEST 5: Active rider who is OUT FOR DELIVERY (in_transit) cannot receive another delivery
     */
    public function test_admin_cannot_assign_delivery_to_rider_who_is_out_for_delivery(): void
    {
        // Give rider an in_transit delivery
        $activeDelivery = $this->createReadyDelivery($this->branchVictoria);
        $activeDelivery->update([
            'rider_id' => $this->riderVictoria->id,
            'status'   => 'in_transit',
        ]);
        $activeDelivery->order->update([
            'rider_id' => $this->riderVictoria->id,
            'status'   => 'in_transit',
        ]);

        $this->assertTrue($this->riderVictoria->hasInTransitDelivery());

        // Attempt to assign a second delivery
        $secondDelivery = $this->createReadyDelivery($this->branchVictoria);

        $this->actingAs($this->adminUser);

        $response = $this->post("/deliveries/{$secondDelivery->id}/assign-rider", [
            'rider_id' => $this->riderVictoria->id,
        ]);

        $response->assertSessionHas('error');
        $this->assertNull($secondDelivery->fresh()->rider_id);
    }

    /**
     * TEST 6: Rider cannot be assigned to delivery of a different branch
     */
    public function test_admin_cannot_assign_delivery_to_rider_from_another_branch(): void
    {
        $deliverySantaCruz = $this->createReadyDelivery($this->branchSantaCruz);

        $this->actingAs($this->adminUser);

        $response = $this->post("/deliveries/{$deliverySantaCruz->id}/assign-rider", [
            'rider_id' => $this->riderVictoria->id, // Rider belongs to Victoria!
        ]);

        $response->assertSessionHas('error');
        $this->assertNull($deliverySantaCruz->fresh()->rider_id);
    }

    /**
     * TEST 7: Branch isolation - RiderStatusUpdated broadcasts to correct channels
     */
    public function test_realtime_broadcast_channels_are_branch_isolated(): void
    {
        $event = new RiderStatusUpdated($this->riderVictoria);
        $channels = $event->broadcastOn();

        $channelNames = array_map(fn($c) => $c->name, $channels);

        $this->assertContains('private-admin.orders', $channelNames);
        $this->assertContains('private-branch.' . $this->branchVictoria->id . '.orders', $channelNames);
        $this->assertContains('private-branch.' . $this->branchVictoria->id, $channelNames);

        // Crucial: Must NOT contain Santa Cruz channel
        $this->assertNotContains('private-branch.' . $this->branchSantaCruz->id . '.orders', $channelNames);
        $this->assertNotContains('private-branch.' . $this->branchSantaCruz->id, $channelNames);
    }

    /**
     * TEST 8: Admin website rider update also broadcasts RiderStatusUpdated
     */
    public function test_admin_rider_update_broadcasts_realtime_status_event(): void
    {
        Event::fake([RiderStatusUpdated::class]);

        $this->actingAs($this->adminUser);

        $response = $this->put("/riders/{$this->riderVictoria->id}", [
            'name'      => 'Victoria Rider John Updated',
            'email'     => $this->riderVictoria->email,
            'branch_id' => $this->branchVictoria->id,
            'is_active' => false,
        ]);

        $response->assertRedirect();
        $this->riderVictoria->refresh();
        $this->assertFalse((bool) $this->riderVictoria->is_active);
        $this->assertEquals('offline', $this->riderVictoria->status);

        Event::assertDispatched(RiderStatusUpdated::class);
    }

    /**
     * TEST 9: Inactive status transition does NOT corrupt or cancel existing active deliveries
     */
    public function test_rider_inactivity_does_not_corrupt_or_cancel_existing_deliveries(): void
    {
        // 1. Assign delivery to rider
        $delivery = $this->createReadyDelivery($this->branchVictoria);
        $delivery->update([
            'rider_id' => $this->riderVictoria->id,
            'status'   => 'in_transit',
        ]);

        // 2. Rider goes inactive from mobile app
        Sanctum::actingAs($this->riderVictoria, ['rider']);
        $response = $this->patchJson('/api/v1/rider/status', [
            'status' => 'inactive',
        ]);
        $response->assertStatus(200);

        // 3. Existing delivery remains intact in transit
        $delivery->refresh();
        $this->assertEquals('in_transit', $delivery->status);
        $this->assertEquals($this->riderVictoria->id, $delivery->rider_id);
    }

    /**
     * TEST 10: POS available riders excludes inactive riders
     */
    public function test_pos_available_riders_excludes_inactive_and_busy_riders(): void
    {
        $this->actingAs($this->cashierVictoria);

        // 1. Currently active & available -> Should appear
        $response = $this->getJson("/riders-available?branch_id={$this->branchVictoria->id}");
        $response->assertStatus(200);
        $this->assertCount(1, $response->json());

        // 2. Set rider to inactive -> Should NOT appear
        $this->riderVictoria->update(['is_active' => false, 'status' => 'offline']);
        $response2 = $this->getJson("/riders-available?branch_id={$this->branchVictoria->id}");
        $response2->assertStatus(200);
        $this->assertCount(0, $response2->json());
    }
}
