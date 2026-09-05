<?php

namespace App\Services;

use App\Events\PickupPrepDue;
use App\Models\Branch;
use App\Models\Order;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PickupPreparationService
{
    const OVERDUE_GRACE_MINUTES = 5;

    public function __construct(
        protected PickupOrderService $pickupOrderService
    ) {
    }

    /**
     * Scan and broadcast preparation reminders for pickup orders that have entered their preparation window.
     * Guaranteed idempotent and safe against multiple concurrent background workers.
     *
     * @param int|null $branchId
     * @return array
     */
    public function evaluateAndDispatchReminders(?int $branchId = null): array
    {
        $nowUtc = Carbon::now('UTC');

        // 1. Primary preparation start reminders: prep_start_at <= now AND prep_notified_at IS NULL
        $query = Order::with(['branch', 'items'])
            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNull('prep_notified_at')
            ->whereNotNull('scheduled_pickup_at')
            ->where('prep_start_at', '<=', $nowUtc);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Order> $dueOrders */
        $dueOrders = $query->get();
        $dispatched = [];

        /** @var Order $order */
        foreach ($dueOrders as $order) {
            // Atomic update to guard against race conditions
            $affected = Order::where('id', $order->id)
                ->whereNull('prep_notified_at')
                ->whereIn('status', ['pending', 'confirmed'])
                ->update(['prep_notified_at' => Carbon::now('UTC')]);

            if ($affected > 0) {
                /** @var Order $freshOrder */
                $freshOrder = Order::with(['branch', 'items'])->find($order->id);
                if ($freshOrder) {
                    try {
                        event(new PickupPrepDue($freshOrder));
                    } catch (\Throwable $e) {
                        Log::warning("PickupPreparationService: Broadcast failed for order #{$order->id}: " . $e->getMessage());
                    }
                    $dispatched[] = $freshOrder;
                }
            }
        }

        // 2. Optional secondary reminder: 10 minutes before pickup if preparation hasn't started yet
        $secondaryQuery = Order::with(['branch', 'items'])
            ->where('fulfillment_type', Order::FULFILLMENT_PICKUP)
            ->whereIn('status', ['pending', 'confirmed'])
            ->whereNotNull('prep_notified_at')
            ->whereNull('prep_due_notified_secondary_at')
            ->whereNotNull('scheduled_pickup_at')
            ->where('scheduled_pickup_at', '<=', $nowUtc->copy()->addMinutes(10));

        if ($branchId) {
            $secondaryQuery->where('branch_id', $branchId);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, Order> $secondaryDueOrders */
        $secondaryDueOrders = $secondaryQuery->get();
        /** @var Order $order */
        foreach ($secondaryDueOrders as $order) {
            $affected = Order::where('id', $order->id)
                ->whereNull('prep_due_notified_secondary_at')
                ->whereIn('status', ['pending', 'confirmed'])
                ->update(['prep_due_notified_secondary_at' => Carbon::now('UTC')]);

            if ($affected > 0) {
                /** @var Order $freshOrder */
                $freshOrder = Order::with(['branch', 'items'])->find($order->id);
                if ($freshOrder) {
                    try {
                        event(new PickupPrepDue($freshOrder));
                    } catch (\Throwable $e) {
                        Log::warning("PickupPreparationService: Secondary broadcast failed for order #{$order->id}: " . $e->getMessage());
                    }
                }
            }
        }

        return [
            'dispatched_count' => count($dispatched),
            'orders'           => $dispatched,
        ];
    }

    /**
     * Start kitchen preparation for a pickup order with optional early override guard.
     *
     * @param Order $order
     * @param User $actor
     * @param bool $isEarlyOverride
     * @param string|null $reason
     * @return Order
     * @throws \InvalidArgumentException
     */
    public function startPreparation(Order $order, User $actor, bool $isEarlyOverride = false, ?string $reason = null): Order
    {
        if (!$order->isPickup()) {
            throw new \InvalidArgumentException("Order #{$order->order_number} is not a pickup order.");
        }

        $now = Carbon::now('UTC');
        $isEarly = false;

        if ($order->prep_start_at) {
            $prepTimeUtc = $order->prep_start_at instanceof \DateTimeInterface
                ? Carbon::instance($order->prep_start_at)->setTimezone('UTC')
                : Carbon::parse($order->prep_start_at, 'UTC')->setTimezone('UTC');

            if (Carbon::now('UTC')->lt($prepTimeUtc)) {
                $isEarly = true;
                if (!$isEarlyOverride) {
                    $tz = PickupOrderService::DEFAULT_TIMEZONE;
                    $pickupDisplay = $order->scheduled_pickup_display ?: 'scheduled time';
                    $prepDisplay = $order->prep_start_at instanceof \DateTimeInterface
                        ? Carbon::instance($order->prep_start_at)->setTimezone($tz)->format('g:i A')
                        : Carbon::parse($order->prep_start_at, 'UTC')->setTimezone($tz)->format('g:i A');

                    throw new \InvalidArgumentException(
                        "Order #{$order->order_number} is scheduled for {$pickupDisplay} (prep window begins at {$prepDisplay}). " .
                        "Early preparation override must be confirmed."
                    );
                }
            }
        }

        // Record early preparation override metadata if applicable
        if ($isEarly && $isEarlyOverride) {
            $order->update([
                'is_early_prep_override' => true,
                'early_prep_actor_id'    => $actor->id,
            ]);
        }

        $auditReason = $reason ?: ($isEarly ? "Early preparation authorized by {$actor->name}" : "Kitchen preparation started");

        return $this->pickupOrderService->transitionPickupStatus(
            order: $order,
            newStatus: 'preparing',
            reason: $auditReason,
            actor: $actor
        );
    }

    /**
     * Recalculate preparation schedule and reset notifications when an order is rescheduled.
     *
     * @param Order $order
     * @param Carbon $newScheduledPickupAt
     * @param int|null $leadTimeMinutes
     * @return Order
     */
    public function reschedulePickup(Order $order, Carbon $newScheduledPickupAt, ?int $leadTimeMinutes = null): Order
    {
        $branch = $order->branch ?? Branch::find($order->branch_id);
        $leadTime = $leadTimeMinutes ?? (int) ($order->estimated_prep_time_minutes ?: ($branch?->pickup_lead_time_minutes ?? 20));

        $scheduledUtc = $newScheduledPickupAt->copy()->utc();
        $prepStartUtc = $scheduledUtc->copy()->subMinutes($leadTime);

        $order->update([
            'scheduled_pickup_at'            => $scheduledUtc,
            'estimated_prep_time_minutes'    => $leadTime,
            'prep_start_at'                  => $prepStartUtc,
            'prep_notified_at'               => null,
            'prep_due_notified_secondary_at' => null,
            'is_early_prep_override'         => false,
            'early_prep_actor_id'            => null,
        ]);

        return $order->fresh(['branch', 'items']);
    }

    /**
     * Invalidate preparation reminders if order is cancelled.
     *
     * @param Order $order
     * @return void
     */
    public function invalidateOnCancellation(Order $order): void
    {
        $order->update([
            'prep_notified_at'               => Carbon::now('UTC'), // Mark as processed so it won't fire
            'prep_due_notified_secondary_at' => Carbon::now('UTC'),
        ]);
    }

    /**
     * Get real-time queue classification and metrics.
     *
     * @param int|null $branchId
     * @return array
     */
    public function getQueueMetrics(?int $branchId = null): array
    {
        $nowUtc = Carbon::now('UTC');
        $tz = PickupOrderService::DEFAULT_TIMEZONE;
        $nowLocal = Carbon::now($tz);

        $base = Order::where('fulfillment_type', Order::FULFILLMENT_PICKUP);
        if ($branchId) {
            $base->where('branch_id', $branchId);
        }

        $todayStartLocal = $nowLocal->copy()->startOfDay();
        $todayEndLocal   = $nowLocal->copy()->endOfDay();
        $todayStartUtc   = $todayStartLocal->copy()->utc();
        $todayEndUtc     = $todayEndLocal->copy()->utc();

        $todayFilter = function ($q) use ($todayStartUtc, $todayEndUtc) {
            $q->whereBetween('scheduled_pickup_at', [$todayStartUtc, $todayEndUtc]);
        };

        // Orders awaiting prep window (future scheduled)
        $awaitingPrep = (clone $base)->whereIn('status', ['pending', 'confirmed'])
            ->where($todayFilter)
            ->where('prep_start_at', '>', $nowUtc)
            ->count();

        // Orders due for prep now (prep_start_at <= now, not yet in preparing)
        $dueForPrep = (clone $base)->whereIn('status', ['pending', 'confirmed'])
            ->where('prep_start_at', '<=', $nowUtc)
            ->count();

        // Overdue for preparation (> 5 minutes past prep_start_at and still pending/confirmed)
        $overdueThresholdUtc = $nowUtc->copy()->subMinutes(self::OVERDUE_GRACE_MINUTES);
        $overduePrep = (clone $base)->whereIn('status', ['pending', 'confirmed'])
            ->where('prep_start_at', '<=', $overdueThresholdUtc)
            ->count();

        $preparing = (clone $base)->where('status', 'preparing')->count();
        $ready = (clone $base)->whereIn('status', ['ready_for_pickup', 'customer_arrived'])->count();
        $completedToday = (clone $base)->where('status', 'completed')
            ->where(function ($q) use ($todayStartLocal, $todayEndLocal, $todayStartUtc, $todayEndUtc) {
                $q->whereBetween('pickup_completed_at', [$todayStartLocal, $todayEndLocal])
                  ->orWhereBetween('pickup_completed_at', [$todayStartUtc, $todayEndUtc]);
            })
            ->count();

        return [
            'awaiting_prep'   => $awaitingPrep,
            'due_for_prep'    => $dueForPrep,
            'overdue_prep'    => $overduePrep,
            'preparing'       => $preparing,
            'ready'           => $ready,
            'completed_today' => $completedToday,
        ];
    }
}
