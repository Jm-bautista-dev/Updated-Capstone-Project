<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Wastage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'branch_id',
        'user_id',
        'wastable_type',
        'wastable_id',
        'quantity',
        'unit',
        'cost_at_loss',
        'reason',
        'notes'
    ];

    public function toArray(): array
    {
        $array = parent::toArray();
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user || !$user->isAdmin()) {
            unset($array['cost_at_loss']);
        }
        return $array;
    }

    public function wastable()
    {
        return $this->morphTo();
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
