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
        // 1. Ensure `product_addons` table exists as the direct Product <-> Addon many-to-many relationship
        if (!Schema::hasTable('product_addons')) {
            Schema::create('product_addons', function (Blueprint $table) {
                $table->id();
                $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('addon_id')->constrained('add_ons')->cascadeOnDelete();
                $table->boolean('is_required')->default(false);
                $table->unsignedInteger('max_quantity')->default(1);
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->unique(['product_id', 'addon_id']);
                $table->index(['product_id', 'is_active']);
                $table->index(['addon_id', 'is_active']);
            });
        } else {
            // If table existed with legacy columns, adapt it to the new architecture
            Schema::table('product_addons', function (Blueprint $table) {
                if (Schema::hasColumn('product_addons', 'name')) {
                    $table->string('name')->nullable()->change();
                }
                if (!Schema::hasColumn('product_addons', 'addon_id')) {
                    $table->foreignId('addon_id')->nullable()->after('product_id')->constrained('add_ons')->cascadeOnDelete();
                }
                if (!Schema::hasColumn('product_addons', 'is_required')) {
                    $table->boolean('is_required')->default(false);
                }
                if (!Schema::hasColumn('product_addons', 'max_quantity')) {
                    $table->unsignedInteger('max_quantity')->default(1);
                }
                if (!Schema::hasColumn('product_addons', 'sort_order')) {
                    $table->integer('sort_order')->default(0);
                }
                if (!Schema::hasColumn('product_addons', 'is_active')) {
                    $table->boolean('is_active')->default(true);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_addons');
    }
};
