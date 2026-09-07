<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchSchedule;
use App\Models\BranchSpecialSchedule;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\BranchScheduleService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchOperatingHoursTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoriaBranch;
    protected Branch $staCruzBranch;
    protected User $admin;
    protected User $cashierVictoria;
    protected User $cashierStaCruz;
    protected User $customer;
    protected Product $productVictoria;
    protected Product $productStaCruz;
    protected BranchScheduleService $scheduleService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->scheduleService = app(BranchScheduleService::class);

        // 1. Create Branches
        $this->victoriaBranch = Branch::create([
            'name'               => 'MAKI DESU - Victoria Branch',
            'code'               => 'VIC',
            'address'            => 'Victoria Laguna',
            'latitude'           => 14.2285,
            'longitude'          => 121.3283,
            'delivery_radius_km' => 15.0,
            'is_active'          => true,
            'operating_mode'     => 'automatic',
            'pickup_enabled'     => true,
            'pickup_lead_time_minutes' => 20,
            'pickup_slot_interval_minutes' => 15,
            'pickup_max_orders_per_slot' => 10,
        ]);

        $this->staCruzBranch = Branch::create([
            'name'               => 'MAKI DESU - Sta. Cruz Branch',
            'code'               => 'STACRUZ',
            'address'            => 'Sta. Cruz Laguna',
            'latitude'           => 14.2817,
            'longitude'          => 121.4172,
            'delivery_radius_km' => 15.0,
            'is_active'          => true,
            'operating_mode'     => 'automatic',
            'pickup_enabled'     => true,
            'pickup_lead_time_minutes' => 20,
            'pickup_slot_interval_minutes' => 15,
            'pickup_max_orders_per_slot' => 10,
        ]);

        // 2. Set Regular Schedules
        // Victoria: 10:00 AM - 8:00 PM (10:00 - 20:00)
        for ($day = 0; $day <= 6; $day++) {
            BranchSchedule::updateOrCreate(
                ['branch_id' => $this->victoriaBranch->id, 'day_of_week' => $day],
                [
                    'is_open'    => true,
                    'open_time'  => '10:00:00',
                    'close_time' => '20:00:00',
                ]
            );

            // Sta. Cruz: 10:00 AM - 7:45 PM (10:00 - 19:45)
            BranchSchedule::updateOrCreate(
                ['branch_id' => $this->staCruzBranch->id, 'day_of_week' => $day],
                [
                    'is_open'    => true,
                    'open_time'  => '10:00:00',
                    'close_time' => '19:45:00',
                ]
            );
        }

        // 3. Create Users
        $this->admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->victoriaBranch->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->victoriaBranch->id,
        ]);

        $this->cashierStaCruz = User::factory()->create([
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->staCruzBranch->id,
        ]);

        $this->customer = User::factory()->create([
            'role'           => User::ROLE_CUSTOMER,
            'account_status' => User::STATUS_ACTIVE,
            'mobile_number'  => '09171234567',
        ]);

        // 4. Products & Stock for Checkout Tests
        $category = Category::create(['name' => 'Maki Rolls']);
        $this->productVictoria = Product::create([
            'name'          => 'California Maki - Vic',
            'category_id'   => $category->id,
            'branch_id'     => $this->victoriaBranch->id,
            'selling_price' => 150.00,
            'stock'         => 50,
        ]);

        $this->productStaCruz = Product::create([
            'name'          => 'California Maki - StaCruz',
            'category_id'   => $category->id,
            'branch_id'     => $this->staCruzBranch->id,
            'selling_price' => 150.00,
            'stock'         => 50,
        ]);

        $ingredient = Ingredient::create([
            'name' => 'Rice',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->victoriaBranch->id],
            ['stock' => 10000]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->staCruzBranch->id],
            ['stock' => 10000]
        );

        $this->productVictoria->ingredients()->attach($ingredient->id, ['quantity_required' => 50]);
        $this->productStaCruz->ingredients()->attach($ingredient->id, ['quantity_required' => 50]);
    }

    /**
     * Test 1: Victoria Branch regular schedule boundaries (10:00 to 20:00).
     */
    public function test_victoria_branch_regular_schedule_boundary_times(): void
    {
        // Monday 09:59 AM -> Closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 09:59:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertFalse($status['is_open'], 'Victoria should be closed at 09:59');
        $this->assertFalse($status['is_accepting_orders']);

        // Monday 10:00 AM -> Open
        Carbon::setTestNow(Carbon::parse('2026-09-07 10:00:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertTrue($status['is_open'], 'Victoria should be open at 10:00');
        $this->assertTrue($status['is_accepting_orders']);

        // Monday 07:59 PM (19:59) -> Open
        Carbon::setTestNow(Carbon::parse('2026-09-07 19:59:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertTrue($status['is_open'], 'Victoria should be open at 19:59');
        $this->assertTrue($status['is_accepting_orders']);

        // Monday 08:00 PM (20:00) -> Closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 20:00:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertFalse($status['is_open'], 'Victoria should be closed at 20:00');
        $this->assertFalse($status['is_accepting_orders']);

        // Monday 08:01 PM (20:01) -> Closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 20:01:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertFalse($status['is_open'], 'Victoria should be closed at 20:01');
    }

    /**
     * Test 2: Sta. Cruz Branch regular schedule boundaries (10:00 to 19:45).
     */
    public function test_sta_cruz_branch_regular_schedule_boundary_times(): void
    {
        // Monday 09:59 AM -> Closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 09:59:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->staCruzBranch);
        $this->assertFalse($status['is_open'], 'Sta Cruz should be closed at 09:59');

        // Monday 10:00 AM -> Open
        Carbon::setTestNow(Carbon::parse('2026-09-07 10:00:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->staCruzBranch);
        $this->assertTrue($status['is_open'], 'Sta Cruz should be open at 10:00');

        // Monday 07:44 PM (19:44) -> Open
        Carbon::setTestNow(Carbon::parse('2026-09-07 19:44:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->staCruzBranch);
        $this->assertTrue($status['is_open'], 'Sta Cruz should be open at 19:44');

        // Monday 07:45 PM (19:45) -> Closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 19:45:00', 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->staCruzBranch);
        $this->assertFalse($status['is_open'], 'Sta Cruz should be closed at 19:45');
    }

    /**
     * Test 3: Special date override (Holiday Closed All Day).
     */
    public function test_special_schedule_holiday_closed_all_day(): void
    {
        $holidayDate = '2026-12-25';

        BranchSpecialSchedule::create([
            'branch_id'          => $this->victoriaBranch->id,
            'date'               => $holidayDate,
            'label'              => 'Christmas Day',
            'is_closed_all_day'  => true,
            'is_open_24_hours'   => false,
        ]);

        // At 12:00 PM on Christmas (normally open), should be CLOSED
        Carbon::setTestNow(Carbon::parse("{$holidayDate} 12:00:00", 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);

        $this->assertFalse($status['is_open']);
        $this->assertFalse($status['is_accepting_orders']);
        $this->assertEquals('special_override', $status['reason_type']);
        $this->assertStringContainsString('Christmas Day', $status['status_message']);

        // Next day (2026-12-26 at 12:00 PM) reverts to regular open schedule
        Carbon::setTestNow(Carbon::parse('2026-12-26 12:00:00', 'Asia/Manila'));
        $statusNextDay = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertTrue($statusNextDay['is_open']);
        $this->assertEquals('regular_schedule', $statusNextDay['reason_type']);
    }

    /**
     * Test 4: Special date override (24 Hours Open).
     */
    public function test_special_schedule_24_hours_open(): void
    {
        $specialDate = '2026-12-31';

        BranchSpecialSchedule::create([
            'branch_id'          => $this->victoriaBranch->id,
            'date'               => $specialDate,
            'label'              => 'New Year Eve Marathon',
            'is_closed_all_day'  => false,
            'is_open_24_hours'   => true,
        ]);

        // At 03:00 AM on New Year Eve (normally closed), should be OPEN
        Carbon::setTestNow(Carbon::parse("{$specialDate} 03:00:00", 'Asia/Manila'));
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);

        $this->assertTrue($status['is_open']);
        $this->assertTrue($status['is_accepting_orders']);
        $this->assertEquals('Open 24 Hours', $status['today_hours_display']);
    }

    /**
     * Test 5: Special date override (Custom Modified Hours).
     */
    public function test_special_schedule_custom_hours(): void
    {
        $specialDate = '2026-11-01'; // All Saints Day

        BranchSpecialSchedule::create([
            'branch_id'          => $this->victoriaBranch->id,
            'date'               => $specialDate,
            'label'              => 'All Saints Special',
            'is_closed_all_day'  => false,
            'is_open_24_hours'   => false,
            'open_time'          => '08:00:00',
            'close_time'         => '14:00:00',
        ]);

        // 08:30 AM -> Open
        Carbon::setTestNow(Carbon::parse("{$specialDate} 08:30:00", 'Asia/Manila'));
        $statusOpen = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertTrue($statusOpen['is_open']);

        // 14:30 PM -> Closed
        Carbon::setTestNow(Carbon::parse("{$specialDate} 14:30:00", 'Asia/Manila'));
        $statusClosed = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertFalse($statusClosed['is_open']);
    }

    /**
     * Test 6: Manual Force Closed Mode overrides regular schedule.
     */
    public function test_force_closed_mode_overrides_regular_hours(): void
    {
        // Monday 12:00 PM (normally open)
        Carbon::setTestNow(Carbon::parse('2026-09-07 12:00:00', 'Asia/Manila'));

        $this->scheduleService->setOperatingMode(
            $this->victoriaBranch,
            'force_closed',
            'Emergency Maintenance',
            null,
            $this->admin
        );

        $this->victoriaBranch->refresh();
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);

        $this->assertFalse($status['is_open']);
        $this->assertFalse($status['is_accepting_orders']);
        $this->assertEquals('force_closed', $status['operating_mode']);
        $this->assertEquals('Emergency Maintenance', $status['override_reason']);
    }

    /**
     * Test 7: Manual Force Open Mode overrides regular schedule.
     */
    public function test_force_open_mode_overrides_regular_hours(): void
    {
        // Monday 11:00 PM (normally closed)
        Carbon::setTestNow(Carbon::parse('2026-09-07 23:00:00', 'Asia/Manila'));

        $this->scheduleService->setOperatingMode(
            $this->victoriaBranch,
            'force_open',
            'Midnight Special Event',
            null,
            $this->admin
        );

        $this->victoriaBranch->refresh();
        $status = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);

        $this->assertTrue($status['is_open']);
        $this->assertTrue($status['is_accepting_orders']);
        $this->assertEquals('force_open', $status['operating_mode']);
    }

    /**
     * Test 8: Expired Manual Override reverts automatically to schedule calculation.
     */
    public function test_expired_manual_override_reverts_to_automatic_schedule(): void
    {
        $now = Carbon::parse('2026-09-07 11:00:00', 'Asia/Manila'); // Regular Open Time
        Carbon::setTestNow($now);

        // Set force_closed until 11:30 AM
        $until = Carbon::parse('2026-09-07 11:30:00', 'Asia/Manila');
        $this->scheduleService->setOperatingMode(
            $this->victoriaBranch,
            'force_closed',
            'Short meeting',
            $until,
            $this->admin
        );

        // At 11:15 AM -> Should still be force closed
        Carbon::setTestNow(Carbon::parse('2026-09-07 11:15:00', 'Asia/Manila'));
        $this->victoriaBranch->refresh();
        $statusDuring = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertFalse($statusDuring['is_open']);
        $this->assertEquals('force_closed', $statusDuring['operating_mode']);

        // At 11:31 AM -> Override expired, should automatically be Open based on regular schedule
        Carbon::setTestNow(Carbon::parse('2026-09-07 11:31:00', 'Asia/Manila'));
        $this->victoriaBranch->refresh();
        $statusAfter = $this->scheduleService->getBranchOperatingStatus($this->victoriaBranch);
        $this->assertTrue($statusAfter['is_open']);
        $this->assertEquals('automatic', $statusAfter['operating_mode']);
        $this->assertEquals('regular_schedule', $statusAfter['reason_type']);
    }

    /**
     * Test 9: Mobile Customer Checkout rejection (422) when branch is closed.
     */
    public function test_mobile_customer_checkout_rejected_when_branch_is_closed(): void
    {
        // Monday 09:00 AM (Branch is closed)
        Carbon::setTestNow(Carbon::parse('2026-09-07 09:00:00', 'Asia/Manila'));

        $orderPayload = [
            'fulfillment_type' => 'delivery',
            'customer_name'    => 'Juan Dela Cruz',
            'mobile_number'    => '09171234567',
            'address'          => 'Victoria Laguna Town Plaza',
            'latitude'         => 14.2285,
            'longitude'        => 121.3283,
            'branch_id'        => $this->victoriaBranch->id,
            'items'            => [
                [
                    'product_id' => $this->productVictoria->id,
                    'quantity'   => 2,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'     => 300.00,
            'payment_method'   => 'cod',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', $orderPayload);

        $response->assertStatus(422)
            ->assertJson([
                'success'    => false,
                'error_code' => 'BRANCH_CLOSED',
            ])
            ->assertJsonStructure([
                'success',
                'error_code',
                'message',
                'branch' => [
                    'id',
                    'name',
                    'is_open',
                    'is_accepting_orders',
                    'operating_mode',
                    'today_hours',
                    'status_message',
                ],
            ]);
    }

    /**
     * Test 10: Mobile Customer Checkout succeeds when branch is open.
     */
    public function test_mobile_customer_checkout_succeeds_when_branch_is_open(): void
    {
        // Monday 12:00 PM (Branch is open)
        Carbon::setTestNow(Carbon::parse('2026-09-07 12:00:00', 'Asia/Manila'));

        $orderPayload = [
            'fulfillment_type' => 'delivery',
            'customer_name'    => 'Juan Dela Cruz',
            'mobile_number'    => '09171234567',
            'address'          => 'Victoria Laguna Town Plaza',
            'latitude'         => 14.2285,
            'longitude'        => 121.3283,
            'branch_id'        => $this->victoriaBranch->id,
            'items'            => [
                [
                    'product_id' => $this->productVictoria->id,
                    'quantity'   => 2,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'     => 300.00,
            'payment_method'   => 'cod',
        ];

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', $orderPayload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('orders', [
            'branch_id'     => $this->victoriaBranch->id,
            'customer_name' => 'Juan Dela Cruz',
        ]);
    }

    /**
     * Test 11: Scheduled Pickup Date respects special schedule holiday.
     */
    public function test_pickup_date_validation_rejects_closed_holiday_date(): void
    {
        $holidayDate = '2026-12-25';

        BranchSpecialSchedule::create([
            'branch_id'          => $this->victoriaBranch->id,
            'date'               => $holidayDate,
            'label'              => 'Christmas Day',
            'is_closed_all_day'  => true,
            'is_open_24_hours'   => false,
        ]);

        $pickupCarbon = Carbon::parse("{$holidayDate} 14:00:00", 'Asia/Manila');
        $eval = $this->scheduleService->canAcceptOrder($this->victoriaBranch, 'pickup', $pickupCarbon);

        $this->assertFalse($eval['allowed']);
        $this->assertStringContainsString('Christmas Day', $eval['reason']);
    }

    /**
     * Test 12: Cashier can manage their own branch operating hours.
     */
    public function test_cashier_can_update_own_branch_operating_mode(): void
    {
        $response = $this->actingAs($this->cashierVictoria)
            ->patchJson("/branches/{$this->victoriaBranch->id}/operating-mode", [
                'operating_mode' => 'force_closed',
                'reason'         => 'Flooding in area',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'operating_mode' => 'force_closed',
                ],
            ]);

        $this->victoriaBranch->refresh();
        $this->assertEquals('force_closed', $this->victoriaBranch->operating_mode);
        $this->assertEquals('Flooding in area', $this->victoriaBranch->mode_override_reason);
    }

    /**
     * Test 13: Cashier is FORBIDDEN (403) from managing another branch.
     */
    public function test_cashier_cannot_update_another_branch_operating_mode(): void
    {
        // Cashier assigned to Victoria attempts to force close Sta. Cruz
        $response = $this->actingAs($this->cashierVictoria)
            ->patchJson("/branches/{$this->staCruzBranch->id}/operating-mode", [
                'operating_mode' => 'force_closed',
                'reason'         => 'Unauthorized attempt',
            ]);

        $response->assertStatus(403);

        // Also test special schedule creation forbidden
        $specialResponse = $this->actingAs($this->cashierVictoria)
            ->postJson("/branches/{$this->staCruzBranch->id}/special-schedules", [
                'date'              => '2026-10-31',
                'label'             => 'Halloween',
                'is_closed_all_day' => true,
            ]);

        $specialResponse->assertStatus(403);
    }

    /**
     * Test 14: Admin can manage ANY branch operating hours.
     */
    public function test_admin_can_update_any_branch_schedule(): void
    {
        // Admin updates Sta. Cruz weekly regular hours
        $response = $this->actingAs($this->admin)
            ->putJson("/branches/{$this->staCruzBranch->id}/regular-hours", [
                'schedules' => [
                    [
                        'day_of_week' => 1,
                        'is_open'     => true,
                        'open_time'   => '09:30',
                        'close_time'  => '20:30',
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('branch_schedules', [
            'branch_id'   => $this->staCruzBranch->id,
            'day_of_week' => 1,
            'open_time'   => '09:30:00',
            'close_time'  => '20:30:00',
        ]);
    }

    /**
     * Test 15: Public / Customer Branch Operating Status API endpoint.
     */
    public function test_public_branch_operating_status_api_endpoint(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-07 15:00:00', 'Asia/Manila'));

        $response = $this->getJson("/api/v1/branches/{$this->victoriaBranch->id}/operating-status");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'branch_id'           => $this->victoriaBranch->id,
                    'is_open'             => true,
                    'is_accepting_orders' => true,
                    'operating_mode'      => 'automatic',
                ],
            ]);
    }
}
