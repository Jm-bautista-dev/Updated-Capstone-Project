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

            $stockQty = (float) $stock->stock;
            $totalValue = (float) ($stock->total_stock_value ?? 0);

            if ($stockQty > 0 && $totalValue > 0) {
                // Canonical Cost Per Base Unit = Total Stock Value / Base Stock Quantity
                $correctCostPerBaseUnit = round($totalValue / $stockQty, 6);

                DB::table('ingredient_stocks')
                    ->where('id', $stock->id)
                    ->update([
                        'cost_per_unit' => $correctCostPerBaseUnit,
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
