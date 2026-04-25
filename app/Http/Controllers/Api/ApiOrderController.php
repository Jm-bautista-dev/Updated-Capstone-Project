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
        try {
            $orders = Order::with(['delivery'])
                ->where('user_id', $request->user()?->id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'data'    => $orders
            ]);
        } catch (\Throwable $e) {
            Log::error('API Order Index Failure', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Something went wrong.'
            ], 500);
        }
    }

    /**
     * Store a newly created order from the mobile application.
     */
    public function store(Request $request)
    {
        Log::info('Order submission payload', $request->all());

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
                'latitude'       => 'required|numeric|between:-90,90',
                'longitude'      => 'required|numeric|between:-180,180',
                'landmark'       => 'nullable|string|max:255',
                'notes'          => 'nullable|string',
                'branch_id'      => 'nullable|exists:branches,id'
            ]);

            $branchId = $validated['branch_id'] ?? 1;
            $userId = $request->user()?->id;

            // --- 0. DYNAMIC DISTANCE & FEE CALCULATION ---
            $distanceKm = $validated['distance_km'] ?? null;
            $deliveryFee = $validated['delivery_fee'] ?? 0;
            $branch = \App\Models\Branch::find($branchId);

            if ($branch && $branch->latitude && $branch->longitude) {
                // Haversine Formula
                $earthRadius = 6371; // km
                $latFrom = deg2rad($branch->latitude);
                $lonFrom = deg2rad($branch->longitude);
                $latTo = deg2rad($validated['latitude']);
                $lonTo = deg2rad($validated['longitude']);

                $latDelta = $latTo - $latFrom;
                $lonDelta = $lonTo - $lonFrom;

                $angle = 2 * asin(sqrt(pow(sin($latDelta / 2), 2) +
                    cos($latFrom) * cos($latTo) * pow(sin($lonDelta / 2), 2)));
                
                $calculatedDistance = $angle * $earthRadius;
                $distanceKm = round($calculatedDistance, 2);

                // Use branch delivery calculation logic if available
                if (method_exists($branch, 'calculateDeliveryFee')) {
                    $deliveryFee = $branch->calculateDeliveryFee($distanceKm);
                }
            }

            // --- 1. CRASH-PROOF STOCK VALIDATION ---
            foreach ($validated['items'] as $itemData) {
                $product = Product::find($itemData['product_id']);
                
                if (!$product instanceof Product) {
                    return response()->json([
                        'success' => false,
                        'message' => "Product not found: ID {$itemData['product_id']}"
                    ], 422);
                }

                // PRODUCTION-LEVEL STOCK CHECK (Safe & Independent)
                $stockResult = $product->simpleStockCheck($itemData['quantity'], $branchId);
                
                if (!$stockResult['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => $stockResult['message']
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
            return DB::transaction(function () use ($validated, $branchId, $userId, $distanceKm, $deliveryFee) {
                $itemsTotal = collect($validated['items'])->sum(fn($item) => $item['quantity'] * $item['price']);

                $order = Order::create([
                    'user_id'        => $userId,
                    'branch_id'      => $branchId,
                    'customer_name'  => $validated['customer_name'],
                    'contact_number' => $validated['mobile_number'],
                    'address'        => $validated['address'],
                    'latitude'       => $validated['latitude'],
                    'longitude'      => $validated['longitude'],
                    'landmark'       => $validated['landmark'] ?? null,
                    'notes'          => $validated['notes'] ?? null,
                    'total_amount'   => $validated['total_amount'] + $deliveryFee, // Update total with calculated fee
                    'status'         => 'pending',
                ]);

                foreach ($validated['items'] as $itemData) {
                    $order->items()->create([
                        'product_id' => $itemData['product_id'],
                        'quantity'   => $itemData['quantity'],
                        'price'      => $itemData['price'],
                    ]);
                }

                Delivery::create([
                    'order_id'         => $order->id,
                    'customer_name'    => $validated['customer_name'],
                    'customer_phone'   => $validated['mobile_number'],
                    'customer_address' => $validated['address'],
                    'latitude'         => $validated['latitude'],
                    'longitude'        => $validated['longitude'],
                    'landmark'         => $validated['landmark'] ?? null,
                    'notes'            => $validated['notes'] ?? null,
                    'delivery_type'    => 'internal', 
                    'delivery_fee'     => $deliveryFee,
                    'distance_km'      => $distanceKm,
                    'status'           => 'pending',
                ]);

                try {
                    broadcast(new OrderCreated($order->load('branch')))->toOthers();
                } catch (\Throwable $e) {
                    Log::warning('Broadcast failed but order saved');
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Order placed successfully',
                    'order_id' => $order->id
                ], 201);
            });

        } catch (\Throwable $e) {
            Log::error('Order API Critical Failure', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'payload' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => app()->environment('local') 
                    ? $e->getMessage() 
                    : 'Order submission failed. Please check your internet or ingredients.'
            ], 500);
        }
    }

    /**
     * Retrieve order status for the tracking screen.
     */
    public function show(Request $request, $id)
    {
        try {
            $order = Order::with(['delivery.rider', 'items.product'])->find($id);

            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Order not found'], 404);
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
        } catch (\Throwable $e) {
            Log::error('Order API Show Failure', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => app()->environment('local') ? $e->getMessage() : 'Error retrieving order.'
            ], 500);
        }
    }
}
