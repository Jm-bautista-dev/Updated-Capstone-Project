<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // unit_price: price per single unit at purchase time
            if (!Schema::hasColumn('order_items', 'unit_price')) {
                $table->decimal('unit_price', 10, 2)->default(0)->after('price');
            }
            // line_total: unit_price * quantity
            if (!Schema::hasColumn('order_items', 'line_total')) {
                $table->decimal('line_total', 10, 2)->default(0)->after('unit_price');
            }
            // product_name: snapshot of product name at purchase time
            if (!Schema::hasColumn('order_items', 'product_name')) {
                $table->string('product_name')->nullable()->after('line_total');
            }
            // image_path: snapshot of product image at purchase time
            if (!Schema::hasColumn('order_items', 'image_path')) {
                $table->string('image_path')->nullable()->after('product_name');
            }
            // notes: optional per-item notes from customer
            if (!Schema::hasColumn('order_items', 'notes')) {
                $table->text('notes')->nullable()->after('image_path');
            }
        });

        // Backfill: treat existing `price` as unit_price, derive line_total
        DB::statement('
            UPDATE order_items
            SET
                unit_price = price,
                line_total = price * quantity
            WHERE unit_price = 0
        ');

        // Backfill product_name from products (correlated subquery — SQLite + MySQL compatible)
        DB::statement('
            UPDATE order_items
            SET product_name = (
                SELECT name FROM products WHERE products.id = order_items.product_id LIMIT 1
            )
            WHERE product_name IS NULL
        ');

        // Backfill image_path from products (correlated subquery — SQLite + MySQL compatible)
        DB::statement('
            UPDATE order_items
            SET image_path = (
                SELECT image_path FROM products WHERE products.id = order_items.product_id LIMIT 1
            )
            WHERE image_path IS NULL
        ');
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $toDrop = [];
            foreach (['unit_price', 'line_total', 'product_name', 'image_path', 'notes'] as $col) {
                if (Schema::hasColumn('order_items', $col)) {
                    $toDrop[] = $col;
                }
            }
            if (!empty($toDrop)) {
                $table->dropColumn($toDrop);
            }
        });
    }
};
