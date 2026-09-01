<?php

namespace Tests\Feature;

use App\Events\OrderAssigned;
use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
use App\Events\SaleCreated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\DeliveryAssignmentLog;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\DeliveryService;
use App\Services\OrderFulfillmentService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderSelfAcceptDeliverySystemTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $admin;
    protected User $cashier;
    protected User $customer;
    protected Product $ramen;
    protected Ingredient $noodles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create([
            'name'                => 'MAKI DESU VICTORIA',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.2250,
            'longitude'           => 121.3280,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->santaCruz = Branch::create([
            'name'                => 'MAKI DESU STA CRUZ',
            'address'             => 'Santa Cruz, Laguna',
            'latitude'            => 14.2780,
            'longitude'           => 121.4150,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $this->noodles = Ingredient::create([
            'name'               => 'Noodles',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.40,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->noodles->id, 'branch_id' => $this->victoria->id],
            [
                'stock'             => 50000,
                'cost_per_unit'     => 0.40,
                'total_stock_value' => 20000,
                'low_stock_level'   => 1000,
            ]
        );

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

        MenuItemIngredient::create([
            'menu_item_id'      => $this->ramen->id,
            'ingredient_id'     => $this->noodles->id,
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);
    }

    /**
     * TEST 1: READY_FOR_PICKUP + UNASSIGNED -> Accept -> ASSIGNED + rider_id set.
     */
    public function test_ready_for_pickup_unassigned_accept_transitions_to_assigned(): void
    {
        Event::fake([OrderStatusUpdated::class, OrderAssigned::class, RiderStatusUpdated::class]);

        $rider = Rider::create([
            'name'      => 'Eligible Rider Bob',
            'email'     => 'bob@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-ACCEPT-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Bob Customer',
            'contact_number' => '09178889999',
            'address'        => 'Victoria Highway',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Bob Customer',
            'customer_phone'   => '09178889999',
            'customer_address' => 'Victoria Highway',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'status'            => 'assigned_to_rider',
                'status_label'      => 'Rider Assigned',
                'next_action'       => 'pickup',
                'next_action_label' => 'Pick Up Order',
                'route_phase'       => 'rider_to_store',
                'rider_id'          => $rider->id,
            ],
        ]);

        // Verify DB
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $order->fresh()->status);
        $this->assertEquals($rider->id, $order->fresh()->rider_id);
    }

    /**
     * TEST 2: Accept again (Double tap) -> Idempotent 200 OK, status remains assigned_to_rider.
     */
    public function test_accept_again_is_idempotent_and_remains_assigned(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Idempotent',
            'email'     => 'idem@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'customer_name'    => 'Idempotent Customer',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Tap 1
        $r1 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $r1->assertStatus(200);

        // Tap 2
        $r2 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $r2->assertStatus(200);
        $r2->assertJson([
            'success' => true,
            'message' => 'Delivery is already assigned to you.',
        ]);

        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
    }

    /**
     * TEST 3: ASSIGNED -> Pickup -> PICKED_UP. Next action becomes transit.
     */
    public function test_assigned_pickup_transitions_to_picked_up(): void
    {
        $rider = Rider::create([
            'name'      => 'Pickup Rider',
            'email'     => 'pickup@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-PICK-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Pick Customer',
            'contact_number' => '09170001234',
            'address'        => 'Victoria Laguna',
            'status'         => 'assigned_to_rider',
            'rider_id'       => $rider->id,
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'customer_name'    => 'Pick Customer',
            'customer_phone'   => '09170001234',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'status'            => 'picked_up',
                'status_label'      => 'Picked Up',
                'next_action'       => 'transit',
                'next_action_label' => 'Start Delivery',
                'route_phase'       => 'store_to_customer',
            ],
        ]);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertEquals('picked_up', $order->fresh()->status);
        $this->assertNotNull($delivery->fresh()->picked_up_at);
    }

    /**
     * TEST 4: PICKED_UP -> Pickup again -> Safe idempotent response, status remains picked_up.
     */
    public function test_pickup_again_is_idempotent_and_remains_picked_up(): void
    {
        $rider = Rider::create([
            'name'      => 'Pickup Rider',
            'email'     => 'pickup2@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Pick Customer',
            'customer_address' => 'Victoria',
            'status'           => 'picked_up',
            'delivery_type'    => 'internal',
            'picked_up_at'     => now(),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Order is already marked as picked up.',
        ]);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
    }

    /**
     * TEST 5: PICKED_UP -> Start delivery (transit) -> IN_TRANSIT. Next action becomes deliver.
     */
    public function test_picked_up_transit_transitions_to_in_transit(): void
    {
        $rider = Rider::create([
            'name'      => 'Transit Rider',
            'email'     => 'transit1@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-TRANSIT-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Transit Customer',
            'contact_number' => '09170005678',
            'address'        => 'Victoria Laguna',
            'status'         => 'picked_up',
            'rider_id'       => $rider->id,
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'customer_name'    => 'Transit Customer',
            'customer_phone'   => '09170005678',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'picked_up',
            'delivery_type'    => 'internal',
            'picked_up_at'     => now(),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'status'            => 'in_transit',
                'status_label'      => 'In Transit',
                'next_action'       => 'deliver',
                'next_action_label' => 'Mark as Delivered',
                'route_phase'       => 'rider_to_customer',
            ],
        ]);

        $this->assertEquals('in_transit', $delivery->fresh()->status);
        $this->assertEquals('in_transit', $order->fresh()->status);
        $this->assertNotNull($delivery->fresh()->transit_at);
    }

    /**
     * TEST 6: IN_TRANSIT -> Deliver -> DELIVERED. Terminal state.
     */
    public function test_in_transit_deliver_transitions_to_delivered(): void
    {
        $rider = Rider::create([
            'name'      => 'Deliver Rider',
            'email'     => 'deliver1@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-DELIV-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Deliv Customer',
            'contact_number' => '09170009999',
            'address'        => 'Victoria Laguna',
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
            'customer_name'    => 'Deliv Customer',
            'customer_phone'   => '09170009999',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
            'picked_up_at'     => now()->subMinutes(10),
            'transit_at'       => now()->subMinutes(5),
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'data'    => [
                'status'            => 'delivered',
                'status_label'      => 'Delivered',
                'next_action'       => null,
                'next_action_label' => 'Delivered',
                'route_phase'       => 'completed',
            ],
        ]);

        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('delivered', $order->fresh()->status);
        $this->assertNotNull($delivery->fresh()->delivered_at);
        $this->assertEquals('available', $rider->fresh()->status);
    }

    /**
     * TEST 7: Illegal State Transitions must be strictly rejected by backend.
     */
    public function test_illegal_state_transitions_are_strictly_rejected(): void
    {
        $rider = Rider::create([
            'name'      => 'Guard Rider',
            'email'     => 'guard@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Case A: ready_for_pickup -> direct pickup attempt without accepting
        $unassigned = Delivery::create([
            'customer_name'    => 'Unassigned Cust',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);
        $resA = $this->postJson("/api/v1/rider/deliveries/{$unassigned->id}/pickup");
        $resA->assertStatus(422);
        $resA->assertJsonFragment(['success' => false]);

        // Case B: assigned_to_rider -> direct transit attempt without pickup
        $assigned = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Assigned Cust',
            'customer_address' => 'Victoria',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
        ]);
        $resB = $this->postJson("/api/v1/rider/deliveries/{$assigned->id}/transit");
        $resB->assertStatus(422);

        // Case C: delivered -> attempt pickup
        $delivered = Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Delivered Cust',
            'customer_address' => 'Victoria',
            'status'           => 'delivered',
            'delivery_type'    => 'internal',
        ]);
        $resC = $this->postJson("/api/v1/rider/deliveries/{$delivered->id}/pickup");
        $resC->assertStatus(422);
    }

    /**
     * TEST 8: Atomic Concurrency Protection — First Rider Wins
     */
    public function test_atomic_concurrency_first_rider_wins(): void
    {
        $riderA = Rider::create([
            'name'      => 'Rider A',
            'email'     => 'riderA@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $riderB = Rider::create([
            'name'      => 'Rider B',
            'email'     => 'riderB@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'customer_name'    => 'Concurrent Cust',
            'customer_address' => 'Victoria',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        // Rider A accepts
        Sanctum::actingAs($riderA, ['*'], 'sanctum');
        $rA = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $rA->assertStatus(200);

        // Rider B accepts milliseconds later
        Sanctum::actingAs($riderB, ['*'], 'sanctum');
        $rB = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $rB->assertStatus(409);
        $rB->assertJson([
            'success' => false,
            'message' => 'Delivery already accepted by another rider.',
        ]);

        $this->assertEquals($riderA->id, $delivery->fresh()->rider_id);
    }

    /**
     * TEST 9: Active + Out for delivery rider is blocked from accepting new jobs.
     */
    public function test_active_out_for_delivery_rider_cannot_accept_new_jobs(): void
    {
        $rider = Rider::create([
            'name'      => 'Busy In Transit Rider',
            'email'     => 'busytransit@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        // Currently in transit with delivery 1
        Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Order 1',
            'customer_address' => 'Road 1',
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
        ]);

        $delivery2 = Delivery::create([
            'customer_name'    => 'Order 2',
            'customer_address' => 'Road 2',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery2->id}/accept");
        $res->assertStatus(422);
    }

    /**
     * TEST 10: POS Walk-in Delivery follows identical lifecycle.
     */
    public function test_pos_walk_in_delivery_follows_identical_lifecycle(): void
    {
        $rider = Rider::create([
            'name'      => 'POS Lifecycle Rider',
            'email'     => 'poslife@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'order_number'   => 'POS-LIFE-100',
            'branch_id'      => $this->victoria->id,
            'user_id'        => $this->cashier->id,
            'type'           => 'delivery',
            'total'          => 250.00,
            'subtotal'       => 200.00,
            'delivery_fee'   => 50.00,
            'cost_total'     => 80.00,
            'profit'         => 120.00,
            'paid_amount'    => 250.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => null,
            'customer_name'    => 'Walk-in Cust',
            'customer_phone'   => '09173334444',
            'customer_address' => 'Victoria Street',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Accept
        $r1 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $r1->assertStatus(200);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);

        // Pickup
        $r2 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $r2->assertStatus(200);
        $this->assertEquals('picked_up', $delivery->fresh()->status);

        // Transit
        $r3 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $r3->assertStatus(200);
        $this->assertEquals('in_transit', $delivery->fresh()->status);

        // Deliver
        $r4 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $r4->assertStatus(200);
        $this->assertEquals('delivered', $delivery->fresh()->status);
    }

    /**
     * TEST 11: Wrong rider cannot pickup, transit, or deliver an order assigned to someone else.
     */
    public function test_wrong_rider_cannot_progress_other_riders_order(): void
    {
        $riderOwner = Rider::create([
            'name'      => 'Owner Rider',
            'email'     => 'owner@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        $riderAttacker = Rider::create([
            'name'      => 'Attacker Rider',
            'email'     => 'attacker@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'rider_id'         => $riderOwner->id,
            'customer_name'    => 'Secure Cust',
            'customer_address' => 'Victoria',
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($riderAttacker, ['*'], 'sanctum');

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $res->assertStatus(403);
    }
}
