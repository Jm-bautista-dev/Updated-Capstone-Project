<?php

namespace App\Events;

use App\Models\Rider;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RiderStatusUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Rider $rider
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if ($this->rider->branch_id) {
            $channels[] = new PrivateChannel('branch.' . $this->rider->branch_id . '.orders');
            $channels[] = new PrivateChannel('branch.' . $this->rider->branch_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'rider.status.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $this->rider->loadMissing('branch');

        $isOutForDelivery = $this->rider->hasInTransitDelivery();
        $activeDeliveries = $this->rider->activeDeliveriesCount();
        $activeInTransit = $this->rider->activeInTransitCount();

        $canBeAssigned = (bool) (
            $this->rider->is_active &&
            $this->rider->status !== 'offline' &&
            !$isOutForDelivery
        );

        return [
            'rider_id'                => $this->rider->id,
            'id'                      => $this->rider->id,
            'name'                    => $this->rider->name,
            'email'                   => $this->rider->email,
            'phone'                   => $this->rider->phone,
            'branch_id'               => $this->rider->branch_id,
            'branch_name'             => $this->rider->branch?->name ?? 'Global',
            'is_active'               => (bool) $this->rider->is_active,
            'account_status'          => $this->rider->account_status ?? 'active',
            'status'                  => $this->rider->status, // 'available' | 'busy' | 'offline'
            'is_out_for_delivery'     => $isOutForDelivery,
            'can_be_assigned'         => $canBeAssigned,
            'active_deliveries'       => $activeDeliveries,
            'active_in_transit_count' => $activeInTransit,
            'last_active_at'          => $this->rider->last_active_at?->toIso8601String(),
            'updated_at'              => $this->rider->updated_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }
}
