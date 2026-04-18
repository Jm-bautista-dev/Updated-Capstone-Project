<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ForecastService
{
    // ── Weights for the hybrid model ───────────────────────────────────────
    private const WEIGHT_TREND    = 0.40;
    private const WEIGHT_SEASONAL = 0.30;
    private const WEIGHT_MOVING   = 0.30;

    // ── Recent-momentum window (days weighted more) ─────────────────────────
    private const MOMENTUM_WINDOW = 7;

    /**
     * Main entry: fetch raw data, build features, produce 7-day forecast.
     */
    public function generate(int $lookbackDays, ?int $branchId): array
    {
        // 1. Load raw daily sales from DB ────────────────────────────────────
        $rawRows = DB::table('sales')
            ->where('status', 'completed')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as daily_total')
            )
            ->when($branchId && $branchId !== 0, fn($q) => $q->where('branch_id', $branchId))
            ->where('created_at', '>=', Carbon::now()->subDays($lookbackDays))
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        if ($rawRows->isEmpty()) {
            return ['error' => 'No sales data found. Please record at least one completed sale.'];
        }

        // 2. Fill in missing dates (zero-sales days) ─────────────────────────
        $series = $this->fillMissingDates($rawRows);

        // 3. Remove outliers (IQR method) ────────────────────────────────────
        $cleaned = $this->removeOutliers($series);

        // 4. Compute components ──────────────────────────────────────────────
        $trendLine   = $this->linearRegression($cleaned);   // [slope m, intercept b]
        $seasonal    = $this->dayOfWeekSeasonality($cleaned); // [0..6 => multiplier]
        $movingAvg   = $this->movingAverage($cleaned, 7);     // smoothed values
        $n           = count($cleaned);

        // 5. Compute real confidence score ───────────────────────────────────
        $confidence  = $this->computeConfidence($cleaned, $trendLine);

        // 6. Std-deviation for prediction bands ─────────────────────────────
        $stdDev      = $this->stdDev(array_column($cleaned, 'total'));

        // 7. Build 7-day forecast ────────────────────────────────────────────
        $lastDate    = Carbon::parse(end($cleaned)['date']);
        $forecast    = [];

        for ($i = 1; $i <= 7; $i++) {
            $futureDate = $lastDate->copy()->addDays($i);
            $xi         = $n + $i;
            $dow        = $futureDate->dayOfWeek; // 0=Sun … 6=Sat

            // Component predictions
            $trendPred  = max(0, ($trendLine['m'] * $xi) + $trendLine['b']);
            $seasonMult = $seasonal[$dow] ?? 1.0;
            $maValue    = $movingAvg[$n - 1] ?? $trendPred; // last known MA

            // Hybrid formula
            $hybrid     = (self::WEIGHT_TREND   * $trendPred)
                        + (self::WEIGHT_SEASONAL * ($maValue * $seasonMult))
                        + (self::WEIGHT_MOVING   * $maValue);

            $predicted  = max(0, round($hybrid, 2));
            $spread     = round($stdDev * 1.5, 2); // ~90% confidence band

            $forecast[] = [
                'date'      => $futureDate->toDateString(),
                'predicted' => $predicted,
                'lower'     => max(0, round($predicted - $spread, 2)),
                'upper'     => round($predicted + $spread, 2),
                'dow'       => $futureDate->format('D'),
            ];
        }

        // 8. Moving average overlay for the chart ───────────────────────────
        $maOverlay = [];
        foreach ($cleaned as $i => $row) {
            $maOverlay[] = [
                'date'        => $row['date'],
                'total'       => $row['total'],
                'moving_avg'  => round($movingAvg[$i] ?? $row['total'], 2),
            ];
        }

        // 9. Smart Insights ──────────────────────────────────────────────────
        $insights = $this->generateInsights($cleaned, $trendLine, $seasonal, $confidence, $stdDev);

        // 10. Trend metadata ─────────────────────────────────────────────────
        $trendPct = $cleaned[0]['total'] > 0
            ? round((($cleaned[$n - 1]['total'] - $cleaned[0]['total']) / $cleaned[0]['total']) * 100, 1)
            : 0;

        return [
            'historical'        => $maOverlay,
            'forecast'          => $forecast,
            'prediction'        => $forecast[0]['predicted'] ?? 0, // tomorrow
            'prediction_lower'  => $forecast[0]['lower']    ?? 0,
            'prediction_upper'  => $forecast[0]['upper']    ?? 0,
            'confidence'        => $confidence,
            'trend'  => [
                'type'       => $trendLine['m'] >= 0 ? 'upward' : 'downward',
                'slope'      => round($trendLine['m'], 2),
                'percentage' => $trendPct,
            ],
            'insights'          => $insights,
            'seasonal_pattern'  => $seasonal,
        ];
    }

    // ──────────────────────────────────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Fill every calendar day in the range with a value (0 if no sales).
     */
    private function fillMissingDates($rawRows): array
    {
        $map = [];
        foreach ($rawRows as $row) {
            $map[$row->date] = (float) $row->daily_total;
        }

        $start   = Carbon::parse(array_key_first($map));
        $end     = Carbon::today();
        $current = $start->copy();
        $series  = [];

        while ($current->lte($end)) {
            $d = $current->toDateString();
            $series[] = ['date' => $d, 'total' => $map[$d] ?? 0.0];
            $current->addDay();
        }

        return $series;
    }

    /**
     * IQR-based outlier removal. Values outside [Q1 - 1.5*IQR, Q3 + 1.5*IQR]
     * are replaced by the day's median neighbour, not dropped.
     */
    private function removeOutliers(array $series): array
    {
        $values = array_column($series, 'total');
        sort($values);
        $n   = count($values);
        $q1  = $values[(int) floor($n * 0.25)];
        $q3  = $values[(int) floor($n * 0.75)];
        $iqr = $q3 - $q1;
        $lo  = $q1 - 1.5 * $iqr;
        $hi  = $q3 + 1.5 * $iqr;
        $mid = $values[(int) floor($n * 0.5)];

        return array_map(function ($row) use ($lo, $hi, $mid) {
            return [
                'date'  => $row['date'],
                'total' => ($row['total'] < $lo || $row['total'] > $hi) ? $mid : $row['total'],
            ];
        }, $series);
    }

    /**
     * Weighted OLS linear regression (recent days carry more weight).
     * Returns ['m' => slope, 'b' => intercept].
     */
    private function linearRegression(array $series): array
    {
        $n    = count($series);
        $sumW = $sumWX = $sumWY = $sumWX2 = $sumWXY = 0.0;

        foreach ($series as $i => $row) {
            $xi = $i + 1;
            $yi = $row['total'];
            // Exponential weight: recent days get up to 3× more weight
            $w  = 1.0 + (self::MOMENTUM_WINDOW / $n) * ($xi / $n) * 2;

            $sumW   += $w;
            $sumWX  += $w * $xi;
            $sumWY  += $w * $yi;
            $sumWX2 += $w * $xi * $xi;
            $sumWXY += $w * $xi * $yi;
        }

        $denom = ($sumW * $sumWX2) - ($sumWX * $sumWX);
        $m     = $denom != 0 ? (($sumW * $sumWXY) - ($sumWX * $sumWY)) / $denom : 0;
        $b     = ($sumWY - ($m * $sumWX)) / $sumW;

        return ['m' => $m, 'b' => $b];
    }

    /**
     * Compute per-weekday average revenue and return as multipliers relative
     * to overall daily average. 0 = Sunday … 6 = Saturday.
     */
    private function dayOfWeekSeasonality(array $series): array
    {
        $buckets = array_fill(0, 7, []);
        foreach ($series as $row) {
            $dow = Carbon::parse($row['date'])->dayOfWeek;
            $buckets[$dow][] = $row['total'];
        }

        $overallAvg = $this->mean(array_column($series, 'total'));
        $multipliers = [];
        for ($d = 0; $d < 7; $d++) {
            $dowAvg          = !empty($buckets[$d]) ? $this->mean($buckets[$d]) : $overallAvg;
            $multipliers[$d] = $overallAvg > 0 ? ($dowAvg / $overallAvg) : 1.0;
        }

        return $multipliers;
    }

    /**
     * Simple trailing moving average of $window days.
     */
    private function movingAverage(array $series, int $window): array
    {
        $result = [];
        $n      = count($series);
        for ($i = 0; $i < $n; $i++) {
            $slice    = array_slice($series, max(0, $i - $window + 1), min($window, $i + 1));
            $result[] = $this->mean(array_column($slice, 'total'));
        }
        return $result;
    }

    /**
     * Compute confidence score 0-100 based on inverse coefficient of variation.
     * High volatility (high CV) → lower confidence.
     */
    private function computeConfidence(array $series, array $trendLine): float
    {
        $values  = array_column($series, 'total');
        $mean    = $this->mean($values);
        $std     = $this->stdDev($values);

        if ($mean <= 0) return 50.0;

        $cv          = $std / $mean; // coefficient of variation
        $rawScore    = max(0, 1 - $cv); // 0…1
        $confidence  = round($rawScore * 100, 1); // 0…100

        // Bonus for having more data points (up to +10)
        $dataBonus   = min(10, count($series) / 3);
        return min(99, $confidence + $dataBonus);
    }

    /**
     * Generate 2-4 human-readable insight strings based on model outputs.
     */
    private function generateInsights(
        array $series,
        array $trendLine,
        array $seasonal,
        float $confidence,
        float $stdDev
    ): array {
        $insights = [];
        $mean     = $this->mean(array_column($series, 'total'));

        // Trend insight
        if ($trendLine['m'] > ($mean * 0.02)) {
            $insights[] = '📈 Sales are trending upward with consistent daily growth.';
        } elseif ($trendLine['m'] < -($mean * 0.02)) {
            $insights[] = '📉 Sales are trending downward. Consider promotions this week.';
        } else {
            $insights[] = '📊 Sales are relatively stable with no significant trend.';
        }

        // Weekend vs weekday insight
        $weekendAvg  = ($seasonal[0] + $seasonal[6]) / 2; // Sun, Sat
        $weekdayAvg  = ($seasonal[1] + $seasonal[2] + $seasonal[3] + $seasonal[4] + $seasonal[5]) / 5;
        if ($weekendAvg > $weekdayAvg * 1.15) {
            $insights[] = '🗓️ Weekend sales are significantly stronger — forecast accounts for weekend boost.';
        } elseif ($weekdayAvg > $weekendAvg * 1.10) {
            $insights[] = '💼 Weekday sales outperform weekends for this branch.';
        }

        // Volatility insight
        if ($stdDev > $mean * 0.4) {
            $insights[] = '⚠️ High sales volatility detected. Confidence bands are wider to reflect uncertainty.';
        } elseif ($confidence >= 75) {
            $insights[] = '✅ Strong historical consistency detected — high model confidence.';
        }

        // Recent momentum
        $recentSlice = array_slice($series, -7);
        $recentAvg   = $this->mean(array_column($recentSlice, 'total'));
        if ($recentAvg > $mean * 1.10) {
            $insights[] = '🚀 Recent sales momentum is above average — forecast reflects this growth.';
        } elseif ($recentAvg < $mean * 0.85) {
            $insights[] = '🔻 Recent sales have been below average — prediction is conservatively adjusted.';
        }

        return $insights;
    }

    /** Simple arithmetic mean. */
    private function mean(array $values): float
    {
        return count($values) > 0 ? array_sum($values) / count($values) : 0;
    }

    /** Population standard deviation. */
    private function stdDev(array $values): float
    {
        $n    = count($values);
        if ($n < 2) return 0;
        $mean = $this->mean($values);
        $sq   = array_map(fn($v) => ($v - $mean) ** 2, $values);
        return sqrt(array_sum($sq) / $n);
    }
}
