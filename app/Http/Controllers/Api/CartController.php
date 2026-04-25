<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\IngredientStock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Get the current user's cart.
     */
    public function index(Request $request)
    {
        $cart = Cart::with(['items.product', 'branch'])
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$cart) {
            return response()->json([
                'success' => true,
                'data' => [
                    'branch' => null,
                    'items' => [],
                    'total_amount' => 0
                ]
            ]);
        }

        $totalAmount = $cart->items->reduce(function ($carry, $item) {
            return $carry + ($item->quantity * $item->product->selling_price);
        }, 0);

        return response()->json([
            'success' => true,
            'data' => [
                'branch' => $cart->branch,
                'items' => $cart->items,
                'total_amount' => $totalAmount
            ]
        ]);
    }

    /**
     * Add an item to the cart.
     */
    public function addItem(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:0.1',
        ]);

        $user = $request->user();
        $product = Product::findOrFail($request->product_id);
        $productBranchId = $product->branch_id;

        return DB::transaction(function () use ($user, $product, $productBranchId, $request) {
            $cart = Cart::firstOrCreate(['user_id' => $user->id]);

            if ($cart->branch_id && $cart->branch_id !== $productBranchId) {
                if ($cart->items()->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You cannot mix products from different branches',
                        'error_code' => 'BRANCH_MISMATCH',
                        'current_branch_id' => $cart->branch_id,
                        'new_product_branch_id' => $productBranchId
                    ], 400);
                } else {
                    $cart->update(['branch_id' => $productBranchId]);
                }
            }

            if (!$cart->branch_id) {
                $cart->update(['branch_id' => $productBranchId]);
            }

            $cartItem = $cart->items()->where('product_id', $product->id)->first();

            if ($cartItem) {
                $cartItem->update([
                    'quantity' => $cartItem->quantity + $request->quantity
                ]);
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $request->quantity,
                    'branch_id' => $productBranchId
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Item added to cart',
                'cart' => $cart->load('items.product')
            ]);
        });
    }

    /**
     * Update item quantity.
     */
    public function updateItem(Request $request, $itemId)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0.1',
        ]);

        $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($itemId);

        $cartItem->update(['quantity' => $request->quantity]);

        return response()->json([
            'success' => true,
            'message' => 'Cart updated'
        ]);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(Request $request, $itemId)
    {
        $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
            $q->where('user_id', $request->user()->id);
        })->findOrFail($itemId);

        $cart = $cartItem->cart;
        $cartItem->delete();

        if (!$cart->items()->exists()) {
            $cart->update(['branch_id' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Item removed'
        ]);
    }

    /**
     * Clear the entire cart.
     */
    public function clear(Request $request)
    {
        $cart = Cart::where('user_id', $request->user()->id)->first();

        if ($cart) {
            $cart->items()->delete();
            $cart->update(['branch_id' => null]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared'
        ]);
    }

    /**
     * Validate the current cart (check stock availability).
     * 
     * PRODUCTION-READY / CRASH-PROOF:
     * - NO dynamicAvailability()
     * - NO analytics
     * - Direct stock checking
     */
    public function validate(Request $request)
    {
        try {
            $cart = Cart::with(['items.product', 'branch'])
                ->where('user_id', $request->user()->id)
                ->first();

            if (!$cart || $cart->items->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Cart is empty'
                ]);
            }

            $branchId = $cart->branch_id;

            foreach ($cart->items as $item) {
                $product = Product::with('ingredients')->find($item->product_id);
                
                // 1. Ensure product exists
                if (!$product) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product not found: {$item->product_id}"
                    ], 404);
                }

                // 2. Simple Stock Validation (Safe & Independent)
                $ingredients = $product->ingredients;

                // Case: Item has no ingredients (recipe missing)
                if ($ingredients->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => "Recipe not configured for '{$product->name}'"
                    ], 422);
                }

                // Loop ingredients for direct stock check
                foreach ($ingredients as $ingredient) {
                    // Safe access to pivot quantity
                    $qtyPerUnit = (float) (optional($ingredient->pivot)->quantity_required ?? 0);
                    $unitInput  = optional($ingredient->pivot)->unit ?? $ingredient->unit;

                    // Normalize requirement to base unit
                    $requiredBasePerUnit = \App\Utils\UnitConverter::convertToBaseQuantityWithIngredient(
                        $qtyPerUnit,
                        $unitInput,
                        $ingredient->unit,
                        $ingredient->avg_weight_per_piece
                    );

                    $totalRequired = $requiredBasePerUnit * $item->quantity;

                    // Skip if requirement is 0 (safety)
                    if ($totalRequired <= 0) continue;

                    // Direct DB query for current stock (Safe & Accurate)
                    $currentStock = IngredientStock::where('branch_id', $branchId)
                        ->where('ingredient_id', $ingredient->id)
                        ->value('stock') ?? 0;

                    if ($currentStock < $totalRequired) {
                        return response()->json([
                            'success' => false,
                            'message' => "Insufficient stock: Missing '{$ingredient->name}' for '{$product->name}'",
                            'ingredient' => $ingredient->name
                        ], 422);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Cart is valid'
            ]);

        } catch (\Throwable $e) {
            // FULL CRASH LOGGING
            Log::error('Cart Validation Crash: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()->id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
