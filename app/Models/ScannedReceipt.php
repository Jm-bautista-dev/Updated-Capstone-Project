<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScannedReceipt extends Model
{
    protected $fillable = [
        'file_path',
        'file_hash',
        'raw_ocr_text',
        'parsed_data',
        'confirmed_data',
        'branch_id',
        'user_id',
        'status',
    ];

    protected $casts = [
        'parsed_data' => 'array',
        'confirmed_data' => 'array',
        'branch_id' => 'integer',
        'user_id' => 'integer',
    ];

    /**
     * Get the branch where this receipt was uploaded.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user/staff who scanned this receipt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
