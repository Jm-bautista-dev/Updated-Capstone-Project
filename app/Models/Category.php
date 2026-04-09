<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Category extends Model
{
    use BelongsToBranch;
    protected $fillable = ['name', 'description', 'image_path', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
