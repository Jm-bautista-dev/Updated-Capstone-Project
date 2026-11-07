<?php

namespace App\Services;

use App\Events\ExpiredIngredientDisposed;
use App\Events\StockUpdated;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientBatch;
use App\Models\IngredientBatchMovement;
use App\Models\IngredientLog;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\StockLog;
use App\Models\Wastage;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryExpirationService
{
    public const EXPIRED_DATE_ERROR_MESSAGE = 'The selected expiration date has already passed. You cannot restock an ingredient batch that is already expired. Please select a valid expiration date.';

    /**
     * Authoritatively validate an incoming restock batch expiration date against the current business date.
     * Enforces the business timezone (Asia/Manila) and established expiration boundary rules.
     *
     * @param string|\DateTimeInterface|null $expirationDate
     * @param Ingredient|null $ingredient
     * @param string|null $expirationType ('use_by', 'best_before', 'none')
     * @return array{ valid: bool, message: string|null, date: Carbon|null }
     */
    public function validateRestockExpirationDate($expirationDate, ?Ingredient $ingredient = null, ?string $expirationType = 'use_by'): array
    {
        $tz = IngredientBatch::businessTimezone(); // 'Asia/Manila'
        $today = Carbon::now($tz)->startOfDay();

        // 1. If expiration type is explicitly 'none', date is not required
        if ($expirationType === 'none') {
            return [
                'valid'   => true,
                'message' => null,
                'date'    => null,
            ];
        }

        // 2. Handle missing expiration date
        if (empty($expirationDate)) {
            if ($ingredient && $ingredient->requires_expiration_tracking && !$ingredient->default_expiry_days) {
                return [
                    'valid'   => false,
                    'message' => "Expiration date is required for '{$ingredient->name}'. Each stock-in is tracked as a separate batch so the system can prioritize ingredients with the earliest expiration dates.",
                    'date'    => null,
                ];
            }

            return [
                'valid'   => true,
                'message' => null,
                'date'    => null,
            ];
        }

        // 3. Parse date strictly within application business timezone
        try {
            $parsedDate = $expirationDate instanceof Carbon
                ? $expirationDate->copy()->setTimezone($tz)
                : Carbon::parse($expirationDate, $tz);
        } catch (\Throwable $e) {
            return [
                'valid'   => false,
                'message' => 'Invalid expiration date format. Please select a valid calendar date.',
                'date'    => null,
            ];
        }

        // 4. Validate against business date in Asia/Manila
        // If the expiration date calendar day is strictly before today's calendar day:
        if ($parsedDate->copy()->startOfDay()->lt($today)) {
            return [
                'valid'   => false,
                'message' => self::EXPIRED_DATE_ERROR_MESSAGE,
                'date'    => $parsedDate,
            ];
        }

        // Today (expires at 23:59:59 end-of-day) or future date is valid
        return [
            'valid'   => true,
            'message' => null,
            'date'    => $parsedDate,
        ];
    }
    /**
     * Audit and inspect all currently expired batches across branches without modifying data.
     *
     * @param int|null $branchId
     * @return array
     */
    public function getExpiredBatchesAudit(?int $branchId = null): array
    {
        $tz = IngredientBatch::businessTimezone();
        $now = Carbon::now($tz);

        $query = IngredientBatch::with(['ingredient', 'branch'])
            ->whereNotNull('expiration_date')
            ->where('current_quantity', '>', 0)
            ->whereNotIn('status', ['expired', 'depleted']);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $candidates = $query->orderBy('expiration_date', 'asc')->get();
        $expiredList = [];

        foreach ($candidates as $batch) {
            /** @var \App\Models\IngredientBatch $batch */
            if (!$batch->isExpired($now)) {
                continue;
            }

            $affectedProducts = Product::whereHas('ingredients', function ($q) use ($batch) {
                $q->where('ingredients.id', $batch->ingredient_id);
            })->get();

            $productsImpact = [];
            foreach ($affectedProducts as $prod) {
                /** @var \App\Models\Product $prod */
                $avail = $prod->dynamicAvailability($batch->branch_id);
                $productsImpact[] = [
                    'id'               => $prod->id,
                    'name'             => $prod->name,
                    'current_servings' => (float) $avail['available'],
                ];
            }

            $displayUnit = strtolower(trim($batch->unit ?? $batch->ingredient?->unit ?? 'pcs'));
            $displayQty = UnitConverter::convertFromBaseQuantity((float) $batch->current_quantity, $displayUnit);

            $expiredList[] = [
                'batch_id'           => $batch->id,
                'batch_code'         => $batch->batch_code,
                'lot_number'         => $batch->lot_number ?: 'N/A',
                'ingredient_id'      => $batch->ingredient_id,
                'ingredient_name'    => $batch->ingredient?->name ?? 'Unknown',
                'branch_id'          => $batch->branch_id,
                'branch_name'        => $batch->branch?->name ?? 'Unknown',
                'expiration_date'    => $batch->expiration_date->format('Y-m-d'),
                'remaining_quantity' => $displayQty,
                'remaining_base'     => (float) $batch->current_quantity,
                'unit'               => $displayUnit,
                'status'             => $batch->status,
                'affected_products'  => $productsImpact,
            ];
        }

        return [
            'as_of'         => $now->toIso8601String(),
            'timezone'      => $tz,
            'total_expired' => count($expiredList),
            'expired'       => $expiredList,
        ];
    }

    /**
     * Automatically detect and dispose of expired ingredient batches, decrementing
     * aggregate branch stock, recording wastage, updating FEFO status, recalculating
     * affected product servings, and dispatching real-time notifications.
     *
     * @param int|null $branchId
     * @param int|null $userId
     * @return array
     */
    public function processExpiredBatches(?int $branchId = null, ?int $userId = null): array
    {
        $tz = IngredientBatch::businessTimezone();
        $now = Carbon::now($tz);

        if ($userId === null) {
            $userId = \Illuminate\Support\Facades\Auth::id()
                ?? \App\Models\User::where('role', 'admin')->value('id')
                ?? \App\Models\User::value('id');
        }

        $lockKey = 'inv_exp_lock_' . ($branchId ?? 'all');
        $lock = Cache::lock($lockKey, 15);

        if (!$lock->get()) {
            return [
                'success' => false,
                'message' => 'Expiration processing already in progress. Skipped concurrent run.',
                'disposed_count' => 0,
                'disposed_items' => [],
            ];
        }

        try {
            // Find candidate batches with expiration dates in the past
            $query = IngredientBatch::with(['ingredient', 'branch'])
                ->whereNotNull('expiration_date')
                ->where('current_quantity', '>', 0)
                ->whereNotIn('status', ['expired', 'depleted']);

            if ($branchId) {
                $query->where('branch_id', $branchId);
            }

            $candidateBatches = $query->orderBy('expiration_date', 'asc')->get();
            $disposedItems = [];

            foreach ($candidateBatches as $candidate) {
                /** @var \App\Models\IngredientBatch $candidate */
                // Confirm expiration using business timezone policy
                if (!$candidate->isExpired($now)) {
                    continue;
                }

                $disposedRecord = $this->disposeSingleBatch($candidate->id, $userId, $now);
                if ($disposedRecord) {
                    $disposedItems[] = $disposedRecord;
                }
            }

            // Also cleanly transition any already depleted (0 remaining) batches whose expiration has passed
            $emptyQuery = IngredientBatch::whereNotNull('expiration_date')
                ->where('current_quantity', '<=', 0)
                ->where('status', 'available');
            if ($branchId) {
                $emptyQuery->where('branch_id', $branchId);
            }
            $emptyBatches = $emptyQuery->get();
            foreach ($emptyBatches as $emptyBatch) {
                if ($emptyBatch->isExpired($now)) {
                    $emptyBatch->update(['status' => 'expired']);
                }
            }

            return [
                'success'        => true,
                'as_of'          => $now->toIso8601String(),
                'disposed_count' => count($disposedItems),
                'disposed_items' => $disposedItems,
            ];
        } catch (\Throwable $e) {
            Log::error('InventoryExpirationService error: ' . $e->getMessage(), [
                'trace'     => $e->getTraceAsString(),
                'branch_id' => $branchId,
            ]);

            return [
                'success' => false,
                'error'   => $e->getMessage(),
                'disposed_count' => 0,
                'disposed_items' => [],
            ];
        } finally {
            $lock->release();
        }
    }

    /**
     * Atomically dispose a single expired ingredient batch within a database transaction.
     *
     * @param int $batchId
     * @param int|null $userId
     * @param Carbon $now
     * @return array|null
     */
    protected function disposeSingleBatch(int $batchId, ?int $userId, Carbon $now): ?array
    {
        return DB::transaction(function () use ($batchId, $userId, $now) {
            /** @var IngredientBatch|null $batch */
            $batch = IngredientBatch::with(['ingredient', 'branch'])
                ->where('id', $batchId)
                ->lockForUpdate()
                ->first();

            if (!$batch || $batch->current_quantity <= 0 || $batch->status === 'expired') {
                return null;
            }

            if (!$batch->isExpired($now)) {
                return null;
            }

            $ingredientId = (int) $batch->ingredient_id;
            $branchId = (int) $batch->branch_id;
            $qtyToDisposeBase = (float) $batch->current_quantity;
            $displayUnit = strtolower(trim($batch->unit ?? $batch->ingredient?->unit ?? 'pcs'));
            $displayQty = UnitConverter::convertFromBaseQuantity($qtyToDisposeBase, $displayUnit);
            $costPerBaseUnit = (float) $batch->cost_per_base_unit;
            $costAtLoss = round($qtyToDisposeBase * $costPerBaseUnit, 2);

            // 1. Identify all products utilizing this ingredient and record previous available servings
            $affectedProducts = Product::whereHas('ingredients', function ($q) use ($ingredientId) {
                $q->where('ingredients.id', $ingredientId);
            })->get();

            $beforeServings = [];
            foreach ($affectedProducts as $prod) {
                /** @var \App\Models\Product $prod */
                $avail = $prod->dynamicAvailability($branchId);
                $beforeServings[$prod->id] = (float) $avail['available'];
            }

            // 2. Mark batch remaining quantity as disposed and status as expired
            $batch->current_quantity = 0.0;
            $batch->status = 'expired';
            $batch->save();

            // 3. Decrement aggregate stock in IngredientStock
            $stockRow = IngredientStock::where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->lockForUpdate()
                ->first();

            $previousStockBase = 0.0;
            $newStockBase = 0.0;

            if ($stockRow) {
                $previousStockBase = (float) $stockRow->stock;
                $newStockBase = max(0.0, $previousStockBase - $qtyToDisposeBase);
                $stockRow->stock = $newStockBase;
                $stockRow->total_stock_value = max(0.0, (float) $stockRow->total_stock_value - $costAtLoss);
                $stockRow->save();

                // Check low stock notifications
                app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stockRow, $userId);
            }

            // 4. Create Wastage record for auditing & financial integrity
            $wastage = Wastage::create([
                'branch_id'    => $branchId,
                'user_id'      => $userId,
                'wastable_type'=> Ingredient::class,
                'wastable_id'  => $ingredientId,
                'quantity'     => $displayQty,
                'unit'         => $displayUnit,
                'cost_at_loss' => $costAtLoss,
                'reason'       => 'expired',
                'notes'        => "Automated disposal: Batch {$batch->batch_code} expired on {$batch->expiration_date?->format('Y-m-d')}.",
            ]);

            // 5. Create IngredientBatchMovement record for batch traceability
            IngredientBatchMovement::create([
                'batch_id'                => $batch->id,
                'ingredient_id'           => $ingredientId,
                'branch_id'               => $branchId,
                'user_id'                 => $userId,
                'movement_type'           => 'expired_removal',
                'quantity'                => $displayQty,
                'quantity_base'           => $qtyToDisposeBase,
                'unit'                    => $displayUnit,
                'previous_batch_quantity' => $qtyToDisposeBase,
                'new_batch_quantity'      => 0.0,
                'cost_at_movement'        => $costPerBaseUnit,
                'reference_type'          => Wastage::class,
                'reference_id'            => $wastage->id,
                'reference_number'        => "WASTE-EXP-{$batch->id}",
                'notes'                   => "Automated expiration disposal (Batch {$batch->batch_code})",
            ]);

            // 6. Record IngredientLog for inventory drawer and activity view
            IngredientLog::create([
                'ingredient_id' => $ingredientId,
                'user_id'       => $userId,
                'branch_id'     => $branchId,
                'change_qty'    => -$qtyToDisposeBase,
                'reason'        => "Expired stock automatically disposed (Batch {$batch->batch_code})",
            ]);

            // 7. Record StockLog entry
            StockLog::create([
                'storable_type'  => Ingredient::class,
                'storable_id'    => $ingredientId,
                'branch_id'      => $branchId,
                'user_id'        => $userId,
                'action_type'    => 'expired_disposal',
                'quantity'       => $displayQty,
                'quantity_base'  => $qtyToDisposeBase,
                'unit'           => $displayUnit,
                'previous_stock' => $previousStockBase,
                'new_stock'      => $newStockBase,
                'reference'      => "Expired Batch {$batch->batch_code}",
            ]);

            // 8. Recalculate available servings for affected products
            $productUpdates = [];
            foreach ($affectedProducts as $prod) {
                /** @var \App\Models\Product $prod */
                // Clear any cached dynamic availability
                $afterAvail = $prod->dynamicAvailability($branchId);
                $recalculated = (float) $afterAvail['available'];
                $prev = $beforeServings[$prod->id] ?? $recalculated;

                $productUpdates[] = [
                    'product_id'            => $prod->id,
                    'product_name'          => $prod->name,
                    'name'                  => $prod->name,
                    'previous_servings'     => $prev,
                    'recalculated_servings' => $recalculated,
                ];

                // Broadcast product stock update
                broadcast(new StockUpdated($branchId, Product::class, $prod->id))->toOthers();
            }

            // Broadcast ingredient stock update
            broadcast(new StockUpdated($branchId, Ingredient::class, $ingredientId))->toOthers();

            // 9. Dispatch ExpiredIngredientDisposed event for real-time toast / modal
            broadcast(new ExpiredIngredientDisposed(
                $batch,
                $qtyToDisposeBase,
                $productUpdates,
                $now
            ))->toOthers();

            return [
                'batch_id'             => $batch->id,
                'batch_code'           => $batch->batch_code,
                'ingredient_id'        => $ingredientId,
                'ingredient_name'      => $batch->ingredient?->name ?? 'Ingredient',
                'branch_id'            => $branchId,
                'branch_name'          => $batch->branch?->name ?? 'Branch',
                'disposed_quantity'    => $displayQty,
                'disposed_base'        => $qtyToDisposeBase,
                'unit'                 => $displayUnit,
                'cost_at_loss'         => $costAtLoss,
                'affected_products'    => $productUpdates,
                'disposed_at'          => $now->toIso8601String(),
            ];
        });
    }
}
