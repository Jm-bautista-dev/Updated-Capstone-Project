<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\IngredientLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    // Show inventory
    public function index()
    {
        $inventory = Ingredient::orderBy('name')->get()->map(function($ingredient) {
            return [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'stock' => (float) $ingredient->stock,
                'unit' => $ingredient->unit,
            ];
        });

        return Inertia::render('Inventory/Index', [
            'inventory' => $inventory
        ]);
    }

    // Store new ingredient
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:20',
            'initial_stock' => 'nullable|numeric|min:0',
        ]);

        $ingredient = Ingredient::create([
            'name' => $validated['name'],
            'unit' => $validated['unit'],
            'stock' => $validated['initial_stock'] ?? 0,
        ]);

        if ($ingredient->stock > 0) {
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'change_qty' => $ingredient->stock,
                'reason' => 'initial stock',
            ]);
        }

        return redirect()->back();
    }

    // Update ingredient
    public function update(Request $request, $id)
    {
        $ingredient = Ingredient::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:20',
            'stock' => 'nullable|numeric|min:0',
        ]);

        $oldStock = (float) $ingredient->stock;
        $newStock = (float) ($validated['stock'] ?? $oldStock);

        $ingredient->update([
            'name' => $validated['name'],
            'unit' => $validated['unit'],
            'stock' => $newStock,
        ]);

        if ($newStock != $oldStock) {
            IngredientLog::create([
                'ingredient_id' => $ingredient->id,
                'change_qty' => $newStock - $oldStock,
                'reason' => 'manual adjustment',
            ]);
        }

        return redirect()->back();
    }

    // Delete ingredient
    public function destroy($id)
    {
        $ingredient = Ingredient::findOrFail($id);
        $ingredient->delete();

        return redirect()->back();
    }
}
