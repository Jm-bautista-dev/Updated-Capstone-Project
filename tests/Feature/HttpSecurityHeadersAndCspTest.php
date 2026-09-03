<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HttpSecurityHeadersAndCspTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test 1: Normal Web Response contains all required security headers.
     */
    public function test_web_response_contains_hardened_security_headers(): void
    {
        $response = $this->get('/');

        // 1. Clickjacking Protection
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');

        // 2. MIME-Type Sniffing Protection
        $response->assertHeader('X-Content-Type-Options', 'nosniff');

        // 3. Referrer Policy
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // 4. Permissions Policy
        $this->assertTrue($response->headers->has('Permissions-Policy'));
        $permissionsPolicy = $response->headers->get('Permissions-Policy');
        $this->assertStringContainsString('geolocation=(self)', $permissionsPolicy);
        $this->assertStringContainsString('camera=()', $permissionsPolicy);
        $this->assertStringContainsString('microphone=()', $permissionsPolicy);

        // 5. Content Security Policy
        $this->assertTrue($response->headers->has('Content-Security-Policy'));
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString("default-src 'self'", $csp);
        $this->assertStringContainsString("frame-ancestors 'self'", $csp);
        $this->assertStringContainsString("object-src 'none'", $csp);
        $this->assertStringContainsString("fonts.googleapis.com", $csp);
        $this->assertStringContainsString("fonts.gstatic.com", $csp);
        $this->assertStringContainsString("tile.openstreetmap.org", $csp);
        $this->assertStringContainsString("nominatim.openstreetmap.org", $csp);
        $this->assertStringContainsString("pusher.com", $csp);
    }

    /**
     * Test 2: HTTPS / Forwarded-Proto request includes HSTS Strict-Transport-Security.
     */
    public function test_https_request_enforces_hsts(): void
    {
        $response = $this->withHeaders([
            'X-Forwarded-Proto' => 'https',
        ])->get('/');

        $response->assertHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        $csp = $response->headers->get('Content-Security-Policy');
        $this->assertStringContainsString('upgrade-insecure-requests', $csp);
    }

    /**
     * Test 3: API responses preserve valid JSON structure and contract while attaching security headers.
     */
    public function test_api_responses_retain_security_headers_and_valid_json(): void
    {
        $response = $this->getJson('/api/v1/system/status');

        $response->assertStatus(200);
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertJsonStructure([
            'status',
            'maintenance',
            'server_time',
        ]);
    }

    /**
     * Test 4: Authenticated page (Dashboard) retains security headers.
     */
    public function test_authenticated_page_retains_security_headers(): void
    {
        $admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
        ]);

        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $this->assertTrue($response->headers->has('Content-Security-Policy'));
    }
}
