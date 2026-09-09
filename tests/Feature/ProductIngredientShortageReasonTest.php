<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\User;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class ProductIngredientShortageReasonTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Specialty Rolls',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);
    }

    protected function createIngredient(string $name, string $unit = 'pcs', float $cost = 10.0): Ingredient
    {
        return Ingredient::create([
            'name' => $name,
            'unit' => $unit,
            'cost_per_base_unit' => $cost,
            'reorder_level' => 5,
        ]);
    }

    protected function setStock(Ingredient $ingredient, Branch $branch, float $stock): IngredientStock
    {
        return IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $branch->id],
            ['stock' => $stock, 'cost_per_unit' => $ingredient->cost_per_base_unit]
        );
    }

    protected function createProductWithRecipe(string $name, array $recipe, ?int $branchId = null): Product
    {
        $product = Product::create([
            'name' => $name,
            'sku' => 'SKU-' . strtoupper(uniqid()),
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'branch_id' => $branchId,
            'unit' => 'pcs',
        ]);

        foreach ($recipe as $item) {
            $inputUnit = $item['unit'] ?? $item['ingredient']->unit;
            MenuItemIngredient::create([
                'menu_item_id' => $product->id,
                'ingredient_id' => $item['ingredient']->id,
                'quantity_required' => $item['quantity'],
                'unit' => $inputUnit,
            ]);
        }

        return $product->fresh(['ingredients']);
    }

    /** @test */
    public function test_single_insufficient_ingredient_calculates_exact_shortage_and_reason()
    {
        // Garlic: Required 4, Available 4 (Sufficient)
        // Onion: Required 3, Available 3 (Sufficient)
        // Tomato: Required 5, Available 4 (Short by 1)
        $garlic = $this->createIngredient('Garlic');
        $onion = $this->createIngredient('Onion');
        $tomato = $this->createIngredient('Tomato');

        $this->setStock($garlic, $this->branchSantaCruz, 4);
        $this->setStock($onion, $this->branchSantaCruz, 3);
        $this->setStock($tomato, $this->branchSantaCruz, 4);

        $product = $this->createProductWithRecipe('Maki Deluxe', [
            ['ingredient' => $garlic, 'quantity' => 4],
            ['ingredient' => $onion, 'quantity' => 3],
            ['ingredient' => $tomato, 'quantity' => 5],
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertEquals(0, $avail['available']);
        $this->assertEquals('OUT_OF_STOCK', $avail['status']);
        $this->assertCount(1, $avail['insufficient_ingredients']);

        $shortageItem = $avail['insufficient_ingredients'][0];
        $this->assertEquals($tomato->id, $shortageItem['ingredient_id']);
        $this->assertEquals('Tomato', $shortageItem['ingredient_name']);
        $this->assertEquals(5.0, $shortageItem['required_quantity']);
        $this->assertEquals(4.0, $shortageItem['available_quantity']);
        $this->assertEquals(1.0, $shortageItem['shortage_quantity']);
        $this->assertEquals('INSUFFICIENT_STOCK', $shortageItem['status']);
        $this->assertTrue($shortageItem['has_inventory_record']);
        $this->assertStringContainsString('short by 1', $shortageItem['reason_display']);
        $this->assertStringContainsString('Required: 5', $shortageItem['reason_display']);
        $this->assertStringContainsString('Available: 4', $shortageItem['reason_display']);
    }

    /** @test */
    public function test_multiple_insufficient_ingredients_are_all_returned()
    {
        // Garlic: Required 4, Available 4 (Sufficient)
        // Onion: Required 3, Available 2 (Short by 1)
        // Tomato: Required 5, Available 3 (Short by 2)
        $garlic = $this->createIngredient('Garlic');
        $onion = $this->createIngredient('Onion');
        $tomato = $this->createIngredient('Tomato');

        $this->setStock($garlic, $this->branchSantaCruz, 4);
        $this->setStock($onion, $this->branchSantaCruz, 2);
        $this->setStock($tomato, $this->branchSantaCruz, 3);

        $product = $this->createProductWithRecipe('Trio Maki', [
            ['ingredient' => $garlic, 'quantity' => 4],
            ['ingredient' => $onion, 'quantity' => 3],
            ['ingredient' => $tomato, 'quantity' => 5],
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertCount(2, $avail['insufficient_ingredients']);

        $insufficientNames = array_column($avail['insufficient_ingredients'], 'ingredient_name');
        $this->assertContains('Onion', $insufficientNames);
        $this->assertContains('Tomato', $insufficientNames);
        $this->assertNotContains('Garlic', $insufficientNames);

        $onionShortage = collect($avail['insufficient_ingredients'])->firstWhere('ingredient_name', 'Onion');
        $this->assertEquals(3.0, $onionShortage['required_quantity']);
        $this->assertEquals(2.0, $onionShortage['available_quantity']);
        $this->assertEquals(1.0, $onionShortage['shortage_quantity']);

        $tomatoShortage = collect($avail['insufficient_ingredients'])->firstWhere('ingredient_name', 'Tomato');
        $this->assertEquals(5.0, $tomatoShortage['required_quantity']);
        $this->assertEquals(3.0, $tomatoShortage['available_quantity']);
        $this->assertEquals(2.0, $tomatoShortage['shortage_quantity']);
    }

    /** @test */
    public function test_zero_stock_ingredient_is_handled_correctly()
    {
        $tomato = $this->createIngredient('Tomato');
        $this->setStock($tomato, $this->branchSantaCruz, 0);

        $product = $this->createProductWithRecipe('Tomato Roll', [
            ['ingredient' => $tomato, 'quantity' => 5],
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertCount(1, $avail['insufficient_ingredients']);

        $item = $avail['insufficient_ingredients'][0];
        $this->assertEquals(0.0, $item['available_quantity']);
        $this->assertEquals(5.0, $item['shortage_quantity']);
        $this->assertStringContainsString('Available: 0', $item['reason_display']);
    }

    /** @test */
    public function test_missing_inventory_record_is_detected_as_no_inventory_record()
    {
        $tomato = $this->createIngredient('Tomato');
        // Explicitly delete any created stock record for Santa Cruz to simulate missing inventory record
        IngredientStock::where('ingredient_id', $tomato->id)
            ->where('branch_id', $this->branchSantaCruz->id)
            ->delete();

        $product = $this->createProductWithRecipe('Tomato Roll', [
            ['ingredient' => $tomato, 'quantity' => 5],
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertFalse($avail['is_available']);
        $this->assertCount(1, $avail['insufficient_ingredients']);

        $item = $avail['insufficient_ingredients'][0];
        $this->assertEquals('NO_INVENTORY_RECORD', $item['status']);
        $this->assertFalse($item['has_inventory_record']);
        $this->assertEquals(0.0, $item['available_quantity']);
        $this->assertEquals(5.0, $item['shortage_quantity']);
        $this->assertStringContainsString('Inventory record unavailable', $item['reason_display']);
    }

    /** @test */
    public function test_exactly_sufficient_stock_has_no_shortages()
    {
        $garlic = $this->createIngredient('Garlic');
        $onion = $this->createIngredient('Onion');

        $this->setStock($garlic, $this->branchSantaCruz, 4);
        $this->setStock($onion, $this->branchSantaCruz, 3);

        $product = $this->createProductWithRecipe('Garlic Onion Maki', [
            ['ingredient' => $garlic, 'quantity' => 4],
            ['ingredient' => $onion, 'quantity' => 3],
        ]);

        $avail = $product->dynamicAvailability($this->branchSantaCruz->id);

        $this->assertTrue($avail['is_available']);
        $this->assertEquals(1.0, $avail['available']);
        $this->assertEmpty($avail['insufficient_ingredients']);
    }

    /** @test */
    public function test_branch_aware_stock_shortages_are_isolated_per_branch()
    {
        $tomato = $this->createIngredient('Tomato');

        // Santa Cruz has 10 (Sufficient for 2 servings)
        $this->setStock($tomato, $this->branchSantaCruz, 10);

        // Victoria has 4 (Insufficient for 1 serving)
        $this->setStock($tomato, $this->branchVictoria, 4);

        $product = $this->createProductWithRecipe('Tomato Roll', [
            ['ingredient' => $tomato, 'quantity' => 5],
        ]);

        $santaCruzAvail = $product->dynamicAvailability($this->branchSantaCruz->id);
        $this->assertTrue($santaCruzAvail['is_available']);
        $this->assertEquals(2.0, $santaCruzAvail['available']);
        $this->assertEmpty($santaCruzAvail['insufficient_ingredients']);

        $victoriaAvail = $product->dynamicAvailability($this->branchVictoria->id);
        $this->assertFalse($victoriaAvail['is_available']);
        $this->assertEquals(0.0, $victoriaAvail['available']);
        $this->assertCount(1, $victoriaAvail['insufficient_ingredients']);
        $this->assertEquals(1.0, $victoriaAvail['insufficient_ingredients'][0]['shortage_quantity']);
    }

    /** @test */
    public function test_products_index_endpoint_returns_structured_shortage_information()
    {
        $garlic = $this->createIngredient('Garlic');
        $this->setStock($garlic, $this->branchSantaCruz, 1);

        $product = $this->createProductWithRecipe('Garlic Crunch', [
            ['ingredient' => $garlic, 'quantity' => 4],
        ]);

        $response = $this->actingAs($this->admin)->get(route('products.index', ['branch_id' => $this->branchSantaCruz->id]));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->has('products', 1, fn ($item) => $item
                ->where('id', $product->id)
                ->where('name', 'Garlic Crunch')
                ->where('is_available', false)
                ->where('availability_status', 'OUT_OF_STOCK')
                ->where('status', 'Out of Stock')
                ->has('insufficient_ingredients', 1, fn ($ins) => $ins
                    ->where('ingredient_name', 'Garlic')
                    ->where('required_quantity', 4)
                    ->where('available_quantity', 1)
                    ->where('shortage_quantity', 3)
                    ->where('status', 'INSUFFICIENT_STOCK')
                    ->etc()
                )
                ->etc()
            )
        );
    }
}
