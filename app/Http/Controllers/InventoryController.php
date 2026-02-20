<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryController extends Controller
{
    // Show inventory
    public function index()
    {
        $inventory = DB::table('products')
            ->leftJoin('inventory_logs', 'products.id', '=', 'inventory_logs.product_id')
            ->select(
                'products.id',
                'products.name',
                'products.price',
                DB::raw('COALESCE(SUM(inventory_logs.change_qty), 0) as stock')
            )
            ->groupBy('products.id', 'products.name', 'products.price')
            ->get();

        return Inertia::render('Inventory/Index', [
            'inventory' => $inventory
        ]);
    }

    // Store new product
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'initial_stock' => 'nullable|integer|min:0',
        ]);

        $productId = DB::table('products')->insertGetId([
            'name' => $request->name,
            'price' => $request->price,
            'sku' => 'SKU'.rand(1000,9999),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($request->initial_stock && $request->initial_stock > 0) {
            DB::table('inventory_logs')->insert([
                'product_id' => $productId,
                'change_qty' => $request->initial_stock,
                'reason' => 'initial stock',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        return redirect()->back();
    }

    // Update product
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'nullable|integer|min:0',
        ]);

        DB::table('products')->where('id', $id)->update([
            'name' => $request->name,
            'price' => $request->price,
            'updated_at' => now(),
        ]);

        if ($request->has('stock')) {
            $currentStock = DB::table('inventory_logs')->where('product_id', $id)->sum('change_qty');
            $difference = $request->stock - $currentStock;

            if ($difference != 0) {
                DB::table('inventory_logs')->insert([
                    'product_id' => $id,
                    'change_qty' => $difference,
                    'reason' => 'manual adjustment',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        return redirect()->back();
    }

    // Delete product
    public function destroy($id)
    {
        DB::table('inventory_logs')->where('product_id', $id)->delete();
        DB::table('products')->where('id', $id)->delete();

        return redirect()->back();
    }
}
