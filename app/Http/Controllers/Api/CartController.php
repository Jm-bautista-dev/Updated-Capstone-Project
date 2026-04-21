<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
     * 
     * @param Request $request { product_id, quantity }
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

            // Core Rule: Branch Consistency
            if ($cart->branch_id && $cart->branch_id !== $productBranchId) {
                // Check if cart has items. If it's empty, we can just update the branch_id
                if ($cart->items()->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You cannot mix products from different branches',
                        'error_code' => 'BRANCH_MISMATCH',
                        'current_branch_id' => $cart->branch_id,
                        'new_product_branch_id' => $productBranchId
                    ], 400);
                } else {
                    // Cart exists but is empty, update to the new product's branch
                    $cart->update(['branch_id' => $productBranchId]);
                }
            }

            // If cart branch is not set, set it now
            if (!$cart->branch_id) {
                $cart->update(['branch_id' => $productBranchId]);
            }

            // Add or update item
            $cartItem = $cart->items()->where('product_id', $product->id)->first();

            if ($cartItem) {
                $cartItem->update([
                    'quantity' => $cartItem->quantity + $request->quantity
                ]);
            } else {
                $cart->items()->create([
                    'product_id' => $product->id,
                    'quantity' => $request->quantity,
                    'branch_id' => $productBranchId // redundant but recommended
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

        // If cart is now empty, reset branch_id
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
}
