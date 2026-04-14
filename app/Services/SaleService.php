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
            $productDeductions      = []; // [product_id => total_qty]
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
                        $needed = (float) $ingredient->pivot->quantity_required * $qty;
                        $ingredientRequirements[$ingredient->id] =
                            ($ingredientRequirements[$ingredient->id] ?? 0) + $needed;
                    }
                } else {
                    // Direct product stock deduction
                    $productDeductions[$product->id] =
                        ($productDeductions[$product->id] ?? 0) + $qty;
                }

                $itemCost    = (float) $product->cost_price * $qty;
                $itemSelling = (float) $product->selling_price * $qty;
                $itemProfit  = $itemSelling - $itemCost;

                $costTotal  += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id' => $product->id,
                    'quantity'   => $qty,
                    'unit_price' => $product->selling_price,
                    'cost_price' => $product->cost_price,
                    'subtotal'   => $itemSelling,
                    'profit'     => $itemProfit,
                ];
            }

            // 2. ── VALIDATE BEFORE MUTATION ─────────────────────────────────────
            if (!empty($ingredientRequirements)) {
                $this->validateIngredientStock($ingredientRequirements, $branchId);
            }
            if (!empty($productDeductions)) {
                $this->validateProductStock($productDeductions);
            }

            // 3. ── DEDUCT INGREDIENTS (branch-scoped, atomic) ───────────────────
            $orderRef = $data['order_number'] ?? ('SALE-' . strtoupper(uniqid()));

            if (!empty($ingredientRequirements)) {
                $this->deductIngredientStock($ingredientRequirements, $branchId, $orderRef);
            }

            // 4. ── DEDUCT DIRECT PRODUCTS ───────────────────────────────────────
            if (!empty($productDeductions)) {
                $this->deductProducts($productDeductions, $branchId, $orderRef);
            }

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

    /**
     * Validate direct product stock before deduction.
     *
     * @throws \Exception on insufficient stock
     */
    protected function validateProductStock(array $deductions): void
    {
        $products = Product::whereIn('id', array_keys($deductions))->get()->keyBy('id');
        foreach ($deductions as $id => $qty) {
            $product = $products->get($id);
            if (!$product || (float) $product->stock < $qty) {
                throw new \Exception(
                    "Insufficient product stock: " . ($product->name ?? "ID #{$id}")
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
        }
    }

    /**
     * Deduct from direct product stock.
     */
    protected function deductProducts(array $deductions, int $branchId, string $ref): void
    {
        foreach ($deductions as $id => $qty) {
            /** @var \App\Models\Product $product */
            $product = Product::lockForUpdate()->findOrFail($id);
            $prev = (float) $product->stock;
            $product->decrement('stock', $qty);
            $product->refresh();

            StockLog::create([
                'storable_type'  => Product::class,
                'storable_id'    => $id,
                'branch_id'      => $branchId,
                'user_id'        => Auth::id(),
                'action_type'    => 'sale_deduction',
                'quantity'       => $qty,
                'quantity_base'  => $qty,
                'unit'           => $product->unit ?? 'pcs',
                'previous_stock' => $prev,
                'new_stock'      => (float) $product->stock,
                'reference'      => "Sale: {$ref}",
            ]);
        }
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
