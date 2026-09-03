<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetSecurityHeaders
{
    /**
     * Handle an incoming request and attach production-grade HTTP security headers.
     *
     * @param  \Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 0. Remove X-Powered-By header to prevent technology footprint disclosure
        if (function_exists('header_remove')) {
            @header_remove('X-Powered-By');
        }

        $response = $next($request);

        $response->headers->remove('X-Powered-By');

        // 1. Strict-Transport-Security (HSTS)
        // Enforce 1-year max-age with all subdomains when running in production or over HTTPS
        $isHttps = $request->isSecure()
            || $request->header('X-Forwarded-Proto') === 'https'
            || app()->environment('production');

        if ($isHttps) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }

        // 2. Clickjacking Protection (Legacy header + CSP frame-ancestors)
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // 3. MIME-Type Sniffing Protection
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // 4. Referrer Policy
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 5. Permissions Policy (Least privilege; enables same-origin Geolocation for Maps/Rider tracking)
        $response->headers->set(
            'Permissions-Policy',
            'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), display-capture=(), midi=(), magnetometer=(), gyroscope=(), accelerometer=()'
        );

        // 6. Content Security Policy (CSP)
        // Explicitly allows same-origin assets, OpenStreetMap tile servers, Google Fonts, and Pusher/Reverb WebSockets
        $cspDirectives = [
            "default-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'self'",
            "object-src 'none'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://*.openstreetmap.org",
            "connect-src 'self' https://nominatim.openstreetmap.org wss://*.pusher.com https://*.pusher.com https://*.pusherapp.com https://sockjs-*.pusher.com wss: ws:",
            "frame-src 'self' https://www.openstreetmap.org",
        ];

        if ($isHttps) {
            $cspDirectives[] = "upgrade-insecure-requests";
        }

        $response->headers->set('Content-Security-Policy', implode('; ', $cspDirectives));

        // 7. Prevent caching on sensitive dynamic web pages so Back button does not expose stale session data
        if (!$request->is('storage/*') && !$request->is('build/*') && !$request->is('images/*') && !$request->is('favicon.ico')) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, post-check=0, pre-check=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');
        }

        return $response;
    }
}
