<?php

namespace Tests\Feature;

use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RealTimeDeliveryStatusSyncTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public User $admin;
    public User $riderUser;
    public Rider $rider;
    public Order $order;
    public Delivery $delivery;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'      => 'Victoria HQ',
            'code'      => 'VIC',
            'address'   => 'Victoria St, Laguna',
            'latitude'  => 14.229371,
            'longitude' => 121.328383,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'           => 'admin',
            'account_status' => 'active',
            'branch_id'      => $this->branch->id,
        ]);

        $this->riderUser = User::factory()->create([
            'role'           => 'rider',
            'account_status' => 'active',
            'email'          => 'juan.rider@makidesu.ph',
            'branch_id'      => $this->branch->id,
        ]);

        $this->rider = Rider::create([
            'user_id'        => $this->riderUser->id,
            'name'           => 'Juan Rider',
            'email'          => 'juan.rider@makidesu.ph',
            'password'       => bcrypt('password'),
            'phone'          => '09171234567',
            'branch_id'      => $this->branch->id,
            'is_active'      => true,
            'account_status' => 'active',
            'status'         => 'busy',
        ]);

        $this->order = Order::create([
            'order_number'     => 'ORD-TEST-1001',
            'branch_id'        => $this->branch->id,
            'user_id'          => $this->admin->id,
            'customer_name'    => 'Maria Clara',
            'contact_number'   => '09181112233',
            'address'          => 'Poblacion, Laguna',
            'fulfillment_type' => 'delivery',
            'total_amount'     => 450.00,
            'status'           => 'assigned_to_rider',
            'rider_id'         => $this->rider->id,
        ]);

        $this->delivery = Delivery::create([
            'order_id'         => $this->order->id,
            'rider_id'         => $this->rider->id,
            'delivery_type'    => 'internal',
            'status'           => 'assigned_to_rider',
            'customer_name'    => 'Maria Clara',
            'customer_address' => 'Poblacion, Laguna',
            'customer_phone'   => '09181112233',
            'delivery_fee'     => 50.00,
        ]);
    }

    /**
     * Test 1: Picked Up status transition broadcasts OrderStatusUpdated with picked_up
     */
    public function test_picked_up_status_transition_broadcasts_real_time_event(): void
    {
        Event::fake([OrderStatusUpdated::class]);

        Sanctum::actingAs($this->riderUser);

        $response = $this->postJson("/api/v1/rider/orders/{$this->order->id}/pickup");

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Assert database state is updated
        $this->assertDatabaseHas('deliveries', [
            'id'     => $this->delivery->id,
            'status' => 'picked_up',
        ]);
        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => 'picked_up',
        ]);

        // Assert Event was dispatched
        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $this->delivery->id
                && $payload['status'] === 'picked_up'
                && $payload['status_label'] === 'Picked Up'
                && !empty($payload['status_color'])
                && $payload['rider_id'] === $this->rider->id;
        });
    }

    /**
     * Test 2: In Transit status transition broadcasts OrderStatusUpdated with in_transit
     */
    public function test_in_transit_status_transition_broadcasts_real_time_event(): void
    {
        // First set delivery and order to picked_up
        $this->delivery->update(['status' => 'picked_up', 'picked_up_at' => now()]);
        $this->order->update(['status' => 'picked_up']);

        Event::fake([OrderStatusUpdated::class]);

        Sanctum::actingAs($this->riderUser);

        $response = $this->postJson("/api/v1/rider/orders/{$this->order->id}/transit");

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('deliveries', [
            'id'     => $this->delivery->id,
            'status' => 'in_transit',
        ]);
        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => 'in_transit',
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $this->delivery->id
                && $payload['status'] === 'in_transit'
                && $payload['status_label'] === 'In Transit'
                && !empty($payload['status_color'])
                && $payload['rider_id'] === $this->rider->id;
        });
    }

    /**
     * Test 3: Delivered status transition continues broadcasting OrderStatusUpdated
     */
    public function test_delivered_status_transition_broadcasts_real_time_event(): void
    {
        // Set delivery and order to in_transit
        $this->delivery->update(['status' => 'in_transit', 'transit_at' => now()]);
        $this->order->update(['status' => 'in_transit']);

        Event::fake([OrderStatusUpdated::class]);

        Sanctum::actingAs($this->riderUser);

        $response = $this->postJson("/api/v1/rider/orders/{$this->order->id}/deliver");

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('deliveries', [
            'id'     => $this->delivery->id,
            'status' => 'delivered',
        ]);
        $this->assertDatabaseHas('orders', [
            'id'     => $this->order->id,
            'status' => 'delivered',
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $this->delivery->id
                && $payload['status'] === 'delivered'
                && $payload['status_label'] === 'Delivered';
        });
    }

    /**
     * Test 4: Generic update-status API endpoint handles picked_up and in_transit
     */
    public function test_generic_update_status_endpoint_triggers_broadcast(): void
    {
        Event::fake([OrderStatusUpdated::class]);

        Sanctum::actingAs($this->riderUser);

        // Transition: assigned_to_rider -> picked_up via generic endpoint
        $response = $this->postJson("/api/v1/rider/deliveries/{$this->delivery->id}/status", [
            'status' => 'picked_up',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('deliveries', [
            'id'     => $this->delivery->id,
            'status' => 'picked_up',
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) {
            return $event->broadcastWith()['status'] === 'picked_up';
        });
    }

    /**
     * Test 5: Unauthorized rider cannot update delivery and no event is broadcast
     */
    public function test_unauthorized_rider_cannot_update_delivery(): void
    {
        $otherRiderUser = User::factory()->create([
            'role'           => 'rider',
            'account_status' => 'active',
            'email'          => 'other.rider@makidesu.ph',
            'branch_id'      => $this->branch->id,
        ]);
        Rider::create([
            'user_id'        => $otherRiderUser->id,
            'name'           => 'Other Rider',
            'email'          => 'other.rider@makidesu.ph',
            'password'       => bcrypt('password'),
            'phone'          => '09179998877',
            'branch_id'      => $this->branch->id,
            'is_active'      => true,
            'account_status' => 'active',
            'status'         => 'available',
        ]);

        Event::fake([OrderStatusUpdated::class]);

        Sanctum::actingAs($otherRiderUser);

        $response = $this->postJson("/api/v1/rider/orders/{$this->order->id}/pickup");

        $response->assertStatus(403);
        $this->assertDatabaseHas('deliveries', [
            'id'     => $this->delivery->id,
            'status' => 'assigned_to_rider',
        ]);

        Event::assertNotDispatched(OrderStatusUpdated::class);
    }
}
