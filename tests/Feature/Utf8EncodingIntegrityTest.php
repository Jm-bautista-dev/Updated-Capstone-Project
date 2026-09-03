<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Ingredient;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class Utf8EncodingIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_utf8_special_characters_and_currency_symbols_persist_and_serialize_correctly(): void
    {
        $branch = Branch::create([
            'name'           => 'Santa Cruz – Principal Branch',
            'code'           => 'STACRUZ',
            'address'        => 'Población, Santa Cruz, Laguna',
            'contact_number' => '09171234567',
            'is_active'      => true,
        ]);

        $ingredient = Ingredient::create([
            'name'                => 'Nori Seaweed – Premium Grade • Special',
            'unit'                => 'sheets',
            'cost_per_unit'       => 15.50,
            'is_active'           => true,
            'storage_location'    => 'Dry Storage – Shelf A',
            'reorder_point'       => 50,
            'safety_stock_level'  => 20,
        ]);

        // Verify retrieval matches exactly without UTF-8 corruption
        $branch->refresh();
        $this->assertEquals('Santa Cruz – Principal Branch', $branch->name);
        $this->assertTrue(mb_check_encoding($branch->name, 'UTF-8'));
        $this->assertStringContainsString('–', $branch->name);
        $this->assertStringNotContainsString("\xEF\xBF\xBD", $branch->name);

        $ingredient->refresh();
        $this->assertEquals('Nori Seaweed – Premium Grade • Special', $ingredient->name);
        $this->assertTrue(mb_check_encoding($ingredient->name, 'UTF-8'));
        $this->assertStringContainsString('•', $ingredient->name);
        $this->assertStringNotContainsString("\xEF\xBF\xBD", $ingredient->name);
    }

    public function test_analytics_restock_suggestions_page_renders_clean_utf8(): void
    {
        $branch = Branch::create([
            'name'           => 'Victoria Branch',
            'code'           => 'VIC',
            'address'        => 'Victoria, Laguna',
            'contact_number' => '09171112233',
            'is_active'      => true,
        ]);

        $admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $branch->id,
        ]);

        $response = $this->actingAs($admin)->get('/analytics/restock-suggestions');

        $response->assertStatus(200);
        
        $content = $response->getContent();
        
        $this->assertTrue(mb_check_encoding($content, 'UTF-8'));
        $this->assertStringNotContainsString("\xEF\xBF\xBD", $content);
    }
}
