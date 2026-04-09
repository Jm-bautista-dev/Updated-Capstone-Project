<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientLog;
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
     * Process a new sale.
     *
     * @param array $data
     * @return Sale
     */
    public function processSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            $branchId = Auth::user()->branch_id;

            // 1. Batch fetch all products needed with their ingredients (Eager Loading)
            $itemIds = array_column($data['items'], 'id');
            $productsQuery = Product::with('ingredients')->whereIn('id', $itemIds);
            
            if ($branchId) {
                $productsQuery->where('branch_id', $branchId);
            }
            
            $products = $productsQuery->get()->keyBy('id');

            // 2. Calculate ingredient requirements and totals using pre-fetched data
            $ingredientRequirements = [];
            $costTotal     = 0;
            $saleProfit    = 0;
            $saleItemsData = [];

            foreach ($data['items'] as $item) {
                $product = $products->get($item['id']);
                if (!$product) {
                    throw new \Exception("Product with ID {$item['id']} not found.");
                }

                // Ingredient Calculation
                foreach ($product->ingredients as $ingredient) {
                    $needed = (float) $ingredient->pivot->quantity_required * (float) $item['quantity'];
                    $ingredientRequirements[$ingredient->id] = ($ingredientRequirements[$ingredient->id] ?? 0) + $needed;
                }

                // Profit Calculation
                $itemCost    = (float) $product->cost_price * $item['quantity'];
                $itemSelling = (float) $product->selling_price * $item['quantity'];
                $itemProfit  = $itemSelling - $itemCost;

                $costTotal  += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id' => $product->id,
                    'quantity'   => $item['quantity'],
                    'unit_price' => $product->selling_price,
                    'cost_price' => $product->cost_price,
                    'subtotal'   => $itemSelling,
                    'profit'     => $itemProfit,
                ];
            }

            // 3. Verify stock availability (branch-scoped)
            if (!empty($ingredientRequirements)) {
                $this->verifyStockAvailability($ingredientRequirements, $branchId);
                // 4. Deduct stock and log changes (branch-scoped)
                $this->deductStock($ingredientRequirements, $data['order_number'] ?? 'POS Order', $branchId);
            }

            // 5. Create Sale Record
            $sale = Sale::create([
                'order_number'   => $data['order_number'] ?? 'SALE-' . strtoupper(uniqid()),
                'user_id'        => Auth::id(),
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

            // 6. Create Sale Items (Consider batch insert if performance is critical)
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            // 7. Create Delivery if applicable
            if (($data['type'] ?? 'dine-in') === 'delivery' && !empty($data['delivery_info'])) {
                $deliveryData = array_merge($data['delivery_info'], [
                    'sale_id' => $sale->id,
                    'delivery_fee' => $data['delivery_info']['delivery_fee'] ?? 0,
                ]);
                $this->deliveryService->createDelivery($deliveryData);
            }

            return $sale;
        });
    }

    /**
     * Verify stock availability — checks the ingredient in the correct branch.
     * Rewritten to batch fetch ingredients.
     */
    protected function verifyStockAvailability(array $requirements, ?int $branchId): void
    {
        $ingredientIds = array_keys($requirements);
        $ingredientsQuery = Ingredient::whereIn('id', $ingredientIds);
        
        if ($branchId) {
            $ingredientsQuery->where('branch_id', $branchId);
        }
        
        $ingredients = $ingredientsQuery->get()->keyBy('id');

        foreach ($requirements as $id => $totalNeeded) {
            $ingredient = $ingredients->get($id);

            if (!$ingredient) {
                // Better error message
                $fallback = Ingredient::find($id);
                $name = $fallback ? $fallback->name : "ID: $id";
                throw new \Exception("Ingredient '{$name}' not found in this branch's inventory.");
            }

            if ((float) $ingredient->stock < $totalNeeded) {
                throw new \Exception(
                    "Insufficient stock for {$ingredient->name}. Needed {$totalNeeded} {$ingredient->unit}, available {$ingredient->stock} {$ingredient->unit}."
                );
            }
        }
    }

    /**
     * Deduct stock — updates ingredient row for the correct branch.
     */
    protected function deductStock(array $requirements, string $reference, ?int $branchId): void
    {
        $ingredientIds = array_keys($requirements);
        $ingredientsQuery = Ingredient::whereIn('id', $ingredientIds);
        
        if ($branchId) {
            $ingredientsQuery->where('branch_id', $branchId);
        }
        
        $ingredients = $ingredientsQuery->get();

        foreach ($ingredients as $ingredient) {
            /** @var \App\Models\Ingredient $ingredient */
            $totalNeeded = $requirements[$ingredient->id];
            
            $ingredient->decrement('stock', $totalNeeded);
            $ingredient->refresh()->checkStockAlerts();

            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'user_id'       => Auth::id(),
                'change_qty'    => -$totalNeeded,
                'reason'        => "Sale: {$reference}",
            ]);
        }
    }
}
