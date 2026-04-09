<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class MenuItemIngredient extends Pivot
{
    protected $table = 'menu_item_ingredients';

    protected $fillable = [
        'menu_item_id',
        'ingredient_id',
        'quantity_required',
    ];

    public $incrementing = true;
}
