<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
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
        'total_amount',
        'status',
        'inventory_deducted',
    ];

    /*
    |--------------------------------------------------------------------------
    | STRICT STATE MACHINE
    |--------------------------------------------------------------------------
    | No skipping states. No reverting. Backend is the SINGLE SOURCE OF TRUTH.
    |
    | Flow:
    |   pending → confirmed → preparing → ready_for_pickup
    |          → assigned_to_rider → picked_up → in_transit → delivered
    |
    | Any state can transition to 'cancelled'.
    */

    /** All valid states in order */
    const STATES = [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'assigned_to_rider',
        'picked_up',
        'in_transit',
        'delivered',
        'cancelled',
    ];

    /** Allowed forward transitions (from → [allowed next states]) */
    const TRANSITIONS = [
        'pending'           => ['confirmed', 'cancelled'],
        'confirmed'         => ['preparing', 'cancelled'],
        'preparing'         => ['ready_for_pickup', 'cancelled'],
        'ready_for_pickup'  => ['assigned_to_rider', 'cancelled'],
        'assigned_to_rider' => ['picked_up', 'cancelled'],
        'picked_up'         => ['in_transit', 'cancelled'],
        'in_transit'        => ['delivered', 'cancelled'],
        'delivered'         => [],
        'cancelled'         => [],
    ];

    /**
     * Transition the order to a new status.
     * Throws \RuntimeException if the transition is invalid.
     * Writes to audit log automatically.
     */
    public function transitionTo(string $newStatus, ?string $reason = null, $actorUserId = null, $actorRiderId = null): void
    {
        $currentStatus = $this->status;
        $allowed = self::TRANSITIONS[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowed)) {
            throw new \RuntimeException(
                "Invalid state transition from '{$currentStatus}' to '{$newStatus}'. " .
                "Allowed next states: [" . implode(', ', $allowed) . "]"
            );
        }

        // Update the order status
        $this->update(['status' => $newStatus]);

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
        $allowed = self::TRANSITIONS[$this->status] ?? [];
        return in_array($newStatus, $allowed);
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

    public function auditLogs()
    {
        return $this->hasMany(OrderAuditLog::class);
    }
}
