<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\DeliveryAttempt;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use App\Services\CodEligibilityService;
use App\Services\CustomerRiskService;
use App\Services\CustomerTrustService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ForgivingCodAndRiderRestrictionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['cod_security.enabled' => true]);
        config(['cod_security.rolling_window_days' => 60]);
        config(['cod_security.temporary_restriction_days' => 7]);
    }

    public function test_customer_with_no_failures_is_low_risk_and_cod_eligible(): void
    {
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'account_status'    => User::STATUS_ACTIVE,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234567',
        ]);

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);
        $result = $eligibilityService->checkEligibility($customer, 1000.00);

        $this->assertTrue($result['eligible']);
        $this->assertEquals('LOW_RISK', $result['risk_level']);
        $this->assertEquals(5000.00, $result['max_cod_amount']);
    }

    public function test_customer_with_single_recent_refusal_is_medium_risk_and_allowed_under_limit(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234568',
        ]);

        $order = Order::create([
            'order_number'    => 'ORD-TEST-001',
            'user_id'         => $customer->id,
            'customer_name'   => $customer->name,
            'branch_id'       => $branch->id,
            'order_type'      => 'delivery',
            'status'          => 'failed_delivery',
            'payment_method'  => 'cod',
            'is_cod'          => true,
            'total_amount'    => 500.00,
            'contact_number'  => $customer->mobile_number,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'branch_id'        => $branch->id,
            'status'           => 'failed_delivery',
            'delivery_type'    => 'in_house',
            'customer_name'    => $customer->name,
            'customer_phone'   => $customer->mobile_number,
            'customer_address' => 'Laguna',
        ]);

        DeliveryAttempt::create([
            'delivery_id'      => $delivery->id,
            'order_id'         => $order->id,
            'customer_id'      => $customer->id,
            'attempt_number'   => 1,
            'status'           => 'failed',
            'failure_reason'   => 'CUSTOMER_REFUSED_ORDER',
            'failure_category' => 'customer_attributable',
            'created_at'       => now()->subDays(5),
        ]);

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);

        // Under ₱1,500 limit -> eligible
        $resultUnder = $eligibilityService->checkEligibility($customer, 1200.00);
        $this->assertTrue($resultUnder['eligible']);
        $this->assertEquals('MEDIUM_RISK', $resultUnder['risk_level']);

        // Over ₱1,500 limit -> not eligible
        $resultOver = $eligibilityService->checkEligibility($customer, 2000.00);
        $this->assertFalse($resultOver['eligible']);
    }

    public function test_customer_with_repeated_recent_refusals_gets_temporary_restriction_with_expiration(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234569',
        ]);

        for ($i = 1; $i <= 3; $i++) {
            $order = Order::create([
                'order_number'   => "ORD-REFUSE-{$i}",
                'user_id'        => $customer->id,
                'customer_name'  => $customer->name,
                'branch_id'      => $branch->id,
                'order_type'     => 'delivery',
                'status'         => 'failed_delivery',
                'payment_method' => 'cod',
                'is_cod'         => true,
                'total_amount'   => 300.00,
                'contact_number' => $customer->mobile_number,
            ]);

            $delivery = Delivery::create([
                'order_id'         => $order->id,
                'branch_id'        => $branch->id,
                'status'           => 'failed_delivery',
                'delivery_type'    => 'in_house',
                'customer_name'    => $customer->name,
                'customer_phone'   => $customer->mobile_number,
                'customer_address' => 'Laguna',
            ]);

            DeliveryAttempt::create([
                'delivery_id'      => $delivery->id,
                'order_id'         => $order->id,
                'customer_id'      => $customer->id,
                'attempt_number'   => 1,
                'status'           => 'failed',
                'failure_reason'   => 'CUSTOMER_REFUSED_ORDER',
                'failure_category' => 'customer_attributable',
                'created_at'       => now()->subDays($i),
            ]);
        }

        /** @var CustomerRiskService $riskService */
        $riskService = app(CustomerRiskService::class);
        $evaluation = $riskService->evaluateCustomerRisk($customer);

        $this->assertEquals('RESTRICTED', $evaluation['risk_level']);
        $this->assertTrue($evaluation['is_restricted']);
        $this->assertEquals('AUTOMATIC', $customer->fresh()->cod_restriction_source);
        $this->assertNotNull($customer->fresh()->cod_restriction_expires_at);
        $this->assertTrue($customer->fresh()->cod_restriction_expires_at->isFuture());

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);
        $result = $eligibilityService->checkEligibility($customer, 200.00);
        $this->assertFalse($result['eligible']);
        $this->assertStringContainsString('Temporary restriction until', $result['reason']);
    }

    public function test_expired_temporary_restriction_automatically_restores_cod_access(): void
    {
        $customer = User::factory()->create([
            'role'                        => User::ROLE_CUSTOMER,
            'phone_verified_at'           => now(),
            'mobile_number'               => '09171234570',
            'cod_restricted'              => true,
            'cod_restriction_source'      => 'AUTOMATIC',
            'cod_restricted_at'           => now()->subDays(10),
            'cod_restriction_expires_at'  => now()->subDays(3), // Expired 3 days ago!
            'cod_restriction_reason'      => 'Past temporary restriction',
        ]);

        $this->assertFalse($customer->isCodRestricted());

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);
        $result = $eligibilityService->checkEligibility($customer, 500.00);

        $this->assertTrue($result['eligible']);
        $this->assertFalse($customer->fresh()->cod_restricted);
    }

    public function test_old_failures_outside_rolling_window_do_not_block_cod(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234571',
        ]);

        // 3 failures from 90 days ago (outside the 60-day window)
        for ($i = 1; $i <= 3; $i++) {
            $order = Order::create([
                'order_number'   => "ORD-OLD-{$i}",
                'user_id'        => $customer->id,
                'customer_name'  => $customer->name,
                'branch_id'      => $branch->id,
                'order_type'     => 'delivery',
                'status'         => 'failed_delivery',
                'payment_method' => 'cod',
                'is_cod'         => true,
                'total_amount'   => 300.00,
                'contact_number' => $customer->mobile_number,
            ]);
            $order->created_at = now()->subDays(90);
            $order->saveQuietly();

            $delivery = Delivery::create([
                'order_id'         => $order->id,
                'branch_id'        => $branch->id,
                'status'           => 'failed_delivery',
                'delivery_type'    => 'in_house',
                'customer_name'    => $customer->name,
                'customer_phone'   => $customer->mobile_number,
                'customer_address' => 'Laguna',
            ]);
            $delivery->created_at = now()->subDays(90);
            $delivery->saveQuietly();

            $attempt = DeliveryAttempt::create([
                'delivery_id'      => $delivery->id,
                'order_id'         => $order->id,
                'customer_id'      => $customer->id,
                'attempt_number'   => 1,
                'status'           => 'failed',
                'failure_reason'   => 'CUSTOMER_REFUSED_ORDER',
                'failure_category' => 'customer_attributable',
            ]);
            $attempt->created_at = now()->subDays(90);
            $attempt->saveQuietly();
        }

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);
        $result = $eligibilityService->checkEligibility($customer, 1000.00);

        // Must be low risk because recent window is clean!
        $this->assertTrue($result['eligible']);
        $this->assertEquals('LOW_RISK', $result['risk_level']);

        /** @var CustomerTrustService $trustService */
        $trustService = app(CustomerTrustService::class);
        $metrics = $trustService->getCustomerMetrics($customer);
        $this->assertEquals(0, $metrics['customer_refusals']); // in rolling window
        $this->assertEquals(3, $metrics['lifetime_refusals']); // preserved in lifetime audit
    }

    public function test_super_admin_manual_restriction_is_preserved_and_never_auto_expired(): void
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234572',
        ]);

        $customer->applyManualCodRestriction($admin, 'Manual Super Admin ban for fraudulent activity');

        $this->assertTrue($customer->isCodRestricted());
        $this->assertEquals('MANUAL', $customer->cod_restriction_source);
        $this->assertEquals($admin->id, $customer->cod_restricted_by);

        /** @var CustomerRiskService $riskService */
        $riskService = app(CustomerRiskService::class);
        $evaluation = $riskService->evaluateCustomerRisk($customer);

        $this->assertEquals('RESTRICTED', $evaluation['risk_level']);
        $this->assertEquals('MANUAL', $evaluation['restriction_source']);

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);
        $result = $eligibilityService->checkEligibility($customer, 100.00);
        $this->assertFalse($result['eligible']);
    }

    public function test_rider_can_login_when_previously_offline(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $rider = Rider::create([
            'name'           => 'Rider Juan',
            'email'          => 'riderjuan@makidesu.test',
            'phone'          => '09181234567',
            'password'       => 'password123',
            'branch_id'      => $branch->id,
            'account_status' => Rider::STATUS_ACTIVE,
            'is_active'      => false, // Currently off-duty / offline
            'status'         => 'offline',
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email'    => 'riderjuan@makidesu.test',
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['status' => 'success']);

        $this->assertTrue((bool) $rider->fresh()->is_active);
        $this->assertEquals('available', $rider->fresh()->status);
        $this->assertEquals(Rider::STATUS_ACTIVE, $rider->fresh()->account_status);
    }

    public function test_rider_logout_sets_presence_offline_but_leaves_account_status_active(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $rider = Rider::create([
            'name'           => 'Rider Pedro',
            'email'          => 'riderpedro@makidesu.test',
            'phone'          => '09181234568',
            'password'       => 'password123',
            'branch_id'      => $branch->id,
            'account_status' => Rider::STATUS_ACTIVE,
            'is_active'      => true,
            'status'         => 'available',
        ]);

        $token = $rider->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/logout');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        $fresh = $rider->fresh();
        $this->assertEquals('offline', $fresh->status);
        $this->assertFalse((bool) $fresh->is_active);
        $this->assertEquals(Rider::STATUS_ACTIVE, $fresh->account_status); // Still active!
    }

    public function test_rider_update_status_returns_true_account_status(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $rider = Rider::create([
            'name'           => 'Rider Maria',
            'email'          => 'ridermaria@makidesu.test',
            'phone'          => '09181234569',
            'password'       => 'password123',
            'branch_id'      => $branch->id,
            'account_status' => Rider::STATUS_ACTIVE,
            'is_active'      => true,
            'status'         => 'available',
        ]);

        $token = $rider->createToken('test-token')->plainTextToken;

        // Rider goes offline
        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson('/api/v1/rider/status', [
                'status'    => 'offline',
                'is_active' => false,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success'        => true,
            'account_status' => 'active', // Must be active, NOT 'inactive'!
            'status'         => 'offline',
            'is_active'      => false,
        ]);
    }

    public function test_rider_logout_during_active_delivery_logs_warning_and_preserves_delivery(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $rider = Rider::create([
            'name'           => 'Rider Active Delivery',
            'email'          => 'rideractive@makidesu.test',
            'phone'          => '09181234570',
            'password'       => 'password123',
            'branch_id'      => $branch->id,
            'account_status' => Rider::STATUS_ACTIVE,
            'is_active'      => true,
            'status'         => 'busy',
        ]);

        $customer = User::factory()->create([
            'role'          => User::ROLE_CUSTOMER,
            'mobile_number' => '09171234599',
        ]);

        $order = Order::create([
            'order_number'   => 'ORD-ACTIVE-001',
            'user_id'        => $customer->id,
            'customer_name'  => $customer->name,
            'branch_id'      => $branch->id,
            'order_type'     => 'delivery',
            'status'         => 'in_transit',
            'payment_method' => 'cod',
            'is_cod'         => true,
            'total_amount'   => 500.00,
            'contact_number' => $customer->mobile_number,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'branch_id'        => $branch->id,
            'status'           => 'in_transit',
            'delivery_type'    => 'in_house',
            'customer_name'    => $customer->name,
            'customer_phone'   => $customer->mobile_number,
            'customer_address' => 'Laguna',
        ]);

        $token = $rider->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/v1/logout');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);

        // Account status must remain active, presence is offline, and delivery remains assigned
        $this->assertEquals(Rider::STATUS_ACTIVE, $rider->fresh()->account_status);
        $this->assertEquals('offline', $rider->fresh()->status);
        $this->assertEquals('in_transit', $delivery->fresh()->status);
        $this->assertEquals($rider->id, $delivery->fresh()->rider_id);
    }

    public function test_customer_active_orders_limit_and_restoration(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234588',
        ]);

        // Create 2 active orders
        $order1 = Order::create([
            'order_number'   => 'ORD-ACTIVE-1',
            'user_id'        => $customer->id,
            'customer_name'  => $customer->name,
            'branch_id'      => $branch->id,
            'order_type'     => 'delivery',
            'status'         => 'preparing',
            'payment_method' => 'cod',
            'is_cod'         => true,
            'total_amount'   => 400.00,
            'contact_number' => $customer->mobile_number,
        ]);

        $order2 = Order::create([
            'order_number'   => 'ORD-ACTIVE-2',
            'user_id'        => $customer->id,
            'customer_name'  => $customer->name,
            'branch_id'      => $branch->id,
            'order_type'     => 'delivery',
            'status'         => 'in_transit',
            'payment_method' => 'cod',
            'is_cod'         => true,
            'total_amount'   => 400.00,
            'contact_number' => $customer->mobile_number,
        ]);

        /** @var CodEligibilityService $eligibilityService */
        $eligibilityService = app(CodEligibilityService::class);

        // 2 active orders -> blocked
        $resultBlocked = $eligibilityService->checkEligibility($customer, 300.00);
        $this->assertFalse($resultBlocked['eligible']);
        $this->assertStringContainsString('active delivery order(s) in progress', $resultBlocked['reason']);

        // Deliver both orders
        $order1->update(['status' => 'delivered']);
        $order2->update(['status' => 'delivered']);

        // Now 0 active orders -> immediately eligible
        $resultAllowed = $eligibilityService->checkEligibility($customer, 300.00);
        $this->assertTrue($resultAllowed['eligible']);
    }

    public function test_consecutive_successful_orders_restores_risk(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Laguna']);
        $customer = User::factory()->create([
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'mobile_number'     => '09171234577',
        ]);

        // Customer has 1 refusal (normally MEDIUM_RISK)
        $failedOrder = Order::create([
            'order_number'   => 'ORD-FAILED-1',
            'user_id'        => $customer->id,
            'customer_name'  => $customer->name,
            'branch_id'      => $branch->id,
            'order_type'     => 'delivery',
            'status'         => 'failed_delivery',
            'payment_method' => 'cod',
            'is_cod'         => true,
            'total_amount'   => 300.00,
            'contact_number' => $customer->mobile_number,
        ]);
        $failedOrder->created_at = now()->subDays(10);
        $failedOrder->saveQuietly();

        $failedDelivery = Delivery::create([
            'order_id'         => $failedOrder->id,
            'branch_id'        => $branch->id,
            'status'           => 'failed_delivery',
            'delivery_type'    => 'in_house',
            'customer_name'    => $customer->name,
            'customer_phone'   => $customer->mobile_number,
            'customer_address' => 'Laguna',
        ]);
        $failedDelivery->created_at = now()->subDays(10);
        $failedDelivery->saveQuietly();

        $attempt = DeliveryAttempt::create([
            'delivery_id'      => $failedDelivery->id,
            'order_id'         => $failedOrder->id,
            'customer_id'      => $customer->id,
            'attempt_number'   => 1,
            'status'           => 'failed',
            'failure_reason'   => 'CUSTOMER_REFUSED_ORDER',
            'failure_category' => 'customer_attributable',
        ]);
        $attempt->created_at = now()->subDays(10);
        $attempt->saveQuietly();

        // Customer subsequently completes 2 consecutive successful orders
        for ($i = 1; $i <= 2; $i++) {
            $succOrder = Order::create([
                'order_number'   => "ORD-SUCCESS-{$i}",
                'user_id'        => $customer->id,
                'customer_name'  => $customer->name,
                'branch_id'      => $branch->id,
                'order_type'     => 'delivery',
                'status'         => 'delivered',
                'payment_method' => 'cod',
                'is_cod'         => true,
                'total_amount'   => 400.00,
                'contact_number' => $customer->mobile_number,
            ]);
            $succOrder->created_at = now()->subDays(5 - $i);
            $succOrder->saveQuietly();
        }

        /** @var CustomerRiskService $riskService */
        $riskService = app(CustomerRiskService::class);
        $evaluation = $riskService->evaluateCustomerRisk($customer);

        // Risk restored to LOW_RISK due to 2 consecutive successful deliveries
        $this->assertEquals('LOW_RISK', $evaluation['risk_level']);
        $this->assertStringContainsString('restored to LOW', implode(' ', $evaluation['reasons']));
    }
}

