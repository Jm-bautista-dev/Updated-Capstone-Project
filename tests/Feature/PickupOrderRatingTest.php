<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PickupOrderRatingTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected User $otherCustomer;
    protected Product $productA;
    protected Product $productB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

        $this->branch = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
            'name'      => 'Juan Dela Cruz',
        ]);

        $this->otherCustomer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
            'name'      => 'Maria Santos',
        ]);

        $cat = Category::create(['name' => 'Maki Rolls']);

        $this->productA = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'MAKI-CAL',
            'category_id'   => $cat->id,
            'selling_price' => 189.00,
            'stock'         => 50,
            'status'        => 'in_stock',
            'is_available'  => true,
        ]);

        $this->productB = Product::create([
            'name'          => 'Spicy Tuna Maki',
            'sku'           => 'MAKI-ST',
            'category_id'   => $cat->id,
            'selling_price' => 210.00,
            'stock'         => 30,
            'status'        => 'in_stock',
            'is_available'  => true,
        ]);
    }

    public function test_eligible_reviews_endpoint_includes_completed_and_picked_up_pickup_orders()
    {
        Sanctum::actingAs($this->customer);

        // 1. Pickup order: completed
        $pickupOrderCompleted = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'completed',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 189.00,
            'pickup_completed_at' => now(),
        ]);
        $item1 = OrderItem::create([
            'order_id'     => $pickupOrderCompleted->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        // 2. Pickup order: picked_up
        $pickupOrderPickedUp = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'picked_up',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 210.00,
            'pickup_completed_at' => now(),
        ]);
        $item2 = OrderItem::create([
            'order_id'     => $pickupOrderPickedUp->id,
            'product_id'   => $this->productB->id,
            'product_name' => $this->productB->name,
            'quantity'     => 1,
            'unit_price'   => 210.00,
            'line_total'   => 210.00,
            'price'        => 210.00,
        ]);

        // 3. Pickup order: preparing (NOT eligible)
        $pickupOrderPreparing = Order::create([
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'status'           => 'preparing',
            'customer_name'    => $this->customer->name,
            'contact_number'   => '09171112222',
            'total_amount'     => 189.00,
        ]);
        $itemNotEligible = OrderItem::create([
            'order_id'     => $pickupOrderPreparing->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        // 4. Delivery order: delivered (eligible)
        $deliveryOrderDelivered = Order::create([
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'status'           => 'delivered',
            'customer_name'    => $this->customer->name,
            'contact_number'   => '09171112222',
            'address'          => 'Victoria, Laguna',
            'total_amount'     => 189.00,
        ]);
        $item3 = OrderItem::create([
            'order_id'     => $deliveryOrderDelivered->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        $response = $this->getJson('/api/v1/customer/eligible-reviews');
        $response->assertOk()
            ->assertJson(['success' => true]);

        $data = $response->json('data');
        $itemIds = collect($data)->pluck('order_item_id')->toArray();

        $this->assertContains($item1->id, $itemIds);
        $this->assertContains($item2->id, $itemIds);
        $this->assertContains($item3->id, $itemIds);
        $this->assertNotContains($itemNotEligible->id, $itemIds);
    }

    public function test_customer_can_submit_rating_for_completed_pickup_order()
    {
        Sanctum::actingAs($this->customer);

        $order = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'completed',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 189.00,
            'pickup_completed_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        $response = $this->postJson('/api/v1/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->productA->id,
            'rating'        => 5,
            'comment'       => 'Fresh maki roll picked up on time!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'rating'  => 5,
                    'comment' => 'Fresh maki roll picked up on time!',
                ]
            ]);

        $this->assertDatabaseHas('product_reviews', [
            'user_id'       => $this->customer->id,
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->productA->id,
            'rating'        => 5,
            'comment'       => 'Fresh maki roll picked up on time!',
        ]);
    }

    public function test_customer_can_submit_rating_for_picked_up_status_order()
    {
        Sanctum::actingAs($this->customer);

        $order = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'picked_up',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 210.00,
            'pickup_completed_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productB->id,
            'product_name' => $this->productB->name,
            'quantity'     => 1,
            'unit_price'   => 210.00,
            'line_total'   => 210.00,
            'price'        => 210.00,
        ]);

        $response = $this->postJson('/api/v1/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->productB->id,
            'rating'        => 4,
            'comment'       => null,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'rating'         => 4,
                    'admin_response' => 'Thank you for your feedback!',
                ]
            ]);

        $this->assertDatabaseHas('product_reviews', [
            'user_id'        => $this->customer->id,
            'order_id'       => $order->id,
            'order_item_id'  => $orderItem->id,
            'product_id'     => $this->productB->id,
            'rating'         => 4,
            'admin_response' => 'Thank you for your feedback!',
        ]);
    }

    public function test_rating_submission_is_rejected_for_uncompleted_pickup_order()
    {
        Sanctum::actingAs($this->customer);

        $order = Order::create([
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'status'           => 'ready_for_pickup',
            'customer_name'    => $this->customer->name,
            'contact_number'   => '09171112222',
            'total_amount'     => 189.00,
        ]);

        $orderItem = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        $response = $this->postJson('/api/v1/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->productA->id,
            'rating'        => 5,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);

        $this->assertDatabaseMissing('product_reviews', [
            'order_id' => $order->id,
        ]);
    }

    public function test_customer_cannot_rate_another_customers_pickup_order()
    {
        Sanctum::actingAs($this->otherCustomer);

        $order = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'completed',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 189.00,
            'pickup_completed_at' => now(),
        ]);

        $orderItem = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        $response = $this->postJson('/api/v1/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->productA->id,
            'rating'        => 5,
        ]);

        $response->assertStatus(403);
    }

    public function test_customer_order_show_endpoint_returns_accurate_can_rate_and_review_data()
    {
        Sanctum::actingAs($this->customer);

        $order = Order::create([
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'status'              => 'completed',
            'customer_name'       => $this->customer->name,
            'contact_number'      => '09171112222',
            'total_amount'        => 399.00,
            'pickup_completed_at' => now(),
        ]);

        $item1 = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productA->id,
            'product_name' => $this->productA->name,
            'quantity'     => 1,
            'unit_price'   => 189.00,
            'line_total'   => 189.00,
            'price'        => 189.00,
        ]);

        $item2 = OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->productB->id,
            'product_name' => $this->productB->name,
            'quantity'     => 1,
            'unit_price'   => 210.00,
            'line_total'   => 210.00,
            'price'        => 210.00,
        ]);

        // Review item1 beforehand
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->productA->id,
            'order_id'      => $order->id,
            'order_item_id' => $item1->id,
            'branch_id'     => $this->branch->id,
            'rating'        => 5,
            'comment'       => 'Super tasty!',
            'status'        => ProductReview::STATUS_PUBLISHED,
        ]);

        $response = $this->getJson("/api/v1/customer/orders/{$order->id}");
        $response->assertOk()
            ->assertJson([
                'success' => true,
                'data'    => [
                    'id'               => $order->id,
                    'fulfillment_type' => 'pickup',
                    'status'           => 'completed',
                    'can_rate'         => true,
                ]
            ]);

        $items = $response->json('data.items');
        $item1Response = collect($items)->firstWhere('id', $item1->id);
        $item2Response = collect($items)->firstWhere('id', $item2->id);

        // Item 1 has already been reviewed -> can_rate: false, is_reviewed: true
        $this->assertFalse($item1Response['can_rate']);
        $this->assertTrue($item1Response['is_reviewed']);
        $this->assertEquals(5, $item1Response['review']['rating']);
        $this->assertEquals('Super tasty!', $item1Response['review']['comment']);

        // Item 2 has NOT been reviewed -> can_rate: true, is_reviewed: false
        $this->assertTrue($item2Response['can_rate']);
        $this->assertFalse($item2Response['is_reviewed']);
        $this->assertNull($item2Response['review']);
    }
}
