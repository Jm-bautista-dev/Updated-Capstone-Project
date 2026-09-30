<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\PrintJobService;
use App\Services\ReceiptFormatterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceiptCustomerAddressExclusionTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $cashier;
    protected User $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                 => 'Maki Desu Victoria',
            'address'              => '123 Store St, Victoria, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'receipt_printer_name' => 'POS-58-USB',
            'has_internal_riders'  => true,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $category = Category::create(['name' => 'Sushi']);

        $this->product = Product::create([
            'name'          => 'Dragon Roll',
            'sku'           => 'SUS-001',
            'category_id'   => $category->id,
            'selling_price' => 350.00,
            'branch_id'     => $this->branch->id,
        ]);

        $ingredient = Ingredient::create([
            'name' => 'Sushi Rice',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $ingredient->id,
            'branch_id'     => $this->branch->id,
        ], [
            'stock' => 10000,
        ]);

        $this->product->ingredients()->attach($ingredient->id, [
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'opening_amount'  => 1000.00,
            'opened_at'       => now(),
            'status'          => 'open',
            'opening_counted' => ['cash' => 1000.00],
        ]);
    }

    /**
     * Test 1: POS Delivery sale receipt does NOT print customer address,
     * but retains all other receipt metadata and retains address in database.
     */
    public function test_delivery_receipt_does_not_contain_customer_address()
    {
        $this->actingAs($this->cashier);

        $customerAddress = 'Block 12 Lot 34 Sunflower St, Victoria, Laguna';
        $customerName = 'Maria Santos';
        $customerPhone = '09171234567';

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'           => 'delivery',
            'payment_method' => 'cash',
            'paid_amount'    => 1000.00,
            'delivery_fee'   => 50.00,
            'delivery_info'  => [
                'customer_name'    => $customerName,
                'customer_phone'   => $customerPhone,
                'customer_address' => $customerAddress,
                'delivery_type'    => 'internal',
                'delivery_fee'     => 50.00,
            ],
            'items'          => [
                [
                    'id'              => $this->product->id,
                    'quantity'        => 2,
                    'selected_addons' => [
                        ['name' => 'Extra Spicy Mayo', 'price' => 25.00],
                    ],
                ],
            ],
            'discount'       => 20.00,
            'discount_type'  => 'pwd',
        ]);

        // Verify delivery record retains address
        $delivery = Delivery::where('sale_id', $sale->id)->first();
        $this->assertNotNull($delivery);
        $this->assertEquals($customerAddress, $delivery->customer_address);

        /** @var ReceiptFormatterService $formatter */
        $formatter = app(ReceiptFormatterService::class);
        $receiptData = $formatter->buildReceiptData($sale);

        // Receipt data does NOT have customer address
        $this->assertArrayNotHasKey('customer_address', $receiptData);

        // Verify plain text formatted receipt
        $plainText = $formatter->formatPlainText($receiptData, 58);
        $this->assertStringNotContainsString($customerAddress, $plainText);
        $this->assertStringNotContainsString('Address:', $plainText);

        // Verify ESC/POS binary format
        $escposBase64 = $formatter->formatEscPosBase64($receiptData, 58);
        $escposDecoded = base64_decode($escposBase64);
        $this->assertStringNotContainsString($customerAddress, $escposDecoded);
        $this->assertStringNotContainsString('Address:', $escposDecoded);

        // Verify all other required fields are present
        $this->assertStringContainsString('VICTORIA', $plainText);
        $this->assertStringContainsString('Dragon Roll', $plainText);
        $this->assertStringContainsString('Extra Spicy Mayo', $plainText);
        $this->assertStringContainsString('TOTAL', $plainText);
        $this->assertStringContainsString('CASH Paid', $plainText);
        $this->assertStringContainsString('Change', $plainText);
        $this->assertStringContainsString('Thank you', $plainText);
        $this->assertStringContainsString($customerName, $plainText);
    }

    /**
     * Test 2: Pickup receipt does NOT contain customer address.
     */
    public function test_pickup_receipt_does_not_contain_customer_address()
    {
        $this->actingAs($this->cashier);

        $order = Order::create([
            'order_number'             => 'ORD-PICK-1001',
            'fulfillment_type'         => 'pickup',
            'user_id'                  => $this->customer->id,
            'customer_name'            => 'Juan Dela Cruz',
            'contact_number'           => '09189876543',
            'address'                  => 'Pickup Address Not Needed',
            'total_amount'             => 350.00,
            'subtotal'                 => 350.00,
            'branch_id'                => $this->branch->id,
            'status'                   => 'confirmed',
            'scheduled_pickup_at'      => now()->addHour(),
            'pickup_verification_code' => 'PICK-8899',
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => 350.00,
            'unit_price' => 350.00,
            'line_total' => 350.00,
        ]);

        $formatter = app(ReceiptFormatterService::class);
        $receiptData = $formatter->buildReceiptData($order);

        $this->assertArrayNotHasKey('customer_address', $receiptData);

        $plainText = $formatter->formatPlainText($receiptData, 58);
        $this->assertStringNotContainsString('Pickup Address Not Needed', $plainText);
        $this->assertStringNotContainsString('Address:', $plainText);

        $this->assertStringContainsString('VICTORIA', $plainText);
        $this->assertStringContainsString('ORD-PICK-1001', $plainText);
        $this->assertStringContainsString('PICK-8899', $plainText);
        $this->assertStringContainsString('Dragon Roll', $plainText);
    }

    /**
     * Test 3: Reprinted receipt does NOT contain customer address.
     */
    public function test_reprint_receipt_does_not_contain_customer_address()
    {
        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'           => 'delivery',
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'delivery_fee'   => 40.00,
            'delivery_info'  => [
                'customer_name'    => 'Reprint Customer',
                'customer_phone'   => '09120000000',
                'customer_address' => 'Secret Delivery St. #99',
                'delivery_type'    => 'internal',
                'delivery_fee'     => 40.00,
            ],
            'items'          => [
                [
                    'id'       => $this->product->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        /** @var PrintJobService $printJobService */
        $printJobService = app(PrintJobService::class);
        $reprintJob = $printJobService->reprintReceipt($sale->id, 'sale', $this->cashier, 'Customer duplicate');

        $this->assertNotNull($reprintJob);
        $this->assertStringNotContainsString('Secret Delivery St. #99', $reprintJob->formatted_text);
        $this->assertStringNotContainsString('Address:', $reprintJob->formatted_text);

        $decodedEscpos = base64_decode($reprintJob->raw_escpos_base64);
        $this->assertStringNotContainsString('Secret Delivery St. #99', $decodedEscpos);
        $this->assertStringNotContainsString('Address:', $decodedEscpos);

        $this->assertStringContainsString('*** REPRINT ***', $reprintJob->formatted_text);
        $this->assertStringContainsString('Customer duplicate', $reprintJob->formatted_text);
        $this->assertStringContainsString('Reprint Customer', $reprintJob->formatted_text);
    }

    /**
     * Test 4: Auto-print PrintJob created during POS sale does NOT contain customer address.
     */
    public function test_auto_print_print_job_does_not_contain_customer_address()
    {
        $this->actingAs($this->cashier);

        $customerAddr = '77 Highway St, Sta Cruz';
        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'           => 'delivery',
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'delivery_fee'   => 40.00,
            'delivery_info'  => [
                'customer_name'    => 'Auto Print Client',
                'customer_phone'   => '09998887777',
                'customer_address' => $customerAddr,
                'delivery_type'    => 'internal',
                'delivery_fee'     => 40.00,
            ],
            'items'          => [
                [
                    'id'       => $this->product->id,
                    'quantity' => 1,
                ],
            ],
        ]);

        $job = PrintJob::where('sale_id', $sale->id)->first();
        $this->assertNotNull($job);

        $this->assertStringNotContainsString($customerAddr, $job->formatted_text);
        $this->assertStringNotContainsString('Address:', $job->formatted_text);

        $decoded = base64_decode($job->raw_escpos_base64);
        $this->assertStringNotContainsString($customerAddr, $decoded);
        $this->assertStringNotContainsString('Address:', $decoded);

        // Address remains preserved in delivery data
        $delivery = Delivery::where('sale_id', $sale->id)->first();
        $this->assertNotNull($delivery);
        $this->assertEquals($customerAddr, $delivery->customer_address);
    }
}
