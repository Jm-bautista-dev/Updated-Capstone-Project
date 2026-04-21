<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cleanup: Orphaned Ingredient Stocks
 *
 * Two categories of orphans are addressed:
 *
 * 1. ingredient_stocks rows whose branch_id no longer exists in `branches`
 *    (branch was deleted without cascade — should not happen given FK constraints,
 *     but handles any legacy/manual data issues).
 *    → These rows are DELETED.
 *
 * 2. Ingredients that have ZERO ingredient_stocks rows at all.
 *    → A stock row with stock=0 is created for EVERY active branch so the
 *      ingredient appears correctly in the inventory (not as "UNASSIGNED").
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Step 1: Delete stocks pointing to non-existent branches ──────────
        // This covers the edge case where a branch was hard-deleted without
        // the FK cascade firing (e.g., direct DB manipulation).
        $validBranchIds = DB::table('branches')->pluck('id');

        DB::table('ingredient_stocks')
            ->whereNotIn('branch_id', $validBranchIds)
            ->delete();

        // ── Step 2: Delete stocks pointing to soft-deleted ingredients ───────
        $validIngredientIds = DB::table('ingredients')
            ->whereNull('deleted_at')
            ->pluck('id');

        DB::table('ingredient_stocks')
            ->whereNotIn('ingredient_id', $validIngredientIds)
            ->delete();

        // ── Step 3: Ensure every active ingredient has a stock row per branch ─
        // This resolves ingredients that were created without branch stock rows.
        $branches    = DB::table('branches')->get();
        $ingredients = DB::table('ingredients')->whereNull('deleted_at')->get();

        $now = now();

        foreach ($ingredients as $ingredient) {
            foreach ($branches as $branch) {
                $exists = DB::table('ingredient_stocks')
                    ->where('ingredient_id', $ingredient->id)
                    ->where('branch_id', $branch->id)
                    ->exists();

                if (! $exists) {
                    DB::table('ingredient_stocks')->insert([
                        'ingredient_id'            => $ingredient->id,
                        'branch_id'                => $branch->id,
                        'stock'                    => 0,
                        'low_stock_level'          => 5,
                        'is_low_stock_notified'    => false,
                        'is_out_of_stock_notified' => false,
                        'created_at'               => $now,
                        'updated_at'               => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        // This cleanup is non-destructive to real data; no meaningful rollback.
        // Rows inserted in step 3 (stock=0) could be removed, but doing so
        // risks removing legitimately zero-stock items. Leave as-is.
    }
};
