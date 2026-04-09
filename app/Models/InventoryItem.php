<?php

namespace App\Models;

use App\Utils\UnitConverter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Mail\LowStockAlertMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class InventoryItem extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'quantity', 'unit', 'low_stock_threshold', 'last_alert_type', 'last_alert_sent_at'];

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
        
        // Refresh and check alerts
        $this->refresh()->checkStockAlerts();
    }

    /**
     * Check and trigger stock alerts based on thresholds.
     */
    public function checkStockAlerts(): void
    {
        $quantity = (float) $this->quantity;
        $threshold = (float) $this->low_stock_threshold;
        $recipient = env('REPORT_RECIPIENT_EMAIL', 'jmbautistaa0428@gmail.com');

        $status = null;
        if ($quantity <= 0) {
            $status = 'out';
        } elseif ($quantity <= $threshold) {
            $status = 'low';
        }

        // Only send alert if status changed or hasn't been sent for this status
        if ($status !== null && $this->last_alert_type !== $status) {
            try {
                Mail::to($recipient)->send(new LowStockAlertMail($this, $status));
                
                $this->update([
                    'last_alert_type' => $status,
                    'last_alert_sent_at' => now(),
                ]);
                
                Log::info("Stock alert sent for {$this->name}: {$status}");
            } catch (\Exception $e) {
                Log::error("Failed to send stock alert for {$this->name}: " . $e->getMessage());
            }
        } 
        // Reset alert type if stock is replenished beyond threshold
        elseif ($status === null && $this->last_alert_type !== null) {
            $this->update([
                'last_alert_type' => null,
            ]);
        }
    }
}
