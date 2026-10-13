<?php

namespace App\Services;

use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\StockLog;
use App\Models\Wastage;
use App\Models\Order;
use App\Events\StockUpdated;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class InventoryService
{
    /**
     * Perform a strictly logged stock-in operation with batch tracking and Weighted Average Cost (WAC) tracking.
     */
    public function stockIn(
        string  $type, 
        int     $id, 
        float   $quantity, 
        string  $unit, 
        int     $branchId, 
        float   $purchasePrice = 0, 
        ?int    $userId = null, 
        ?string $reference = null,
        array   $batchMeta = []
    ) {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $branchId, $purchasePrice, $userId, $reference, $batchMeta) {
            $userId        = $userId ?? Auth::id();
            $quantityBase  = UnitConverter::convertToBaseQuantity($quantity, $unit);
            $normalizedUnit = UnitConverter::normalizeUnit($unit);

            if ($type === 'ingredient' || $type === Ingredient::class) {
                return $this->stockInIngredient($id, $quantity, $quantityBase, $unit, $normalizedUnit, $branchId, $purchasePrice, $userId, $reference, $batchMeta);
            }

            if ($type === 'product') {
                return $this->stockInProduct($id, $quantity, $quantityBase, $unit, $branchId, $userId, $reference);
            }

            throw new \Exception("Unknown domain type: {$type}");
        });
    }

    /**
     * Stock-in for a GLOBAL ingredient creating a traceable batch and updating Weighted Average Cost (WAC).
     */
    protected function stockInIngredient(
        int     $ingredientId,
        float   $quantity,
        float   $quantityBase,
        string  $rawUnit,
        string  $normalizedUnit,
        int     $branchId,
        float   $purchasePrice,
        ?int    $userId,
        ?string $reference = null,
        array   $batchMeta = []
    ) {
        $ingredient = Ingredient::findOrFail($ingredientId);

        // 1. Create traceable lot/batch via InventoryBatchService
        $batchService = app(\App\Services\InventoryBatchService::class);
        $batch = $batchService->stockInBatch(array_merge([
            'ingredient_id'   => $ingredientId,
            'branch_id'       => $branchId,
            'quantity'        => $quantity,
            'unit'            => $rawUnit,
            'purchase_price'  => $purchasePrice,
            'reference'       => $reference,
        ], $batchMeta), $userId);

        $stockRow = IngredientStock::firstOrCreate(
            ['ingredient_id' => $ingredientId, 'branch_id' => $branchId],
            ['stock' => 0, 'low_stock_level' => 5, 'total_stock_value' => 0]
        );

        $refText = $reference ?: "Batch {$batch->batch_code} @{$purchasePrice}/{$rawUnit}";

        return StockLog::create([
            'storable_type'  => Ingredient::class,
            'storable_id'    => $ingredientId,
            'branch_id'      => $branchId,
            'user_id'        => $userId,
            'action_type'    => 'stock_in',
            'quantity'       => $quantity,
            'quantity_base'  => $quantityBase,
            'unit'           => $rawUnit,
            'previous_stock' => (float) $stockRow->stock - $quantityBase,
            'new_stock'      => (float) $stockRow->stock,
            'reference'      => $refText,
        ]);
    }

    /**
     * Perform bulk stock-in for multiple items in a single transaction with batch metadata.
     */
    public function massStockIn(array $items, int $branchId, ?int $userId = null)
    {
        return DB::transaction(function () use ($items, $branchId, $userId) {
            $results = [];
            foreach ($items as $item) {
                $batchMeta = [
                    'batch_code'      => $item['batch_code'] ?? null,
                    'lot_number'      => $item['lot_number'] ?? null,
                    'expiration_date' => $item['expiration_date'] ?? null,
                    'expiration_type' => $item['expiration_type'] ?? 'use_by',
                    'supplier_id'     => $item['supplier_id'] ?? null,
                    'supplier_name'   => $item['supplier_name'] ?? null,
                    'notes'           => $item['notes'] ?? null,
                ];

                $results[] = $this->stockIn(
                    $item['type'] ?? 'ingredient',
                    (int) $item['id'],
                    (float) $item['quantity'],
                    $item['unit'],
                    $branchId,
                    (float) ($item['purchase_price'] ?? $item['unit_cost'] ?? 0),
                    $userId,
                    $item['reference'] ?? null,
                    $batchMeta
                );
            }
            return $results;
        });
    }

    /**
     * Stock-in Product logic...
     */
    protected function stockInProduct($productId, $quantity, $quantityBase, $rawUnit, $branchId, $userId, ?string $reference = null) {
        $product = Product::findOrFail($productId);
        
        $pivot = DB::table('branch_product')
            ->where('product_id', $productId)
            ->where('branch_id', $branchId)
            ->first();

        $previousStock = $pivot ? (float) $pivot->stock : 0.0;
        $newStock = $previousStock + $quantityBase;

        if ($pivot) {
            DB::table('branch_product')->where('id', $pivot->id)->update([
                'stock'      => $newStock,
                'is_active'  => true,
                'updated_at' => now(),
            ]);
        } else {
            DB::table('branch_product')->insert([
                'branch_id'  => $branchId,
                'product_id' => $productId,
                'stock'      => $newStock,
                'price'      => $product->selling_price,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $product->update(['unit' => UnitConverter::normalizeUnit($rawUnit)]);

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
            'reference'      => $reference ?: 'Manual Restock'
        ]);
    }

    /**
     * Professional Wastage Logging with batch-specific or FEFO/FIFO ledger tracking.
     */
    public function logWastage(string $type, int $id, float $quantity, string $unit, string $reason, string $notes = "", ?int $branchId = null, ?int $batchId = null)
    {
        return DB::transaction(function () use ($type, $id, $quantity, $unit, $reason, $notes, $branchId, $batchId) {
            $branchId = $branchId ?? Auth::user()->branch_id;
            $qtyBase = UnitConverter::convertToBaseQuantity($quantity, $unit);
            
            $costAtLoss = 0;

            if ($type === 'ingredient') {
                $stockRow = IngredientStock::where('ingredient_id', $id)->where('branch_id', $branchId)->lockForUpdate()->first();
                if (!$stockRow) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'error' => 'Stock record not found for this ingredient in the selected branch.'
                    ]);
                }

                if ($stockRow->stock < $qtyBase) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'quantity' => "Waste quantity ({$qtyBase}) exceeds available stock ({$stockRow->stock})."
                    ]);
                }

                $costAtLoss = (float) $stockRow->cost_per_unit * $qtyBase;

                // Deduct from specific batch if provided, otherwise via InventoryBatchService FEFO
                if ($batchId) {
                    $batch = \App\Models\IngredientBatch::where('id', $batchId)->where('branch_id', $branchId)->lockForUpdate()->first();
                    if ($batch) {
                        $prevBatchQty = (float) $batch->current_quantity;
                        $deductBatch = min($prevBatchQty, $qtyBase);
                        $batch->current_quantity = max(0.0, $prevBatchQty - $deductBatch);
                        if ($batch->current_quantity <= 0.00001) {
                            $batch->status = $reason === 'expired' ? 'expired' : 'depleted';
                        }
                        $batch->save();

                        \App\Models\IngredientBatchMovement::create([
                            'batch_id'                => $batch->id,
                            'ingredient_id'           => $id,
                            'branch_id'               => $branchId,
                            'user_id'                 => Auth::id(),
                            'movement_type'           => $reason === 'expired' ? 'expired_removal' : 'waste',
                            'quantity'                => $quantity,
                            'quantity_base'           => $qtyBase,
                            'unit'                    => $unit,
                            'previous_batch_quantity' => $prevBatchQty,
                            'new_batch_quantity'      => $batch->current_quantity,
                            'cost_at_movement'        => (float) $batch->cost_per_base_unit,
                            'reference_type'          => Wastage::class,
                            'notes'                   => "Wastage: {$reason} - {$notes}",
                        ]);
                    }
                } else {
                    app(\App\Services\InventoryBatchService::class)->allocateStock(
                        $id,
                        $branchId,
                        $qtyBase,
                        Wastage::class,
                        0,
                        "Wastage: {$reason}",
                        Auth::id()
                    );
                }
                
                $prevStock = (float) $stockRow->stock;
                $stockRow->deduct($qtyBase);
                
                // Update total value for WAC consistency
                $stockRow->update(['total_stock_value' => (float)$stockRow->total_stock_value - $costAtLoss]);

                $stockRow->refresh();
                app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stockRow, Auth::id());
            } else {
                /** @var Product $product */
                $product = Product::where('id', $id)->lockForUpdate()->first();
                if (!$product) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'error' => 'Product record not found.'
                    ]);
                }

                if ($product->stock < $qtyBase) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'quantity' => "Waste quantity ({$qtyBase}) exceeds available stock ({$product->stock})."
                    ]);
                }

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

    /**
     * Deduct inventory for an order during the 'preparing' phase.
     */
    public function deductForOrder(Order $order)
    {
        return DB::transaction(function () use ($order) {
            if ($order->inventory_deducted) {
                return; // Already deducted
            }

            $order->load(['items.product.ingredients.stocks' => function($q) use ($order) {
                $q->where('branch_id', $order->branch_id);
            }]);

            foreach ($order->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                // 1. Atomically deduct physical stock from branch_product
                $pivot = DB::table('branch_product')
                    ->where('product_id', $product->id)
                    ->where('branch_id', $order->branch_id)
                    ->lockForUpdate()
                    ->first();

                if ($pivot) {
                    $previousStock = (float) $pivot->stock;
                    $newStock = max(0, $previousStock - (float) $item->quantity);

                    DB::table('branch_product')
                        ->where('id', $pivot->id)
                        ->update(['stock' => $newStock, 'updated_at' => now()]);

                    StockLog::create([
                        'storable_type'  => Product::class,
                        'storable_id'    => $product->id,
                        'branch_id'      => $order->branch_id,
                        'user_id'        => Auth::id(),
                        'action_type'    => 'order_deduction',
                        'quantity'       => $item->quantity,
                        'quantity_base'  => $item->quantity,
                        'unit'           => $product->unit ?? 'pcs',
                        'previous_stock' => $previousStock,
                        'new_stock'      => $newStock,
                        'reference'      => "Order #{$order->order_number}",
                    ]);

                    broadcast(new StockUpdated($order->branch_id, Product::class, $product->id))->toOthers();
                }

                // 2. Deduct ingredient stocks and batches if product has a recipe
                foreach ($product->ingredients as $ingredient) {
                    $qtyPerUnit = (float) $ingredient->pivot->quantity_required;
                    $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                    
                    $requiredTotalBase = UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyPerUnit, 
                        $unitInput, 
                        $ingredient->unit, 
                        $ingredient->avg_weight_per_piece
                    ) * $item->quantity;

                    $stock = $ingredient->stocks->first(); // Filtered by branch in load()

                    if (!$stock) {
                        throw new \Exception("Ingredient '{$ingredient->name}' stock not found in branch.");
                    }

                    // Allocate from batches in FEFO/FIFO order
                    app(\App\Services\InventoryBatchService::class)->allocateStock(
                        $ingredient->id,
                        $order->branch_id,
                        $requiredTotalBase,
                        Order::class,
                        $order->id,
                        "Order #{$order->order_number}",
                        Auth::id()
                    );

                    $stock->deduct($requiredTotalBase);
                    $stock->refresh();
                    app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stock, Auth::id());

                    // Log transaction
                    \App\Models\InventoryTransaction::create([
                        'ingredient_id' => $ingredient->id,
                        'branch_id'     => $order->branch_id,
                        'type'          => 'deduction',
                        'quantity'      => $requiredTotalBase,
                        'reference_type'=> Order::class,
                        'reference_id'  => $order->id,
                        'notes'         => "Order Preparation: {$order->id}",
                        'user_id'       => Auth::id(),
                    ]);
                }
            }

            $order->update(['inventory_deducted' => true]);
        });
    }

    /**
     * Restore inventory for a cancelled order if it was already deducted.
     */
    public function restoreForOrder(Order $order)
    {
        return DB::transaction(function () use ($order) {
            if (!$order->inventory_deducted) {
                return; // Nothing to restore
            }

            $order->load(['items.product.ingredients.stocks' => function($q) use ($order) {
                $q->where('branch_id', $order->branch_id);
            }]);

            foreach ($order->items as $item) {
                $product = $item->product;
                if (!$product) continue;

                // 1. Restore physical stock to branch_product
                $pivot = DB::table('branch_product')
                    ->where('product_id', $product->id)
                    ->where('branch_id', $order->branch_id)
                    ->lockForUpdate()
                    ->first();

                if ($pivot) {
                    $previousStock = (float) $pivot->stock;
                    $newStock = $previousStock + (float) $item->quantity;

                    DB::table('branch_product')
                        ->where('id', $pivot->id)
                        ->update(['stock' => $newStock, 'updated_at' => now()]);

                    StockLog::create([
                        'storable_type'  => Product::class,
                        'storable_id'    => $product->id,
                        'branch_id'      => $order->branch_id,
                        'user_id'        => Auth::id(),
                        'action_type'    => 'order_restoration',
                        'quantity'       => $item->quantity,
                        'quantity_base'  => $item->quantity,
                        'unit'           => $product->unit ?? 'pcs',
                        'previous_stock' => $previousStock,
                        'new_stock'      => $newStock,
                        'reference'      => "Cancelled Order #{$order->order_number}",
                    ]);

                    broadcast(new StockUpdated($order->branch_id, Product::class, $product->id))->toOthers();
                }

                // 2. Restore ingredient stocks and batch allocations
                app(\App\Services\InventoryBatchService::class)->reverseAllocations(
                    Order::class,
                    $order->id,
                    Auth::id(),
                    "Cancelled Order #{$order->order_number}"
                );

                foreach ($product->ingredients as $ingredient) {
                    $qtyPerUnit = (float) $ingredient->pivot->quantity_required;
                    $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                    
                    $requiredTotalBase = UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyPerUnit, 
                        $unitInput, 
                        $ingredient->unit, 
                        $ingredient->avg_weight_per_piece
                    ) * $item->quantity;

                    $stock = $ingredient->stocks->first();

                    if ($stock) {
                        $stock->restore($requiredTotalBase);
                        $stock->refresh();
                        app(\App\Services\LowStockAlertService::class)->evaluateStockRow($stock, Auth::id());

                        // Log transaction
                        \App\Models\InventoryTransaction::create([
                            'ingredient_id' => $ingredient->id,
                            'branch_id'     => $order->branch_id,
                            'type'          => 'return',
                            'quantity'      => $requiredTotalBase,
                            'reference_type'=> Order::class,
                            'reference_id'  => $order->id,
                            'notes'         => "Order Cancellation: {$order->id}",
                            'user_id'       => Auth::id(),
                        ]);
                    }
                }
            }

            $order->update(['inventory_deducted' => false]);
        });
    }
}
