<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;



/**
 * @mixin \Illuminate\Database\Eloquent\Builder
 */
class Category extends Model
{
    protected $fillable = ['name', 'description', 'image_path', 'created_by'];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
