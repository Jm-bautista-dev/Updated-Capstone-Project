<?php

namespace Tests\Feature;

use App\Events\PickupPrepDue;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupOrderService;
use App\Services\PickupPreparationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class PickupPreparationSchedulingTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $admin;
    protected User $staff;
    protected Product $product;
    protected PickupPreparationService $prepService;
    protected PickupOrderService $pickupService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                               => 'BGC Flagship Branch',
            'address'                            => 'High Street, BGC, Taguig',
            'pickup_enabled'                     => true,
            'pickup_lead_time_minutes'           => 30, // 30 minutes configurable lead time
            'pickup_slot_interval_minutes'       => 15,
            'pickup_max_orders_per_slot'         => 10,
            'pickup_opening_time'                => '08:00:00',
            'pickup_closing_time'                => '23:00:00',
            'pickup_cutoff_before_close_minutes' => 30,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->staff = User::factory()->create([
            'role'      => 'staff',
            'branch_id' => $this->branch->id,
        ]);

        $this->product = Product::create([
            'name'          => 'Salmon Aburi Roll',
            'selling_price' => 280.00,
            'cost_price'    => 140.00,
            'branch_id'     => $this->branch->id,
        ]);

        $this->prepService = app(PickupPreparationService::class);
        $this->pickupService = app(PickupOrderService::class);
    }

    /**
     * Test A: Immediate Pickup — Lead time immediately opens the preparation window.
     */
    public function test_immediate_pickup_activates_prep_window_based_on_lead_time()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $now = Carbon::parse('2026-09-06 12:00:00', $tz);
        Carbon::setTestNow($now);

        // Customer schedules pickup for 12:28 PM (lead time is 30 mins, so prep_start is 11:58 AM, which is 2 min in past)
        $pickupTime = Carbon::parse('2026-09-06 12:28:00', $tz);
        $prepStartTime = Carbon::parse('2026-09-06 11:58:00', $tz);

        $order = Order::create([
            'order_number'                => 'PK-TEST-001',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Juan Dela Cruz',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => $pickupTime,
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => $prepStartTime,
        ]);

        $this->assertTrue($order->isPrepWindowOpen());
        $this->assertTrue($order->isPrepDue());
        $this->assertFalse($order->isPrepOverdue());
        $this->assertEquals('due_for_prep', $order->prep_status_category);

        Carbon::setTestNow();
    }

    /**
     * Test B: Future Pickup — Order placed at 10 AM for 9 PM pickup remains scheduled and does not immediately enter preparing.
     */
    public function test_future_pickup_remains_scheduled_and_not_due_for_prep()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $now = Carbon::parse('2026-09-06 10:00:00', $tz);
        Carbon::setTestNow($now);

        // Pickup at 9:00 PM (21:00) -> prep_start_at should be 8:30 PM (20:30)
        $pickupTime = Carbon::parse('2026-09-06 21:00:00', $tz);
        $prepStartTime = Carbon::parse('2026-09-06 20:30:00', $tz);

        $order = Order::create([
            'order_number'                => 'PK-TEST-FUTURE',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Maria Clara',
            'total_amount'                => 560.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => $pickupTime,
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => $prepStartTime,
        ]);

        $this->assertFalse($order->isPrepWindowOpen());
        $this->assertFalse($order->isPrepDue());
        $this->assertFalse($order->isPrepOverdue());
        $this->assertEquals('scheduled', $order->prep_status_category);

        Carbon::setTestNow();
    }

    /**
     * Test C: Reminder Dispatch — System fires PickupPrepDue when current time reaches prep_start_at.
     */
    public function test_reminder_dispatches_when_prep_time_reached()
    {
        Event::fake([PickupPrepDue::class]);

        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        // 1. Created at 10:00 AM for 9:00 PM pickup
        $order = Order::create([
            'order_number'                => 'PK-TEST-REMIND',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Crisostomo Ibarra',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
        ]);

        // At 5:00 PM Manila: Nothing dispatched
        Carbon::setTestNow(Carbon::parse('2026-09-06 17:00:00', $tz));
        $result1 = $this->prepService->evaluateAndDispatchReminders();
        $this->assertEquals(0, $result1['dispatched_count']);
        Event::assertNotDispatched(PickupPrepDue::class);

        // At 8:30 PM Manila: Time reached! Dispatched
        Carbon::setTestNow(Carbon::parse('2026-09-06 20:30:00', $tz));
        $result2 = $this->prepService->evaluateAndDispatchReminders();
        $this->assertEquals(1, $result2['dispatched_count']);

        Event::assertDispatched(PickupPrepDue::class, function ($event) use ($order) {
            return $event->orderId === $order->id;
        });

        // Running evaluation again immediately is idempotent (no duplicate notification)
        $result3 = $this->prepService->evaluateAndDispatchReminders();
        $this->assertEquals(0, $result3['dispatched_count']);

        Carbon::setTestNow();
    }

    /**
     * Test D: Cancelled Order — Cancelled orders do not receive preparation reminders.
     */
    public function test_cancelled_order_does_not_fire_reminder()
    {
        Event::fake([PickupPrepDue::class]);

        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $order = Order::create([
            'order_number'                => 'PK-TEST-CANCEL',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Simoun',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
        ]);

        // Cancel order at 7:00 PM
        Carbon::setTestNow(Carbon::parse('2026-09-06 19:00:00', $tz));
        $this->pickupService->transitionPickupStatus($order, 'cancelled', 'Customer changed plans', $this->staff);

        // At 8:30 PM: No reminder should fire
        Carbon::setTestNow(Carbon::parse('2026-09-06 20:30:00', $tz));
        $result = $this->prepService->evaluateAndDispatchReminders();
        $this->assertEquals(0, $result['dispatched_count']);
        Event::assertNotDispatched(PickupPrepDue::class);

        Carbon::setTestNow();
    }

    /**
     * Test E: Rescheduled Pickup — Changing pickup time recalculates preparation schedule and resets notification flags.
     */
    public function test_rescheduling_recalculates_prep_timing_and_resets_notifications()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $initialPickup = Carbon::parse('2026-09-06 21:00:00', $tz);

        $order = Order::create([
            'order_number'                => 'PK-TEST-RESCHEDULE',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Basilio',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => $initialPickup,
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => $initialPickup->copy()->subMinutes(30),
            'prep_notified_at'            => Carbon::now('UTC'),
        ]);

        // Reschedule to 10:00 PM (22:00)
        $newPickup = Carbon::parse('2026-09-06 22:00:00', $tz);
        $updatedOrder = $this->prepService->reschedulePickup($order, $newPickup);

        $this->assertNull($updatedOrder->prep_notified_at);
        $this->assertEquals(
            '2026-09-06 21:30:00',
            Carbon::parse($updatedOrder->prep_start_at)->setTimezone($tz)->format('Y-m-d H:i:s')
        );
        $this->assertEquals(
            '2026-09-06 22:00:00',
            Carbon::parse($updatedOrder->scheduled_pickup_at)->setTimezone($tz)->format('Y-m-d H:i:s')
        );
    }

    /**
     * Test H: Late / Overdue Preparation Handling.
     */
    public function test_late_preparation_is_flagged_as_overdue_with_minutes()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        // Pickup at 9:00 PM (prep at 8:30 PM)
        $order = Order::create([
            'order_number'                => 'PK-TEST-OVERDUE',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Elias',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
        ]);

        // At 8:45 PM (15 minutes after prep start)
        Carbon::setTestNow(Carbon::parse('2026-09-06 20:45:00', $tz));

        $this->assertTrue($order->isPrepOverdue(5));
        $this->assertEquals(15, $order->prep_overdue_minutes);
        $this->assertEquals('overdue', $order->prep_status_category);

        Carbon::setTestNow();
    }

    /**
     * Test J: Early Prep Guard & Manual Staff Override.
     */
    public function test_staff_cannot_start_prep_early_without_explicit_override_confirmation()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $now = Carbon::parse('2026-09-06 10:00:00', $tz);
        Carbon::setTestNow($now);

        // Future order for 9:00 PM (prep at 8:30 PM)
        $order = Order::create([
            'order_number'                => 'PK-TEST-EARLY',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Padre Florentino',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
        ]);

        // Attempting to start preparation without override should throw an InvalidArgumentException
        $this->expectException(\InvalidArgumentException::class);
        $this->prepService->startPreparation($order, $this->staff, false);

        Carbon::setTestNow();
    }

    public function test_staff_can_override_and_start_prep_early_when_confirmed()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $now = Carbon::parse('2026-09-06 10:00:00', $tz);
        Carbon::setTestNow($now);

        $order = Order::create([
            'order_number'                => 'PK-TEST-OVERRIDE',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'customer_name'               => 'Isagani',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
        ]);

        // With explicit override
        $updated = $this->prepService->startPreparation($order, $this->staff, true, 'Customer arrived early at counter');

        $this->assertEquals('preparing', $updated->status);
        $this->assertTrue($updated->is_early_prep_override);
        $this->assertEquals($this->staff->id, $updated->early_prep_actor_id);
        // Original requested pickup time is preserved
        $this->assertEquals(
            '2026-09-06 21:00:00',
            Carbon::parse($updated->scheduled_pickup_at)->setTimezone($tz)->format('Y-m-d H:i:s')
        );

        Carbon::setTestNow();
    }

    /**
     * Test K: Customer API Pickup Status endpoint.
     */
    public function test_customer_api_returns_informative_pickup_schedule_instructions()
    {
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $now = Carbon::parse('2026-09-06 10:00:00', $tz);
        Carbon::setTestNow($now);

        $customer = User::factory()->create(['role' => 'customer']);

        $order = Order::create([
            'order_number'                => 'PK-TEST-API',
            'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
            'order_source'                => Order::SOURCE_MOBILE_APP,
            'branch_id'                   => $this->branch->id,
            'user_id'                     => $customer->id,
            'customer_name'               => 'Paulita Gomez',
            'total_amount'                => 280.00,
            'status'                      => 'confirmed',
            'payment_status'              => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at'         => Carbon::parse('2026-09-06 21:00:00', $tz),
            'estimated_prep_time_minutes' => 30,
            'prep_start_at'               => Carbon::parse('2026-09-06 20:30:00', $tz),
            'pickup_verification_code'    => 'PK8899',
        ]);

        $response = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/v1/customer/orders/{$order->id}/pickup-status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'order'   => [
                    'order_number'             => 'PK-TEST-API',
                    'status'                   => 'confirmed',
                    'is_prep_window_open'      => false,
                    'scheduled_pickup_time'    => '9:00 PM',
                    'prep_start_display'       => '8:30 PM',
                    'pickup_verification_code' => 'PK8899',
                ],
            ]);

        $this->assertStringContainsString('Scheduled for pickup at 9:00 PM', $response->json('order.status_instruction'));
        $this->assertStringContainsString('8:30 PM', $response->json('order.status_instruction'));

        Carbon::setTestNow();
    }
}
