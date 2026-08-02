<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestockRequest extends Model
{
    protected $fillable = [
        'branch_id',
        'user_id',
        'item_type',
        'item_id',
        'quantity',
        'unit',
        'status',
    ];

    protected $appends = ['item_name'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getItemNameAttribute()
    {
        if ($this->item_type === 'ingredient') {
            $ing = Ingredient::find($this->item_id);
            return $ing ? $ing->name : 'Unknown Ingredient';
        }
        $prod = Product::find($this->item_id);
        return $prod ? $prod->name : 'Unknown Product';
    }
}
