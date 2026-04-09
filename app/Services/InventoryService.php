<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\Product;
use App\Models\StockLog;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    /**
     * Perform a strictly logged stock-in operation.
     */
    public function stockIn(string $type, int $id, float $quantity, string $unit, int $branchId, ?int $userId = null)
    {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $branchId, $userId) {
            $userId = $userId ?? Auth::id();
            
            // 1. Resolve domain model (Ingredient or Product)
            $model = $this->resolveModel($type, $id);
            
            // 2. Multi-branch validation
            if ($model instanceof Ingredient) {
                if ($model->branch_id != $branchId) {
                    throw new \Exception("Ingredient is limited to Branch #{$model->branch_id}. requested: #{$branchId}");
                }
            } else if ($model instanceof Product) {
                if (!$model->branches()->where('branches.id', $branchId)->exists()) {
                    throw new \Exception("Product is not assigned to Branch #{$branchId}.");
                }
            }

            // 3. Normalized conversion
            $quantityBase = $this->convertToBaseUnit($quantity, $unit);
            
            // 4. Atomic update
            $previousStock = (float) $model->stock;
            $newStock = $previousStock + $quantityBase;
            $model->update(['stock' => $newStock]);

            // 5. Polymorphic Audit Trail
            return StockLog::create([
                'storable_type' => get_class($model),
                'storable_id'   => $model->id,
                'branch_id'     => $branchId,
                'user_id'       => $userId,
                'action_type'   => 'stock_in',
                'quantity'      => $quantity,
                'quantity_base' => $quantityBase,
                'unit'          => $unit,
                'previous_stock' => $previousStock,
                'new_stock'     => $newStock,
                'reference'     => 'Manual Restock'
            ]);
        });
    }

    protected function resolveModel(string $type, int $id)
    {
        return match ($type) {
            'ingredient' => Ingredient::findOrFail($id),
            'product'    => Product::findOrFail($id),
            default      => throw new \Exception("Unknown domain type: {$type}")
        };
    }

    protected function convertToBaseUnit(float $quantity, string $unit): float
    {
        return match (strtolower($unit)) {
            'kg' => UnitConverter::kgToG($quantity),
            'liters', 'l' => UnitConverter::lToMl($quantity),
            default => $quantity, // pcs, grams, and ml are 1:1
        };
    }
}
