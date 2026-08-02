<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesBackup extends Model
{
    use HasFactory;

    protected $fillable = [
        'backup_name',
        'file_path',
        'records_count',
    ];
}
