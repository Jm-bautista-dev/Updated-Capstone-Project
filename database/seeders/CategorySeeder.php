<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Maki & Rolls', 'description' => 'Classic and special sushi rolls.'],
            ['name' => 'Sashimi & Nigiri', 'description' => 'Fresh raw fish and pressed sushi.'],
            ['name' => 'Ramen & Noodles', 'description' => 'Authentic Japanese noodle soups and stir-fry.'],
            ['name' => 'Donburi', 'description' => 'Hearty Japanese rice bowls.'],
            ['name' => 'Sides & Beverages', 'description' => 'Appetizers, sides, and refreshing drinks.'],
        ];

        foreach ($categories as $cat) {
            DB::table('categories')->updateOrInsert(
                ['name' => $cat['name']],
                [
                    'description' => $cat['description'],
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }
    }
}
