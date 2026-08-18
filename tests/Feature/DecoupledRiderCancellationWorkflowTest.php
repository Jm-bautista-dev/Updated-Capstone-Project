<?php

namespace Tests\Feature;

use App\Events\CancellationApprovedEvent;
use App\Events\CancellationRejectedEvent;
use App\Models\Branch;
use App\Models\CancellationRequest;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class DecoupledRiderCancellationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $manager;
    protected Rider $rider;
    protected Order $order;
    protected CancellationRequest $cancellationRequest;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'    => 'Victoria Branch',
            'address' => 'Victoria, Laguna',
        ]);

        $this->manager = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->rider = Rider::create([
            'name'      => 'Juan Rider',
            'email'     => 'juan.rider@example.com',
            'password'  => bcrypt('password'),
            'phone'     => '09123456789',
            'branch_id' => $this->branch->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $this->order = Order::create([
            'order_number'            => 'ORD-9001',
            'branch_id'               => $this->branch->id,
            'rider_id'                => $this->rider->id,
            'customer_name'           => 'Juan Dela Cruz',
            'contact_number'          => '09123456789',
            'address'                 => '123 Main St',
            'total_amount'            => 450.00,
            'status'                  => 'in_transit',
            'is_cancellation_pending' => true,
            'cancellation_status'     => 'pending',
        ]);

        $this->cancellationRequest = CancellationRequest::create([
            'order_id' => $this->order->id,
            'rider_id' => $this->rider->id,
            'reason'   => 'Customer unreachable at delivery point',
            'notes'    => 'Tried calling 3 times',
            'status'   => 'pending',
        ]);
    }

    /**
     * Test 1: Manager Rejection leaves order status as in_transit (never 'rejected')
     * and broadcasts CancellationRejectedEvent to private-rider.{rider_id}
     */
    public function test_manager_rejection_keeps_order_in_transit_and_broadcasts(): void
    {
        Event::fake([CancellationRejectedEvent::class]);

        $response = $this->actingAs($this->manager, 'sanctum')->postJson(
            "/api/branch/cancellation-requests/{$this->cancellationRequest->id}/reject",
            ['notes' => 'Customer called back, please proceed to delivery.']
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('cancellation_request.status', 'rejected')
            ->assertJsonPath('order.is_cancellation_pending', false)
            ->assertJsonPath('order.cancellation_status', 'rejected')
            ->assertJsonPath('order.status', 'in_transit');

        $this->cancellationRequest->refresh();
        $this->assertEquals('rejected', $this->cancellationRequest->status);
        $this->assertEquals($this->manager->id, $this->cancellationRequest->reviewed_by);
        $this->assertNotNull($this->cancellationRequest->reviewed_at);

        $this->order->refresh();
        $this->assertFalse($this->order->is_cancellation_pending);
        $this->assertEquals('rejected', $this->order->cancellation_status);
        $this->assertEquals('in_transit', $this->order->status);

        Event::assertDispatched(CancellationRejectedEvent::class, function ($event) {
            return $event->cancellation->id === $this->cancellationRequest->id
                && $event->order->id === $this->order->id
                && $event->order->status === 'in_transit';
        });
    }

    /**
     * Test 2: Manager Approval cancels the order and broadcasts CancellationApprovedEvent
     */
    public function test_manager_approval_cancels_order_and_broadcasts(): void
    {
        Event::fake([CancellationApprovedEvent::class]);

        $response = $this->actingAs($this->manager, 'sanctum')->postJson(
            "/api/branch/cancellation-requests/{$this->cancellationRequest->id}/approve",
            ['notes' => 'Approved. Please return items to the store.']
        );

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('cancellation_request.status', 'approved')
            ->assertJsonPath('order.is_cancellation_pending', false)
            ->assertJsonPath('order.cancellation_status', 'approved')
            ->assertJsonPath('order.status', 'cancelled');

        $this->order->refresh();
        $this->assertFalse($this->order->is_cancellation_pending);
        $this->assertEquals('approved', $this->order->cancellation_status);
        $this->assertEquals('cancelled', $this->order->status);

        Event::assertDispatched(CancellationApprovedEvent::class, function ($event) {
            return $event->cancellation->id === $this->cancellationRequest->id
                && $event->order->id === $this->order->id
                && $event->order->status === 'cancelled';
        });
    }

    /**
     * Test 3: Duplicate rejection / resolution returns 409 conflict
     */
    public function test_duplicate_resolution_returns_409(): void
    {
        $this->cancellationRequest->update(['status' => 'rejected']);

        $response = $this->actingAs($this->manager, 'sanctum')->postJson(
            "/api/branch/cancellation-requests/{$this->cancellationRequest->id}/reject"
        );

        $response->assertStatus(409);
    }

    /**
     * Test 4: Rider my-orders endpoint returns in_transit orders even when cancellation_status is rejected
     */
    public function test_rider_my_orders_includes_rejected_cancellation_orders(): void
    {
        // Rejection happens
        $this->order->update([
            'is_cancellation_pending' => false,
            'cancellation_status'     => 'rejected',
            'status'                  => 'in_transit',
        ]);

        $response = $this->actingAs($this->rider, 'sanctum')->getJson('/api/rider/my-orders');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->order->id, $data[0]['id']);
        $this->assertEquals('in_transit', $data[0]['status']);
        $this->assertEquals('rejected', $data[0]['cancellation_status']);
    }

    /**
     * Test 5: Rider cancellation-requests returns history ledger
     */
    public function test_rider_cancellation_requests_ledger(): void
    {
        $response = $this->actingAs($this->rider, 'sanctum')->getJson('/api/rider/cancellation-requests');

        $response->assertOk()
            ->assertJsonPath('success', true);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals($this->cancellationRequest->id, $data[0]['id']);
        $this->assertEquals('pending', $data[0]['status']);
    }
}
