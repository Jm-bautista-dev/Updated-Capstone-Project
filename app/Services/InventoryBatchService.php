<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientBatchMovement;
use App\Models\BatchAllocation;
use App\Models\IngredientStock;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class InventoryBatchService
{
    /**
     * Get the consumption queue for an ingredient in a branch,
     * sorted strictly in FEFO / FIFO priority order.
     */
    public function getQueueForIngredient(int $ingredientId, int $branchId, bool $includeIneligible = true): array
    {
        $this->ensureBatchCoverage($ingredientId, $branchId);

        $ingredient = Ingredient::findOrFail($ingredientId);
        $displayUnit = strtolower(trim($ingredient->unit));

        $query = IngredientBatch::with(['supplier', 'receivedBy'])
            ->where('ingredient_id', $ingredientId)
            ->where('branch_id', $branchId);

        if (!$includeIneligible) {
            $query->eligibleForConsumption();
        }

        $allBatches = $query->orderByFefoFifo()->get();

        $eligibleBatches = [];
        $ineligibleBatches = [];
        $priorityRank = 1;

        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        foreach ($allBatches as $batch) {
            $isEligible = $batch->isEligibleForConsumption($now);

            $displayCurrent = UnitConverter::convertFromBaseQuantity((float) $batch->current_quantity, $displayUnit);
            $displayInitial = UnitConverter::convertFromBaseQuantity((float) $batch->initial_quantity, $displayUnit);

            $priorityExplanation = '';
            if ($isEligible) {
                if ($batch->expiration_date) {
                    $days = $batch->days_until_expiration;
                    if ($days === 0) {
                        $priorityExplanation = "Priority {$priorityRank} — Expires today (FEFO)";
                    } elseif ($days > 0) {
                        $priorityExplanation = "Priority {$priorityRank} — Expires in {$days} days ({$batch->expiration_date->format('M d, Y')})";
                    } else {
                        $priorityExplanation = "Priority {$priorityRank} — FEFO priority queue";
                    }
                } else {
                    $priorityExplanation = "Priority {$priorityRank} — FIFO priority queue (Received {$batch->received_at->format('M d, Y')})";
                }
                $rankAssigned = $priorityRank++;
            } else {
                $priorityExplanation = match ($batch->status) {
                    'quarantined' => 'Ineligible — Batch is quarantined',
                    'recalled'    => 'Ineligible — Batch is recalled',
                    'damaged'     => 'Ineligible — Batch is marked damaged',
                    'depleted'    => 'Depleted — Zero quantity remaining',
                    default       => $batch->isExpired($now) ? 'Ineligible — Batch is expired' : 'Ineligible for consumption',
                };
                $rankAssigned = null;
            }

            $batchData = [
                'id'                     => $batch->id,
                'batch_code'             => $batch->batch_code,
                'lot_number'             => $batch->lot_number ?: 'N/A',
                'ingredient_id'          => $batch->ingredient_id,
                'branch_id'              => $batch->branch_id,
                'supplier_name'          => $batch->supplier?->name ?? ($batch->supplier_name ?: 'General Delivery'),
                'received_at'            => $batch->received_at ? $batch->received_at->toIso8601String() : null,
                'received_at_formatted'  => $batch->received_at ? $batch->received_at->format('M d, Y h:i A') : 'N/A',
                'manufacture_date'       => $batch->manufacture_date ? Carbon::parse($batch->manufacture_date)->format('M d, Y') : null,
                'expiration_date'        => $batch->expiration_date ? $batch->expiration_date->toIso8601String() : null,
                'expiration_date_formatted' => $batch->expiration_date ? $batch->expiration_date->format('M d, Y') : 'No Expiry',
                'expiration_type'        => $batch->expiration_type,
                'expiration_status'      => $batch->expiration_status,
                'days_until_expiration'  => $batch->days_until_expiration,
                'initial_quantity'       => $displayInitial,
                'initial_quantity_base'  => (float) $batch->initial_quantity,
                'current_quantity'       => $displayCurrent,
                'current_quantity_base'  => (float) $batch->current_quantity,
                'unit'                   => $displayUnit,
                'cost_per_base_unit'     => (float) $batch->cost_per_base_unit,
                'purchase_price'         => (float) $batch->purchase_price,
                'status'                 => $batch->status,
                'is_eligible'            => $isEligible,
                'is_legacy'              => (bool) $batch->is_legacy,
                'priority'               => $rankAssigned,
                'priority_explanation'   => $priorityExplanation,
                'notes'                  => $batch->notes,
                'reference'              => $batch->reference,
            ];

            if ($isEligible) {
                $eligibleBatches[] = $batchData;
            } else {
                $ineligibleBatches[] = $batchData;
            }
        }

        $totalEligibleBase = array_sum(array_column($eligibleBatches, 'current_quantity_base'));
        $totalPhysicalBase = $totalEligibleBase + array_sum(array_column($ineligibleBatches, 'current_quantity_base'));

        return [
            'ingredient'              => [
                'id'                  => $ingredient->id,
                'name'                => $ingredient->name,
                'unit'                => $displayUnit,
                'requires_expiry'     => (bool) $ingredient->requires_expiration_tracking,
                'expiry_warning_days' => $ingredient->expiry_warning_days ?? 7,
            ],
            'branch_id'               => $branchId,
            'eligible_batches'        => $eligibleBatches,
            'ineligible_batches'      => $ineligibleBatches,
            'all_batches'             => array_merge($eligibleBatches, $ineligibleBatches),
            'total_eligible_stock'    => UnitConverter::convertFromBaseQuantity($totalEligibleBase, $displayUnit),
            'total_eligible_stock_base' => $totalEligibleBase,
            'total_physical_stock'    => UnitConverter::convertFromBaseQuantity($totalPhysicalBase, $displayUnit),
            'total_physical_stock_base' => $totalPhysicalBase,
        ];
    }

    /**
     * Get available eligible stock (in canonical base quantity) for an ingredient at a branch.
     */
    public function getAvailableEligibleStock(int $ingredientId, int $branchId): float
    {
        $this->ensureBatchCoverage($ingredientId, $branchId);

        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        return (float) IngredientBatch::where('ingredient_id', $ingredientId)
            ->where('branch_id', $branchId)
            ->eligibleForConsumption($now)
            ->sum('current_quantity');
    }

    /**
     * Atomically allocate stock for consumption using FEFO / FIFO priority queue.
     * Throws an actionable exception if eligible stock is insufficient.
     *
     * @param int $ingredientId
     * @param int $branchId
     * @param float $requiredQuantityBase  Quantity in canonical base units (g, ml, pcs)
     * @param string $allocatableType      Model class (e.g. Sale::class, Order::class)
     * @param int $allocatableId          Model primary key
     * @param string|null $referenceNumber Order number or sale reference
     * @param int|null $userId             Actor ID
     * @return array                       List of created BatchAllocation instances
     * @throws \Exception
     */
    public function allocateStock(
        int     $ingredientId,
        int     $branchId,
        float   $requiredQuantityBase,
        string  $allocatableType,
        int     $allocatableId,
        ?string $referenceNumber = null,
        ?int    $userId = null,
        bool    $syncAggregateStock = false,
        bool    $allowForceOverride = false
    ): array {
        if ($requiredQuantityBase <= 0) {
            return [];
        }

        $this->ensureBatchCoverage($ingredientId, $branchId);

        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        // Lock eligible batches in FEFO/FIFO priority order
        $batches = IngredientBatch::where('ingredient_id', $ingredientId)
            ->where('branch_id', $branchId)
            ->eligibleForConsumption($now)
            ->orderByFefoFifo()
            ->lockForUpdate()
            ->get();

        $totalAvailable = (float) $batches->sum('current_quantity');

        if ($totalAvailable < $requiredQuantityBase && !$allowForceOverride) {
            $ingredient = Ingredient::find($ingredientId);
            $name = $ingredient ? $ingredient->name : "ID #{$ingredientId}";
            $unit = $ingredient ? $ingredient->unit : 'unit(s)';

            $displayNeeded = UnitConverter::convertFromBaseQuantity($requiredQuantityBase, $unit);
            $displayAvailable = UnitConverter::convertFromBaseQuantity($totalAvailable, $unit);

            throw new \Exception(
                "Insufficient eligible stock in this branch. " .
                "Ingredient '{$name}': need {$displayNeeded} {$unit}, " .
                "have {$displayAvailable} {$unit} eligible."
            );
        }

        $remainingToDeduct = $requiredQuantityBase;
        $allocations = [];
        $totalCost = 0.0;

        foreach ($batches as $batch) {
            if ($remainingToDeduct <= 0) {
                break;
            }

            $currentBatchQty = (float) $batch->current_quantity;
            if ($currentBatchQty <= 0) {
                continue;
            }

            $deductQty = min($currentBatchQty, $remainingToDeduct);
            $newBatchQty = $currentBatchQty - $deductQty;

            $batch->current_quantity = $newBatchQty;
            if ($newBatchQty <= 0.00001) {
                $batch->current_quantity = 0;
                $batch->status = 'depleted';
            }
            $batch->save();

            $unitCost = (float) $batch->cost_per_base_unit;
            $lineCost = $unitCost * $deductQty;
            $totalCost += $lineCost;

            // 1. Record allocation
            $allocation = BatchAllocation::create([
                'batch_id'         => $batch->id,
                'ingredient_id'    => $ingredientId,
                'branch_id'        => $branchId,
                'allocatable_type' => $allocatableType,
                'allocatable_id'   => $allocatableId,
                'quantity_base'    => $deductQty,
                'unit'             => $batch->unit,
                'unit_cost'        => $unitCost,
                'total_cost'       => $lineCost,
                'is_reversed'      => false,
            ]);

            // 2. Record movement ledger entry
            IngredientBatchMovement::create([
                'batch_id'                => $batch->id,
                'ingredient_id'           => $ingredientId,
                'branch_id'               => $branchId,
                'user_id'                 => $userId ?: Auth::id(),
                'movement_type'           => $allocatableType === 'App\Models\Order' ? 'order_consumption' : 'pos_consumption',
                'quantity'                => UnitConverter::convertFromBaseQuantity($deductQty, $batch->unit),
                'quantity_base'           => $deductQty,
                'unit'                    => $batch->unit,
                'previous_batch_quantity' => $currentBatchQty,
                'new_batch_quantity'      => $batch->current_quantity,
                'cost_at_movement'        => $unitCost,
                'reference_type'          => $allocatableType,
                'reference_id'            => $allocatableId,
                'reference_number'        => $referenceNumber,
                'notes'                   => "Recipe deduction: Batch {$batch->batch_code}",
            ]);

            $allocations[] = $allocation;
            $remainingToDeduct -= $deductQty;
        }

        // If force override allowed and batches couldn't cover the full quantity
        if ($remainingToDeduct > 0 && $allowForceOverride) {
            $ingredient = Ingredient::find($ingredientId);
            $overrideCode = sprintf('OVERRIDE-B%d-I%d', $branchId, $ingredientId);
            $overrideBatch = IngredientBatch::firstOrCreate(
                [
                    'ingredient_id' => $ingredientId,
                    'branch_id'     => $branchId,
                    'batch_code'    => $overrideCode,
                ],
                [
                    'lot_number'         => 'FORCE-OVERRIDE',
                    'received_at'        => Carbon::now(config('app.timezone', 'Asia/Manila')),
                    'initial_quantity'   => 0,
                    'current_quantity'   => 0,
                    'unit'               => $ingredient ? $ingredient->unit : 'g',
                    'cost_per_base_unit' => $ingredient ? (float) $ingredient->cost_per_base_unit : 0,
                    'status'             => 'available',
                    'is_legacy'          => true,
                    'notes'              => 'Emergency force override inventory batch',
                ]
            );

            $overrideBatch->current_quantity = max(-999999.0, (float) $overrideBatch->current_quantity - $remainingToDeduct);
            $overrideBatch->save();

            $allocations[] = BatchAllocation::create([
                'batch_id'         => $overrideBatch->id,
                'ingredient_id'    => $ingredientId,
                'branch_id'        => $branchId,
                'allocatable_type' => $allocatableType,
                'allocatable_id'   => $allocatableId,
                'quantity_base'    => $remainingToDeduct,
                'unit'             => $overrideBatch->unit,
                'unit_cost'        => (float) $overrideBatch->cost_per_base_unit,
                'total_cost'       => ((float) $overrideBatch->cost_per_base_unit) * $remainingToDeduct,
                'is_reversed'      => false,
            ]);

            IngredientBatchMovement::create([
                'batch_id'                => $overrideBatch->id,
                'ingredient_id'           => $ingredientId,
                'branch_id'               => $branchId,
                'user_id'                 => $userId ?: Auth::id(),
                'movement_type'           => $allocatableType === 'App\Models\Order' ? 'order_consumption' : 'pos_consumption',
                'quantity'                => UnitConverter::convertFromBaseQuantity($remainingToDeduct, $overrideBatch->unit),
                'quantity_base'           => $remainingToDeduct,
                'unit'                    => $overrideBatch->unit,
                'previous_batch_quantity' => 0,
                'new_batch_quantity'      => (float) $overrideBatch->current_quantity,
                'cost_at_movement'        => (float) $overrideBatch->cost_per_base_unit,
                'reference_type'          => $allocatableType,
                'reference_id'            => $allocatableId,
                'reference_number'        => $referenceNumber,
                'notes'                   => "Authorized force override deduction shortfall: {$remainingToDeduct} base units",
            ]);
        }

        if ($syncAggregateStock && count($allocations) > 0) {
            $totalAllocatedBase = array_sum(array_map(fn($a) => (float) $a->quantity_base, $allocations));
            IngredientStock::where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->decrement('stock', $totalAllocatedBase);
        }

        return $allocations;
    }

    /**
     * Reverse allocated stock for a cancelled, voided, or refunded transaction.
     * Strictly verifies eligibility: if a batch has since expired or been quarantined,
     * routes the quantity to an authorized disposition/quarantine entry instead of
     * silently making unsafe ingredients available for future sales.
     *
     * @param string $allocatableType
     * @param int $allocatableId
     * @param int|null $userId
     * @param string|null $reason
     * @return array
     */
    public function reverseAllocations(
        string  $allocatableType,
        int     $allocatableId,
        ?int    $userId = null,
        ?string $reason = null
    ): array {
        $allocations = BatchAllocation::where('allocatable_type', $allocatableType)
            ->where('allocatable_id', $allocatableId)
            ->where('is_reversed', false)
            ->get();

        if ($allocations->isEmpty()) {
            return [];
        }

        $reversed = [];
        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));

        foreach ($allocations as $allocation) {
            /** @var IngredientBatch|null $batch */
            $batch = IngredientBatch::where('id', $allocation->batch_id)->lockForUpdate()->first();
            if (!$batch) {
                continue;
            }

            $restoreQty = (float) $allocation->quantity_base;
            $prevQty = (float) $batch->current_quantity;

            // Check eligibility before making available
            $isStillEligible = (!$batch->expiration_date || $batch->expiration_date->gt($now))
                && in_array($batch->status, ['available', 'depleted']);

            if ($isStillEligible) {
                // Restore directly to batch
                $newQty = $prevQty + $restoreQty;
                $batch->current_quantity = $newQty;
                if ($batch->status === 'depleted') {
                    $batch->status = 'available';
                }
                $batch->save();

                IngredientBatchMovement::create([
                    'batch_id'                => $batch->id,
                    'ingredient_id'           => $allocation->ingredient_id,
                    'branch_id'               => $allocation->branch_id,
                    'user_id'                 => $userId ?: Auth::id(),
                    'movement_type'           => 'reversal',
                    'quantity'                => UnitConverter::convertFromBaseQuantity($restoreQty, $batch->unit),
                    'quantity_base'           => $restoreQty,
                    'unit'                    => $batch->unit,
                    'previous_batch_quantity' => $prevQty,
                    'new_batch_quantity'      => $newQty,
                    'cost_at_movement'        => (float) $batch->cost_per_base_unit,
                    'reference_type'          => $allocatableType,
                    'reference_id'            => $allocatableId,
                    'reference_number'        => "REVERSAL-{$allocatableId}",
                    'notes'                   => "Restored to active batch: {$reason}",
                ]);
            } else {
                // Batch is expired or quarantined! Route to a quarantined batch disposition
                $quarantineBatchCode = "QUAR-REV-{$batch->id}-" . strtoupper(Str::random(4));
                $quarantinedBatch = IngredientBatch::create([
                    'batch_code'         => $quarantineBatchCode,
                    'lot_number'         => $batch->lot_number ?: 'REVERSAL-HOLD',
                    'ingredient_id'      => $allocation->ingredient_id,
                    'branch_id'          => $allocation->branch_id,
                    'supplier_id'        => $batch->supplier_id,
                    'supplier_name'      => $batch->supplier_name,
                    'received_at'        => $now,
                    'manufacture_date'   => $batch->manufacture_date,
                    'expiration_date'    => $batch->expiration_date,
                    'expiration_type'    => $batch->expiration_type,
                    'initial_quantity'   => $restoreQty,
                    'current_quantity'   => $restoreQty,
                    'unit'               => $batch->unit,
                    'cost_per_base_unit' => $batch->cost_per_base_unit,
                    'purchase_price'     => 0,
                    'status'             => 'quarantined',
                    'received_by'        => $userId ?: Auth::id(),
                    'reference'          => "Reversal hold from {$allocatableType} #{$allocatableId}",
                    'notes'              => "Original batch {$batch->batch_code} is ineligible/expired. Held in quarantine.",
                ]);

                IngredientBatchMovement::create([
                    'batch_id'                => $quarantinedBatch->id,
                    'ingredient_id'           => $allocation->ingredient_id,
                    'branch_id'               => $allocation->branch_id,
                    'user_id'                 => $userId ?: Auth::id(),
                    'movement_type'           => 'reversal',
                    'quantity'                => UnitConverter::convertFromBaseQuantity($restoreQty, $batch->unit),
                    'quantity_base'           => $restoreQty,
                    'unit'                    => $batch->unit,
                    'previous_batch_quantity' => 0,
                    'new_batch_quantity'      => $restoreQty,
                    'cost_at_movement'        => (float) $batch->cost_per_base_unit,
                    'reference_type'          => $allocatableType,
                    'reference_id'            => $allocatableId,
                    'reference_number'        => "QUAR-REV-{$allocatableId}",
                    'notes'                   => "Reversed quantity quarantined due to batch ineligibility.",
                ]);
            }

            $allocation->update([
                'is_reversed'            => true,
                'reversed_quantity_base' => $restoreQty,
            ]);

            $reversed[] = $allocation;
        }

        return $reversed;
    }

    /**
     * Create a traceable stock-in receipt batch with validation and ledger movement.
     */
    public function stockInBatch(array $data, ?int $userId = null): IngredientBatch
    {
        return DB::transaction(function () use ($data, $userId) {
            $ingredientId = (int) $data['ingredient_id'];
            $branchId = (int) $data['branch_id'];
            $quantity = (float) $data['quantity'];
            $unit = trim($data['unit']);
            $purchasePrice = isset($data['purchase_price']) ? (float) $data['purchase_price'] : 0.0;

            $ingredient = Ingredient::findOrFail($ingredientId);

            // Validate expiration tracking requirement
            $expirationDate = !empty($data['expiration_date']) ? Carbon::parse($data['expiration_date']) : null;
            $expirationType = $data['expiration_type'] ?? ($expirationDate ? 'use_by' : 'none');

            if ($ingredient->requires_expiration_tracking && !$expirationDate && $expirationType !== 'none') {
                if ($ingredient->default_expiry_days) {
                    $expirationDate = Carbon::now(config('app.timezone', 'Asia/Manila'))->addDays($ingredient->default_expiry_days);
                }
            }

            $quantityBase = UnitConverter::convertToBaseQuantity($quantity, $unit);
            $costPerBaseUnit = $quantityBase > 0 && $purchasePrice > 0 ? ($purchasePrice / $quantityBase) : (float) $ingredient->cost_per_base_unit;

            $batchCode = !empty($data['batch_code']) 
                ? trim($data['batch_code']) 
                : sprintf('BATCH-%s-%s', date('Ymd'), strtoupper(Str::random(5)));

            // If same batch code exists for this branch, add unique suffix
            if (IngredientBatch::where('batch_code', $batchCode)->where('branch_id', $branchId)->exists()) {
                $batchCode .= '-' . strtoupper(Str::random(3));
            }

            $batch = IngredientBatch::create([
                'batch_code'         => $batchCode,
                'lot_number'         => !empty($data['lot_number']) ? trim($data['lot_number']) : null,
                'ingredient_id'      => $ingredientId,
                'branch_id'          => $branchId,
                'supplier_id'        => !empty($data['supplier_id']) ? (int) $data['supplier_id'] : null,
                'supplier_name'      => !empty($data['supplier_name']) ? trim($data['supplier_name']) : null,
                'received_at'        => !empty($data['received_at']) ? Carbon::parse($data['received_at']) : Carbon::now(config('app.timezone', 'Asia/Manila')),
                'manufacture_date'   => !empty($data['manufacture_date']) ? Carbon::parse($data['manufacture_date']) : null,
                'expiration_date'    => $expirationDate,
                'expiration_type'    => $expirationType,
                'initial_quantity'   => $quantityBase,
                'current_quantity'   => $quantityBase,
                'unit'               => $unit,
                'cost_per_base_unit' => $costPerBaseUnit,
                'purchase_price'     => $purchasePrice,
                'status'             => 'available',
                'received_by'        => $userId ?: Auth::id(),
                'reference'          => $data['reference'] ?? null,
                'notes'              => $data['notes'] ?? null,
                'is_legacy'          => false,
            ]);

            // Movement ledger entry
            IngredientBatchMovement::create([
                'batch_id'                => $batch->id,
                'ingredient_id'           => $ingredientId,
                'branch_id'               => $branchId,
                'user_id'                 => $userId ?: Auth::id(),
                'movement_type'           => 'stock_in',
                'quantity'                => $quantity,
                'quantity_base'           => $quantityBase,
                'unit'                    => $unit,
                'previous_batch_quantity' => 0,
                'new_batch_quantity'      => $quantityBase,
                'cost_at_movement'        => $costPerBaseUnit,
                'reference_number'        => $batch->reference ?: $batch->batch_code,
                'notes'                   => "Initial receipt: {$quantity} {$unit}",
            ]);

            // Sync with IngredientStock aggregate table
            $stockRow = IngredientStock::firstOrCreate(
                ['ingredient_id' => $ingredientId, 'branch_id' => $branchId],
                ['stock' => 0, 'low_stock_level' => UnitConverter::convertToBaseQuantity(5, $ingredient->unit), 'total_stock_value' => 0]
            );

            $oldStock = (float) $stockRow->stock;
            $oldValue = (float) $stockRow->total_stock_value;
            $newStock = $oldStock + $quantityBase;
            $newValue = $oldValue + $purchasePrice;
            $newWac = $newStock > 0 ? ($newValue / $newStock) : $costPerBaseUnit;

            $stockRow->update([
                'stock'               => $newStock,
                'total_stock_value'   => $newValue,
                'cost_per_unit'       => $newWac,
                'last_purchase_price' => $purchasePrice,
            ]);

            // Trigger low stock evaluation
            $stockRow->refresh();
            app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stockRow, $userId ?: Auth::id());

            return $batch;
        });
    }

    /**
     * Adjust a batch quantity with compensating ledger entry.
     */
    public function adjustBatch(int $batchId, float $newQuantityBase, string $reason, ?string $notes = null, ?int $userId = null): IngredientBatch
    {
        return DB::transaction(function () use ($batchId, $newQuantityBase, $reason, $notes, $userId) {
            /** @var IngredientBatch $batch */
            $batch = IngredientBatch::where('id', $batchId)->lockForUpdate()->firstOrFail();

            $prevQty = (float) $batch->current_quantity;
            $diffBase = $newQuantityBase - $prevQty;

            $batch->current_quantity = max(0.0, $newQuantityBase);
            if ($batch->current_quantity <= 0.00001) {
                $batch->current_quantity = 0;
                $batch->status = 'depleted';
            } elseif ($batch->status === 'depleted') {
                $batch->status = 'available';
            }
            $batch->save();

            IngredientBatchMovement::create([
                'batch_id'                => $batch->id,
                'ingredient_id'           => $batch->ingredient_id,
                'branch_id'               => $batch->branch_id,
                'user_id'                 => $userId ?: Auth::id(),
                'movement_type'           => 'adjustment',
                'quantity'                => UnitConverter::convertFromBaseQuantity($diffBase, $batch->unit),
                'quantity_base'           => $diffBase,
                'unit'                    => $batch->unit,
                'previous_batch_quantity' => $prevQty,
                'new_batch_quantity'      => $batch->current_quantity,
                'cost_at_movement'        => (float) $batch->cost_per_base_unit,
                'reference_number'        => "ADJ-" . date('Ymd-His'),
                'notes'                   => "Stock Adjustment ({$reason}): {$notes}",
            ]);

            // Adjust aggregate IngredientStock
            $stockRow = IngredientStock::where('ingredient_id', $batch->ingredient_id)
                ->where('branch_id', $batch->branch_id)
                ->lockForUpdate()
                ->first();

            if ($stockRow) {
                $newStock = max(0.0, (float) $stockRow->stock + $diffBase);
                $stockRow->update(['stock' => $newStock]);
                $stockRow->refresh();
                app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stockRow, $userId ?: Auth::id());
            }

            return $batch;
        });
    }

    /**
     * Update batch status (e.g. quarantine, mark damaged, write-off expired).
     */
    public function updateBatchStatus(int $batchId, string $status, ?string $reason = null, ?int $userId = null): IngredientBatch
    {
        return DB::transaction(function () use ($batchId, $status, $reason, $userId) {
            /** @var IngredientBatch $batch */
            $batch = IngredientBatch::where('id', $batchId)->lockForUpdate()->firstOrFail();

            $oldStatus = $batch->status;
            $batch->status = $status;
            $batch->save();

            IngredientBatchMovement::create([
                'batch_id'                => $batch->id,
                'ingredient_id'           => $batch->ingredient_id,
                'branch_id'               => $batch->branch_id,
                'user_id'                 => $userId ?: Auth::id(),
                'movement_type'           => in_array($status, ['expired', 'damaged', 'quarantined']) ? 'status_change' : 'adjustment',
                'quantity'                => 0,
                'quantity_base'           => 0,
                'unit'                    => $batch->unit,
                'previous_batch_quantity' => $batch->current_quantity,
                'new_batch_quantity'      => $batch->current_quantity,
                'cost_at_movement'        => (float) $batch->cost_per_base_unit,
                'reference_number'        => "STATUS-{$status}",
                'notes'                   => "Status changed from {$oldStatus} to {$status}. Reason: {$reason}",
            ]);

            return $batch;
        });
    }

    /**
     * Ensure that all stock in IngredientStock has traceable batch records.
     * Prevents data discrepancy if a test or direct DB update added stock to IngredientStock.
     */
    public function ensureBatchCoverage(int $ingredientId, int $branchId): void
    {
        $stockRow = DB::table('ingredient_stocks')
            ->where('ingredient_id', $ingredientId)
            ->where('branch_id', $branchId)
            ->first();

        $currentStock = $stockRow ? max(0.0, (float) $stockRow->stock) : 0.0;

        $batchTotal = (float) DB::table('ingredient_batches')
            ->where('ingredient_id', $ingredientId)
            ->where('branch_id', $branchId)
            ->whereNull('deleted_at')
            ->sum('current_quantity');

        $difference = $currentStock - $batchTotal;

        // If IngredientStock has more stock than batches, create/update opening balance batch
        if ($difference > 0.0001) {
            $ingredient = DB::table('ingredients')->where('id', $ingredientId)->first();
            $unit = $ingredient ? ($ingredient->unit ?? 'g') : 'g';
            $legacyCode = sprintf('LEGACY-B%d-I%d', $branchId, $ingredientId);

            $existingLegacy = DB::table('ingredient_batches')
                ->where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->where('batch_code', $legacyCode)
                ->whereNull('deleted_at')
                ->first();

            if ($existingLegacy) {
                DB::table('ingredient_batches')
                    ->where('id', $existingLegacy->id)
                    ->update([
                        'current_quantity' => (float) $existingLegacy->current_quantity + $difference,
                        'initial_quantity' => (float) $existingLegacy->initial_quantity + $difference,
                        'status'           => 'available',
                        'updated_at'       => now(),
                    ]);
            } else {
                DB::table('ingredient_batches')->insert([
                    'batch_code'          => $legacyCode,
                    'lot_number'          => 'OPENING-BALANCE',
                    'ingredient_id'       => $ingredientId,
                    'branch_id'           => $branchId,
                    'received_at'         => now(),
                    'manufacture_date'    => null,
                    'expiration_date'     => null,
                    'expiration_type'     => 'none',
                    'initial_quantity'    => $difference,
                    'current_quantity'    => $difference,
                    'unit'                => $unit,
                    'cost_per_base_unit'  => $stockRow->cost_per_unit ?? 0,
                    'purchase_price'      => ($stockRow->cost_per_unit ?? 0) * $difference,
                    'status'              => 'available',
                    'reference'           => 'Auto-coverage legacy batch',
                    'notes'               => 'Auto-generated to maintain 1:1 ledger reconciliation',
                    'is_legacy'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ]);
            }
        } elseif ($difference < -0.0001) {
            // Stock was directly decreased on IngredientStock (e.g. in legacy tests)
            $toReduce = abs($difference);
            $legacyBatches = DB::table('ingredient_batches')
                ->where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->where('is_legacy', true)
                ->where('current_quantity', '>', 0)
                ->orderBy('id', 'desc')
                ->get();

            foreach ($legacyBatches as $lBatch) {
                if ($toReduce <= 0) break;
                $deduct = min((float) $lBatch->current_quantity, $toReduce);
                $newQty = max(0.0, (float) $lBatch->current_quantity - $deduct);
                DB::table('ingredient_batches')->where('id', $lBatch->id)->update([
                    'current_quantity' => $newQty,
                    'status'           => $newQty <= 0.00001 ? 'depleted' : 'available',
                    'updated_at'       => now(),
                ]);
                $toReduce -= $deduct;
            }
        }
    }

    /**
     * Get overview KPI stats for batches across branches or for a specific branch.
     */
    public function getOverviewKpiStats(?int $branchId = null): array
    {
        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));
        $warningCutoff = $now->copy()->addDays(7);

        $query = IngredientBatch::query();
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $allBatches = $query->with('ingredient')->get();

        $expiringSoonCount = 0;
        $expiringTodayCount = 0;
        $expiredCount = 0;
        $quarantinedCount = 0;
        $activeBatchCount = 0;
        $eligibleTotalValue = 0.0;

        foreach ($allBatches as $batch) {
            if ($batch->status === 'quarantined') {
                $quarantinedCount++;
            } elseif ($batch->status === 'available' && $batch->current_quantity > 0) {
                $activeBatchCount++;
                $eligibleTotalValue += ((float) $batch->current_quantity * (float) $batch->cost_per_base_unit);

                if ($batch->expiration_date) {
                    if ($batch->expiration_date->lte($now)) {
                        $expiredCount++;
                    } elseif ($batch->expiration_date->isSameDay($now)) {
                        $expiringTodayCount++;
                    } elseif ($batch->expiration_date->lte($warningCutoff)) {
                        $expiringSoonCount++;
                    }
                }
            } elseif ($batch->status === 'expired') {
                $expiredCount++;
            }
        }

        return [
            'active_batches'       => $activeBatchCount,
            'expiring_today'       => $expiringTodayCount,
            'expiring_soon'        => $expiringSoonCount,
            'expired_count'        => $expiredCount,
            'quarantined_count'    => $quarantinedCount,
            'inventory_valuation'  => round($eligibleTotalValue, 2),
        ];
    }
}
