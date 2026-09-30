<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PrintJob;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\Sale;
use App\Models\User;
use App\Services\PrintJobService;
use App\Services\ReceiptFormatterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosReceiptOrderedProductsFlowTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public $user;
    public $category;
    protected User $cashier;
    protected Product $ramen;
    protected Product $gyoza;
    protected Product $sushi;
    protected ProductAddon $extraEgg;
    protected ProductAddon $extraChashu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                 => 'Maki Desu Victoria',
            'address'              => '123 Rizal St, Victoria, Laguna',
            'receipt_paper_width'  => 58,
            'receipt_auto_print'   => true,
            'receipt_printer_name' => 'POS-58-USB',
            'has_internal_riders'  => true,
        ]);

        $this->cashier = User::factory()->create([
            'name'      => 'Test Cashier',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->category = Category::create([
            'name' => 'Japanese Specialties',
        ]);

        $this->ramen = Product::create([
            'name'          => 'Shoyu Ramen',
            'sku'           => 'RAM-001',
            'category_id'   => $this->category->id,
            'selling_price' => 250.00,
            'cost_price'    => 100.00,
            'branch_id'     => $this->branch->id,
        ]);

        $this->gyoza = Product::create([
            'name'          => 'Pork Gyoza 6pcs',
            'sku'           => 'GYO-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->branch->id,
        ]);

        $this->sushi = Product::create([
            'name'          => 'Salmon Nigiri 4pcs',
            'sku'           => 'SUS-001',
            'category_id'   => $this->category->id,
            'selling_price' => 180.00,
            'cost_price'    => 80.00,
            'branch_id'     => $this->branch->id,
        ]);

        $noodle = Ingredient::create([
            'name' => 'Ramen Noodles',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $noodle->id,
            'branch_id'     => $this->branch->id,
        ], ['stock' => 50000]);

        $this->ramen->ingredients()->attach($noodle->id, [
            'quantity_required' => 150,
            'unit'              => 'g',
        ]);

        $pork = Ingredient::create([
            'name' => 'Minced Pork',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $pork->id,
            'branch_id'     => $this->branch->id,
        ], ['stock' => 50000]);

        $this->gyoza->ingredients()->attach($pork->id, [
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);

        $salmon = Ingredient::create([
            'name' => 'Fresh Salmon',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate([
            'ingredient_id' => $salmon->id,
            'branch_id'     => $this->branch->id,
        ], ['stock' => 50000]);

        $this->sushi->ingredients()->attach($salmon->id, [
            'quantity_required' => 80,
            'unit'              => 'g',
        ]);

        // Addons
        $this->extraEgg = ProductAddon::create([
            'name'        => 'Ajitsuke Tamago',
            'price'       => 40.00,
            'cost_price'  => 15.00,
            'is_active'   => true,
        ]);

        $this->extraChashu = ProductAddon::create([
            'name'        => 'Extra Chashu Slice',
            'price'       => 60.00,
            'cost_price'  => 25.00,
            'is_active'   => true,
        ]);

        CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'status'          => 'open',
            'opening_balance' => 1000.00,
            'opened_at'       => now(),
        ]);
    }

    /**
     * 1. Test One product order appears on printed receipt & print job payload.
     */
    public function test_single_product_appears_on_receipt(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'items'          => [
                ['id' => $this->ramen->id, 'quantity' => 1],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $response->assertSessionHas('print_job');

        $printJobData = session('print_job');
        $this->assertNotNull($printJobData);
        $this->assertNotEmpty($printJobData['receipt_data']['items']);
        $this->assertCount(1, $printJobData['receipt_data']['items']);

        $item = $printJobData['receipt_data']['items'][0];
        $this->assertEquals('Shoyu Ramen', $item['name']);
        $this->assertEquals(1, $item['quantity']);
        $this->assertEquals(250.00, $item['unit_price']);
        $this->assertEquals(250.00, $item['subtotal']);

        // Check formatted plain text
        $this->assertStringContainsString('Shoyu Ramen', $printJobData['formatted_text']);
        $this->assertStringContainsString('PHP 250.00', $printJobData['formatted_text']);

        // Check ESC/POS base64
        $rawEscPos = base64_decode($printJobData['raw_escpos_base64']);
        $this->assertStringContainsString('Shoyu Ramen', $rawEscPos);
    }

    /**
     * 2. Test Multiple products appear on receipt.
     */
    public function test_multiple_products_appear_on_receipt(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 1000.00,
            'items'          => [
                ['id' => $this->ramen->id, 'quantity' => 1],
                ['id' => $this->gyoza->id, 'quantity' => 1],
                ['id' => $this->sushi->id, 'quantity' => 1],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');
        $this->assertCount(3, $printJobData['receipt_data']['items']);

        $itemNames = array_column($printJobData['receipt_data']['items'], 'name');
        $this->assertContains('Shoyu Ramen', $itemNames);
        $this->assertContains('Pork Gyoza 6pcs', $itemNames);
        $this->assertContains('Salmon Nigiri 4pcs', $itemNames);

        $this->assertStringContainsString('Shoyu Ramen', $printJobData['formatted_text']);
        $this->assertStringContainsString('Pork Gyoza 6pcs', $printJobData['formatted_text']);
        $this->assertStringContainsString('Salmon Nigiri 4pcs', $printJobData['formatted_text']);
    }

    /**
     * 3. Test Same product with different quantities (e.g. quantity = 4).
     */
    public function test_product_with_larger_quantity_appears_with_correct_subtotal(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'take-out',
            'payment_method' => 'cash',
            'paid_amount'    => 1500.00,
            'items'          => [
                ['id' => $this->ramen->id, 'quantity' => 4],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');
        $item = $printJobData['receipt_data']['items'][0];

        $this->assertEquals(4, $item['quantity']);
        $this->assertEquals(250.00, $item['unit_price']);
        $this->assertEquals(1000.00, $item['subtotal']);

        $this->assertStringContainsString('x4', $printJobData['formatted_text']);
        $this->assertStringContainsString('PHP 1,000.00', $printJobData['formatted_text']);
    }

    /**
     * 4. Test Products with add-ons (including quantity and price).
     */
    public function test_product_with_addons_displays_addons_and_prices(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 600.00,
            'items'          => [
                [
                    'id'              => $this->ramen->id,
                    'quantity'        => 1,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->extraEgg->id,
                            'name'     => 'Ajitsuke Tamago',
                            'price'    => 40.00,
                            'quantity' => 1,
                        ],
                        [
                            'addon_id' => $this->extraChashu->id,
                            'name'     => 'Extra Chashu Slice',
                            'price'    => 60.00,
                            'quantity' => 2,
                        ],
                    ],
                ],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');
        $item = $printJobData['receipt_data']['items'][0];

        $this->assertCount(2, $item['addons']);
        $this->assertEquals('Ajitsuke Tamago', $item['addons'][0]['name']);
        $this->assertEquals(40.00, $item['addons'][0]['price']);

        $this->assertEquals('Extra Chashu Slice', $item['addons'][1]['name']);
        $this->assertEquals(2, $item['addons'][1]['quantity']);
        $this->assertEquals(120.00, $item['addons'][1]['subtotal']);

        $this->assertStringContainsString('Ajitsuke Tamago', $printJobData['formatted_text']);
        $this->assertStringContainsString('2x Extra Chashu', $printJobData['formatted_text']);
        $this->assertStringContainsString('PHP 120.00', $printJobData['formatted_text']);
    }

    /**
     * 5. Test Multiple products with different add-ons.
     */
    public function test_multiple_products_with_different_addons(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 1000.00,
            'items'          => [
                [
                    'id'              => $this->ramen->id,
                    'quantity'        => 1,
                    'selected_addons' => [
                        ['name' => 'Ajitsuke Tamago', 'price' => 40.00, 'quantity' => 1],
                    ],
                ],
                [
                    'id'              => $this->gyoza->id,
                    'quantity'        => 2,
                    'selected_addons' => [
                        ['name' => 'Spicy Dip', 'price' => 15.00, 'quantity' => 2],
                    ],
                ],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');
        $items = $printJobData['receipt_data']['items'];

        $this->assertCount(2, $items);
        $this->assertCount(1, $items[0]['addons']);
        $this->assertCount(1, $items[1]['addons']);
        $this->assertEquals('Ajitsuke Tamago', $items[0]['addons'][0]['name']);
        $this->assertEquals('Spicy Dip', $items[1]['addons'][0]['name']);
    }

    /**
     * 6. Test Delivery order creates receipt with items and delivery fee.
     */
    public function test_delivery_order_displays_items_and_delivery_fee(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'delivery',
            'payment_method' => 'cash',
            'paid_amount'    => 600.00,
            'items'          => [
                ['id' => $this->ramen->id, 'quantity' => 1],
                ['id' => $this->gyoza->id, 'quantity' => 1],
            ],
            'delivery_info'  => [
                'customer_name'    => 'Juan Dela Cruz',
                'customer_phone'   => '09171234567',
                'customer_address' => '456 Mabini St, Victoria',
                'delivery_type'    => 'internal',
                'distance_km'      => 3.5,
                'delivery_fee'     => 50.00,
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');

        $this->assertCount(2, $printJobData['receipt_data']['items']);
        $this->assertEquals(50.00, $printJobData['receipt_data']['delivery_fee']);
        $this->assertEquals(450.00, $printJobData['receipt_data']['total']);
        $this->assertEquals('Juan Dela Cruz', $printJobData['receipt_data']['customer_name']);

        $this->assertStringContainsString('Shoyu Ramen', $printJobData['formatted_text']);
        $this->assertStringContainsString('Pork Gyoza 6pcs', $printJobData['formatted_text']);
        $this->assertStringContainsString('Delivery Fee', $printJobData['formatted_text']);
        // Verify customer address is NOT printed on receipt as per business rules
        $this->assertStringNotContainsString('456 Mabini St', $printJobData['formatted_text']);
    }

    /**
     * 7. Test Pickup order receipt formatting.
     */
    public function test_pickup_order_receipt_formatting(): void
    {
        $this->actingAs($this->cashier);

        $response = $this->post('/pos', [
            'type'           => 'pickup',
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'items'          => [
                ['id' => $this->sushi->id, 'quantity' => 2],
            ],
        ], ['X-Inertia' => 'true']);

        $response->assertStatus(302);
        $printJobData = session('print_job');

        $this->assertEquals('PICKUP', $printJobData['receipt_data']['fulfillment_type']);
        $this->assertCount(1, $printJobData['receipt_data']['items']);
        $this->assertEquals('Salmon Nigiri 4pcs', $printJobData['receipt_data']['items'][0]['name']);
        $this->assertEquals(2, $printJobData['receipt_data']['items'][0]['quantity']);
    }

    /**
     * 8. Test Reprint retains all ordered items identically.
     */
    public function test_reprint_retains_all_ordered_items(): void
    {
        $this->actingAs($this->cashier);

        /** @var SaleService $saleService */
        $saleService = app(SaleService::class);

        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 1000.00,
            'items'          => [
                ['id' => $this->ramen->id, 'quantity' => 2],
                ['id' => $this->sushi->id, 'quantity' => 1],
            ],
        ]);

        $response = $this->postJson('/api/v1/pos/print-jobs/reprint', [
            'sale_id' => $sale->id,
            'reason'  => 'Customer lost original receipt',
        ]);

        $response->assertStatus(200);
        $reprintJob = $response->json('print_job');

        $this->assertNotNull($reprintJob);
        $this->assertCount(2, $reprintJob['receipt_data']['items']);
        $this->assertEquals('Shoyu Ramen', $reprintJob['receipt_data']['items'][0]['name']);
        $this->assertEquals('Salmon Nigiri 4pcs', $reprintJob['receipt_data']['items'][1]['name']);
        $this->assertTrue($reprintJob['receipt_data']['is_reprint']);
        $this->assertStringContainsString('*** REPRINT ***', $reprintJob['formatted_text']);
    }

    /**
     * 9. Test Online Order conversion / Order reprint preserves items.
     */
    public function test_online_order_receipt_data_preserves_order_items(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-TEST-999',
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => 'delivery',
            'customer_name'    => 'Maria Santos',
            'contact_number'   => '09181234567',
            'address'          => '789 Luna St, Victoria',
            'payment_method'   => 'gcash',
            'payment_status'   => 'paid',
            'total_amount'     => 430.00,
            'status'           => 'completed',
        ]);

        OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->ramen->id,
            'product_name' => 'Shoyu Ramen',
            'quantity'     => 1,
            'price'        => 250.00,
            'unit_price'   => 250.00,
            'line_total'   => 250.00,
        ]);

        OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->sushi->id,
            'product_name' => 'Salmon Nigiri 4pcs',
            'quantity'     => 1,
            'price'        => 180.00,
            'unit_price'   => 180.00,
            'line_total'   => 180.00,
        ]);

        /** @var ReceiptFormatterService $formatter */
        $formatter = app(ReceiptFormatterService::class);
        $receiptData = $formatter->buildReceiptData($order);

        $this->assertCount(2, $receiptData['items']);
        $this->assertEquals('Shoyu Ramen', $receiptData['items'][0]['name']);
        $this->assertEquals('Salmon Nigiri 4pcs', $receiptData['items'][1]['name']);
        $this->assertEquals(250.00, $receiptData['items'][0]['unit_price']);
        $this->assertEquals(180.00, $receiptData['items'][1]['unit_price']);
    }
}
