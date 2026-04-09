<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Product extends Model
{
    use BelongsToBranch;
    protected $fillable = ['name', 'sku', 'selling_price', 'cost_price', 'category_id', 'image_path', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'menu_item_ingredients', 'menu_item_id', 'ingredient_id')
                    ->withPivot('quantity_required')
                    ->withTimestamps();
    }

    /**
     * Compute available stock based on ingredient availability (branch-scoped).
     * If branch_id is set, only considers that branch's ingredient stock.
     */
    public function getComputedStockAttribute()
    {
        $ingredients = $this->ingredients;

        if ($ingredients->isEmpty()) {
            return 0;
        }

        $possibleAmounts = [];

        foreach ($ingredients as $ingredient) {
            $required = (float) $ingredient->pivot->quantity_required;
            if ($required <= 0) continue;

            // Assumes the linked ingredients are already branch-scoped or are the master records
            $available = (float) $ingredient->stock;
            
            $possibleAmounts[] = floor($available / $required);
        }

        return empty($possibleAmounts) ? 0 : (int) min($possibleAmounts);
    }
}
