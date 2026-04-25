<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
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
     * PRODUCTION-READY FLOW:
     * - Uses simpleStockCheck (no analytics)
     * - Returns clear structured errors
     * - Log failures for debugging
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
                    'is_valid' => true,
                    'message' => 'Cart is empty'
                ]);
            }

            $branchId = $cart->branch_id;
            $invalidItems = [];

            foreach ($cart->items as $item) {
                if (!$item->product) continue;

                // Call production-level stock validation
                $stockResult = $item->product->simpleStockCheck($item->quantity, $branchId);

                if (!$stockResult['success']) {
                    $invalidItems[] = [
                        'id' => $item->id,
                        'product_name' => $item->product->name,
                        'message' => $stockResult['message']
                    ];
                }
            }

            if (!empty($invalidItems)) {
                return response()->json([
                    'success' => false,
                    'is_valid' => false,
                    'invalid_items' => $invalidItems,
                    'message' => 'Insufficient stock for ingredients'
                ], 422);
            }

            return response()->json([
                'success' => true,
                'is_valid' => true,
                'message' => 'Cart is valid'
            ]);

        } catch (\Exception $e) {
            Log::error('Cart Validation Failure', [
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Stock validation failed',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
