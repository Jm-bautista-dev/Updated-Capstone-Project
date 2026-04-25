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
        try {
            $validated = $request->validate([
                'customer_name'  => 'required|string|max:255',
                'mobile_number'  => 'required|string|max:20',
                'address'        => 'required|string',
                'items'          => 'required|array|min:1',
                'items.*.product_id' => 'required|exists:products,id',
                'items.*.quantity'   => 'required|numeric|min:0.1',
                'items.*.price'      => 'required|numeric|min:0',
                'total_amount'   => 'required|numeric|min:0',
                'delivery_fee'   => 'nullable|numeric|min:0',
                'distance_km'    => 'nullable|numeric|min:0',
                'branch_id'      => 'nullable|exists:branches,id'
            ]);

            $branchId = $validated['branch_id'] ?? 1;
            $userId = $request->user()?->id;

            // --- 1. SAFE STOCK VALIDATION (NO DEDUCTION) ---
            foreach ($validated['items'] as $itemData) {
                $product = Product::with('ingredients')->find($itemData['product_id']);
                
                // Ensure product exists and has ingredients if it's a recipe item
                if (!$product) {
                    return response()->json(['message' => "Product ID {$itemData['product_id']} not found"], 422);
                }

                // Check Dynamic Availability (Safety check for ingredients)
                $availability = $product->dynamicAvailability($branchId);
                if ($itemData['quantity'] > $availability['available']) {
                    return response()->json([
                        'success' => false,
                        'message' => "Insufficient stock for ingredients: {$product->name}. (Available: {$availability['available']})",
                        'product_id' => $product->id
                    ], 422);
                }
            }

            // --- 2. BRANCH CONSISTENCY ---
            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                if ($product && $product->branch_id && $product->branch_id != $branchId) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product '{$product->name}' belongs to a different branch."
                    ], 400);
                }
            }

            // --- 3. TRANSACTIONAL CREATION ---
            return DB::transaction(function () use ($validated, $branchId, $userId, $request) {
                $itemsTotal = collect($validated['items'])->sum(fn($item) => $item['quantity'] * $item['price']);
                $deliveryFee = $validated['delivery_fee'] ?? max(0, $validated['total_amount'] - $itemsTotal);

                // Create Order
                $order = Order::create([
                    'user_id'        => $userId,
                    'branch_id'      => $branchId,
                    'customer_name'  => $validated['customer_name'],
                    'contact_number' => $validated['mobile_number'],
                    'address'        => $validated['address'],
                    'total_amount'   => $validated['total_amount'],
                    'status'         => 'pending',
                ]);

                // Save Order Items (NO DEDUCTION HERE AS REQUESTED)
                foreach ($validated['items'] as $itemData) {
                    $order->items()->create([
                        'product_id' => $itemData['product_id'],
                        'quantity'   => $itemData['quantity'],
                        'price'      => $itemData['price'],
                    ]);
                }

                // Create Delivery
                Delivery::create([
                    'order_id'         => $order->id,
                    'customer_name'    => $validated['customer_name'],
                    'customer_phone'   => $validated['mobile_number'],
                    'customer_address' => $validated['address'],
                    'delivery_type'    => 'internal', 
                    'delivery_fee'     => $deliveryFee,
                    'distance_km'      => $validated['distance_km'] ?? null,
                    'status'           => 'pending',
                ]);

                // Notify Admin (Silent Catch)
                try {
                    broadcast(new OrderCreated($order->load('branch')))->toOthers();
                } catch (\Exception $e) {
                    Log::warning('Broadcast failed but order saved');
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Order placed successfully',
                    'order_id' => $order->id
                ], 201);
            });

        } catch (\Exception $e) {
            Log::error($e); // FULL ERROR LOGGING
            return response()->json([
                'message' => 'Order submission failed',
                'error'   => $e->getMessage()
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

        if ($order->user_id && $request->user() && $order->user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id'             => $order->id,
                'status'         => $order->status,
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
}
