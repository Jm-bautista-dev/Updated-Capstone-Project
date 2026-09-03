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
use App\Models\CashierShift;
use App\Models\ProductAddon;

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
        $sale = DB::transaction(function () use ($data) {
            $user     = Auth::user();
            $branchId = $user->branch_id;

            if (!$branchId) {
                throw new \Exception('User is not assigned to a branch. Cannot process sale.');
            }

            // 1. Batch-fetch all products with their ingredients (eager loading)
            $itemIds = array_column($data['items'], 'id');
            $productsQuery = Product::with(['ingredients.stocks'])
                ->whereIn('id', $itemIds)
                ->where(function ($q) use ($branchId) {
                    $q->where('branch_id', $branchId)
                      ->orWhereNull('branch_id')
                      ->orWhereHas('branches', function ($bq) use ($branchId) {
                          $bq->where('branches.id', $branchId);
                      });
                });

            $products = $productsQuery->get()->keyBy('id');

            // Aggregate totals per ingredient and per product
            $ingredientRequirements = []; // [ingredient_id => total_quantity_needed]
            $directRequirements = [];     // [product_id => total_quantity_needed]
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
                    $directRequirements[$product->id] = ($directRequirements[$product->id] ?? 0) + $qty;
                }

                $computedCost = $product->computeProductCost($branchId);

                $addonTotal = 0.0;
                $addonCost = 0.0;
                $normalizedAddons = [];

                if (!empty($item['selected_addons'])) {
                    $rawAddons = is_string($item['selected_addons']) 
                        ? json_decode($item['selected_addons'], true) 
                        : $item['selected_addons'];

                    if (is_array($rawAddons)) {
                        foreach ($rawAddons as $rawAd) {
                            $addonId = $rawAd['addon_id'] ?? $rawAd['id'] ?? null;
                            $adModel = $addonId ? ProductAddon::find($addonId) : null;
                            
                            $adName = $adModel?->name ?? ($rawAd['name'] ?? 'Add-on');
                            $adPrice = $adModel ? (float) $adModel->price : (float) ($rawAd['price'] ?? 0);
                            $adCost = $adModel ? (float) ($adModel->cost_price ?? 0) : (float) ($rawAd['cost_price'] ?? 0);
                            $adQty = (float) ($rawAd['quantity'] ?? 1);

                            $adLineTotal = $adPrice * $adQty;
                            $adLineCost = $adCost * $adQty;

                            $addonTotal += $adLineTotal;
                            $addonCost += $adLineCost;

                            // Deduct inventory if addon is linked to an ingredient
                            if ($adModel && $adModel->ingredient_id) {
                                $needed = (float) $adModel->ingredient_quantity * $adQty * $qty;
                                $ingredientRequirements[$adModel->ingredient_id] =
                                    ($ingredientRequirements[$adModel->ingredient_id] ?? 0) + $needed;
                            }

                            $normalizedAddons[] = [
                                'addon_id' => $addonId,
                                'name'     => $adName,
                                'price'    => $adPrice,
                                'quantity' => $adQty,
                                'subtotal' => $adLineTotal,
                            ];
                        }
                    }
                }

                $itemCost    = ($computedCost * $qty) + ($addonCost * $qty);
                $itemSelling = ((float) $product->selling_price * $qty) + ($addonTotal * $qty);
                $itemProfit  = $itemSelling - $itemCost;

                $costTotal  += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id'      => $product->id,
                    'quantity'        => $qty,
                    'unit_price'      => $product->selling_price,
                    'cost_price'      => $computedCost,
                    'subtotal'        => $itemSelling,
                    'addon_total'     => $addonTotal * $qty,
                    'selected_addons' => $normalizedAddons,
                    'profit'          => $itemProfit,
                ];
            }

            // 2. ── VALIDATE BEFORE MUTATION ─────────────────────────────────────
            $force = $data['force'] ?? false;
            if (!$force) {
                if (!empty($ingredientRequirements)) {
                    $this->validateIngredientStock($ingredientRequirements, $branchId);
                }
                if (!empty($directRequirements)) {
                    $this->validateDirectStock($directRequirements, $branchId, $products);
                }
            }

            // 3. ── DEDUCT INGREDIENTS (branch-scoped, atomic) ───────────────────
            $orderRef = $data['order_number'] ?? ('SALE-' . strtoupper(uniqid()));

            if (!empty($ingredientRequirements)) {
                $this->deductIngredientStock($ingredientRequirements, $branchId, $orderRef, $force);
            }

            // 4. ── (Product Level Stock Deduction Removed) ──────────────────────

            // 5. ── AUTHORITATIVE MONETARY & DISCOUNT CALCULATIONS ───────────────
            $orderType = $data['type'] ?? 'dine-in';
            $paymentMethod = $data['payment_method'] ?? 'cash';
            
            // Cash Control: Check for active shift if payment is cash
            $activeShift = null;
            if ($paymentMethod === 'cash') {
                $activeShift = CashierShift::where('cashier_id', $user->id)
                    ->where('status', 'open')
                    ->first();
                
                if (!$activeShift) {
                    throw new \Exception('No active shift found. Please open a shift before processing cash sales.');
                }
            }

            $productSubtotal = round(array_sum(array_column($saleItemsData, 'subtotal')), 2);
            $costTotal = round($costTotal, 2);

            // Handle Discount Calculations authoritatively
            $discountDetails = $data['discount_details'] ?? null;
            if (is_string($discountDetails)) {
                $decoded = json_decode($discountDetails, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $discountDetails = $decoded;
                }
            }

            $discountType = $data['discount_type'] ?? ($discountDetails['type'] ?? null);
            $discount = 0.00;

            if ($discountType || !empty($discountDetails) || (isset($data['discount']) && (float) $data['discount'] > 0)) {
                // Determine eligible subtotal
                $eligibleItemIds = $discountDetails['eligible_item_ids'] ?? [];
                $eligibleSubtotal = 0.00;

                foreach ($saleItemsData as $item) {
                    if (empty($eligibleItemIds) || in_array($item['product_id'], $eligibleItemIds)) {
                        $eligibleSubtotal += (float) $item['subtotal'];
                    }
                }
                $eligibleSubtotal = round($eligibleSubtotal, 2);

                if ($discountType === 'custom_fixed' || (isset($discountDetails['fixed_amount']) && (float) $discountDetails['fixed_amount'] > 0)) {
                    $fixedVal = (float) ($discountDetails['fixed_amount'] ?? $data['discount'] ?? 0);
                    $discount = round(min($eligibleSubtotal, max(0.0, $fixedVal)), 2);
                } elseif (isset($discountDetails['percentage']) && (float) $discountDetails['percentage'] > 0) {
                    $rate = min(100.0, max(0.0, (float) $discountDetails['percentage']));
                    $discount = round(($eligibleSubtotal * $rate) / 100.0, 2);
                } elseif (isset($data['discount']) && (float) $data['discount'] > 0) {
                    $rawDiscount = (float) $data['discount'];
                    $discount = round(min($productSubtotal, max(0.0, $rawDiscount)), 2);
                }
            }

            // Normalization & Sanity Checks
            $discount = round(min($productSubtotal, max(0.0, $discount)), 2);
            $netProductSales = round(max(0.0, $productSubtotal - $discount), 2);

            $deliveryFee = ($orderType === 'delivery' && !empty($data['delivery_info']['delivery_fee'])) 
                ? round((float) $data['delivery_info']['delivery_fee'], 2) 
                : 0.00;

            $saleTotal = round($netProductSales + $deliveryFee, 2);
            $saleProfit = round($netProductSales - $costTotal, 2);

            // Validate Amount Paid & Change
            $paidAmount = round((float) ($data['paid_amount'] ?? $saleTotal), 2);

            if ($paymentMethod === 'cash') {
                if ($paidAmount < $saleTotal) {
                    throw new \Exception("Insufficient payment: received ₱" . number_format($paidAmount, 2) . ", but order total is ₱" . number_format($saleTotal, 2) . ".");
                }
                $changeAmount = round(max(0.0, $paidAmount - $saleTotal), 2);
            } else {
                $paidAmount = $saleTotal;
                $changeAmount = 0.00;
            }

            $sale = Sale::create([
                'order_number'     => $orderRef,
                'user_id'          => $user->id,
                'branch_id'        => $branchId,
                'type'             => $orderType,
                'subtotal'         => $productSubtotal,
                'discount'         => $discount,
                'discount_type'    => $discountType,
                'discount_details' => $discountDetails,
                'delivery_fee'     => $deliveryFee,
                'total'            => $saleTotal,
                'cost_total'       => $costTotal,
                'profit'           => $saleProfit,
                'paid_amount'      => $paidAmount,
                'change_amount'    => $changeAmount,
                'payment_method'   => $paymentMethod,
                'status'           => $data['status'] ?? 'completed',
            ]);

            // Update Shift totals if cash (using authoritative discounted saleTotal)
            if ($activeShift && $paymentMethod === 'cash') {
                $activeShift->increment('total_cash_sales', $saleTotal);
                $activeShift->increment('expected_balance', $saleTotal);
            }

            // 6. ── CREATE SALE ITEMS ────────────────────────────────────────────
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            // 7. 🔥 BROADCAST: Sale registered in real-time
            broadcast(new SaleCreated($sale))->toOthers();
            \App\Services\TopPickService::clearCache();

            // 7. ── DELIVERY (if applicable) ─────────────────────────────────────
            if (($data['type'] ?? 'dine-in') === 'delivery' && !empty($data['delivery_info'])) {
                $this->deliveryService->createDelivery(
                    array_merge($data['delivery_info'], ['sale_id' => $sale->id])
                );
            }

            return $sale;
        });

        // 8. ── POST-COMMIT: ALLOCATE PRINT JOB ──────────────────────────────
        try {
            /** @var PrintJobService $printJobService */
            $printJobService = app(PrintJobService::class);
            $idempotencyKey = $data['idempotency_key'] ?? null;
            $terminalId = $data['terminal_id'] ?? null;
            $printJob = $printJobService->createForSale($sale, $idempotencyKey, $terminalId);
            $sale->setRelation('printJob', $printJob);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('SaleService: Print job allocation failed gracefully: ' . $e->getMessage());
        }

        return $sale;
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
                ->lockForUpdate()
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
                $unit = $stockRow->ingredient->unit ?? 'unit(s)';
                $displayStock = \App\Utils\UnitConverter::convertFromBaseQuantity((float) $stockRow->stock, $unit);
                $displayNeeded = \App\Utils\UnitConverter::convertFromBaseQuantity($totalNeeded, $unit);

                throw new \Exception(
                    "Insufficient stock in this branch. " .
                    "Ingredient '{$stockRow->ingredient->name}': " .
                    "need {$displayNeeded} {$unit}, " .
                    "have {$displayStock} {$unit}."
                );
            }
        }
    }

    /**
     * Validate physical stock requirements for items with no recipe.
     *
     * @throws \Exception on insufficient physical stock
     */
    protected function validateDirectStock(array $requirements, int $branchId, $products): void
    {
        foreach ($requirements as $productId => $totalNeeded) {
            $product = $products->get($productId) ?? Product::find($productId);
            if (!$product) continue;

            $pivot = DB::table('branch_product')
                ->where('product_id', $productId)
                ->where('branch_id', $branchId)
                ->first();
            $available = $pivot ? (float) $pivot->stock : (float) ($product->stock ?? 0);

            if ($available < $totalNeeded) {
                throw new \Exception(
                    "Insufficient physical stock for '{$product->name}' in this branch. " .
                    "Available: {$available}, Required: {$totalNeeded}."
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
    protected function deductIngredientStock(array $requirements, int $branchId, string $ref, bool $force = false): void
    {
        foreach ($requirements as $ingredientId => $qty) {
            /** @var IngredientStock $stockRow */
            $stockRow = IngredientStock::with('ingredient')
                ->where('ingredient_id', $ingredientId)
                ->where('branch_id', $branchId) // ← STRICT BRANCH GUARD
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = (float) $stockRow->stock;
            $stockRow->deduct($qty, $force); // throws if insufficient

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
            // Lock the sale row to prevent concurrent race condition voiding
            /** @var Sale|null $freshSale */
            $freshSale = Sale::where('id', $sale->id)->lockForUpdate()->first();
            if (!$freshSale || $freshSale->status === 'cancelled') {
                return;
            }

            $branchId = $freshSale->branch_id;
            
            // Loop through sale items and restore stock
            foreach ($freshSale->items()->with('product.ingredients')->get() as $item) {
                $product = $item->product;
                if (!$product) continue;

                if ($product->ingredients->isNotEmpty()) {
                    foreach ($product->ingredients as $ingredient) {
                        $qtyInput = (float) ($ingredient->pivot->quantity_required ?? 0);
                        $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
                        
                        $baseRestoringPerProduct = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                            $qtyInput, 
                            $unitInput, 
                            $ingredient->unit, 
                            $ingredient->avg_weight_per_piece
                        );
                        
                        $restoringTotal = $baseRestoringPerProduct * (float) $item->quantity;

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
                                'reference'      => "Void Sale: {$freshSale->order_number}",
                            ]);
                        }
                    }
                }
            }

            // Update status
            $freshSale->update(['status' => 'cancelled']);
            $sale->status = 'cancelled';
            
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
