<?php

namespace App\Console\Commands;

use App\Services\InventoryExpirationService;
use Illuminate\Console\Command;

class ProcessExpiredInventoryCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:process-expired
                            {--branch= : Optional branch ID to scope processing}
                            {--preview : Preview expired batches without committing disposal}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically detect and dispose of expired ingredient batches, updating usable stock and product availability.';

    /**
     * Execute the console command.
     */
    public function handle(InventoryExpirationService $service): int
    {
        $branchOption = $this->option('branch');
        $branchId = $branchOption !== null && $branchOption !== '' ? (int) $branchOption : null;
        $isPreview = (bool) $this->option('preview');

        $this->info('========================================================================');
        $this->info('  MAKI DESU — AUTOMATIC EXPIRED INVENTORY DISPOSAL & RECONCILIATION     ');
        $this->info('========================================================================');
        $this->line("Mode:     " . ($isPreview ? '[PREVIEW / AUDIT ONLY]' : '[LIVE COMMITTED DISPOSAL]'));
        $this->line("Branch:   " . ($branchId ? "Branch #{$branchId}" : 'All Branches'));
        $this->line("Timezone: " . \App\Models\IngredientBatch::businessTimezone());
        $this->line('');

        if ($isPreview) {
            $audit = $service->getExpiredBatchesAudit($branchId);
            $count = $audit['total_expired'];

            if ($count === 0) {
                $this->info('✅ No expired ingredient batches found with remaining stock.');
                return 0;
            }

            $this->warn("⚠️ Found {$count} expired batch(es) eligible for automated disposal:");
            $tableData = [];
            foreach ($audit['expired'] as $item) {
                $prods = array_map(fn($p) => "{$p['name']} ({$p['current_servings']}s)", $item['affected_products']);
                $tableData[] = [
                    $item['batch_id'],
                    $item['batch_code'],
                    $item['ingredient_name'],
                    $item['branch_name'],
                    $item['expiration_date'],
                    "{$item['remaining_quantity']} {$item['unit']}",
                    empty($prods) ? 'None' : implode(', ', array_slice($prods, 0, 3)),
                ];
            }

            $this->table(['Batch ID', 'Code', 'Ingredient', 'Branch', 'Expiry', 'Remaining', 'Affected Products'], $tableData);
            $this->line('');
            $this->comment('To execute disposal and recalculate servings, run: php artisan inventory:process-expired');
            return 0;
        }

        $result = $service->processExpiredBatches($branchId);

        if (!$result['success']) {
            $this->error('Failed: ' . ($result['message'] ?? $result['error'] ?? 'Unknown error'));
            return 1;
        }

        $disposedCount = $result['disposed_count'];

        if ($disposedCount === 0) {
            $this->info('✅ Clean inventory state: 0 expired batches found with remaining stock.');
            return 0;
        }

        $this->info("✅ Successfully processed and disposed {$disposedCount} expired batch(es):");
        $tableData = [];
        foreach ($result['disposed_items'] as $item) {
            $changes = [];
            foreach ($item['affected_products'] as $p) {
                $changes[] = "{$p['name']}: {$p['previous_servings']} → {$p['recalculated_servings']} servings";
            }

            $tableData[] = [
                $item['batch_id'],
                $item['batch_code'],
                $item['ingredient_name'],
                $item['branch_name'],
                "{$item['disposed_quantity']} {$item['unit']}",
                "₱" . number_format($item['cost_at_loss'], 2),
                empty($changes) ? 'None' : implode("\n", $changes),
            ];
        }

        $this->table(['Batch ID', 'Code', 'Ingredient', 'Branch', 'Disposed Qty', 'Cost At Loss', 'Product Serving Updates'], $tableData);
        $this->info('All affected product availability counts and stock levels have been updated and broadcast.');

        return 0;
    }
}
