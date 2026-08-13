<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

/**
 * @mixin Builder
 */
class ProductReview extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'order_id',
        'order_item_id',
        'branch_id',
        'rating',
        'comment',
        'status',
        'admin_response',
        'admin_response_by',
        'admin_responded_at',
    ];

    protected $casts = [
        'rating'             => 'integer',
        'admin_responded_at' => 'datetime',
    ];

    const STATUS_PUBLISHED = 'published';
    const STATUS_HIDDEN    = 'hidden';
    const STATUS_FLAGGED   = 'flagged';
    const STATUS_PENDING   = 'pending';

    /* ── Relationships ─────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function responder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_response_by');
    }

    /* ── Scopes ────────────────────────────────────── */

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PUBLISHED);
    }

    public function scopeFlagged(Builder $query): Builder
    {
        return $query->whereIn('status', [self::STATUS_FLAGGED, self::STATUS_PENDING]);
    }
}
