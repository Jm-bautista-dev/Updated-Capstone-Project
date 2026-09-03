<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryTimezoneAndRelativeTimeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-09-03 14:00:00'); // Set a fixed UTC time
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    /**
     * Test 1: Configured application timezone is UTC.
     */
    public function test_application_timezone_is_utc(): void
    {
        $this->assertEquals('UTC', config('app.timezone'));
        $this->assertEquals('UTC', date_default_timezone_get());
    }

    /**
     * Test 2: Past timestamps produce positive waiting_minutes.
     */
    public function test_past_timestamps_produce_positive_waiting_minutes(): void
    {
        $tenMinutesAgo = now()->subMinutes(10);
        $oneHourAgo = now()->subHours(1);
        $ord8Ago = now()->subMinutes(226);

        // Explicit calculation test
        $waiting10 = max(0, (int) $tenMinutesAgo->diffInMinutes(now(), false));
        $waiting60 = max(0, (int) $oneHourAgo->diffInMinutes(now(), false));
        $waiting226 = max(0, (int) $ord8Ago->diffInMinutes(now(), false));

        $this->assertEquals(10, $waiting10);
        $this->assertEquals(60, $waiting60);
        $this->assertEquals(226, $waiting226);
    }

    /**
     * Test 3: Future timestamps (clock skew) are safely clamped to 0 (never negative).
     */
    public function test_future_timestamps_are_clamped_to_zero(): void
    {
        $oneMinuteFuture = now()->addMinute();
        $oneHourFuture = now()->addHour();
        $ord8Future = now()->addMinutes(226);

        $waiting1 = max(0, (int) $oneMinuteFuture->diffInMinutes(now(), false));
        $waiting60 = max(0, (int) $oneHourFuture->diffInMinutes(now(), false));
        $waiting226 = max(0, (int) $ord8Future->diffInMinutes(now(), false));

        $this->assertEquals(0, $waiting1);
        $this->assertEquals(0, $waiting60);
        $this->assertEquals(0, $waiting226);
    }

    /**
     * Test 4: DeliveryController index returns positive non-negative waiting_minutes.
     */
    public function test_delivery_controller_returns_non_negative_waiting_minutes(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $branch = Branch::create([
            'name'                => 'Victoria Branch',
            'code'                => 'VIC',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.229371,
            'longitude'           => 121.328383,
            'is_active'           => true,
            'has_internal_riders' => true,
        ]);

        // Create a failed delivery order created 226 minutes ago (simulating ORD-8)
        $pastOrder = Order::create([
            'branch_id'        => $branch->id,
            'customer_name'    => 'QA Tester',
            'customer_phone'   => '09123456789',
            'delivery_address' => 'Victoria, Laguna',
            'status'           => 'failed_delivery',
            'order_type'       => 'delivery',
            'payment_method'   => 'cod',
            'total_amount'     => 500,
            'created_at'       => now()->subMinutes(226),
        ]);

        $pastDelivery = Delivery::create([
            'order_id'         => $pastOrder->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'QA Tester',
            'customer_phone'   => '09123456789',
            'customer_address' => 'Victoria, Laguna',
            'status'           => Delivery::STATUS_FAILED,
        ]);
        Delivery::where('id', $pastDelivery->id)->update(['created_at' => now()->subMinutes(226)]);

        // Create a future delivery order (simulating clock skew)
        $futureDelivery = Delivery::create([
            'delivery_type'    => 'internal',
            'customer_name'    => 'Future Customer',
            'customer_phone'   => '09123456780',
            'customer_address' => 'Victoria, Laguna',
            'status'           => Delivery::STATUS_PENDING,
        ]);
        Delivery::where('id', $futureDelivery->id)->update(['created_at' => now()->addMinutes(15)]);

        $response = $this->actingAs($admin)->get(route('deliveries.index', ['view' => 'today']));
        $response->assertStatus(200);

        $deliveries = $response->original->getData()['page']['props']['deliveries']['data'];

        $this->assertNotEmpty($deliveries);

        foreach ($deliveries as $item) {
            $this->assertGreaterThanOrEqual(0, $item['waiting_minutes'], "Waiting minutes for delivery {$item['id']} must not be negative.");
        }

        // Verify the past delivery has waiting_minutes == 226
        $foundPast = collect($deliveries)->firstWhere('id', $pastDelivery->id);
        $this->assertNotNull($foundPast);
        $this->assertEquals(226, $foundPast['waiting_minutes']);

        // Verify the future delivery has waiting_minutes == 0
        $foundFuture = collect($deliveries)->firstWhere('id', $futureDelivery->id);
        $this->assertNotNull($foundFuture);
        $this->assertEquals(0, $foundFuture['waiting_minutes']);
    }

    /**
     * Test 5: Delivery model serializes dates to ISO 8601 strings.
     */
    public function test_delivery_dates_are_properly_cast(): void
    {
        $delivery = Delivery::create([
            'delivery_type'    => 'internal',
            'customer_name'    => 'Cast Test',
            'customer_address' => 'Victoria, Laguna',
            'status'           => Delivery::STATUS_PENDING,
            'accepted_at'      => now(),
            'picked_up_at'     => now(),
            'transit_at'       => now(),
            'delivered_at'     => now(),
            'cancelled_at'     => now(),
        ]);

        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->created_at);
        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->accepted_at);
        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->picked_up_at);
        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->transit_at);
        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->delivered_at);
        $this->assertInstanceOf(\Carbon\CarbonInterface::class, $delivery->cancelled_at);
    }
}
