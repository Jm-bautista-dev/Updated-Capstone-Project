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
        $branchId = $this->delivery->sale?->branch_id ?? $this->delivery->order?->branch_id;
        $branchName = $this->delivery->sale?->branch?->name ?? $this->delivery->order?->branch?->name ?? 'HQ Branch';
        $orderNumber = $this->delivery->sale?->order_number ?? $this->delivery->order?->order_number ?? ($this->delivery->tracking_number ?? 'ORD-' . $this->delivery->id);

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

        $proofOfDeliveryUrl = $this->delivery->proof_of_delivery_url;

        return [
            'event'                 => 'order-status-updated',
            'delivery_id'           => $this->delivery->id,
            'order_id'              => $this->delivery->order_id ?? $this->delivery->sale_id,
            'order_number'          => $orderNumber,
            'tracking_number'       => $this->delivery->tracking_number,
            'status'                => $this->delivery->status,
            'status_label'          => $statusLabel,
            'previous_status'       => $this->previousStatus,
            'rider_id'              => $this->delivery->rider_id,
            'rider_name'            => $this->delivery->rider?->name,
            'branch_id'             => $branchId,
            'branch_name'           => $branchName,
            'customer_id'           => $this->delivery->order?->user_id,
            'customer_name'         => $this->delivery->customer_name,
            'customer_address'      => $this->delivery->customer_address,
            'updated_by'            => $this->updatedByRole,
            'proof_of_delivery_url' => $proofOfDeliveryUrl,
            'timestamp'             => now()->toIso8601String(),
        ];
    }
}
