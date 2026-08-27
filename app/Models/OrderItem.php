<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'price',       // legacy column — kept for backward compat, equals unit_price
        'unit_price',  // price per single unit at purchase time (source of truth)
        'line_total',  // unit_price * quantity (source of truth)
        'product_name',// snapshot of product name at purchase time
        'image_path',  // snapshot of product image at purchase time
        'notes',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'quantity'   => 'integer',
        'price'      => 'float',
        'unit_price' => 'float',
        'line_total' => 'float',
    ];

    /**
     * Accessor: always return a reliable unit price regardless of which column is populated.
     */
    public function getUnitPriceAttribute(?float $value): float
    {
        return (float) ($value ?: $this->attributes['price'] ?? 0);
    }

    /**
     * Accessor: always return a reliable line total.
     */
    public function getLineTotalAttribute(?float $value): float
    {
        if ($value) {
            return (float) $value;
        }
        $qty   = (int) ($this->attributes['quantity'] ?? 1);
        $price = (float) ($this->attributes['unit_price'] ?? $this->attributes['price'] ?? 0);
        return $price * $qty;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
