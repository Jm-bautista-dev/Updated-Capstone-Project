<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerDeviceToken extends Model
{
    protected $fillable = [
        'user_id',
        'push_token',
        'platform',
        'device_name',
        'is_active',
        'last_seen_at',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to only active tokens.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
