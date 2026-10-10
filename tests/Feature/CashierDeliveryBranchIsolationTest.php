<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierDeliveryBranchIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branchA;
    protected Branch $branchB;
    protected User $cashierA;
    protected User $cashierB;
    protected User $cashierNoBranch;
    protected User $admin;
    protected User $superAdmin;
    protected User $customer;
    protected Rider $riderA;
    protected Rider $riderB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchA = Branch::create([
            'name'                => 'Branch Victoria',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $this->branchB = Branch::create([
            'name'                => 'Branch Santa Cruz',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $this->cashierA = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchA->id,
        ]);

        $this->cashierB = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branchB->id,
        ]);

        $this->cashierNoBranch = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => null,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $this->riderA = Rider::create([
            'name'      => 'Rider Alpha',
            'email'     => 'rider.alpha@example.com',
            'password'  => bcrypt('password'),
            'phone'     => '09111111111',
            'branch_id' => $this->branchA->id,
            'is_active' => true,
            'status'    => 'available',
        ]);

        $this->riderB = Rider::create([
            'name'      => 'Rider Beta',
            'email'     => 'rider.beta@example.com',
            'password'  => bcrypt('password'),
            'phone'     => '09222222222',
            'branch_id' => $this->branchB->id,
            'is_active' => true,
            'status'    => 'available',
        ]);
    }

    private function createDeliveryForBranch(Branch $branch, string $orderNumber, string $status = 'pending'): Delivery
    {
        $order = Order::create([
            'order_number'     => $orderNumber,
            'customer_name'    => "Customer for {$branch->name}",
            'contact_number'   => '09999999999',
            'address'          => 'Sample Address',
            'fulfillment_type' => 'delivery',
            'user_id'          => $this->customer->id,
            'branch_id'        => $branch->id,
            'status'           => $status,
            'total'            => 500,
            'total_amount'     => 500,
            'subtotal'         => 500,
            'payment_method'   => 'cod',
            'payment_status'   => 'unpaid',
        ]);

        return Delivery::create([
            'order_id'         => $order->id,
            'customer_name'    => $order->customer_name,
            'customer_phone'   => $order->contact_number,
            'customer_address' => $order->address,
            'status'           => $status,
            'delivery_type'    => 'internal',
        ]);
    }

    /**
     * Test 1: Cashier assigned to Branch A sees only Branch A deliveries.
     */
    public function test_cashier_assigned_to_branch_a_sees_only_branch_a_deliveries(): void
    {
        $delA = $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-001');
        $delB = $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-001');

        $response = $this->actingAs($this->cashierA)->get('/deliveries');
        $response->assertOk();

        $deliveries = $response->viewData('page')['props']['deliveries']['data'];
        $deliveryIds = collect($deliveries)->pluck('id')->all();

        $this->assertContains($delA->id, $deliveryIds);
        $this->assertNotContains($delB->id, $deliveryIds);
    }

    /**
     * Test 2: Cashier assigned to Branch B sees only Branch B deliveries.
     */
    public function test_cashier_assigned_to_branch_b_sees_only_branch_b_deliveries(): void
    {
        $delA = $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-002');
        $delB = $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-002');

        $response = $this->actingAs($this->cashierB)->get('/deliveries');
        $response->assertOk();

        $deliveries = $response->viewData('page')['props']['deliveries']['data'];
        $deliveryIds = collect($deliveries)->pluck('id')->all();

        $this->assertContains($delB->id, $deliveryIds);
        $this->assertNotContains($delA->id, $deliveryIds);
    }

    /**
     * Test 3: Cashier cannot retrieve another branch's deliveries by tampering URL query parameters.
     */
    public function test_cashier_cannot_access_other_branch_deliveries_via_query_parameters(): void
    {
        $delA = $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-003');
        $delB = $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-003');

        // Cashier A attempts to explicitly request Branch B
        $response = $this->actingAs($this->cashierA)->get("/deliveries?branch_id={$this->branchB->id}");
        $response->assertOk();

        $deliveries = $response->viewData('page')['props']['deliveries']['data'];
        $deliveryIds = collect($deliveries)->pluck('id')->all();

        $this->assertContains($delA->id, $deliveryIds);
        $this->assertNotContains($delB->id, $deliveryIds);

        // Cashier A attempts to pass branch_id=all
        $responseAll = $this->actingAs($this->cashierA)->get('/deliveries?branch_id=all');
        $responseAll->assertOk();

        $deliveriesAll = $responseAll->viewData('page')['props']['deliveries']['data'];
        $deliveryIdsAll = collect($deliveriesAll)->pluck('id')->all();

        $this->assertContains($delA->id, $deliveryIdsAll);
        $this->assertNotContains($delB->id, $deliveryIdsAll);
    }

    /**
     * Test 4: Cashier with no valid branch assignment fails safely and does not receive all branches' records.
     */
    public function test_cashier_with_no_valid_branch_assignment_receives_empty_deliveries_and_stats(): void
    {
        $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-004');
        $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-004');

        $response = $this->actingAs($this->cashierNoBranch)->get('/deliveries');
        $response->assertOk();

        $deliveries = $response->viewData('page')['props']['deliveries']['data'];
        $stats = $response->viewData('page')['props']['stats'];

        $this->assertEmpty($deliveries);
        $this->assertEquals(0, $stats['active']);
        $this->assertEquals(0, $stats['waiting']);
    }

    /**
     * Test 5: Delivery statistics and rider lists are branch-scoped for Cashiers.
     */
    public function test_cashier_delivery_stats_and_riders_are_strictly_branch_scoped(): void
    {
        $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-005', 'pending');
        $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-006', 'pending');
        $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-005', 'pending');

        $response = $this->actingAs($this->cashierA)->get('/deliveries');
        $response->assertOk();

        $stats = $response->viewData('page')['props']['stats'];
        $availableRiders = $response->viewData('page')['props']['availableRiders'];
        $riderIds = collect($availableRiders)->pluck('id')->all();

        // 2 pending deliveries for Branch A, not 3
        $this->assertEquals(2, $stats['active']);
        $this->assertEquals(2, $stats['waiting']);

        // Only Rider A for Branch A
        $this->assertContains($this->riderA->id, $riderIds);
        $this->assertNotContains($this->riderB->id, $riderIds);
    }

    /**
     * Test 6: Admin and Super Admin retain multi-branch filtering and global view.
     */
    public function test_admin_and_super_admin_can_filter_by_branch_or_see_all(): void
    {
        $delA = $this->createDeliveryForBranch($this->branchA, 'ORD-BR-A-007');
        $delB = $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-007');

        // Admin seeing all
        $responseAll = $this->actingAs($this->admin)->get('/deliveries?branch_id=all');
        $responseAll->assertOk();
        $deliveriesAll = collect($responseAll->viewData('page')['props']['deliveries']['data'])->pluck('id')->all();
        $this->assertContains($delA->id, $deliveriesAll);
        $this->assertContains($delB->id, $deliveriesAll);

        // Admin filtering by Branch A
        $responseA = $this->actingAs($this->admin)->get("/deliveries?branch_id={$this->branchA->id}");
        $responseA->assertOk();
        $deliveriesA = collect($responseA->viewData('page')['props']['deliveries']['data'])->pluck('id')->all();
        $this->assertContains($delA->id, $deliveriesA);
        $this->assertNotContains($delB->id, $deliveriesA);

        // Super Admin filtering by Branch B
        $responseB = $this->actingAs($this->superAdmin)->get("/deliveries?branch_id={$this->branchB->id}");
        $responseB->assertOk();
        $deliveriesB = collect($responseB->viewData('page')['props']['deliveries']['data'])->pluck('id')->all();
        $this->assertContains($delB->id, $deliveriesB);
        $this->assertNotContains($delA->id, $deliveriesB);
    }

    /**
     * Test 7: Cashier cannot cancel or verify returns on another branch's delivery.
     */
    public function test_cashier_cannot_cancel_or_verify_return_for_other_branch_delivery(): void
    {
        $delB = $this->createDeliveryForBranch($this->branchB, 'ORD-BR-B-008', 'pending');

        // Cashier A attempts to cancel Branch B delivery
        $cancelResponse = $this->actingAs($this->cashierA)->post("/deliveries/{$delB->id}/cancel", [
            'reason' => 'Unauthorized cancellation attempt',
        ]);
        $cancelResponse->assertSessionHas('error');
        $this->assertEquals('pending', $delB->fresh()->status);

        // Cashier A attempts to verify return for Branch B delivery
        $verifyResponse = $this->actingAs($this->cashierA)->postJson("/deliveries/{$delB->id}/verify-return", [
            'decision' => 'cancel',
        ]);
        $verifyResponse->assertStatus(403);
    }
}
