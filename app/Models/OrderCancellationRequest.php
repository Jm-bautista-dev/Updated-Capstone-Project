<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderCancellationRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'delivery_id',
        'requested_by_rider_id',
        'branch_id',
        'reason',
        'notes',
        'previous_order_status',
        'previous_delivery_status',
        'status',
        'requested_at',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'reviewed_at'  => 'datetime',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function requestedByRider(): BelongsTo
    {
        return $this->belongsTo(Rider::class, 'requested_by_rider_id');
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class, 'requested_by_rider_id');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
