<?php

namespace App\Services;

use App\Models\PrintBridge;
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
     * Retrieve pending print jobs for a specific PrintBridge device.
     * Strictly isolates by branch_id and terminal_id (if configured).
     */
    public function getPendingJobsForBridge(PrintBridge $bridge, int $limit = 10)
    {
        $query = PrintJob::where('status', PrintJob::STATUS_PENDING)
            ->where('branch_id', $bridge->branch_id)
            ->where(function ($q) use ($bridge) {
                $q->whereNull('terminal_id')
                  ->orWhere('terminal_id', $bridge->terminal_id);
            });

        return $query->orderBy('id', 'asc')
            ->limit($limit)
            ->get();
    }

    /**
     * Atomically claim a pending print job for an active PrintBridge.
     * Prevents race conditions / duplicate prints when multiple bridges poll.
     */
    public function claimJob(PrintBridge $bridge, string $jobUuid): PrintJob
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($bridge, $jobUuid) {
            $job = PrintJob::where('job_uuid', $jobUuid)
                ->where('branch_id', $bridge->branch_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($job->status !== PrintJob::STATUS_PENDING && $job->claimed_by_bridge_id !== $bridge->id) {
                throw new \RuntimeException("Job is already being processed or completed (Status: {$job->status})");
            }

            $job->update([
                'status'               => PrintJob::STATUS_PRINTING,
                'claimed_by_bridge_id' => $bridge->id,
                'claimed_at'           => now(),
                'attempts'             => $job->attempts + 1,
            ]);

            SecurityAuditLogger::logSecurityEvent(
                event: 'PRINT_JOB_CLAIMED',
                target: "print_job:{$job->id}",
                details: [
                    'order_number' => $job->order_number,
                    'bridge_uuid'  => $bridge->bridge_uuid,
                    'branch_id'    => $bridge->branch_id,
                ],
                level: 'info'
            );

            return $job;
        });
    }

    /**
     * Register or update a PrintBridge companion device.
     */
    public function registerBridge(array $data): PrintBridge
    {
        $bridgeUuid = $data['bridge_uuid'] ?? null;

        $bridge = null;
        if ($bridgeUuid) {
            $bridge = PrintBridge::where('bridge_uuid', $bridgeUuid)->first();
        }

        if (!$bridge) {
            $bridge = new PrintBridge();
            if ($bridgeUuid) {
                $bridge->bridge_uuid = $bridgeUuid;
            }
        }

        $bridge->fill([
            'name'                   => $data['name'] ?? $bridge->name ?? 'POS Print Bridge',
            'branch_id'              => $data['branch_id'] ?? $bridge->branch_id,
            'terminal_id'            => $data['terminal_id'] ?? $bridge->terminal_id,
            'device_type'            => $data['device_type'] ?? $bridge->device_type ?? PrintBridge::TYPE_ANDROID,
            'paired_printer_name'    => $data['paired_printer_name'] ?? $bridge->paired_printer_name,
            'paired_printer_address' => $data['paired_printer_address'] ?? $bridge->paired_printer_address,
            'connection_type'        => $data['connection_type'] ?? $bridge->connection_type ?? PrintBridge::CONN_BT_SPP,
            'status'                 => PrintBridge::STATUS_ONLINE,
            'battery_level'          => $data['battery_level'] ?? $bridge->battery_level,
            'last_heartbeat_at'      => now(),
        ]);

        if (empty($bridge->api_token)) {
            $bridge->api_token = hash('sha256', Str::random(40));
        }

        $bridge->save();

        SecurityAuditLogger::logSecurityEvent(
            event: 'PRINT_BRIDGE_REGISTERED',
            target: "print_bridge:{$bridge->id}",
            details: [
                'bridge_uuid' => $bridge->bridge_uuid,
                'name'        => $bridge->name,
                'branch_id'   => $bridge->branch_id,
                'device_type' => $bridge->device_type,
            ],
            level: 'info'
        );

        return $bridge;
    }

    /**
     * Record live heartbeat from a PrintBridge device.
     */
    public function recordHeartbeat(string $bridgeUuid, ?int $batteryLevel = null, ?string $status = null): PrintBridge
    {
        $bridge = PrintBridge::where('bridge_uuid', $bridgeUuid)->firstOrFail();
        $bridge->recordHeartbeat($batteryLevel, $status);
        return $bridge;
    }

    /**
     * Generate an explicit 58mm test print job for a branch.
     * Strictly does not create sales or inventory records.
     */
    public function generateTestJob(int $branchId, ?string $terminalId = null, ?User $actor = null): PrintJob
    {
        $branch = \App\Models\Branch::findOrFail($branchId);
        $branchHeading = ReceiptFormatterService::formatBranchHeading($branch->name);
        $paperWidth = (int) ($branch->receipt_paper_width ?: 58);

        $dummySale = new Sale([
            'id'             => 0,
            'order_number'   => 'TEST-' . strtoupper(Str::random(4)),
            'branch_id'      => $branchId,
            'type'           => 'DINE-IN',
            'subtotal'       => 150.00,
            'discount'       => 0,
            'total_amount'   => 150.00,
            'paid_amount'    => 150.00,
            'change_amount'  => 0,
            'payment_method' => 'CASH',
            'created_at'     => now(),
        ]);
        $dummySale->setRelation('branch', $branch);
        $dummySale->setRelation('user', $actor);
        $dummySale->setRelation('items', collect([
            (object) [
                'product'         => (object) ['name' => 'Sample Maki Roll (Test)'],
                'quantity'        => 1,
                'price'           => 150.00,
                'subtotal'        => 150.00,
                'selected_addons' => [],
            ]
        ]));

        $receiptData = $this->formatter->buildReceiptData($dummySale, 'test', 'Hardware Diagnostic Test', $paperWidth);
        $receiptData['order_number'] = 'TEST-PRINT';
        $plainText = $this->formatter->formatPlainText($receiptData, $paperWidth);
        $escposBase64 = $this->formatter->formatEscPosBase64($receiptData, $paperWidth);

        $job = PrintJob::create([
            'job_uuid'          => (string) Str::uuid(),
            'order_number'      => 'TEST-PRINT',
            'branch_id'         => $branchId,
            'terminal_id'       => $terminalId,
            'job_type'          => 'test',
            'paper_width'       => $paperWidth,
            'status'            => PrintJob::STATUS_PENDING,
            'receipt_data'      => $receiptData,
            'formatted_text'    => $plainText,
            'raw_escpos_base64' => $escposBase64,
            'attempts'          => 0,
        ]);

        try {
            event(new PrintJobCreated($job));
        } catch (\Throwable $e) {
            Log::warning('PrintJobCreated test broadcast warning: ' . $e->getMessage());
        }

        return $job;
    }

    /**
     * Mark print job status update from local/Android bridge.
     */
    public function updateStatus(string $jobUuid, string $status, ?string $error = null, ?PrintBridge $bridge = null): PrintJob
    {
        $job = PrintJob::where('job_uuid', $jobUuid)->firstOrFail();

        if ($status === PrintJob::STATUS_PRINTED) {
            $job->markPrinted();
            SecurityAuditLogger::logSecurityEvent(
                event: 'PRINT_JOB_PRINTED',
                target: "print_job:{$job->id}",
                details: [
                    'order_number' => $job->order_number, 
                    'branch_id'    => $job->branch_id,
                    'bridge_uuid'  => $bridge?->bridge_uuid,
                ],
                level: 'info'
            );
        } elseif ($status === PrintJob::STATUS_FAILED) {
            $job->markFailed($error ?? 'Printer spooling failed');
            SecurityAuditLogger::logSecurityEvent(
                event: 'PRINT_JOB_FAILED',
                target: "print_job:{$job->id}",
                details: [
                    'order_number' => $job->order_number, 
                    'error'        => $error,
                    'bridge_uuid'  => $bridge?->bridge_uuid,
                ],
                level: 'warning'
            );
        } elseif ($status === PrintJob::STATUS_PRINTING) {
            $job->markPrinting();
        }

        return $job;
    }
}

