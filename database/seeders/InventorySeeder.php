<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        $branches = DB::table('branches')->pluck('id')->toArray();
        if (empty($branches)) {
            $branches = [1, 2]; // fallback to defaults
        }

        // 1. Seed global Ingredients
        $rawIngredients = [
            'Japanese Rice' => 'kg',
            'Nori (Seaweed)' => 'pcs',
            'Fresh Salmon' => 'kg',
            'Fresh Tuna' => 'kg',
            'Ebi (Shrimp)' => 'pcs',
            'Pork Chashu' => 'kg',
            'Ramen Noodles' => 'kg',
            'Miso Paste' => 'kg',
            'Tonkotsu Broth' => 'liters',
            'Pork Cutlet' => 'pcs',
            'Thin Sliced Beef' => 'kg',
            'Eggs' => 'pcs',
            'Edamame Beans' => 'kg',
            'Gyoza Wrapper' => 'pcs',
            'Matcha Powder' => 'g'
        ];

        $ingredientIds = [];
        foreach ($rawIngredients as $name => $unit) {
            DB::table('ingredients')->updateOrInsert(
                ['name' => $name],
                ['unit' => $unit, 'created_at' => now(), 'updated_at' => now()]
            );
            $ingredientIds[$name] = DB::table('ingredients')->where('name', $name)->first()->id;
        }

        // 2. Seed Ingredient Stocks for each branch
        foreach ($ingredientIds as $name => $ingId) {
            $unit = $rawIngredients[$name];
            $baseStock = \App\Utils\UnitConverter::convertToBaseQuantity(rand(50, 200), $unit);
            $lowStock = \App\Utils\UnitConverter::convertToBaseQuantity(10, $unit);

            foreach ($branches as $bId) {
                DB::table('ingredient_stocks')->updateOrInsert(
                    ['ingredient_id' => $ingId, 'branch_id' => $bId],
                    [
                        'stock' => $baseStock,
                        'low_stock_level' => $lowStock,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            }
        }

        // 3. Map Products to Recipes (menu_item_ingredients)
        $products = DB::table('products')->get();
        $recipes = [
            'California Maki' => ['Japanese Rice' => 0.2, 'Nori (Seaweed)' => 1],
            'Spicy Tuna Maki' => ['Japanese Rice' => 0.2, 'Nori (Seaweed)' => 1, 'Fresh Tuna' => 0.1],
            'Dragon Roll' => ['Japanese Rice' => 0.2, 'Nori (Seaweed)' => 1, 'Ebi (Shrimp)' => 2],
            'Salmon Sashimi' => ['Fresh Salmon' => 0.15],
            'Tuna Nigiri' => ['Japanese Rice' => 0.05, 'Fresh Tuna' => 0.05],
            'Ebi Nigiri' => ['Japanese Rice' => 0.05, 'Ebi (Shrimp)' => 2],
            'Tonkotsu Ramen' => ['Ramen Noodles' => 0.15, 'Pork Chashu' => 0.05, 'Tonkotsu Broth' => 0.3],
            'Miso Ramen' => ['Ramen Noodles' => 0.15, 'Miso Paste' => 0.05, 'Tonkotsu Broth' => 0.3],
            'Yaki Udon' => ['Ramen Noodles' => 0.2, 'Pork Chashu' => 0.05],
            'Katsudon' => ['Japanese Rice' => 0.2, 'Pork Cutlet' => 1, 'Eggs' => 1],
            'Gyudon' => ['Japanese Rice' => 0.2, 'Thin Sliced Beef' => 0.15],
            'Oyakodon' => ['Japanese Rice' => 0.2, 'Eggs' => 2],
            'Edamame' => ['Edamame Beans' => 0.1],
            'Pork Gyoza' => ['Pork Chashu' => 0.05, 'Gyoza Wrapper' => 5],
            'Matcha Iced Tea' => ['Matcha Powder' => 5],
        ];

        foreach ($products as $product) {
            if (isset($recipes[$product->name])) {
                foreach ($recipes[$product->name] as $ingName => $qty) {
                    if (isset($ingredientIds[$ingName])) {
                        $rawUnit = $rawIngredients[$ingName];
                        $baseQty = \App\Utils\UnitConverter::convertToBaseQuantity($qty, $rawUnit);
                        $baseUnit = \App\Utils\UnitConverter::normalizeUnit($rawUnit);

                        DB::table('menu_item_ingredients')->updateOrInsert(
                            [
                                'menu_item_id' => $product->id,
                                'ingredient_id' => $ingredientIds[$ingName]
                            ],
                            [
                                'quantity_required' => $baseQty,
                                'unit' => $baseUnit,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]
                        );
                    }
                }
            }
        }
    }
}
