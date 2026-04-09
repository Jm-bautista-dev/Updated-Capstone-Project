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
        // Add direct stock columns to products for items without recipes (e.g. Bottled Water)
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('stock', 15, 4)->default(0)->after('type');
            $table->string('unit', 20)->default('pcs')->after('stock');
        });

        // Unified audit trail for BOTH Ingredients and Products
        Schema::create('stock_logs', function (Blueprint $table) {
            $table->id();
            $table->morphs('storable'); // ingredient or product
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action_type'); // stock_in, sale_deduction, adjustment, recipe_deduction
            $table->decimal('quantity', 15, 4); // user-facing units
            $table->decimal('quantity_base', 15, 4); // base storage units (g, ml, pcs)
            $table->string('unit', 20); 
            $table->decimal('previous_stock', 15, 4);
            $table->decimal('new_stock', 15, 4);
            $table->string('reference')->nullable(); // Order number, Ref ID
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_logs');
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['stock', 'unit']);
        });
    }
};
