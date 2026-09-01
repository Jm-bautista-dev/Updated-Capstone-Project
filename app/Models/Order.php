<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class Order extends Model
{
    use HasFactory;

    const FULFILLMENT_DELIVERY = 'delivery';
    const FULFILLMENT_PICKUP   = 'pickup';

    const SOURCE_MOBILE_APP         = 'mobile_app';
    const SOURCE_FACEBOOK_MESSENGER = 'facebook_messenger';
    const SOURCE_WALK_IN            = 'walk_in';
    const SOURCE_WEB_POS            = 'web_pos';
    const SOURCE_PHONE_CALL         = 'phone_call';
    const SOURCE_OTHER              = 'other';

    const PAYMENT_STATUS_UNPAID = 'unpaid';
    const PAYMENT_STATUS_PAID   = 'paid';
    const PAYMENT_STATUS_REFUNDED = 'refunded';

    protected $fillable = [
        'order_number',
        'idempotency_key',
        'fulfillment_type',
        'order_source',
        'source_reference',
        'user_id',
        'rider_id',
        'branch_id',
        'customer_name',
        'contact_number',
        'address',
        'latitude',
        'longitude',
        'landmark',
        'notes',
        'pickup_notes',
        'internal_notes',
        'payment_method',
        'payment_status',
        'paid_at',
        'scheduled_pickup_at',
        'estimated_prep_time_minutes',
        'prep_start_at',
        'actual_customer_arrival_at',
        'pickup_completed_at',
        'pickup_verification_code',
        'is_cod',
        'risk_level',
        'total_amount',
        'status',
        'is_cancellation_pending',
        'cancellation_status',
        'cancellation_reason',
        'cancelled_at',
        'inventory_deducted',
    ];

    protected $casts = [
        'inventory_deducted'         => 'boolean',
        'is_cod'                     => 'boolean',
        'is_cancellation_pending'    => 'boolean',
        'cancelled_at'               => 'datetime',
        'paid_at'                    => 'datetime',
        'scheduled_pickup_at'        => 'datetime',
        'prep_start_at'              => 'datetime',
        'actual_customer_arrival_at' => 'datetime',
        'pickup_completed_at'        => 'datetime',
        'total_amount'               => 'decimal:2',
        'estimated_prep_time_minutes'=> 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | STRICT STATE MACHINE
    |--------------------------------------------------------------------------
    | No skipping states. No reverting. Backend is the SINGLE SOURCE OF TRUTH.
    |
    | Delivery Flow:
    |   pending → confirmed → preparing → ready_for_pickup
    |          → assigned_to_rider → picked_up → in_transit → delivered
    |
    | Pickup Flow:
    |   pending → confirmed → preparing → ready_for_pickup
    |          → customer_arrived → completed (or direct ready_for_pickup → completed)
    |          Exceptions: no_show, cancelled
    */

    /** All valid states in order */
    const STATES = [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'customer_arrived',
        'assigned_to_rider',
        'picked_up',
        'in_transit',
        'cancellation_requested',
        'delivered',
        'completed',
        'no_show',
        'cancelled',
    ];

    /** Allowed delivery transitions */
    const DELIVERY_TRANSITIONS = [
        'pending'                => ['confirmed', 'cancelled'],
        'confirmed'              => ['preparing', 'cancelled'],
        'preparing'              => ['ready_for_pickup', 'cancelled'],
        'ready_for_pickup'       => ['assigned_to_rider', 'cancelled'],
        'assigned_to_rider'      => ['picked_up', 'cancelled', 'cancellation_requested'],
        'picked_up'              => ['in_transit', 'cancelled', 'cancellation_requested'],
        'in_transit'             => ['delivered', 'cancelled', 'cancellation_requested'],
        'cancellation_requested' => ['cancelled', 'assigned_to_rider', 'picked_up', 'in_transit'],
        'delivered'              => [],
        'cancelled'              => [],
    ];

    /** Allowed pickup transitions */
    const PICKUP_TRANSITIONS = [
        'pending'                => ['confirmed', 'cancelled'],
        'confirmed'              => ['preparing', 'cancelled'],
        'preparing'              => ['ready_for_pickup', 'cancelled'],
        'ready_for_pickup'       => ['customer_arrived', 'completed', 'no_show', 'cancelled'],
        'customer_arrived'       => ['completed', 'no_show', 'cancelled'],
        'completed'              => [],
        'no_show'                => [],
        'cancelled'              => [],
    ];

    /**
     * Get allowed transitions for this order instance based on fulfillment type.
     */
    public function getAllowedTransitions(): array
    {
        return $this->isPickup() ? self::PICKUP_TRANSITIONS : self::DELIVERY_TRANSITIONS;
    }

    /**
     * Transition the order to a new status.
     * Throws \RuntimeException if the transition is invalid.
     * Writes to audit log automatically.
     */
    public function transitionTo(string $newStatus, ?string $reason = null, $actorUserId = null, $actorRiderId = null): void
    {
        $currentStatus = $this->status;
        $transitions = $this->getAllowedTransitions();
        $allowed = $transitions[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowed)) {
            throw new \RuntimeException(
                "Invalid state transition from '{$currentStatus}' to '{$newStatus}' for {$this->fulfillment_type} order. " .
                "Allowed next states: [" . implode(', ', $allowed) . "]"
            );
        }

        $updates = ['status' => $newStatus];

        if ($newStatus === 'customer_arrived' && !$this->actual_customer_arrival_at) {
            $updates['actual_customer_arrival_at'] = now();
        } elseif ($newStatus === 'completed') {
            if (!$this->pickup_completed_at) {
                $updates['pickup_completed_at'] = now();
            }
            if ($this->isPickup() && $this->payment_status === self::PAYMENT_STATUS_UNPAID) {
                $updates['payment_status'] = self::PAYMENT_STATUS_PAID;
                $updates['paid_at'] = now();
            }
        } elseif ($newStatus === 'cancelled' && !$this->cancelled_at) {
            $updates['cancelled_at'] = now();
            if ($reason && !$this->cancellation_reason) {
                $updates['cancellation_reason'] = $reason;
            }
        }

        // Update the order status
        $this->update($updates);

        // Write audit log
        OrderAuditLog::create([
            'order_id'   => $this->id,
            'user_id'    => $actorUserId,
            'rider_id'   => $actorRiderId,
            'old_status' => $currentStatus,
            'new_status' => $newStatus,
            'device_ip'  => Request::ip(),
            'user_agent' => Request::userAgent(),
            'reason'     => $reason,
        ]);
    }

    /**
     * Check if a transition is valid without executing it.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $transitions = $this->getAllowedTransitions();
        $allowed = $transitions[$this->status] ?? [];
        return in_array($newStatus, $allowed);
    }

    /* ── Helper Methods ────────────────────────────── */

    public function isPickup(): bool
    {
        return ($this->fulfillment_type ?? self::FULFILLMENT_DELIVERY) === self::FULFILLMENT_PICKUP;
    }

    public function isDelivery(): bool
    {
        return ($this->fulfillment_type ?? self::FULFILLMENT_DELIVERY) === self::FULFILLMENT_DELIVERY;
    }

    public function isPaid(): bool
    {
        return ($this->payment_status ?? self::PAYMENT_STATUS_UNPAID) === self::PAYMENT_STATUS_PAID;
    }

    public function isReadyForPickup(): bool
    {
        return $this->status === 'ready_for_pickup';
    }

    public function isPreparing(): bool
    {
        return $this->status === 'preparing';
    }

    public function isCompleted(): bool
    {
        return in_array($this->status, ['completed', 'delivered']);
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function transactions()
    {
        return $this->morphMany(InventoryTransaction::class, 'reference');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function rider()
    {
        return $this->belongsTo(Rider::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }

    public function sale()
    {
        return $this->hasOne(Sale::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(OrderAuditLog::class);
    }

    public function cancellationRequest()
    {
        return $this->hasOne(OrderCancellationRequest::class)->latestOfMany();
    }

    public function deliveryAttempts()
    {
        return $this->hasMany(DeliveryAttempt::class);
    }
}
