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

class ProductReviewPaginationTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $admin;
    protected User $customer;
    protected Product $productKatsudon;
    protected Product $productMatcha;
    protected Product $productEmpty;
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
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $category = Category::create(['name' => 'Donburi']);

        $this->productKatsudon = Product::create([
            'name'          => 'Katsudon',
            'sku'           => 'DON-KATSU',
            'category_id'   => $category->id,
            'selling_price' => 180.00,
            'status'        => 'in_stock',
        ]);

        $this->productMatcha = Product::create([
            'name'          => 'Matcha Iced Tea',
            'sku'           => 'BEV-MATCHA',
            'category_id'   => $category->id,
            'selling_price' => 95.00,
            'status'        => 'in_stock',
        ]);

        $this->productEmpty = Product::create([
            'name'          => 'Gyu Don (Zero Reviews)',
            'sku'           => 'DON-GYU',
            'category_id'   => $category->id,
            'selling_price' => 220.00,
            'status'        => 'in_stock',
        ]);

        $this->order = Order::create([
            'order_number'    => 'ORD-TEST-999',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branch->id,
            'customer_name'   => 'Customer Test',
            'customer_phone'  => '09123456789',
            'delivery_address'=> 'Laguna',
            'payment_method'  => 'cash',
            'total_amount'    => 50000.00,
            'status'          => 'delivered',
        ]);
    }

    private function createReview(Product $product, int $rating, string $comment, bool $isSeen): ProductReview
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
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => $isSeen,
        ]);
    }

    /**
     * TEST 1: Server-side pagination with 87 reviews
     * Page size = 10.
     * Page 1 = 10 reviews
     * Page 2 = 10 reviews
     * Page 9 = 7 reviews
     */
    public function test_server_side_pagination_with_87_reviews()
    {
        // Seed 87 reviews for Katsudon (3 unseen, 84 seen; 50 are 5-star, 37 are 4-star)
        for ($i = 1; $i <= 87; $i++) {
            $this->createReview(
                $this->productKatsudon,
                $i <= 50 ? 5 : 4,
                "Review number {$i} for Katsudon",
                $i > 3 // 3 unseen
            );
        }

        // 1. Page 1: Should load exactly 10 reviews
        $resPage1 = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&page=1&per_page=10');
        $resPage1->assertStatus(200);
        $resPage1->assertInertia(fn ($page) => $page
            ->has('reviews.data', 10)
            ->where('reviews.current_page', 1)
            ->where('reviews.per_page', 10)
            ->where('reviews.total', 87)
            ->where('reviews.last_page', 9)
            ->where('reviews.from', 1)
            ->where('reviews.to', 10)
        );

        // 2. Page 2: Should load exactly 10 reviews (items 11–20)
        $resPage2 = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&page=2&per_page=10');
        $resPage2->assertStatus(200);
        $resPage2->assertInertia(fn ($page) => $page
            ->has('reviews.data', 10)
            ->where('reviews.current_page', 2)
            ->where('reviews.from', 11)
            ->where('reviews.to', 20)
        );

        // 3. Page 9 (Last page): Should load remaining 7 reviews (items 81–87)
        $resPage9 = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&page=9&per_page=10');
        $resPage9->assertStatus(200);
        $resPage9->assertInertia(fn ($page) => $page
            ->has('reviews.data', 7)
            ->where('reviews.current_page', 9)
            ->where('reviews.from', 81)
            ->where('reviews.to', 87)
        );
    }

    /**
     * TEST 2: Product switching behavior & Unseen Count Independence
     * Katsudon has 87 reviews (3 unseen).
     * Matcha has 3 reviews (0 unseen).
     * Loading Katsudon Page 2 still reports Katsudon total = 87, unseen = 3 in productList.
     */
    public function test_product_switching_and_accurate_unseen_counts()
    {
        for ($i = 1; $i <= 87; $i++) {
            $this->createReview(
                $this->productKatsudon,
                5,
                "Review {$i}",
                $i > 3 // 3 unseen
            );
        }

        for ($j = 1; $j <= 3; $j++) {
            $this->createReview(
                $this->productMatcha,
                4,
                "Matcha review {$j}",
                true
            );
        }

        $res = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&page=2&per_page=10');
        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page
            ->where('productList.0.id', $this->productEmpty->id)
            ->where('productList.1.id', $this->productKatsudon->id)
            ->where('productList.1.total_reviews', 87)
            ->where('productList.1.unseen_count', 3)
            ->where('productList.2.id', $this->productMatcha->id)
            ->where('productList.2.total_reviews', 3)
            ->where('productList.2.unseen_count', 0)
        );
    }

    /**
     * TEST 3: Filter combined with pagination
     * Filter 5 stars only (out of 87 reviews, 50 are 5-star, 37 are 4-star).
     */
    public function test_rating_filter_combined_with_pagination()
    {
        for ($i = 1; $i <= 87; $i++) {
            $this->createReview(
                $this->productKatsudon,
                $i <= 50 ? 5 : 4,
                "Review {$i}",
                true
            );
        }

        $res = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&rating=5&page=1&per_page=10');
        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page
            ->has('reviews.data', 10)
            ->where('reviews.total', 50)
            ->where('reviews.last_page', 5)
            ->where('reviews.data.0.rating', 5)
        );
    }

    /**
     * TEST 4: Page size options (10, 25, 50) and defense against huge values
     */
    public function test_per_page_options_and_sanitization()
    {
        for ($i = 1; $i <= 60; $i++) {
            $this->createReview(
                $this->productKatsudon,
                5,
                "Review {$i}",
                true
            );
        }

        // per_page = 25
        $res25 = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&per_page=25');
        $res25->assertInertia(fn ($page) => $page
            ->has('reviews.data', 25)
            ->where('reviews.per_page', 25)
            ->where('reviews.last_page', 3)
        );

        // per_page = 50
        $res50 = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&per_page=50');
        $res50->assertInertia(fn ($page) => $page
            ->has('reviews.data', 50)
            ->where('reviews.per_page', 50)
            ->where('reviews.last_page', 2)
        );

        // Huge invalid per_page = 1000000 falls back to 10
        $resHuge = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productKatsudon->id . '&per_page=1000000');
        $resHuge->assertInertia(fn ($page) => $page
            ->has('reviews.data', 10)
            ->where('reviews.per_page', 10)
        );
    }

    /**
     * TEST 5: Empty reviews product shows 0 reviews and total = 0
     */
    public function test_empty_reviews_product()
    {
        $res = $this->actingAs($this->admin)->get('/admin/reviews?product_id=' . $this->productEmpty->id);
        $res->assertStatus(200);
        $res->assertInertia(fn ($page) => $page
            ->has('reviews.data', 0)
            ->where('reviews.total', 0)
            ->where('reviews.last_page', 1)
        );
    }
}
