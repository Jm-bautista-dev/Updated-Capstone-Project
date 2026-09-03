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
                $itemAddonSum = 0.0;
                if (!empty($item->selected_addons)) {
                    $rawAddons = is_string($item->selected_addons) ? json_decode($item->selected_addons, true) : $item->selected_addons;
                    if (is_array($rawAddons)) {
                        foreach ($rawAddons as $ad) {
                            $itemAddonSum += (float) ($ad['price'] ?? 0) * (float) ($ad['quantity'] ?? 1);
                        }
                    }
                }
                return $carry + ($item->quantity * ((float) $item->product->selling_price + $itemAddonSum));
            }, 0);

            return response()->json([
                'success' => true,
                'data' => [
                    'branch' => $cart->branch,
                    'items' => $cart->items,
                    'total_amount' => round($totalAmount, 2)
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
                'product_id'      => 'required|exists:products,id',
                'quantity'        => 'required|numeric|min:0.1',
                'selected_addons' => 'nullable|array',
            ]);

            $user = $request->user();
            $product = Product::with('ingredients')->findOrFail($request->product_id);
            $productBranchId = $product->branch_id;
            $selectedAddons = $request->input('selected_addons', []);

            return DB::transaction(function () use ($user, $product, $productBranchId, $selectedAddons, $request) {
                $cart = Cart::firstOrCreate(['user_id' => $user->id]);

                if ($cart->branch_id && $productBranchId && $cart->branch_id !== $productBranchId) {
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

                $effectiveBranchId = $cart->branch_id ?? $productBranchId ?? $request->input('branch_id', 1);

                if (!$cart->branch_id && $effectiveBranchId) {
                    $cart->update(['branch_id' => $effectiveBranchId]);
                }

                // Check for existing cart item with identical product and addons
                $cartItem = $cart->items()
                    ->where('product_id', $product->id)
                    ->where('selected_addons', !empty($selectedAddons) ? json_encode($selectedAddons) : null)
                    ->first();

                $currentQty = $cartItem ? (float) $cartItem->quantity : 0;
                $targetQty = $currentQty + (float) $request->quantity;

                // Validate requested ingredient stock
                $stockCheck = $product->simpleStockCheck($targetQty, (int) $effectiveBranchId);
                if (!$stockCheck['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $stockCheck['message']
                    ], 422);
                }

                if ($cartItem) {
                    $cartItem->update([
                        'quantity' => $targetQty
                    ]);
                } else {
                    $cart->items()->create([
                        'product_id'      => $product->id,
                        'quantity'        => $request->quantity,
                        'branch_id'       => $effectiveBranchId,
                        'selected_addons' => !empty($selectedAddons) ? $selectedAddons : null,
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
            })->with(['cart', 'product.ingredients'])->findOrFail($itemId);

            $branchId = (int) ($cartItem->cart->branch_id ?? $cartItem->branch_id ?? 1);
            $product = $cartItem->product;

            if ($product) {
                $stockCheck = $product->simpleStockCheck((float) $request->quantity, $branchId);
                if (!$stockCheck['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $stockCheck['message']
                    ], 422);
                }
            }

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

            $branchId = (int) ($cart->branch_id ?? 1);
            $itemsPayload = $cart->items->map(fn($item) => [
                'product_id' => $item->product_id,
                'quantity'   => (float) $item->quantity,
            ])->toArray();

            $batchCheck = Product::validateBatchStock($branchId, $itemsPayload);

            if (!$batchCheck['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $batchCheck['message']
                ], 422);
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
