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
        // 1. Create add_ons table (modifiers)
        if (!Schema::hasTable('add_ons')) {
            Schema::create('add_ons', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->decimal('price', 10, 2)->default(0.00);
                $table->decimal('cost_price', 10, 2)->nullable()->default(0.00);
                $table->boolean('is_active')->default(true);
                $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
                $table->boolean('stock_linked')->default(false);
                $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->nullOnDelete();
                $table->decimal('ingredient_quantity', 10, 2)->default(1.00);
                $table->timestamps();

                $table->index(['is_active', 'branch_id']);
            });
        }

        // 2. Create addon_groups table
        if (!Schema::hasTable('addon_groups')) {
            Schema::create('addon_groups', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // e.g. "Sauce Choices", "Spiciness Level", "Extra Toppings"
                $table->foreignId('product_id')->nullable()->constrained('products')->cascadeOnDelete();
                $table->string('selection_type')->default('multi'); // 'single' | 'multi'
                $table->boolean('is_required')->default(false);
                $table->unsignedInteger('min_selections')->default(0);
                $table->unsignedInteger('max_selections')->nullable()->default(1);
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->index(['product_id', 'is_active']);
            });
        }

        // 3. Create addon_group_items join table
        if (!Schema::hasTable('addon_group_items')) {
            Schema::create('addon_group_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('addon_group_id')->constrained('addon_groups')->cascadeOnDelete();
                $table->foreignId('add_on_id')->constrained('add_ons')->cascadeOnDelete();
                $table->decimal('price_override', 10, 2)->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->unique(['addon_group_id', 'add_on_id']);
            });
        }

        // 4. Create product_addon_groups join table (many-to-many link)
        if (!Schema::hasTable('product_addon_groups')) {
            Schema::create('product_addon_groups', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('addon_group_id')->constrained('addon_groups')->cascadeOnDelete();
                $table->integer('sort_order')->default(0);
                $table->timestamps();

                $table->unique(['product_id', 'addon_group_id']);
            });
        }

        // Sync initial data from legacy product_addons into add_ons if product_addons has rows
        if (Schema::hasTable('product_addons') && DB::table('add_ons')->count() === 0) {
            $legacyAddons = DB::table('product_addons')->get();
            foreach ($legacyAddons as $leg) {
                DB::table('add_ons')->insert([
                    'id'                  => $leg->id,
                    'name'                => $leg->name,
                    'price'               => $leg->price,
                    'cost_price'          => $leg->cost_price ?? 0.00,
                    'is_active'           => $leg->is_active ?? true,
                    'branch_id'           => null,
                    'stock_linked'        => $leg->ingredient_id !== null,
                    'ingredient_id'       => $leg->ingredient_id,
                    'ingredient_quantity' => $leg->ingredient_quantity ?? 1.00,
                    'created_at'          => $leg->created_at ?? now(),
                    'updated_at'          => $leg->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_addon_groups');
        Schema::dropIfExists('addon_group_items');
        Schema::dropIfExists('addon_groups');
        Schema::dropIfExists('add_ons');
    }
};
