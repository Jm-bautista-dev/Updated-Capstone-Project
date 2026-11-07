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
use App\Services\InventoryExpirationService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RestockExpirationValidationTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public $admin;
    public $perishableIngredient;
    public $nonPerishableIngredient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
            'branch_id' => $this->branch->id,
        ]);

        $this->perishableIngredient = Ingredient::create([
            'name' => 'Fresh Breaded Chicken',
            'unit' => 'g',
            'category' => 'Meat',
            'branch_id' => $this->branch->id,
            'requires_expiration_tracking' => true,
            'default_expiry_days' => null, // Explicitly no default expiry days to test strict validation
        ]);

        $this->nonPerishableIngredient = Ingredient::create([
            'name' => 'Soy Sauce Jug',
            'unit' => 'ml',
            'category' => 'Condiments',
            'branch_id' => $this->branch->id,
            'requires_expiration_tracking' => false,
            'default_expiry_days' => null,
        ]);

        // Update initial stock config
        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->perishableIngredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 0, 'total_stock_value' => 0]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->nonPerishableIngredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 0, 'total_stock_value' => 0]
        );
    }

    /**
     * Test 1: Past expiration date (yesterday) is rejected with 422 and exact error message.
     */
    public function test_restocking_with_yesterday_expiration_date_is_rejected(): void
    {
        $todayManila = Carbon::now('Asia/Manila');
        $yesterday = $todayManila->copy()->subDay()->format('Y-m-d');

        $response = $this->actingAs($this->admin)->postJson('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 500,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $yesterday,
            'purchase_price' => 250,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['expiration_date']);

        $errorMsg = $response->json('errors.expiration_date.0');
        $this->assertEquals(
            InventoryExpirationService::EXPIRED_DATE_ERROR_MESSAGE,
            $errorMsg
        );

        // Ensure 0 batches created and 0 stock added
        $this->assertEquals(0, IngredientBatch::count());
        $stock = IngredientStock::where('ingredient_id', $this->perishableIngredient->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals(0, $stock);
    }

    /**
     * Test 2: Past expiration date (several days ago / last month) is rejected.
     */
    public function test_restocking_with_last_month_expiration_date_is_rejected(): void
    {
        $lastMonth = Carbon::now('Asia/Manila')->subMonth()->format('Y-m-d');

        $response = $this->actingAs($this->admin)->postJson('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 1000,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $lastMonth,
            'purchase_price' => 500,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['expiration_date']);
        $this->assertEquals(0, IngredientBatch::count());
    }

    /**
     * Test 3: Today's date is allowed under same-day operational policy.
     */
    public function test_restocking_with_todays_expiration_date_is_allowed(): void
    {
        $today = Carbon::now('Asia/Manila')->format('Y-m-d');

        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 800,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $today,
            'purchase_price' => 400,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals(1, IngredientBatch::count());

        $batch = IngredientBatch::first();
        $this->assertEquals(800, $batch->current_quantity);
        $this->assertEquals($today, $batch->expiration_date->format('Y-m-d'));
        $this->assertEquals('available', $batch->status);

        $stock = IngredientStock::where('ingredient_id', $this->perishableIngredient->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals(800, $stock);
    }

    /**
     * Test 4: Tomorrow / future expiration date is allowed.
     */
    public function test_restocking_with_future_expiration_date_is_allowed(): void
    {
        $tomorrow = Carbon::now('Asia/Manila')->addDay()->format('Y-m-d');

        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 1500,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $tomorrow,
            'purchase_price' => 750,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals(1, IngredientBatch::count());
        $this->assertEquals(1500, IngredientBatch::first()->current_quantity);
    }

    /**
     * Test 5: Missing expiration date on perishable ingredient without default expiry days is rejected.
     */
    public function test_missing_expiration_date_on_perishable_ingredient_is_rejected(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 500,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => null,
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['expiration_date']);
        $this->assertEquals(0, IngredientBatch::count());
    }

    /**
     * Test 6: Non-perishable policy ('none') is allowed without an expiration date.
     */
    public function test_non_perishable_ingredient_without_expiration_date_is_allowed(): void
    {
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->nonPerishableIngredient->id,
            'quantity' => 2000,
            'unit' => 'ml',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'none',
            'expiration_date' => null,
            'purchase_price' => 200,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals(1, IngredientBatch::count());
        $batch = IngredientBatch::first();
        $this->assertNull($batch->expiration_date);
        $this->assertEquals(2000, $batch->current_quantity);
    }

    /**
     * Test 7: Ingredient that already has an older expired batch can still receive a fresh valid batch.
     * The new valid batch increases usable stock, while the old expired batch remains untouched/quarantined.
     */
    public function test_ingredient_with_existing_expired_batch_can_receive_fresh_valid_batch(): void
    {
        $batchService = app(\App\Services\InventoryBatchService::class);

        // Pre-create an expired batch from 3 days ago
        $expiredDate = Carbon::now('Asia/Manila')->subDays(3)->format('Y-m-d');
        $oldBatch = IngredientBatch::create([
            'ingredient_id' => $this->perishableIngredient->id,
            'branch_id' => $this->branch->id,
            'batch_code' => 'BATCH-OLD-EXPIRED',
            'initial_quantity' => 400,
            'current_quantity' => 400,
            'unit' => 'g',
            'cost_per_unit' => 0.50,
            'expiration_date' => $expiredDate,
            'status' => 'expired',
            'received_at' => Carbon::now('Asia/Manila')->subDays(10),
        ]);

        // Prior usable stock is 0
        $this->assertEquals(0, $batchService->getAvailableEligibleStock($this->perishableIngredient->id, $this->branch->id));

        // Now restock with a fresh valid batch expiring next week
        $validDate = Carbon::now('Asia/Manila')->addDays(7)->format('Y-m-d');
        $response = $this->actingAs($this->admin)->post('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 600,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $validDate,
            'purchase_price' => 300,
        ]);

        $response->assertSessionHasNoErrors();

        // 2 batches now exist
        $this->assertEquals(2, IngredientBatch::count());

        // Old batch remains expired
        $oldBatchFresh = $oldBatch->fresh();
        $this->assertEquals('expired', $oldBatchFresh->status);
        $this->assertEquals(400, $oldBatchFresh->current_quantity);

        // New batch is available
        $newBatch = IngredientBatch::where('batch_code', '!=', 'BATCH-OLD-EXPIRED')->first();
        $this->assertEquals('available', $newBatch->status);
        $this->assertEquals(600, $newBatch->current_quantity);

        // Usable stock is exactly 600 (fresh batch only)
        $this->assertEquals(600, $batchService->getAvailableEligibleStock($this->perishableIngredient->id, $this->branch->id));
    }

    /**
     * Test 8: Ingredient with existing expired batch cannot receive another expired batch.
     */
    public function test_ingredient_with_existing_expired_batch_cannot_receive_another_expired_batch(): void
    {
        // Pre-create an expired batch
        IngredientBatch::create([
            'ingredient_id' => $this->perishableIngredient->id,
            'branch_id' => $this->branch->id,
            'batch_code' => 'BATCH-OLD-EXPIRED',
            'initial_quantity' => 400,
            'current_quantity' => 400,
            'unit' => 'g',
            'cost_per_unit' => 0.50,
            'expiration_date' => Carbon::now('Asia/Manila')->subDays(3)->format('Y-m-d'),
            'status' => 'expired',
            'received_at' => Carbon::now('Asia/Manila')->subDays(10),
        ]);

        $yesterday = Carbon::now('Asia/Manila')->subDay()->format('Y-m-d');

        $response = $this->actingAs($this->admin)->postJson('/inventory/stock-in', [
            'type' => 'ingredient',
            'id' => $this->perishableIngredient->id,
            'quantity' => 300,
            'unit' => 'g',
            'branch_id' => $this->branch->id,
            'expiration_type' => 'use_by',
            'expiration_date' => $yesterday,
        ]);

        $response->assertStatus(422);
        $this->assertEquals(1, IngredientBatch::count()); // Still only the 1 pre-existing batch
    }

    /**
     * Test 9: Mass restock with one expired item rejects cleanly with zero partial stock updates.
     */
    public function test_mass_restock_with_expired_item_is_atomic_and_rejects_all(): void
    {
        $validDate = Carbon::now('Asia/Manila')->addDays(5)->format('Y-m-d');
        $expiredDate = Carbon::now('Asia/Manila')->subDays(2)->format('Y-m-d');

        $response = $this->actingAs($this->admin)->postJson('/inventory/mass-stock-in', [
            'branch_id' => $this->branch->id,
            'items' => [
                [
                    'id' => $this->nonPerishableIngredient->id,
                    'type' => 'ingredient',
                    'quantity' => 500,
                    'unit' => 'ml',
                    'purchase_price' => 50,
                    'expiration_date' => $validDate,
                ],
                [
                    'id' => $this->perishableIngredient->id,
                    'type' => 'ingredient',
                    'quantity' => 1000,
                    'unit' => 'g',
                    'purchase_price' => 500,
                    'expiration_date' => $expiredDate, // Expired!
                ],
            ],
        ]);

        $response->assertStatus(422);

        // Entire transaction must be aborted: 0 batches created
        $this->assertEquals(0, IngredientBatch::count());

        // Both ingredient stocks must remain at 0
        $this->assertEquals(
            0,
            IngredientStock::where('ingredient_id', $this->perishableIngredient->id)->value('stock')
        );
        $this->assertEquals(
            0,
            IngredientStock::where('ingredient_id', $this->nonPerishableIngredient->id)->value('stock')
        );
    }

    /**
     * Test 10: Product page restock API with expired date returns 422 validation response.
     */
    public function test_product_page_restock_api_with_expired_date_returns_422(): void
    {
        $category = Category::create(['name' => 'Rolls']);
        $product = Product::create([
            'name' => 'Chicken Teriyaki Roll',
            'category_id' => $category->id,
            'price' => 120,
            'selling_price' => 120,
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $product->ingredients()->attach($this->perishableIngredient->id, [
            'quantity_required' => 50,
            'unit' => 'g',
        ]);

        $expiredDate = Carbon::now('Asia/Manila')->subDays(4)->format('Y-m-d');

        $response = $this->actingAs($this->admin)->postJson("/products/{$product->id}/restock-ingredients", [
            'branch_id' => $this->branch->id,
            'items' => [
                [
                    'ingredient_id' => $this->perishableIngredient->id,
                    'included' => true,
                    'quantity' => 700,
                    'unit' => 'g',
                    'unit_cost' => 0.50,
                    'purchase_price' => 350,
                    'expiration_type' => 'use_by',
                    'expiration_date' => $expiredDate,
                ],
            ],
        ]);

        $response->assertStatus(422);

        $errors = $response->json('errors');
        $error = $errors['items.0.expiration_date'] ?? null;
        if (is_array($error)) {
            $error = $error[0];
        }
        $this->assertEquals(
            InventoryExpirationService::EXPIRED_DATE_ERROR_MESSAGE,
            $error
        );

        $this->assertEquals(0, IngredientBatch::count());
    }

    /**
     * Test 11: Domain service guard directly throws InvalidArgumentException if bypassed.
     */
    public function test_inventory_batch_service_throws_exception_on_expired_date(): void
    {
        $batchService = app(\App\Services\InventoryBatchService::class);
        $yesterday = Carbon::now('Asia/Manila')->subDay()->format('Y-m-d');

        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage(InventoryExpirationService::EXPIRED_DATE_ERROR_MESSAGE);

        $batchService->stockInBatch([
            'ingredient_id' => $this->perishableIngredient->id,
            'branch_id' => $this->branch->id,
            'quantity' => 500,
            'unit' => 'g',
            'purchase_price' => 250,
            'expiration_date' => $yesterday,
            'expiration_type' => 'use_by',
        ], $this->admin->id);
    }
}
