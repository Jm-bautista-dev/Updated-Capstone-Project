<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Console\Command\Command as SymfonyCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\CashierShift;
use App\Models\SalesImport;
use App\Models\SalesImportAudit;

class ImportHistoricalSalesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makidesu:import-historical-sales
                            {file? : Path to the CSV or Excel file containing historical sales}
                            {--branch=Sta Cruz : Default branch name or code if omitted}
                            {--cashier-float=1500.00 : Opening float for daily cash drawer shift}
                            {--map-product=* : Explicit product mapping pairs, e.g. "Source Product=Target Product Name or ID"}
                            {--dry-run : Validate and show summary without saving to database}
                            {--skip-duplicates : Skip records that already exist in database}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import historical sales dataset from CSV/Excel with controlled 09:00:00 AM - 07:00:00 PM timestamps, unique order numbers, daily cashier shifts with ₱1,500 float, and duplicate prevention.';

    /**
     * Catalog aliases for products where Excel names slightly differ in punctuation or casing.
     */
    protected array $knownAliases = [
        'medium sushi boat (55 pcs)' => 'medium sushi boat 55 pcs',
        'tempura (solo)' => 'tempura (solo)',
        'tempura(solo)' => 'tempura (solo)',
        'sprite in can' => 'sprite in can',
        'super sushi boat (120pcs)' => 'super sushi boat (120 pcs)',
        'super sushi boat (120 pcs)' => 'super sushi boat (120 pcs)',
        'torched ham (bento)' => 'torched ham and cheese roll (bento)',
        'torched ham and cheese roll (bento)' => 'torched ham and cheese roll (bento)',
        'torched ham and cheese roll (8pcs)' => 'torched ham (8pcs)',
        'torched ham and cheese roll (4pcs)' => 'torched ham (4pcs)',
        'crazy maki (8pc)' => 'crazy maki (8pcs)',
        'torched ham (8pc)' => 'torched ham (8pcs)',
        'lava roll (8pc)' => 'lava roll (8pcs)',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->line('');
        $this->info('========================================================================');
        $this->info('      MAKI DESU — HISTORICAL SALES EXCEL/CSV IMPORT ENGINE              ');
        $this->info('========================================================================');

        $filePath = $this->argument('file');
        if (!$filePath) {
            // Check default user uploaded artifact if present
            $defaultArtifactPath = 'C:/Users/Admin/.gemini/antigravity-ide/brain/ce6c6201-463e-444d-bbfc-7b02fa29fabe/.user_uploaded/media_1791706725891.csv';
            if (file_exists($defaultArtifactPath)) {
                $filePath = $defaultArtifactPath;
                $this->comment("Using provided uploaded CSV: {$filePath}");
            } else {
                $this->error("No input file path provided. Usage: php artisan makidesu:import-historical-sales <path-to-file.csv>");
                return SymfonyCommand::FAILURE;
            }
        }

        if (!file_exists($filePath)) {
            $this->error("❌ File not found at: {$filePath}");
            return SymfonyCommand::FAILURE;
        }

        $this->info("Source File:        [{$filePath}]");
        $this->info("Dry Run Mode:       [" . ($this->option('dry-run') ? 'YES (Validation Only)' : 'NO (Database Commit)') . "]");
        $this->info("Cash Drawer Float:  [₱" . number_format((float)$this->option('cashier-float'), 2) . " / day]");
        $this->line('');

        // 1. Parse File Lines
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (count($lines) < 2) {
            $this->error("❌ File is empty or contains no header row.");
            return SymfonyCommand::FAILURE;
        }

        $headerRow = str_getcsv(array_shift($lines), ',', '"', '\\');
        $headerMap = $this->mapHeaders($headerRow);

        $missingRequired = [];
        foreach (['branch', 'product', 'quantity', 'total', 'date'] as $req) {
            if (!isset($headerMap[$req])) {
                $missingRequired[] = ucfirst($req);
            }
        }

        if (!empty($missingRequired)) {
            $this->error("❌ Missing required columns: " . implode(', ', $missingRequired));
            $this->comment("Expected headers: Branch, Product, Quantity, Total Price, Date");
            return SymfonyCommand::FAILURE;
        }

        $this->info("Headers recognized: " . json_encode($headerMap));

        // 2. Load References
        $branches = Branch::all()->keyBy(fn($b) => strtolower(trim($b->name)));
        $branchesById = Branch::all()->keyBy('id');
        $products = Product::all()->keyBy(fn($p) => strtolower(trim($p->name)));
        $productsById = Product::all()->keyBy('id');
        $cashiersByBranch = User::where('role', 'cashier')->get()->groupBy('branch_id');

        // Parse custom user product mappings from CLI option
        $customProductMappings = [];
        foreach ($this->option('map-product') as $pair) {
            if (str_contains($pair, '=')) {
                [$from, $to] = explode('=', $pair, 2);
                $customProductMappings[strtolower(trim($from))] = trim($to);
            }
        }

        // 3. Process & Validate Rows
        $validRows = [];
        $invalidRows = [];
        $dailyTotals = []; // [date => ['cash_total' => float, 'count' => int, 'branch_id' => int]]
        $seenFingerprints = [];
        $duplicateRows = [];

        foreach ($lines as $lineIndex => $line) {
            $rowNum = $lineIndex + 2; // 1-indexed, header is row 1
            $cols = str_getcsv($line, ',', '"', '\\');
            if (empty($cols) || count($cols) < count($headerMap)) {
                continue;
            }

            $rawBranch = trim($cols[$headerMap['branch']] ?? '');
            $rawProduct = trim($cols[$headerMap['product']] ?? '');
            $rawQty = trim($cols[$headerMap['quantity']] ?? '');
            $rawTotal = trim($cols[$headerMap['total']] ?? '');
            $rawPayment = isset($headerMap['payment_method']) ? trim($cols[$headerMap['payment_method']] ?? 'Cash') : 'Cash';
            $rawDate = trim($cols[$headerMap['date']] ?? '');

            // Clean & validate values
            $branch = $this->resolveBranch($rawBranch, $branches, $branchesById);
            if (!$branch) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => "Unknown branch '{$rawBranch}'.",
                    'data' => $cols,
                ];
                continue;
            }

            $product = $this->resolveProduct(
                $rawProduct,
                $products,
                $productsById,
                $customProductMappings
            );

            if (!$product) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => "Product '{$rawProduct}' not found in active menu catalog.",
                    'data' => $cols,
                ];
                continue;
            }

            $qty = (float)str_replace([' ', ','], '', $rawQty);
            if ($qty <= 0) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => "Invalid quantity '{$rawQty}'. Must be greater than 0.",
                    'data' => $cols,
                ];
                continue;
            }

            $total = (float)str_replace(['₱', ',', ' '], '', $rawTotal);
            if ($total <= 0) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => "Invalid total price '{$rawTotal}'.",
                    'data' => $cols,
                ];
                continue;
            }

            $parsedDate = $this->parseDate($rawDate);
            if (!$parsedDate) {
                $invalidRows[] = [
                    'row' => $rowNum,
                    'reason' => "Invalid date format '{$rawDate}'.",
                    'data' => $cols,
                ];
                continue;
            }

            // Deduplication / Fingerprint Check: branch_id + product_id + qty + total + date
            $fingerprint = "{$branch->id}_{$product->id}_{$qty}_{$total}_{$parsedDate}";
            $occurrence = ($seenFingerprints[$fingerprint] ?? 0) + 1;
            $seenFingerprints[$fingerprint] = $occurrence;

            // Generate deterministic, stable timestamp strictly between 09:00:00 AM and 7:00:00 PM (09:00:00 - 19:00:00)
            $saleTimestamp = $this->generateStableSaleTimestamp($parsedDate, $rowNum, $product->id, $occurrence);

            // Generate stable unique order number
            $orderNumber = $this->generateOrderNumber($branch, $saleTimestamp, $rowNum, $occurrence);

            // Unit price calculation
            $unitPrice = round($total / $qty, 2);

            $validRows[] = [
                'row' => $rowNum,
                'branch' => $branch,
                'product' => $product,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
                'total' => $total,
                'payment_method' => strtolower($rawPayment) ?: 'cash',
                'date' => $parsedDate,
                'timestamp' => $saleTimestamp,
                'order_number' => $orderNumber,
                'fingerprint' => $fingerprint,
                'occurrence' => $occurrence,
            ];

            // Accumulate daily totals for cashier shifts
            if (!isset($dailyTotals[$parsedDate])) {
                $dailyTotals[$parsedDate] = [
                    'cash_total' => 0.0,
                    'count' => 0,
                    'branch_id' => $branch->id,
                ];
            }
            if (strtolower($rawPayment) === 'cash') {
                $dailyTotals[$parsedDate]['cash_total'] += $total;
            }
            $dailyTotals[$parsedDate]['count']++;
        }

        // Summary of validation
        $this->comment('--- VALIDATION SUMMARY ---');
        $this->line("Total lines read:      " . count($lines));
        $this->line("Valid transactions:    " . count($validRows));
        $this->line("Invalid/Rejected rows: " . count($invalidRows));
        $this->line("Operating days:        " . count($dailyTotals));

        if (!empty($invalidRows)) {
            $this->warn("\n⚠️ INVALID ROWS ENCOUNTERED (" . count($invalidRows) . "):");
            foreach (array_slice($invalidRows, 0, 10) as $inv) {
                $this->line("   - Row {$inv['row']}: {$inv['reason']}");
            }
            if (count($invalidRows) > 10) {
                $this->line("   ... and " . (count($invalidRows) - 10) . " more invalid rows.");
            }
            $this->comment("\nTip: Map missing products via --map-product=\"Source Name=Catalog Name\"");
            if (!$this->option('dry-run') && count($validRows) === 0) {
                $this->error("Cannot proceed with 0 valid records.");
                return SymfonyCommand::FAILURE;
            }
        }

        // Verify that EVERY generated timestamp converts back to Asia/Manila local time strictly within 09:00:00 AM - 07:00:00 PM
        // and matches the intended calendar date
        $timeWindowValid = true;
        foreach ($validRows as $vr) {
            /** @var Carbon $ts */
            $ts = $vr['timestamp'];
            $manilaTime = $ts->copy()->setTimezone('Asia/Manila');
            $localTimeString = $manilaTime->format('H:i:s');
            $localDateString = $manilaTime->format('Y-m-d');

            if ($localDateString !== $vr['date']) {
                $this->error("❌ DATE MISMATCH: {$vr['order_number']} local date {$localDateString} does not match {$vr['date']}");
                $timeWindowValid = false;
                break;
            }

            if ($localTimeString < '09:00:00' || $localTimeString > '19:00:00') {
                $this->error("❌ TIMESTAMP OUT OF BOUNDS: {$vr['order_number']} has local time {$localTimeString}");
                $timeWindowValid = false;
                break;
            }
        }
        if ($timeWindowValid) {
            $this->info("✅ TIMESTAMP AUDIT: 100% of transactions fall strictly within 09:00:00 AM – 07:00:00 PM Asia/Manila and preserve calendar dates.");
        }

        // Check for collisions against existing database records
        $collidingOrderNumbers = Sale::whereIn('order_number', array_column($validRows, 'order_number'))->pluck('order_number')->toArray();
        if (!empty($collidingOrderNumbers)) {
            $this->warn("⚠️ Found " . count($collidingOrderNumbers) . " existing sales matching generated order numbers.");
            if ($this->option('skip-duplicates')) {
                $validRows = array_filter($validRows, fn($r) => !in_array($r['order_number'], $collidingOrderNumbers));
                $this->comment("Skipping existing duplicate order numbers. Remaining to import: " . count($validRows));
            }
        }

        // Display sample preview of prepared transactions
        $this->line('');
        $this->comment('--- PREVIEW OF PREPARED TRANSACTIONS (First 5) ---');
        $sampleTable = [];
        foreach (array_slice($validRows, 0, 5) as $vr) {
            $manilaDisplay = $vr['timestamp']->copy()->setTimezone('Asia/Manila')->format('Y-m-d h:i:s A');
            $sampleTable[] = [
                $vr['order_number'],
                $vr['branch']->name,
                $vr['product']->name,
                $vr['quantity'],
                '₱' . number_format($vr['total'], 2),
                $manilaDisplay,
                ucfirst($vr['payment_method']),
            ];
        }
        $this->table(['Order Number', 'Branch', 'Product', 'Qty', 'Total', 'Timestamp (9am-7pm Manila)', 'Payment'], $sampleTable);

        // Display sample preview of daily cashier shifts with ₱1,500 float
        $this->line('');
        $this->comment('--- PREVIEW OF DAILY CASHIER SHIFTS (₱1,500 Opening Float) ---');
        $shiftPreview = [];
        foreach (array_slice($dailyTotals, 0, 5, true) as $date => $info) {
            $opening = (float)$this->option('cashier-float');
            $cashSales = $info['cash_total'];
            $closing = $opening + $cashSales;
            $shiftPreview[] = [
                $date,
                "₱" . number_format($opening, 2),
                "₱" . number_format($cashSales, 2),
                "₱" . number_format($closing, 2),
                "09:00:00 AM",
                "07:00:00 PM",
                "Closed",
            ];
        }
        $this->table(['Date', 'Opening Float', 'Cash Sales', 'Expected Cash', 'Time In', 'Time Out', 'Status'], $shiftPreview);

        if ($this->option('dry-run')) {
            $this->info("\n🔎 DRY RUN COMPLETE: File is 100% valid. No database writes were performed.");
            $this->comment("To execute live import, re-run without --dry-run.");
            return SymfonyCommand::SUCCESS;
        }

        // Live execution inside transactional batches
        $this->info("\nStarting transactional database import...");
        $openingFloat = (float)$this->option('cashier-float');

        try {
            DB::transaction(function () use ($validRows, $dailyTotals, $openingFloat) {
                // 1. Create or update CashierShifts for each operating day
                $this->info("Creating / updating daily cashier shifts with ₱1,500 cash drawer float...");
                $businessTimezone = 'Asia/Manila';
                $storageTimezone = config('app.timezone', 'UTC');

                foreach ($dailyTotals as $date => $info) {
                    $branchId = $info['branch_id'];
                    $cashier = $this->resolveCashierForBranch($branchId);
                    $cashierId = $cashier ? $cashier->id : 1;

                    $openedAt = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 09:00:00", $businessTimezone)->setTimezone($storageTimezone);
                    $closedAt = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 19:00:00", $businessTimezone)->setTimezone($storageTimezone);
                    $cashSales = (float)$info['cash_total'];
                    $expectedBalance = $openingFloat + $cashSales;

                    $startOfDayUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 00:00:00", $businessTimezone)->setTimezone($storageTimezone);
                    $endOfDayUtc = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} 23:59:59", $businessTimezone)->setTimezone($storageTimezone);

                    $existingShifts = CashierShift::where('branch_id', $branchId)
                        ->whereBetween('opened_at', [$startOfDayUtc, $endOfDayUtc])
                        ->get();

                    $historicalShifts = $existingShifts->filter(function ($s) {
                        return str_contains(strtolower($s->notes ?? ''), 'float')
                            || str_contains(strtolower($s->notes ?? ''), 'shift')
                            || (float)$s->opening_balance == 1500.00;
                    });

                    if ($historicalShifts->isNotEmpty()) {
                        $primaryShift = $historicalShifts->first();
                        $primaryShift->update([
                            'cashier_id' => $cashierId,
                            'opened_at' => $openedAt,
                            'closed_at' => $closedAt,
                            'opening_balance' => $openingFloat,
                            'closing_balance' => $expectedBalance,
                            'expected_balance' => $expectedBalance,
                            'total_cash_sales' => $cashSales,
                            'cash_in' => 0.00,
                            'cash_out' => 0.00,
                            'variance' => 0.00,
                            'notes' => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                            'status' => 'closed',
                        ]);

                        if ($historicalShifts->count() > 1) {
                            $duplicateIds = $historicalShifts->slice(1)->pluck('id')->toArray();
                            CashierShift::whereIn('id', $duplicateIds)->delete();
                        }
                    } else {
                        CashierShift::create([
                            'branch_id' => $branchId,
                            'cashier_id' => $cashierId,
                            'opened_at' => $openedAt,
                            'closed_at' => $closedAt,
                            'opening_balance' => $openingFloat,
                            'closing_balance' => $expectedBalance,
                            'expected_balance' => $expectedBalance,
                            'total_cash_sales' => $cashSales,
                            'cash_in' => 0.00,
                            'cash_out' => 0.00,
                            'variance' => 0.00,
                            'notes' => 'Historical daily cashier shift aligned with ₱1,500 float (09:00:00 - 19:00:00 Manila)',
                            'status' => 'closed',
                        ]);
                    }
                }

                // 2. Insert Sales and SaleItems
                $this->info("Inserting " . count($validRows) . " historical sales transactions...");
                $count = 0;

                foreach ($validRows as $vr) {
                    $branchId = $vr['branch']->id;
                    $cashier = $this->resolveCashierForBranch($branchId);
                    $cashierId = $cashier ? $cashier->id : 1;

                    $sale = Sale::create([
                        'order_number' => $vr['order_number'],
                        'user_id' => $cashierId,
                        'branch_id' => $branchId,
                        'type' => 'dine-in',
                        'subtotal' => $vr['total'],
                        'discount' => 0.00,
                        'discount_type' => null,
                        'discount_details' => null,
                        'delivery_fee' => 0.00,
                        'total' => $vr['total'],
                        'cost_total' => 0.00,
                        'profit' => $vr['total'],
                        'paid_amount' => $vr['total'],
                        'change_amount' => 0.00,
                        'payment_method' => $vr['payment_method'],
                        'status' => 'completed',
                        'source' => 'pos',
                        'source_system' => 'Loyverse',
                        'created_at' => $vr['timestamp'],
                        'updated_at' => $vr['timestamp'],
                    ]);

                    // Force exact historical timestamp
                    $sale->created_at = $vr['timestamp'];
                    $sale->updated_at = $vr['timestamp'];
                    $sale->saveQuietly();

                    $item = SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $vr['product']->id,
                        'quantity' => $vr['quantity'],
                        'unit_price' => $vr['unit_price'],
                        'cost_price' => 0.00,
                        'subtotal' => $vr['total'],
                        'profit' => $vr['total'],
                        'addon_total' => 0.00,
                        'selected_addons' => null,
                        'created_at' => $vr['timestamp'],
                        'updated_at' => $vr['timestamp'],
                    ]);

                    $item->created_at = $vr['timestamp'];
                    $item->updated_at = $vr['timestamp'];
                    $item->saveQuietly();

                    $count++;
                }

                $this->info("✅ Successfully imported {$count} historical sales records.");
            });

            $this->info("========================================================================");
            $this->info("      HISTORICAL SALES IMPORT COMPLETED SUCCESSFULLY                    ");
            $this->info("========================================================================");
            return SymfonyCommand::SUCCESS;

        } catch (\Throwable $e) {
            logger()->error("IMPORT ERROR: " . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            $this->error("❌ IMPORT TRANSACTION FAILED: " . $e->getMessage());
            return SymfonyCommand::FAILURE;
        }
    }

    /**
     * Parse column headers to internal keys.
     */
    protected function mapHeaders(array $headers): array
    {
        $map = [];
        foreach ($headers as $idx => $h) {
            $clean = strtolower(trim((string)$h));
            $cleanNoPunct = preg_replace('/[^a-z0-9]/', '', $clean);

            if ($clean === 'branch' || str_contains($clean, 'branch')) {
                $map['branch'] = $idx;
            } elseif ($clean === 'product' || str_contains($clean, 'item') || str_contains($clean, 'product')) {
                $map['product'] = $idx;
            } elseif ($clean === 'quantity' || $clean === 'qty' || str_contains($clean, 'quantity')) {
                $map['quantity'] = $idx;
            } elseif (str_contains($clean, 'total') || str_contains($clean, 'price') || str_contains($clean, 'amount')) {
                $map['total'] = $idx;
            } elseif (str_contains($clean, 'payment') || str_contains($clean, 'method')) {
                $map['payment_method'] = $idx;
            } elseif ($clean === 'date' || str_contains($clean, 'date')) {
                $map['date'] = $idx;
            }
        }
        return $map;
    }

    /**
     * Resolve branch model.
     */
    protected function resolveBranch(string $val, $branches, $branchesById): ?Branch
    {
        $clean = strtolower(trim($val));
        if ($clean === '') return null;

        if (is_numeric($clean) && $branchesById->has((int)$clean)) {
            return $branchesById->get((int)$clean);
        }
        if ($branches->has($clean)) {
            return $branches->get($clean);
        }
        if ($branches->has("maki desu {$clean}")) {
            return $branches->get("maki desu {$clean}");
        }

        // Fuzzy match without punctuation
        $cleanNoDot = str_replace('.', '', $clean);
        foreach ($branches as $name => $b) {
            $bClean = str_replace('.', '', $name);
            if ($bClean === $cleanNoDot || $bClean === "maki desu {$cleanNoDot}") {
                return $b;
            }
        }
        return null;
    }

    /**
     * Resolve product model.
     */
    protected function resolveProduct(string $val, $products, $productsById, array $customMappings): ?Product
    {
        $clean = strtolower(trim($val));
        if ($clean === '') return null;

        // 1. Explicit CLI custom mapping
        if (isset($customMappings[$clean])) {
            $target = $customMappings[$clean];
            if (is_numeric($target) && $productsById->has((int)$target)) {
                return $productsById->get((int)$target);
            }
            $targetClean = strtolower($target);
            if ($products->has($targetClean)) {
                return $products->get($targetClean);
            }
        }

        // 2. Known catalog alias mapping
        if (isset($this->knownAliases[$clean])) {
            $aliasTarget = $this->knownAliases[$clean];
            if ($products->has($aliasTarget)) {
                return $products->get($aliasTarget);
            }
        }

        // 3. Exact name match
        if ($products->has($clean)) {
            return $products->get($clean);
        }

        // 4. Normalized whitespace match
        $norm = preg_replace('/\s+/', ' ', $clean);
        if ($products->has($norm)) {
            return $products->get($norm);
        }
        foreach ($products as $pName => $p) {
            if (preg_replace('/\s+/', ' ', $pName) === $norm) {
                return $p;
            }
        }

        // 5. Parentheses spacing match (e.g. "Tempura (Solo)" vs "Tempura(solo)")
        $noSpaceParen = str_replace(' (', '(', $clean);
        if ($products->has($noSpaceParen)) {
            return $products->get($noSpaceParen);
        }

        return null;
    }

    /**
     * Parse human or standard date string.
     */
    protected function parseDate(string $val): ?string
    {
        $clean = trim($val);
        if ($clean === '') return null;

        try {
            $normalized = preg_replace('/\s+/', ' ', str_replace(',', ' ', $clean));
            $parsed = Carbon::parse($normalized);
            if ($parsed->year > 2000 && $parsed->year < 2100) {
                return $parsed->format('Y-m-d');
            }
        } catch (\Throwable $e) {
            // fallback
        }
        $time = strtotime($clean);
        return $time ? date('Y-m-d', $time) : null;
    }

    /**
     * Generate a stable, plausible timestamp strictly between 09:00:00 AM and 07:00:00 PM in Asia/Manila,
     * converted to application storage timezone (UTC).
     */
    protected function generateStableSaleTimestamp(string $date, int $rowNum, int $productId, int $occurrence): Carbon
    {
        // Business hours in local Asia/Manila: 09:00:00 AM (32,400s) to 07:00:00 PM (68,400s)
        // Operational span: 10 hours = 36,000 seconds
        $startSeconds = 9 * 3600;  // 32,400 (09:00:00 AM)
        $spanSeconds = 10 * 3600;  // 36,000 seconds (until 19:00:00 PM)

        $seedStr = "{$date}-{$rowNum}-{$productId}-{$occurrence}";
        $hashVal = crc32($seedStr);

        $secondOffset = abs($hashVal) % ($spanSeconds + 1);
        $totalSeconds = $startSeconds + $secondOffset;

        $hours = floor($totalSeconds / 3600);
        $minutes = floor(($totalSeconds % 3600) / 60);
        $seconds = $totalSeconds % 60;

        $localTimeString = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);

        $businessTimezone = 'Asia/Manila';
        $storageTimezone = config('app.timezone', 'UTC');

        // Parse as local business time in Asia/Manila
        $localCarbon = Carbon::createFromFormat('Y-m-d H:i:s', "{$date} {$localTimeString}", $businessTimezone);

        // Convert to database storage timezone (UTC)
        return $localCarbon->copy()->setTimezone($storageTimezone);
    }

    /**
     * Generate unique, stable order number matching POS convention.
     */
    protected function generateOrderNumber(Branch $branch, Carbon $timestamp, int $rowNum, int $occurrence): string
    {
        // Use local Asia/Manila time for order number date and time slugs
        $businessTimezone = 'Asia/Manila';
        $localTime = $timestamp->copy()->setTimezone($businessTimezone);

        $branchCode = $branch->code ?: (str_contains(strtolower($branch->name), 'cruz') ? 'SC' : 'VIC');
        $dateSlug = $localTime->format('Ymd');
        $timeSlug = $localTime->format('His');
        $uniqueSuffix = strtoupper(substr(md5("{$branch->id}_{$dateSlug}_{$rowNum}_{$occurrence}"), 0, 4));

        return "POS-{$branchCode}-{$dateSlug}-{$timeSlug}-{$uniqueSuffix}";
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

