<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiderUniqueMobileNumberTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'      => 'Test Branch',
            'code'      => 'TEST',
            'address'   => 'Test Address',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);
    }

    public function test_can_create_rider_with_unique_phone(): void
    {
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Rider One',
            'email'     => 'rider1@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => 'Rider One',
            'email' => 'rider1@example.com',
            'phone' => '09171234567',
        ]);
    }

    public function test_cannot_create_rider_with_duplicate_phone_number(): void
    {
        Rider::create([
            'name'      => 'Existing Rider',
            'email'     => 'existing@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
        ]);

        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Duplicate Phone Rider',
            'email'     => 'dup@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors([
            'phone' => 'This mobile number is already registered to another rider.',
        ]);
        $this->assertDatabaseMissing('riders', ['email' => 'dup@example.com']);
    }

    public function test_phone_number_is_normalized_and_rejects_formatted_duplicates(): void
    {
        // Existing rider created with standard format
        Rider::create([
            'name'      => 'Rider Alpha',
            'email'     => 'alpha@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
        ]);

        // Attempt creation with +63 international format
        $response1 = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Rider Beta',
            'email'     => 'beta@example.com',
            'phone'     => '+63 917 123 4567',
            'branch_id' => $this->branch->id,
        ]);

        $response1->assertSessionHasErrors([
            'phone' => 'This mobile number is already registered to another rider.',
        ]);

        // Attempt creation with 10-digit format
        $response2 = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Rider Gamma',
            'email'     => 'gamma@example.com',
            'phone'     => '9171234567',
            'branch_id' => $this->branch->id,
        ]);

        $response2->assertSessionHasErrors([
            'phone' => 'This mobile number is already registered to another rider.',
        ]);
    }

    public function test_updating_rider_with_own_phone_succeeds(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Alpha',
            'email'     => 'alpha@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->put("/riders/{$rider->id}", [
            'name'      => 'Rider Alpha Renamed',
            'email'     => 'alpha@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('Rider Alpha Renamed', $rider->fresh()->name);
        $this->assertEquals('09171234567', $rider->fresh()->phone);
    }

    public function test_updating_rider_to_another_riders_phone_fails(): void
    {
        $rider1 = Rider::create([
            'name'      => 'Rider One',
            'email'     => 'rider1@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $rider2 = Rider::create([
            'name'      => 'Rider Two',
            'email'     => 'rider2@example.com',
            'phone'     => '09187654321',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->put("/riders/{$rider2->id}", [
            'name'      => 'Rider Two Modified',
            'email'     => 'rider2@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors([
            'phone' => 'This mobile number is already registered to another rider.',
        ]);
        $this->assertEquals('09187654321', $rider2->fresh()->phone);
    }

    public function test_soft_deleting_rider_frees_up_phone_number(): void
    {
        $rider = Rider::create([
            'name'      => 'Rider Old',
            'email'     => 'old@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        // Destroy rider
        $this->actingAs($this->admin)->delete("/riders/{$rider->id}");

        $this->assertSoftDeleted('riders', ['id' => $rider->id]);

        // Register new rider with same phone number should now succeed
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Rider New',
            'email'     => 'new@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => 'Rider New',
            'phone' => '09171234567',
        ]);
    }
}
