<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductDescriptionRestorationTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public Ingredient $ingredient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                => 'Main Branch',
            'code'                => 'MAIN',
            'address'             => '123 Main St',
            'latitude'            => 14.5995,
            'longitude'           => 120.9842,
            'delivery_radius_km'  => 15.0,
            'is_active'           => true,
        ]);

        $this->admin = User::factory()->create([
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);

        $this->category = Category::create([
            'name' => 'Nigiri',
        ]);

        $this->ingredient = Ingredient::create([
            'name'               => 'Fresh Salmon',
            'unit'               => 'kg',
            'cost_per_base_unit' => 500,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingredient->id, 'branch_id' => $this->branch->id],
            [
                'stock'         => 10,
                'cost_per_unit' => 500,
            ]
        );
    }

    /**
     * Test A — Create Product with Description
     */
    public function test_can_create_product_with_description(): void
    {
        $descriptionText = 'Freshly prepared Japanese-style chicken teriyaki with steamed rice.';

        $response = $this->actingAs($this->admin)->post('/products', [
            'name'          => 'Chicken Teriyaki',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'description'   => $descriptionText,
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                [
                    'ingredient_id'     => $this->ingredient->id,
                    'quantity_required' => 0.1,
                    'unit'              => 'kg',
                ]
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'name'        => 'Chicken Teriyaki',
            'description' => $descriptionText,
        ]);

        $product = Product::where('name', 'Chicken Teriyaki')->firstOrFail();

        // Verify API single product detail
        $detailResponse = $this->getJson("/api/v1/products/{$product->id}");
        $detailResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.description', $descriptionText);

        // Verify API product list
        $listResponse = $this->getJson('/api/v1/products');
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true);
        
        $products = collect($listResponse->json('products'));
        $found = $products->firstWhere('id', $product->id);
        $this->assertNotNull($found);
        $this->assertEquals($descriptionText, $found['description']);
    }

    /**
     * Test B — Edit Product Description
     */
    public function test_can_update_product_description(): void
    {
        $product = Product::create([
            'name'          => 'Spicy Tuna Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 180.00,
            'unit'          => 'pcs',
            'description'   => 'Original tuna description',
            'branch_id'     => $this->branch->id,
        ]);

        $updatedDescription = 'Updated description with spicy mayo and toasted sesame seeds.';

        $response = $this->actingAs($this->admin)->put("/products/{$product->id}", [
            'name'          => 'Spicy Tuna Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 195.00,
            'unit'          => 'pcs',
            'description'   => $updatedDescription,
            'branch_option' => 'single',
            'branch_id'     => $this->branch->id,
            'recipe'        => [
                [
                    'ingredient_id'     => $this->ingredient->id,
                    'quantity_required' => 0.1,
                    'unit'              => 'kg',
                ]
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('products', [
            'id'          => $product->id,
            'description' => $updatedDescription,
        ]);

        $apiResponse = $this->getJson("/api/v1/products/{$product->id}");
        $apiResponse->assertStatus(200)
            ->assertJsonPath('data.description', $updatedDescription);
    }

    /**
     * Test C — Product Listing APIs include description
     */
    public function test_all_relevant_product_api_endpoints_expose_description(): void
    {
        $product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $this->category->id,
            'selling_price' => 120.00,
            'unit'          => 'pcs',
            'description'   => 'Crab meat, avocado, cucumber, and tobiko.',
            'branch_id'     => $this->branch->id,
        ]);

        // 1. GET /api/v1/products
        $res1 = $this->getJson('/api/v1/products');
        $res1->assertStatus(200);
        $p1 = collect($res1->json('products'))->firstWhere('id', $product->id);
        $this->assertEquals('Crab meat, avocado, cucumber, and tobiko.', $p1['description']);

        // 2. GET /api/v1/customer/menu
        $res2 = $this->getJson("/api/v1/customer/menu?branch_id={$this->branch->id}");
        $res2->assertStatus(200);
        $p2 = collect($res2->json('products'))->firstWhere('id', $product->id);
        $this->assertEquals('Crab meat, avocado, cucumber, and tobiko.', $p2['description']);

        // 3. GET /api/v1/customer/products
        $res3 = $this->getJson("/api/v1/customer/products?branch_id={$this->branch->id}");
        $res3->assertStatus(200);
        $p3 = collect($res3->json('products'))->firstWhere('id', $product->id);
        $this->assertEquals('Crab meat, avocado, cucumber, and tobiko.', $p3['description']);

        // 4. GET /api/v1/products?mode=merged
        $res4 = $this->getJson('/api/v1/products?mode=merged');
        $res4->assertStatus(200);
        $p4 = collect($res4->json('products'))->firstWhere('name', 'California Maki');
        $this->assertEquals('Crab meat, avocado, cucumber, and tobiko.', $p4['description']);
    }

    /**
     * Test D — Legacy Product without Description handles null safely
     */
    public function test_legacy_product_without_description_returns_null_safely(): void
    {
        $legacyProduct = Product::create([
            'name'          => 'Legacy Edamame',
            'category_id'   => $this->category->id,
            'selling_price' => 80.00,
            'unit'          => 'pcs',
            'description'   => null,
            'branch_id'     => $this->branch->id,
        ]);

        $this->assertDatabaseHas('products', [
            'id'          => $legacyProduct->id,
            'description' => null,
        ]);

        // Detail endpoint
        $detail = $this->getJson("/api/v1/products/{$legacyProduct->id}");
        $detail->assertStatus(200)
            ->assertJsonPath('data.description', null);

        // List endpoint
        $list = $this->getJson('/api/v1/products');
        $list->assertStatus(200);
        $found = collect($list->json('products'))->firstWhere('id', $legacyProduct->id);
        $this->assertNull($found['description']);
    }

    /**
     * Test E — Top Picks API endpoint exposes description
     */
    public function test_top_picks_api_exposes_product_description(): void
    {
        $topProduct = Product::create([
            'name'          => 'Dragon Roll',
            'category_id'   => $this->category->id,
            'selling_price' => 250.00,
            'unit'          => 'pcs',
            'description'   => 'Eel and cucumber inside, avocado and unagi sauce outside.',
            'branch_id'     => $this->branch->id,
        ]);

        $res = $this->getJson('/api/v1/top-picks');
        $res->assertStatus(200);
        $this->assertTrue($res->json('success'));
    }
}
