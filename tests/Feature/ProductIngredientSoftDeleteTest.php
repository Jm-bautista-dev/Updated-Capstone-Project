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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

class ProductIngredientSoftDeleteTest extends TestCase
{
    use RefreshDatabase;

    public $testBranch;
    public $testCategory;
    public $adminUser;
    public $activeIngredient;
    public $deletedIngredient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Maki Rolls',
        ]);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        // Create an active ingredient with stock and cost
        $this->activeIngredient = Ingredient::create([
            'name' => 'Fresh Salmon',
            'unit' => 'g',
            'cost_per_base_unit' => 1.50,
            'is_composite' => false,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->activeIngredient->id, 'branch_id' => $this->testBranch->id],
            ['stock' => 5000, 'cost_per_unit' => 1.50]
        );

        // Create an ingredient and then soft-delete it
        $this->deletedIngredient = Ingredient::create([
            'name' => 'Discontinued Crabstick',
            'unit' => 'pcs',
            'cost_per_base_unit' => 5.00,
            'is_composite' => false,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->deletedIngredient->id, 'branch_id' => $this->testBranch->id],
            ['stock' => 100, 'cost_per_unit' => 5.00]
        );

        $this->deletedIngredient->delete(); // Soft delete
    }

    /**
     * TEST 1: Active ingredients appear in the Products Index page props,
     * but soft-deleted ingredients are excluded from the selection list.
     */
    public function test_products_index_supplies_only_active_ingredients_for_product_creation(): void
    {
        $response = $this->actingAs($this->adminUser)->get(route('products.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Products/Index')
            ->has('ingredients', fn (Assert $ingredients) => $ingredients
                ->where('0.id', $this->activeIngredient->id)
                ->where('0.name', 'Fresh Salmon')
                ->where('0.deleted_at', null)
                ->etc()
            )
        );

        // Verify deleted ingredient is not present in the ingredients list prop
        $pageProps = $response->getOriginalContent()->getData()['page']['props'];
        $ingredientIds = collect($pageProps['ingredients'])->pluck('id')->all();

        $this->assertContains($this->activeIngredient->id, $ingredientIds);
        $this->assertNotContains($this->deletedIngredient->id, $ingredientIds);
    }

    /**
     * TEST 2: Attempting to create a new product using a deleted ingredient is rejected with 422.
     */
    public function test_store_product_rejects_soft_deleted_ingredient_with_validation_error(): void
    {
        $payload = [
            'name' => 'California Roll Special',
            'sku' => 'CAL-SP-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 180.00,
            'costing_method' => 'automatic',
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->testBranch->id,
            'branch_ids' => [$this->testBranch->id],
            'recipe' => [
                [
                    'ingredient_id' => $this->deletedIngredient->id,
                    'quantity_required' => 2,
                    'unit' => 'pcs',
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)->post(route('products.store'), $payload);

        $response->assertSessionHasErrors(['recipe.0.ingredient_id']);
        $this->assertDatabaseMissing('products', [
            'name' => 'California Roll Special',
        ]);
    }

    /**
     * TEST 3: Creating a product with valid active ingredient succeeds.
     */
    public function test_store_product_succeeds_with_active_ingredient(): void
    {
        $payload = [
            'name' => 'Salmon Nigiri',
            'sku' => 'SLM-NGR-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 220.00,
            'costing_method' => 'automatic',
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->testBranch->id,
            'branch_ids' => [$this->testBranch->id],
            'recipe' => [
                [
                    'ingredient_id' => $this->activeIngredient->id,
                    'quantity_required' => 50,
                    'unit' => 'g',
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)->post(route('products.store'), $payload);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'name' => 'Salmon Nigiri',
        ]);

        $product = Product::where('name', 'Salmon Nigiri')->first();
        $this->assertNotNull($product);
        $this->assertCount(1, $product->ingredients);
        $this->assertEquals($this->activeIngredient->id, $product->ingredients->first()->id);
    }

    /**
     * TEST 4: Existing products that use historical/deleted ingredients retain their relationships.
     */
    public function test_existing_product_retains_historical_soft_deleted_ingredients(): void
    {
        // Create product when ingredient was active
        $product = Product::create([
            'name' => 'Old Recipe Roll',
            'sku' => 'OLD-RCP-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 150.00,
            'costing_method' => 'manual',
            'manual_cost' => 50.00,
            'cost_price' => 50.00,
            'unit' => 'pcs',
            'stock' => 10,
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $this->deletedIngredient->id,
            'quantity_required' => 1,
            'unit' => 'pcs',
        ]);

        // Fetch fresh product and verify ingredients relation includes withTrashed()
        $freshProduct = Product::with('ingredients')->find($product->id);
        $this->assertCount(1, $freshProduct->ingredients);
        $this->assertEquals($this->deletedIngredient->id, $freshProduct->ingredients->first()->id);
        $this->assertEquals('Discontinued Crabstick', $freshProduct->ingredients->first()->name);
    }

    /**
     * TEST 5: Existing product with soft-deleted ingredient can be updated without losing historical recipe.
     */
    public function test_existing_product_with_soft_deleted_ingredient_can_be_updated(): void
    {
        $product = Product::create([
            'name' => 'Classic Roll',
            'sku' => 'CLS-RLL-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 160.00,
            'costing_method' => 'manual',
            'manual_cost' => 45.00,
            'cost_price' => 45.00,
            'unit' => 'pcs',
            'stock' => 10,
        ]);

        MenuItemIngredient::create([
            'menu_item_id' => $product->id,
            'ingredient_id' => $this->deletedIngredient->id,
            'quantity_required' => 2,
            'unit' => 'pcs',
        ]);

        $updatePayload = [
            'name' => 'Classic Roll Updated',
            'sku' => 'CLS-RLL-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 175.00,
            'costing_method' => 'manual',
            'manual_cost' => 50.00,
            'unit' => 'pcs',
            'recipe' => [
                [
                    'ingredient_id' => $this->deletedIngredient->id,
                    'quantity_required' => 2,
                    'unit' => 'pcs',
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser)->put(route('products.update', $product->id), $updatePayload);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Classic Roll Updated',
            'selling_price' => 175.00,
        ]);

        $freshProduct = Product::with('ingredients')->find($product->id);
        $this->assertCount(1, $freshProduct->ingredients);
        $this->assertEquals($this->deletedIngredient->id, $freshProduct->ingredients->first()->id);
    }

    /**
     * TEST 6: Restored ingredient reappears and can be assigned to new products.
     */
    public function test_restored_ingredient_becomes_selectable_and_usable_again(): void
    {
        // Restore soft-deleted ingredient
        $this->deletedIngredient->restore();

        // Index page contains restored ingredient
        $response = $this->actingAs($this->adminUser)->get(route('products.index'));
        $pageProps = $response->getOriginalContent()->getData()['page']['props'];
        $ingredientIds = collect($pageProps['ingredients'])->pluck('id')->all();
        $this->assertContains($this->deletedIngredient->id, $ingredientIds);

        // Store request with restored ingredient succeeds
        $payload = [
            'name' => 'Crabstick Maki',
            'sku' => 'CRB-MK-001',
            'category_id' => $this->testCategory->id,
            'selling_price' => 140.00,
            'costing_method' => 'automatic',
            'unit' => 'pcs',
            'branch_option' => 'single',
            'branch_id' => $this->testBranch->id,
            'branch_ids' => [$this->testBranch->id],
            'recipe' => [
                [
                    'ingredient_id' => $this->deletedIngredient->id,
                    'quantity_required' => 1,
                    'unit' => 'pcs',
                ],
            ],
        ];

        $storeResponse = $this->actingAs($this->adminUser)->post(route('products.store'), $payload);
        $storeResponse->assertRedirect();
        $this->assertDatabaseHas('products', [
            'name' => 'Crabstick Maki',
        ]);
    }
}
