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
        Schema::table('branch_product', function (Blueprint $table) {
            if (!Schema::hasColumn('branch_product', 'stock')) {
                $table->decimal('stock', 15, 2)->default(0)->after('product_id');
            }
            if (!Schema::hasColumn('branch_product', 'price')) {
                $table->decimal('price', 15, 2)->nullable()->after('stock');
            }
            if (!Schema::hasColumn('branch_product', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('price');
            }
        });

        // Ensure every existing product has a branch_product row for all active branches
        $branches = DB::table('branches')->pluck('id');
        $products = DB::table('products')->whereNull('deleted_at')->get();

        foreach ($products as $product) {
            foreach ($branches as $branchId) {
                $exists = DB::table('branch_product')
                    ->where('branch_id', $branchId)
                    ->where('product_id', $product->id)
                    ->exists();

                if (!$exists) {
                    DB::table('branch_product')->insert([
                        'branch_id'  => $branchId,
                        'product_id' => $product->id,
                        'stock'      => $product->stock ?? 0,
                        'price'      => $product->selling_price ?? null,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_product', function (Blueprint $table) {
            if (Schema::hasColumn('branch_product', 'stock')) {
                $table->dropColumn('stock');
            }
            if (Schema::hasColumn('branch_product', 'price')) {
                $table->dropColumn('price');
            }
            if (Schema::hasColumn('branch_product', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
