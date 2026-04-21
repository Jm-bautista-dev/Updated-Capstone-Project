<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\StockLog;
use App\Models\Wastage;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    /**
     * Perform a strictly logged stock-in operation with Weighted Average Cost (WAC) tracking.
     */
    public function stockIn(string $type, int $id, float $quantity, string $unit, int $branchId, float $purchasePrice = 0, ?int $userId = null)
    {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $branchId, $purchasePrice, $userId) {
            $userId        = $userId ?? Auth::id();
            $quantityBase  = UnitConverter::convertToBaseQuantity($quantity, $unit);
            $normalizedUnit = UnitConverter::normalizeUnit($unit);

            if ($type === 'ingredient') {
                return $this->stockInIngredient($id, $quantity, $quantityBase, $unit, $normalizedUnit, $branchId, $purchasePrice, $userId);
            }

            if ($type === 'product') {
                return $this->stockInProduct($id, $quantity, $quantityBase, $unit, $branchId, $userId);
            }

            throw new \Exception("Unknown domain type: {$type}");
        });
    }

    /**
     * Stock-in for a GLOBAL ingredient using Weighted Average Cost (WAC).
     * 
     * Formula:
     * New Avg Cost = (Current Total Value + New Batch Value) / (Current Stock + New Stock)
     */
    protected function stockInIngredient(
        int    $ingredientId,
        float  $quantity,
        float  $quantityBase,
        string $rawUnit,
        string $normalizedUnit,
        int    $branchId,
        float  $purchasePrice,
        ?int   $userId
    ) {
        $ingredient = Ingredient::findOrFail($ingredientId);

        $stockRow = IngredientStock::firstOrCreate(
            ['ingredient_id' => $ingredientId, 'branch_id' => $branchId],
            ['stock' => 0, 'low_stock_level' => 5, 'total_stock_value' => 0]
        );

        $previousStock = (float) $stockRow->stock;
        $previousValue = (float) $stockRow->total_stock_value;

        // Calculate value of new batch (normalize total purchase price to base unit cost)
        // Rule: 10kg for 500 pesos => 500 / 10,000g = 0.05 per gram
        $costPerBaseUnitNew = $quantityBase > 0 ? ($purchasePrice / $quantityBase) : 0; 
        $batchValue = $purchasePrice; // The user enters the total batch cost

        $newStock = $previousStock + $quantityBase;
        $newValue = $previousValue + $batchValue;

        // NEW WAC: total value / total quantity
        $newAvgCost = $newStock > 0 ? ($newValue / $newStock) : 0;

        $stockRow->update([
            'stock'               => $newStock,
            'total_stock_value'   => $newValue,
            'cost_per_unit'       => $newAvgCost,
            'last_purchase_price' => $purchasePrice,
        ]);

        // Reset alerts
        if ($newStock > $stockRow->low_stock_level) {
            $stockRow->update(['is_low_stock_notified' => false, 'is_out_of_stock_notified' => false]);
        }

        return StockLog::create([
            'storable_type'  => Ingredient::class,
            'storable_id'    => $ingredientId,
            'branch_id'      => $branchId,
            'user_id'        => $userId,
            'action_type'    => 'stock_in',
            'quantity'       => $quantity,
            'quantity_base'  => $quantityBase,
            'unit'           => $rawUnit,
            'previous_stock' => $previousStock,
            'new_stock'      => $newStock,
            'reference'      => "WAC Purchase: @{$purchasePrice}/{$rawUnit}",
        ]);
    }

    /**
     * Perform bulk stock-in for multiple items in a single transaction.
     */
    public function massStockIn(array $items, int $branchId, ?int $userId = null)
    {
        return DB::transaction(function () use ($items, $branchId, $userId) {
            $results = [];
            foreach ($items as $item) {
                $results[] = $this->stockIn(
                    $item['type'] ?? 'ingredient',
                    (int) $item['id'],
                    (float) $item['quantity'],
                    $item['unit'],
                    $branchId,
                    (float) ($item['purchase_price'] ?? 0),
                    $userId
                );
            }
            return $results;
        });
    }

    /**
     * Stock-in Product logic...
     */
    protected function stockInProduct($productId, $quantity, $quantityBase, $rawUnit, $branchId, $userId) {
        $product = Product::findOrFail($productId);
        $previousStock = (float) $product->stock;
        $newStock = $previousStock + $quantityBase;

        $product->update(['stock' => $newStock, 'unit' => UnitConverter::normalizeUnit($rawUnit)]);

        return StockLog::create([
            'storable_type' => Product::class, 'storable_id' => $productId, 'branch_id' => $branchId, 'user_id' => $userId,
            'action_type' => 'stock_in', 'quantity' => $quantity, 'quantity_base' => $quantityBase, 'unit' => $rawUnit,
            'previous_stock' => $previousStock, 'new_stock' => $newStock, 'reference' => 'Manual Restock'
        ]);
    }

    /**
     * Professional Wastage Logging
     */
    public function logWastage(string $type, int $id, float $quantity, string $unit, string $reason, string $notes = "", ?int $branchId = null)
    {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $reason, $notes, $branchId) {
            $branchId = $branchId ?? Auth::user()->branch_id;
            $qtyBase = UnitConverter::convertToBaseQuantity($quantity, $unit);
            
            $costAtLoss = 0;

            if ($type === 'ingredient') {
                $stockRow = IngredientStock::where('ingredient_id', $id)->where('branch_id', $branchId)->lockForUpdate()->firstOrFail();
                $costAtLoss = (float) $stockRow->cost_per_unit * $qtyBase;
                
                $prevStock = (float) $stockRow->stock;
                $stockRow->deduct($qtyBase);
                
                // Update total value for WAC consistency
                $stockRow->update(['total_stock_value' => (float)$stockRow->total_stock_value - $costAtLoss]);
            } else {
                /** @var Product $product */
                $product = Product::where('id', $id)->lockForUpdate()->firstOrFail();
                $costAtLoss = (float) $product->computeProductCost($branchId) * $qtyBase;
                $prevStock = (float) $product->stock;
                $product->update(['stock' => $prevStock - $qtyBase]);
            }

            $wastage = Wastage::create([
                'branch_id'    => $branchId,
                'user_id'      => Auth::id(),
                'wastable_type'=> $type === 'ingredient' ? Ingredient::class : Product::class,
                'wastable_id'  => $id,
                'quantity'     => $quantity,
                'unit'         => $unit,
                'cost_at_loss' => $costAtLoss,
                'reason'       => $reason,
                'notes'        => $notes,
            ]);

            // Create a general audit log entry so it appears in the Activity Log page
            if ($type === 'ingredient') {
                \App\Models\IngredientLog::create([
                    'ingredient_id' => $id,
                    'user_id'       => Auth::id(),
                    'branch_id'     => $branchId,
                    'change_qty'    => -$qtyBase,
                    'reason'        => "Wastage: " . ucfirst($reason) . ($notes ? " ({$notes})" : ""),
                ]);
            }

            return $wastage;
        });
    }
}
