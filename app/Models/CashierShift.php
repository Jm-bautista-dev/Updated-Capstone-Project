<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashierShift extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'cashier_id',
        'branch_id',
        'opening_balance',
        'closing_balance',
        'expected_balance',
        'total_cash_sales',
        'cash_in',
        'cash_out',
        'variance',
        'notes',
        'status',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'opened_at'        => 'datetime',
        'closed_at'        => 'datetime',
        'opening_balance'  => 'decimal:2',
        'closing_balance'  => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'total_cash_sales' => 'decimal:2',
        'cash_in'          => 'decimal:2',
        'cash_out'         => 'decimal:2',
        'variance'         => 'decimal:2',
    ];

    protected $appends = [
        'opening_cash',
        'expected_cash',
        'actual_cash',
        'difference',
        'starting_cash',
    ];

    public function getOpeningCashAttribute(): float
    {
        return (float) ($this->opening_balance ?? 0.0);
    }

    public function getStartingCashAttribute(): float
    {
        return (float) ($this->opening_balance ?? 0.0);
    }

    public function getExpectedCashAttribute(): float
    {
        return (float) ($this->expected_balance ?? 0.0);
    }

    public function getActualCashAttribute(): ?float
    {
        return $this->closing_balance !== null ? (float) $this->closing_balance : null;
    }

    public function getDifferenceAttribute(): ?float
    {
        if ($this->variance !== null) {
            return (float) $this->variance;
        }
        if ($this->closing_balance !== null) {
            return (float) ($this->closing_balance - $this->expected_balance);
        }
        return null;
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
