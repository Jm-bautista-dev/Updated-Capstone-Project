<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchSchedule;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchDeletionSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $admin;
    protected User $cashier;
    protected User $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superAdmin = User::factory()->create([
            'role' => 'super_admin',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);
    }

    /**
     * Test 1: Admin and Super Admin can delete an unused branch when more than 1 branch exists.
     */
    public function test_admin_and_super_admin_can_delete_unused_branch(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Main Hub',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Temp Test Branch',
            'delivery_radius_km'  => 5,
            'base_delivery_fee'   => 39,
            'has_internal_riders' => false,
        ]);

        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);

        $response = $this->actingAs($this->admin)->delete("/branches/{$branch2->id}");
        $response->assertRedirect('/branches');
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('branches', ['id' => $branch2->id]);
        $this->assertDatabaseHas('branches', ['id' => $branch1->id]);
    }

    /**
     * Test 2: Cashier and Customer cannot delete branches (403 Forbidden).
     */
    public function test_cashier_and_customer_cannot_delete_branch(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Branch 1',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Branch 2',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        // Cashier attempt
        $responseCashier = $this->actingAs($this->cashier)->deleteJson("/branches/{$branch2->id}");
        $responseCashier->assertStatus(403);
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);

        // Customer attempt
        $responseCustomer = $this->actingAs($this->customer)->deleteJson("/branches/{$branch2->id}");
        $responseCustomer->assertStatus(403);
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);
    }

    /**
     * Test 3: Unauthenticated request is rejected with 401.
     */
    public function test_unauthenticated_request_cannot_delete_branch(): void
    {
        $branch = Branch::create([
            'name'                => 'Branch Unauth',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $response = $this->deleteJson("/branches/{$branch->id}");
        $response->assertStatus(401);
        $this->assertDatabaseHas('branches', ['id' => $branch->id]);
    }

    /**
     * Test 4: Last active branch cannot be deleted.
     */
    public function test_last_active_branch_cannot_be_deleted(): void
    {
        $onlyBranch = Branch::create([
            'name'                => 'Sole Remaining Branch',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $this->assertEquals(1, Branch::count());

        $response = $this->actingAs($this->superAdmin)->deleteJson("/branches/{$onlyBranch->id}");
        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'This is the last active branch and cannot be removed.',
        ]);

        $this->assertDatabaseHas('branches', ['id' => $onlyBranch->id]);
    }

    /**
     * Test 5: Branch with historical sales cannot be deleted.
     */
    public function test_branch_with_historical_sales_cannot_be_deleted(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Primary Branch',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Branch With Sales',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        // Create a historical sale for branch 2
        Sale::create([
            'user_id'         => $this->admin->id,
            'branch_id'       => $branch2->id,
            'order_number'    => 'ORD-SALE-001',
            'subtotal'        => 250.00,
            'total'           => 250.00,
            'paid_amount'     => 250.00,
            'payment_method'  => 'cash',
            'status'          => 'completed',
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/branches/{$branch2->id}");
        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
        ]);
        $this->assertStringContainsString('sales transaction(s)', $response->json('message'));
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);
    }

    /**
     * Test 6: Branch with order records cannot be deleted.
     */
    public function test_branch_with_orders_cannot_be_deleted(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Primary Branch',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Branch With Orders',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        Order::create([
            'order_number'     => 'ORD-TEST-001',
            'customer_name'    => 'Jane Customer',
            'contact_number'   => '09123456789',
            'address'          => '123 Test St',
            'fulfillment_type' => 'pickup',
            'user_id'          => $this->customer->id,
            'branch_id'        => $branch2->id,
            'status'           => 'completed',
            'total'            => 300,
            'total_amount'     => 300,
            'subtotal'         => 300,
            'payment_method'   => 'cod',
            'payment_status'   => 'paid',
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/branches/{$branch2->id}");
        $response->assertStatus(422);
        $this->assertStringContainsString('order record(s)', $response->json('message'));
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);
    }

    /**
     * Test 7: Branch with assigned staff accounts cannot be deleted.
     */
    public function test_branch_with_assigned_users_cannot_be_deleted(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Primary Branch',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Branch With Staff',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $branch2->id,
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/branches/{$branch2->id}");
        $response->assertStatus(422);
        $this->assertStringContainsString('assigned staff account(s)', $response->json('message'));
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);
    }

    /**
     * Test 8: Branch with active ingredient stock quantity cannot be deleted.
     */
    public function test_branch_with_active_ingredient_stock_cannot_be_deleted(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Primary Branch',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Branch With Stock',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $ingredient = Ingredient::create([
            'name'          => 'Nori Sheets',
            'unit'          => 'pack',
            'cost_per_unit' => 150,
        ]);

        // Branch 2 has stock > 0
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $branch2->id],
            ['stock' => 25, 'low_stock_level' => 5]
        );

        $response = $this->actingAs($this->admin)->deleteJson("/branches/{$branch2->id}");
        $response->assertStatus(422);
        $this->assertStringContainsString('active stock quantity', $response->json('message'));
        $this->assertDatabaseHas('branches', ['id' => $branch2->id]);
    }

    /**
     * Test 9: Deleting an unused branch properly cleans up its auto-generated schedules and stocks.
     */
    public function test_deleting_unused_branch_cleans_up_auto_generated_records(): void
    {
        $branch1 = Branch::create([
            'name'                => 'Branch 1',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        $branch2 = Branch::create([
            'name'                => 'Unused Branch To Delete',
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49,
            'has_internal_riders' => true,
        ]);

        // Check auto-seeded 7-day schedules
        $this->assertEquals(7, BranchSchedule::where('branch_id', $branch2->id)->count());

        $response = $this->actingAs($this->admin)->deleteJson("/branches/{$branch2->id}");
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'message' => 'Branch "Unused Branch To Delete" deleted successfully.',
        ]);

        $this->assertDatabaseMissing('branches', ['id' => $branch2->id]);
        $this->assertEquals(0, BranchSchedule::where('branch_id', $branch2->id)->count());
        $this->assertEquals(0, IngredientStock::where('branch_id', $branch2->id)->count());
    }
}
