<?php

namespace App\Services;

use App\Models\User;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\DeliveryAttempt;
use Illuminate\Support\Carbon;

class CustomerTrustService
{
    /**
     * Compute comprehensive customer trust & delivery statistics directly from authoritative DB records.
     * Uses a configurable rolling window (default 60 days) for active risk determination while
     * preserving full lifetime history for audit and super admin dashboards.
     */
    public function getCustomerMetrics(User|int $userOrId, ?string $fallbackPhone = null): array
    {
        $userId = $userOrId instanceof User ? $userOrId->id : (int) $userOrId;
        $user = $userOrId instanceof User ? $userOrId : User::find($userId);
        $phone = $user?->mobile_number ?? $fallbackPhone;

        $windowDays = (int) config('cod_security.rolling_window_days', 60);
        $windowCutoff = Carbon::now()->subDays($windowDays);

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

        $lifetimeOrders = $allOrders->count();
        $lifetimeCompletedOrders = $allOrders->where('status', 'delivered')->count();

        // Recent orders within rolling window
        $recentOrders = $allOrders->filter(fn($o) => $o->created_at && Carbon::parse($o->created_at)->gte($windowCutoff));
        $recentOrdersCount = $recentOrders->count();
        $recentCompletedOrders = $recentOrders->where('status', 'delivered')->count();

        // Successful COD orders
        $successfulCodFilter = function ($order) {
            $isCod = (bool) ($order->is_cod || in_array(strtolower((string) $order->payment_method), ['cash', 'cod', 'cash_on_delivery']));
            return $isCod && $order->status === 'delivered';
        };
        $lifetimeSuccessfulCodOrders = $allOrders->filter($successfulCodFilter)->count();
        $recentSuccessfulCodOrders = $recentOrders->filter($successfulCodFilter)->count();

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

        $recentAttempts = $attempts->filter(fn($a) => $a->created_at && Carbon::parse($a->created_at)->gte($windowCutoff));

        // Lifetime Categorization
        $lifetimeRefusals = $attempts->where('failure_reason', 'CUSTOMER_REFUSED_ORDER')->count();
        $lifetimeAttributableFailures = $attempts->filter(fn($a) => $a->isCustomerAttributable())->count();
        $lifetimeBusinessRiderFailures = $attempts->whereIn('failure_category', ['rider_issue', 'business_delay', 'system_issue', 'other'])->count();

        // Recent Rolling Window Categorization
        $recentRefusals = $recentAttempts->where('failure_reason', 'CUSTOMER_REFUSED_ORDER')->count();
        $recentUnavailable = $recentAttempts->whereIn('failure_reason', ['CUSTOMER_UNAVAILABLE', 'CUSTOMER_UNREACHABLE'])->count();
        $recentInvalidAddress = $recentAttempts->where('failure_reason', 'INVALID_ADDRESS')->count();
        $recentCustomerRequestedCancellation = $recentAttempts->where('failure_reason', 'CUSTOMER_REQUESTED_CANCELLATION')->count();
        $recentAttributableFailures = $recentAttempts->filter(fn($a) => $a->isCustomerAttributable())->count();
        $recentBusinessRiderFailures = $recentAttempts->whereIn('failure_category', ['rider_issue', 'business_delay', 'system_issue', 'other'])->count();

        // Cancelled orders where customer cancelled
        $customerCancellations = $allOrders->filter(function ($order) {
            return $order->status === 'cancelled' && (
                $order->cancellation_reason === 'Cancelled by customer' ||
                str_contains(strtolower((string) $order->cancellation_reason), 'customer')
            );
        })->count();

        // Failed COD orders
        $failedCodFilter = function ($order) use ($attempts) {
            $isCod = (bool) ($order->is_cod || in_array(strtolower((string) $order->payment_method), ['cash', 'cod', 'cash_on_delivery']));
            if (!$isCod) return false;

            $hasCustomerFailure = $attempts->where('order_id', $order->id)->contains(fn($a) => $a->isCustomerAttributable());
            return $hasCustomerFailure || ($order->status === 'cancelled' && str_contains(strtolower((string) $order->cancellation_reason), 'refused'));
        };
        $lifetimeFailedCodOrders = $allOrders->filter($failedCodFilter)->count();
        $recentFailedCodOrders = $recentOrders->filter($failedCodFilter)->count();

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

        // Active orders currently in progress (strictly excluding completed/delivered/cancelled/failed)
        $activeStatuses = config('cod_security.active_order_statuses', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'assigned_to_rider', 'picked_up', 'in_transit', 'cancellation_requested']);
        $activeOrdersCount = $allOrders->whereIn('status', $activeStatuses)->count();

        return [
            'user_id'                         => $userId,
            'phone'                           => $phone,
            'is_phone_verified'               => $user ? $user->isPhoneVerified() : false,
            
            // Rolling Window Metrics (Used for Current Active Risk)
            'total_orders'                    => $recentOrdersCount > 0 ? $recentOrdersCount : $lifetimeOrders,
            'completed_orders'                => $recentCompletedOrders,
            'successful_cod_orders'           => $recentSuccessfulCodOrders,
            'failed_cod_orders'               => $recentFailedCodOrders,
            'customer_refusals'               => $recentRefusals,
            'customer_unavailable_events'     => $recentUnavailable,
            'invalid_address_events'          => $recentInvalidAddress,
            'customer_requested_cancellations'=> $recentCustomerRequestedCancellation,
            'customer_attributable_failures'  => $recentAttributableFailures,
            'business_rider_system_failures'  => $recentBusinessRiderFailures,
            'consecutive_successful_orders'   => $consecutiveSuccessful,
            'active_orders_count'             => $activeOrdersCount,
            'rolling_window_days'             => $windowDays,

            // Lifetime Historical Metrics (For Auditing & SuperAdmin Reporting)
            'lifetime_orders'                 => $lifetimeOrders,
            'lifetime_completed_orders'       => $lifetimeCompletedOrders,
            'lifetime_successful_cod_orders'  => $lifetimeSuccessfulCodOrders,
            'lifetime_failed_cod_orders'      => $lifetimeFailedCodOrders,
            'lifetime_refusals'               => $lifetimeRefusals,
            'lifetime_customer_failures'      => $lifetimeAttributableFailures,
            'lifetime_business_failures'      => $lifetimeBusinessRiderFailures,
            'customer_cancellations'          => $customerCancellations,
        ];
    }
}

