<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use App\Utils\UnitConverter;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Ensures all ingredient_stocks.low_stock_level values are stored in canonical base units (g, ml, pcs).
     */
    public function up(): void
    {
        $stocks = DB::table('ingredient_stocks')
            ->join('ingredients', 'ingredient_stocks.ingredient_id', '=', 'ingredients.id')
            ->select('ingredient_stocks.id', 'ingredient_stocks.stock', 'ingredient_stocks.low_stock_level', 'ingredients.unit')
            ->get();

        foreach ($stocks as $row) {
            $unit = strtolower(trim($row->unit ?? 'pcs'));
            $currentLowStock = (float) $row->low_stock_level;
            $currentStock = (float) $row->stock;

            // If unit is kg or L, and low_stock_level was stored as raw display value (e.g., 5 instead of 5000g / 5000ml)
            if (($unit === 'kg' || $unit === 'kilogram' || $unit === 'kilograms') && $currentLowStock > 0 && $currentLowStock <= 50 && $currentStock >= 100) {
                DB::table('ingredient_stocks')
                    ->where('id', $row->id)
                    ->update([
                        'low_stock_level' => $currentLowStock * 1000,
                        'updated_at' => now(),
                    ]);
            } elseif (($unit === 'l' || $unit === 'liter' || $unit === 'liters') && $currentLowStock > 0 && $currentLowStock <= 50 && $currentStock >= 100) {
                DB::table('ingredient_stocks')
                    ->where('id', $row->id)
                    ->update([
                        'low_stock_level' => $currentLowStock * 1000,
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
    }
};
