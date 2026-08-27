<?php

namespace App\Events;

use App\Models\CancellationRequest;
use App\Models\OrderCancellationRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CancellationRequested implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $cancellationRequest;

    public function __construct($cancellationRequest)
    {
        if (method_exists($cancellationRequest, 'loadMissing')) {
            $this->cancellationRequest = $cancellationRequest->loadMissing([
                'order.branch',
                'delivery',
                'rider',
                'branch',
            ]);
        } else {
            $this->cancellationRequest = $cancellationRequest;
        }
    }

    public function broadcastOn(): array
    {
        $req = $this->cancellationRequest;
        $order = $req->order ?? ($req->order_id ? \App\Models\Order::find($req->order_id) : null);
        $branchId = $req->branch_id ?? $order?->branch_id;
        $riderId = $req->rider_id ?? $req->requested_by_rider_id ?? $order?->rider_id;

        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if ($branchId) {
            $channels[] = new PrivateChannel('branch.' . $branchId . '.orders');
        }

        if ($riderId) {
            $channels[] = new PrivateChannel('rider.' . $riderId);
        }

        if ($order) {
            $channels[] = new PrivateChannel('customer.order.' . $order->id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'CancellationRequested';
    }

    public function broadcastWith(): array
    {
        $req = $this->cancellationRequest;
        $order = $req->order ?? ($req->order_id ? \App\Models\Order::find($req->order_id) : null);
        $orderNum = $order?->order_number ?? ("ORD-" . $req->order_id);
        $riderId = $req->rider_id ?? $req->requested_by_rider_id ?? $order?->rider_id;
        $deliveryId = $req->delivery_id ?? $order?->delivery?->id;

        return [
            'cancellation_request_id' => $req->id,
            'order_id'                => $req->order_id,
            'order_number'            => $orderNum,
            'delivery_id'             => $deliveryId,
            'rider_id'                => $riderId,
            'rider_name'              => $req->rider?->name ?? $req->requestedByRider?->name ?? 'Rider',
            'customer_name'           => $order?->customer_name ?? 'Customer',
            'branch_id'               => $req->branch_id ?? $order?->branch_id,
            'branch_name'             => $req->branch?->name ?? $order?->branch?->name ?? 'Branch',
            'reason'                  => $req->reason,
            'notes'                   => $req->notes,
            'status'                  => $req->status ?? 'pending',
            'requested_at'            => $req->requested_at ? (is_string($req->requested_at) ? $req->requested_at : $req->requested_at->toIso8601String()) : now()->toIso8601String(),
            'timestamp'               => now()->toIso8601String(),
            'message'                 => "Cancellation requested for Order #{$orderNum}",
        ];
    }
}
