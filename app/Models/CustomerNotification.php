<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CustomerNotification extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'type',
        'order_id',
        'order_number',
        'event_id',
        'title',
        'body',
        'data',
        'read_at',
    ];

    protected $casts = [
        'data'    => 'array',
        'read_at' => 'datetime',
    ];

    /**
     * Auto-generate UUID on creation if not supplied.
     */
    protected static function booted(): void
    {
        static::creating(function (CustomerNotification $notification) {
            if (empty($notification->uuid)) {
                $notification->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function getIsReadAttribute(): bool
    {
        return !is_null($this->read_at);
    }
}
