<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiResponseWrapper
{
    /**
     * Handle an incoming request.
     * 
     * Adds network resilience headers and standardizes JSON responses
     * for mobile API endpoints.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // --- STEP 6: NETWORK RESILIENCE HEADERS ---
        // Force no-cache for API consistency across ISPs and weak networks
        $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', '0');

        // --- STEP 4: GLOBAL API RESPONSE FORMATTER ---
        // Only wrap if it's a JSON response and we are in a mobile route group
        if ($response instanceof JsonResponse && ($request->is('api/v1/mobile/*') || $request->is('api/mobile/*'))) {
            $data = $response->getData(true);

            // If already formatted by the wrapper controller, don't double wrap
            if (!isset($data['status'])) {
                $response->setData([
                    'status' => $response->isSuccessful() ? 'success' : 'error',
                    'data' => $data,
                    'meta' => [
                        'timestamp' => now()->toIso8601String(),
                        'api_version' => 'v1-mobile'
                    ]
                ]);
            }
        }

        return $response;
    }
}
