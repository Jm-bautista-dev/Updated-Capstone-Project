<?php

namespace App\Events;

use App\Models\Order;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderCreated implements ShouldBroadcastNow
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
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin.orders'),
            new PrivateChannel('branch.' . $this->order->branch_id . '.orders'),
            new Channel('orders'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'OrderCreated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $orderNum = $this->order->order_number ?? ("ORD-" . $this->order->id);
        $itemsCount = $this->order->relationLoaded('items') 
            ? $this->order->items->count() 
            : $this->order->items()->count();

        return [
            'order_id'      => $this->order->id,
            'order_number'  => $orderNum,
            'branch_id'     => $this->order->branch_id,
            'customer_name' => $this->order->customer_name ?? 'Customer',
            'total_amount'  => (float) $this->order->total_amount,
            'items_count'   => $itemsCount,
            'branch_name'   => $this->order->branch?->name ?? 'Unknown Branch',
            'timestamp'     => now()->toDateTimeString(),
            'message'       => "New Order #{$orderNum} received!",
        ];
    }
}
