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
        // 1. Add is_composite column to ingredients table if it doesn't exist
        if (Schema::hasTable('ingredients') && !Schema::hasColumn('ingredients', 'is_composite')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->boolean('is_composite')->default(false)->after('name');
            });
        }

        // 2. Create ingredient_subrecipe_items table
        if (!Schema::hasTable('ingredient_subrecipe_items')) {
            Schema::create('ingredient_subrecipe_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('composite_ingredient_id')
                      ->constrained('ingredients')
                      ->onDelete('cascade');
                $table->foreignId('component_ingredient_id')
                      ->constrained('ingredients')
                      ->onDelete('cascade');
                $table->decimal('quantity', 12, 4)->default(0);
                $table->string('unit', 20)->default('g');
                $table->timestamps();

                $table->unique(
                    ['composite_ingredient_id', 'component_ingredient_id'],
                    'composite_component_unique'
                );
                $table->index('composite_ingredient_id');
                $table->index('component_ingredient_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredient_subrecipe_items');

        if (Schema::hasTable('ingredients') && Schema::hasColumn('ingredients', 'is_composite')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropColumn('is_composite');
            });
        }
    }
};
