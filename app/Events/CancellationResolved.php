<?php

namespace App\Events;

use App\Models\OrderCancellationRequest;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CancellationResolved implements ShouldBroadcastNow
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
            'reviewedBy',
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
        return 'CancellationResolved';
    }

    public function broadcastWith(): array
    {
        $req = $this->cancellationRequest;
        $order = $req->order;
        $delivery = $req->delivery;
        $orderNum = $order?->order_number ?? ("ORD-" . $req->order_id);

        return [
            'cancellation_request_id'     => $req->id,
            'order_id'                    => $req->order_id,
            'order_number'                => $orderNum,
            'cancellation_request_status' => $req->status, // 'approved' or 'rejected'
            'order_status'                => $order?->status ?? 'cancelled',
            'delivery_status'             => $delivery?->status ?? 'cancelled',
            'reviewed_by_id'              => $req->reviewed_by,
            'reviewed_by_name'            => $req->reviewedBy?->name ?? 'Cashier',
            'reviewed_at'                 => $req->reviewed_at ? $req->reviewed_at->toDateTimeString() : now()->toDateTimeString(),
            'rejection_reason'            => $req->rejection_reason,
            'timestamp'                   => now()->toDateTimeString(),
            'message'                     => "Cancellation request for Order #{$orderNum} was " . strtoupper((string)$req->status),
        ];
    }
}
