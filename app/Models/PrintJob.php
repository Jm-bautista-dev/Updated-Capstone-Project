<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class PrintJob extends Model
{
    use HasFactory;

    public const STATUS_PENDING  = 'pending';
    public const STATUS_PRINTING = 'printing';
    public const STATUS_PRINTED  = 'printed';
    public const STATUS_FAILED   = 'failed';

    public const TYPE_RECEIPT        = 'receipt';
    public const TYPE_REPRINT        = 'reprint';
    public const TYPE_KITCHEN_TICKET = 'kitchen_ticket';
    public const TYPE_WAYBILL        = 'waybill';

    protected $fillable = [
        'job_uuid',
        'sale_id',
        'order_id',
        'order_number',
        'branch_id',
        'terminal_id',
        'job_type',
        'paper_width',
        'status',
        'receipt_data',
        'formatted_text',
        'raw_escpos_base64',
        'attempts',
        'last_error',
        'reprint_reason',
        'reprinted_by',
        'printed_at',
        'idempotency_key',
    ];

    protected $casts = [
        'receipt_data' => 'array',
        'paper_width'  => 'integer',
        'attempts'     => 'integer',
        'printed_at'   => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (PrintJob $job): void {
            if (empty($job->job_uuid)) {
                $job->job_uuid = (string) Str::uuid();
            }
        });
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function reprintedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reprinted_by');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isPrinted(): bool
    {
        return $this->status === self::STATUS_PRINTED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function markPrinting(): void
    {
        $this->update([
            'status'   => self::STATUS_PRINTING,
            'attempts' => $this->attempts + 1,
        ]);
    }

    public function markPrinted(): void
    {
        $this->update([
            'status'     => self::STATUS_PRINTED,
            'printed_at' => now(),
            'last_error' => null,
        ]);
    }

    public function markFailed(string $error): void
    {
        $this->update([
            'status'     => self::STATUS_FAILED,
            'last_error' => Str::limit($error, 500),
        ]);
    }
}
