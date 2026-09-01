<?php

namespace Tests\Feature;

use App\Events\OrderCreated;
use App\Events\SaleCreated;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\FinancialMetricsService;
use App\Services\OrderFulfillmentService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductionBugsDeliverySalesAndRiderLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $admin;
    protected User $cashier;
    protected User $customer;
    protected Product $ramen;
    protected Ingredient $noodles;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create([
            'name'                => 'MAKI DESU VICTORIA',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.2250,
            'longitude'           => 121.3280,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->santaCruz = Branch::create([
            'name'                => 'MAKI DESU STA CRUZ',
            'address'             => 'Santa Cruz, Laguna',
            'latitude'            => 14.2780,
            'longitude'           => 121.4150,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $this->noodles = Ingredient::create([
            'name'               => 'Noodles',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.40, // ₱0.40 per gram
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->noodles->id, 'branch_id' => $this->victoria->id],
            [
                'stock'             => 50000,
                'cost_per_unit'     => 0.40,
                'total_stock_value' => 20000,
                'low_stock_level'   => 1000,
            ]
        );

        $category = Category::create(['name' => 'Ramen']);

        // Recipe: 200g noodles * ₱0.40 = ₱80 COGS. Selling price = ₱200
        $this->ramen = Product::create([
            'name'          => 'Tonkotsu Ramen',
            'sku'           => 'RAM-200',
            'category_id'   => $category->id,
            'selling_price' => 200.00,
            'cost_price'    => 0,
            'branch_id'     => $this->victoria->id,
            'unit'          => 'bowl',
            'stock'         => 100,
            'status'        => 'available',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $this->ramen->id,
            'ingredient_id'     => $this->noodles->id,
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);
    }

    /**
     * TEST 1: Mobile Delivery Order Lifecycle separates Product Revenue from Delivery Fee
     * Product: ₱200, Delivery Fee: ₱50, Total Paid: ₱250, COGS: ₱80, Gross Profit: ₱120
     */
    public function test_mobile_delivery_order_separates_product_sales_from_delivery_fee(): void
    {
        Event::fake([SaleCreated::class]);

        $rider = Rider::create([
            'name'      => 'John Rider',
            'email'     => 'john.rider@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
            'is_active' => true,
        ]);

        // Customer orders 1 ramen (₱200) + ₱50 delivery fee = ₱250 total
        $order = Order::create([
            'order_number'    => 'ORD-101',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'rider_id'        => $rider->id,
            'customer_name'   => 'Alice Customer',
            'contact_number'  => '09171112222',
            'address'         => 'Victoria Poblacion',
            'payment_method'  => 'gcash',
            'total_amount'    => 250.00,
            'status'          => 'in_transit',
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->ramen->id,
            'quantity'   => 1,
            'price'      => 200.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $rider->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09171112222',
            'customer_address' => 'Victoria Poblacion',
            'delivery_fee'     => 50.00,
            'status'           => 'in_transit',
        ]);

        // Deliver order
        $delivery->update(['status' => 'delivered', 'delivered_at' => now()]);
        $order->update(['status' => 'delivered']);

        app(OrderFulfillmentService::class)->onOrderDelivered($order, $delivery);

        // Verify Authoritative Sale
        $sale = Sale::where('order_id', $order->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals(200.00, (float) $sale->subtotal, 'Product Revenue must be ₱200.00');
        $this->assertEquals(50.00, (float) $sale->delivery_fee, 'Delivery Fee must be ₱50.00');
        $this->assertEquals(250.00, (float) $sale->total, 'Customer Grand Total must be ₱250.00');
        $this->assertEquals(250.00, (float) $sale->paid_amount, 'Customer Paid Amount must be ₱250.00');
        $this->assertEquals(80.00, (float) $sale->cost_total, 'COGS must be ₱80.00');
        $this->assertEquals(120.00, (float) $sale->profit, 'Gross Profit must be ₱120.00 (₱200 product revenue - ₱80 COGS)');

        // Verify Financial Intelligence Engine
        $metricsService = new FinancialMetricsService();
        $metrics = $metricsService->getSummaryMetrics(null, null, $this->victoria->id);

        $this->assertEquals(200.00, $metrics['revenue'], 'Financial metrics product revenue must be ₱200.00');
        $this->assertEquals(50.00, $metrics['delivery_fees'], 'Delivery fees tracked separately');
        $this->assertEquals(250.00, $metrics['total_collected'], 'Total collected is ₱250.00');
        $this->assertEquals(80.00, $metrics['cogs'], 'COGS must be ₱80.00');
        $this->assertEquals(120.00, $metrics['gross_profit'], 'Gross profit must be ₱120.00');
        $this->assertEquals(120.00, $metrics['net_profit'], 'Net profit must be ₱120.00');
    }

    /**
     * TEST 2: POS Walk-in Delivery Order creates consistent separated product sales and delivery fee
     */
    public function test_pos_walk_in_delivery_creates_consistent_financial_breakdown(): void
    {
        Event::fake([SaleCreated::class]);

        // Open shift for cashier
        \App\Models\CashierShift::create([
            'cashier_id'    => $this->cashier->id,
            'branch_id'     => $this->victoria->id,
            'starting_cash' => 1000.00,
            'opened_at'     => now(),
            'status'        => 'open',
        ]);

        $this->actingAs($this->cashier);

        $saleService = app(SaleService::class);
        $sale = $saleService->processSale([
            'type'           => 'delivery',
            'items'          => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => 2, // 2 * ₱200 = ₱400
                ],
            ],
            'delivery_info'  => [
                'customer_name'    => 'Bob Walkin',
                'customer_phone'   => '09181234567',
                'customer_address' => 'San Pedro, Victoria',
                'delivery_fee'     => 50.00,
                'delivery_type'    => 'internal',
            ],
            'paid_amount'    => 450.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $this->assertEquals(400.00, (float) $sale->subtotal, 'Product subtotal must be ₱400.00');
        $this->assertEquals(50.00, (float) $sale->delivery_fee, 'Delivery fee must be ₱50.00');
        $this->assertEquals(450.00, (float) $sale->total, 'Total order charge must be ₱450.00');
        $this->assertEquals(160.00, (float) $sale->cost_total, 'COGS for 2 bowls = ₱160.00');
        $this->assertEquals(240.00, (float) $sale->profit, 'Profit: ₱400 - ₱160 = ₱240.00');
    }

    /**
     * TEST 3: Rider Deletion, Historical Deliveries Preservation, and Email Reuse
     */
    public function test_deleted_rider_preserves_history_and_permits_email_reuse(): void
    {
        $admin = $this->admin;

        // 1. Create original rider john@example.com
        $response = $this->actingAs($admin)->post('/riders', [
            'name'      => 'John Doe',
            'email'     => 'john@example.com',
            'phone'     => '09171234567',
            'branch_id' => $this->victoria->id,
            'password'  => 'secret123',
        ]);
        $response->assertSessionHas('success');

        $originalRider = Rider::where('email', 'john@example.com')->first();
        $this->assertNotNull($originalRider);
        $this->assertEquals('John Doe', $originalRider->name);

        // 2. Attach completed historical delivery to original rider
        $delivery = Delivery::create([
            'rider_id'         => $originalRider->id,
            'customer_name'    => 'Historical Customer',
            'customer_phone'   => '09179998888',
            'customer_address' => 'Historical Address',
            'delivery_fee'     => 50.00,
            'status'           => 'delivered',
            'delivered_at'     => now(),
        ]);

        // 3. Delete rider via admin UI
        $delResponse = $this->actingAs($admin)->delete("/riders/{$originalRider->id}");
        $delResponse->assertSessionHas('success');

        // Verify original rider is soft-deleted
        $this->assertSoftDeleted('riders', ['id' => $originalRider->id]);

        // Historical delivery still points to original rider record
        $this->assertEquals($originalRider->id, $delivery->fresh()->rider_id);
        $this->assertEquals('John Doe', $delivery->fresh()->rider()->withTrashed()->first()->name);

        // 4. Create NEW rider with the EXACT same email john@example.com
        $createResponse = $this->actingAs($admin)->post('/riders', [
            'name'      => 'John Smith (New Rider)',
            'email'     => 'john@example.com',
            'phone'     => '09187654321',
            'branch_id' => $this->victoria->id,
            'password'  => 'newpassword123',
        ]);
        $createResponse->assertSessionHas('success');

        $newRider = Rider::where('email', 'john@example.com')->first();
        $this->assertNotNull($newRider);
        $this->assertNotEquals($originalRider->id, $newRider->id, 'New rider has separate ID');
        $this->assertEquals('John Smith (New Rider)', $newRider->name);

        // 5. Attempting to create duplicate ACTIVE rider with john@example.com is prohibited
        $dupResponse = $this->actingAs($admin)->post('/riders', [
            'name'      => 'Duplicate John',
            'email'     => 'john@example.com',
            'phone'     => '09199999999',
            'branch_id' => $this->victoria->id,
        ]);
        $dupResponse->assertSessionHasErrors(['email']);
    }

    /**
     * TEST 4: Deleting rider with active deliveries is blocked with 422 error
     */
    public function test_deleting_rider_with_active_deliveries_is_rejected(): void
    {
        $rider = Rider::create([
            'name'      => 'Active Rider Mark',
            'email'     => 'mark@example.com',
            'password'  => Hash::make('secret123'),
            'branch_id' => $this->victoria->id,
            'status'    => 'busy',
            'is_active' => true,
        ]);

        // Attach active in-transit delivery
        Delivery::create([
            'rider_id'         => $rider->id,
            'customer_name'    => 'Active Delivery Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Active Address',
            'delivery_fee'     => 50.00,
            'status'           => 'in_transit',
        ]);

        $response = $this->actingAs($this->admin)->deleteJson("/riders/{$rider->id}");
        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error' => 'Rider cannot be removed while active deliveries are assigned. Please complete or reassign active deliveries first.',
        ]);

        // Verify rider is NOT deleted
        $this->assertNull($rider->fresh()->deleted_at);
    }

    /**
     * TEST 5: Real-Time OrderCreated broadcast payload contains required structured fields
     */
    public function test_order_created_event_payload_structure(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-999',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'customer_name'  => 'Mark Lumerio',
            'contact_number' => '09171234567',
            'address'        => 'Victoria, Laguna',
            'total_amount'   => 469.50,
            'payment_method' => 'gcash',
            'status'         => 'pending',
        ]);

        OrderItem::create([
            'order_id'     => $order->id,
            'product_id'   => $this->ramen->id,
            'quantity'     => 3,
            'price'        => 139.83,
            'product_name' => 'Tonkotsu Ramen',
        ]);

        $event = new OrderCreated($order->load(['branch', 'items']));
        $payload = $event->broadcastWith();

        $this->assertEquals($order->id, $payload['order_id']);
        $this->assertEquals('ORD-999', $payload['order_number']);
        $this->assertEquals('Mark Lumerio', $payload['customer_name']);
        $this->assertEquals(469.50, (float) $payload['total_amount']);
        $this->assertEquals(1, $payload['items_count']);
        $this->assertEquals($this->victoria->id, $payload['branch_id']);
    }
}
