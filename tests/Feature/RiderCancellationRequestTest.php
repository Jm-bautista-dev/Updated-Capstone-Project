<?php

namespace Tests\Feature;

use App\Events\CancellationRequested;
use App\Events\CancellationResolved;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderCancellationRequest;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class RiderCancellationRequestTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashier;
    protected Rider $rider;
    protected Branch $testBranch;
    protected Order $order;
    protected Sale $sale;
    protected Delivery $delivery;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create(['name' => 'Test Branch', 'address' => 'Test Address']);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => null,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->testBranch->id,
        ]);

        $this->rider = Rider::create([
            'name' => 'John Rider',
            'email' => 'rider@example.com',
            'password' => bcrypt('password'),
            'phone' => '09123456789',
            'branch_id' => $this->testBranch->id,
            'status' => 'available',
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number' => 'ORD-9901',
            'branch_id' => $this->testBranch->id,
            'user_id' => $this->cashier->id,
            'customer_name' => 'Test Customer',
            'customer_phone' => '09123456789',
            'delivery_address' => '123 Main St',
            'status' => 'assigned_to_rider',
            'total_amount' => 500,
            'payment_method' => 'cod',
            'payment_status' => 'pending',
        ]);

        $this->sale = Sale::create([
            'branch_id' => $this->testBranch->id,
            'user_id' => $this->cashier->id,
            'order_number' => 'ORD-9901',
            'total' => 500,
            'paid_amount' => 500,
            'payment_method' => 'cod',
            'status' => 'completed',
        ]);

        $this->delivery = Delivery::create([
            'order_id' => $this->order->id,
            'sale_id' => $this->sale->id,
            'rider_id' => $this->rider->id,
            'delivery_type' => 'internal',
            'customer_name' => 'Test Customer',
            'customer_address' => '123 Main St',
            'status' => 'assigned_to_rider',
            'delivery_fee' => 50,
        ]);
    }

    // ─── Test 1: Rider can submit a cancellation request ──────────────────────
    public function test_rider_can_submit_cancellation_request(): void
    {
        Event::fake([CancellationRequested::class]);

        $response = $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
                'notes'  => 'Called 5 times',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Cancellation request submitted successfully. Waiting for cashier approval.',
            ]);

        $this->assertDatabaseHas('order_cancellation_requests', [
            'order_id' => $this->order->id,
            'requested_by_rider_id' => $this->rider->id,
            'status' => 'pending',
            'reason' => 'Customer unreachable',
        ]);

        $this->order->refresh();
        $this->assertEquals('cancellation_requested', $this->order->status);

        Event::assertDispatched(CancellationRequested::class);
    }

    // ─── Test 2: Order & Delivery transition to cancellation_requested ────────
    public function test_order_and_delivery_transition_to_cancellation_requested(): void
    {
        Event::fake([CancellationRequested::class]);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $this->order->refresh();
        $this->delivery->refresh();

        $this->assertEquals('cancellation_requested', $this->order->status);
        $this->assertEquals('cancellation_requested', $this->delivery->status);
    }

    // ─── Test 3: Duplicate cancellation request returns 422 ───────────────────
    public function test_duplicate_cancellation_request_returns_422(): void
    {
        Event::fake([CancellationRequested::class]);

        // First request
        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        // Second request (duplicate, order already in cancellation_requested state)
        $response = $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Another reason',
            ]);

        $response->assertStatus(422)
            ->assertJson(['success' => false]);
    }

    // ─── Test 4: Cashier can accept a cancellation request ────────────────────
    public function test_cashier_can_accept_cancellation_request(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        // Rider submits request
        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        // Cashier accepts
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/accept");

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $cancellationRequest->refresh();
        $this->order->refresh();

        $this->assertEquals('approved', $cancellationRequest->status);
        $this->assertEquals('cancelled', $this->order->status);

        Event::assertDispatched(CancellationResolved::class);
    }

    // ─── Test 5: Cashier can reject a cancellation request ────────────────────
    public function test_cashier_can_reject_cancellation_request(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        // Rider submits request
        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        // Cashier rejects
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/reject", [
                'rejection_reason' => 'Customer confirmed they are available',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
            ]);

        $cancellationRequest->refresh();
        $this->order->refresh();

        $this->assertEquals('rejected', $cancellationRequest->status);
        $this->assertEquals('assigned_to_rider', $this->order->status); // reverted
        $this->assertEquals('Customer confirmed they are available', $cancellationRequest->rejection_reason);

        Event::assertDispatched(CancellationResolved::class);
    }

    // ─── Test 6: Already resolved request returns 409 ─────────────────────────
    public function test_already_resolved_request_returns_409(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        // First decision: accept
        $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/accept");

        // Second decision: should fail
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/reject", [
                'rejection_reason' => 'Changed my mind',
            ]);

        $response->assertStatus(409);
    }

    // ─── Test 7: Unauthorized branch cashier cannot approve ───────────────────
    public function test_unauthorized_branch_cashier_cannot_approve(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        $otherBranch = Branch::create(['name' => 'Other Branch', 'address' => 'Other Address']);
        $otherCashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $otherBranch->id,
        ]);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        // Other branch cashier tries to approve
        $response = $this->actingAs($otherCashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/accept");

        $response->assertStatus(403);
    }

    // ─── Test 8: Admin can approve any branch's request ───────────────────────
    public function test_admin_can_approve_any_branch_request(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        // Admin approves
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/accept");

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    // ─── Test 9: Pending requests endpoint returns branch-scoped data ─────────
    public function test_pending_requests_returns_branch_scoped_data(): void
    {
        Event::fake([CancellationRequested::class]);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Customer unreachable',
            ]);

        // Cashier of same branch can see pending requests
        $response = $this->actingAs($this->cashier, 'sanctum')
            ->getJson('/api/v1/cancellation-requests/pending');

        $response->assertOk()
            ->assertJsonCount(1, 'requests');

        // Other branch cashier cannot see them
        $otherBranch = Branch::create(['name' => 'Other Branch', 'address' => 'Other Address']);
        $otherCashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $otherBranch->id,
        ]);

        $otherResponse = $this->actingAs($otherCashier, 'sanctum')
            ->getJson('/api/v1/cancellation-requests/pending');

        $otherResponse->assertOk()
            ->assertJsonCount(0, 'requests');
    }

    // ─── Test 10: Rejection reverts order to previous state ───────────────────
    public function test_rejection_reverts_order_to_previous_operational_state(): void
    {
        Event::fake([CancellationRequested::class, CancellationResolved::class]);

        // Set order/delivery to 'in_transit' before cancellation request
        $this->order->update(['status' => 'in_transit']);
        $this->delivery->update(['status' => 'in_transit']);

        $this->actingAs($this->rider, 'sanctum')
            ->postJson("/api/v1/rider/orders/{$this->order->id}/cancel", [
                'reason' => 'Safety concern',
            ]);

        $cancellationRequest = OrderCancellationRequest::where('order_id', $this->order->id)->first();

        $this->assertEquals('in_transit', $cancellationRequest->previous_order_status);
        $this->assertEquals('in_transit', $cancellationRequest->previous_delivery_status);

        // Cashier rejects
        $this->actingAs($this->cashier, 'sanctum')
            ->postJson("/api/v1/cancellation-requests/{$cancellationRequest->id}/reject", [
                'rejection_reason' => 'Continue delivery',
            ]);

        $this->order->refresh();
        $this->delivery->refresh();

        $this->assertEquals('in_transit', $this->order->status);
        $this->assertEquals('in_transit', $this->delivery->status);
    }
}
