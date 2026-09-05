<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AddOn;
use App\Models\AddonGroup;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AddonController extends Controller
{
    /**
     * Display a listing of add-ons and add-on groups.
     */
    public function index(Request $request)
    {
        $addons = AddOn::with(['branch', 'ingredient'])
            ->orderBy('name')
            ->get();

        $addonGroups = AddonGroup::with(['product', 'products', 'items.addon'])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $products = Product::whereNull('deleted_at')
            ->orderBy('name')
            ->select('id', 'name', 'selling_price', 'category_id')
            ->get();

        $branches = Branch::where('is_active', true)->get(['id', 'name']);
        $inventoryItems = Ingredient::orderBy('name')->get(['id', 'name', 'unit']);

        return Inertia::render('Admin/Addons/Index', [
            'addons' => $addons,
            'addonGroups' => $addonGroups,
            'products' => $products,
            'branches' => $branches,
            'inventoryItems' => $inventoryItems,
        ]);
    }

    /**
     * Store a newly created add-on.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'branch_id' => 'nullable|exists:branches,id',
            'stock_linked' => 'boolean',
            'ingredient_id' => 'nullable|required_if:stock_linked,true|exists:ingredients,id',
            'ingredient_quantity' => 'nullable|required_if:stock_linked,true|numeric|min:0.01',
        ]);

        AddOn::create([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'branch_id' => $validated['branch_id'] ?? null,
            'stock_linked' => $validated['stock_linked'] ?? false,
            'ingredient_id' => !empty($validated['stock_linked']) ? ($validated['ingredient_id'] ?? null) : null,
            'ingredient_quantity' => !empty($validated['stock_linked']) ? ($validated['ingredient_quantity'] ?? 0) : 0,
        ]);

        return redirect()->back()->with('success', 'Add-on created successfully');
    }

    /**
     * Update an existing add-on.
     */
    public function update(Request $request, AddOn $addon)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
            'branch_id' => 'nullable|exists:branches,id',
            'stock_linked' => 'boolean',
            'ingredient_id' => 'nullable|required_if:stock_linked,true|exists:ingredients,id',
            'ingredient_quantity' => 'nullable|required_if:stock_linked,true|numeric|min:0.01',
        ]);

        $addon->update([
            'name' => $validated['name'],
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'branch_id' => $validated['branch_id'] ?? null,
            'stock_linked' => $validated['stock_linked'] ?? false,
            'ingredient_id' => !empty($validated['stock_linked']) ? ($validated['ingredient_id'] ?? null) : null,
            'ingredient_quantity' => !empty($validated['stock_linked']) ? ($validated['ingredient_quantity'] ?? 0) : 0,
        ]);

        return redirect()->back()->with('success', 'Add-on updated successfully');
    }

    /**
     * Delete an add-on.
     */
    public function destroy(AddOn $addon)
    {
        $addon->delete();
        return redirect()->back()->with('success', 'Add-on deleted successfully');
    }

    /**
     * Store a newly created add-on group.
     */
    public function storeGroup(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:single,multi',
            'is_required' => 'boolean',
            'min_selections' => 'nullable|integer|min:0',
            'max_selections' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:add_ons,id',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        DB::transaction(function () use ($validated) {
            $group = AddonGroup::create([
                'name' => $validated['name'],
                'selection_type' => $validated['selection_type'],
                'is_required' => $validated['is_required'] ?? false,
                'min_selections' => ($validated['is_required'] ?? false) ? max(1, (int)($validated['min_selections'] ?? 1)) : ((int)($validated['min_selections'] ?? 0)),
                'max_selections' => $validated['selection_type'] === 'single' ? 1 : ($validated['max_selections'] ?? null),
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            if (!empty($validated['addon_ids'])) {
                $syncData = [];
                foreach ($validated['addon_ids'] as $index => $addonId) {
                    $syncData[$addonId] = ['sort_order' => $index, 'price_override' => null];
                }
                $group->addOns()->sync($syncData);
            }

            if (!empty($validated['product_ids'])) {
                $group->products()->sync($validated['product_ids']);
            }
        });

        return redirect()->back()->with('success', 'Add-on group created successfully');
    }

    /**
     * Update an add-on group.
     */
    public function updateGroup(Request $request, AddonGroup $group)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'selection_type' => 'required|in:single,multi',
            'is_required' => 'boolean',
            'min_selections' => 'nullable|integer|min:0',
            'max_selections' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer|min:0',
            'addon_ids' => 'nullable|array',
            'addon_ids.*' => 'exists:add_ons,id',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
        ]);

        DB::transaction(function () use ($group, $validated) {
            $group->update([
                'name' => $validated['name'],
                'selection_type' => $validated['selection_type'],
                'is_required' => $validated['is_required'] ?? false,
                'min_selections' => ($validated['is_required'] ?? false) ? max(1, (int)($validated['min_selections'] ?? 1)) : ((int)($validated['min_selections'] ?? 0)),
                'max_selections' => $validated['selection_type'] === 'single' ? 1 : ($validated['max_selections'] ?? null),
                'is_active' => $validated['is_active'] ?? true,
                'sort_order' => $validated['sort_order'] ?? 0,
            ]);

            if (isset($validated['addon_ids'])) {
                $syncData = [];
                foreach ($validated['addon_ids'] as $index => $addonId) {
                    $syncData[$addonId] = ['sort_order' => $index, 'price_override' => null];
                }
                $group->addOns()->sync($syncData);
            } else {
                $group->addOns()->detach();
            }

            if (isset($validated['product_ids'])) {
                $group->products()->sync($validated['product_ids']);
            }
        });

        return redirect()->back()->with('success', 'Add-on group updated successfully');
    }

    /**
     * Delete an add-on group.
     */
    public function destroyGroup(AddonGroup $group)
    {
        $group->addOns()->detach();
        $group->products()->detach();
        $group->delete();

        return redirect()->back()->with('success', 'Add-on group deleted successfully');
    }
}
