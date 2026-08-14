<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\User;
use App\Models\Product;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use Illuminate\Support\Str;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Test Branch',
            'address' => '123 Test St',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
            'has_internal_riders' => true,
            'base_delivery_fee' => 49.00,
            'per_km_fee' => 15.00,
        ]);

        $this->user = User::factory()->create([
            'branch_id' => $this->branch->id,
            'role' => 'staff',
        ]);

        $this->category = Category::create([
            'name' => 'Beverages',
        ]);
    }

    public function test_can_sync_a_batch_of_operations_including_sales_and_restocks()
    {
        // Create direct stock product
        $product = Product::create([
            'name' => 'Burger',
            'sku' => 'BUG-1',
            'selling_price' => 120,
            'cost_price' => 60,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'type' => 'solid',
            'stock' => 50,
            'barcode' => '888000000001',
        ]);

        $clientOpId1 = (string) Str::uuid();
        $clientOpId2 = (string) Str::uuid();

        $operations = [
            [
                'id' => $clientOpId1,
                'type' => 'SALE',
                'payload' => [
                    'type' => 'dine-in',
                    'branch_id' => $this->branch->id,
                    'items' => [
                        [
                            'id' => $product->id,
                            'quantity' => 2,
                        ]
                    ],
                    'total' => 240,
                    'payment_method' => 'card', // card bypasses shift checks
                    'paid_amount' => 240,
                    'change_amount' => 0,
                ]
            ],
            [
                'id' => $clientOpId2,
                'type' => 'RESTOCK',
                'payload' => [
                    'branch_id' => $this->branch->id,
                    'item_type' => 'product',
                    'item_id' => $product->id,
                    'quantity' => 10,
                    'unit' => 'pcs',
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/sync', ['operations' => $operations]);

        $response->assertOk()
            ->assertJsonCount(2, 'synced')
            ->assertJsonCount(0, 'conflicts');

        // Assert Sale and RestockRequest exist in database
        $this->assertDatabaseHas('sales', [
            'branch_id' => $this->branch->id,
            'total' => 240,
        ]);

        $this->assertDatabaseHas('restock_requests', [
            'branch_id' => $this->branch->id,
            'item_id' => $product->id,
            'quantity' => 10,
        ]);

        $this->assertDatabaseHas('synced_operations', [
            'client_op_id' => $clientOpId1,
            'status' => 'success',
        ]);
    }

    public function test_returns_conflict_when_product_stock_is_insufficient()
    {
        // Create product with recipe
        $product = Product::create([
            'name' => 'Steamed Buns',
            'sku' => 'SB-1',
            'selling_price' => 50,
            'cost_price' => 20,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'type' => 'solid',
            'stock' => 0,
            'barcode' => '888000000002',
        ]);

        // Recipe ingredient
        $ingredient = Ingredient::create([
            'name' => 'Flour',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);
        
        $product->ingredients()->attach($ingredient->id, [
            'quantity_required' => 100,
            'unit' => 'g',
        ]);

        // Update auto-created ingredient stock to a low level
        IngredientStock::where([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branch->id
        ])->update(['stock' => 50]); // needs 100 per unit, so 50 is insufficient

        $clientOpId = (string) Str::uuid();

        $operations = [
            [
                'id' => $clientOpId,
                'type' => 'SALE',
                'payload' => [
                    'type' => 'dine-in',
                    'branch_id' => $this->branch->id,
                    'items' => [
                        [
                            'id' => $product->id,
                            'quantity' => 1,
                        ]
                    ],
                    'total' => 50,
                    'payment_method' => 'card',
                    'paid_amount' => 50,
                    'change_amount' => 0,
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/sync', ['operations' => $operations]);

        $response->assertOk()
            ->assertJsonCount(0, 'synced')
            ->assertJsonCount(1, 'conflicts')
            ->assertJsonPath('conflicts.0.reason', 'INSUFFICIENT_STOCK');
    }

    public function test_bypasses_stock_checks_when_override_force_flag_is_true()
    {
        $product = Product::create([
            'name' => 'Steamed Buns 2',
            'sku' => 'SB-2',
            'selling_price' => 50,
            'cost_price' => 20,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'type' => 'solid',
            'stock' => 0,
            'barcode' => '888000000003',
        ]);

        $ingredient = Ingredient::create([
            'name' => 'Sugar',
            'unit' => 'g',
            'cost_per_base_unit' => 0.05,
        ]);
        
        $product->ingredients()->attach($ingredient->id, [
            'quantity_required' => 10,
            'unit' => 'g',
        ]);

        // Update auto-created stock row to low level
        IngredientStock::where([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branch->id
        ])->update(['stock' => 2]); // needs 10, so 2 is insufficient

        $clientOpId = (string) Str::uuid();

        $operations = [
            [
                'id' => $clientOpId,
                'type' => 'SALE',
                'payload' => [
                    'type' => 'dine-in',
                    'branch_id' => $this->branch->id,
                    'items' => [
                        [
                            'id' => $product->id,
                            'quantity' => 1,
                        ]
                    ],
                    'total' => 50,
                    'payment_method' => 'card',
                    'paid_amount' => 50,
                    'change_amount' => 0,
                    'force' => true, // Force override flag!
                ]
            ]
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/sync', ['operations' => $operations]);

        $response->assertOk()
            ->assertJsonCount(1, 'synced')
            ->assertJsonCount(0, 'conflicts');

        // Verify stock is now reduced even into negative values
        $stock = IngredientStock::where([
            'ingredient_id' => $ingredient->id,
            'branch_id' => $this->branch->id
        ])->first();
        $this->assertEquals(-8.0, (float) $stock->stock);
    }
}
