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
        try {
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
        } catch (\Throwable $e) {
            Log::error('Cart Index Failure', ['message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to load cart'], 500);
        }
    }

    /**
     * Add an item to the cart.
     */
    public function addItem(Request $request)
    {
        try {
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
                            'error_code' => 'BRANCH_MISMATCH'
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
                    'message' => 'Item added to cart'
                ]);
            });
        } catch (\Throwable $e) {
            Log::error('Cart Add Failure', ['message' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to add item'], 500);
        }
    }

    /**
     * Update item quantity.
     */
    public function updateItem(Request $request, $itemId)
    {
        try {
            $request->validate([
                'quantity' => 'required|numeric|min:0.1',
            ]);

            $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })->findOrFail($itemId);

            $cartItem->update(['quantity' => $request->quantity]);

            return response()->json(['success' => true, 'message' => 'Cart updated']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Update failed'], 500);
        }
    }

    /**
     * Remove item from cart.
     */
    public function removeItem(Request $request, $itemId)
    {
        try {
            $cartItem = CartItem::whereHas('cart', function($q) use ($request) {
                $q->where('user_id', $request->user()->id);
            })->findOrFail($itemId);

            $cart = $cartItem->cart;
            $cartItem->delete();

            if (!$cart->items()->exists()) {
                $cart->update(['branch_id' => null]);
            }

            return response()->json(['success' => true, 'message' => 'Item removed']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Remove failed'], 500);
        }
    }

    /**
     * Clear the entire cart.
     */
    public function clear(Request $request)
    {
        try {
            $cart = Cart::where('user_id', $request->user()->id)->first();

            if ($cart) {
                $cart->items()->delete();
                $cart->update(['branch_id' => null]);
            }

            return response()->json(['success' => true, 'message' => 'Cart cleared']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Clear failed'], 500);
        }
    }

    /**
     * Validate the current cart (check stock availability).
     */
    public function validate(Request $request)
    {
        Log::info('Cart validation payload', $request->all());

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
                
                if (!$product instanceof Product) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product not found: ID {$item->product_id}"
                    ], 404);
                }

                // PRODUCTION-LEVEL STOCK CHECK
                $stockResult = $product->simpleStockCheck($item->quantity, $branchId);

                if (!$stockResult['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $stockResult['message']
                    ], 422);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Cart is valid'
            ]);

        } catch (\Throwable $e) {
            // FULL CRASH LOGGING
            Log::error('Cart Validation Crash', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'user_id' => $request->user()?->id
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('local') 
                    ? $e->getMessage() 
                    : 'Validation failed. System temporarily unavailable.'
            ], 500);
        }
    }
}
