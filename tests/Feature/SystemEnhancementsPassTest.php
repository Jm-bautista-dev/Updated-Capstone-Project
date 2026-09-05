<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use App\Services\OrderFulfillmentService;
use App\Services\PickupOrderService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SystemEnhancementsPassTest extends TestCase
{
    use RefreshDatabase;

    private Branch $branchA;
    private Branch $branchB;
    private User $admin;
    private User $cashier;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchA = Branch::create([
            'name'      => 'Victoria Branch',
            'code'      => 'VIC',
            'address'   => 'Victoria St',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);

        $this->branchB = Branch::create([
            'name'      => 'Santa Cruz Branch',
            'code'      => 'STC',
            'address'   => 'Santa Cruz St',
            'latitude'  => 14.6000,
            'longitude' => 120.9900,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branchA->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branchA->id,
        ]);

        $category = \App\Models\Category::create([
            'name'      => 'Maki Rolls',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'price'         => 150.00,
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'is_active'     => true,
        ]);
    }

    /**
     * Requirement 10: Rider logout only sets status to offline, never suspends rider account.
     */
    public function test_rider_logout_sets_offline_and_keeps_account_active(): void
    {
        $riderUser = User::create([
            'name'           => 'Test Rider',
            'email'          => 'rider@makidesu.test',
            'password'       => Hash::make('password123'),
            'role'           => 'rider',
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branchA->id,
        ]);

        $rider = Rider::create([
            'user_id'        => $riderUser->id,
            'name'           => 'Test Rider',
            'email'          => 'rider@makidesu.test',
            'password'       => Hash::make('password123'),
            'phone'          => '09123456789',
            'vehicle_type'   => 'Motorcycle',
            'plate_number'   => 'MC-1234',
            'status'         => 'available',
            'is_active'      => true,
            'account_status' => 'active',
            'branch_id'      => $this->branchA->id,
        ]);

        $token = $riderUser->createToken('auth_token')->plainTextToken;

        // Call rider logout API
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/v1/logout');

        $response->assertStatus(200);

        $rider->refresh();
        $riderUser->refresh();

        $this->assertEquals('offline', $rider->status, 'Rider status must become offline');
        $this->assertFalse((bool) $rider->is_active, 'Rider is_active must become false');
        $this->assertEquals('active', $rider->account_status, 'Rider account_status must remain ACTIVE and NEVER become suspended');
        $this->assertEquals(User::STATUS_ACTIVE, $riderUser->account_status, 'User account_status must remain ACTIVE');

        // Verify PATCH /api/v1/rider/status also never suspends account
        $response2 = $this->actingAs($riderUser, 'sanctum')->patchJson('/api/v1/rider/status', [
            'status' => 'offline',
        ]);
        $response2->assertStatus(200);

        $rider->refresh();
        $this->assertEquals('active', $rider->account_status);
    }

    /**
     * Requirement 12: Pickup order fulfillment records into sales table as type = pickup.
     */
    public function test_pickup_order_completion_records_into_sales(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-PK-001',
            'fulfillment_type' => 'pickup',
            'user_id'          => $this->cashier->id,
            'customer_name'    => 'Pickup Customer',
            'contact_number'   => '09123456789',
            'total_amount'     => 300.00,
            'subtotal'         => 300.00,
            'branch_id'        => $this->branchA->id,
            'status'           => 'ready_for_pickup',
            'payment_status'   => 'paid',
            'payment_method'   => 'cash',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'unit_price' => 150.00,
            'price'      => 150.00,
            'line_total' => 300.00,
        ]);

        $pickupService = app(PickupOrderService::class);
        $pickupService->transitionPickupStatus($order, 'completed', null, $this->cashier);

        $order->refresh();
        $this->assertEquals('completed', $order->status);

        // Assert sale record exists for pickup order
        $sale = Sale::where('order_id', $order->id)->first();
        $this->assertNotNull($sale, 'Sale record must be created for completed pickup order');
        $this->assertEquals('pickup', $sale->type);
        $this->assertEquals('completed', $sale->status);
        $this->assertEquals(300.00, (float) $sale->total);
        $this->assertEquals($this->branchA->id, $sale->branch_id);
    }

    /**
     * Requirement 6 & 7: Report export token preparation handles scope='all'.
     */
    public function test_report_export_prepare_handles_all_branches_scope(): void
    {
        // Insert sales in Branch A and Branch B
        Sale::create([
            'order_number'   => 'ORD-A-01',
            'branch_id'      => $this->branchA->id,
            'user_id'        => $this->admin->id,
            'subtotal'       => 500.00,
            'discount'       => 0.00,
            'total'          => 500.00,
            'paid_amount'    => 500.00,
            'status'         => 'completed',
            'payment_method' => 'cash',
            'type'           => 'dine-in',
        ]);

        Sale::create([
            'order_number'   => 'ORD-B-01',
            'branch_id'      => $this->branchB->id,
            'user_id'        => $this->admin->id,
            'subtotal'       => 750.00,
            'discount'       => 0.00,
            'total'          => 750.00,
            'paid_amount'    => 750.00,
            'status'         => 'completed',
            'payment_method' => 'cash',
            'type'           => 'dine-in',
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => [
                'branch_id' => 'all',
            ],
            'columns'   => ['order_number', 'branch_name', 'total', 'status'],
            'headers'   => ['Order #', 'Branch', 'Total', 'Status'],
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');
        $this->assertNotEmpty($token);

        $cached = \Illuminate\Support\Facades\Cache::get('report_export_' . $token);
        $this->assertNotNull($cached);
        $this->assertEquals('all', $cached['scope']);
        $this->assertCount(2, $cached['rows'], 'All-branch export must compile rows across both branches');
    }
}
