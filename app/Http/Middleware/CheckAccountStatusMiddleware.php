<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckAccountStatusMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            $status = $user->account_status ?? 'active';

            if ($status === 'suspended') {
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success'        => false,
                        'account_status' => 'suspended',
                        'message'        => 'Your account has been suspended. Please contact MAKI DESU support.',
                    ], 403);
                }

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'Your account has been suspended. Please contact MAKI DESU support.',
                ]);
            }

            if ($status === 'deactivated') {
                if ($request->expectsJson() || $request->is('api/*')) {
                    return response()->json([
                        'success'        => false,
                        'account_status' => 'deactivated',
                        'message'        => 'This account is currently inactive. Please contact MAKI DESU support.',
                    ], 403);
                }

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'email' => 'This account is currently inactive. Please contact MAKI DESU support.',
                ]);
            }
        }

        return $next($request);
    }
}
