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
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CashierReviewsAndRatingsVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branchVictoria;
    protected Branch $branchSantaCruz;
    protected User $admin;
    protected User $cashierVictoria;
    protected User $cashierSantaCruz;
    protected User $customer;
    protected Category $dishCategory;
    protected Product $globalProduct;
    protected Product $victoriaProduct;
    protected Product $santaCruzProduct;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class]);

        $this->branchVictoria = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);
        $this->branchSantaCruz = Branch::create(['name' => 'Maki Desu Santa Cruz', 'address' => 'Santa Cruz, Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchVictoria->id,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $this->dishCategory = Category::create(['name' => 'Maki Rolls']);

        // 1. Global Product (available in all branches, branch_id = null)
        $this->globalProduct = Product::create([
            'name'          => 'California Special Roll',
            'sku'           => 'MAK-CAL-01',
            'category_id'   => $this->dishCategory->id,
            'selling_price' => 150.00,
            'status'        => 'in_stock',
            'branch_id'     => null,
        ]);

        // 2. Branch-specific Product (Victoria only)
        $this->victoriaProduct = Product::create([
            'name'          => 'Victoria Spicy Tuna',
            'sku'           => 'MAK-VIC-02',
            'category_id'   => $this->dishCategory->id,
            'selling_price' => 180.00,
            'status'        => 'in_stock',
            'branch_id'     => $this->branchVictoria->id,
        ]);

        // 3. Branch-specific Product (Santa Cruz only)
        $this->santaCruzProduct = Product::create([
            'name'          => 'Santa Cruz Salmon Crunch',
            'sku'           => 'MAK-STC-03',
            'category_id'   => $this->dishCategory->id,
            'selling_price' => 200.00,
            'status'        => 'in_stock',
            'branch_id'     => $this->branchSantaCruz->id,
        ]);
    }

    /**
     * Test 1: Existing reviews with null branch_id and matching branch appear in Cashier interface.
     */
    public function test_existing_review_with_null_branch_id_appears_in_cashier()
    {
        // Verified order for global product
        $order = Order::create([
            'order_number'    => 'ORD-VIC-1001',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchVictoria->id,
            'customer_name'   => 'Juan Dela Cruz',
            'customer_phone'  => '09171234567',
            'delivery_address'=> 'Victoria, Laguna',
            'payment_method'  => 'cash',
            'total_amount'    => 150.00,
            'status'          => 'delivered',
        ]);

        $orderItem = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->globalProduct->id,
            'quantity'   => 1,
            'price'      => 150.00,
            'subtotal'   => 150.00,
        ]);

        // Existing review with null branch_id
        $review = ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->globalProduct->id,
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'branch_id'     => null, // Unset branch_id in existing record
            'rating'        => 5,
            'comment'       => 'Super fresh and flavorful!',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        $response = $this->actingAs($this->cashierVictoria)->get('/admin/reviews');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->has('reviews.data', 1)
            ->where('reviews.data.0.id', $review->id)
            ->where('reviews.data.0.rating', 5)
            ->where('reviews.data.0.comment', fn($c) => $c === 'Super fresh and flavorful!')
            ->where('reviews.data.0.is_verified_purchase', true)
            ->where('reviews.total', 1)
            ->where('stats.total_reviews', 1)
            ->where('stats.average_rating', fn($val) => (float)$val === 5.0)
        );
    }

    /**
     * Test 2: Existing rating values contribute to average rating and star distribution.
     */
    public function test_existing_ratings_contribute_to_average_and_distribution()
    {
        $order = Order::create([
            'order_number'    => 'ORD-VIC-1002',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchVictoria->id,
            'customer_name'   => 'Maria Clara',
            'delivery_address'=> 'Victoria, Laguna',
            'payment_method'  => 'online',
            'total_amount'    => 330.00,
            'status'          => 'delivered',
        ]);

        $item1 = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->victoriaProduct->id,
            'quantity'   => 1,
            'price'      => 180.00,
            'subtotal'   => 180.00,
        ]);

        $item2 = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->globalProduct->id,
            'quantity'   => 1,
            'price'      => 150.00,
            'subtotal'   => 150.00,
        ]);

        // Review 1: 5-star on Victoria Product
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->victoriaProduct->id,
            'order_id'      => $order->id,
            'order_item_id' => $item1->id,
            'branch_id'     => $this->branchVictoria->id,
            'rating'        => 5,
            'comment'       => 'Best spicy tuna in town!',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        // Review 2: 3-star on Global Product
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->globalProduct->id,
            'order_id'      => $order->id,
            'order_item_id' => $item2->id,
            'branch_id'     => $this->branchVictoria->id,
            'rating'        => 3,
            'comment'       => 'Decent taste.',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => true,
        ]);

        $response = $this->actingAs($this->cashierVictoria)->get('/admin/reviews');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->where('stats.total_reviews', 2)
            ->where('stats.average_rating', fn($val) => (float)$val === 4.0) // (5 + 3) / 2 = 4.0
            ->where('stats.unseen_reviews', 1)
            ->where('stats.published_count', 2)
        );
    }

    /**
     * Test 3: Multiple reviews load with correct pagination and counts for Cashier.
     */
    public function test_multiple_reviews_pagination_and_counts_for_cashier()
    {
        $order = Order::create([
            'order_number'    => 'ORD-VIC-1003',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchVictoria->id,
            'customer_name'   => 'Alice Customer',
            'delivery_address'=> 'Victoria, Laguna',
            'payment_method'  => 'cash',
            'total_amount'    => 1500.00,
            'status'          => 'delivered',
        ]);

        // Create 15 reviews for global product
        for ($i = 1; $i <= 15; $i++) {
            $item = OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $this->globalProduct->id,
                'quantity'   => 1,
                'price'      => 100.00,
                'subtotal'   => 100.00,
            ]);

            ProductReview::create([
                'user_id'       => $this->customer->id,
                'product_id'    => $this->globalProduct->id,
                'order_id'      => $order->id,
                'order_item_id' => $item->id,
                'branch_id'     => $this->branchVictoria->id,
                'rating'        => ($i % 5) + 1,
                'comment'       => "Batch review #{$i}",
                'status'        => ProductReview::STATUS_PUBLISHED,
                'is_seen'       => true,
            ]);
        }

        // Cashier page 1 with per_page = 10
        $response = $this->actingAs($this->cashierVictoria)->get('/admin/reviews?per_page=10&page=1');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->has('reviews.data', 10)
            ->where('reviews.total', 15)
            ->where('reviews.last_page', 2)
            ->where('reviews.current_page', 1)
        );

        // Cashier page 2
        $responsePage2 = $this->actingAs($this->cashierVictoria)->get('/admin/reviews?per_page=10&page=2');
        $responsePage2->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->has('reviews.data', 5)
            ->where('reviews.total', 15)
            ->where('reviews.current_page', 2)
        );
    }

    /**
     * Test 4: Admin sees all reviews across branches; Cashier sees only authorized branch reviews.
     */
    public function test_admin_vs_cashier_role_differences()
    {
        $orderVic = Order::create([
            'order_number'    => 'ORD-VIC-1004',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchVictoria->id,
            'customer_name'   => 'Alice Victoria',
            'total_amount'    => 180.00,
            'status'          => 'delivered',
        ]);
        $itemVic = OrderItem::create([
            'order_id'   => $orderVic->id,
            'product_id' => $this->victoriaProduct->id,
            'quantity'   => 1,
            'price'      => 180.00,
            'subtotal'   => 180.00,
        ]);
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->victoriaProduct->id,
            'order_id'      => $orderVic->id,
            'order_item_id' => $itemVic->id,
            'branch_id'     => $this->branchVictoria->id,
            'rating'        => 5,
            'comment'       => 'Victoria branch exclusive review',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        $orderStc = Order::create([
            'order_number'    => 'ORD-STC-2001',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchSantaCruz->id,
            'customer_name'   => 'Bob Santa Cruz',
            'total_amount'    => 200.00,
            'status'          => 'delivered',
        ]);
        $itemStc = OrderItem::create([
            'order_id'   => $orderStc->id,
            'product_id' => $this->santaCruzProduct->id,
            'quantity'   => 1,
            'price'      => 200.00,
            'subtotal'   => 200.00,
        ]);
        ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->santaCruzProduct->id,
            'order_id'      => $orderStc->id,
            'order_item_id' => $itemStc->id,
            'branch_id'     => $this->branchSantaCruz->id,
            'rating'        => 4,
            'comment'       => 'Santa Cruz exclusive review',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        // 1. Admin sees BOTH reviews
        $adminResponse = $this->actingAs($this->admin)->get('/admin/reviews');
        $adminResponse->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->where('stats.total_reviews', 2)
            ->has('reviews.data', 2)
        );

        // 2. Cashier Victoria sees ONLY Victoria review
        $cashierResponse = $this->actingAs($this->cashierVictoria)->get('/admin/reviews');
        $cashierResponse->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->where('stats.total_reviews', 1)
            ->has('reviews.data', 1)
            ->where('reviews.data.0.comment', fn($c) => $c === 'Victoria branch exclusive review')
        );
    }

    /**
     * Test 5: Customer submits a new review via API, Cashier refreshes and sees it immediately.
     */
    public function test_new_review_submission_immediately_visible_to_cashier()
    {
        $order = Order::create([
            'order_number'    => 'ORD-VIC-1005',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchVictoria->id,
            'customer_name'   => 'Customer Victoria',
            'total_amount'    => 150.00,
            'status'          => 'delivered',
        ]);

        $orderItem = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->globalProduct->id,
            'quantity'   => 1,
            'price'      => 150.00,
            'subtotal'   => 150.00,
        ]);

        // Customer submits review via API
        $apiResponse = $this->actingAs($this->customer)->postJson('/api/v1/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->globalProduct->id,
            'rating'        => 5,
            'comment'       => 'Freshly made and delivered warm!',
        ]);

        $apiResponse->assertCreated();
        $apiResponse->assertJson(['success' => true]);

        // Cashier loads Reviews dashboard
        $cashierResponse = $this->actingAs($this->cashierVictoria)->get('/admin/reviews');

        $cashierResponse->assertOk();
        $cashierResponse->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->has('reviews.data', 1)
            ->where('reviews.data.0.comment', fn($c) => $c === 'Freshly made and delivered warm!')
            ->where('reviews.data.0.rating', 5)
            ->where('reviews.data.0.is_seen', false) // Unseen badge active
            ->where('stats.unseen_reviews', 1)
        );
    }

    /**
     * Test 6: Branch Security — Unauthorized branch data remains isolated.
     */
    public function test_branch_security_and_authorization_guards()
    {
        $orderStc = Order::create([
            'order_number'    => 'ORD-STC-2002',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->branchSantaCruz->id,
            'customer_name'   => 'Customer Santa Cruz',
            'total_amount'    => 200.00,
            'status'          => 'delivered',
        ]);

        $itemStc = OrderItem::create([
            'order_id'   => $orderStc->id,
            'product_id' => $this->santaCruzProduct->id,
            'quantity'   => 1,
            'price'      => 200.00,
            'subtotal'   => 200.00,
        ]);

        $stcReview = ProductReview::create([
            'user_id'       => $this->customer->id,
            'product_id'    => $this->santaCruzProduct->id,
            'order_id'      => $orderStc->id,
            'order_item_id' => $itemStc->id,
            'branch_id'     => $this->branchSantaCruz->id,
            'rating'        => 5,
            'comment'       => 'Santa Cruz Secret Recipe',
            'status'        => ProductReview::STATUS_PUBLISHED,
            'is_seen'       => false,
        ]);

        // Victoria Cashier cannot see Santa Cruz review
        $vicResponse = $this->actingAs($this->cashierVictoria)->get('/admin/reviews');
        $vicResponse->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reviews')
            ->where('stats.total_reviews', 0)
            ->has('reviews.data', 0)
        );

        // Victoria Cashier cannot mark Santa Cruz review as seen
        $markResponse = $this->actingAs($this->cashierVictoria)->postJson("/admin/reviews/{$stcReview->id}/mark-seen");
        $markResponse->assertStatus(403);

        // Victoria Cashier cannot reply to Santa Cruz review
        $replyResponse = $this->actingAs($this->cashierVictoria)->post("/admin/reviews/{$stcReview->id}/respond", [
            'response' => 'Unauthorized response attempt',
        ]);
        $replyResponse->assertSessionHas('error');

        // Victoria Cashier cannot delete Santa Cruz review
        $deleteResponse = $this->actingAs($this->cashierVictoria)->delete("/admin/reviews/{$stcReview->id}");
        $deleteResponse->assertSessionHas('error');
        $this->assertDatabaseHas('product_reviews', ['id' => $stcReview->id]);
    }
}
