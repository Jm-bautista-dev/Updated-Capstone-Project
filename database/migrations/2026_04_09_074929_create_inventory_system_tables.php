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
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['solid', 'liquid']);
            $table->decimal('quantity', 15, 4)->default(0);
            $table->string('unit'); // kg for solid, L for liquid
            $table->timestamps();
        });

        Schema::create('inventory_sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('inventory_items')->onDelete('cascade');
            $table->decimal('quantity_sold', 15, 4);
            $table->string('unit_sold'); // g or ml
            $table->decimal('sale_price', 15, 2)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_sales');
        Schema::dropIfExists('inventory_items');
    }
};
