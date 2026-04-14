<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\StockLog;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    /**
     * Perform a strictly logged stock-in operation.
     *
     * For Ingredients: updates ingredient_stocks (branch-scoped).
     * For Products:    updates products.stock (ledger-based).
     *
     * @param string $type     'ingredient' or 'product'
     * @param int    $id       ID of the ingredient or product
     * @param float  $quantity User-facing quantity (e.g. 5 kg)
     * @param string $unit     User-facing unit (e.g. 'kg')
     * @param int    $branchId Branch to stock-in for
     * @param int|null $userId Defaults to Auth::id()
     */
    public function stockIn(string $type, int $id, float $quantity, string $unit, int $branchId, ?int $userId = null)
    {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $branchId, $userId) {
            $userId        = $userId ?? Auth::id();
            $quantityBase  = UnitConverter::convertToBaseQuantity($quantity, $unit);
            $normalizedUnit = UnitConverter::normalizeUnit($unit);

            if ($type === 'ingredient') {
                return $this->stockInIngredient($id, $quantity, $quantityBase, $unit, $normalizedUnit, $branchId, $userId);
            }

            if ($type === 'product') {
                return $this->stockInProduct($id, $quantity, $quantityBase, $unit, $branchId, $userId);
            }

            throw new \Exception("Unknown domain type: {$type}");
        });
    }

    /**
     * Stock-in for a GLOBAL ingredient into a specific branch's ingredient_stocks row.
     *
     * Uses IngredientStock::updateOrCreate so the row is atomically created or incremented.
     */
    protected function stockInIngredient(
        int    $ingredientId,
        float  $quantity,
        float  $quantityBase,
        string $rawUnit,
        string $normalizedUnit,
        int    $branchId,
        ?int   $userId
    ) {
        $ingredient = Ingredient::findOrFail($ingredientId);

        // Find-or-create the branch stock row
        $stockRow = IngredientStock::firstOrCreate(
            ['ingredient_id' => $ingredientId, 'branch_id' => $branchId],
            ['stock' => 0, 'low_stock_level' => 5]
        );

        $previousStock = (float) $stockRow->stock;
        $newStock      = $previousStock + $quantityBase;

        $stockRow->update(['stock' => $newStock]);

        // Reset alert flags when stock is added
        if ($newStock > $stockRow->low_stock_level) {
            $stockRow->update([
                'is_low_stock_notified'    => false,
                'is_out_of_stock_notified' => false,
            ]);
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
            'reference'      => 'Manual Restock',
        ]);
    }

    /**
     * Stock-in for a DIRECT product (no recipe).
     */
    protected function stockInProduct(
        int    $productId,
        float  $quantity,
        float  $quantityBase,
        string $rawUnit,
        int    $branchId,
        ?int   $userId
    ) {
        $product = Product::findOrFail($productId);

        if (!$product->branches()->where('branches.id', $branchId)->exists()) {
            throw new \Exception("Product is not assigned to Branch #{$branchId}.");
        }

        $previousStock = (float) $product->stock;
        $newStock      = $previousStock + $quantityBase;

        $product->update([
            'stock' => $newStock,
            'unit'  => UnitConverter::normalizeUnit($rawUnit),
        ]);

        return StockLog::create([
            'storable_type'  => Product::class,
            'storable_id'    => $productId,
            'branch_id'      => $branchId,
            'user_id'        => $userId,
            'action_type'    => 'stock_in',
            'quantity'       => $quantity,
            'quantity_base'  => $quantityBase,
            'unit'           => $rawUnit,
            'previous_stock' => $previousStock,
            'new_stock'      => $newStock,
            'reference'      => 'Manual Restock',
        ]);
    }
}
