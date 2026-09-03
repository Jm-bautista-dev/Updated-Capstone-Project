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
        if (!Schema::hasTable('product_addons')) {
            Schema::create('product_addons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
                $table->string('name');
                $table->decimal('price', 10, 2)->default(0.00);
                $table->decimal('cost_price', 10, 2)->nullable()->default(0.00);
                $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->nullOnDelete();
                $table->decimal('ingredient_quantity', 10, 2)->default(1.00);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['product_id', 'is_active']);
            });
        }

        if (Schema::hasTable('cart_items') && !Schema::hasColumn('cart_items', 'selected_addons')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->json('selected_addons')->nullable()->after('quantity');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('order_items', 'selected_addons')) {
                    $table->json('selected_addons')->nullable()->after('notes');
                }
                if (!Schema::hasColumn('order_items', 'addon_total')) {
                    $table->decimal('addon_total', 10, 2)->default(0.00)->after('line_total');
                }
            });
        }

        if (Schema::hasTable('sale_items')) {
            Schema::table('sale_items', function (Blueprint $table) {
                if (!Schema::hasColumn('sale_items', 'selected_addons')) {
                    $table->json('selected_addons')->nullable()->after('subtotal');
                }
                if (!Schema::hasColumn('sale_items', 'addon_total')) {
                    $table->decimal('addon_total', 10, 2)->default(0.00)->after('subtotal');
                }
            });
        }

        // Seed default universal add-ons if empty
        if (DB::table('product_addons')->count() === 0) {
            DB::table('product_addons')->insert([
                [
                    'product_id'          => null, // global add-on available for all sushi/rolls
                    'name'                => 'Extra Sauce',
                    'price'               => 20.00,
                    'cost_price'          => 5.00,
                    'ingredient_id'       => null,
                    'ingredient_quantity' => 1.00,
                    'is_active'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ],
                [
                    'product_id'          => null,
                    'name'                => 'Extra Wasabi',
                    'price'               => 15.00,
                    'cost_price'          => 3.00,
                    'ingredient_id'       => null,
                    'ingredient_quantity' => 1.00,
                    'is_active'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ],
                [
                    'product_id'          => null,
                    'name'                => 'Extra Toppings',
                    'price'               => 30.00,
                    'cost_price'          => 8.00,
                    'ingredient_id'       => null,
                    'ingredient_quantity' => 1.00,
                    'is_active'           => true,
                    'created_at'          => now(),
                    'updated_at'          => now(),
                ],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('sale_items', 'addon_total')) {
            Schema::table('sale_items', function (Blueprint $table) {
                $table->dropColumn(['addon_total', 'selected_addons']);
            });
        }

        if (Schema::hasColumn('order_items', 'addon_total')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropColumn(['addon_total', 'selected_addons']);
            });
        }

        if (Schema::hasColumn('cart_items', 'selected_addons')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropColumn('selected_addons');
            });
        }

        Schema::dropIfExists('product_addons');
    }
};
