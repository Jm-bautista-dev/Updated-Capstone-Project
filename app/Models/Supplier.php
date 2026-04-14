<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

use App\Traits\BelongsToBranch;

/**
 * Supplier Model
 *
 * Represents a supply chain partner linked to ingredients in the inventory.
 * Uses soft deletes for audit safety — suppliers are never permanently removed.
 *
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Supplier extends Model
{
    use HasFactory, BelongsToBranch, SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'status',
        'last_delivery_at',
        'branch_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'last_delivery_at' => 'datetime',
    ];

    /* ------------------------------------------------------------------ */
    /*  Relationships                                                      */
    /* ------------------------------------------------------------------ */

    /** The branch this supplier is assigned to. */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /** The ingredients (raw materials) supplied by this supplier. */
    public function ingredients(): BelongsToMany
    {
        return $this->belongsToMany(Ingredient::class, 'supplier_ingredient')
                    ->withTimestamps();
    }

    /** The user who originally created this supplier record. */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The user who last updated this supplier record. */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /* ------------------------------------------------------------------ */
    /*  Computed helpers                                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Count how many linked ingredients are at critical stock level in this branch.
     * An ingredient is critical if its branch-scoped stock <= low_stock_level.
     */
    public function getCriticalIngredientCountAttribute(): int
    {
        $branchId = $this->branch_id;
        if (!$branchId) return 0;

        return $this->ingredients->filter(function ($ingredient) use ($branchId) {
            $stockRow = $ingredient->stocks()->where('branch_id', $branchId)->first();
            return $stockRow ? $stockRow->isLowStock() || $stockRow->isOutOfStock() : true;
        })->count();
    }
}
