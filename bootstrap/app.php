<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            \App\Http\Middleware\SetSecurityHeaders::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        ]);

        $middleware->append(\App\Http\Middleware\NetworkTraceMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, $e) {
            if ($request->is('api/*')) {
                // Diagnostic: Log 401 reasons
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $header = $request->header('Authorization');
                    $tokenStart = $header ? substr($header, 0, 15) . '...' : 'NONE';
                    \Illuminate\Support\Facades\Log::warning('[AUTH DEBUG] 401 Unauthenticated', [
                        'path' => $request->path(),
                        'method' => $request->method(),
                        'header_present' => $header ? 'YES' : 'NO',
                        'token_preview' => $tokenStart,
                        'origin' => $request->header('Origin') ?: 'NONE',
                        'ip' => $request->ip(),
                    ]);
                }
                return true;
            }

            return $request->expectsJson();
        });
    })->create();
