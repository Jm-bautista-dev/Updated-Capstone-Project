<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupOrderService;
use App\Services\ReceiptFormatterService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PickupTimeConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public User $admin;
    public User $cashier;
    public User $customer;
    public Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                               => 'Sta. Cruz Main',
            'address'                            => 'Sta. Cruz, Laguna',
            'latitude'                           => 14.2800,
            'longitude'                          => 121.4100,
            'delivery_radius_km'                 => 10.0,
            'pickup_enabled'                     => true,
            'pickup_opening_time'                => '08:00:00',
            'pickup_closing_time'                => '22:00:00',
            'pickup_lead_time_minutes'           => 20,
            'pickup_slot_interval_minutes'       => 15,
            'pickup_max_orders_per_slot'         => 10,
            'pickup_cutoff_before_close_minutes' => 30,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $category = \App\Models\Category::create([
            'name' => 'Sushi Rolls',
            'slug' => 'sushi-rolls',
        ]);

        $this->product = Product::create([
            'name'          => 'Salmon Roll',
            'sku'           => 'SLM-01',
            'selling_price' => 250.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
            'stock'         => 100,
            'stock_quantity'=> 100,
        ]);

        \Illuminate\Support\Facades\DB::table('branch_product')->insert([
            'branch_id'  => $this->branch->id,
            'product_id' => $this->product->id,
            'stock'      => 100,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Test QA scenario: Customer selects 9:00 AM, and 9:00 AM is preserved across all surfaces.
     */
    public function test_nine_am_pickup_order_remains_nine_am_across_all_surfaces(): void
    {
        Event::fake([OrderCreated::class, OrderStatusUpdated::class]);

        $targetDate = Carbon::tomorrow('Asia/Manila')->toDateString();
        $selectedTime = '09:00:00';
        $scheduledPayload = "{$targetDate} {$selectedTime}"; // "2026-09-07 09:00:00" Asia/Manila

        // 1. Customer places order via API
        $response = $this->actingAs($this->customer)
            ->postJson('/api/v1/orders', [
                'fulfillment_type'    => 'pickup',
                'branch_id'           => $this->branch->id,
                'customer_name'       => 'QA Tester',
                'mobile_number'       => '09170000000',
                'scheduled_pickup_at' => $scheduledPayload,
                'payment_method'      => 'cash',
                'items'               => [
                    [
                        'product_id' => $this->product->id,
                        'quantity'   => 1,
                        'price'      => 250.00,
                    ]
                ],
                'total_amount'        => 250.00,
            ]);

        $response->assertStatus(201);
        $orderId = $response->json('order_id');
        $this->assertNotNull($orderId);

        // 2. Verify API response output
        $this->assertStringContainsString('9:00 AM', $response->json('scheduled_pickup_display'));

        // 3. Verify Database Storage: Stored normalized in UTC (9:00 AM Manila = 1:00 AM UTC)
        $order = Order::find($orderId);
        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->fulfillment_type);
        
        // Eloquent datetime cast in UTC:
        $this->assertEquals('01:00:00', $order->scheduled_pickup_at->format('H:i:s'));
        
        // Converted to Asia/Manila:
        $this->assertEquals('09:00:00', $order->scheduled_pickup_at->timezone('Asia/Manila')->format('H:i:s'));
        $this->assertEquals('9:00 AM', $order->scheduled_pickup_time);
        $this->assertStringContainsString('9:00 AM', $order->scheduled_pickup_display);

        // 4. Verify API Pickup Status Endpoint
        $statusResponse = $this->actingAs($this->customer)
            ->getJson("/api/v1/customer/orders/{$order->id}/pickup-status");

        $statusResponse->assertStatus(200);
        $this->assertStringContainsString('9:00 AM', $statusResponse->json('order.scheduled_pickup_display'));

        // 5. Verify Receipt Formatter
        $receiptService = new ReceiptFormatterService();
        $receiptData = $receiptService->buildReceiptData($order);
        $this->assertStringContainsString('9:00 AM', $receiptData['scheduled_pickup_at']);

        $plainReceipt = $receiptService->formatPlainText($receiptData);
        $this->assertStringContainsString('9:00 AM', $plainReceipt);
        $this->assertStringContainsString('Pickup Code', $plainReceipt);

        // 6. Verify Broadcast Event Payload
        Event::assertDispatched(OrderCreated::class, function ($event) use ($order) {
            return $event->order->id === $order->id &&
                   str_contains($event->order->scheduled_pickup_display, '9:00 AM');
        });
    }

    /**
     * Boundary testing: 12:00 AM, 9:00 AM, 12:00 PM, 5:00 PM, 11:59 PM.
     */
    public function test_boundary_times_are_consistently_handled(): void
    {
        $testCases = [
            ['time' => '00:00:00', 'expected_display' => '12:00 AM', 'utc_hour' => '16'], // 12 AM Manila is 4 PM previous day UTC
            ['time' => '09:00:00', 'expected_display' => '9:00 AM',  'utc_hour' => '01'], // 9 AM Manila is 1 AM UTC
            ['time' => '12:00:00', 'expected_display' => '12:00 PM', 'utc_hour' => '04'], // 12 PM Manila is 4 AM UTC
            ['time' => '17:00:00', 'expected_display' => '5:00 PM',  'utc_hour' => '09'], // 5 PM Manila is 9 AM UTC
            ['time' => '23:59:00', 'expected_display' => '11:59 PM', 'utc_hour' => '15'], // 11:59 PM Manila is 3:59 PM UTC
        ];

        $targetDate = Carbon::tomorrow('Asia/Manila')->toDateString();

        foreach ($testCases as $tc) {
            $inputString = "{$targetDate} {$tc['time']}";
            
            $order = Order::create([
                'order_number'        => 'PK-TEST-' . str_replace(':', '', $tc['time']),
                'fulfillment_type'    => 'pickup',
                'branch_id'           => $this->branch->id,
                'customer_name'       => 'Boundary Tester',
                'scheduled_pickup_at' => $inputString,
                'total_amount'        => 250.00,
                'status'              => 'pending',
            ]);

            $this->assertEquals($tc['expected_display'], $order->scheduled_pickup_time, "Failed for {$tc['time']}");
            $this->assertStringContainsString($tc['expected_display'], $order->scheduled_pickup_display);
            $this->assertEquals($tc['utc_hour'], $order->scheduled_pickup_at->format('H'));
        }
    }

    /**
     * Test admin reschedule correctly updates pickup time in UTC and displays in Manila time.
     */
    public function test_admin_reschedule_preserves_local_time_and_updates_utc(): void
    {
        $initialTime = Carbon::tomorrow('Asia/Manila')->setTime(9, 0, 0);
        $order = Order::create([
            'order_number'        => 'PK-RESCHED-01',
            'fulfillment_type'    => 'pickup',
            'branch_id'           => $this->branch->id,
            'customer_name'       => 'Reschedule Tester',
            'scheduled_pickup_at' => $initialTime,
            'total_amount'        => 250.00,
            'status'              => 'confirmed',
        ]);

        $this->assertEquals('9:00 AM', $order->scheduled_pickup_time);

        // Reschedule to 5:00 PM
        $newTime = Carbon::tomorrow('Asia/Manila')->setTime(17, 0, 0);
        $response = $this->actingAs($this->admin)
            ->post("/pickups/{$order->id}/reschedule", [
                'new_scheduled_pickup_at' => $newTime->format('Y-m-d H:i:s'),
                'reason'                  => 'Customer requested change to 5:00 PM',
            ]);

        $response->assertSessionHas('success');
        $this->assertStringContainsString('5:00 PM', session('success'));

        $order->refresh();
        $this->assertEquals('5:00 PM', $order->scheduled_pickup_time);
        $this->assertEquals('09:00:00', $order->scheduled_pickup_at->format('H:i:s')); // 5 PM Manila = 9 AM UTC
    }
}
