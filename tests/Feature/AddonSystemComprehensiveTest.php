<?php

namespace Tests\Feature;

use App\Models\AddOn;
use App\Models\AddonGroup;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddonSystemComprehensiveTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public User $cashier;
    public $branch;
    public $category;
    public Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Main Branch',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->category = Category::create([
            'name' => 'Maki Rolls',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'name' => 'California Roll',
            'selling_price' => 100.00,
            'cost_price' => 50.00,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'stock' => 100,
        ]);

        // Attach product to branch with physical stock
        $this->product->branches()->attach($this->branch->id, ['stock' => 100]);

        \App\Models\CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'branch_id' => $this->branch->id,
            'status' => 'open',
            'opening_balance' => 1000.00,
            'opened_at' => now(),
        ]);
    }

    public function test_admin_can_create_and_manage_addons_and_groups(): void
    {
        $this->actingAs($this->admin);

        // 1. Create stock-linked AddOn
        $ingredient = Ingredient::create([
            'name' => 'Japanese Mayo',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);

        $response = $this->post(route('admin.addons.store'), [
            'name' => 'Extra Mayo',
            'price' => 15.00,
            'cost_price' => 5.00,
            'is_active' => true,
            'stock_linked' => true,
            'ingredient_id' => $ingredient->id,
            'ingredient_quantity' => 30.0, // 30g
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('add_ons', [
            'name' => 'Extra Mayo',
            'price' => 15.00,
            'stock_linked' => 1,
        ]);

        $addon = AddOn::where('name', 'Extra Mayo')->first();

        // 2. Create Modifier Group
        $groupResponse = $this->post(route('admin.addon-groups.store'), [
            'name' => 'Sauce Options',
            'selection_type' => 'single',
            'is_required' => true,
            'min_selections' => 1,
            'max_selections' => 1,
            'addon_ids' => [$addon->id],
            'product_ids' => [$this->product->id],
        ]);

        $groupResponse->assertRedirect();
        $this->assertDatabaseHas('addon_groups', [
            'name' => 'Sauce Options',
            'selection_type' => 'single',
            'is_required' => 1,
        ]);

        $group = AddonGroup::where('name', 'Sauce Options')->first();
        $this->assertCount(1, $group->addOns);
        $this->assertCount(1, $group->products);
    }

    public function test_sale_fails_when_required_addon_group_is_missing(): void
    {
        $this->actingAs($this->cashier);

        // Set up required addon group
        $addon = AddOn::create([
            'name' => 'Spicy Mayo',
            'price' => 10.00,
            'is_active' => true,
        ]);

        $group = AddonGroup::create([
            'name' => 'Sauce Choice',
            'selection_type' => 'single',
            'is_required' => true,
            'min_selections' => 1,
            'max_selections' => 1,
            'is_active' => true,
        ]);

        $group->addOns()->attach($addon->id);
        $group->products()->attach($this->product->id);

        $saleService = app(SaleService::class);

        // Attempt sale without selecting the required group
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage("Required modifier group 'Sauce Choice' must have at least 1 selection");

        $saleService->processSale([
            'branch_id' => $this->branch->id,
            'user_id' => $this->cashier->id,
            'cashier_id' => $this->cashier->id,
            'payment_method' => 'cash',
            'amount_paid' => 100.00,
            'items' => [
                [
                    'id' => $this->product->id,
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'price' => 100.00,
                    'selected_addons' => [], // Empty selection triggers validation error
                ],
            ],
        ]);
    }

    public function test_sale_calculates_addons_price_and_deducts_inventory_stock(): void
    {
        $this->actingAs($this->cashier);

        $ingredient = Ingredient::create([
            'name' => 'Spicy Sauce',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);

        // Set initial stock to 1000g in main branch
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 1000.0, 'low_stock_level' => 50.0]
        );

        $addon = AddOn::create([
            'name' => 'Extra Spicy Sauce',
            'price' => 20.00,
            'is_active' => true,
            'stock_linked' => true,
            'ingredient_id' => $ingredient->id,
            'ingredient_quantity' => 50.0, // 50g
        ]);

        $group = AddonGroup::create([
            'name' => 'Addons',
            'selection_type' => 'multi',
            'is_required' => false,
            'min_selections' => 0,
            'max_selections' => 3,
            'is_active' => true,
        ]);

        $group->addOns()->attach($addon->id);
        $group->products()->attach($this->product->id);

        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'branch_id' => $this->branch->id,
            'user_id' => $this->cashier->id,
            'cashier_id' => $this->cashier->id,
            'payment_method' => 'cash',
            'amount_paid' => 240.00,
            'items' => [
                [
                    'id' => $this->product->id,
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'price' => 100.00, // 2 * 100 = 200 base
                    'selected_addons' => [
                        [
                            'id' => $addon->id,
                            'name' => $addon->name,
                            'price' => 20.00,
                            'quantity' => 1,
                            'group_id' => $group->id,
                        ],
                    ], // 2 * (100 + 20) = 240 total
                ],
            ],
        ]);

        $this->assertEquals(240.00, (float)$sale->total);

        // Verify stock deduction: 2 items * 50g = 100g deducted -> 900g remaining
        $stockRecord = IngredientStock::where('ingredient_id', $ingredient->id)
            ->where('branch_id', $this->branch->id)
            ->first();
        $this->assertEquals(900.0, (float)$stockRecord->stock);
    }

    public function test_historical_price_snapshot_preserved_after_addon_price_mutation(): void
    {
        $this->actingAs($this->cashier);

        $addon = AddOn::create([
            'name' => 'Cheese Melt',
            'price' => 25.00,
            'is_active' => true,
            'stock_linked' => false,
        ]);

        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'branch_id' => $this->branch->id,
            'user_id' => $this->cashier->id,
            'cashier_id' => $this->cashier->id,
            'payment_method' => 'cash',
            'amount_paid' => 125.00,
            'items' => [
                [
                    'id' => $this->product->id,
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'price' => 100.00,
                    'selected_addons' => [
                        [
                            'id' => $addon->id,
                            'name' => 'Cheese Melt',
                            'price' => 25.00,
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ]);

        $saleItem = $sale->items->first();
        $this->assertEquals(125.00, (float)$saleItem->subtotal);

        // Update the master AddOn price
        $addon->update(['price' => 40.00]);

        // Verify that past sale item snapshot remains untouched
        $saleItem->refresh();
        $addonsSnapshot = $saleItem->selected_addons;
        $this->assertEquals(25.00, (float)$addonsSnapshot[0]['price']);
        $this->assertEquals(125.00, (float)$saleItem->subtotal);
    }
}
