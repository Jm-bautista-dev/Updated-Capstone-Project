<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     * Enforces strict super_admin authorization. Normal admins, cashiers, riders, and customers are rejected.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || !$user->isSuperAdmin()) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('v1/*')) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'Forbidden: Super Admin privileges required.'
                ], 403);
            }

            if ($request->header('X-Inertia')) {
                $target = match ($user?->role) {
                    'admin'   => '/dashboard',
                    'cashier' => '/pos',
                    default   => '/menu',
                };
                return redirect($target)->with('error', 'Super Admin access required.');
            }

            abort(403, 'Forbidden: Super Admin privileges required.');
        }

        return $next($request);
    }
}
