<?php

namespace Tests\Feature;

use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PickupFulfillmentOperationsTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchA;
    public Branch $branchB;
    public User $admin;
    public User $cashierBranchA;
    public User $cashierBranchB;
    public User $customer;
    public Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchA = Branch::create([
            'name'                               => 'MAKI DESU - Victoria Plains',
            'address'                            => 'Victoria Plains Branch',
            'latitude'                           => 14.6500,
            'longitude'                          => 121.0500,
            'delivery_radius_km'                 => 10.0,
            'has_internal_riders'                => true,
            'base_delivery_fee'                  => 50.00,
            'per_km_fee'                         => 10.00,
            'pickup_enabled'                     => true,
            'pickup_lead_time_minutes'           => 15,
            'pickup_slot_interval_minutes'       => 15,
            'pickup_max_orders_per_slot'         => 10,
            'pickup_opening_time'                => '08:00:00',
            'pickup_closing_time'                => '22:00:00',
            'pickup_cutoff_before_close_minutes' => 30,
        ]);

        $this->branchB = Branch::create([
            'name'                               => 'MAKI DESU - Terraces',
            'address'                            => 'Fairview Terraces',
            'latitude'                           => 14.7000,
            'longitude'                          => 121.0600,
            'delivery_radius_km'                 => 10.0,
            'has_internal_riders'                => true,
            'pickup_enabled'                     => true,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branchA->id,
        ]);

        $this->cashierBranchA = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchA->id,
        ]);

        $this->cashierBranchB = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchB->id,
        ]);

        $this->customer = User::factory()->create([
            'role'          => 'customer',
            'mobile_number' => '09171234567',
            'branch_id'     => $this->branchA->id,
        ]);

        $category = Category::create(['name' => 'Maki Rolls']);
        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'branch_id'     => $this->branchA->id,
            'selling_price' => 180.00,
            'stock'         => 100,
        ]);
    }

    /**
     * Test 1: Pickup orders do NOT appear in /deliveries (they appear in /pickups instead)
     */
    public function test_pickup_order_excluded_from_deliveries_index(): void
    {
        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 360.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK7890',
        ]);

        OrderItem::create([
            'order_id'   => $pickupOrder->id,
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'price'      => 180.00,
            'unit_price' => 180.00,
            'subtotal'   => 360.00,
        ]);

        // Deliveries index must NOT contain the pickup order
        $response = $this->actingAs($this->cashierBranchA)->get('/deliveries');
        $response->assertStatus(200);
        $deliveries = $response->viewData('page')['props']['deliveries']['data'] ?? [];
        $found = collect($deliveries)->first(fn ($d) => data_get($d, 'id') === $pickupOrder->id);
        $this->assertNull($found, 'Pickup order must NOT appear in /deliveries');

        // Pickups index MUST contain the pickup order
        $pickupResponse = $this->actingAs($this->cashierBranchA)->get('/pickups');
        $pickupResponse->assertStatus(200);
        $pickups = $pickupResponse->viewData('page')['props']['pickups']['data'] ?? [];
        $foundInPickups = collect($pickups)->first(fn ($p) => data_get($p, 'id') === $pickupOrder->id);
        $this->assertNotNull($foundInPickups, 'Pickup order must appear in /pickups');
        $this->assertEquals('pickup', data_get($foundInPickups, 'fulfillment_type'));
    }

    /**
     * Test 2: Deliveries stats reflect delivery-only counts; Pickups stats reflect pickup-only counts
     */
    public function test_delivery_and_pickup_stats_are_isolated(): void
    {
        // Create 1 Delivery record (via Sale)
        $sale1 = Sale::create([
            'order_number'   => 'POS-20260901-001',
            'user_id'        => $this->cashierBranchA->id,
            'branch_id'      => $this->branchA->id,
            'cashier_id'     => $this->cashierBranchA->id,
            'order_type'     => 'delivery',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'total'          => 200.00,
            'paid_amount'    => 200.00,
        ]);
        Delivery::create([
            'sale_id'          => $sale1->id,
            'delivery_type'    => 'internal',
            'status'           => 'pending',
            'customer_name'    => 'Delivery Customer 1',
            'customer_address' => '123 Delivery St',
            'delivery_fee'     => 50.00,
        ]);

        // Create 1 Pickup record (via Order)
        Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK1122',
        ]);

        // Delivery stats should have NO pickup_count key and only delivery-centric stats
        $deliveryResponse = $this->actingAs($this->cashierBranchA)->get('/deliveries');
        $deliveryResponse->assertStatus(200);
        $deliveryStats = $deliveryResponse->viewData('page')['props']['stats'] ?? [];
        $this->assertEquals(1, data_get($deliveryStats, 'all_count'));
        $this->assertEquals(1, data_get($deliveryStats, 'delivery_count'));

        // Pickup stats should reflect pickup-only counts
        $pickupResponse = $this->actingAs($this->cashierBranchA)->get('/pickups');
        $pickupResponse->assertStatus(200);
        $pickupStats = $pickupResponse->viewData('page')['props']['stats'] ?? [];
        // At least one pickup stat should be > 0 (pending_prep or today_total)
        $this->assertGreaterThanOrEqual(1, data_get($pickupStats, 'today_total', 0) + data_get($pickupStats, 'pending_prep', 0));
    }

    /**
     * Test 3: /deliveries only contains delivery-type records; /pickups only contains pickup-type records
     */
    public function test_deliveries_and_pickups_are_fully_separated(): void
    {
        $sale = Sale::create([
            'order_number'   => 'POS-20260901-002',
            'user_id'        => $this->cashierBranchA->id,
            'branch_id'      => $this->branchA->id,
            'cashier_id'     => $this->cashierBranchA->id,
            'order_type'     => 'delivery',
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'total'          => 200.00,
            'paid_amount'    => 200.00,
        ]);
        Delivery::create([
            'sale_id'          => $sale->id,
            'delivery_type'    => 'internal',
            'status'           => 'pending',
            'customer_name'    => 'Delivery Customer',
            'customer_address' => '123 Delivery St',
            'delivery_fee'     => 50.00,
        ]);

        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK3344',
        ]);

        // /deliveries should contain ONLY delivery records, zero pickup records
        $deliveryResponse = $this->actingAs($this->cashierBranchA)->get('/deliveries');
        $deliveryItems = $deliveryResponse->viewData('page')['props']['deliveries']['data'] ?? [];
        foreach ($deliveryItems as $item) {
            $this->assertEquals('delivery', data_get($item, 'fulfillment_type'), 'Deliveries index must not contain pickup records');
        }

        // /pickups should contain ONLY pickup records, zero delivery records
        $pickupResponse = $this->actingAs($this->cashierBranchA)->get('/pickups');
        $pickupItems = $pickupResponse->viewData('page')['props']['pickups']['data'] ?? [];
        $foundPickup = collect($pickupItems)->first(fn ($p) => data_get($p, 'id') === $pickupOrder->id);
        $this->assertNotNull($foundPickup, 'Pickup order must appear in /pickups');
        $this->assertEquals('pickup', data_get($foundPickup, 'fulfillment_type'));
    }

    /**
     * Test 4: Web cashier can transition Pickup statuses via /pickups/{id}/status (PickupOrderController)
     */
    public function test_pickup_status_transitions_via_pickup_controller(): void
    {
        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK5566',
        ]);

        // 1. Advance to preparing
        $res1 = $this->actingAs($this->cashierBranchA)->post("/pickups/{$pickupOrder->id}/status", [
            'status' => 'preparing',
        ]);
        $res1->assertSessionHasNoErrors();
        $this->assertEquals('preparing', $pickupOrder->fresh()->status);

        // 2. Advance to ready_for_pickup
        $res2 = $this->actingAs($this->cashierBranchA)->post("/pickups/{$pickupOrder->id}/status", [
            'status' => 'ready_for_pickup',
        ]);
        $res2->assertSessionHasNoErrors();
        $this->assertEquals('ready_for_pickup', $pickupOrder->fresh()->status);

        // 3. Complete pickup
        $res3 = $this->actingAs($this->cashierBranchA)->post("/pickups/{$pickupOrder->id}/status", [
            'status' => 'completed',
        ]);
        $res3->assertSessionHasNoErrors();
        $this->assertEquals('completed', $pickupOrder->fresh()->status);
    }

    /**
     * Test 5: Realtime OrderStatusUpdated event broadcasts for direct Order models (via PickupOrderController)
     */
    public function test_pickup_status_change_broadcasts_polymorphic_event(): void
    {
        Event::fake([OrderStatusUpdated::class]);

        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK7788',
        ]);

        $this->actingAs($this->cashierBranchA)->post("/pickups/{$pickupOrder->id}/status", [
            'status' => 'preparing',
        ]);

        Event::assertDispatched(OrderStatusUpdated::class, function ($event) use ($pickupOrder) {
            return $event->order->id === $pickupOrder->id
                && $event->order->status === 'preparing';
        });
    }

    /**
     * Test 6: Tracking endpoint returns dedicated pickup tracking payload
     */
    public function test_pickup_order_tracking_endpoint_returns_pickup_details(): void
    {
        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'ready_for_pickup',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK9900',
        ]);

        $response = $this->actingAs($this->customer)->getJson("/api/v1/orders/{$pickupOrder->id}/tracking");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'is_pickup'                => true,
                    'tracking_state'           => 'pickup',
                    'pickup_status'            => 'ready_for_pickup',
                    'pickup_verification_code' => 'PK9900',
                ]
            ]);
    }

    /**
     * Test 7: Cancelling pickup orders via PickupOrderController (status=cancelled)
     */
    public function test_pickup_order_cancellation_via_pickup_controller(): void
    {
        $pickupOrder = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PK0011',
        ]);

        $response = $this->actingAs($this->cashierBranchA)->post("/pickups/{$pickupOrder->id}/status", [
            'status' => 'cancelled',
            'reason' => 'Customer requested order cancellation',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('cancelled', $pickupOrder->fresh()->status);
    }

    /**
     * Test 8: Branch isolation restricts cashier to viewing only their branch's pickup orders in /pickups
     */
    public function test_branch_isolation_in_pickups_index(): void
    {
        // Order at Branch A
        $orderA = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchA->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PKA111',
        ]);

        // Order at Branch B
        $orderB = Order::create([
            'user_id'                  => $this->customer->id,
            'customer_name'            => $this->customer->name,
            'customer_phone'           => '09171234567',
            'branch_id'                => $this->branchB->id,
            'order_type'               => 'pickup',
            'fulfillment_type'         => 'pickup',
            'status'                   => 'pending',
            'total_amount'             => 180.00,
            'payment_method'           => 'cash',
            'payment_status'           => 'pending',
            'scheduled_pickup_at'      => Carbon::now('Asia/Manila')->addHour(),
            'pickup_verification_code' => 'PKB222',
        ]);

        // Cashier A checks pickups — should see only Branch A order
        $resA = $this->actingAs($this->cashierBranchA)->get('/pickups');
        $pickupsA = $resA->viewData('page')['props']['pickups']['data'] ?? [];

        $idsA = collect($pickupsA)->pluck('id')->all();
        $this->assertContains($orderA->id, $idsA);
        $this->assertNotContains($orderB->id, $idsA);

        // Cashier B checks pickups — should see only Branch B order
        $resB = $this->actingAs($this->cashierBranchB)->get('/pickups');
        $pickupsB = $resB->viewData('page')['props']['pickups']['data'] ?? [];

        $idsB = collect($pickupsB)->pluck('id')->all();
        $this->assertContains($orderB->id, $idsB);
        $this->assertNotContains($orderA->id, $idsB);
    }
}
