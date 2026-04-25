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
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
        'created_by',
        'updated_by',
    ];

    /* ── Status Constants ──────────────────────────── */

    // Full internal delivery flow (aligned with Order state machine)
    const STATUS_PENDING           = 'pending';
    const STATUS_PREPARING         = 'preparing';
    const STATUS_READY             = 'ready_for_pickup';
    const STATUS_ASSIGNED          = 'assigned_to_rider';
    const STATUS_PICKED_UP         = 'picked_up';
    const STATUS_OUT_FOR_DELIVERY  = 'in_transit';       // renamed from out_for_delivery
    const STATUS_DELIVERED         = 'delivered';
    const STATUS_CANCELLED         = 'cancelled';

    // External delivery flow
    const STATUS_BOOKED   = 'booked';

    /**
     * Statuses that WEB ADMIN is permitted to advance to.
     * Admin controls the preparation & dispatch flow only.
     * They CANNOT mark in_transit or delivered — that belongs to the rider.
     */
    const ADMIN_ALLOWED_TRANSITIONS = [
        'pending'         => 'preparing',
        'preparing'       => 'ready_for_pickup',
        'ready_for_pickup' => null, // next step is rider accept (no admin advance)
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

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
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

        // Admin can only advance up to ready_for_pickup.
        // Everything after (picked_up, in_transit, delivered) is RIDER ONLY.
        $adminFlow = [
            self::STATUS_PENDING    => self::STATUS_PREPARING,
            self::STATUS_PREPARING  => self::STATUS_READY,
            // ready_for_pickup → assigned_to_rider is handled by assignRider action
            // assigned_to_rider onward → RIDER ONLY
        ];

        if (isset($adminFlow[$this->status])) {
            return [$adminFlow[$this->status]];
        }

        return [];
    }

    /**
     * Get display-friendly label for status.
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING          => 'Pending',
            self::STATUS_PREPARING        => 'Preparing',
            self::STATUS_READY            => 'Ready for Pickup',
            self::STATUS_ASSIGNED         => 'Rider Assigned',
            self::STATUS_PICKED_UP        => 'Picked Up',
            self::STATUS_OUT_FOR_DELIVERY => 'In Transit',   // in_transit
            self::STATUS_DELIVERED        => 'Delivered',
            self::STATUS_CANCELLED        => 'Cancelled',
            self::STATUS_BOOKED           => 'Booked',
            default                       => ucwords(str_replace('_', ' ', $this->status)),
        };
    }

    protected $appends = [
        'proof_of_delivery_url',
    ];

    public function getProofOfDeliveryUrlAttribute(): ?string
    {
        if (! $this->proof_of_delivery) {
            return null;
        }

        /** @var \Illuminate\Filesystem\FilesystemAdapter $disk */
        $disk = \Illuminate\Support\Facades\Storage::disk('public');

        return $disk->url($this->proof_of_delivery);
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING                        => 'bg-slate-100 text-slate-600',
            self::STATUS_PREPARING                      => 'bg-blue-100 text-blue-700',
            self::STATUS_READY                          => 'bg-amber-100 text-amber-700',
            self::STATUS_OUT_FOR_DELIVERY, self::STATUS_PICKED_UP => 'bg-violet-100 text-violet-700',
            self::STATUS_BOOKED                         => 'bg-sky-100 text-sky-700',
            self::STATUS_DELIVERED                       => 'bg-emerald-100 text-emerald-700',
            self::STATUS_CANCELLED                       => 'bg-rose-100 text-rose-700',
            default                                     => 'bg-gray-100 text-gray-600',
        };
    }
}
