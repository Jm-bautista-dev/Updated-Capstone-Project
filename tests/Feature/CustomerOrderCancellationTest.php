<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Models\Category;
use App\Models\Branch;
use App\Models\Delivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use App\Events\OrderStatusUpdated;

class CustomerOrderCancellationTest extends TestCase
{
    use RefreshDatabase;

    public User $testCustomer;
    public User $otherCustomer;
    public Branch $testBranch;
    public Category $testCategory;
    public Product $testProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name' => 'Main Branch',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Bento Boxes',
        ]);

        $this->testCustomer = User::factory()->create([
            'role' => 'customer',
            'must_change_password' => false,
        ]);

        $this->otherCustomer = User::factory()->create([
            'role' => 'customer',
            'must_change_password' => false,
        ]);

        $this->testProduct = Product::create([
            'name' => 'Chicken Teriyaki Bento',
            'sku' => 'SKU-CTB-1',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'cost_price' => 80.00,
            'branch_id' => $this->testBranch->id,
            'unit' => 'pcs',
            'stock' => 10,
        ]);
    }

    /**
     * Test successful cancellation of pending order with stock restoration and broadcasting.
     */
    public function test_customer_can_cancel_pending_order_successfully()
    {
        Event::fake([OrderStatusUpdated::class]);

        $order = Order::create([
            'user_id' => $this->testCustomer->id,
            'branch_id' => $this->testBranch->id,
            'customer_name' => 'Jane Doe',
            'contact_number' => '09171234567',
            'address' => '123 Main Street',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'total_amount' => 300.00,
            'status' => 'pending',
        ]);

        $order->items()->create([
            'product_id' => $this->testProduct->id,
            'quantity' => 2,
            'price' => 150.00,
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'customer_name' => 'Jane Doe',
            'customer_phone' => '09171234567',
            'customer_address' => '123 Main Street',
            'delivery_type' => 'internal',
            'status' => 'waiting_for_kitchen',
        ]);

        $response = $this->actingAs($this->testCustomer, 'sanctum')
            ->postJson("/api/v1/customer/orders/{$order->id}/cancel", [
                'reason' => 'Changed my mind',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Order cancelled successfully.',
                'order' => [
                    'id' => $order->id,
                    'status' => 'cancelled',
                    'status_label' => 'Cancelled',
                ]
            ]);

        // Verify Order in DB
        $order->refresh();
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals('Changed my mind', $order->cancellation_reason);
        $this->assertNotNull($order->cancelled_at);

        // Verify Delivery in DB
        $delivery->refresh();
        $this->assertEquals('cancelled', $delivery->status);

        // Verify Stock Restored (10 original + 2 restored = 12)
        $this->testProduct->refresh();
        $this->assertEquals(12, (float) $this->testProduct->stock);

        // Verify WebSocket Event Fired
        Event::assertDispatched(OrderStatusUpdated::class);
    }

    /**
     * Test rejection when order status is already in preparing/cooking stage.
     */
    public function test_customer_cannot_cancel_preparing_order()
    {
        $order = Order::create([
            'user_id' => $this->testCustomer->id,
            'branch_id' => $this->testBranch->id,
            'customer_name' => 'Jane Doe',
            'contact_number' => '09171234567',
            'address' => '123 Main Street',
            'total_amount' => 150.00,
            'status' => 'preparing',
        ]);

        $response = $this->actingAs($this->testCustomer, 'sanctum')
            ->postJson("/api/v1/customer/orders/{$order->id}/cancel", [
                'reason' => 'Too late',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Order cannot be cancelled because the kitchen has already started preparing it.',
            ]);

        $order->refresh();
        $this->assertEquals('preparing', $order->status);
    }

    /**
     * Test 404 response when attempting to cancel another customer's order.
     */
    public function test_customer_cannot_cancel_other_users_order()
    {
        $order = Order::create([
            'user_id' => $this->testCustomer->id,
            'branch_id' => $this->testBranch->id,
            'customer_name' => 'Jane Doe',
            'contact_number' => '09171234567',
            'address' => '123 Main Street',
            'total_amount' => 150.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->otherCustomer, 'sanctum')
            ->postJson("/api/v1/customer/orders/{$order->id}/cancel");

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Order not found or unauthorized.',
            ]);
    }

    /**
     * Test cancellation dispatches OrderStatusUpdated event targeting admin.orders and branch.orders channels.
     */
    public function test_cancellation_broadcasts_event_with_admin_and_branch_channels()
    {
        Event::fake([OrderStatusUpdated::class]);

        $order = Order::create([
            'user_id' => $this->testCustomer->id,
            'branch_id' => $this->testBranch->id,
            'order_number' => 'ORD-19',
            'customer_name' => 'Jane Doe',
            'total_amount' => 150.00,
            'status' => 'pending',
        ]);

        $delivery = Delivery::create([
            'order_id' => $order->id,
            'customer_name' => 'Jane Doe',
            'customer_address' => '123 Main Street',
            'delivery_type' => 'internal',
            'status' => 'waiting_for_kitchen',
        ]);

        $this->actingAs($this->testCustomer, 'sanctum')
            ->postJson("/api/v1/customer/orders/{$order->id}/cancel");

        Event::assertDispatched(OrderStatusUpdated::class, function ($event) use ($order) {
            $channels = collect($event->broadcastOn())->map(fn($c) => $c->name)->toArray();
            return in_array('private-admin.orders', $channels) &&
                   in_array("private-branch.{$this->testBranch->id}.orders", $channels) &&
                   $event->delivery->order_id === $order->id &&
                   $event->delivery->status === 'cancelled';
        });
    }
}
