<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SystemErrorLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'error_fingerprint',
        'severity',
        'exception_class',
        'message',
        'status_code',
        'endpoint',
        'method',
        'file',
        'line',
        'trace',
        'request_id',
        'user_id',
        'user_role',
        'occurrences',
        'first_seen_at',
        'last_seen_at',
        'is_resolved',
        'developer_notes',
    ];

    protected $casts = [
        'is_resolved'   => 'boolean',
        'occurrences'   => 'integer',
        'status_code'   => 'integer',
        'line'          => 'integer',
        'first_seen_at' => 'datetime',
        'last_seen_at'  => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (SystemErrorLog $log) {
            if (empty($log->uuid)) {
                $log->uuid = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
