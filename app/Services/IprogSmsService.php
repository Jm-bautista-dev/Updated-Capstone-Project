<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Throwable;

class IprogSmsService
{
    protected ?string $apiToken;
    protected string $baseUrl;
    protected int $timeout;
    protected int $defaultExpiryMinutes;

    public function __construct(
        ?string $apiToken = null,
        ?string $baseUrl = null,
        ?int $timeout = null,
        ?int $defaultExpiryMinutes = null
    ) {
        $this->apiToken = $apiToken ?? config('services.iprog_sms.api_token');
        $this->baseUrl  = rtrim($baseUrl ?? config('services.iprog_sms.base_url', 'https://www.iprogsms.com/api/v1'), '/');
        $this->timeout  = $timeout ?? (int) config('services.iprog_sms.timeout', 15);
        $this->defaultExpiryMinutes = $defaultExpiryMinutes ?? (int) config('services.iprog_sms.expires_in_minutes', 5);
    }

    /**
     * Check if IPROG SMS integration is properly configured with an API token.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiToken);
    }

    /**
     * Send an OTP to the given phone number via IPROG SMS API.
     * Endpoint: POST https://www.iprogsms.com/api/v1/otp/send_otp
     *
     * @param string $phoneNumber Recipient phone number (normalized to PH format)
     * @param string|null $message Custom message template containing :otp placeholder
     * @param int|null $expiresInMinutes OTP expiry in minutes (allowed range 1-60)
     * @return array [
     *     'success'            => bool,
     *     'status'             => string ('success'|'error'),
     *     'message'            => string,
     *     'phone_number'       => string (canonical),
     *     'masked_phone'       => string,
     *     'expires_in_minutes' => int,
     *     'error_code'         => string|null,
     * ]
     */
    public function sendOtp(string $phoneNumber, ?string $message = null, ?int $expiresInMinutes = null): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phoneNumber);
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);

        if (!$normalizedPhone || !PhoneNumberService::isValidPhMobile($normalizedPhone)) {
            Log::warning('[IPROG SMS] Send OTP rejected - Invalid phone number format', [
                'masked_phone' => $maskedPhone,
            ]);

            return [
                'success'            => false,
                'status'             => 'error',
                'message'            => 'Invalid Philippine mobile number. Must be an 11-digit number starting with 09.',
                'phone_number'       => $normalizedPhone ?? $phoneNumber,
                'masked_phone'       => $maskedPhone,
                'expires_in_minutes' => 0,
                'error_code'         => 'INVALID_PHONE_NUMBER',
            ];
        }

        if (!$this->isConfigured()) {
            Log::error('[IPROG SMS] Send OTP failed - Missing API token configuration');

            return [
                'success'            => false,
                'status'             => 'error',
                'message'            => 'SMS verification service is temporarily unavailable. Please try again later.',
                'phone_number'       => $normalizedPhone,
                'masked_phone'       => $maskedPhone,
                'expires_in_minutes' => 0,
                'error_code'         => 'SERVICE_UNCONFIGURED',
            ];
        }

        $expiry = $expiresInMinutes ?? $this->defaultExpiryMinutes;
        if ($expiry < 1 || $expiry > 60) {
            $expiry = 5;
        }

        $defaultMessage = 'Your MAKI DESU verification code is :otp. It expires in ' . $expiry . ' minutes. Do not share this code with anyone.';
        $finalMessage = !empty($message) && str_contains($message, ':otp') ? $message : $defaultMessage;

        $payload = [
            'api_token'          => $this->apiToken,
            'phone_number'       => $normalizedPhone,
            'message'            => $finalMessage,
            'expires_in_minutes' => $expiry,
        ];

        $endpoint = "{$this->baseUrl}/otp/send_otp";

        try {
            Log::info('[IPROG SMS] Dispatching Send OTP Request', [
                'endpoint'     => $endpoint,
                'masked_phone' => $maskedPhone,
                'expiry_min'   => $expiry,
            ]);

            $response = $this->buildHttpClient()
                ->post($endpoint, $payload);

            $status = $response->status();
            $data = $response->json();

            // Check if provider returned non-2xx HTTP code
            if (!$response->successful() || !is_array($data)) {
                $providerMessage = is_array($data) ? ($data['message'] ?? 'SMS dispatch rejected') : 'Provider server error';

                Log::error('[IPROG SMS] Send OTP Provider HTTP Error', [
                    'http_status'   => $status,
                    'masked_phone'  => $maskedPhone,
                    'safe_message'  => $providerMessage,
                ]);

                return [
                    'success'            => false,
                    'status'             => 'error',
                    'message'            => $this->sanitizeProviderErrorMessage($providerMessage),
                    'phone_number'       => $normalizedPhone,
                    'masked_phone'       => $maskedPhone,
                    'expires_in_minutes' => 0,
                    'error_code'         => 'PROVIDER_ERROR_' . $status,
                ];
            }

            // Inspect provider JSON response status
            $providerStatus = strtolower((string) ($data['status'] ?? ''));
            if ($providerStatus !== 'success' && $providerStatus !== '200') {
                $errorMessage = $data['message'] ?? 'Failed to send verification code.';

                Log::warning('[IPROG SMS] Send OTP Provider Failure Status', [
                    'provider_status' => $providerStatus,
                    'masked_phone'    => $maskedPhone,
                    'safe_message'    => $errorMessage,
                ]);

                return [
                    'success'            => false,
                    'status'             => 'error',
                    'message'            => $this->sanitizeProviderErrorMessage($errorMessage),
                    'phone_number'       => $normalizedPhone,
                    'masked_phone'       => $maskedPhone,
                    'expires_in_minutes' => 0,
                    'error_code'         => 'PROVIDER_REJECTED',
                ];
            }

            // SUCCESSFUL SEND:
            // CRITICAL SECURITY RULE:
            // IPROG's documented send response includes `otp_code` in the returned data payload.
            // NEVER return `otp_code` or raw provider payload to the mobile app or client!
            // NEVER log the returned OTP!
            Log::info('[IPROG SMS] OTP Dispatched Successfully to Provider Queue', [
                'masked_phone' => $maskedPhone,
                'expiry_min'   => $expiry,
            ]);

            return [
                'success'            => true,
                'status'             => 'success',
                'message'            => 'Verification code sent successfully to ' . $maskedPhone . '.',
                'phone_number'       => $normalizedPhone,
                'masked_phone'       => $maskedPhone,
                'expires_in_minutes' => $expiry,
                'error_code'         => null,
            ];

        } catch (ConnectionException $e) {
            Log::error('[IPROG SMS] Send OTP Connection Timeout', [
                'masked_phone' => $maskedPhone,
                'exception'    => 'Connection timed out after ' . $this->timeout . 's',
            ]);

            return [
                'success'            => false,
                'status'             => 'error',
                'message'            => 'SMS verification provider timed out. Please try requesting a code again.',
                'phone_number'       => $normalizedPhone,
                'masked_phone'       => $maskedPhone,
                'expires_in_minutes' => 0,
                'error_code'         => 'PROVIDER_TIMEOUT',
            ];
        } catch (Throwable $e) {
            Log::error('[IPROG SMS] Send OTP Unexpected Exception', [
                'masked_phone' => $maskedPhone,
                'error'        => $e->getMessage(),
            ]);

            return [
                'success'            => false,
                'status'             => 'error',
                'message'            => 'Unable to send verification SMS at this time. Please try again.',
                'phone_number'       => $normalizedPhone,
                'masked_phone'       => $maskedPhone,
                'expires_in_minutes' => 0,
                'error_code'         => 'SYSTEM_ERROR',
            ];
        }
    }

    /**
     * Verify submitted OTP code with IPROG SMS API.
     * Endpoint: POST https://www.iprogsms.com/api/v1/otp/verify_otp
     *
     * @param string $phoneNumber Recipient phone number
     * @param string $otp The OTP code submitted by the user
     * @return array [
     *     'success'      => bool,
     *     'status'       => string ('success'|'error'),
     *     'message'      => string,
     *     'error_code'   => string|null,
     * ]
     */
    public function verifyOtp(string $phoneNumber, string $otp): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phoneNumber);
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);
        $cleanOtp = trim($otp);

        if (!$normalizedPhone || !PhoneNumberService::isValidPhMobile($normalizedPhone)) {
            return [
                'success'    => false,
                'status'     => 'error',
                'message'    => 'Invalid phone number format.',
                'error_code' => 'INVALID_PHONE_NUMBER',
            ];
        }

        if (empty($cleanOtp) || strlen($cleanOtp) < 4 || strlen($cleanOtp) > 10) {
            return [
                'success'    => false,
                'status'     => 'error',
                'message'    => 'Invalid verification code format.',
                'error_code' => 'INVALID_OTP_FORMAT',
            ];
        }

        if (!$this->isConfigured()) {
            Log::error('[IPROG SMS] Verify OTP failed - Missing API token configuration');

            return [
                'success'    => false,
                'status'     => 'error',
                'message'    => 'Verification service is temporarily unavailable.',
                'error_code' => 'SERVICE_UNCONFIGURED',
            ];
        }

        $payload = [
            'api_token'    => $this->apiToken,
            'phone_number' => $normalizedPhone,
            'otp'          => $cleanOtp,
        ];

        $endpoint = "{$this->baseUrl}/otp/verify_otp";

        try {
            Log::info('[IPROG SMS] Dispatching Verify OTP Request', [
                'endpoint'     => $endpoint,
                'masked_phone' => $maskedPhone,
            ]);

            $response = $this->buildHttpClient()
                ->post($endpoint, $payload);

            $status = $response->status();
            $data = $response->json();

            if (!$response->successful() || !is_array($data)) {
                $providerMessage = is_array($data) ? ($data['message'] ?? 'OTP verification failed') : 'Provider server error';

                Log::warning('[IPROG SMS] Verify OTP Provider Rejection', [
                    'http_status'  => $status,
                    'masked_phone' => $maskedPhone,
                    'safe_message' => $providerMessage,
                ]);

                return [
                    'success'    => false,
                    'status'     => 'error',
                    'message'    => $this->sanitizeProviderErrorMessage($providerMessage),
                    'error_code' => 'VERIFICATION_FAILED',
                ];
            }

            $providerStatus = strtolower((string) ($data['status'] ?? ''));
            if ($providerStatus !== 'success' && $providerStatus !== '200') {
                $failMessage = $data['message'] ?? 'Invalid or expired verification code.';

                Log::warning('[IPROG SMS] Verify OTP Code Mismatch or Expired', [
                    'provider_status' => $providerStatus,
                    'masked_phone'    => $maskedPhone,
                    'safe_message'    => $failMessage,
                ]);

                return [
                    'success'    => false,
                    'status'     => 'error',
                    'message'    => $this->sanitizeProviderErrorMessage($failMessage),
                    'error_code' => 'INVALID_OTP',
                ];
            }

            // Documented success: {"status": "success", "message": "OTP verified successfully"}
            Log::info('[IPROG SMS] OTP Verified Successfully by Provider', [
                'masked_phone' => $maskedPhone,
            ]);

            return [
                'success'    => true,
                'status'     => 'success',
                'message'    => 'Phone number verified successfully.',
                'error_code' => null,
            ];

        } catch (ConnectionException $e) {
            Log::error('[IPROG SMS] Verify OTP Connection Timeout', [
                'masked_phone' => $maskedPhone,
                'error'        => 'Connection timed out',
            ]);

            return [
                'success'    => false,
                'status'     => 'error',
                'message'    => 'Verification service timed out. Please try again.',
                'error_code' => 'PROVIDER_TIMEOUT',
            ];
        } catch (Throwable $e) {
            Log::error('[IPROG SMS] Verify OTP Unexpected Exception', [
                'masked_phone' => $maskedPhone,
                'error'        => $e->getMessage(),
            ]);

            return [
                'success'    => false,
                'status'     => 'error',
                'message'    => 'Unable to verify code at this time. Please try again.',
                'error_code' => 'SYSTEM_ERROR',
            ];
        }
    }

    /**
     * Check SMS credits load balance from provider.
     * Endpoint: GET https://www.iprogsms.com/api/v1/account/sms_credits?api_token=...
     */
    public function getCredits(): array
    {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'balance' => 0.0,
                'message' => 'API token not configured',
            ];
        }

        try {
            $response = $this->buildHttpClient()
                ->get("{$this->baseUrl}/account/sms_credits", [
                    'api_token' => $this->apiToken,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $balance = (float) ($data['data']['load_balance'] ?? 0.0);

                return [
                    'success' => true,
                    'balance' => $balance,
                    'message' => 'Credits retrieved successfully',
                ];
            }

            return [
                'success' => false,
                'balance' => 0.0,
                'message' => 'Failed to retrieve credits: ' . ($response->json('message') ?? 'Unknown error'),
            ];
        } catch (Throwable $e) {
            return [
                'success' => false,
                'balance' => 0.0,
                'message' => 'Connection error checking credits: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Build standard configured HTTP client for IPROG SMS API requests.
     */
    protected function buildHttpClient()
    {
        $options = [];
        $sslVerify = config('services.iprog_sms.ssl_verify', true);
        $caBundle = config('services.iprog_sms.ca_bundle');

        if (!$sslVerify) {
            $options['verify'] = false;
        } elseif (!empty($caBundle) && file_exists($caBundle)) {
            $options['verify'] = $caBundle;
        } elseif (file_exists('C:\\xampp\\perl\\vendor\\lib\\Mozilla\\CA\\cacert.pem')) {
            $options['verify'] = 'C:\\xampp\\perl\\vendor\\lib\\Mozilla\\CA\\cacert.pem';
        }

        $client = Http::asJson()
            ->acceptJson()
            ->timeout($this->timeout)
            ->connectTimeout(5);

        if (!empty($options)) {
            $client = $client->withOptions($options);
        }

        return $client;
    }

    /**
     * Sanitize provider error messages so no internal tokens or URLs leak to clients.
     */
    protected function sanitizeProviderErrorMessage(string $message): string
    {
        // Redact any potential token or sensitive patterns
        $sanitized = preg_replace('/[a-f0-9]{32,64}/i', '[REDACTED]', $message);

        // Map known provider messages to clean user-friendly phrasing
        $lower = strtolower($sanitized);
        if (str_contains($lower, 'invalid otp') || str_contains($lower, 'otp does not match')) {
            return 'Invalid verification code. Please check and try again.';
        }

        if (str_contains($lower, 'expired')) {
            return 'Verification code has expired. Please request a new code.';
        }

        if (str_contains($lower, 'credit') || str_contains($lower, 'balance')) {
            return 'SMS service temporarily unavailable. Please try again later.';
        }

        if (str_contains($lower, 'token') || str_contains($lower, 'unauthorized')) {
            return 'SMS service authentication failure. Please contact support.';
        }

        return $sanitized;
    }
}
