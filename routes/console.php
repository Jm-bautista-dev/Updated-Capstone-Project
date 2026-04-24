<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('inventory:daily-report')->dailyAt('19:00');

// Prune personal access tokens that haven't been used in 90 days
Schedule::call(function () {
    \Laravel\Sanctum\PersonalAccessToken::where('last_used_at', '<', now()->subDays(90))
        ->orWhere(function ($query) {
            $query->whereNull('last_used_at')
                  ->where('created_at', '<', now()->subDays(90));
        })
        ->delete();
})->daily();
