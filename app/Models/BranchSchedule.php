<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'branch_id',
        'day_of_week',
        'open_time',
        'close_time',
        'is_closed',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'is_closed'   => 'boolean',
    ];

    protected $appends = [
        'day_name',
        'formatted_hours',
    ];

    const DAYS = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function getDayNameAttribute(): string
    {
        return self::DAYS[$this->day_of_week] ?? 'Unknown';
    }

    public function getFormattedHoursAttribute(): string
    {
        if ($this->is_closed) {
            return 'Closed';
        }

        $open = $this->open_time ? date('g:i A', strtotime($this->open_time)) : '10:00 AM';
        $close = $this->close_time ? date('g:i A', strtotime($this->close_time)) : '8:00 PM';

        return "{$open} — {$close}";
    }
}
