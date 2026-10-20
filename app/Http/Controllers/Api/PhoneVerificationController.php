<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PendingRegistration;
use App\Models\PhoneVerification;
use App\Services\IprogSmsService;
use App\Services\PhoneNumberService;
use App\Services\SmsAntiSpamService;
use App\Services\SecurityAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PhoneVerificationController extends Controller
{
    protected IprogSmsService $smsService;
    protected SmsAntiSpamService $antiSpamService;

    public function __construct(IprogSmsService $smsService, SmsAntiSpamService $antiSpamService)
    {
        $this->smsService = $smsService;
        $this->antiSpamService = $antiSpamService;
    }

    /**
     * Send OTP to a phone number.
     * Supports:
     * - Pending registration flow via registration_token
     * - Authenticated user phone verification
     * - Pre-registration standalone phone verification
     *
     * POST /api/v1/auth/phone/send-otp
     */
    public function sendOtp(Request $request): JsonResponse
    {
        if ($request->has('phone_number') && is_numeric($request->phone_number)) {
            $request->merge(['phone_number' => (string) $request->phone_number]);
        }
        if ($request->has('mobile_number') && is_numeric($request->mobile_number)) {
            $request->merge(['mobile_number' => (string) $request->mobile_number]);
        }

        $request->validate([
            'registration_token' => 'nullable|string|max:64',
            'phone_number'       => 'nullable|string|max:30',
            'mobile_number'      => 'nullable|string|max:30',
        ]);

        $token = $request->input('registration_token');
        $rawPhone = $request->input('phone_number') ?? $request->input('mobile_number');
        $user = $request->user();

        $pending = null;
        $targetPhone = null;

        // 1. Authorize & Resolve Destination Phone Number
        if (!empty($token)) {
            $pending = PendingRegistration::where('registration_token', $token)->first();

            if (!$pending) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Pending registration session not found or invalid token.'
                ], 404);
            }

            if ($pending->isCompleted()) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Registration has already been verified and completed.'
                ], 400);
            }

            if ($pending->isExpired()) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Registration session has expired. Please sign up again.'
                ], 400);
            }

            $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);
            if ($pending->isLockedOut($maxAttempts)) {
                return response()->json([
                    'success' => false,
                    'status'  => 'locked_out',
                    'message' => 'This verification session is locked out due to multiple failed attempts. Please start a new registration.'
                ], 429);
            }

            $targetPhone = $pending->mobile_number;
        } elseif ($user) {
            $targetPhone = $rawPhone ?? $user->mobile_number;
        } else {
            $targetPhone = $rawPhone;
        }

        if (empty($targetPhone)) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Phone number is required.'
            ], 422);
        }

        $normalizedPhone = PhoneNumberService::normalize($targetPhone);
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);

        if (!$normalizedPhone || !PhoneNumberService::isValidPhMobile($normalizedPhone)) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Invalid Philippine mobile number. Must be an 11-digit number starting with 09.'
            ], 422);
        }

        // 2. Uniqueness Check against existing registered accounts
        $existingUserQuery = User::where('mobile_number', $normalizedPhone);
        if ($user) {
            $existingUserQuery->where('id', '!=', $user->id);
        }

        if ($existingUserQuery->exists()) {
            Log::warning('[PHONE VERIFY] Send OTP blocked - Mobile number already in use', [
                'masked_phone' => $maskedPhone,
                'ip'           => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'This mobile number is already registered to an existing account.'
            ], 409);
        }

        // 3. Centralized Anti-Spam & Cost-Protection Throttling (Evaluated BEFORE IPROG call)
        $spamCheck = $this->antiSpamService->checkCanSendOtp($normalizedPhone, $request->ip());
        if (!$spamCheck['allowed']) {
            return response()->json([
                'success'         => false,
                'status'          => $spamCheck['status'],
                'code'            => $spamCheck['code'] ?? $spamCheck['reason'],
                'message'         => $spamCheck['message'],
                'retry_after'     => $spamCheck['retry_after'],
                'resend_cooldown' => $spamCheck['retry_after'],
            ], 429)->header('Retry-After', (string) $spamCheck['retry_after']);
        }

        // Secondary Database-Layer Cooldown Check (for existing pending sessions)
        $cooldown = (int) config('services.iprog_sms.resend_cooldown_sec', 60);
        if ($pending && !$pending->canResend($cooldown)) {
            $remaining = $pending->secondsUntilResend($cooldown);

            return response()->json([
                'success'         => false,
                'status'          => 'error',
                'code'            => 'cooldown_active',
                'message'         => "Please wait {$remaining} seconds before requesting another code.",
                'resend_cooldown' => $remaining,
                'retry_after'     => $remaining,
            ], 429)->header('Retry-After', (string) $remaining);
        }

        $standaloneRecord = PhoneVerification::where('phone_number', $normalizedPhone)
            ->where('is_verified', false)
            ->latest()
            ->first();

        if ($standaloneRecord && !$standaloneRecord->canResend($cooldown)) {
            $remaining = $standaloneRecord->secondsUntilResend($cooldown);

            return response()->json([
                'success'         => false,
                'status'          => 'error',
                'code'            => 'cooldown_active',
                'message'         => "Please wait {$remaining} seconds before requesting another code.",
                'resend_cooldown' => $remaining,
                'retry_after'     => $remaining,
            ], 429)->header('Retry-After', (string) $remaining);
        }

        // Check Max Resends per session
        $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);
        if ($pending && $pending->resend_count >= $maxAttempts) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Maximum resend limit reached for this session. Please start a new registration.'
            ], 429);
        }

        // 4. Atomic Concurrency Lock
        if (!$this->antiSpamService->acquireConcurrencyLock($normalizedPhone)) {
            return response()->json([
                'success'     => false,
                'status'      => 'busy',
                'message'     => 'A verification request is already in progress for this mobile number. Please wait a moment.',
                'retry_after' => 5,
            ], 429)->header('Retry-After', '5');
        }

        try {
            // 5. Request Real OTP from IPROG SMS
            $expiryMinutes = (int) config('services.iprog_sms.expires_in_minutes', 5);
            $providerResult = $this->smsService->sendOtp($normalizedPhone, null, $expiryMinutes);

            if (!$providerResult['success']) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => $providerResult['message'] ?? 'Failed to dispatch verification SMS. Please try again.',
                ], 502);
            }

            // 6. Record Accepted Send in Shared Anti-Spam Rate Limiters
            $this->antiSpamService->recordAcceptedSend($normalizedPhone, $request->ip());

            // 7. Update Application State
            if ($pending) {
                $pending->update([
                    'last_sent_at'          => now(),
                    'resend_count'          => $pending->resend_count + 1,
                    'verification_attempts' => 0, // Reset failed attempt count on fresh code
                    'expires_at'            => now()->addMinutes(15),
                ]);
            }

            $existingVerification = PhoneVerification::where('phone_number', $normalizedPhone)
                ->where('is_verified', false)
                ->first();

            $currentResendCount = $existingVerification ? ($existingVerification->resend_count + 1) : 1;

            PhoneVerification::updateOrCreate(
                ['phone_number' => $normalizedPhone, 'is_verified' => false],
                [
                    'user_id'               => $user?->id,
                    'registration_token'    => $token,
                    'last_sent_at'          => now(),
                    'resend_count'          => $currentResendCount,
                    'verification_attempts' => 0,
                    'expires_at'            => now()->addMinutes($expiryMinutes),
                    'ip_address'            => $request->ip(),
                ]
            );

            Log::info('[PHONE VERIFY] OTP Successfully Requested via IPROG', [
                'masked_phone'       => $maskedPhone,
                'registration_token' => $token ? substr($token, 0, 10) . '...' : null,
                'ip'                 => $request->ip(),
            ]);

            return response()->json([
                'success'            => true,
                'status'             => 'success',
                'message'            => 'Verification code sent successfully to ' . $maskedPhone . '.',
                'phone_number'       => $normalizedPhone,
                'masked_phone'       => $maskedPhone,
                'expires_in_seconds' => $expiryMinutes * 60,
                'resend_cooldown'    => $cooldown,
            ]);
        } finally {
            $this->antiSpamService->releaseConcurrencyLock($normalizedPhone);
        }
    }

    /**
     * Verify submitted OTP code.
     * Endpoint: POST /api/v1/auth/phone/verify-otp
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        if ($request->has('otp') && is_numeric($request->otp)) {
            $request->merge(['otp' => (string) $request->otp]);
        }
        if ($request->has('phone_number') && is_numeric($request->phone_number)) {
            $request->merge(['phone_number' => (string) $request->phone_number]);
        }
        if ($request->has('mobile_number') && is_numeric($request->mobile_number)) {
            $request->merge(['mobile_number' => (string) $request->mobile_number]);
        }

        $request->validate([
            'otp'                => 'required|string|min:4|max:10',
            'registration_token' => 'nullable|string|max:64',
            'phone_number'       => 'nullable|string|max:30',
            'mobile_number'      => 'nullable|string|max:30',
        ]);

        $submittedOtp = trim($request->otp);
        $token = $request->input('registration_token');
        $rawPhone = $request->input('phone_number') ?? $request->input('mobile_number');
        $user = $request->user();

        $pending = null;
        $targetPhone = null;

        // 1. Resolve Session by Token or Phone Number
        if (!empty($token)) {
            $pending = PendingRegistration::where('registration_token', $token)->first();

            if (!$pending) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Pending registration session not found.'
                ], 404);
            }

            // Idempotent guard: if already completed, return existing user session safely
            if ($pending->isCompleted()) {
                $existingUser = User::where('email', $pending->email)
                    ->orWhere('mobile_number', $pending->mobile_number)
                    ->first();

                if ($existingUser) {
                    $authToken = $existingUser->createToken('mobile-app')->plainTextToken;

                    return response()->json([
                        'success' => true,
                        'status'  => 'success',
                        'message' => 'Phone number already verified.',
                        'token'   => $authToken,
                        'user'    => $this->formatUser($existingUser),
                    ]);
                }
            }

            if ($pending->isExpired()) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Verification session has expired. Please sign up again.'
                ], 400);
            }

            $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);
            if ($pending->isLockedOut($maxAttempts)) {
                return response()->json([
                    'success' => false,
                    'status'  => 'error',
                    'message' => 'Too many failed attempts. Please request a new verification code.'
                ], 429);
            }

            $targetPhone = $pending->mobile_number;
        } elseif ($user) {
            $targetPhone = $rawPhone ?? $user->mobile_number;
        } else {
            $targetPhone = $rawPhone;
        }

        if (empty($targetPhone)) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Phone number or registration token is required.'
            ], 422);
        }

        $normalizedPhone = PhoneNumberService::normalize($targetPhone);
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);

        if (!$normalizedPhone || !PhoneNumberService::isValidPhMobile($normalizedPhone)) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Invalid phone number format.'
            ], 422);
        }

        // Check Anti-Spam verification lockout
        $lockCheck = $this->antiSpamService->checkCanAttemptVerification($normalizedPhone);
        if (!$lockCheck['allowed']) {
            return response()->json([
                'success'     => false,
                'status'      => 'locked_out',
                'message'     => $lockCheck['message'],
                'retry_after' => $lockCheck['retry_after'],
            ], 429)->header('Retry-After', (string) $lockCheck['retry_after']);
        }

        // 2. Real IPROG Verification
        $verifyResult = $this->smsService->verifyOtp($normalizedPhone, $submittedOtp);

        if (!$verifyResult['success']) {
            Log::warning('[PHONE VERIFY] Provider Verification Failed', [
                'masked_phone' => $maskedPhone,
                'reason'       => $verifyResult['message'] ?? 'Mismatch',
                'ip'           => $request->ip(),
            ]);

            // Track attempt count on pending record
            if ($pending) {
                $pending->increment('verification_attempts');
            }

            $failStatus = $this->antiSpamService->recordFailedVerificationAttempt($normalizedPhone);

            if ($failStatus['locked']) {
                if ($pending) {
                    $pending->update(['status' => PendingRegistration::STATUS_LOCKED_OUT]);
                }

                return response()->json([
                    'success'     => false,
                    'status'      => 'locked_out',
                    'message'     => 'Too many failed verification attempts. This session has been locked for 15 minutes. Please try again later.',
                    'retry_after' => $failStatus['retry_after'],
                ], 429)->header('Retry-After', (string) $failStatus['retry_after']);
            }

            return response()->json([
                'success'            => false,
                'status'             => 'error',
                'message'            => ($verifyResult['message'] ?? 'Invalid verification code.') . " {$failStatus['remaining_attempts']} attempts remaining.",
                'remaining_attempts' => $failStatus['remaining_attempts'],
            ], 400);
        }

        // 3. Provider Confirmed Success — Clear Anti-Spam Attempt Counters & Complete State
        $this->antiSpamService->recordSuccessfulVerification($normalizedPhone);

        // Case A: Pending Registration -> Complete Account Creation
        if ($pending) {
            return DB::transaction(function () use ($pending, $normalizedPhone, $maskedPhone, $request) {
                // Ensure no duplicate race condition occurred
                $alreadyExists = User::where('email', $pending->email)
                    ->orWhere('mobile_number', $normalizedPhone)
                    ->first();

                if ($alreadyExists) {
                    $pending->update([
                        'status'      => PendingRegistration::STATUS_COMPLETED,
                        'verified_at' => now(),
                    ]);

                    $token = $alreadyExists->createToken('mobile-app')->plainTextToken;

                    return response()->json([
                        'success' => true,
                        'status'  => 'success',
                        'message' => 'Phone verified. Account is ready.',
                        'token'   => $token,
                        'user'    => $this->formatUser($alreadyExists),
                    ]);
                }

                $user = User::create([
                    'first_name'        => $pending->first_name,
                    'last_name'         => $pending->last_name,
                    'name'              => $pending->name ?? trim($pending->first_name . ' ' . $pending->last_name),
                    'email'             => strtolower(trim($pending->email)),
                    'mobile_number'     => $normalizedPhone,
                    'password'          => $pending->password, // Already bcrypt-hashed
                    'role'              => User::ROLE_CUSTOMER,
                    'phone_verified_at' => now(),
                    'email_verified_at' => null, // Distinct from email verification!
                ]);

                $pending->update([
                    'status'      => PendingRegistration::STATUS_COMPLETED,
                    'verified_at' => now(),
                ]);

                // Also update any standalone verification records for this phone
                PhoneVerification::where('phone_number', $normalizedPhone)->update([
                    'is_verified' => true,
                    'verified_at' => now(),
                    'user_id'     => $user->id,
                ]);

                $token = $user->createToken('mobile-app')->plainTextToken;

                Log::info('[PHONE VERIFY] Customer Account Activated via Phone Verification', [
                    'user_id'      => $user->id,
                    'masked_phone' => $maskedPhone,
                    'ip'           => $request->ip(),
                ]);

                return response()->json([
                    'success' => true,
                    'status'  => 'success',
                    'message' => 'Phone number verified and registration completed successfully. Welcome to MAKI DESU!',
                    'token'   => $token,
                    'user'    => $this->formatUser($user),
                ], 200);
            });
        }

        // Case B: Authenticated User updating profile phone
        if ($user) {
            $user->update([
                'mobile_number'     => $normalizedPhone,
                'phone_verified_at' => now(),
            ]);

            PhoneVerification::where('phone_number', $normalizedPhone)->update([
                'is_verified' => true,
                'verified_at' => now(),
                'user_id'     => $user->id,
            ]);

            Log::info('[PHONE VERIFY] Authenticated User Verified Phone', [
                'user_id'      => $user->id,
                'masked_phone' => $maskedPhone,
            ]);

            return response()->json([
                'success' => true,
                'status'  => 'success',
                'message' => 'Phone number verified successfully.',
                'user'    => $this->formatUser($user->fresh()),
            ]);
        }

        // Case C: Pre-Registration Verification (phone standalone)
        PhoneVerification::updateOrCreate(
            ['phone_number' => $normalizedPhone],
            [
                'is_verified' => true,
                'verified_at' => now(),
                'expires_at'  => now()->addMinutes(30),
            ]
        );

        Log::info('[PHONE VERIFY] Standalone Phone Verified Successfully', [
            'masked_phone' => $maskedPhone,
            'ip'           => $request->ip(),
        ]);

        return response()->json([
            'success'      => true,
            'status'       => 'success',
            'message'      => 'Phone number verified successfully.',
            'phone_number' => $normalizedPhone,
            'is_verified'  => true,
        ]);
    }

    /**
     * Resume or check pending verification status.
     * GET/POST /api/v1/auth/phone/status
     */
    public function status(Request $request): JsonResponse
    {
        $token = $request->input('registration_token');
        $rawPhone = $request->input('phone_number') ?? $request->input('mobile_number');
        $user = $request->user();

        $pending = null;
        $targetPhone = null;

        if (!empty($token)) {
            $pending = PendingRegistration::where('registration_token', $token)->first();
            if ($pending) {
                $targetPhone = $pending->mobile_number;
            }
        } elseif ($user) {
            $targetPhone = $rawPhone ?? $user->mobile_number;
        } else {
            $targetPhone = $rawPhone;
        }

        if (empty($targetPhone) && !$pending) {
            return response()->json([
                'success' => false,
                'status'  => 'error',
                'message' => 'Registration token or phone number is required.'
            ], 422);
        }

        $normalizedPhone = PhoneNumberService::normalize($targetPhone);
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);
        $spamStatus = $this->antiSpamService->getStatus($normalizedPhone);

        $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);
        $cooldown = (int) config('services.iprog_sms.resend_cooldown_sec', 60);

        $isPending = $pending ? $pending->isPending() : false;
        $isCompleted = $pending ? $pending->isCompleted() : false;
        $isExpired = $pending ? $pending->isExpired() : false;
        $expiresIn = $pending ? $pending->secondsUntilExpiration() : 0;
        $attemptsRemaining = $pending ? $pending->remainingAttempts($maxAttempts) : $spamStatus['attempts_remaining'];

        $resendCooldown = $pending ? $pending->secondsUntilResend($cooldown) : $spamStatus['resend_cooldown_remaining'];
        $canResend = ($resendCooldown === 0 && !$spamStatus['is_locked_out'] && $spamStatus['hourly_sends_remaining'] > 0 && $spamStatus['daily_sends_remaining'] > 0);

        return response()->json([
            'success' => true,
            'status'  => $isCompleted ? 'completed' : ($isExpired ? 'expired' : ($spamStatus['is_locked_out'] ? 'locked_out' : 'pending')),
            'data'    => [
                'registration_token'        => $token,
                'phone_number'              => $normalizedPhone,
                'masked_phone'              => $maskedPhone,
                'is_pending'                => $isPending,
                'is_completed'              => $isCompleted,
                'is_expired'                => $isExpired,
                'is_locked_out'             => $spamStatus['is_locked_out'],
                'lockout_remaining_seconds' => $spamStatus['lockout_remaining_seconds'],
                'can_resend'                => $canResend,
                'resend_cooldown_remaining' => $resendCooldown,
                'expires_in_seconds'        => $expiresIn,
                'attempts_remaining'        => $attemptsRemaining,
                'hourly_sends_remaining'    => $spamStatus['hourly_sends_remaining'],
                'daily_sends_remaining'     => $spamStatus['daily_sends_remaining'],
            ]
        ]);
    }

    /**
     * Format user data matching project standard.
     */
    private function formatUser(?User $user): array
    {
        if (!$user) {
            return [];
        }

        return [
            'id'             => $user->id,
            'first_name'     => $user->first_name ?? $user->name ?? 'User',
            'last_name'      => $user->last_name ?? '',
            'full_name'      => $user->name ?? trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
            'email'          => $user->email ?? '',
            'mobile_number'  => $user->mobile_number ?? '',
            'role'           => $user->role ?? User::ROLE_CUSTOMER,
            'branch_id'      => $user->branch_id ?? null,
            'phone_verified' => (bool) ($user->phone_verified_at !== null),
            'email_verified' => (bool) ($user->email_verified_at !== null),
        ];
    }
}
