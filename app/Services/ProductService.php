<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Branch;
use App\Models\MenuItemIngredient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProductService
{
    /**
     * Store a new product and sync its branches.
     */
    public function store(array $validated, $image = null, ?int $creatorBranchId = null): Product
    {
        return DB::transaction(function () use ($validated, $image, $creatorBranchId) {
            $imagePath = null;
            if ($image) {
                $imagePath = $image->store('products', 'public');
            }

            $product = Product::create([
                'name'          => $validated['name'],
                'sku'           => $validated['sku'] ?? null,
                'category_id'   => $validated['category_id'],
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'branch_id'     => $validated['branch_id'] ?? $creatorBranchId,
            ]);

            // Sync branches
            $this->syncBranches($product, $validated['branch_ids'] ?? []);

            // Create recipe
            foreach ($validated['recipe'] as $item) {
                MenuItemIngredient::create([
                    'menu_item_id'      => $product->id,
                    'ingredient_id'     => $item['ingredient_id'],
                    'quantity_required' => $item['quantity_required'],
                ]);
            }

            return $product->load('branches');
        });
    }

    /**
     * Update an existing product and sync its branches.
     */
    public function update(Product $product, array $validated, $image = null): Product
    {
        return DB::transaction(function () use ($product, $validated, $image) {
            $imagePath = $product->image_path;

            if ($image) {
                if ($product->image_path) {
                    Storage::disk('public')->delete($product->image_path);
                }
                $imagePath = $image->store('products', 'public');
            }

            $product->update([
                'name'          => $validated['name'],
                'sku'           => $validated['sku'] ?? null,
                'category_id'   => $validated['category_id'],
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
            ]);

            // Sync branches
            $this->syncBranches($product, $validated['branch_ids'] ?? []);

            // Update recipe
            MenuItemIngredient::where('menu_item_id', $product->id)->delete();
            foreach ($validated['recipe'] as $item) {
                MenuItemIngredient::create([
                    'menu_item_id'      => $product->id,
                    'ingredient_id'     => $item['ingredient_id'],
                    'quantity_required' => $item['quantity_required'],
                ]);
            }

            return $product->load('branches');
        });
    }

    /**
     * Sync branches for a product.
     * If no branches provided, sync to ALL existing branches.
     */
    protected function syncBranches(Product $product, array $branchIds): void
    {
        if (empty($branchIds)) {
            // Default to ALL branches as requested
            $branchIds = Branch::pluck('id')->toArray();
        }

        $product->branches()->sync($branchIds);
    }
}
