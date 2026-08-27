<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Rider;
use App\Models\Branch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserProfileTest extends TestCase
{
    use RefreshDatabase;

    public User $testCustomer;
    public Branch $testBranch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'                => 'Victoria Branch',
            'code'                => 'VIC',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.229371,
            'longitude'           => 121.328383,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'is_active'           => true,
        ]);

        $this->testCustomer = User::create([
            'name'          => 'Maria Santos',
            'first_name'    => 'Maria',
            'last_name'     => 'Santos',
            'email'         => 'maria@example.com',
            'mobile_number' => '09123456789',
            'password'      => Hash::make('password123'),
            'role'          => User::ROLE_CUSTOMER,
            'branch_id'     => $this->testBranch->id,
        ]);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->getJson('/api/v1/user');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Maria Santos')
            ->assertJsonPath('data.email', 'maria@example.com')
            ->assertJsonPath('data.mobile_number', '09123456789')
            ->assertJsonPath('data.phone', '09123456789');
    }

    public function test_unauthenticated_user_cannot_fetch_profile(): void
    {
        $response = $this->getJson('/api/v1/user');
        $response->assertUnauthorized();
    }

    public function test_user_can_update_name_via_patch(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user', [
            'name' => 'Maria Clara',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Maria Clara');

        $this->assertDatabaseHas('users', [
            'id'   => $this->testCustomer->id,
            'name' => 'Maria Clara',
        ]);
    }

    public function test_user_can_update_phone_via_patch(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user', [
            'phone' => '09987654321',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.mobile_number', '09987654321')
            ->assertJsonPath('data.phone', '09987654321');

        $this->assertDatabaseHas('users', [
            'id'            => $this->testCustomer->id,
            'mobile_number' => '09987654321',
        ]);
    }

    public function test_user_can_update_name_and_phone_together(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user', [
            'first_name'    => 'Juana',
            'last_name'     => 'Dela Cruz',
            'mobile_number' => '09112223333',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Juana Dela Cruz')
            ->assertJsonPath('data.mobile_number', '09112223333');

        $this->assertDatabaseHas('users', [
            'id'            => $this->testCustomer->id,
            'first_name'    => 'Juana',
            'last_name'     => 'Dela Cruz',
            'name'          => 'Juana Dela Cruz',
            'mobile_number' => '09112223333',
        ]);
    }

    public function test_user_can_update_profile_via_post(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->postJson('/api/v1/user', [
            'name'  => 'Maria Updated',
            'phone' => '09223334444',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Maria Updated')
            ->assertJsonPath('data.phone', '09223334444');
    }

    public function test_password_update_fails_with_wrong_current_password(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user/password', [
            'current_password'      => 'wrongpassword',
            'password'              => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['current_password']]);

        // Password must NOT have changed
        $this->assertTrue(Hash::check('password123', $this->testCustomer->fresh()->password));
    }

    public function test_password_update_fails_with_mismatched_confirmation(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user/password', [
            'current_password'      => 'password123',
            'password'              => 'newpassword123',
            'password_confirmation' => 'differentpassword',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['errors' => ['password']]);

        $this->assertTrue(Hash::check('password123', $this->testCustomer->fresh()->password));
    }

    public function test_password_update_succeeds_with_valid_credentials(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->patchJson('/api/v1/user/password', [
            'current_password'      => 'password123',
            'password'              => 'newsecret456',
            'password_confirmation' => 'newsecret456',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Verify new password is valid
        $this->assertTrue(Hash::check('newsecret456', $this->testCustomer->fresh()->password));
        $this->assertFalse(Hash::check('password123', $this->testCustomer->fresh()->password));
    }

    public function test_password_update_via_post_also_works(): void
    {
        Sanctum::actingAs($this->testCustomer);

        $response = $this->postJson('/api/v1/user/password', [
            'current_password'      => 'password123',
            'password'              => 'newsecret789',
            'password_confirmation' => 'newsecret789',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $this->assertTrue(Hash::check('newsecret789', $this->testCustomer->fresh()->password));
    }

    public function test_rider_can_update_profile_via_patch(): void
    {
        $rider = Rider::create([
            'branch_id' => $this->testBranch->id,
            'name'      => 'Rider Juan',
            'phone'     => '09555555555',
            'email'     => 'riderjuan@example.com',
            'password'  => Hash::make('password123'),
            'status'    => 'available',
        ]);

        Sanctum::actingAs($rider);

        $response = $this->patchJson('/api/v1/user', [
            'name'  => 'Rider Juan Updated',
            'phone' => '09666666666',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Rider Juan Updated')
            ->assertJsonPath('data.phone', '09666666666');

        $this->assertDatabaseHas('riders', [
            'id'    => $rider->id,
            'name'  => 'Rider Juan Updated',
            'phone' => '09666666666',
        ]);
    }

    public function test_unauthenticated_api_request_returns_json_401(): void
    {
        $response = $this->get('/api/v1/user', ['Accept' => 'application/json']);

        $response->assertStatus(401)
            ->assertJson([
                'status'  => 'error',
                'success' => false,
                'message' => 'Unauthenticated.',
            ]);
    }

    public function test_invalid_api_route_returns_json_404(): void
    {
        $response = $this->get('/api/v1/non-existent-endpoint', ['Accept' => 'application/json']);

        $response->assertStatus(404)
            ->assertJson([
                'status'  => 'error',
                'success' => false,
            ]);
    }
}
