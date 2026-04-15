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
        Schema::table('ingredient_stocks', function (Blueprint $table) {
            if (!Schema::hasColumn('ingredient_stocks', 'cost_per_unit')) {
                $table->decimal('cost_per_unit', 15, 4)->default(0)->after('stock');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredient_stocks', function (Blueprint $table) {
            if (Schema::hasColumn('ingredient_stocks', 'cost_per_unit')) {
                $table->dropColumn('cost_per_unit');
            }
        });
    }
};
