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
            'items.*.id'       => 'required|integer',
            'items.*.type'     => 'required|in:ingredient,product',
            'items.*.quantity' => 'required|numeric|gt:0|max:10000',
            'items.*.unit'     => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
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
                (int) $request->branch_id
            );

            return back()->with('success', 'Mass restock completed successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'type'           => 'required|in:ingredient,product',
            'id'             => 'required|integer',
            'quantity'       => 'required|numeric|gt:0|max:10000',
            'unit'           => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id'      => 'required|exists:branches,id',
            'purchase_price' => 'nullable|numeric|min:0',
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

        try {
            $this->inventoryService->stockIn(
                $request->type,
                (int) $request->id,
                (float) $request->quantity,
                $request->unit,
                (int) $request->branch_id,
                (float) ($request->purchase_price ?? 0)
            );

            return back()->with('success', 'Stock added successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
