<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function fitPredictHoltDamped(array $train, int $horizon, float $alpha = 0.3, float $beta = 0.1, float $phi = 0.85): array
{
    $history = array_column($train, 'total');
    $n = count($history);
    if ($n < 2) {
        $val = $n > 0 ? $history[0] : 0.0;
        return array_fill(0, $horizon, $val);
    }
    
    $meanHistory = array_sum($history) / $n;
    $level = $history[0];
    
    // Calculate initial trend across whole series rather than 1 day difference
    $trend = ($history[$n - 1] - $history[0]) / ($n - 1);

    for ($i = 1; $i < $n; $i++) {
        $lastLevel = $level;
        $level = $alpha * $history[$i] + (1 - $alpha) * ($level + $phi * $trend);
        $trend = $beta * ($level - $lastLevel) + (1 - $beta) * $phi * $trend;
        
        // Damp trend extreme spikes
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
        
        // Ensure forecast never drops below 15% of historical average baseline
        $minFloor = $meanHistory * 0.15;
        $predictions[] = max($minFloor, round($pred, 2));
    }
    return $predictions;
}

$trainData = [
    ['date' => '2026-08-01', 'total' => 2500],
    ['date' => '2026-08-02', 'total' => 1800],
    ['date' => '2026-08-03', 'total' => 2200],
    ['date' => '2026-08-04', 'total' => 2100],
    ['date' => '2026-08-05', 'total' => 1900],
    ['date' => '2026-08-06', 'total' => 2300],
    ['date' => '2026-08-07', 'total' => 2700],
    ['date' => '2026-08-08', 'total' => 2400],
    ['date' => '2026-08-09', 'total' => 1700],
    ['date' => '2026-08-10', 'total' => 2000],
    ['date' => '2026-08-11', 'total' => 1850],
    ['date' => '2026-08-12', 'total' => 1600],
    ['date' => '2026-08-13', 'total' => 1500],
    ['date' => '2026-08-14', 'total' => 1400],
];

$horizon = 7;
$dampedHoltPreds = fitPredictHoltDamped($trainData, $horizon);

echo "Damped Holt Linear Trend Predictions:\n";
print_r($dampedHoltPreds);
