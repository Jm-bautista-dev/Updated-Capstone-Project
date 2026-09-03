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
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Maatwebsite\Excel\Facades\Excel;

class SalesDataManagementController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
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
        $branches = Branch::orderBy('name')->get();

        return Inertia::render('Admin/SalesDataManagement/Index', [
            'stats' => [
                'total_sales_records' => $totalSales,
                'last_import_date' => $lastImport ? $lastImport->created_at->toIso8String() : null,
                'last_imported_by' => $lastImport ? ($lastImport->user->name ?? 'Unknown') : null,
                'duplicate_records_detected' => $duplicatesCount,
                'data_integrity_status' => $integrityStatus,
            ],
            'importsHistory' => $importsHistory,
            'auditLogs' => $auditLogs,
            'backups' => $backups,
            'branches' => $branches,
            'isAdmin' => $user->isAdmin(),
        ]);
    }

    public function validateFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,xlsx,xls,txt',
        ]);

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        
        // Read file using Excel facade to support CSV & Excel formats
        $sheets = Excel::toArray(new \stdClass(), $file);
        $rows = $sheets[0] ?? [];

        if (count($rows) < 2) {
            return response()->json([
                'error' => 'The uploaded file is empty or contains no data rows.'
            ], 422);
        }

        $headers = array_shift($rows);
        $mapping = $this->mapHeaders($headers);

        // Required columns list
        $required = ['order_number', 'date', 'branch', 'product', 'quantity', 'unit_price', 'total'];
        $missing = [];
        foreach ($required as $req) {
            if (!isset($mapping[$req])) {
                $missing[] = str_replace('_', ' ', $req);
            }
        }

        if (count($missing) > 0) {
            return response()->json([
                'error' => 'Missing required columns: ' . implode(', ', $missing) . '. Please ensure headers match the expected schema.'
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

        foreach ($rows as $index => $row) {
            $rowNum = $index + 2; // 1-based, account for header row
            $rowErrors = [];

            // Extract row values based on header mapping
            $orderNum = trim($row[$mapping['order_number']] ?? '');
            $dateStr = trim($row[$mapping['date']] ?? '');
            $branchVal = trim($row[$mapping['branch']] ?? '');
            $productVal = trim($row[$mapping['product']] ?? '');
            $qtyVal = trim($row[$mapping['quantity']] ?? '');
            $priceVal = trim($row[$mapping['unit_price']] ?? '');
            $totalVal = trim($row[$mapping['total']] ?? '');
            $cashierVal = isset($mapping['cashier']) ? trim($row[$mapping['cashier']] ?? '') : '';

            // 1. Validate Order/Transaction Number
            if (empty($orderNum)) {
                $rowErrors[] = 'Transaction number is empty.';
            } else {
                if (isset($seenOrderNumbersInFile[$orderNum])) {
                    $rowErrors[] = "Duplicate transaction ID '{$orderNum}' within this file.";
                    $seenDuplicatesInFileCount++;
                }
                $seenOrderNumbersInFile[$orderNum] = $rowNum;
            }

            // 2. Validate Date
            $timestamp = null;
            if (empty($dateStr)) {
                $rowErrors[] = 'Date is empty.';
            } else {
                // Try parsing date
                $time = strtotime($dateStr);
                if (!$time) {
                    $rowErrors[] = "Invalid date format '{$dateStr}'. Expected YYYY-MM-DD.";
                } else {
                    $timestamp = date('Y-m-d H:i:s', $time);
                }
            }

            // 3. Validate Branch Reference
            $branchId = null;
            if (empty($branchVal)) {
                $rowErrors[] = 'Branch is empty.';
            } else {
                $cleanBranch = strtolower(trim($branchVal));
                if (is_numeric($cleanBranch) && $branchesById->has($cleanBranch)) {
                    $branchId = (int)$cleanBranch;
                } elseif ($branches->has($cleanBranch)) {
                    $branchId = $branches->get($cleanBranch)->id;
                } else {
                    $rowErrors[] = "Invalid branch reference '{$branchVal}'.";
                }
            }

            // 4. Validate Product Reference
            $productId = null;
            if (empty($productVal)) {
                $rowErrors[] = 'Product is empty.';
            } else {
                $cleanProduct = strtolower(trim($productVal));
                if (is_numeric($cleanProduct) && $productsById->has($cleanProduct)) {
                    $productId = (int)$cleanProduct;
                } elseif ($productsBySku->has($cleanProduct)) {
                    $productId = $productsBySku->get($cleanProduct)->id;
                } elseif ($products->has($cleanProduct)) {
                    $productId = $products->get($cleanProduct)->id;
                } else {
                    $rowErrors[] = "Invalid product reference '{$productVal}'.";
                }
            }

            // 5. Validate Quantity
            if ($qtyVal === '' || !is_numeric($qtyVal) || (float)$qtyVal <= 0) {
                $rowErrors[] = "Invalid quantity '{$qtyVal}'. Must be a positive number.";
            }

            // 6. Validate Unit Price
            if ($priceVal === '' || !is_numeric($priceVal) || (float)$priceVal < 0) {
                $rowErrors[] = "Invalid unit price '{$priceVal}'. Must be a non-negative number.";
            }

            // 7. Validate Total
            if ($totalVal === '' || !is_numeric($totalVal) || (float)$totalVal < 0) {
                $rowErrors[] = "Invalid total value '{$totalVal}'. Must be a non-negative number.";
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
                    'order_number' => $orderNum,
                    'date' => $dateStr,
                    'branch' => $branchVal,
                    'product' => $productVal,
                    'quantity' => $qtyVal,
                    'unit_price' => $priceVal,
                    'total' => $totalVal,
                    'cashier' => $cashierVal,
                    'is_valid' => $isValid,
                    'errors' => $rowErrors
                ];
            }
        }

        // Store validation details temporarily in session/storage
        $tempKey = 'sales_import_' . uniqid();
        Storage::put('temp_imports/' . $tempKey . '.json', json_encode([
            'fileName' => $fileName,
            'headers' => $headers,
            'mapping' => $mapping,
            'rows' => $rows
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
        ]);
    }

    public function import(Request $request)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $request->validate([
            'tempKey' => 'required|string',
            'importMode' => 'required|in:add_new,update,replace_range,replace_all',
            'duplicateMode' => 'required|in:skip,update',
            'dateRangeStart' => 'required_if:importMode,replace_range|nullable|date',
            'dateRangeEnd' => 'required_if:importMode,replace_range|nullable|date',
            'confirmText' => 'required_if:importMode,replace_all|nullable|string',
        ]);

        $tempKey = $request->input('tempKey');
        $importMode = $request->input('importMode');
        $duplicateMode = $request->input('duplicateMode');

        $filePath = 'temp_imports/' . $tempKey . '.json';
        if (!Storage::exists($filePath)) {
            return response()->json(['error' => 'Validated data has expired. Please upload the file again.'], 422);
        }

        $data = json_decode(Storage::get($filePath), true);
        $fileName = $data['fileName'];
        $mapping = $data['mapping'];
        $rows = $data['rows'];

        // Strict validation check for replace_all
        if ($importMode === 'replace_all') {
            if ($request->input('confirmText') !== 'DELETE ALL SALES') {
                return response()->json(['error' => 'Confirmation mismatch. You must type "DELETE ALL SALES".'], 422);
            }
        }

        $startTime = microtime(true);

        // 1. Create a Snapshot Database Backup first if changing existing data
        $backupResult = $this->createBackupSnapshot();

        // Perform transactional database operations
        $importedCount = 0;
        $updatedCount = 0;
        $skippedCount = 0;
        $duplicatesSkippedCount = 0;

        try {
            DB::transaction(function () use ($importMode, $duplicateMode, $mapping, $rows, $request, &$importedCount, &$updatedCount, &$skippedCount, &$duplicatesSkippedCount) {
                
                // Cache referenced items
                $branches = Branch::all()->keyBy(fn($b) => strtolower(trim($b->name)));
                $branchesById = Branch::all()->keyBy('id');
                $products = Product::all()->keyBy(fn($p) => strtolower(trim($p->name)));
                $productsById = Product::all()->keyBy('id');
                $productsBySku = Product::all()->whereNotNull('sku')->keyBy(fn($p) => strtolower(trim($p->sku)));
                $users = User::all()->keyBy(fn($u) => strtolower(trim($u->name)));
                $currentUserId = Auth::id();

                // Handle clear/replace setups
                if ($importMode === 'replace_all') {
                    // Wipes all items and orders
                    DB::table('sale_items')->delete();
                    DB::table('sales')->delete();
                } elseif ($importMode === 'replace_range') {
                    $start = $request->input('dateRangeStart') . ' 00:00:00';
                    $end = $request->input('dateRangeEnd') . ' 23:59:59';
                    
                    // Fetch sales ids to wipe
                    $salesToWipe = Sale::whereBetween('created_at', [$start, $end])->pluck('id');
                    
                    if ($salesToWipe->isNotEmpty()) {
                        DB::table('sale_items')->whereIn('sale_id', $salesToWipe)->delete();
                        DB::table('sales')->whereIn('id', $salesToWipe)->delete();
                    }
                }

                // Batch process rows
                $seenOrderNumbersInUpload = [];
                $duplicatesSkippedCount = 0;

                foreach ($rows as $row) {
                    $orderNum = trim($row[$mapping['order_number']] ?? '');
                    $dateStr = trim($row[$mapping['date']] ?? '');
                    $branchVal = trim($row[$mapping['branch']] ?? '');
                    $productVal = trim($row[$mapping['product']] ?? '');
                    $qty = (float)($row[$mapping['quantity']] ?? 0);
                    $price = (float)($row[$mapping['unit_price']] ?? 0);
                    $total = (float)($row[$mapping['total']] ?? 0);
                    $cashierVal = isset($mapping['cashier']) ? trim($row[$mapping['cashier']] ?? '') : '';

                    if (empty($orderNum)) {
                        $skippedCount++;
                        continue;
                    }

                    // Lookup references
                    $cleanBranch = strtolower(trim($branchVal));
                    $branchId = is_numeric($cleanBranch) && $branchesById->has($cleanBranch) 
                        ? (int)$cleanBranch 
                        : ($branches->has($cleanBranch) ? $branches->get($cleanBranch)->id : null);

                    $cleanProduct = strtolower(trim($productVal));
                    $product = is_numeric($cleanProduct) && $productsById->has($cleanProduct)
                        ? $productsById->get($cleanProduct)
                        : ($productsBySku->has($cleanProduct) 
                            ? $productsBySku->get($cleanProduct) 
                            : ($products->has($cleanProduct) ? $products->get($cleanProduct) : null));

                    if (!$branchId || !$product) {
                        $skippedCount++;
                        continue;
                    }

                    $cleanCashier = strtolower(trim($cashierVal));
                    $cashierId = $users->has($cleanCashier) ? $users->get($cleanCashier)->id : $currentUserId;

                    // Resolve date
                    $createdAt = date('Y-m-d H:i:s', strtotime($dateStr));

                    // Check intra-upload duplicate
                    $isDuplicateInUpload = isset($seenOrderNumbersInUpload[$orderNum]);
                    $seenOrderNumbersInUpload[$orderNum] = true;

                    if ($isDuplicateInUpload && ($importMode === 'add_new' || $duplicateMode === 'skip')) {
                        $skippedCount++;
                        $duplicatesSkippedCount++;
                        continue;
                    }

                    // Check existing database duplicate
                    /** @var Sale|null $existingSale */
                    $existingSale = Sale::where('order_number', $orderNum)->first();

                    if ($existingSale) {
                        if ($importMode === 'add_new' || $duplicateMode === 'skip') {
                            $skippedCount++;
                            $duplicatesSkippedCount++;
                            continue;
                        }

                        $itemCost = (float) $product->computeProductCost($branchId);
                        $costTotal = $itemCost * $qty;
                        $profit = $total - $costTotal;

                        // Duplicate mode update
                        $existingSale->update([
                            'branch_id' => $branchId,
                            'user_id' => $cashierId,
                            'total' => $total,
                            'cost_total' => $costTotal,
                            'profit' => $profit,
                            'paid_amount' => $total,
                            'status' => 'completed',
                            'updated_at' => now(),
                        ]);

                        // Replace sale items with the new item
                        $existingSale->items()->delete();
                        SaleItem::create([
                            'sale_id' => $existingSale->id,
                            'product_id' => $product->id,
                            'quantity' => $qty,
                            'unit_price' => $price,
                            'cost_price' => $itemCost,
                            'subtotal' => $total,
                            'profit' => $profit,
                        ]);

                        $updatedCount++;
                    } else {
                        $itemCost = (float) $product->computeProductCost($branchId);
                        $costTotal = $itemCost * $qty;
                        $profit = $total - $costTotal;

                        // Create new Sale with database unique constraint violation guard
                        try {
                            $newSale = Sale::create([
                                'order_number' => $orderNum,
                                'user_id' => $cashierId,
                                'branch_id' => $branchId,
                                'type' => 'dine-in',
                                'total' => $total,
                                'paid_amount' => $total,
                                'change_amount' => 0,
                                'payment_method' => 'cash',
                                'status' => 'completed',
                                'cost_total' => $costTotal,
                                'profit' => $profit,
                            ]);

                            // Update timestamps manually to match uploaded historical date
                            $newSale->created_at = $createdAt;
                            $newSale->updated_at = $createdAt;
                            $newSale->save();

                            SaleItem::create([
                                'sale_id' => $newSale->id,
                                'product_id' => $product->id,
                                'quantity' => $qty,
                                'unit_price' => $price,
                                'cost_price' => $itemCost,
                                'subtotal' => $total,
                                'profit' => $profit,
                            ]);

                            $importedCount++;
                        } catch (\Illuminate\Database\UniqueConstraintViolationException | \Illuminate\Database\QueryException $e) {
                            // Caught concurrent duplicate insertion or database unique constraint
                            $skippedCount++;
                            $duplicatesSkippedCount++;
                            continue;
                        }
                    }
                }
            });

            // Delete temp validation file
            Storage::delete($filePath);

            $duration = round(microtime(true) - $startTime, 2);

            // Log import success
            $importLog = SalesImport::create([
                'uploaded_by' => $user->id,
                'file_name' => $fileName,
                'import_mode' => $importMode,
                'records_imported' => $importedCount,
                'records_updated' => $updatedCount,
                'records_skipped' => $skippedCount,
                'status' => 'success'
            ]);

            // Audit entry
            SalesImportAudit::create([
                'user_id' => $user->id,
                'ip_address' => $request->ip(),
                'action' => 'import',
                'details' => "Successfully imported '{$fileName}' in mode '{$importMode}'. Imported: {$importedCount}, Updated: {$updatedCount}, Skipped: {$skippedCount}. Duration: {$duration}s."
            ]);

            return response()->json([
                'success' => true,
                'imported' => $importedCount,
                'updated' => $updatedCount,
                'skipped' => $skippedCount,
                'duplicates_skipped' => $duplicatesSkippedCount,
                'duration' => $duration,
                'backupCreated' => $backupResult ? $backupResult->backup_name : null,
                'summary' => [
                    'processed' => count($rows),
                    'imported' => $importedCount,
                    'updated' => $updatedCount,
                    'duplicates' => $duplicatesSkippedCount,
                    'skipped' => $skippedCount,
                ],
            ]);

        } catch (\Exception $e) {
            // Delete temp validation file
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
                'details' => "Failed import of '{$fileName}': " . $e->getMessage()
            ]);

            return response()->json(['error' => 'Import execution failed: ' . $e->getMessage()], 500);
        }
    }

    public function restore(Request $request, SalesBackup $backup)
    {
        $user = Auth::user();
        if (!$user->isAdmin()) {
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
                // Clear existing records
                DB::table('sale_items')->delete();
                DB::table('sales')->delete();

                // Re-insert sales
                foreach ($data['sales'] as $saleData) {
                    DB::table('sales')->insert($saleData);
                }

                // Re-insert sale items
                foreach ($data['sale_items'] as $itemData) {
                    DB::table('sale_items')->insert($itemData);
                }
            });

            // Log Audit trail
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
        if (!$user->isAdmin()) {
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

        // Write snapshot file
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
            $clean = strtolower(trim(str_replace([' ', '_', '-'], '', $header)));
            if (in_array($clean, ['transactionnumber', 'ordernumber', 'invoicenumber', 'receiptnumber', 'transactionid', 'orderid'])) {
                $mapping['order_number'] = $index;
            } elseif (in_array($clean, ['date', 'timestamp', 'createdat'])) {
                $mapping['date'] = $index;
            } elseif (in_array($clean, ['branch', 'branchname', 'branchid'])) {
                $mapping['branch'] = $index;
            } elseif (in_array($clean, ['product', 'productname', 'productid', 'sku'])) {
                $mapping['product'] = $index;
            } elseif (in_array($clean, ['quantity', 'qty'])) {
                $mapping['quantity'] = $index;
            } elseif (in_array($clean, ['unitprice', 'price'])) {
                $mapping['unit_price'] = $index;
            } elseif (in_array($clean, ['total', 'subtotal'])) {
                $mapping['total'] = $index;
            } elseif (in_array($clean, ['cashier', 'cashiername', 'user'])) {
                $mapping['cashier'] = $index;
            }
        }
        return $mapping;
    }
}
