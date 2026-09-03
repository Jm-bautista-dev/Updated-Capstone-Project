<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BranchKpiAndValidationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);
    }

    /**
     * Test 1: All branches with valid values produce accurate averages.
     */
    public function test_1_all_valid_branches_calculates_accurate_average_kpis(): void
    {
        Branch::create([
            'name'                => 'Branch Alpha',
            'delivery_radius_km'  => 10.00,
            'base_delivery_fee'   => 49.00,
            'has_internal_riders' => true,
        ]);

        Branch::create([
            'name'                => 'Branch Beta',
            'delivery_radius_km'  => 20.00,
            'base_delivery_fee'   => 59.00,
            'has_internal_riders' => false,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches');
        $response->assertOk();

        $data = $response->json();
        $this->assertArrayHasKey('stats', $data);
        $this->assertEquals(2, $data['stats']['total_branches']);
        $this->assertEquals(1, $data['stats']['internal_fleet_count']);
        $this->assertEquals(15.0, $data['stats']['average_radius_km']);
        $this->assertEquals(54.00, $data['stats']['average_base_fee']);
    }

    /**
     * Test 2: One branch with NULL radius is safely excluded without poisoning average.
     */
    public function test_2_one_null_radius_is_excluded_from_average_without_poisoning(): void
    {
        Branch::create([
            'name'                => 'Branch Alpha',
            'delivery_radius_km'  => 10.00,
            'base_delivery_fee'   => 49.00,
        ]);

        // Branch with NULL radius (simulating unconfigured legacy branch)
        Branch::create([
            'name'                => 'Branch Beta',
            'delivery_radius_km'  => null,
            'base_delivery_fee'   => 59.00,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches');
        $response->assertOk();

        $stats = $response->json('stats');
        // Average radius must be 10.0 (10 / 1 = 10), NOT coalesced to 0 (which would give 5.0)
        $this->assertEquals(10.0, $stats['average_radius_km']);
        $this->assertEquals(54.00, $stats['average_base_fee']);
    }

    /**
     * Test 3: One branch with NULL base delivery fee is excluded without poisoning average.
     */
    public function test_3_one_null_base_fee_is_excluded_from_average_without_poisoning(): void
    {
        Branch::create([
            'name'                => 'Branch Alpha',
            'delivery_radius_km'  => 10.00,
            'base_delivery_fee'   => 49.00,
        ]);

        // Branch with NULL base delivery fee
        Branch::create([
            'name'                => 'Branch Beta',
            'delivery_radius_km'  => 20.00,
            'base_delivery_fee'   => null,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches');
        $response->assertOk();

        $stats = $response->json('stats');
        $this->assertEquals(15.0, $stats['average_radius_km']);
        // Average fee must be 49.00 (49 / 1 = 49), NOT coalesced to 0 (which would give 24.50)
        $this->assertEquals(49.00, $stats['average_base_fee']);
    }

    /**
     * Test 4: All branches missing delivery radius returns null (defensively handled, not NaN).
     */
    public function test_4_all_branches_missing_radius_returns_null(): void
    {
        Branch::create([
            'name'                => 'Branch Alpha',
            'delivery_radius_km'  => null,
            'base_delivery_fee'   => 49.00,
        ]);

        Branch::create([
            'name'                => 'Branch Beta',
            'delivery_radius_km'  => null,
            'base_delivery_fee'   => 59.00,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches');
        $response->assertOk();

        $stats = $response->json('stats');
        $this->assertNull($stats['average_radius_km']);
        $this->assertEquals(54.00, $stats['average_base_fee']);
    }

    /**
     * Test 5: All branches missing base fee returns null (defensively handled, not NaN).
     */
    public function test_5_all_branches_missing_base_fee_returns_null(): void
    {
        Branch::create([
            'name'                => 'Branch Alpha',
            'delivery_radius_km'  => 12.00,
            'base_delivery_fee'   => null,
        ]);

        Branch::create([
            'name'                => 'Branch Beta',
            'delivery_radius_km'  => 16.00,
            'base_delivery_fee'   => null,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches');
        $response->assertOk();

        $stats = $response->json('stats');
        $this->assertEquals(14.0, $stats['average_radius_km']);
        $this->assertNull($stats['average_base_fee']);
    }

    /**
     * Test 6: Branch creation without delivery radius is rejected by validation.
     */
    public function test_6_branch_creation_without_radius_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/branches', [
            'name'              => 'New Branch',
            'base_delivery_fee' => 49.00,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['delivery_radius_km']);
    }

    /**
     * Test 7: Branch creation without base delivery fee is rejected by validation.
     */
    public function test_7_branch_creation_without_base_fee_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/branches', [
            'name'               => 'New Branch',
            'delivery_radius_km' => 10.00,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['base_delivery_fee']);
    }

    /**
     * Test 8: Branch creation with negative or zero delivery radius is rejected.
     */
    public function test_8_branch_creation_with_negative_or_zero_radius_is_rejected(): void
    {
        $responseZero = $this->actingAs($this->admin)->postJson('/branches', [
            'name'               => 'Zero Radius Branch',
            'delivery_radius_km' => 0,
            'base_delivery_fee'  => 49.00,
        ]);
        $responseZero->assertStatus(422);
        $responseZero->assertJsonValidationErrors(['delivery_radius_km']);

        $responseNegative = $this->actingAs($this->admin)->postJson('/branches', [
            'name'               => 'Negative Radius Branch',
            'delivery_radius_km' => -5.00,
            'base_delivery_fee'  => 49.00,
        ]);
        $responseNegative->assertStatus(422);
        $responseNegative->assertJsonValidationErrors(['delivery_radius_km']);
    }

    /**
     * Test 9: Branch creation with negative base delivery fee is rejected.
     */
    public function test_9_branch_creation_with_negative_base_fee_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/branches', [
            'name'               => 'Negative Fee Branch',
            'delivery_radius_km' => 10.00,
            'base_delivery_fee'  => -15.00,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['base_delivery_fee']);
    }

    /**
     * Test 10: Branch update with invalid/negative values is rejected, while valid values succeed.
     */
    public function test_10_branch_update_validation_and_successful_update(): void
    {
        $branch = Branch::create([
            'name'               => 'Existing Branch',
            'delivery_radius_km' => 10.00,
            'base_delivery_fee'  => 49.00,
        ]);

        // Attempt invalid update: negative radius
        $failRadius = $this->actingAs($this->admin)->putJson("/branches/{$branch->id}", [
            'delivery_radius_km' => -2,
            'base_delivery_fee'  => 49.00,
        ]);
        $failRadius->assertStatus(422);
        $failRadius->assertJsonValidationErrors(['delivery_radius_km']);

        // Attempt invalid update: negative fee
        $failFee = $this->actingAs($this->admin)->putJson("/branches/{$branch->id}", [
            'delivery_radius_km' => 15.00,
            'base_delivery_fee'  => -10.00,
        ]);
        $failFee->assertStatus(422);
        $failFee->assertJsonValidationErrors(['base_delivery_fee']);

        // Valid update succeeds
        $success = $this->actingAs($this->admin)->put("/branches/{$branch->id}", [
            'delivery_radius_km' => 18.50,
            'base_delivery_fee'  => 55.00,
            'per_km_fee'         => 12.00,
        ]);
        $success->assertSessionHas('success');

        $branch->refresh();
        $this->assertEquals(18.50, (float) $branch->delivery_radius_km);
        $this->assertEquals(55.00, (float) $branch->base_delivery_fee);
        $this->assertEquals(12.00, (float) $branch->per_km_fee);
    }

    /**
     * Test 11: Dedicated stats endpoint returns accurate KPIs.
     */
    public function test_11_stats_endpoint_returns_accurate_kpis(): void
    {
        Branch::create([
            'name'                => 'Branch One',
            'delivery_radius_km'  => 12.00,
            'base_delivery_fee'   => 45.00,
            'has_internal_riders' => true,
        ]);

        Branch::create([
            'name'                => 'Branch Two',
            'delivery_radius_km'  => 18.00,
            'base_delivery_fee'   => 55.00,
            'has_internal_riders' => true,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/branches/stats');
        $response->assertOk();
        $response->assertJson([
            'success' => true,
            'stats'   => [
                'total_branches'       => 2,
                'internal_fleet_count' => 2,
                'average_radius_km'    => 15.0,
                'average_base_fee'     => 50.00,
            ],
        ]);
    }
}
