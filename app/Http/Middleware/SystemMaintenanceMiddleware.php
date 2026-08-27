<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class SystemMaintenanceMiddleware
{
    /**
     * Routes/endpoints exempt from maintenance checks.
     */
    protected array $except = [
        'super-admin*',
        'api/super-admin*',
        'api/v1/system/status',
        'login',
        'logout',
        'sanctum/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Check if maintenance mode is active
        $isMaintenance = SystemSetting::get('maintenance_mode', false);
        if (!$isMaintenance) {
            return $next($request);
        }

        // 2. Allow Super Admin users to bypass maintenance mode entirely
        $user = $request->user();
        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // 3. Allow exempted paths (Super Admin panel, login, status check)
        foreach ($this->except as $path) {
            if ($request->is($path)) {
                return $next($request);
            }
        }

        // Fetch maintenance metadata
        $title     = SystemSetting::get('maintenance_title', 'System Under Maintenance');
        $message   = SystemSetting::get('maintenance_message', 'We are performing scheduled maintenance. Please check back shortly.');
        $eta       = SystemSetting::get('estimated_restoration_time', '30 minutes');
        $appVer    = SystemSetting::get('app_version', '2.5.0');

        // 4. API Requests -> return HTTP 503 JSON response
        if ($request->expectsJson() || $request->is('api/*') || $request->is('v1/*')) {
            return response()->json([
                'status'                     => 'error',
                'success'                    => false,
                'maintenance'                => true,
                'message'                    => $message,
                'maintenance_title'          => $title,
                'estimated_restoration_time' => $eta,
                'application_version'        => $appVer,
            ], 503);
        }

        // 5. Web / Inertia Requests -> Render Maki Desu branded 503 Maintenance Page
        if ($request->header('X-Inertia')) {
            return Inertia::render('Errors/Maintenance', [
                'title'                    => $title,
                'message'                  => $message,
                'estimatedRestorationTime' => $eta,
                'applicationVersion'       => $appVer,
            ])->toResponse($request)->setStatusCode(503);
        }

        return response()->view('errors.maintenance', [
            'title'                    => $title,
            'message'                  => $message,
            'estimatedRestorationTime' => $eta,
        ], 503);
    }
}
