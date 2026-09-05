<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Sale extends Model
{
    use HasFactory, BelongsToBranch;

    protected $fillable = [
        'order_id',
        'order_number',
        'user_id',
        'branch_id',
        'type',
        'subtotal',
        'discount',
        'discount_type',
        'discount_details',
        'delivery_fee',
        'total',
        'cost_total',
        'profit',
        'paid_amount',
        'change_amount',
        'payment_method',
        'status',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'subtotal'         => 'decimal:2',
        'discount'         => 'decimal:2',
        'discount_details' => 'array',
        'delivery_fee'     => 'decimal:2',
        'total'            => 'decimal:2',
        'cost_total'       => 'decimal:2',
        'profit'           => 'decimal:2',
        'paid_amount'      => 'decimal:2',
        'change_amount'    => 'decimal:2',
    ];

    protected $appends = [
        'product_revenue',
        'delivery_fee_amount',
        'delivery_fee_breakdown',
        'cashier_name',
        'customer_name',
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !method_exists($user, 'isAdmin') || !$user->isAdmin()) {
            unset(
                $array['cost_total'],
                $array['profit']
            );
        }
        return $array;
    }

    /**
     * Authoritative Product Revenue (Net Product Sales: Subtotal - Discount, excluding delivery fee).
     */
    public function getProductRevenueAttribute(): float
    {
        $discount = (float) ($this->discount ?? 0);

        if ($this->subtotal !== null) {
            return max(0.0, (float) $this->subtotal - $discount);
        }

        if ($this->relationLoaded('items') && $this->items->isNotEmpty()) {
            return max(0.0, (float) $this->items->sum('subtotal') - $discount);
        }

        $deliveryFee = (float) ($this->delivery_fee ?? $this->delivery?->delivery_fee ?? 0);
        return max(0.0, (float) $this->total - $deliveryFee);
    }

    /**
     * Authoritative Delivery Fee amount.
     */
    public function getDeliveryFeeAmountAttribute(): float
    {
        if ($this->delivery_fee !== null) {
            return (float) $this->delivery_fee;
        }

        return (float) ($this->delivery?->delivery_fee ?? 0);
    }

    /**
     * Authoritative delivery fee breakdown & sanity metrics.
     */
    public function getDeliveryFeeBreakdownAttribute(): ?array
    {
        $fee = (float) ($this->delivery_fee ?? $this->delivery?->delivery_fee ?? 0);
        if ($fee <= 0 && $this->type !== 'delivery') {
            return null;
        }

        $distance = $this->delivery?->distance_km !== null ? (float) $this->delivery->distance_km : null;
        $branch = $this->branch ?: $this->order?->branch;
        $subtotal = $this->subtotal !== null ? (float) $this->subtotal : max(0.0, (float) $this->total - $fee);

        if ($branch && $distance !== null) {
            /** @var \App\Services\DeliveryFeeService $service */
            $service = app(\App\Services\DeliveryFeeService::class);
            return $service->calculateFee($branch, $distance, $subtotal);
        }

        $warningRatio = (float) config('delivery.delivery_fee_warning_ratio', 0.75);
        $ratio = $subtotal > 0 ? round(($fee / $subtotal) * 100, 2) : null;
        $isHighRatio = $ratio !== null && ($ratio / 100) >= $warningRatio;

        return [
            'delivery_fee'        => $fee,
            'base_fee'            => (float) ($branch?->base_delivery_fee ?? 49.00),
            'actual_distance_km'  => $distance,
            'fee_to_subtotal_pct' => $ratio,
            'is_high_fee_ratio'   => $isHighRatio,
            'warning_message'     => $isHighRatio
                ? "Delivery fee (₱" . number_format($fee, 2) . ") is {$ratio}% of food subtotal (₱" . number_format($subtotal, 2) . ")."
                : null,
        ];
    }

    /**
     * Authoritative Cashier Name.
     * Returns the staff cashier/admin's name who processed the transaction.
     * For transactions from online channels or customer self-checkout without staff cashier, returns 'Online Order'.
     */
    public function getCashierNameAttribute(): string
    {
        // 1. If user relation is loaded or exists and is a customer, it is NOT a cashier
        if ($this->cashier && $this->cashier->isCustomer()) {
            return 'Online Order';
        }

        // 2. If the order explicitly came from an online source
        if ($this->order && in_array($this->order->order_source, [Order::SOURCE_MOBILE_APP, Order::SOURCE_FACEBOOK_MESSENGER, 'online'], true)) {
            if (!$this->cashier || $this->cashier->isCustomer()) {
                return 'Online Order';
            }
        }

        // 3. If the user attached is a staff employee (cashier, admin, super_admin)
        if ($this->cashier && ($this->cashier->isCashier() || $this->cashier->isAdmin() || $this->cashier->isSuperAdmin())) {
            return $this->cashier->name;
        }

        // 4. If transaction was created via online order delivery or without staff assignment
        if ($this->order_id && (!$this->cashier || $this->cashier->isCustomer())) {
            return 'Online Order';
        }

        return $this->cashier?->name ?? ($this->order_id ? 'Online Order' : 'N/A');
    }

    /**
     * Authoritative Customer Name.
     * Resolves the actual customer name from Order, Delivery, discount details, or Customer User account.
     * Defaults to 'Walk-in Customer' for in-store counter transactions without customer registration.
     */
    public function getCustomerNameAttribute(): string
    {
        // 1. Check associated Order customer info
        if ($this->order) {
            if (!empty(trim((string) $this->order->customer_name))) {
                return trim($this->order->customer_name);
            }
            if ($this->order->user && !empty(trim((string) $this->order->user->name))) {
                return trim($this->order->user->name);
            }
        }

        // 2. Check associated Delivery record
        if ($this->delivery && !empty(trim((string) $this->delivery->customer_name))) {
            return trim($this->delivery->customer_name);
        }

        // 3. Check discount_details (e.g. Senior Citizen / PWD / Student customer name)
        if (!empty($this->discount_details) && is_array($this->discount_details)) {
            if (!empty($this->discount_details['customer_name'])) {
                return trim($this->discount_details['customer_name']);
            }
        }

        // 4. Check user if user is a customer
        if ($this->user && $this->user->isCustomer()) {
            return trim($this->user->name);
        }

        return 'Walk-in Customer';
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function printJobs()
    {
        return $this->hasMany(PrintJob::class);
    }

    public function delivery()
    {
        return $this->hasOne(Delivery::class);
    }
}
