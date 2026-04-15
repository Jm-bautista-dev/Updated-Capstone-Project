<?php

namespace App\Http\Controllers;

use App\Services\InventoryService;
use Illuminate\Http\Request;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;

class WastageController extends Controller
{
    protected $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Store a new wastage record.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type'     => 'required|in:ingredient,product',
            'id'       => 'required|integer',
            'quantity' => 'required|numeric|gt:0',
            'unit'     => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'reason'   => 'required|string|in:expired,spilled,damaged,other',
            'notes'    => 'nullable|string|max:500',
        ]);

        try {
            $this->inventoryService->logWastage(
                $validated['type'],
                (int) $validated['id'],
                (float) $validated['quantity'],
                $validated['unit'],
                $validated['reason'],
                $validated['notes'] ?? ""
            );

            return back()->with('success', 'Wastage logged successfully and inventory adjusted.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
