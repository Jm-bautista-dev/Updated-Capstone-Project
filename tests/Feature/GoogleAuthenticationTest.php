<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected string $webClientId = '817393512526-i3p0lcoqkh616826c6flr9mt2u06a4ij.apps.googleusercontent.com';
    protected string $iosClientId = '463425689467-vabq08tcesgjjjbaq222tk95rvrjd6ge.apps.googleusercontent.com';

    public function test_google_auth_validation_fails_without_id_token(): void
    {
        $response = $this->postJson('/api/v1/auth/google', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_token']);
    }

    public function test_google_auth_fails_when_google_rejects_token(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'error'             => 'invalid_token',
                'error_description' => 'Invalid Value',
            ], 400),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'invalid_google_jwt_token',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid or expired Google authorization token.',
            ]);
    }

    public function test_google_auth_fails_when_token_is_expired(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => $this->webClientId,
                'sub'            => '109876543210987654321',
                'email'          => 'expired.user@example.com',
                'email_verified' => 'true',
                'name'           => 'Expired User',
                'exp'            => time() - 3600, // Expired 1 hour ago
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'expired_google_jwt_token',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid or expired Google authorization token.',
            ]);
    }

    public function test_google_auth_fails_when_audience_is_unauthorized(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => 'unauthorized-client-id.apps.googleusercontent.com',
                'sub'            => '109876543210987654321',
                'email'          => 'hacker@example.com',
                'email_verified' => 'true',
                'name'           => 'Hacker User',
                'exp'            => time() + 3600,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'unauthorized_audience_token',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'success' => false,
                'message' => 'Invalid or expired Google authorization token.',
            ]);
    }

    public function test_google_auth_creates_new_customer_and_returns_expected_structure(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => $this->webClientId,
                'sub'            => '112233445566778899001',
                'email'          => 'juan.delacruz@example.com',
                'email_verified' => 'true',
                'given_name'     => 'Juan',
                'family_name'    => 'Dela Cruz',
                'name'           => 'Juan Dela Cruz',
                'picture'        => 'https://lh3.googleusercontent.com/a/photo-url',
                'exp'            => time() + 3600,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'valid_web_client_token',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Google authentication successful.',
                'data'    => [
                    'user' => [
                        'first_name'         => 'Juan',
                        'last_name'          => 'Dela Cruz',
                        'name'               => 'Juan Dela Cruz',
                        'email'              => 'juan.delacruz@example.com',
                        'mobile_number'      => '',
                        'role'               => 'customer',
                        'avatar_id'          => 1,
                        'profile_photo_path' => 'https://lh3.googleusercontent.com/a/photo-url',
                        'account_status'     => 'active',
                        'is_active'          => true,
                    ],
                ],
            ])
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'user' => [
                        'id',
                        'first_name',
                        'last_name',
                        'name',
                        'email',
                        'mobile_number',
                        'role',
                        'avatar_id',
                        'profile_photo_path',
                        'account_status',
                        'is_active',
                    ],
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email'          => 'juan.delacruz@example.com',
            'first_name'     => 'Juan',
            'last_name'      => 'Dela Cruz',
            'google_id'      => '112233445566778899001',
            'role'           => 'customer',
            'account_status' => 'active',
        ]);

        $createdUser = User::where('email', 'juan.delacruz@example.com')->first();
        $this->assertNotNull($createdUser);
        $this->assertNotNull($createdUser->email_verified_at);
        $this->assertFalse(Hash::check('MakiGooglePass123!', $createdUser->password));
    }

    public function test_google_auth_logs_in_existing_customer_with_ios_client(): void
    {
        $existing = User::create([
            'first_name'         => 'Maria',
            'last_name'          => 'Clara',
            'name'               => 'Maria Clara',
            'email'              => 'maria.clara@example.com',
            'mobile_number'      => '09123456789',
            'password'           => Hash::make('securepassword123'),
            'role'               => User::ROLE_CUSTOMER,
            'account_status'     => 'active',
            'is_active'          => true,
            'avatar_id'          => 2,
            'profile_photo_path' => null,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => $this->iosClientId,
                'sub'            => '223344556677889900112',
                'email'          => 'maria.clara@example.com',
                'email_verified' => 'true',
                'given_name'     => 'Maria',
                'family_name'    => 'Clara',
                'name'           => 'Maria Clara',
                'picture'        => 'https://lh3.googleusercontent.com/a/maria-photo',
                'exp'            => time() + 3600,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'valid_ios_token',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Google authentication successful.',
                'data'    => [
                    'user' => [
                        'id'                 => $existing->id,
                        'first_name'         => 'Maria',
                        'last_name'          => 'Clara',
                        'name'               => 'Maria Clara',
                        'email'              => 'maria.clara@example.com',
                        'mobile_number'      => '09123456789',
                        'role'               => 'customer',
                        'avatar_id'          => 2,
                        'profile_photo_path' => 'https://lh3.googleusercontent.com/a/maria-photo',
                        'account_status'     => 'active',
                        'is_active'          => true,
                    ],
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'id'        => $existing->id,
            'google_id' => '223344556677889900112',
        ]);
    }

    public function test_google_auth_rejects_restricted_or_deactivated_customer(): void
    {
        User::create([
            'first_name'          => 'Restricted',
            'last_name'           => 'User',
            'name'                => 'Restricted User',
            'email'               => 'restricted.customer@example.com',
            'mobile_number'       => '09111222333',
            'password'            => Hash::make('password123'),
            'role'                => User::ROLE_CUSTOMER,
            'account_status'      => 'restricted',
            'is_order_restricted' => true,
            'is_active'           => true,
        ]);

        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => $this->webClientId,
                'sub'            => '334455667788990011223',
                'email'          => 'restricted.customer@example.com',
                'email_verified' => 'true',
                'name'           => 'Restricted User',
                'exp'            => time() + 3600,
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/google', [
            'id_token' => 'restricted_user_token',
        ]);

        $response->assertStatus(403)
            ->assertJson([
                'code'    => 'ACCOUNT_RESTRICTED',
                'message' => 'Your account has been restricted. Please contact support.',
            ]);
    }

    public function test_google_auth_works_on_root_endpoint_alias(): void
    {
        Http::fake([
            'https://oauth2.googleapis.com/tokeninfo*' => Http::response([
                'aud'            => $this->webClientId,
                'sub'            => '445566778899001122334',
                'email'          => 'alias.test@example.com',
                'email_verified' => 'true',
                'given_name'     => 'Alias',
                'family_name'    => 'User',
                'name'           => 'Alias User',
                'exp'            => time() + 3600,
            ], 200),
        ]);

        $response = $this->postJson('/api/auth/google', [
            'id_token' => 'alias_token',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Google authentication successful.',
                'data'    => [
                    'user' => [
                        'email' => 'alias.test@example.com',
                    ],
                ],
            ]);
    }
}
