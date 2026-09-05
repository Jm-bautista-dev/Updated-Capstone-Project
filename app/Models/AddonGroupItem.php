<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class AddonGroupItem extends Pivot
{
    protected $table = 'addon_group_items';

    protected $fillable = [
        'addon_group_id',
        'add_on_id',
        'price_override',
        'sort_order',
    ];

    protected $casts = [
        'price_override' => 'float',
        'sort_order'     => 'integer',
    ];
}
