<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | The mobile app (React Native) authenticates via Sanctum Bearer tokens —
    | it is stateless and does NOT need credentials (cookies). Setting
    | supports_credentials=true with allowed_origins=['*'] is invalid per
    | the CORS spec and causes browsers/apps to reject the response.
    |
    | Fix: supports_credentials=false for API routes (token-based mobile auth).
    | The web SPA is same-domain so it is not subject to CORS at all.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'v1/*', 'customer/*'],

    'allowed_methods' => ['*'],

    // '*' is valid only when supports_credentials is false.
    // Mobile app uses Bearer token — no cookies, no credentials needed.
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'X-Requested-With', 'Authorization', 'Accept', 'X-XSRF-TOKEN'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // IMPORTANT: Must be false when allowed_origins is '*'.
    // Mobile Bearer-token auth does not require cookies/credentials.
    'supports_credentials' => false,

];
