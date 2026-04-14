<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration creates the ingredient_stocks table (branch inventory),
     * migrates existing branch-scoped stock data from the ingredients table,
     * then deduplicates ingredients so only ONE global record exists per name.
     *
     * BEFORE: ingredients has branch_id + stock (duplicates per branch)
     * AFTER: ingredients is global (no branch_id), stock lives in ingredient_stocks
     */
    public function up(): void
    {
        // 1. Create the branch-scoped stock table
        Schema::create('ingredient_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')->constrained('ingredients')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->decimal('stock', 15, 4)->default(0);
            $table->decimal('low_stock_level', 15, 4)->default(5);
            $table->boolean('is_low_stock_notified')->default(false);
            $table->boolean('is_out_of_stock_notified')->default(false);
            $table->timestamps();

            // Unique constraint: one stock row per ingredient+branch
            $table->unique(['ingredient_id', 'branch_id'], 'ingredient_branch_unique');
        });

        // 2. Migrate existing data:
        //    - For each distinct ingredient name, keep the FIRST record as the canonical global record
        //    - Migrate stock rows from all duplicates into ingredient_stocks
        //    - Update foreign key references in menu_item_ingredients
        //    - Delete the duplicate ingredient records

        if (Schema::hasColumn('ingredients', 'branch_id') && Schema::hasColumn('ingredients', 'stock')) {
            $this->migrateExistingData();
        }

        // 3. Drop branch_id and stock from ingredients (they now live in ingredient_stocks)
        Schema::table('ingredients', function (Blueprint $table) {
            // Drop foreign key and column if they exist
            if (Schema::hasColumn('ingredients', 'branch_id')) {
                $table->dropForeign(['branch_id']);
                $table->dropColumn('branch_id');
            }
            if (Schema::hasColumn('ingredients', 'stock')) {
                $table->dropColumn('stock');
            }
            // low_stock_level, is_low_stock_notified, is_out_of_stock_notified move to ingredient_stocks
            if (Schema::hasColumn('ingredients', 'low_stock_level')) {
                $table->dropColumn('low_stock_level');
            }
            if (Schema::hasColumn('ingredients', 'is_low_stock_notified')) {
                $table->dropColumn('is_low_stock_notified');
            }
            if (Schema::hasColumn('ingredients', 'is_out_of_stock_notified')) {
                $table->dropColumn('is_out_of_stock_notified');
            }
        });
    }

    /**
     * Migrate existing per-branch ingredient records into ingredient_stocks,
     * deduplicating by name so only one global ingredient record remains.
     */
    protected function migrateExistingData(): void
    {
        // Group all ingredients by lowercase name
        $allIngredients = DB::table('ingredients')->orderBy('id')->get();

        // Build a map: lowercase_name => canonical_id
        $canonicalMap = []; // [lowercase_name => canonical_ingredient_id]

        foreach ($allIngredients as $ingredient) {
            $key = strtolower(trim($ingredient->name));

            if (!isset($canonicalMap[$key])) {
                // This is the first (canonical) record for this name
                $canonicalMap[$key] = $ingredient->id;
            }
        }

        // Now for each ingredient, either it IS the canonical or it's a duplicate
        foreach ($allIngredients as $ingredient) {
            $key = strtolower(trim($ingredient->name));
            $canonicalId = $canonicalMap[$key];

            // Create ingredient_stock row for this record's branch (if branch_id is set)
            if (!empty($ingredient->branch_id)) {
                $stock     = $ingredient->stock ?? 0;
                $low       = $ingredient->low_stock_level ?? 5;
                $lowNotif  = $ingredient->is_low_stock_notified ?? false;
                $outNotif  = $ingredient->is_out_of_stock_notified ?? false;

                // Use the canonical ingredient_id
                DB::table('ingredient_stocks')->updateOrInsert(
                    ['ingredient_id' => $canonicalId, 'branch_id' => $ingredient->branch_id],
                    [
                        'stock'                     => $stock,
                        'low_stock_level'            => $low,
                        'is_low_stock_notified'     => $lowNotif,
                        'is_out_of_stock_notified'  => $outNotif,
                        'created_at'                => now(),
                        'updated_at'                => now(),
                    ]
                );
            }

            // If this is a duplicate (not canonical), remap its recipe references
            if ($ingredient->id !== $canonicalId) {
                DB::table('menu_item_ingredients')
                    ->where('ingredient_id', $ingredient->id)
                    ->update(['ingredient_id' => $canonicalId]);

                // Also update supplier_ingredient pivot if it exists
                if (Schema::hasTable('supplier_ingredient')) {
                    DB::table('supplier_ingredient')
                        ->where('ingredient_id', $ingredient->id)
                        ->update(['ingredient_id' => $canonicalId]);
                }

                // Merge stock_logs references
                if (Schema::hasTable('stock_logs')) {
                    DB::table('stock_logs')
                        ->where('storable_type', 'App\Models\Ingredient')
                        ->where('storable_id', $ingredient->id)
                        ->update(['storable_id' => $canonicalId]);
                }

                if (Schema::hasTable('ingredient_logs')) {
                    DB::table('ingredient_logs')
                        ->where('ingredient_id', $ingredient->id)
                        ->update(['ingredient_id' => $canonicalId]);
                }

                // Delete the duplicate
                DB::table('ingredients')->where('id', $ingredient->id)->delete();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Re-add columns to ingredients
        Schema::table('ingredients', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->after('id')->constrained('branches')->nullOnDelete();
            $table->decimal('stock', 15, 4)->default(0)->after('unit');
            $table->decimal('low_stock_level', 15, 4)->default(5)->after('stock');
            $table->boolean('is_low_stock_notified')->default(false)->after('low_stock_level');
            $table->boolean('is_out_of_stock_notified')->default(false)->after('is_low_stock_notified');
        });

        Schema::dropIfExists('ingredient_stocks');
    }
};
