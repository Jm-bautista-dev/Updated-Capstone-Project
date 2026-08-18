<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CancellationRejectedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $cancellation;
    public $order;

    public function __construct($cancellation, Order $order)
    {
        $this->cancellation = $cancellation;
        $this->order = $order;
    }

    public function broadcastOn()
    {
        $riderId = $this->cancellation->rider_id ?? $this->cancellation->requested_by_rider_id ?? $this->order->rider_id;
        $channels = [];
        if ($riderId) {
            $channels[] = new PrivateChannel('rider.' . $riderId);
        }
        if ($this->order->branch_id) {
            $channels[] = new PrivateChannel('branch.' . $this->order->branch_id . '.orders');
        }
        $channels[] = new PrivateChannel('admin.orders');

        return $channels;
    }

    public function broadcastAs()
    {
        return 'CancellationRejected';
    }

    public function broadcastWith()
    {
        return [
            'cancellation_request_id' => $this->cancellation->id,
            'order_id'                => $this->order->id,
            'delivery_id'             => $this->order->id,
            'order_number'            => $this->order->order_number ?? ('ORD-' . $this->order->id),
            'status'                  => 'rejected',
            'decision'                => 'rejected',
            'reviewed_by_name'        => auth()->user()?->name ?? 'Branch Manager',
            'reviewed_at'             => $this->cancellation->reviewed_at?->toIso8601String() ?? now()->toIso8601String(),
            'is_cancellation_pending' => false,
            'cancellation_status'     => 'rejected',
            'order_status'            => $this->order->status, // Remains 'in_transit'
        ];
    }
}
