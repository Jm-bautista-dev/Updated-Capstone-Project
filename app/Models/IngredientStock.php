<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Branch-scoped stock for a global ingredient.
 *
 * One row = one ingredient in one branch.
 *
 * @property int     $id
 * @property int     $ingredient_id
 * @property int     $branch_id
 * @property float   $stock
 * @property float   $low_stock_level
 * @property bool    $is_low_stock_notified
 * @property bool    $is_out_of_stock_notified
 */
class IngredientStock extends Model
{
    protected $fillable = [
        'ingredient_id',
        'branch_id',
        'stock',
        'low_stock_level',
        'is_low_stock_notified',
        'is_out_of_stock_notified',
    ];

    protected $casts = [
        'stock'                    => 'float',
        'low_stock_level'          => 'float',
        'is_low_stock_notified'    => 'boolean',
        'is_out_of_stock_notified' => 'boolean',
    ];

    /* ── Relationships ──────────────────────────────── */

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /* ── Helpers ────────────────────────────────────── */

    /**
     * Is this stock level considered low?
     */
    public function isLowStock(): bool
    {
        return (float) $this->stock <= (float) $this->low_stock_level && (float) $this->stock > 0;
    }

    /**
     * Is this stock completely depleted?
     */
    public function isOutOfStock(): bool
    {
        return (float) $this->stock <= 0;
    }

    /**
     * Safely decrement stock. Throws if insufficient.
     *
     * @throws \Exception
     */
    public function deduct(float $amount): void
    {
        if ((float) $this->stock < $amount) {
            throw new \Exception(
                "Insufficient stock for ingredient '{$this->ingredient->name}' in branch '{$this->branch->name}'. " .
                "Available: {$this->stock} {$this->ingredient->unit}, Required: {$amount} {$this->ingredient->unit}."
            );
        }

        $this->decrement('stock', $amount);
        $this->refresh();
    }
}
