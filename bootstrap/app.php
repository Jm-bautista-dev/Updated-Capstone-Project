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
        $middleware->redirectTo(
            guests: '/login',
            users: function (\Illuminate\Http\Request $request) {
                $user = $request->user();
                if (!$user) {
                    return '/login';
                }
                if ($user->isSuperAdmin()) {
                    return '/super-admin';
                }
                if ($user->isAdmin()) {
                    return '/dashboard';
                }
                if ($user->isCashier()) {
                    return '/pos';
                }
                return '/menu';
            }
        );

        $middleware->trustProxies(at: '*');

        $middleware->statefulApi();

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->validateCsrfTokens(except: [
            'api/*',
            'sanctum/*',
            'v1/*',
            'broadcasting/*',
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\CheckAccountStatusMiddleware::class,
        ]);

        $middleware->alias([
            'role'                 => \App\Http\Middleware\RoleMiddleware::class,
            'must_change_password' => \App\Http\Middleware\MustChangePassword::class,
            'super_admin'          => \App\Http\Middleware\SuperAdminMiddleware::class,
            'system_maintenance'   => \App\Http\Middleware\SystemMaintenanceMiddleware::class,
            'account_status'       => \App\Http\Middleware\CheckAccountStatusMiddleware::class,
        ]);

        $middleware->append(\App\Http\Middleware\SetSecurityHeaders::class);
        $middleware->append(\App\Http\Middleware\SystemMaintenanceMiddleware::class);
        $middleware->append(\App\Http\Middleware\NetworkTraceMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(function ($request, $e) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*') || $request->is('broadcasting/*')) {
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

        // Force JSON for all API 401s (Unauthenticated)
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*') || $request->expectsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        // Force JSON for all API 404s (Route / Model Not Found)
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*') || $request->expectsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Route not found.',
                ], 404);
            }
        });

        // Force JSON for all API 403s (Forbidden / Access Denied)
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*') || $request->expectsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Access denied.',
                ], 403);
            }
        });

        // Safe JSON response for API 419s (CSRF / Session Expired)
        $exceptions->render(function (\Illuminate\Session\TokenMismatchException $e, \Illuminate\Http\Request $request) {
            \Illuminate\Support\Facades\Log::warning('[CSRF/SESSION DIAGNOSTIC] 419 Page Expired', [
                'path'                   => $request->path(),
                'method'                 => $request->method(),
                'ip'                     => $request->ip(),
                'user_agent'             => $request->userAgent(),
                'csrf_header_present'    => $request->hasHeader('X-CSRF-TOKEN') ? 'YES' : 'NO',
                'xsrf_header_present'    => $request->hasHeader('X-XSRF-TOKEN') ? 'YES' : 'NO',
                'token_input_present'    => $request->filled('_token') ? 'YES' : 'NO',
                'session_cookie_present' => $request->hasCookie(config('session.cookie')) ? 'YES' : 'NO',
                'is_authenticated'       => $request->user() ? 'YES' : 'NO',
            ]);

            if ($request->is('api/*') || $request->is('v1/*') || $request->is('sanctum/*') || $request->expectsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'CSRF token mismatch or session expired.',
                ], 419);
            }
        });

        // Automatically capture application errors into SystemErrorLog table
        $exceptions->reportable(function (\Throwable $e) {
            try {
                // Ignore standard HTTP 404 / 401 exceptions if needed
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return;
                }

                $file = $e->getFile();
                $line = $e->getLine();
                $exceptionClass = get_class($e);
                $fingerprint = md5($exceptionClass . ':' . $file . ':' . $line);

                $request   = request();
                $endpoint  = $request->path();
                $method    = $request->method();
                $user      = $request->user();
                $requestId = $request->header('X-Request-ID') ?? (string) \Illuminate\Support\Str::uuid();

                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : ($e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500);
                $severity   = $statusCode >= 500 ? 'critical' : ($statusCode >= 400 ? 'warning' : 'error');

                $sanitizedTrace = \App\Services\AuditLogger::sanitize(
                    array_slice($e->getTrace(), 0, 15)
                );

                $existing = \App\Models\SystemErrorLog::where('error_fingerprint', $fingerprint)
                    ->where('is_resolved', false)
                    ->first();

                if ($existing) {
                    $existing->increment('occurrences', 1, [
                        'last_seen_at' => now(),
                        'message'      => substr($e->getMessage(), 0, 1000),
                    ]);
                } else {
                    \App\Models\SystemErrorLog::create([
                        'error_fingerprint' => $fingerprint,
                        'severity'          => $severity,
                        'exception_class'   => $exceptionClass,
                        'message'           => substr($e->getMessage(), 0, 1000),
                        'status_code'       => $statusCode,
                        'endpoint'          => $endpoint,
                        'method'            => $method,
                        'file'              => $file,
                        'line'              => $line,
                        'trace'             => json_encode($sanitizedTrace, JSON_PRETTY_PRINT),
                        'request_id'        => $requestId,
                        'user_id'           => $user?->id,
                        'user_role'         => $user?->role,
                        'first_seen_at'     => now(),
                        'last_seen_at'      => now(),
                    ]);
                }
            } catch (\Throwable $loggingError) {
                // Ignore errors during error logging to avoid infinite loops
            }
        });
    })->create();
