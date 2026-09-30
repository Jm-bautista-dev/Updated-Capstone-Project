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

class InfiniteProductReviewPaginationTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $customer;
    protected Product $product;
    protected Product $emptyProduct;
    protected Order $order;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

        $this->branch = Branch::create(['name' => 'Victoria Branch', 'address' => 'Laguna']);
        $this->customer = User::factory()->create(['role' => 'customer']);

        $category = Category::create(['name' => 'Maki Rolls']);

        $this->product = Product::create([
            'name'          => 'California Maki Roll',
            'sku'           => 'MAKI-CAL-01',
            'category_id'   => $category->id,
            'selling_price' => 199.00,
            'status'        => 'in_stock',
        ]);

        $this->emptyProduct = Product::create([
            'name'          => 'Dragon Roll (Zero Reviews)',
            'sku'           => 'MAKI-DRG-00',
            'category_id'   => $category->id,
            'selling_price' => 250.00,
            'status'        => 'in_stock',
        ]);

        $this->order = Order::create([
            'order_number'    => 'ORD-INF-TEST-01',
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

    private function createReview(Product $product, int $rating, string $comment, string $status = ProductReview::STATUS_PUBLISHED): ProductReview
    {
        $orderItem = OrderItem::create([
            'order_id'   => $this->order->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'price'      => $product->selling_price,
            'subtotal'   => $product->selling_price,
        ]);

        return ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $product->id,
            'order_id'      => $this->order->id,
            'order_item_id' => $orderItem->id,
            'branch_id'     => $this->branch->id,
            'rating'        => $rating,
            'comment'       => $comment,
            'status'        => $status,
            'is_seen'       => true,
        ]);
    }

    /**
     * TEST 1: 0 Reviews (Empty State)
     */
    public function test_zero_reviews_returns_clean_empty_state_and_accurate_stats()
    {
        $response = $this->getJson("/api/v1/products/{$this->emptyProduct->id}/reviews");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'product_id'     => $this->emptyProduct->id,
                    'average_rating' => 0,
                    'review_count'   => 0,
                    'reviews'        => [],
                    'pagination'     => [
                        'current_page' => 1,
                        'last_page'    => 1,
                        'per_page'     => 15,
                        'total'        => 0,
                        'has_more'     => false,
                        'next_page'    => null,
                        'prev_page'    => null,
                    ]
                ]
            ]);
    }

    /**
     * TEST 2: 1 Review (Single review, has_more = false)
     */
    public function test_single_review_has_no_next_page()
    {
        $this->createReview($this->product, 5, 'Absolute perfection!');

        $response = $this->getJson("/api/v1/products/{$this->product->id}/reviews");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'product_id'     => $this->product->id,
                    'average_rating' => 5,
                    'review_count'   => 1,
                    'pagination'     => [
                        'current_page' => 1,
                        'last_page'    => 1,
                        'total'        => 1,
                        'has_more'     => false,
                        'next_page'    => null,
                    ]
                ]
            ]);

        $this->assertCount(1, $response->json('data.reviews'));
    }

    /**
     * TEST 3: Less than one page (e.g. 7 reviews with per_page = 15)
     */
    public function test_less_than_one_page_pagination()
    {
        for ($i = 1; $i <= 7; $i++) {
            $this->createReview($this->product, 5, "Review {$i}");
        }

        $response = $this->getJson("/api/v1/products/{$this->product->id}/reviews?per_page=15");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'pagination' => [
                        'current_page' => 1,
                        'last_page'    => 1,
                        'per_page'     => 15,
                        'total'        => 7,
                        'has_more'     => false,
                        'next_page'    => null,
                    ]
                ]
            ]);

        $this->assertCount(7, $response->json('data.reviews'));
    }

    /**
     * TEST 4: Exactly one page (15 reviews with per_page = 15)
     */
    public function test_exactly_one_page_has_no_more_pages()
    {
        for ($i = 1; $i <= 15; $i++) {
            $this->createReview($this->product, 4, "Review {$i}");
        }

        $response = $this->getJson("/api/v1/products/{$this->product->id}/reviews?per_page=15");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'pagination' => [
                        'current_page' => 1,
                        'last_page'    => 1,
                        'total'        => 15,
                        'has_more'     => false,
                        'next_page'    => null,
                    ]
                ]
            ]);

        $this->assertCount(15, $response->json('data.reviews'));
    }

    /**
     * TEST 5: Multiple pages (38 reviews with per_page = 15 -> 3 pages: 15, 15, 8)
     */
    public function test_multiple_pages_infinite_navigation()
    {
        for ($i = 1; $i <= 38; $i++) {
            $this->createReview($this->product, 5, "Review {$i}");
        }

        // Page 1
        $res1 = $this->getJson("/api/v1/products/{$this->product->id}/reviews?page=1&per_page=15");
        $res1->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'current_page' => 1,
                        'last_page'    => 3,
                        'total'        => 38,
                        'has_more'     => true,
                        'next_page'    => 2,
                        'prev_page'    => null,
                    ]
                ]
            ]);
        $this->assertCount(15, $res1->json('data.reviews'));

        // Page 2
        $res2 = $this->getJson("/api/v1/products/{$this->product->id}/reviews?page=2&per_page=15");
        $res2->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'current_page' => 2,
                        'last_page'    => 3,
                        'total'        => 38,
                        'has_more'     => true,
                        'next_page'    => 3,
                        'prev_page'    => 1,
                    ]
                ]
            ]);
        $this->assertCount(15, $res2->json('data.reviews'));

        // Page 3 (Final Page)
        $res3 = $this->getJson("/api/v1/products/{$this->product->id}/reviews?page=3&per_page=15");
        $res3->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'current_page' => 3,
                        'last_page'    => 3,
                        'total'        => 38,
                        'has_more'     => false,
                        'next_page'    => null,
                        'prev_page'    => 2,
                    ]
                ]
            ]);
        $this->assertCount(8, $res3->json('data.reviews'));
    }

    /**
     * TEST 6: Rating filter combined with infinite pagination
     */
    public function test_rating_filter_pagination()
    {
        // 20 5-star reviews, 10 1-star reviews
        for ($i = 1; $i <= 20; $i++) {
            $this->createReview($this->product, 5, "5 star review {$i}");
        }
        for ($j = 1; $j <= 10; $j++) {
            $this->createReview($this->product, 1, "1 star review {$j}");
        }

        // Filter 5-stars with per_page = 10 -> 2 pages of 10
        $resFiltered = $this->getJson("/api/v1/products/{$this->product->id}/reviews?rating=5&page=1&per_page=10");
        $resFiltered->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'current_page' => 1,
                        'last_page'    => 2,
                        'total'        => 20,
                        'has_more'     => true,
                        'next_page'    => 2,
                    ]
                ]
            ]);
        $this->assertCount(10, $resFiltered->json('data.reviews'));
    }

    /**
     * TEST 7: Cursor-based pagination mode
     */
    public function test_cursor_pagination_mode()
    {
        for ($i = 1; $i <= 25; $i++) {
            $this->createReview($this->product, 5, "Cursor review {$i}");
        }

        // Page 1 with cursor
        $res1 = $this->getJson("/api/v1/products/{$this->product->id}/reviews?cursor=first&per_page=10");
        $res1->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'mode'     => 'cursor',
                        'per_page' => 10,
                        'has_more' => true,
                    ]
                ]
            ]);
        $this->assertCount(10, $res1->json('data.reviews'));
        $nextCursor = $res1->json('data.pagination.next_cursor');
        $this->assertNotNull($nextCursor);

        // Page 2 using next_cursor
        $res2 = $this->getJson("/api/v1/products/{$this->product->id}/reviews?cursor={$nextCursor}&per_page=10");
        $res2->assertStatus(200)
            ->assertJson([
                'data' => [
                    'pagination' => [
                        'mode'     => 'cursor',
                        'per_page' => 10,
                        'has_more' => true,
                    ]
                ]
            ]);
        $this->assertCount(10, $res2->json('data.reviews'));
    }

    /**
     * TEST 8: 404 for invalid product ID
     */
    public function test_invalid_product_returns_404()
    {
        $response = $this->getJson('/api/v1/products/999999/reviews');
        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }
}
