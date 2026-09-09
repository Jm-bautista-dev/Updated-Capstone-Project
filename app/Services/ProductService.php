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
     * Store a new product or assign an existing global product to branches.
     */
    public function store(array $validated, $image = null, $targetBranches = null): Product
    {
        return DB::transaction(function () use ($validated, $image, $targetBranches) {
            // Resolve branch IDs
            $branchIds = [];
            if ($targetBranches instanceof \Illuminate\Support\Collection) {
                $branchIds = $targetBranches->pluck('id')->all();
            } elseif (is_array($targetBranches)) {
                $branchIds = array_map(fn($b) => is_object($b) ? $b->id : (int) $b, $targetBranches);
            } elseif (!empty($validated['branch_ids']) && is_array($validated['branch_ids'])) {
                $branchIds = array_map('intval', $validated['branch_ids']);
            } elseif (!empty($validated['branch_id'])) {
                $branchIds = [(int) $validated['branch_id']];
            } else {
                $branchIds = Branch::pluck('id')->all();
            }

            // Step 1: Check if product already exists globally (by SKU or Name + Category)
            $existingProduct = null;
            if (!empty($validated['sku'])) {
                $existingProduct = Product::where('sku', strtoupper(trim($validated['sku'])))->first();
            }

            if (!$existingProduct) {
                $existingProduct = Product::whereRaw('LOWER(name) = ?', [strtolower(trim($validated['name']))])
                    ->where('category_id', $validated['category_id'])
                    ->first();
            }

            if ($existingProduct) {
                // Product already exists: maintain as global, do not duplicate
                $product = $existingProduct;
                $product->update(['branch_id' => null]);

                // Sync branch inventory for newly selected branches
                foreach ($branchIds as $bId) {
                    $pivot = DB::table('branch_product')
                        ->where('product_id', $product->id)
                        ->where('branch_id', $bId)
                        ->first();

                    $initialStock = isset($validated['stock']) ? (float) $validated['stock'] : 0.0;

                    if (!$pivot) {
                        DB::table('branch_product')->insert([
                            'branch_id'  => $bId,
                            'product_id' => $product->id,
                            'stock'      => $initialStock,
                            'price'      => $validated['selling_price'] ?? $product->selling_price,
                            'is_active'  => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::table('branch_product')->where('id', $pivot->id)->update([
                            'is_active'  => true,
                            'price'      => $validated['selling_price'] ?? $product->selling_price,
                            'updated_at' => now(),
                        ]);
                    }
                }
            } else {
                // Step 2: Create ONE new global product
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
                    'branch_id'     => null, // 👈 1 PRODUCT = 1 GLOBAL PRODUCT RECORD
                    'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? 'pcs'),
                    'stock'         => 0, // Computed dynamically from branch_product
                ]);

                // Step 3: Insert branch_product records for all selected branches
                $initialStock = isset($validated['stock']) ? (float) $validated['stock'] : 0.0;
                foreach ($branchIds as $bId) {
                    DB::table('branch_product')->updateOrInsert(
                        ['branch_id' => $bId, 'product_id' => $product->id],
                        [
                            'stock'      => $initialStock,
                            'price'      => $validated['selling_price'],
                            'is_active'  => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }

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
                                'unit'              => $baseUnit,
                            ]);
                        }
                    }
                }

                // Sync assigned add-ons (Optional)
                if (isset($validated['addon_ids']) && is_array($validated['addon_ids'])) {
                    $product->addons()->sync($validated['addon_ids']);
                }
            }

            $product->refresh();
            $product->update(['cost_price' => $product->computeProductCost()]);

            // Broadcast updates to all branches
            $allBranches = Branch::all();
            foreach ($allBranches as $b) {
                broadcast(new ProductUpdated($product->id, $b->id))->toOthers();
                broadcast(new StockUpdated($b->id, Product::class, $product->id))->toOthers();
            }

            return $product->load('branches', 'unit_model', 'ingredients');
        });
    }

    /**
     * Update an existing global product.
     */
    public function update(Product $product, array $validated, $image = null, $targetBranches = null): Product
    {
        return DB::transaction(function () use ($product, $validated, $image, $targetBranches) {
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
                'branch_id'     => null, // Maintain global product record
                'unit'          => UnitConverter::normalizeUnit($validated['unit'] ?? $product->unit ?? 'pcs'),
            ]);

            // Sync branch selection if provided
            $branchIds = null;
            if ($targetBranches instanceof \Illuminate\Support\Collection) {
                $branchIds = $targetBranches->pluck('id')->all();
            } elseif (is_array($targetBranches)) {
                $branchIds = array_map(fn($b) => is_object($b) ? $b->id : (int) $b, $targetBranches);
            } elseif (!empty($validated['branch_ids']) && is_array($validated['branch_ids'])) {
                $branchIds = array_map('intval', $validated['branch_ids']);
            }

            if ($branchIds !== null) {
                foreach ($branchIds as $bId) {
                    $pivot = DB::table('branch_product')
                        ->where('product_id', $product->id)
                        ->where('branch_id', $bId)
                        ->first();

                    if (!$pivot) {
                        DB::table('branch_product')->insert([
                            'branch_id'  => $bId,
                            'product_id' => $product->id,
                            'stock'      => 0,
                            'price'      => $product->selling_price,
                            'is_active'  => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        DB::table('branch_product')->where('id', $pivot->id)->update([
                            'is_active'  => true,
                            'price'      => $product->selling_price,
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

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
                            'unit'              => $baseUnit,
                        ]);
                    }
                }
            }

            // Sync assigned add-ons (Optional)
            if (isset($validated['addon_ids']) && is_array($validated['addon_ids'])) {
                $product->addons()->sync($validated['addon_ids']);
            }

            $product->refresh();
            $product->update(['cost_price' => $product->computeProductCost()]);

            // Broadcast updates to all branches
            $allBranches = Branch::all();
            foreach ($allBranches as $b) {
                broadcast(new ProductUpdated($product->id, $b->id))->toOthers();
                broadcast(new StockUpdated($b->id, Product::class, $product->id))->toOthers();
            }

            return $product->load('branches', 'unit_model', 'ingredients');
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
