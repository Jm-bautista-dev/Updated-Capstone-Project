<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MustChangePassword
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password && !$request->routeIs('first-login.change', 'first-login.update', 'logout')) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Password change required.', 'redirect' => '/change-password'], 403)
                : redirect()->route('first-login.change');
        }

        return $next($request);
    }
}
