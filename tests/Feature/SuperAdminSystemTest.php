<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\SystemSetting;
use App\Models\FeatureFlag;
use App\Models\SystemErrorLog;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\SuperAdminSeeder::class);
    }

    public function test_super_admin_seeder_creates_super_admin_user()
    {
        $superAdmin = User::where('role', User::ROLE_SUPER_ADMIN)->first();
        $this->assertNotNull($superAdmin);
        $this->assertTrue($superAdmin->isSuperAdmin());
        $this->assertTrue($superAdmin->isAdmin());
    }

    public function test_unauthenticated_user_cannot_access_super_admin_routes()
    {
        $response = $this->get('/super-admin');
        $response->assertRedirect('/login');
    }

    public function test_normal_admin_cannot_access_super_admin_routes()
    {
        $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

        $response = $this->actingAs($admin)->get('/super-admin');
        $response->assertStatus(403);

        $apiResponse = $this->actingAs($admin)->getJson('/super-admin/system-health/check');
        $apiResponse->assertStatus(403);
    }

    public function test_existing_admin_account_remains_admin_and_cannot_access_super_admin()
    {
        $this->seed(\Database\Seeders\DatabaseSeeder::class);

        $adminUser = User::where('email', 'jmbautista0228@gmail.com')->first();
        $this->assertNotNull($adminUser);
        $this->assertEquals('admin', $adminUser->role);
        $this->assertFalse($adminUser->isSuperAdmin());

        // Admin account must get 403 Forbidden when accessing /super-admin
        $response = $this->actingAs($adminUser)->get('/super-admin');
        $response->assertStatus(403);

        // Separate Super Admin account must exist
        $superAdminUser = User::where('email', 'superadmin@makidesu')->first();
        $this->assertNotNull($superAdminUser);
        $this->assertEquals('super_admin', $superAdminUser->role);
        $this->assertTrue($superAdminUser->isSuperAdmin());

        // Super Admin account can access /super-admin
        $superAdminResponse = $this->actingAs($superAdminUser)->get('/super-admin');
        $superAdminResponse->assertStatus(200);
    }

    public function test_super_admin_can_access_super_admin_dashboard()
    {
        $superAdmin = User::where('role', User::ROLE_SUPER_ADMIN)->first();

        $response = $this->actingAs($superAdmin)->get('/super-admin');
        $response->assertStatus(200);
    }

    public function test_public_system_status_api_returns_healthy_when_not_in_maintenance()
    {
        $response = $this->getJson('/api/v1/system/status');
        $response->assertStatus(200);
        $response->assertJson([
            'status'      => 'online',
            'maintenance' => false,
        ]);
    }

    public function test_maintenance_mode_toggle_and_public_503_response()
    {
        $superAdmin = User::where('role', User::ROLE_SUPER_ADMIN)->first();

        // Enable Maintenance Mode
        $toggleResponse = $this->actingAs($superAdmin)->postJson('/super-admin/maintenance/toggle', [
            'enabled'                    => true,
            'title'                      => 'Testing Maintenance',
            'message'                    => 'System is being updated',
            'estimated_restoration_time' => '15 minutes',
        ]);
        $toggleResponse->assertStatus(200);
        $toggleResponse->assertJson(['is_enabled' => true]);

        // Public API must return HTTP 503 Maintenance Mode
        $apiResponse = $this->getJson('/api/v1/system/status');
        $apiResponse->assertStatus(503);
        $apiResponse->assertJson([
            'status'            => 'maintenance',
            'maintenance'       => true,
            'maintenance_title' => 'Testing Maintenance',
        ]);

        // Super Admin can still access Super Admin console
        $adminConsoleResponse = $this->actingAs($superAdmin)->get('/super-admin');
        $adminConsoleResponse->assertStatus(200);

        // Disable Maintenance Mode
        $disableResponse = $this->actingAs($superAdmin)->postJson('/super-admin/maintenance/toggle', [
            'enabled' => false,
        ]);
        $disableResponse->assertStatus(200);

        $okResponse = $this->getJson('/api/v1/system/status');
        $okResponse->assertStatus(200);
    }

    public function test_feature_flag_toggle_records_audit_log()
    {
        $superAdmin = User::where('role', User::ROLE_SUPER_ADMIN)->first();
        $flag = FeatureFlag::first();

        $response = $this->actingAs($superAdmin)->postJson("/super-admin/features/{$flag->id}/toggle", [
            'is_enabled' => false,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('feature_flags', [
            'id'         => $flag->id,
            'is_enabled' => false,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action'   => 'feature_flag.toggled',
            'actor_id' => $superAdmin->id,
        ]);
    }

    public function test_sensitive_data_is_redacted_in_audit_logger()
    {
        $data = [
            'email'    => 'admin@test.com',
            'password' => 'SuperSecret123',
            'api_key'  => 'secret_key_123',
        ];

        $sanitized = \App\Services\AuditLogger::sanitize($data);

        $this->assertEquals('admin@test.com', $sanitized['email']);
        $this->assertEquals('[REDACTED]', $sanitized['password']);
        $this->assertEquals('[REDACTED]', $sanitized['api_key']);
    }
}
