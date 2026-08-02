<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Ingredient;
use App\Models\SyncedOperation;
use App\Models\RestockRequest;
use App\Models\InventoryLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class SyncService
{
    protected $saleService;
    protected $inventoryService;

    public function __construct(SaleService $saleService, InventoryService $inventoryService)
    {
        $this->saleService = $saleService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * Sync a batch of operations.
     * Returns an array of synced operations and conflicts.
     */
    public function syncBatch(array $operations): array
    {
        $synced = [];
        $conflicts = [];

        // Order operations by SALE, INVENTORY_UPDATE, RESTOCK
        usort($operations, function ($a, $b) {
            $order = ['SALE' => 1, 'INVENTORY_UPDATE' => 2, 'RESTOCK' => 3];
            $aOrder = $order[$a['type'] ?? ''] ?? 99;
            $bOrder = $order[$b['type'] ?? ''] ?? 99;
            return $aOrder <=> $bOrder;
        });

        foreach ($operations as $op) {
            $clientOpId = $op['id'] ?? null;
            if (!$clientOpId) {
                continue;
            }

            // Check if already processed (Idempotency)
            $existing = SyncedOperation::where('client_op_id', $clientOpId)->first();
            if ($existing) {
                if ($existing->status === 'success') {
                    $synced[] = $clientOpId;
                    continue;
                } else {
                    $conflicts[] = [
                        'client_op_id' => $clientOpId,
                        'type' => $op['type'],
                        'reason' => 'PREVIOUS_FAILURE',
                        'message' => 'This operation failed in a previous sync run.',
                        'payload' => $op['payload'] ?? null,
                    ];
                    continue;
                }
            }

            // Start a transaction for this individual operation
            DB::beginTransaction();
            try {
                $payload = $op['payload'] ?? [];
                $result = $this->processOperation($op['type'], $payload);

                // Record successful synced operation
                SyncedOperation::create([
                    'client_op_id' => $clientOpId,
                    'status' => 'success',
                    'payload' => $op,
                ]);

                DB::commit();
                $synced[] = $clientOpId;
            } catch (\Exception $e) {
                DB::rollBack();

                $conflictReason = 'SYNC_ERROR';
                if (str_contains($e->getMessage(), 'Insufficient')) {
                    $conflictReason = 'INSUFFICIENT_STOCK';
                }

                Log::warning("Sync conflict on operation {$clientOpId} [{$op['type']}]: " . $e->getMessage());

                // Record conflict state so we don't double process, but flag as conflict
                SyncedOperation::create([
                    'client_op_id' => $clientOpId,
                    'status' => 'conflict',
                    'payload' => $op,
                ]);

                $conflicts[] = [
                    'client_op_id' => $clientOpId,
                    'type' => $op['type'],
                    'reason' => $conflictReason,
                    'message' => $e->getMessage(),
                    'payload' => $payload,
                ];
            }
        }

        return [
            'synced' => $synced,
            'conflicts' => $conflicts,
        ];
    }

    /**
     * Process a single operation based on type.
     */
    protected function processOperation(string $type, array $payload)
    {
        switch ($type) {
            case 'SALE':
                return $this->processSaleOp($payload);
            case 'INVENTORY_UPDATE':
                return $this->processInventoryUpdateOp($payload);
            case 'RESTOCK':
                return $this->processRestockOp($payload);
            default:
                throw new \Exception("Unsupported operation type: {$type}");
        }
    }

    protected function processSaleOp(array $payload)
    {
        $sale = $this->saleService->processSale($payload);

        // Track user_id and product_id for inventory_logs
        $user = Auth::user();
        foreach ($payload['items'] as $item) {
            InventoryLog::create([
                'product_id' => $item['id'],
                'user_id' => $user->id,
                'action_type' => 'SALE',
                'quantity' => $item['quantity'],
            ]);
        }

        return $sale;
    }

    protected function processInventoryUpdateOp(array $payload)
    {
        $user = Auth::user();
        $action = $payload['action'] ?? 'IN';

        if ($action === 'IN') {
            // Stock in
            $stockLog = $this->inventoryService->stockIn(
                $payload['type'] ?? 'product',
                (int) $payload['id'],
                (float) $payload['quantity'],
                $payload['unit'],
                (int) $payload['branch_id'],
                (float) ($payload['purchase_price'] ?? 0)
            );

            if (($payload['type'] ?? 'product') === 'product') {
                InventoryLog::create([
                    'product_id' => $payload['id'],
                    'user_id' => $user->id,
                    'action_type' => 'RESTOCK',
                    'quantity' => $payload['quantity'],
                ]);
            }

            return $stockLog;
        } else {
            // Wastage
            $wastage = $this->inventoryService->logWastage(
                $payload['type'] ?? 'product',
                (int) $payload['id'],
                (float) $payload['quantity'],
                $payload['unit'],
                $payload['reason'] ?? 'other',
                $payload['notes'] ?? '',
                (int) $payload['branch_id']
            );

            if (($payload['type'] ?? 'product') === 'product') {
                InventoryLog::create([
                    'product_id' => $payload['id'],
                    'user_id' => $user->id,
                    'action_type' => 'ADJUSTMENT',
                    'quantity' => -$payload['quantity'],
                ]);
            }

            return $wastage;
        }
    }

    protected function processRestockOp(array $payload)
    {
        $user = Auth::user();
        
        $request = RestockRequest::create([
            'branch_id' => $payload['branch_id'],
            'user_id' => $user->id,
            'item_type' => $payload['item_type'] ?? 'ingredient',
            'item_id' => $payload['item_id'],
            'quantity' => $payload['quantity'],
            'unit' => $payload['unit'],
            'status' => 'pending',
        ]);

        return $request;
    }
}
