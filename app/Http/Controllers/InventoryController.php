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

        $targetBranchName = null;
        if ($branchId) {
            $branch = $branches->firstWhere('id', (int) $branchId);
            $targetBranchName = $branch ? $branch->name : null;
        }

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
                // Skip any stock row that has no resolvable branch (orphaned FK).
                // The cleanup migration removes these; this guard prevents any future
                // race-condition or manual DB edit from bleeding into the UI.
                if (! $stockRow->branch_id || ! $stockRow->branch) {
                    continue;
                }

                $displayUnit  = $ingredient->unit;
                $displayStock = (float) $stockRow->stock;

                // Price: prefer the branch-level cost, fall back to global cost
                $baseUnitPrice = (float) $stockRow->cost_per_unit > 0
                    ? (float) $stockRow->cost_per_unit
                    : (float) $ingredient->cost_per_base_unit;

                $displayPrice = $baseUnitPrice;

                if ($ingredient->unit === 'g') {
                    $displayUnit  = 'kg';
                    $displayStock = (float) $stockRow->stock / 1000;
                    $displayPrice = $baseUnitPrice * 1000;
                } elseif ($ingredient->unit === 'ml') {
                    $displayUnit  = 'L';
                    $displayStock = (float) $stockRow->stock / 1000;
                    $displayPrice = $baseUnitPrice * 1000;
                }

                $inventory[] = [
                    'id'                   => $ingredient->id,
                    'stock_id'             => $stockRow->id,
                    'name'                 => $ingredient->name,
                    'unit'                 => $ingredient->unit,
                    'display_unit'         => $displayUnit,
                    'branch_id'            => $stockRow->branch_id,
                    'branch_name'          => $stockRow->branch->name,
                    'stock'                => (float) $stockRow->stock,
                    'display_stock'        => $displayStock,
                    'low_stock_level'      => (float) $stockRow->low_stock_level,
                    'is_low_stock'         => $stockRow->isLowStock(),
                    'is_out_of_stock'      => $stockRow->isOutOfStock(),
                    'status'               => 'active',
                    'avg_weight_per_piece' => $ingredient->avg_weight_per_piece,
                    'cost_per_unit'        => (float) $stockRow->cost_per_unit,
                    'display_price'        => $displayPrice,
                ];
            }

            // Fallback: If no stock rows were added (neither via branch filter nor global list),
            // ensure the ingredient is still visible.
            if (collect($inventory)->where('id', $ingredient->id)->isEmpty()) {
                $targetBranches = $branchId 
                    ? Branch::where('id', $branchId)->get() 
                    : Branch::all();

                foreach ($targetBranches as $branch) {
                    $inventory[] = [
                        'id'                   => $ingredient->id,
                        'stock_id'             => null,
                        'name'                 => $ingredient->name,
                        'unit'                 => $ingredient->unit,
                        'display_unit'         => $ingredient->unit === 'g' ? 'kg' : ($ingredient->unit === 'ml' ? 'L' : $ingredient->unit),
                        'branch_id'            => (int) $branch->id,
                        'branch_name'          => $branch->name,
                        'stock'                => 0,
                        'display_stock'        => 0,
                        'low_stock_level'      => 5,
                        'is_low_stock'         => false,
                        'is_out_of_stock'      => true,
                        'status'               => 'active',
                        'avg_weight_per_piece' => $ingredient->avg_weight_per_piece,
                        'cost_per_unit'        => 0,
                        'display_price'        => 0,
                    ];

                    // Auto-create missing stock row in DB to prevent future orphans
                    IngredientStock::firstOrCreate(
                        ['ingredient_id' => $ingredient->id, 'branch_id' => (int) $branch->id],
                        ['stock' => 0, 'low_stock_level' => 5, 'cost_per_unit' => 0]
                    );
                }
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
                'max:50',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'unit'            => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'initial_stock'   => 'required|numeric|gt:0|max:10000',
            'low_stock_level'      => 'required|numeric|gt:0|max:10000',
            'avg_weight_per_piece' => 'nullable|numeric|gt:0|max:10000',
            'cost_per_base_unit'   => 'required|numeric|min:0|max:999999',
            'cost_per_unit'        => 'nullable|numeric|min:0|max:999999',
            'branch_id'            => 'nullable|exists:branches,id',
            'branch_ids'           => 'nullable|array',
            'branch_ids.*'         => 'exists:branches,id',
        ], [
            'name.regex' => 'The ingredient name must only contain letters and spaces.',
        ]);

        $normalizedUnit = UnitConverter::normalizeUnit($validated['unit']);
        $conversionFactor = UnitConverter::convertToBaseQuantity(1, $validated['unit']);
        
        $baseStock      = (float) ($validated['initial_stock'] ?? 0) * $conversionFactor;
        $lowStockLevel  = (float) ($validated['low_stock_level'] ?? 5);

        // Normalize costs to base unit (Total batch cost / Total base units)
        // Rule: 10kg onion for 500 pesos => 500 / 10,000g = 0.05 per gram
        $normalizedGlobalCost = $baseStock > 0 
            ? (float) ($validated['cost_per_base_unit'] ?? 0) / $baseStock
            : 0;
            
        $normalizedBranchCost = $baseStock > 0
            ? (float) ($validated['cost_per_unit'] ?? 0) / $baseStock
            : 0;

        // Create ONE global ingredient (deduplicated by name)
        $ingredient = Ingredient::firstOrCreate(
            ['name' => $validated['name']],
            [
                'unit' => $normalizedUnit,
                'avg_weight_per_piece' => $validated['avg_weight_per_piece'] ?? null,
                'cost_per_base_unit' => $normalizedGlobalCost
            ]
        );

        // Update properties if they already existed
        $ingredient->update([
            'unit' => $normalizedUnit,
            'avg_weight_per_piece' => $validated['avg_weight_per_piece'] ?? $ingredient->avg_weight_per_piece,
            'cost_per_base_unit' => $normalizedGlobalCost
        ]);

        // Determine which branches to create stock rows for
        $targetBranchIds = $this->resolveTargetBranches($user, $validated);

        foreach ($targetBranchIds as $branchId) {
            IngredientStock::updateOrCreate(
                ['ingredient_id' => $ingredient->id, 'branch_id' => $branchId],
                [
                    'stock'           => $baseStock,
                    'low_stock_level' => $lowStockLevel,
                    'cost_per_unit'   => $normalizedBranchCost,
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

        // Gap-fill: ensure every branch has at least a zero-stock row so the
        // ingredient never shows as UNASSIGNED in the admin "All Branches" view.
        // This covers the case where the admin chose to stock only a specific branch.
        $allBranchIds = Branch::pluck('id')->toArray();
        $missingBranchIds = array_diff($allBranchIds, array_map('intval', $targetBranchIds));

        foreach ($missingBranchIds as $missingBranchId) {
            IngredientStock::firstOrCreate(
                ['ingredient_id' => $ingredient->id, 'branch_id' => $missingBranchId],
                ['stock' => 0, 'low_stock_level' => $lowStockLevel, 'cost_per_unit' => 0]
            );
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
                'max:50',
                'regex:/^[A-Za-z\s]+$/'
            ],
            'unit'                 => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'branch_id'            => 'nullable|exists:branches,id',
            'stock'                => 'nullable|numeric|min:0|max:10000',
            'low_stock_level'      => 'nullable|numeric|min:0|max:10000',
            'avg_weight_per_piece' => 'nullable|numeric|gt:0|max:10000',
            'cost_per_base_unit'   => 'nullable|numeric|min:0|max:999999',
            'cost_per_unit'        => 'nullable|numeric|min:0|max:999999',
        ], [
            'name.regex' => 'The ingredient name must only contain letters and spaces.',
        ]);

        $normalizedUnit = UnitConverter::normalizeUnit($validated['unit']);
        $conversionFactor = UnitConverter::convertToBaseQuantity(1, $validated['unit']);

        // Normalize updated global cost
        $normalizedGlobalCost = $conversionFactor > 0 
            ? (float) ($validated['cost_per_base_unit'] ?? $ingredient->cost_per_base_unit) / $conversionFactor
            : (float) ($validated['cost_per_base_unit'] ?? $ingredient->cost_per_base_unit);

        $ingredient->update([
            'name' => $validated['name'],
            'unit' => $normalizedUnit,
            'avg_weight_per_piece' => $validated['avg_weight_per_piece'] ?? $ingredient->avg_weight_per_piece,
            'cost_per_base_unit' => $normalizedGlobalCost,
        ]);

        // If branch_id and stock provided, update that branch's stock row
        if (!empty($validated['branch_id']) && isset($validated['stock'])) {
            $baseStock = (float) $validated['stock'] * $conversionFactor;
            
            // Normalize updated cost (Total value / Total base units)
            $normalizedBranchCost = $baseStock > 0
                ? (float) ($validated['cost_per_unit'] ?? 0) / $baseStock
                : 0;

            $stockRow = IngredientStock::firstOrCreate(
                ['ingredient_id' => $ingredient->id, 'branch_id' => $validated['branch_id']],
                ['stock' => 0, 'low_stock_level' => $validated['low_stock_level'] ?? 5, 'cost_per_unit' => $normalizedBranchCost]
            );

            $oldStock = (float) $stockRow->stock;
            $stockRow->update([
                'stock'           => $baseStock,
                'low_stock_level' => $validated['low_stock_level'] ?? $stockRow->low_stock_level,
                'cost_per_unit'   => $normalizedBranchCost,
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
    public function destroy(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('delete', $ingredient);

        $branchId = $request->query('branch_id') ?: $request->input('branch_id');

        if ($branchId) {
            // Only remove from this specific branch's inventory
            $ingredient->stocks()->where('branch_id', $branchId)->delete();
            
            // Log the removal
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'user_id'       => Auth::id(),
                'branch_id'     => $branchId,
                'change_qty'    => 0,
                'reason'        => 'Removed from branch inventory',
            ]);

            return redirect()->back()->with('success', 'Ingredient removed from this branch.');
        }

        // Global delete (Admin only or if no branch context provided)
        $ingredient->delete(); // cascade deletes all stock rows

        return redirect()->back()->with('success', 'Ingredient deleted globally.');
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
