<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$valSet = [
    ['date' => '2026-08-10', 'total' => 0],
    ['date' => '2026-08-11', 'total' => 500],
    ['date' => '2026-08-12', 'total' => 0],
    ['date' => '2026-08-13', 'total' => 4500],
    ['date' => '2026-08-14', 'total' => 0],
    ['date' => '2026-08-15', 'total' => 2200],
    ['date' => '2026-08-16', 'total' => 1000],
];

function calculateMetricsFixed(array $actuals, array $preds): array
{
    $n = count($actuals);
    $sumAbsErr = 0.0;
    $sumSqErr = 0.0;
    $sumMapeErr = 0.0;
    $sumSmapeErr = 0.0;
    $sumActual = 0.0;

    $actualValues = array_column($actuals, 'total');
    $meanActual = $n > 0 ? array_sum($actualValues) / $n : 1.0;
    // Minimum non-zero denominator baseline (10% of series average or 1.0)
    $minDenom = max(1.0, $meanActual * 0.1);

    for ($i = 0; $i < $n; $i++) {
        $act = $actuals[$i]['total'];
        $pred = $preds[$i] ?? 0.0;

        $err = $act - $pred;
        $absErr = abs($err);

        $sumAbsErr += $absErr;
        $sumSqErr += $err * $err;
        $sumActual += $act;

        // Use series baseline for zero-sales days so non-zero models aren't artifically penalized
        $denom = max($minDenom, $act);
        $sumMapeErr += $absErr / $denom;

        // sMAPE
        $sDenom = ($act + $pred) / 2;
        $sumSmapeErr += $sDenom > 0 ? $absErr / $sDenom : 0.0;
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
        'accuracy' => round(max(0.0, 100 - $wape), 1)
    ];
}

$flatZeroPreds = [0, 0, 0, 0, 0, 0, 0];
$dampedHoltPreds = [300, 500, 450, 600, 500, 700, 600];

$metricsZero = calculateMetricsFixed($valSet, $flatZeroPreds);
$metricsHolt = calculateMetricsFixed($valSet, $dampedHoltPreds);

echo "Fixed Metrics - Flat Zero Model:\n";
print_r($metricsZero);

echo "\nFixed Metrics - Damped Holt Model:\n";
print_r($metricsHolt);
