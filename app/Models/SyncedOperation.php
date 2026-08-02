<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncedOperation extends Model
{
    protected $fillable = [
        'client_op_id',
        'status',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];
}
