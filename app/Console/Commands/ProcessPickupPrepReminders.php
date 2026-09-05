<?php

namespace App\Console\Commands;

use App\Services\PickupPreparationService;
use Illuminate\Console\Command;

class ProcessPickupPrepReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pickups:process-prep-reminders {--branch= : Optional Branch ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Scan scheduled pickup orders and broadcast preparation start reminders as they enter their preparation window.';

    /**
     * Execute the console command.
     */
    public function handle(PickupPreparationService $prepService): int
    {
        $branchId = $this->option('branch') ? (int) $this->option('branch') : null;
        $result = $prepService->evaluateAndDispatchReminders($branchId);

        $count = $result['dispatched_count'] ?? 0;
        if ($count > 0) {
            $this->info("Successfully evaluated and dispatched {$count} pickup preparation reminder(s).");
        } else {
            $this->line("No new pickup orders due for preparation reminders at this time.");
        }

        return self::SUCCESS;
    }
}
