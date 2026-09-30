<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RiderNameValidationTest extends TestCase
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

    public function test_can_create_rider_with_valid_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'Mario Dela Cruz',
            'email'     => 'mario@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => 'Mario Dela Cruz',
            'email' => 'mario@example.com',
        ]);
    }

    public function test_can_create_rider_with_exact_max_length_name(): void
    {
        $name255 = str_repeat('A', 255);

        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => $name255,
            'email'     => 'maxname@example.com',
            'phone'     => '09171234568',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => $name255,
            'email' => 'maxname@example.com',
        ]);
    }

    public function test_cannot_create_rider_with_name_exceeding_max_length(): void
    {
        $name256 = str_repeat('A', 256);

        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => $name256,
            'email'     => 'toolong@example.com',
            'phone'     => '09171234569',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('riders', [
            'email' => 'toolong@example.com',
        ]);
    }

    public function test_cannot_update_rider_with_name_exceeding_max_length(): void
    {
        $rider = Rider::create([
            'name'      => 'Original Rider',
            'email'     => 'orig@example.com',
            'phone'     => '09171234570',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $name256 = str_repeat('B', 256);

        $response = $this->actingAs($this->admin)->put("/riders/{$rider->id}", [
            'name'      => $name256,
            'email'     => 'orig@example.com',
            'phone'     => '09171234570',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertEquals('Original Rider', $rider->fresh()->name);
    }

    public function test_name_with_leading_and_trailing_whitespace_is_trimmed(): void
    {
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => '   Juan Dela Cruz   ',
            'email'     => 'juan.trimmed@example.com',
            'phone'     => '09171234590',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => 'Juan Dela Cruz',
            'email' => 'juan.trimmed@example.com',
        ]);
    }

    public function test_cannot_create_rider_with_empty_or_whitespace_only_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => '     ',
            'email'     => 'emptyname@example.com',
            'phone'     => '09171234591',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('riders', [
            'email' => 'emptyname@example.com',
        ]);
    }

    public function test_cannot_create_rider_with_single_character_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => 'A',
            'email'     => 'singlechar@example.com',
            'phone'     => '09171234592',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('riders', [
            'email' => 'singlechar@example.com',
        ]);
    }

    public function test_can_create_rider_with_unicode_and_accented_name(): void
    {
        $unicodeName = 'José María Dela Cruz-Niña';

        $response = $this->actingAs($this->admin)->post('/riders', [
            'name'      => $unicodeName,
            'email'     => 'jose.maria@example.com',
            'phone'     => '09171234593',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('riders', [
            'name'  => $unicodeName,
            'email' => 'jose.maria@example.com',
        ]);
    }

    public function test_direct_json_request_exceeding_max_length_is_rejected_with_422(): void
    {
        $longName = str_repeat('X', 260);

        $response = $this->actingAs($this->admin)->postJson('/riders', [
            'name'      => $longName,
            'email'     => 'directapi@example.com',
            'phone'     => '09171234594',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
        $this->assertDatabaseMissing('riders', [
            'email' => 'directapi@example.com',
        ]);
    }

    public function test_can_remove_rider_without_active_deliveries(): void
    {
        $rider = Rider::create([
            'name'      => 'Removable Rider',
            'email'     => 'removeme@example.com',
            'phone'     => '09171234571',
            'branch_id' => $this->branch->id,
            'password'  => bcrypt('secret123'),
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->admin)->delete("/riders/{$rider->id}");

        $response->assertSessionHasNoErrors();
        $this->assertSoftDeleted('riders', ['id' => $rider->id]);
    }
}
