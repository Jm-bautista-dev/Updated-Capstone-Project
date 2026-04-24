<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Product;
use App\Models\Ingredient;
use Illuminate\Support\Facades\DB;

class SyncLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-legacy-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Syncs legacy branch_id fields to the new pivot tables and performs cleanup.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Legacy Data Sync...');

        // 1. Sync Products to branch_product pivot
        $products = Product::whereNotNull('branch_id')->get();
        $syncedProductsCount = 0;
        
        foreach ($products as $product) {
            $product->branches()->syncWithoutDetaching([$product->branch_id]);
            $syncedProductsCount++;
        }
        $this->info("Synced {$syncedProductsCount} products to branch_product pivot table.");

        // 2. Data Cleanup (Restore mistakenly soft-deleted items or ensure active)
        $restoredProducts = Product::onlyTrashed()->restore();
        if ($restoredProducts) {
            $this->info("Restored previously deleted products.");
        }

        $restoredIngredients = Ingredient::onlyTrashed()->restore();
        if ($restoredIngredients) {
            $this->info("Restored previously deleted ingredients.");
        }

        // 3. Gap-fill: Ensure ALL ingredients have a stock row for ALL branches
        $this->info("Ensuring all ingredients have stock rows for all branches...");
        $allBranches = \App\Models\Branch::pluck('id');
        $ingredients = Ingredient::all();
        $stockCreated = 0;

        foreach ($ingredients as $ingredient) {
            foreach ($allBranches as $branchId) {
                $stock = \App\Models\IngredientStock::firstOrCreate(
                    ['ingredient_id' => $ingredient->id, 'branch_id' => $branchId],
                    [
                        'stock' => 0,
                        'low_stock_level' => 5,
                        'is_low_stock_notified' => false,
                        'is_out_of_stock_notified' => false,
                    ]
                );
                if ($stock->wasRecentlyCreated) {
                    $stockCreated++;
                }
            }
        }
        $this->info("Created {$stockCreated} missing inventory records.");

        $this->info('Legacy Data Sync Completed Successfully!');
    }
}
