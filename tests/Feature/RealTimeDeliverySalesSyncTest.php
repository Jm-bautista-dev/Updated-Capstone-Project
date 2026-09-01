<?php

namespace Tests\Feature;

use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
use App\Events\SaleCreated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RealTimeDeliverySalesSyncTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch1;
    protected Branch $branch2;
    protected User $admin;
    protected User $riderUser1;
    protected Rider $rider1;
    protected User $riderUser2;
    protected Rider $rider2;
    protected User $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create([
            'name'       => 'Victoria Branch',
            'code'       => 'VIC-01',
            'address'    => 'Victoria Laguna',
            'is_active'  => true,
        ]);

        $this->branch2 = Branch::create([
            'name'       => 'Santa Cruz Branch',
            'code'       => 'SC-01',
            'address'    => 'Santa Cruz Laguna',
            'is_active'  => true,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => null,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => $this->branch1->id,
        ]);

        $this->riderUser1 = User::factory()->create([
            'email'     => 'rider1@makidesu.com',
            'role'      => 'rider',
            'branch_id' => $this->branch1->id,
        ]);

        $this->rider1 = Rider::create([
            'user_id'        => $this->riderUser1->id,
            'name'           => 'Rider One',
            'email'          => 'rider1@makidesu.com',
            'password'       => bcrypt('password'),
            'phone'          => '09123456789',
            'branch_id'      => $this->branch1->id,
            'status'         => 'available',
            'is_active'      => true,
            'account_status' => 'active',
        ]);

        $this->riderUser2 = User::factory()->create([
            'email'     => 'rider2@makidesu.com',
            'role'      => 'rider',
            'branch_id' => $this->branch2->id,
        ]);

        $this->rider2 = Rider::create([
            'user_id'        => $this->riderUser2->id,
            'name'           => 'Rider Two',
            'email'          => 'rider2@makidesu.com',
            'password'       => bcrypt('password'),
            'phone'          => '09987654321',
            'branch_id'      => $this->branch2->id,
            'status'         => 'available',
            'is_active'      => true,
            'account_status' => 'active',
        ]);

        $category = Category::create(['name' => 'Sushi Rolls', 'is_active' => true]);
        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'selling_price' => 150.00,
            'cost_price'    => 20.00,
            'is_active'     => true,
        ]);

        $ingredient = Ingredient::create([
            'name' => 'Nori Sheets',
            'unit' => 'pcs',
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->branch1->id],
            ['stock' => 100, 'cost' => 10.00, 'low_stock_level' => 10]
        );

        $this->product->ingredients()->attach($ingredient->id, ['quantity_required' => 1]);
    }

    private function createAssignedOrderAndDelivery(): array
    {
        $order = Order::create([
            'order_number'        => 'ORD-101',
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch1->id,
            'status'              => 'assigned_to_rider',
            'customer_name'       => 'Jane Doe',
            'contact_number'      => '09111111111',
            'address'             => 'Poblacion Victoria',
            'total_amount'        => 350.00,
            'payment_method'      => 'cash',
            'order_type'          => 'delivery',
            'rider_id'            => $this->rider1->id,
            'inventory_deducted'  => false,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'price'      => 150.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'branch_id'        => $this->branch1->id,
            'rider_id'         => $this->rider1->id,
            'status'           => 'assigned_to_rider',
            'customer_name'    => $order->customer_name,
            'customer_phone'   => $order->contact_number,
            'customer_address' => $order->address,
            'delivery_fee'     => 50.00,
            'delivery_type'    => 'internal',
        ]);

        return [$order, $delivery];
    }

    /**
     * TEST 1: Assigned delivery → Rider marks PICKED_UP → Event broadcasted & DB updated.
     */
    public function test_rider_can_pickup_assigned_delivery_and_broadcasts_realtime(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        [$order, $delivery] = $this->createAssignedOrderAndDelivery();

        $response = $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/pickup");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
        $this->assertEquals('picked_up', $order->fresh()->status);
        $this->assertNotNull($delivery->fresh()->picked_up_at);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) use ($delivery) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $delivery->id
                && $payload['status'] === 'picked_up'
                && $payload['status_label'] === 'Picked Up'
                && $payload['rider_id'] === $this->rider1->id;
        });

        Event::assertDispatched(RiderStatusUpdated::class);
    }

    /**
     * TEST 2: Double pickup request → safe idempotency.
     */
    public function test_duplicate_pickup_is_idempotent_and_safe(): void
    {
        [$order, $delivery] = $this->createAssignedOrderAndDelivery();

        // First pickup
        $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/pickup")
            ->assertStatus(200);

        // Second pickup
        $response = $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/pickup");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('picked_up', $delivery->fresh()->status);
    }

    /**
     * TEST 3: Wrong rider attempts pickup → 404/403 rejected.
     */
    public function test_wrong_rider_cannot_pickup_delivery(): void
    {
        [$order, $delivery] = $this->createAssignedOrderAndDelivery();

        $response = $this->actingAs($this->riderUser2, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/pickup");

        $response->assertStatus(403);
        $this->assertEquals('assigned_to_rider', $delivery->fresh()->status);
    }

    /**
     * TEST 4: Rider starts transit (in_transit).
     */
    public function test_rider_can_start_transit_and_broadcasts(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        [$order, $delivery] = $this->createAssignedOrderAndDelivery();
        $delivery->update(['status' => 'picked_up']);
        $order->update(['status' => 'picked_up']);

        $response = $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/transit");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('in_transit', $delivery->fresh()->status);
        $this->assertEquals('in_transit', $order->fresh()->status);

        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) use ($delivery) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $delivery->id
                && $payload['status'] === 'in_transit'
                && $payload['status_label'] === 'In Transit';
        });
    }

    /**
     * TEST 5: Rider marks DELIVERED → Status becomes DELIVERED, Sale is created, SaleCreated and OrderStatusUpdated broadcast.
     */
    public function test_rider_delivers_order_recognizes_sale_and_broadcasts_realtime(): void
    {
        Event::fake([OrderStatusUpdated::class, SaleCreated::class, RiderStatusUpdated::class]);

        [$order, $delivery] = $this->createAssignedOrderAndDelivery();
        $delivery->update(['status' => 'in_transit']);
        $order->update(['status' => 'in_transit']);

        $response = $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/deliver");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $delivery->refresh();
        $order->refresh();

        $this->assertEquals('delivered', $delivery->status);
        $this->assertEquals('delivered', $order->status);
        $this->assertNotNull($delivery->delivered_at);
        $this->assertNotNull($delivery->sale_id);

        // Verify Sale created
        $sale = Sale::find($delivery->sale_id);
        $this->assertNotNull($sale);
        $this->assertEquals($order->id, $sale->order_id);
        $this->assertEquals($this->branch1->id, $sale->branch_id);
        $this->assertEquals(300.00, (float) $sale->subtotal);    // 2 x 150
        $this->assertEquals(50.00, (float) $sale->delivery_fee); // 50 delivery fee
        $this->assertEquals(350.00, (float) $sale->total);       // 350 total
        $this->assertEquals('completed', $sale->status);

        // Verify OrderStatusUpdated broadcast
        Event::assertDispatched(OrderStatusUpdated::class, function (OrderStatusUpdated $event) use ($delivery) {
            $payload = $event->broadcastWith();
            return $event->delivery->id === $delivery->id
                && $payload['status'] === 'delivered'
                && $payload['sale_id'] === $delivery->sale_id;
        });

        // Verify SaleCreated broadcast
        Event::assertDispatched(SaleCreated::class, function (SaleCreated $event) use ($sale) {
            $payload = $event->broadcastWith();
            $channels = array_map(fn($ch) => $ch->name, $event->broadcastOn());
            return $event->sale->id === $sale->id
                && in_array('private-admin.orders', $channels)
                && in_array('private-branch.' . $this->branch1->id . '.orders', $channels)
                && $payload['total'] === 350.00
                && $payload['subtotal'] === 300.00
                && $payload['delivery_fee'] === 50.00;
        });

        // Verify Rider status back to available
        $this->assertEquals('available', $this->rider1->fresh()->status);
    }

    /**
     * TEST 6: Double delivery request → exactly ONE Sale record created.
     */
    public function test_duplicate_delivered_request_creates_only_one_sale_record(): void
    {
        [$order, $delivery] = $this->createAssignedOrderAndDelivery();
        $delivery->update(['status' => 'in_transit']);
        $order->update(['status' => 'in_transit']);

        // First delivery request
        $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/deliver")
            ->assertStatus(200);

        $initialSaleCount = Sale::where('order_id', $order->id)->count();
        $this->assertEquals(1, $initialSaleCount);

        // Duplicate delivery request
        $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/deliver")
            ->assertStatus(200);

        $finalSaleCount = Sale::where('order_id', $order->id)->count();
        $this->assertEquals(1, $finalSaleCount, 'Must enforce idempotency and never create duplicate sales');
    }

    /**
     * TEST 7: Branch Isolation in Broadcast Channels.
     */
    public function test_branch_isolation_in_event_channels(): void
    {
        [$order, $delivery] = $this->createAssignedOrderAndDelivery();
        $delivery->update(['status' => 'in_transit']);
        $order->update(['status' => 'in_transit']);

        $event = new OrderStatusUpdated($delivery);
        $channels = array_map(fn($ch) => $ch->name, $event->broadcastOn());

        // Victoria branch delivery should broadcast to admin.orders and branch.1.orders
        $this->assertContains('private-admin.orders', $channels);
        $this->assertContains('private-branch.' . $this->branch1->id . '.orders', $channels);

        // Santa Cruz (branch 2) channel MUST NOT be present
        $this->assertNotContains('private-branch.' . $this->branch2->id . '.orders', $channels);
    }

    /**
     * TEST 8: POS walk-in delivery reaches financial completion.
     */
    public function test_pos_walk_in_delivery_flow_matches_sales_architecture(): void
    {
        Event::fake([OrderStatusUpdated::class, RiderStatusUpdated::class]);

        $sale = Sale::create([
            'order_number'   => 'POS-2026-001',
            'user_id'        => $this->admin->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'delivery',
            'subtotal'       => 300.00,
            'delivery_fee'   => 40.00,
            'total'          => 340.00,
            'cost_total'     => 50.00,
            'profit'         => 250.00,
            'paid_amount'    => 340.00,
            'change_amount'  => 0,
            'payment_method' => 'cash',
            'status'         => 'pending',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'branch_id'        => $this->branch1->id,
            'rider_id'         => $this->rider1->id,
            'status'           => 'in_transit',
            'customer_name'    => 'Walk-in Customer',
            'customer_address' => 'Victoria Center',
            'delivery_fee'     => 40.00,
            'delivery_type'    => 'internal',
        ]);

        $response = $this->actingAs($this->riderUser1, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$delivery->id}/deliver");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertEquals('delivered', $delivery->fresh()->status);
        $this->assertEquals('completed', $sale->fresh()->status);
    }
}
