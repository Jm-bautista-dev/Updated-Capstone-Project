<?php

namespace Tests\Feature;

use App\Events\CancellationApprovedEvent;
use App\Events\CancellationRejectedEvent;
use App\Events\CancellationRequested;
use App\Events\CancellationResolved;
use App\Events\OrderAssigned;
use App\Events\OrderStatusUpdated;
use App\Events\SaleCreated;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderCancellationRequest;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosDeliveryCanonicalOrderNumberTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $cashier;
    protected Rider $rider;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'    => 'Victoria Branch',
            'address' => 'Victoria, Laguna',
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->rider = Rider::create([
            'name'      => 'Rider Marco',
            'email'     => 'marco.rider@example.com',
            'password'  => bcrypt('password123'),
            'phone'     => '09123456789',
            'branch_id' => $this->branch->id,
            'status'    => 'available',
            'is_active' => true,
        ]);
    }

    public function test_pos_delivery_serializes_pos_order_number_and_identity_fields(): void
    {
        $sale = Sale::create([
            'branch_id'      => $this->branch->id,
            'user_id'        => $this->cashier->id,
            'order_number'   => 'POS-10482',
            'invoice_number' => 'INV-10482',
            'type'           => 'delivery',
            'subtotal'       => 500.00,
            'total'          => 550.00,
            'paid_amount'    => 550.00,
            'delivery_fee'   => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'order_id'         => null,
            'rider_id'         => $this->rider->id,
            'customer_name'    => 'POS Customer',
            'customer_phone'   => '09187654321',
            'customer_address' => '456 Market St, Victoria',
            'delivery_fee'     => 50.00,
            'status'           => 'assigned_to_rider',
        ]);

        $this->assertEquals('POS-10482', $delivery->order_number);
        $this->assertTrue($delivery->is_pos);
        $this->assertEquals('pos', $delivery->order_source);

        $json = $delivery->toArray();
        $this->assertEquals('POS-10482', $json['order_number']);
        $this->assertTrue($json['is_pos']);
        $this->assertEquals('pos', $json['order_source']);
        $this->assertEquals($delivery->id, $json['id']);
        $this->assertEquals($sale->id, $json['sale_id']);
        $this->assertNull($json['order_id']);
    }

    public function test_customer_mobile_order_serializes_customer_order_number_and_identity_fields(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-12345',
            'branch_id'        => $this->branch->id,
            'user_id'          => $this->cashier->id,
            'customer_name'    => 'Mobile Customer',
            'contact_number'   => '09187654321',
            'address'          => '789 App St, Victoria',
            'total_amount'     => 350.00,
            'delivery_fee'     => 50.00,
            'fulfillment_type' => 'delivery',
            'order_source'     => 'mobile_app',
            'status'           => 'assigned_to_rider',
            'rider_id'         => $this->rider->id,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'sale_id'          => null,
            'rider_id'         => $this->rider->id,
            'customer_name'    => 'Mobile Customer',
            'customer_phone'   => '09187654321',
            'customer_address' => '789 App St, Victoria',
            'delivery_fee'     => 50.00,
            'status'           => 'assigned_to_rider',
        ]);

        $this->assertEquals('ORD-12345', $delivery->order_number);
        $this->assertFalse($delivery->is_pos);
        $this->assertEquals('mobile', $delivery->order_source);

        $json = $delivery->toArray();
        $this->assertEquals('ORD-12345', $json['order_number']);
        $this->assertFalse($json['is_pos']);
        $this->assertEquals('mobile', $json['order_source']);
        $this->assertEquals($order->id, $json['order_id']);
        $this->assertNull($json['sale_id']);
    }

    public function test_rider_api_returns_canonical_order_number_and_identities_for_both_sources(): void
    {
        $sale = Sale::create([
            'branch_id'      => $this->branch->id,
            'user_id'        => $this->cashier->id,
            'order_number'   => 'POS-20999',
            'type'           => 'delivery',
            'subtotal'       => 200.00,
            'total'          => 250.00,
            'paid_amount'    => 250.00,
            'delivery_fee'   => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $posDelivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => 'Walk-in Delivery Customer',
            'customer_phone'   => '09991112233',
            'customer_address' => 'Victoria Center',
            'status'           => 'assigned_to_rider',
        ]);

        $order = Order::create([
            'order_number'     => 'ORD-88888',
            'branch_id'        => $this->branch->id,
            'customer_name'    => 'App Customer',
            'contact_number'   => '09994445566',
            'address'          => 'Victoria North',
            'total_amount'     => 300.00,
            'delivery_fee'     => 50.00,
            'fulfillment_type' => 'delivery',
            'order_source'     => 'mobile_app',
            'status'           => 'assigned_to_rider',
            'rider_id'         => $this->rider->id,
        ]);

        $onlineDelivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => 'App Customer',
            'customer_phone'   => '09994445566',
            'customer_address' => 'Victoria North',
            'status'           => 'assigned_to_rider',
        ]);

        $response = $this->actingAs($this->rider, 'rider')
            ->getJson('/api/v1/rider/my-orders');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertCount(2, $data);

        $posItem = collect($data)->firstWhere('sale_id', $sale->id);
        $this->assertNotNull($posItem);
        $this->assertEquals('POS-20999', $posItem['order_number']);
        $this->assertEquals($posDelivery->id, $posItem['delivery_id']);
        $this->assertEquals($sale->id, $posItem['sale_id']);
        $this->assertNull($posItem['order_id']);
        $this->assertEquals('pos', $posItem['order_source']);
        $this->assertTrue($posItem['is_pos']);

        $onlineItem = collect($data)->firstWhere('order_id', $order->id);
        $this->assertNotNull($onlineItem);
        $this->assertEquals('ORD-88888', $onlineItem['order_number']);
        $this->assertEquals($onlineDelivery->id, $onlineItem['delivery_id']);
        $this->assertEquals($order->id, $onlineItem['order_id']);
        $this->assertNull($onlineItem['sale_id']);
        $this->assertEquals('mobile', $onlineItem['order_source']);
        $this->assertFalse($onlineItem['is_pos']);
    }

    public function test_broadcast_events_include_canonical_order_number_and_identity_separation(): void
    {
        $sale = Sale::create([
            'branch_id'      => $this->branch->id,
            'user_id'        => $this->cashier->id,
            'order_number'   => 'POS-77777',
            'type'           => 'delivery',
            'subtotal'       => 600.00,
            'total'          => 650.00,
            'paid_amount'    => 650.00,
            'delivery_fee'   => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $posDelivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => 'Broadcast POS Customer',
            'customer_phone'   => '09112223344',
            'customer_address' => 'Victoria East',
            'status'           => 'assigned_to_rider',
        ]);

        // 1. OrderAssigned Event
        $assignedEvent = new OrderAssigned($posDelivery->fresh(['sale.branch', 'order.branch', 'rider']));
        $assignedPayload = $assignedEvent->broadcastWith();

        $this->assertEquals($posDelivery->id, $assignedPayload['delivery_id']);
        $this->assertEquals($sale->id, $assignedPayload['sale_id']);
        $this->assertNull($assignedPayload['order_id']);
        $this->assertEquals('POS-77777', $assignedPayload['order_number']);
        $this->assertEquals('pos', $assignedPayload['order_source']);
        $this->assertTrue($assignedPayload['is_pos']);

        // 2. OrderStatusUpdated Event
        $statusEvent = new OrderStatusUpdated($posDelivery->fresh(['sale.branch', 'order.branch', 'rider']), 'cashier');
        $statusPayload = $statusEvent->broadcastWith();

        $this->assertEquals($posDelivery->id, $statusPayload['delivery_id']);
        $this->assertEquals($sale->id, $statusPayload['sale_id']);
        $this->assertNull($statusPayload['order_id']);
        $this->assertEquals('POS-77777', $statusPayload['order_number']);
        $this->assertEquals('pos', $statusPayload['order_source']);
        $this->assertTrue($statusPayload['is_pos']);

        // 3. SaleCreated Event
        $saleCreatedEvent = new SaleCreated($sale->fresh(['branch', 'delivery']));
        $saleCreatedPayload = $saleCreatedEvent->broadcastWith();

        $this->assertEquals($sale->id, $saleCreatedPayload['sale_id']);
        $this->assertEquals('POS-77777', $saleCreatedPayload['order_number']);
        $this->assertEquals('pos', $saleCreatedPayload['order_source']);
        $this->assertTrue($saleCreatedPayload['is_pos']);
    }
}
