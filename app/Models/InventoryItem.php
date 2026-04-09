<?php

namespace App\Models;

use App\Utils\UnitConverter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'quantity', 'unit'];

    /**
     * Get available quantity in POS units (grams or milliliters).
     */
    public function getAvailablePosUnitsAttribute(): float
    {
        return $this->type === 'solid' 
            ? UnitConverter::kgToG($this->quantity) 
            : UnitConverter::lToMl($this->quantity);
    }

    /**
     * Get the POS unit label.
     */
    public function getPosUnitLabelAttribute(): string
    {
        return $this->type === 'solid' ? 'g' : 'ml';
    }

    /**
     * Deduct stock using POS units.
     * 
     * @param float $posQuantity (g or ml)
     */
    public function deductStock(float $posQuantity): void
    {
        $deduction = $this->type === 'solid' 
            ? UnitConverter::gToKg($posQuantity) 
            : UnitConverter::mlToL($posQuantity);

        if ($this->quantity < $deduction) {
            throw new \Exception("Insufficient stock for {$this->name}. Required: {$posQuantity}{$this->pos_unit_label}, Available: {$this->available_pos_units}{$this->pos_unit_label}");
        }

        $this->decrement('quantity', $deduction);
    }
}
