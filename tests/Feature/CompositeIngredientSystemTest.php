<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientSubrecipeItem;
use App\Models\StockLog;
use App\Models\IngredientLog;
use App\Models\User;
use App\Services\CompositeIngredientService;
use App\Services\SaleService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

class CompositeIngredientSystemTest extends TestCase
{
    use RefreshDatabase;

    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Category $testCategory;
    public User $admin;
    public User $cashierSantaCruz;
    public CompositeIngredientService $compositeService;
    public SaleService $saleService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->compositeService = app(CompositeIngredientService::class);
        $this->saleService = app(SaleService::class);

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
            'name' => 'Bento Meals',
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * TEST 1 — Standard ingredient
     * Ingredient: Tomato, Type: Standard
     * Expected: Existing behavior remains unchanged (is_composite is false by default).
     */
    public function test_1_standard_ingredient_remains_unchanged()
    {
        $tomato = Ingredient::create([
            'name' => 'Tomato',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05, // ₱50/kg => ₱0.05/g
        ]);

        $this->assertFalse((bool) $tomato->is_composite);
        $this->assertCount(0, $tomato->subrecipeItems);

        // Check stock auto-creation for all branches
        $this->assertDatabaseHas('ingredient_stocks', [
            'ingredient_id' => $tomato->id,
            'branch_id'     => $this->branchSantaCruz->id,
        ]);
        $this->assertDatabaseHas('ingredient_stocks', [
            'ingredient_id' => $tomato->id,
            'branch_id'     => $this->branchVictoria->id,
        ]);
    }

    /**
     * TEST 2 — Composite ingredient configuration & Confidentiality
     * Ingredient: Breaded Chicken, Type: Composite
     * Composition: Chicken = 100g, Vinegar = 10ml, Flour = 30g
     * Expected: Authorized user can view composition. Cashier cannot.
     */
    public function test_2_composite_ingredient_authorized_can_view_cashier_cannot()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $vinegar = Ingredient::create(['name' => 'Vinegar', 'unit' => 'ml', 'cost_per_base_unit' => 0.05]);
        $flour   = Ingredient::create(['name' => 'Flour', 'unit' => 'g', 'cost_per_base_unit' => 0.08]);

        $breadedChicken = Ingredient::create([
            'name'         => 'Breaded Chicken',
            'is_composite' => true,
            'unit'         => 'pcs',
            'cost_per_base_unit' => 0,
        ]);

        // Save sub-recipe via service
        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
            ['component_ingredient_id' => $vinegar->id, 'quantity' => 10, 'unit' => 'ml'],
            ['component_ingredient_id' => $flour->id, 'quantity' => 30, 'unit' => 'g'],
        ]);

        $breadedChicken->refresh();
        $this->assertTrue((bool) $breadedChicken->is_composite);
        $this->assertCount(3, $breadedChicken->subrecipeItems);

        // 1. Admin requests sub-recipe endpoint -> 200 OK with items
        $adminResponse = $this->actingAs($this->admin)->getJson("/admin/ingredients/{$breadedChicken->id}/subrecipe");
        $adminResponse->assertStatus(200)
            ->assertJsonPath('is_composite', true)
            ->assertJsonCount(3, 'items');

        // 2. Cashier requests sub-recipe endpoint -> 403 Forbidden
        $cashierResponse = $this->actingAs($this->cashierSantaCruz)->getJson("/admin/ingredients/{$breadedChicken->id}/subrecipe");
        $cashierResponse->assertStatus(403);

        // 3. Confidentiality check: Ingredient toArray() for Cashier omits subrecipe_items & cost_per_base_unit
        $this->actingAs($this->cashierSantaCruz);
        $cashierArray = $breadedChicken->load('subrecipeItems')->toArray();
        $this->assertArrayNotHasKey('cost_per_base_unit', $cashierArray);
        $this->assertArrayNotHasKey('subrecipe_items', $cashierArray);
        $this->assertArrayNotHasKey('subrecipeItems', $cashierArray);
    }

    /**
     * TEST 3 — Product uses composite ingredient
     * Product: Chicken Bento, Recipe: Breaded Chicken = 1 pc
     * Expected: Product recipe displays Breaded Chicken only (centralized formula).
     */
    public function test_3_product_recipe_links_to_composite_ingredient_only()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);
        
        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
        ]);

        $bento = Product::create([
            'name'          => 'Chicken Bento',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'type'          => 'menu_item',
            'status'        => 'available',
        ]);

        // Link product directly to Breaded Chicken
        $bento->ingredients()->attach($breadedChicken->id, [
            'quantity_required' => 1,
            'unit'              => 'pcs',
        ]);

        $bento->load('ingredients');
        $this->assertCount(1, $bento->ingredients);
        $this->assertEquals('Breaded Chicken', $bento->ingredients->first()->name);
    }

    /**
     * TEST 4 — Composite preparation (Batch model)
     * Prepare: 20 Breaded Chicken
     * Expected: Required micro-ingredients are calculated correctly.
     * Raw stock is deducted. Breaded Chicken stock increases by 20.
     * All changes occur in one atomic database transaction.
     */
    public function test_4_composite_batch_preparation_deducts_raw_and_increases_composite_stock()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $vinegar = Ingredient::create(['name' => 'Vinegar', 'unit' => 'ml', 'cost_per_base_unit' => 0.05]);
        $flour   = Ingredient::create(['name' => 'Flour', 'unit' => 'g', 'cost_per_base_unit' => 0.08]);

        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);

        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
            ['component_ingredient_id' => $vinegar->id, 'quantity' => 10, 'unit' => 'ml'],
            ['component_ingredient_id' => $flour->id, 'quantity' => 30, 'unit' => 'g'],
        ]);

        // Stock in Santa Cruz: 5000g Chicken, 500ml Vinegar, 2000g Flour
        IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 5000]);
        IngredientStock::where('ingredient_id', $vinegar->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 500]);
        IngredientStock::where('ingredient_id', $flour->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 2000]);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 0]);

        // Admin prepares 20 pcs Breaded Chicken in Santa Cruz
        $response = $this->actingAs($this->admin)->postJson("/admin/ingredients/{$breadedChicken->id}/prepare", [
            'batch_quantity' => 20,
            'branch_id'      => $this->branchSantaCruz->id,
        ]);

        $response->assertStatus(200)->assertJsonPath('success', true);

        // Verification:
        // Chicken: 5000 - (20 * 100) = 3000g
        // Vinegar: 500 - (20 * 10) = 300ml
        // Flour: 2000 - (20 * 30) = 1400g
        // Breaded Chicken: 0 + 20 = 20 pcs
        $this->assertEquals(3000, (float) IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(300, (float) IngredientStock::where('ingredient_id', $vinegar->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(1400, (float) IngredientStock::where('ingredient_id', $flour->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(20, (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));

        // Audit check
        $this->assertDatabaseHas('stock_logs', [
            'storable_id' => $breadedChicken->id,
            'branch_id'   => $this->branchSantaCruz->id,
            'action_type' => 'batch_production',
            'quantity'    => 20,
        ]);
    }

    /**
     * TEST 5 — Sale consumption
     * Sell: 1 Chicken Bento
     * Expected: Breaded Chicken stock decreases by 1.
     * Raw micro-ingredients are NOT double-deducted during sale.
     */
    public function test_5_sale_consumption_deducts_composite_stock_only()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);

        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
        ]);

        $bento = Product::create([
            'name'          => 'Chicken Bento',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'type'          => 'menu_item',
            'status'        => 'available',
        ]);
        $bento->ingredients()->attach($breadedChicken->id, [
            'quantity_required' => 1,
            'unit'              => 'pcs',
        ]);

        // Branch stocks: Chicken = 1000g, Breaded Chicken = 10 pcs
        IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 1000]);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 10]);

        // Process a POS sale
        $this->actingAs($this->cashierSantaCruz);
        $this->saleService->processSale([
            'type'           => 'dine-in',
            'payment_method' => 'gcash',
            'items'          => [
                [
                    'product_id' => $bento->id,
                    'quantity'   => 1,
                    'unit_price' => 150.00,
                ],
            ],
        ]);

        // Breaded Chicken stock should decrease by 1 (10 -> 9)
        $this->assertEquals(9, (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));

        // Chicken raw stock remains untouched at 1000g (no double deduction)
        $this->assertEquals(1000, (float) IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
    }

    /**
     * TEST 6 — Cashier stock adjustment
     * Current: 25 pcs, Reduce: 3 pcs
     * Expected: New stock = 22 pcs. Audit record is created.
     */
    public function test_6_cashier_stock_adjustment_creates_audit_record()
    {
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 25]);

        // Cashier manually reduces 3 pcs with reason 'damaged'
        $response = $this->actingAs($this->cashierSantaCruz)->postJson("/inventory/{$breadedChicken->id}/reduce-stock", [
            'quantity' => 3,
            'unit'     => 'pcs',
            'reason'   => 'damaged',
            'notes'    => 'Dropped on kitchen floor during lunch rush',
        ]);

        $response->assertStatus(200)->assertJsonPath('success', true);

        // New stock should be 22
        $newStock = (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock');
        $this->assertEquals(22, $newStock);

        // Audit verification
        $this->assertDatabaseHas('stock_logs', [
            'storable_id'    => $breadedChicken->id,
            'branch_id'      => $this->branchSantaCruz->id,
            'user_id'        => $this->cashierSantaCruz->id,
            'action_type'    => 'manual_reduction',
            'quantity'       => 3,
            'previous_stock' => 25,
            'new_stock'      => 22,
        ]);
        $this->assertDatabaseHas('ingredient_logs', [
            'ingredient_id' => $breadedChicken->id,
            'branch_id'     => $this->branchSantaCruz->id,
            'user_id'       => $this->cashierSantaCruz->id,
            'change_qty'    => -3,
        ]);
    }

    /**
     * TEST 7 — Unauthorized access
     * Login as cashier.
     * Expected: No confidential micro-ingredient names, quantities, costs, or formulas are returned.
     */
    public function test_7_cashier_cannot_access_or_receive_confidential_subrecipe_data()
    {
        $chicken = Ingredient::create(['name' => 'Secret Seasoned Chicken', 'unit' => 'g', 'cost_per_base_unit' => 0.50]);
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);

        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 150, 'unit' => 'g'],
        ]);

        // 1. Attempt to call subrecipe endpoint as cashier -> 403 Forbidden
        $response = $this->actingAs($this->cashierSantaCruz)->getJson("/admin/ingredients/{$breadedChicken->id}/subrecipe");
        $response->assertStatus(403);

        // 2. Attempt to save subrecipe as cashier -> 403 Forbidden
        $saveResponse = $this->actingAs($this->cashierSantaCruz)->postJson("/admin/ingredients/{$breadedChicken->id}/subrecipe", [
            'items' => [['component_ingredient_id' => $chicken->id, 'quantity' => 200, 'unit' => 'g']],
        ]);
        $saveResponse->assertStatus(403);

        // 3. Attempt to trigger batch preparation as cashier -> 403 Forbidden
        $prepResponse = $this->actingAs($this->cashierSantaCruz)->postJson("/admin/ingredients/{$breadedChicken->id}/prepare", [
            'batch_quantity' => 10,
            'branch_id'      => $this->branchSantaCruz->id,
        ]);
        $prepResponse->assertStatus(403);
    }

    /**
     * TEST 8 — Insufficient raw material safety
     * Attempt to prepare: 20 Breaded Chicken, but insufficient Chicken inventory exists.
     * Expected: Preparation fails safely. No partial inventory changes occur.
     */
    public function test_8_insufficient_raw_material_fails_safely_with_zero_partial_deductions()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $flour   = Ingredient::create(['name' => 'Flour', 'unit' => 'g', 'cost_per_base_unit' => 0.08]);
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);

        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
            ['component_ingredient_id' => $flour->id, 'quantity' => 30, 'unit' => 'g'],
        ]);

        // Santa Cruz has 500g Flour (enough for 16 pcs), but only 500g Chicken (needs 2000g for 20 pcs)
        IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 500]);
        IngredientStock::where('ingredient_id', $flour->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 1000]);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 0]);

        $response = $this->actingAs($this->admin)->postJson("/admin/ingredients/{$breadedChicken->id}/prepare", [
            'batch_quantity' => 20,
            'branch_id'      => $this->branchSantaCruz->id,
        ]);

        // Must fail with validation error
        $response->assertStatus(422);

        // Verify NO stock was deducted (atomic rollback)
        $this->assertEquals(500, (float) IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(1000, (float) IngredientStock::where('ingredient_id', $flour->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(0, (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
    }

    /**
     * TEST 9 — Circular dependency prevention
     * Attempt: Breaded Chicken -> Marinade, Marinade -> Breaded Chicken
     * Expected: System rejects configuration with validation exception.
     */
    public function test_9_circular_dependency_is_rejected()
    {
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);
        $marinade       = Ingredient::create(['name' => 'Special Marinade', 'is_composite' => true, 'unit' => 'ml']);
        $soySauce       = Ingredient::create(['name' => 'Soy Sauce', 'unit' => 'ml']);

        // Step 1: Marinade uses Soy Sauce
        $this->compositeService->saveSubrecipe($marinade, [
            ['component_ingredient_id' => $soySauce->id, 'quantity' => 50, 'unit' => 'ml'],
        ]);

        // Step 2: Breaded Chicken uses Marinade
        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $marinade->id, 'quantity' => 20, 'unit' => 'ml'],
        ]);

        // Step 3: Now attempt to make Marinade use Breaded Chicken (Marinade -> Breaded Chicken -> Marinade)
        $this->expectException(ValidationException::class);
        $this->compositeService->saveSubrecipe($marinade, [
            ['component_ingredient_id' => $breadedChicken->id, 'quantity' => 1, 'unit' => 'pcs'],
        ]);
    }

    /**
     * TEST 10 — Branch isolation
     * Prepare/adjust Breaded Chicken in Victoria.
     * Expected: Santa Cruz stock is completely unaffected.
     */
    public function test_10_branch_isolation_during_composite_operations()
    {
        $chicken = Ingredient::create(['name' => 'Chicken Meat', 'unit' => 'g', 'cost_per_base_unit' => 0.20]);
        $breadedChicken = Ingredient::create(['name' => 'Breaded Chicken', 'is_composite' => true, 'unit' => 'pcs']);

        $this->compositeService->saveSubrecipe($breadedChicken, [
            ['component_ingredient_id' => $chicken->id, 'quantity' => 100, 'unit' => 'g'],
        ]);

        // Initial Stocks:
        // Santa Cruz: Chicken = 5000g, Breaded Chicken = 10 pcs
        // Victoria: Chicken = 5000g, Breaded Chicken = 0 pcs
        IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 5000]);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->update(['stock' => 10]);

        IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchVictoria->id)->update(['stock' => 5000]);
        IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchVictoria->id)->update(['stock' => 0]);

        // Admin prepares 15 pcs in Victoria
        $this->actingAs($this->admin)->postJson("/admin/ingredients/{$breadedChicken->id}/prepare", [
            'batch_quantity' => 15,
            'branch_id'      => $this->branchVictoria->id,
        ]);

        // Victoria: Chicken = 3500g, Breaded Chicken = 15 pcs
        $this->assertEquals(3500, (float) IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchVictoria->id)->value('stock'));
        $this->assertEquals(15, (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchVictoria->id)->value('stock'));

        // Santa Cruz: Chicken still 5000g, Breaded Chicken still 10 pcs (completely unaffected)
        $this->assertEquals(5000, (float) IngredientStock::where('ingredient_id', $chicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
        $this->assertEquals(10, (float) IngredientStock::where('ingredient_id', $breadedChicken->id)->where('branch_id', $this->branchSantaCruz->id)->value('stock'));
    }
}
