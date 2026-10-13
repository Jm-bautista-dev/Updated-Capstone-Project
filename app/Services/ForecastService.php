<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\ForecastBenchmark;
use App\Models\ForecastModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ForecastService
{
    /**
     * Get the durable benchmarking and active model state without computing.
     * This is used when opening pages, refreshing, or querying status.
     */
    public function getBenchmarkState(?int $branchId): array
    {
        $branchKey = $branchId ?? 'all';
        $isBenchmarkLocked = Cache::has("forecast_benchmark_lock_{$branchKey}");
        $isTrainingLocked  = Cache::has("forecast_train_lock_{$branchKey}");

        // Fetch active model for the branch
        $activeModel = ForecastModel::getActiveModel($branchId);

        // Fetch latest completed benchmark for the branch
        $benchmark = ForecastBenchmark::where(function ($q) use ($branchId) {
            if ($branchId && $branchId !== 0) {
                $q->where('branch_id', $branchId);
            } else {
                $q->whereNull('branch_id')->orWhere('branch_id', 0);
            }
        })
        ->where('status', 'completed')
        ->latest('id')
        ->first();

        // 1. Stage: Not Yet Benchmarked
        if (!$benchmark) {
            return [
                'lifecycle_status'   => $isBenchmarkLocked ? 'BENCHMARK_RUNNING' : 'NOT_BENCHMARKED',
                'status'             => 'not_benchmarked',
                'is_benchmarked'     => false,
                'is_locked'          => $isBenchmarkLocked || $isTrainingLocked,
                'message'            => 'Initial model selection has not yet been completed. Run the initial benchmark to evaluate candidate models and deploy the winning model.',
                'active_model'       => null,
                'best_model'         => null,
                'dataset_range'      => null,
                'total_transactions' => DB::table('sales')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->count(),
                'rankings'           => [],
                'val_dates'          => [],
                'val_actuals'        => [],
                'val_predictions'    => [],
                'validation'         => null,
            ];
        }

        // 2. Stage: Benchmarked / Active Model Available
        $lifecycleStatus = 'MODEL_SELECTED';
        if ($isBenchmarkLocked) {
            $lifecycleStatus = 'BENCHMARK_RUNNING';
        } elseif ($isTrainingLocked) {
            $lifecycleStatus = 'RETRAINING';
        } elseif ($activeModel && $activeModel->status === 'ready') {
            $lifecycleStatus = 'MODEL_READY';
        }

        $formatted = $this->formatBenchmarkRecord($benchmark, $branchId);
        $formatted['lifecycle_status'] = $lifecycleStatus;
        $formatted['is_locked']        = $isBenchmarkLocked || $isTrainingLocked;
        $formatted['active_model']     = $activeModel ? [
            'id'                 => $activeModel->id,
            'model_name'         => $activeModel->model_name,
            'version'            => $activeModel->version,
            'status'             => $activeModel->status,
            'is_active'          => $activeModel->is_active,
            'selection_metric'   => $activeModel->selection_metric,
            'evaluation_metrics' => $activeModel->evaluation_metrics,
            'fitted_parameters'  => $activeModel->fitted_parameters,
            'hyperparameters'    => $activeModel->hyperparameters,
            'dataset_range'      => $activeModel->dataset_range,
            'training_points'    => $activeModel->training_points,
            'trained_at'         => $activeModel->trained_at?->toIso8601String(),
            'trained_by_name'    => $activeModel->trainedBy?->name ?? 'System',
        ] : null;

        return $formatted;
    }

    /**
     * Benchmark access: loads persisted benchmark without recomputing unless $force = true or none exists.
     */
    public function benchmark(?int $branchId, bool $force = false): array
    {
        if (!$force) {
            $existing = ForecastBenchmark::where(function ($q) use ($branchId) {
                if ($branchId && $branchId !== 0) {
                    $q->where('branch_id', $branchId);
                } else {
                    $q->whereNull('branch_id')->orWhere('branch_id', 0);
                }
            })
            ->where('status', 'completed')
            ->latest('id')
            ->first();

            if ($existing) {
                return $this->formatBenchmarkRecord($existing, $branchId);
            }
        }

        // If no benchmark exists or force rebenchmarking is requested, execute the initial benchmark
        return $this->runInitialBenchmark($branchId, Auth::id(), $force);
    }

    /**
     * Execute initial benchmarking across candidate models.
     * Evaluates candidates, selects the winning model (lowest out-of-sample WAPE),
     * trains that winning model family, and persists fitted parameters into the durable model registry.
     */
    public function runInitialBenchmark(?int $branchId, ?int $userId = null, bool $forceNewExperiment = false): array
    {
        $branchKey = $branchId ?? 'all';
        $lockKey = "forecast_benchmark_lock_{$branchKey}";

        // Concurrency lock: prevent duplicate jobs running concurrently
        if (!Cache::add($lockKey, true, 120)) {
            return [
                'error' => 'A model benchmarking or training job is currently in progress. Please wait for it to complete.',
            ];
        }

        try {
            $startTime = microtime(true);

            // 1. Fetch raw daily sales totals
            $rawRows = DB::table('sales')
                ->where('status', 'completed')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as daily_total')
                )
                ->when($branchId && $branchId !== 0, fn($q) => $q->where('branch_id', $branchId))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            if ($rawRows->isEmpty()) {
                return ['error' => 'No sales data found. Please record at least one completed sale.'];
            }

            // 2. Fill in missing dates (zero-sales days)
            $series = $this->fillMissingDates($rawRows);
            $totalDays = count($series);

            if ($totalDays < 2) {
                return [
                    'error'   => 'Not enough sales data yet. At least 2 days of sales history is required.',
                    'quality' => [
                        'total_days'   => $totalDays,
                        'missing_days' => 0,
                        'duplicates'   => 0,
                        'outliers'     => 0,
                        'completeness' => 100,
                        'status'       => 'Poor',
                    ],
                ];
            }

            // 3. Outlier/Anomaly detection (IQR method)
            $anomalies = $this->detectAnomalies($series);

            // 4. Data Quality indicators
            $missingDaysCount = collect($series)->where('total', 0.0)->count();
            $completenessPct = $totalDays > 0 ? round((($totalDays - $missingDaysCount) / $totalDays) * 100, 1) : 0;
            $dataQuality = [
                'total_days'     => $totalDays,
                'missing_days'   => $missingDaysCount,
                'duplicates'     => 0,
                'outliers'       => count($anomalies),
                'completeness'   => $completenessPct,
                'anomalies_list' => $anomalies,
                'status'         => $completenessPct >= 80 ? 'Good' : ($completenessPct >= 50 ? 'Fair' : 'Poor'),
            ];

            // 5. Time-Series Split (Walk-Forward Chronological Validation Set)
            $validationSize = $totalDays >= 28 ? 14 : ($totalDays >= 14 ? 7 : ($totalDays >= 6 ? 3 : max(1, (int) floor($totalDays / 2))));
            $validationSize = min($validationSize, $totalDays - 1);

            $trainSet = array_slice($series, 0, $totalDays - $validationSize);
            $valSet   = array_slice($series, $totalDays - $validationSize);

            // 6. Evaluate all 6 candidate forecasting models on out-of-sample validation set
            $models = [
                'Moving Average'               => $this->fitPredictMA($trainSet, $validationSize),
                'Weighted Moving Average'      => $this->fitPredictWMA($trainSet, $validationSize),
                'Simple Exponential Smoothing' => $this->fitPredictSES($trainSet, $validationSize),
                'Holt Linear Trend'            => $this->fitPredictHolt($trainSet, $validationSize),
                'Holt-Winters Seasonal'        => $this->fitPredictHoltWinters($trainSet, $validationSize),
                'Linear Regression'            => $this->fitPredictLR($trainSet, $validationSize),
            ];

            // 7. Calculate evaluation metrics per model
            $rankings = [];
            foreach ($models as $name => $preds) {
                $metrics = $this->calculateMetrics($valSet, $preds);
                $rankings[] = array_merge(['model' => $name], $metrics);
            }

            // Sort rankings by lowest WAPE, tie-breaker MAE, then RMSE, then MAPE, then model name
            usort($rankings, function ($a, $b) {
                if ($a['wape'] != $b['wape']) {
                    return $a['wape'] <=> $b['wape'];
                }
                if ($a['mae'] != $b['mae']) {
                    return $a['mae'] <=> $b['mae'];
                }
                if ($a['rmse'] != $b['rmse']) {
                    return $a['rmse'] <=> $b['rmse'];
                }
                if ($a['mape'] != $b['mape']) {
                    return $a['mape'] <=> $b['mape'];
                }
                return strcmp($a['model'], $b['model']);
            });

            // Set rank indices and visual scores
            foreach ($rankings as $idx => &$item) {
                $item['rank']  = $idx + 1;
                $wape          = $item['wape'];
                $item['score'] = $wape < 15 ? 5 : ($wape < 25 ? 4 : ($wape < 35 ? 3 : ($wape < 50 ? 2 : 1)));
            }
            unset($item);

            $bestModel      = $rankings[0];
            $processingTime = round(microtime(true) - $startTime, 4);
            $rangeStr       = $series[0]['date'] . ' to ' . end($series)['date'];
            $startDate      = $series[0]['date'];
            $endDate        = end($series)['date'];

            // 8. Explicit Model Validation Gates for Production-Readiness
            $minHistoryDays   = (int) config('forecast.min_history_days', 90);
            $maxMapeThreshold = (float) config('forecast.max_mape', 20.0);
            $maxWapeThreshold = (float) config('forecast.max_wape', 20.0);

            $bestWape = (float) ($bestModel['wape'] ?? 100.0);
            $bestMape = (float) ($bestModel['mape'] ?? 100.0);

            $isHistorySufficient = $totalDays >= $minHistoryDays;
            $isErrorAcceptable   = ($bestWape <= $maxWapeThreshold) && ($bestMape <= $maxMapeThreshold || $bestWape <= 15.0);

            if (!$isHistorySufficient) {
                $validationStatus      = 'INSUFFICIENT_DATA';
                $validationStatusLabel = 'Insufficient Data';
                $productionReady       = false;
                $validationReason      = "Historical coverage ({$totalDays} days) is below the minimum required {$minHistoryDays}-day window for production validation.";
            } elseif (!$isErrorAcceptable) {
                $validationStatus      = 'NEEDS_IMPROVEMENT';
                $validationStatusLabel = 'Needs Improvement';
                $productionReady       = false;
                $validationReason      = "Observed error (MAPE: {$bestMape}%, WAPE: {$bestWape}%) exceeds the acceptable target threshold (<= {$maxMapeThreshold}%).";
            } else {
                $validationStatus      = 'PRODUCTION_READY';
                $validationStatusLabel = 'Production Ready';
                $productionReady       = true;
                $validationReason      = "Passed all validation gates: {$totalDays} days history (>= {$minHistoryDays}d) and {$bestWape}% WAPE (<= {$maxWapeThreshold}%).";
            }

            $validation = [
                'status'               => $validationStatus,
                'status_label'         => $validationStatusLabel,
                'production_ready'     => $productionReady,
                'reason'               => $validationReason,
                'historical_days'      => $totalDays,
                'min_history_days'     => $minHistoryDays,
                'validation_days'      => $validationSize,
                'best_mape'            => $bestMape,
                'best_wape'            => $bestWape,
                'max_mape_threshold'   => $maxMapeThreshold,
                'max_wape_threshold'   => $maxWapeThreshold,
                'validation_completed' => true,
                'accuracy_definition'  => '100% - WAPE on out-of-sample walk-forward test set',
            ];

            // 9. Experiment Number incrementation
            $lastExp = ForecastBenchmark::where(function ($q) use ($branchId) {
                if ($branchId && $branchId !== 0) {
                    $q->where('branch_id', $branchId);
                } else {
                    $q->whereNull('branch_id')->orWhere('branch_id', 0);
                }
            })->max('experiment_number') ?? 0;

            $experimentNumber = $forceNewExperiment ? ($lastExp + 1) : max(1, $lastExp);

            // 10. Persist benchmark record
            $benchmarkRecord = ForecastBenchmark::create([
                'user_id'            => $userId ?? Auth::id(),
                'branch_id'          => $branchId,
                'status'             => 'completed',
                'dataset_range'      => $rangeStr,
                'dataset_start_date' => $startDate,
                'dataset_end_date'   => $endDate,
                'total_days'         => $totalDays,
                'experiment_number'  => $experimentNumber,
                'recommended_model'  => $bestModel['model'],
                'selection_metric'   => 'WAPE',
                'mae'                => $bestModel['mae'],
                'rmse'               => $bestModel['rmse'],
                'mape'               => $bestModel['mape'],
                'wape'               => $bestModel['wape'],
                'rankings_data'      => $rankings,
                'validation_data'    => [
                    'val_dates'           => array_column($valSet, 'date'),
                    'val_actuals'         => array_column($valSet, 'total'),
                    'val_predictions'     => $models,
                    'validation_metadata' => $validation,
                ],
                'processing_time'    => $processingTime,
            ]);

            // 11. Train the selected winning model family and activate it
            $activeModel = $this->trainSelectedModel(
                $branchId,
                $bestModel['model'],
                $benchmarkRecord->id,
                $userId ?? Auth::id(),
                $bestModel
            );

            // Return full result payload
            return [
                'lifecycle_status'   => 'MODEL_READY',
                'is_benchmarked'     => true,
                'dataset_range'      => $rangeStr,
                'total_transactions' => DB::table('sales')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->count(),
                'best_model'         => $bestModel['model'],
                'recommended_model'  => $bestModel['model'],
                'best_metrics'       => $bestModel,
                'rankings'           => $rankings,
                'quality'            => $dataQuality,
                'validation'         => $validation,
                'processing_time'    => $processingTime,
                'validation_method'  => 'Walk-Forward Time-Series Validation (last ' . $validationSize . ' days test set)',
                'val_actuals'        => array_column($valSet, 'total'),
                'val_dates'          => array_column($valSet, 'date'),
                'val_predictions'    => $models,
                'experiment_number'  => $experimentNumber,
                'active_model'       => [
                    'id'                 => $activeModel->id,
                    'model_name'         => $activeModel->model_name,
                    'version'            => $activeModel->version,
                    'status'             => $activeModel->status,
                    'is_active'          => $activeModel->is_active,
                    'selection_metric'   => $activeModel->selection_metric,
                    'evaluation_metrics' => $activeModel->evaluation_metrics,
                    'fitted_parameters'  => $activeModel->fitted_parameters,
                    'hyperparameters'    => $activeModel->hyperparameters,
                    'dataset_range'      => $activeModel->dataset_range,
                    'training_points'    => $activeModel->training_points,
                    'trained_at'         => $activeModel->trained_at?->toIso8601String(),
                    'trained_by_name'    => $activeModel->trainedBy?->name ?? 'System',
                ],
            ];
        } catch (\Throwable $e) {
            return [
                'error' => 'Benchmarking execution failed: ' . $e->getMessage(),
            ];
        } finally {
            Cache::forget($lockKey);
        }
    }

    /**
     * Train the selected model family and persist its fitted parameters into the durable model registry.
     * Deactivates previous model versions atomically upon success.
     */
    public function trainSelectedModel(
        ?int $branchId,
        string $modelName,
        ?int $benchmarkId = null,
        ?int $userId = null,
        ?array $evaluationMetrics = null
    ): ForecastModel {
        $branchKey = $branchId ?? 'all';
        $trainLockKey = "forecast_train_lock_{$branchKey}";
        Cache::put($trainLockKey, true, 60);

        try {
            // Fetch series for training
            $rawRows = DB::table('sales')
                ->where('status', 'completed')
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('SUM(total) as daily_total')
                )
                ->when($branchId && $branchId !== 0, fn($q) => $q->where('branch_id', $branchId))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            $series    = $this->fillMissingDates($rawRows);
            $totalDays = count($series);
            $rangeStr  = !empty($series) ? ($series[0]['date'] . ' to ' . end($series)['date']) : null;
            $startDate = !empty($series) ? $series[0]['date'] : null;
            $endDate   = !empty($series) ? end($series)['date'] : null;

            // Fit model parameters and hyperparameters based on model family
            $fitted = $this->fitModelParameters($modelName, $series);

            // Determine incremented version
            $currentVersion = ForecastModel::forBranch($branchId)->max('version') ?? 0;
            $newVersion     = $currentVersion + 1;

            return DB::transaction(function () use (
                $branchId,
                $benchmarkId,
                $modelName,
                $newVersion,
                $rangeStr,
                $startDate,
                $endDate,
                $totalDays,
                $evaluationMetrics,
                $fitted,
                $userId
            ) {
                // Deactivate any currently active models for this branch
                ForecastModel::forBranch($branchId)
                    ->where('is_active', true)
                    ->update(['is_active' => false]);

                return ForecastModel::create([
                    'branch_id'          => $branchId,
                    'benchmark_id'       => $benchmarkId,
                    'model_name'         => $modelName,
                    'version'            => $newVersion,
                    'is_active'          => true,
                    'status'             => 'ready',
                    'dataset_range'      => $rangeStr,
                    'dataset_start_date' => $startDate,
                    'dataset_end_date'   => $endDate,
                    'training_points'    => $totalDays,
                    'selection_metric'   => 'WAPE',
                    'evaluation_metrics' => $evaluationMetrics,
                    'hyperparameters'    => $fitted['hyperparameters'],
                    'fitted_parameters'  => $fitted['fitted_parameters'],
                    'trained_at'         => now(),
                    'trained_by'         => $userId ?? Auth::id(),
                ]);
            });
        } finally {
            Cache::forget($trainLockKey);
        }
    }

    /**
     * Retrain the currently active model family without evaluating competing candidates.
     * Preserves previous model if retraining fails.
     */
    public function retrainActiveModel(?int $branchId, ?int $userId = null): array
    {
        $activeModel = ForecastModel::getActiveModel($branchId);
        if (!$activeModel) {
            return [
                'error' => 'No active model found. Please run the initial benchmark before attempting routine retraining.',
            ];
        }

        $branchKey = $branchId ?? 'all';
        $trainLockKey = "forecast_train_lock_{$branchKey}";

        if (!Cache::add($trainLockKey, true, 60)) {
            return [
                'error' => 'Model retraining is already in progress. Please wait for the current job to finish.',
            ];
        }

        try {
            $newModel = $this->trainSelectedModel(
                $branchId,
                $activeModel->model_name,
                $activeModel->benchmark_id,
                $userId ?? Auth::id(),
                $activeModel->evaluation_metrics
            );

            return [
                'success'    => true,
                'message'    => "Model {$newModel->model_name} (v{$newModel->version}) retrained and deployed successfully.",
                'model_name' => $newModel->model_name,
                'version'    => $newModel->version,
                'trained_at' => $newModel->trained_at?->toIso8601String(),
            ];
        } catch (\Throwable $e) {
            // Note: DB transaction in trainSelectedModel ensures previous model remains active if training failed
            return [
                'error' => 'Model retraining failed: ' . $e->getMessage() . '. Previous active model preserved.',
            ];
        } finally {
            Cache::forget($trainLockKey);
        }
    }

    /**
     * Generate forecasts for the specified horizon using ONLY the active production model.
     * Does NOT rerun benchmarking.
     */
    public function generate(int $horizonDays, ?int $branchId): array
    {
        $rawRows = DB::table('sales')
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as daily_total')
            )
            ->when($branchId && $branchId !== 0, fn($q) => $q->where('branch_id', $branchId))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        if ($rawRows->isEmpty()) {
            return ['error' => 'No sales data found. Please record at least one completed sale.'];
        }

        $series    = $this->fillMissingDates($rawRows);
        $totalDays = count($series);

        if ($totalDays < 2) {
            return ['error' => 'Not enough sales history to generate forecast. Minimum 2 days required.'];
        }

        // 1. Retrieve the active production model
        $activeModel = ForecastModel::getActiveModel($branchId);

        // If no active model exists, auto-bootstrap initial benchmark and training once
        if (!$activeModel) {
            $benchmarkRecord = ForecastBenchmark::where(function ($q) use ($branchId) {
                if ($branchId && $branchId !== 0) {
                    $q->where('branch_id', $branchId);
                } else {
                    $q->whereNull('branch_id')->orWhere('branch_id', 0);
                }
            })->where('status', 'completed')->latest('id')->first();

            if ($benchmarkRecord) {
                $activeModel = $this->trainSelectedModel(
                    $branchId,
                    $benchmarkRecord->recommended_model,
                    $benchmarkRecord->id,
                    Auth::id(),
                    [
                        'mae'  => $benchmarkRecord->mae,
                        'rmse' => $benchmarkRecord->rmse,
                        'mape' => $benchmarkRecord->mape,
                        'wape' => $benchmarkRecord->wape,
                    ]
                );
            } else {
                $initialResult = $this->runInitialBenchmark($branchId, Auth::id(), false);
                if (isset($initialResult['error'])) {
                    return $initialResult;
                }
                $activeModel = ForecastModel::getActiveModel($branchId);
            }
        }

        if (!$activeModel) {
            return ['error' => 'Unable to initialize active forecasting model. Please run initial benchmark.'];
        }

        // 2. Generate forecasts using the selected active model family
        $modelName      = $activeModel->model_name;
        $forecastValues = $this->projectWithModel($activeModel, $series, $horizonDays);

        // Calculate prediction standard deviation for 95% confidence bands (1.96 * StdDev)
        $historicalValues = array_column($series, 'total');
        $stdDev           = $this->stdDev($historicalValues);
        $spread           = round($stdDev * 1.96, 2);

        $lastDate     = Carbon::parse(end($series)['date']);
        $forecastList = [];
        foreach ($forecastValues as $idx => $val) {
            $futureDate     = $lastDate->copy()->addDays($idx + 1);
            $pred           = round($val, 2);
            $forecastList[] = [
                'date'      => $futureDate->toDateString(),
                'predicted' => $pred,
                'lower'     => max(0.0, round($pred - $spread, 2)),
                'upper'     => round($pred + $spread, 2),
                'dow'       => $futureDate->format('D'),
            ];
        }

        // Standardized business insights
        $insights = $this->generateInsights($series, $modelName, $forecastList);

        $historicalData = [];
        foreach ($series as $row) {
            $historicalData[] = [
                'date'   => $row['date'],
                'actual' => $row['total'],
            ];
        }

        // Calculate Growth Slope using Least-Squares Linear Regression over the forecast series
        $trend = $this->calculateGrowthSlope($forecastList, $forecastValues);

        // Fetch saved benchmark state for reporting metadata
        $savedBenchmark = $this->getBenchmarkState($branchId);

        return [
            'historical'        => $historicalData,
            'forecast'          => $forecastList,
            'trend'             => $trend,
            'growth_slope'      => $trend,
            'prediction'        => $forecastList[0]['predicted'] ?? 0.0,
            'prediction_lower'  => $forecastList[0]['lower'] ?? 0.0,
            'prediction_upper'  => $forecastList[0]['upper'] ?? 0.0,
            'confidence'        => $savedBenchmark['best_metrics']['accuracy'] ?? ($activeModel->evaluation_metrics['accuracy'] ?? 0),
            'recommended_model' => $modelName,
            'model_name'        => $modelName,
            'model_version'     => $activeModel->version,
            'trained_at'        => $activeModel->trained_at?->toIso8601String(),
            'benchmark'         => $savedBenchmark,
            'validation'        => $savedBenchmark['validation'] ?? null,
            'insights'          => $insights,
        ];
    }

    /**
     * Project forward using the fitted active model parameters.
     */
    private function projectWithModel(ForecastModel $model, array $series, int $horizon): array
    {
        $modelName = $model->model_name;

        switch ($modelName) {
            case 'Moving Average':
                return $this->fitPredictMA($series, $horizon);
            case 'Weighted Moving Average':
                return $this->fitPredictWMA($series, $horizon);
            case 'Simple Exponential Smoothing':
                $alpha = (float) ($model->hyperparameters['alpha'] ?? 0.3);
                return $this->fitPredictSES($series, $horizon, $alpha);
            case 'Holt Linear Trend':
                $alpha = (float) ($model->hyperparameters['alpha'] ?? 0.3);
                $beta  = (float) ($model->hyperparameters['beta'] ?? 0.1);
                $phi   = (float) ($model->hyperparameters['phi'] ?? 0.85);
                return $this->fitPredictHolt($series, $horizon, $alpha, $beta, $phi);
            case 'Holt-Winters Seasonal':
                $alpha = (float) ($model->hyperparameters['alpha'] ?? 0.3);
                $beta  = (float) ($model->hyperparameters['beta'] ?? 0.1);
                $gamma = (float) ($model->hyperparameters['gamma'] ?? 0.2);
                $phi   = (float) ($model->hyperparameters['phi'] ?? 0.85);
                return $this->fitPredictHoltWinters($series, $horizon, $alpha, $beta, $gamma, $phi);
            case 'Linear Regression':
            default:
                return $this->fitPredictLR($series, $horizon);
        }
    }

    /**
     * Compute and extract fitted parameters and hyperparameters for model persistence.
     */
    private function fitModelParameters(string $modelName, array $series): array
    {
        $history = array_column($series, 'total');
        $n       = count($history);

        switch ($modelName) {
            case 'Moving Average':
                $window = 7;
                $slice  = array_slice($history, -$window);
                $level  = count($slice) > 0 ? array_sum($slice) / count($slice) : 0.0;
                return [
                    'hyperparameters'   => ['window' => $window],
                    'fitted_parameters' => ['level' => round($level, 2), 'window_points' => count($slice)],
                ];

            case 'Weighted Moving Average':
                $window = 7;
                $slice  = array_slice($history, -$window);
                $denom  = array_sum(range(1, $window));
                $sum    = 0.0;
                foreach ($slice as $idx => $val) {
                    $sum += ($idx + 1) * $val;
                }
                $level = count($slice) > 0 ? $sum / $denom : 0.0;
                return [
                    'hyperparameters'   => ['window' => $window, 'weights' => range(1, $window)],
                    'fitted_parameters' => ['level' => round($level, 2), 'window_points' => count($slice)],
                ];

            case 'Simple Exponential Smoothing':
                $alpha = 0.3;
                $level = $n > 0 ? $history[0] : 0.0;
                for ($i = 1; $i < $n; $i++) {
                    $level = $alpha * $history[$i] + (1 - $alpha) * $level;
                }
                return [
                    'hyperparameters'   => ['alpha' => $alpha],
                    'fitted_parameters' => ['level' => round($level, 2)],
                ];

            case 'Holt Linear Trend':
                $alpha = 0.3;
                $beta  = 0.1;
                $phi   = 0.85;
                if ($n < 2) {
                    return [
                        'hyperparameters'   => ['alpha' => $alpha, 'beta' => $beta, 'phi' => $phi],
                        'fitted_parameters' => ['level' => $n > 0 ? $history[0] : 0.0, 'trend' => 0.0],
                    ];
                }
                $meanHistory = array_sum($history) / $n;
                $level       = $history[0];
                $trend       = ($history[$n - 1] - $history[0]) / ($n - 1);

                for ($i = 1; $i < $n; $i++) {
                    $lastLevel     = $level;
                    $level         = $alpha * $history[$i] + (1 - $alpha) * ($level + $phi * $trend);
                    $trend         = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;
                    $maxTrendDelta = $meanHistory * 0.05;
                    $trend         = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
                }
                return [
                    'hyperparameters'   => ['alpha' => $alpha, 'beta' => $beta, 'phi' => $phi],
                    'fitted_parameters' => ['level' => round($level, 2), 'trend' => round($trend, 4), 'mean' => round($meanHistory, 2)],
                ];

            case 'Holt-Winters Seasonal':
                $alpha = 0.3;
                $beta  = 0.1;
                $gamma = 0.2;
                $phi   = 0.85;
                $m     = 7;

                if ($n < $m * 2) {
                    $holt = $this->fitModelParameters('Holt Linear Trend', $series);
                    $holt['hyperparameters']['gamma'] = $gamma;
                    return $holt;
                }

                $meanHistory = array_sum($history) / $n;
                $level       = array_sum(array_slice($history, 0, $m)) / $m;
                $trend       = 0.0;
                $seasonal    = [];
                for ($i = 0; $i < $m; $i++) {
                    $seasonal[$i] = $history[$i] - $level;
                }

                for ($i = $m; $i < $n; $i++) {
                    $lastLevel     = $level;
                    $y             = $history[$i];
                    $sIdx          = $i % $m;
                    $level         = $alpha * ($y - $seasonal[$sIdx]) + (1 - $alpha) * ($level + $phi * $trend);
                    $trend         = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;
                    $seasonal[$sIdx] = $gamma * ($y - $level) + (1 - $gamma) * $seasonal[$sIdx];
                    $maxTrendDelta = $meanHistory * 0.05;
                    $trend         = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
                }

                return [
                    'hyperparameters'   => ['alpha' => $alpha, 'beta' => $beta, 'gamma' => $gamma, 'phi' => $phi, 'period' => $m],
                    'fitted_parameters' => [
                        'level'    => round($level, 2),
                        'trend'    => round($trend, 4),
                        'seasonal' => array_map(fn($v) => round($v, 2), $seasonal),
                        'mean'     => round($meanHistory, 2),
                    ],
                ];

            case 'Linear Regression':
            default:
                if ($n === 0) {
                    return [
                        'hyperparameters'   => ['method' => 'OLS'],
                        'fitted_parameters' => ['slope' => 0.0, 'intercept' => 0.0, 'points' => 0],
                    ];
                }
                $sumX = $sumY = $sumXX = $sumXY = 0.0;
                for ($i = 0; $i < $n; $i++) {
                    $x = $i + 1;
                    $y = $history[$i];
                    $sumX  += $x;
                    $sumY  += $y;
                    $sumXX += $x * $x;
                    $sumXY += $x * $y;
                }
                $denom = ($n * $sumXX) - ($sumX * $sumX);
                $m     = $denom != 0 ? (($n * $sumXY) - ($sumX * $sumY)) / $denom : 0.0;
                $b     = ($sumY - ($m * $sumX)) / $n;

                return [
                    'hyperparameters'   => ['method' => 'OLS'],
                    'fitted_parameters' => ['slope' => round($m, 4), 'intercept' => round($b, 2), 'points' => $n],
                ];
        }
    }

    /**
     * Format a stored ForecastBenchmark model into standard output array.
     */
    private function formatBenchmarkRecord(ForecastBenchmark $benchmark, ?int $branchId): array
    {
        $rankings = $benchmark->rankings_data ?? [];
        $valData  = $benchmark->validation_data ?? [];

        $bestMetrics = [
            'mae'      => (float) $benchmark->mae,
            'rmse'     => (float) $benchmark->rmse,
            'mape'     => (float) $benchmark->mape,
            'wape'     => (float) ($benchmark->wape ?? 0.0),
            'accuracy' => round(max(0.0, 100 - ($benchmark->wape ?? 0.0)), 1),
            'score'    => ($benchmark->wape < 15 ? 5 : ($benchmark->wape < 25 ? 4 : ($benchmark->wape < 35 ? 3 : ($benchmark->wape < 50 ? 2 : 1)))),
        ];

        return [
            'dataset_range'      => $benchmark->dataset_range,
            'total_transactions' => DB::table('sales')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->count(),
            'best_model'         => $benchmark->recommended_model,
            'recommended_model'  => $benchmark->recommended_model,
            'selection_metric'   => $benchmark->selection_metric ?? 'WAPE',
            'best_metrics'       => $bestMetrics,
            'rankings'           => $rankings,
            'validation'         => $valData['validation_metadata'] ?? null,
            'processing_time'    => (float) ($benchmark->processing_time ?? 0.0),
            'validation_method'  => 'Walk-Forward Time-Series Validation (last test set)',
            'val_actuals'        => $valData['val_actuals'] ?? [],
            'val_dates'          => $valData['val_dates'] ?? [],
            'val_predictions'    => $valData['val_predictions'] ?? [],
            'experiment_number'  => $benchmark->experiment_number ?? 1,
            'is_benchmarked'     => true,
        ];
    }

    /**
     * Calculate Growth Slope over the forecast series using Least-Squares Linear Regression.
     */
    public function calculateGrowthSlope(array $forecastList, array $rawForecastValues = []): array
    {
        $n = count($forecastList);
        if ($n < 2) {
            return [
                'slope'                => 0.0,
                'raw_slope'            => 0.0,
                'formatted_slope'      => '₱0.00/day',
                'percentage'           => 0.0,
                'formatted_percentage' => '0.0%',
                'direction'            => 'flat',
                'method'               => 'INSUFFICIENT_DATA',
                'points_used'          => $n,
                'unit'                 => 'PHP_PER_DAY',
                'label'                => 'Insufficient forecast data',
                'is_available'         => false,
            ];
        }

        usort($forecastList, fn($a, $b) => strcmp($a['date'], $b['date']));

        $yValues = [];
        if (!empty($rawForecastValues) && count($rawForecastValues) === $n) {
            $yValues = array_values($rawForecastValues);
        } else {
            foreach ($forecastList as $pt) {
                $yValues[] = (float) ($pt['predicted'] ?? 0.0);
            }
        }

        $xSum  = ($n * ($n + 1)) / 2;
        $xMean = $xSum / $n;
        $ySum  = array_sum($yValues);
        $yMean = $ySum / $n;

        $sxx = 0.0;
        $sxy = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $x     = $i + 1;
            $y     = (float) $yValues[$i];
            $xDiff = $x - $xMean;
            $yDiff = $y - $yMean;
            $sxx   += $xDiff * $xDiff;
            $sxy   += $xDiff * $yDiff;
        }

        $slope     = $sxx > 0.0 ? ($sxy / $sxx) : 0.0;
        $intercept = $yMean - ($slope * $xMean);

        $baseline = $intercept + $slope;
        if ($baseline <= 0.0 && !empty($yValues[0]) && $yValues[0] > 0.0) {
            $baseline = (float) $yValues[0];
        }

        $totalChange = $slope * ($n - 1);
        $percentage  = 0.0;
        if ($baseline > 0.0) {
            $percentage = round(($totalChange / $baseline) * 100, 1);
        } elseif ($yMean > 0.0) {
            $percentage = round(($totalChange / $yMean) * 100, 1);
        }

        $direction = 'flat';
        if ($slope > 0.005) {
            $direction = 'up';
        } elseif ($slope < -0.005) {
            $direction = 'down';
        }

        $roundedSlope = round($slope, 2);

        return [
            'slope'                => $roundedSlope,
            'raw_slope'            => $slope,
            'formatted_slope'      => ($slope >= 0 ? '+' : '−') . '₱' . number_format(abs($slope), 2) . '/day',
            'percentage'           => $percentage,
            'formatted_percentage' => ($percentage > 0 ? '+' : '') . number_format($percentage, 1) . '%',
            'direction'            => $direction,
            'method'               => 'LINEAR_REGRESSION',
            'points_used'          => $n,
            'unit'                 => 'PHP_PER_DAY',
            'label'                => 'Average forecast change per day',
            'is_available'         => true,
            'formula'              => "Least-Squares Linear Regression (b1 = {$roundedSlope}/day, N = {$n})",
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Model Candidate Implementations (Used for walk-forward benchmarking)
    // ──────────────────────────────────────────────────────────────────────────

    private function fitPredictMA(array $train, int $horizon): array
    {
        $window      = 7;
        $history     = array_column($train, 'total');
        $predictions = [];
        for ($i = 0; $i < $horizon; $i++) {
            $slice         = array_slice($history, -$window);
            $avg           = count($slice) > 0 ? array_sum($slice) / count($slice) : 0.0;
            $predictions[] = $avg;
            $history[]     = $avg;
        }
        return $predictions;
    }

    private function fitPredictWMA(array $train, int $horizon): array
    {
        $window      = 7;
        $history     = array_column($train, 'total');
        $predictions = [];
        $denom       = array_sum(range(1, $window));
        for ($i = 0; $i < $horizon; $i++) {
            $slice = array_slice($history, -$window);
            if (count($slice) < $window) {
                $avg = count($slice) > 0 ? array_sum($slice) / count($slice) : 0.0;
            } else {
                $sum = 0.0;
                foreach ($slice as $idx => $val) {
                    $sum += ($idx + 1) * $val;
                }
                $avg = $sum / $denom;
            }
            $predictions[] = $avg;
            $history[]     = $avg;
        }
        return $predictions;
    }

    private function fitPredictSES(array $train, int $horizon, float $alpha = 0.3): array
    {
        $history = array_column($train, 'total');
        $n       = count($history);
        if ($n === 0) return array_fill(0, $horizon, 0.0);
        $level = $history[0];
        for ($i = 1; $i < $n; $i++) {
            $level = $alpha * $history[$i] + (1 - $alpha) * $level;
        }
        return array_fill(0, $horizon, $level);
    }

    private function fitPredictHolt(array $train, int $horizon, float $alpha = 0.3, float $beta = 0.1, float $phi = 0.85): array
    {
        $history = array_column($train, 'total');
        $n       = count($history);
        if ($n < 2) {
            $val = $n > 0 ? $history[0] : 0.0;
            return array_fill(0, $horizon, $val);
        }

        $meanHistory = array_sum($history) / $n;
        $level       = $history[0];
        $trend       = ($history[$n - 1] - $history[0]) / ($n - 1);

        for ($i = 1; $i < $n; $i++) {
            $lastLevel = $level;
            $level     = $alpha * $history[$i] + (1 - $alpha) * ($level + $phi * $trend);
            $trend     = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;

            $maxTrendDelta = $meanHistory * 0.05;
            $trend         = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
        }

        $predictions    = [];
        $accumulatedPhi = 0.0;
        $currentPhi     = 1.0;

        for ($h = 1; $h <= $horizon; $h++) {
            $currentPhi     *= $phi;
            $accumulatedPhi += $currentPhi;
            $pred           = $level + $accumulatedPhi * $trend;

            $minFloor      = $meanHistory * 0.15;
            $predictions[] = max($minFloor, round($pred, 2));
        }
        return $predictions;
    }

    private function fitPredictHoltWinters(array $train, int $horizon, float $alpha = 0.3, float $beta = 0.1, float $gamma = 0.2, float $phi = 0.85): array
    {
        $history = array_column($train, 'total');
        $n       = count($history);
        $m       = 7; // Weekly seasonality
        if ($n < $m * 2) {
            return $this->fitPredictHolt($train, $horizon, $alpha, $beta, $phi);
        }

        $meanHistory = array_sum($history) / $n;
        $level       = array_sum(array_slice($history, 0, $m)) / $m;
        $trend       = 0.0;

        $seasonal = [];
        for ($i = 0; $i < $m; $i++) {
            $seasonal[$i] = $history[$i] - $level;
        }

        for ($i = $m; $i < $n; $i++) {
            $lastLevel       = $level;
            $y               = $history[$i];
            $sIdx            = $i % $m;

            $level           = $alpha * ($y - $seasonal[$sIdx]) + (1 - $alpha) * ($level + $phi * $trend);
            $trend           = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;
            $seasonal[$sIdx] = $gamma * ($y - $level) + (1 - $gamma) * $seasonal[$sIdx];

            $maxTrendDelta   = $meanHistory * 0.05;
            $trend           = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
        }

        $predictions    = [];
        $accumulatedPhi = 0.0;
        $currentPhi     = 1.0;

        for ($h = 1; $h <= $horizon; $h++) {
            $sIdx           = ($n + $h - 1) % $m;
            $currentPhi     *= $phi;
            $accumulatedPhi += $currentPhi;
            $pred           = $level + $accumulatedPhi * $trend + $seasonal[$sIdx];

            $minFloor      = $meanHistory * 0.15;
            $predictions[] = max($minFloor, round($pred, 2));
        }
        return $predictions;
    }

    private function fitPredictLR(array $train, int $horizon): array
    {
        $history = array_column($train, 'total');
        $n       = count($history);
        if ($n === 0) return array_fill(0, $horizon, 0.0);
        $sumX = $sumY = $sumXX = $sumXY = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $x     = $i + 1;
            $y     = $history[$i];
            $sumX  += $x;
            $sumY  += $y;
            $sumXX += $x * $x;
            $sumXY += $x * $y;
        }
        $denom = ($n * $sumXX) - ($sumX * $sumX);
        $m     = $denom != 0 ? (($n * $sumXY) - ($sumX * $sumY)) / $denom : 0.0;
        $b     = ($sumY - ($m * $sumX)) / $n;

        $predictions = [];
        for ($h = 1; $h <= $horizon; $h++) {
            $predictions[] = max(0.0, $m * ($n + $h) + $b);
        }
        return $predictions;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Core Helpers & Metrics
    // ──────────────────────────────────────────────────────────────────────────

    private function fillMissingDates($rawRows): array
    {
        $map = [];
        foreach ($rawRows as $row) {
            $map[$row->date] = (float) $row->daily_total;
        }

        if (empty($map)) return [];

        $start   = Carbon::parse(array_key_first($map));
        $end     = Carbon::today();
        $current = $start->copy();
        $series  = [];

        while ($current->lte($end)) {
            $d        = $current->toDateString();
            $series[] = ['date' => $d, 'total' => $map[$d] ?? 0.0];
            $current->addDay();
        }

        return $series;
    }

    private function detectAnomalies(array $series): array
    {
        $values = array_column($series, 'total');
        if (count($values) < 4) return [];
        sort($values);
        $n   = count($values);
        $q1  = $values[(int) floor($n * 0.25)];
        $q3  = $values[(int) floor($n * 0.75)];
        $iqr = $q3 - $q1;
        $lo  = $q1 - 1.5 * $iqr;
        $hi  = $q3 + 1.5 * $iqr;

        $anomalies = [];
        foreach ($series as $row) {
            if ($row['total'] < $lo || $row['total'] > $hi) {
                $anomalies[] = [
                    'date'   => $row['date'],
                    'value'  => $row['total'],
                    'reason' => $row['total'] > $hi ? 'Volume Spike Outlier' : 'Volume Drop Outlier',
                ];
            }
        }
        return $anomalies;
    }

    private function calculateMetrics(array $actuals, array $preds): array
    {
        $n           = count($actuals);
        $sumAbsErr   = 0.0;
        $sumSqErr    = 0.0;
        $sumMapeErr  = 0.0;
        $sumSmapeErr = 0.0;
        $sumActual   = 0.0;

        $actualValues = array_column($actuals, 'total');
        $meanActual   = $n > 0 ? array_sum($actualValues) / $n : 1.0;
        $minDenom     = max(1.0, $meanActual * 0.1);

        for ($i = 0; $i < $n; $i++) {
            $act  = $actuals[$i]['total'];
            $pred = $preds[$i] ?? 0.0;

            $err    = $act - $pred;
            $absErr = abs($err);

            $sumAbsErr   += $absErr;
            $sumSqErr    += $err * $err;
            $sumActual   += $act;

            $denom       = max($minDenom, $act);
            $sumMapeErr  += $absErr / $denom;

            $sDenom      = ($act + $pred) / 2;
            $sumSmapeErr += $sDenom > 0 ? $absErr / $sDenom : 0.0;
        }

        $mae   = $n > 0 ? $sumAbsErr / $n : 0.0;
        $rmse  = $n > 0 ? sqrt($sumSqErr / $n) : 0.0;
        $mape  = $n > 0 ? ($sumMapeErr / $n) * 100 : 0.0;
        $smape = $n > 0 ? ($sumSmapeErr / $n) * 100 : 0.0;
        $wape  = $sumActual > 0 ? ($sumAbsErr / $sumActual) * 100 : 0.0;

        $accuracy = round(max(0.0, 100 - $wape), 1);

        return [
            'mae'      => round($mae, 2),
            'rmse'     => round($rmse, 2),
            'mape'     => round($mape, 2),
            'smape'    => round($smape, 2),
            'wape'     => round($wape, 2),
            'accuracy' => $accuracy,
        ];
    }

    private function generateInsights(array $series, string $model, array $forecast): array
    {
        $insights = [];
        $values   = array_column($series, 'total');
        $mean     = count($values) > 0 ? array_sum($values) / count($values) : 0.0;

        $forecastValues = array_column($forecast, 'predicted');
        $forecastAvg    = count($forecastValues) > 0 ? array_sum($forecastValues) / count($forecastValues) : 0.0;

        if ($mean > 0) {
            $changePct = round((($forecastAvg - $mean) / $mean) * 100, 1);
            if ($changePct > 5) {
                $insights[] = "📈 Sales are expected to expand by {$changePct}% compared to historical levels. Reorder inventory accordingly.";
            } elseif ($changePct < -5) {
                $insights[] = "📉 Sales are expected to drop by " . abs($changePct) . "% compared to historical averages. Prevent overstocking.";
            } else {
                $insights[] = "📊 Sales volume is expected to remain stable with minimal fluctuation (+/-5%).";
            }
        }

        $weekendSum   = 0.0;
        $weekdaySum   = 0.0;
        $weekendCount = 0;
        $weekdayCount = 0;
        foreach ($series as $row) {
            $day = Carbon::parse($row['date'])->dayOfWeek;
            if ($day === 0 || $day === 6) {
                $weekendSum += $row['total'];
                $weekendCount++;
            } else {
                $weekdaySum += $row['total'];
                $weekdayCount++;
            }
        }
        $wkAvg = $weekendCount > 0 ? $weekendSum / $weekendCount : 0.0;
        $wdAvg = $weekdayCount > 0 ? $weekdaySum / $weekdayCount : 0.0;

        if ($wkAvg > $wdAvg * 1.15) {
            $insights[] = "🗓️ Recurring weekend spikes detected. Increase stock levels ahead of Friday close.";
        }

        return $insights;
    }

    private function stdDev(array $values): float
    {
        $n = count($values);
        if ($n < 2) return 0.0;
        $mean = array_sum($values) / $n;
        $sq   = array_map(fn($v) => ($v - $mean) ** 2, $values);
        return sqrt(array_sum($sq) / $n);
    }
}
