<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SalesDatasetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Resolve Branch
        $branch = Branch::where('name', 'like', '%Sta Cruz%')
            ->orWhere('name', 'like', '%Santa Cruz%')
            ->first();

        if (!$branch) {
            $branch = Branch::create([
                'id'                 => 2,
                'name'               => 'Maki Desu Sta Cruz',
                'code'               => 'SC',
                'address'            => 'Sta Cruz, Laguna',
                'latitude'           => 14.2800,
                'longitude'          => 121.4150,
                'delivery_radius_km' => 10,
            ]);
        }

        // 2. Resolve Cashier / Admin User
        $user = User::where('branch_id', $branch->id)
            ->whereIn('role', ['cashier', 'admin'])
            ->first() ?? User::where('role', 'admin')->first() ?? User::first();

        $userId = $user ? $user->id : 1;

        // 3. Resolve default categories
        $categories = Category::pluck('id', 'name')->toArray();
        $defaultCatId = !empty($categories) ? reset($categories) : 1;

        // Helper to find or assign category
        $getCategoryId = function (string $productName) use (&$categories, $defaultCatId) {
            $lower = strtolower($productName);
            if (str_contains($lower, 'bento')) {
                return $categories['Bento Meal'] ?? $categories['Meals & Rolls'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'ramen') || str_contains($lower, 'tonkatsu') || str_contains($lower, 'broth') || str_contains($lower, 'tan-tan') || str_contains($lower, 'shoyu') || str_contains($lower, 'shio') || str_contains($lower, 'miso') || str_contains($lower, 'black garlic')) {
                return $categories["OTO-SAN'S Ramen"] ?? $categories['Ramen & Noodles'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'maki') || str_contains($lower, 'roll')) {
                return $categories['Chef Special Maki'] ?? $categories['Maki & Rolls'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'boat')) {
                return $categories['Sushi Boat'] ?? $categories['Party Platter'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'platter')) {
                return $categories['Party Platter'] ?? $categories['Katsu Platter'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'salad')) {
                return $categories['Salad'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'coke') || str_contains($lower, 'sprite') || str_contains($lower, 'royal') || str_contains($lower, 'water') || str_contains($lower, 'soda') || str_contains($lower, 'drink')) {
                return $categories['Drinks'] ?? $categories['Sides & Beverages'] ?? $defaultCatId;
            }
            if (str_contains($lower, 'katsu') || str_contains($lower, 'teriyaki') || str_contains($lower, 'tempura') || str_contains($lower, 'meal')) {
                return $categories['Rice Meal'] ?? $categories['Donburi'] ?? $defaultCatId;
            }
            return $defaultCatId;
        };

        // Raw CSV Rows provided
        $rawData = [
            ['Sta Cruz', 'Student Meal', 18, '₱1782', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 3, '₱837', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 2, '₱358', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (Bento)', 1, '₱329', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 1, '₱269', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱219', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Katsu Curry', 1, '₱199', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 2, '₱190', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115', 'Cash', 'September 9 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 3, '₱876', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 3, '₱780.10', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 4, '₱777', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 3, '₱726', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 4, '₱600', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Student Meal', 5, '₱495', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Black Garlic', 1, '₱279', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (8pcs)', 1, '₱239', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Crazy Maki (8pcs)', 1, '₱229', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 1, '₱199', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Katsu Curry', 1, '₱199', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 2, '₱190', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Torched Ham (4pcs)', 1, '135', 'Cash', 'September 10 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 6, '₱1096.20', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 3, '₱699.40', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Student Meal', 7, '₱693', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 4, '₱600', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Chicken Katsu', 3, '₱567', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱518', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 3, '₱360', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (Bento)', 1, '₱319', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 4, '₱600', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 1, '₱289', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 1, '₱289', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Black Garlic', 1, '₱278', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 1, '₱95', 'Cash', 'September 11 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 6, '₱1506.40', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Student Meal', 13, '₱1287', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Lava Roll (Bento)', 4, '₱1236', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 4, '₱1156', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 2, '₱678', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 2, '₱538', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 2, '₱398', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Katsu Curry', 2, '₱398', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (Bento)', 1, '₱319', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 2, '₱300', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 1, '₱289', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 3, '₱285', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Torched Ham (4pcs)', 1, '₱269', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱249', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 1, '₱229', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱219', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 1, '₱189', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 1, '₱130', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99', 'Cash', 'September 12 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 3, '₱777.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 3, '₱699.40', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 3, '₱697.20', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Lava Roll (Bento)', 2, '₱618.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 3, '₱597.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 5, '₱475.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 2, '₱458.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Shoyu', 2, '₱448.20', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Pork Katsudon', 2, '₱438.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Chicken Katsu', 2, '₱378.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Crazy Maki (8pcs)', 1, '₱229.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Pork Katsu', 1, '₱199.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Vegetable Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Torched Ham (4pcs)', 1, '₱135.00', 'Cash', 'September 13 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 5, '₱1,295.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Student Meal', 12, '₱1,188.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Black Garlic', 2, '₱558.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 2, '₱538.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 2, '₱300.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 1, '₱289.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 1, '₱289.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 2, '₱260.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱215.20', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱199.20', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 1, '₱199.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 14 2026'],
            ['Sta Cruz', 'Student Meal', 27, '₱2,673.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 4, '₱600.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 2, '₱598.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 3, '₱597.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 2, '₱538.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 4, '₱380.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 3, '₱297.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (8pcs)', 1, '₱289.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Black Garlic', 1, '₱279.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 2, '₱260.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱219.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱199.20', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Pork Katsu', 1, '₱199.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 1, '₱145.00', 'Cash', 'September 15 2026'],
            ['Sta Cruz', 'Student Meal', 17, '₱1,683.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Party Platter 1', 1, '₱749.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 2, '₱598.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Lava Roll (8pc)', 2, '₱518.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱340.20', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 3, '₱285.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Torched Ham (8pcs)', 1, '₱269.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱249.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Katsu Curry', 1, '₱199.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱197.10', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Vegetable Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 16 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 3, '₱807.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 3, '₱557.20', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 2, '₱538.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Tempura with Rice', 2, '₱478.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Pork Katsu', 2, '₱398.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 1, '₱289.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 1, '₱289.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Black Garlic', 1, '₱279.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Torched Ham (8pcs)', 1, '₱269.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱265.05', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Torched Ham (8pcs)', 1, '₱135.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 1, '₱95.00', 'Cash', 'September 17 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 6, '₱1560.2', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 4, '₱1,036.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Shoyu', 3, '₱697.20', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 2, '₱398.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Torched Ham (Bento)', 1, '₱319.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 3, '₱297.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 3, '₱285.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (8pcs)', 1, '₱269.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 1, '₱229.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Mineral Water', 9, '₱135.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Vegetable Maki (4pcs)', 1, '₱95.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Coke Soda Mismo', 2, '₱50.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Sprite Mismo', 1, '₱25.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'Royal', 1, '₱25.00', 'Cash', 'September 18 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 8, '₱2,152.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Student Meal', 14, '₱1,386.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 5, '₱926.10', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱518.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Salmon Sashimi', 1, '₱499.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Pork Katsu', 2, '₱398.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 4, '₱380.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Ham (Bento)', 1, '₱319.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Lava Roll (Bento)', 1, '₱309.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Salmon', 1, '₱299.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 3, '₱297.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Ham (4pcs)', 2, '₱270.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Ham (8pcs)', 1, '₱269.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Miso', 1, '₱249.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱151.20', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 1, '₱145.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 1, '₱130.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Coke Mismo', 4, '₱100.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Sprite Mismo', 3, '₱75.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Royal', 2, '₱50.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Mineral Water', 3, '₱45.00', 'Cash', 'September 19 2026'],
            ['Sta Cruz', 'Super Sushi Boat (120pcs)', 1, '₱2,999.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 8, '₱2,044.40', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Student Meal', 19, '₱1,881.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 4, '₱1,116.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Torched Ham Platter', 1, '₱999.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Chicken Katsu', 5, '₱945.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 3, '₱567.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Black Garlic', 2, '₱558.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Kani Salad Platters', 1, '₱499.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱466.20', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 3, '₱450.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 2, '₱398.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 4, '₱380.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 2, '₱358.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 2, '₱260.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Lava Roll (8pcs)', 1, '₱259.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Miso', 1, '₱249.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 2, '₱230.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (8pcs)', 1, '₱191.20', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Mineral Water', 11, '₱159.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 1, '₱145.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese (4pcs)', 1, '₱135.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'Sprite Mismo', 2, '₱50.00', 'Cash', 'September 20 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 8, '₱2,152.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 2, '₱290.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (8pcs)', 1, '₱289.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 3, '₱285.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (8pcs)', 1, '₱269.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Miso', 1, '₱249.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 1, '₱229.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Mineral Water', 10, '₱150.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Sprite Mismo', 2, '₱50.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'Coke Soda Mismo', 2, '₱50.00', 'Cash', 'September 21 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 6, '₱1,506.40', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 5, '₱1,445.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Student Meal', 9, '₱891.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Pork Katsu', 3, '₱597.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱518.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 2, '₱458.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 2, '₱398.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (Bento)', 1, '₱263.20', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Lava Roll (8pcs)', 1, '₱259.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Miso', 1, '₱249.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Katsu Curry', 1, '₱199.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Mineral Water', 11, '₱165.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (4pcs)', 1, '₱135.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Coke Soda Mismo', 5, '₱125.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 1, '₱95.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Sprite Mismo', 3, '₱75.00', 'Cash', 'September 22 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 3, '₱567.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 1, '₱289.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Black Garlic', 1, '₱279.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 1, '₱269.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 1, '₱95.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Mineral Water', 3, '₱45.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Sprite Mismo', 1, '₱25.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Royal', 1, '₱25.00', 'Cash', 'September 23 2026'],
            ['Sta Cruz', 'Student Meal', 13, '₱1,287.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Lava Roll (8pcs)', 2, '₱518.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱466.20', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Pork Katsudon', 2, '₱416.10', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 4, '₱370.50', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 1, '₱269.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱249.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱188.10', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 1, '₱179.10', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 1, '₱130.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Coke Mismo', 5, '₱125.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Mineral Water', 8, '₱120.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Sprite Mismo', 4, '₱100.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Royal', 3, '₱75.00', 'Cash', 'September 24 2026'],
            ['Sta Cruz', 'Student Meal', 8, '₱792.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 2, '₱538.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 2, '₱538.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱518.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Lava Roll (8pcs)', 2, '₱518.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 2, '₱458.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 4, '₱380.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (Bento)', 1, '₱299.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 3, '₱297.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 1, '₱289.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 2, '₱285.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Crazy Maki (8pcs)', 1, '₱229.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Katsu Curry', 1, '₱199.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Royal', 5, '₱125.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Coke Mismo', 4, '₱100.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Mineral Water', 4, '₱60.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Sprite Mismo', 1, '₱25.00', 'Cash', 'September 25 2026'],
            ['Sta Cruz', 'Student Meal', 13, '₱1287.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 4, '₱1036.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 2, '₱589.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 2, '₱578.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 3, '₱567.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Black Garlic', 2, '₱558.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 2, '₱538.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Lava Roll (8pcs)', 2, '₱518.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Crazy Maki (8pcs)', 2, '₱458.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (4pcs)', 3, '₱405.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Pork Katsu', 2, '₱398.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Katsu Curry', 2, '₱398.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 1, '₱269.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Shoyu', 1, '₱249.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 1, '₱229.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱219.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 2, '₱190.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Kani Salad (Solo)', 1, '₱179.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Mineral water', 7, '₱105.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Sprite mismo', 3, '₱75.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Royal', 3, '₱75.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'WASABI', 3, '₱30.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'Coke soda mismo', 1, '₱25.00', 'Cash', 'September 26 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 8, '₱1,990.60', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Student meal', 17, '₱1,683.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Medium Sushi boat 55 pcs', 1, '₱1,599.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 6, '₱1,115.10', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Tan-Tan (Spicy Ground Pork)', 3, '₱867.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Small Sushi Boat (26 pcs)', 1, '₱729.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 3, '₱597.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Pork Katsu', 3, '₱597.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Chicken Katsu', 3, '₱567.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 6, '₱551.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱492.10', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 2, '₱458.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Pork Katsudon', 2, '₱438.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Chicken Katsudon', 2, '₱398.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 3, '₱333.50', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (8pcs)', 1, '₱289.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (4pcs)', 1, '₱269.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Shio (Chicken Broth)', 1, '₱249.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Promo CCM', 3, '₱237.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Crazy Maki (8pcs)', 1, '₱229.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Tempura(solo)', 1, '₱229.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Mineral water', 12, '₱174.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 1, '₱145.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Lava Roll (4pcs)', 1, '₱130.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Sprite soda mini', 2, '₱76.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'Sprite mismo', 1, '₱25.00', 'Cash', 'September 27 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 6, '₱1,614.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Student meal', 8, '₱792.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Crazy Maki (Bento)', 2, '₱578.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Black Garlic', 2, '₱558.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Shoyu', 2, '₱498.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 5, '₱475.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Pork Katsu', 2, '₱398.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Chicken Katsu', 2, '₱378.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Torched Salmon (Bento)', 1, '₱339.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 2, '₱290.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 1, '₱279.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Torched Ham and Cheese Roll (8pcs)', 1, '₱269.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Tempura with Rice', 1, '₱239.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Chicken Teriyaki', 1, '₱229.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Mango California Maki (8pcs)', 1, '₱199.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Vegetable Maki (4pcs)', 2, '₱190.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Vegetable Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Mineral water', 10, '₱150.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 1, '₱115.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 1, '₱99.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Coke soda mismo', 3, '₱75.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Sprite mismo', 1, '₱25.00', 'Cash', 'September 28 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 1, '₱259.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Crazy Maki (8pc)', 1, '₱229.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 1, '₱378.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Vegetable Maki (8pcs)', 1, '₱189.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 1, '₱150.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Coke soda mismo', 2, '₱50.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'Mineral Water', 2, '₱30.00', 'Cash', 'September 29 2026'],
            ['Sta Cruz', 'California Maki (Bento)', 4, '₱1,022.20', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Student Meal', 7, '₱693.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Classic California Maki (4pcs)', 7, '₱665.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Mango Cali Maki (Bento)', 2, '₱558.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Tonkatsu (Pork Broth)', 2, '₱518.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Classic California Maki (8pcs)', 2, '₱378.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Torched Salmon (4pcs)', 2, '₱300.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Torched Salmon (8pcs)', 1, '₱299.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Crazy Fireworks Overload (4pcs)', 2, '₱290.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Spicy Tonkatsu (Pork Broth)', 1, '₱269.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Pork Katsudon', 1, '₱219.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Crazy Maki (4pcs)', 2, '₱207.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Pork Katsu', 1, '₱199.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Mango California Maki (4pcs)', 2, '₱198.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Chicken Katsu', 1, '₱189.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Kani Maki with Salted Egg (4pcs)', 1, '₱120.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Coke Mismo', 4, '₱100.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Mineral Water', 6, '₱90.00', 'Cash', 'September 30 2026'],
            ['Sta Cruz', 'Sprite Mismo', 2, '₱50.00', 'Cash', 'September 30 2026'],
        ];

        // Cache existing products by name
        $productMap = [];
        foreach (Product::all() as $p) {
            $productMap[strtolower(trim($p->name))] = $p;
        }

        $allBranchIds = Branch::pluck('id')->toArray();
        $importedCount = 0;

        // Group items by date to generate evenly distributed realistic timestamps between 09:00:00 and 18:40:00
        $groupedByDate = [];
        foreach ($rawData as $row) {
            $dateKey = trim($row[5]);
            $groupedByDate[$dateKey][] = $row;
        }

        // Start 9:00 AM (09:00:00) to 6:40 PM (18:40:00) = 580 minutes = 34,800 seconds
        $startSeconds = 9 * 3600; // 32,400s (09:00:00)
        $endSeconds = 18 * 3600 + 40 * 60; // 67,200s (18:40:00)

        DB::beginTransaction();

        try {
            foreach ($groupedByDate as $dateString => $rowsForDay) {
                $baseDate = Carbon::parse($dateString)->startOfDay();
                $dayCount = count($rowsForDay);

                // Generate random timestamps strictly between 9:00 AM and 6:40 PM (sorted chronologically)
                $randomSecondsList = [];
                for ($i = 0; $i < $dayCount; $i++) {
                    $randomSecondsList[] = mt_rand($startSeconds, $endSeconds);
                }
                sort($randomSecondsList);

                foreach ($rowsForDay as $index => $row) {
                    [$branchName, $productName, $qty, $rawPrice, $paymentMethod, $rawDate] = $row;

                    // Clean price
                    $cleanPriceStr = str_replace(['₱', ',', ' '], '', $rawPrice);
                    $totalPrice = (float) $cleanPriceStr;
                    $quantity = (float) $qty;
                    $unitPrice = $quantity > 0 ? round($totalPrice / $quantity, 2) : $totalPrice;

                    // 1. Resolve or Create Product
                    $normalizedName = trim($productName);
                    $lowerName = strtolower($normalizedName);

                    if (!isset($productMap[$lowerName])) {
                        $catId = $getCategoryId($normalizedName);
                        $product = Product::whereRaw('LOWER(name) = ?', [$lowerName])->first();

                        if (!$product) {
                            $product = Product::create([
                                'name'           => $normalizedName,
                                'sku'            => 'PRD-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $normalizedName), 0, 4)) . '-' . mt_rand(100, 999),
                                'category_id'    => $catId,
                                'selling_price'  => $unitPrice,
                                'cost_price'     => 0.00,
                                'costing_method' => 'automatic',
                                'unit'           => 'pcs',
                                'stock'          => 100,
                                'branch_id'      => null, // global product
                            ]);

                            // Assign to branch_product for all branches
                            foreach ($allBranchIds as $bId) {
                                DB::table('branch_product')->updateOrInsert(
                                    ['branch_id' => $bId, 'product_id' => $product->id],
                                    [
                                        'stock'      => 100,
                                        'price'      => $unitPrice,
                                        'is_active'  => true,
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]
                                );
                            }
                        }

                        $productMap[$lowerName] = $product;
                    } else {
                        $product = $productMap[$lowerName];
                    }

                    // Compute specific timestamp within 9:00am - 6:40pm
                    $assignedSeconds = $randomSecondsList[$index];
                    $transactionTime = (clone $baseDate)->addSeconds($assignedSeconds);

                    // Generate unique order number
                    $dateSlug = $transactionTime->format('Ymd');
                    $timeSlug = $transactionTime->format('His');
                    $uniqueSuffix = strtoupper(substr(md5(uniqid((string) mt_rand(), true)), 0, 4));
                    $orderNumber = "POS-SC-{$dateSlug}-{$timeSlug}-{$uniqueSuffix}";

                    // Create Sale record
                    $sale = Sale::create([
                        'order_number'     => $orderNumber,
                        'user_id'          => $userId,
                        'branch_id'        => $branch->id,
                        'type'             => 'dine-in',
                        'subtotal'         => $totalPrice,
                        'discount'         => 0.00,
                        'discount_type'    => null,
                        'discount_details' => null,
                        'delivery_fee'     => 0.00,
                        'total'            => $totalPrice,
                        'cost_total'       => 0.00,
                        'profit'           => $totalPrice,
                        'paid_amount'      => $totalPrice,
                        'change_amount'    => 0.00,
                        'payment_method'   => strtolower(trim($paymentMethod)),
                        'status'           => 'completed',
                        'source'           => 'pos',
                        'created_at'       => $transactionTime,
                        'updated_at'       => $transactionTime,
                    ]);

                    // Manually set timestamp if Eloquent overrides it
                    $sale->created_at = $transactionTime;
                    $sale->updated_at = $transactionTime;
                    $sale->saveQuietly();

                    // Create SaleItem record
                    $saleItem = SaleItem::create([
                        'sale_id'         => $sale->id,
                        'product_id'      => $product->id,
                        'quantity'        => $quantity,
                        'unit_price'      => $unitPrice,
                        'cost_price'      => 0.00,
                        'subtotal'        => $totalPrice,
                        'profit'          => $totalPrice,
                        'addon_total'     => 0.00,
                        'selected_addons' => null,
                        'created_at'      => $transactionTime,
                        'updated_at'      => $transactionTime,
                    ]);

                    $saleItem->created_at = $transactionTime;
                    $saleItem->updated_at = $transactionTime;
                    $saleItem->saveQuietly();

                    $importedCount++;
                }
            }

            DB::commit();
            $this->command->info("Successfully seeded {$importedCount} sales transactions for Sta Cruz branch (times between 9:00 AM and 6:40 PM).");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Failed to seed sales dataset: " . $e->getMessage());
            throw $e;
        }
    }
}
