<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Product;
use App\Models\ScannedReceipt;
use App\Models\Supplier;
use App\Models\User;
use App\Services\OcrService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Mockery;
use Tests\TestCase;

class AiReceiptRestockScannerTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $admin;
    protected User $cashierVictoria;
    protected Ingredient $tomato;
    protected Ingredient $sugar;
    protected Ingredient $egg;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->victoria = Branch::create(['name' => 'Victoria Branch', 'address' => 'Victoria, Laguna']);
        $this->santaCruz = Branch::create(['name' => 'Santa Cruz Branch', 'address' => 'Santa Cruz, Laguna']);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->tomato = Ingredient::create([
            'name'               => 'Tomato',
            'unit'               => 'kg',
            'cost_per_base_unit' => 10.0,
        ]);

        $this->sugar = Ingredient::create([
            'name'               => 'Sugar',
            'unit'               => 'kg',
            'cost_per_base_unit' => 24.0,
        ]);

        $this->egg = Ingredient::create([
            'name'               => 'Egg',
            'unit'               => 'pcs',
            'cost_per_base_unit' => 10.0,
        ]);

        $this->supplier = Supplier::create([
            'name'      => 'ABC Food Supplier',
            'branch_id' => $this->victoria->id,
            'status'    => 'active',
        ]);
    }

    /**
     * TEST 1 — SIMPLE RECEIPT
     */
    public function test_simple_receipt_stock_in(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("ABC Food Supplier\nInvoice: INV-1001\nDate: 2026-08-18\n100 kg Tomato @ 10.00 = 1000.00\nTotal: 1000.00");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_simple.jpg', 200, 'image/jpeg');

        // 1. Upload
        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $uploadRes->assertOk()->assertJsonPath('success', true);
        $receiptId = $uploadRes->json('receipt_id');

        // 2. Process / Draft Review
        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('supplier_name', 'ABC Food Supplier')
            ->assertJsonPath('invoice_number', 'INV-1001');

        $items = $processRes->json('items');
        $this->assertCount(1, $items);
        $this->assertEquals($this->tomato->id, $items[0]['suggested_ingredient_id']);
        $this->assertEquals('HIGH', $items[0]['confidence_tier']);

        // 3. Confirm Stock-In
        $confirmRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'     => $this->victoria->id,
            'receipt_id'    => $receiptId,
            'supplier_name' => 'ABC Food Supplier',
            'invoice_number'=> 'INV-1001',
            'items'         => [
                [
                    'ingredient_id'  => $this->tomato->id,
                    'quantity'       => 100,
                    'unit'           => 'kg',
                    'purchase_price' => 1000.00,
                ],
            ],
        ]);
        $confirmRes->assertOk()->assertJsonPath('success', true);

        // Verify Database
        $stock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->victoria->id)
            ->first();

        $this->assertNotNull($stock);
        // Base unit for kg is g (100,000 g)
        $this->assertEquals(100000.0, (float) $stock->stock);
        $this->assertEquals(1000.00, (float) $stock->total_stock_value);
    }

    /**
     * TEST 2 — MULTIPLE ITEMS
     */
    public function test_multiple_items_stock_in(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("ABC Food Supplier\nInvoice: INV-1002\n100 kg Tomato 1000\n25 kg Sugar 600\n100 pcs Egg 1000\nTotal: 2600.00");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_multi.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $uploadRes->assertOk();
        $receiptId = $uploadRes->json('receipt_id');

        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk();

        $confirmRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'  => $this->victoria->id,
            'receipt_id' => $receiptId,
            'items'      => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 100, 'unit' => 'kg', 'purchase_price' => 1000.00],
                ['ingredient_id' => $this->sugar->id, 'quantity' => 25, 'unit' => 'kg', 'purchase_price' => 600.00],
                ['ingredient_id' => $this->egg->id, 'quantity' => 100, 'unit' => 'pcs', 'purchase_price' => 1000.00],
            ],
        ]);
        $confirmRes->assertOk();

        $this->assertDatabaseHas('ingredient_stocks', [
            'ingredient_id' => $this->tomato->id,
            'branch_id'     => $this->victoria->id,
            'stock'         => 100000.0,
        ]);
        $this->assertDatabaseHas('ingredient_stocks', [
            'ingredient_id' => $this->sugar->id,
            'branch_id'     => $this->victoria->id,
            'stock'         => 25000.0,
        ]);
        $this->assertDatabaseHas('ingredient_stocks', [
            'ingredient_id' => $this->egg->id,
            'branch_id'     => $this->victoria->id,
            'stock'         => 100.0,
        ]);
    }

    /**
     * TEST 3 — UNIT CONVERSION (500 g -> 0.5 kg)
     */
    public function test_unit_conversion_normalization(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("ABC Food Supplier\n500 g Tomato\nTotal: 50.00");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_unit.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $receiptId = $uploadRes->json('receipt_id');

        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk();

        // 500g normalized to base quantity (500g)
        $items = $processRes->json('items');
        $this->assertEquals(500.0, $items[0]['normalized_quantity']);

        // Stock in 500g
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'  => $this->victoria->id,
            'receipt_id' => $receiptId,
            'items'      => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 500, 'unit' => 'g', 'purchase_price' => 50.00],
            ],
        ])->assertOk();

        $stock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->victoria->id)
            ->first();
        $this->assertEquals(500.0, (float) $stock->stock);
    }

    /**
     * TEST 4 — COUNT UNIT (100 pcs Egg)
     */
    public function test_count_unit_pcs(): void
    {
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'  => $this->victoria->id,
            'items'      => [
                ['ingredient_id' => $this->egg->id, 'quantity' => 100, 'unit' => 'pcs', 'purchase_price' => 1000.00],
            ],
        ])->assertOk();

        $stock = IngredientStock::where('ingredient_id', $this->egg->id)
            ->where('branch_id', $this->victoria->id)
            ->first();
        $this->assertEquals(100.0, (float) $stock->stock);
    }

    /**
     * TEST 5 — ARITHMETIC MISMATCH FLAGGED
     */
    public function test_arithmetic_mismatch_flagged(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("100 kg Tomato @ 10.00 = 5000.00\nTotal: 5000.00");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_mismatch.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $receiptId = $uploadRes->json('receipt_id');

        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk();

        $items = $processRes->json('items');
        $this->assertFalse($items[0]['is_arithmetic_consistent']);
        $this->assertNotNull($items[0]['arithmetic_warning']);
        $this->assertTrue($items[0]['needs_review']);
    }

    /**
     * TEST 6 — DUPLICATE RECEIPT WARNING
     */
    public function test_duplicate_receipt_warning(): void
    {
        $content = "ABC Food Supplier\nInvoice: INV-DUP-1\nDate: 2026-08-18\n100 kg Tomato 1000\nTotal: 1000";

        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn($content);
        $this->app->instance(OcrService::class, $mockOcr);

        // Upload and complete Receipt #1
        $file1 = UploadedFile::fake()->create('receipt1.jpg', 200, 'image/jpeg');
        $upload1 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file1,
            'branch_id' => $this->victoria->id,
        ]);
        $id1 = $upload1->json('receipt_id');

        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', ['receipt_id' => $id1]);
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'     => $this->victoria->id,
            'receipt_id'    => $id1,
            'supplier_name' => 'ABC Food Supplier',
            'invoice_number'=> 'INV-DUP-1',
            'items'         => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 100, 'unit' => 'kg', 'purchase_price' => 1000],
            ],
        ])->assertOk();

        // Upload another receipt with the same invoice and supplier
        $file2 = UploadedFile::fake()->create('receipt2.jpg', 200, 'image/jpeg');
        $upload2 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file2,
            'branch_id' => $this->victoria->id,
        ]);
        $id2 = $upload2->json('receipt_id');

        $process2 = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', ['receipt_id' => $id2]);
        $process2->assertOk()
            ->assertJsonPath('is_duplicate_warning', true)
            ->assertJsonPath('duplicate_matched_id', $id1);
    }

    /**
     * TEST 7 — UNKNOWN INGREDIENT
     */
    public function test_unknown_ingredient_flags_review(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("10 kg Exotic Dragon Fruit\nTotal: 500");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_unknown.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $receiptId = $uploadRes->json('receipt_id');

        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk();

        $items = $processRes->json('items');
        $this->assertEquals('LOW', $items[0]['confidence_tier']);
        $this->assertTrue($items[0]['needs_review']);
    }

    /**
     * TEST 8 — LOW CONFIDENCE OCR
     */
    public function test_low_confidence_ocr_flags_needs_review(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("5 kg Tommtoes\nTotal: 50");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_fuzzy.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $receiptId = $uploadRes->json('receipt_id');

        $processRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', [
            'receipt_id' => $receiptId,
        ]);
        $processRes->assertOk();

        $items = $processRes->json('items');
        $this->assertEquals($this->tomato->id, $items[0]['suggested_ingredient_id']);
    }

    /**
     * TEST 9 — BRANCH ISOLATION
     */
    public function test_branch_stock_isolation(): void
    {
        // Stock in 50 kg Tomato to Victoria
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'  => $this->victoria->id,
            'items'      => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 50, 'unit' => 'kg', 'purchase_price' => 500],
            ],
        ])->assertOk();

        $vicStock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->victoria->id)
            ->first();
        $this->assertEquals(50000.0, (float) $vicStock->stock);

        $scStock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->santaCruz->id)
            ->first();
        $this->assertEquals(0.0, (float) ($scStock ? $scStock->stock : 0));
    }

    /**
     * TEST 10 — ATOMIC FAILURE ROLLBACK
     */
    public function test_atomic_transaction_rollback_on_failure(): void
    {
        // Attempt stock-in where second item has non-existent ingredient ID
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id' => $this->victoria->id,
            'items'     => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 50, 'unit' => 'kg', 'purchase_price' => 500],
                ['ingredient_id' => 99999, 'quantity' => 10, 'unit' => 'kg', 'purchase_price' => 100],
            ],
        ]);

        $response->assertStatus(422);

        // Assert Tomato stock was NOT modified or incremented
        $vicStock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->victoria->id)
            ->first();
        $this->assertEquals(0.0, (float) ($vicStock ? $vicStock->stock : 0));
    }

    /**
     * TEST 11 — MANUAL OVERRIDE & AUDIT TRAIL
     */
    public function test_manual_override_audit_trail(): void
    {
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')->andReturn("100 kg Tomato\nTotal: 1000");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_override.jpg', 200, 'image/jpeg');

        $uploadRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/upload', [
            'file'      => $file,
            'branch_id' => $this->victoria->id,
        ]);
        $receiptId = $uploadRes->json('receipt_id');

        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/process', ['receipt_id' => $receiptId]);

        // Admin overrides AI quantity (100 -> 10)
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id'  => $this->victoria->id,
            'receipt_id' => $receiptId,
            'items'      => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 10, 'unit' => 'kg', 'purchase_price' => 100],
            ],
        ])->assertOk();

        // 10 kg (10,000 g) is posted
        $stock = IngredientStock::where('ingredient_id', $this->tomato->id)
            ->where('branch_id', $this->victoria->id)
            ->first();
        $this->assertEquals(10000.0, (float) $stock->stock);

        // Audit trail records override
        $receipt = ScannedReceipt::find($receiptId);
        $this->assertNotNull($receipt->audit_trail);
        $this->assertTrue($receipt->audit_trail[0]['is_overridden']);
        $this->assertEquals(100.0, $receipt->audit_trail[0]['original_qty']);
        $this->assertEquals(10.0, $receipt->audit_trail[0]['confirmed_qty']);
    }

    /**
     * TEST 12 — PRODUCT AVAILABILITY UPDATES FROM INGREDIENT STOCK
     */
    public function test_product_availability_cascades_from_ingredient_stock(): void
    {
        $category = Category::create(['name' => 'Food', 'branch_id' => $this->victoria->id]);
        $product = Product::create([
            'name'          => 'Tomato Salad',
            'category_id'   => $category->id,
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'stock'         => 0,
            'branch_id'     => $this->victoria->id,
        ]);

        // Recipe: 100g Tomato per Salad
        $product->ingredients()->attach($this->tomato->id, [
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);

        // Initially 0 producible stock
        $this->assertEquals(0, $product->dynamicAvailability($this->victoria->id)['available']);

        // Restock 1 kg (1,000 g) Tomato
        $this->actingAs($this->admin, 'sanctum')->postJson('/api/receipts/confirm-stock-in', [
            'branch_id' => $this->victoria->id,
            'items'     => [
                ['ingredient_id' => $this->tomato->id, 'quantity' => 1, 'unit' => 'kg', 'purchase_price' => 100],
            ],
        ])->assertOk();

        // 1,000 g / 100 g = 10 servings producible
        $producible = $product->dynamicAvailability($this->victoria->id)['available'];
        $this->assertEquals(10, $producible);
    }
}
