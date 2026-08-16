<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Services\OrderNumberService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReusableOrderNumberTest extends TestCase
{
    use RefreshDatabase;

    public User $customerUser;
    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $foodCategory;
    public Product $testProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->foodCategory = Category::create([
            'name' => 'Ramen & Bento',
        ]);

        $this->customerUser = User::factory()->create([
            'role' => 'customer',
            'must_change_password' => false,
        ]);

        $this->testProduct = Product::create([
            'name' => 'Tonkotsu Ramen',
            'sku' => 'SKU-TR-100',
            'category_id' => $this->foodCategory->id,
            'selling_price' => 250.00,
            'cost_price' => 120.00,
            'branch_id' => $this->branchSantaCruz->id,
            'unit' => 'pcs',
            'stock' => 50,
        ]);
    }

    /**
     * Test sequential order number allocation (ORD-1, ORD-2, ORD-3).
     */
    public function test_sequential_order_number_allocation()
    {
        $payload = [
            'customer_name' => 'Jane Doe',
            'mobile_number' => '09171234567',
            'address'       => '123 Rizal Ave',
            'latitude'      => 14.5995,
            'longitude'     => 120.9842,
            'branch_id'     => $this->branchSantaCruz->id,
            'total_amount'  => 250.00,
            'delivery_fee'  => 50.00,
            'items'         => [
                [
                    'product_id' => $this->testProduct->id,
                    'quantity'   => 1,
                    'price'      => 250.00,
                ]
            ]
        ];

        // 1st Order -> ORD-1
        $res1 = $this->actingAs($this->customerUser, 'sanctum')->postJson('/api/v1/orders', $payload);
        $res1->assertStatus(201)->assertJson(['order_number' => 'ORD-1']);

        // 2nd Order -> ORD-2
        $res2 = $this->actingAs($this->customerUser, 'sanctum')->postJson('/api/v1/orders', $payload);
        $res2->assertStatus(201)->assertJson(['order_number' => 'ORD-2']);

        // 3rd Order -> ORD-3
        $res3 = $this->actingAs($this->customerUser, 'sanctum')->postJson('/api/v1/orders', $payload);
        $res3->assertStatus(201)->assertJson(['order_number' => 'ORD-3']);
    }

    /**
     * Test active order numbers are reserved and cannot be reused while active.
     */
    public function test_active_order_numbers_are_never_reused()
    {
        $service = new OrderNumberService();

        Order::create([
            'order_number' => 'ORD-1',
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Alice',
            'total_amount' => 100,
            'status' => 'pending',
        ]);

        Order::create([
            'order_number' => 'ORD-2',
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Bob',
            'total_amount' => 100,
            'status' => 'preparing',
        ]);

        $nextNumber = $service->allocateForBranch($this->branchSantaCruz->id);
        $this->assertEquals('ORD-3', $nextNumber);
    }

    /**
     * Test order number reuse after an order reaches terminal status (delivered or cancelled).
     */
    public function test_order_number_is_reused_after_reaching_terminal_status()
    {
        $service = new OrderNumberService();

        $order1 = Order::create([
            'order_number' => 'ORD-1',
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Alice',
            'total_amount' => 100,
            'status' => 'delivered', // Terminal status
        ]);

        $order2 = Order::create([
            'order_number' => 'ORD-2',
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Bob',
            'total_amount' => 100,
            'status' => 'preparing', // Active status
        ]);

        // ORD-1 is delivered (terminal), so smallest available number is ORD-1
        $nextNumber = $service->allocateForBranch($this->branchSantaCruz->id);
        $this->assertEquals('ORD-1', $nextNumber);

        // Create new order with recycled ORD-1
        $newOrder = Order::create([
            'order_number' => $nextNumber,
            'user_id' => $this->customerUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Charlie',
            'total_amount' => 100,
            'status' => 'pending',
        ]);

        // Verify both orders coexist in database with distinct permanent primary keys
        $this->assertNotEquals($order1->id, $newOrder->id);
        $this->assertEquals('ORD-1', $order1->order_number);
        $this->assertEquals('ORD-1', $newOrder->order_number);
    }

    /**
     * Test branch isolation of reusable order number pools.
     */
    public function test_branch_isolation_of_reusable_order_number_pools()
    {
        $service = new OrderNumberService();

        // Sta Cruz active orders: ORD-1, ORD-2
        Order::create([
            'order_number' => 'ORD-1',
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Sta Cruz 1',
            'total_amount' => 100,
            'status' => 'pending',
        ]);
        Order::create([
            'order_number' => 'ORD-2',
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Sta Cruz 2',
            'total_amount' => 100,
            'status' => 'pending',
        ]);

        // Victoria active order: ORD-1
        $numVictoria = $service->allocateForBranch($this->branchVictoria->id);
        $this->assertEquals('ORD-1', $numVictoria);
    }
}
