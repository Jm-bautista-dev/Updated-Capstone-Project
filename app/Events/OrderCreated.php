<?php

namespace App\Events;

use App\Models\Order;
|---
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.orders'),
            new PrivateChannel('branch.' . $this->order->branch_id . '.orders'),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'order_id'      => $this->order->id,
            'branch_id'    => $this->order->branch_id,
            'customer_name' => $this->order->customer_name,
            'total_amount'  => $this->order->total_amount,
            'branch_name'   => $this->order->branch?->name ?? 'Unknown Branch',
            'timestamp'     => now()->toDateTimeString(),
            'message'       => "New Order #{$this->order->id} received!",
        ];
    }
}
