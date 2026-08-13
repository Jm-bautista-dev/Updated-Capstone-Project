<?php

namespace App\Events;

use App\Models\Rider;
use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RiderLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Rider $rider,
        public ?Delivery $delivery = null
    ) {}

    public function broadcastOn(): array
    {
        return [
            new Channel('deliveries'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'rider.location.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'rider_id'            => $this->rider->id,
            'name'                => $this->rider->name,
            'phone'               => $this->rider->phone,
            'latitude'            => (float) $this->rider->latitude,
            'longitude'           => (float) $this->rider->longitude,
            'accuracy'            => (float) ($this->rider->accuracy ?? 0),
            'speed'               => (float) ($this->rider->speed ?? 0),
            'heading'             => (float) ($this->rider->heading ?? 0),
            'location_updated_at' => $this->rider->location_updated_at?->toIso8601String() ?? now()->toIso8601String(),
            'delivery_id'         => $this->delivery?->id,
            'order_number'        => $this->delivery?->order?->order_number ?? ($this->delivery?->sale?->order_number ?? null),
        ];
    }
}
