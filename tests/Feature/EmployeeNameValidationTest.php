<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EmployeeNameValidationTest extends TestCase
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

    public function test_can_create_employee_with_valid_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => 'Victor Amante',
            'email'     => 'victor@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'name'  => 'Victor Amante',
            'email' => 'victor@example.com',
            'role'  => 'cashier',
        ]);
    }

    public function test_can_create_employee_with_exact_max_length_name(): void
    {
        $name50 = str_repeat('A', 50);

        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => $name50,
            'email'     => 'max50@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', [
            'name'  => $name50,
            'email' => 'max50@example.com',
        ]);
    }

    public function test_cannot_create_employee_with_name_exceeding_max_length(): void
    {
        $name51 = str_repeat('A', 51);

        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => $name51,
            'email'     => 'toolong@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('users', [
            'email' => 'toolong@example.com',
        ]);
    }

    public function test_cannot_create_employee_with_name_below_min_length(): void
    {
        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => 'A',
            'email'     => 'tooshort@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('users', [
            'email' => 'tooshort@example.com',
        ]);
    }

    public function test_cannot_create_employee_with_invalid_characters_in_name(): void
    {
        $response = $this->actingAs($this->admin)->post('/employees', [
            'name'      => 'Victor123 #',
            'email'     => 'invalidchars@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertDatabaseMissing('users', [
            'email' => 'invalidchars@example.com',
        ]);
    }

    public function test_cannot_update_employee_with_name_exceeding_max_length(): void
    {
        $cashier = User::factory()->create([
            'name'      => 'Original Cashier',
            'email'     => 'cashier@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $name51 = str_repeat('B', 51);

        $response = $this->actingAs($this->admin)->put("/employees/{$cashier->id}", [
            'name'      => $name51,
            'email'     => 'cashier@example.com',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $response->assertSessionHasErrors(['name']);
        $this->assertEquals('Original Cashier', $cashier->fresh()->name);
    }
}
