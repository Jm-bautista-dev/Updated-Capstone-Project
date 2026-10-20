<?php

namespace App\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class SmsAntiSpamService
{
    /**
     * Check if an SMS OTP can be sent to the given phone number under current rate limits.
     * Checks:
     * 1. Global Daily Spending/Dispatch Cap
     * 2. Verification Lockout (if previously locked from too many failed OTP attempts)
     * 3. 60-second Resend Cooldown
     * 4. Hourly Send Limit (max 3/hour)
     * 5. Daily Send Limit (max 5/day)
     * 6. IP Hourly Limit (max 10/hour)
     *
     * @param string $phone Normalized canonical phone number
     * @param string|null $ip Client IP address
     * @return array [
     *     'allowed'     => bool,
     *     'status'      => string,
     *     'message'     => string,
     *     'retry_after' => int, // in seconds
     *     'reason'      => string|null,
     * ]
     */
    public function checkCanSendOtp(string $phone, ?string $ip = null): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $maskedPhone = PhoneNumberService::mask($normalizedPhone);

        // 1. Global Daily Cap (Cost/Budget Protection)
        $dailyGlobalCap = (int) config('services.iprog_sms.daily_global_send_cap', 200);
        $today = Carbon::now()->format('Y-m-d');
        $globalKey = "sms_global_daily:{$today}";
        $currentGlobal = (int) Cache::get($globalKey, 0);

        if ($dailyGlobalCap > 0 && $currentGlobal >= $dailyGlobalCap) {
            Log::critical('[SMS ANTI-SPAM] Daily global SMS dispatch limit reached!', [
                'current_dispatches' => $currentGlobal,
                'limit'              => $dailyGlobalCap,
            ]);

            return [
                'allowed'     => false,
                'status'      => 'error',
                'code'        => 'global_cap_reached',
                'message'     => 'SMS verification is temporarily unavailable due to daily platform limits. Please try again later.',
                'retry_after' => 3600,
                'reason'      => 'global_cap',
            ];
        }

        // 2. Lockout Check (Phone locked due to failed verification attempts)
        $lockoutKey = "sms_locked:{$normalizedPhone}";
        $lockoutExpiry = Cache::get($lockoutKey);
        if ($lockoutExpiry) {
            $remaining = (int) ($lockoutExpiry - Carbon::now()->timestamp);
            if ($remaining > 0) {
                return [
                    'allowed'     => false,
                    'status'      => 'error',
                    'code'        => 'locked_out',
                    'message'     => "This phone number is temporarily locked out due to multiple failed verification attempts. Please wait {$remaining} seconds before trying again.",
                    'retry_after' => $remaining,
                    'reason'      => 'locked_out',
                ];
            } else {
                Cache::forget($lockoutKey);
            }
        }

        // 3. Minimum Resend Cooldown (Default: 60s)
        $cooldownKey = "sms_cooldown:{$normalizedPhone}";
        $cooldownExpiry = Cache::get($cooldownKey);
        if ($cooldownExpiry) {
            $remaining = (int) ($cooldownExpiry - Carbon::now()->timestamp);
            if ($remaining > 0) {
                return [
                    'allowed'     => false,
                    'status'      => 'error',
                    'code'        => 'cooldown_active',
                    'message'     => "Please wait {$remaining} seconds before requesting another code.",
                    'retry_after' => $remaining,
                    'reason'      => 'cooldown',
                ];
            } else {
                Cache::forget($cooldownKey);
            }
        }

        // 4. Hourly Limit per Phone Number (Default: 3/hour)
        $maxPerHour = (int) config('services.iprog_sms.max_send_per_hour', 3);
        $hourlyKey = "sms_hourly:{$normalizedPhone}";
        $hourlyCount = (int) Cache::get($hourlyKey, 0);
        if ($maxPerHour > 0 && $hourlyCount >= $maxPerHour) {
            $expireTs = (int) Cache::get("{$hourlyKey}:expire", Carbon::now()->addHour()->timestamp);
            $retryAfter = max(60, $expireTs - Carbon::now()->timestamp);
            $minutes = ceil($retryAfter / 60);

            Log::warning('[SMS ANTI-SPAM] Hourly send limit reached for phone', [
                'masked_phone' => $maskedPhone,
                'hourly_count' => $hourlyCount,
                'limit'        => $maxPerHour,
            ]);

            return [
                'allowed'     => false,
                'status'      => 'error',
                'code'        => 'hourly_limit_exceeded',
                'message'     => "Hourly SMS limit reached for this mobile number (maximum {$maxPerHour} requests per hour). Please try again in {$minutes} minutes.",
                'retry_after' => $retryAfter,
                'reason'      => 'hourly_limit',
            ];
        }

        // 5. Daily Limit per Phone Number (Default: 5/day)
        $maxPerDay = (int) config('services.iprog_sms.max_send_per_day', 5);
        $dailyKey = "sms_daily:{$normalizedPhone}";
        $dailyCount = (int) Cache::get($dailyKey, 0);
        if ($maxPerDay > 0 && $dailyCount >= $maxPerDay) {
            $expireTs = (int) Cache::get("{$dailyKey}:expire", Carbon::now()->addDay()->timestamp);
            $retryAfter = max(60, $expireTs - Carbon::now()->timestamp);
            $hours = ceil($retryAfter / 3600);

            Log::warning('[SMS ANTI-SPAM] Daily send limit reached for phone', [
                'masked_phone' => $maskedPhone,
                'daily_count'  => $dailyCount,
                'limit'        => $maxPerDay,
            ]);

            return [
                'allowed'     => false,
                'status'      => 'error',
                'code'        => 'daily_limit_exceeded',
                'message'     => "Daily SMS limit reached for this mobile number (maximum {$maxPerDay} requests per day). Please try again in {$hours} hours.",
                'retry_after' => $retryAfter,
                'reason'      => 'daily_limit',
            ];
        }

        // 6. IP Hourly Limit (Default: 10/hour across different phone numbers)
        if (!empty($ip)) {
            $maxIpPerHour = (int) config('services.iprog_sms.max_ip_send_per_hour', 10);
            $ipKey = "sms_ip_hourly:{$ip}";
            $ipCount = (int) Cache::get($ipKey, 0);

            if ($maxIpPerHour > 0 && $ipCount >= $maxIpPerHour) {
                Log::warning('[SMS ANTI-SPAM] IP hourly send limit reached', [
                    'ip'       => $ip,
                    'ip_count' => $ipCount,
                    'limit'    => $maxIpPerHour,
                ]);

                return [
                    'allowed'     => false,
                    'status'      => 'error',
                    'code'        => 'ip_limit_exceeded',
                    'message'     => 'Too many verification requests from your network. Please wait a few minutes before trying again.',
                    'retry_after' => 300,
                    'reason'      => 'ip_limit',
                ];
            }
        }

        return [
            'allowed'     => true,
            'status'      => 'allowed',
            'message'     => 'Send permitted.',
            'retry_after' => 0,
            'reason'      => null,
        ];
    }

    /**
     * Atomically acquire a concurrency lock for sending SMS to a phone number.
     * Prevents simultaneous requests from bypassing cooldown or hourly limits.
     *
     * @param string $phone
     * @param int $timeoutSeconds Lock validity window
     * @return bool True if lock was acquired, false if another request is in progress
     */
    public function acquireConcurrencyLock(string $phone, int $timeoutSeconds = 15): bool
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $lockKey = "sms_concurrency_lock:{$normalizedPhone}";

        // Cache::add atomically returns true only if the key did NOT exist previously
        return Cache::add($lockKey, Carbon::now()->timestamp, $timeoutSeconds);
    }

    /**
     * Release concurrency lock for the given phone number.
     */
    public function releaseConcurrencyLock(string $phone): void
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        Cache::forget("sms_concurrency_lock:{$normalizedPhone}");
    }

    /**
     * Record an accepted/successful SMS OTP send.
     * Updates cooldown, hourly count, daily count, IP count, and global counter.
     */
    public function recordAcceptedSend(string $phone, ?string $ip = null): void
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $cooldown = (int) config('services.iprog_sms.resend_cooldown_sec', 60);

        // 1. Set Cooldown
        $cooldownExpiry = Carbon::now()->addSeconds($cooldown)->timestamp;
        Cache::put("sms_cooldown:{$normalizedPhone}", $cooldownExpiry, $cooldown);

        // 2. Increment Hourly Count
        $hourlyKey = "sms_hourly:{$normalizedPhone}";
        if (!Cache::has($hourlyKey)) {
            $expireTs = Carbon::now()->addHour()->timestamp;
            Cache::put($hourlyKey, 1, 3600);
            Cache::put("{$hourlyKey}:expire", $expireTs, 3600);
        } else {
            Cache::increment($hourlyKey);
        }

        // 3. Increment Daily Count
        $dailyKey = "sms_daily:{$normalizedPhone}";
        if (!Cache::has($dailyKey)) {
            $expireTs = Carbon::now()->addDay()->timestamp;
            Cache::put($dailyKey, 1, 86400);
            Cache::put("{$dailyKey}:expire", $expireTs, 86400);
        } else {
            Cache::increment($dailyKey);
        }

        // 4. Increment IP Hourly Count
        if (!empty($ip)) {
            $ipKey = "sms_ip_hourly:{$ip}";
            if (!Cache::has($ipKey)) {
                Cache::put($ipKey, 1, 3600);
            } else {
                Cache::increment($ipKey);
            }
        }

        // 5. Increment Global Daily Counter
        $today = Carbon::now()->format('Y-m-d');
        $globalKey = "sms_global_daily:{$today}";
        if (!Cache::has($globalKey)) {
            Cache::put($globalKey, 1, 86400);
        } else {
            Cache::increment($globalKey);
        }
    }

    /**
     * Check if a verification attempt is permitted (i.e. not locked out).
     */
    public function checkCanAttemptVerification(string $phone): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $lockoutKey = "sms_locked:{$normalizedPhone}";
        $lockoutExpiry = Cache::get($lockoutKey);

        if ($lockoutExpiry) {
            $remaining = max(1, (int) ($lockoutExpiry - Carbon::now()->timestamp));

            return [
                'allowed'     => false,
                'message'     => "Too many failed attempts. This phone number is temporarily locked out for {$remaining} seconds. Please request a new verification code later.",
                'retry_after' => $remaining,
            ];
        }

        return [
            'allowed'     => true,
            'message'     => 'Verification permitted.',
            'retry_after' => 0,
        ];
    }

    /**
     * Record a failed OTP verification attempt.
     * Enforces temporary lockout if maximum attempts reached.
     */
    public function recordFailedVerificationAttempt(string $phone): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);
        $lockoutSec = (int) config('services.iprog_sms.lockout_duration_sec', 900); // 15 mins

        $attemptsKey = "sms_verify_attempts:{$normalizedPhone}";
        if (!Cache::has($attemptsKey)) {
            Cache::put($attemptsKey, 1, $lockoutSec);
            $attempts = 1;
        } else {
            $attempts = (int) Cache::increment($attemptsKey);
        }

        if ($attempts >= $maxAttempts) {
            $lockoutExpiry = Carbon::now()->addSeconds($lockoutSec)->timestamp;
            Cache::put("sms_locked:{$normalizedPhone}", $lockoutExpiry, $lockoutSec);

            Log::warning('[SMS ANTI-SPAM] Verification locked out due to failed attempts', [
                'masked_phone' => PhoneNumberService::mask($normalizedPhone),
                'attempts'     => $attempts,
                'lockout_sec'  => $lockoutSec,
            ]);

            return [
                'locked'              => true,
                'remaining_attempts'  => 0,
                'retry_after'         => $lockoutSec,
            ];
        }

        $remaining = max(0, $maxAttempts - $attempts);

        return [
            'locked'             => false,
            'remaining_attempts' => $remaining,
            'retry_after'        => 0,
        ];
    }

    /**
     * Clear verification attempt counters and lockout state upon successful verification.
     */
    public function recordSuccessfulVerification(string $phone): void
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        Cache::forget("sms_verify_attempts:{$normalizedPhone}");
        Cache::forget("sms_locked:{$normalizedPhone}");
    }

    /**
     * Get anti-spam status metrics for a phone number.
     */
    public function getStatus(string $phone): array
    {
        $normalizedPhone = PhoneNumberService::normalize($phone) ?? $phone;
        $cooldownKey = "sms_cooldown:{$normalizedPhone}";
        $cooldownExpiry = Cache::get($cooldownKey);
        $cooldownRemaining = $cooldownExpiry ? max(0, (int) ($cooldownExpiry - Carbon::now()->timestamp)) : 0;

        $lockoutKey = "sms_locked:{$normalizedPhone}";
        $lockoutExpiry = Cache::get($lockoutKey);
        $lockoutRemaining = $lockoutExpiry ? max(0, (int) ($lockoutExpiry - Carbon::now()->timestamp)) : 0;

        $maxPerHour = (int) config('services.iprog_sms.max_send_per_hour', 3);
        $hourlyKey = "sms_hourly:{$normalizedPhone}";
        $hourlyCount = (int) Cache::get($hourlyKey, 0);

        $maxPerDay = (int) config('services.iprog_sms.max_send_per_day', 5);
        $dailyKey = "sms_daily:{$normalizedPhone}";
        $dailyCount = (int) Cache::get($dailyKey, 0);

        $attemptsKey = "sms_verify_attempts:{$normalizedPhone}";
        $attempts = (int) Cache::get($attemptsKey, 0);
        $maxAttempts = (int) config('services.iprog_sms.max_attempts', 5);

        return [
            'can_send'                  => ($cooldownRemaining === 0 && $lockoutRemaining === 0 && $hourlyCount < $maxPerHour && $dailyCount < $maxPerDay),
            'resend_cooldown_remaining' => $cooldownRemaining,
            'is_locked_out'             => ($lockoutRemaining > 0),
            'lockout_remaining_seconds' => $lockoutRemaining,
            'hourly_sends_made'         => $hourlyCount,
            'hourly_sends_remaining'    => max(0, $maxPerHour - $hourlyCount),
            'daily_sends_made'          => $dailyCount,
            'daily_sends_remaining'     => max(0, $maxPerDay - $dailyCount),
            'verification_attempts'     => $attempts,
            'attempts_remaining'        => max(0, $maxAttempts - $attempts),
        ];
    }
}
