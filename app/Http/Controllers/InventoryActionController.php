<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventorySale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class InventoryActionController extends Controller
{
    /**
     * Show inventory dashboard.
     */
    public function index()
    {
        $items = InventoryItem::orderBy('name')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'type' => $item->type,
                'quantity' => (float) $item->quantity, // primary unit (kg/L)
                'unit' => $item->unit,
                'pos_quantity' => $item->available_pos_units, // auxiliary unit (g/ml)
                'pos_unit' => $item->pos_unit_label,
            ];
        });

        return Inertia::render('Inventory/ItemDashboard', [
            'inventory' => $items
        ]);
    }

    /**
     * Show the dedicated weight-based POS page.
     */
    public function pos()
    {
        $items = InventoryItem::orderBy('name')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'name' => $item->name,
                'type' => $item->type,
                'quantity' => (float) $item->quantity,
                'unit' => $item->unit,
                'pos_quantity' => $item->available_pos_units,
                'pos_unit' => $item->pos_unit_label,
            ];
        });

        return Inertia::render('Pos/WeightPos', [
            'inventory' => $items
        ]);
    }

    /**
     * Store new inventory item or add stock.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:solid,liquid',
            'quantity' => 'required|numeric|min:0',
        ]);

        $unit = $validated['type'] === 'solid' ? 'kg' : 'L';

        $item = InventoryItem::updateOrCreate(
            ['name' => $validated['name'], 'type' => $validated['type']],
            ['unit' => $unit]
        );

        $item->increment('quantity', $validated['quantity']);

        return redirect()->back()->with('success', 'Stock updated successfully');
    }

    /**
     * Process a sale deduction (Weight/Volume based).
     */
    public function processSale(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity_sold' => 'required|numeric|min:0.01',
            'sale_price' => 'nullable|numeric|min:0',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                $item = InventoryItem::findOrFail($validated['item_id']);
                
                // Deduct stock (automatically handles conversion from POS units)
                $item->deductStock($validated['quantity_sold']);

                // Create sale record
                InventorySale::create([
                    'item_id' => $item->id,
                    'quantity_sold' => $validated['quantity_sold'],
                    'unit_sold' => $item->pos_unit_label,
                    'sale_price' => $validated['sale_price'],
                ]);
            });

            return redirect()->back()->with('success', 'Sale processed and stock deducted');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['quantity_sold' => $e->getMessage()]);
        }
    }

    /**
     * Get sales history.
     */
    public function history()
    {
        $history = InventorySale::with('item')
            ->latest()
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'item_name' => $sale->item->name,
                    'quantity_sold' => (float) $sale->quantity_sold,
                    'unit_sold' => $sale->unit_sold,
                    'sale_price' => $sale->sale_price,
                    'created_at' => $sale->created_at->format('M d, Y h:i A'),
                ];
            });

        return Inertia::render('Reports/InventorySalesHistory', [
            'history' => $history
        ]);
    }
}
