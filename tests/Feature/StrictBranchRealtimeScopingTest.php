<?php

namespace Tests\Feature;

use App\Events\CancellationRequested;
use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderCancellationRequest;
use App\Models\Product;
use App\Models\User;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Tests\TestCase;

class StrictBranchRealtimeScopingTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $cashierVictoria;
    protected User $cashierSantaCruz;
    protected User $admin;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);
        $this->santaCruz = Branch::create(['name' => 'Maki Desu Santa Cruz', 'address' => 'Santa Cruz, Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->santaCruz->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);
    }

    public function test_order_created_broadcasts_only_to_private_authorized_channels()
    {
        $order = Order::create([
            'order_number'    => 'ORD-201',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Customer Victoria',
            'customer_phone'  => '09123456789',
            'delivery_address'=> 'Victoria',
            'payment_method'  => 'online',
            'total_amount'    => 500.00,
            'status'          => 'pending',
        ]);

        $event = new OrderCreated($order);
        $channels = $event->broadcastOn();

        $channelNames = array_map(fn($c) => $c->name, $channels);

        // Assert strictly private channels
        $this->assertContains('private-admin.orders', $channelNames);
        $this->assertContains("private-branch.{$this->victoria->id}.orders", $channelNames);

        // Assert NO public channels
        $this->assertNotContains('orders', $channelNames);
        $this->assertNotContains('deliveries', $channelNames);
    }

    public function test_order_status_updated_broadcasts_only_to_private_channels()
    {
        $order = Order::create([
            'order_number'    => 'ORD-202',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Customer Victoria',
            'customer_phone'  => '09123456789',
            'delivery_address'=> 'Victoria',
            'payment_method'  => 'online',
            'total_amount'    => 500.00,
            'status'          => 'preparing',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'status'           => 'preparing',
            'customer_name'    => 'Customer Victoria',
            'customer_phone'   => '09123456789',
            'customer_address' => 'Victoria',
            'tracking_no'      => 'TRK-202',
        ]);

        $event = new OrderStatusUpdated($delivery, 'preparing', 'Kitchen is preparing order');
        $channels = $event->broadcastOn();

        $channelNames = array_map(fn($c) => $c->name, $channels);

        // Assert private channels
        $this->assertContains('private-admin.orders', $channelNames);
        $this->assertContains("private-branch.{$this->victoria->id}.orders", $channelNames);
        $this->assertContains("private-customer.order.{$order->id}", $channelNames);

        // Assert NO public channels
        $this->assertNotContains('orders', $channelNames);
        $this->assertNotContains('deliveries', $channelNames);
    }

    public function test_cancellation_requested_broadcasts_only_to_private_channels()
    {
        $order = Order::create([
            'order_number'    => 'ORD-203',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Customer Victoria',
            'customer_phone'  => '09123456789',
            'delivery_address'=> 'Victoria',
            'payment_method'  => 'online',
            'total_amount'    => 500.00,
            'status'          => 'in_transit',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'status'           => 'in_transit',
            'customer_name'    => 'Customer Victoria',
            'customer_phone'   => '09123456789',
            'customer_address' => 'Victoria',
            'tracking_no'      => 'TRK-203',
        ]);

        $rider = \App\Models\Rider::create([
            'name'      => 'John Rider',
            'email'     => 'john.rider@example.com',
            'phone'     => '09123456780',
            'password'  => bcrypt('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'active',
        ]);

        $cancelReq = OrderCancellationRequest::create([
            'order_id'                => $order->id,
            'delivery_id'             => $delivery->id,
            'branch_id'               => $this->victoria->id,
            'requested_by_rider_id'   => $rider->id,
            'reason'                  => 'Customer unreachable at delivery address',
            'previous_order_status'   => 'in_transit',
            'previous_delivery_status'=> 'in_transit',
            'status'                  => 'pending',
            'requested_at'            => now(),
        ]);

        $event = new CancellationRequested($cancelReq);
        $channels = $event->broadcastOn();

        $channelNames = array_map(fn($c) => $c->name, $channels);

        $this->assertContains('private-admin.orders', $channelNames);
        $this->assertContains("private-branch.{$this->victoria->id}.orders", $channelNames);
        $this->assertNotContains('orders', $channelNames);
        $this->assertNotContains('deliveries', $channelNames);
    }

    public function test_channel_authorization_rules()
    {
        // 1. Victoria Cashier authorized for branch.victoria.orders
        $authVicForVic = $this->actingAs($this->cashierVictoria)->post('/broadcasting/auth', [
            'channel_name' => "private-branch.{$this->victoria->id}.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authVicForVic->assertStatus(200);

        // 2. Victoria Cashier FORBIDDEN for branch.santa_cruz.orders
        $authVicForSC = $this->actingAs($this->cashierVictoria)->post('/broadcasting/auth', [
            'channel_name' => "private-branch.{$this->santaCruz->id}.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authVicForSC->assertStatus(403);

        // 3. Victoria Cashier FORBIDDEN for admin.orders
        $authVicForAdmin = $this->actingAs($this->cashierVictoria)->post('/broadcasting/auth', [
            'channel_name' => "private-admin.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authVicForAdmin->assertStatus(403);

        // 4. Admin authorized for all channels
        $authAdminForAdmin = $this->actingAs($this->admin)->post('/broadcasting/auth', [
            'channel_name' => "private-admin.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authAdminForAdmin->assertStatus(200);

        $authAdminForVic = $this->actingAs($this->admin)->post('/broadcasting/auth', [
            'channel_name' => "private-branch.{$this->victoria->id}.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authAdminForVic->assertStatus(200);

        $authAdminForSC = $this->actingAs($this->admin)->post('/broadcasting/auth', [
            'channel_name' => "private-branch.{$this->santaCruz->id}.orders",
            'socket_id'    => '1234.5678',
        ]);
        $authAdminForSC->assertStatus(200);
    }
}
