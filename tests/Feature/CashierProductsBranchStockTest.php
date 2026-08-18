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

class CashierProductsBranchStockTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $cashierVictoria;
    protected User $cashierSantaCruz;
    protected User $admin;
    protected Product $product;
    protected Ingredient $rice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);
        $this->santaCruz = Branch::create(['name' => 'Maki Desu Santa Cruz', 'address' => 'Santa Cruz, Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->santaCruz->id,
        ]);

        $cat = Category::create(['name' => 'Sushi']);
        $this->product = Product::create([
            'name'          => 'Special Roll',
            'sku'           => 'ROL-001',
            'category_id'   => $cat->id,
            'selling_price' => 200.00,
            'status'        => 'in_stock',
        ]);

        // Recipe ingredient: 100g Japanese Rice per roll
        $this->rice = Ingredient::create([
            'name' => 'Japanese Rice',
            'unit' => 'g',
        ]);

        $this->product->ingredients()->attach($this->rice->id, [
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);

        // Victoria has 1,000g rice (yields 10 rolls)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->rice->id, 'branch_id' => $this->victoria->id],
            ['stock' => 1000]
        );

        // Santa Cruz has 5,000g rice (yields 50 rolls)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->rice->id, 'branch_id' => $this->santaCruz->id],
            ['stock' => 5000]
        );
    }

    public function test_victoria_cashier_only_sees_victoria_stock_and_no_other_branch_breakdown()
    {
        $response = $this->actingAs($this->cashierVictoria)->get('/products');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->where('isAdmin', false)
            ->where('currentBranchId', $this->victoria->id)
            ->has('products', 1)
            ->where('products.0.stock', 10) // 1000g / 100g = 10
            ->where('products.0.branch_breakdown', null) // Hidden for non-admins
        );
    }

    public function test_santa_cruz_cashier_only_sees_santa_cruz_stock_and_no_other_branch_breakdown()
    {
        $response = $this->actingAs($this->cashierSantaCruz)->get('/products');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->where('isAdmin', false)
            ->where('currentBranchId', $this->santaCruz->id)
            ->has('products', 1)
            ->where('products.0.stock', 50) // 5000g / 100g = 50
            ->where('products.0.branch_breakdown', null) // Hidden for non-admins
        );
    }

    public function test_admin_sees_multi_branch_breakdown()
    {
        $response = $this->actingAs($this->admin)->get('/products');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Products/Index')
            ->where('isAdmin', true)
            ->has('products', 1)
            ->where('products.0.branch_breakdown.' . $this->victoria->id . '.stock', 10)
            ->where('products.0.branch_breakdown.' . $this->santaCruz->id . '.stock', 50)
        );
    }
}
