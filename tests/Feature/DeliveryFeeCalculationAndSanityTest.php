<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\DeliveryFeeService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DeliveryFeeCalculationAndSanityTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Branch $branchA;
    protected Branch $branchB;
    protected DeliveryFeeService $feeService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
        ]);

        $this->branchA = Branch::create([
            'name'               => 'Maki Desu Branch A',
            'address'            => 'Victoria, Laguna',
            'latitude'           => 14.2250,
            'longitude'          => 121.3250,
            'delivery_radius_km' => 15.00,
            'base_delivery_fee'  => 50.00,
            'per_km_fee'         => 12.50,
            'has_internal_riders'=> true,
        ]);

        $this->branchB = Branch::create([
            'name'               => 'Maki Desu Branch B',
            'address'            => 'Sta Cruz, Laguna',
            'latitude'           => 14.2800,
            'longitude'          => 121.4100,
            'delivery_radius_km' => 10.00,
            'base_delivery_fee'  => 40.00,
            'per_km_fee'         => 10.00,
            'has_internal_riders'=> true,
        ]);

        $this->feeService = app(DeliveryFeeService::class);
    }

    /**
     * Test 1 — Short Distance (1 km) produces base fee.
     */
    public function test_short_distance_produces_base_fee(): void
    {
        $breakdown = $this->feeService->calculateFee($this->branchA, 1.0);

        $this->assertEquals(50.00, $breakdown['delivery_fee']);
        $this->assertEquals(50.00, $breakdown['base_fee']);
        $this->assertEquals(0.00, $breakdown['distance_charge']);
        $this->assertTrue($breakdown['is_within_radius']);
    }

    /**
     * Test 2 — Medium Distance (5 km) uses configured formula.
     * Formula: Base 50 + (5 - 1) * 12.50 = 50 + 50 = 100.00
     */
    public function test_medium_distance_formula_calculation(): void
    {
        $breakdown = $this->feeService->calculateFee($this->branchA, 5.0);

        $this->assertEquals(100.00, $breakdown['delivery_fee']);
        $this->assertEquals(50.00, $breakdown['base_fee']);
        $this->assertEquals(4.0, $breakdown['chargeable_distance']);
        $this->assertEquals(50.00, $breakdown['distance_charge']);
    }

    /**
     * Test 3 — Long Distance (8 km) legitimately generates ₱137.50 (ORD-10 finding).
     * Formula: Base 50 + (8 - 1) * 12.50 = 50 + (7 * 12.50) = 50 + 87.50 = ₱137.50
     */
    public function test_ord_10_long_distance_formula_legitimately_produces_137_50(): void
    {
        $breakdown = $this->feeService->calculateFee($this->branchA, 8.0, 150.00);

        $this->assertEquals(137.50, $breakdown['delivery_fee']);
        $this->assertEquals(50.00, $breakdown['base_fee']);
        $this->assertEquals(12.50, $breakdown['per_km_fee']);
        $this->assertEquals(7.0, $breakdown['chargeable_distance']);
        $this->assertEquals(87.50, $breakdown['distance_charge']);
        $this->assertTrue($breakdown['is_within_radius']);

        // Check ratio: 137.50 / 150.00 = 91.67%
        $this->assertEquals(91.67, $breakdown['fee_to_subtotal_pct']);
        $this->assertTrue($breakdown['is_high_fee_ratio']);
        $this->assertStringContainsString('91.67%', $breakdown['warning_message']);
    }

    /**
     * Test 4 — Zero Distance produces base fee without errors.
     */
    public function test_zero_distance_produces_base_fee(): void
    {
        $breakdown = $this->feeService->calculateFee($this->branchA, 0.0);

        $this->assertEquals(50.00, $breakdown['delivery_fee']);
        $this->assertEquals(0.00, $breakdown['distance_charge']);
    }

    /**
     * Test 5 — Invalid negative distance is rejected with InvalidArgumentException.
     */
    public function test_negative_distance_throws_exception(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->feeService->calculateFee($this->branchA, -5.0);
    }

    /**
     * Test 6 — Excessive distance beyond branch delivery radius is flagged.
     */
    public function test_distance_exceeding_radius_is_flagged(): void
    {
        // Branch A radius is 15 km
        $breakdown = $this->feeService->calculateFee($this->branchA, 25.0);

        $this->assertFalse($breakdown['is_within_radius']);
        $this->assertEquals(15.0, $breakdown['max_radius_km']);
    }

    /**
     * Test 7 — High fee-to-subtotal ratio is flagged for transparency without blocking order.
     */
    public function test_high_fee_to_subtotal_ratio_flagged_for_staff_transparency(): void
    {
        $breakdown = $this->feeService->calculateFee($this->branchA, 6.0, 100.00);
        // Distance 6.0 -> 50 + (5 * 12.50) = 112.50. 112.50 / 100 = 112.5%
        $this->assertEquals(112.50, $breakdown['delivery_fee']);
        $this->assertTrue($breakdown['is_high_fee_ratio']);
        $this->assertNotNull($breakdown['warning_message']);
    }

    /**
     * Test 8 — Multiple Branches have isolated pricing rules.
     */
    public function test_multiple_branches_have_isolated_rates(): void
    {
        // Branch A: 50 base + 12.50/km -> 5km = 100.00
        $feeA = $this->branchA->calculateDeliveryFee(5.0);
        $this->assertEquals(100.00, $feeA);

        // Branch B: 40 base + 10.00/km -> 5km = 40 + 4*10 = 80.00
        $feeB = $this->branchB->calculateDeliveryFee(5.0);
        $this->assertEquals(80.00, $feeB);
    }

    /**
     * Test 9 — Historical Order retains original delivery fee even if branch rates change.
     */
    public function test_historical_order_preserves_originally_applied_fee(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-HIST-01',
            'branch_id'      => $this->branchA->id,
            'user_id'        => $this->admin->id,
            'type'           => 'delivery',
            'subtotal'       => 150.00,
            'delivery_fee'   => 137.50,
            'total'          => 287.50,
            'cost_total'     => 60.00,
            'profit'         => 90.00,
            'paid_amount'    => 287.50,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        // Now modify Branch A rates in DB
        $this->branchA->update([
            'base_delivery_fee' => 75.00,
            'per_km_fee'        => 25.00,
        ]);

        // Refresh sale
        $sale->refresh();

        // Historical fee must remain 137.50
        $this->assertEquals('137.50', (string) $sale->delivery_fee);
        $this->assertEquals(137.50, $sale->delivery_fee_amount);
        $this->assertEquals('287.50', (string) $sale->total);
    }

    /**
     * Test 10 — Sales Page and API Consistency with Delivery Breakdown.
     */
    public function test_sales_page_receives_authoritative_delivery_fee_and_breakdown(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-10',
            'branch_id'      => $this->branchA->id,
            'user_id'        => $this->admin->id,
            'type'           => 'delivery',
            'subtotal'       => 150.00,
            'delivery_fee'   => 137.50,
            'total'          => 287.50,
            'cost_total'     => 50.00,
            'profit'         => 100.00,
            'paid_amount'    => 287.50,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        Delivery::create([
            'sale_id'          => $sale->id,
            'customer_name'    => 'Juan Dela Cruz',
            'customer_phone'   => '09171234567',
            'customer_address' => 'Brgy. San Benito, Victoria, Laguna',
            'distance_km'      => 8.0,
            'delivery_fee'     => 137.50,
            'status'           => 'delivered',
            'delivery_type'    => 'internal',
        ]);

        $response = $this->actingAs($this->admin)->get('/sales');
        $response->assertStatus(200);

        $saleWithBreakdown = Sale::with('delivery')->find($sale->id);
        $breakdown = $saleWithBreakdown->delivery_fee_breakdown;

        $this->assertNotNull($breakdown);
        $this->assertEquals(137.50, $breakdown['delivery_fee']);
        $this->assertEquals(8.0, $breakdown['actual_distance_km']);
        $this->assertEquals(91.67, $breakdown['fee_to_subtotal_pct']);
        $this->assertTrue($breakdown['is_high_fee_ratio']);
    }
}
