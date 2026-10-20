<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google_vision' => [
        'key' => env('GOOGLE_VISION_API_KEY'),
    ],

    'google' => [
        'web_client_id' => env('GOOGLE_WEB_CLIENT_ID', '817393512526-i3p0lcoqkh616826c6flr9mt2u06a4ij.apps.googleusercontent.com'),
        'ios_client_id' => env('GOOGLE_IOS_CLIENT_ID', '463425689467-vabq08tcesgjjjbaq222tk95rvrjd6ge.apps.googleusercontent.com'),
        'client_ids'    => array_values(array_filter([
            env('GOOGLE_WEB_CLIENT_ID', '817393512526-i3p0lcoqkh616826c6flr9mt2u06a4ij.apps.googleusercontent.com'),
            env('GOOGLE_IOS_CLIENT_ID', '463425689467-vabq08tcesgjjjbaq222tk95rvrjd6ge.apps.googleusercontent.com'),
            env('GOOGLE_CLIENT_ID'),
            env('GOOGLE_ANDROID_CLIENT_ID'),
        ])),
    ],

    'openrouteservice' => [
        'key'      => env('OPENROUTESERVICE_API_KEY'),
        'base_url' => env('OPENROUTESERVICE_BASE_URL', 'https://api.openrouteservice.org/v2/directions/driving-car'),
    ],

    'osrm' => [
        'base_url' => env('OSRM_BASE_URL', 'https://router.project-osrm.org/route/v1/driving'),
    ],

    'iprog_sms' => [
        'api_token'             => env('IPROG_SMS_API_TOKEN', env('IPROG_API_TOKEN', env('IPROG_API_KEY', env('IPROG_SMS_KEY', env('IPROG_TOKEN'))))),
        'base_url'              => env('IPROG_SMS_BASE_URL', 'https://www.iprogsms.com/api/v1'),
        'timeout'               => (int) env('IPROG_SMS_TIMEOUT', 15),
        'expires_in_minutes'    => (int) env('IPROG_SMS_OTP_EXPIRY_MINUTES', 5),
        'resend_cooldown_sec'   => (int) env('IPROG_SMS_RESEND_COOLDOWN_SEC', 60),
        'max_send_per_hour'     => (int) env('IPROG_SMS_MAX_SEND_PER_HOUR', 3),
        'max_send_per_day'      => (int) env('IPROG_SMS_MAX_SEND_PER_DAY', 5),
        'max_ip_send_per_hour'  => (int) env('IPROG_SMS_MAX_IP_SEND_PER_HOUR', 10),
        'daily_global_send_cap' => (int) env('IPROG_SMS_DAILY_GLOBAL_CAP', 200),
        'max_attempts'          => (int) env('IPROG_SMS_MAX_ATTEMPTS', 5),
        'lockout_duration_sec'  => (int) env('IPROG_SMS_LOCKOUT_SEC', 900),
        'ssl_verify'            => env('IPROG_SMS_SSL_VERIFY', true),
        'ca_bundle'             => env('IPROG_SMS_CA_BUNDLE', file_exists('C:\\xampp\\perl\\vendor\\lib\\Mozilla\\CA\\cacert.pem') ? 'C:\\xampp\\perl\\vendor\\lib\\Mozilla\\CA\\cacert.pem' : null),
    ],

];
