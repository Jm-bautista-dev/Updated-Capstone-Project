<?php

namespace Tests\Feature;

use App\Events\OrderAssigned;
use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DeliveryRoutePhaseWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $cashier;
    protected User $customer;
    protected Product $ramen;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create([
            'name'                => 'MAKI DESU VICTORIA',
            'address'             => 'Poblacion, Victoria, Laguna',
            'latitude'            => 14.225000,
            'longitude'           => 121.328000,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->santaCruz = Branch::create([
            'name'                => 'MAKI DESU STA CRUZ',
            'address'             => 'Pagsawitan, Santa Cruz, Laguna',
            'latitude'            => 14.278000,
            'longitude'           => 121.415000,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $category = Category::create(['name' => 'Ramen']);

        $this->ramen = Product::create([
            'name'          => 'Tonkotsu Ramen',
            'sku'           => 'RAM-200',
            'category_id'   => $category->id,
            'selling_price' => 200.00,
            'cost_price'    => 0,
            'branch_id'     => $this->victoria->id,
            'unit'          => 'bowl',
            'stock'         => 100,
            'status'        => 'available',
        ]);
    }

    /**
     * TEST 1: MOBILE DELIVERY (ORD-19)
     * When rider accepts, route destination must be MAKI DESU STORE (Victoria), NOT customer.
     */
    public function test_mobile_delivery_accepted_routes_to_store_not_customer(): void
    {
        Event::fake([OrderStatusUpdated::class, OrderAssigned::class]);

        $rider = Rider::create([
            'name'      => 'Rider Marco',
            'email'     => 'marco@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
            'latitude'  => 14.210000,
            'longitude' => 121.310000,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-19',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Alice Customer',
            'contact_number' => '09170001919',
            'address'        => 'Barangay San Benito, Victoria, Laguna',
            'latitude'       => 14.240000,
            'longitude'      => 121.350000,
            'status'         => 'ready_for_pickup',
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001919',
            'customer_address' => 'Barangay San Benito, Victoria, Laguna',
            'latitude'         => 14.240000,
            'longitude'        => 121.350000,
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response->assertStatus(200);

        $data = $response->json('data');

        // Status is ASSIGNED
        $this->assertEquals('assigned_to_rider', $data['status']);

        // Route Phase is strictly rider_to_store
        $this->assertEquals('rider_to_store', $data['route_phase']);

        // Active Destination MUST be the Victoria Branch
        $this->assertEquals('store', $data['route_destination']['type'] ?? ($data['active_destination']['name'] ? 'store' : ''));
        $this->assertEquals('MAKI DESU VICTORIA', $data['active_destination']['name']);
        $this->assertEquals(14.225000, $data['active_destination']['latitude']);
        $this->assertEquals(121.328000, $data['active_destination']['longitude']);

        // Customer Destination remains preserved as future destination
        $this->assertEquals('Alice Customer', $data['customer_destination']['customer_name']);
        $this->assertEquals(14.240000, $data['customer_destination']['latitude']);
        $this->assertEquals(121.350000, $data['customer_destination']['longitude']);

        // Active Maps URL navigates to Store
        $this->assertStringContainsString('14.225,121.328', $data['maps_url']);

        // Broadcast verified
        Event::assertDispatched(OrderAssigned::class, function ($event) use ($delivery) {
            return $event->delivery->id === $delivery->id && $event->broadcastWith()['route_phase'] === 'rider_to_store';
        });
    }

    /**
     * TEST 2: POS WALK-IN DELIVERY
     * Route destination must also be STORE (Victoria), NOT walk-in customer.
     */
    public function test_pos_walk_in_delivery_accepted_routes_to_store(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Elena',
            'email'     => 'elena@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'order_number'   => 'POS-WALKIN-88',
            'branch_id'      => $this->victoria->id,
            'user_id'        => $this->cashier->id,
            'type'           => 'delivery',
            'total'          => 300.00,
            'subtotal'       => 250.00,
            'delivery_fee'   => 50.00,
            'cost_total'     => 100.00,
            'profit'         => 150.00,
            'paid_amount'    => 300.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => null,
            'customer_name'    => 'Walk-in John',
            'customer_phone'   => '09181112222',
            'customer_address' => 'Poblacion 4, Victoria',
            'latitude'         => 14.230000,
            'longitude'        => 121.340000,
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('assigned_to_rider', $data['status']);
        $this->assertEquals('rider_to_store', $data['route_phase']);
        $this->assertEquals('MAKI DESU VICTORIA', $data['active_destination']['name']);
        $this->assertEquals(14.225000, $data['active_destination']['latitude']);
    }

    /**
     * TEST 3: PICKUP ACTION SWITCHES ROUTE TO CUSTOMER
     */
    public function test_pickup_action_switches_active_route_to_customer(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Lucas',
            'email'     => 'lucas@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-PICKUP-TEST',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Customer Maria',
            'contact_number' => '09170005555',
            'address'        => 'Masapang, Victoria, Laguna',
            'latitude'       => 14.235000,
            'longitude'      => 121.345000,
            'status'         => 'assigned_to_rider',
            'rider_id'       => $rider->id,
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'customer_name'    => 'Customer Maria',
            'customer_phone'   => '09170005555',
            'customer_address' => 'Masapang, Victoria, Laguna',
            'latitude'         => 14.235000,
            'longitude'        => 121.345000,
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $response->assertStatus(200);

        $data = $response->json('data');

        // Status is PICKED_UP
        $this->assertEquals('picked_up', $data['status']);

        // Route Phase is store_to_customer
        $this->assertEquals('store_to_customer', $data['route_phase']);

        // Active destination has now switched to CUSTOMER
        $this->assertEquals('Customer Maria', $data['active_destination']['name'] ?? $data['active_destination']['customer_name']);
        $this->assertEquals(14.235000, $data['active_destination']['latitude']);
        $this->assertEquals(121.345000, $data['active_destination']['longitude']);

        // Active maps URL now navigates to CUSTOMER
        $this->assertStringContainsString('14.235,121.345', $data['maps_url']);
    }

    /**
     * TEST 4: IN TRANSIT PRESERVES CUSTOMER AS ACTIVE DESTINATION
     */
    public function test_in_transit_preserves_customer_destination(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Transit',
            'email'     => 'transit@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Customer Dan',
            'customer_phone'   => '09170007777',
            'customer_address' => 'Victoria Main St',
            'latitude'         => 14.228000,
            'longitude'        => 121.332000,
            'status'           => 'picked_up',
            'delivery_type'    => 'internal',
            'picked_up_at'     => now(),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('in_transit', $data['status']);
        $this->assertEquals('rider_to_customer', $data['route_phase']);
        $this->assertEquals(14.228000, $data['active_destination']['latitude']);
    }

    /**
     * TEST 5: DELIVERED COMPLETES ROUTE
     */
    public function test_delivered_completes_route_lifecycle(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Final',
            'email'     => 'final@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-FINISH-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Customer Final',
            'contact_number' => '09170008888',
            'address'        => 'Victoria Highway',
            'status'         => 'in_transit',
            'rider_id'       => $rider->id,
            'total_amount'   => 250.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->ramen->id,
            'quantity'   => 1,
            'price'      => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'customer_name'    => 'Customer Final',
            'customer_phone'   => '09170008888',
            'customer_address' => 'Victoria Highway',
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
            'picked_up_at'     => now()->subMinutes(15),
            'transit_at'       => now()->subMinutes(5),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('delivered', $data['status']);
        $this->assertEquals('completed', $data['route_phase']);
        $this->assertNull($data['next_action']);
    }

    /**
     * TEST 6: BRANCH ISOLATION
     * Victoria order routes to Victoria store, Santa Cruz order routes to Santa Cruz store.
     */
    public function test_branch_isolation_routes_to_correct_delivery_branch(): void
    {
        $riderStaCruz = Rider::create([
            'name'      => 'Rider Sta Cruz',
            'email'     => 'stacruz@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->santaCruz->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $deliveryStaCruz = Delivery::create([
            'customer_name'    => 'Sta Cruz Customer',
            'customer_address' => 'Santa Cruz Plaza',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        // Link delivery to Santa Cruz branch through a sale
        $sale = Sale::create([
            'order_number'   => 'POS-SC-01',
            'branch_id'      => $this->santaCruz->id,
            'user_id'        => $this->cashier->id,
            'type'           => 'delivery',
            'total'          => 200.00,
            'subtotal'       => 150.00,
            'delivery_fee'   => 50.00,
            'cost_total'     => 50.00,
            'profit'         => 100.00,
            'paid_amount'    => 200.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);
        $deliveryStaCruz->update(['sale_id' => $sale->id]);

        Sanctum::actingAs($riderStaCruz, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$deliveryStaCruz->id}/accept");
        $res->assertStatus(200);

        $data = $res->json('data');
        $this->assertEquals('MAKI DESU STA CRUZ', $data['active_destination']['name']);
        $this->assertEquals(14.278000, $data['active_destination']['latitude']);
        $this->assertEquals(121.415000, $data['active_destination']['longitude']);
    }

    /**
     * TEST 7: UNAUTHORIZED RIDER CANNOT MANIPULATE ROUTE OR PICKUP STATE
     */
    public function test_unauthorized_rider_cannot_manipulate_route_or_pickup(): void
    {
        $riderA = Rider::create([
            'name'      => 'Rider A',
            'email'     => 'a@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $riderB = Rider::create([
            'name'      => 'Rider B',
            'email'     => 'b@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $riderA->id,
            'customer_name'    => 'Private Cust',
            'customer_address' => 'Victoria',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($riderB, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $res->assertStatus(403);
    }

    /**
     * TEST 8: CANCELLATION REQUEST DURING ASSIGNED STATE
     * When rider submits cancellation during ASSIGNED state, delivery transitions to cancellation_requested.
     */
    public function test_cancellation_during_assigned_state_preserves_route_consistency(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Cancel',
            'email'     => 'cancel@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-CANCEL-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Cancel Customer',
            'contact_number' => '09170001122',
            'address'        => 'Victoria Laguna',
            'status'         => 'assigned_to_rider',
            'rider_id'       => $rider->id,
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'customer_name'    => 'Cancel Customer',
            'customer_phone'   => '09170001122',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/orders/{$order->id}/cancel", [
            'reason' => 'Flat tire on the way to store',
        ]);
        $response->assertStatus(200);

        $this->assertEquals('cancellation_requested', $delivery->fresh()->status);
        $this->assertEquals('cancellation_requested', $order->fresh()->status);
    }
}
