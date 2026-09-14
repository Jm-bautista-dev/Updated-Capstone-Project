<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Services\CompositeIngredientService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CompositeIngredientController extends Controller
{
    use AuthorizesRequests;

    protected CompositeIngredientService $compositeService;

    public function __construct(CompositeIngredientService $compositeService)
    {
        $this->compositeService = $compositeService;
    }

    /**
     * Get the sub-recipe configuration for a composite ingredient (Admin only).
     */
    public function getSubrecipe(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('manageSubrecipe', $ingredient);

        $ingredient->load(['subrecipeItems.componentIngredient.stocks']);

        $items = $ingredient->subrecipeItems->map(function ($item) use ($request) {
            $component = $item->componentIngredient;
            $branchId = $request->query('branch_id');

            $componentCost = (float) $component->cost_per_base_unit;
            if ($branchId) {
                $stockRow = $component->stocks->firstWhere('branch_id', (int) $branchId);
                if ($stockRow && (float) $stockRow->cost_per_unit > 0) {
                    $componentCost = (float) $stockRow->cost_per_unit;
                }
            }

            $baseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                (float) $item->quantity,
                $item->unit,
                $component->unit,
                $component->avg_weight_per_piece
            );

            return [
                'id'                      => $item->id,
                'component_ingredient_id' => $item->component_ingredient_id,
                'component_name'          => $component->name,
                'component_unit'          => $component->unit,
                'quantity'                => (float) $item->quantity,
                'unit'                    => $item->unit,
                'base_quantity'           => $baseQty,
                'unit_cost'               => $componentCost,
                'subtotal_cost'           => round($baseQty * $componentCost, 4),
            ];
        });

        $calculatedCost = $this->compositeService->calculateUnitCost($ingredient, $request->query('branch_id') ? (int) $request->query('branch_id') : null);

        return response()->json([
            'ingredient_id'   => $ingredient->id,
            'name'            => $ingredient->name,
            'unit'            => $ingredient->unit,
            'is_composite'    => (bool) $ingredient->is_composite,
            'calculated_cost' => $calculatedCost,
            'items'           => $items,
        ]);
    }

    /**
     * Save/update sub-recipe micro-ingredients for a composite ingredient (Admin only).
     */
    public function saveSubrecipe(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('manageSubrecipe', $ingredient);

        $validated = $request->validate([
            'items'                           => 'required|array|min:1',
            'items.*.component_ingredient_id' => 'required|integer|exists:ingredients,id',
            'items.*.quantity'                => 'required|numeric|gt:0',
            'items.*.unit'                    => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
        ]);

        try {
            $updated = $this->compositeService->saveSubrecipe($ingredient, $validated['items']);

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sub-recipe configured successfully.',
                    'data'    => $updated,
                ]);
            }

            return back()->with('success', "Sub-recipe for {$ingredient->name} updated successfully.");
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['error' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Prepare a batch of a composite ingredient in a specific branch (Admin only).
     */
    public function prepareBatch(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('manageSubrecipe', $ingredient);

        $validated = $request->validate([
            'batch_quantity' => 'required|numeric|gt:0',
            'branch_id'      => 'required|integer|exists:branches,id',
        ]);

        try {
            $result = $this->compositeService->prepareBatch(
                (int) $id,
                (float) $validated['batch_quantity'],
                (int) $validated['branch_id'],
                Auth::id()
            );

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => "Successfully prepared {$validated['batch_quantity']} {$ingredient->unit} of {$ingredient->name}.",
                    'data'    => $result,
                ]);
            }

            return back()->with('success', "Successfully prepared {$validated['batch_quantity']} {$ingredient->unit} of {$ingredient->name}. Raw ingredients deducted.");
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['error' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Manually reduce stock with strict reason tracking (Cashier + Admin).
     */
    public function reduceStock(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $this->authorize('reduceStock', $ingredient);

        $validated = $request->validate([
            'quantity'  => 'required|numeric|gt:0',
            'unit'      => ['required', 'string', Rule::in(UnitConverter::getAllowedUnits())],
            'reason'    => 'required|string|in:damaged,expired,waste,spoiled,manual_adjustment,other',
            'notes'     => 'nullable|string|max:500',
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        $user = Auth::user();
        $targetBranchId = $user->isAdmin()
            ? ((int) ($validated['branch_id'] ?? $user->branch_id ?? 1))
            : (int) $user->branch_id;

        try {
            $result = $this->compositeService->reduceStock(
                (int) $id,
                (float) $validated['quantity'],
                $validated['unit'],
                $validated['reason'],
                $validated['notes'] ?? '',
                $targetBranchId,
                $user->id
            );

            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => "Stock reduced by {$validated['quantity']} {$validated['unit']}.",
                    'data'    => $result,
                ]);
            }

            return back()->with('success', "Stock reduced successfully by {$validated['quantity']} {$validated['unit']}.");
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json(['error' => $e->getMessage()], 422);
            }
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
