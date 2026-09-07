<?php

namespace Tests\Feature;

use App\Events\OrderStatusUpdated;
use App\Events\RiderStatusUpdated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderCancellationAndReturnWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $cashier;
    protected Rider $rider1;
    protected Rider $rider2;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'      => 'Victoria Branch',
            'address'   => 'Victoria, Laguna',
            'latitude'  => 14.229371,
            'longitude' => 121.328383,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'Cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->rider1 = Rider::create([
            'name'      => 'Rider Marco',
            'email'     => 'marco.rider@example.com',
            'password'  => bcrypt('password123'),
            'phone'     => '09123456781',
            'branch_id' => $this->branch->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $this->rider2 = Rider::create([
            'name'      => 'Rider Juan',
            'email'     => 'juan.rider@example.com',
            'password'  => bcrypt('password123'),
            'phone'     => '09123456782',
            'branch_id' => $this->branch->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Sushi Rolls',
            'slug' => 'sushi-rolls',
        ]);

        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'selling_price' => 150.00,
            'cost_price'    => 80.00,
            'price'         => 150.00,
            'is_active'     => true,
        ]);

        config(['broadcasting.default' => 'null']);
        config(['broadcasting.connections.pusher.driver' => 'null']);
        Event::fake();
    }

    /**
     * Helper to create an active online delivery order in ready_for_pickup state.
     */
    protected function createReadyDeliveryOrder(string $orderNumber = 'ORD-1001'): array
    {
        $order = Order::create([
            'order_number'     => $orderNumber,
            'branch_id'        => $this->branch->id,
            'user_id'          => $this->cashier->id,
            'customer_name'    => 'Maria Santos',
            'contact_number'   => '09171234567',
            'address'          => '123 Rizal St, Victoria, Laguna',
            'fulfillment_type' => 'delivery',
            'payment_method'   => 'cash',
            'payment_status'   => 'unpaid',
            'status'           => 'ready_for_pickup',
            'subtotal'         => 300.00,
            'delivery_fee'     => 50.00,
            'total_amount'     => 350.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'price'      => 150.00,
            'unit_price' => 150.00,
            'subtotal'   => 300.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'branch_id'        => $this->branch->id,
            'customer_name'    => $order->customer_name,
            'customer_phone'   => $order->contact_number,
            'customer_address' => $order->address,
            'delivery_fee'     => 50.00,
            'status'           => 'ready_for_pickup',
            'rider_id'         => null,
        ]);

        return [$order, $delivery];
    }

    /**
     * 1. PRE-PICKUP CANCELLATION:
     * Rider accepts delivery -> cancels BEFORE pickup -> order stays active,
     * rider is released to available, delivery returns to pool, second rider accepts.
     */
    public function test_rider_cancels_before_pickup_releases_rider_and_returns_order_to_available_pool(): void
    {
        [$order, $delivery] = $this->createReadyDeliveryOrder('ORD-PRE-01');

        // Step 1: Rider 1 accepts the delivery
        Sanctum::actingAs($this->rider1);
        $acceptResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $acceptResponse->assertStatus(200);

        $delivery->refresh();
        $this->rider1->refresh();
        $this->assertEquals('assigned_to_rider', $delivery->status);
        $this->assertEquals($this->rider1->id, $delivery->rider_id);
        $this->assertNull($delivery->picked_up_at);
        $this->assertEquals('busy', $this->rider1->status);

        // Step 2: Rider 1 cancels before picking up
        $cancelResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", [
            'reason' => 'Motorcycle flat tire on the way to store',
            'notes'  => 'Cannot make it to branch',
        ]);

        $cancelResponse->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'workflow' => 'pre_pickup_cancelled',
                'status'   => 'ready_for_pickup',
            ]);

        // Assert delivery is reset to available pool and rider 1 is released
        $delivery->refresh();
        $order->refresh();
        $this->rider1->refresh();

        $this->assertEquals('ready_for_pickup', $delivery->status);
        $this->assertNull($delivery->rider_id);
        $this->assertNull($delivery->picked_up_at);
        $this->assertEquals('available', $this->rider1->status);

        // Crucial requirement: Customer order MUST remain active and NOT cancelled
        $this->assertNotEquals('cancelled', $order->status);
        $this->assertEquals('ready_for_pickup', $order->status);

        // Step 3: Rider 2 checks available deliveries and sees the order
        Sanctum::actingAs($this->rider2);
        $availableResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $availableResponse->assertStatus(200);

        $availableIds = collect($availableResponse->json('data'))->pluck('delivery_id')->all();
        $this->assertContains($delivery->id, $availableIds);

        // Step 4: Rider 2 accepts the unassigned delivery
        $rider2AcceptResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $rider2AcceptResponse->assertStatus(200);

        $delivery->refresh();
        $this->assertEquals('assigned_to_rider', $delivery->status);
        $this->assertEquals($this->rider2->id, $delivery->rider_id);
    }

    /**
     * 2. POST-PICKUP CANCELLATION:
     * Rider has picked up food -> cancels -> food MUST be returned to store ->
     * delivery enters return_required -> rider remains busy.
     */
    public function test_rider_cancels_after_pickup_initiates_return_workflow_and_keeps_order_active(): void
    {
        [$order, $delivery] = $this->createReadyDeliveryOrder('ORD-POST-01');

        // Rider 1 accepts & picks up
        Sanctum::actingAs($this->rider1);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);

        $delivery->refresh();
        $this->assertEquals('picked_up', $delivery->status);
        $this->assertNotNull($delivery->picked_up_at);

        // Rider 1 cancels after pickup (e.g. road blocked / customer unreachable)
        $cancelResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", [
            'reason' => 'Customer address unreachable due to heavy flood',
            'notes'  => 'Returning food to branch',
        ]);

        $cancelResponse->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'workflow' => 'return_required',
                'status'   => 'return_required',
            ]);

        $delivery->refresh();
        $order->refresh();
        $this->rider1->refresh();

        // Delivery is in return_required state
        $this->assertEquals(Delivery::STATUS_RETURN_REQUIRED, $delivery->status);
        $this->assertEquals(Delivery::RETURN_STATUS_RETURN_REQUIRED, $delivery->return_status);
        $this->assertEquals('Customer address unreachable due to heavy flood', $delivery->return_reason);
        $this->assertNotNull($delivery->return_requested_at);

        // Order is NOT cancelled
        $this->assertNotEquals('cancelled', $order->status);

        // Rider 1 remains responsible / busy until cashier verifies return
        $this->assertEquals('busy', $this->rider1->status);
        $this->assertEquals($this->rider1->id, $delivery->rider_id);

        // The order MUST NOT appear in the available pool for other riders
        Sanctum::actingAs($this->rider2);
        $availableResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $availableIds = collect($availableResponse->json('data'))->pluck('delivery_id')->all();
        $this->assertNotContains($delivery->id, $availableIds);
    }

    /**
     * 3. RIDER REPORTS RETURN TO STORE:
     * Rider arrives at store -> calls return-reported -> status becomes return_pending_verification.
     */
    public function test_rider_reports_return_at_branch(): void
    {
        [$order, $delivery] = $this->createReadyDeliveryOrder('ORD-REPORT-01');

        Sanctum::actingAs($this->rider1);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", ['reason' => 'Customer cancelled at door'])->assertStatus(200);

        // Rider marks return reported
        $reportResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/return-reported", [
            'notes' => 'Food brought to cashier counter in sealed container',
        ]);

        $reportResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status'  => 'return_pending_verification',
            ]);

        $delivery->refresh();
        $this->assertEquals(Delivery::STATUS_RETURN_PENDING_VERIFICATION, $delivery->status);
        $this->assertEquals(Delivery::RETURN_STATUS_RETURN_PENDING_VERIFICATION, $delivery->return_status);
        $this->assertNotNull($delivery->return_reported_at);
    }

    /**
     * 4. CASHIER VERIFICATION -> REASSIGN:
     * Cashier confirms physical return -> chooses REASSIGN ->
     * Original rider is released, delivery resets to ready_for_pickup, second rider accepts.
     */
    public function test_cashier_verifies_return_and_reassigns_delivery_to_rider_pool(): void
    {
        [$order, $delivery] = $this->createReadyDeliveryOrder('ORD-REASSIGN-01');

        // Rider 1 accept -> pickup -> cancel -> report return
        Sanctum::actingAs($this->rider1);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", ['reason' => 'Vehicle breakdown'])->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/return-reported")->assertStatus(200);

        // Cashier verifies return and selects 'reassign'
        Sanctum::actingAs($this->cashier);
        $verifyResponse = $this->postJson("/api/v1/branch/deliveries/{$delivery->id}/confirm-return", [
            'decision' => 'reassign',
            'notes'    => 'Food condition checked and in good shape. Prepared for next rider.',
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'decision' => 'reassign',
            ]);

        $delivery->refresh();
        $order->refresh();
        $this->rider1->refresh();

        // 1. Original rider is released
        $this->assertEquals('available', $this->rider1->status);

        // 2. Delivery is reset to ready_for_pickup with rider_id = null
        $this->assertEquals('ready_for_pickup', $delivery->status);
        $this->assertNull($delivery->rider_id);
        $this->assertNull($delivery->picked_up_at);
        $this->assertEquals(Delivery::RETURN_STATUS_RETURN_VERIFIED, $delivery->return_status);
        $this->assertEquals('reassign', $delivery->return_resolution);
        $this->assertNotNull($delivery->return_verified_at);
        $this->assertEquals($this->cashier->id, $delivery->return_verified_by);

        // 3. Customer order remains active with original number
        $this->assertEquals('ORD-REASSIGN-01', $order->order_number);
        $this->assertEquals('ready_for_pickup', $order->status);

        // 4. Rider 2 can now view and accept the delivery
        Sanctum::actingAs($this->rider2);
        $availableResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $availableIds = collect($availableResponse->json('data'))->pluck('delivery_id')->all();
        $this->assertContains($delivery->id, $availableIds);

        $acceptResponse = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept");
        $acceptResponse->assertStatus(200);

        $delivery->refresh();
        $this->assertEquals('assigned_to_rider', $delivery->status);
        $this->assertEquals($this->rider2->id, $delivery->rider_id);
    }

    /**
     * 5. CASHIER VERIFICATION -> CANCEL:
     * Cashier confirms physical return -> chooses CANCEL ->
     * Original rider is released, order and delivery are permanently cancelled.
     */
    public function test_cashier_verifies_return_and_permanently_cancels_order(): void
    {
        [$order, $delivery] = $this->createReadyDeliveryOrder('ORD-CANCEL-01');

        Sanctum::actingAs($this->rider1);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", ['reason' => 'Customer called to cancel order'])->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/return-reported")->assertStatus(200);

        // Cashier verifies return and selects 'cancel'
        Sanctum::actingAs($this->cashier);
        $verifyResponse = $this->postJson("/api/v1/branch/deliveries/{$delivery->id}/confirm-return", [
            'decision' => 'cancel',
            'notes'    => 'Customer confirmed cancellation by phone.',
        ]);

        $verifyResponse->assertStatus(200)
            ->assertJson([
                'success'  => true,
                'decision' => 'cancel',
            ]);

        $delivery->refresh();
        $order->refresh();
        $this->rider1->refresh();

        // 1. Original rider is released
        $this->assertEquals('available', $this->rider1->status);

        // 2. Both Delivery and Order are marked cancelled
        $this->assertEquals('cancelled', $delivery->status);
        $this->assertEquals('cancelled', $order->status);
        $this->assertEquals(Delivery::RETURN_STATUS_RETURN_VERIFIED, $delivery->return_status);
        $this->assertEquals('cancel', $delivery->return_resolution);
        $this->assertNotNull($delivery->cancelled_at);

        // 3. Delivery is NOT available to other riders
        Sanctum::actingAs($this->rider2);
        $availableResponse = $this->getJson('/api/v1/rider/available-deliveries');
        $availableIds = collect($availableResponse->json('data'))->pluck('delivery_id')->all();
        $this->assertNotContains($delivery->id, $availableIds);
    }

    /**
     * 6. POS DELIVERY RETURN AND REASSIGN WORKFLOW:
     * Tests full return flow on POS-originated deliveries ($delivery->sale_id).
     */
    public function test_pos_delivery_cancellation_and_return_workflow(): void
    {
        $sale = Sale::create([
            'branch_id'      => $this->branch->id,
            'user_id'        => $this->cashier->id,
            'order_number'   => 'POS-9988',
            'invoice_number' => 'INV-9988',
            'type'           => 'delivery',
            'subtotal'       => 400.00,
            'total'          => 450.00,
            'paid_amount'    => 450.00,
            'delivery_fee'   => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'order_id'         => null,
            'branch_id'        => $this->branch->id,
            'customer_name'    => 'POS Walk-in Caller',
            'customer_phone'   => '09998887777',
            'customer_address' => '789 San Pedro St, Victoria',
            'delivery_fee'     => 50.00,
            'status'           => 'ready_for_pickup',
            'rider_id'         => null,
        ]);

        // Rider 1 accepts & picks up
        Sanctum::actingAs($this->rider1);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup")->assertStatus(200);

        // Rider 1 initiates return
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/cancel", [
            'reason' => 'Delivery location flooded',
        ])->assertStatus(200);

        // Rider 1 reports return
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/return-reported")->assertStatus(200);

        // Cashier confirms and reassigns
        Sanctum::actingAs($this->cashier);
        $verifyResponse = $this->postJson("/api/v1/branch/deliveries/{$delivery->id}/confirm-return", [
            'decision' => 'reassign',
        ]);
        $verifyResponse->assertStatus(200);

        $delivery->refresh();
        $this->rider1->refresh();

        $this->assertEquals('available', $this->rider1->status);
        $this->assertEquals('ready_for_pickup', $delivery->status);
        $this->assertEquals('POS-9988', $delivery->order_number);
        $this->assertTrue($delivery->is_pos);

        // Rider 2 accepts reissued POS delivery
        Sanctum::actingAs($this->rider2);
        $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/accept")->assertStatus(200);

        $delivery->refresh();
        $this->assertEquals($this->rider2->id, $delivery->rider_id);
    }
}
