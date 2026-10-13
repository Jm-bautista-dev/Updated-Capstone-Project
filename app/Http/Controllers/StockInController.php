<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;

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
     * Atomic transaction via InventoryService.
     */
    public function massStore(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
            'items'     => 'required|array|min:1',
            'items.*.id'              => 'required|integer',
            'items.*.type'            => 'required|in:ingredient,product',
            'items.*.quantity'        => 'required|numeric|gt:0|max:1000000',
            'items.*.unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'items.*.purchase_price'  => 'nullable|numeric|min:0',
            'items.*.unit_cost'       => 'nullable|numeric|min:0',
            'items.*.lot_number'      => 'nullable|string|max:100',
            'items.*.batch_code'      => 'nullable|string|max:64',
            'items.*.expiration_date' => 'nullable|date',
            'items.*.expiration_type' => 'nullable|string|in:use_by,best_before,none',
            'items.*.supplier_id'     => 'nullable|exists:suppliers,id',
            'items.*.supplier_name'   => 'nullable|string|max:150',
            'items.*.notes'           => 'nullable|string|max:500',
        ]);

        $user         = Auth::user();
        $isAdmin      = $user->role === 'admin';
        $userBranchId = $user->branch_id;

        if (!$isAdmin && (int) $request->branch_id !== (int) $userBranchId) {
            return back()->withErrors([
                'branch_id' => 'You can only restock for your own branch.',
            ]);
        }

        try {
            $this->inventoryService->massStockIn(
                $request->items,
                (int) $request->branch_id,
                $user->id
            );

            return back()->with('success', 'Mass restock completed successfully with batch tracking.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'            => 'required|in:ingredient,product',
            'id'              => 'required|integer',
            'quantity'        => 'required|numeric|gt:0|max:1000000',
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id'       => 'required|exists:branches,id',
            'purchase_price'  => 'nullable|numeric|min:0',
            'lot_number'      => 'nullable|string|max:100',
            'batch_code'      => 'nullable|string|max:64',
            'expiration_date' => 'nullable|date',
            'expiration_type' => 'nullable|string|in:use_by,best_before,none',
            'supplier_id'     => 'nullable|exists:suppliers,id',
            'supplier_name'   => 'nullable|string|max:150',
            'received_at'     => 'nullable|date',
            'reference'       => 'nullable|string|max:255',
            'notes'           => 'nullable|string|max:500',
        ]);

        $user         = Auth::user();
        $isAdmin      = $user->role === 'admin';
        $userBranchId = $user->branch_id;

        // Security: Cashiers can only restock their own branch
        if (!$isAdmin && (int) $request->branch_id !== (int) $userBranchId) {
            return back()->withErrors([
                'branch_id' => 'You can only restock for your own branch.',
            ]);
        }

        // Validate expiry date requirement if ingredient demands it
        if ($validated['type'] === 'ingredient') {
            $ingredient = \App\Models\Ingredient::find($validated['id']);
            if ($ingredient && $ingredient->requires_expiration_tracking && empty($validated['expiration_date']) && ($validated['expiration_type'] ?? 'use_by') !== 'none') {
                if (!$ingredient->default_expiry_days) {
                    return back()->withErrors([
                        'expiration_date' => "Expiration date is required for '{$ingredient->name}'. Each stock-in is tracked as a separate batch so the system can prioritize ingredients with the earliest expiration dates.",
                    ]);
                }
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
                $user->id,
                $validated['reference'] ?? null,
                $batchMeta
            );

            return back()->with('success', "Stock added successfully. Batch tracked for FIFO/FEFO automatic consumption.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
