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
        Schema::create('branch_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unique(['branch_id', 'product_id']);
            $table->timestamps();
        });

        // Migrate existing branch assignments
        $products = \Illuminate\Support\Facades\DB::table('products')->whereNotNull('branch_id')->get();
        foreach ($products as $product) {
            \Illuminate\Support\Facades\DB::table('branch_product')->insert([
                'branch_id' => $product->branch_id,
                'product_id' => $product->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branch_product');
    }
};
