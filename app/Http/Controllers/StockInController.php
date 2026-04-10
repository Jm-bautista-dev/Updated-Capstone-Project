<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
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
     * Handle manual restocking for either an Ingredient or a Product.
     */
    public function store(Request $request)
    {
        $request->validate([
            'type'      => 'required|in:ingredient,product',
            'id'        => 'required|integer',
            'quantity'  => 'required|numeric|min:0.0001',
            'unit'      => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id' => 'required|exists:branches,id',
        ]);

        $isAdmin = Auth::user()->role === 'admin';
        $userBranchId = Auth::user()->branch_id;

        // Security check: Cashiers can only stock-in for their own branch
        if (!$isAdmin && $request->branch_id != $userBranchId) {
            return back()->withErrors(['branch_id' => 'You only have permission to restock for your assigned branch.']);
        }

        // Security check: Access control for types
        // Cashiers can stock-in both ingredients and products for their own branch.
        if (!$isAdmin && !in_array($request->type, ['ingredient', 'product'])) {
            return back()->withErrors(['type' => 'Invalid restock type.']);
        }

        try {
            $this->inventoryService->stockIn(
                $request->type,
                $request->id,
                (float) $request->quantity,
                $request->unit,
                (int) $request->branch_id
            );

            return back()->with('success', 'Stock added successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
