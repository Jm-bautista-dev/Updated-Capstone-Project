<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

class RealTimeMobileOrderSyncTest extends TestCase
{
    use RefreshDatabase;

    public User $customerUser;
    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $foodCategory;
    public Product $testProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->foodCategory = Category::create([
            'name' => 'Ramen & Bento',
        ]);

        $this->customerUser = User::factory()->create([
            'role' => 'customer',
            'must_change_password' => false,
        ]);

        $this->testProduct = Product::create([
            'name' => 'Tonkotsu Ramen',
            'sku' => 'SKU-TR-100',
            'category_id' => $this->foodCategory->id,
            'selling_price' => 250.00,
            'cost_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
            'stock' => 50,
        ]);
    }

    /**
     * Test successful mobile order creation dispatches real-time OrderCreated event post-commit.
     */
    public function test_mobile_order_creation_dispatches_realtime_order_created_event_post_commit()
    {
        Event::fake([OrderCreated::class, OrderStatusUpdated::class]);

        $payload = [
            'customer_name' => 'Jane Doe',
            'mobile_number' => '09171234567',
            'address'       => '123 Rizal Avenue, Sta Cruz',
            'latitude'      => 14.5995,
            'longitude'     => 120.9842,
            'landmark'      => 'Near Plaza',
            'notes'         => 'Extra spicy broth',
            'branch_id'     => $this->branchSantaCruz->id,
            'total_amount'  => 500.00,
            'delivery_fee'  => 50.00,
            'items'         => [
                [
                    'product_id' => $this->testProduct->id,
                    'quantity'   => 2,
                    'price'      => 250.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->customerUser, 'sanctum')
            ->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Order placed successfully',
            ]);

        $orderId = $response->json('order_id');
        $this->assertNotNull($orderId);

        // Verify Order in DB
        $order = Order::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals('pending', $order->status);

        // Verify OrderCreated Event Dispatched
        Event::assertDispatched(OrderCreated::class, function ($event) use ($orderId) {
            return $event->order->id === $orderId
                && $event->order->branch_id === $this->branchSantaCruz->id;
        });

        // Verify OrderStatusUpdated Event Dispatched
        Event::assertDispatched(OrderStatusUpdated::class);
    }

    /**
     * Test OrderCreated event channels: admin.orders and branch-specific orders channel.
     */
    public function test_order_created_event_broadcasts_on_admin_and_branch_specific_channels()
    {
        $order = Order::create([
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Jane Doe',
            'contact_number' => '09171234567',
            'address' => '123 Main St',
            'total_amount' => 500.00,
            'status' => 'pending',
        ]);

        $event = new OrderCreated($order->load('branch'));
        $channels = $event->broadcastOn();

        $channelNames = array_map(fn($ch) => $ch->name, $channels);

        $this->assertContains('private-admin.orders', $channelNames);
        $this->assertContains('private-branch.' . $this->branchSantaCruz->id . '.orders', $channelNames);
        $this->assertNotContains('private-branch.' . $this->branchVictoria->id . '.orders', $channelNames);
    }

    /**
     * Test OrderCreated event broadcast payload contains required data fields.
     */
    public function test_order_created_event_payload_structure()
    {
        $order = Order::create([
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Jane Doe',
            'contact_number' => '09171234567',
            'address' => '123 Main St',
            'total_amount' => 500.00,
            'status' => 'pending',
        ]);

        $event = new OrderCreated($order->load('branch'));
        $payload = $event->broadcastWith();

        $this->assertEquals($order->id, $payload['order_id']);
        $this->assertEquals($this->branchSantaCruz->id, $payload['branch_id']);
        $this->assertEquals('Jane Doe', $payload['customer_name']);
        $this->assertEquals(500.00, $payload['total_amount']);
        $this->assertEquals('MAKI DESU STA CRUZ', $payload['branch_name']);
    }
}
