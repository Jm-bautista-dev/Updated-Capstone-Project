<?php

namespace Tests\Feature;

use App\Models\EmailVerification;
use App\Models\PendingRegistration;
use App\Models\PhoneVerification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PhoneVerificationFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.iprog_sms.api_token'           => 'mock-iprog-test-token-12345',
            'services.iprog_sms.base_url'            => 'https://www.iprogsms.com/api/v1',
            'services.iprog_sms.timeout'             => 5,
            'services.iprog_sms.resend_cooldown_sec' => 60,
            'services.iprog_sms.max_attempts'        => 5,
        ]);
    }

    /**
     * 1. Valid phone number and successful real-flow state transitions.
     */
    public function test_customer_registration_initiates_pending_registration_and_sends_iprog_otp(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response([
                'status'  => 'success',
                'message' => 'OTP sent successfully',
                'data'    => [
                    'otp_code'            => '847291', // Sensitive provider field
                    'otp_code_expires_at' => now()->addMinutes(5)->toISOString(),
                    'phone_number'        => '09171234567',
                ]
            ], 200),
        ]);

        $payload = [
            'first_name'          => 'Juan',
            'last_name'           => 'Dela Cruz',
            'mobile_number'       => '+63 917 123 4567', // International format
            'email'               => 'juan@example.com',
            'password'            => 'SecretPassword123!',
            'verification_method' => 'phone',
        ];

        $response = $this->postJson('/api/v1/register', $payload);

        $response->assertStatus(200)
            ->assertJson([
                'success'             => true,
                'status'              => 'pending_verification',
                'verification_method' => 'phone',
                'phone_number'        => '09171234567',
                'masked_phone'        => '+63 917 *** 4567',
                'resend_cooldown'     => 60,
            ]);

        $data = $response->json();
        $this->assertNotEmpty($data['registration_token']);

        // CRITICAL SECURITY ASSERTION: Provider OTP and Token must NEVER be exposed
        $this->assertArrayNotHasKey('otp_code', $data);
        $this->assertArrayNotHasKey('api_token', $data);
        $this->assertStringNotContainsString('847291', $response->getContent());
        $this->assertStringNotContainsString('mock-iprog-test-token', $response->getContent());

        // Assert pending registration record exists with hashed password
        $this->assertDatabaseHas('pending_registrations', [
            'email'         => 'juan@example.com',
            'mobile_number' => '09171234567',
            'status'        => PendingRegistration::STATUS_PENDING,
        ]);

        $pending = PendingRegistration::where('email', 'juan@example.com')->first();
        $this->assertTrue(Hash::check('SecretPassword123!', $pending->password));
        $this->assertNotEquals('SecretPassword123!', $pending->password);

        // Assert user has NOT been created in users table yet (no premature access)
        $this->assertDatabaseMissing('users', [
            'email' => 'juan@example.com',
        ]);
    }

    /**
     * 2. Successful verification creates user, marks phone verified (not email), and issues Sanctum token.
     */
    public function test_successful_otp_verification_creates_user_with_verified_phone_and_issues_token(): void
    {
        $pending = PendingRegistration::create([
            'registration_token'    => 'valid-test-token-abcdef123456',
            'first_name'            => 'Maria',
            'last_name'             => 'Santos',
            'name'                  => 'Maria Santos',
            'email'                 => 'maria@example.com',
            'mobile_number'         => '09181234567',
            'password'              => Hash::make('MariaPass789!'),
            'verification_method'   => 'phone',
            'status'                => PendingRegistration::STATUS_PENDING,
            'verification_attempts' => 0,
            'resend_count'          => 1,
            'last_sent_at'          => now()->subMinute(),
            'expires_at'            => now()->addMinutes(10),
        ]);

        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/verify_otp' => Http::response([
                'status'  => 'success',
                'message' => 'OTP verified successfully'
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'registration_token' => 'valid-test-token-abcdef123456',
            'otp'                => '359557',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status'  => 'success',
                'user'    => [
                    'email'          => 'maria@example.com',
                    'mobile_number'  => '09181234567',
                    'phone_verified' => true,
                    'email_verified' => false,
                ]
            ]);

        $this->assertNotEmpty($response->json('token'));

        // Assert user exists in database
        $user = User::where('email', 'maria@example.com')->first();
        $this->assertNotNull($user);
        $this->assertNotNull($user->phone_verified_at);
        $this->assertNull($user->email_verified_at); // Strict: phone verification does NOT mark email verified
        $this->assertEquals('09181234567', $user->mobile_number);
        $this->assertEquals(User::ROLE_CUSTOMER, $user->role);

        // Assert pending registration is marked completed
        $this->assertEquals(PendingRegistration::STATUS_COMPLETED, $pending->fresh()->status);

        // Assert newly issued Sanctum token allows accessing protected route
        $authResponse = $this->withHeader('Authorization', 'Bearer ' . $response->json('token'))
            ->getJson('/api/v1/user');
        $authResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'maria@example.com');
    }

    /**
     * 3. Incorrect OTP rejects and increments failed attempt counter.
     */
    public function test_incorrect_otp_fails_and_increments_attempts(): void
    {
        $pending = PendingRegistration::create([
            'registration_token'    => 'pending-attempt-token',
            'first_name'            => 'Pedro',
            'last_name'             => 'Penduko',
            'email'                 => 'pedro@example.com',
            'mobile_number'         => '09191234567',
            'password'              => Hash::make('password123'),
            'verification_method'   => 'phone',
            'status'                => PendingRegistration::STATUS_PENDING,
            'verification_attempts' => 1,
            'expires_at'            => now()->addMinutes(10),
        ]);

        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/verify_otp' => Http::response([
                'status'  => 'error',
                'message' => 'Invalid OTP'
            ], 400),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'registration_token' => 'pending-attempt-token',
            'otp'                => '000000',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);

        $this->assertEquals(2, $pending->fresh()->verification_attempts);
        $this->assertDatabaseMissing('users', ['email' => 'pedro@example.com']);
    }

    /**
     * 4. Lockout after maximum failed attempts.
     */
    public function test_verification_locked_out_after_max_attempts(): void
    {
        PendingRegistration::create([
            'registration_token'    => 'locked-out-token',
            'first_name'            => 'Lock',
            'last_name'             => 'Out',
            'email'                 => 'lockout@example.com',
            'mobile_number'         => '09201234567',
            'password'              => Hash::make('password123'),
            'verification_method'   => 'phone',
            'status'                => PendingRegistration::STATUS_PENDING,
            'verification_attempts' => 5, // At max limit
            'expires_at'            => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'registration_token' => 'locked-out-token',
            'otp'                => '123456',
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);
    }

    /**
     * 5. Resend cooldown enforced (60 seconds).
     */
    public function test_resend_cooldown_enforced(): void
    {
        $pending = PendingRegistration::create([
            'registration_token'    => 'cooldown-token',
            'first_name'            => 'Cool',
            'last_name'             => 'Down',
            'email'                 => 'cooldown@example.com',
            'mobile_number'         => '09211234567',
            'password'              => Hash::make('password123'),
            'verification_method'   => 'phone',
            'status'                => PendingRegistration::STATUS_PENDING,
            'resend_count'          => 1,
            'last_sent_at'          => now()->subSeconds(20), // Only 20s ago
            'expires_at'            => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/send-otp', [
            'registration_token' => 'cooldown-token',
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);

        $this->assertArrayHasKey('resend_cooldown', $response->json());
    }

    /**
     * 6. Expired registration session rejected.
     */
    public function test_expired_registration_session_rejected(): void
    {
        PendingRegistration::create([
            'registration_token'  => 'expired-token',
            'first_name'          => 'Old',
            'last_name'           => 'Session',
            'email'               => 'old@example.com',
            'mobile_number'       => '09221234567',
            'password'            => Hash::make('password123'),
            'verification_method' => 'phone',
            'status'              => PendingRegistration::STATUS_PENDING,
            'expires_at'          => now()->subMinute(), // Expired
        ]);

        $response = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'registration_token' => 'expired-token',
            'otp'                => '123456',
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);
    }

    /**
     * 7. Duplicate phone ownership prevented against registered accounts.
     */
    public function test_duplicate_phone_number_conflict_blocked(): void
    {
        User::factory()->create([
            'mobile_number' => '09231234567',
            'email'         => 'existing.user@example.com',
        ]);

        $response = $this->postJson('/api/v1/register', [
            'first_name'          => 'Copy',
            'last_name'           => 'Cat',
            'mobile_number'       => '09231234567', // Same number
            'email'               => 'new.unique@example.com',
            'password'            => 'password123',
            'verification_method' => 'phone',
        ]);

        $response->assertStatus(409)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);
    }

    /**
     * 8. Provider send failure and timeout handled safely.
     */
    public function test_provider_send_failure_handled_safely(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response([
                'status'  => 'error',
                'message' => 'Insufficient SMS credits'
            ], 402),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/send-otp', [
            'phone_number' => '09241234567',
        ]);

        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);
    }

    /**
     * 9. Verification replay is idempotent and prevents duplicate account creations.
     */
    public function test_verification_replay_is_idempotent(): void
    {
        $user = User::factory()->create([
            'email'             => 'replay@example.com',
            'mobile_number'     => '09251234567',
            'phone_verified_at' => now(),
        ]);

        PendingRegistration::create([
            'registration_token'  => 'replay-token-123',
            'first_name'          => 'Replay',
            'last_name'           => 'Test',
            'email'               => 'replay@example.com',
            'mobile_number'       => '09251234567',
            'password'            => $user->password,
            'verification_method' => 'phone',
            'status'              => PendingRegistration::STATUS_COMPLETED,
            'expires_at'          => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'registration_token' => 'replay-token-123',
            'otp'                => '123456',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status'  => 'success',
            ]);

        // Verify only 1 record exists in users
        $this->assertEquals(1, User::where('email', 'replay@example.com')->count());
    }

    /**
     * 10. Standalone pre-registration phone verification flow.
     */
    public function test_pre_registration_standalone_phone_verification_flow(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp'   => Http::response(['status' => 'success', 'message' => 'OTP sent'], 200),
            'https://www.iprogsms.com/api/v1/otp/verify_otp' => Http::response(['status' => 'success', 'message' => 'Verified'], 200),
        ]);

        // Step 1: Send OTP to standalone phone
        $sendRes = $this->postJson('/api/v1/auth/phone/send-otp', [
            'phone_number' => '09261234567',
        ]);
        $sendRes->assertStatus(200)->assertJson(['success' => true]);

        // Step 2: Verify OTP
        $verifyRes = $this->postJson('/api/v1/auth/phone/verify-otp', [
            'phone_number' => '09261234567',
            'otp'          => '654321',
        ]);
        $verifyRes->assertStatus(200)->assertJson(['success' => true, 'is_verified' => true]);

        // Step 3: Register customer with pre-verified phone
        $regRes = $this->postJson('/api/v1/register', [
            'first_name'    => 'Pre',
            'last_name'     => 'Verified',
            'mobile_number' => '09261234567',
            'email'         => 'preverified@example.com',
            'password'      => 'Password789!',
        ]);

        $regRes->assertStatus(201)
            ->assertJson([
                'success' => true,
                'user'    => [
                    'email'          => 'preverified@example.com',
                    'phone_verified' => true,
                ]
            ]);

        $user = User::where('email', 'preverified@example.com')->first();
        $this->assertNotNull($user->phone_verified_at);
        $this->assertNull($user->email_verified_at);
    }

    /**
     * 11. Existing email verification flow regression check.
     */
    public function test_existing_email_verification_flow_preserved(): void
    {
        EmailVerification::create([
            'email'       => 'emailverified@example.com',
            'otp'         => '123456',
            'expires_at'  => now()->addMinutes(5),
            'is_verified' => true,
        ]);

        $response = $this->postJson('/api/v1/register', [
            'first_name'          => 'Email',
            'last_name'           => 'Only',
            'mobile_number'       => '09271234567',
            'email'               => 'emailverified@example.com',
            'password'            => 'EmailPass123!',
            'verification_method' => 'email',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'user'    => [
                    'email'          => 'emailverified@example.com',
                    'email_verified' => true,
                    'phone_verified' => false, // Phone not verified when email verified
                ]
            ]);

        $user = User::where('email', 'emailverified@example.com')->first();
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->phone_verified_at);
    }

    /**
     * 12. Authenticated user can verify phone number on profile.
     */
    public function test_authenticated_user_can_verify_phone_number(): void
    {
        $user = User::factory()->create([
            'mobile_number'     => null,
            'phone_verified_at' => null,
        ]);

        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp'   => Http::response(['status' => 'success', 'message' => 'OTP sent'], 200),
            'https://www.iprogsms.com/api/v1/otp/verify_otp' => Http::response(['status' => 'success', 'message' => 'Verified'], 200),
        ]);

        $sendRes = $this->actingAs($user)->postJson('/api/v1/user/phone/send-otp', [
            'phone_number' => '09281234567',
        ]);
        $sendRes->assertStatus(200);

        $verifyRes = $this->actingAs($user)->postJson('/api/v1/user/phone/verify-otp', [
            'phone_number' => '09281234567',
            'otp'          => '112233',
        ]);
        $verifyRes->assertStatus(200);

        $user->refresh();
        $this->assertEquals('09281234567', $user->mobile_number);
        $this->assertNotNull($user->phone_verified_at);
    }

    /**
     * 13. Provider connection timeout handled gracefully.
     */
    public function test_provider_connection_timeout_handled_gracefully(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
            },
        ]);

        $response = $this->postJson('/api/v1/auth/phone/send-otp', [
            'phone_number' => '09291234567',
        ]);

        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);
    }

    /**
     * 14. Interrupted registration recovery allows updating details before OTP verification.
     */
    public function test_interrupted_registration_recovery_updates_pending_state(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        // First attempt
        $res1 = $this->postJson('/api/v1/register', [
            'first_name'          => 'Initial',
            'last_name'           => 'Name',
            'mobile_number'       => '09301234567',
            'email'               => 'interrupted@example.com',
            'password'            => 'InitialPass1!',
            'verification_method' => 'phone',
        ]);
        $res1->assertStatus(200);

        // Advance time past the 60s cooldown (customer returns after interrupted session)
        $this->travel(65)->seconds();

        // App closed and customer comes back with corrected last name and new password
        $res2 = $this->postJson('/api/v1/register', [
            'first_name'          => 'Initial',
            'last_name'           => 'UpdatedName',
            'mobile_number'       => '09301234567',
            'email'               => 'interrupted@example.com',
            'password'            => 'CorrectedPass2!',
            'verification_method' => 'phone',
        ]);
        $res2->assertStatus(200);

        // Assert only ONE pending registration exists and has the updated info
        $this->assertEquals(1, PendingRegistration::where('email', 'interrupted@example.com')->count());
        $pending = PendingRegistration::where('email', 'interrupted@example.com')->first();
        $this->assertEquals('UpdatedName', $pending->last_name);
        $this->assertTrue(Hash::check('CorrectedPass2!', $pending->password));
    }

    /**
     * 15. Philippine phone numbers in various formats are normalized consistently.
     */
    public function test_phone_number_formats_normalized_consistently(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        $formats = [
            ['input' => '09311234561',     'expected' => '09311234561'],
            ['input' => '+63 931 123 4562', 'expected' => '09311234562'],
            ['input' => '639311234563',    'expected' => '09311234563'],
            ['input' => '0931-123-4564',   'expected' => '09311234564'],
        ];

        foreach ($formats as $item) {
            $response = $this->postJson('/api/v1/auth/phone/send-otp', [
                'phone_number' => $item['input'],
            ]);

            $response->assertStatus(200)
                ->assertJson([
                    'success'      => true,
                    'phone_number' => $item['expected'],
                ]);
        }
    }

    /**
     * 16. Newly registered and verified customer can login via /api/v1/login normally.
     */
    public function test_registered_and_verified_customer_can_login_via_password(): void
    {
        $user = User::create([
            'first_name'        => 'Login',
            'last_name'         => 'Customer',
            'name'              => 'Login Customer',
            'email'             => 'logincustomer@example.com',
            'mobile_number'     => '09321234567',
            'password'          => Hash::make('LoginSecretPass1!'),
            'role'              => User::ROLE_CUSTOMER,
            'phone_verified_at' => now(),
            'account_status'    => User::STATUS_ACTIVE,
        ]);

        $loginRes = $this->postJson('/api/v1/login', [
            'email'    => 'logincustomer@example.com',
            'password' => 'LoginSecretPass1!',
        ]);

        $loginRes->assertStatus(200)
            ->assertJson([
                'status'  => 'success',
                'message' => 'Login successful.',
            ]);

        $this->assertNotEmpty($loginRes->json('token'));
    }

    /**
     * 17. Concurrent sends to the same phone number are blocked by the atomic concurrency lock.
     */
    public function test_concurrent_sends_blocked_by_atomic_concurrency_lock(): void
    {
        $antiSpam = app(\App\Services\SmsAntiSpamService::class);
        $phone = '09351234567';

        // Simulate another request having acquired the lock
        $acquired = $antiSpam->acquireConcurrencyLock($phone, 15);
        $this->assertTrue($acquired);

        // Immediate second request arrives concurrently
        $response = $this->postJson('/api/v1/auth/phone/send-otp', [
            'phone_number' => $phone,
        ]);

        $response->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'busy',
            ]);

        $this->assertEquals('5', $response->headers->get('Retry-After'));

        // Release lock
        $antiSpam->releaseConcurrencyLock($phone);
    }

    /**
     * 18. Hourly send limit (max 3/hour) is enforced with 429 and Retry-After.
     */
    public function test_hourly_send_limit_enforced(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        $phone = '09361234567';

        // 1st Send
        $res1 = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone]);
        $res1->assertStatus(200);

        // Advance 61 seconds (past cooldown)
        $this->travel(61)->seconds();

        // 2nd Send
        $res2 = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone]);
        $res2->assertStatus(200);

        // Advance 61 seconds
        $this->travel(61)->seconds();

        // 3rd Send (reaches max 3 per hour)
        $res3 = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone]);
        $res3->assertStatus(200);

        // Advance 61 seconds (cooldown has passed, but hourly cap of 3 is active)
        $this->travel(61)->seconds();

        // 4th Send should be rejected by hourly rate limit
        $res4 = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone]);
        $res4->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
                'code'    => 'hourly_limit_exceeded',
            ]);

        $this->assertNotNull($res4->headers->get('Retry-After'));
    }

    /**
     * 19. Daily send limit (max 5/day) is enforced with 429 and Retry-After.
     */
    public function test_daily_send_limit_enforced(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        config([
            'services.iprog_sms.max_send_per_hour' => 10, // Allow more for testing daily limit specifically
            'services.iprog_sms.max_send_per_day'  => 3,
        ]);

        $phone = '09371234567';

        // 1st Send
        $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone])->assertStatus(200);
        $this->travel(61)->seconds();

        // 2nd Send
        $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone])->assertStatus(200);
        $this->travel(61)->seconds();

        // 3rd Send (hits daily limit of 3)
        $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone])->assertStatus(200);
        $this->travel(61)->seconds();

        // 4th Send should be blocked by daily limit
        $res4 = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => $phone]);
        $res4->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
                'code'    => 'daily_limit_exceeded',
            ]);
    }

    /**
     * 20. Global daily SMS spending cap prevents provider dispatch when reached.
     */
    public function test_global_daily_spending_cap_protects_budget(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        config([
            'services.iprog_sms.daily_global_send_cap' => 2, // Set low cap for testing
        ]);

        // Send 1 for phone A
        $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09381111111'])->assertStatus(200);

        // Send 2 for phone B (cap reached: 2/2)
        $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09382222222'])->assertStatus(200);

        // Send 3 for phone C should be blocked by global daily cap
        $res = $this->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09383333333']);
        $res->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
                'code'    => 'global_cap_reached',
            ]);

        // Verify provider was only called twice, not 3 times!
        Http::assertSentCount(2);
    }

    /**
     * 21. Per-IP hourly limit prevents bulk network enumeration.
     */
    public function test_per_ip_hourly_limit_enforced(): void
    {
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => Http::response(['status' => 'success', 'message' => 'Sent'], 200),
        ]);

        config([
            'services.iprog_sms.max_ip_send_per_hour' => 2,
        ]);

        // Request 1 from 192.168.1.100
        $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09391111111'])
            ->assertStatus(200);

        // Request 2 from 192.168.1.100 with different phone
        $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09392222222'])
            ->assertStatus(200);

        // Request 3 from same IP should be blocked by IP rate limit
        $res3 = $this->withServerVariables(['REMOTE_ADDR' => '192.168.1.100'])
            ->postJson('/api/v1/auth/phone/send-otp', ['phone_number' => '09393333333']);

        $res3->assertStatus(429)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
                'code'    => 'ip_limit_exceeded',
            ]);
    }

    /**
     * 22. Status endpoint allows mobile app to check and resume pending registration.
     */
    public function test_status_endpoint_returns_pending_verification_details(): void
    {
        $pending = PendingRegistration::create([
            'registration_token'    => 'resume-test-token-xyz',
            'first_name'            => 'Alex',
            'last_name'             => 'Rivera',
            'email'                 => 'alex@example.com',
            'mobile_number'         => '09401234567',
            'password'              => Hash::make('SecretPass1!'),
            'verification_method'   => 'phone',
            'status'                => PendingRegistration::STATUS_PENDING,
            'verification_attempts' => 1,
            'resend_count'          => 1,
            'last_sent_at'          => now()->subSeconds(45),
            'expires_at'            => now()->addMinutes(12),
        ]);

        $response = $this->getJson('/api/v1/auth/phone/status?registration_token=resume-test-token-xyz');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status'  => 'pending',
                'data'    => [
                    'registration_token' => 'resume-test-token-xyz',
                    'phone_number'       => '09401234567',
                    'masked_phone'       => '+63 940 *** 4567',
                    'is_pending'         => true,
                    'is_completed'       => false,
                    'is_expired'         => false,
                    'is_locked_out'      => false,
                    'attempts_remaining' => 4,
                ]
            ]);

        $data = $response->json('data');
        $this->assertGreaterThan(0, $data['expires_in_seconds']);
        $this->assertGreaterThan(0, $data['resend_cooldown_remaining']);
    }

    /**
     * 23. Provider ambiguous timeout does not auto-retry.
     */
    public function test_provider_ambiguous_timeout_does_not_auto_retry(): void
    {
        $callCount = 0;
        Http::fake([
            'https://www.iprogsms.com/api/v1/otp/send_otp' => function () use (&$callCount) {
                $callCount++;
                throw new \Illuminate\Http\Client\ConnectionException('cURL error 28: Operation timed out');
            },
        ]);

        $response = $this->postJson('/api/v1/auth/phone/send-otp', [
            'phone_number' => '09411234567',
        ]);

        $response->assertStatus(502)
            ->assertJson([
                'success' => false,
                'status'  => 'error',
            ]);

        // CRITICAL REQUIREMENT: Exactly 1 dispatch attempt — No automatic re-send on ambiguous timeout
        $this->assertEquals(1, $callCount);
    }
}

