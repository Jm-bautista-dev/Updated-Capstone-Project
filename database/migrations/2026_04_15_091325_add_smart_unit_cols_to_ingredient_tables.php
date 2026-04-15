<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->decimal('avg_weight_per_piece', 10, 4)->nullable()->after('cost_price')->comment('Average weight of 1 pc in the base unit (e.g. 5 for 5g garlic clove)');
        });

        Schema::table('menu_item_ingredients', function (Blueprint $table) {
            $table->string('unit', 50)->nullable()->after('quantity_required')->comment('Unit selected in recipe (e.g., cloves, pcs, half, grams)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropColumn('avg_weight_per_piece');
        });

        Schema::table('menu_item_ingredients', function (Blueprint $table) {
            $table->dropColumn('unit');
        });
    }
};
