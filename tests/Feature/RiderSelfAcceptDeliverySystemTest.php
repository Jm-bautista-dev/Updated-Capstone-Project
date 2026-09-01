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
     * TEST 1: Preparing deliveries must NOT appear in available jobs
     */
    public function test_order_in_preparing_status_is_not_visible_to_riders(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider One',
            'email'     => 'rider1@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-PREP-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Test Customer',
            'contact_number' => '09170001111',
            'address'        => 'Victoria Laguna',
            'status'         => 'preparing',
            'total_amount'   => 250.00,
        ]);

        Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Test Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'preparing',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->getJson('/api/v1/rider/available-deliveries');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'count'   => 0,
            'data'    => [],
        ]);
    }

    /**
     * TEST 2: Order in READY FOR PICKUP status is visible to eligible riders in realtime
     */
    public function test_ready_for_pickup_unassigned_delivery_appears_in_available_deliveries(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider One',
            'email'     => 'rider1@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-READY-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Juan Dela Cruz',
            'contact_number' => '09170002222',
            'address'        => 'Victoria Town Proper',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'customer_name'    => 'Juan Dela Cruz',
            'customer_phone'   => '09170002222',
            'customer_address' => 'Victoria Town Proper',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        $response = $this->getJson('/api/v1/rider/available-deliveries');
        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'count'   => 1,
        ]);
        $response->assertJsonFragment([
            'delivery_id'   => $delivery->id,
            'order_number'  => 'ORD-READY-1',
            'status'        => 'ready_for_pickup',
            'is_available'  => true,
            'rider_id'      => null,
        ]);
    }

    /**
     * TEST 3: Inactive and offline riders cannot view or accept available deliveries
     */
    public function test_inactive_and_offline_riders_cannot_view_or_accept_jobs(): void
    {
        $inactiveRider = Rider::create([
            'name'      => 'Inactive Rider',
            'email'     => 'inactive@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'offline',
            'is_active' => false,
        ]);

        $delivery = Delivery::create([
            'customer_name'    => 'Test Customer',
            'customer_phone'   => '09170003333',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($inactiveRider, ['*'], 'sanctum');

        // Cannot view available jobs
        $viewResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $viewResponse->assertStatus(403);

        // Cannot accept
        $acceptResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $acceptResponse->assertStatus(422);
    }

    /**
     * TEST 4: Rider currently OUT FOR DELIVERY (in_transit) cannot accept new jobs
     */
    public function test_rider_out_for_delivery_cannot_accept_new_delivery(): void
    {
        $busyRider = Rider::create([
            'name'      => 'In Transit Rider',
            'email'     => 'transit@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        // Active in-transit delivery
        Delivery::create([
            'rider_id'         => $busyRider->id,
            'customer_name'    => 'Current Active Order',
            'customer_address' => 'Road 1',
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
        ]);

        $newDelivery = Delivery::create([
            'customer_name'    => 'New Ready Order',
            'customer_address' => 'Road 2',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($busyRider, ['*'], 'sanctum');

        // Blocked from viewing
        $viewResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $viewResponse->assertStatus(422);

        // Blocked from accepting
        $acceptResponse = $this->postJson("/api/v1/rider/deliveries/{$newDelivery->id}/accept");
        $acceptResponse->assertStatus(422);
        $acceptResponse->assertJsonFragment([
            'success' => false,
        ]);
    }

    /**
     * TEST 5: Active and available rider can accept an available ready job
     */
    public function test_active_and_available_rider_can_accept_ready_delivery(): void
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
        ]);
        $response->assertJsonFragment([
            'status'   => 'assigned_to_rider',
            'rider_id' => $rider->id,
        ]);

        // Verify Database
        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
        $this->assertNotNull($delivery->fresh()->accepted_at);
        $this->assertEquals($rider->id, $order->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $order->fresh()->status);
        $this->assertEquals('busy', $rider->fresh()->status);

        // Verify Assignment Audit Log
        $this->assertDatabaseHas('delivery_assignment_logs', [
            'delivery_id'      => $delivery->id,
            'rider_id'         => $rider->id,
            'assigned_by_type' => 'rider_self_accept',
            'new_status'       => 'assigned_to_rider',
        ]);

        // Verify Events Dispatched
        Event::assertDispatched(OrderAssigned::class);
        Event::assertDispatched(OrderStatusUpdated::class);
        Event::assertDispatched(RiderStatusUpdated::class);
    }

    /**
     * TEST 6: Atomic Concurrency Protection — First Rider Wins
     */
    public function test_atomic_concurrency_race_condition_first_rider_wins(): void
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
            'customer_name'    => 'Concurrent Customer',
            'customer_phone'   => '09170005555',
            'customer_address' => 'Victoria Center',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        // Rider A accepts first
        Sanctum::actingAs($riderA, ['*'], 'sanctum');
        $responseA = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $responseA->assertStatus(200);

        // Rider B accepts milliseconds later (simulated race condition)
        Sanctum::actingAs($riderB, ['*'], 'sanctum');
        $responseB = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $responseB->assertStatus(409);
        $responseB->assertJson([
            'success' => false,
            'message' => 'Delivery already accepted by another rider.',
        ]);

        // Database must have Rider A only
        $this->assertEquals($riderA->id, $delivery->fresh()->rider_id);
    }

    /**
     * TEST 7: Acceptance Idempotency — Same rider tapping accept twice succeeds cleanly
     */
    public function test_acceptance_idempotency_for_same_rider(): void
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

        // First tap
        $response1 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response1->assertStatus(200);

        // Second tap rapidly
        $response2 = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $response2->assertStatus(200);
        $response2->assertJson([
            'success' => true,
            'message' => 'Delivery is already assigned to you.',
        ]);

        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
    }

    /**
     * TEST 8: Branch Isolation is enforced strictly on discovery and acceptance
     */
    public function test_branch_isolation_strictly_enforced(): void
    {
        $victoriaRider = Rider::create([
            'name'      => 'Victoria Rider',
            'email'     => 'vic.rider@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $santaCruzRider = Rider::create([
            'name'      => 'Sta Cruz Rider',
            'email'     => 'stacruz.rider@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->santaCruz->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $victoriaOrder = Order::create([
            'order_number'   => 'ORD-VIC-9',
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Victoria Customer',
            'contact_number' => '09170006666',
            'address'        => 'Victoria Laguna',
            'status'         => 'ready_for_pickup',
            'total_amount'   => 250.00,
        ]);

        $victoriaDelivery = Delivery::create([
            'order_id'         => $victoriaOrder->id,
            'customer_name'    => 'Victoria Customer',
            'customer_phone'   => '09170006666',
            'customer_address' => 'Victoria Laguna',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        // Victoria rider sees it
        Sanctum::actingAs($victoriaRider, ['*'], 'sanctum');
        $vicResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $vicResponse->assertStatus(200);
        $vicResponse->assertJson(['count' => 1]);

        // Sta Cruz rider cannot see it
        Sanctum::actingAs($santaCruzRider, ['*'], 'sanctum');
        $staResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $staResponse->assertStatus(200);
        $staResponse->assertJson(['count' => 0]);

        // Sta Cruz rider cannot accept it
        $staAccept = $this->postJson("/api/v1/rider/deliveries/{$victoriaDelivery->id}/accept");
        $staAccept->assertStatus(422);
    }

    /**
     * TEST 9: POS Walk-in Delivery Order follows identical self-acceptance workflow
     */
    public function test_pos_walk_in_delivery_follows_identical_self_accept_workflow(): void
    {
        $rider = Rider::create([
            'name'      => 'POS Rider',
            'email'     => 'pos.rider@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $sale = Sale::create([
            'order_number'   => 'POS-DEL-101',
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
            'customer_name'    => 'Walk-in POS Customer',
            'customer_phone'   => '09177778888',
            'customer_address' => 'Victoria Street',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // Visible in available deliveries
        $available = $this->getJson('/api/v1/rider/available-deliveries');
        $available->assertStatus(200);
        $available->assertJson(['count' => 1]);

        // Accept
        $accept = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $accept->assertStatus(200);

        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
    }

    /**
     * TEST 10: Complete lifecycle: Accept → Pick Up → In Transit → Deliver
     */
    public function test_complete_post_acceptance_delivery_lifecycle(): void
    {
        $rider = Rider::create([
            'name'      => 'Lifecycle Rider',
            'email'     => 'life.rider@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-LIFE-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Life Customer',
            'contact_number' => '09171239999',
            'address'        => 'Victoria Poblacion',
            'status'         => 'ready_for_pickup',
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
            'rider_id'         => null,
            'customer_name'    => 'Life Customer',
            'customer_phone'   => '09171239999',
            'customer_address' => 'Victoria Poblacion',
            'delivery_fee'     => 50.00,
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        Sanctum::actingAs($rider, ['*'], 'sanctum');

        // 1. Accept
        $accRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $accRes->assertStatus(200);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);

        // 2. Pick Up
        $pickRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $pickRes->assertStatus(200);
        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertNotNull($delivery->fresh()->picked_up_at);

        // 3. Transit
        $transRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $transRes->assertStatus(200);
        $this->assertEquals('in_transit', $delivery->fresh()->status);
        $this->assertNotNull($delivery->fresh()->transit_at);

        // 4. Deliver
        $delivRes = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $delivRes->assertStatus(200);
        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertNotNull($delivery->fresh()->delivered_at);

        // Rider should now be available again
        $this->assertEquals('available', $rider->fresh()->status);

        // Authoritative Sale created
        $sale = Sale::where('order_id', $order->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals(200.00, (float) $sale->subtotal);
        $this->assertEquals(50.00, (float) $sale->delivery_fee);
        $this->assertEquals(120.00, (float) $sale->profit);
    }

    /**
     * TEST 11: Admin Manual Override Fallback assigns rider and removes from available pool
     */
    public function test_admin_manual_override_fallback(): void
    {
        $rider = Rider::create([
            'name'      => 'Fallback Rider',
            'email'     => 'fallback@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $delivery = Delivery::create([
            'customer_name'    => 'Manual Override Customer',
            'customer_address' => 'Victoria Road',
            'status'           => 'ready_for_pickup',
            'delivery_type'    => 'internal',
        ]);

        // Admin assigns manually
        $this->actingAs($this->admin);
        $assignRes = $this->post("/deliveries/{$delivery->id}/assign-rider", [
            'rider_id' => $rider->id,
        ]);
        $assignRes->assertSessionHas('success');

        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);

        // Verify assignment audit log
        $this->assertDatabaseHas('delivery_assignment_logs', [
            'delivery_id'      => $delivery->id,
            'rider_id'         => $rider->id,
            'assigned_by_type' => 'admin_manual',
        ]);

        // Another rider no longer sees it in available jobs
        $otherRider = Rider::create([
            'name'      => 'Other Rider',
            'email'     => 'other@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        Sanctum::actingAs($otherRider, ['*'], 'sanctum');
        $avail = $this->getJson('/api/v1/rider/available-deliveries');
        $avail->assertStatus(200);
        $avail->assertJson(['count' => 0]);
    }
}
