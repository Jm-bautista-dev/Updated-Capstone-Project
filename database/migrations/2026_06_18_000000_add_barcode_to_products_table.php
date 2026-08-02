<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('barcode')->unique()->nullable()->after('sku');
        });

        // Generate unique barcodes for existing products
        $products = \App\Models\Product::withTrashed()->get();
        foreach ($products as $product) {
            if (!$product->barcode) {
                do {
                    $barcode = '888' . str_pad(mt_rand(0, 999999999), 9, '0', STR_PAD_LEFT);
                } while (\App\Models\Product::withTrashed()->where(['barcode' => $barcode])->exists());

                $product->barcode = $barcode;
                $product->save();
            }
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('barcode');
        });
    }
};
