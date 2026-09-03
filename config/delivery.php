<?php

return [
    'max_distance_km'            => (float) env('DELIVERY_MAX_DISTANCE_KM', 50.0),
    'free_distance_km'           => (float) env('DELIVERY_FREE_DISTANCE_KM', 1.0),
    'max_delivery_fee'           => (float) env('DELIVERY_MAX_FEE', 300.00),
    'delivery_fee_warning_ratio' => (float) env('DELIVERY_FEE_WARNING_RATIO', 0.75),
];

