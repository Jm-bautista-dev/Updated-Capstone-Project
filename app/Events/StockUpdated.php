<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StockUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $branchId;
    public $storableType;
    public $storableId;

    public function __construct(?int $branchId = null, ?string $storableType = null, ?int $storableId = null)
    {
        $this->branchId = $branchId;
        $this->storableType = $storableType;
        $this->storableId = $storableId;
    }

    public function broadcastOn(): array
    {
        if ($this->branchId) {
            return [
                new PrivateChannel('branch.' . $this->branchId),
            ];
        }

        return [
            new Channel('inventory'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'type' => $this->storableType,
            'id' => $this->storableId,
            'message' => 'Stock level updated'
        ];
    }
}

