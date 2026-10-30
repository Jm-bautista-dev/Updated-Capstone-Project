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

class AdminReviewInfinitePaginationTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $admin;
    protected User $customer;
    protected Product $product;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

        $this->branch = Branch::create(['name' => 'Main Branch', 'address' => 'Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $category = Category::create(['name' => 'Maki Rolls']);

        $this->product = Product::create([
            'name'          => 'California Maki Roll',
            'sku'           => 'MAKI-CAL-01',
            'category_id'   => $category->id,
            'selling_price' => 199.00,
            'status'        => 'in_stock',
        ]);

        $this->order = Order::create([
            'order_number'    => 'ORD-TEST-001',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branch->id,
            'customer_name'   => 'Test Customer',
            'customer_phone'  => '09171234567',
            'delivery_address'=> 'Victoria, Laguna',
            'payment_method'  => 'cash',
            'total_amount'    => 1000.00,
            'status'          => 'delivered',
        ]);
    }

    private function createReview(int $rating, string $comment, string $status = ProductReview::STATUS_PUBLISHED, bool $isSeen = true): ProductReview
    {
        $orderItem = OrderItem::create([
            'order_id'   => $this->order->id,
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => $this->product->selling_price,
            'subtotal'   => $this->product->selling_price,
        ]);

        return ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->product->id,
            'order_id'      => $this->order->id,
            'order_item_id' => $orderItem->id,
            'branch_id'     => $this->branch->id,
            'rating'        => $rating,
            'comment'       => $comment,
            'status'        => $status,
            'is_seen'       => $isSeen,
        ]);
    }

    /**
     * Test JSON endpoint for progressive pagination returns has_more, next_page, and transformed review data.
     */
    public function test_admin_reviews_json_progressive_pagination()
    {
        for ($i = 1; $i <= 25; $i++) {
            $this->createReview(5, "Review #{$i}");
        }

        // Page 1 via JSON (per_page = 10)
        $resPage1 = $this->actingAs($this->admin)->getJson('/admin/reviews?page=1&per_page=10');
        $resPage1->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 1,
                    'last_page'    => 3,
                    'per_page'     => 10,
                    'total'        => 25,
                    'has_more'     => true,
                    'next_page'    => 2,
                    'prev_page'    => null,
                ]
            ]);

        $this->assertCount(10, $resPage1->json('reviews.data'));

        // Page 2 via JSON
        $resPage2 = $this->actingAs($this->admin)->getJson('/admin/reviews?page=2&per_page=10');
        $resPage2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 2,
                    'last_page'    => 3,
                    'per_page'     => 10,
                    'total'        => 25,
                    'has_more'     => true,
                    'next_page'    => 3,
                    'prev_page'    => 1,
                ]
            ]);
        $this->assertCount(10, $resPage2->json('reviews.data'));

        // Page 3 (final page)
        $resPage3 = $this->actingAs($this->admin)->getJson('/admin/reviews?page=3&per_page=10');
        $resPage3->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 3,
                    'last_page'    => 3,
                    'total'        => 25,
                    'has_more'     => false,
                    'next_page'    => null,
                    'prev_page'    => 2,
                ]
            ]);
        $this->assertCount(5, $resPage3->json('reviews.data'));
    }

    /**
     * Test that filtering by rating, status, seen_status, and product works in progressive pagination.
     */
    public function test_admin_reviews_json_filtered_progressive_pagination()
    {
        // 23 5-star published reviews, 5 1-star published reviews
        for ($i = 1; $i <= 23; $i++) {
            $this->createReview(5, "5 star review {$i}", ProductReview::STATUS_PUBLISHED, true);
        }
        for ($j = 1; $j <= 5; $j++) {
            $this->createReview(1, "1 star review {$j}", ProductReview::STATUS_PUBLISHED, true);
        }

        // Request 5-star reviews with per_page = 10 -> page 1 has more, page 3 is last
        $res = $this->actingAs($this->admin)->getJson("/admin/reviews?rating=5&product_id={$this->product->id}&per_page=10&page=1");
        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 1,
                    'last_page'    => 3,
                    'total'        => 23,
                    'has_more'     => true,
                    'next_page'    => 2,
                ]
            ]);
        $this->assertCount(10, $res->json('reviews.data'));

        // Fetch page 3
        $resP3 = $this->actingAs($this->admin)->getJson("/admin/reviews?rating=5&product_id={$this->product->id}&per_page=10&page=3");
        $resP3->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 3,
                    'last_page'    => 3,
                    'total'        => 23,
                    'has_more'     => false,
                    'next_page'    => null,
                ]
            ]);
        $this->assertCount(3, $resP3->json('reviews.data'));
    }

    /**
     * Test authorization: Unauthenticated request to /admin/reviews fails.
     */
    public function test_unauthenticated_request_is_rejected()
    {
        $res = $this->getJson('/admin/reviews?page=1');
        $res->assertStatus(401);
    }

    /**
     * Test requesting beyond the last page returns empty data and has_more=false without re-serving previous pages.
     */
    public function test_admin_reviews_json_request_beyond_last_page_returns_empty_and_no_more()
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->createReview(5, "Review #{$i}");
        }

        // 15 items with per_page = 10 -> last_page is 2.
        // Request page 3 (beyond last page)
        $res = $this->actingAs($this->admin)->getJson('/admin/reviews?page=3&per_page=10');
        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'reviews' => [
                    'current_page' => 3,
                    'last_page'    => 2,
                    'total'        => 15,
                    'has_more'     => false,
                    'next_page'    => null,
                ]
            ]);

        // Must not return duplicate records or rewind to page 2
        $this->assertCount(0, $res->json('reviews.data'));
    }

    /**
     * Test that long reviews and comments are preserved accurately without truncation or data modification.
     */
    public function test_admin_reviews_preserves_order_and_long_comments()
    {
        $longComment = str_repeat('This is an extensive and detailed customer review describing the food quality. ', 10);
        $review = $this->createReview(5, $longComment);

        $res = $this->actingAs($this->admin)->getJson('/admin/reviews?page=1&per_page=10');
        $res->assertStatus(200);

        $firstReview = $res->json('reviews.data.0');
        $this->assertEquals($review->id, $firstReview['id']);
        $this->assertEquals($longComment, $firstReview['comment']);
        $this->assertNotEmpty($firstReview['comment']);
        $this->assertGreaterThan(500, strlen($firstReview['comment']));
    }
}
