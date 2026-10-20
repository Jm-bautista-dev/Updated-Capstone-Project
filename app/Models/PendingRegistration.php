<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class PendingRegistration extends Model
{
    use HasFactory;

    protected $fillable = [
        'registration_token',
        'first_name',
        'last_name',
        'name',
        'email',
        'mobile_number',
        'password',
        'verification_method',
        'status',
        'verification_attempts',
        'resend_count',
        'last_sent_at',
        'expires_at',
        'verified_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'last_sent_at'          => 'datetime',
        'expires_at'            => 'datetime',
        'verified_at'           => 'datetime',
        'verification_attempts' => 'integer',
        'resend_count'          => 'integer',
    ];

    const STATUS_PENDING    = 'pending';
    const STATUS_COMPLETED  = 'completed';
    const STATUS_EXPIRED    = 'expired';
    const STATUS_CANCELLED  = 'cancelled';
    const STATUS_LOCKED_OUT = 'locked_out';

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING && !$this->isExpired();
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED || ($this->expires_at && Carbon::now()->greaterThan($this->expires_at));
    }

    public function isLockedOut(int $maxAttempts = 5): bool
    {
        return $this->status === self::STATUS_LOCKED_OUT || $this->verification_attempts >= $maxAttempts;
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
