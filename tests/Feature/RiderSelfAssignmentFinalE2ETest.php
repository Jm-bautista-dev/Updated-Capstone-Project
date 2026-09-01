<?php

namespace Tests\Feature;

use App\Events\OrderAssigned;
use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderSelfAssignmentFinalE2ETest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $customer;
    protected User $cashier;
    protected Product $sushi;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create([
            'name'      => 'MAKI DESU VICTORIA',
            'address'   => 'Poblacion, Victoria, Laguna',
            'latitude'  => 14.225000,
            'longitude' => 121.328000,
            'is_active' => true,
        ]);

        $this->santaCruz = Branch::create([
            'name'      => 'MAKI DESU STA CRUZ',
            'address'   => 'Santa Cruz, Laguna',
            'latitude'  => 14.278000,
            'longitude' => 121.415000,
            'is_active' => true,
        ]);

        $this->customer = User::create([
            'name'      => 'Customer Alice',
            'email'     => 'alice@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'customer',
        ]);

        $this->cashier = User::create([
            'name'      => 'Cashier Bob',
            'email'     => 'cashier@example.com',
            'password'  => Hash::make('password123'),
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->sushi = Product::create([
            'name'          => 'California Maki',
            'description'   => 'Delicious sushi rolls',
            'selling_price' => 150.00,
            'cost_price'    => 80.00,
            'is_active'     => true,
        ]);
    }

    /**
     * TEST 1 — NORMAL: Order becomes READY FOR PICKUP -> Available to eligible riders.
     */
    public function test_order_ready_for_pickup_is_available_to_eligible_riders(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider 1',
            'email'     => 'rider1@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-101',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Alice Customer',
            'contact_number' => '09170001111',
            'address'        => 'Victoria, Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 300.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Victoria, Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->getJson('/api/v1/rider/available-deliveries');
        $response->assertStatus(200);

        $deliveries = $response->json('data');
        $this->assertNotEmpty($deliveries);
        $this->assertEquals($delivery->id, $deliveries[0]['delivery_id'] ?? $deliveries[0]['id']);
    }

    /**
     * TEST 2 — FIRST RIDER: Rider A accepts -> Rider A wins. Delivery becomes ASSIGNED.
     */
    public function test_first_rider_accepts_and_becomes_assigned(): void
    {
        $riderA = Rider::create([
            'name'      => 'Rider A',
            'email'     => 'riderA@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-102',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Customer Two',
            'contact_number' => '09170002222',
            'address'        => 'Victoria, Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Customer Two',
            'customer_phone'   => '09170002222',
            'customer_address' => 'Victoria, Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($riderA, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response->assertStatus(200);

        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals($riderA->id, $delivery->fresh()->rider_id);
        $this->assertEquals('busy', $riderA->fresh()->status);
    }

    /**
     * TEST 3 — SECOND RIDER: Rider B tries immediately after A -> Rejected with 409 conflict.
     */
    public function test_second_rider_rejected_with_conflict_when_already_claimed(): void
    {
        $riderA = Rider::create([
            'name'      => 'Rider A',
            'email'     => 'riderA3@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $riderB = Rider::create([
            'name'      => 'Rider B',
            'email'     => 'riderB3@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $riderA->id,
            'customer_name'    => 'Customer Three',
            'customer_address' => 'Victoria, Laguna',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($riderB, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response->assertStatus(409);
        $this->assertStringContainsString('already accepted', $response->json('message'));
    }

    /**
     * TEST 4 — SIMULTANEOUS: Atomic concurrency guard test.
     */
    public function test_atomic_claim_concurrency_protection(): void
    {
        $riderA = Rider::create([
            'name'      => 'Rider Concurrency A',
            'email'     => 'concA@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $riderB = Rider::create([
            'name'      => 'Rider Concurrency B',
            'email'     => 'concB@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => null,
            'customer_name'    => 'Customer Conc',
            'customer_address' => 'Victoria, Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        // First attempt wins
        Sanctum::actingAs($riderA, ['*'], 'sanctum');
        $resA = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $resA->assertStatus(200);

        // Second attempt fails
        Sanctum::actingAs($riderB, ['*'], 'sanctum');
        $resB = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $resB->assertStatus(409);
    }

    /**
     * TEST 5 — INACTIVE: Inactive rider cannot see/accept eligible jobs.
     */
    public function test_inactive_rider_cannot_see_or_accept_jobs(): void
    {
        $riderInactive = Rider::create([
            'name'      => 'Rider Inactive',
            'email'     => 'inactive@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'offline',
            'is_active' => false,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => null,
            'customer_name'    => 'Cust Inact',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($riderInactive, ['*'], 'sanctum');

        $resGet = $this->getJson('/api/v1/rider/available-deliveries');
        $resGet->assertStatus(403);

        $resAccept = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $resAccept->assertStatus(422);
    }

    /**
     * TEST 6 — BUSY: Active but busy/out-for-delivery rider cannot accept another job.
     */
    public function test_busy_out_for_delivery_rider_cannot_accept_another_job(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Busy',
            'email'     => 'busy@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        // Active in-transit delivery
        Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Cust 1',
            'customer_address' => 'Victoria',
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
        ]);

        $newDelivery = Delivery::create([
            'rider_id'         => null,
            'customer_name'    => 'Cust 2',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$newDelivery->id}/accept");
        $res->assertStatus(422);
        $this->assertStringContainsString('out for delivery', $res->json('message'));
    }

    /**
     * TEST 7 — BRANCH: Victoria delivery -> Victoria riders eligible, Sta Cruz riders not eligible.
     */
    public function test_branch_isolation_enforces_eligibility(): void
    {
        $riderStaCruz = Rider::create([
            'name'      => 'Rider SC',
            'email'     => 'sc_rider@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->santaCruz->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $orderVictoria = Order::create([
            'order_number'   => 'ORD-VIC-7',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Vic Cust',
            'contact_number' => '09170007777',
            'address'        => 'Victoria Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 200.00,
        ]);

        $deliveryVictoria = Delivery::create([
            'order_id'         => $orderVictoria->id,
            'customer_name'    => 'Vic Cust',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($riderStaCruz, ['*'], 'sanctum');

        // Available list excludes other branch jobs
        $resList = $this->getJson('/api/v1/rider/available-deliveries');
        $resList->assertStatus(200);
        $this->assertEmpty($resList->json('data'));

        // Direct accept is rejected
        $resAccept = $this->postJson("/api/v1/rider/deliveries/{$deliveryVictoria->id}/accept");
        $resAccept->assertStatus(422);
    }

    /**
     * TEST 8 — POS DELIVERY: POS walk-in delivery becomes READY FOR PICKUP -> Rider sees it and accepts.
     */
    public function test_pos_walk_in_delivery_follows_same_self_acceptance_flow(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider POS',
            'email'     => 'pos_rider@example.com',
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
            'total'          => 350.00,
            'subtotal'       => 300.00,
            'delivery_fee'   => 50.00,
            'cost_total'     => 100.00,
            'profit'         => 200.00,
            'paid_amount'    => 350.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => null,
            'customer_name'    => 'Walk-in Customer 88',
            'customer_address' => 'Victoria Plaza',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $res->assertStatus(200);

        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
    }

    /**
     * TEST 9 — MOBILE DELIVERY: Mobile customer order becomes READY FOR PICKUP -> Same workflow.
     */
    public function test_mobile_customer_order_follows_self_acceptance_flow(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Mobile',
            'email'     => 'mob_rider@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-MOB-99',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Mobile User',
            'contact_number' => '09170009999',
            'address'        => 'Victoria Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 400.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Mobile User',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $res->assertStatus(200);

        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals('assigned_to_rider', $order->fresh()->status);
    }

    /**
     * TEST 10 — REALTIME: Rider A accepts -> Realtime OrderAssigned event dispatched with payload.
     */
    public function test_realtime_events_dispatched_on_rider_acceptance(): void
    {
        Event::fake([OrderAssigned::class, OrderStatusUpdated::class]);

        $rider = Rider::create([
            'name'      => 'Rider Realtime',
            'email'     => 'realtime@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'customer_name'    => 'Realtime Cust',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $res->assertStatus(200);

        Event::assertDispatched(OrderAssigned::class, function ($event) use ($delivery, $rider) {
            return $event->delivery->id === $delivery->id && $event->delivery->rider_id === $rider->id;
        });
    }

    /**
     * TEST 11 — PICKUP: Assigned rider -> PICK UP -> ASSIGNED -> PICKED_UP.
     */
    public function test_assigned_rider_picks_up_delivery(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Pickup',
            'email'     => 'pickup@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Cust Pickup',
            'customer_address' => 'Victoria',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $res->assertStatus(200);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertEquals('store_to_customer', $res->json('data.route_phase'));
    }

    /**
     * TEST 12 — ROUTE: After ACCEPT -> Rider -> Store. After PICKUP/IN TRANSIT -> Rider -> Customer.
     */
    public function test_two_phase_route_lifecycle(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Route',
            'email'     => 'route@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-ROUTE-12',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Customer Route',
            'contact_number' => '09170001212',
            'address'        => 'Victoria Town Center',
            'latitude'       => 14.238000,
            'longitude'      => 121.340000,
            'status'         => 'ready_for_pickup',
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Customer Route',
            'customer_phone'   => '09170001212',
            'customer_address' => 'Victoria Town Center',
            'latitude'         => 14.238000,
            'longitude'        => 121.340000,
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Phase 1: ACCEPT -> Route to STORE
        $resAccept = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $resAccept->assertStatus(200);
        $this->assertEquals('rider_to_store', $resAccept->json('data.route_phase'));
        $this->assertEquals('MAKI DESU VICTORIA', $resAccept->json('data.active_destination.name'));

        // Phase 2: PICKUP -> Route to CUSTOMER
        $resPickup = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $resPickup->assertStatus(200);
        $this->assertEquals('store_to_customer', $resPickup->json('data.route_phase'));
        $this->assertEquals('Customer Route', $resPickup->json('data.active_destination.name') ?? $resPickup->json('data.active_destination.customer_name'));
    }

    /**
     * TEST 13 — DELIVERY: Rider -> IN TRANSIT -> DELIVERED -> Terminal State.
     */
    public function test_full_transit_and_delivery_completion(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Final',
            'email'     => 'final@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Customer Done',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'picked_up',
            'delivery_type'    => 'internal',
            'picked_up_at'     => now(),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Transit
        $resTransit = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $resTransit->assertStatus(200);
        $this->assertEquals('in_transit', $delivery->fresh()->status);

        // Deliver
        $resDeliver = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $resDeliver->assertStatus(200);
        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('available', $rider->fresh()->status);
    }

    /**
     * TEST 14 — SALES: Completed delivery recognized once. No duplicate sale or revenue inflation.
     */
    public function test_sales_and_revenue_integrity_preserved(): void
    {
        $initialSalesCount = Sale::count();

        $rider = Rider::create([
            'name'      => 'Rider Sale Integrity',
            'email'     => 'sale_int@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-FINANCIAL-14',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Financial Test Cust',
            'contact_number' => '09170001414',
            'address'        => 'Victoria Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 500.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->sushi->id,
            'quantity'   => 2,
            'price'      => 150.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Financial Test Cust',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Accept -> Pickup -> Transit -> Deliver
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver")->assertStatus(200);

        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('delivered', $order->fresh()->status);

        // Verify no duplicate sales record created
        $finalSalesCount = Sale::count();
        $this->assertEquals($initialSalesCount + 1, $finalSalesCount);
    }

    /**
     * TEST 15 — MOBILE APP ALIAS ENDPOINTS
     * Verifies that /api/v1/deliveries/{id}/update-status works with status: 'picked_up'
     * and direct /api/v1/deliveries/{id}/pickup works seamlessly.
     */
    public function test_direct_delivery_update_status_and_pickup_aliases_work_for_mobile_app(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Mobile Alias',
            'email'     => 'alias@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Alias Customer',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Test calling /api/v1/deliveries/{id}/update-status with status: 'picked_up'
        $response = $this->postJson("/api/v1/deliveries/{$delivery->id}/update-status", [
            'status' => 'picked_up',
        ]);
        $response->assertStatus(200);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertEquals('store_to_customer', $response->json('data.route_phase'));

        // Test calling /api/v1/deliveries/{id}/transit
        $resTransit = $this->postJson("/api/v1/deliveries/{$delivery->id}/transit");
        $resTransit->assertStatus(200);
        $this->assertEquals('in_transit', $delivery->fresh()->status);
    }

    /**
     * TEST 16 — POS WALK-IN DELIVERIES IN MY-ORDERS QUERY
     * Verifies that when a rider accepts a POS walk-in delivery (sale_id),
     * GET /api/v1/rider/my-orders and GET /api/v1/orders/my both return the delivery.
     */
    public function test_pos_walk_in_deliveries_query_in_my_orders_endpoints(): void
    {
        $rider = Rider::create([
            'name'      => 'POS Query Rider',
            'email'     => 'posquery@example.com',
            'password'  => Hash::make('password123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'order_number'   => 'POS-WALKIN-999',
            'branch_id'      => $this->victoria->id,
            'user_id'        => $this->cashier->id,
            'type'           => 'delivery',
            'total'          => 450.00,
            'subtotal'       => 400.00,
            'delivery_fee'   => 50.00,
            'cost_total'     => 150.00,
            'profit'         => 250.00,
            'paid_amount'    => 450.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => null,
            'customer_name'    => 'POS Customer Test',
            'customer_address' => 'Victoria Plaza Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Rider accepts the POS delivery
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);

        // Query GET /api/v1/rider/my-orders
        $myOrdersRes = $this->getJson('/api/v1/rider/my-orders');
        $myOrdersRes->assertStatus(200);
        $myOrdersRes->assertJsonFragment([
            'delivery_id'  => $delivery->id,
            'order_number' => 'POS-WALKIN-999',
            'order_source' => 'pos',
            'status'       => 'assigned_to_rider',
        ]);

        // Query GET /api/v1/orders/my alias
        $ordersMyRes = $this->getJson('/api/v1/orders/my');
        $ordersMyRes->assertStatus(200);
        $ordersMyRes->assertJsonFragment([
            'delivery_id'  => $delivery->id,
            'order_number' => 'POS-WALKIN-999',
            'order_source' => 'pos',
            'status'       => 'assigned_to_rider',
        ]);
    }
}
