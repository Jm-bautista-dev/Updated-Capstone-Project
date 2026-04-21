<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientLog;
use App\Models\StockLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Events\SaleCreated;
use App\Events\StockUpdated;

class SaleService
{
    protected $deliveryService;

    public function __construct(DeliveryService $deliveryService)
    {
        $this->deliveryService = $deliveryService;
    }

    /**
     * Process a new sale with strict branch-isolated stock deduction.
     *
     * Rules:
     * - Ingredient stock deduction ONLY from ingredient_stocks WHERE branch_id = current branch
     * - NEVER deduct from another branch
     * - Validate BEFORE any mutation
     *
     * @param array $data
     * @return Sale
     * @throws \Exception if stock is insufficient or cross-branch deduction attempted
     */
    public function processSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $user     = Auth::user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                throw new \Exception('User is not assigned to a branch. Cannot process sale.');
            }

            // 1. Batch-fetch all products with their ingredients (eager loading)
            $itemIds = array_column($data['items'], 'id');
            $productsQuery = Product::with(['ingredients.stocks'])
                ->whereIn('id', $itemIds)
                ->where('branch_id', $branchId); // Filter by the cashier's branch ownership


            $products = $productsQuery->get()->keyBy('id');

            // Aggregate totals per ingredient and per product
            $ingredientRequirements = []; // [ingredient_id => total_quantity_needed]
            $costTotal   = 0;
            $saleProfit  = 0;
            $saleItemsData = [];

            foreach ($data['items'] as $item) {
                $product = $products->get($item['id']);
                if (!$product) {
                    throw new \Exception("Product with ID {$item['id']} is not available in this branch.");
                }

                $qty = (float) $item['quantity'];

                if ($product->ingredients->isNotEmpty()) {
                    // Recipe-based: deduct from ingredient_stocks
                    foreach ($product->ingredients as $ingredient) {
                        $qtyInput = (float) $ingredient->pivot->quantity_required;
                        $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                        $baseRequiredPerProduct = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient($qtyInput, $unitInput, $ingredient->unit, $ingredient->avg_weight_per_piece);
                        $needed = $baseRequiredPerProduct * $qty;
                        $ingredientRequirements[$ingredient->id] =
                            ($ingredientRequirements[$ingredient->id] ?? 0) + $needed;
                    }
                } else {
                    // Direct products do not deduct stock directly anymore
                }

                $computedCost = $product->computeProductCost($branchId);

                $itemCost    = $computedCost * $qty;
                $itemSelling = (float) $product->selling_price * $qty;
                $itemProfit  = $itemSelling - $itemCost;

                $costTotal  += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id' => $product->id,
                    'quantity'   => $qty,
                    'unit_price' => $product->selling_price,
                    'cost_price' => $computedCost,
                    'subtotal'   => $itemSelling,
                    'profit'     => $itemProfit,
                ];
            }

            // 2. ── VALIDATE BEFORE MUTATION ─────────────────────────────────────
            if (!empty($ingredientRequirements)) {
                $this->validateIngredientStock($ingredientRequirements, $branchId);
            }

            // 3. ── DEDUCT INGREDIENTS (branch-scoped, atomic) ───────────────────
            $orderRef = $data['order_number'] ?? ('SALE-' . strtoupper(uniqid()));

            if (!empty($ingredientRequirements)) {
                $this->deductIngredientStock($ingredientRequirements, $branchId, $orderRef);
            }

            // 4. ── (Product Level Stock Deduction Removed) ──────────────────────

            // 5. ── CREATE SALE RECORD ───────────────────────────────────────────
            $sale = Sale::create([
                'order_number'   => $orderRef,
                'user_id'        => $user->id,
                'branch_id'      => $branchId,
                'type'           => $data['type'] ?? 'dine-in',
                'total'          => $data['total'],
                'cost_total'     => $costTotal,
                'profit'         => $saleProfit,
                'paid_amount'    => $data['paid_amount'],
                'change_amount'  => $data['change_amount'] ?? 0,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status'         => $data['status'] ?? 'completed',
            ]);

            // 6. ── CREATE SALE ITEMS ────────────────────────────────────────────
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            // 7. 🔥 BROADCAST: Sale registered in real-time
            broadcast(new SaleCreated($sale))->toOthers();

            // 7. ── DELIVERY (if applicable) ─────────────────────────────────────
            if (($data['type'] ?? 'dine-in') === 'delivery' && !empty($data['delivery_info'])) {
                $this->deliveryService->createDelivery(
                    array_merge($data['delivery_info'], ['sale_id' => $sale->id])
                );
            }

            return $sale;
        });
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VALIDATION
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Validate all ingredient stock requirements for the current branch
     * BEFORE any deduction happens.
     *
     * @throws \Exception on insufficient or missing stock
     */
    protected function validateIngredientStock(array $requirements, int $branchId): void
    {
        foreach ($requirements as $ingredientId => $totalNeeded) {
            /** @var IngredientStock|null $stockRow */
            $stockRow = IngredientStock::with('ingredient', 'branch')
                ->where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId)  // ← STRICT: current branch ONLY
                ->first();

            if (!$stockRow) {
                $ingredient = Ingredient::find($ingredientId);
                $name = $ingredient ? $ingredient->name : "ID #{$ingredientId}";
                throw new \Exception(
                    "Ingredient '{$name}' has no stock record for this branch. " .
                    "Please stock-in first."
                );
            }

            if ((float) $stockRow->stock < $totalNeeded) {
                throw new \Exception(
                    "Insufficient stock in this branch. " .
                    "Ingredient '{$stockRow->ingredient->name}': " .
                    "need {$totalNeeded} {$stockRow->ingredient->unit}, " .
                    "have {$stockRow->stock} {$stockRow->ingredient->unit}."
                );
            }
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // DEDUCTIONS
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Deduct from ingredient_stocks — ONLY for the current branch.
     *
     * 🚫 NEVER touches another branch's stock row.
     */
    protected function deductIngredientStock(array $requirements, int $branchId, string $ref): void
    {
        foreach ($requirements as $ingredientId => $qty) {
            /** @var IngredientStock $stockRow */
            $stockRow = IngredientStock::with('ingredient')
                ->where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId) // ← STRICT BRANCH GUARD
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = (float) $stockRow->stock;
            $stockRow->deduct($qty); // throws if insufficient

            // Audit log
            StockLog::create([
                'storable_type'  => Ingredient::class,
                'storable_id'    => $ingredientId,
                'branch_id'      => $branchId,
                'user_id'        => Auth::id(),
                'action_type'    => 'recipe_deduction',
                'quantity'       => $qty,
                'quantity_base'  => $qty,
                'unit'           => $stockRow->ingredient->unit,
                'previous_stock' => $previousStock,
                'new_stock'      => (float) $stockRow->stock,
                'reference'      => "Sale: {$ref}",
            ]);

            // Update stock alert flags on the stock row
            $stockRow->refresh();
            $this->updateStockAlerts($stockRow);

            // 🔥 BROADCAST: Ingredient stock updated
            broadcast(new StockUpdated($branchId, Ingredient::class, $ingredientId))->toOthers();
        }
    }

    /**
     * Void a sale and restore ingredient stocks.
     *
     * @param Sale $sale
     * @throws \Exception
     */
    public function voidSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {
            // Only allow voiding if not already cancelled
            if ($sale->status === 'cancelled') {
                return;
            }

            $branchId = $sale->branch_id;
            
            // Loop through sale items and restore stock
            foreach ($sale->items as $item) {
                $product = $item->product()->with('ingredients')->first();
                if (!$product) continue;

                if ($product->ingredients->isNotEmpty()) {
                    foreach ($product->ingredients as $ingredient) {
                        $qtyInput = (float) $ingredient->pivot->quantity_required;
                        $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                        
                        $baseRestoringPerProduct = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                            $qtyInput, 
                            $unitInput, 
                            $ingredient->unit, 
                            $ingredient->avg_weight_per_piece
                        );
                        
                        $restoringTotal = $baseRestoringPerProduct * $item->quantity;

                        // Restore to the branch's specific stock row
                        $stockRow = IngredientStock::where('ingredient_id', $ingredient->id)
                            ->where('branch_id', $branchId)
                            ->lockForUpdate()
                            ->first();

                        if ($stockRow) {
                            $previousStock = (float) $stockRow->stock;
                            $stockRow->add($restoringTotal);

                            // Audit log for restoration
                            StockLog::create([
                                'storable_type'  => Ingredient::class,
                                'storable_id'    => $ingredient->id,
                                'branch_id'      => $branchId,
                                'user_id'        => Auth::id(),
                                'action_type'    => 'sale_void_restoration',
                                'quantity'       => $restoringTotal,
                                'quantity_base'  => $restoringTotal,
                                'unit'           => $ingredient->unit,
                                'previous_stock' => $previousStock,
                                'new_stock'      => (float) $stockRow->stock,
                                'reference'      => "Void Sale: {$sale->order_number}",
                            ]);
                        }
                    }
                }
            }

            // Update status
            $sale->update(['status' => 'cancelled']);
            
            // 🔥 BROADCAST: Inventory restored
            broadcast(new StockUpdated($branchId, null, null))->toOthers();
        });
    }

    /**
     * Update is_low_stock_notified / is_out_of_stock_notified flags on a stock row
     * and create an IngredientLog alert entry if needed.
     */
    protected function updateStockAlerts(IngredientStock $stockRow): void
    {
        $stock    = (float) $stockRow->stock;
        $lowLevel = (float) $stockRow->low_stock_level;

        if ($stock <= 0) {
            if (!$stockRow->is_out_of_stock_notified) {
                IngredientLog::create([
                    'ingredient_id' => $stockRow->ingredient_id,
                    'user_id'       => null,
                    'branch_id'     => $stockRow->branch_id,
                    'change_qty'    => 0,
                    'reason'        => "Out of Stock Alert — Branch #{$stockRow->branch_id}",
                ]);
                $stockRow->update([
                    'is_out_of_stock_notified' => true,
                    'is_low_stock_notified'    => true,
                ]);
            }
        } elseif ($stock <= $lowLevel) {
            if (!$stockRow->is_low_stock_notified) {
                IngredientLog::create([
                    'ingredient_id' => $stockRow->ingredient_id,
                    'user_id'       => null,
                    'branch_id'     => $stockRow->branch_id,
                    'change_qty'    => 0,
                    'reason'        => "Low Stock Alert — Branch #{$stockRow->branch_id}",
                ]);
                $stockRow->update([
                    'is_low_stock_notified'    => true,
                    'is_out_of_stock_notified' => false,
                ]);
            }
        } else {
            // Stock is healthy — reset flags
            if ($stockRow->is_low_stock_notified || $stockRow->is_out_of_stock_notified) {
                $stockRow->update([
                    'is_low_stock_notified'    => false,
                    'is_out_of_stock_notified' => false,
                ]);
            }
        }
    }
}
