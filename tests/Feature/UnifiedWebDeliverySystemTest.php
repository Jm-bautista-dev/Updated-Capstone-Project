<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use App\Services\DeliveryService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnifiedWebDeliverySystemTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchVic;
    public User $admin;
    public User $cashier;
    public User $customer;
    public Rider $riderAvailable;
    public Rider $riderDelivering;
    public Rider $riderInactive;
    public Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchVic = Branch::create([
            'name'                => 'Victoria Branch',
            'code'                => 'VIC',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.229371,
            'longitude'           => 121.328383,
            'delivery_radius_km'  => 25,
            'base_delivery_fee'   => 50.00,
            'has_internal_riders' => true,
            'is_active'           => true,
        ]);

        $this->admin = User::factory()->create([
            'name'      => 'Super Admin',
            'email'     => 'admin@milktea.test',
            'role'      => 'admin',
            'branch_id' => null,
        ]);

        $this->cashier = User::factory()->create([
            'name'      => 'Cashier Victoria',
            'email'     => 'cashier@milktea.test',
            'role'      => 'cashier',
            'branch_id' => $this->branchVic->id,
        ]);

        $this->customer = User::factory()->create([
            'name'          => 'Customer Jane',
            'email'         => 'jane@customer.test',
            'mobile_number' => '09123456789',
            'role'          => 'customer',
            'branch_id'     => $this->branchVic->id,
        ]);

        $this->riderAvailable = Rider::create([
            'name'           => 'Rider Available Bob',
            'email'          => 'bob.rider@milktea.test',
            'phone'          => '09171112233',
            'password'       => Hash::make('password'),
            'branch_id'      => $this->branchVic->id,
            'status'         => 'available',
            'is_active'      => true,
            'last_active_at' => now(),
        ]);

        $this->riderDelivering = Rider::create([
            'name'           => 'Rider Delivering Dave',
            'email'          => 'dave.rider@milktea.test',
            'phone'          => '09174445566',
            'password'       => Hash::make('password'),
            'branch_id'      => $this->branchVic->id,
            'status'         => 'busy',
            'is_active'      => true,
            'last_active_at' => now(),
        ]);

        // Create an active in-transit delivery for Dave
        Delivery::create([
            'delivery_type'    => 'internal',
            'rider_id'         => $this->riderDelivering->id,
            'customer_name'    => 'Active Client',
            'customer_address' => 'Victoria Road',
            'status'           => Delivery::STATUS_OUT_FOR_DELIVERY,
        ]);

        $this->riderInactive = Rider::create([
            'name'           => 'Rider Inactive Ian',
            'email'          => 'ian.rider@milktea.test',
            'phone'          => '09177778899',
            'password'       => Hash::make('password'),
            'branch_id'      => $this->branchVic->id,
            'status'         => 'offline',
            'is_active'      => false,
            'last_active_at' => now()->subDay(),
        ]);

        $this->product = Product::create([
            'name'          => 'Okinawa Milk Tea',
            'sku'           => 'OKI-001',
            'selling_price' => 100.00,
            'cost_price'    => 35.00,
            'is_active'     => true,
            'branch_id'     => $this->branchVic->id,
        ]);

        \Illuminate\Support\Facades\DB::table('branch_product')->insert([
            'branch_id'  => $this->branchVic->id,
            'product_id' => $this->product->id,
            'stock'      => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_pos_delivery_order_creates_delivery_and_broadcasts(): void
    {
        Event::fake([OrderStatusUpdated::class, OrderCreated::class]);

        $this->actingAs($this->cashier);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branchVic->id,
            'opening_balance' => 1000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $payload = [
            'type'           => 'delivery',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 2]
            ],
            'total'          => 250.00,
            'payment_method' => 'cash',
            'paid_amount'    => 300.00,
            'change_amount'  => 50.00,
            'delivery_info'  => [
                'customer_name'    => 'Mark Cruz',
                'customer_phone'   => '09199998888',
                'customer_address' => 'Barangay San Roque, Victoria',
                'delivery_type'    => 'internal',
                'distance_km'      => 3.5,
                'delivery_fee'     => 50.00,
            ]
        ];

        $response = $this->post('/pos', $payload);

        if ($response->status() !== 302 || session('errors')) {
            dump(session('errors')?->all());
        }

        $this->assertDatabaseHas('sales', [
            'type'      => 'delivery',
            'branch_id' => $this->branchVic->id,
        ]);

        $this->assertDatabaseHas('deliveries', [
            'customer_name'    => 'Mark Cruz',
            'customer_phone'   => '09199998888',
            'customer_address' => 'Barangay San Roque, Victoria',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) {
            $data = $event->broadcastWith();
            return $data['order_source'] === 'pos' &&
                   $data['customer_name'] === 'Mark Cruz' &&
                   $data['total_amount'] > 0;
        });
    }

    public function test_cashier_can_assign_available_rider(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        $order = Order::create([
            'order_number'    => 'ORD-1001',
            'branch_id'       => $this->branchVic->id,
            'customer_name'   => 'Juan Dela Cruz',
            'contact_number'  => '09189876543',
            'address'         => 'Victoria Center',
            'status'          => 'ready_for_pickup',
            'total_amount'    => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'customer_name'    => 'Juan Dela Cruz',
            'customer_address' => 'Victoria Center',
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        $this->actingAs($this->cashier);

        $response = $this->postJson("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $this->riderAvailable->id,
        ]);

        if ($response->status() !== 200) {
            dump($response->json());
        }

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals($this->riderAvailable->id, $delivery->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals('busy', $this->riderAvailable->fresh()->status);

        Event::assertDispatched(OrderStatusUpdated::class);
        Event::assertDispatched(RiderStatusUpdated::class);
    }

    public function test_cashier_cannot_assign_inactive_rider(): void
    {
        $order = Order::create([
            'order_number'    => 'ORD-1002',
            'branch_id'       => $this->branchVic->id,
            'customer_name'   => 'Pedro Santos',
            'contact_number'  => '09189876543',
            'address'         => 'Victoria Plaza',
            'status'          => 'ready_for_pickup',
            'total_amount'    => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'customer_name'    => 'Pedro Santos',
            'customer_address' => 'Victoria Plaza',
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        $this->actingAs($this->cashier);

        $response = $this->postJson("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $this->riderInactive->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertNull($delivery->fresh()->rider_id);
    }

    public function test_cashier_cannot_assign_rider_currently_out_for_delivery(): void
    {
        $order = Order::create([
            'order_number'    => 'ORD-1003',
            'branch_id'       => $this->branchVic->id,
            'customer_name'   => 'Ana Gomez',
            'contact_number'  => '09189876543',
            'address'         => 'Victoria East',
            'status'          => 'ready_for_pickup',
            'total_amount'    => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'customer_name'    => 'Ana Gomez',
            'customer_address' => 'Victoria East',
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        $this->actingAs($this->cashier);

        $response = $this->postJson("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $this->riderDelivering->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertNull($delivery->fresh()->rider_id);
    }

    public function test_rider_toggle_active_status_broadcasts_realtime(): void
    {
        Event::fake([RiderStatusUpdated::class]);

        Sanctum::actingAs($this->riderAvailable);

        // Rider sets account to inactive
        $response = $this->postJson('/api/v1/rider/status', [
            'is_active' => false,
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_active', false)
            ->assertJsonPath('status', 'offline');

        $this->assertFalse($this->riderAvailable->fresh()->is_active);
        $this->assertEquals('offline', $this->riderAvailable->fresh()->status);

        Event::assertDispatched(RiderStatusUpdated::class, function (RiderStatusUpdated $event) {
            $data = $event->broadcastWith();
            return $data['rider_id'] === $this->riderAvailable->id &&
                   $data['is_active'] === false &&
                   $data['can_be_assigned'] === false;
        });

        // Rider sets account back to active
        $response2 = $this->postJson('/api/v1/rider/status', [
            'is_active' => true,
        ]);

        $response2->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('is_active', true)
            ->assertJsonPath('status', 'available');

        $this->assertTrue($this->riderAvailable->fresh()->is_active);
        $this->assertEquals('available', $this->riderAvailable->fresh()->status);
    }

    public function test_rider_completing_delivery_returns_to_available(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        $delivery = Delivery::create([
            'customer_name'    => 'Grace Lee',
            'customer_address' => 'Victoria Subd',
            'delivery_type'    => 'internal',
            'rider_id'         => $this->riderAvailable->id,
            'status'           => Delivery::STATUS_OUT_FOR_DELIVERY,
        ]);

        $this->riderAvailable->update(['status' => 'busy']);

        Sanctum::actingAs($this->riderAvailable);

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver", [
            'notes' => 'Handed to customer safely',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals(Delivery::STATUS_DELIVERED, $delivery->fresh()->status);
        $this->assertEquals('available', $this->riderAvailable->fresh()->status);

        Event::assertDispatched(RiderStatusUpdated::class);
        Event::assertDispatched(OrderStatusUpdated::class);
    }

    public function test_pos_delivery_with_preassigned_rider_locks_and_broadcasts(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        $this->actingAs($this->cashier);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branchVic->id,
            'opening_balance' => 1000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $payload = [
            'type'           => 'delivery',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 1]
            ],
            'total'          => 150.00,
            'payment_method' => 'cash',
            'paid_amount'    => 200.00,
            'change_amount'  => 50.00,
            'delivery_info'  => [
                'customer_name'    => 'Sarah Connor',
                'customer_phone'   => '09191112222',
                'customer_address' => 'Victoria Block 5',
                'delivery_type'    => 'internal',
                'rider_id'         => $this->riderAvailable->id,
                'distance_km'      => 2.0,
                'delivery_fee'     => 50.00,
            ]
        ];

        $response = $this->post('/pos', $payload);

        $this->assertDatabaseHas('deliveries', [
            'customer_name' => 'Sarah Connor',
            'rider_id'      => $this->riderAvailable->id,
            'status'        => 'assigned_to_rider',
        ]);

        $this->assertEquals('busy', $this->riderAvailable->fresh()->status);

        Event::assertDispatched(RiderStatusUpdated::class);
        Event::assertDispatched(OrderStatusUpdated::class);
    }

    public function test_concurrent_rider_assignment_race_condition_protection(): void
    {
        $order1 = Order::create([
            'order_number'    => 'ORD-RACE-1',
            'branch_id'       => $this->branchVic->id,
            'customer_name'   => 'Customer One',
            'contact_number'  => '09111111111',
            'address'         => 'Location A',
            'status'          => 'ready_for_pickup',
            'total_amount'    => 100.00,
        ]);

        $delivery1 = Delivery::create([
            'order_id'         => $order1->id,
            'customer_name'    => 'Customer One',
            'customer_address' => 'Location A',
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        $order2 = Order::create([
            'order_number'    => 'ORD-RACE-2',
            'branch_id'       => $this->branchVic->id,
            'customer_name'   => 'Customer Two',
            'contact_number'  => '09222222222',
            'address'         => 'Location B',
            'status'          => 'ready_for_pickup',
            'total_amount'    => 100.00,
        ]);

        $delivery2 = Delivery::create([
            'order_id'         => $order2->id,
            'customer_name'    => 'Customer Two',
            'customer_address' => 'Location B',
            'delivery_type'    => 'internal',
            'status'           => Delivery::STATUS_PENDING,
        ]);

        $this->actingAs($this->cashier);

        // First assignment succeeds
        $res1 = $this->postJson("/deliveries/{$delivery1->id}/assign-rider", [
            'rider_id' => $this->riderAvailable->id,
        ]);
        $res1->assertOk()->assertJsonPath('success', true);

        // Rider goes into transit
        $delivery1->update(['status' => Delivery::STATUS_OUT_FOR_DELIVERY]);

        // Second assignment must fail gracefully
        $res2 = $this->postJson("/deliveries/{$delivery2->id}/assign-rider", [
            'rider_id' => $this->riderAvailable->id,
        ]);
        $res2->assertStatus(422)->assertJsonPath('success', false);

        $this->assertNull($delivery2->fresh()->rider_id);
    }

    public function test_pos_walk_in_delivery_rider_full_lifecycle_pickup_transit_deliver(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        $this->actingAs($this->cashier);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branchVic->id,
            'opening_balance' => 1000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        // 1. Cashier creates POS walk-in delivery
        $payload = [
            'type'           => 'delivery',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 2]
            ],
            'total'          => 300.00,
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'change_amount'  => 200.00,
            'delivery_info'  => [
                'customer_name'    => 'Walk-in Customer John',
                'customer_phone'   => '09187654321',
                'customer_address' => 'Victoria Residenza Blk 4',
                'delivery_type'    => 'internal',
                'rider_id'         => $this->riderAvailable->id,
                'distance_km'      => 3.5,
                'delivery_fee'     => 50.00,
            ]
        ];

        $response = $this->post('/pos', $payload);
        $response->assertSessionHas('success');

        /** @var Delivery $delivery */
        $delivery = Delivery::where('customer_name', 'Walk-in Customer John')->first();
        $this->assertNotNull($delivery);
        $this->assertNotNull($delivery->sale_id);
        $this->assertNull($delivery->order_id);
        $this->assertEquals('assigned_to_rider', $delivery->status);
        $this->assertEquals($this->riderAvailable->id, $delivery->rider_id);

        // 2. Rider queries active orders
        Sanctum::actingAs($this->riderAvailable);
        $myOrdersRes = $this->getJson('/api/v1/rider/my-orders');
        $myOrdersRes->assertOk()->assertJsonPath('success', true);
        $this->assertTrue(
            collect($myOrdersRes->json('data'))->contains('delivery_id', $delivery->id)
        );

        // 3. Rider executes PICK UP
        $pickupRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $pickupRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'picked_up');

        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertEquals('completed', $delivery->fresh()->sale->status);

        // 4. Rider executes START TRANSIT
        $transitRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $transitRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'in_transit');

        $this->assertEquals('in_transit', $delivery->fresh()->status);
        $this->assertEquals('completed', $delivery->fresh()->sale->status);

        // 5. Rider executes DELIVER (complete)
        $deliverRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver", [
            'notes' => 'Handed directly to John at gate',
        ]);
        $deliverRes->assertOk()
            ->assertJsonPath('success', true);

        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('completed', $delivery->fresh()->sale->status);
        $this->assertNotNull($delivery->fresh()->delivered_at);
        $this->assertEquals('available', $this->riderAvailable->fresh()->status);
    }

    public function test_pos_walk_in_delivery_wrong_rider_cannot_pickup(): void
    {
        $this->actingAs($this->cashier);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branchVic->id,
            'opening_balance' => 1000,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $payload = [
            'type'           => 'delivery',
            'items'          => [['id' => $this->product->id, 'quantity' => 1]],
            'total'          => 150.00,
            'payment_method' => 'cash',
            'paid_amount'    => 200.00,
            'change_amount'  => 50.00,
            'delivery_info'  => [
                'customer_name'    => 'Walk-in Client',
                'customer_phone'   => '09123456780',
                'customer_address' => 'Victoria Road',
                'delivery_type'    => 'internal',
                'rider_id'         => $this->riderAvailable->id,
            ]
        ];

        $this->post('/pos', $payload);
        $delivery = Delivery::where('customer_name', 'Walk-in Client')->first();

        $riderOther = Rider::create([
            'name'           => 'Rider Other Tom',
            'email'          => 'tom.rider@milktea.test',
            'phone'          => '09179998877',
            'password'       => Hash::make('password'),
            'branch_id'      => $this->branchVic->id,
            'status'         => 'available',
            'is_active'      => true,
            'last_active_at' => now(),
        ]);

        // Rider Tom attempts to pickup Bob's assigned delivery
        Sanctum::actingAs($riderOther);
        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $res->assertStatus(404); // Not assigned to Tom
    }

    public function test_pos_walk_in_delivery_rider_with_in_transit_route_cannot_pickup_another(): void
    {
        // Give Bob an active in-transit delivery
        Delivery::create([
            'delivery_type'    => 'internal',
            'rider_id'         => $this->riderAvailable->id,
            'customer_name'    => 'Existing In Transit',
            'customer_address' => 'Victoria Road',
            'status'           => Delivery::STATUS_OUT_FOR_DELIVERY,
        ]);

        // Create new POS delivery assigned to Bob
        $sale = Sale::create([
            'branch_id'      => $this->branchVic->id,
            'user_id'        => $this->cashier->id,
            'order_number'   => 'POS-WALKIN-2',
            'type'           => 'delivery',
            'total'          => 150.00,
            'paid_amount'    => 150.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $newDelivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => $this->riderAvailable->id,
            'customer_name'    => 'Second Customer',
            'customer_address' => 'Victoria Road 2',
            'status'           => 'assigned_to_rider',
        ]);

        Sanctum::actingAs($this->riderAvailable);
        $res = $this->postJson("/api/v1/rider/deliveries/{$newDelivery->id}/pickup");
        $res->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
