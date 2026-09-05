<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupOrderService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PickupManualOrderModalTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public $cashier;
    public $admin;
    public $product1;
    public $product2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                               => 'Maki Desu Victoria',
            'address'                            => 'Victoria, Laguna',
            'latitude'                           => 14.2300,
            'longitude'                          => 121.3200,
            'delivery_radius_km'                 => 10.0,
            'pickup_enabled'                     => true,
            'pickup_lead_time_minutes'           => 20,
            'pickup_slot_interval_minutes'       => 15,
            'pickup_max_orders_per_slot'         => 3, // Small slot capacity for testing
            'pickup_opening_time'                => '09:00:00',
            'pickup_closing_time'                => '21:00:00',
            'pickup_cutoff_before_close_minutes' => 30,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $category = Category::create([
            'name' => 'Special Rolls',
            'slug' => 'special-rolls',
        ]);

        $this->product1 = Product::create([
            'name'          => 'Dragon Roll',
            'sku'           => 'DRG-01',
            'selling_price' => 350.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
        ]);

        $this->product2 = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'CAL-01',
            'selling_price' => 180.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
        ]);
    }

    /**
     * Scenario 1: Cashier creates manual Facebook/Phone pickup order for Maria Santos.
     */
    public function test_cashier_can_create_external_pickup_order_for_maria_santos(): void
    {
        // Choose tomorrow at 5:00 PM (guaranteed valid future time within operating hours)
        $scheduledDateTime = Carbon::tomorrow('Asia/Manila')->setTime(17, 0, 0);

        $payload = [
            'customer_name'               => 'Maria Santos',
            'contact_number'              => '09171234567',
            'order_source'                => 'facebook_messenger',
            'source_reference'            => 'FB: Maria Santos / Thread #102',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $scheduledDateTime->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'pickup_notes'                => 'Extra soy sauce, please',
            'internal_notes'              => 'Customer confirmed via Messenger at 2:00 PM',
            'items'                       => [
                [
                    'product_id' => $this->product1->id,
                    'quantity'   => 1,
                    'price'      => 350.00,
                ],
            ],
            'total_amount'                => 350.00,
        ];

        $response = $this->actingAs($this->cashier)
            ->post('/pickups/manual', $payload);

        $response->assertSessionHas('success');

        $order = Order::where('customer_name', 'Maria Santos')->first();
        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->fulfillment_type);
        $this->assertEquals('facebook_messenger', $order->order_source);
        $this->assertEquals('FB: Maria Santos / Thread #102', $order->source_reference);
        $this->assertEquals(350.00, (float) $order->total_amount);
        $this->assertNotNull($order->prep_start_at);
        // 5:00 PM minus 20 mins lead time = 4:40 PM Asia/Manila
        $this->assertEquals($scheduledDateTime->copy()->subMinutes(20)->format('Y-m-d H:i:s'), $order->prep_start_at->timezone('Asia/Manila')->format('Y-m-d H:i:s'));
        $this->assertNotNull($order->pickup_verification_code);
    }

    /**
     * Scenario 2: Full slot capacity rejection.
     * When capacity is reached, /pickups/slots shows FULL and backend rejects additional orders.
     */
    public function test_full_pickup_slot_shows_full_and_rejects_additional_order(): void
    {
        $slotTime = Carbon::tomorrow('Asia/Manila')->setTime(16, 0, 0);

        // Pre-fill orders to hit max capacity (pickup_max_orders_per_slot = 3)
        for ($i = 1; $i <= 3; $i++) {
            Order::create([
                'order_number'        => "PK-FULL-00{$i}",
                'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
                'order_source'        => Order::SOURCE_FACEBOOK_MESSENGER,
                'branch_id'           => $this->branch->id,
                'customer_name'       => "Customer {$i}",
                'scheduled_pickup_at' => $slotTime,
                'total_amount'        => 350.00,
                'status'              => 'confirmed',
            ]);
        }

        // 1. Verify via slots API that slot displays is_available = false and remaining_capacity = 0
        $slotsResponse = $this->actingAs($this->cashier)
            ->getJson("/pickups/slots?branch_id={$this->branch->id}&date={$slotTime->toDateString()}");

        $slotsResponse->assertStatus(200);
        $slots = $slotsResponse->json('data.slots');
        $slot4PM = collect($slots)->firstWhere('time', '16:00');

        $this->assertNotNull($slot4PM);
        $this->assertFalse($slot4PM['is_available'], 'Slot must be marked unavailable when full');
        $this->assertEquals(0, $slot4PM['remaining_capacity'], 'Remaining capacity must be 0');
        $this->assertEquals(3, $slot4PM['booked_count'], 'Booked count must be 3');

        // 2. Attempting to create an order for the full slot must be rejected by the backend
        $payload = [
            'customer_name'               => 'Overbook Tester',
            'order_source'                => 'phone_call',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $slotTime->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'items'                       => [
                ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 350.00],
            ],
            'total_amount'                => 350.00,
        ];

        $response = $this->actingAs($this->cashier)->post('/pickups/manual', $payload);
        $response->assertSessionHas('error');
        $this->assertStringContainsString('fully booked', session('error'));
    }

    /**
     * Scenario 3: Past pickup time is rejected by the backend.
     */
    public function test_past_pickup_time_is_rejected(): void
    {
        $pastTime = Carbon::now('Asia/Manila')->subHours(2);

        $payload = [
            'customer_name'               => 'Time Traveler',
            'order_source'                => 'walk_in',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $pastTime->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'items'                       => [
                ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 350.00],
            ],
            'total_amount'                => 350.00,
        ];

        $response = $this->actingAs($this->cashier)->post('/pickups/manual', $payload);
        $response->assertSessionHas('error');
        $this->assertStringContainsString('past', session('error'));
    }

    /**
     * Scenario 4: Outside business hours is rejected.
     */
    public function test_pickup_outside_business_hours_is_rejected(): void
    {
        // Branch opens at 9:00 AM, cutoff is 8:30 PM (closing 9:00 PM - 30 min cutoff)
        // Test 1: 6:00 AM (before opening)
        $earlyTime = Carbon::tomorrow('Asia/Manila')->setTime(6, 0, 0);

        $payload = [
            'customer_name'               => 'Early Bird',
            'order_source'                => 'phone_call',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $earlyTime->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'items'                       => [
                ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 350.00],
            ],
            'total_amount'                => 350.00,
        ];

        $response = $this->actingAs($this->cashier)->post('/pickups/manual', $payload);
        $response->assertSessionHas('error');
        $this->assertStringContainsString('outside branch pickup hours', session('error'));

        // Test 2: 10:00 PM (after closing)
        $lateTime = Carbon::tomorrow('Asia/Manila')->setTime(22, 0, 0);
        $payload['scheduled_pickup_at'] = $lateTime->format('Y-m-d H:i:s');

        $response2 = $this->actingAs($this->cashier)->post('/pickups/manual', $payload);
        $response2->assertSessionHas('error');
        $this->assertStringContainsString('outside branch pickup hours', session('error'));
    }

    /**
     * Scenario 5: Multiple products with quantity updates persist correctly.
     */
    public function test_multiple_products_and_quantities_persist_accurately(): void
    {
        $scheduledTime = Carbon::tomorrow('Asia/Manila')->setTime(12, 0, 0);

        // Dragon Roll x1 (₱350) + California Maki x2 (₱180 x 2 = ₱360) = ₱710
        $payload = [
            'customer_name'               => 'Order Bundle',
            'order_source'                => 'walk_in',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $scheduledTime->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'items'                       => [
                ['product_id' => $this->product1->id, 'quantity' => 1, 'price' => 350.00],
                ['product_id' => $this->product2->id, 'quantity' => 2, 'price' => 180.00],
            ],
            'total_amount'                => 710.00,
        ];

        $response = $this->actingAs($this->cashier)->post('/pickups/manual', $payload);
        $response->assertSessionHas('success');

        $order = Order::where('customer_name', 'Order Bundle')->first();
        $this->assertNotNull($order);
        $this->assertEquals(710.00, (float) $order->total_amount);
        $this->assertCount(2, $order->items);

        $item1 = $order->items->firstWhere('product_id', $this->product1->id);
        $item2 = $order->items->firstWhere('product_id', $this->product2->id);

        $this->assertEquals(1, $item1->quantity);
        $this->assertEquals(350.00, (float) $item1->price);

        $this->assertEquals(2, $item2->quantity);
        $this->assertEquals(180.00, (float) $item2->price);
    }
}
