<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GoogleAuthService
{
    /**
     * Default canonical Google Client IDs authorized for the Maki Desu Mobile App.
     */
    protected const DEFAULT_CLIENT_IDS = [
        '817393512526-i3p0lcoqkh616826c6flr9mt2u06a4ij.apps.googleusercontent.com', // Web Client ID
        '463425689467-vabq08tcesgjjjbaq222tk95rvrjd6ge.apps.googleusercontent.com', // iOS Client ID
    ];

    /**
     * Google OAuth2 token info endpoint.
     */
    protected string $tokenInfoEndpoint = 'https://oauth2.googleapis.com/tokeninfo';

    /**
     * Verify a Google OAuth ID Token (JWT) and extract verified user claims.
     *
     * @param string $idToken
     * @return array{email: string, sub: string, given_name: string, family_name: string, name: string, picture: ?string, aud: string, exp: int}|null
     */
    public function verifyIdToken(string $idToken): ?array
    {
        $idToken = trim($idToken);
        if (empty($idToken)) {
            return null;
        }

        try {
            $response = Http::timeout(10)
                ->acceptJson()
                ->get($this->tokenInfoEndpoint, [
                    'id_token' => $idToken,
                ]);

            if (!$response->successful()) {
                Log::warning('[GOOGLE AUTH] Google token verification request failed', [
                    'status' => $response->status(),
                    'body'   => $response->json() ?? $response->body(),
                ]);
                return null;
            }

            $payload = $response->json();
            if (!is_array($payload) || empty($payload)) {
                return null;
            }

            // 1. Check expiration (exp)
            $exp = isset($payload['exp']) ? (int) $payload['exp'] : 0;
            if ($exp > 0 && $exp <= time()) {
                Log::warning('[GOOGLE AUTH] Google token is expired', [
                    'exp' => $exp,
                    'now' => time(),
                ]);
                return null;
            }

            // 2. Validate Audience (aud)
            $aud = (string) ($payload['aud'] ?? '');
            if (!$this->isAuthorizedAudience($aud)) {
                Log::warning('[GOOGLE AUTH] Google token audience rejected', [
                    'aud'     => $aud,
                    'allowed' => $this->getAllowedClientIds(),
                ]);
                return null;
            }

            // 3. Extract & Validate Email
            $email = strtolower(trim((string) ($payload['email'] ?? '')));
            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                Log::warning('[GOOGLE AUTH] Missing or invalid email in Google token claims', [
                    'email' => $email,
                ]);
                return null;
            }

            // 4. Extract verified claims
            $sub = (string) ($payload['sub'] ?? '');
            $givenName = trim((string) ($payload['given_name'] ?? ''));
            $familyName = trim((string) ($payload['family_name'] ?? ''));
            $name = trim((string) ($payload['name'] ?? ''));
            $picture = !empty($payload['picture']) ? (string) $payload['picture'] : null;

            return [
                'email'       => $email,
                'sub'         => $sub,
                'given_name'  => $givenName,
                'family_name' => $familyName,
                'name'        => $name,
                'picture'     => $picture,
                'aud'         => $aud,
                'exp'         => $exp,
            ];
        } catch (\Throwable $e) {
            Log::error('[GOOGLE AUTH] Exception during Google ID token verification', [
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Check if the audience (aud) matches any authorized client ID.
     */
    public function isAuthorizedAudience(string $aud): bool
    {
        if (empty($aud)) {
            return false;
        }

        return in_array($aud, $this->getAllowedClientIds(), true);
    }

    /**
     * Get all authorized Google OAuth Client IDs (configured + defaults).
     *
     * @return list<string>
     */
    public function getAllowedClientIds(): array
    {
        $configured = (array) config('services.google.client_ids', []);
        $merged = array_merge(self::DEFAULT_CLIENT_IDS, $configured);

        return array_values(array_unique(array_filter($merged)));
    }
}
