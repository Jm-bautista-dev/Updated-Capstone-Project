<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Delivery extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sale_id',
        'order_id',
        'delivery_type',
        'external_service',
        'tracking_number',
        'rider_id',
        'customer_name',
        'customer_phone',
        'customer_address',
        'latitude',
        'longitude',
        'landmark',
        'notes',
        'distance_km',
        'delivery_fee',
        'delivery_notes',
        'external_notes',
        'proof_of_delivery',
        'status',
        'return_status',
        'return_reason',
        'return_notes',
        'return_requested_at',
        'return_reported_at',
        'return_verified_at',
        'return_verified_by',
        'return_resolution',
        'reassigned_at',
        'accepted_at',
        'picked_up_at',
        'transit_at',
        'delivered_at',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'created_at'           => 'datetime',
        'updated_at'           => 'datetime',
        'accepted_at'          => 'datetime',
        'picked_up_at'         => 'datetime',
        'transit_at'           => 'datetime',
        'delivered_at'         => 'datetime',
        'cancelled_at'         => 'datetime',
        'return_requested_at'  => 'datetime',
        'return_reported_at'   => 'datetime',
        'return_verified_at'   => 'datetime',
        'reassigned_at'        => 'datetime',
    ];

    protected $appends = [
        'proof_of_delivery_url',
        'scheduled_pickup_at',
        'scheduled_pickup_display',
        'pickup_verification_code',
        'order_source',
        'order_number',
        'is_pos',
    ];

    public function getOrderNumberAttribute(): ?string
    {
        if ($this->relationLoaded('order') && $this->order && $this->order->order_number) {
            return $this->order->order_number;
        }

        if ($this->relationLoaded('sale') && $this->sale) {
            return $this->sale->order_number ?? $this->sale->invoice_number;
        }

        if ($this->order_id) {
            $orderNumber = \Illuminate\Support\Facades\DB::table('orders')->where('id', $this->order_id)->value('order_number');
            if ($orderNumber) {
                return $orderNumber;
            }
        }

        if ($this->sale_id) {
            $saleRow = \Illuminate\Support\Facades\DB::table('sales')->where('id', $this->sale_id)->first(['order_number', 'invoice_number']);
            if ($saleRow) {
                return $saleRow->order_number ?? $saleRow->invoice_number;
            }
        }

        return $this->attributes['order_number'] ?? $this->tracking_number ?? ('DEL-' . $this->id);
    }

    public function getIsPosAttribute(): bool
    {
        return !empty($this->sale_id) || $this->order_source === 'pos';
    }

    public function getOrderSourceAttribute(): string
    {
        if (!empty($this->sale_id)) {
            return 'pos';
        }

        if ($this->relationLoaded('order') && $this->order) {
            $source = $this->order->order_source;
            if (in_array($source, [Order::SOURCE_MOBILE_APP, 'mobile', 'mobile_app'], true)) {
                return 'mobile';
            }
            if (in_array($source, [Order::SOURCE_WEB_POS, Order::SOURCE_WALK_IN, 'pos', 'web_pos', 'walk_in'], true)) {
                return 'pos';
            }
            return $source ?: 'mobile';
        }

        if ($this->order_id) {
            $source = \Illuminate\Support\Facades\DB::table('orders')->where('id', $this->order_id)->value('order_source');
            if ($source) {
                if (in_array($source, [Order::SOURCE_MOBILE_APP, 'mobile', 'mobile_app'], true)) {
                    return 'mobile';
                }
                if (in_array($source, [Order::SOURCE_WEB_POS, Order::SOURCE_WALK_IN, 'pos', 'web_pos', 'walk_in'], true)) {
                    return 'pos';
                }
                return $source;
            }
        }

        return 'pos';
    }

    public function getScheduledPickupAtAttribute(): ?string
    {
        return $this->order?->scheduled_pickup_at?->toIso8601String();
    }

    public function getScheduledPickupDisplayAttribute(): ?string
    {
        return $this->order?->scheduled_pickup_display;
    }

    public function getPickupVerificationCodeAttribute(): ?string
    {
        return $this->order?->pickup_verification_code;
    }

    protected $attributes = [
        'delivery_type' => 'internal',
    ];

    /* ── Status Constants ──────────────────────────── */

    // Full internal delivery flow (aligned with Order state machine)
    const STATUS_WAITING_KITCHEN          = 'waiting_for_kitchen';
    const STATUS_PENDING                  = 'pending';
    const STATUS_PREPARING                = 'preparing';
    const STATUS_READY                    = 'ready_for_pickup';
    const STATUS_ASSIGNED                 = 'assigned_to_rider';
    const STATUS_PICKED_UP                = 'picked_up';
    const STATUS_OUT_FOR_DELIVERY         = 'in_transit';       // renamed from out_for_delivery
    const STATUS_DELIVERED                = 'delivered';
    const STATUS_CANCELLED                = 'cancelled';
    const STATUS_CANCELLATION_REQUESTED   = 'cancellation_requested';
    const STATUS_RETURN_REQUIRED          = 'return_required';
    const STATUS_RETURN_PENDING_VERIFICATION = 'return_pending_verification';
    const STATUS_FAILED                   = 'failed_delivery';  // rider failed, requires reassign

    // Return status sub-states
    const RETURN_STATUS_REQUIRED                    = 'return_required';
    const RETURN_STATUS_RETURN_REQUIRED             = 'return_required';
    const RETURN_STATUS_PENDING                     = 'return_pending_verification';
    const RETURN_STATUS_RETURN_PENDING_VERIFICATION = 'return_pending_verification';
    const RETURN_STATUS_VERIFIED                    = 'verified';
    const RETURN_STATUS_RETURN_VERIFIED             = 'verified';
    const RETURN_STATUS_REJECTED                    = 'rejected';

    // External delivery flow
    const STATUS_BOOKED   = 'booked';

    /**
     * Statuses that WEB ADMIN is permitted to advance to.
     * Admin controls the preparation & dispatch flow only.
     * They CANNOT mark in_transit or delivered — that belongs to the rider.
     */
    const ADMIN_ALLOWED_TRANSITIONS = [
        'waiting_for_kitchen' => 'preparing',
        'pending'             => 'preparing',
        'preparing'           => 'ready_for_pickup',
        'ready_for_pickup'    => null, // next step is rider accept (no admin advance)
    ];

    /**
     * Statuses that only the RIDER APP is permitted to set.
     * Backend enforces this — any admin attempt is rejected.
     */
    const RIDER_ONLY_STATUSES = [
        'picked_up',
        'in_transit',
        'delivered',
    ];

    const INTERNAL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_PREPARING,
        self::STATUS_READY,
        self::STATUS_ASSIGNED,
        self::STATUS_PICKED_UP,
        self::STATUS_OUT_FOR_DELIVERY,
        self::STATUS_DELIVERED,
    ];

    const EXTERNAL_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_BOOKED,
        self::STATUS_DELIVERED,
    ];

    /* ── Relationships ─────────────────────────────── */

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

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function returnVerifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'return_verified_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function assignmentLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DeliveryAssignmentLog::class);
    }

    public function attempts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(DeliveryAttempt::class)->orderBy('attempt_number', 'asc');
    }

    /* ── Helpers ───────────────────────────────────── */

    public function isInternal(): bool
    {
        return $this->delivery_type === 'internal';
    }

    public function isExternal(): bool
    {
        return $this->delivery_type === 'external';
    }

    public function isDelivered(): bool
    {
        return $this->status === self::STATUS_DELIVERED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isReturnRequired(): bool
    {
        return $this->return_status === self::RETURN_STATUS_REQUIRED || $this->status === self::STATUS_RETURN_REQUIRED;
    }

    public function isReturnPendingVerification(): bool
    {
        return $this->return_status === self::RETURN_STATUS_PENDING || $this->status === self::STATUS_RETURN_PENDING_VERIFICATION;
    }

    public function isReturnVerified(): bool
    {
        return $this->return_status === self::RETURN_STATUS_VERIFIED;
    }

    public function isAvailableForRiders(): bool
    {
        return $this->isInternal() 
            && $this->status === self::STATUS_READY 
            && $this->rider_id === null
            && !in_array($this->return_status, [self::RETURN_STATUS_REQUIRED, self::RETURN_STATUS_PENDING]);
    }

    /**
     * Get the next valid statuses for this delivery that ADMIN can trigger.
     * Rider-only statuses (picked_up, in_transit, delivered) are EXCLUDED here.
     * They are set exclusively through the Rider App API endpoints.
     */
    public function getNextStatuses(): array
    {
        if ($this->isCancelled() || $this->isDelivered()) {
            return [];
        }

        // failed_delivery can be reassigned — loops back to assigned_to_rider
        if ($this->status === self::STATUS_FAILED) {
            return [self::STATUS_ASSIGNED];
        }

        // Admin can only advance up to ready_for_pickup.
        // Everything after (picked_up, in_transit, delivered) is RIDER ONLY.
        // EXCEPTION: failed_delivery (admin marks) → reassign (admin action).
        $adminFlow = [
            self::STATUS_WAITING_KITCHEN => self::STATUS_PREPARING,
            self::STATUS_PENDING         => self::STATUS_PREPARING,
            self::STATUS_PREPARING       => self::STATUS_READY,
            // ready_for_pickup → assigned_to_rider is handled by assignRider action
            // assigned_to_rider onward → RIDER ONLY
        ];

        if (isset($adminFlow[$this->status])) {
            return [$adminFlow[$this->status]];
        }

        return [];
    }

    /**
     * Whether a delivery can be marked as failed.
     * Only applies to in-transit deliveries.
     */
    public function canMarkFailed(): bool
    {
        return in_array($this->status, [
            self::STATUS_OUT_FOR_DELIVERY,
            self::STATUS_PICKED_UP,
        ]);
    }

    /**
     * Get display-friendly label for status.
     */
    public function getStatusLabel(): string
    {
        if ($this->return_status === self::RETURN_STATUS_PENDING || $this->status === self::STATUS_RETURN_PENDING_VERIFICATION) {
            return 'Return Pending Verification';
        }

        if ($this->return_status === self::RETURN_STATUS_REQUIRED || $this->status === self::STATUS_RETURN_REQUIRED) {
            return 'Return Required';
        }

        if ($this->return_status === self::RETURN_STATUS_VERIFIED && $this->status === self::STATUS_READY) {
            return 'Ready for Reassignment';
        }

        return match ($this->status) {
            self::STATUS_WAITING_KITCHEN            => 'New Order',
            self::STATUS_PENDING                    => 'Pending',
            self::STATUS_PREPARING                  => 'Preparing',
            self::STATUS_READY                      => 'Ready for Pickup',
            self::STATUS_ASSIGNED                   => 'Rider Assigned',
            self::STATUS_PICKED_UP                  => 'Picked Up',
            self::STATUS_OUT_FOR_DELIVERY           => 'In Transit',
            self::STATUS_DELIVERED                  => 'Delivered',
            self::STATUS_CANCELLED                  => 'Cancelled',
            self::STATUS_CANCELLATION_REQUESTED     => 'Cancellation Requested',
            self::STATUS_FAILED                     => 'Failed Delivery',
            self::STATUS_BOOKED                     => 'Booked',
            default                                 => ucwords(str_replace('_', ' ', $this->status)),
        };
    }


    public function getProofOfDeliveryUrlAttribute(): ?string
    {
        if (! $this->proof_of_delivery) {
            return null;
        }

        $proof = trim($this->proof_of_delivery);

        // If already a full URL (external CDN / S3)
        if (str_starts_with($proof, 'http://') || str_starts_with($proof, 'https://')) {
            return $proof;
        }

        return \App\Utils\ImageHelper::resolveUrl($proof, 'proof_of_delivery')
            ?? \App\Utils\ImageHelper::resolveUrl($proof, 'delivery-proofs');
    }

    public function getStatusColor(): string
    {
        if ($this->return_status === self::RETURN_STATUS_PENDING || $this->status === self::STATUS_RETURN_PENDING_VERIFICATION) {
            return 'bg-purple-600 text-white font-bold animate-pulse';
        }

        if ($this->return_status === self::RETURN_STATUS_REQUIRED || $this->status === self::STATUS_RETURN_REQUIRED) {
            return 'bg-amber-600 text-white font-bold animate-pulse';
        }

        return match ($this->status) {
            self::STATUS_WAITING_KITCHEN                => 'bg-orange-100 text-orange-700',
            self::STATUS_PENDING                        => 'bg-slate-100 text-slate-600',
            self::STATUS_PREPARING                      => 'bg-blue-100 text-blue-700',
            self::STATUS_READY                          => 'bg-amber-100 text-amber-700',
            self::STATUS_ASSIGNED                       => 'bg-indigo-100 text-indigo-700',
            self::STATUS_OUT_FOR_DELIVERY, self::STATUS_PICKED_UP => 'bg-violet-100 text-violet-700',
            self::STATUS_BOOKED                         => 'bg-sky-100 text-sky-700',
            self::STATUS_DELIVERED                      => 'bg-emerald-100 text-emerald-700',
            self::STATUS_CANCELLED                      => 'bg-rose-100 text-rose-700',
            self::STATUS_CANCELLATION_REQUESTED         => 'bg-amber-500 text-white font-bold animate-pulse',
            self::STATUS_FAILED                         => 'bg-red-100 text-red-800',
            default                                     => 'bg-gray-100 text-gray-600',
        };
    }

    public function cancellationRequest()
    {
        return $this->hasOne(OrderCancellationRequest::class)->latestOfMany();
    }
}
