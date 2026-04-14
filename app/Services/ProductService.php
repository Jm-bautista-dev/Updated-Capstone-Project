<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Branch;
use App\Models\MenuItemIngredient;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Utils\UnitConverter;
use App\Events\ProductUpdated;
use App\Events\StockUpdated;

class ProductService
{
    /**
     * Store a new product.
     */
    public function store(array $validated, $image = null, ?int $targetBranchId = null): Product
    {
        return DB::transaction(function () use ($validated, $image, $targetBranchId) {
            $imagePath = null;
            if ($image) {
                $imagePath = $image->store('products', 'public');
            }

            $product = Product::create([
                'name'          => $validated['name'],
                'sku'           => $this->generateSku($validated['sku'] ?? null),
                'category_id'   => $validated['category_id'],
                'description'   => $validated['description'] ?? null,
                'cost_price'    => $validated['cost_price'],
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'branch_id'     => $targetBranchId ?? $validated['branch_id'],
                'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? 'pcs'),
                'stock'         => 0,
            ]);

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

            // 🔥 BROADCAST: Instant catalog sync
            broadcast(new ProductUpdated($product->id, $product->branch_id))->toOthers();

            return $product->load('branch', 'unit_model');
        });
    }

    /**
     * Update an existing product.
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
                'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? $product->unit ?? 'pcs'),
            ]);

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

            // 🔥 BROADCAST: Instant catalog sync
            broadcast(new ProductUpdated($product->id, $product->branch_id))->toOthers();
            broadcast(new StockUpdated($product->branch_id, Product::class, $product->id))->toOthers();

            return $product->load('branch', 'unit_model', 'ingredients');
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
}
