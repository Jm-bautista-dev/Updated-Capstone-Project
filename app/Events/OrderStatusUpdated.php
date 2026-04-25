<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Delivery;

class OrderStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $delivery;
    public $updatedByRole;

    /**
     * Create a new event instance.
     */
    public function __construct(Delivery $delivery, string $updatedByRole = 'system')
    {
        $this->delivery = $delivery;
        $this->updatedByRole = $updatedByRole;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('deliveries'), // Public channel for admin dashboard
        ];
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
        $payload = [
            'delivery_id' => $this->delivery->id,
            'order_id'    => $this->delivery->order_id,
            'status'      => $this->delivery->status,
            'updated_by'  => $this->updatedByRole,
            'timestamp'   => now()->toIso8601String(),
        ];

        if ($this->delivery->status === 'delivered') {
            $payload['delivery_photo_url'] = $this->delivery->proof_of_delivery_url;
        }

        return $payload;
    }
}
