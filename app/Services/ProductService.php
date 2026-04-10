<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Branch;
use App\Models\MenuItemIngredient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Utils\UnitConverter;

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

            // Professional Fix: Automatic branch assignment and transactional stock
            $product = Product::create([
                'name'          => $validated['name'],
                'sku'           => $this->generateSku($validated['sku'] ?? null),
                'category_id'   => $validated['category_id'],
                'description'   => $validated['description'] ?? null,
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'branch_id'     => $creatorBranchId ?? $validated['branch_id'] ?? 1,
                'unit_id'       => $validated['unit_id'] ?? null,
                'stock'         => 0, // Initial stock is always 0; managed via movements
            ]);

            // Sync branches
            $this->syncBranches($product, $validated['branch_ids'] ?? []);

            // Create recipe (Optional)
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $item) {
                    MenuItemIngredient::create([
                        'menu_item_id'      => $product->id,
                        'ingredient_id'     => $item['ingredient_id'],
                        'quantity_required' => $item['quantity_required'],
                    ]);
                }
            }

            return $product->load('branches', 'unit_model');
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
                'sku'           => $validated['sku'] ?? $product->sku,
                'category_id'   => $validated['category_id'],
                'description'   => $validated['description'] ?? null,
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'unit_id'       => $validated['unit_id'] ?? $product->unit_id,
            ]);

            // Sync branches
            $this->syncBranches($product, $validated['branch_ids'] ?? []);

            // Update recipe (Optional)
            MenuItemIngredient::where('menu_item_id', $product->id)->delete();
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $item) {
                    MenuItemIngredient::create([
                        'menu_item_id'      => $product->id,
                        'ingredient_id'     => $item['ingredient_id'],
                        'quantity_required' => $item['quantity_required'],
                    ]);
                }
            }

            return $product->load('branches', 'unit_model');
        });
    }

    /**
     * Generate a professional SKU if none provided.
     */
    protected function generateSku(?string $sku): string
    {
        if ($sku) return strtoupper($sku);
        return 'PRD-' . strtoupper(uniqid());
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
