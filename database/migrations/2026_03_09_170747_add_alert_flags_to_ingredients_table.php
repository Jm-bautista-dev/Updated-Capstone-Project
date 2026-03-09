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
            $table->boolean('is_low_stock_notified')->default(false)->after('low_stock_level');
            $table->boolean('is_out_of_stock_notified')->default(false)->after('is_low_stock_notified');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropColumn(['is_low_stock_notified', 'is_out_of_stock_notified']);
        });
    }
};
