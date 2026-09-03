<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use App\Services\AccountGovernanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConsecutiveAccountRestrictionTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $superAdmin;
    protected User $regularAdmin;
    protected AccountGovernanceService $governanceService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'        => 'Main Branch',
            'code'        => 'MAIN-01',
            'address'     => '123 Test St',
            'is_active'   => true,
            'is_main'     => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'role'           => 'super_admin',
            'account_status' => 'active',
            'branch_id'      => $this->branch->id,
        ]);

        $this->regularAdmin = User::factory()->create([
            'role'           => 'admin',
            'account_status' => 'active',
            'branch_id'      => $this->branch->id,
        ]);

        $this->governanceService = app(AccountGovernanceService::class);
    }

    public function test_customer_is_not_restricted_with_fewer_than_10_cancellations(): void
    {
        $customer = User::factory()->create([
            'role'                      => 'customer',
            'account_status'            => 'active',
            'consecutive_cancellations' => 0,
            'branch_id'                 => $this->branch->id,
        ]);

        for ($i = 1; $i <= 9; $i++) {
            $this->governanceService->recordCustomerCancellation($customer, "Customer cancellation {$i}");
        }

        $customer->refresh();
        $this->assertEquals(9, $customer->consecutive_cancellations);
        $this->assertEquals('active', $customer->account_status);
        $this->assertFalse((bool) $customer->is_order_restricted);
    }

    public function test_customer_is_automatically_restricted_on_10th_consecutive_cancellation(): void
    {
        $customer = User::factory()->create([
            'role'                      => 'customer',
            'account_status'            => 'active',
            'consecutive_cancellations' => 0,
            'branch_id'                 => $this->branch->id,
        ]);

        for ($i = 1; $i <= 10; $i++) {
            $this->governanceService->recordCustomerCancellation($customer, "Customer cancellation {$i}");
        }

        $customer->refresh();
        $this->assertEquals(10, $customer->consecutive_cancellations);
        $this->assertEquals('restricted', $customer->account_status);
        $this->assertEquals('AUTOMATIC', $customer->restriction_source);
        $this->assertTrue((bool) $customer->is_order_restricted);
        $this->assertNotNull($customer->restricted_at);
        $this->assertStringContainsString('10 consecutive order cancellations', $customer->status_reason);
    }

    public function test_successful_delivered_order_resets_customer_cancellation_streak_to_zero(): void
    {
        $customer = User::factory()->create([
            'role'                      => 'customer',
            'account_status'            => 'active',
            'consecutive_cancellations' => 0,
            'branch_id'                 => $this->branch->id,
        ]);

        // 9 consecutive cancellations
        for ($i = 1; $i <= 9; $i++) {
            $this->governanceService->recordCustomerCancellation($customer, "Customer cancellation {$i}");
        }

        $customer->refresh();
        $this->assertEquals(9, $customer->consecutive_cancellations);

        // 1 successful delivered order
        $this->governanceService->recordCustomerSuccessfulOrder($customer);

        $customer->refresh();
        $this->assertEquals(0, $customer->consecutive_cancellations);
        $this->assertEquals('active', $customer->account_status);

        // Another cancellation starts streak at 1, NOT 10
        $this->governanceService->recordCustomerCancellation($customer, "New cancellation");
        $customer->refresh();
        $this->assertEquals(1, $customer->consecutive_cancellations);
        $this->assertEquals('active', $customer->account_status);
    }

    public function test_rider_is_not_restricted_with_fewer_than_5_delivery_failures(): void
    {
        $rider = Rider::create([
            'name'                          => 'Test Rider',
            'email'                         => 'rider@test.com',
            'phone'                         => '09123456789',
            'password'                      => bcrypt('password'),
            'account_status'                => 'active',
            'is_active'                     => true,
            'status'                        => 'available',
            'consecutive_delivery_failures' => 0,
            'branch_id'                     => $this->branch->id,
        ]);

        for ($i = 1; $i <= 4; $i++) {
            $this->governanceService->recordRiderDeliveryFailure($rider, "Rider failure {$i}");
        }

        $rider->refresh();
        $this->assertEquals(4, $rider->consecutive_delivery_failures);
        $this->assertEquals('active', $rider->account_status);
        $this->assertFalse((bool) $rider->is_delivery_restricted);
    }

    public function test_rider_is_automatically_restricted_on_5th_consecutive_failure(): void
    {
        $rider = Rider::create([
            'name'                          => 'Test Rider',
            'email'                         => 'rider@test.com',
            'phone'                         => '09123456789',
            'password'                      => bcrypt('password'),
            'account_status'                => 'active',
            'is_active'                     => true,
            'status'                        => 'available',
            'consecutive_delivery_failures' => 0,
            'branch_id'                     => $this->branch->id,
        ]);

        for ($i = 1; $i <= 5; $i++) {
            $this->governanceService->recordRiderDeliveryFailure($rider, "Rider failure {$i}");
        }

        $rider->refresh();
        $this->assertEquals(5, $rider->consecutive_delivery_failures);
        $this->assertEquals('restricted', $rider->account_status);
        $this->assertEquals('AUTOMATIC', $rider->restriction_source);
        $this->assertTrue((bool) $rider->is_delivery_restricted);
        $this->assertNotNull($rider->restricted_at);
        $this->assertStringContainsString('5 consecutive failed deliveries', $rider->status_reason);
    }

    public function test_successful_delivery_resets_rider_failure_streak_to_zero(): void
    {
        $rider = Rider::create([
            'name'                          => 'Test Rider',
            'email'                         => 'rider@test.com',
            'phone'                         => '09123456789',
            'password'                      => bcrypt('password'),
            'account_status'                => 'active',
            'is_active'                     => true,
            'status'                        => 'available',
            'consecutive_delivery_failures' => 0,
            'branch_id'                     => $this->branch->id,
        ]);

        for ($i = 1; $i <= 4; $i++) {
            $this->governanceService->recordRiderDeliveryFailure($rider, "Rider failure {$i}");
        }

        $rider->refresh();
        $this->assertEquals(4, $rider->consecutive_delivery_failures);

        // Successful delivery
        $this->governanceService->recordRiderSuccessfulDelivery($rider);

        $rider->refresh();
        $this->assertEquals(0, $rider->consecutive_delivery_failures);
        $this->assertEquals('active', $rider->account_status);
    }

    public function test_super_admin_can_remove_restriction_and_it_resets_streak_to_zero(): void
    {
        $customer = User::factory()->create([
            'role'                      => 'customer',
            'account_status'            => 'active',
            'consecutive_cancellations' => 0,
            'branch_id'                 => $this->branch->id,
        ]);

        // Auto-restrict with 10 cancellations
        for ($i = 1; $i <= 10; $i++) {
            $this->governanceService->recordCustomerCancellation($customer, "Customer cancellation {$i}");
        }

        $customer->refresh();
        $this->assertEquals('restricted', $customer->account_status);
        $this->assertEquals(10, $customer->consecutive_cancellations);

        // Super Admin lifts restriction via endpoint
        $response = $this->actingAs($this->superAdmin)->postJson(
            "/super-admin/accounts/user/{$customer->id}/remove-restriction",
            ['reason' => 'Customer appeal approved and phone verified']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $customer->refresh();
        $this->assertEquals('active', $customer->account_status);
        $this->assertEquals(0, $customer->consecutive_cancellations);
        $this->assertFalse((bool) $customer->is_order_restricted);
        $this->assertNull($customer->restricted_at);
        $this->assertNotNull($customer->restriction_removed_at);
        $this->assertEquals($this->superAdmin->id, $customer->restriction_removed_by);

        // Subsequent single cancellation sets streak to 1, does NOT immediately restrict
        $this->governanceService->recordCustomerCancellation($customer, "Post-lift cancellation");
        $customer->refresh();
        $this->assertEquals(1, $customer->consecutive_cancellations);
        $this->assertEquals('active', $customer->account_status);
    }

    public function test_super_admin_can_remove_restriction_from_rider(): void
    {
        $rider = Rider::create([
            'name'                          => 'Test Rider',
            'email'                         => 'rider@test.com',
            'phone'                         => '09123456789',
            'password'                      => bcrypt('password'),
            'account_status'                => 'active',
            'is_active'                     => true,
            'status'                        => 'available',
            'consecutive_delivery_failures' => 0,
            'branch_id'                     => $this->branch->id,
        ]);

        // Auto-restrict with 5 failures
        for ($i = 1; $i <= 5; $i++) {
            $this->governanceService->recordRiderDeliveryFailure($rider, "Rider failure {$i}");
        }

        $rider->refresh();
        $this->assertEquals('restricted', $rider->account_status);
        $this->assertEquals(5, $rider->consecutive_delivery_failures);

        // Super Admin lifts restriction
        $response = $this->actingAs($this->superAdmin)->postJson(
            "/super-admin/accounts/rider/{$rider->id}/remove-restriction",
            ['reason' => 'Rider vehicle breakdown investigated and resolved']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $rider->refresh();
        $this->assertEquals('active', $rider->account_status);
        $this->assertEquals(0, $rider->consecutive_delivery_failures);
        $this->assertFalse((bool) $rider->is_delivery_restricted);
        $this->assertNull($rider->restricted_at);
    }

    public function test_regular_admin_cannot_remove_account_restrictions(): void
    {
        $customer = User::factory()->create([
            'role'                      => 'customer',
            'account_status'            => 'restricted',
            'is_order_restricted'       => true,
            'consecutive_cancellations' => 10,
            'branch_id'                 => $this->branch->id,
        ]);

        $response = $this->actingAs($this->regularAdmin)->postJson(
            "/super-admin/accounts/user/{$customer->id}/remove-restriction",
            ['reason' => 'Unauthorized lift attempt']
        );

        $response->assertStatus(403);

        $customer->refresh();
        $this->assertEquals('restricted', $customer->account_status);
        $this->assertEquals(10, $customer->consecutive_cancellations);
    }

    public function test_super_admin_can_manually_restrict_an_account(): void
    {
        $customer = User::factory()->create([
            'role'           => 'customer',
            'account_status' => 'active',
            'branch_id'      => $this->branch->id,
        ]);

        $response = $this->actingAs($this->superAdmin)->postJson(
            "/super-admin/accounts/user/{$customer->id}/restrict",
            ['reason' => 'Suspicious fraudulent activity detected']
        );

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);

        $customer->refresh();
        $this->assertEquals('restricted', $customer->account_status);
        $this->assertEquals('MANUAL', $customer->restriction_source);
        $this->assertEquals('Suspicious fraudulent activity detected', $customer->status_reason);
        $this->assertTrue((bool) $customer->is_order_restricted);
    }
}
