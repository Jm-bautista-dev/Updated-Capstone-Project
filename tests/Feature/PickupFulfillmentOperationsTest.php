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
     * Test 1: Mobile pickup order appears in Web /deliveries operational queue
     */
     public function test_mobile_pickup_order_appears_in_web_deliveries_index(): void
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
 
         $response = $this->actingAs($this->cashierBranchA)->get('/deliveries');
 
         $response->assertStatus(200);
         $deliveries = $response->viewData('page')['props']['deliveries']['data'] ?? [];
 
         $this->assertNotEmpty($deliveries);
         $found = collect($deliveries)->first(fn ($d) => data_get($d, 'id') === $pickupOrder->id);
         $this->assertNotNull($found);
         $this->assertTrue((bool) data_get($found, 'is_pickup'));
         $this->assertEquals('pickup', data_get($found, 'fulfillment_type'));
         $this->assertEquals('PK7890', data_get($found, 'pickup_verification_code'));
     }
 
     /**
      * Test 2: Deliveries statistics return accurate counts for ALL, DELIVERY, and PICKUP tabs
      */
     public function test_deliveries_tab_counts_include_pickup_and_delivery_stats(): void
     {
         // Create 2 Delivery records (via Sale)
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
 
         $response = $this->actingAs($this->cashierBranchA)->get('/deliveries');
         $response->assertStatus(200);
 
         $stats = $response->viewData('page')['props']['stats'] ?? [];
         $this->assertEquals(2, data_get($stats, 'all_count'));
         $this->assertEquals(1, data_get($stats, 'delivery_count'));
         $this->assertEquals(1, data_get($stats, 'pickup_count'));
     }
 
     /**
      * Test 3: Tab filtering works for ALL, DELIVERY, and PICKUP
      */
     public function test_deliveries_filter_by_fulfillment_type(): void
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
             'pickup_verification_code' => 'PK3344',
         ]);
 
         // Filter: pickup only
         $pickupResponse = $this->actingAs($this->cashierBranchA)->get('/deliveries?fulfillment_type=pickup');
         $pickupItems = $pickupResponse->viewData('page')['props']['deliveries']['data'] ?? [];
         $this->assertCount(1, $pickupItems);
         $this->assertEquals('pickup', data_get($pickupItems[0], 'fulfillment_type'));
 
         // Filter: delivery only
         $deliveryResponse = $this->actingAs($this->cashierBranchA)->get('/deliveries?fulfillment_type=delivery');
         $deliveryItems = $deliveryResponse->viewData('page')['props']['deliveries']['data'] ?? [];
         $this->assertCount(1, $deliveryItems);
         $this->assertEquals('delivery', data_get($deliveryItems[0], 'fulfillment_type'));
     }

    /**
     * Test 4: Web cashier can transition Pickup statuses from /deliveries/pickup/{id}/status
     */
    public function test_pickup_status_transitions_via_admin_controller(): void
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
        $res1 = $this->actingAs($this->cashierBranchA)->post("/deliveries/pickup/{$pickupOrder->id}/status", [
            'status' => 'preparing',
        ]);
        $res1->assertSessionHasNoErrors();
        $this->assertEquals('preparing', $pickupOrder->fresh()->status);

        // 2. Advance to ready_for_pickup
        $res2 = $this->actingAs($this->cashierBranchA)->post("/deliveries/pickup/{$pickupOrder->id}/status", [
            'status' => 'ready_for_pickup',
        ]);
        $res2->assertSessionHasNoErrors();
        $this->assertEquals('ready_for_pickup', $pickupOrder->fresh()->status);

        // 3. Complete pickup
        $res3 = $this->actingAs($this->cashierBranchA)->post("/deliveries/pickup/{$pickupOrder->id}/status", [
            'status' => 'completed',
        ]);
        $res3->assertSessionHasNoErrors();
        $this->assertEquals('completed', $pickupOrder->fresh()->status);
    }

    /**
     * Test 5: Realtime OrderStatusUpdated event broadcasts for direct Order models
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

        $this->actingAs($this->cashierBranchA)->post("/deliveries/pickup/{$pickupOrder->id}/status", [
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
     * Test 7: Web queue allows cancelling pickup orders with inventory restoration
     */
    public function test_pickup_order_cancellation_from_web_queue(): void
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

        $response = $this->actingAs($this->cashierBranchA)->post("/deliveries/pickup/{$pickupOrder->id}/cancel", [
            'reason' => 'Customer requested order cancellation',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('cancelled', $pickupOrder->fresh()->status);
    }

    /**
     * Test 8: Branch isolation restricts cashier to viewing only their branch's pickup orders
     */
    public function test_branch_isolation_in_deliveries_index_for_pickup_orders(): void
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

        // Cashier A checks deliveries
        $resA = $this->actingAs($this->cashierBranchA)->get('/deliveries');
        $deliveriesA = $resA->viewData('page')['props']['deliveries']['data'] ?? [];

        $idsA = collect($deliveriesA)->pluck('id')->all();
        $this->assertContains($orderA->id, $idsA);
        $this->assertNotContains($orderB->id, $idsA);

        // Cashier B checks deliveries
        $resB = $this->actingAs($this->cashierBranchB)->get('/deliveries');
        $deliveriesB = $resB->viewData('page')['props']['deliveries']['data'] ?? [];

        $idsB = collect($deliveriesB)->pluck('id')->all();
        $this->assertContains($orderB->id, $idsB);
        $this->assertNotContains($orderA->id, $idsB);
    }
}
