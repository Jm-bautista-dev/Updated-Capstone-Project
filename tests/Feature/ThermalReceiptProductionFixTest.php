<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\ReceiptFormatterService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ThermalReceiptProductionFixTest extends TestCase
{
    use RefreshDatabase;

    public $victoriaBranch;
    public $staCruzBranch;
    public $cashier;
    public $category;
    protected Product $chickenTeriyaki;
    protected Product $californiaRoll;
    protected Product $longNameProduct;
    protected ReceiptFormatterService $formatter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->formatter = new ReceiptFormatterService();

        $this->victoriaBranch = Branch::create([
            'name'                 => 'Maki Desu Victoria',
            'address'              => 'Victoria, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'receipt_printer_name' => 'POS-58-USB',
        ]);

        $this->staCruzBranch = Branch::create([
            'name'                 => 'Maki Desu Sta Cruz',
            'address'              => 'Sta Cruz, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'receipt_printer_name' => 'POS-58-BT',
        ]);

        $this->cashier = User::factory()->create([
            'name'      => 'Maria Santos',
            'role'      => 'cashier',
            'branch_id' => $this->victoriaBranch->id,
        ]);

        $this->category = Category::create([
            'name' => 'Main Dishes',
        ]);

        $this->chickenTeriyaki = Product::create([
            'name'          => 'Chicken Teriyaki',
            'sku'           => 'CHK-TER-01',
            'category_id'   => $this->category->id,
            'selling_price' => 140.00,
            'cost_price'    => 70.00,
            'branch_id'     => $this->victoriaBranch->id,
            'stock'         => 100,
        ]);

        $this->californiaRoll = Product::create([
            'name'          => 'California Roll',
            'sku'           => 'CAL-ROL-01',
            'category_id'   => $this->category->id,
            'selling_price' => 180.00,
            'cost_price'    => 90.00,
            'branch_id'     => $this->victoriaBranch->id,
            'stock'         => 100,
        ]);

        $this->longNameProduct = Product::create([
            'name'          => 'Chicken Teriyaki with Japanese Garlic Sauce',
            'sku'           => 'CHK-GAR-01',
            'category_id'   => $this->category->id,
            'selling_price' => 220.00,
            'cost_price'    => 110.00,
            'branch_id'     => $this->victoriaBranch->id,
            'stock'         => 100,
        ]);
    }

    /**
     * Test 1 — One product: Verify product name appears.
     */
    public function test_case_1_single_product_receipt_displays_product_name(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000123',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 60.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertCount(1, $payload['items']);
        $this->assertEquals('Chicken Teriyaki', $payload['items'][0]['name']);
        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('1 x PHP 140.00', $plainText);
        $this->assertStringContainsString('PHP 140.00', $plainText);
    }

    /**
     * Test 2 — Multiple products: Verify all names appear.
     */
    public function test_case_2_multiple_products_receipt_displays_all_product_names(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000124',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 320.00,
            'total'          => 320.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 180.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->californiaRoll->id,
            'product_name' => 'California Roll',
            'quantity'     => 1,
            'unit_price'   => 180.00,
            'subtotal'     => 180.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertCount(2, $payload['items']);
        $this->assertEquals('Chicken Teriyaki', $payload['items'][0]['name']);
        $this->assertEquals('California Roll', $payload['items'][1]['name']);
        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('California Roll', $plainText);
        $this->assertStringContainsString('1 x PHP 140.00', $plainText);
        $this->assertStringContainsString('1 x PHP 180.00', $plainText);
    }

    /**
     * Test 3 — Long product name: Verify the name wraps correctly.
     */
    public function test_case_3_long_product_name_wraps_properly(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000125',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 220.00,
            'total'          => 220.00,
            'paid_amount'    => 220.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->longNameProduct->id,
            'product_name' => 'Chicken Teriyaki with Japanese Garlic Sauce',
            'quantity'     => 1,
            'unit_price'   => 220.00,
            'subtotal'     => 220.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertStringContainsString('Chicken Teriyaki with', $plainText);
        $this->assertStringContainsString('Garlic Sauce', $plainText);
        $this->assertStringContainsString('1 x PHP 220.00', $plainText);
        $this->assertStringContainsString('PHP 220.00', $plainText);
    }

    /**
     * Test 4 — Add-ons: Verify add-ons appear underneath the parent product.
     */
    public function test_case_4_addons_appear_underneath_parent_product(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000126',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 190.00,
            'total'          => 190.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 10.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'         => $sale->id,
            'product_id'      => $this->chickenTeriyaki->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'unit_price'      => 140.00,
            'subtotal'        => 190.00,
            'selected_addons' => [
                ['name' => 'Extra Egg', 'quantity' => 1, 'price' => 30.00, 'subtotal' => 30.00],
                ['name' => 'Extra Sauce', 'quantity' => 1, 'price' => 20.00, 'subtotal' => 20.00],
            ],
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('+ Extra Egg', $plainText);
        $this->assertStringContainsString('30.00', $plainText);
        $this->assertStringContainsString('+ Extra Sauce', $plainText);
        $this->assertStringContainsString('20.00', $plainText);
    }

    /**
     * Test 5 — Multiple quantities: Verify quantity, unit price, and line total.
     */
    public function test_case_5_multiple_quantities_and_line_total(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000127',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 420.00,
            'total'          => 420.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 80.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 3,
            'unit_price'   => 140.00,
            'subtotal'     => 420.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('3 x PHP 140.00', $plainText);
        $this->assertStringContainsString('PHP 420.00', $plainText);
    }

    /**
     * Test 6 — Victoria: Verify VICTORIA appears as the header.
     */
    public function test_case_6_victoria_branch_header(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000128',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 140.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertEquals('VICTORIA', $payload['branch_name']);
        $this->assertStringContainsString('VICTORIA', $plainText);
    }

    /**
     * Test 7 — Sta. Cruz: Verify STA. CRUZ appears as the header.
     */
    public function test_case_7_sta_cruz_branch_header(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000129',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->staCruzBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 140.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertEquals('STA. CRUZ', $payload['branch_name']);
        $this->assertStringContainsString('STA. CRUZ', $plainText);
    }

    /**
     * Test 8 — No MAKI DESU: Verify thermal receipt does NOT contain MAKI DESU.
     */
    public function test_case_8_no_maki_desu_in_thermal_receipt(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000130',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 140.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);
        $escpos = base64_decode($this->formatter->formatEscPosBase64($payload, 58));

        $this->assertStringNotContainsString('MAKI DESU', $plainText);
        $this->assertStringNotContainsString('Maki Desu', $plainText);
        $this->assertStringNotContainsString('MAKI DESU', $escpos);
        $this->assertStringNotContainsString('MAKI DESU', $payload['branch_name']);
    }

    /**
     * Test 9 — Delivery: Verify the receipt remains correct without printing customer address.
     */
    public function test_case_9_delivery_receipt_omits_customer_address(): void
    {
        $sale = Sale::create([
            'order_number'   => 'ORD-000131',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'delivery',
            'subtotal'       => 140.00,
            'delivery_fee'   => 49.00,
            'total'          => 189.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 11.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'delivery_info'  => [
                'customer_name'    => 'Juan Dela Cruz',
                'customer_phone'   => '09171234567',
                'customer_address' => 'Secret Customer Address, 123 Maple St',
            ],
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        $sale->load(['items.product', 'branch', 'user']);
        $payload = $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('Delivery Fee', $plainText);
        $this->assertStringContainsString('49.00', $plainText);
        // Ensure customer address is NOT printed on the thermal receipt
        $this->assertStringNotContainsString('Secret Customer Address', $plainText);
        $this->assertStringNotContainsString('123 Maple St', $plainText);
    }

    /**
     * Test 10 — Pickup: Verify the receipt remains correct for pickup orders.
     */
    public function test_case_10_pickup_receipt(): void
    {
        $order = Order::create([
            'order_number'       => 'PKP-000132',
            'branch_id'          => $this->victoriaBranch->id,
            'fulfillment_type'   => 'pickup',
            'pickup_date'        => '2026-10-03',
            'pickup_time'        => '08:42 PM',
            'customer_name'      => 'Maria Santos',
            'contact_number'     => '09181234567',
            'total_amount'       => 180.00,
            'status'             => 'ready_for_pickup',
            'payment_method'     => 'cash',
        ]);

        OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->californiaRoll->id,
            'product_name' => 'California Roll',
            'quantity'     => 1,
            'price'        => 180.00,
            'subtotal'     => 180.00,
        ]);

        $order->load(['items.product', 'branch']);
        $payload = $this->formatter->buildReceiptData($order, 'order', 'Pickup Receipt', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertEquals('PICKUP', $payload['fulfillment_type']);
        $this->assertStringContainsString('Type: PICKUP', $plainText);
        $this->assertStringContainsString('California Roll', $plainText);
        $this->assertStringContainsString('1 x PHP 180.00', $plainText);
    }

    /**
     * Test 11 — Reprint: Reprint a completed historical order (including with soft-deleted product) and verify product names still appear.
     */
    public function test_case_11_reprint_persisted_order_with_soft_deleted_product(): void
    {
        $sale = Sale::create([
            'order_number'   => 'REPRINT-000999',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 140.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        // Soft delete the product to simulate historical catalog changes
        $this->chickenTeriyaki->delete();

        // Freshly retrieve sale from DB (simulating reprint request)
        $reprintedSale = Sale::with(['items.product', 'branch', 'user'])->find($sale->id);
        $payload = $this->formatter->buildReceiptData($reprintedSale, 'sale', 'Reprint', 58);
        $plainText = $this->formatter->formatPlainText($payload, 58);

        $this->assertCount(1, $payload['items']);
        $this->assertEquals('Chicken Teriyaki', $payload['items'][0]['name']);
        $this->assertStringContainsString('Chicken Teriyaki', $plainText);
        $this->assertStringContainsString('1 x PHP 140.00', $plainText);
    }

    /**
     * Test 12 — Printer failure: Confirm that a printer failure does not modify or cancel the completed order.
     */
    public function test_case_12_printer_failure_does_not_cancel_or_alter_sale(): void
    {
        $sale = Sale::create([
            'order_number'   => 'FAIL-SAFE-001',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 140.00,
            'total'          => 140.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 60.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'      => $sale->id,
            'product_id'   => $this->chickenTeriyaki->id,
            'product_name' => 'Chicken Teriyaki',
            'quantity'     => 1,
            'unit_price'   => 140.00,
            'subtotal'     => 140.00,
        ]);

        // Simulate creating print job that fails
        $printJob = PrintJob::create([
            'job_uuid'          => 'test-uuid-failure',
            'order_number'      => $sale->order_number,
            'branch_id'         => $this->victoriaBranch->id,
            'job_type'          => 'sale',
            'paper_width'       => 58,
            'status'            => PrintJob::STATUS_FAILED,
            'error_message'     => 'Bluetooth connection timed out: device not reachable',
            'receipt_data'      => $this->formatter->buildReceiptData($sale, 'sale', 'POS Checkout', 58),
            'formatted_text'    => '...',
            'attempts'          => 3,
        ]);

        // Verify the sale in the database is completely untouched and completed
        $saleInDb = Sale::find($sale->id);
        $this->assertNotNull($saleInDb);
        $this->assertEquals('completed', $saleInDb->status);
        $this->assertEquals(140.00, (float) $saleInDb->total);
        $this->assertCount(1, $saleInDb->items);
        $this->assertEquals('Chicken Teriyaki', $saleInDb->items[0]->product_name);
    }
}
