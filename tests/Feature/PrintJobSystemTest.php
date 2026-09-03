<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Models\CashierShift;
use App\Services\PrintJobService;
use App\Services\ReceiptFormatterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PrintJobSystemTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoriaBranch;
    protected Branch $staCruzBranch;
    protected User $cashier;
    protected Product $ramenProduct;
    protected Category $testCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoriaBranch = Branch::create([
            'name'                 => 'Maki Desu Victoria',
            'address'              => 'Nanhaya, Victoria, Laguna',
            'receipt_paper_width'  => 80,
            'receipt_auto_print'   => true,
            'has_internal_riders'  => true,
        ]);

        $this->staCruzBranch = Branch::create([
            'name'                 => 'Maki Desu Sta Cruz',
            'address'              => 'Poblacion, Sta. Cruz, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'has_internal_riders'  => true,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoriaBranch->id,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Ramen & Noodles',
        ]);

        $this->ramenProduct = Product::create([
            'name'          => 'Tonkotsu Special Ramen',
            'sku'           => 'RAM-001',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 350.00,
            'branch_id'     => $this->victoriaBranch->id,
        ]);

        $noodleIngredient = Ingredient::create([
            'name' => 'Ramen Noodles',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $noodleIngredient->id,
            'branch_id'     => $this->victoriaBranch->id,
        ], [
            'stock' => 10000,
        ]);

        $this->ramenProduct->ingredients()->attach($noodleIngredient->id, [
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);

        // Open Cashier Shift for cash sales
        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->victoriaBranch->id,
            'status'          => 'open',
            'opening_balance' => 2000.00,
            'opened_at'       => now(),
        ]);
    }

    public function test_sale_creation_creates_authoritative_print_job()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->ramenProduct->id, 'quantity' => 2],
            ],
            'total'          => 700.00,
            'paid_amount'    => 1000.00,
            'change_amount'  => 300.00,
            'payment_method' => 'cash',
        ]);

        $this->assertNotNull($sale->id);

        $printJob = PrintJob::where('sale_id', $sale->id)->first();
        $this->assertNotNull($printJob);
        $this->assertEquals(PrintJob::STATUS_PENDING, $printJob->status);
        $this->assertEquals(PrintJob::TYPE_RECEIPT, $printJob->job_type);
        $this->assertEquals($this->victoriaBranch->id, $printJob->branch_id);
        $this->assertEquals(80, $printJob->paper_width);
        $this->assertNotEmpty($printJob->raw_escpos_base64);
        $this->assertNotEmpty($printJob->formatted_text);
    }

    public function test_print_job_uses_authoritative_branch_heading()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->ramenProduct->id, 'quantity' => 1],
            ],
            'total'          => 350.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 150.00,
            'payment_method' => 'cash',
        ]);

        $printJob = PrintJob::where('sale_id', $sale->id)->first();

        // Must NOT contain "MAKI DESU" in branch heading; must be "VICTORIA"
        $this->assertEquals('VICTORIA', $printJob->receipt_data['branch_name']);
        $this->assertStringContainsString('VICTORIA', $printJob->formatted_text);
    }

    public function test_sta_cruz_branch_receipt_uses_sta_cruz_heading_and_58mm()
    {
        $staCruzCashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
        ]);

        CashierShift::create([
            'cashier_id'      => $staCruzCashier->id,
            'branch_id'       => $this->staCruzBranch->id,
            'status'          => 'open',
            'opening_balance' => 2000.00,
            'opened_at'       => now(),
        ]);

        $staCruzProduct = Product::create([
            'name'          => 'Dragon Roll',
            'sku'           => 'SUS-001',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 280.00,
            'branch_id'     => $this->staCruzBranch->id,
        ]);

        $rice = Ingredient::create(['name' => 'Sushi Rice', 'unit' => 'g']);
        IngredientStock::updateOrCreate(['ingredient_id' => $rice->id, 'branch_id' => $this->staCruzBranch->id], ['stock' => 5000]);
        $staCruzProduct->ingredients()->attach($rice->id, ['quantity_required' => 100, 'unit' => 'g']);

        $this->actingAs($staCruzCashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'takeout',
            'items'          => [
                ['id' => $staCruzProduct->id, 'quantity' => 1],
            ],
            'total'          => 280.00,
            'paid_amount'    => 300.00,
            'change_amount'  => 20.00,
            'payment_method' => 'cash',
        ]);

        $printJob = PrintJob::where('sale_id', $sale->id)->first();

        $this->assertEquals('STA. CRUZ', $printJob->receipt_data['branch_name']);
        $this->assertEquals(58, $printJob->paper_width);
        $this->assertStringContainsString('STA. CRUZ', $printJob->formatted_text);
    }

    public function test_print_job_idempotency_prevents_duplicate_receipts()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->ramenProduct->id, 'quantity' => 1],
            ],
            'total'          => 350.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 150.00,
            'payment_method' => 'cash',
        ]);

        /** @var PrintJobService $printJobService */
        $printJobService = app(PrintJobService::class);

        // Attempt second print job creation for same sale
        $secondJob = $printJobService->createForSale($sale);

        $this->assertEquals(1, PrintJob::where('sale_id', $sale->id)->where('job_type', PrintJob::TYPE_RECEIPT)->count());
    }

    public function test_manual_receipt_reprint_creates_reprint_job_and_audit_log()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->ramenProduct->id, 'quantity' => 1],
            ],
            'total'          => 350.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 150.00,
            'payment_method' => 'cash',
        ]);

        $response = $this->postJson('/api/v1/pos/print-jobs/reprint', [
            'sale_id' => $sale->id,
            'reason'  => 'Customer lost first receipt',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $reprintJob = PrintJob::where('sale_id', $sale->id)
            ->where('job_type', PrintJob::TYPE_REPRINT)
            ->first();

        $this->assertNotNull($reprintJob);
        $this->assertEquals('Customer lost first receipt', $reprintJob->reprint_reason);
        $this->assertEquals($this->cashier->id, $reprintJob->reprinted_by);
        $this->assertStringContainsString('*** REPRINT ***', $reprintJob->formatted_text);
    }

    public function test_printer_status_api_updates_job_status()
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->ramenProduct->id, 'quantity' => 1],
            ],
            'total'          => 350.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 150.00,
            'payment_method' => 'cash',
        ]);

        $printJob = PrintJob::where('sale_id', $sale->id)->first();

        // Update status to printed
        $response = $this->postJson("/api/v1/pos/print-jobs/{$printJob->job_uuid}/status", [
            'status' => 'printed',
        ]);

        $response->assertStatus(200);

        $printJob->refresh();
        $this->assertEquals(PrintJob::STATUS_PRINTED, $printJob->status);
        $this->assertNotNull($printJob->printed_at);
    }
}
