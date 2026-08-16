<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Restores user display base units (e.g., kg instead of canonical g) in the ingredients table.
     */
    public function up(): void
    {
        $ingredients = DB::table('ingredients')->get();

        foreach ($ingredients as $ing) {
            $unit = strtolower(trim($ing->unit));

            // Check ingredient_logs for initial stock registration unit if available
            $initialLog = DB::table('ingredient_logs')
                ->where('ingredient_id', $ing->id)
                ->where('reason', 'like', '%initial%')
                ->first();

            $maxStockRow = DB::table('ingredient_stocks')
                ->where('ingredient_id', $ing->id)
                ->max('stock');

            $maxStock = (float) ($maxStockRow ?? 0);

            if ($unit === 'g' && $maxStock >= 1000) {
                DB::table('ingredients')
                    ->where('id', $ing->id)
                    ->update(['unit' => 'kg']);
            } elseif ($unit === 'ml' && $maxStock >= 1000) {
                DB::table('ingredients')
                    ->where('id', $ing->id)
                    ->update(['unit' => 'L']);
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
