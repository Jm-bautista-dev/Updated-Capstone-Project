<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Product;
use App\Models\User;
use App\Models\StockMovement;

class InventoryRefactorSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed standard units
        $standardUnits = [
            ['name' => 'Pieces', 'abbreviation' => 'pcs'],
            ['name' => 'Kilograms', 'abbreviation' => 'kg'],
            ['name' => 'Grams', 'abbreviation' => 'g'],
            ['name' => 'Liters', 'abbreviation' => 'L'],
            ['name' => 'Milliliters', 'abbreviation' => 'mL'],
            ['name' => 'Bottles', 'abbreviation' => 'bottle'],
            ['name' => 'Boxes', 'abbreviation' => 'box'],
            ['name' => 'Packs', 'abbreviation' => 'pack'],
        ];

        foreach ($standardUnits as $unitData) {
            Unit::firstOrCreate(['abbreviation' => $unitData['abbreviation']], $unitData);
        }

        // 2. Map existing products to units and migrate stock
        $products = Product::all();
        $adminUser = User::where('role', 'admin')->first();

        foreach ($products as $product) {
            // Find best matching unit ID
            $abbreviation = strtolower($product->unit ?? 'pcs');
            $unit = Unit::where('abbreviation', $abbreviation)->first() ?: Unit::where('abbreviation', 'pcs')->first();

            if ($unit) {
                $product->update(['unit_id' => $unit->id]);
            }

            // If product has initial stock, create a movement
            if ($product->stock > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'branch_id'  => $product->branch_id ?? 1,
                    'user_id'    => $adminUser->id ?? 1,
                    'type'       => 'IN',
                    'quantity'   => $product->stock,
                    'reference'  => 'INITIAL_MIGRATION',
                    'notes'      => 'Initial stock migrated from legacy system.'
                ]);
            }
        }
    }
}
