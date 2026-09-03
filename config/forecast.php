<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Minimum Historical Data Window (Days)
    |--------------------------------------------------------------------------
    | Minimum number of consecutive historical days required before a model
    | can be evaluated for Production Ready gating (default: 90 days).
    |
    */
    'min_history_days' => (int) env('FORECAST_MIN_HISTORY_DAYS', 90),

    /*
    |--------------------------------------------------------------------------
    | Error Thresholds for Production Readiness (%)
    |--------------------------------------------------------------------------
    | Maximum permissible error thresholds on out-of-sample walk-forward
    | validation sets for a model to be approved as Production Ready.
    |
    */
    'max_mape' => (float) env('FORECAST_MAX_MAPE', 20.0),
    'max_wape' => (float) env('FORECAST_MAX_WAPE', 20.0),

    /*
    |--------------------------------------------------------------------------
    | Minimum Validation Days
    |--------------------------------------------------------------------------
    | The minimum size of the out-of-sample test set (days).
    |
    */
    'min_validation_days' => (int) env('FORECAST_MIN_VAL_DAYS', 14),
];
