<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Delivery;
use App\Models\IngredientStock;
use App\Utils\UnitConverter;
use App\Events\OrderCreated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ApiOrderController extends Controller
{
    /**
     * List orders for the authenticated mobile user.
     */
    public function index(Request $request)
    {
        $orders = Order::with(['delivery'])
            ->where('user_id', $request->user()?->id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $orders
        ]);
    }

    /**
     * Store a newly created order from the mobile application.
     * 
     * Post Payload: { customer_name, mobile_number, address, items: [{product_id, quantity, price}], total_amount }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_name'  => 'required|string|max:255',
            'mobile_number'  => 'required|string|max:20',
            'address'        => 'required|string',
            'items'          => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.1',
            'items.*.price'      => 'required|numeric|min:0',
            'total_amount'   => 'required|numeric|min:0',
            'branch_id'      => 'nullable|exists:branches,id' // Optional branch context
        ]);

        $branchId = $validated['branch_id'] ?? 1; // Default to main branch if not provided
        $userId = $request->user()?->id;

        // --- BRANCH CONSISTENCY VALIDATION ---
        foreach ($validated['items'] as $item) {
            $product = Product::find($item['product_id']);
            if ($product && $product->branch_id && $product->branch_id != $branchId) {
                return response()->json([
                    'success' => false,
                    'message' => "Product '{$product->name}' belongs to a different branch. You cannot mix branches in a single order."
                ], 400);
            }
        }

        try {
            return DB::transaction(function () use ($validated, $branchId, $userId) {
                // 1. Create Order
                $order = Order::create([
                    'user_id'        => $userId,
                    'branch_id'      => $branchId,
                    'customer_name'  => $validated['customer_name'],
                    'contact_number' => $validated['mobile_number'],
                    'address'        => $validated['address'],
                    'total_amount'   => $validated['total_amount'],
                    'status'         => 'pending',
                ]);

                // 2. Save Order Items and Deduct Inventory
                foreach ($validated['items'] as $itemData) {
                    $orderItem = $order->items()->create([
                        'product_id' => $itemData['product_id'],
                        'quantity'   => $itemData['quantity'],
                        'price'      => $itemData['price'],
                    ]);

                    $this->deductInventoryForProduct($itemData['product_id'], $itemData['quantity'], $branchId);
                }

                // 3. Create Delivery
                Delivery::create([
                    'order_id'         => $order->id,
                    'customer_name'    => $validated['customer_name'],
                    'customer_phone'   => $validated['mobile_number'],
                    'customer_address' => $validated['address'],
                    'delivery_type'    => 'internal', // Default for mobile orders
                    'status'           => 'pending',
                ]);

                // 4. Broadcast Notification
                broadcast(new OrderCreated($order->load('branch')))->toOthers();

                return response()->json([
                    'success' => true,
                    'message' => 'Order placed successfully',
                    'order_id' => $order->id
                ], 201);
            });
        } catch (\Exception $e) {
            Log::error('API Order Error: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to place order: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Retrieve order status for the tracking screen.
     */
    public function show(Request $request, $id)
    {
        $order = Order::with(['delivery.rider', 'items.product'])->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Ownership check (only if order is associated with a user)
        if ($order->user_id && $request->user() && $order->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id'             => $order->id,
                'status'         => $order->status, // pending, ...
                'total_amount'   => $order->total_amount,
                'customer_name'  => $order->customer_name,
                'delivery' => $order->delivery ? [
                    'status'        => $order->delivery->status,
                    'status_label'  => $order->delivery->getStatusLabel(),
                    'status_color'  => $order->delivery->getStatusColor(),
                    'rider_name'    => $order->delivery->rider?->name,
                    'updated_at'    => $order->delivery->updated_at,
                ] : null,
                'items' => $order->items->map(fn($item) => [
                    'product_name' => $item->product->name,
                    'quantity'     => $item->quantity,
                    'price'        => $item->price,
                ]),
                'created_at' => $order->created_at,
            ]
        ]);
    }

    /**
     * Deduct inventory based on product formulation (recipe).
     */
    private function deductInventoryForProduct($productId, $orderedQuantity, $branchId)
    {
        $product = Product::with('ingredients')->findOrFail($productId);

        foreach ($product->ingredients as $ingredient) {
            $qtyPerUnit = (float) $ingredient->pivot->quantity_required;
            $unitInput = $ingredient->pivot->unit ?? $ingredient->unit;
            
            // Normalize quantity to base units
            $requiredTotalBase = UnitConverter::convertToBaseQuantityWithIngredient(
                $qtyPerUnit, 
                $unitInput, 
                $ingredient->unit, 
                $ingredient->avg_weight_per_piece
            ) * $orderedQuantity;

            // Find stock for this branch
            $stock = IngredientStock::where('ingredient_id', $ingredient->id)
                ->where('branch_id', $branchId)
                ->first();

            if ($stock) {
                $stock->deduct($requiredTotalBase);
            } else {
                // If no stock record exists for this branch, we might want to log or throw
                throw new \Exception("Component stock record missing for '{$ingredient->name}' in branch {$branchId}");
            }
        }
    }
}
