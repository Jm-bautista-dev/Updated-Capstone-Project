<?php

namespace Tests\Feature;

use App\Mail\DeleteAccountOtpMail;
use App\Models\Branch;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountDeletionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public $user;
    public $branch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Main Branch',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'email' => 'customer@example.com',
            'role' => 'customer',
            'branch_id' => $this->branch->id,
        ]);
    }

    public function test_request_delete_otp_is_blocked_when_active_orders_exist(): void
    {
        Mail::fake();
        Sanctum::actingAs($this->user);

        // Create an active order
        Order::create([
            'order_number' => 'ORD-1001',
            'user_id' => $this->user->id,
            'branch_id' => $this->branch->id,
            'status' => 'preparing',
            'total_amount' => 250.00,
            'fulfillment_type' => 'pickup',
            'order_source' => 'mobile_app',
            'customer_name' => 'Test Customer',
            'contact_number' => '09123456789',
        ]);

        $response = $this->postJson('/api/v1/user/delete-otp');

        $response->assertStatus(422)
            ->assertJson([
                'status' => 'error',
            ]);

        $this->assertStringContainsString('cannot delete your account while you have active orders', strtolower($response->json('message')));
        Mail::assertNothingSent();
    }

    public function test_request_delete_otp_succeeds_when_no_active_orders(): void
    {
        Mail::fake();
        Sanctum::actingAs($this->user);

        // Only completed orders
        Order::create([
            'order_number' => 'ORD-1000',
            'user_id' => $this->user->id,
            'branch_id' => $this->branch->id,
            'status' => 'completed',
            'total_amount' => 150.00,
            'fulfillment_type' => 'pickup',
            'order_source' => 'mobile_app',
            'customer_name' => 'Test Customer',
            'contact_number' => '09123456789',
        ]);

        $response = $this->postJson('/api/v1/user/delete-otp');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        Mail::assertSent(DeleteAccountOtpMail::class, function ($mail) {
            return $mail->hasTo('customer@example.com');
        });

        $this->assertTrue(Cache::has('account_deletion_otp_' . $this->user->id));
    }

    public function test_delete_account_fails_with_invalid_otp(): void
    {
        Sanctum::actingAs($this->user);

        // Put a valid OTP in cache
        Cache::put('account_deletion_otp_' . $this->user->id, '123456', now()->addMinutes(10));

        $response = $this->deleteJson('/api/v1/user', [
            'otp' => '999999',
        ]);

        $response->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $this->user->id]);
    }

    public function test_delete_account_succeeds_with_valid_otp_and_no_active_orders(): void
    {
        Sanctum::actingAs($this->user);

        // Set valid OTP
        Cache::put('account_deletion_otp_' . $this->user->id, '654321', now()->addMinutes(10));

        $userId = $this->user->id;

        $response = $this->deleteJson('/api/v1/user', [
            'otp' => '654321',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
            ]);

        $this->assertDatabaseMissing('users', ['id' => $userId]);
        $this->assertFalse(Cache::has('account_deletion_otp_' . $userId));
    }
}
