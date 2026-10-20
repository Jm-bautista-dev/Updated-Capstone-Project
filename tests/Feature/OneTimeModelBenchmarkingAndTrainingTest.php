<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\ForecastBenchmark;
use App\Models\ForecastModel;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Sale;
use App\Models\User;
use App\Services\ForecastService;
use App\Services\RestockService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OneTimeModelBenchmarkingAndTrainingTest extends TestCase
{
    use RefreshDatabase;

    public Branch $testBranch;
    public User $testAdmin;
    public User $testCashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'      => 'Victoria Main',
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

        $this->testCashier = User::factory()->create([
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->testBranch->id,
        ]);
    }

    private function seedSalesHistory(int $days = 120, float $baseAmount = 5000.00): void
    {
        $startDate = Carbon::today()->subDays($days - 1);
        for ($i = 0; $i < $days; $i++) {
            $date = $startDate->copy()->addDays($i)->setTime(12, 0, 0);
            $amount = $baseAmount + ($i * 10); // Predictable trend

            DB::table('sales')->insert([
                'order_number'   => 'ORD-BENCH-' . $i,
                'branch_id'      => $this->testBranch->id,
                'user_id'        => $this->testAdmin->id,
                'subtotal'       => $amount,
                'total'          => $amount,
                'cost_total'     => $amount * 0.4,
                'profit'         => $amount * 0.6,
                'paid_amount'    => $amount,
                'change_amount'  => 0,
                'status'         => 'completed',
                'payment_method' => 'cash',
                'type'           => 'dine-in',
                'created_at'     => $date->toDateTimeString(),
                'updated_at'     => $date->toDateTimeString(),
            ]);
        }
    }

    /**
     * Requirement 1: The initial benchmark can run and persist its actual results.
     */
    public function test_01_initial_benchmark_runs_and_persists_actual_results(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();

        $result = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $this->assertArrayNotHasKey('error', $result);
        $this->assertTrue($result['is_benchmarked']);
        $this->assertEquals('MODEL_READY', $result['lifecycle_status']);
        $this->assertNotEmpty($result['best_model']);
        $this->assertCount(6, $result['rankings']);

        // Verify persistence in database
        $this->assertDatabaseHas('forecast_benchmarks', [
            'branch_id'         => $this->testBranch->id,
            'status'            => 'completed',
            'recommended_model' => $result['best_model'],
            'experiment_number' => 1,
        ]);

        $this->assertDatabaseHas('forecast_models', [
            'branch_id'  => $this->testBranch->id,
            'model_name' => $result['best_model'],
            'version'    => 1,
            'is_active'  => true,
            'status'     => 'ready',
        ]);
    }

    /**
     * Requirement 2: The selected model is determined by the configured selection rule (lowest out-of-sample WAPE).
     */
    public function test_02_selected_model_is_determined_by_lowest_wape_selection_rule(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();

        $result = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $rankings = $result['rankings'];
        $this->assertNotEmpty($rankings);

        // Verify rank 1 is sorted by lowest WAPE
        $wapeValues = array_column($rankings, 'wape');
        $minWape = min($wapeValues);

        $this->assertEquals(1, $rankings[0]['rank']);
        $this->assertEquals($minWape, $rankings[0]['wape']);
        $this->assertEquals($rankings[0]['model'], $result['best_model']);

        $benchmarkRecord = ForecastBenchmark::where('branch_id', $this->testBranch->id)->first();
        $this->assertEquals($rankings[0]['model'], $benchmarkRecord->recommended_model);
        $this->assertEquals('WAPE', $benchmarkRecord->selection_metric);
    }

    /**
     * Requirement 3: Final training runs only for the selected model family and configuration.
     */
    public function test_03_final_training_fits_only_the_selected_model_family(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();

        $result = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);
        $winningModelName = $result['best_model'];

        $activeModel = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertNotNull($activeModel);
        $this->assertEquals($winningModelName, $activeModel->model_name);
        $this->assertEquals(1, $activeModel->version);
        $this->assertTrue($activeModel->is_active);
        $this->assertEquals('ready', $activeModel->status);

        // Verify fitted parameters and hyperparameters are non-empty
        $this->assertIsArray($activeModel->fitted_parameters);
        $this->assertIsArray($activeModel->hyperparameters);
        $this->assertNotEmpty($activeModel->fitted_parameters);
    }

    /**
     * Requirement 4: Opening or refreshing the benchmark page does not rerun benchmarking.
     */
    public function test_04_opening_or_refreshing_benchmark_page_does_not_rerun_benchmarking(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $initialBenchmarkCount = ForecastBenchmark::count();
        $initialModelCount     = ForecastModel::count();
        $this->assertEquals(1, $initialBenchmarkCount);
        $this->assertEquals(1, $initialModelCount);

        // Simulate visiting the benchmark page 5 times
        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($this->testAdmin)
                ->get("/analytics/forecast-benchmarking?branch_id={$this->testBranch->id}");
            $response->assertStatus(200);
            $response->assertInertia(fn (Assert $page) => $page
                ->component('Analytics/ForecastBenchmarking')
                ->where('benchmark.lifecycle_status', fn ($status) => $status === 'MODEL_READY')
                ->where('benchmark.is_benchmarked', true)
            );
        }

        // Assert no new rows were created
        $this->assertEquals(1, ForecastBenchmark::count());
        $this->assertEquals(1, ForecastModel::count());
    }

    /**
     * Requirement 5: Generating a forecast does not rerun benchmarking.
     */
    public function test_05_generating_a_forecast_does_not_rerun_benchmarking(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $initialBenchmarkCount = ForecastBenchmark::count();
        $initialModelCount     = ForecastModel::count();

        // Generate forecasts multiple times
        $f1 = $service->generate(7, $this->testBranch->id);
        $f2 = $service->generate(14, $this->testBranch->id);
        $f3 = $service->generate(30, $this->testBranch->id);

        $this->assertArrayHasKey('forecast', $f1);
        $this->assertArrayHasKey('forecast', $f2);
        $this->assertArrayHasKey('forecast', $f3);

        // Ensure database benchmark count has not increased
        $this->assertEquals($initialBenchmarkCount, ForecastBenchmark::count());
        $this->assertEquals($initialModelCount, ForecastModel::count());
    }

    /**
     * Requirement 6: Changing forecast display filters does not rerun benchmarking.
     */
    public function test_06_changing_forecast_display_filters_does_not_rerun_benchmarking(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $benchmarkCountBefore = ForecastBenchmark::count();

        // Request sales forecast page with different days horizons
        $this->actingAs($this->testAdmin)->get("/analytics/sales-forecast?days=7&branch_id={$this->testBranch->id}")->assertStatus(200);
        $this->actingAs($this->testAdmin)->get("/analytics/sales-forecast?days=14&branch_id={$this->testBranch->id}")->assertStatus(200);
        $this->actingAs($this->testAdmin)->get("/analytics/sales-forecast?days=30&branch_id={$this->testBranch->id}")->assertStatus(200);

        $this->assertEquals($benchmarkCountBefore, ForecastBenchmark::count());
    }

    /**
     * Requirement 7: A routine retraining run does not benchmark candidate models.
     */
    public function test_07_routine_retraining_fits_only_active_model_without_candidate_benchmarking(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $initialBenchmarkCount = ForecastBenchmark::count();
        $activeModelBefore     = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertEquals(1, $activeModelBefore->version);

        // Add 10 new days of sales history
        $lastDate = Carbon::today();
        for ($i = 1; $i <= 10; $i++) {
            $d = $lastDate->copy()->addDays($i);
            DB::table('sales')->insert([
                'order_number'   => 'ORD-NEW-' . $i,
                'branch_id'      => $this->testBranch->id,
                'user_id'        => $this->testAdmin->id,
                'total'          => 7000.00,
                'paid_amount'    => 7000.00,
                'change_amount'  => 0,
                'status'         => 'completed',
                'payment_method' => 'cash',
                'type'           => 'dine-in',
                'created_at'     => $d->toDateTimeString(),
                'updated_at'     => $d->toDateTimeString(),
            ]);
        }

        // Trigger routine retraining
        $retrainResult = $service->retrainActiveModel($this->testBranch->id, $this->testAdmin->id);

        $this->assertTrue($retrainResult['success']);
        $this->assertEquals(2, $retrainResult['version']);
        $this->assertEquals($activeModelBefore->model_name, $retrainResult['model_name']);

        // Assert Candidate Benchmarks WERE NOT rerun
        $this->assertEquals($initialBenchmarkCount, ForecastBenchmark::count());

        // Assert new active model version deployed
        $newActiveModel = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertEquals(2, $newActiveModel->version);
        $this->assertEquals($activeModelBefore->model_name, $newActiveModel->model_name);
        $this->assertTrue($newActiveModel->is_active);

        // Assert previous version was archived
        $previousModel = ForecastModel::where('branch_id', $this->testBranch->id)->where('version', 1)->first();
        $this->assertFalse($previousModel->is_active);
    }

    /**
     * Requirement 8: An interrupted or failed initial benchmark can be safely retried.
     */
    public function test_08_failed_or_interrupted_initial_benchmark_can_be_safely_retried(): void
    {
        // First attempt with only 1 day of sales -> fails gracefully
        $this->seedSalesHistory(1);
        $service = new ForecastService();

        $failedResult = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);
        $this->assertArrayHasKey('error', $failedResult);
        $this->assertNull(ForecastModel::getActiveModel($this->testBranch->id));

        // Now provide sufficient data and retry
        $this->seedSalesHistory(120);
        $successResult = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $this->assertArrayNotHasKey('error', $successResult);
        $this->assertEquals('MODEL_READY', $successResult['lifecycle_status']);
        $this->assertNotNull(ForecastModel::getActiveModel($this->testBranch->id));
    }

    /**
     * Requirement 9: Failed retraining does not replace the previous active model.
     */
    public function test_09_failed_retraining_preserves_previous_active_model(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $activeModelBefore = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertEquals(1, $activeModelBefore->version);

        // If training lock is held or retraining fails, previous active model stays active
        $trainLockKey = "forecast_train_lock_{$this->testBranch->id}";
        Cache::put($trainLockKey, true, 60);

        $retrainResult = $service->retrainActiveModel($this->testBranch->id, $this->testAdmin->id);
        $this->assertArrayHasKey('error', $retrainResult);

        // Check active model is still intact
        $activeModelAfter = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertEquals($activeModelBefore->id, $activeModelAfter->id);
        $this->assertTrue($activeModelAfter->is_active);
        $this->assertEquals(1, $activeModelAfter->version);

        Cache::forget($trainLockKey);
    }

    /**
     * Requirement 10: Restarting the application does not erase the selected model or saved benchmark records.
     */
    public function test_10_restarting_application_preserves_selected_model_and_saved_benchmark(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $modelBefore = ForecastModel::getActiveModel($this->testBranch->id);

        // Simulate complete application restart & cache flush
        Cache::flush();
        $freshService = new ForecastService();

        $state = $freshService->getBenchmarkState($this->testBranch->id);
        $this->assertEquals('MODEL_READY', $state['lifecycle_status']);
        $this->assertTrue($state['is_benchmarked']);
        $this->assertEquals($modelBefore->model_name, $state['best_model']);
        $this->assertEquals($modelBefore->version, $state['active_model']['version']);

        $activeModel = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertNotNull($activeModel);
        $this->assertEquals($modelBefore->id, $activeModel->id);
    }

    /**
     * Requirement 11: Repeated requests cannot accidentally create multiple initial benchmark jobs.
     */
    public function test_11_repeated_requests_cannot_create_duplicate_jobs(): void
    {
        $this->seedSalesHistory(120);
        $lockKey = "forecast_benchmark_lock_{$this->testBranch->id}";
        Cache::put($lockKey, true, 120);

        $service = new ForecastService();
        $res = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $this->assertArrayHasKey('error', $res);
        $this->assertStringContainsString('job is currently in progress', $res['error']);

        Cache::forget($lockKey);
    }

    /**
     * Requirement 12: Manual rebenchmarking creates a separate experiment and preserves previous results.
     */
    public function test_12_manual_rebenchmarking_creates_separate_experiment_and_preserves_history(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();

        // 1. Initial experiment
        $res1 = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id, false);
        $this->assertEquals(1, $res1['experiment_number']);
        $this->assertEquals(1, ForecastBenchmark::count());

        // 2. Manual Re-benchmark Experiment (authorized exception)
        $res2 = $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id, true);
        $this->assertEquals(2, $res2['experiment_number']);

        // Assert both experiments exist in database
        $this->assertEquals(2, ForecastBenchmark::count());
        $exp1 = ForecastBenchmark::where('experiment_number', 1)->first();
        $exp2 = ForecastBenchmark::where('experiment_number', 2)->first();

        $this->assertNotNull($exp1);
        $this->assertNotNull($exp2);

        // New active model deployed with incremented version
        $activeModel = ForecastModel::getActiveModel($this->testBranch->id);
        $this->assertEquals(2, $activeModel->version);
    }

    /**
     * Requirement 13: The active model version can be identified for subsequent forecasts.
     */
    public function test_13_subsequent_forecasts_identify_active_model_version(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $forecast = $service->generate(14, $this->testBranch->id);

        $this->assertArrayHasKey('model_version', $forecast);
        $this->assertArrayHasKey('model_name', $forecast);
        $this->assertArrayHasKey('trained_at', $forecast);
        $this->assertEquals(1, $forecast['model_version']);
    }

    /**
     * Requirement 14: Existing forecast generation and analytics continue to work.
     */
    public function test_14_existing_forecast_generation_and_analytics_continue_to_work(): void
    {
        $this->seedSalesHistory(120);
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);

        $forecast = $service->generate(7, $this->testBranch->id);

        $this->assertArrayHasKey('forecast', $forecast);
        $this->assertArrayHasKey('historical', $forecast);
        $this->assertArrayHasKey('trend', $forecast);
        $this->assertArrayHasKey('growth_slope', $forecast);
        $this->assertArrayHasKey('prediction', $forecast);
        $this->assertArrayHasKey('insights', $forecast);
        $this->assertCount(7, $forecast['forecast']);
    }

    /**
     * Requirement 15: Unauthorized users cannot train models or change the active model.
     */
    public function test_15_unauthorized_users_cannot_train_or_change_model(): void
    {
        $this->seedSalesHistory(120);

        // 1. Unauthenticated user
        $this->post('/analytics/forecast-benchmarking/run', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/login');
        $this->post('/analytics/forecast-benchmarking/retrain', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/login');
        $this->post('/analytics/forecast-benchmarking/experiment', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/login');

        // 2. Cashier role (non-admin)
        $this->actingAs($this->testCashier)
            ->post('/analytics/forecast-benchmarking/run', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/pos');
        $this->actingAs($this->testCashier)
            ->post('/analytics/forecast-benchmarking/retrain', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/pos');
        $this->actingAs($this->testCashier)
            ->post('/analytics/forecast-benchmarking/experiment', ['branch_id' => $this->testBranch->id])
            ->assertRedirect('/pos');
    }

    /**
     * Requirement 16: Historical business and inventory data remain unchanged by benchmarking and training.
     */
    public function test_16_historical_business_and_inventory_data_remain_unchanged(): void
    {
        $this->seedSalesHistory(120);

        // Seed inventory
        $ingredient = Ingredient::create([
            'name'           => 'Salmon Slice',
            'unit'           => 'g',
            'cost_per_unit'  => 0.85,
            'reorder_level'  => 500,
            'category'       => 'fish',
            'is_active'      => true,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->testBranch->id],
            ['quantity' => 2500, 'ideal_quantity' => 5000]
        );

        $salesCountBefore    = DB::table('sales')->count();
        $salesSumBefore      = DB::table('sales')->sum('total');
        $inventoryQtyBefore  = DB::table('ingredient_stocks')->sum('quantity');

        // Execute benchmarking, retraining, and forecasting
        $service = new ForecastService();
        $service->runInitialBenchmark($this->testBranch->id, $this->testAdmin->id);
        $service->retrainActiveModel($this->testBranch->id, $this->testAdmin->id);
        $service->generate(14, $this->testBranch->id);

        $salesCountAfter   = DB::table('sales')->count();
        $salesSumAfter     = DB::table('sales')->sum('total');
        $inventoryQtyAfter = DB::table('ingredient_stocks')->sum('quantity');

        $this->assertEquals($salesCountBefore, $salesCountAfter);
        $this->assertEquals($salesSumBefore, $salesSumAfter);
        $this->assertEquals($inventoryQtyBefore, $inventoryQtyAfter);
    }
}
