<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProductUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $productId;
    public $branchId;

    public function __construct(int $productId, int $branchId)
    {
        $this->productId = $productId;
        $this->branchId = $branchId;
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
            'id' => $this->productId,
            'message' => 'Product updated'
        ];
    }
}

