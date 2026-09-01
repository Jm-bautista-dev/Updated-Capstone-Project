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

        $branch = $this->delivery->sale?->branch ?? $this->delivery->order?->branch;
        $branchId = $branch?->id;
        $branchName = $branch?->name ?? 'Store Branch';
        $branchAddress = $branch?->address;
        $branchLat = $branch?->latitude ? (float) $branch->latitude : null;
        $branchLng = $branch?->longitude ? (float) $branch->longitude : null;

        $destLat = $this->delivery->latitude ? (float) $this->delivery->latitude : ($this->delivery->order?->latitude ? (float) $this->delivery->order->latitude : null);
        $destLng = $this->delivery->longitude ? (float) $this->delivery->longitude : ($this->delivery->order?->longitude ? (float) $this->delivery->order->longitude : null);

        $pickupBranch = [
            'id'        => $branchId,
            'name'      => $branchName,
            'address'   => $branchAddress,
            'latitude'  => $branchLat,
            'longitude' => $branchLng,
        ];

        $customerDestination = [
            'customer_name'    => $this->delivery->customer_name,
            'customer_phone'   => $this->delivery->customer_phone,
            'customer_address' => $this->delivery->customer_address,
            'latitude'         => $destLat,
            'longitude'        => $destLng,
            'landmark'         => $this->delivery->landmark ?? $this->delivery->order?->landmark,
        ];

        return [
            'event'                => 'OrderAssigned',
            'delivery_id'          => $this->delivery->id,
            'order_id'             => $this->delivery->order_id ?? $this->delivery->sale_id,
            'order_number'         => $orderNumber,
            'order_source'         => $orderSource,
            'tracking_number'      => $this->delivery->tracking_number,
            'status'               => $this->delivery->status,
            'status_label'         => $this->delivery->getStatusLabel(),
            'route_phase'          => 'rider_to_store',
            'active_destination'   => $pickupBranch,
            'pickup_branch'        => $pickupBranch,
            'customer_destination' => $customerDestination,
            'rider_id'             => $this->delivery->rider_id,
            'rider_name'           => $this->delivery->rider?->name,
            'customer_name'        => $this->delivery->customer_name,
            'customer_phone'       => $this->delivery->customer_phone,
            'customer_address'     => $this->delivery->customer_address,
            'total_amount'         => $totalAmount,
            'delivery_fee'         => (float) $this->delivery->delivery_fee,
            'branch_id'            => $branchId,
            'branch_name'          => $branchName,
            'timestamp'            => now()->toIso8601String(),
        ];
    }
}
