<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PickupOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiPickupController extends Controller
{
    public function __construct(
        protected PickupOrderService $pickupService
    ) {
    }

    /**
     * GET /api/v1/customer/pickup-branches
     * List active branches configured for pickup fulfillment.
     */
    public function branches(): JsonResponse
    {
        $branches = $this->pickupService->getAvailableBranches();

        return response()->json([
            'success'  => true,
            'branches' => $branches,
        ]);
    }

    /**
     * GET /api/v1/customer/pickup-slots
     * Get computed available pickup time slots for a specific branch and date.
     */
    public function slots(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'date'      => 'nullable|date_format:Y-m-d',
        ]);

        $slotsData = $this->pickupService->getAvailableTimeSlots(
            branchId: (int) $validated['branch_id'],
            date: $validated['date'] ?? null
        );

        return response()->json([
            'success' => true,
            'data'    => $slotsData,
        ]);
    }

    /**
     * GET /api/v1/customer/orders/{id}/pickup-status
     * Retrieve status, pickup instructions, and verification code for a customer's pickup order.
     */
    public function status(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $order = Order::with(['branch', 'items.product'])->find($id);

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found.',
            ], 404);
        }

        // Authorization check: User must own the order or be authenticated staff
        if ($user && !$user->isAdmin() && $order->user_id && $order->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to order details.',
            ], 403);
        }

        if (!$order->isPickup()) {
            return response()->json([
                'success' => false,
                'message' => 'This order is not a pickup order.',
            ], 422);
        }

        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $pickupTimeStr = $order->scheduled_pickup_at 
            ? \Carbon\Carbon::parse($order->scheduled_pickup_at)->setTimezone($tz)->format('g:i A')
            : 'scheduled time';
        $prepTimeStr = $order->prep_start_at 
            ? \Carbon\Carbon::parse($order->prep_start_at)->setTimezone($tz)->format('g:i A')
            : null;

        $statusInstructions = match ($order->status) {
            'pending'          => "Your pickup order is placed for {$pickupTimeStr} and is awaiting branch confirmation.",
            'confirmed'        => $order->isPrepWindowOpen()
                                    ? "Your order is confirmed and queueing for preparation for your {$pickupTimeStr} pickup."
                                    : "Scheduled for pickup at {$pickupTimeStr}. Kitchen will begin preparation around {$prepTimeStr}.",
            'preparing'        => 'The kitchen is actively preparing your fresh order.',
            'ready_for_pickup' => 'Your order is ready! Please proceed to the counter and present your verification code.',
            'customer_arrived' => 'Staff has noted your arrival. Your order will be handed to you shortly.',
            'completed'        => 'Pickup completed. Thank you for ordering at MAKI DESU!',
            'no_show'          => 'Pickup marked as missed / no-show. Please contact branch support.',
            'cancelled'        => 'This order has been cancelled.',
            default            => 'Order status updated.',
        };

        return response()->json([
            'success' => true,
            'order'   => [
                'id'                       => $order->id,
                'order_number'             => $order->order_number,
                'fulfillment_type'         => $order->fulfillment_type,
                'status'                   => $order->status,
                'status_instruction'       => $statusInstructions,
                'is_prep_window_open'      => $order->isPrepWindowOpen(),
                'scheduled_pickup_at'      => $order->scheduled_pickup_at?->toIso8601String(),
                'scheduled_pickup_display' => $order->scheduled_pickup_at ? \Carbon\Carbon::parse($order->scheduled_pickup_at)->setTimezone($tz)->format('M d, Y • g:i A') : null,
                'scheduled_pickup_time'    => $pickupTimeStr,
                'estimated_prep_minutes'   => $order->estimated_prep_time_minutes,
                'prep_start_at'            => $order->prep_start_at?->toIso8601String(),
                'prep_start_display'       => $prepTimeStr,
                'pickup_verification_code' => $order->pickup_verification_code,
                'payment_method'           => $order->payment_method,
                'payment_status'           => $order->payment_status,
                'total_amount'             => (float) $order->total_amount,
                'branch'                   => [
                    'id'      => $order->branch?->id,
                    'name'    => $order->branch?->name,
                    'address' => $order->branch?->address,
                ],
                'items'                    => $order->items->map(fn ($it) => [
                    'product_id' => $it->product_id,
                    'name'       => $it->product?->name ?? 'Product',
                    'quantity'   => $it->quantity,
                    'price'      => (float) $it->price,
                ]),
                'created_at'               => $order->created_at?->toIso8601String(),
            ]
        ]);
    }
}
