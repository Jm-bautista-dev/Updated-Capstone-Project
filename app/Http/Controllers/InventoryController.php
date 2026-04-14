<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\IngredientStock;
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

    /**
     * Show the inventory index.
     *
     * Returns global ingredients with their per-branch stock rows.
     * Admin can filter by branch; cashier is locked to their branch.
     */
    public function index(Request $request)
    {
        $user     = Auth::user();
        $branches = Branch::orderBy('name')->get();

        // Determine branch filter
        $branchId = $user->isAdmin()
            ? $request->input('branch_id') // null = all branches
            : $user->branch_id;            // cashier locked to own branch

        // Load all global ingredients with their per-branch stock
        $ingredientsQuery = Ingredient::with(['stocks.branch'])->orderBy('name');

        // Build the inventory array (each row = ingredient + branch stock)
        $inventory = [];

        foreach ($ingredientsQuery->get() as $ingredient) {
            $stocks = $ingredient->stocks;

            // If filtering by branch, only show stock for that branch
            if ($branchId) {
                $stocks = $stocks->where('branch_id', $branchId);
            }

            foreach ($stocks as $stockRow) {
                $inventory[] = [
                    'id'              => $ingredient->id,
                    'stock_id'        => $stockRow->id,
                    'name'            => $ingredient->name,
                    'unit'            => $ingredient->unit,
                    'branch_id'       => $stockRow->branch_id,
                    'branch_name'     => $stockRow->branch ? $stockRow->branch->name : null,
                    'stock'           => (float) $stockRow->stock,
                    'low_stock_level' => (float) $stockRow->low_stock_level,
                    'is_low_stock'    => $stockRow->isLowStock(),
                    'is_out_of_stock' => $stockRow->isOutOfStock(),
                ];
            }

            // If a global ingredient has NO stock row for this branch,
            // still show it so the user knows to stock-in
            if ($branchId && $stocks->isEmpty()) {
                $inventory[] = [
                    'id'              => $ingredient->id,
                    'stock_id'        => null,
                    'name'            => $ingredient->name,
                    'unit'            => $ingredient->unit,
                    'branch_id'       => (int) $branchId,
                    'branch_name'     => null,
                    'stock'           => 0,
                    'low_stock_level' => 5,
                    'is_low_stock'    => false,
                    'is_out_of_stock' => true,
                ];
            }
        }

        // Stats based on visible inventory
        $stats = [
            'total'     => collect($inventory)->pluck('id')->unique()->count(),
            'low_stock' => collect($inventory)->where('is_low_stock', true)->count(),
            'out_of_stock' => collect($inventory)->where('is_out_of_stock', true)->count(),
        ];

        return Inertia::render('Inventory/Index', [
            'inventory'       => array_values($inventory),
            'branches'        => $branches,
            'currentBranchId' => $branchId,
            'isAdmin'         => $user->isAdmin(),
            'stats'           => $stats,
        ]);
    }

    /**
     * Store a new global ingredient.
     *
     * If branch_id(s) provided → also create stock row(s) in ingredient_stocks.
     * Admin: can create for all branches. Cashier: only their own branch.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        $this->authorize('create', Ingredient::class);

        $validated = $request->validate([
            'name'            => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'initial_stock'   => 'required|numeric|gt:0|max:10000',
            'low_stock_level' => 'required|numeric|gt:0|max:10000',
            'branch_id'       => 'nullable|exists:branches,id',
            'branch_ids'      => 'nullable|array',
            'branch_ids.*'    => 'exists:branches,id',
        ], [
            'name.regex' => 'The ingredient name must only contain letters and spaces.',
        ]);

        // Normalize unit and stock
        $normalizedUnit = UnitConverter::normalizeUnit($validated['unit']);
        $baseStock      = UnitConverter::convertToBaseQuantity(
            (float) ($validated['initial_stock'] ?? 0),
            $validated['unit']
        );
        $lowStockLevel = (float) ($validated['low_stock_level'] ?? 5);

        // Create ONE global ingredient (deduplicated by name)
        $ingredient = Ingredient::firstOrCreate(
            ['name' => $validated['name']],
            ['unit' => $normalizedUnit]
        );

        // Update unit if it was just found (idempotent)
        $ingredient->update(['unit' => $normalizedUnit]);

        // Determine which branches to create stock rows for
        $targetBranchIds = $this->resolveTargetBranches($user, $validated);

        foreach ($targetBranchIds as $branchId) {
            IngredientStock::updateOrCreate(
                ['ingredient_id' => $ingredient->id, 'branch_id' => $branchId],
                [
                    'stock'           => $baseStock,
                    'low_stock_level' => $lowStockLevel,
                ]
            );

            if ($baseStock > 0) {
                IngredientLog::create([
                    'ingredient_id' => $ingredient->id,
                    'user_id'       => Auth::id(),
                    'branch_id'     => $branchId,
                    'change_qty'    => $baseStock,
                    'reason'        => 'initial stock',
                ]);
            }
        }

        return redirect()->back()->with('success', 'Ingredient added successfully.');
    }

    /**
     * Update a global ingredient's name/unit and optionally its stock level for a branch.
     */
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('update', $ingredient);

        $validated = $request->validate([
            'name'            => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id'       => 'nullable|exists:branches,id',
            'stock'           => 'nullable|numeric|gt:0|max:10000',
            'low_stock_level' => 'nullable|numeric|gt:0|max:10000',
        ], [
            'name.regex' => 'The ingredient name must only contain letters and spaces.',
        ]);

        $normalizedUnit = UnitConverter::normalizeUnit($validated['unit']);

        $ingredient->update([
            'name' => $validated['name'],
            'unit' => $normalizedUnit,
        ]);

        // If branch_id and stock provided, update that branch's stock row
        if (!empty($validated['branch_id']) && isset($validated['stock'])) {
            $baseStock = UnitConverter::convertToBaseQuantity(
                (float) $validated['stock'],
                $validated['unit']
            );

            $stockRow = IngredientStock::firstOrCreate(
                ['ingredient_id' => $ingredient->id, 'branch_id' => $validated['branch_id']],
                ['stock' => 0, 'low_stock_level' => $validated['low_stock_level'] ?? 5]
            );

            $oldStock = (float) $stockRow->stock;
            $stockRow->update([
                'stock'           => $baseStock,
                'low_stock_level' => $validated['low_stock_level'] ?? $stockRow->low_stock_level,
            ]);

            if ($baseStock != $oldStock) {
                IngredientLog::create([
                    'ingredient_id' => $ingredient->id,
                    'user_id'       => Auth::id(),
                    'branch_id'     => $validated['branch_id'],
                    'change_qty'    => $baseStock - $oldStock,
                    'reason'        => 'manual adjustment',
                ]);
            }
        }

        return redirect()->back()->with('success', 'Ingredient updated.');
    }

    /**
     * Delete a global ingredient (and all its branch stock rows via cascade).
     */
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('delete', $ingredient);

        $ingredient->delete(); // cascade deletes ingredient_stocks rows

        return redirect()->back()->with('success', 'Ingredient deleted.');
    }

    /**
     * Determine which branch IDs to create stock rows for.
     */
    protected function resolveTargetBranches($user, array $validated): array
    {
        if ($user->isAdmin()) {
            if (!empty($validated['branch_ids'])) {
                return $validated['branch_ids'];
            }
            if (!empty($validated['branch_id'])) {
                return [$validated['branch_id']];
            }
            return Branch::pluck('id')->toArray(); // Default: all branches
        }

        return [$user->branch_id];
    }
}
