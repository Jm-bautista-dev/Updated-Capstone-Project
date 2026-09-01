<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\DeliveryAttempt;

class CustomerTrustService
{
    /**
     * Compute comprehensive customer trust & delivery statistics directly from authoritative DB records.
     */
    public function getCustomerMetrics(User|int $userOrId, ?string $fallbackPhone = null): array
    {
        $userId = $userOrId instanceof User ? $userOrId->id : (int) $userOrId;
        $user = $userOrId instanceof User ? $userOrId : User::find($userId);
        $phone = $user?->mobile_number ?? $fallbackPhone;

        // Query base orders for this customer (scoped by user_id OR verified mobile_number)
        $ordersQuery = Order::query()->where(function ($q) use ($userId, $phone) {
            if ($userId > 0) {
                $q->where('user_id', $userId);
            }
            if (!empty($phone)) {
                $q->orWhere('contact_number', $phone);
            }
        });

        $allOrders = $ordersQuery->with(['deliveryAttempts'])->get();
        $orderIds = $allOrders->pluck('id')->filter()->all();

        $totalOrders = $allOrders->count();
        $completedOrders = $allOrders->where('status', 'delivered')->count();

        // Successful COD orders
        $successfulCodOrders = $allOrders->filter(function ($order) {
            $isCod = (bool) ($order->is_cod || in_array(strtolower((string) $order->payment_method), ['cash', 'cod', 'cash_on_delivery']));
            return $isCod && $order->status === 'delivered';
        })->count();

        // Query all delivery attempts linked to this customer's orders or phone
        $attempts = DeliveryAttempt::where(function ($q) use ($orderIds, $phone) {
            if (!empty($orderIds)) {
                $q->whereIn('order_id', $orderIds);
            }
            if (!empty($phone)) {
                $q->orWhereHas('delivery', function ($dq) use ($phone) {
                    $dq->where('customer_phone', $phone);
                });
            }
        })->get();

        // Categorize attempts
        $customerRefusals = $attempts->where('failure_reason', 'CUSTOMER_REFUSED_ORDER')->count();
        $customerUnavailable = $attempts->whereIn('failure_reason', ['CUSTOMER_UNAVAILABLE', 'CUSTOMER_UNREACHABLE'])->count();
        $invalidAddress = $attempts->where('failure_reason', 'INVALID_ADDRESS')->count();
        $customerRequestedCancellation = $attempts->where('failure_reason', 'CUSTOMER_REQUESTED_CANCELLATION')->count();

        // Customer attributable failed attempts count
        $customerAttributableFailures = $attempts->filter(fn($a) => $a->isCustomerAttributable())->count();

        // Business/Rider/System failures (strictly NOT customer fault)
        $businessRiderFailures = $attempts->whereIn('failure_category', ['rider_issue', 'business_delay', 'system_issue', 'other'])->count();

        // Cancelled orders where customer cancelled
        $customerCancellations = $allOrders->filter(function ($order) {
            return $order->status === 'cancelled' && (
                $order->cancellation_reason === 'Cancelled by customer' ||
                str_contains(strtolower((string) $order->cancellation_reason), 'customer')
            );
        })->count();

        // Failed COD orders (where delivery status is failed_delivery or cancelled due to customer refusal)
        $failedCodOrders = $allOrders->filter(function ($order) use ($attempts) {
            $isCod = (bool) ($order->is_cod || in_array(strtolower((string) $order->payment_method), ['cash', 'cod', 'cash_on_delivery']));
            if (!$isCod) return false;

            $hasCustomerFailure = $attempts->where('order_id', $order->id)->contains(fn($a) => $a->isCustomerAttributable());
            return $hasCustomerFailure || ($order->status === 'cancelled' && str_contains(strtolower((string) $order->cancellation_reason), 'refused'));
        })->count();

        // Consecutive successful deliveries (most recent orders in descending order)
        $consecutiveSuccessful = 0;
        $sortedOrders = $allOrders->sortByDesc('created_at');
        foreach ($sortedOrders as $ord) {
            if ($ord->status === 'delivered') {
                $consecutiveSuccessful++;
            } elseif ($ord->status === 'cancelled' || $ord->status === 'failed_delivery') {
                // If it was cancelled or failed due to customer issue, break sequence
                $orderAttempts = $attempts->where('order_id', $ord->id);
                if ($orderAttempts->contains(fn($a) => $a->isCustomerAttributable())) {
                    break;
                }
            }
        }

        // Active orders currently in progress
        $activeStatuses = config('cod_security.active_order_statuses', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit']);
        $activeOrdersCount = $allOrders->whereIn('status', $activeStatuses)->count();

        return [
            'user_id'                         => $userId,
            'phone'                           => $phone,
            'is_phone_verified'               => $user ? $user->isPhoneVerified() : false,
            'total_orders'                    => $totalOrders,
            'completed_orders'                => $completedOrders,
            'successful_cod_orders'           => $successfulCodOrders,
            'failed_cod_orders'               => $failedCodOrders,
            'customer_refusals'               => $customerRefusals,
            'customer_unavailable_events'     => $customerUnavailable,
            'invalid_address_events'          => $invalidAddress,
            'customer_requested_cancellations'=> $customerRequestedCancellation,
            'customer_cancellations'          => $customerCancellations,
            'customer_attributable_failures'  => $customerAttributableFailures,
            'business_rider_system_failures'  => $businessRiderFailures,
            'consecutive_successful_orders'   => $consecutiveSuccessful,
            'active_orders_count'             => $activeOrdersCount,
        ];
    }
}
