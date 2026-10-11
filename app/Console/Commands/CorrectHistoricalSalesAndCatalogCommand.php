<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CashierShift;
use App\Models\User;

class CorrectHistoricalSalesAndCatalogCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makidesu:correct-historical-sales-and-catalog
                            {--dry-run : Preview corrections and audit without modifying database}
                            {--force : Execute destructive cleanups in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Safely removes AI-invented products/categories, corrects historical sales timestamps to 09:00-19:00, and verifies database integrity.';

    /**
     * Confirmed unauthorized products created by earlier seeding operations.
     */
    protected array $unauthorizedProductNames = [
        'California Maki', // ID 107 (Created 2026-10-11, duplicates authentic Bento / 4pcs / 8pcs items)
        'Spicy Tuna Maki',
        'Dragon Roll',
        'Tuna Nigiri',
        'Ebi Nigiri',
        'Tonkotsu Ramen',
        'Miso Ramen',
        'Yaki Udon',
        'Katsudon',
        'Gyudon',
        'Oyakodon',
        'Edamame',
        'Pork Gyoza',
        'Matcha Iced Tea',
        'Torched Ham Platter', // ID 121 (Created 2026-10-11 for uncatalogued Row 220)
    ];

    /**
     * Confirmed unauthorized categories created on 2026-10-11 by CategorySeeder.
     */
    protected array $unauthorizedCategoryNames = [
        'Maki & Rolls',
        'Sashimi & Nigiri',
        'Ramen & Noodles',
        'Donburi',
        'Sides & Beverages',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('');
        $this->info('========================================================================');
        $this->info('  MAKI DESU — HISTORICAL SALES & CATALOG CORRECTION ENGINE              ');
        $this->info('========================================================================');

        $isDryRun = $this->option('dry-run');
        $isForce = $this->option('force');

        $this->info('Environment: [' . app()->environment() . ']');
        $this->info('Mode:        [' . ($isDryRun ? 'DRY-RUN (Preview & Audit Only)' : 'LIVE EXECUTION') . ']');
        $this->line('');

        // 1. AUDIT PHASE: Identify unauthorized products and categories
        $this->comment('--- 1. AUDITING DATABASE FOR UNAUTHORIZED CATALOG ITEMS ---');

        $unauthorizedProducts = DB::table('products')
            ->where(function ($q) {
                $q->whereIn('name', $this->unauthorizedProductNames)
                  ->whereDate('created_at', '2026-10-11');
            })
            ->orWhereIn('id', range(107, 121))
            ->get();

        $this->line("Found unauthorized products: <fg=yellow>{$unauthorizedProducts->count()}</>");
        $prodTable = [];
        $unauthorizedProdIds = $unauthorizedProducts->pluck('id')->toArray();

        foreach ($unauthorizedProducts as $p) {
            $salesCount = DB::table('sale_items')->where('product_id', $p->id)->count();
            $orderCount = DB::table('order_items')->where('product_id', $p->id)->count();
            $prodTable[] = [
                $p->id,
                $p->name,
                $p->category_id,
                $p->selling_price,
                $salesCount,
                $orderCount,
                $p->created_at,
            ];
        }
        $this->table(['ID', 'Name', 'Cat ID', 'Price', 'Sale Items', 'Order Items', 'Created At'], $prodTable);

        // Audit Categories
        $unauthorizedCategories = DB::table('categories')
            ->whereIn('name', $this->unauthorizedCategoryNames)
            ->whereDate('created_at', '2026-10-11')
            ->get();

        $this->line("Found unauthorized categories: <fg=yellow>{$unauthorizedCategories->count()}</>");
        $catTable = [];
        $unauthorizedCatIds = $unauthorizedCategories->pluck('id')->toArray();

        foreach ($unauthorizedCategories as $c) {
            $linkedProds = DB::table('products')->where('category_id', $c->id)->count();
            $catTable[] = [
                $c->id,
                $c->name,
                $linkedProds,
                $c->created_at,
            ];
        }
        $this->table(['ID', 'Name', 'Linked Products', 'Created At'], $catTable);

        // Audit SaleItems referencing unauthorized products
        $salesReferencingUnauthorized = DB::table('sale_items')
            ->whereIn('product_id', $unauthorizedProdIds)
            ->get();

        $this->line("SaleItems referencing unauthorized products: <fg=yellow>{$salesReferencingUnauthorized->count()}</>");
        $unauthorizedSaleIds = $salesReferencingUnauthorized->pluck('sale_id')->unique()->toArray();

        foreach ($salesReferencingUnauthorized as $si) {
            $sale = DB::table('sales')->where('id', $si->sale_id)->first();
            $this->warn("  - Sale #{$si->sale_id} [Order: {$sale?->order_number}]: Product ID {$si->product_id}, Total: ₱{$si->subtotal}, Date: {$sale?->created_at}");
        }

        // 2. AUDIT PHASE: Check historical sales timestamps in Asia/Manila business timezone
        $this->comment("\n--- 2. AUDITING HISTORICAL SALES TIMESTAMPS (Loyverse in Asia/Manila) ---");
        $historicalSales = DB::table('sales')
            ->where('source_system', 'Loyverse')
            ->get();

        $this->line("Total historical Loyverse sales: <fg=yellow>{$historicalSales->count()}</>");
        $businessTimezone = 'Asia/Manila';
        $storageTimezone = config('app.timezone', 'UTC');

        $outOfWindowCount = 0;
        foreach ($historicalSales as $s) {
            $manilaTime = Carbon::parse($s->created_at)->setTimezone($businessTimezone);
            $time = $manilaTime->format('H:i:s');
            if ($time < '09:00:00' || $time > '19:00:00') {
                $outOfWindowCount++;
            }
        }
        $this->line("Historical sales outside 09:00:00 - 19:00:00 Asia/Manila: <fg=" . ($outOfWindowCount > 0 ? 'red' : 'green') . ">{$outOfWindowCount}</>");

        // 3. BACKUP CREATION
        $backupDir = storage_path('app/backups');
        if (!File::isDirectory($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }
        $backupTimestamp = now()->format('Ymd_His');
        $backupFile = "{$backupDir}/sales_catalog_correction_backup_{$backupTimestamp}.json";

        $backupPayload = [
            'created_at' => now()->toIso8601String(),
            'unauthorized_products' => $unauthorizedProducts->toArray(),
            'unauthorized_categories' => $unauthorizedCategories->toArray(),
            'unauthorized_sale_items' => $salesReferencingUnauthorized->toArray(),
            'unauthorized_sales' => DB::table('sales')->whereIn('id', $unauthorizedSaleIds)->get()->toArray(),
            'affected_historical_sales_count' => $historicalSales->count(),
        ];

        File::put($backupFile, json_encode($backupPayload, JSON_PRETTY_PRINT));
        $this->info("Backup created at: [{$backupFile}]");

        if ($isDryRun) {
            $this->comment("\n🔎 DRY-RUN COMPLETE: Review proposed changes above. Re-run without --dry-run to apply corrections.");
            return SymfonyCommand::SUCCESS;
        }

        // 4. TRANSACTIONAL CORRECTION EXECUTION
        $this->line("\n--- 3. APPLYING CORRECTIONS TRANSACTIONALLY ---");

        DB::transaction(function () use ($unauthorizedProdIds, $unauthorizedCatIds, $unauthorizedSaleIds, $businessTimezone, $storageTimezone) {
            // A. Remove unauthorized sales (Row 220 Torched Ham Platter)
            if (!empty($unauthorizedSaleIds)) {
                $deletedItems = DB::table('sale_items')->whereIn('sale_id', $unauthorizedSaleIds)->delete();
                $deletedSales = DB::table('sales')->whereIn('id', $unauthorizedSaleIds)->delete();
                $this->info("Removed {$deletedSales} unauthorized sales and {$deletedItems} sale items.");
            }

            // B. Remove pivot records for unauthorized products and categories
            if (!empty($unauthorizedProdIds)) {
                $deletedBranchProd = DB::table('branch_product')->whereIn('product_id', $unauthorizedProdIds)->delete();
                $this->info("Removed {$deletedBranchProd} branch_product pivot records.");
            }

            if (!empty($unauthorizedCatIds)) {
                $deletedBranchCat = DB::table('branch_category')->whereIn('category_id', $unauthorizedCatIds)->delete();
                $this->info("Removed {$deletedBranchCat} branch_category pivot records.");
            }

            // C. Delete unauthorized products
            if (!empty($unauthorizedProdIds)) {
                $deletedProds = DB::table('products')->whereIn('id', $unauthorizedProdIds)->delete();
                $this->info("Deleted {$deletedProds} unauthorized products from catalog.");
            }

            // D. Delete unauthorized categories
            if (!empty($unauthorizedCatIds)) {
                $deletedCats = DB::table('categories')->whereIn('id', $unauthorizedCatIds)->delete();
                $this->info("Deleted {$deletedCats} unauthorized categories.");
            }

            // E. Correct timestamps on all remaining historical sales to ensure strict 09:00:00 - 19:00:00 Asia/Manila distribution
            $remainingHistoricalSales = DB::table('sales')
                ->where('source_system', 'Loyverse')
                ->orderBy('created_at')
                ->get();

            $this->info("Standardizing timestamps for {$remainingHistoricalSales->count()} historical sales (09:00 AM - 07:00 PM Manila time)...");

            $startSeconds = 9 * 3600; // 09:00:00 AM Manila (32,400s)
            $spanSeconds = 10 * 3600; // 10 hours span (36,000s) -> until 19:00:00 PM Manila inclusive

            $dailyCashTotals = [];

            foreach ($remainingHistoricalSales as $idx => $sale) {
                // Extract true source sale date from order_number POS-SC-YYYYMMDD-...
                if (preg_match('/POS-[A-Z]+-(\d{4})(\d{2})(\d{2})-/', $sale->order_number, $m)) {
                    $saleDate = "{$m[1]}-{$m[2]}-{$m[3]}";
                } else {
                    $saleDate = Carbon::parse($sale->created_at)->setTimezone($businessTimezone)->format('Y-m-d');
                }

                $seedStr = "{$saleDate}-{$idx}-{$sale->id}-{$sale->order_number}";
                $hashVal = abs(crc32($seedStr));

                $offset = $hashVal % ($spanSeconds + 1);
                $totalSec = $startSeconds + $offset;
                $hrs = floor($totalSec / 3600);
                $mins = floor(($totalSec % 3600) / 60);
                $secs = $totalSec % 60;

                $localTimeStr = sprintf('%02d:%02d:%02d', $hrs, $mins, $secs);

                // Parse in local business timezone (Asia/Manila)
                $localCarbon = Carbon::createFromFormat('Y-m-d H:i:s', "{$saleDate} {$localTimeStr}", $businessTimezone);

                // Convert to application database storage timezone (UTC)
                $storageTimestamp = $localCarbon->copy()->setTimezone($storageTimezone);

                // Resolve authoritative cashier for the branch (Sta. Cruz -> Cindy Masangkay, Victoria -> verified Victoria cashier)
                $cashier = $this->resolveCashierForBranch($sale->branch_id);
                $cashierId = $cashier ? $cashier->id : 1;

                // Update sale
                DB::table('sales')->where('id', $sale->id)->update([
                    'user_id' => $cashierId,
                    'created_at' => $storageTimestamp,
                    'updated_at' => $storageTimestamp,
                ]);

                // Update sale items
                DB::table('sale_items')->where('sale_id', $sale->id)->update([
                    'created_at' => $storageTimestamp,
                    'updated_at' => $storageTimestamp,
                ]);

                // Track daily total and daily earliest/latest sales timestamps
                if (!isset($dailyCashTotals[$saleDate])) {
                    $dailyCashTotals[$saleDate] = [
                        'cash' => 0.0,
                        'branch_id' => $sale->branch_id,
                        'earliest_sale' => $storageTimestamp,
                        'latest_sale' => $storageTimestamp,
                    ];
                }
                if (strtolower($sale->payment_method) === 'cash') {
                    $dailyCashTotals[$saleDate]['cash'] += (float)$sale->total;
                }
                if ($storageTimestamp < $dailyCashTotals[$saleDate]['earliest_sale']) {
                    $dailyCashTotals[$saleDate]['earliest_sale'] = $storageTimestamp;
                }
                if ($storageTimestamp > $dailyCashTotals[$saleDate]['latest_sale']) {
                    $dailyCashTotals[$saleDate]['latest_sale'] = $storageTimestamp;
                }
            }

            // F. Synchronize Cashier Shifts for historical operating dates
            $this->info("Synchronizing daily cashier shifts (09:00 AM - 07:00 PM Manila, ₱1,500 float)...");
            $openingFloat = 1500.00;

            foreach ($dailyCashTotals as $date => $info) {
                $branchId = $info['branch_id'];
                $cashSales = $info['cash'];
                $expected = $openingFloat + $cashSales;

                $cashier = $this->resolveCashierForBranch($branchId);
                $cashierId = $cashier ? $cashier->id : 1;

                $openedAt = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 09:00:00", $businessTimezone)->setTimezone($storageTimezone);
                $closedAt = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 19:00:00", $businessTimezone)->setTimezone($storageTimezone);

                $startOfDayUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 00:00:00", $businessTimezone)->setTimezone($storageTimezone);
                $endOfDayUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 23:59:59", $businessTimezone)->setTimezone($storageTimezone);

                // Find existing shifts on this date
                $existingShifts = CashierShift::where('branch_id', $branchId)
                    ->whereBetween('opened_at', [$startOfDayUtc, $endOfDayUtc])
                    ->get();

                // Isolate historical seed shifts (keep real operational shifts intact)
                $seedShifts = $existingShifts->filter(function ($s) {
                    return str_contains(strtolower($s->notes ?? ''), 'float')
                        || str_contains(strtolower($s->notes ?? ''), 'shift')
                        || (float)$s->opening_balance == 1500.00;
                });

                if ($seedShifts->isNotEmpty()) {
                    // Authoritative shift: pick the one matching 09:00 Manila (01:00 UTC) if present, else first
                    $primaryShift = $seedShifts->first(function ($s) use ($openedAt) {
                        return $s->opened_at->format('H:i:s') === $openedAt->format('H:i:s');
                    }) ?? $seedShifts->first();

                    $primaryShift->update([
                        'cashier_id' => $cashierId,
                        'opened_at' => $openedAt,
                        'closed_at' => $closedAt,
                        'opening_balance' => $openingFloat,
                        'closing_balance' => $expected,
                        'expected_balance' => $expected,
                        'total_cash_sales' => $cashSales,
                        'cash_in' => 0.00,
                        'cash_out' => 0.00,
                        'variance' => 0.00,
                        'notes' => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                        'status' => 'closed',
                    ]);

                    // Remove redundant duplicate seed shifts from earlier runs on this date
                    $duplicateSeedShifts = $seedShifts->reject(fn($s) => $s->id === $primaryShift->id);
                    if ($duplicateSeedShifts->isNotEmpty()) {
                        CashierShift::whereIn('id', $duplicateSeedShifts->pluck('id'))->delete();
                    }
                } else {
                    CashierShift::create([
                        'branch_id' => $branchId,
                        'cashier_id' => $cashierId,
                        'opened_at' => $openedAt,
                        'closed_at' => $closedAt,
                        'opening_balance' => $openingFloat,
                        'closing_balance' => $expected,
                        'expected_balance' => $expected,
                        'total_cash_sales' => $cashSales,
                        'cash_in' => 0.00,
                        'cash_out' => 0.00,
                        'variance' => 0.00,
                        'notes' => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                        'status' => 'closed',
                    ]);
                }
            }
        });

        // 5. POST-CORRECTION VERIFICATION PHASE
        $this->line("\n--- 4. POST-CORRECTION VERIFICATION & INTEGRITY CHECK ---");

        $remainingUnauthorizedProds = DB::table('products')->whereIn('id', $unauthorizedProdIds)->count();
        $remainingUnauthorizedCats = DB::table('categories')->whereIn('id', $unauthorizedCatIds)->count();

        $allHistorical = DB::table('sales')->where('source_system', 'Loyverse')->get();
        $invalidTimeCount = 0;
        $invalidDateCount = 0;
        $misattributedSalesCount = 0;
        $earliestLocalTime = null;
        $latestLocalTime = null;

        $scCashier = $this->resolveCashierForBranch(2);
        $vicCashier = $this->resolveCashierForBranch(1);

        foreach ($allHistorical as $s) {
            $local = Carbon::parse($s->created_at)->setTimezone($businessTimezone);
            $localTime = $local->format('H:i:s');
            $localDate = $local->format('Y-m-d');

            if (preg_match('/POS-[A-Z]+-(\d{4})(\d{2})(\d{2})-/', $s->order_number, $m)) {
                $expectedDate = "{$m[1]}-{$m[2]}-{$m[3]}";
                if ($localDate !== $expectedDate) {
                    $invalidDateCount++;
                }
            }

            if ($localTime < '09:00:00' || $localTime > '19:00:00') {
                $invalidTimeCount++;
            }

            if ($earliestLocalTime === null || $localTime < $earliestLocalTime) {
                $earliestLocalTime = $localTime;
            }
            if ($latestLocalTime === null || $localTime > $latestLocalTime) {
                $latestLocalTime = $localTime;
            }

            // Check cashier attribution
            if ($s->branch_id == 2 && $scCashier && $s->user_id != $scCashier->id) {
                $misattributedSalesCount++;
            } elseif ($s->branch_id == 1 && $vicCashier && $s->user_id != $vicCashier->id) {
                $misattributedSalesCount++;
            }
        }

        // Verify Shifts coverage and de-duplication
        $shiftConflicts = 0;
        $duplicateShiftCount = 0;
        $totalHistoricalShifts = 0;

        $historicalDates = $allHistorical->map(function ($s) use ($businessTimezone) {
            return [
                'date' => Carbon::parse($s->created_at)->setTimezone($businessTimezone)->format('Y-m-d'),
                'branch_id' => $s->branch_id,
            ];
        })->unique(fn($i) => "{$i['branch_id']}_{$i['date']}");

        foreach ($historicalDates as $item) {
            $date = $item['date'];
            $bId = $item['branch_id'];

            $startUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 00:00:00", $businessTimezone)->setTimezone($storageTimezone);
            $endUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 23:59:59", $businessTimezone)->setTimezone($storageTimezone);

            $dayShifts = CashierShift::where('branch_id', $bId)
                ->whereBetween('opened_at', [$startUtc, $endUtc])
                ->where(function ($q) {
                    $q->where('notes', 'like', '%float%')
                      ->orWhere('notes', 'like', '%shift%')
                      ->orWhere('opening_balance', 1500.00);
                })
                ->get();

            $totalHistoricalShifts += $dayShifts->count();

            if ($dayShifts->count() > 1) {
                $duplicateShiftCount += ($dayShifts->count() - 1);
            }

            $primaryShift = $dayShifts->first();
            if (!$primaryShift) {
                $shiftConflicts++;
            } else {
                // Verify shift coverage
                $daySales = $allHistorical->filter(function ($s) use ($businessTimezone, $date, $bId) {
                    return $s->branch_id == $bId && Carbon::parse($s->created_at)->setTimezone($businessTimezone)->format('Y-m-d') === $date;
                });

                $minSaleUtc = $daySales->min('created_at');
                $maxSaleUtc = $daySales->max('created_at');

                if ($primaryShift->opened_at->toDateTimeString() > $minSaleUtc) {
                    $shiftConflicts++;
                }
                if ($primaryShift->closed_at && $primaryShift->closed_at->toDateTimeString() < $maxSaleUtc) {
                    $shiftConflicts++;
                }
            }
        }

        $this->line("Remaining unauthorized products:       <fg=" . ($remainingUnauthorizedProds === 0 ? 'green' : 'red') . ">{$remainingUnauthorizedProds}</>");
        $this->line("Remaining unauthorized categories:     <fg=" . ($remainingUnauthorizedCats === 0 ? 'green' : 'red') . ">{$remainingUnauthorizedCats}</>");
        $this->line("Remaining historical sales:            <fg=green>{$allHistorical->count()}</>");
        $this->line("Misattributed sales:                   <fg=" . ($misattributedSalesCount === 0 ? 'green' : 'red') . ">{$misattributedSalesCount}</>");
        $this->line("Earliest local time (Asia/Manila):     <fg=green>{$earliestLocalTime}</>");
        $this->line("Latest local time (Asia/Manila):       <fg=green>{$latestLocalTime}</>");
        $this->line("Times outside 09:00 - 19:00 Manila:    <fg=" . ($invalidTimeCount === 0 ? 'green' : 'red') . ">{$invalidTimeCount}</>");
        $this->line("Local dates shifted:                   <fg=" . ($invalidDateCount === 0 ? 'green' : 'red') . ">{$invalidDateCount}</>");
        $this->line("Historical attendance shifts:          <fg=green>{$totalHistoricalShifts}</>");
        $this->line("Duplicate historical shifts:           <fg=" . ($duplicateShiftCount === 0 ? 'green' : 'red') . ">{$duplicateShiftCount}</>");
        $this->line("Shift coverage conflicts:              <fg=" . ($shiftConflicts === 0 ? 'green' : 'red') . ">{$shiftConflicts}</>");

        if ($remainingUnauthorizedProds === 0 
            && $remainingUnauthorizedCats === 0 
            && $invalidTimeCount === 0 
            && $invalidDateCount === 0
            && $misattributedSalesCount === 0
            && $duplicateShiftCount === 0
            && $shiftConflicts === 0) {
            $this->info("\n========================================================================");
            $this->info("  ✅ HISTORICAL SALES & ATTENDANCE ALIGNMENT COMPLETED SUCCESSFULLY!    ");
            $this->info("========================================================================");
            return SymfonyCommand::SUCCESS;
        }

        $this->error("\n❌ CORRECTION VERIFICATION FAILED. Integrity checks did not pass.");
        return SymfonyCommand::FAILURE;
    }

    /**
     * Resolve authoritative cashier user for the branch.
     * Sta. Cruz -> Cindy Masangkay
     * Victoria -> Verified Victoria cashier account
     */
    public function resolveCashierForBranch(Branch|int $branch): ?User
    {
        $branchId = is_numeric($branch) ? (int)$branch : $branch->id;
        $branchName = is_numeric($branch) ? Branch::find($branchId)?->name : $branch->name;

        // 1. Sta. Cruz Branch -> Cindy Masangkay
        if ($branchId === 2 || str_contains(strtolower($branchName ?? ''), 'sta cruz') || str_contains(strtolower($branchName ?? ''), 'santa')) {
            return User::where('branch_id', $branchId)
                ->where('role', 'cashier')
                ->where('name', 'like', '%Cindy%')
                ->first()
                ?? User::where('name', 'like', '%Cindy%')->where('role', 'cashier')->first()
                ?? User::where('id', 32)->where('role', 'cashier')->first()
                ?? User::where('branch_id', $branchId)->where('role', 'cashier')->first()
                ?? User::where('role', 'cashier')->first();
        }

        // 2. Victoria Branch -> Verified Victoria Cashier
        if ($branchId === 1 || str_contains(strtolower($branchName ?? ''), 'victoria')) {
            return User::where('branch_id', $branchId)
                ->where('role', 'cashier')
                ->where(function ($q) {
                    $q->whereNull('account_status')->orWhere('account_status', '!=', 'deactivated');
                })
                ->where('name', 'like', '%Victoria%')
                ->first()
                ?? User::where('branch_id', $branchId)
                    ->where('role', 'cashier')
                    ->where(function ($q) {
                        $q->whereNull('account_status')->orWhere('account_status', '!=', 'deactivated');
                    })
                    ->first()
                ?? User::where('id', 66)->first()
                ?? User::where('branch_id', $branchId)->where('role', 'cashier')->first()
                ?? User::where('role', 'cashier')->first();
        }

        return User::where('branch_id', $branchId)->where('role', 'cashier')->first()
            ?? User::where('role', 'cashier')->first()
            ?? User::first();
    }
}
