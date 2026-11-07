<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;
use Carbon\Carbon;
use Illuminate\Support\Str;

class StockInController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Handle manual restocking for either an Ingredient (branch-scoped) or a Product.
     *
     * For ingredients: updates ingredient_stocks WHERE ingredient_id=X AND branch_id=Y.
     * NEVER allows cross-branch restocking.
     */
    /**
     * Handle bulk manual restocking for multiple ingredients or products.
     * Atomic transaction via InventoryService with authoritative restock timestamp and operation tracing.
     */
    public function massStore(Request $request)
    {
        $validated = $request->validate([
            'branch_id'         => 'required|exists:branches,id',
            'received_at'       => 'nullable|date',
            'reference'         => 'nullable|string|max:255',
            'idempotency_token' => 'nullable|string|max:100',
            'items'             => 'required|array|min:1',
            'items.*.id'              => 'required|integer',
            'items.*.type'            => 'required|in:ingredient,product',
            'items.*.quantity'        => 'required|numeric|gt:0|max:1000000',
            'items.*.unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'items.*.purchase_price'  => 'nullable|numeric|min:0',
            'items.*.unit_cost'       => 'nullable|numeric|min:0',
            'items.*.lot_number'      => 'nullable|string|max:100',
            'items.*.batch_code'      => 'nullable|string|max:64',
            'items.*.expiration_date' => ['nullable', 'date', new \App\Rules\UnexpiredExpirationDate()],
            'items.*.expiration_type' => 'nullable|string|in:use_by,best_before,none',
            'items.*.supplier_id'     => 'nullable|exists:suppliers,id',
            'items.*.supplier_name'   => 'nullable|string|max:150',
            'items.*.received_at'     => 'nullable|date',
            'items.*.reference'       => 'nullable|string|max:255',
            'items.*.notes'           => 'nullable|string|max:500',
        ]);

        $user         = Auth::user();
        $isAdmin      = $user ? $user->role === 'admin' : false;
        $userBranchId = $user ? $user->branch_id : null;

        if (!$isAdmin && (int) $request->branch_id !== (int) $userBranchId) {
            return back()->withErrors([
                'branch_id' => 'You can only restock for your own branch.',
            ]);
        }

        // Idempotency guard: prevent duplicate repeated submissions
        $idempotencyToken = $validated['idempotency_token'] ?? null;
        $lockKey = null;
        if ($idempotencyToken) {
            $lockKey = 'mass_stock_in_lock_' . md5($idempotencyToken . '_' . ($user ? $user->id : 'guest'));
            if (!Cache::add($lockKey, 'in_flight', 30)) {
                return back()->withErrors([
                    'error' => 'Duplicate submission detected. This restock operation is already being processed or has completed.',
                ]);
            }
        }

        // Timezone-authoritative restock timestamp (Asia/Manila)
        $tz = 'Asia/Manila';
        $manilaNow = Carbon::now($tz);

        if (!empty($validated['received_at'])) {
            try {
                $parsedReceivedAt = Carbon::parse($validated['received_at'], $tz);
                // Restock receipt date cannot be in the future beyond today
                if ($parsedReceivedAt->copy()->startOfDay()->gt($manilaNow->copy()->endOfDay())) {
                    if ($lockKey) {
                        Cache::forget($lockKey);
                    }
                    return back()->withErrors([
                        'received_at' => 'Restock date cannot be in the future.',
                    ]);
                }
                // If only a date (Y-m-d) was supplied without time, attach current time
                if (strlen(trim($validated['received_at'])) <= 10) {
                    $receivedAt = $parsedReceivedAt->setTime($manilaNow->hour, $manilaNow->minute, $manilaNow->second);
                } else {
                    $receivedAt = $parsedReceivedAt;
                }
            } catch (\Throwable $e) {
                if ($lockKey) {
                    Cache::forget($lockKey);
                }
                return back()->withErrors(['received_at' => 'Invalid restock date format.']);
            }
        } else {
            // Server-authoritative current timestamp
            $receivedAt = $manilaNow;
        }

        // Validate expiration dates strictly per ingredient
        foreach ($validated['items'] as $idx => $item) {
            if ($item['type'] === 'ingredient') {
                $ingredient = \App\Models\Ingredient::find($item['id']);
                $expVal = app(\App\Services\InventoryExpirationService::class)->validateRestockExpirationDate(
                    $item['expiration_date'] ?? null,
                    $ingredient,
                    $item['expiration_type'] ?? 'use_by'
                );
                if (!$expVal['valid']) {
                    if ($lockKey) {
                        Cache::forget($lockKey);
                    }
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.{$idx}.expiration_date" => $expVal['message'],
                        'error' => $expVal['message'],
                    ]);
                }
            }
        }

        // Traceable operation reference linking all batches in this mass restock
        $operationRef = !empty($validated['reference'])
            ? trim($validated['reference'])
            : sprintf('MASS-RESTOCK-%s-%s', $manilaNow->format('YmdHis'), strtoupper(Str::random(4)));

        try {
            $this->inventoryService->massStockIn(
                $validated['items'],
                (int) $validated['branch_id'],
                $user ? $user->id : null,
                $receivedAt->toIso8601String(),
                $operationRef
            );

            $formattedDate = $receivedAt->copy()->setTimezone($tz)->format('M d, Y h:i A');
            return back()->with('success', "Mass restock completed successfully for {$formattedDate}. Reference: {$operationRef}.");
        } catch (\Exception $e) {
            if ($lockKey) {
                Cache::forget($lockKey);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'              => 'required|in:ingredient,product',
            'id'                => 'required|integer',
            'quantity'          => 'required|numeric|gt:0|max:1000000',
            'unit'              => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id'         => 'required|exists:branches,id',
            'purchase_price'    => 'nullable|numeric|min:0',
            'lot_number'        => 'nullable|string|max:100',
            'batch_code'        => 'nullable|string|max:64',
            'expiration_date'   => ['nullable', 'date', new \App\Rules\UnexpiredExpirationDate()],
            'expiration_type'   => 'nullable|string|in:use_by,best_before,none',
            'supplier_id'       => 'nullable|exists:suppliers,id',
            'supplier_name'     => 'nullable|string|max:150',
            'received_at'       => 'nullable|date',
            'reference'         => 'nullable|string|max:255',
            'notes'             => 'nullable|string|max:500',
            'idempotency_token' => 'nullable|string|max:100',
        ]);

        $user         = Auth::user();
        $isAdmin      = $user ? $user->role === 'admin' : false;
        $userBranchId = $user ? $user->branch_id : null;

        // Security: Cashiers can only restock their own branch
        if (!$isAdmin && (int) $request->branch_id !== (int) $userBranchId) {
            return back()->withErrors([
                'branch_id' => 'You can only restock for your own branch.',
            ]);
        }

        // Idempotency guard: prevent duplicate repeated submissions
        $idempotencyToken = $validated['idempotency_token'] ?? null;
        $lockKey = null;
        if ($idempotencyToken) {
            $lockKey = 'stock_in_lock_' . md5($idempotencyToken . '_' . ($user ? $user->id : 'guest'));
            if (!Cache::add($lockKey, 'in_flight', 30)) {
                return back()->withErrors([
                    'error' => 'Duplicate submission detected. This restock operation is already being processed or has completed.',
                ]);
            }
        }

        // Validate expiry date requirement & unexpired date policy
        if ($validated['type'] === 'ingredient') {
            $ingredient = \App\Models\Ingredient::find($validated['id']);
            $expVal = app(\App\Services\InventoryExpirationService::class)->validateRestockExpirationDate(
                $validated['expiration_date'] ?? null,
                $ingredient,
                $validated['expiration_type'] ?? 'use_by'
            );
            if (!$expVal['valid']) {
                if ($lockKey) {
                    Cache::forget($lockKey);
                }
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'expiration_date' => $expVal['message'],
                ]);
            }
        }

        try {
            $batchMeta = [
                'lot_number'      => $validated['lot_number'] ?? null,
                'batch_code'      => $validated['batch_code'] ?? null,
                'expiration_date' => $validated['expiration_date'] ?? null,
                'expiration_type' => $validated['expiration_type'] ?? 'use_by',
                'supplier_id'     => $validated['supplier_id'] ?? null,
                'supplier_name'   => $validated['supplier_name'] ?? null,
                'received_at'     => $validated['received_at'] ?? null,
                'notes'           => $validated['notes'] ?? null,
            ];

            $log = $this->inventoryService->stockIn(
                $validated['type'],
                (int) $validated['id'],
                (float) $validated['quantity'],
                $validated['unit'],
                (int) $validated['branch_id'],
                (float) ($validated['purchase_price'] ?? 0),
                $user ? $user->id : null,
                $validated['reference'] ?? null,
                $batchMeta
            );

            return back()->with('success', "Stock added successfully. Batch tracked for FIFO/FEFO automatic consumption.");
        } catch (\Exception $e) {
            if ($lockKey) {
                Cache::forget($lockKey);
            }
            $errKey = ($e instanceof \InvalidArgumentException && str_contains(strtolower($e->getMessage()), 'expiration'))
                ? 'expiration_date'
                : 'error';
            return back()->withErrors([$errKey => $e->getMessage()]);
        }
    }
}
