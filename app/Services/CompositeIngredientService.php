<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientSubrecipeItem;
use App\Models\IngredientLog;
use App\Models\StockLog;
use App\Utils\UnitConverter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CompositeIngredientService
{
    /**
     * Save sub-recipe items for a composite ingredient.
     *
     * @param Ingredient $composite
     * @param array $items Array of ['component_ingredient_id' => int, 'quantity' => float, 'unit' => string]
     * @return Ingredient
     * @throws ValidationException
     */
    public function saveSubrecipe(Ingredient $composite, array $items): Ingredient
    {
        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => 'A composite ingredient must contain at least one micro-ingredient component.',
            ]);
        }

        $componentIds = [];
        foreach ($items as $item) {
            $componentId = (int) ($item['component_ingredient_id'] ?? 0);
            $qty = (float) ($item['quantity'] ?? 0);
            $unit = $item['unit'] ?? 'g';

            if ($componentId <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'Invalid component ingredient selected.',
                ]);
            }

            if ($componentId === (int) $composite->id) {
                throw ValidationException::withMessages([
                    'items' => "Circular dependency detected: {$composite->name} cannot contain itself as a micro-ingredient.",
                ]);
            }

            if ($qty <= 0) {
                throw ValidationException::withMessages([
                    'items' => 'Quantity required for each micro-ingredient must be greater than zero.',
                ]);
            }

            $componentIds[] = $componentId;
        }

        // Validate circular dependency across entire graph
        $this->validateNoCircularDependency((int) $composite->id, $componentIds);

        return DB::transaction(function () use ($composite, $items) {
            // Mark ingredient as composite
            $composite->update(['is_composite' => true]);

            // Clear old sub-recipe items
            $composite->subrecipeItems()->delete();

            // Insert new sub-recipe items
            foreach ($items as $item) {
                $componentId = (int) $item['component_ingredient_id'];
                $qty = (float) $item['quantity'];
                $unit = UnitConverter::normalizeUnit($item['unit'] ?? 'g');

                IngredientSubrecipeItem::create([
                    'composite_ingredient_id' => $composite->id,
                    'component_ingredient_id' => $componentId,
                    'quantity'                => $qty,
                    'unit'                    => $unit,
                ]);
            }

            // Recalculate cost per base unit for the composite ingredient
            $calculatedCost = $this->calculateUnitCost($composite);
            if ($calculatedCost > 0) {
                $composite->update(['cost_per_base_unit' => $calculatedCost]);

                // Update cost in all branch stocks if they had no custom price
                IngredientStock::where('ingredient_id', $composite->id)->update([
                    'cost_per_unit' => $calculatedCost,
                ]);
            }

            return $composite->fresh(['subrecipeItems.componentIngredient']);
        });
    }

    /**
     * Prevent circular dependencies by validating the dependency graph via Depth-First Search.
     *
     * @param int $compositeId
     * @param array $componentIds
     * @throws ValidationException
     */
    public function validateNoCircularDependency(int $compositeId, array $componentIds): void
    {
        $visited = [];

        foreach ($componentIds as $componentId) {
            if ($componentId === $compositeId) {
                $compositeName = Ingredient::find($compositeId)?->name ?? "ID #{$compositeId}";
                throw ValidationException::withMessages([
                    'items' => "Circular recipe configuration rejected: {$compositeName} directly or indirectly references itself.",
                ]);
            }

            $this->checkCycleDfs($compositeId, $componentId, $visited);
        }
    }

    /**
     * Helper recursive DFS to detect cycles.
     */
    protected function checkCycleDfs(int $rootCompositeId, int $currentIngredientId, array &$visited): void
    {
        if (isset($visited[$currentIngredientId])) {
            return;
        }
        $visited[$currentIngredientId] = true;

        // Find all components that $currentIngredientId uses in its sub-recipe
        $subComponents = IngredientSubrecipeItem::where('composite_ingredient_id', $currentIngredientId)
            ->pluck('component_ingredient_id')
            ->toArray();

        foreach ($subComponents as $childId) {
            if ($childId === $rootCompositeId) {
                $rootName = Ingredient::find($rootCompositeId)?->name ?? "ID #{$rootCompositeId}";
                $currentName = Ingredient::find($currentIngredientId)?->name ?? "ID #{$currentIngredientId}";
                throw ValidationException::withMessages([
                    'items' => "Circular recipe cycle detected between '{$rootName}' and '{$currentName}'.",
                ]);
            }

            $this->checkCycleDfs($rootCompositeId, $childId, $visited);
        }
    }

    /**
     * Calculate cost per unit of a composite ingredient based on its sub-recipe micro-ingredients.
     *
     * @param Ingredient $composite
     * @param int|null $branchId
     * @return float
     */
    public function calculateUnitCost(Ingredient $composite, ?int $branchId = null): float
    {
        $subrecipeItems = $composite->relationLoaded('subrecipeItems')
            ? $composite->subrecipeItems
            : $composite->subrecipeItems()->with('componentIngredient.stocks')->get();

        if ($subrecipeItems->isEmpty()) {
            return (float) $composite->cost_per_base_unit;
        }

        $totalCost = 0.0;

        foreach ($subrecipeItems as $item) {
            $component = $item->componentIngredient;
            if (!$component) {
                continue;
            }

            // Convert item quantity into component's base unit
            $reqBaseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                (float) $item->quantity,
                $item->unit,
                $component->unit,
                $component->avg_weight_per_piece
            );

            // Determine unit cost of the component
            $componentCost = 0.0;
            if ($branchId) {
                $stockRow = $component->relationLoaded('stocks')
                    ? $component->stocks->firstWhere('branch_id', $branchId)
                    : $component->stocks()->where('branch_id', $branchId)->first();

                if ($stockRow && (float) $stockRow->cost_per_unit > 0) {
                    $componentCost = (float) $stockRow->cost_per_unit;
                } else {
                    $componentCost = (float) $component->cost_per_base_unit;
                }
            } else {
                $componentCost = (float) $component->cost_per_base_unit;
            }

            $totalCost += ($reqBaseQty * $componentCost);
        }

        return round($totalCost, 4);
    }

    /**
     * Execute atomic batch preparation of a composite ingredient in a specific branch.
     *
     * @param int $compositeIngredientId
     * @param float $batchQuantity Quantity of composite ingredient to produce
     * @param int $branchId
     * @param int|null $userId
     * @return array
     * @throws ValidationException
     */
    public function prepareBatch(int $compositeIngredientId, float $batchQuantity, int $branchId, ?int $userId = null): array
    {
        if ($batchQuantity <= 0) {
            throw ValidationException::withMessages([
                'batch_quantity' => 'Batch quantity must be greater than zero.',
            ]);
        }

        $userId = $userId ?? Auth::id();

        return DB::transaction(function () use ($compositeIngredientId, $batchQuantity, $branchId, $userId) {
            /** @var Ingredient $composite */
            $composite = Ingredient::with(['subrecipeItems.componentIngredient'])->findOrFail($compositeIngredientId);

            if (!$composite->is_composite) {
                throw ValidationException::withMessages([
                    'error' => "Ingredient '{$composite->name}' is not configured as a composite ingredient.",
                ]);
            }

            $subrecipeItems = $composite->subrecipeItems;
            if ($subrecipeItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'error' => "Composite ingredient '{$composite->name}' has no internal micro-ingredients configured.",
                ]);
            }

            // 1. Calculate required quantities for all micro-ingredients and check stock
            $shortages = [];
            $requiredDeductions = [];

            foreach ($subrecipeItems as $subItem) {
                $component = $subItem->componentIngredient;
                if (!$component) {
                    continue;
                }

                // Required base quantity for 1 unit of composite * batchQuantity
                $singleBaseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                    (float) $subItem->quantity,
                    $subItem->unit,
                    $component->unit,
                    $component->avg_weight_per_piece
                );

                $totalRequiredBaseQty = $singleBaseQty * $batchQuantity;

                // Lock component stock row for update in target branch
                $stockRow = IngredientStock::where('ingredient_id', $component->id)
                    ->where('branch_id', $branchId)
                    ->lockForUpdate()
                    ->first();

                $currentStock = $stockRow ? (float) $stockRow->stock : 0.0;

                if (!$stockRow || $currentStock < $totalRequiredBaseQty) {
                    $missingBase = $totalRequiredBaseQty - $currentStock;
                    $displayMissing = UnitConverter::convertFromBaseQuantity($missingBase, $component->unit);
                    $displayAvailable = UnitConverter::convertFromBaseQuantity($currentStock, $component->unit);
                    $displayRequired = UnitConverter::convertFromBaseQuantity($totalRequiredBaseQty, $component->unit);

                    $shortages[] = "{$component->name}: Required {$displayRequired} {$component->unit}, Available {$displayAvailable} {$component->unit} (Short by {$displayMissing} {$component->unit})";
                }

                $requiredDeductions[] = [
                    'component'     => $component,
                    'stockRow'      => $stockRow,
                    'requiredBase'  => $totalRequiredBaseQty,
                    'itemQuantity'  => (float) $subItem->quantity * $batchQuantity,
                    'itemUnit'      => $subItem->unit,
                ];
            }

            // If any shortage exists, cleanly abort without committing any changes
            if (!empty($shortages)) {
                throw ValidationException::withMessages([
                    'batch_quantity' => 'Insufficient raw materials to prepare batch. Details: ' . implode('; ', $shortages),
                ]);
            }

            // 2. Deduct raw micro-ingredients atomically
            $branch = Branch::find($branchId);
            $branchName = $branch ? $branch->name : "Branch #{$branchId}";
            $batchUnit = $composite->unit;

            foreach ($requiredDeductions as $deduction) {
                /** @var Ingredient $component */
                $component = $deduction['component'];
                /** @var IngredientStock $stockRow */
                $stockRow = $deduction['stockRow'];
                $requiredBase = (float) $deduction['requiredBase'];

                $prevStock = (float) $stockRow->stock;
                $newStock = $prevStock - $requiredBase;

                $stockRow->update([
                    'stock'             => $newStock,
                    'total_stock_value' => max(0, (float) $stockRow->total_stock_value - ($requiredBase * (float) $stockRow->cost_per_unit)),
                ]);

                // Audit log for component deduction
                StockLog::create([
                    'storable_type'  => Ingredient::class,
                    'storable_id'    => $component->id,
                    'branch_id'      => $branchId,
                    'user_id'        => $userId,
                    'action_type'    => 'subrecipe_consumption',
                    'quantity'       => $deduction['itemQuantity'],
                    'quantity_base'  => $requiredBase,
                    'unit'           => $deduction['itemUnit'],
                    'previous_stock' => $prevStock,
                    'new_stock'      => $newStock,
                    'reference'      => "Batch prep for {$composite->name} (+{$batchQuantity} {$batchUnit})",
                ]);

                IngredientLog::create([
                    'ingredient_id' => $component->id,
                    'user_id'       => $userId,
                    'branch_id'     => $branchId,
                    'change_qty'    => -$requiredBase,
                    'reason'        => "Batch prep consumption for {$composite->name} ({$batchQuantity} {$batchUnit})",
                ]);
            }

            // 3. Add produced composite ingredient to branch stock
            $compositeBaseQty = UnitConverter::convertToBaseQuantity($batchQuantity, $composite->unit);

            $compositeStockRow = IngredientStock::firstOrCreate(
                ['ingredient_id' => $composite->id, 'branch_id' => $branchId],
                [
                    'stock'           => 0,
                    'low_stock_level' => UnitConverter::convertToBaseQuantity(5, $composite->unit),
                    'cost_per_unit'   => (float) $composite->cost_per_base_unit,
                ]
            );

            // Re-lock composite stock
            $compositeStockRow = IngredientStock::where('id', $compositeStockRow->id)->lockForUpdate()->first();

            $prevCompositeStock = (float) $compositeStockRow->stock;
            $newCompositeStock = $prevCompositeStock + $compositeBaseQty;

            $unitCost = (float) $composite->cost_per_base_unit;
            if ($unitCost <= 0) {
                $unitCost = $this->calculateUnitCost($composite, $branchId);
            }

            $compositeStockRow->update([
                'stock'             => $newCompositeStock,
                'cost_per_unit'     => $unitCost,
                'total_stock_value' => (float) $compositeStockRow->total_stock_value + ($compositeBaseQty * $unitCost),
            ]);

            // Audit log for composite ingredient addition
            StockLog::create([
                'storable_type'  => Ingredient::class,
                'storable_id'    => $composite->id,
                'branch_id'      => $branchId,
                'user_id'        => $userId,
                'action_type'    => 'batch_production',
                'quantity'       => $batchQuantity,
                'quantity_base'  => $compositeBaseQty,
                'unit'           => $composite->unit,
                'previous_stock' => $prevCompositeStock,
                'new_stock'      => $newCompositeStock,
                'reference'      => "Batch preparation completed (+{$batchQuantity} {$batchUnit}) in {$branchName}",
            ]);

            IngredientLog::create([
                'ingredient_id' => $composite->id,
                'user_id'       => $userId,
                'branch_id'     => $branchId,
                'change_qty'    => $compositeBaseQty,
                'reason'        => "Batch preparation (+{$batchQuantity} {$batchUnit})",
            ]);

            return [
                'success'           => true,
                'composite_id'      => $composite->id,
                'composite_name'    => $composite->name,
                'batch_quantity'    => $batchQuantity,
                'unit'              => $composite->unit,
                'branch_id'         => $branchId,
                'previous_stock'    => $prevCompositeStock,
                'new_stock'         => $newCompositeStock,
                'deducted_materials'=> count($requiredDeductions),
            ];
        });
    }

    /**
     * Manual stock reduction for Cashiers and Admins with strict auditing.
     *
     * @param int $ingredientId
     * @param float $quantity
     * @param string $unit
     * @param string $reason
     * @param string $notes
     * @param int $branchId
     * @param int|null $userId
     * @return array
     * @throws ValidationException
     */
    public function reduceStock(
        int $ingredientId,
        float $quantity,
        string $unit,
        string $reason,
        string $notes = '',
        ?int $branchId = null,
        ?int $userId = null
    ): array {
        if ($quantity <= 0) {
            throw ValidationException::withMessages([
                'quantity' => 'Reduction quantity must be greater than zero.',
            ]);
        }

        $userId = $userId ?? Auth::id();
        $user = Auth::user();
        $branchId = $branchId ?? ($user ? $user->branch_id : null);

        if (!$branchId) {
            throw ValidationException::withMessages([
                'branch_id' => 'A valid branch context is required for stock reduction.',
            ]);
        }

        return DB::transaction(function () use ($ingredientId, $quantity, $unit, $reason, $notes, $branchId, $userId) {
            $ingredient = Ingredient::findOrFail($ingredientId);

            $stockRow = IngredientStock::where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)
                ->lockForUpdate()
                ->first();

            if (!$stockRow) {
                throw ValidationException::withMessages([
                    'error' => "No stock record found for {$ingredient->name} in this branch.",
                ]);
            }

            $qtyBase = UnitConverter::convertToBaseQuantityWithIngredient(
                $quantity,
                $unit,
                $ingredient->unit,
                $ingredient->avg_weight_per_piece
            );

            $currentStock = (float) $stockRow->stock;

            if ($currentStock < $qtyBase) {
                $displayAvailable = UnitConverter::convertFromBaseQuantity($currentStock, $ingredient->unit);
                throw ValidationException::withMessages([
                    'quantity' => "Reduction quantity ({$quantity} {$unit}) exceeds available stock ({$displayAvailable} {$ingredient->unit}).",
                ]);
            }

            $prevStock = $currentStock;
            $newStock = $prevStock - $qtyBase;
            $costPerUnit = (float) $stockRow->cost_per_unit;
            $costAtLoss = $costPerUnit * $qtyBase;

            $stockRow->update([
                'stock'             => $newStock,
                'total_stock_value' => max(0, (float) $stockRow->total_stock_value - $costAtLoss),
            ]);

            $refText = "Manual Reduction: " . ucfirst($reason) . ($notes ? " ({$notes})" : "");

            StockLog::create([
                'storable_type'  => Ingredient::class,
                'storable_id'    => $ingredientId,
                'branch_id'      => $branchId,
                'user_id'        => $userId,
                'action_type'    => 'manual_reduction',
                'quantity'       => $quantity,
                'quantity_base'  => $qtyBase,
                'unit'           => $unit,
                'previous_stock' => $prevStock,
                'new_stock'      => $newStock,
                'reference'      => $refText,
            ]);

            IngredientLog::create([
                'ingredient_id' => $ingredientId,
                'user_id'       => $userId,
                'branch_id'     => $branchId,
                'change_qty'    => -$qtyBase,
                'reason'        => $refText,
            ]);

            return [
                'success'        => true,
                'ingredient_id'  => $ingredientId,
                'ingredient_name'=> $ingredient->name,
                'branch_id'      => $branchId,
                'quantity_reduced' => $quantity,
                'unit'           => $unit,
                'previous_stock' => $prevStock,
                'new_stock'      => $newStock,
            ];
        });
    }
}
