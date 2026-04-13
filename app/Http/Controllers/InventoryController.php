<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Utils\UnitConverter;
use Illuminate\Validation\Rule;


class InventoryController extends Controller
{
    use AuthorizesRequests;

    // Show inventory
    public function index(Request $request)
    {
        $user      = Auth::user();
        $branches  = Branch::orderBy('name')->get();

        // Determine branch filter
        if ($user->isAdmin()) {
            $branchId = $request->input('branch_id'); // null = all branches
        } else {
            $branchId = $user->branch_id; // Cashier: locked to their branch
        }

        $query = Ingredient::with('branch')->orderBy('name');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        $inventory = $query->get()->map(function (Ingredient $ingredient) {
            return [
                'id'              => $ingredient->id,
                'name'            => $ingredient->name,
                'stock'           => (float) $ingredient->stock,
                'unit'            => $ingredient->unit,
                'branch_id'       => $ingredient->branch_id,
                'branch_name'     => $ingredient->branch ? $ingredient->branch->name : null,
                'low_stock_level' => (float) $ingredient->low_stock_level,
                'is_low_stock'    => $ingredient->isLowStock(),
            ];
        });

        return Inertia::render('Inventory/Index', [
            'inventory'       => $inventory,
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
        ]);
    }

    // Store new ingredient
    public function store(Request $request)
    {
        $user = Auth::user();
        $this->authorize('create', Ingredient::class);

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'initial_stock'   => 'nullable|numeric|min:0',
            'low_stock_level' => 'nullable|numeric|min:0',
            'branch_id'       => 'nullable|exists:branches,id',
            'branch_ids'      => 'nullable|array',
            'branch_ids.*'    => 'exists:branches,id',
        ]);

        // Normalize unit and initial stock BEFORE creation
        $rawUnit = $validated['unit'];
        $rawStock = (float) ($validated['initial_stock'] ?? 0);
        $normalizedUnit = UnitConverter::normalizeUnit($rawUnit);
        $baseStock = UnitConverter::convertToBaseQuantity($rawStock, $rawUnit);

        // Determine target branches
        $targetBranchIds = [];
        if ($user->isAdmin()) {
            if (!empty($validated['branch_ids'])) {
                $targetBranchIds = $validated['branch_ids'];
            } elseif (!empty($validated['branch_id'])) {
                $targetBranchIds = [$validated['branch_id']];
            } else {
                // Default to ALL branches as requested
                $targetBranchIds = Branch::pluck('id')->toArray();
            }
        } else {
            $targetBranchIds = [$user->branch_id];
        }

        foreach ($targetBranchIds as $branchId) {
            $ingredient = Ingredient::create([
                'name'            => $validated['name'],
                'unit'            => $normalizedUnit,
                'stock'           => $baseStock,
                'low_stock_level' => $validated['low_stock_level'] ?? 5,
                'branch_id'       => $branchId,
            ]);

            if ($ingredient->stock > 0) {
                IngredientLog::create([
                    'ingredient_id' => $ingredient->id,
                    'user_id'       => Auth::id(),
                    'change_qty'    => $ingredient->stock,
                    'reason'        => 'initial stock',
                ]);
            }

            $ingredient->checkStockAlerts();
        }

        return redirect()->back();
    }

    // Update ingredient
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('update', $ingredient);

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'stock'           => 'nullable|numeric|min:0',
            'low_stock_level' => 'nullable|numeric|min:0',
        ]);

        // Normalize inputs
        $rawUnit = $validated['unit'];
        $rawStock = (float) ($validated['stock'] ?? $ingredient->stock);
        $normalizedUnit = UnitConverter::normalizeUnit($rawUnit);
        
        // If the user changed the unit while updating stock, we need to be careful.
        // But the requirement says "Only add base unit conversion logic for inventory inputs."
        // We will normalize the incoming quantity based on the incoming unit.
        $baseStock = UnitConverter::convertToBaseQuantity($rawStock, $rawUnit);

        $oldStock = (float) $ingredient->stock;
        $newStock = (float) ($validated['stock'] ?? $oldStock);

        $ingredient->update([
            'name'            => $validated['name'],
            'unit'            => $normalizedUnit,
            'stock'           => $baseStock,
            'low_stock_level' => $validated['low_stock_level'] ?? $ingredient->low_stock_level,
        ]);

        if ($newStock != $oldStock) {
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'user_id'       => Auth::id(),
                'change_qty'    => $newStock - $oldStock,
                'reason'        => 'manual adjustment',
            ]);
        }

        $ingredient->checkStockAlerts();

        return redirect()->back();
    }

    // Delete ingredient
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('delete', $ingredient);
        
        $ingredient->delete();

        return redirect()->back();
    }
}
