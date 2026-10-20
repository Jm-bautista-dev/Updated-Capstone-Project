<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class PhoneVerification extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_number',
        'user_id',
        'registration_token',
        'is_verified',
        'verified_at',
        'verification_attempts',
        'resend_count',
        'last_sent_at',
        'expires_at',
        'ip_address',
    ];

    protected $casts = [
        'is_verified'           => 'boolean',
        'verified_at'           => 'datetime',
        'last_sent_at'          => 'datetime',
        'expires_at'            => 'datetime',
        'verification_attempts' => 'integer',
        'resend_count'          => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at && Carbon::now()->greaterThan($this->expires_at);
    }

    public function isLockedOut(int $maxAttempts = 5): bool
    {
        return $this->verification_attempts >= $maxAttempts;
    }

    public function remainingAttempts(int $maxAttempts = 5): int
    {
        return max(0, $maxAttempts - $this->verification_attempts);
    }

    public function secondsUntilExpiration(): int
    {
        if (!$this->expires_at) {
            return 0;
        }

        return max(0, Carbon::now()->diffInSeconds($this->expires_at, false));
    }

    public function canResend(int $cooldownSeconds = 60): bool
    {
        if (!$this->last_sent_at) {
            return true;
        }

        $elapsed = $this->last_sent_at->diffInSeconds(Carbon::now(), false);

        return $elapsed >= $cooldownSeconds;
    }

    public function secondsUntilResend(int $cooldownSeconds = 60): int
    {
        if (!$this->last_sent_at) {
            return 0;
        }

        $elapsed = $this->last_sent_at->diffInSeconds(Carbon::now(), false);
        $remaining = $cooldownSeconds - $elapsed;

        return max(0, (int) $remaining);
    }
}
