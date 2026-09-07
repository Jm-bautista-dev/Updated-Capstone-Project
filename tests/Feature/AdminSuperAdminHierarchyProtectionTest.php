<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use App\Services\AccountGovernanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminSuperAdminHierarchyProtectionTest extends TestCase
{
    use RefreshDatabase;

    public User $superAdmin;
    public User $admin;
    public User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'      => 'Main Branch',
            'code'      => 'MAIN',
            'address'   => 'Main Address',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'name'           => 'Super Admin Master',
            'email'          => 'superadmin@example.com',
            'role'           => User::ROLE_SUPER_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);

        $this->admin = User::factory()->create([
            'name'           => 'Admin User',
            'email'          => 'admin@example.com',
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);

        $this->cashier = User::factory()->create([
            'name'           => 'Cashier Employee',
            'email'          => 'cashier@example.com',
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);
    }

    public function test_admin_cannot_see_super_admin_in_employee_list(): void
    {
        $response = $this->actingAs($this->admin)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('isSuperAdmin', false)
            ->has('employees', 2)
            ->where('employees', function ($employees) {
                $collection = collect($employees);
                return !$collection->contains('role', User::ROLE_SUPER_ADMIN)
                    && !$collection->contains('email', 'superadmin@example.com');
            })
            ->where('kpis.admins', 1)
            ->where('kpis.total', 2) // only admin + cashier
        );
    }

    public function test_super_admin_can_see_super_admins_and_all_employees(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/employees');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Employees/Index')
            ->where('isSuperAdmin', true)
            ->has('employees', 3)
            ->where('employees', function ($employees) {
                $collection = collect($employees);
                return $collection->contains('role', User::ROLE_SUPER_ADMIN)
                    && $collection->contains('email', 'superadmin@example.com');
            })
            ->where('kpis.admins', 1)
            ->where('kpis.total', 3) // includes super admin
        );
    }

    public function test_admin_manageable_employees_scope_strictly_excludes_super_admins(): void
    {
        $manageableByAdmin = User::manageableEmployees($this->admin)->get();
        $this->assertFalse($manageableByAdmin->contains('role', User::ROLE_SUPER_ADMIN));
        $this->assertFalse($manageableByAdmin->contains('email', 'superadmin@example.com'));
        $this->assertTrue($manageableByAdmin->contains('email', 'admin@example.com'));
        $this->assertTrue($manageableByAdmin->contains('email', 'cashier@example.com'));

        $manageableBySuperAdmin = User::manageableEmployees($this->superAdmin)->get();
        $this->assertTrue($manageableBySuperAdmin->contains('role', User::ROLE_SUPER_ADMIN));
        $this->assertTrue($manageableBySuperAdmin->contains('email', 'superadmin@example.com'));
    }

    public function test_admin_cannot_update_super_admin_account(): void
    {
        $response = $this->actingAs($this->admin)->put("/employees/{$this->superAdmin->id}", [
            'name'      => 'Hacked Super Admin',
            'email'     => 'hacked@example.com',
            'role'      => User::ROLE_ADMIN,
            'branch_id' => $this->branch->id,
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', [
            'id'    => $this->superAdmin->id,
            'name'  => 'Super Admin Master',
            'email' => 'superadmin@example.com',
            'role'  => User::ROLE_SUPER_ADMIN,
        ]);
    }

    public function test_admin_cannot_escalate_roles_to_super_admin_on_create(): void
    {
        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => 'Escalated User',
            'email'     => 'escalated@example.com',
            'role'      => User::ROLE_SUPER_ADMIN,
            'branch_id' => $this->branch->id,
            'password'  => 'Password123!',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['email' => 'escalated@example.com']);
    }

    public function test_admin_cannot_escalate_existing_account_to_super_admin(): void
    {
        $response = $this->actingAs($this->admin)->put("/employees/{$this->cashier->id}", [
            'name'      => 'Promoted Cashier',
            'email'     => $this->cashier->email,
            'role'      => User::ROLE_SUPER_ADMIN,
            'branch_id' => $this->branch->id,
        ]);

        $response->assertStatus(403);
        $this->assertEquals(User::ROLE_CASHIER, $this->cashier->fresh()->role);
    }

    public function test_admin_cannot_delete_super_admin_account(): void
    {
        $response = $this->actingAs($this->admin)->delete("/employees/{$this->superAdmin->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $this->superAdmin->id]);
    }

    public function test_super_admin_can_update_and_manage_accounts(): void
    {
        $response = $this->actingAs($this->superAdmin)->put("/employees/{$this->cashier->id}", [
            'name'      => 'Updated Cashier Name',
            'email'     => 'updatedcashier@example.com',
            'role'      => User::ROLE_CASHIER,
            'branch_id' => $this->branch->id,
        ]);

        $response->assertRedirect();
        $this->assertEquals('Updated Cashier Name', $this->cashier->fresh()->name);
    }

    public function test_account_governance_prevents_admin_from_flagging_super_admin(): void
    {
        $service = app(AccountGovernanceService::class);

        $this->expectException(\RuntimeException::class);
        $service->flagAccount(
            target: $this->superAdmin,
            reasonCategory: 'conduct',
            title: 'Test Flag',
            description: 'Test reason',
            evidenceNotes: null,
            reporter: $this->admin,
            markUnderReview: false
        );
    }
}
