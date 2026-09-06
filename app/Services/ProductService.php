<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\MenuItemIngredient;
use Illuminate\Support\Facades\DB;
use App\Utils\ImageHelper;
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
                ImageHelper::syncToPublicStorage($imagePath);
            }

            $product = Product::create([
                'name'          => $validated['name'],
                'sku'           => $this->generateSku($validated['sku'] ?? null),
                'category_id'   => $validated['category_id'],
                'description'   => $validated['description'] ?? null,
                'cost_price'    => 0, // Automatically calculated from recipe
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'branch_id'     => $targetBranchId ?? $validated['branch_id'],
                'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? 'pcs'),
                'stock'         => 0, // Derived dynamically from branch ingredient stock
            ]);

            // Create recipe (Optional)
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $item) {
                    $ingredient = Ingredient::find($item['ingredient_id']);
                    if ($ingredient) {
                        $inputUnit = $item['unit'] ?? $ingredient->unit;
                        $baseUnit = UnitConverter::normalizeUnit($ingredient->unit);
                        $baseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                            (float) $item['quantity_required'],
                            $inputUnit,
                            $ingredient->unit,
                            $ingredient->avg_weight_per_piece
                        );

                        MenuItemIngredient::create([
                            'menu_item_id'      => $product->id,
                            'ingredient_id'     => $item['ingredient_id'],
                            'quantity_required' => $baseQty,
                            'unit'              => $baseUnit, // Always use canonical base unit
                        ]);
                    }
                }
            }

            // Sync assigned add-ons (Optional)
            if (isset($validated['addon_ids']) && is_array($validated['addon_ids'])) {
                $product->addons()->sync($validated['addon_ids']);
            }

            $product->refresh();
            $product->update(['cost_price' => $product->computeProductCost($product->branch_id)]);

            // 🔥 BROADCAST: Instant catalog sync
            if ($product->branch_id) {
                broadcast(new ProductUpdated($product->id, $product->branch_id))->toOthers();
            } else {
                $branches = Branch::all();
                foreach ($branches as $b) {
                    broadcast(new ProductUpdated($product->id, $b->id))->toOthers();
                }
            }

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
            $removeImage = !empty($validated['remove_image']) || (array_key_exists('remove_image', $validated) && filter_var($validated['remove_image'], FILTER_VALIDATE_BOOLEAN));

            if ($removeImage) {
                if ($product->image_path) {
                    ImageHelper::deleteImageFile($product->image_path);
                }
                $imagePath = null;
            } elseif ($image) {
                if ($product->image_path) {
                    ImageHelper::deleteImageFile($product->image_path);
                }
                $imagePath = $image->store('products', 'public');
                ImageHelper::syncToPublicStorage($imagePath);
            }

            $product->update([
                'name'          => $validated['name'],
                'sku'           => $validated['sku'] ?? $product->sku,
                'category_id'   => $validated['category_id'],
                'description'   => $validated['description'] ?? null,
                'selling_price' => $validated['selling_price'],
                'image_path'    => $imagePath,
                'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? $product->unit ?? 'pcs'),
            ]);

            // Update recipe (Optional)
            MenuItemIngredient::where('menu_item_id', $product->id)->delete();
            if (!empty($validated['recipe'])) {
                foreach ($validated['recipe'] as $item) {
                    $ingredient = Ingredient::find($item['ingredient_id']);
                    if ($ingredient) {
                        $inputUnit = $item['unit'] ?? $ingredient->unit;
                        $baseUnit = UnitConverter::normalizeUnit($ingredient->unit);
                        $baseQty = UnitConverter::convertToBaseQuantityWithIngredient(
                            (float) $item['quantity_required'],
                            $inputUnit,
                            $ingredient->unit,
                            $ingredient->avg_weight_per_piece
                        );

                        MenuItemIngredient::create([
                            'menu_item_id'      => $product->id,
                            'ingredient_id'     => $item['ingredient_id'],
                            'quantity_required' => $baseQty,
                            'unit'              => $baseUnit, // Always use canonical base unit
                        ]);
                    }
                }
            }

            // Sync assigned add-ons (Optional)
            if (isset($validated['addon_ids']) && is_array($validated['addon_ids'])) {
                $product->addons()->sync($validated['addon_ids']);
            }

            $product->refresh();
            $product->update(['cost_price' => $product->computeProductCost($product->branch_id)]);

            // 🔥 BROADCAST: Instant catalog sync
            if ($product->branch_id) {
                broadcast(new ProductUpdated($product->id, $product->branch_id))->toOthers();
                broadcast(new StockUpdated($product->branch_id, Product::class, $product->id))->toOthers();
            } else {
                $branches = Branch::all();
                foreach ($branches as $b) {
                    broadcast(new ProductUpdated($product->id, $b->id))->toOthers();
                    broadcast(new StockUpdated($b->id, Product::class, $product->id))->toOthers();
                }
            }

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
