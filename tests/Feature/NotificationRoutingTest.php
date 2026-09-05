<?php

namespace Tests\Feature;

use App\Events\OrderStatusUpdated;
use App\Jobs\SendCustomerPushNotification;
use App\Models\Branch;
use App\Models\CustomerNotification;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderCancellationRequest;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NotificationRoutingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashierBranch1;
    protected User $cashierBranch2;
    protected User $customerUser;
    protected Branch $branch1;
    protected Branch $branch2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create(['name' => 'Branch A', 'address' => 'Santa Cruz']);
        $this->branch2 = Branch::create(['name' => 'Branch B', 'address' => 'Victoria']);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'role' => 'admin',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch1 = User::factory()->create([
            'name' => 'Cashier Branch 1',
            'role' => 'cashier',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch2 = User::factory()->create([
            'name' => 'Cashier Branch 2',
            'role' => 'cashier',
            'branch_id' => $this->branch2->id,
        ]);

        $this->customerUser = User::factory()->create([
            'name' => 'Customer User',
            'role' => 'customer',
        ]);
    }

    /**
     * Test 1 & 2: Pickup order notification contains pickup URL and structured metadata
     */
    public function test_pickup_order_notification_contains_pickup_metadata_and_route(): void
    {
        $pickupOrder = Order::create([
            'order_number'     => 'ORD-PICKUP-101',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Juan Dela Cruz',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 450.00,
            'status'           => 'pending',
            'created_at'       => now(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/notifications');

        $response->assertOk();
        $notifications = $response->json('notifications');
        $this->assertNotEmpty($notifications);

        $orderNotif = collect($notifications)->firstWhere('order_id', $pickupOrder->id);
        $this->assertNotNull($orderNotif);
        $this->assertEquals('new_order', $orderNotif['type']);
        $this->assertEquals('pickup', $orderNotif['fulfillment_type']);
        $this->assertTrue($orderNotif['is_pickup']);
        $this->assertStringContainsString('/pickups', $orderNotif['url']);
        $this->assertStringNotContainsString('/deliveries', $orderNotif['url']);
        $this->assertStringContainsString('order_id=' . $pickupOrder->id, $orderNotif['url']);
    }

    /**
     * Test 3 & 4: Delivery order notification contains delivery URL and structured metadata
     */
    public function test_delivery_order_notification_contains_delivery_metadata_and_route(): void
    {
        $deliveryOrder = Order::create([
            'order_number'     => 'ORD-DELIV-202',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Maria Santos',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'total_amount'     => 750.00,
            'status'           => 'pending',
            'created_at'       => now(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/notifications');

        $response->assertOk();
        $notifications = $response->json('notifications');
        $this->assertNotEmpty($notifications);

        $orderNotif = collect($notifications)->firstWhere('order_id', $deliveryOrder->id);
        $this->assertNotNull($orderNotif);
        $this->assertEquals('new_order', $orderNotif['type']);
        $this->assertEquals('delivery', $orderNotif['fulfillment_type']);
        $this->assertFalse($orderNotif['is_pickup']);
        $this->assertStringContainsString('/deliveries', $orderNotif['url']);
        $this->assertStringNotContainsString('/pickups', $orderNotif['url']);
        $this->assertStringContainsString('order_id=' . $deliveryOrder->id, $orderNotif['url']);
    }

    /**
     * Test 5: Multiple notifications with both Pickup and Delivery coexist accurately
     */
    public function test_multiple_mixed_notifications_preserve_distinct_routes(): void
    {
        $pickup = Order::create([
            'order_number'     => 'ORD-MIX-P1',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Pickup Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 300.00,
            'status'           => 'pending',
            'created_at'       => now()->subMinutes(2),
        ]);

        $delivery = Order::create([
            'order_number'     => 'ORD-MIX-D1',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Delivery Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'total_amount'     => 600.00,
            'status'           => 'pending',
            'created_at'       => now()->subMinute(),
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/notifications');
        $response->assertOk();

        $notifications = collect($response->json('notifications'));
        $pNotif = $notifications->firstWhere('order_id', $pickup->id);
        $dNotif = $notifications->firstWhere('order_id', $delivery->id);

        $this->assertStringContainsString('/pickups', $pNotif['url']);
        $this->assertEquals('pickup', $pNotif['fulfillment_type']);

        $this->assertStringContainsString('/deliveries', $dNotif['url']);
        $this->assertEquals('delivery', $dNotif['fulfillment_type']);
    }

    /**
     * Test 6: Branch security isolation for notifications
     */
    public function test_branch_cashier_only_receives_assigned_branch_notifications(): void
    {
        $b1Order = Order::create([
            'order_number'     => 'ORD-B1',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Branch 1 Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 300.00,
            'status'           => 'pending',
            'created_at'       => now(),
        ]);

        $b2Order = Order::create([
            'order_number'     => 'ORD-B2',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch2->id,
            'customer_name'    => 'Branch 2 Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 400.00,
            'status'           => 'pending',
            'created_at'       => now(),
        ]);

        // Cashier in Branch 1
        $response = $this->actingAs($this->cashierBranch1)->getJson('/api/v1/notifications');
        $response->assertOk();
        $notifs = collect($response->json('notifications'));

        $this->assertNotNull($notifs->firstWhere('order_id', $b1Order->id));
        $this->assertNull($notifs->firstWhere('order_id', $b2Order->id));
    }

    /**
     * Test 7: Direct navigation to /pickups with order_id query resolves the specific order
     */
    public function test_pickups_dashboard_filters_direct_order_id_from_notification_click(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-PICKUP-DIRECT',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Direct Pickup Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 500.00,
            'status'           => 'ready_for_pickup',
            'created_at'       => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/pickups?order_id=' . $order->id);

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Pickups/Index')
            ->has('pickups.data', 1)
            ->where('pickups.data.0.id', $order->id)
            ->where('pickups.data.0.order_number', 'ORD-PICKUP-DIRECT')
        );
    }

    /**
     * Test 8: Direct navigation to /deliveries with order_id query resolves the specific order
     */
    public function test_deliveries_dashboard_filters_direct_order_id_from_notification_click(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-DELIV-DIRECT',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Direct Delivery Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'total_amount'     => 800.00,
            'status'           => 'in_transit',
            'created_at'       => now(),
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'tracking_number'  => 'TRK-DIRECT-1',
            'customer_name'    => $order->customer_name,
            'customer_phone'   => '09123456789',
            'customer_address' => 'Sample Address',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 50.00,
            'status'           => Delivery::STATUS_OUT_FOR_DELIVERY,
        ]);

        $response = $this->actingAs($this->admin)->get('/deliveries?order_id=' . $order->id);

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Deliveries')
            ->has('deliveries.data', 1)
            ->where('deliveries.data.0.order_id', $order->id)
        );
    }

    /**
     * Test 9: Customer Push Notification distinguishes pickup vs delivery status messaging
     */
    public function test_customer_push_notification_uses_context_aware_pickup_message(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-P-NOTIF-1',
            'user_id'          => $this->customerUser->id,
            'branch_id'        => $this->branch1->id,
            'customer_name'    => 'Juan Customer',
            'order_source'     => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_PICKUP,
            'total_amount'     => 350.00,
            'status'           => 'ready_for_pickup',
            'created_at'       => now(),
        ]);

        SendCustomerPushNotification::forOrderStatus(
            userId:          $this->customerUser->id,
            orderId:         $order->id,
            status:          'ready_for_pickup',
            orderNumber:     $order->order_number,
            fulfillmentType: 'pickup',
        );

        $saved = CustomerNotification::where('user_id', $this->customerUser->id)->latest()->first();
        $this->assertNotNull($saved);
        $this->assertEquals('🛍️ Ready for Pickup', $saved->title);
        $this->assertStringContainsString('ready for pickup at the store', $saved->body);
        $this->assertEquals('pickup', $saved->data['fulfillment_type']);
        $this->assertTrue($saved->data['is_pickup']);
    }
}
