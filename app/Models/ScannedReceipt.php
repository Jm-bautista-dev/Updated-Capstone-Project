<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScannedReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'file_path',
        'file_hash',
        'supplier_name',
        'supplier_id',
        'invoice_number',
        'receipt_date',
        'currency',
        'subtotal',
        'tax',
        'discount',
        'grand_total',
        'calculated_total',
        'is_arithmetic_valid',
        'is_duplicate_warning',
        'duplicate_matched_receipt_id',
        'raw_ocr_text',
        'parsed_data',
        'confirmed_data',
        'audit_trail',
        'branch_id',
        'user_id',
        'processed_by',
        'status',
        'confirmed_at',
    ];

    protected $casts = [
        'receipt_date'                  => 'date',
        'subtotal'                      => 'decimal:2',
        'tax'                           => 'decimal:2',
        'discount'                      => 'decimal:2',
        'grand_total'                   => 'decimal:2',
        'calculated_total'              => 'decimal:2',
        'is_arithmetic_valid'           => 'boolean',
        'is_duplicate_warning'          => 'boolean',
        'parsed_data'                   => 'array',
        'confirmed_data'                => 'array',
        'audit_trail'                   => 'array',
        'branch_id'                     => 'integer',
        'user_id'                       => 'integer',
        'supplier_id'                   => 'integer',
        'duplicate_matched_receipt_id'  => 'integer',
        'processed_by'                  => 'integer',
        'confirmed_at'                  => 'datetime',
    ];

    /**
     * Get the branch where this receipt was uploaded.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the user/staff who uploaded this receipt.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin who confirmed / processed this stock-in.
     */
    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Get the linked supplier record.
     */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the previously matched duplicate receipt if flagged.
     */
    public function duplicateReceipt(): BelongsTo
    {
        return $this->belongsTo(ScannedReceipt::class, 'duplicate_matched_receipt_id');
    }

    public function isDraft(): bool
    {
        return in_array($this->status, ['pending', 'processed']);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }
}
