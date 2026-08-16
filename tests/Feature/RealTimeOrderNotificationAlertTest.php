<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RealTimeOrderNotificationAlertTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $staCruz;
    protected Branch $victoria;
    protected User $admin;
    protected User $cashierSC;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->staCruz  = Branch::create(['name' => 'Maki Desu Sta Cruz', 'address' => 'Sta Cruz']);
        $this->victoria = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria']);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->staCruz->id,
        ]);

        $this->cashierSC = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->staCruz->id,
        ]);

        $this->product = Product::create([
            'name' => 'California Roll',
            'selling_price' => 150.00,
            'cost_price' => 50.00,
            'sku' => 'CAL-001',
        ]);
    }

    public function test_1_order_created_event_broadcasts_correct_payload_structure()
    {
        $order = Order::create([
            'order_number' => 'ORD-19',
            'user_id' => $this->cashierSC->id,
            'branch_id' => $this->staCruz->id,
            'customer_name' => 'Mark Lumerio',
            'total_amount' => 469.50,
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $this->product->id,
            'quantity' => 3,
            'price' => 150.00,
        ]);

        $event = new OrderCreated($order->fresh(['branch', 'items']));
        $payload = $event->broadcastWith();

        $this->assertEquals($order->id, $payload['order_id']);
        $this->assertEquals('ORD-19', $payload['order_number']);
        $this->assertEquals($this->staCruz->id, $payload['branch_id']);
        $this->assertEquals('Mark Lumerio', $payload['customer_name']);
        $this->assertEquals(469.50, $payload['total_amount']);
        $this->assertEquals(1, $payload['items_count']);
        $this->assertEquals('Maki Desu Sta Cruz', $payload['branch_name']);
    }

    public function test_2_order_created_event_broadcasts_on_admin_and_branch_specific_channels()
    {
        $order = Order::create([
            'order_number' => 'ORD-20',
            'user_id' => $this->cashierSC->id,
            'branch_id' => $this->staCruz->id,
            'customer_name' => 'Jane Doe',
            'total_amount' => 300.00,
            'status' => 'pending',
        ]);

        $event = new OrderCreated($order);
        $channels = array_map(fn ($c) => $c->name, $event->broadcastOn());

        $this->assertContains('private-admin.orders', $channels);
        $this->assertContains("private-branch.{$this->staCruz->id}.orders", $channels);
        $this->assertNotContains("private-branch.{$this->victoria->id}.orders", $channels);
    }

    public function test_3_multiple_orders_broadcast_with_unique_database_order_ids()
    {
        $order1 = Order::create([
            'order_number' => 'ORD-21',
            'branch_id' => $this->staCruz->id,
            'customer_name' => 'Customer A',
            'total_amount' => 100.00,
            'status' => 'pending',
        ]);

        $order2 = Order::create([
            'order_number' => 'ORD-22',
            'branch_id' => $this->staCruz->id,
            'customer_name' => 'Customer B',
            'total_amount' => 200.00,
            'status' => 'pending',
        ]);

        $payload1 = (new OrderCreated($order1))->broadcastWith();
        $payload2 = (new OrderCreated($order2))->broadcastWith();

        $this->assertNotEquals($payload1['order_id'], $payload2['order_id']);
        $this->assertEquals('ORD-21', $payload1['order_number']);
        $this->assertEquals('ORD-22', $payload2['order_number']);
    }
}
