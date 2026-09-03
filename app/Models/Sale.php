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
