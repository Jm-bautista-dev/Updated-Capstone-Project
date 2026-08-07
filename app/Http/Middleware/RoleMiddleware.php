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
            // If it's an Inertia request, redirect to their role's home page
            if ($request->header('X-Inertia')) {
                $target = match($userRole) {
                    'admin' => '/dashboard',
                    'cashier' => '/pos',
                    default => '/menu',
                };
                return redirect($target);
            }
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized: Access restricted.'
            ], 403);
        }

        return $next($request);
    }
}
