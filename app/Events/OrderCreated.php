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
        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if ($this->order->branch_id) {
            $channels[] = new PrivateChannel('branch.' . $this->order->branch_id . '.orders');
        }

        return $channels;
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
            'order_id'         => $this->order->id,
            'order_number'     => $orderNum,
            'branch_id'        => $this->order->branch_id,
            'fulfillment_type' => $this->order->fulfillment_type ?? 'delivery',
            'is_pickup'        => ($this->order->fulfillment_type === 'pickup'),
            'customer_name'    => $this->order->customer_name ?? 'Customer',
            'total_amount'     => (float) $this->order->total_amount,
            'items_count'      => $itemsCount,
            'branch_name'      => $this->order->branch?->name ?? 'Unknown Branch',
            'timestamp'        => now()->toDateTimeString(),
            'message'          => ($this->order->fulfillment_type === 'pickup') 
                ? "New Scheduled Pickup Order #{$orderNum} received!" 
                : "New Delivery Order #{$orderNum} received!",
        ];
    }
}
