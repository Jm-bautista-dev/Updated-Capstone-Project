<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use App\Services\ForecastService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ForecastModelValidationGatingTest extends TestCase
{
    use RefreshDatabase;

    public Branch $testBranch;
    public User $testAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'      => 'Victoria Branch',
            'code'      => 'VIC',
            'address'   => 'Victoria St',
            'latitude'  => 14.5995,
            'longitude' => 120.9842,
            'is_active' => true,
        ]);

        $this->testAdmin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->testBranch->id,
        ]);
    }

    private function insertSale(Carbon $date, float $total): void
    {
        DB::table('sales')->insert([
            'order_number'   => 'ORD-' . uniqid(),
            'branch_id'      => $this->testBranch->id,
            'user_id'        => $this->testAdmin->id,
            'total'          => $total,
            'paid_amount'    => $total,
            'change_amount'  => 0,
            'status'         => 'completed',
            'payment_method' => 'cash',
            'type'           => 'dine-in',
            'created_at'     => $date->toDateTimeString(),
            'updated_at'     => $date->toDateTimeString(),
        ]);
    }

    /**
     * Test Case 1 (Reported QA Scenario): 30 days history -> INSUFFICIENT DATA & production_ready = false
     */
    public function test_30_day_history_cannot_qualify_for_production_ready(): void
    {
        // Seed 30 consecutive days of sales
        $startDate = Carbon::today()->subDays(29);
        for ($i = 0; $i < 30; $i++) {
            $saleDate = $startDate->copy()->addDays($i)->setTime(12, 0, 0);
            $this->insertSale($saleDate, rand(100, 500));
        }

        \Illuminate\Support\Facades\Cache::flush();

        $service = new ForecastService();
        $result = $service->benchmark($this->testBranch->id);

        $this->assertArrayHasKey('validation', $result);
        $this->assertEquals('INSUFFICIENT_DATA', $result['validation']['status']);
        $this->assertFalse($result['validation']['production_ready']);
        $this->assertStringContainsString('30 days', $result['validation']['reason']);
        $this->assertEquals(90, $result['validation']['min_history_days']);

        // Check web page presentation
        $response = $this->actingAs($this->testAdmin)->get('/analytics/forecast-benchmarking?branch_id=' . $this->testBranch->id);
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Analytics/ForecastBenchmarking')
            ->where('benchmark.validation.status', fn ($status) => $status === 'INSUFFICIENT_DATA')
            ->where('benchmark.validation.production_ready', fn ($ready) => $ready === false)
        );
    }

    /**
     * Test Case 2: Good Data (120 days) with low error -> PRODUCTION_READY & production_ready = true
     */
    public function test_120_days_history_with_low_error_passes_production_ready(): void
    {
        $startDate = Carbon::today()->subDays(119);
        // Consistent predictable sales series (e.g. 500 every day) -> minimal error
        for ($i = 0; $i < 120; $i++) {
            $saleDate = $startDate->copy()->addDays($i)->setTime(12, 0, 0);
            $this->insertSale($saleDate, 500.00);
        }

        // Clear cache
        \Illuminate\Support\Facades\Cache::flush();

        $service = new ForecastService();
        $result = $service->benchmark($this->testBranch->id);

        $this->assertArrayHasKey('validation', $result);
        $this->assertEquals('PRODUCTION_READY', $result['validation']['status']);
        $this->assertTrue($result['validation']['production_ready']);
        $this->assertGreaterThanOrEqual(90, $result['validation']['historical_days']);
    }

    /**
     * Test Case 3: Good Data (120 days) with high volatility/error -> NEEDS_IMPROVEMENT & production_ready = false
     */
    public function test_120_days_history_with_high_error_fails_production_ready(): void
    {
        $startDate = Carbon::today()->subDays(119);
        // Stable during training (500.00), highly volatile swings during validation (100.00 vs 10000.00)
        for ($i = 0; $i < 120; $i++) {
            $saleDate = $startDate->copy()->addDays($i)->setTime(12, 0, 0);
            $amount = $i < 106 ? 500.00 : ($i % 2 === 0 ? 10000.00 : 50.00);
            $this->insertSale($saleDate, $amount);
        }

        \Illuminate\Support\Facades\Cache::flush();

        $service = new ForecastService();
        $result = $service->benchmark($this->testBranch->id);

        $this->assertArrayHasKey('validation', $result);
        $this->assertEquals('NEEDS_IMPROVEMENT', $result['validation']['status']);
        $this->assertFalse($result['validation']['production_ready']);
    }

    /**
     * Test Case 4: Zero-demand periods are handled safely without division-by-zero or NaN
     */
    public function test_zero_demand_periods_calculate_safe_finite_metrics(): void
    {
        $startDate = Carbon::today()->subDays(29);
        // Sparse sales (only 3 days with sales in 30 days)
        for ($i = 0; $i < 30; $i++) {
            if ($i % 10 === 0) {
                $saleDate = $startDate->copy()->addDays($i)->setTime(12, 0, 0);
                $this->insertSale($saleDate, 200.00);
            }
        }

        \Illuminate\Support\Facades\Cache::flush();

        $service = new ForecastService();
        $result = $service->benchmark($this->testBranch->id);

        $this->assertArrayHasKey('validation', $result);
        $this->assertFalse($result['validation']['production_ready']);
        $this->assertIsNumeric($result['best_metrics']['wape']);
        $this->assertIsNumeric($result['best_metrics']['mape']);
        $this->assertFalse(is_nan($result['best_metrics']['wape']));
        $this->assertFalse(is_infinite($result['best_metrics']['wape']));
    }
}
