<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Utils\UnitConverter;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Recalculates cost_per_unit for all ingredient stocks from total_stock_value and canonical stock.
     */
    public function up(): void
    {
        $stocks = DB::table('ingredient_stocks')->get();

        foreach ($stocks as $stock) {
            $ingredient = DB::table('ingredients')->where('id', $stock->ingredient_id)->first();
            if (!$ingredient) continue;

            $stockQty   = (float) $stock->stock;
            $totalValue = (float) ($stock->total_stock_value ?? 0);
            $storedCost = (float) ($stock->cost_per_unit ?? 0);
            $unit       = strtolower(trim($ingredient->unit));

            $correctCostPerBaseUnit = 0.0;
            $correctTotalValue      = 0.0;

            if ($stockQty > 0 && $totalValue > 0) {
                // Case 1: Total purchase value is known
                $correctCostPerBaseUnit = round($totalValue / $stockQty, 6);
                $correctTotalValue      = $totalValue;
            } elseif ($stockQty > 0 && $storedCost > 0) {
                // Case 2: Derive from stored cost_per_unit
                // If stored cost is in per-input-unit (e.g. 10 pesos/kg while stock is in grams)
                if (($unit === 'g' || $unit === 'ml') && $stockQty >= 1000 && $storedCost >= 0.5) {
                    $correctCostPerBaseUnit = round($storedCost / 1000, 6);
                } else {
                    $correctCostPerBaseUnit = $storedCost;
                }
                $correctTotalValue = round($stockQty * $correctCostPerBaseUnit, 4);
            }

            if ($correctCostPerBaseUnit > 0) {
                DB::table('ingredient_stocks')
                    ->where('id', $stock->id)
                    ->update([
                        'cost_per_unit'     => $correctCostPerBaseUnit,
                        'total_stock_value' => $correctTotalValue,
                    ]);

                DB::table('ingredients')
                    ->where('id', $ingredient->id)
                    ->update([
                        'cost_per_base_unit' => $correctCostPerBaseUnit,
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Deterministic migration does not require destructively undoing calculated costs
    }
};
