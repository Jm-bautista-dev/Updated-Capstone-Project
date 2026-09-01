<?php

namespace App\Events;

use App\Models\Sale;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SaleCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Sale $sale;

    public function __construct(Sale $sale)
    {
        $this->sale = $sale;
    }

    /**
     * Channels to broadcast on:
     * - admin.orders: For Admin/SuperAdmin viewing global Dashboard, Sales, and Reports
     * - branch.{id}.orders: For Branch Cashiers & Managers
     * - branch.{id}: Legacy branch channel
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        if (!$this->sale->relationLoaded('branch')) {
            $this->sale->load('branch');
        }

        $channels = [
            new PrivateChannel('admin.orders'),
        ];

        if ($this->sale->branch_id) {
            $channels[] = new PrivateChannel('branch.' . $this->sale->branch_id . '.orders');
            $channels[] = new PrivateChannel('branch.' . $this->sale->branch_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'SaleCreated';
    }

    /**
     * Structured broadcast payload with complete financial and order context.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $branchName = $this->sale->branch?->name ?? 'Main Branch';

        return [
            'event'          => 'SaleCreated',
            'id'             => $this->sale->id,
            'sale_id'        => $this->sale->id,
            'order_id'       => $this->sale->order_id,
            'order_number'   => $this->sale->order_number ?? ('ORD-' . $this->sale->id),
            'branch_id'      => $this->sale->branch_id,
            'branch_name'    => $branchName,
            'type'           => $this->sale->type ?? 'delivery',
            'subtotal'       => (float) ($this->sale->subtotal ?? 0),
            'delivery_fee'   => (float) ($this->sale->delivery_fee ?? 0),
            'total'          => (float) ($this->sale->total ?? 0),
            'cost_total'     => (float) ($this->sale->cost_total ?? 0),
            'profit'         => (float) ($this->sale->profit ?? 0),
            'payment_method' => $this->sale->payment_method ?? 'cash',
            'status'         => $this->sale->status ?? 'completed',
            'created_at'     => $this->sale->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'timestamp'      => now()->toIso8601String(),
            'message'        => 'New sale processed',
        ];
    }
}


