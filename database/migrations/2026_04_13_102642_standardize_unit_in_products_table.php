<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Backfill existing products where unit is null
        DB::table('products')->whereNull('unit')->update(['unit' => 'pcs']);
        
        // Additional backfill to fix non-standard units if necessary
        DB::table('products')->where('unit', 'kg')->update(['unit' => 'g']);
        DB::table('products')->where('unit', 'L')->update(['unit' => 'ml']);
        DB::table('products')->where('unit', 'liters')->update(['unit' => 'ml']);

        Schema::table('products', function (Blueprint $table) {
            // Ensure the column is a string with a default value
            $table->string('unit')->default('pcs')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('unit')->nullable()->change();
        });
    }
};
