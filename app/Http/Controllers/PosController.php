<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use App\Models\PosOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PosController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'ingredients'])->get()->map(function($product) {
            $product->stock = $product->computed_stock;
            $product->image_url = $product->image_path
                ? Storage::disk('public')->url($product->image_path)
                : null;
            return $product;
        });

        $categories = Category::orderBy('name')->get()->map(function($category) {
            $category->image_url = $category->image_path
                ? Storage::disk('public')->url($category->image_path)
                : null;
            return $category;
        });

        $recentOrders = PosOrder::latest()->limit(10)->get();

        return Inertia::render('Pos/Index', [
            'products'     => $products,
            'categories'   => $categories,
            'recentOrders' => $recentOrders,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string',
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:1',
            'total' => 'required|numeric',
            'payment_method' => 'required|string',
            'paid_amount' => 'required|numeric',
        ]);

        return DB::transaction(function() use ($validated) {
            // 1. Validate all ingredients requirement across all items
            $ingredientRequirements = [];
            foreach ($validated['items'] as $item) {
                $product = Product::with('ingredients')->findOrFail($item['id']);
                foreach ($product->ingredients as $ingredient) {
                    $id = $ingredient->id;
                    $needed = (float) $ingredient->pivot->quantity_required * (float) $item['quantity'];
                    $ingredientRequirements[$id] = ($ingredientRequirements[$id] ?? 0) + $needed;
                }
            }

            // 2. Check availability
            foreach ($ingredientRequirements as $id => $totalNeeded) {
                $ingredient = Ingredient::findOrFail($id);
                if ($ingredient->stock < $totalNeeded) {
                    return back()->withErrors(['error' => "Insufficient stock for {$ingredient->name}. Needed {$totalNeeded}, available {$ingredient->stock}"]);
                }
            }

            // 3. Deduct stock and log
            foreach ($ingredientRequirements as $id => $totalNeeded) {
                $ingredient = Ingredient::findOrFail($id);
                $ingredient->decrement('stock', $totalNeeded);

                IngredientLog::create([
                    'ingredient_id' => $id,
                    'change_qty' => -$totalNeeded,
                    'reason' => "Sale: " . ($validated['order_number'] ?? 'POS Order'),
                ]);
            }

            // 4. Create Order record
            $order = PosOrder::create([
                'order_number' => 'POS-' . strtoupper(uniqid()),
                'type' => $validated['type'],
                'items' => $validated['items'],
                'total' => $validated['total'],
                'status' => 'completed',
                'payment_method' => $validated['payment_method'],
                'paid_amount' => $validated['paid_amount'],
            ]);

            return redirect()->back()->with('success', 'Order processed successfully');
        });
    }
}
