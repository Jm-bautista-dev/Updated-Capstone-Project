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
use Tests\TestCase;

class ProductReviewMasterAndSeenStatusTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $admin;
    protected User $cashierVictoria;
    protected User $customer;
    protected Product $productA;
    protected Product $productB;
    protected Product $productC;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

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

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $cat = Category::create(['name' => 'Main Dishes']);

        // Product A: 2 reviews (5 star + 4 star), both unseen
        $this->productA = Product::create([
            'name'          => 'Product A (With Reviews)',
            'sku'           => 'PRD-A',
            'category_id'   => $cat->id,
            'selling_price' => 120.00,
            'status'        => 'in_stock',
        ]);

        // Product B: 1 review (already seen)
        $this->productB = Product::create([
            'name'          => 'Product B (Seen Review)',
            'sku'           => 'PRD-B',
            'category_id'   => $cat->id,
            'selling_price' => 200.00,
            'status'        => 'in_stock',
        ]);

        // Product C: 0 reviews (Master catalog test)
        $this->productC = Product::create([
            'name'          => 'Product C (Zero Reviews)',
            'sku'           => 'PRD-C',
            'category_id'   => $cat->id,
            'selling_price' => 90.00,
            'status'        => 'in_stock',
        ]);

        // Verified Order for Product A
        $orderA = Order::create([
            'order_number'    => 'ORD-101',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Alice Customer',
            'customer_phone'  => '09123456789',
            'delivery_address'=> 'Victoria',
            'payment_method'  => 'online',
            'total_amount'    => 240.00,
            'status'          => 'delivered',
        ]);

        $orderItemA1 = OrderItem::create([
            'order_id'   => $orderA->id,
            'product_id' => $this->productA->id,
            'quantity'   => 1,
            'price'      => 120.00,
            'subtotal'   => 120.00,
        ]);

        $orderItemA2 = OrderItem::create([
            'order_id'   => $orderA->id,
            'product_id' => $this->productA->id,
            'quantity'   => 1,
            'price'      => 120.00,
            'subtotal'   => 120.00,
        ]);

        $orderItemB = OrderItem::create([
            'order_id'   => $orderA->id,
            'product_id' => $this->productB->id,
            'quantity'   => 1,
            'price'      => 200.00,
            'subtotal'   => 200.00,
        ]);

        // Reviews for Product A
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->productA->id,
            'order_id'      => $orderA->id,
            'order_item_id' => $orderItemA1->id,
            'branch_id'     => $this->victoria->id,
            'rating'        => 5,
            'comment'       => 'Delicious California Roll!',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->productA->id,
            'order_id'      => $orderA->id,
            'order_item_id' => $orderItemA2->id,
            'branch_id'     => $this->victoria->id,
            'rating'        => 4,
            'comment'       => 'Fresh and quick delivery.',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        // Review for Product B (already seen)
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->productB->id,
            'order_id'      => $orderA->id,
            'order_item_id' => $orderItemB->id,
            'branch_id'     => $this->victoria->id,
            'rating'        => 3,
            'comment'       => 'Good value.',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => true,
            'seen_at'       => now()->subDay(),
            'seen_by'       => $this->admin->id,
        ]);
    }

    public function test_all_products_visible_including_zero_reviews_in_master_list()
    {
        $response = $this->actingAs($this->admin)->get('/admin/reviews');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Admin/Reviews')
            ->has('productList', 3)
            // Product A has 2 reviews, 2 unseen, 4.5 avg rating
            ->where('productList.0.id', $this->productA->id)
            ->where('productList.0.total_reviews', 2)
            ->where('productList.0.unseen_count', 2)
            ->where('productList.0.average_rating', 4.5)
            // Product B has 1 review, 0 unseen, 3.0 avg rating
            ->where('productList.1.id', $this->productB->id)
            ->where('productList.1.total_reviews', 1)
            ->where('productList.1.unseen_count', 0)
            // Product C has 0 reviews, 0 unseen, 0 avg rating
            ->where('productList.2.id', $this->productC->id)
            ->where('productList.2.total_reviews', 0)
            ->where('productList.2.unseen_count', 0)
            ->where('productList.2.average_rating', 0)
            // Global stats
            ->where('stats.total_products', 3)
            ->where('stats.total_reviews', 3)
            ->where('stats.unseen_reviews', 2)
        );
    }

    public function test_mark_product_reviews_as_seen_clears_unseen_count()
    {
        // 1. Initially Product A has 2 unseen reviews
        $this->assertEquals(2, ProductReview::where('product_id', $this->productA->id)->where('is_seen', false)->count());

        // 2. Mark Product A reviews as seen
        $response = $this->actingAs($this->admin)->postJson("/admin/reviews/products/{$this->productA->id}/mark-seen");

        $response->assertStatus(200);
        $response->assertJson([
            'success'       => true,
            'product_id'    => $this->productA->id,
            'updated_count' => 2,
        ]);

        // 3. Database assertion: all reviews for Product A are now is_seen = 1
        $this->assertEquals(0, ProductReview::where('product_id', $this->productA->id)->where('is_seen', false)->count());
        $this->assertEquals(2, ProductReview::where('product_id', $this->productA->id)->where('is_seen', true)->count());

        // 4. Loading reviews again confirms unseen_count is 0
        $responseIndex = $this->actingAs($this->admin)->get('/admin/reviews');
        $responseIndex->assertInertia(fn ($page) => $page
            ->where('productList.0.unseen_count', 0)
            ->where('stats.unseen_reviews', 0)
        );
    }

    public function test_verified_purchase_indicator_and_moderation_actions()
    {
        $review = ProductReview::where('product_id', $this->productA->id)->first();

        // 1. Assert review data includes is_verified_purchase and order_number
        $response = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productA->id);
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('reviews.data', 2)
            ->where('reviews.data.0.is_verified_purchase', true)
            ->where('reviews.data.0.order_number', 'ORD-101')
        );

        // 2. Admin replies to review
        $replyResponse = $this->actingAs($this->admin)->post("/admin/reviews/{$review->id}/respond", [
            'response' => 'Thank you for your wonderful feedback!',
        ]);
        $replyResponse->assertRedirect();

        $this->assertDatabaseHas('product_reviews', [
            'id'             => $review->id,
            'admin_response' => 'Thank you for your wonderful feedback!',
        ]);

        // 3. Admin hides review
        $hideResponse = $this->actingAs($this->admin)->put("/admin/reviews/{$review->id}/status", [
            'status' => 'hidden',
        ]);
        $hideResponse->assertRedirect();

        $this->assertDatabaseHas('product_reviews', [
            'id'     => $review->id,
            'status' => 'hidden',
        ]);
    }
}
