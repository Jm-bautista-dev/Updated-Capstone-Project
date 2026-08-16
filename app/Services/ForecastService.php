<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\ForecastBenchmark;
use App\Models\ForecastRecord;
use Illuminate\Support\Facades\Auth;

class ForecastService
{
    /**
     * Benchmark all 6 models on historical data and return ranking, metrics, data quality.
     */
    public function benchmark(?int $branchId): array
    {
        $cacheKey = 'forecast_benchmark_' . ($branchId ?? 'all');

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, 600, function () use ($branchId) {
            return $this->runBenchmark($branchId);
        });
    }

    /**
     * Internal: actually run the benchmark computation (called via cache wrapper above).
     */
    private function runBenchmark(?int $branchId): array
    {
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

        // 3. Outlier/Anomaly detection (IQR method)
        $anomalies = $this->detectAnomalies($series);

        // 4. Data Quality indicators
        $missingDaysCount = collect($series)->where('total', 0.0)->count();
        $completenessPct = $totalDays > 0 ? round((($totalDays - $missingDaysCount) / $totalDays) * 100, 1) : 0;
        
        $dataQuality = [
            'total_days' => $totalDays,
            'missing_days' => $missingDaysCount,
            'duplicates' => 0, // database unique index prevents duplicates
            'outliers' => count($anomalies),
            'completeness' => $completenessPct,
            'anomalies_list' => $anomalies,
            'status' => $completenessPct >= 80 ? 'Good' : ($completenessPct >= 50 ? 'Fair' : 'Poor')
        ];

        // 5. Time-Series Split (Walk-Forward Validation Set)
        // Use last 7 days if >= 14 days available, else last 3 days if >= 6 days, else use 1 day
        $validationSize = $totalDays >= 28 ? 14 : ($totalDays >= 14 ? 7 : ($totalDays >= 6 ? 3 : max(1, (int) floor($totalDays / 2))));

        // Ensure we have at least 2 data points to train on
        if ($totalDays < 2) {
            return [
                'error' => 'Not enough sales data yet. At least 2 days of sales history is required.',
                'quality' => $dataQuality
            ];
        }

        // Clamp validationSize so trainSet always has at least 1 data point
        $validationSize = min($validationSize, $totalDays - 1);

        $trainSet = array_slice($series, 0, $totalDays - $validationSize);
        $valSet = array_slice($series, $totalDays - $validationSize);

        // 6. Run validation on all 6 forecasting models
        $models = [
            'Moving Average' => $this->fitPredictMA($trainSet, $validationSize),
            'Weighted Moving Average' => $this->fitPredictWMA($trainSet, $validationSize),
            'Simple Exponential Smoothing' => $this->fitPredictSES($trainSet, $validationSize),
            'Holt Linear Trend' => $this->fitPredictHolt($trainSet, $validationSize),
            'Holt-Winters Seasonal' => $this->fitPredictHoltWinters($trainSet, $validationSize),
            'Linear Regression' => $this->fitPredictLR($trainSet, $validationSize)
        ];

        // 7. Calculate evaluation metrics per model
        $rankings = [];
        foreach ($models as $name => $preds) {
            $metrics = $this->calculateMetrics($valSet, $preds);
            $rankings[] = array_merge(['model' => $name], $metrics);
        }

        // Sort rankings by lowest MAPE
        usort($rankings, fn($a, $b) => $a['mape'] <=> $b['mape']);

        // Set Rank indexes
        foreach ($rankings as $idx => &$item) {
            $item['rank'] = $idx + 1;
            // Performance scorestars
            $mape = $item['mape'];
            $item['score'] = $mape < 5 ? 5 : ($mape < 10 ? 4 : ($mape < 15 ? 3 : ($mape < 25 ? 2 : 1)));
        }

        $bestModel = $rankings[0];
        $processingTime = round(microtime(true) - $startTime, 4);

        $rangeStr = $series[0]['date'] . ' to ' . end($series)['date'];

        // Save benchmark run to database if user is authenticated
        if (Auth::check()) {
            ForecastBenchmark::create([
                'user_id' => Auth::id(),
                'branch_id' => $branchId,
                'dataset_range' => $rangeStr,
                'recommended_model' => $bestModel['model'],
                'mae' => $bestModel['mae'],
                'rmse' => $bestModel['rmse'],
                'mape' => $bestModel['mape'],
                'processing_time' => $processingTime
            ]);
        }

        return [
            'dataset_range' => $rangeStr,
            'total_transactions' => DB::table('sales')->when($branchId, fn($q) => $q->where('branch_id', $branchId))->count(),
            'best_model' => $bestModel['model'],
            'best_metrics' => $bestModel,
            'rankings' => $rankings,
            'quality' => $dataQuality,
            'processing_time' => $processingTime,
            'validation_method' => 'Walk-Forward Time-Series Validation (last ' . $validationSize . ' days test set)',
            'val_actuals' => array_column($valSet, 'total'),
            'val_dates' => array_column($valSet, 'date'),
            'val_predictions' => $models,
        ];
    }

    /**
     * Generate actual forecasts using the recommended model.
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

        $series = $this->fillMissingDates($rawRows);
        $totalDays = count($series);

        // Run benchmark to find best model
        $benchmarkResult = $this->benchmark($branchId);
        if (isset($benchmarkResult['error'])) {
            return $benchmarkResult;
        }

        $recommendedModel = $benchmarkResult['best_model'];

        // Generate forecasts using entire series
        $forecastValues = [];
        switch ($recommendedModel) {
            case 'Moving Average':
                $forecastValues = $this->fitPredictMA($series, $horizonDays);
                break;
            case 'Weighted Moving Average':
                $forecastValues = $this->fitPredictWMA($series, $horizonDays);
                break;
            case 'Simple Exponential Smoothing':
                $forecastValues = $this->fitPredictSES($series, $horizonDays);
                break;
            case 'Holt Linear Trend':
                $forecastValues = $this->fitPredictHolt($series, $horizonDays);
                break;
            case 'Holt-Winters Seasonal':
                $forecastValues = $this->fitPredictHoltWinters($series, $horizonDays);
                break;
            case 'Linear Regression':
            default:
                $forecastValues = $this->fitPredictLR($series, $horizonDays);
                break;
        }

        // Calculate prediction standard deviation for 95% confidence bands (1.96 * StdDev)
        $historicalValues = array_column($series, 'total');
        $stdDev = $this->stdDev($historicalValues);
        $spread = round($stdDev * 1.96, 2);

        $lastDate = Carbon::parse(end($series)['date']);
        $forecastList = [];
        foreach ($forecastValues as $idx => $val) {
            $futureDate = $lastDate->copy()->addDays($idx + 1);
            $pred = round($val, 2);
            $forecastList[] = [
                'date' => $futureDate->toDateString(),
                'predicted' => $pred,
                'lower' => max(0.0, round($pred - $spread, 2)),
                'upper' => round($pred + $spread, 2),
                'dow' => $futureDate->format('D')
            ];
        }

        // Standardized insights
        $insights = $this->generateInsights($series, $recommendedModel, $forecastList);

        $historicalData = [];
        foreach ($series as $row) {
            $historicalData[] = [
                'date' => $row['date'],
                'actual' => $row['total']
            ];
        }

        return [
            'historical' => $historicalData,
            'forecast' => $forecastList,
            'prediction' => $forecastList[0]['predicted'] ?? 0.0,
            'prediction_lower' => $forecastList[0]['lower'] ?? 0.0,
            'prediction_upper' => $forecastList[0]['upper'] ?? 0.0,
            'confidence' => $benchmarkResult['best_metrics']['accuracy'],
            'recommended_model' => $recommendedModel,
            'benchmark' => $benchmarkResult,
            'insights' => $insights
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Model Implementations
    // ──────────────────────────────────────────────────────────────────────────

    private function fitPredictMA(array $train, int $horizon): array
    {
        $window = 7;
        $history = array_column($train, 'total');
        $predictions = [];
        for ($i = 0; $i < $horizon; $i++) {
            $slice = array_slice($history, -$window);
            $avg = count($slice) > 0 ? array_sum($slice) / count($slice) : 0.0;
            $predictions[] = $avg;
            $history[] = $avg;
        }
        return $predictions;
    }

    private function fitPredictWMA(array $train, int $horizon): array
    {
        $window = 7;
        $history = array_column($train, 'total');
        $predictions = [];
        $denom = array_sum(range(1, $window));
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
            $history[] = $avg;
        }
        return $predictions;
    }

    private function fitPredictSES(array $train, int $horizon, float $alpha = 0.3): array
    {
        $history = array_column($train, 'total');
        $n = count($history);
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
        $n = count($history);
        if ($n < 2) {
            $val = $n > 0 ? $history[0] : 0.0;
            return array_fill(0, $horizon, $val);
        }

        $meanHistory = array_sum($history) / $n;
        $level = $history[0];
        $trend = ($history[$n - 1] - $history[0]) / ($n - 1);

        for ($i = 1; $i < $n; $i++) {
            $lastLevel = $level;
            $level = $alpha * $history[$i] + (1 - $alpha) * ($level + $phi * $trend);
            $trend = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;

            $maxTrendDelta = $meanHistory * 0.05;
            $trend = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
        }

        $predictions = [];
        $accumulatedPhi = 0.0;
        $currentPhi = 1.0;

        for ($h = 1; $h <= $horizon; $h++) {
            $currentPhi *= $phi;
            $accumulatedPhi += $currentPhi;
            $pred = $level + $accumulatedPhi * $trend;

            $minFloor = $meanHistory * 0.15;
            $predictions[] = max($minFloor, round($pred, 2));
        }
        return $predictions;
    }

    private function fitPredictHoltWinters(array $train, int $horizon, float $alpha = 0.3, float $beta = 0.1, float $gamma = 0.2, float $phi = 0.85): array
    {
        $history = array_column($train, 'total');
        $n = count($history);
        $m = 7; // Weekly seasonality
        if ($n < $m * 2) {
            return $this->fitPredictHolt($train, $horizon, $alpha, $beta, $phi);
        }

        $meanHistory = array_sum($history) / $n;
        $level = array_sum(array_slice($history, 0, $m)) / $m;
        $trend = 0.0;

        $seasonal = [];
        for ($i = 0; $i < $m; $i++) {
            $seasonal[$i] = $history[$i] - $level;
        }

        for ($i = $m; $i < $n; $i++) {
            $lastLevel = $level;
            $y = $history[$i];
            $sIdx = $i % $m;

            $level = $alpha * ($y - $seasonal[$sIdx]) + (1 - $alpha) * ($level + $phi * $trend);
            $trend = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;
            $seasonal[$sIdx] = $gamma * ($y - $level) + (1 - $gamma) * $seasonal[$sIdx];

            $maxTrendDelta = $meanHistory * 0.05;
            $trend = max(-$maxTrendDelta, min($maxTrendDelta, $trend));
        }

        $predictions = [];
        $accumulatedPhi = 0.0;
        $currentPhi = 1.0;

        for ($h = 1; $h <= $horizon; $h++) {
            $sIdx = ($n + $h - 1) % $m;
            $currentPhi *= $phi;
            $accumulatedPhi += $currentPhi;
            $pred = $level + $accumulatedPhi * $trend + $seasonal[$sIdx];

            $minFloor = $meanHistory * 0.15;
            $predictions[] = max($minFloor, round($pred, 2));
        }
        return $predictions;
    }

    private function fitPredictLR(array $train, int $horizon): array
    {
        $history = array_column($train, 'total');
        $n = count($history);
        if ($n === 0) return array_fill(0, $horizon, 0.0);
        $sumX = $sumY = $sumXX = $sumXY = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $x = $i + 1;
            $y = $history[$i];
            $sumX += $x;
            $sumY += $y;
            $sumXX += $x * $x;
            $sumXY += $x * $y;
        }
        $denom = ($n * $sumXX) - ($sumX * $sumX);
        $m = $denom != 0 ? (($n * $sumXY) - ($sumX * $sumY)) / $denom : 0.0;
        $b = ($sumY - ($m * $sumX)) / $n;

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

        $start = Carbon::parse(array_key_first($map));
        $end = Carbon::today();
        $current = $start->copy();
        $series = [];

        while ($current->lte($end)) {
            $d = $current->toDateString();
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
        $n = count($values);
        $q1 = $values[(int) floor($n * 0.25)];
        $q3 = $values[(int) floor($n * 0.75)];
        $iqr = $q3 - $q1;
        $lo = $q1 - 1.5 * $iqr;
        $hi = $q3 + 1.5 * $iqr;

        $anomalies = [];
        foreach ($series as $row) {
            if ($row['total'] < $lo || $row['total'] > $hi) {
                $anomalies[] = [
                    'date' => $row['date'],
                    'value' => $row['total'],
                    'reason' => $row['total'] > $hi ? 'Volume Spike Outlier' : 'Volume Drop Outlier'
                ];
            }
        }
        return $anomalies;
    }

    private function calculateMetrics(array $actuals, array $preds): array
    {
        $n = count($actuals);
        $sumAbsErr = 0.0;
        $sumSqErr = 0.0;
        $sumMapeErr = 0.0;
        $sumSmapeErr = 0.0;
        $sumActual = 0.0;

        for ($i = 0; $i < $n; $i++) {
            $act = $actuals[$i]['total'];
            $pred = $preds[$i] ?? 0.0;

            $err = $act - $pred;
            $absErr = abs($err);

            $sumAbsErr += $absErr;
            $sumSqErr += $err * $err;
            
            $sumActual += $act;

            // MAPE safety denominator
            $sumMapeErr += $absErr / max(1.0, $act);

            // sMAPE
            $denom = ($act + $pred) / 2;
            $sumSmapeErr += $denom > 0 ? $absErr / $denom : 0.0;
        }

        $mae = $n > 0 ? $sumAbsErr / $n : 0.0;
        $rmse = $n > 0 ? sqrt($sumSqErr / $n) : 0.0;
        $mape = $n > 0 ? ($sumMapeErr / $n) * 100 : 0.0;
        $smape = $n > 0 ? ($sumSmapeErr / $n) * 100 : 0.0;
        $wape = $sumActual > 0 ? ($sumAbsErr / $sumActual) * 100 : 0.0;

        return [
            'mae' => round($mae, 2),
            'rmse' => round($rmse, 2),
            'mape' => round($mape, 2),
            'smape' => round($smape, 2),
            'wape' => round($wape, 2),
            'accuracy' => round(max(0.0, 100 - $mape), 1)
        ];
    }

    private function generateInsights(array $series, string $model, array $forecast): array
    {
        $insights = [];
        $values = array_column($series, 'total');
        $mean = count($values) > 0 ? array_sum($values) / count($values) : 0.0;

        $forecastValues = array_column($forecast, 'predicted');
        $forecastAvg = count($forecastValues) > 0 ? array_sum($forecastValues) / count($forecastValues) : 0.0;

        // Growth rate comparison
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

        // Seasonality detection (Day of Week check)
        $weekendSum = 0.0;
        $weekdaySum = 0.0;
        $weekendCount = 0;
        $weekdayCount = 0;
        foreach ($series as $row) {
            $day = Carbon::parse($row['date'])->dayOfWeek;
            if ($day === 0 || $day === 6) { // Sun, Sat
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
        $sq = array_map(fn($v) => ($v - $mean) ** 2, $values);
        return sqrt(array_sum($sq) / $n);
    }
}
