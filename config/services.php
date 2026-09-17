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

];
