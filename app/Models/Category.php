<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;



/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Category extends Model
{
    use SoftDeletes;
    protected $fillable = ['name', 'description', 'image_path', 'created_by'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Many-to-Many relationship with branches.
     */
    public function branches()
    {
        return $this->belongsToMany(Branch::class, 'branch_category');
    }
}
