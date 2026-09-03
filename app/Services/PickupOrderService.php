<?php

namespace App\Services;

use App\Events\OrderCreated;
use App\Events\OrderStatusUpdated;
use App\Models\Branch;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\SecurityAuditLogger;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PickupOrderService
{
    const DEFAULT_TIMEZONE = 'Asia/Manila';

    public function __construct(
        protected InventoryService $inventoryService,
        protected OrderFulfillmentService $fulfillmentService
    ) {
    }

    /**
     * Get all active branches offering pickup fulfillment.
     */
    public function getAvailableBranches(): Collection
    {
        return Branch::where('pickup_enabled', true)
            ->get(['id', 'name', 'address', 'latitude', 'longitude', 'pickup_opening_time', 'pickup_closing_time', 'pickup_lead_time_minutes', 'pickup_slot_interval_minutes']);
    }

    /**
     * Compute and return available time slots for a branch on a given date.
     *
     * @param int $branchId
     * @param string|null $date YYYY-MM-DD
     * @return array
     */
    public function getAvailableTimeSlots(int $branchId, ?string $date = null): array
    {
        $branch = Branch::find($branchId);
        if (!$branch || !$branch->pickup_enabled) {
            return [
                'branch_id'     => $branchId,
                'date'          => $date,
                'is_open'       => false,
                'message'       => 'Pickup is not enabled for this branch.',
                'slots'         => [],
            ];
        }

        $tz = self::DEFAULT_TIMEZONE;
        $targetDate = $date ? Carbon::parse($date, $tz)->startOfDay() : Carbon::now($tz)->startOfDay();
        $now = Carbon::now($tz);

        // Disallow dates strictly before today
        if ($targetDate->isBefore($now->copy()->startOfDay())) {
            return [
                'branch_id' => $branchId,
                'date'      => $targetDate->toDateString(),
                'is_open'   => false,
                'message'   => 'Cannot schedule pickup for past dates.',
                'slots'     => [],
            ];
        }

        $openingTimeStr = $branch->pickup_opening_time ?? '09:00:00';
        $closingTimeStr = $branch->pickup_closing_time ?? '21:00:00';
        $intervalMin    = (int) ($branch->pickup_slot_interval_minutes ?? 15);
        $leadTimeMin    = (int) ($branch->pickup_lead_time_minutes ?? 20);
        $maxPerSlot     = (int) ($branch->pickup_max_orders_per_slot ?? 10);
        $cutoffBeforeClose = (int) ($branch->pickup_cutoff_before_close_minutes ?? 30);

        $openingDateTime = Carbon::parse($targetDate->toDateString() . ' ' . $openingTimeStr, $tz);
        $closingDateTime = Carbon::parse($targetDate->toDateString() . ' ' . $closingTimeStr, $tz);
        $lastSlotDateTime = $closingDateTime->copy()->subMinutes($cutoffBeforeClose);

        // Fetch existing pickup order counts per scheduled_pickup_at for the date (database-agnostic)
        $existingOrders = Order::where('branch_id', $branchId)
            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP)
            ->whereDate('scheduled_pickup_at', $targetDate->toDateString())
            ->whereNotIn('status', ['cancelled'])
            ->get(['scheduled_pickup_at']);

        $existingCounts = [];
        foreach ($existingOrders as $ord) {
            if ($ord->scheduled_pickup_at) {
                $key = Carbon::parse($ord->scheduled_pickup_at, $tz)->format('Y-m-d H:i:00');
                $existingCounts[$key] = ($existingCounts[$key] ?? 0) + 1;
            }
        }

        $slots = [];
        $currentSlot = $openingDateTime->copy();
        $isToday = $targetDate->isToday();
        $earliestAllowed = $now->copy()->addMinutes($leadTimeMin);

        while ($currentSlot->lte($lastSlotDateTime)) {
            $slotFormattedKey = $currentSlot->format('Y-m-d H:i:00');
            $bookedCount = $existingCounts[$slotFormattedKey] ?? 0;
            $remainingCapacity = max(0, $maxPerSlot - $bookedCount);

            $isTooSoon = $isToday && $currentSlot->lt($earliestAllowed);
            $isFullyBooked = $remainingCapacity <= 0;
            $isAvailable = !$isTooSoon && !$isFullyBooked;

            $slots[] = [
                'time'               => $currentSlot->format('H:i'),
                'display_time'       => $currentSlot->format('g:i A'),
                'datetime'           => $currentSlot->toIso8601String(),
                'datetime_raw'       => $currentSlot->format('Y-m-d H:i:s'),
                'is_available'       => $isAvailable,
                'remaining_capacity' => $remainingCapacity,
                'booked_count'       => $bookedCount,
                'is_asap'            => false,
            ];

            $currentSlot->addMinutes($intervalMin);
        }

        return [
            'branch_id'         => $branchId,
            'branch_name'       => $branch->name,
            'date'              => $targetDate->toDateString(),
            'is_open'           => count($slots) > 0,
            'lead_time_minutes' => $leadTimeMin,
            'interval_minutes'  => $intervalMin,
            'slots'             => $slots,
        ];
    }

    /**
     * Generate unique, clean pickup verification code.
     */
    public function generateVerificationCode(): string
    {
        do {
            $code = strtoupper(Str::random(6));
        } while (Order::where('pickup_verification_code', $code)->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'customer_arrived'])->exists());

        return $code;
    }

    /**
     * Validate and create a manual pickup order (from POS, Facebook/Messenger, or Phone).
     *
     * @param array $data
     * @param User $cashier
     * @return Order
     */
    public function createManualPickupOrder(array $data, User $cashier): Order
    {
        return DB::transaction(function () use ($data, $cashier) {
            $branchId = $data['branch_id'] ?? $cashier->branch_id ?? 1;
            $branch = Branch::findOrFail($branchId);

            $tz = self::DEFAULT_TIMEZONE;
            $now = Carbon::now($tz);
            $scheduledPickupAt = Carbon::parse($data['scheduled_pickup_at'], $tz);
            $leadTimeMinutes = (int) ($branch->pickup_lead_time_minutes ?? 20);
            $prepTimeMinutes = (int) ($data['estimated_prep_time_minutes'] ?? $leadTimeMinutes);

            // 1. Validate not in past (with 2-minute grace for client submission latency)
            if ($scheduledPickupAt->isBefore($now->copy()->subMinutes(2))) {
                throw new \Exception("Cannot schedule a pickup in the past.");
            }

            // 2. Validate operating hours
            $openStr = $branch->pickup_opening_time ?? '09:00:00';
            $closeStr = $branch->pickup_closing_time ?? '21:00:00';
            $cutoffMin = (int) ($branch->pickup_cutoff_before_close_minutes ?? 30);

            $openingDateTime = Carbon::parse($scheduledPickupAt->toDateString() . ' ' . $openStr, $tz);
            $closingDateTime = Carbon::parse($scheduledPickupAt->toDateString() . ' ' . $closeStr, $tz);
            $lastSlotDateTime = $closingDateTime->copy()->subMinutes($cutoffMin);

            if ($scheduledPickupAt->lt($openingDateTime) || $scheduledPickupAt->gt($lastSlotDateTime)) {
                throw new \Exception("Selected pickup time ({$scheduledPickupAt->format('g:i A')}) is outside branch pickup hours ({$openingDateTime->format('g:i A')} to {$lastSlotDateTime->format('g:i A')}).");
            }

            // 3. Race condition & slot capacity protection with pessimistic lock
            $slotKey = $scheduledPickupAt->format('Y-m-d H:i:00');
            $maxPerSlot = (int) ($branch->pickup_max_orders_per_slot ?? 10);

            $currentSlotOrdersCount = Order::where('branch_id', $branchId)
                ->where('fulfillment_type', Order::FULFILLMENT_PICKUP)
                ->where('scheduled_pickup_at', $slotKey)
                ->whereNotIn('status', ['cancelled'])
                ->lockForUpdate()
                ->count();

            if ($currentSlotOrdersCount >= $maxPerSlot) {
                throw new \Exception("Pickup slot for {$scheduledPickupAt->format('g:i A')} is fully booked ({$currentSlotOrdersCount}/{$maxPerSlot} orders). Please select another time.");
            }

            $prepStartAt = $scheduledPickupAt->copy()->subMinutes($prepTimeMinutes);

            // Generate order number and verification code
            $countToday = Order::whereDate('created_at', today())->count() + 1;
            $prefix = match ($data['order_source'] ?? Order::SOURCE_WEB_POS) {
                Order::SOURCE_FACEBOOK_MESSENGER => 'FB',
                Order::SOURCE_PHONE_CALL         => 'PH',
                Order::SOURCE_WALK_IN            => 'WI',
                default                          => 'PK',
            };
            $orderNumber = sprintf('%s-%s-%04d', $prefix, now()->format('ymd'), $countToday);
            $verificationCode = $this->generateVerificationCode();

            $paymentMethod = $data['payment_method'] ?? 'cash';
            $paymentStatus = ($data['payment_status'] ?? 'unpaid') === 'paid' ? Order::PAYMENT_STATUS_PAID : Order::PAYMENT_STATUS_UNPAID;

            $order = Order::create([
                'order_number'                => $orderNumber,
                'idempotency_key'             => $data['idempotency_key'] ?? (string) Str::uuid(),
                'fulfillment_type'            => Order::FULFILLMENT_PICKUP,
                'order_source'                => $data['order_source'] ?? Order::SOURCE_FACEBOOK_MESSENGER,
                'source_reference'            => $data['source_reference'] ?? null,
                'user_id'                     => $data['user_id'] ?? null,
                'branch_id'                   => $branchId,
                'customer_name'               => $data['customer_name'],
                'contact_number'              => $data['contact_number'] ?? null,
                'pickup_notes'                => $data['pickup_notes'] ?? null,
                'internal_notes'              => $data['internal_notes'] ?? null,
                'payment_method'              => $paymentMethod,
                'payment_status'              => $paymentStatus,
                'paid_at'                     => $paymentStatus === Order::PAYMENT_STATUS_PAID ? now() : null,
                'scheduled_pickup_at'         => $scheduledPickupAt,
                'estimated_prep_time_minutes' => $prepTimeMinutes,
                'prep_start_at'               => $prepStartAt,
                'pickup_verification_code'    => $verificationCode,
                'total_amount'                => $data['total_amount'],
                'status'                      => 'pending',
            ]);

            // Save order items
            foreach ($data['items'] as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price'],
                ]);
            }

            // Broadcast real-time order creation event
            try {
                event(new OrderCreated($order));
            } catch (\Throwable $e) {
                Log::warning('PickupOrderService: OrderCreated broadcast failed: ' . $e->getMessage());
            }

            SecurityAuditLogger::logSecurityEvent(
                event: 'PICKUP_ORDER_CREATED',
                target: "order:{$order->id}",
                details: [
                    'order_number'        => $order->order_number,
                    'order_source'        => $order->order_source,
                    'source_reference'    => $order->source_reference,
                    'customer_name'       => $order->customer_name,
                    'scheduled_pickup_at' => $order->scheduled_pickup_at?->toIso8601String(),
                    'total_amount'        => (float) $order->total_amount,
                    'created_by'          => $cashier->name,
                ],
                level: 'info'
            );

            return $order;
        });
    }

    /**
     * Transition pickup order state with verification and automated fulfillment hooks.
     *
     * @param Order $order
     * @param string $newStatus
     * @param string|null $reason
     * @param User|null $actor
     * @return Order
     */
    public function transitionPickupStatus(Order $order, string $newStatus, ?string $reason = null, ?User $actor = null): Order
    {
        $previousStatus = $order->status;

        $updatedOrder = DB::transaction(function () use ($order, $newStatus, $reason, $actor) {
            $order->transitionTo($newStatus, $reason, $actor?->id);

            // If order reached terminal completed state, trigger inventory deduction & sale recording
            if ($newStatus === 'completed') {
                $this->fulfillmentService->onOrderPickedUp($order, $actor);
            }

            SecurityAuditLogger::logSecurityEvent(
                event: 'PICKUP_STATUS_CHANGED',
                target: "order:{$order->id}",
                details: [
                    'order_number' => $order->order_number,
                    'new_status'   => $newStatus,
                    'reason'       => $reason,
                    'actor'        => $actor?->name ?? 'System',
                ],
                level: 'info'
            );

            return $order->fresh(['branch', 'user', 'items.product']);
        });

        // Broadcast real-time status update to web operations and mobile customer
        try {
            event(new OrderStatusUpdated($updatedOrder, $actor?->role ?? 'staff', $previousStatus));
        } catch (\Throwable $e) {
            Log::warning('PickupOrderService: OrderStatusUpdated broadcast failed: ' . $e->getMessage());
        }

        return $updatedOrder;
    }

    /**
     * Verify pickup verification code or order number and complete pickup.
     *
     * @param Order $order
     * @param string $verificationInput
     * @param User|null $cashier
     * @param float|null $paidAmount
     * @return array
     */
    public function verifyAndCompletePickup(Order $order, string $verificationInput, ?User $cashier = null, ?float $paidAmount = null): array
    {
        $cleanInput = trim(strtoupper($verificationInput));
        $expectedCode = strtoupper(trim($order->pickup_verification_code ?? ''));
        $expectedOrderNum = strtoupper(trim($order->order_number ?? ''));

        // Match either verification code or order number
        if ($cleanInput !== $expectedCode && $cleanInput !== $expectedOrderNum) {
            return [
                'success' => false,
                'message' => 'Invalid pickup verification code or order number.',
            ];
        }

        if ($order->status === 'completed') {
            return [
                'success' => false,
                'message' => 'This pickup order has already been completed.',
            ];
        }

        if ($order->status === 'cancelled' || $order->status === 'no_show') {
            return [
                'success' => false,
                'message' => "Cannot complete pickup. Order is already {$order->status}.",
            ];
        }

        // If not already ready_for_pickup or customer_arrived, advance sequentially
        if (in_array($order->status, ['pending', 'confirmed', 'preparing'])) {
            $order->update(['status' => 'ready_for_pickup']);
        }

        if ($order->payment_status === Order::PAYMENT_STATUS_UNPAID && $paidAmount !== null) {
            $order->update([
                'payment_status' => Order::PAYMENT_STATUS_PAID,
                'paid_at'        => now(),
            ]);
        }

        $completedOrder = $this->transitionPickupStatus($order, 'completed', 'Verified by cashier and handed to customer', $cashier);

        return [
            'success' => true,
            'message' => 'Pickup order verified and completed successfully.',
            'order'   => $completedOrder,
        ];
    }
}
