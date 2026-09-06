<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  \Closure  $next
     * @param  string  ...$roles
     * @return Response
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();
        
        // Safely check for role (handle missing column gracefully)
        $userRole = null;
        if ($user) {
            try {
                $userRole = $user->role;
            } catch (\Exception $e) {
                // Column probably missing
                $userRole = 'customer'; // Default fallback
            }
        }

        if (!$user || !in_array($userRole, $roles)) {
            // If it's an API request, return 403 Forbidden JSON
            if ($request->expectsJson() || $request->is('api/*') || $request->is('v1/*')) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized: Access restricted.'
                ], 403);
            }

            // For web and Inertia requests, redirect to their role's authorized landing page
            $target = match($userRole) {
                'super_admin' => '/super-admin',
                'admin'       => '/dashboard',
                'cashier'     => '/pos',
                default       => '/menu',
            };
            return redirect($target);
        }

        return $next($request);
    }
}
