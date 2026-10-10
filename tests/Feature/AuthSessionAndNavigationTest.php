<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthSessionAndNavigationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $admin;
    protected User $cashier;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Main Test Branch',
            'location' => 'Dagupan City',
            'address' => 'Dagupan City, Pangasinan',
            'latitude' => 16.0433,
            'longitude' => 120.3333,
            'phone' => '09123456789',
            'is_active' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Admin Test',
            'email' => 'superadmin.test@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_SUPER_ADMIN,
            'account_status' => 'active',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $this->admin = User::create([
            'name' => 'Admin Test',
            'email' => 'admin.test@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_ADMIN,
            'account_status' => 'active',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $this->cashier = User::create([
            'name' => 'Cashier Test',
            'email' => 'cashier.test@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_CASHIER,
            'account_status' => 'active',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $this->customer = User::create([
            'name' => 'Customer Test',
            'email' => 'customer.test@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_CUSTOMER,
            'account_status' => 'active',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);
    }

    /**
     * Test Super Admin login redirects to /super-admin.
     */
    public function test_super_admin_login_redirects_to_super_admin_dashboard(): void
    {
        $response = $this->post('/login', [
            'email' => $this->superAdmin->email,
            'password' => 'Password123!',
        ]);

        $this->assertAuthenticatedAs($this->superAdmin);
        $response->assertRedirect('/super-admin');
    }

    /**
     * Test Admin login redirects to /dashboard.
     */
    public function test_admin_login_redirects_to_admin_dashboard(): void
    {
        $response = $this->post('/login', [
            'email' => $this->admin->email,
            'password' => 'Password123!',
        ]);

        $this->assertAuthenticatedAs($this->admin);
        $response->assertRedirect('/dashboard');
    }

    /**
     * Test Cashier login redirects to /pos.
     */
    public function test_cashier_login_redirects_to_pos(): void
    {
        $response = $this->post('/login', [
            'email' => $this->cashier->email,
            'password' => 'Password123!',
        ]);

        $this->assertAuthenticatedAs($this->cashier);
        $response->assertRedirect('/pos');
    }

    /**
     * Test authenticated Super Admin visiting /login is redirected to /super-admin.
     */
    public function test_authenticated_super_admin_visiting_login_redirects_to_super_admin(): void
    {
        $response = $this->actingAs($this->superAdmin)->get('/login');
        $response->assertRedirect('/super-admin');
    }

    /**
     * Test authenticated Admin visiting /login is redirected to /dashboard.
     */
    public function test_authenticated_admin_visiting_login_redirects_to_dashboard(): void
    {
        $response = $this->actingAs($this->admin)->get('/login');
        $response->assertRedirect('/dashboard');
    }

    /**
     * Test authenticated Cashier visiting /login is redirected to /pos.
     */
    public function test_authenticated_cashier_visiting_login_redirects_to_pos(): void
    {
        $response = $this->actingAs($this->cashier)->get('/login');
        $response->assertRedirect('/pos');
    }

    /**
     * Test authenticated Cashier visiting /dashboard is redirected to /pos.
     */
    public function test_authenticated_cashier_visiting_dashboard_redirects_to_pos(): void
    {
        $response = $this->actingAs($this->cashier)->get('/dashboard');

        $response->assertRedirect('/pos');
    }

    /**
     * Test unauthenticated access to protected routes redirects to /login.
     */
    public function test_unauthenticated_user_accessing_protected_routes_redirects_to_login(): void
    {
        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');

        $response = $this->get('/pos');
        $response->assertRedirect('/login');

        $response = $this->get('/super-admin');
        $response->assertRedirect('/login');
    }

    /**
     * Test unauthenticated API requests receive 401 JSON.
     */
    public function test_unauthenticated_api_request_receives_401_json(): void
    {
        $response = $this->getJson('/api/v1/notifications');
        $response->assertStatus(401);
        $response->assertJson([
            'status' => 'error',
            'message' => 'Unauthenticated.',
        ]);
    }

    /**
     * Test explicit logout invalidates session and attaches strict anti-caching headers.
     */
    public function test_logout_invalidates_session_and_attaches_anti_cache_headers(): void
    {
        $this->actingAs($this->admin);
        $this->assertAuthenticatedAs($this->admin);

        $response = $this->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
        
        $cacheControl = $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('no-cache', $cacheControl);
        $response->assertHeader('Pragma', 'no-cache');
    }

    /**
     * Test protected pages have strict Cache-Control headers to prevent BFCache/disk caching of sensitive data.
     */
    public function test_protected_pages_have_strict_anti_cache_headers(): void
    {
        $response = $this->actingAs($this->admin)->get('/dashboard');

        $cacheControl = $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('no-cache', $cacheControl);
        $response->assertHeader('Pragma', 'no-cache');
    }

    /**
     * Test user required to change password is redirected to /change-password.
     */
    public function test_must_change_password_user_redirected_to_change_password(): void
    {
        $firstLoginUser = User::create([
            'name' => 'First Login User',
            'email' => 'firstlogin@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => User::ROLE_ADMIN,
            'account_status' => 'active',
            'must_change_password' => true,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->post('/login', [
            'email' => $firstLoginUser->email,
            'password' => 'Password123!',
        ]);

        $response->assertRedirect('/change-password');

        // Accessing protected dashboard should redirect to change-password
        $dashResponse = $this->actingAs($firstLoginUser)->get('/dashboard');
        $dashResponse->assertRedirect('/change-password');
    }

    /**
     * Test suspended user cannot log in.
     */
    public function test_suspended_user_cannot_login(): void
    {
        $suspendedUser = User::create([
            'name' => 'Suspended User',
            'email' => 'suspended@makidesu.com',
            'password' => Hash::make('Password123!',
            ),
            'role' => User::ROLE_CASHIER,
            'account_status' => 'suspended',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $response = $this->post('/login', [
            'email' => $suspendedUser->email,
            'password' => 'Password123!',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
    }

    /**
     * Test normal admin cannot access super-admin dashboard.
     */
    public function test_admin_cannot_access_super_admin_panel(): void
    {
        $response = $this->actingAs($this->admin)->get('/super-admin');
        $response->assertStatus(403);
    }

    /**
     * Regression Test: Cashier role remains Cashier and cannot access any Admin-only routes.
     */
    public function test_cashier_role_strictly_enforced_across_all_admin_routes(): void
    {
        $this->actingAs($this->cashier);

        // Assert user model always reports as cashier and never admin
        $this->assertTrue($this->cashier->isCashier());
        $this->assertFalse($this->cashier->isAdmin());
        $this->assertFalse($this->cashier->isSuperAdmin());
        $this->assertEquals('cashier', $this->cashier->role);

        // Attempt direct access to Admin-only web routes -> must redirect to /pos
        $adminRoutes = [
            '/dashboard',
            '/analytics/cashier-performance',
            '/analytics/sales-forecast',
            '/analytics/forecast-benchmarking',
            '/analytics/restock-suggestions',
            '/suppliers',
            '/employees',
            '/admin/sales-data',
            '/admin/addons',
        ];

        foreach ($adminRoutes as $route) {
            $res = $this->get($route);
            $res->assertRedirect('/pos');
        }

        // Attempt Admin-only mutations -> must receive 403 Forbidden
        $adminMutationEndpoints = [
            ['post', '/suppliers', ['name' => 'Test Supplier']],
            ['post', '/employees', ['name' => 'Test Employee', 'email' => 'e@test.com']],
            ['post', '/branches', ['name' => 'Test Branch', 'delivery_radius_km' => 10, 'base_delivery_fee' => 49]],
            ['post', '/admin/addons', ['name' => 'Test Addon']],
        ];

        foreach ($adminMutationEndpoints as [$method, $endpoint, $payload]) {
            $res = $this->{$method . 'Json'}($endpoint, $payload);
            $res->assertStatus(403);
        }
    }

    /**
     * Regression Test: Account switching from Admin to Cashier isolates role and forbids Admin pages.
     */
    public function test_account_switch_from_admin_to_cashier_strictly_retains_cashier_permissions(): void
    {
        // 1. Admin logs in and accesses dashboard
        $this->actingAs($this->admin);
        $resAdmin = $this->get('/dashboard');
        $resAdmin->assertStatus(200);

        // 2. Admin logs out
        $logoutRes = $this->post('/logout');
        $logoutRes->assertRedirect('/');
        $this->assertGuest();

        // 3. Cashier logs in
        $loginRes = $this->post('/login', [
            'email' => $this->cashier->email,
            'password' => 'Password123!',
        ]);
        $this->assertAuthenticatedAs($this->cashier);
        $loginRes->assertRedirect('/pos');

        // 4. Cashier attempting to visit previous Admin dashboard must be redirected to /pos
        $dashAttempt = $this->get('/dashboard');
        $dashAttempt->assertRedirect('/pos');
        $this->assertEquals('cashier', auth()->user()->role);
    }

    /**
     * Regression Test: Mixed-case or un-trimmed role strings are normalized and cannot elevate privileges.
     */
    public function test_mixed_case_role_normalization_prevents_privilege_escalation(): void
    {
        $weirdUser = User::create([
            'name' => 'Weird Cashier',
            'email' => 'weird.cashier@makidesu.com',
            'password' => Hash::make('Password123!'),
            'role' => '  CASHIER  ',
            'account_status' => 'active',
            'must_change_password' => false,
            'email_verified_at' => now(),
            'branch_id' => $this->branch->id,
        ]);

        $this->assertEquals('cashier', $weirdUser->role);
        $this->assertTrue($weirdUser->isCashier());
        $this->assertFalse($weirdUser->isAdmin());

        $res = $this->actingAs($weirdUser)->get('/dashboard');
        $res->assertRedirect('/pos');
    }
}
