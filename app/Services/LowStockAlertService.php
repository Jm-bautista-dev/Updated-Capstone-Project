<?php

namespace App\Services;

use App\Events\LowStockAlert;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use App\Models\IngredientStock;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LowStockAlertService
{
    /**
     * Authoritatively evaluate the stock row against its low stock threshold.
     * Generates an idempotent alert log and dispatches broadcast if transitioning to low or out-of-stock.
     * Resets flags if stock recovers above threshold.
     *
     * @param IngredientStock $stockRow
     * @param int|null $userId
     * @return IngredientLog|null
     */
    public function evaluateStockRow(IngredientStock $stockRow, ?int $userId = null): ?IngredientLog
    {
        try {
            $stock = (float) $stockRow->stock;
            $lowLevel = (float) $stockRow->low_stock_level;
            $branchId = (int) $stockRow->branch_id;
            $userId = $userId ?? Auth::id();

            // Case 1: Out of Stock (stock <= 0)
            if ($stock <= 0) {
                if (!$stockRow->is_out_of_stock_notified) {
                    $log = IngredientLog::create([
                        'ingredient_id' => $stockRow->ingredient_id,
                        'user_id'       => $userId,
                        'branch_id'     => $branchId,
                        'change_qty'    => 0,
                        'reason'        => "Out of Stock Alert — Branch #{$branchId}",
                    ]);

                    $stockRow->update([
                        'is_out_of_stock_notified' => true,
                        'is_low_stock_notified'    => true,
                    ]);

                    $this->dispatchBroadcastSafely($stockRow, $log->id);

                    return $log;
                }

                return null;
            }

            // Case 2: Low Stock (0 < stock <= low_stock_level)
            if ($stock <= $lowLevel) {
                if (!$stockRow->is_low_stock_notified) {
                    $log = IngredientLog::create([
                        'ingredient_id' => $stockRow->ingredient_id,
                        'user_id'       => $userId,
                        'branch_id'     => $branchId,
                        'change_qty'    => 0,
                        'reason'        => "Low Stock Alert — Branch #{$branchId}",
                    ]);

                    $stockRow->update([
                        'is_low_stock_notified'    => true,
                        'is_out_of_stock_notified' => false,
                    ]);

                    $this->dispatchBroadcastSafely($stockRow, $log->id);

                    return $log;
                }

                return null;
            }

            // Case 3: Stock is healthy (stock > low_stock_level) -> Reset alert flags
            if ($stockRow->is_low_stock_notified || $stockRow->is_out_of_stock_notified) {
                $stockRow->update([
                    'is_low_stock_notified'    => false,
                    'is_out_of_stock_notified' => false,
                ]);
            }

            return null;
        } catch (\Throwable $e) {
            Log::warning('LowStockAlertService: Evaluation failed safely: ' . $e->getMessage(), [
                'stock_id' => $stockRow->id ?? null,
                'ingredient_id' => $stockRow->ingredient_id ?? null,
            ]);
            return null;
        }
    }

    /**
     * Safely dispatch the LowStockAlert event without breaking caller transactions.
     */
    protected function dispatchBroadcastSafely(IngredientStock $stockRow, int $logId): void
    {
        try {
            if (class_exists(LowStockAlert::class)) {
                broadcast(new LowStockAlert($stockRow, $logId))->toOthers();
            }
        } catch (\Throwable $e) {
            Log::info('LowStockAlertService: Broadcast dispatch skipped or failed gracefully: ' . $e->getMessage());
        }
    }

    /**
     * Synchronize and evaluate all active ingredient stocks for a specific branch.
     */
    public function syncAllForBranch(int $branchId): int
    {
        $count = 0;
        $stocks = IngredientStock::where('branch_id', $branchId)->get();
        foreach ($stocks as $stock) {
            if ($this->evaluateStockRow($stock)) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Synchronize and evaluate all active ingredient stocks across all branches.
     */
    public function syncAll(): int
    {
        $count = 0;
        $stocks = IngredientStock::all();
        foreach ($stocks as $stock) {
            if ($this->evaluateStockRow($stock)) {
                $count++;
            }
        }
        return $count;
    }
}
