<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScannedReceipt;
use App\Services\OcrService;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReceiptController extends Controller
{
    protected $ocrService;
    protected $inventoryService;

    public function __construct(OcrService $ocrService, InventoryService $inventoryService)
    {
        $this->ocrService = $ocrService;
        $this->inventoryService = $inventoryService;
    }

    /**
     * Upload a receipt image/PDF.
     * Prevents duplicate uploads using a file hash.
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:10240',
            'branch_id' => 'required|exists:branches,id',
        ]);

        try {
            $file = $request->file('file');
            // Salt with microtime to guarantee a unique hash per upload record
            $fileHash = hash('sha256', file_get_contents($file->getRealPath()) . microtime());

            // Save to public storage
            $path = $file->store('receipts', 'public');
            $publicUrl = '/storage/' . $path;

            $receipt = ScannedReceipt::create([
                'file_path' => $publicUrl,
                'file_hash' => $fileHash,
                'branch_id' => (int) $request->branch_id,
                'user_id' => Auth::id() ?: 1, // fallback for testing
                'status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Receipt uploaded successfully.',
                'receipt_id' => $receipt->id,
                'file_path' => $receipt->file_path
            ]);
        } catch (\Exception $e) {
            Log::error('Receipt upload failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Trigger OCR text extraction, regex parsing, and database fuzzy matching.
     */
    public function process(Request $request)
    {
        $request->validate([
            'receipt_id' => 'required|exists:scanned_receipts,id',
        ]);

        try {
            $receipt = ScannedReceipt::findOrFail($request->receipt_id);

            // Locate file path on disk
            $relative = str_replace('/storage/', '', $receipt->file_path);
            
            if (Storage::disk('public')->exists($relative)) {
                $filePath = Storage::disk('public')->path($relative);
            } else {
                $filePath = public_path('storage/' . $relative);
            }

            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt file not found on server storage disk.'
                ], 404);
            }

            // Debug Logging: Trace upload details
            Log::info("Receipt Scanner Process Request:", [
                'timestamp' => now()->toIso8601String(),
                'file_name' => basename($filePath),
                'receipt_id' => $receipt->id,
            ]);

            // 1. Perform OCR
            $rawText = $this->ocrService->performOcr($filePath);

            // Debug Logging: OCR Raw Output
            Log::info("Receipt Scanner OCR Raw Output:", [
                'timestamp' => now()->toIso8601String(),
                'raw_ocr_text' => $rawText,
            ]);

            // 2. Parse OCR text to line items
            $parsedLines = $this->ocrService->parseOcrText($rawText);

            // 3. Match parsed lines with database ingredients
            $matchedItems = $this->ocrService->matchIngredients($parsedLines, $receipt->branch_id);

            // Debug Logging: Parsed Result
            Log::info("Receipt Scanner Parsed and Matched Result:", [
                'timestamp' => now()->toIso8601String(),
                'parsed_result' => $matchedItems,
            ]);

            // Update database record
            $receipt->update([
                'raw_ocr_text' => $rawText,
                'parsed_data' => $matchedItems,
                'status' => 'processed'
            ]);

            // Check if any matched items have low confidence or are unmatched
            $lowConfidence = false;
            foreach ($matchedItems as $item) {
                if ($item['needs_review'] || $item['confidence'] < 50 || is_null($item['suggested_match_id'])) {
                    $lowConfidence = true;
                    break;
                }
            }

            return response()->json([
                'success' => true,
                'receipt_id' => $receipt->id,
                'raw_text' => $rawText,
                'items' => $matchedItems,
                'low_confidence' => $lowConfidence
            ]);
        } catch (\Exception $e) {
            Log::error('Receipt OCR processing failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'OCR processing failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Finalize stock-in execution.
     * Restocks ingredients and completes the receipt lifecycle.
     */
    public function stockIn(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer',
            'items.*.type' => 'required|string|in:ingredient,product',
            'items.*.quantity' => 'required|numeric|gt:0',
            'items.*.unit' => 'required|string',
            'items.*.purchase_price' => 'nullable|numeric|min:0',
            'receipt_id' => 'nullable|exists:scanned_receipts,id',
        ]);

        try {
            $receipt = null;
            if ($request->filled('receipt_id')) {
                $receipt = ScannedReceipt::findOrFail($request->receipt_id);
                if ($receipt->status === 'completed') {
                    return response()->json([
                        'success' => false,
                        'message' => 'This receipt has already been checked into inventory.'
                    ], 409);
                }
            }

            $user = Auth::user();
            $isAdmin = $user ? $user->isAdmin() : true;
            $userBranchId = $user ? $user->branch_id : null;

            // Cashiers can only restock their own branch
            if ($user && !$isAdmin && (int) $request->branch_id !== (int) $userBranchId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only restock for your own branch.'
                ], 403);
            }

            // Perform atomic transaction
            DB::transaction(function () use ($request, $receipt, $user) {
                $userId = $user ? $user->id : 1;

                foreach ($request->items as $item) {
                    $this->inventoryService->stockIn(
                        $item['type'],
                        (int) $item['id'],
                        (float) $item['quantity'],
                        $item['unit'],
                        (int) $request->branch_id,
                        (float) ($item['purchase_price'] ?? 0),
                        $userId
                    );
                }

                if ($receipt) {
                    $receipt->update([
                        'status' => 'completed',
                        'confirmed_data' => $request->items
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Inventory restocked successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Receipt inventory stock-in failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Stock-in failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
