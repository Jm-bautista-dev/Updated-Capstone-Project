<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Services\FinancialMetricsService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DayOverDayMetricsConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Branch $branchA;
    private Branch $branchB;
    private FinancialMetricsService $metricsService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->metricsService = new FinancialMetricsService();

        $this->branchA = Branch::create([
            'name'      => 'Branch Alpha',
            'code'      => 'BALP',
            'address'   => 'Laguna',
            'latitude'  => 14.229371,
            'longitude' => 121.328383,
            'is_active' => true,
        ]);
        $this->branchB = Branch::create([
            'name'      => 'Branch Beta',
            'code'      => 'BBET',
            'address'   => 'Calamba',
            'latitude'  => 14.210000,
            'longitude' => 121.150000,
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branchA->id,
        ]);
    }

    public function test_positive_delta_calculated_correctly()
    {
        $delta = $this->metricsService->calculateDelta(4000.00, 3500.00, 'vs yesterday');

        $this->assertEquals(4000.00, $delta['current_value']);
        $this->assertEquals(3500.00, $delta['previous_value']);
        $this->assertEquals(500.00, $delta['difference']);
        $this->assertEquals(14.3, $delta['delta_percentage']);
        $this->assertEquals('+14.3%', $delta['formatted_delta']);
        $this->assertEquals('up', $delta['trend']);
        $this->assertEquals('positive', $delta['state']);
        $this->assertEquals('vs yesterday', $delta['comparison_label']);
    }

    public function test_negative_delta_calculated_correctly()
    {
        $delta = $this->metricsService->calculateDelta(4000.00, 5000.00, 'vs yesterday');

        $this->assertEquals(4000.00, $delta['current_value']);
        $this->assertEquals(5000.00, $delta['previous_value']);
        $this->assertEquals(-1000.00, $delta['difference']);
        $this->assertEquals(-20.0, $delta['delta_percentage']);
        $this->assertEquals('-20.0%', $delta['formatted_delta']);
        $this->assertEquals('down', $delta['trend']);
        $this->assertEquals('negative', $delta['state']);
    }

    public function test_neutral_zero_change_delta_calculated_correctly()
    {
        $delta = $this->metricsService->calculateDelta(4000.00, 4000.00, 'vs yesterday');

        $this->assertEquals(0.00, $delta['difference']);
        $this->assertEquals(0.0, $delta['delta_percentage']);
        $this->assertEquals('0.0%', $delta['formatted_delta']);
        $this->assertEquals('neutral', $delta['trend']);
        $this->assertEquals('neutral', $delta['state']);
    }

    public function test_zero_previous_baseline_handled_without_division_by_zero()
    {
        $delta = $this->metricsService->calculateDelta(4000.00, 0.00, 'vs yesterday');

        $this->assertEquals(4000.00, $delta['current_value']);
        $this->assertEquals(0.00, $delta['previous_value']);
        $this->assertEquals(4000.00, $delta['difference']);
        $this->assertNull($delta['delta_percentage']);
        $this->assertEquals('New', $delta['formatted_delta']);
        $this->assertEquals('up', $delta['trend']);
        $this->assertEquals('new', $delta['state']);
        $this->assertEquals('New today', $delta['badge_text']);
    }

    public function test_both_days_zero_handled_correctly()
    {
        $delta = $this->metricsService->calculateDelta(0.00, 0.00, 'vs yesterday');

        $this->assertEquals(0.00, $delta['difference']);
        $this->assertEquals(0.0, $delta['delta_percentage']);
        $this->assertEquals('0.0%', $delta['formatted_delta']);
        $this->assertEquals('neutral', $delta['trend']);
        $this->assertEquals('zero', $delta['state']);
        $this->assertEquals('No change', $delta['badge_text']);
    }

    private function createSale(array $attributes): Sale
    {
        static $orderCounter = 1000;
        $orderCounter++;

        $total = $attributes['total'] ?? 1000.00;

        return Sale::create(array_merge([
            'order_number'   => 'ORD-' . $orderCounter,
            'branch_id'      => $this->branchA->id,
            'user_id'        => $this->admin->id,
            'customer_type'  => 'regular',
            'payment_method' => 'cash',
            'paid_amount'    => $total,
            'change_amount'  => 0.00,
            'status'         => 'completed',
            'subtotal'       => $total,
            'discount'       => 0.00,
            'total'          => $total,
            'cost_total'     => 400.00,
            'profit'         => 600.00,
        ], $attributes));
    }

    public function test_day_over_day_revenue_and_orders_with_exact_data()
    {
        $now = Carbon::now('Asia/Manila');

        // Yesterday's sales: 2 completed orders, total = 3,500
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 2000.00,
            'discount'   => 0.00,
            'total'      => 2000.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(14, 0, 0),
        ]);
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1500.00,
            'discount'   => 0.00,
            'total'      => 1500.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(18, 30, 0),
        ]);

        // Today's sales: 2 completed orders, total = 4,000
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 2500.00,
            'discount'   => 0.00,
            'total'      => 2500.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(10, 0, 0),
        ]);
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1500.00,
            'discount'   => 0.00,
            'total'      => 1500.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(15, 0, 0),
        ]);

        $dod = $this->metricsService->getDayOverDayMetrics($this->branchA->id);

        $this->assertEquals(4000.00, $dod['revenue']['current_value']);
        $this->assertEquals(3500.00, $dod['revenue']['previous_value']);
        $this->assertEquals(14.3, $dod['revenue']['delta_percentage']);
        $this->assertEquals('+14.3%', $dod['revenue']['formatted_delta']);
        $this->assertEquals('up', $dod['revenue']['trend']);

        $this->assertEquals(2, $dod['orders']['current_value']);
        $this->assertEquals(2, $dod['orders']['previous_value']);
        $this->assertEquals(0.0, $dod['orders']['delta_percentage']);
        $this->assertEquals('0.0%', $dod['orders']['formatted_delta']);
        $this->assertEquals('neutral', $dod['orders']['trend']);
    }

    public function test_scopes_day_over_day_metrics_by_branch_properly()
    {
        $now = Carbon::now('Asia/Manila');

        // Branch A: Today = 1000, Yesterday = 500 -> +100.0%
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 500.00,
            'discount'   => 0.00,
            'total'      => 500.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(12, 0, 0),
        ]);
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1000.00,
            'discount'   => 0.00,
            'total'      => 1000.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(12, 0, 0),
        ]);

        // Branch B: Today = 200, Yesterday = 1000 -> -80.0%
        $this->createSale([
            'branch_id'  => $this->branchB->id,
            'subtotal'   => 1000.00,
            'discount'   => 0.00,
            'total'      => 1000.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(12, 0, 0),
        ]);
        $this->createSale([
            'branch_id'  => $this->branchB->id,
            'subtotal'   => 200.00,
            'discount'   => 0.00,
            'total'      => 200.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(12, 0, 0),
        ]);

        $branchADod = $this->metricsService->getDayOverDayMetrics($this->branchA->id);
        $this->assertEquals(1000.00, $branchADod['revenue']['current_value']);
        $this->assertEquals(500.00, $branchADod['revenue']['previous_value']);
        $this->assertEquals(100.0, $branchADod['revenue']['delta_percentage']);
        $this->assertEquals('+100.0%', $branchADod['revenue']['formatted_delta']);

        $branchBDod = $this->metricsService->getDayOverDayMetrics($this->branchB->id);
        $this->assertEquals(200.00, $branchBDod['revenue']['current_value']);
        $this->assertEquals(1000.00, $branchBDod['revenue']['previous_value']);
        $this->assertEquals(-80.0, $branchBDod['revenue']['delta_percentage']);
        $this->assertEquals('-80.0%', $branchBDod['revenue']['formatted_delta']);
    }

    public function test_respects_asia_manila_timezone_boundaries()
    {
        $now = Carbon::now('Asia/Manila');

        // Yesterday 23:59:59 Manila time
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 800.00,
            'discount'   => 0.00,
            'total'      => 800.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(23, 59, 59),
        ]);

        // Today 00:00:01 Manila time
        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1200.00,
            'discount'   => 0.00,
            'total'      => 1200.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(0, 0, 1),
        ]);

        $dod = $this->metricsService->getDayOverDayMetrics($this->branchA->id);

        $this->assertEquals(1200.00, $dod['revenue']['current_value']);
        $this->assertEquals(800.00, $dod['revenue']['previous_value']);
        $this->assertEquals(50.0, $dod['revenue']['delta_percentage']);
        $this->assertEquals('+50.0%', $dod['revenue']['formatted_delta']);
    }

    public function test_produces_consistent_delta_across_reports_sales_and_dashboard_pages()
    {
        $now = Carbon::now('Asia/Manila');

        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1000.00,
            'discount'   => 0.00,
            'total'      => 1000.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->subDay()->setTime(14, 0, 0),
        ]);

        $this->createSale([
            'branch_id'  => $this->branchA->id,
            'subtotal'   => 1500.00,
            'discount'   => 0.00,
            'total'      => 1500.00,
            'status'     => 'completed',
            'created_at' => (clone $now)->setTime(14, 0, 0),
        ]);

        // Sales page
        $salesResponse = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->branchA->id);
        $salesResponse->assertOk();
        $salesStats = $salesResponse->original->getData()['page']['props']['stats'];
        $this->assertEquals(1500.00, $salesStats['today_revenue']);
        $this->assertEquals('+50.0%', $salesStats['revenue_delta']['formatted_delta']);

        // Reports page
        $reportsResponse = $this->actingAs($this->admin)->get('/reports?branch_id=' . $this->branchA->id);
        $reportsResponse->assertOk();
        $reportsProps = $reportsResponse->original->getData()['page']['props'];
        $this->assertEquals(1500.00, $reportsProps['today_sales']);
        $this->assertEquals('+50.0%', $reportsProps['today_revenue_delta']['formatted_delta']);

        // Dashboard page
        $dashboardResponse = $this->actingAs($this->admin)->get('/dashboard?branch_id=' . $this->branchA->id);
        $dashboardResponse->assertOk();
        $dashboardStats = $dashboardResponse->original->getData()['page']['props']['stats'];
        $this->assertArrayHasKey('dod_revenue_delta', $dashboardStats);
        $this->assertEquals('+50.0%', $dashboardStats['dod_revenue_delta']['formatted_delta']);
    }
}
