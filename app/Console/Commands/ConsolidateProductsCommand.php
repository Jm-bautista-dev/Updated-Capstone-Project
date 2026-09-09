<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use App\Models\Product;
use App\Models\Branch;

class ConsolidateProductsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makidesu:consolidate-products
                            {--dry-run : Simulate consolidation without persisting changes}
                            {--force : Force consolidation without interactive confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Consolidates duplicate branch-specific products into a unified Global Product Catalog with branch inventory in branch_product.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('===========================================================');
        $this->info('  MAKI DESU — Global Product Catalog & Inventory Consolidation');
        $this->info('===========================================================');

        $isDryRun = (bool) $this->option('dry-run');
        $isForce  = (bool) $this->option('force');

        if ($isDryRun) {
            $this->warn('Running in DRY-RUN mode. No changes will be saved.');
        }

        // 1. Gather all active (non-deleted) products grouped by normalized name
        $activeProducts = Product::whereNull('deleted_at')->orderBy('id')->get();
        $this->info("Total active product records found: {$activeProducts->count()}");

        $grouped = $activeProducts->groupBy(function ($product) {
            return strtolower(trim($product->name));
        });

        $duplicatesFound = 0;
        $consolidationPlan = [];

        foreach ($grouped as $name => $products) {
            if ($products->count() > 1) {
                $duplicatesFound++;
                $master = $products->first();
                $duplicates = $products->slice(1);

                $consolidationPlan[] = [
                    'name'       => $master->name,
                    'master'     => $master,
                    'duplicates' => $duplicates,
                    'all'        => $products,
                ];
            }
        }

        $this->info("Duplicate product groups detected: {$duplicatesFound}");

        if ($duplicatesFound === 0) {
            $this->info('No duplicate products found. Ensuring all products have branch_product entries.');
            $this->ensureBranchProductsExist($activeProducts, $isDryRun);
            $this->info('All products verified.');
            return self::SUCCESS;
        }

        // Display consolidation preview table
        $previewData = [];
        $totalStockBefore = 0;

        foreach ($consolidationPlan as $plan) {
            $master = $plan['master'];
            $dupIds = $plan['duplicates']->pluck('id')->implode(', ');
            $branchStockDetails = [];
            $groupStock = 0;

            foreach ($plan['all'] as $p) {
                $bName = $p->branch_id ? (Branch::find($p->branch_id)?->name ?? "Branch #{$p->branch_id}") : 'Global';
                $stk = (float) $p->stock;
                $branchStockDetails[] = "{$bName}: {$stk}";
                $groupStock += $stk;
            }

            $totalStockBefore += $groupStock;

            $previewData[] = [
                $master->name,
                "ID: {$master->id} (Master)",
                "IDs: {$dupIds}",
                implode(' | ', $branchStockDetails),
                "{$groupStock} pcs",
            ];
        }

        $this->table(
            ['Product Name', 'Master Record', 'Duplicates to Consolidate', 'Branch Stock Breakdown', 'Total Stock'],
            $previewData
        );

        $this->info("Total physical stock across all duplicate groups before consolidation: {$totalStockBefore} pcs");

        if (!$isDryRun && !$isForce) {
            if (!$this->confirm('Do you want to proceed with consolidating these products?', true)) {
                $this->warn('Consolidation cancelled by user.');
                return self::SUCCESS;
            }
        }

        if ($isDryRun) {
            $this->info('Dry-run complete. Exiting without modifying database.');
            return self::SUCCESS;
        }

        // 2. Perform transactional consolidation
        DB::transaction(function () use ($consolidationPlan, &$totalStockBefore) {
            $totalStockAfter = 0;

            foreach ($consolidationPlan as $plan) {
                /** @var Product $master */
                $master = $plan['master'];
                $duplicates = $plan['duplicates'];
                $groupTotal = 0;

                $this->line("Consolidating '{$master->name}' (Master ID: {$master->id})...");

                // A. Populate / Update branch_product for the master
                $masterBranchId = $master->branch_id ?: 1; // Default to branch 1 if null
                $masterStock = (float) $master->stock;

                DB::table('branch_product')->updateOrInsert(
                    ['branch_id' => $masterBranchId, 'product_id' => $master->id],
                    [
                        'stock'      => $masterStock,
                        'price'      => $master->selling_price,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
                $groupTotal += $masterStock;

                // B. For each duplicate, migrate its branch stock into branch_product for master
                foreach ($duplicates as $dup) {
                    /** @var Product $dup */
                    $dupBranchId = $dup->branch_id ?: 2;
                    $dupStock = (float) $dup->stock;

                    // If branch_product already exists for (dupBranchId, master->id), increment stock, else insert
                    $existingPivot = DB::table('branch_product')
                        ->where('branch_id', $dupBranchId)
                        ->where('product_id', $master->id)
                        ->first();

                    if ($existingPivot) {
                        DB::table('branch_product')
                            ->where('id', $existingPivot->id)
                            ->update([
                                'stock'      => (float) $existingPivot->stock + $dupStock,
                                'updated_at' => now(),
                            ]);
                    } else {
                        DB::table('branch_product')->insert([
                            'branch_id'  => $dupBranchId,
                            'product_id' => $master->id,
                            'stock'      => $dupStock,
                            'price'      => $dup->selling_price ?? $master->selling_price,
                            'is_active'  => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                    $groupTotal += $dupStock;

                    // C. Remap Foreign Keys from dup->id to master->id
                    $this->remapProductReferences($dup->id, $master->id);

                    // D. Safely delete duplicate product record
                    $dup->delete(); // Soft delete
                }

                // E. Update master product to be truly global
                $master->update([
                    'branch_id' => null, // Global product catalog
                    'stock'     => 0,    // Stock is dynamically computed from branch_product
                ]);

                // F. Verify stock sum for this master
                $actualMasterStockSum = (float) DB::table('branch_product')
                    ->where('product_id', $master->id)
                    ->sum('stock');

                if (abs($actualMasterStockSum - $groupTotal) > 0.001) {
                    throw new \Exception("Stock drift detected for product '{$master->name}'! Expected {$groupTotal}, found {$actualMasterStockSum}. Transaction aborted.");
                }

                $totalStockAfter += $actualMasterStockSum;
                $this->info("  -> Master ID {$master->id} consolidated with {$actualMasterStockSum} total stock.");
            }

            // G. Final zero-loss check
            if (abs($totalStockAfter - $totalStockBefore) > 0.001) {
                throw new \Exception("Zero-loss inventory check failed! Before: {$totalStockBefore}, After: {$totalStockAfter}. Aborting transaction.");
            }

            // H. Ensure all remaining active products have branch_product rows
            $remainingActive = Product::whereNull('deleted_at')->get();
            $this->ensureBranchProductsExist($remainingActive, false);
        });

        $this->info('===========================================================');
        $this->info('  Consolidation completed successfully with ZERO stock loss!');
        $this->info('===========================================================');

        return self::SUCCESS;
    }

    /**
     * Remap all foreign keys and relations from a duplicate product ID to master ID.
     */
    protected function remapProductReferences(int $oldId, int $newId): void
    {
        // 1. Order items
        if (Schema::hasTable('order_items')) {
            DB::table('order_items')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 2. Sale items
        if (Schema::hasTable('sale_items')) {
            DB::table('sale_items')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 3. Cart items
        if (Schema::hasTable('cart_items')) {
            DB::table('cart_items')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 4. Product reviews
        if (Schema::hasTable('product_reviews')) {
            DB::table('product_reviews')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 5. Product addons (prevent duplicate assignments)
        if (Schema::hasTable('product_addons')) {
            $existingAddons = DB::table('product_addons')->where('product_id', $newId)->pluck('addon_id')->toArray();
            DB::table('product_addons')
                ->where('product_id', $oldId)
                ->whereIn('addon_id', $existingAddons)
                ->delete();
            DB::table('product_addons')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 6. Product addon groups
        if (Schema::hasTable('product_addon_groups')) {
            $existingGroups = DB::table('product_addon_groups')->where('product_id', $newId)->pluck('addon_group_id')->toArray();
            DB::table('product_addon_groups')
                ->where('product_id', $oldId)
                ->whereIn('addon_group_id', $existingGroups)
                ->delete();
            DB::table('product_addon_groups')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 7. Addon groups table
        if (Schema::hasTable('addon_groups')) {
            DB::table('addon_groups')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 8. Menu item ingredients (prevent duplicate ingredient rows)
        if (Schema::hasTable('menu_item_ingredients')) {
            $masterIngredients = DB::table('menu_item_ingredients')->where('menu_item_id', $newId)->pluck('ingredient_id')->toArray();
            DB::table('menu_item_ingredients')
                ->where('menu_item_id', $oldId)
                ->whereIn('ingredient_id', $masterIngredients)
                ->delete();
            DB::table('menu_item_ingredients')->where('menu_item_id', $oldId)->update(['menu_item_id' => $newId]);
        }

        // 9. Stock movements
        if (Schema::hasTable('stock_movements')) {
            DB::table('stock_movements')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 10. Inventory logs
        if (Schema::hasTable('inventory_logs')) {
            DB::table('inventory_logs')->where('product_id', $oldId)->update(['product_id' => $newId]);
        }

        // 11. Polymorphic Stock Logs
        if (Schema::hasTable('stock_logs')) {
            DB::table('stock_logs')
                ->where('storable_type', Product::class)
                ->where('storable_id', $oldId)
                ->update(['storable_id' => $newId]);
        }
    }

    /**
     * Ensure every active product has a branch_product row for all active branches.
     */
    protected function ensureBranchProductsExist($products, bool $isDryRun): void
    {
        $branches = Branch::all();
        if ($branches->isEmpty()) return;

        foreach ($products as $p) {
            foreach ($branches as $branch) {
                $exists = DB::table('branch_product')
                    ->where('product_id', $p->id)
                    ->where('branch_id', $branch->id)
                    ->exists();

                if (!$exists && !$isDryRun) {
                    DB::table('branch_product')->insert([
                        'branch_id'  => $branch->id,
                        'product_id' => $p->id,
                        'stock'      => 0,
                        'price'      => $p->selling_price,
                        'is_active'  => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
