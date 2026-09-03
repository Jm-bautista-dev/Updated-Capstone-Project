<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use App\Services\ForecastService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SalesForecastGrowthSlopeTest extends TestCase
{
    use RefreshDatabase;

    public User $testAdmin;
    public Branch $testBranch;
    public ForecastService $forecastService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'      => 'Victoria Main Branch',
            'address'   => 'Victoria, Laguna',
            'latitude'  => 14.2250,
            'longitude' => 121.3250,
        ]);

        $this->testAdmin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->testBranch->id,
        ]);

        $this->forecastService = new ForecastService();
    }

    /**
     * Test 1 — Increasing Forecast Series
     * 1000, 1100, 1200, 1300, 1400 -> slope = +100.00/day
     */
    public function test_increasing_forecast_produces_positive_slope(): void
    {
        $forecastList = [
            ['date' => '2026-09-05', 'predicted' => 1000.00],
            ['date' => '2026-09-06', 'predicted' => 1100.00],
            ['date' => '2026-09-07', 'predicted' => 1200.00],
            ['date' => '2026-09-08', 'predicted' => 1300.00],
            ['date' => '2026-09-09', 'predicted' => 1400.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($forecastList);

        $this->assertEquals(100.00, $trend['slope']);
        $this->assertEquals('up', $trend['direction']);
        $this->assertTrue($trend['is_available']);
        $this->assertEquals(40.0, $trend['percentage']); // (1400 - 1000) / 1000 = 40%
        $this->assertStringContainsString('+₱100.00/day', $trend['formatted_slope']);
    }

    /**
     * Test 2 — Decreasing Forecast Series
     * 5000, 4800, 4600, 4400, 4200 -> slope = -200.00/day
     */
    public function test_decreasing_forecast_produces_negative_slope(): void
    {
        $forecastList = [
            ['date' => '2026-09-05', 'predicted' => 5000.00],
            ['date' => '2026-09-06', 'predicted' => 4800.00],
            ['date' => '2026-09-07', 'predicted' => 4600.00],
            ['date' => '2026-09-08', 'predicted' => 4400.00],
            ['date' => '2026-09-09', 'predicted' => 4200.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($forecastList);

        $this->assertEquals(-200.00, $trend['slope']);
        $this->assertEquals('down', $trend['direction']);
        $this->assertTrue($trend['is_available']);
        $this->assertEquals(-16.0, $trend['percentage']);
        $this->assertStringContainsString('₱200.00/day', $trend['formatted_slope']);
    }

    /**
     * Test 3 — Flat Forecast Series
     * 3000, 3000, 3000, 3000 -> slope = 0.00/day
     */
    public function test_flat_forecast_produces_zero_slope(): void
    {
        $forecastList = [
            ['date' => '2026-09-05', 'predicted' => 3000.00],
            ['date' => '2026-09-06', 'predicted' => 3000.00],
            ['date' => '2026-09-07', 'predicted' => 3000.00],
            ['date' => '2026-09-08', 'predicted' => 3000.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($forecastList);

        $this->assertEquals(0.00, $trend['slope']);
        $this->assertEquals('flat', $trend['direction']);
        $this->assertEquals(0.0, $trend['percentage']);
    }

    /**
     * Test 4 — Fluctuating QA Forecast Series (6574, 4471, 5238)
     * Mathematical regression: slope = -668.00/day
     */
    public function test_fluctuating_qa_forecast_series_produces_exact_regression_slope(): void
    {
        $forecastList = [
            ['date' => '2026-09-05', 'predicted' => 6574.00],
            ['date' => '2026-09-06', 'predicted' => 4471.00],
            ['date' => '2026-09-07', 'predicted' => 5238.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($forecastList);

        $this->assertEquals(-668.00, $trend['slope']);
        $this->assertEquals('down', $trend['direction']);
        $this->assertTrue($trend['is_available']);
        $this->assertEquals(3, $trend['points_used']);
    }

    /**
     * Test 5 — Decimal Precision Preservation
     */
    public function test_decimal_forecast_precision_preserved_during_calculation(): void
    {
        $forecastList = [
            ['date' => '2026-09-05', 'predicted' => 6574.438],
            ['date' => '2026-09-06', 'predicted' => 4471.284],
            ['date' => '2026-09-07', 'predicted' => 5238.917],
        ];

        $rawValues = [6574.438, 4471.284, 5238.917];

        $trend = $this->forecastService->calculateGrowthSlope($forecastList, $rawValues);

        $expectedSlope = (5238.917 - 6574.438) / 2; // -667.7605
        $this->assertEquals(round($expectedSlope, 2), $trend['slope']);
        $this->assertEquals($expectedSlope, $trend['raw_slope']);
    }

    /**
     * Test 6 — Insufficient or Single Forecast Point Handled Safely
     */
    public function test_insufficient_forecast_points_handled_safely(): void
    {
        $singlePoint = [
            ['date' => '2026-09-05', 'predicted' => 5000.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($singlePoint);

        $this->assertEquals(0.00, $trend['slope']);
        $this->assertFalse($trend['is_available']);
        $this->assertEquals('INSUFFICIENT_DATA', $trend['method']);
    }

    /**
     * Test 7 — Two-Point Linear Slope
     * 1000, 1500 -> slope = +500.00/day
     */
    public function test_two_points_forecast_slope(): void
    {
        $twoPoints = [
            ['date' => '2026-09-05', 'predicted' => 1000.00],
            ['date' => '2026-09-06', 'predicted' => 1500.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($twoPoints);

        $this->assertEquals(500.00, $trend['slope']);
        $this->assertEquals('up', $trend['direction']);
        $this->assertEquals(50.0, $trend['percentage']);
    }

    /**
     * Test 8 — Shuffled Dates Sorted Chronologically
     */
    public function test_shuffled_dates_sorted_chronologically_before_regression(): void
    {
        $shuffled = [
            ['date' => '2026-09-08', 'predicted' => 1300.00],
            ['date' => '2026-09-05', 'predicted' => 1000.00],
            ['date' => '2026-09-07', 'predicted' => 1200.00],
            ['date' => '2026-09-06', 'predicted' => 1100.00],
        ];

        $trend = $this->forecastService->calculateGrowthSlope($shuffled);

        $this->assertEquals(100.00, $trend['slope']);
        $this->assertEquals('up', $trend['direction']);
    }

    /**
     * Test 9 — Full Controller Integration on /analytics/sales-forecast
     */
    public function test_sales_forecast_page_receives_growth_slope_and_trend_props(): void
    {
        // Seed 14 days of realistic sales history
        $startDate = Carbon::now()->subDays(14)->startOfDay();
        for ($i = 0; $i < 14; $i++) {
            $date = $startDate->copy()->addDays($i);
            DB::table('sales')->insert([
                'order_number'   => 'ORD-FC-' . $i,
                'branch_id'      => $this->testBranch->id,
                'user_id'        => $this->testAdmin->id,
                'subtotal'       => 5000 + ($i * 100),
                'total'          => 5000 + ($i * 100),
                'cost_total'     => 2000,
                'profit'         => 3000 + ($i * 100),
                'paid_amount'    => 5000 + ($i * 100),
                'change_amount'  => 0,
                'status'         => 'completed',
                'payment_method' => 'cash',
                'type'           => 'dine-in',
                'created_at'     => $date->toDateTimeString(),
                'updated_at'     => $date->toDateTimeString(),
            ]);
        }

        $response = $this->actingAs($this->testAdmin)->get('/analytics/sales-forecast');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Analytics/SalesForecast')
            ->has('forecast')
            ->has('trend')
            ->has('growth_slope')
            ->whereNot('trend.slope', null)
        );
    }

    /**
     * Test 10 — /analytics/sales Redirects to /analytics/sales-forecast
     */
    public function test_analytics_sales_redirects_to_sales_forecast(): void
    {
        $response = $this->actingAs($this->testAdmin)->get('/analytics/sales');

        $response->assertRedirect('/analytics/sales-forecast');
    }
}
