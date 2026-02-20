<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $fillable = ['name', 'sku', 'selling_price', 'cost_price', 'category_id', 'image_path'];

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
     * Compute available stock based on ingredient availability.
     */
    public function getComputedStockAttribute()
    {
        $ingredients = $this->ingredients;
        
        if ($ingredients->isEmpty()) {
            return 0; // No recipe, no stock
        }

        $possibleAmounts = [];

        foreach ($ingredients as $ingredient) {
            $required = (float) $ingredient->pivot->quantity_required;
            if ($required <= 0) continue;
            
            $available = (float) $ingredient->stock;
            $possibleAmounts[] = floor($available / $required);
        }

        return empty($possibleAmounts) ? 0 : (int) min($possibleAmounts);
    }
}
