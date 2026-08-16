<?php

namespace App\Events;

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

    public function __construct(OrderCancellationRequest $cancellationRequest)
    {
        $this->cancellationRequest = $cancellationRequest->loadMissing([
            'order.branch',
            'delivery',
            'requestedByRider',
            'branch',
        ]);
    }

    public function broadcastOn(): array
    {
        $order = $this->cancellationRequest->order;
        $branchId = $this->cancellationRequest->branch_id ?? $order?->branch_id;
        $riderId = $this->cancellationRequest->requested_by_rider_id;

        $channels = [
            new PrivateChannel('admin.orders'),
            new Channel('orders'),
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
        $order = $req->order;
        $orderNum = $order?->order_number ?? ("ORD-" . $req->order_id);

        return [
            'cancellation_request_id' => $req->id,
            'order_id'                => $req->order_id,
            'order_number'            => $orderNum,
            'delivery_id'             => $req->delivery_id,
            'rider_id'                => $req->requested_by_rider_id,
            'rider_name'              => $req->requestedByRider?->name ?? 'Rider',
            'customer_name'           => $order?->customer_name ?? 'Customer',
            'branch_id'               => $req->branch_id,
            'branch_name'             => $req->branch?->name ?? $order?->branch?->name ?? 'Branch',
            'reason'                  => $req->reason,
            'notes'                   => $req->notes,
            'status'                  => $req->status,
            'requested_at'            => $req->requested_at ? $req->requested_at->toDateTimeString() : now()->toDateTimeString(),
            'timestamp'               => now()->toDateTimeString(),
            'message'                 => "Cancellation requested for Order #{$orderNum}",
        ];
    }
}
