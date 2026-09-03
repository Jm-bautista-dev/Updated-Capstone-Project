<?php

return [
    /*
    |--------------------------------------------------------------------------
    | COD & Order Abuse Prevention Configuration
    |--------------------------------------------------------------------------
    |
    | Centralized business rules and risk thresholds for Cash On Delivery (COD)
    | orders, delivery attempt tracking, and customer trust evaluation.
    |
    */

    'enabled' => env('COD_SECURITY_ENABLED', true),

    // Active order limits
    'max_active_orders_per_customer' => env('MAX_ACTIVE_ORDERS_PER_CUSTOMER', 2),

    // Rolling window for active risk calculation (days)
    'rolling_window_days' => env('COD_ROLLING_WINDOW_DAYS', 60),

    // Temporary restriction duration when algorithmically triggered (days)
    'temporary_restriction_days' => env('COD_TEMPORARY_RESTRICTION_DAYS', 7),

    // Require verified phone number for COD orders
    'require_verified_phone_for_cod' => env('REQUIRE_VERIFIED_PHONE_FOR_COD', true),

    // Maximum COD amounts by risk level (PHP currency)
    'max_cod_amount' => [
        'LOW_RISK'    => env('COD_MAX_AMOUNT_LOW_RISK', 5000.00),
        'MEDIUM_RISK' => env('COD_MAX_AMOUNT_MEDIUM_RISK', 1500.00),
        'HIGH_RISK'   => env('COD_MAX_AMOUNT_HIGH_RISK', 500.00),
        'RESTRICTED'  => 0.00,
    ],

    // Risk calculation thresholds within rolling window
    'risk_thresholds' => [
        'medium_risk_refusals'       => 1,
        'high_risk_refusals'         => 2,
        'restricted_refusals'        => 3,
        'medium_risk_failed_events'  => 2,
        'high_risk_failed_events'    => 3,
        'restricted_failed_events'   => 5,
        'high_risk_failed_ratio'     => 0.40, // 40% failed COD orders if >= 3 total orders in window
        'minimum_orders_for_ratio'   => 3,
    ],

    // Consecutive successful delivered orders required to lower risk
    'trust_restoration' => [
        'consecutive_successful_to_demote' => 2,
    ],

    // Controlled failure reason taxonomy & attribution mapping
    'failure_reasons' => [
        'CUSTOMER_REFUSED_ORDER' => [
            'label'       => 'Customer Refused Order',
            'category'    => 'customer_attributable',
            'affects_cod' => true,
        ],
        'CUSTOMER_UNAVAILABLE' => [
            'label'       => 'Customer Unavailable / Not Home',
            'category'    => 'customer_attributable',
            'affects_cod' => true,
        ],
        'INVALID_ADDRESS' => [
            'label'       => 'Invalid / Incomplete Address',
            'category'    => 'customer_attributable',
            'affects_cod' => true,
        ],
        'CUSTOMER_UNREACHABLE' => [
            'label'       => 'Customer Phone Unreachable / No Answer',
            'category'    => 'customer_attributable',
            'affects_cod' => true,
        ],
        'CUSTOMER_REQUESTED_CANCELLATION' => [
            'label'       => 'Customer Requested Cancellation Upon Arrival',
            'category'    => 'customer_attributable',
            'affects_cod' => true,
        ],
        'RIDER_UNABLE_TO_LOCATE' => [
            'label'       => 'Rider Unable to Locate Area',
            'category'    => 'rider_issue',
            'affects_cod' => false,
        ],
        'BUSINESS_DELAY' => [
            'label'       => 'Restaurant / Kitchen Delay',
            'category'    => 'business_delay',
            'affects_cod' => false,
        ],
        'RIDER_ISSUE' => [
            'label'       => 'Rider Breakdown / Emergency',
            'category'    => 'rider_issue',
            'affects_cod' => false,
        ],
        'SYSTEM_ISSUE' => [
            'label'       => 'System / Network Error',
            'category'    => 'system_issue',
            'affects_cod' => false,
        ],
        'OTHER' => [
            'label'       => 'Other Non-Customer Reason',
            'category'    => 'other',
            'affects_cod' => false,
        ],
    ],

    // Active order statuses that count towards active order limits
    'active_order_statuses' => [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'assigned_to_rider',
        'picked_up',
        'in_transit',
        'cancellation_requested',
    ],
];
