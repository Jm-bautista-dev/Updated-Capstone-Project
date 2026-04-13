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
                // Ensure the product is available in this branch
                $productsQuery->whereHas('branches', function($q) use ($branchId) {
                    $q->where('branches.id', $branchId);
                });
            }
            
            $products = $productsQuery->get()->keyBy('id');

            $ingredientRequirements = []; // [ingredient_id => amount]
            $productDeductions = [];      // [product_id => quantity]
            $costTotal     = 0;
            $saleProfit    = 0;
            $saleItemsData = [];

            foreach ($data['items'] as $item) {
                $product = $products->get($item['id']);
                if (!$product) {
                    throw new \Exception("Product with ID {$item['id']} not found or not available in this branch.");
                }

                // 2. Logic: IF Recipe exists ELSE Direct Stock
                if ($product->ingredients->isNotEmpty()) {
                    foreach ($product->ingredients as $ingredient) {
                        $needed = (float) $ingredient->pivot->quantity_required * (float) $item['quantity'];
                        $ingredientRequirements[$ingredient->id] = ($ingredientRequirements[$ingredient->id] ?? 0) + $needed;
                    }
                } else {
                    // Direct Product Stock Deduction
                    $productDeductions[$product->id] = ($productDeductions[$product->id] ?? 0) + (float) $item['quantity'];
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

            // 3. Verify and Deduct Ingredients
            if (!empty($ingredientRequirements)) {
                $this->verifyIngredientAvailability($ingredientRequirements, $branchId);
                $this->deductIngredients($ingredientRequirements, $data['order_number'] ?? 'POS Order', $branchId);
            }

            // 4. Verify and Deduct Direct Products
            if (!empty($productDeductions)) {
                $this->verifyProductAvailability($productDeductions, $branchId);
                $this->deductProducts($productDeductions, $data['order_number'] ?? 'POS Order', $branchId);
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

            // 6. Create Sale Items
            foreach ($saleItemsData as $itemData) {
                $itemData['sale_id'] = $sale->id;
                SaleItem::create($itemData);
            }

            // 7. Delivery Info (If applicable)
            if (($data['type'] ?? 'dine-in') === 'delivery' && !empty($data['delivery_info'])) {
                $this->deliveryService->createDelivery(array_merge($data['delivery_info'], ['sale_id' => $sale->id]));
            }

            return $sale;
        });
    }

    protected function verifyIngredientAvailability(array $requirements, ?int $branchId): void
    {
        $ingredients = Ingredient::with('branch')->whereIn('id', array_keys($requirements))->get()->keyBy('id');
        foreach ($requirements as $id => $totalNeeded) {
            $ingredient = $ingredients->get($id);
            if (!$ingredient || (float) $ingredient->stock < $totalNeeded) {
                throw new \Exception("Insufficient ingredient stock: " . ($ingredient->name ?? "ID $id"));
            }
            if ($ingredient->branch_id != $branchId) {
                throw new \Exception("Cross-branch deduction blocked: Ingredient '{$ingredient->name}' belongs to " . ($ingredient->branch ? $ingredient->branch->name : 'another branch') . " but POS is in a different branch.");
            }
        }
    }

    protected function deductIngredients(array $requirements, string $ref, ?int $branchId): void
    {
        foreach ($requirements as $id => $qty) {
            /** @var \App\Models\Ingredient $ingredient */
            $ingredient = Ingredient::find($id);
            $prev = $ingredient->stock;
            $ingredient->decrement('stock', $qty);
            $ingredient->refresh();

            \App\Models\StockLog::create([
                'storable_type' => Ingredient::class,
                'storable_id' => $id,
                'branch_id' => $branchId,
                'user_id' => Auth::id(),
                'action_type' => 'recipe_deduction',
                'quantity' => $qty,
                'quantity_base' => $qty,
                'unit' => $ingredient->unit,
                'previous_stock' => $prev,
                'new_stock' => $ingredient->stock,
                'reference' => "Sale: $ref"
            ]);
        }
    }

    protected function verifyProductAvailability(array $deductions, ?int $branchId): void
    {
        $products = Product::whereIn('id', array_keys($deductions))->get()->keyBy('id');
        foreach ($deductions as $id => $qty) {
            $product = $products->get($id);
            if (!$product || (float) $product->stock < $qty) {
                throw new \Exception("Insufficient product stock: " . ($product->name ?? "ID $id"));
            }
        }
    }

    protected function deductProducts(array $deductions, string $ref, ?int $branchId): void
    {
        foreach ($deductions as $id => $qty) {
            /** @var \App\Models\Product $product */
            $product = Product::find($id);
            $prev = $product->stock;
            $product->decrement('stock', $qty);
            $product->refresh();

            \App\Models\StockLog::create([
                'storable_type' => Product::class,
                'storable_id' => $id,
                'branch_id' => $branchId,
                'user_id' => Auth::id(),
                'action_type' => 'sale_deduction',
                'quantity' => $qty,
                'quantity_base' => $qty,
                'unit' => $product->unit ?? 'pcs',
                'previous_stock' => $prev,
                'new_stock' => $product->stock,
                'reference' => "Sale: $ref"
            ]);
        }
    }
}
