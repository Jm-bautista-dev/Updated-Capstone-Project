<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToBranch;

/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Category extends Model
{
    protected $fillable = ['name', 'description', 'image_path', 'branch_id', 'created_by'];

    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_category');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
