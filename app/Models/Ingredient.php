<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'stock',
        'unit',
        'branch_id',
        'low_stock_level',
        'is_low_stock_notified',
        'is_out_of_stock_notified',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * The menu items (products) that use this ingredient.
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'menu_item_ingredients', 'ingredient_id', 'menu_item_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * The logs for this ingredient.
     */
    public function logs()
    {
        return $this->hasMany(IngredientLog::class);
    }

    /**
     * Check if ingredient is low stock.
     */
    public function isLowStock(): bool
    {
        return (float) $this->stock <= (float) $this->low_stock_level;
    }

    /**
     * Check and trigger stock alerts based on current stock.
     */
    public function checkStockAlerts(): void
    {
        $stock = (float) $this->stock;
        $lowStockLevel = (float) $this->low_stock_level;

        // Check Out of Stock
        if ($stock <= 0) {
            if (!$this->is_out_of_stock_notified) {
                IngredientLog::create([
                    'ingredient_id' => $this->id,
                    'user_id' => null, // System generated
                    'change_qty' => 0,
                    'reason' => 'Out of Stock Alert',
                ]);
                // Use update() to save flags without triggering events in case we add them later
                $this->update([
                    'is_out_of_stock_notified' => true,
                    'is_low_stock_notified' => true,
                ]);
            }
        } 
        // Check Low Stock
        elseif ($stock <= $lowStockLevel) {
            if (!$this->is_low_stock_notified) {
                IngredientLog::create([
                    'ingredient_id' => $this->id,
                    'user_id' => null,
                    'change_qty' => 0,
                    'reason' => 'Low Stock Alert',
                ]);
                $this->update([
                    'is_low_stock_notified' => true,
                    'is_out_of_stock_notified' => false,
                ]);
            } else {
                 if ($this->is_out_of_stock_notified) {
                     $this->update(['is_out_of_stock_notified' => false]);
                 }
            }
        } 
        // Reset flags if stock is healthy
        else {
            if ($this->is_low_stock_notified || $this->is_out_of_stock_notified) {
                $this->update([
                    'is_low_stock_notified' => false,
                    'is_out_of_stock_notified' => false,
                ]);
            }
        }
    }
}
