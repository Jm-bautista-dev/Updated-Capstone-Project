<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesImportAudit extends Model
{
    use HasFactory;

    protected $table = 'sales_import_audits';

    protected $fillable = [
        'user_id',
        'ip_address',
        'action',
        'details',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
