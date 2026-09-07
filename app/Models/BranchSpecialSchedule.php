<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchSpecialSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'date',
        'is_closed_all_day',
        'is_open_24_hours',
        'open_time',
        'close_time',
        'reason',
        'label',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'date'              => 'date:Y-m-d',
        'is_closed_all_day' => 'boolean',
        'is_open_24_hours'  => 'boolean',
    ];

    protected $appends = [
        'formatted_hours',
        'formatted_date',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getFormattedDateAttribute(): string
    {
        return $this->date ? \Carbon\Carbon::parse($this->date)->format('M d, Y') : '';
    }

    public function getLabelAttribute(): ?string
    {
        return $this->reason;
    }

    public function setLabelAttribute(?string $value): void
    {
        $this->attributes['reason'] = $value;
    }

    public function getFormattedHoursAttribute(): string
    {
        if ($this->is_closed_all_day) {
            return 'Closed All Day';
        }

        if ($this->is_open_24_hours) {
            return 'Open 24 Hours';
        }

        $open = $this->open_time ? date('g:i A', strtotime($this->open_time)) : '10:00 AM';
        $close = $this->close_time ? date('g:i A', strtotime($this->close_time)) : '8:00 PM';

        return "{$open} — {$close}";
    }
}
