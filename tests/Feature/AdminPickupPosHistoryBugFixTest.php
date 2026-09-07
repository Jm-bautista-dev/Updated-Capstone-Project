<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\PickupOrderService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPickupPosHistoryBugFixTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public User $cashierBranch1;
    public User $cashierBranch2;
    public User $customer;
    public Branch $branch1;
    public Branch $branch2;
    public Category $testCategory;
    public Product $productRoll;
    public Ingredient $ingredientFish;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create([
            'name'                     => 'Maki Desu Victoria',
            'address'                  => 'Victoria Laguna',
            'latitude'                 => 14.229371,
            'longitude'                => 121.328383,
            'is_main'                  => true,
            'pickup_enabled'           => true,
            'pickup_opening_time'      => '08:00:00',
            'pickup_closing_time'      => '22:00:00',
            'pickup_lead_time_minutes' => 20,
        ]);

        $this->branch2 = Branch::create([
            'name'                     => 'Maki Desu Sta. Cruz',
            'address'                  => 'Sta. Cruz Laguna',
            'latitude'                 => 14.2815,
            'longitude'                => 121.4172,
            'is_main'                  => false,
            'pickup_enabled'           => true,
            'pickup_opening_time'      => '08:00:00',
            'pickup_closing_time'      => '22:00:00',
            'pickup_lead_time_minutes' => 20,
        ]);

        $this->admin = User::create([
            'name'              => 'Admin User',
            'email'             => 'admin@makidesu.test',
            'password'          => bcrypt('password'),
            'role'              => 'admin',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->cashierBranch1 = User::create([
            'name'              => 'Cashier Victoria',
            'email'             => 'cashier1@makidesu.test',
            'password'          => bcrypt('password'),
            'role'              => 'cashier',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->cashierBranch2 = User::create([
            'name'              => 'Cashier Sta Cruz',
            'email'             => 'cashier2@makidesu.test',
            'password'          => bcrypt('password'),
            'role'              => 'cashier',
            'branch_id'         => $this->branch2->id,
            'email_verified_at' => now(),
        ]);

        $this->customer = User::create([
            'name'              => 'Customer Juan',
            'email'             => 'juan@example.test',
            'password'          => bcrypt('password'),
            'role'              => 'customer',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->testCategory = Category::create([
            'name' => 'Maki Rolls',
            'slug' => 'maki-rolls',
        ]);

        $this->ingredientFish = Ingredient::create([
            'name'               => 'Fresh Salmon',
            'unit'               => 'grams',
            'cost_per_base_unit' => 1.50,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $this->ingredientFish->id,
            'branch_id'     => $this->branch1->id,
        ], [
            'stock'         => 10000,
            'quantity'      => 10000,
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $this->ingredientFish->id,
            'branch_id'     => $this->branch2->id,
        ], [
            'stock'         => 10000,
            'quantity'      => 10000,
        ]);

        $this->productRoll = Product::create([
            'name'          => 'Salmon Crunch Roll',
            'category_id'   => $this->testCategory->id,
            'branch_id'     => null,
            'selling_price' => 250.00,
            'is_active'     => true,
            'is_available'  => true,
        ]);

        $this->productRoll->ingredients()->attach($this->ingredientFish->id, [
            'quantity_required' => 50,
        ]);
    }

    private function createCustomerPickupOrder(Branch $branch, string $orderNum = 'PK-TEST-001'): Order
    {
        $pickupTime = Carbon::tomorrow(PickupOrderService::DEFAULT_TIMEZONE)->setTime(14, 0, 0);

        $order = Order::create([
            'order_number'                => $orderNum,
            'idempotency_key'             => (string) \Illuminate\Support\Str::uuid(),
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'user_id'                     => $this->customer->id,
            'branch_id'                   => $branch->id,
            'customer_name'               => $this->customer->name,
            'contact_number'              => '09171234567',
            'payment_method'              => 'cash',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => $pickupTime->utc(),
            'estimated_prep_time_minutes' => 20,
            'prep_start_at'               => $pickupTime->copy()->subMinutes(20)->utc(),
            'pickup_verification_code'    => 'ABC123',
            'total_amount'                => 500.00,
            'status'                      => 'pending',
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 2,
            'unit_price' => 250.00,
            'price'      => 250.00,
            'line_total' => 500.00,
        ]);

        return $order;
    }

    /**
     * Test 1: Admin accepts Pickup -> Order appears in POS History for branch cashier
     */
    public function test_admin_accepts_pickup_order_and_appears_in_pos_history(): void
    {
        $pickupOrder = $this->createCustomerPickupOrder($this->branch1, 'PK-ADM-001');

        // Admin verifies and completes the order
        $pickupService = app(PickupOrderService::class);
        $result = $pickupService->verifyAndCompletePickup(
            order: $pickupOrder,
            verificationInput: 'ABC123',
            cashier: $this->admin
        );

        $this->assertTrue($result['success']);
        $this->assertEquals('completed', $result['order']->status);

        // Verify Sale record exists in DB with Admin user_id and Branch1 id
        $sale = Sale::where('order_id', $pickupOrder->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals($this->admin->id, $sale->user_id);
        $this->assertEquals($this->branch1->id, $sale->branch_id);
        $this->assertEquals('pickup', $sale->type);
        $this->assertEquals('completed', $sale->status);

        // When Cashier at Branch 1 loads POS, the order MUST appear in recentOrders
        $response = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Pos/Index')
                 ->has('recentOrders', 1)
                 ->where('recentOrders.0.order_number', fn ($val) => $val === 'PK-ADM-001')
        );

        // When Cashier loads Sales page (/sales), it MUST appear
        $salesResponse = $this->actingAs($this->cashierBranch1)->get(route('sales.index'));
        $salesResponse->assertOk();
        $salesResponse->assertInertia(fn (Assert $page) =>
            $page->component('Sales/Index')
                 ->has('sales.data', 1)
                 ->where('sales.data.0.order_number', fn ($val) => $val === 'PK-ADM-001')
        );
    }

    /**
     * Test 2: Staff accepts Pickup -> Order appears in POS History
     */
    public function test_staff_accepts_pickup_order_and_appears_in_pos_history(): void
    {
        $pickupOrder = $this->createCustomerPickupOrder($this->branch1, 'PK-STF-002');

        // Cashier verifies and completes the order
        $pickupService = app(PickupOrderService::class);
        $result = $pickupService->verifyAndCompletePickup(
            order: $pickupOrder,
            verificationInput: 'ABC123',
            cashier: $this->cashierBranch1
        );

        $this->assertTrue($result['success']);
        $this->assertEquals('completed', $result['order']->status);

        // POS recent orders must contain this order
        $response = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Pos/Index')
                 ->has('recentOrders', 1)
                 ->where('recentOrders.0.order_number', fn ($val) => $val === 'PK-STF-002')
        );
    }

    /**
     * Test 3: Refresh -> Order persists and remains in History across page reloads
     */
    public function test_refresh_preserves_order_in_pos_history(): void
    {
        $pickupOrder = $this->createCustomerPickupOrder($this->branch1, 'PK-REF-003');

        $pickupService = app(PickupOrderService::class);
        $pickupService->verifyAndCompletePickup($pickupOrder, 'ABC123', $this->admin);

        // Request 1
        $res1 = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $res1->assertOk();
        $res1->assertInertia(fn (Assert $page) =>
            $page->where('recentOrders.0.order_number', fn ($val) => $val === 'PK-REF-003')
        );

        // Request 2 (Simulating browser refresh)
        $res2 = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $res2->assertOk();
        $res2->assertInertia(fn (Assert $page) =>
            $page->where('recentOrders.0.order_number', fn ($val) => $val === 'PK-REF-003')
        );
    }

    /**
     * Test 4: Branch isolation -> Admin accepts Pickup for Branch 1 -> Only Branch 1 POS shows it, Branch 2 does not
     */
    public function test_branch_isolation_for_admin_accepted_pickup(): void
    {
        $pickupOrder = $this->createCustomerPickupOrder($this->branch1, 'PK-BR1-004');

        $pickupService = app(PickupOrderService::class);
        $pickupService->verifyAndCompletePickup($pickupOrder, 'ABC123', $this->admin);

        // Branch 1 cashier SHOULD see it
        $resBranch1 = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $resBranch1->assertOk();
        $resBranch1->assertInertia(fn (Assert $page) =>
            $page->has('recentOrders', 1)
                 ->where('recentOrders.0.order_number', fn ($val) => $val === 'PK-BR1-004')
        );

        // Branch 2 cashier MUST NOT see Branch 1's order
        $resBranch2 = $this->actingAs($this->cashierBranch2)->get(route('pos.index'));
        $resBranch2->assertOk();
        $resBranch2->assertInertia(fn (Assert $page) =>
            $page->has('recentOrders', 0)
        );
    }

    /**
     * Test 5: Delivery orders still appear and behave exactly as before
     */
    public function test_delivery_orders_still_appear_in_pos_and_sales_history(): void
    {
        Sale::create([
            'order_number'   => 'POS-DEL-005',
            'user_id'        => $this->cashierBranch1->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'delivery',
            'subtotal'       => 300.00,
            'delivery_fee'   => 50.00,
            'total'          => 350.00,
            'paid_amount'    => 350.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $response = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) =>
            $page->has('recentOrders', 1)
                 ->where('recentOrders.0.order_number', fn ($val) => $val === 'POS-DEL-005')
        );
    }

    /**
     * Test 6: Walk-in counter orders still appear correctly
     */
    public function test_walk_in_orders_appear_in_pos_and_sales_history(): void
    {
        Sale::create([
            'order_number'   => 'POS-WALKIN-006',
            'user_id'        => $this->cashierBranch1->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'dine-in',
            'subtotal'       => 250.00,
            'total'          => 250.00,
            'paid_amount'    => 250.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $response = $this->actingAs($this->cashierBranch1)->get(route('pos.index'));
        $response->assertOk();
        $response->assertInertia(fn (Assert $page) =>
            $page->has('recentOrders', 1)
                 ->where('recentOrders.0.order_number', fn ($val) => $val === 'POS-WALKIN-006')
        );
    }

    /**
     * Test 7: Search and filter in Sales / POS History discovers pickup orders
     */
    public function test_search_and_filter_discovers_pickup_orders(): void
    {
        $pickupOrder = $this->createCustomerPickupOrder($this->branch1, 'PK-SRCH-007');

        $pickupService = app(PickupOrderService::class);
        $pickupService->verifyAndCompletePickup($pickupOrder, 'ABC123', $this->admin);

        // Search by order_number
        $searchResponse = $this->actingAs($this->cashierBranch1)->get(route('sales.index', [
            'search' => 'PK-SRCH-007',
        ]));
        $searchResponse->assertOk();
        $searchResponse->assertInertia(fn (Assert $page) =>
            $page->has('sales.data', 1)
                 ->where('sales.data.0.order_number', fn ($val) => $val === 'PK-SRCH-007')
        );

        // Search by customer name
        $nameSearchResponse = $this->actingAs($this->cashierBranch1)->get(route('sales.index', [
            'search' => 'Juan',
        ]));
        $nameSearchResponse->assertOk();
        $nameSearchResponse->assertInertia(fn (Assert $page) =>
            $page->has('sales.data', 1)
                 ->where('sales.data.0.order_number', fn ($val) => $val === 'PK-SRCH-007')
        );
    }
}
