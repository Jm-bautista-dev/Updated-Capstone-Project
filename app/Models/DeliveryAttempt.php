<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeliveryAttempt extends Model
{
    use HasFactory;

    protected $fillable = [
        'delivery_id',
        'order_id',
        'sale_id',
        'rider_id',
        'attempt_number',
        'status',
        'failure_reason',
        'failure_category',
        'latitude',
        'longitude',
        'distance_from_customer',
        'notes',
        'proof_image_path',
    ];

    protected $casts = [
        'attempt_number'         => 'integer',
        'latitude'               => 'decimal:7',
        'longitude'              => 'decimal:7',
        'distance_from_customer' => 'decimal:2',
    ];

    public function delivery(): BelongsTo
    {
        return $this->belongsTo(Delivery::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function rider(): BelongsTo
    {
        return $this->belongsTo(Rider::class);
    }

    public function isCustomerAttributable(): bool
    {
        $reasons = config('cod_security.failure_reasons', []);
        if (isset($reasons[$this->failure_reason])) {
            return (bool) ($reasons[$this->failure_reason]['affects_cod'] ?? false);
        }
        return $this->failure_category === 'customer_attributable';
    }

    public function getReasonLabel(): string
    {
        $reasons = config('cod_security.failure_reasons', []);
        return $reasons[$this->failure_reason]['label'] ?? ucwords(str_replace('_', ' ', $this->failure_reason ?? 'Attempted'));
    }
}
