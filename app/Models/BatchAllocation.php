<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BatchAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'ingredient_id',
        'branch_id',
        'allocatable_type',
        'allocatable_id',
        'quantity_base',
        'unit',
        'unit_cost',
        'total_cost',
        'reversed_quantity_base',
        'is_reversed',
    ];

    protected $casts = [
        'quantity_base'          => 'float',
        'unit_cost'              => 'float',
        'total_cost'             => 'float',
        'reversed_quantity_base' => 'float',
        'is_reversed'            => 'boolean',
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

    public function allocatable(): MorphTo
    {
        return $this->morphTo();
    }
}
