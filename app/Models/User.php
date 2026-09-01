<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Builder;

/**
 * @mixin Builder
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'name',
        'first_name',
        'last_name',
        'mobile_number',
        'email',
        'password',
        'role',
        'account_status',
        'status_reason',
        'restricted_at',
        'suspended_at',
        'deactivated_at',
        'status_changed_by',
        'is_order_restricted',
        'branch_id',
        'phone_verified_at',
        'cod_restricted',
        'cod_restriction_reason',
        'risk_level_override',
        'last_notifications_read_at',
        'must_change_password',
    ];

    const ROLE_SUPER_ADMIN = 'super_admin';
    const ROLE_ADMIN       = 'admin';
    const ROLE_CASHIER     = 'cashier';
    const ROLE_CUSTOMER    = 'customer';

    const STATUS_ACTIVE       = 'active';
    const STATUS_UNDER_REVIEW = 'under_review';
    const STATUS_RESTRICTED   = 'restricted';
    const STATUS_SUSPENDED    = 'suspended';
    const STATUS_DEACTIVATED  = 'deactivated';

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN || $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isCashier(): bool
    {
        return $this->role === self::ROLE_CASHIER;
    }

    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_CUSTOMER;
    }

    public function isActive(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_ACTIVE;
    }

    public function isUnderReview(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_UNDER_REVIEW;
    }

    public function isRestricted(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_RESTRICTED;
    }

    public function isSuspended(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_SUSPENDED;
    }

    public function isDeactivated(): bool
    {
        return ($this->account_status ?? self::STATUS_ACTIVE) === self::STATUS_DEACTIVATED;
    }

    public function canLogin(): bool
    {
        return !$this->isSuspended() && !$this->isDeactivated();
    }

    public function canPlaceOrders(): bool
    {
        return $this->canLogin() && !(bool) $this->is_order_restricted;
    }

    public function isPhoneVerified(): bool
    {
        return $this->phone_verified_at !== null;
    }

    public function isCodRestricted(): bool
    {
        return (bool) $this->cod_restricted || $this->isRestricted();
    }

    /**
     * Check if user has historical business data preventing hard deletion.
     */
    public function hasHistoricalBusinessRecords(): bool
    {
        return $this->orders()->exists()
            || \App\Models\Sale::where('cashier_id', $this->id)->exists()
            || \App\Models\CashierShift::where('user_id', $this->id)->exists()
            || \App\Models\AuditLog::where('actor_id', $this->id)->exists();
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function statusChangedBy()
    {
        return $this->belongsTo(User::class, 'status_changed_by');
    }

    public function moderationCases()
    {
        return $this->hasMany(ModerationCase::class, 'target_id')->where('target_type', 'user');
    }

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the user's current shopping cart.
     */
    public function cart()
    {
        return $this->hasOne(Cart::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'          => 'datetime',
            'phone_verified_at'          => 'datetime',
            'restricted_at'              => 'datetime',
            'suspended_at'               => 'datetime',
            'deactivated_at'             => 'datetime',
            'cod_restricted'             => 'boolean',
            'is_order_restricted'        => 'boolean',
            'password'                   => 'hashed',
            'two_factor_confirmed_at'    => 'datetime',
            'last_notifications_read_at' => 'datetime',
            'must_change_password'       => 'boolean',
        ];
    }
}
