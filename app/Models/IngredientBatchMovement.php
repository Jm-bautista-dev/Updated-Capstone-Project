<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class IngredientBatchMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'ingredient_id',
        'branch_id',
        'user_id',
        'movement_type', // 'stock_in', 'pos_consumption', 'order_consumption', 'waste', 'damage', 'expired_removal', 'adjustment', 'transfer_out', 'transfer_in', 'reversal', 'supplier_return'
        'quantity',
        'quantity_base',
        'unit',
        'previous_batch_quantity',
        'new_batch_quantity',
        'cost_at_movement',
        'reference_type',
        'reference_id',
        'reference_number',
        'notes',
    ];

    protected $casts = [
        'quantity'                => 'float',
        'quantity_base'           => 'float',
        'previous_batch_quantity' => 'float',
        'new_batch_quantity'      => 'float',
        'cost_at_movement'        => 'float',
    ];

    /* ── Relationships ──────────────────────────────── */

    public function batch(): BelongsTo
    {
        return $this->belongsTo(IngredientBatch::class, 'batch_id');
    }

    public function ingredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }
}
