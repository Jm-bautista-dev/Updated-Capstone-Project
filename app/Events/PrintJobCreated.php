<?php

namespace App\Events;

use App\Models\PrintJob;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrintJobCreated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public PrintJob $printJob)
    {
    }

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('branch.' . $this->printJob->branch_id . '.orders'),
        ];

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'PrintJobCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'id'                => $this->printJob->id,
            'job_uuid'          => $this->printJob->job_uuid,
            'sale_id'           => $this->printJob->sale_id,
            'order_id'          => $this->printJob->order_id,
            'order_number'      => $this->printJob->order_number,
            'branch_id'         => $this->printJob->branch_id,
            'terminal_id'       => $this->printJob->terminal_id,
            'job_type'          => $this->printJob->job_type,
            'paper_width'       => $this->printJob->paper_width,
            'status'            => $this->printJob->status,
            'receipt_data'      => $this->printJob->receipt_data,
            'formatted_text'    => $this->printJob->formatted_text,
            'raw_escpos_base64' => $this->printJob->raw_escpos_base64,
            'created_at'        => $this->printJob->created_at?->toIso8601String(),
        ];
    }
}
