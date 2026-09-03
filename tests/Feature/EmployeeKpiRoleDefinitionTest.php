<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class EmployeeKpiRoleDefinitionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Branch::create([
            'name'      => 'Main Branch',
            'code'      => 'MAIN',
            'address'   => 'Main Address',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);
    }

    /**
     * Scenario A: SUPER_ADMIN × 2, ADMIN × 1 (viewer), STAFF × 3 -> ADMINISTRATORS = 1 (only the 1 admin)
     */
    public function test_scenario_a_super_admins_present_but_zero_extra_admins_produces_exact_kpi(): void
    {
        $viewer = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(2)->create(['role' => User::ROLE_SUPER_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(3)->create(['role' => User::ROLE_CASHIER, 'account_status' => User::STATUS_ACTIVE]);

        $response = $this->actingAs($viewer)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('kpis.admins', 1)
            ->where('kpis.total', 6)
        );
    }

    /**
     * Scenario B: SUPER_ADMIN × 2, ADMIN × 3, STAFF × 5 -> ADMINISTRATORS = 3
     */
    public function test_scenario_b_mixed_roles_counts_admin_only(): void
    {
        $viewer = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(2)->create(['role' => User::ROLE_SUPER_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(2)->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(5)->create(['role' => User::ROLE_CASHIER, 'account_status' => User::STATUS_ACTIVE]);

        $response = $this->actingAs($viewer)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('kpis.admins', 3)
            ->where('kpis.cashiers', 5)
            ->where('kpis.total', 10)
        );
    }

    /**
     * Scenario C: SUPER_ADMIN × 0, ADMIN × 3, STAFF × 5 -> ADMINISTRATORS = 3
     */
    public function test_scenario_c_no_super_admins_counts_admins_accurately(): void
    {
        $adminViewer = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(2)->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->count(5)->create(['role' => User::ROLE_CASHIER, 'account_status' => User::STATUS_ACTIVE]);

        $response = $this->actingAs($adminViewer)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('kpis.admins', 3)
        );
    }

    /**
     * Scenario D: Inactive / Deactivated accounts are excluded from active KPI count
     */
    public function test_deactivated_admin_accounts_are_excluded_from_kpi(): void
    {
        $viewer = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_DEACTIVATED]);

        $response = $this->actingAs($viewer)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('kpis.admins', 2)
        );
    }

    /**
     * Scenario E: Role changes dynamically update KPI count
     */
    public function test_role_changes_and_creations_dynamically_update_kpi(): void
    {
        $viewer = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        $staff = User::factory()->create(['role' => User::ROLE_CASHIER, 'account_status' => User::STATUS_ACTIVE]);
        $otherAdmin = User::factory()->create(['role' => User::ROLE_ADMIN, 'account_status' => User::STATUS_ACTIVE]);

        // Baseline: 2 admins (viewer + otherAdmin)
        $response = $this->actingAs($viewer)->get('/employees');
        $response->assertInertia(fn (Assert $page) => $page->where('kpis.admins', 2));

        // Promote STAFF -> ADMIN (+1 admin = 3)
        $staff->update(['role' => User::ROLE_ADMIN]);
        $response = $this->actingAs($viewer)->get('/employees');
        $response->assertInertia(fn (Assert $page) => $page->where('kpis.admins', 3));

        // Promote otherAdmin -> SUPER_ADMIN (-1 admin, since SUPER_ADMIN is excluded = 2)
        $otherAdmin->update(['role' => User::ROLE_SUPER_ADMIN]);
        $response = $this->actingAs($viewer)->get('/employees');
        $response->assertInertia(fn (Assert $page) => $page->where('kpis.admins', 2));

        // Create new SUPER_ADMIN (KPI should NOT change = 2)
        User::factory()->create(['role' => User::ROLE_SUPER_ADMIN, 'account_status' => User::STATUS_ACTIVE]);
        $response = $this->actingAs($viewer)->get('/employees');
        $response->assertInertia(fn (Assert $page) => $page->where('kpis.admins', 2));
    }
}
