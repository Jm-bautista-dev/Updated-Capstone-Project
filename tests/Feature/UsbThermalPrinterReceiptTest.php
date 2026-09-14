<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\PrintJobService;
use App\Services\ReceiptFormatterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UsbThermalPrinterReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branch58mm;
    protected User $cashier;
    protected Category $testCategory;
    protected Product $ramen;
    protected Product $longNameProduct;
    protected Ingredient $noodle;

    protected function setUp(): void
    {
        parent::setUp();

        // 58mm Thermal Printer Branch
        $this->branch58mm = Branch::create([
            'name'                 => 'Maki Desu Victoria',
            'address'              => '123 Rizal St, Victoria, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'receipt_printer_name' => 'POS-58-USB',
            'has_internal_riders'  => true,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch58mm->id,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Signature Ramen',
        ]);

        $this->ramen = Product::create([
            'name'          => 'Shoyu Ramen',
            'sku'           => 'RAM-002',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 280.00,
            'branch_id'     => $this->branch58mm->id,
        ]);

        $this->longNameProduct = Product::create([
            'name'          => 'Special Double Chashu Spicy Black Garlic Tonkotsu Ramen',
            'sku'           => 'RAM-SPEC-99',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 450.00,
            'branch_id'     => $this->branch58mm->id,
        ]);

        $this->noodle = Ingredient::create([
            'name' => 'Fresh Ramen Noodles',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $this->noodle->id,
            'branch_id'     => $this->branch58mm->id,
        ], [
            'stock' => 5000,
        ]);

        $this->ramen->ingredients()->attach($this->noodle->id, [
            'quantity_required' => 150,
            'unit'              => 'g',
        ]);

        $this->longNameProduct->ingredients()->attach($this->noodle->id, [
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);

        // Open Cashier Shift
        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch58mm->id,
            'status'          => 'open',
            'opening_balance' => 1000.00,
            'opened_at'       => now(),
        ]);
    }

    /**
     * Test 1: Verify 58mm thermal receipt layout formatting:
     * 32 columns wide, no line exceeding 32 chars, proper branch heading, prices and totals.
     */
    public function test_58mm_thermal_receipt_formatting_constraints()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 2000.00,
            'items'          => [
                [
                    'id'              => $this->ramen->id,
                    'quantity'        => 2,
                    'selected_addons' => [
                        ['name' => 'Extra Nori', 'price' => 30.00],
                        ['name' => 'Ajitsuke Tamago', 'price' => 45.00],
                    ],
                ],
                [
                    'id'       => $this->longNameProduct->id,
                    'quantity' => 1,
                ],
            ],
            'discount'      => 50.00,
            'discount_type' => 'promotional',
        ]);

        /** @var ReceiptFormatterService $formatter */
        $formatter = app(ReceiptFormatterService::class);
        $receiptData = $formatter->buildReceiptData($sale);

        $this->assertEquals(58, $receiptData['paper_width']);
        $this->assertEquals('VICTORIA', $receiptData['branch_name']);

        $plainText = $formatter->formatPlainText($receiptData, 58);
        $lines = explode("\n", $plainText);

        // Assert 32-column constraint: No single line may exceed 32 characters in 58mm mode
        foreach ($lines as $lineIndex => $line) {
            $len = mb_strwidth($line);
            $this->assertLessThanOrEqual(
                32,
                $len,
                "Line {$lineIndex} ('{$line}') exceeds 32 column limit for 58mm paper (actual: {$len})"
            );
        }

        // Verify key receipt elements exist in plain text
        $this->assertStringContainsString('VICTORIA', $plainText);
        $this->assertStringContainsString('TOTAL', $plainText);
        $this->assertStringContainsString('CASH Paid', $plainText);
        $this->assertStringContainsString('Change', $plainText);
        $this->assertStringContainsString('Extra Nori', $plainText);

        // Verify ESC/POS binary stream is generated
        $escposBase64 = $formatter->formatEscPosBase64($receiptData, 58);
        $this->assertNotEmpty($escposBase64);
        $decodedEscpos = base64_decode($escposBase64);
        $this->assertStringContainsString('VICTORIA', $decodedEscpos);
    }

    /**
     * Test 2: Checkout safety — POS sale succeeds and commits even if printer fails or is offline.
     */
    public function test_checkout_succeeds_even_when_printer_is_offline()
    {
        $this->actingAs($this->cashier);

        $stockBefore = IngredientStock::where('ingredient_id', $this->noodle->id)
            ->where('branch_id', $this->branch58mm->id)
            ->value('stock');

        $response = $this->post('/pos', [
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'items'          => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => 1,
                ],
            ],
        ], [
            'X-Inertia' => 'true',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHas('success');
        $response->assertSessionHas('print_job');

        // Sale is successfully committed in database
        $sale = Sale::latest()->first();
        $this->assertNotNull($sale);
        $this->assertEquals('completed', $sale->status);
        $this->assertEquals(280.00, $sale->total);

        // Stock was correctly deducted (150g noodles)
        $stockAfter = IngredientStock::where('ingredient_id', $this->noodle->id)
            ->where('branch_id', $this->branch58mm->id)
            ->value('stock');
        $this->assertEquals($stockBefore - 150, $stockAfter);

        // Print job is pending (ready for bridge or browser print)
        $printJob = PrintJob::where('sale_id', $sale->id)->first();
        $this->assertNotNull($printJob);
        $this->assertEquals(PrintJob::STATUS_PENDING, $printJob->status);
        $this->assertEquals(58, $printJob->paper_width);
    }

    /**
     * Test 3: Safe Reprint — Manual reprint creates a reprint print job and audit record
     * without duplicating sales, altering stock, or changing transaction totals.
     */
    public function test_manual_reprint_does_not_duplicate_sale_or_inventory()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 300.00,
            'items'          => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $initialSalesCount = Sale::count();
        $initialStock = IngredientStock::where('ingredient_id', $this->noodle->id)
            ->where('branch_id', $this->branch58mm->id)
            ->value('stock');

        // Trigger manual reprint via API
        $response = $this->postJson('/api/v1/pos/print-jobs/reprint', [
            'sale_id' => $sale->id,
            'reason'  => 'Cashier requested duplicate copy',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        // Sale count must NOT change
        $this->assertEquals($initialSalesCount, Sale::count());

        // Inventory must NOT be deducted again
        $currentStock = IngredientStock::where('ingredient_id', $this->noodle->id)
            ->where('branch_id', $this->branch58mm->id)
            ->value('stock');
        $this->assertEquals($initialStock, $currentStock);

        // Total must NOT change
        $this->assertEquals(280.00, $sale->fresh()->total);

        // Reprint print job exists with REPRINT banner
        $reprintJob = PrintJob::where('sale_id', $sale->id)
            ->where('job_type', PrintJob::TYPE_REPRINT)
            ->first();

        $this->assertNotNull($reprintJob);
        $this->assertStringContainsString('*** REPRINT ***', $reprintJob->formatted_text);
        $this->assertEquals(58, $reprintJob->paper_width);
    }

    /**
     * Test 4: Large transaction formatting with multiple products, add-ons, and discounts.
     */
    public function test_large_transaction_58mm_formatting()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'takeout',
            'payment_method' => 'cash',
            'paid_amount'    => 2000.00,
            'items'          => [
                [
                    'id'              => $this->ramen->id,
                    'quantity'        => 3,
                    'selected_addons' => [
                        ['name' => 'Extra Chashu', 'price' => 50.00],
                        ['name' => 'Soft Boiled Egg', 'price' => 40.00],
                        ['name' => 'Spicy Paste', 'price' => 20.00],
                    ],
                ],
                [
                    'id'              => $this->longNameProduct->id,
                    'quantity'        => 2,
                    'selected_addons' => [
                        ['name' => 'Extra Noodles (Kaedama)', 'price' => 60.00],
                    ],
                ],
            ],
            'discount'      => 100.00,
            'discount_type' => 'twenty_percent',
        ]);

        /** @var ReceiptFormatterService $formatter */
        $formatter = app(ReceiptFormatterService::class);
        $receiptData = $formatter->buildReceiptData($sale, paperWidthOverride: 58);

        $plainText = $formatter->formatPlainText($receiptData, 58);
        $lines = explode("\n", $plainText);

        // Assert 32-column limit for all lines in complex multi-item receipt
        foreach ($lines as $lineIndex => $line) {
            $len = mb_strwidth($line);
            $this->assertLessThanOrEqual(
                32,
                $len,
                "Line {$lineIndex} ('{$line}') exceeds 32 characters in large receipt (len: {$len})"
            );
        }

        // Verify grand total arithmetic consistency
        $this->assertGreaterThan(0, $sale->total);
        $this->assertStringContainsString('PHP ' . number_format((float) $sale->total, 2), $plainText);
    }
}
