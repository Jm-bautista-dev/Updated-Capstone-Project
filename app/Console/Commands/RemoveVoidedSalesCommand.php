<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class RemoveVoidedSalesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makidesu:remove-voided-sales
                            {--status=all-voided : The status to remove ("voided", "cancelled", or "all-voided" for both)}
                            {--dry-run : Inspect and list matching sales without deleting them}
                            {--force : Execute removal without interactive confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely remove voided / cancelled sales records from the sales data while preserving all valid completed sales, delivery records, orders, inventory, accounts, and products.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('');
        $this->info('========================================================================');
        $this->info('       MAKI DESU — VOIDED / CANCELLED SALES REMOVAL UTILITY             ');
        $this->info('========================================================================');
        $this->line('');

        $connection = config('database.default');
        $dbName = config("database.connections.{$connection}.database");
        $dbHost = config("database.connections.{$connection}.host");

        $this->info("Target Database:  [{$dbName}] on [{$dbHost}] (Driver: {$connection})");
        $this->info("Environment:      [" . app()->environment() . "]");
        $this->line('');

        if (!Schema::hasTable('sales')) {
            $this->error("❌ Error: The 'sales' table does not exist in the current database.");
            return SymfonyCommand::FAILURE;
        }

        // 1. Inspect existing sales status distribution
        $statusBreakdown = DB::table('sales')
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(total) as sum_total'))
            ->groupBy('status')
            ->get();

        $this->info('Current Sales Status Breakdown:');
        $headers = ['Status', 'Record Count', 'Sum Total (PHP)'];
        $rows = [];
        foreach ($statusBreakdown as $sb) {
            $rows[] = [
                $sb->status ?? '(null)',
                number_format($sb->count),
                '₱' . number_format((float)($sb->sum_total ?? 0), 2),
            ];
        }
        $this->table($headers, $rows);
        $this->line('');

        $statusOption = strtolower(trim($this->option('status') ?? 'all-voided'));
        $targetStatuses = match ($statusOption) {
            'voided' => ['voided'],
            'cancelled' => ['cancelled'],
            default => ['voided', 'cancelled'],
        };

        // 2. Query target voided/cancelled sales
        $targetQuery = DB::table('sales')->whereIn(DB::raw('LOWER(TRIM(status))'), $targetStatuses);
        $targetCount = (clone $targetQuery)->count();
        $targetSales = (clone $targetQuery)->get();
        $targetIds = $targetSales->pluck('id')->toArray();

        $this->info("Total target records matching [" . implode(', ', $targetStatuses) . "]: {$targetCount}");

        if ($targetCount === 0) {
            $this->info("✅ No sales records matching [" . implode(', ', $targetStatuses) . "] exist in the database. No cleanup needed.");
            $this->line('');
            return SymfonyCommand::SUCCESS;
        }

        // Display sample records to be removed
        $this->warn("The following {$targetCount} sales record(s) will be removed from the sales table:");
        $sampleRows = [];
        foreach ($targetSales->take(15) as $ts) {
            $sampleRows[] = [
                $ts->id,
                $ts->order_number ?? 'N/A',
                $ts->status,
                '₱' . number_format((float)($ts->total ?? 0), 2),
                $ts->type ?? 'N/A',
                $ts->created_at ?? 'N/A',
            ];
        }
        $this->table(['ID', 'Order Number', 'Status', 'Total', 'Type', 'Created At'], $sampleRows);
        if ($targetCount > 15) {
            $this->comment("... and " . ($targetCount - 15) . " more records.");
        }
        $this->line('');

        if ($this->option('dry-run')) {
            $this->comment("🔍 [DRY RUN] Inspection mode active. No records were deleted.");
            return SymfonyCommand::SUCCESS;
        }

        if (!$this->option('force')) {
            if (!$this->confirm("Are you sure you want to permanently remove these {$targetCount} voided/cancelled sales records from the sales data?", false)) {
                $this->warn('Operation cancelled by user.');
                return SymfonyCommand::SUCCESS;
            }
        }

        // 3. Perform atomic cleanup within a transaction
        $preCompletedCount = DB::table('sales')->whereNotIn(DB::raw('LOWER(TRIM(status))'), $targetStatuses)->count();
        $preCompletedSum = (float) DB::table('sales')->whereNotIn(DB::raw('LOWER(TRIM(status))'), $targetStatuses)->sum('total');
        $preDeliveriesCount = Schema::hasTable('deliveries') ? DB::table('deliveries')->count() : 0;
        $preOrdersCount = Schema::hasTable('orders') ? DB::table('orders')->count() : 0;

        $this->info("Executing safe removal of voided sales records...");

        $deletedSalesCount = 0;
        try {
            DB::transaction(function () use ($targetIds, &$deletedSalesCount) {
                // Safeguard: Decouple delivery records by setting sale_id = NULL to prevent CASCADE deletion of delivery data
                if (Schema::hasTable('deliveries') && Schema::hasColumn('deliveries', 'sale_id')) {
                    DB::table('deliveries')->whereIn('sale_id', $targetIds)->update(['sale_id' => null]);
                }

                // Safeguard: Decouple print jobs
                if (Schema::hasTable('print_jobs') && Schema::hasColumn('print_jobs', 'sale_id')) {
                    DB::table('print_jobs')->whereIn('sale_id', $targetIds)->update(['sale_id' => null]);
                }

                // Safeguard: Decouple delivery assignment logs
                if (Schema::hasTable('delivery_assignment_logs') && Schema::hasColumn('delivery_assignment_logs', 'sale_id')) {
                    DB::table('delivery_assignment_logs')->whereIn('sale_id', $targetIds)->update(['sale_id' => null]);
                }

                // Delete child sale items
                if (Schema::hasTable('sale_items')) {
                    DB::table('sale_items')->whereIn('sale_id', $targetIds)->delete();
                }

                // Delete sales records
                $deletedSalesCount = DB::table('sales')->whereIn('id', $targetIds)->delete();
            });

            Log::info("RemoveVoidedSalesCommand: Successfully removed {$deletedSalesCount} voided sales records.", [
                'deleted_count' => $deletedSalesCount,
                'database'      => $dbName,
            ]);
        } catch (\Exception $e) {
            $this->error("❌ Error deleting voided sales records: " . $e->getMessage());
            Log::error("RemoveVoidedSalesCommand failed: " . $e->getMessage(), ['exception' => $e]);
            return SymfonyCommand::FAILURE;
        }

        // 4. Post-cleanup Verification
        $postPreservedCount = DB::table('sales')->count();
        $postPreservedSum = (float) DB::table('sales')->sum('total');
        $postDeliveriesCount = Schema::hasTable('deliveries') ? DB::table('deliveries')->count() : 0;
        $postOrdersCount = Schema::hasTable('orders') ? DB::table('orders')->count() : 0;

        $this->line('');
        $this->info('========================================================================');
        $this->info('                     POST-CLEANUP VERIFICATION                          ');
        $this->info('========================================================================');
        $this->line("  ✓ Target records removed:        {$deletedSalesCount}");
        $this->line("  ✓ Valid sales preserved:         {$postPreservedCount} (Expected: {$preCompletedCount})");
        $this->line("  ✓ Valid sales total:             ₱" . number_format($postPreservedSum, 2) . " (Expected: ₱" . number_format($preCompletedSum, 2) . ")");
        $this->line("  ✓ Deliveries records preserved:  {$postDeliveriesCount} (Expected: {$preDeliveriesCount})");
        $this->line("  ✓ Orders records preserved:      {$postOrdersCount} (Expected: {$preOrdersCount})");
        $this->info('========================================================================');

        if ($postPreservedCount === $preCompletedCount && $postDeliveriesCount === $preDeliveriesCount && $postOrdersCount === $preOrdersCount) {
            $this->info('✅ SUCCESS: All voided/cancelled sales records were safely removed. All valid sales, deliveries, orders, products, and inventory data remain completely intact!');
            return SymfonyCommand::SUCCESS;
        } else {
            $this->warn('⚠️ Discrepancy detected during post-cleanup validation. Please inspect database integrity.');
            return SymfonyCommand::FAILURE;
        }
    }
}
