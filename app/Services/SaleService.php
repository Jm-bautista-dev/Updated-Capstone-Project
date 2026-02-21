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
    /**
     * Process a new sale.
     *
     * @param array $data
     * @return Sale
     */
    public function processSale(array $data): Sale
    {
        return DB::transaction(function () use ($data) {
            // 1. Validate and calculate ingredient requirements
            $ingredientRequirements = $this->calculateIngredientRequirements($data['items']);

            // 2. Verify stock availability
            $this->verifyStockAvailability($ingredientRequirements);

            // 3. Deduct stock and log changes
            $this->deductStock($ingredientRequirements, $data['order_number'] ?? 'POS Order');

            // 4. Calculate Totals and Profit
            $costTotal = 0;
            $saleProfit = 0;
            $saleItemsData = [];

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['id']);
                $itemCost = $product->cost_price * $item['quantity'];
                $itemSelling = $product->selling_price * $item['quantity'];
                $itemProfit = $itemSelling - $itemCost;

                $costTotal += $itemCost;
                $saleProfit += $itemProfit;

                $saleItemsData[] = [
                    'product_id' => $product->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $product->selling_price,
                    'cost_price' => $product->cost_price,
                    'subtotal' => $itemSelling,
                    'profit' => $itemProfit,
                ];
            }

            // 5. Create Sale Record
            $sale = Sale::create([
                'order_number' => $data['order_number'] ?? 'SALE-' . strtoupper(uniqid()),
                'user_id' => Auth::id(),
                'type' => $data['type'] ?? 'dine-in',
                'total' => $data['total'],
                'cost_total' => $costTotal,
                'profit' => $saleProfit,
                'paid_amount' => $data['paid_amount'],
                'change_amount' => $data['change_amount'] ?? 0,
                'payment_method' => $data['payment_method'] ?? 'cash',
                'status' => $data['status'] ?? 'completed',
            ]);

            // 6. Create Sale Items
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            return $sale;
        });
    }

    protected function calculateIngredientRequirements(array $items): array
    {
        $requirements = [];
        foreach ($items as $item) {
            $product = Product::with('ingredients')->findOrFail($item['id']);
            foreach ($product->ingredients as $ingredient) {
                $id = $ingredient->id;
                $needed = (float) $ingredient->pivot->quantity_required * (float) $item['quantity'];
                $requirements[$id] = ($requirements[$id] ?? 0) + $needed;
            }
        }
        return $requirements;
    }

    protected function verifyStockAvailability(array $requirements): void
    {
        foreach ($requirements as $id => $totalNeeded) {
            $ingredient = Ingredient::findOrFail($id);
            if ($ingredient->stock < $totalNeeded) {
                throw new \Exception("Insufficient stock for {$ingredient->name}. Needed {$totalNeeded}, available {$ingredient->stock}");
            }
        }
    }

    protected function deductStock(array $requirements, string $reference): void
    {
        foreach ($requirements as $id => $totalNeeded) {
            $ingredient = Ingredient::findOrFail($id);
            $ingredient->decrement('stock', $totalNeeded);

            IngredientLog::create([
                'ingredient_id' => $id,
                'change_qty' => -$totalNeeded,
                'reason' => "Sale: {$reference}",
            ]);
        }
    }
}
