<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Branch;
use App\Models\User;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\ScannedReceipt;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Services\OcrService;
use Mockery;

class ReceiptStockInTest extends TestCase
{
    use RefreshDatabase;

    protected $otherBranch;
    protected $adminUser;
    protected $staffUser;
    protected $chicken;
    protected $rice;
    protected $cabbage;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');

        $this->branch = Branch::create([
            'name' => 'Main Kitchen',
            'address' => '123 Main St',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
        ]);

        $this->otherBranch = Branch::create([
            'name' => 'Sub Branch',
            'address' => '456 Sub St',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
        ]);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->staffUser = User::factory()->create([
            'role' => 'staff',
            'branch_id' => $this->branch->id,
        ]);

        $this->chicken = Ingredient::create([
            'name' => 'Chicken Breast',
            'unit' => 'kg',
            'cost_per_base_unit' => 100,
        ]);

        $this->rice = Ingredient::create([
            'name' => 'Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 50,
        ]);

        $this->cabbage = Ingredient::create([
            'name' => 'Cabbage',
            'unit' => 'pcs',
            'cost_per_base_unit' => 30,
        ]);
    }

    public function test_admin_can_upload_receipt()
    {
        $file = UploadedFile::fake()->create('receipt.jpg', 500, 'image/jpeg');

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/upload', [
                'file' => $file,
                'branch_id' => $this->branch->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $receiptId = $response->json('receipt_id');
        $this->assertDatabaseHas('scanned_receipts', [
            'id' => $receiptId,
            'branch_id' => $this->branch->id,
            'status' => 'pending',
        ]);
    }

    public function test_duplicate_receipt_uploads_are_allowed_with_unique_ids()
    {
        $fileContent = 'mock receipt data';
        $file1 = UploadedFile::fake()->createWithContent('receipt1.jpg', $fileContent);
        $file2 = UploadedFile::fake()->createWithContent('receipt2.jpg', $fileContent);

        $response1 = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/upload', [
                'file' => $file1,
                'branch_id' => $this->branch->id,
            ]);
        $response1->assertOk()->assertJsonPath('success', true);

        $response2 = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/upload', [
                'file' => $file2,
                'branch_id' => $this->branch->id,
            ]);
        $response2->assertOk()->assertJsonPath('success', true);

        // Both uploads should produce different receipt IDs (microtime-salted hash)
        $this->assertNotEquals(
            $response1->json('receipt_id'),
            $response2->json('receipt_id')
        );
    }

    public function test_can_process_uploaded_receipt()
    {
        // Mock OcrService to return controlled OCR text (no real OCR engine in test env)
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')
            ->once()
            ->andReturn("10 kg Chicken Breast\n5 kg Rice\n2 pcs Cabbage");
        $this->app->instance(OcrService::class, $mockOcr);

        $file = UploadedFile::fake()->create('receipt_standard.jpg', 100);

        $uploadResponse = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/upload', [
                'file' => $file,
                'branch_id' => $this->branch->id,
            ]);
        
        $receiptId = $uploadResponse->json('receipt_id');

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/process', [
                'receipt_id' => $receiptId,
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        $items = $response->json('items');
        $this->assertNotEmpty($items);

        $chickenMatch = null;
        foreach ($items as $item) {
            if ($item['item_name'] === 'Chicken Breast') {
                $chickenMatch = $item;
                break;
            }
        }

        $this->assertNotNull($chickenMatch);
        $this->assertEquals($this->chicken->id, $chickenMatch['suggested_match_id']);
        $this->assertEquals(100.0, $chickenMatch['confidence']);
    }

    public function test_detects_low_confidence_ingredients()
    {
        // Mock OcrService with misspelled ingredient names to test fuzzy matching
        $mockOcr = Mockery::mock(OcrService::class)->makePartial();
        $mockOcr->shouldReceive('performOcr')
            ->once()
            ->andReturn("5 kg Chikn Brst\n3 kg Ris");
        $this->app->instance(OcrService::class, $mockOcr);

        Storage::disk('public')->put('receipts/low_confidence_mock.jpg', 'mock content');

        $receipt = ScannedReceipt::create([
            'file_path' => '/storage/receipts/low_confidence_mock.jpg',
            'file_hash' => 'dummy_hash',
            'branch_id' => $this->branch->id,
            'user_id' => $this->adminUser->id,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/receipts/process', [
                'receipt_id' => $receipt->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('low_confidence', true);

        $items = $response->json('items');
        $chickenMatch = null;
        foreach ($items as $item) {
            if ($item['item_name'] === 'Chikn Brst') {
                $chickenMatch = $item;
                break;
            }
        }

        $this->assertNotNull($chickenMatch);
        $this->assertEquals($this->chicken->id, $chickenMatch['suggested_match_id']);
        $this->assertTrue($chickenMatch['needs_review']);
    }

    public function test_can_confirm_stock_in()
    {
        $receipt = ScannedReceipt::create([
            'file_path' => '/storage/receipts/test.jpg',
            'file_hash' => 'dummy_hash_2',
            'branch_id' => $this->branch->id,
            'user_id' => $this->adminUser->id,
            'status' => 'processed',
            'parsed_data' => []
        ]);

        $chickenStock = IngredientStock::where([
            'ingredient_id' => $this->chicken->id,
            'branch_id' => $this->branch->id
        ])->first();
        $this->assertEquals(0.0, $chickenStock->stock);

        $stockInPayload = [
            'branch_id' => $this->branch->id,
            'receipt_id' => $receipt->id,
            'items' => [
                [
                    'id' => $this->chicken->id,
                    'type' => 'ingredient',
                    'quantity' => 15.5,
                    'unit' => 'kg',
                    'purchase_price' => 1550.00
                ],
                [
                    'id' => $this->rice->id,
                    'type' => 'ingredient',
                    'quantity' => 50,
                    'unit' => 'kg',
                    'purchase_price' => 2500.00
                ]
            ]
        ];

        $response = $this->actingAs($this->adminUser)
            ->postJson('/api/inventory/stock-in', $stockInPayload);

        $response->assertOk();

        $this->assertDatabaseHas('scanned_receipts', [
            'id' => $receipt->id,
            'status' => 'completed',
        ]);

        $chickenStock->refresh();
        $this->assertEquals(15500.0, $chickenStock->stock);
        $this->assertEquals(1550.00, $chickenStock->last_purchase_price);
    }

    public function test_cashier_cannot_stock_in_to_other_branch()
    {
        $receipt = ScannedReceipt::create([
            'file_path' => '/storage/receipts/test.jpg',
            'file_hash' => 'dummy_hash_3',
            'branch_id' => $this->otherBranch->id,
            'user_id' => $this->staffUser->id,
            'status' => 'processed',
            'parsed_data' => []
        ]);

        $stockInPayload = [
            'branch_id' => $this->otherBranch->id,
            'receipt_id' => $receipt->id,
            'items' => [
                [
                    'id' => $this->chicken->id,
                    'type' => 'ingredient',
                    'quantity' => 10,
                    'unit' => 'kg',
                    'purchase_price' => 1000
                ]
            ]
        ];

        $response = $this->actingAs($this->staffUser)
            ->postJson('/api/inventory/stock-in', $stockInPayload);

        $response->assertStatus(403);
    }
}
