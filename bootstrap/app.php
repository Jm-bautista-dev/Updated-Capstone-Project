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

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'sanctum/*',
            'v1/*',
        ]);

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
            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*')) {
                // Diagnostic: Log 403 reasons
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException || $e->getCode() == 403) {
                    \Illuminate\Support\Facades\Log::warning('[SECURITY DEBUG] 403 Forbidden', [
                        'path' => $request->path(),
                        'method' => $request->method(),
                        'csrf_token_present' => $request->hasHeader('X-CSRF-TOKEN') ? 'YES' : 'NO',
                        'requested_with' => $request->header('X-Requested-With'),
                        'origin' => $request->header('Origin') ?: 'NONE',
                        'ip' => $request->ip(),
                        'error_message' => $e->getMessage(),
                    ]);
                }
                return true;
            }

            return $request->expectsJson();
        });
    })->create();
