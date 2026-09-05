<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Services\FinancialMetricsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RevenueDefinitionReportsSalesConsistencyTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchA;
    public Branch $branchB;
    public User $admin;
    public User $cashierA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchA = Branch::create([
            'name'      => 'Victoria Branch',
            'code'      => 'VIC',
            'address'   => 'Victoria St',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);

        $this->branchB = Branch::create([
            'name'      => 'Santa Cruz Branch',
            'code'      => 'STC',
            'address'   => 'Santa Cruz St',
            'latitude'  => 14.6000,
            'longitude' => 120.9900,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branchA->id,
        ]);

        $this->cashierA = User::factory()->create([
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branchA->id,
        ]);
    }

    private function insertSale(int $branchId, float $subtotal, float $discount = 0.0, float $deliveryFee = 0.0, string $status = 'completed', ?Carbon $date = null): int
    {
        $date = $date ? (clone $date)->setTimezone('UTC') : Carbon::now('UTC');
        $total = $subtotal - $discount + $deliveryFee;

        return DB::table('sales')->insertGetId([
            'order_number'    => 'ORD-' . uniqid(),
            'branch_id'       => $branchId,
            'user_id'         => $this->admin->id,
            'subtotal'        => $subtotal,
            'discount'        => $discount,
            'delivery_fee'    => $deliveryFee,
            'total'           => $total,
            'paid_amount'     => $total,
            'change_amount'   => 0,
            'status'          => $status,
            'payment_method'  => 'cash',
            'type'            => $deliveryFee > 0 ? 'delivery' : 'dine-in',
            'created_at'      => $date->toDateTimeString(),
            'updated_at'      => $date->toDateTimeString(),
        ]);
    }

    /**
     * Test 1: Reports and Sales return identical Today's Revenue across all branches
     */
    public function test_reports_and_sales_return_identical_today_revenue_all_branches(): void
    {
        // Branch A: Completed sale of 1000 with 100 discount = 900 recognized
        $this->insertSale($this->branchA->id, 1000.00, 100.00);

        // Branch B: Completed sale of 2000 with 0 discount = 2000 recognized
        $this->insertSale($this->branchB->id, 2000.00, 0.00);

        // Branch A: Completed sale from yesterday = 5000 (must be excluded from today)
        $yesterday = Carbon::now('Asia/Manila')->subDay();
        $this->insertSale($this->branchA->id, 5000.00, 0.00, 0.00, 'completed', $yesterday);

        // Branch B: Pending sale today = 800 (must be excluded from today's recognized revenue)
        $this->insertSale($this->branchB->id, 800.00, 0.00, 0.00, 'pending');

        // Expected Today's Revenue = 900 + 2000 = 2900.00
        $reportsResponse = $this->actingAs($this->admin)->get('/reports?branch_id=all');
        $reportsResponse->assertStatus(200);
        $reportsResponse->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Reports/Index')
            ->where('today_sales', fn ($v) => (float) $v === 2900.0)
        );

        $salesResponse = $this->actingAs($this->admin)->get('/sales?branch_id=all');
        $salesResponse->assertStatus(200);
        $salesResponse->assertInertia(fn (Assert $page) => $page
            ->component('Sales/Index')
            ->where('stats.today_revenue', fn ($v) => (float) $v === 2900.0)
            ->where('today_sales', fn ($v) => (float) $v === 2900.0)
        );
    }

    /**
     * Test 2: Reports and Sales return identical revenue when filtered by specific branch
     */
    public function test_reports_and_sales_return_identical_revenue_for_specific_branch(): void
    {
        $this->insertSale($this->branchA->id, 1500.00, 0.00);
        $this->insertSale($this->branchB->id, 3000.00, 0.00);

        // Branch A only: Expected 1500.00
        $reportsA = $this->actingAs($this->admin)->get('/reports?branch_id=' . $this->branchA->id);
        $reportsA->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1500.0));

        $salesA = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->branchA->id);
        $salesA->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1500.0)->where('stats.today_revenue', fn ($v) => (float) $v === 1500.0));

        // Branch B only: Expected 3000.00
        $reportsB = $this->actingAs($this->admin)->get('/reports?branch_id=' . $this->branchB->id);
        $reportsB->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 3000.0));

        $salesB = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->branchB->id);
        $salesB->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 3000.0)->where('stats.today_revenue', fn ($v) => (float) $v === 3000.0));
    }

    /**
     * Test 3: Cashier branch authorization isolation
     */
    public function test_cashier_isolated_to_assigned_branch_on_both_pages(): void
    {
        $this->insertSale($this->branchA->id, 1200.00, 0.00);
        $this->insertSale($this->branchB->id, 4000.00, 0.00);

        // Cashier A is assigned to Branch A -> must only see 1200.00 on both pages
        $reportsResponse = $this->actingAs($this->cashierA)->get('/reports');
        $reportsResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1200.0));

        $salesResponse = $this->actingAs($this->cashierA)->get('/sales');
        $salesResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1200.0)->where('stats.today_revenue', fn ($v) => (float) $v === 1200.0));
    }

    /**
     * Test 4: Delivery fee is excluded from product food revenue consistently
     */
    public function test_delivery_fees_excluded_from_recognized_product_revenue(): void
    {
        // Food subtotal 500 + delivery fee 50 = total 550. Product revenue = 500
        $this->insertSale($this->branchA->id, 500.00, 0.00, 50.00);

        $reportsResponse = $this->actingAs($this->admin)->get('/reports?branch_id=all');
        $reportsResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 500.0));

        $salesResponse = $this->actingAs($this->admin)->get('/sales?branch_id=all');
        $salesResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 500.0));
    }

    /**
     * Test 5: Cancelled and voided sales are excluded from revenue
     */
    public function test_cancelled_and_voided_sales_excluded(): void
    {
        $this->insertSale($this->branchA->id, 1000.00, 0.00, 0.00, 'completed');
        $this->insertSale($this->branchA->id, 800.00, 0.00, 0.00, 'cancelled');

        $reportsResponse = $this->actingAs($this->admin)->get('/reports?branch_id=' . $this->branchA->id);
        $reportsResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1000.0));

        $salesResponse = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->branchA->id);
        $salesResponse->assertInertia(fn (Assert $page) => $page->where('today_sales', fn ($v) => (float) $v === 1000.0));
    }
}
