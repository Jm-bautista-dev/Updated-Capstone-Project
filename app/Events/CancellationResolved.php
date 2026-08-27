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

class CancellationResolved implements ShouldBroadcastNow
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
                'reviewedBy',
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
        return 'CancellationResolved';
    }

    public function broadcastWith(): array
    {
        $req = $this->cancellationRequest;
        $order = $req->order ?? ($req->order_id ? \App\Models\Order::find($req->order_id) : null);
        $delivery = $req->delivery ?? $order?->delivery;
        $orderNum = $order?->order_number ?? ("ORD-" . $req->order_id);
        $riderId = $req->rider_id ?? $req->requested_by_rider_id ?? $order?->rider_id;
        $deliveryId = $req->delivery_id ?? $delivery?->id;
        $resolutionNotes = $req->resolution_notes ?? $req->rejection_reason ?? $req->manager_notes ?? null;
        $reviewedByName = $req->reviewed_by_name ?? $req->reviewedBy?->name ?? 'Branch Manager';

        return [
            'cancellation_request_id'     => $req->id,
            'order_id'                    => $req->order_id,
            'order_number'                => $orderNum,
            'delivery_id'                 => $deliveryId,
            'rider_id'                    => $riderId,
            'cancellation_request_status' => $req->status, // 'approved' | 'rejected'
            'order_status'                => $req->status === 'approved' ? 'cancelled' : ($order?->status ?? 'in_transit'),
            'delivery_status'             => $req->status === 'approved' ? 'cancelled' : ($delivery?->status ?? 'in_transit'),
            'reviewed_by'                 => $req->reviewed_by,
            'reviewed_by_id'              => $req->reviewed_by,
            'reviewed_by_name'            => $reviewedByName,
            'reviewed_at'                 => $req->reviewed_at ? (is_string($req->reviewed_at) ? $req->reviewed_at : $req->reviewed_at->toIso8601String()) : now()->toIso8601String(),
            'resolution_notes'            => $resolutionNotes,
            'rejection_reason'            => $resolutionNotes,
            'timestamp'                   => now()->toIso8601String(),
            'message'                     => "Cancellation request for Order #{$orderNum} was " . strtoupper((string)$req->status),
        ];
    }
}
