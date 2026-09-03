<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductAddon;
use App\Models\ProductReview;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\ReceiptFormatterService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionPolishAndBusinessRulesPassTest extends TestCase
{
    use RefreshDatabase;

    public $admin;
    public $cashier;
    public $customer;
    public $branch;
    public $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                => 'Maki Desu Victoria',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.2300,
            'longitude'           => 121.3200,
            'delivery_radius_km'  => 25.0,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 15.00,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $category = Category::create([
            'name' => 'Maki Rolls',
            'slug' => 'maki-rolls',
        ]);

        $this->product = Product::create([
            'name'          => 'Dragon Roll',
            'sku'           => 'DRG-01',
            'selling_price' => 350.00,
            'cost_price'    => 120.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
        ]);

        \Illuminate\Support\Facades\DB::table('branch_product')->insert([
            'branch_id'  => $this->branch->id,
            'product_id' => $this->product->id,
            'stock'      => 50,
            'price'      => 350.00,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Feature 3: Receipt header always shows branch and never MAKI DESU.
     */
    public function test_receipt_header_strips_maki_desu_and_displays_branch_name(): void
    {
        $this->assertEquals('VICTORIA', ReceiptFormatterService::formatBranchHeading('Maki Desu Victoria'));
        $this->assertEquals('STA. CRUZ', ReceiptFormatterService::formatBranchHeading('Maki Desu Sta. Cruz'));
        $this->assertEquals('STORE', ReceiptFormatterService::formatBranchHeading('Maki Desu'));
        $this->assertEquals('STORE', ReceiptFormatterService::formatBranchHeading(null));
    }

    /**
     * Feature 2: Cashier cannot view cost price or profit in endpoints.
     */
    public function test_cashier_cannot_see_cost_price_in_pos_and_sales(): void
    {
        // 1. POS Index
        $response = $this->actingAs($this->cashier)->get('/pos');
        $response->assertStatus(200);
        $products = $response->viewData('page')['props']['products'];
        $this->assertNotEmpty($products);
        $this->assertTrue(!isset($products[0]['cost_price']) || $products[0]['cost_price'] === null, 'Cashier must not receive cost_price on POS products');

        // 2. Sales Index
        $sale = Sale::create([
            'order_number'   => 'POS-123',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->branch->id,
            'type'           => 'dine-in',
            'subtotal'       => 350.00,
            'discount'       => 0.00,
            'total'          => 350.00,
            'cost_total'     => 120.00,
            'profit'         => 230.00,
            'paid_amount'    => 350.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $salesResponse = $this->actingAs($this->cashier)->get('/sales');
        $salesResponse->assertStatus(200);
        $salesData = $salesResponse->viewData('page')['props']['sales']['data'];
        $this->assertTrue(!isset($salesData[0]['cost_total']) || $salesData[0]['cost_total'] === null, 'Cashier must not receive cost_total in Sales view');
        $this->assertTrue(!isset($salesData[0]['profit']) || $salesData[0]['profit'] === null, 'Cashier must not receive profit in Sales view');
    }

    /**
     * Feature 4 & 5: Server-authoritative discount handling.
     */
    public function test_server_authoritative_discount_clamping(): void
    {
        // Open shift for cashier cash sale
        \App\Models\CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'opening_balance' => 1000.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $saleService = app(SaleService::class);

        // Attempting to apply a discount larger than subtotal
        $this->actingAs($this->cashier);
        $sale = $saleService->processSale([
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 1],
            ],
            'total'          => 350.00,
            'paid_amount'    => 350.00,
            'payment_method' => 'cash',
            'discount'       => 500.00, // exceeds 350 subtotal
            'discount_type'  => 'custom_fixed',
        ]);

        $this->assertEquals(350.00, (float) $sale->discount, 'Discount must be clamped to subtotal');
        $this->assertEquals(0.00, (float) $sale->total, 'Sale total must not become negative');
    }

    /**
     * Feature 7: Add-ons integration into Order, Pricing, and Receipt.
     */
    public function test_product_addons_pricing_and_receipt_formatting(): void
    {
        $addon = ProductAddon::create([
            'name'       => 'Extra Wasabi',
            'price'      => 15.00,
            'cost_price' => 3.00,
            'is_active'  => true,
        ]);

        $order = Order::create([
            'order_number'     => 'ORD-ADDON-1',
            'fulfillment_type' => 'delivery',
            'customer_name'    => 'Juan Dela Cruz',
            'contact_number'   => '09123456789',
            'total_amount'     => 365.00,
            'branch_id'        => $this->branch->id,
            'status'           => 'pending',
        ]);

        $orderItem = $order->items()->create([
            'product_id'      => $this->product->id,
            'quantity'        => 1,
            'price'           => 350.00,
            'unit_price'      => 350.00,
            'line_total'      => 365.00,
            'addon_total'     => 15.00,
            'selected_addons' => [
                ['name' => 'Extra Wasabi', 'price' => 15.00, 'quantity' => 1]
            ],
        ]);

        $formatter = new ReceiptFormatterService();
        $receiptData = $formatter->buildReceiptData($order);

        $this->assertNotEmpty($receiptData['items']);
        $this->assertNotEmpty($receiptData['items'][0]['addons']);
        $this->assertEquals('Extra Wasabi', $receiptData['items'][0]['addons'][0]['name']);

        $ascii = $formatter->formatPlainText($receiptData, 80);
        $this->assertStringContainsString('+ Extra Wasabi', $ascii);
        $this->assertStringContainsString('VICTORIA', $ascii);
        $this->assertStringNotContainsString('MAKI DESU VICTORIA', $ascii);
    }

    /**
     * Feature 9: Automatic reply for ratings without comments.
     */
    public function test_automatic_thank_you_reply_for_commentless_reviews(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-REV-1',
            'fulfillment_type' => 'delivery',
            'user_id'          => $this->customer->id,
            'customer_name'    => 'Happy Customer',
            'contact_number'   => '09123456789',
            'total_amount'     => 350.00,
            'branch_id'        => $this->branch->id,
            'status'           => 'delivered',
        ]);

        $orderItem = $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => 350.00,
            'unit_price' => 350.00,
            'line_total' => 350.00,
        ]);

        // Case 1: Rating without comment -> auto-reply generated
        $response = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/customer/reviews', [
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'product_id'    => $this->product->id,
            'rating'        => 5,
            'comment'       => '',
        ]);

        $response->assertStatus(201);
        $this->assertEquals('Thank you for your rating! We appreciate your feedback.', $response->json('data.admin_response'));

        // Case 2: Rating WITH written comment -> customer comment preserved untouched
        $order2 = Order::create([
            'order_number'     => 'ORD-REV-2',
            'fulfillment_type' => 'delivery',
            'user_id'          => $this->customer->id,
            'customer_name'    => 'Reviewer Customer',
            'contact_number'   => '09123456789',
            'total_amount'     => 350.00,
            'branch_id'        => $this->branch->id,
            'status'           => 'delivered',
        ]);

        $orderItem2 = $order2->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => 350.00,
            'unit_price' => 350.00,
            'line_total' => 350.00,
        ]);

        $response2 = $this->actingAs($this->customer, 'sanctum')->postJson('/api/v1/customer/reviews', [
            'order_id'      => $order2->id,
            'order_item_id' => $orderItem2->id,
            'product_id'    => $this->product->id,
            'rating'        => 5,
            'comment'       => 'Crispy and very fresh!',
        ]);

        $response2->assertStatus(201);
        $this->assertEquals('Crispy and very fresh!', $response2->json('data.comment'));
        $this->assertNull($response2->json('data.admin_response'), 'Auto-reply must NOT overwrite or trigger when customer provided a comment');
    }
}
