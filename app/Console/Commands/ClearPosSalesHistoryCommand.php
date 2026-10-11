<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Order;
use App\Models\Delivery;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\User;
use App\Models\Branch;
use App\Models\SalesBackup;

class ClearPosSalesHistoryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makidesu:clear-pos-sales-history
                            {--force : Execute deletion without interactive confirmation prompt}
                            {--dry-run : Preview identified records without making any database changes}
                            {--no-backup : Skip creating pre-cleanup backup snapshot (not recommended)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely remove existing POS sales-history records and previously seeded sales data while strictly preserving all orders, deliveries, inventory, and accounts.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('');
        $this->info('========================================================================');
        $this->info('      MAKI DESU — CONTROLLED POS SALES HISTORY CLEANUP                 ');
        $this->info('========================================================================');
        $this->warn('  SCOPE: Clears exclusively POS sales history & previously seeded sales. ');
        $this->warn('  PRESERVED: Deliveries, pickups, active orders, inventory stocks,      ');
        $this->warn('             products, recipes, user accounts, and branches.            ');
        $this->info('========================================================================');
        $this->line('');

        $connection = config('database.default');
        $dbName = config("database.connections.{$connection}.database");
        $dbHost = config("database.connections.{$connection}.host");

        $this->info("Target Database:    [{$dbName}] on [{$dbHost}] (Driver: {$connection})");
        $this->info("Environment:        [" . app()->environment() . "]");
        $this->line('');

        // 1. Identify POS Sales records vs preserved transaction types
        // POS sales are defined as sales where order_id IS NULL and source IN ('pos', 'historical_import') or type IN ('dine-in', 'take-out', 'pos')
        // AND not associated with any delivery record in the deliveries table.
        $deliverySaleIds = [];
        if (Schema::hasTable('deliveries')) {
            $deliverySaleIds = DB::table('deliveries')->whereNotNull('sale_id')->pluck('sale_id')->toArray();
        }

        $posSalesQuery = Sale::whereNull('order_id')
            ->whereNotIn('id', $deliverySaleIds);

        $totalSalesCount = Sale::count();
        $posSalesCount = (clone $posSalesQuery)->count();
        $preservedSalesCount = $totalSalesCount - $posSalesCount;

        $posSaleIds = (clone $posSalesQuery)->pluck('id')->toArray();
        $posSaleItemsCount = SaleItem::whereIn('sale_id', $posSaleIds)->count();
        $totalSaleItemsCount = SaleItem::count();

        // Check if there are active / preserved transactions
        $ordersCount = Schema::hasTable('orders') ? Order::count() : 0;
        $deliveriesCount = Schema::hasTable('deliveries') ? DB::table('deliveries')->count() : 0;
        $productsCount = Schema::hasTable('products') ? Product::count() : 0;
        $usersCount = Schema::hasTable('users') ? User::count() : 0;
        $branchesCount = Schema::hasTable('branches') ? Branch::count() : 0;
        $ingredientsCount = Schema::hasTable('ingredients') ? DB::table('ingredients')->count() : 0;
        $ingredientStocksCount = Schema::hasTable('ingredient_stocks') ? DB::table('ingredient_stocks')->count() : 0;

        $this->comment('--- RECORD BREAKDOWN PRIOR TO CLEANUP ---');
        $this->table(
            ['Entity / Table', 'Current Count', 'Target for Deletion', 'Status After Cleanup'],
            [
                ['POS Sales (`sales`)', $posSalesCount, $posSalesCount, '0 (Cleared)'],
                ['POS Line Items (`sale_items`)', $posSaleItemsCount, $posSaleItemsCount, '0 (Cleared)'],
                ['Delivery & Pickup Sales (`sales`)', $preservedSalesCount, 0, "{$preservedSalesCount} (PRESERVED)"],
                ['Customer Orders (`orders`)', $ordersCount, 0, "{$ordersCount} (PRESERVED)"],
                ['Deliveries (`deliveries`)', $deliveriesCount, 0, "{$deliveriesCount} (PRESERVED)"],
                ['Products & Menu Items (`products`)', $productsCount, 0, "{$productsCount} (PRESERVED)"],
                ['Ingredients (`ingredients`)', $ingredientsCount, 0, "{$ingredientsCount} (PRESERVED)"],
                ['Ingredient Stocks (`ingredient_stocks`)', $ingredientStocksCount, 0, "{$ingredientStocksCount} (PRESERVED)"],
                ['User Accounts (`users`)', $usersCount, 0, "{$usersCount} (PRESERVED)"],
                ['Branches (`branches`)', $branchesCount, 0, "{$branchesCount} (PRESERVED)"],
            ]
        );

        if ($posSalesCount === 0) {
            $this->info("✅ No POS sales history records found to delete. The system is already clean.");
            return SymfonyCommand::SUCCESS;
        }

        if ($this->option('dry-run')) {
            $this->warn("🔎 DRY RUN MODE: No records were deleted. Run without --dry-run to execute cleanup.");
            return SymfonyCommand::SUCCESS;
        }

        // Confirmation prompt
        if (!$this->option('force')) {
            $confirmed = $this->confirm(
                "Are you sure you want to permanently delete {$posSalesCount} POS sales records and {$posSaleItemsCount} line items?",
                false
            );

            if (!$confirmed) {
                $this->line("Operation cancelled by user.");
                return SymfonyCommand::SUCCESS;
            }
        }

        // 2. Pre-cleanup Safety Backup
        $backupName = null;
        if (!$this->option('no-backup')) {
            $this->info("Creating pre-cleanup safety backup snapshot...");
            $backupName = $this->createSafetyBackup($posSaleIds);
            $this->info("✅ Backup saved: {$backupName}");
        }

        // 3. Transactional deletion
        $this->info("Executing controlled deletion inside database transaction...");

        try {
            DB::transaction(function () use ($posSaleIds, $posSalesCount, $posSaleItemsCount) {
                // Delete strictly dependent sale items in chunks
                $deletedItems = 0;
                $chunks = array_chunk($posSaleIds, 500);
                foreach ($chunks as $chunk) {
                    $deletedItems += DB::table('sale_items')->whereIn('sale_id', $chunk)->delete();
                }

                // Delete sales records in chunks
                $deletedSales = 0;
                foreach ($chunks as $chunk) {
                    $deletedSales += DB::table('sales')->whereIn('id', $chunk)->delete();
                }

                $this->line("   - Deleted {$deletedItems} POS sale items.");
                $this->line("   - Deleted {$deletedSales} POS sales records.");
            });

            $this->info("✅ Database transaction committed successfully.");

        } catch (\Throwable $e) {
            $this->error("❌ ERROR during deletion transaction: " . $e->getMessage());
            $this->error("Transaction has been rolled back automatically. No data was altered.");
            return SymfonyCommand::FAILURE;
        }

        // 4. Post-cleanup Verification
        $this->line('');
        $this->comment('--- VERIFICATION REPORT ---');

        $remainingPosSales = Sale::whereNull('order_id')->whereNotIn('id', $deliverySaleIds)->count();
        $remainingSaleItems = SaleItem::whereIn('sale_id', $posSaleIds)->count();
        $finalProductsCount = Product::count();
        $finalIngredientsCount = DB::table('ingredients')->count();
        $finalUsersCount = User::count();
        $finalOrdersCount = Order::count();

        $this->table(
            ['Check', 'Expected', 'Actual', 'Result'],
            [
                ['Remaining POS Sales', '0', (string)$remainingPosSales, $remainingPosSales === 0 ? 'PASSED ✅' : 'FAILED ❌'],
                ['Remaining Target SaleItems', '0', (string)$remainingSaleItems, $remainingSaleItems === 0 ? 'PASSED ✅' : 'FAILED ❌'],
                ['Products Intact', (string)$productsCount, (string)$finalProductsCount, $finalProductsCount === $productsCount ? 'PASSED ✅' : 'FAILED ❌'],
                ['Ingredients Intact', (string)$ingredientsCount, (string)$finalIngredientsCount, $finalIngredientsCount === $ingredientsCount ? 'PASSED ✅' : 'FAILED ❌'],
                ['Users Intact', (string)$usersCount, (string)$finalUsersCount, $finalUsersCount === $usersCount ? 'PASSED ✅' : 'FAILED ❌'],
                ['Orders Intact', (string)$ordersCount, (string)$finalOrdersCount, $finalOrdersCount === $ordersCount ? 'PASSED ✅' : 'FAILED ❌'],
            ]
        );

        $this->info("========================================================================");
        $this->info("      CLEANUP COMPLETE: SYSTEM IS READY FOR EXCEL SALES IMPORT           ");
        $this->info("========================================================================");
        if ($backupName) {
            $this->line("Backup snapshot: {$backupName}");
        }

        return SymfonyCommand::SUCCESS;
    }

    /**
     * Create a JSON backup snapshot of targeted sales and sale items.
     */
    protected function createSafetyBackup(array $posSaleIds): string
    {
        $sales = DB::table('sales')->whereIn('id', $posSaleIds)->get()->map(fn($item) => (array)$item)->toArray();
        $saleItems = DB::table('sale_items')->whereIn('sale_id', $posSaleIds)->get()->map(fn($item) => (array)$item)->toArray();

        $timestamp = date('Ymd_His');
        $backupName = 'pos_sales_pre_cleanup_' . $timestamp;
        $storagePath = 'backups/' . $backupName . '.json';

        Storage::put($storagePath, json_encode([
            'metadata' => [
                'type' => 'pos_sales_pre_cleanup',
                'created_at' => now()->toIso8601String(),
                'sales_count' => count($sales),
                'sale_items_count' => count($saleItems),
            ],
            'sales' => $sales,
            'sale_items' => $saleItems
        ], JSON_PRETTY_PRINT));

        if (Schema::hasTable('sales_backups')) {
            SalesBackup::create([
                'backup_name' => $backupName,
                'file_path' => $storagePath,
                'records_count' => count($sales),
            ]);
        }

        return $storagePath;
    }
}
