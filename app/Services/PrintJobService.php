<?php

namespace App\Services;

use App\Models\PrintJob;
use App\Models\Sale;
use App\Models\Order;
use App\Models\User;
use App\Events\PrintJobCreated;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PrintJobService
{
    public function __construct(
        protected ReceiptFormatterService $formatter
    ) {}

    /**
     * Create or retrieve an existing print job for a Sale.
     * Guaranteed idempotent by sale_id or idempotency_key.
     */
    public function createForSale(Sale $sale, ?string $idempotencyKey = null, ?string $terminalId = null): PrintJob
    {
        // 1. Check if print job already exists for this sale
        if ($idempotencyKey) {
            $existing = PrintJob::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }
        }

        $existing = PrintJob::where('sale_id', $sale->id)
            ->where('job_type', PrintJob::TYPE_RECEIPT)
            ->first();

        if ($existing) {
            return $existing;
        }

        // 2. Build receipt data and payloads
        $sale->loadMissing(['items.product', 'branch', 'user']);
        $receiptData = $this->formatter->buildReceiptData($sale, PrintJob::TYPE_RECEIPT);
        $paperWidth = (int) ($receiptData['paper_width'] ?? 80);
        $plainText = $this->formatter->formatPlainText($receiptData, $paperWidth);
        $escposBase64 = $this->formatter->formatEscPosBase64($receiptData, $paperWidth);

        // 3. Create PrintJob record
        $job = PrintJob::create([
            'job_uuid'          => (string) Str::uuid(),
            'sale_id'           => $sale->id,
            'order_id'          => $sale->order_id ?? null,
            'order_number'      => $sale->order_number ?: "POS-{$sale->id}",
            'branch_id'         => $sale->branch_id,
            'terminal_id'       => $terminalId,
            'job_type'          => PrintJob::TYPE_RECEIPT,
            'paper_width'       => $paperWidth,
            'status'            => PrintJob::STATUS_PENDING,
            'receipt_data'      => $receiptData,
            'formatted_text'    => $plainText,
            'raw_escpos_base64' => $escposBase64,
            'idempotency_key'   => $idempotencyKey,
            'attempts'          => 0,
        ]);

        // 4. Audit Log
        SecurityAuditLogger::logSecurityEvent(
            event: 'PRINT_JOB_CREATED',
            target: "print_job:{$job->id}",
            details: [
                'order_number' => $job->order_number,
                'branch_id'    => $job->branch_id,
                'job_type'     => $job->job_type,
                'paper_width'  => $job->paper_width,
            ],
            level: 'info'
        );

        // 5. Broadcast to local POS bridges
        try {
            event(new PrintJobCreated($job));
        } catch (\Throwable $e) {
            Log::warning('PrintJobCreated broadcast warning: ' . $e->getMessage());
        }

        return $job;
    }

    /**
     * Create a manual reprint job for an existing Sale or Order.
     */
    public function reprintReceipt(
        int $recordId,
        string $recordType = 'sale',
        ?User $actor = null,
        ?string $reason = 'Customer requested duplicate receipt'
    ): PrintJob {
        $record = ($recordType === 'order')
            ? Order::with(['items.product', 'branch', 'user'])->findOrFail($recordId)
            : Sale::with(['items.product', 'branch', 'user'])->findOrFail($recordId);

        $receiptData = $this->formatter->buildReceiptData($record, PrintJob::TYPE_REPRINT, $reason);
        $paperWidth = (int) ($receiptData['paper_width'] ?? 80);
        $plainText = $this->formatter->formatPlainText($receiptData, $paperWidth);
        $escposBase64 = $this->formatter->formatEscPosBase64($receiptData, $paperWidth);

        $orderNumber = $record->order_number ?: (($record instanceof Sale) ? "POS-{$record->id}" : "ORD-{$record->id}");

        $job = PrintJob::create([
            'job_uuid'          => (string) Str::uuid(),
            'sale_id'           => ($record instanceof Sale) ? $record->id : null,
            'order_id'          => ($record instanceof Order) ? $record->id : ($record->order_id ?? null),
            'order_number'      => $orderNumber,
            'branch_id'         => $record->branch_id,
            'job_type'          => PrintJob::TYPE_REPRINT,
            'paper_width'       => $paperWidth,
            'status'            => PrintJob::STATUS_PENDING,
            'receipt_data'      => $receiptData,
            'formatted_text'    => $plainText,
            'raw_escpos_base64' => $escposBase64,
            'reprint_reason'    => $reason,
            'reprinted_by'      => $actor?->id,
            'attempts'          => 0,
        ]);

        // Security Audit Log: Explicitly recorded
        SecurityAuditLogger::logSecurityEvent(
            event: 'RECEIPT_REPRINTED',
            target: "order:{$orderNumber}",
            details: [
                'print_job_id' => $job->id,
                'order_number' => $orderNumber,
                'branch_id'    => $job->branch_id,
                'actor_id'     => $actor?->id,
                'actor_name'   => $actor?->name ?? 'Staff',
                'reason'       => $reason,
            ],
            level: 'info'
        );

        try {
            event(new PrintJobCreated($job));
        } catch (\Throwable $e) {
            Log::warning('PrintJobCreated reprint broadcast warning: ' . $e->getMessage());
        }

        return $job;
    }

    /**
     * Mark print job status update from local bridge.
     */
    public function updateStatus(string $jobUuid, string $status, ?string $error = null): PrintJob
    {
        $job = PrintJob::where('job_uuid', $jobUuid)->firstOrFail();

        if ($status === PrintJob::STATUS_PRINTED) {
            $job->markPrinted();
            SecurityAuditLogger::logSecurityEvent(
                event: 'PRINT_JOB_PRINTED',
                target: "print_job:{$job->id}",
                details: ['order_number' => $job->order_number, 'branch_id' => $job->branch_id],
                level: 'info'
            );
        } elseif ($status === PrintJob::STATUS_FAILED) {
            $job->markFailed($error ?? 'Printer spooling failed');
            SecurityAuditLogger::logSecurityEvent(
                event: 'PRINT_JOB_FAILED',
                target: "print_job:{$job->id}",
                details: ['order_number' => $job->order_number, 'error' => $error],
                level: 'warning'
            );
        } elseif ($status === PrintJob::STATUS_PRINTING) {
            $job->markPrinting();
        }

        return $job;
    }
}
