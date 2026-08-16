<?php

namespace App\Events;

use App\Models\Rider;
use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
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
        $channels = [
            new Channel('deliveries'),
        ];

        // Customer-scoped private channel for active order delivery
        if ($this->delivery && $this->delivery->order_id && in_array($this->delivery->status, ['assigned_to_rider', 'picked_up', 'in_transit'])) {
            $channels[] = new PrivateChannel('customer.order.' . $this->delivery->order_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'rider.location.updated';
    }

    public function broadcastWith(): array
    {
        $lastUpdated = $this->rider->location_updated_at ?? now();
        $secondsAgo = (int) now()->diffInSeconds($lastUpdated);

        if ($secondsAgo < 30) {
            $signalStatus = 'live';
        } elseif ($secondsAgo <= 120) {
            $signalStatus = 'signal_delayed';
        } else {
            $signalStatus = 'offline';
        }

        return [
            'order_id'            => $this->delivery?->order_id,
            'order_number'        => $this->delivery?->order?->order_number ?? ($this->delivery?->sale?->order_number ?? null),
            'delivery_id'         => $this->delivery?->id,
            'delivery_status'     => $this->delivery?->status,
            'rider_id'            => $this->rider->id,
            'name'                => $this->rider->name,
            'phone'               => $this->rider->phone,
            'latitude'            => (float) $this->rider->latitude,
            'longitude'           => (float) $this->rider->longitude,
            'accuracy'            => (float) ($this->rider->accuracy ?? 10),
            'speed'               => (float) ($this->rider->speed ?? 0),
            'heading'             => (float) ($this->rider->heading ?? 0),
            'signal_status'       => $signalStatus,
            'seconds_ago'         => $secondsAgo,
            'location_updated_at' => $lastUpdated->toIso8601String(),
        ];
    }
}
