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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'costing_method')) {
                $table->string('costing_method', 20)->default('automatic')->after('cost_price');
            }
            if (!Schema::hasColumn('products', 'manual_cost')) {
                $table->decimal('manual_cost', 12, 4)->nullable()->after('costing_method');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'manual_cost')) {
                $table->dropColumn('manual_cost');
            }
            if (Schema::hasColumn('products', 'costing_method')) {
                $table->dropColumn('costing_method');
            }
        });
    }
};
