<?php

namespace App\Events;

use App\Models\Delivery;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderAssigned implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Delivery $delivery;

    public function __construct(Delivery $delivery)
    {
        $this->delivery = $delivery;
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if ($this->delivery->rider_id) {
            $channels[] = new PrivateChannel('rider.' . $this->delivery->rider_id);
        }

        $branchId = $this->delivery->sale?->branch_id ?? $this->delivery->order?->branch_id;
        if ($branchId) {
            $channels[] = new PrivateChannel('branch.' . $branchId . '.orders');
        }

        $userId = $this->delivery->order?->user_id;
        if ($userId) {
            $channels[] = new PrivateChannel('user.' . $userId);
        }

        if ($this->delivery->order_id) {
            $channels[] = new PrivateChannel('customer.order.' . $this->delivery->order_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'OrderAssigned';
    }

    public function broadcastWith(): array
    {
        $orderNumber = $this->delivery->sale?->order_number 
            ?? $this->delivery->order?->order_number 
            ?? ($this->delivery->tracking_number ?? 'DEL-' . $this->delivery->id);

        $orderSource = $this->delivery->sale_id ? 'pos' : 'mobile';
        $totalAmount = (float) ($this->delivery->sale?->total ?? $this->delivery->order?->total_amount ?? 0);
        $branchName = $this->delivery->sale?->branch?->name ?? $this->delivery->order?->branch?->name ?? 'Store Branch';

        return [
            'event'            => 'OrderAssigned',
            'delivery_id'      => $this->delivery->id,
            'order_id'         => $this->delivery->order_id ?? $this->delivery->sale_id,
            'order_number'     => $orderNumber,
            'order_source'     => $orderSource,
            'tracking_number'  => $this->delivery->tracking_number,
            'status'           => $this->delivery->status,
            'status_label'     => $this->delivery->getStatusLabel(),
            'rider_id'         => $this->delivery->rider_id,
            'rider_name'       => $this->delivery->rider?->name,
            'customer_name'    => $this->delivery->customer_name,
            'customer_phone'   => $this->delivery->customer_phone,
            'customer_address' => $this->delivery->customer_address,
            'total_amount'     => $totalAmount,
            'delivery_fee'     => (float) $this->delivery->delivery_fee,
            'branch_name'      => $branchName,
            'timestamp'        => now()->toIso8601String(),
        ];
    }
}
