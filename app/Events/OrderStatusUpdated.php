<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Delivery $delivery;
    public string $updatedByRole;
    public ?string $previousStatus;

    /**
     * Create a new event instance.
     */
    public function __construct(Delivery $delivery, string $updatedByRole = 'system', ?string $previousStatus = null)
    {
        $this->delivery = $delivery;
        $this->updatedByRole = $updatedByRole;
        $this->previousStatus = $previousStatus;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * Broadcasts to both public and authorization-protected channels
     * so Web and Mobile clients can subscribe seamlessly.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        if (!$this->delivery->relationLoaded('order') || !$this->delivery->relationLoaded('sale')) {
            $this->delivery->load(['order', 'sale', 'rider']);
        }

        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        $branchId = $this->delivery->sale?->branch_id ?? $this->delivery->order?->branch_id;
        if ($branchId) {
            $channels[] = new PrivateChannel('branch.' . $branchId . '.orders');
        }

        $userId = $this->delivery->order?->user_id;
        if ($userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        if ($this->delivery->order_id) {
            $channels[] = new PrivateChannel('customer.order.' . $this->delivery->order_id);
        }

        if ($this->delivery->rider_id) {
            $channels[] = new PrivateChannel('rider.' . $this->delivery->rider_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order-status-updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $branch = $this->delivery->sale?->branch ?? $this->delivery->order?->branch;
        $branchId = $branch?->id;
        $branchName = $branch?->name ?? 'HQ Branch';
        $branchAddress = $branch?->address;
        $branchLat = $branch?->latitude ? (float) $branch->latitude : null;
        $branchLng = $branch?->longitude ? (float) $branch->longitude : null;

        $destLat = $this->delivery->latitude ? (float) $this->delivery->latitude : ($this->delivery->order?->latitude ? (float) $this->delivery->order->latitude : null);
        $destLng = $this->delivery->longitude ? (float) $this->delivery->longitude : ($this->delivery->order?->longitude ? (float) $this->delivery->order->longitude : null);

        $routePhase = match ($this->delivery->status) {
            'ready_for_pickup'  => 'unassigned',
            'assigned_to_rider' => 'rider_to_store',
            'picked_up'         => 'store_to_customer',
            'in_transit'        => 'rider_to_customer',
            'delivered'         => 'completed',
            default             => 'unassigned',
        };

        $pickupBranch = [
            'id'        => $branchId,
            'name'      => $branchName,
            'address'   => $branchAddress,
            'latitude'  => $branchLat,
            'longitude' => $branchLng,
        ];

        $customerDestination = [
            'customer_name'    => $this->delivery->customer_name,
            'customer_phone'   => $this->delivery->customer_phone,
            'customer_address' => $this->delivery->customer_address,
            'latitude'         => $destLat,
            'longitude'        => $destLng,
            'landmark'         => $this->delivery->landmark ?? $this->delivery->order?->landmark,
        ];

        $orderNumber = $this->delivery->sale?->order_number ?? $this->delivery->order?->order_number ?? ($this->delivery->tracking_number ?? 'ORD-' . $this->delivery->id);
        $orderSource = $this->delivery->sale_id ? 'pos' : 'mobile';
        $statusLabel = match ($this->delivery->status) {
            'waiting_for_kitchen' => 'Waiting for Kitchen',
            'pending'             => 'Pending',
            'confirmed'           => 'Confirmed',
            'preparing'           => 'Preparing',
            'ready_for_pickup'    => 'Ready for Pickup',
            'assigned_to_rider'   => 'Assigned to Rider',
            'picked_up'           => 'Picked Up',
            'in_transit'          => 'In Transit',
            'delivered'           => 'Delivered',
            'cancelled'           => 'Cancelled',
            'failed_delivery'     => 'Failed Delivery',
            default               => ucfirst(str_replace('_', ' ', $this->delivery->status)),
        };
        $totalAmount = (float) ($this->delivery->sale?->total ?? $this->delivery->order?->total_amount ?? 0);
        $paymentMethod = $this->delivery->sale?->payment_method ?? $this->delivery->order?->payment_method ?? 'cash';
        $proofOfDeliveryUrl = $this->delivery->proof_of_delivery_url;

        $activeDestination = match ($routePhase) {
            'rider_to_store' => $pickupBranch,
            'store_to_customer', 'rider_to_customer' => $customerDestination,
            default => null,
        };

        return [
            'id'                    => $this->delivery->id,
            'event'                 => 'order-status-updated',
            'delivery_id'           => $this->delivery->id,
            'order_id'              => $this->delivery->order_id,
            'sale_id'               => $this->delivery->sale_id,
            'order_number'          => $orderNumber,
            'order_source'          => $orderSource,
            'tracking_number'       => $this->delivery->tracking_number,
            'status'                => $this->delivery->status,
            'status_label'          => $statusLabel,
            'previous_status'       => $this->previousStatus,
            'route_phase'           => $routePhase,
            'active_destination'    => $activeDestination,
            'pickup_branch'         => $pickupBranch,
            'customer_destination'  => $customerDestination,
            'rider_id'              => $this->delivery->rider_id,
            'rider_name'            => $this->delivery->rider?->name,
            'branch_id'             => $branchId,
            'branch_name'           => $branchName,
            'customer_id'           => $this->delivery->order?->user_id,
            'customer_name'         => $this->delivery->customer_name,
            'customer_phone'        => $this->delivery->customer_phone,
            'customer_address'      => $this->delivery->customer_address,
            'total_amount'          => $totalAmount,
            'delivery_fee'          => (float) $this->delivery->delivery_fee,
            'payment_method'        => $paymentMethod,
            'updated_by'            => $this->updatedByRole,
            'proof_of_delivery_url' => $proofOfDeliveryUrl,
            'delivered_at'          => $this->delivery->delivered_at?->toIso8601String(),
            'timestamp'             => now()->toIso8601String(),
        ];
    }
}
