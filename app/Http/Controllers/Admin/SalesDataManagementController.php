<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\SalesImport;
use App\Models\SalesImportAudit;
use App\Models\SalesBackup;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class SalesDataManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access to Sales Data Management.');
        }

        $totalSales = Sale::count();
        $lastImport = SalesImport::where('status', 'success')->latest()->first();
        
        // Scan duplicates dynamically (duplicate order numbers in db)
        $duplicatesCount = DB::table('sales')
            ->select('order_number')
            ->groupBy('order_number')
            ->havingRaw('COUNT(order_number) > 1')
            ->get()
            ->count();

        // Calculate data integrity status
        $integrityStatus = 'Optimal';
        if ($duplicatesCount > 0) {
            $integrityStatus = 'Duplicate Warn';
        }

        $importsHistory = SalesImport::with('user')->latest()->get();
        $auditLogs = SalesImportAudit::with('user')->latest()->take(50)->get();
        $backups = SalesBackup::latest()->get();
        $branches = Branch::orderBy('name')->get(['id', 'name']);
        $products = Product::orderBy('name')->get(['id', 'name', 'sku']);

        return Inertia::render('Admin/SalesDataManagement/Index', [
            'stats' => [
                'total_sales_records' => $totalSales,
                'last_import_date' => $lastImport ? $lastImport->created_at?->toIso8601String() : null,
                'last_imported_by' => $lastImport ? ($lastImport->user->name ?? 'Unknown') : null,
                'duplicate_records_detected' => $duplicatesCount,
                'data_integrity_status' => $integrityStatus,
            ],
            'importsHistory' => $importsHistory,
            'auditLogs' => $auditLogs,
            'backups' => $backups,
            'branches' => $branches,
            'products' => $products,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function downloadTemplate(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $csvContent = "Branch,Product,Quantity,Total Price,Date\n"
            . "Sta Cruz,Student Meal,18,1782,September 9 2026\n"
            . "Sta Cruz,Mango Cali Maki (4pc),3,837,September 9 2026\n"
            . "Sta Cruz,Classic California Maki (8pcs),2,378,September 9 2026\n"
            . "Sta Cruz,Kani Salad (Solo),2,358,September 9 2026\n"
            . "Sta Cruz,Crazy Tenders Overload (Bento),1,329,September 9 2026\n";

        return response($csvContent, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="loyverse_sales_import_template.csv"',
        ]);
    }

    public function validateFile(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls,txt',
            'productMappings' => 'nullable|array',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $explicitProductMappings = $request->input('productMappings', []);
        
        // Read file using Excel facade to support CSV & Excel formats
        $sheets = Excel::toArray(new \stdClass(), $file);
        $rawRows = $sheets[0] ?? [];

        if (count($rawRows) < 2) {
            return response()->json([
                'error' => 'The uploaded file is empty or contains no data rows.'
            ], 422);
        }

        $headers = array_shift($rawRows);
        $mapping = $this->mapHeaders($headers);

        // Required columns for Loyverse historical import: Branch, Product, Quantity, Total Price, Date
        $required = ['branch', 'product', 'quantity', 'total', 'date'];
        $missing = [];
        foreach ($required as $req) {
            if (!isset($mapping[$req])) {
                $missing[] = ($req === 'total' ? 'Total Price' : ucfirst($req));
            }
        }

        if (count($missing) > 0) {
            $msg = count($missing) === 1
                ? 'Missing required column: ' . $missing[0]
                : 'Missing required columns: ' . implode(', ', $missing);
            return response()->json([
                'error' => $msg . '. Please ensure headers match the expected schema (Branch, Product, Quantity, Total Price, Date).'
            ], 422);
        }

        // Filter out empty rows
        $rows = [];
        foreach ($rawRows as $r) {
            if (!is_array($r)) continue;
            $hasContent = false;
            foreach ($r as $val) {
                if ($val !== null && trim((string)$val) !== '') {
                    $hasContent = true;
                    break;
                }
            }
            if ($hasContent) {
                $rows[] = $r;
            }
        }

        if (count($rows) === 0) {
            return response()->json([
                'error' => 'The uploaded file contains no data rows.'
            ], 422);
        }

        // Cache DB references for validation
        $branches = Branch::all()->keyBy(fn($b) => strtolower(trim($b->name)));
        $branchesById = Branch::all()->keyBy('id');
        $products = Product::all()->keyBy(fn($p) => strtolower(trim($p->name)));
        $productsById = Product::all()->keyBy('id');
        $productsBySku = Product::all()->whereNotNull('sku')->keyBy(fn($p) => strtolower(trim($p->sku)));
        $users = User::all()->keyBy(fn($u) => strtolower(trim($u->name)));

        $validationErrors = [];
        $validRows = 0;
        $invalidRows = 0;
        $previewRows = [];
        
        $seenOrderNumbersInFile = [];
        $seenDuplicatesInFileCount = 0;
        $unmatchedProducts = [];
        $fingerprintOccurrences = [];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // 1-based, account for header row
            $rowErrors = [];

            // Extract row values based on header mapping
            $branchVal = trim((string)($row[$mapping['branch']] ?? ''));
            $productVal = trim((string)($row[$mapping['product']] ?? ''));
            $qtyVal = trim((string)($row[$mapping['quantity']] ?? ''));
            $totalVal = trim((string)($row[$mapping['total']] ?? ''));
            $dateStr = trim((string)($row[$mapping['date']] ?? ''));
            $orderNumFromRow = isset($mapping['order_number']) ? trim((string)($row[$mapping['order_number']] ?? '')) : '';
            $unitPriceFromRow = isset($mapping['unit_price']) ? trim((string)($row[$mapping['unit_price']] ?? '')) : '';
            $cashierVal = isset($mapping['cashier']) ? trim((string)($row[$mapping['cashier']] ?? '')) : '';

            // 1. Validate Branch Reference
            $resolvedBranch = null;
            if (empty($branchVal)) {
                $rowErrors[] = 'Branch is empty.';
            } else {
                $resolvedBranch = $this->resolveBranch($branchVal, $branches, $branchesById);
                if (!$resolvedBranch) {
                    $rowErrors[] = "Unknown branch: '{$branchVal}'.";
                }
            }

            // 2. Validate Product Reference
            $resolvedProduct = null;
            if (empty($productVal)) {
                $rowErrors[] = 'Product is empty.';
            } else {
                $resolvedProduct = $this->resolveProduct($productVal, $products, $productsById, $productsBySku, $explicitProductMappings);
                if (!$resolvedProduct) {
                    $rowErrors[] = "Product not found: '{$productVal}'.";
                    $unmatchedProducts[strtolower(trim($productVal))] = $productVal;
                }
            }

            // 3. Validate Quantity
            $qty = null;
            if ($qtyVal === '' || !is_numeric($qtyVal)) {
                $rowErrors[] = "Invalid quantity '{$qtyVal}'. Must be a positive number.";
            } else {
                $qty = (float) $qtyVal;
                if ($qty <= 0) {
                    $rowErrors[] = "Invalid quantity '{$qtyVal}'. Must be greater than zero.";
                }
            }

            // 4. Validate Total Price (Loyverse currency formats: ₱1782, ₱1,782.00, 1782, 1782.00)
            $total = $this->parseCurrency($totalVal);
            if ($total === null || $total < 0) {
                $rowErrors[] = "Invalid Total Price on row {$rowNum}.";
            }

            // 5. Validate Date (Loyverse dates: "September 9 2026", Excel serial dates, etc.)
            $parsedDate = $this->parseDate($dateStr);
            if (!$parsedDate) {
                $rowErrors[] = "Invalid date format '{$dateStr}'. Expected YYYY-MM-DD or Month Day Year.";
            }

            // 6. Resolve Order Number / Transaction Identity
            $orderNum = '';
            if (!empty($orderNumFromRow)) {
                $orderNum = $orderNumFromRow;
                if (isset($seenOrderNumbersInFile[$orderNum])) {
                    $rowErrors[] = "Duplicate transaction ID '{$orderNum}' within this file.";
                    $seenDuplicatesInFileCount++;
                }
                $seenOrderNumbersInFile[$orderNum] = $rowNum;
            } elseif ($resolvedBranch && $resolvedProduct && $qty !== null && $total !== null && $parsedDate) {
                // Determine occurrence index for repeated identical records in file
                $fingerprint = $resolvedBranch->id . '_' . $resolvedProduct->id . '_' . $qty . '_' . $total . '_' . $parsedDate;
                $occurrence = ($fingerprintOccurrences[$fingerprint] ?? 0) + 1;
                $fingerprintOccurrences[$fingerprint] = $occurrence;

                $orderNum = $this->generateCanonicalOrderNumber($resolvedBranch->id, $parsedDate, $resolvedProduct->id, $qty, $occurrence);

                // Check if this canonical historical record already exists in database
                if (Sale::where('order_number', $orderNum)->exists()) {
                    $seenDuplicatesInFileCount++;
                }
            }

            // 7. Unit Price calculation / preservation
            $unitPrice = 0.00;
            if (!empty($unitPriceFromRow)) {
                $parsedUnitPrice = $this->parseCurrency($unitPriceFromRow);
                $unitPrice = $parsedUnitPrice !== null ? $parsedUnitPrice : ($qty && $qty > 0 && $total !== null ? round($total / $qty, 2) : 0.00);
            } elseif ($qty && $qty > 0 && $total !== null) {
                $unitPrice = round($total / $qty, 2);
            }

            $isValid = count($rowErrors) === 0;
            if ($isValid) {
                $validRows++;
            } else {
                $invalidRows++;
                $validationErrors[] = [
                    'row' => $rowNum,
                    'errors' => $rowErrors
                ];
            }

            if ($index < 100) {
                $previewRows[] = [
                    'row' => $rowNum,
                    'order_number' => $orderNum ?: "Row {$rowNum}",
                    'date' => $parsedDate ?: $dateStr,
                    'branch' => $branchVal,
                    'product' => $productVal,
                    'quantity' => $qtyVal,
                    'unit_price' => number_format($unitPrice, 2, '.', ''),
                    'total' => $total !== null ? number_format($total, 2, '.', '') : $totalVal,
                    'cashier' => $cashierVal ?: 'Loyverse Historical',
                    'is_valid' => $isValid,
                    'errors' => $rowErrors
                ];
            }
        }

        // Store validation details temporarily in storage
        $tempKey = 'sales_import_' . uniqid();
        Storage::put('temp_imports/' . $tempKey . '.json', json_encode([
            'fileName' => $fileName,
            'headers' => $headers,
            'mapping' => $mapping,
            'rows' => $rows,
            'productMappings' => $explicitProductMappings,
        ]));

        return response()->json([
            'tempKey' => $tempKey,
            'fileName' => $fileName,
            'totalRows' => count($rows),
            'validRowsCount' => $validRows,
            'invalidRowsCount' => $invalidRows,
            'errors' => $validationErrors,
            'preview' => $previewRows,
            'duplicateCount' => $seenDuplicatesInFileCount,
            'unmatchedProducts' => array_values($unmatchedProducts),
        ]);
    }

    public function import(Request $request)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'tempKey' => 'required|string',
            'importMode' => 'required|in:add_new,update,replace_range,replace_all',
            'duplicateMode' => 'required|in:skip,update',
            'dateRangeStart' => 'required_if:importMode,replace_range|nullable|date',
            'dateRangeEnd' => 'required_if:importMode,replace_range|nullable|date',
            'confirmText' => 'required_if:importMode,replace_all|nullable|string',
            'productMappings' => 'nullable|array',
        ]);

        $tempKey = $request->input('tempKey');
        $importMode = $request->input('importMode');
        $duplicateMode = $request->input('duplicateMode');
        $productMappings = $request->input('productMappings', []);

        $filePath = 'temp_imports/' . $tempKey . '.json';
        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'Validated data has expired. Please upload the file again.'], 422);
        }

        $data = json_decode(Storage::get($filePath), true);
        $fileName = $data['fileName'];
        $mapping = $data['mapping'];
        $rows = $data['rows'];
        $storedMappings = $data['productMappings'] ?? [];
        $mergedMappings = array_merge($storedMappings, $productMappings);

        // Strict validation check for replace_all
        if ($importMode === 'replace_all') {
            if ($request->input('confirmText') !== 'DELETE ALL SALES') {
                return response()->json(['error' => 'Confirmation mismatch. You must type "DELETE ALL SALES".'], 422);
            }
        }

        $startTime = microtime(true);

        // Create safety backup snapshot before executing changes
        $backupResult = $this->createBackupSnapshot();

        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $duplicatesSkippedCount = 0;
        $minDate = null;
        $maxDate = null;

        try {
            DB::transaction(function () use (
                $importMode, $duplicateMode, $mapping, $rows, $request, $mergedMappings, $user, $fileName,
                &$importedCount, &$updatedCount, &$skippedCount, &$duplicatesSkippedCount, &$minDate, &$maxDate
            ) {
                // Cache referenced items
                $branches = Branch::all()->keyBy(fn($b) => strtolower(trim($b->name)));
                $branchesById = Branch::all()->keyBy('id');
                $products = Product::all()->keyBy(fn($p) => strtolower(trim($p->name)));
                $productsById = Product::all()->keyBy('id');
                $productsBySku = Product::all()->whereNotNull('sku')->keyBy(fn($p) => strtolower(trim($p->sku)));
                $users = User::all()->keyBy(fn($u) => strtolower(trim($u->name)));
                $currentUserId = Auth::id();

                // Create SalesImport header record first so sales records can reference sales_import_id
                $salesImport = SalesImport::create([
                    'uploaded_by' => $user->id,
                    'file_name' => $fileName,
                    'import_mode' => $importMode,
                    'records_imported' => 0,
                    'records_updated' => 0,
                    'records_skipped' => 0,
                    'status' => 'processing',
                ]);

                // Handle clear/replace setups
                if ($importMode === 'replace_all') {
                    DB::table('sale_items')->delete();
                    DB::table('sales')->delete();
                } elseif ($importMode === 'replace_range') {
                    $start = $request->input('dateRangeStart') . ' 00:00:00';
                    $end = $request->input('dateRangeEnd') . ' 23:59:59';
                    
                    $salesToWipe = Sale::whereBetween('created_at', [$start, $end])->pluck('id');
                    if ($salesToWipe->isNotEmpty()) {
                        DB::table('sale_items')->whereIn('sale_id', $salesToWipe)->delete();
                        DB::table('sales')->whereIn('id', $salesToWipe)->delete();
                    }
                }

                $seenOrderNumbersInUpload = [];
                $fingerprintOccurrences = [];

                foreach ($rows as $row) {
                    $branchVal = trim((string)($row[$mapping['branch']] ?? ''));
                    $productVal = trim((string)($row[$mapping['product']] ?? ''));
                    $qtyVal = trim((string)($row[$mapping['quantity']] ?? ''));
                    $totalVal = trim((string)($row[$mapping['total']] ?? ''));
                    $dateStr = trim((string)($row[$mapping['date']] ?? ''));
                    $orderNumFromRow = isset($mapping['order_number']) ? trim((string)($row[$mapping['order_number']] ?? '')) : '';
                    $unitPriceFromRow = isset($mapping['unit_price']) ? trim((string)($row[$mapping['unit_price']] ?? '')) : '';
                    $cashierVal = isset($mapping['cashier']) ? trim((string)($row[$mapping['cashier']] ?? '')) : '';

                    // Lookup branch & product
                    $branch = $this->resolveBranch($branchVal, $branches, $branchesById);
                    $product = $this->resolveProduct($productVal, $products, $productsById, $productsBySku, $mergedMappings);
                    $parsedDate = $this->parseDate($dateStr);
                    $total = $this->parseCurrency($totalVal);
                    $qty = is_numeric($qtyVal) ? (float)$qtyVal : null;

                    if (!$branch || !$product || $qty === null || $qty <= 0 || $total === null || $total < 0 || !$parsedDate) {
                        $skippedCount++;
                        continue;
                    }

                    // Track date range for summary report
                    if ($minDate === null || $parsedDate < $minDate) $minDate = $parsedDate;
                    if ($maxDate === null || $parsedDate > $maxDate) $maxDate = $parsedDate;

                    // Cashier lookup: fallback to current admin
                    $cleanCashier = strtolower(trim($cashierVal));
                    $cashierId = $users->has($cleanCashier) ? $users->get($cleanCashier)->id : $currentUserId;

                    // Resolve order number
                    $isGeneratedOrderNumber = false;
                    if (!empty($orderNumFromRow)) {
                        $orderNum = $orderNumFromRow;
                    } else {
                        $isGeneratedOrderNumber = true;
                        $fingerprint = $branch->id . '_' . $product->id . '_' . $qty . '_' . $total . '_' . $parsedDate;
                        $occurrence = ($fingerprintOccurrences[$fingerprint] ?? 0) + 1;
                        $fingerprintOccurrences[$fingerprint] = $occurrence;

                        $orderNum = $this->generateCanonicalOrderNumber($branch->id, $parsedDate, $product->id, $qty, $occurrence);
                    }

                    // Check intra-upload duplicate when order_number was provided in file
                    if (!$isGeneratedOrderNumber) {
                        if (isset($seenOrderNumbersInUpload[$orderNum])) {
                            $skippedCount++;
                            $duplicatesSkippedCount++;
                            continue;
                        }
                        $seenOrderNumbersInUpload[$orderNum] = true;
                    }

                    // Unit price calculation
                    $unitPrice = 0.00;
                    if (!empty($unitPriceFromRow)) {
                        $parsedUnitPrice = $this->parseCurrency($unitPriceFromRow);
                        $unitPrice = $parsedUnitPrice !== null ? $parsedUnitPrice : round($total / $qty, 2);
                    } else {
                        $unitPrice = round($total / $qty, 2);
                    }

                    // Historical timestamp: preserve exact historical calendar date at midnight
                    $createdAt = Carbon::parse($parsedDate)->startOfDay();

                    // Check existing database duplicate
                    /** @var Sale|null $existingSale */
                    $existingSale = Sale::where('order_number', $orderNum)->first();

                    if ($existingSale) {
                        if ($importMode === 'add_new' || $duplicateMode === 'skip') {
                            $skippedCount++;
                            $duplicatesSkippedCount++;
                            continue;
                        }

                        // Duplicate mode: update existing historical sale
                        // Note: historical cost remains 0.00 to prevent rewriting history with today's ingredient costs
                        $existingSale->update([
                            'branch_id' => $branch->id,
                            'user_id' => $cashierId,
                            'total' => $total,
                            'subtotal' => $total,
                            'paid_amount' => $total,
                            'cost_total' => 0.00,
                            'profit' => $total,
                            'status' => 'completed',
                            'source' => 'historical_import',
                            'source_system' => 'Loyverse',
                            'sales_import_id' => $salesImport->id,
                            'updated_at' => now(),
                        ]);

                        $existingSale->items()->delete();
                        SaleItem::create([
                            'sale_id' => $existingSale->id,
                            'product_id' => $product->id,
                            'quantity' => $qty,
                            'unit_price' => $unitPrice,
                            'cost_price' => 0.00,
                            'subtotal' => $total,
                            'profit' => $total,
                            'created_at' => $createdAt,
                            'updated_at' => now(),
                        ]);

                        $updatedCount++;
                    } else {
                        // Create new historical Sale and SaleItem directly via Eloquent
                        // Inventory and product stock are NOT deducted (historical migration data)
                        try {
                            $newSale = Sale::create([
                                'order_number' => $orderNum,
                                'user_id' => $cashierId,
                                'branch_id' => $branch->id,
                                'type' => 'dine-in',
                                'total' => $total,
                                'subtotal' => $total,
                                'paid_amount' => $total,
                                'change_amount' => 0,
                                'payment_method' => 'cash',
                                'status' => 'completed',
                                'source' => 'historical_import',
                                'source_system' => 'Loyverse',
                                'sales_import_id' => $salesImport->id,
                                'cost_total' => 0.00,
                                'profit' => $total,
                            ]);

                            // Manually set historical timestamps
                            $newSale->created_at = $createdAt;
                            $newSale->updated_at = $createdAt;
                            $newSale->save();

                            SaleItem::create([
                                'sale_id' => $newSale->id,
                                'product_id' => $product->id,
                                'quantity' => $qty,
                                'unit_price' => $unitPrice,
                                'cost_price' => 0.00,
                                'subtotal' => $total,
                                'profit' => $total,
                                'created_at' => $createdAt,
                                'updated_at' => $createdAt,
                            ]);

                            $importedCount++;
                        } catch (\Illuminate\Database\UniqueConstraintViolationException | \Illuminate\Database\QueryException $e) {
                            $skippedCount++;
                            $duplicatesSkippedCount++;
                            continue;
                        }
                    }
                }

                // Finalize import header record
                $salesImport->update([
                    'records_imported' => $importedCount,
                    'records_updated' => $updatedCount,
                    'records_skipped' => $skippedCount,
                    'status' => 'success',
                ]);
            });

            // Delete temp validation file
            Storage::delete($filePath);

            $duration = round(microtime(true) - $startTime, 2);

            // Audit log migration event
            $dateRangeStr = ($minDate && $maxDate) ? "{$minDate} to {$maxDate}" : "N/A";
            SalesImportAudit::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'action' => 'import',
                'details' => "Successfully imported Loyverse historical dataset '{$fileName}' in mode '{$importMode}'. Imported: {$importedCount}, Updated: {$updatedCount}, Skipped: {$skippedCount}. Date Range: {$dateRangeStr}. Duration: {$duration}s."
            ]);

            return response()->json([
                'success' => true,
                'imported' => $importedCount,
                'updated' => $updatedCount,
                'skipped' => $skippedCount,
                'duplicates_skipped' => $duplicatesSkippedCount,
                'duration' => $duration,
                'backupCreated' => $backupResult ? $backupResult->backup_name : null,
                'source' => 'Loyverse',
                'dateRange' => $dateRangeStr,
                'summary' => [
                    'processed' => count($rows),
                    'imported' => $importedCount,
                    'updated' => $updatedCount,
                    'duplicates' => $duplicatesSkippedCount,
                    'skipped' => $skippedCount,
                ],
            ]);

        } catch (\Exception $e) {
            Storage::delete($filePath);

            SalesImport::create([
                'uploaded_by' => $user->id,
                'file_name' => $fileName,
                'import_mode' => $importMode,
                'records_imported' => 0,
                'records_updated' => 0,
                'records_skipped' => 0,
                'status' => 'failed'
            ]);

            SalesImportAudit::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'action' => 'failed_import',
                'details' => "Failed import of Loyverse dataset '{$fileName}': " . $e->getMessage()
            ]);

            return response()->json(['error' => 'Import could not be completed because an error occurred: ' . $e->getMessage()], 500);
        }
    }

    public function restore(Request $request, SalesBackup $backup)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $filePath = $backup->file_path;
        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'Backup file does not exist on storage.'], 404);
        }

        $data = json_decode(Storage::get($filePath), true);
        if (!$data || !isset($data['sales']) || !isset($data['sale_items'])) {
            return response()->json(['error' => 'Corrupt backup payload structure.'], 422);
        }

        try {
            DB::transaction(function () use ($data) {
                DB::table('sale_items')->delete();
                DB::table('sales')->delete();

                foreach ($data['sales'] as $saleData) {
                    DB::table('sales')->insert($saleData);
                }

                foreach ($data['sale_items'] as $itemData) {
                    DB::table('sale_items')->insert($itemData);
                }
            });

            SalesImportAudit::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'action' => 'restore',
                'details' => "Restored database to snapshot '{$backup->backup_name}'."
            ]);

            return response()->json(['success' => 'Database snapshot restored successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Restore failed: ' . $e->getMessage()], 500);
        }
    }

    public function destroyBackup(Request $request, SalesBackup $backup)
    {
        $user = Auth::user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $filePath = $backup->file_path;
        if (Storage::exists($filePath)) {
            Storage::delete($filePath);
        }

        $backupName = $backup->backup_name;
        $backup->delete();

        SalesImportAudit::create([
            'user_id' => $user->id,
            'ip_address' => $request->ip(),
            'action' => 'delete_backup',
            'details' => "Deleted database snapshot record '{$backupName}'."
        ]);

        return response()->json(['success' => 'Backup snapshot deleted successfully.']);
    }

    private function createBackupSnapshot(): ?SalesBackup
    {
        $sales = DB::table('sales')->get()->map(fn($item) => (array)$item)->toArray();
        $saleItems = DB::table('sale_items')->get()->map(fn($item) => (array)$item)->toArray();

        $timestamp = date('Ymd_His');
        $backupName = 'sales_snapshot_' . $timestamp;
        $storagePath = 'backups/' . $backupName . '.json';

        Storage::put($storagePath, json_encode([
            'sales' => $sales,
            'sale_items' => $saleItems
        ]));

        return SalesBackup::create([
            'backup_name' => $backupName,
            'file_path' => $storagePath,
            'records_count' => count($sales),
        ]);
    }

    private function mapHeaders(array $headers): array
    {
        $mapping = [];
        foreach ($headers as $index => $header) {
            if ($header === null) continue;
            $clean = strtolower(trim((string)$header));
            $cleanNoPunct = preg_replace('/[^a-z0-9]/', '', $clean);

            // 1. Branch
            if (in_array($cleanNoPunct, ['branch', 'branchname', 'branchlocation', 'store', 'location', 'branchid'])) {
                $mapping['branch'] = $index;
            }
            // 2. Product
            elseif (in_array($cleanNoPunct, ['product', 'productname', 'item', 'itemname', 'sku', 'productid'])) {
                $mapping['product'] = $index;
            }
            // 3. Quantity
            elseif (in_array($cleanNoPunct, ['quantity', 'qty', 'count', 'pieces', 'pcs'])) {
                $mapping['quantity'] = $index;
            }
            // 4. Total Price vs Unit Price
            elseif (in_array($cleanNoPunct, ['totalprice', 'totalamount', 'total', 'subtotal', 'amount', 'sales', 'gross', 'totalsale', 'totalsales'])) {
                $mapping['total'] = $index;
            }
            elseif (in_array($cleanNoPunct, ['unitprice', 'price', 'rate', 'cost'])) {
                $mapping['unit_price'] = $index;
            }
            // 5. Date
            elseif (in_array($cleanNoPunct, ['date', 'saledate', 'salesdate', 'timestamp', 'transactiondate', 'orderdate', 'createdat'])) {
                $mapping['date'] = $index;
            }
            // Optional: Order Number / Transaction ID
            elseif (in_array($cleanNoPunct, ['ordernumber', 'transactionnumber', 'invoicenumber', 'receiptnumber', 'transactionid', 'orderid'])) {
                $mapping['order_number'] = $index;
            }
            // Optional: Cashier
            elseif (in_array($cleanNoPunct, ['cashier', 'cashiername', 'user', 'operator'])) {
                $mapping['cashier'] = $index;
            }
        }

        // If total is missing but unit_price was matched and no other total exists, check if header was simply 'price'
        if (!isset($mapping['total']) && isset($mapping['unit_price'])) {
            $mapping['total'] = $mapping['unit_price'];
            unset($mapping['unit_price']);
        }

        return $mapping;
    }

    private function parseCurrency($value): ?float
    {
        if ($value === null || trim((string)$value) === '') {
            return null;
        }

        if (is_numeric($value)) {
            return (float) $value;
        }

        $rawTrim = trim((string) $value);
        // Remove currency symbols (₱, PHP, Php, $, spaces)
        $stripped = preg_replace('/^[\s\p{Sc}|PHP|Php|php]+/u', '', $rawTrim);
        $stripped = trim($stripped);

        // Strict character check: after currency prefix, only digits, commas, decimal dots, and optional leading minus allowed
        if (!preg_match('/^-?[\d,]+(\.\d+)?$/', $stripped) && !preg_match('/^-?\d+$/', $stripped)) {
            return null;
        }

        // Strip thousands commas
        $normalized = str_replace(',', '', $stripped);
        if (!is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }

    private function parseDate($value): ?string
    {
        if ($value === null || trim((string)$value) === '') {
            return null;
        }

        // 1. If Excel serial number (e.g. 40000 to 70000)
        if (is_numeric($value) && (float)$value > 20000 && (float)$value < 80000) {
            try {
                return ExcelDate::excelToDateTimeObject((float)$value)->format('Y-m-d');
            } catch (\Throwable $e) {
                // fallback
            }
        }

        $str = trim((string) $value);

        // 2. Try Carbon parsing with standard / human date formats (e.g. "September 9 2026", "September 9, 2026")
        try {
            $normalized = preg_replace('/\s+/', ' ', str_replace(',', ' ', $str));
            $parsed = Carbon::parse($normalized);
            if ($parsed->year > 1990 && $parsed->year < 2100) {
                return $parsed->format('Y-m-d');
            }
        } catch (\Throwable $e) {
            // fallback
        }

        // 3. Try strtotime
        $time = strtotime($str);
        if ($time) {
            return date('Y-m-d', $time);
        }

        return null;
    }

    private function resolveBranch(string $branchVal, $branches, $branchesById): ?Branch
    {
        $clean = strtolower(trim($branchVal));
        if ($clean === '') {
            return null;
        }

        // Numeric ID match
        if (is_numeric($clean) && $branchesById->has((int)$clean)) {
            return $branchesById->get((int)$clean);
        }

        // Exact match on branch name
        if ($branches->has($clean)) {
            return $branches->get($clean);
        }

        // Match with / without "Maki Desu " prefix
        // e.g. input is "Sta Cruz", DB has "Maki Desu Sta Cruz"
        $withPrefix = 'maki desu ' . $clean;
        if ($branches->has($withPrefix)) {
            return $branches->get($withPrefix);
        }

        if (str_starts_with($clean, 'maki desu ')) {
            $withoutPrefix = trim(substr($clean, 10));
            if ($branches->has($withoutPrefix)) {
                return $branches->get($withoutPrefix);
            }
        }

        // Punctuation tolerance (e.g. "sta. cruz" vs "sta cruz")
        $cleanNoPunct = str_replace('.', '', $clean);
        foreach ($branches as $nameKey => $b) {
            $bCleanNoPunct = str_replace('.', '', $nameKey);
            if ($bCleanNoPunct === $cleanNoPunct || $bCleanNoPunct === 'maki desu ' . $cleanNoPunct) {
                return $b;
            }
        }

        return null;
    }

    private function resolveProduct(string $productVal, $products, $productsById, $productsBySku, array $explicitMappings = []): ?Product
    {
        $clean = strtolower(trim($productVal));
        if ($clean === '') {
            return null;
        }

        // 1. Explicit user mappings from preview resolution
        if (isset($explicitMappings[$productVal])) {
            $mappedId = (int) $explicitMappings[$productVal];
            if ($productsById->has($mappedId)) {
                return $productsById->get($mappedId);
            }
        }
        if (isset($explicitMappings[$clean])) {
            $mappedId = (int) $explicitMappings[$clean];
            if ($productsById->has($mappedId)) {
                return $productsById->get($mappedId);
            }
        }

        // 2. Numeric ID match
        if (is_numeric($clean) && $productsById->has((int)$clean)) {
            return $productsById->get((int)$clean);
        }

        // 3. SKU match
        if ($productsBySku->has($clean)) {
            return $productsBySku->get($clean);
        }

        // 4. Exact normalized name match (trimmed, lowercased, single spaces)
        $normalizedSpaces = preg_replace('/\s+/', ' ', $clean);
        if ($products->has($normalizedSpaces)) {
            return $products->get($normalizedSpaces);
        }

        foreach ($products as $pName => $prod) {
            if (preg_replace('/\s+/', ' ', $pName) === $normalizedSpaces) {
                return $prod;
            }
        }

        return null;
    }

    private function generateCanonicalOrderNumber(int $branchId, string $date, int $productId, float $qty, int $occurrence): string
    {
        $dateSlug = str_replace('-', '', $date);
        return "HIST-LOY-B{$branchId}-{$dateSlug}-P{$productId}-Q" . (int)$qty . "-OCC{$occurrence}";
    }
}
