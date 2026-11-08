<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientBatch;
use App\Models\User;
use App\Services\SaleService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PosManualQuantityCartValidationTest extends TestCase
{
    use RefreshDatabase;

    public $branchA;
    public $branchB;
    public $cashierA;
    public $category;
    public $productDirect;
    public $productRecipe;
    public $chickenIngredient;

    protected function setUp(): void
    {
        parent::setUp();

        // Create branches
        $this->branchA = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->branchB = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.7000,
            'longitude' => 121.0000,
            'delivery_radius_km' => 10,
        ]);

        // Cashier for branch A
        $this->cashierA = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchA->id,
            'must_change_password' => false,
        ]);

        $this->category = Category::create([
            'name' => 'Main Dishes',
            'branch_id' => $this->branchA->id,
        ]);

        // Direct-stock product (no recipe)
        $this->productDirect = Product::create([
            'name' => 'Bottled Water',
            'sku' => 'DRK-001',
            'category_id' => $this->category->id,
            'branch_id' => $this->branchA->id,
            'selling_price' => 25.00,
            'stock' => 50,
            'status' => 'in_stock',
        ]);

        DB::table('branch_product')->insert([
            'branch_id' => $this->branchA->id,
            'product_id' => $this->productDirect->id,
            'stock' => 50,
            'is_active' => 1,
        ]);

        // Recipe-based product
        $this->productRecipe = Product::create([
            'name' => 'Chicken Teriyaki Bento',
            'sku' => 'BEN-001',
            'category_id' => $this->category->id,
            'branch_id' => $this->branchA->id,
            'selling_price' => 150.00,
            'stock' => 999, // dynamic availability will override this
            'status' => 'in_stock',
        ]);

        // Ingredient: Breaded Chicken (1 serving requires 100g)
        $this->chickenIngredient = Ingredient::create([
            'name' => 'Breaded Chicken',
            'unit' => 'g',
            'requires_expiration_tracking' => true,
        ]);

        $this->productRecipe->ingredients()->attach($this->chickenIngredient->id, [
            'quantity_required' => 100, // 100g per bento
            'unit' => 'g',
        ]);
    }

    /**
     * Test A: Valid manual quantity in cart passes server validation.
     */
    public function test_valid_manual_quantity_passes_cart_validation(): void
    {
        $this->actingAs($this->cashierA);

        $response = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 25,
                ],
            ],
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'valid' => true,
        ]);
    }

    /**
     * Test B: Quantity exceeding direct stock is rejected.
     */
    public function test_quantity_exceeding_direct_stock_is_rejected(): void
    {
        $this->actingAs($this->cashierA);

        // Direct stock is 50, request 51
        $response = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 51,
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'valid' => false,
        ]);
        $this->assertStringContainsString('50', $response->json('message'));
    }

    /**
     * Test C: Recipe ingredient availability rejects quantities exceeding producible servings.
     */
    public function test_recipe_ingredient_availability_rejects_exceeding_producible_servings(): void
    {
        $this->actingAs($this->cashierA);

        // Stock 500g of chicken = exactly 5 servings (100g each)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->chickenIngredient->id, 'branch_id' => $this->branchA->id],
            ['stock' => 500]
        );

        IngredientBatch::create([
            'ingredient_id' => $this->chickenIngredient->id,
            'branch_id' => $this->branchA->id,
            'batch_code' => 'BATCH-TEST-001',
            'received_at' => Carbon::now(),
            'initial_quantity' => 500,
            'current_quantity' => 500,
            'unit' => 'g',
            'expiration_date' => Carbon::now()->addDays(5)->toDateString(),
            'status' => 'available',
        ]);

        // Request 5 servings -> Should succeed
        $responseValid = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productRecipe->id,
                    'quantity' => 5,
                ],
            ],
        ]);

        $responseValid->assertStatus(200);
        $responseValid->assertJson(['valid' => true]);

        // Request 6 servings -> Should be rejected
        $responseInvalid = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productRecipe->id,
                    'quantity' => 6,
                ],
            ],
        ]);

        $responseInvalid->assertStatus(422);
        $responseInvalid->assertJson(['valid' => false]);
        $this->assertStringContainsString('Breaded Chicken', $responseInvalid->json('message'));
        $this->assertStringContainsString('5 servings', $responseInvalid->json('message'));
    }

    /**
     * Test D: Multiple cart lines for same product collectively exceeding available stock are rejected.
     */
    public function test_multiple_cart_lines_for_same_product_aggregate_stock_check(): void
    {
        $this->actingAs($this->cashierA);

        // Direct stock is 50
        // Line 1: qty 30, Line 2: qty 25 -> Total 55 > 50
        $response = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 30,
                    'notes' => 'Cold',
                ],
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 25,
                    'notes' => 'Room temperature',
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['valid' => false]);
        $this->assertStringContainsString('Total quantity for Bottled Water in cart is 55, but only 50', $response->json('message'));
    }

    /**
     * Test E: Expired ingredient batches are excluded from availability calculation.
     */
    public function test_expired_ingredient_batches_are_excluded_from_availability(): void
    {
        $this->actingAs($this->cashierA);

        // 200g valid (2 servings) + 300g expired (3 servings)
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->chickenIngredient->id, 'branch_id' => $this->branchA->id],
            ['stock' => 500]
        );

        // Valid batch
        IngredientBatch::create([
            'ingredient_id' => $this->chickenIngredient->id,
            'branch_id' => $this->branchA->id,
            'batch_code' => 'BATCH-TEST-VALID',
            'received_at' => Carbon::now(),
            'initial_quantity' => 200,
            'current_quantity' => 200,
            'unit' => 'g',
            'expiration_date' => Carbon::now()->addDays(3)->toDateString(),
            'status' => 'available',
        ]);

        // Expired batch
        IngredientBatch::create([
            'ingredient_id' => $this->chickenIngredient->id,
            'branch_id' => $this->branchA->id,
            'batch_code' => 'BATCH-TEST-EXPIRED',
            'received_at' => Carbon::now()->subDays(5),
            'initial_quantity' => 300,
            'current_quantity' => 300,
            'unit' => 'g',
            'expiration_date' => Carbon::now()->subDay()->toDateString(),
            'status' => 'expired',
        ]);

        // Request 3 servings (only 2 valid available) -> should fail
        $response = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productRecipe->id,
                    'quantity' => 3,
                ],
            ],
        ]);

        $response->assertStatus(422);
        $response->assertJson(['valid' => false]);
        $this->assertStringContainsString('Breaded Chicken', $response->json('message'));
        $this->assertStringContainsString('2 servings', $response->json('message'));
    }

    /**
     * Test F: Branch isolation prevents accessing stock from another branch.
     */
    public function test_branch_isolation_in_pos_cart_validation(): void
    {
        // Product in Branch B with stock 100
        $productBranchB = Product::create([
            'name' => 'Branch B Special',
            'sku' => 'SPB-001',
            'category_id' => $this->category->id,
            'branch_id' => $this->branchB->id,
            'selling_price' => 200.00,
            'stock' => 100,
            'status' => 'in_stock',
        ]);

        $this->actingAs($this->cashierA);

        $response = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $productBranchB->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('not available in your branch', $response->json('message'));
    }

    /**
     * Test G: Invalid quantities (negative, zero, decimals) are rejected.
     */
    public function test_invalid_quantities_are_rejected(): void
    {
        $this->actingAs($this->cashierA);

        // Zero quantity
        $responseZero = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 0,
                ],
            ],
        ]);
        $responseZero->assertStatus(422);

        // Negative quantity
        $responseNegative = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => -5,
                ],
            ],
        ]);
        $responseNegative->assertStatus(422);

        // Decimal quantity
        $responseDecimal = $this->postJson(route('pos.validate-cart'), [
            'items' => [
                [
                    'id' => $this->productDirect->id,
                    'quantity' => 2.5,
                ],
            ],
        ]);
        $responseDecimal->assertStatus(422);
    }

    /**
     * Test H: Process sale directly validates and rejects overselling atomically.
     */
    public function test_sale_process_rejects_overselling_atomically(): void
    {
        $this->actingAs($this->cashierA);

        $saleService = app(SaleService::class);

        // Try to process sale with quantity 60 when direct product stock is 50
        $saleData = [
            'branch_id' => $this->branchA->id,
            'cashier_id' => $this->cashierA->id,
            'total_amount' => 1500.00,
            'payment_method' => 'gcash',
            'amount_paid' => 1500.00,
            'change' => 0,
            'status' => 'completed',
            'order_type' => 'dine_in',
            'items' => [
                [
                    'product_id' => $this->productDirect->id,
                    'quantity' => 60,
                    'unit_price' => 25.00,
                    'total_price' => 1500.00,
                ],
            ],
        ];

        $this->expectException(\Exception::class);
        $this->expectExceptionMessageMatches('/Bottled Water availability has changed/i');

        $saleService->processSale($saleData);
    }
}
