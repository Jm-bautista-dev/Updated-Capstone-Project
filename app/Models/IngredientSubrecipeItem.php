<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IngredientSubrecipeItem extends Model
{
    use HasFactory;

    protected $table = 'ingredient_subrecipe_items';

    protected $fillable = [
        'composite_ingredient_id',
        'component_ingredient_id',
        'quantity',
        'unit',
    ];

    protected $casts = [
        'quantity' => 'float',
    ];

    /**
     * The composite ingredient (parent) that has this sub-recipe item.
     */
    public function compositeIngredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'composite_ingredient_id');
    }

    /**
     * The component ingredient (raw material/micro-ingredient) used in the sub-recipe.
     */
    public function componentIngredient(): BelongsTo
    {
        return $this->belongsTo(Ingredient::class, 'component_ingredient_id');
    }
}
