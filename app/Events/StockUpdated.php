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

    public function __construct(int $branchId, string $storableType, int $storableId)
    {
        $this->branchId = $branchId;
        $this->storableType = $storableType;
        $this->storableId = $storableId;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('branch.' . $this->branchId),
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

