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

    public function isPhoneVerified(): bool
    {
        return $this->phone_verified_at !== null;
    }

    public function isCodRestricted(): bool
    {
        return (bool) $this->cod_restricted;
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
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
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'cod_restricted'    => 'boolean',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'last_notifications_read_at' => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }
}
