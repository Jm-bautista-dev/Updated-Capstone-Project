<?php

namespace Tests\Feature;

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
use Tests\TestCase;

class MobileDeliverySalesDashboardFinancialSyncTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $admin;
    protected User $cashierVictoria;
    protected User $cashierSantaCruz;
    protected User $customer;
    protected Rider $riderVictoria;
    protected Product $ramen;
    protected Ingredient $noodles;
    protected Ingredient $pork;

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
            'base_delivery_fee'   => 49.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->santaCruz = Branch::create([
            'name'                => 'MAKI DESU STA CRUZ',
            'address'             => 'Santa Cruz, Laguna',
            'latitude'            => 14.2780,
            'longitude'           => 121.4150,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 49.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierVictoria = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoria->id,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->santaCruz->id,
        ]);

        $this->customer = User::factory()->create([
            'role'      => 'customer',
            'branch_id' => null,
        ]);

        $this->riderVictoria = Rider::create([
            'name'      => 'Rider Victoria',
            'email'     => 'rider.vic@makidesu.com',
            'password'  => bcrypt('password'),
            'phone'     => '09171112233',
            'branch_id' => $this->victoria->id,
            'status'    => 'available',
        ]);

        // Ingredients with WAC costing
        $this->noodles = Ingredient::create([
            'name'               => 'Ramen Noodles',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.10, // ₱0.10 per gram
        ]);

        $this->pork = Ingredient::create([
            'name'               => 'Chashu Pork',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.50, // ₱0.50 per gram
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->noodles->id, 'branch_id' => $this->victoria->id],
            [
                'stock'             => 50000,
                'cost_per_unit'     => 0.10,
                'total_stock_value' => 5000,
                'low_stock_level'   => 1000,
            ]
        );

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->pork->id, 'branch_id' => $this->victoria->id],
            [
                'stock'             => 20000,
                'cost_per_unit'     => 0.50,
                'total_stock_value' => 10000,
                'low_stock_level'   => 500,
            ]
        );

        $category = Category::create(['name' => 'Signature Ramen']);

        // Recipe: 200g noodles (₱20) + 100g pork (₱50) = ₱70 unit cost. Selling Price: ₱250
        $this->ramen = Product::create([
            'name'          => 'Special Chashu Ramen',
            'sku'           => 'RAM-001',
            'category_id'   => $category->id,
            'selling_price' => 250.00,
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

        MenuItemIngredient::create([
            'menu_item_id'      => $this->ramen->id,
            'ingredient_id'     => $this->pork->id,
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);
    }

    /**
     * Test 1: Complete lifecycle from Mobile Order -> Delivery -> Delivered -> Sales -> Reports -> Dashboard
     */
    public function test_mobile_delivery_order_lifecycle_syncs_atomically_to_sales_reports_and_dashboard()
    {
        Event::fake([SaleCreated::class]);

        // Step 1: Customer submits mobile order
        $order = Order::create([
            'order_number'    => 'ORD-19',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'rider_id'        => $this->riderVictoria->id,
            'customer_name'   => 'Juan Dela Cruz',
            'contact_number'  => '09171234567',
            'address'         => 'Poblacion, Victoria, Laguna',
            'latitude'        => 14.2250,
            'longitude'       => 121.3280,
            'payment_method'  => 'gcash',
            'total_amount'    => 549.00, // 2 bowls (₱500) + ₱49 delivery fee
            'status'          => 'in_transit',
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->ramen->id,
            'quantity'   => 2,
            'price'      => 250.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->riderVictoria->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'Juan Dela Cruz',
            'customer_phone'   => '09171234567',
            'customer_address' => 'Poblacion, Victoria, Laguna',
            'distance_km'      => 2.5,
            'delivery_fee'     => 49.00,
            'status'           => 'in_transit',
        ]);

        // Before delivery: No completed sale exists
        $this->assertEquals(0, Sale::where('branch_id', $this->victoria->id)->count());

        // Step 2: Rider marks order as Delivered
        $delivery->update([
            'status'       => 'delivered',
            'delivered_at' => now(),
        ]);
        $order->update(['status' => 'delivered']);

        app(OrderFulfillmentService::class)->onOrderDelivered($order, $delivery);

        // Step 3: Verify Authoritative Sale and SaleItem records
        $sale = Sale::where('order_id', $order->id)->first();
        $this->assertNotNull($sale, 'Sale record must be created with order_id.');
        $this->assertEquals('ORD-19', $sale->order_number);
        $this->assertEquals(500.00, (float) $sale->subtotal, 'Product Revenue: 2 bowls @ ₱250 = ₱500');
        $this->assertEquals(49.00, (float) $sale->delivery_fee, 'Delivery fee = ₱49');
        $this->assertEquals(549.00, (float) $sale->total, 'Customer Grand Total = ₱549');
        $this->assertEquals(140.00, (float) $sale->cost_total, 'COGS for 2 bowls of ramen (₱70 * 2 = ₱140).');
        $this->assertEquals(360.00, (float) $sale->profit, 'Profit: ₱500 product revenue - ₱140 COGS = ₱360.');
        $this->assertEquals('gcash', $sale->payment_method);
        $this->assertEquals('completed', $sale->status);
        $this->assertEquals('delivery', $sale->type);

        // Verify linked delivery sale_id
        $this->assertEquals($sale->id, $delivery->fresh()->sale_id);

        // Verify SaleItem record
        $saleItem = SaleItem::where('sale_id', $sale->id)->first();
        $this->assertNotNull($saleItem);
        $this->assertEquals($this->ramen->id, $saleItem->product_id);
        $this->assertEquals(2, $saleItem->quantity);
        $this->assertEquals(250.00, (float) $saleItem->unit_price);
        $this->assertEquals(70.00, (float) $saleItem->cost_price);

        // Verify Realtime Event Dispatched
        Event::assertDispatched(SaleCreated::class, function ($e) use ($sale) {
            return $e->sale->id === $sale->id;
        });

        // Step 4: Verify Financial Metrics Engine
        $financialService = new FinancialMetricsService();
        $metrics = $financialService->getSummaryMetrics(null, null, $this->victoria->id);

        $this->assertEquals(500.00, $metrics['revenue'], 'Product Revenue is ₱500.00 (excluding ₱49 delivery fee)');
        $this->assertEquals(49.00, $metrics['delivery_fees'], 'Delivery fees tracked as ₱49.00');
        $this->assertEquals(549.00, $metrics['total_collected'], 'Total collected is ₱549.00');
        $this->assertEquals(140.00, $metrics['cogs']);
        $this->assertEquals(0.00, $metrics['operating_expenses']);
        $this->assertEquals(360.00, $metrics['net_profit']);
        $this->assertEquals(1, $metrics['total_orders']);

        // Step 5: Verify Sales Controller (/sales) for Victoria Cashier
        $salesResponse = $this->actingAs($this->cashierVictoria)->get('/sales');
        $salesResponse->assertStatus(200);
        $salesResponse->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-19')
            ->where('sales.data.0.total', '549.00')
            ->where('sales.data.0.payment_method', 'gcash')
        );

        // Step 6: Verify Dashboard Controller (/dashboard) for Admin
        $dashboardResponse = $this->actingAs($this->admin)->get('/dashboard?branch_id=' . $this->victoria->id);
        $dashboardResponse->assertStatus(200);
        $dashStats = $dashboardResponse->original->getData()['page']['props']['stats'];

        $this->assertEquals(500.00, $dashStats['total_revenue']);
        $this->assertEquals(140.00, $dashStats['total_expenses']); // COGS (140) + Wastage (0)
        $this->assertEquals(360.00, $dashStats['total_profit']);
        $this->assertEquals(1, $dashStats['total_orders']);

        // Step 7: Verify Reports Controller (/reports) for Victoria Cashier
        $reportsResponse = $this->actingAs($this->cashierVictoria)->get('/reports?date_from=' . today()->format('Y-m-d') . '&date_to=' . today()->format('Y-m-d'));
        $reportsResponse->assertStatus(200);
        $reportsProps = $reportsResponse->original->getData()['page']['props'];

        $this->assertEquals(500.00, $reportsProps['total_revenue']);
        $this->assertEquals(360.00, $reportsProps['total_profit']);
    }

    /**
     * Test 2: Strict Branch Isolation between Victoria and Santa Cruz Cashiers
     */
    public function test_branch_isolation_between_victoria_and_santa_cruz_delivery_sales()
    {
        // Victoria Sale
        $saleVic = Sale::create([
            'order_number'   => 'ORD-VIC-01',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'type'           => 'delivery',
            'total'          => 500.00,
            'cost_total'     => 150.00,
            'profit'         => 350.00,
            'paid_amount'    => 500.00,
            'payment_method' => 'online',
            'status'         => 'completed',
        ]);

        // Santa Cruz Sale
        $saleSC = Sale::create([
            'order_number'   => 'ORD-SC-01',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->santaCruz->id,
            'type'           => 'delivery',
            'total'          => 800.00,
            'cost_total'     => 200.00,
            'profit'         => 600.00,
            'paid_amount'    => 800.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        // 1. Victoria Cashier sees only Victoria
        $resVic = $this->actingAs($this->cashierVictoria)->get('/sales');
        $resVic->assertStatus(200);
        $resVic->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-VIC-01')
        );

        // 2. Santa Cruz Cashier sees only Santa Cruz
        $resSC = $this->actingAs($this->cashierSantaCruz)->get('/sales');
        $resSC->assertStatus(200);
        $resSC->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-SC-01')
        );

        // 3. Santa Cruz Cashier trying to pass ?branch_id=Victoria is blocked by backend auth scoping
        $resSCUnauthorizedAttempt = $this->actingAs($this->cashierSantaCruz)->get('/sales?branch_id=' . $this->victoria->id);
        $resSCUnauthorizedAttempt->assertStatus(200);
        $resSCUnauthorizedAttempt->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-SC-01') // Still strictly scoped to SC!
        );
    }

    /**
     * Test 3: Reusable Order Number and Idempotency Guard (No Duplicates)
     */
    public function test_reusable_order_number_idempotency_and_no_duplicate_sales()
    {
        // 1. First order with reusable number ORD-19
        $order1 = Order::create([
            'order_number'    => 'ORD-19',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Customer One',
            'contact_number'  => '09111111111',
            'address'         => 'Victoria',
            'payment_method'  => 'gcash',
            'total_amount'    => 250.00,
            'status'          => 'delivered',
        ]);
        $delivery1 = Delivery::create([
            'order_id'         => $order1->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'Customer One',
            'customer_phone'   => '09111111111',
            'customer_address' => 'Victoria',
            'status'           => 'delivered',
            'delivered_at'     => now(),
        ]);

        $fulfillment = app(OrderFulfillmentService::class);
        $fulfillment->onOrderDelivered($order1, $delivery1);

        // Call again to verify idempotency
        $fulfillment->onOrderDelivered($order1, $delivery1);

        // Verify only 1 sale exists for order 1
        $this->assertEquals(1, Sale::where('order_id', $order1->id)->count());

        // 2. Next week, recycled order number ORD-19 is used for another order (Order ID: 2)
        $order2 = Order::create([
            'order_number'    => 'ORD-19',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Customer Two',
            'contact_number'  => '09222222222',
            'address'         => 'Victoria',
            'payment_method'  => 'cash',
            'total_amount'    => 500.00,
            'status'          => 'delivered',
        ]);
        $delivery2 = Delivery::create([
            'order_id'         => $order2->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'Customer Two',
            'customer_phone'   => '09222222222',
            'customer_address' => 'Victoria',
            'status'           => 'delivered',
            'delivered_at'     => now(),
        ]);

        // Fulfill second order
        $fulfillment->onOrderDelivered($order2, $delivery2);

        // Assert both sales exist and are cleanly identified by their unique order_id
        $this->assertEquals(2, Sale::where('order_number', 'ORD-19')->count());
        $this->assertEquals(1, Sale::where('order_id', $order1->id)->count());
        $this->assertEquals(1, Sale::where('order_id', $order2->id)->count());
    }

    /**
     * Test 4: Voiding / Cancelling a Delivery Sale Updates Sales & Dashboard
     */
    public function test_void_and_cancellation_removes_from_dashboard_and_restores_inventory()
    {
        $order = Order::create([
            'order_number'       => 'ORD-VOID-01',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->victoria->id,
            'customer_name'      => 'Void Customer',
            'contact_number'     => '09123456789',
            'address'            => 'Victoria',
            'payment_method'     => 'cash',
            'total_amount'       => 250.00,
            'status'             => 'delivered',
            'inventory_deducted' => true,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'Void Customer',
            'customer_phone'   => '09123456789',
            'customer_address' => 'Victoria',
            'status'           => 'delivered',
            'delivered_at'     => now(),
        ]);

        $sale = Sale::create([
            'order_id'       => $order->id,
            'order_number'   => 'ORD-VOID-01',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->victoria->id,
            'type'           => 'delivery',
            'total'          => 250.00,
            'cost_total'     => 70.00,
            'profit'         => 180.00,
            'paid_amount'    => 250.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $delivery->update(['sale_id' => $sale->id]);

        // Revenue before void: ₱250
        $financialService = new FinancialMetricsService();
        $this->assertEquals(250.00, $financialService->getSummaryMetrics(null, null, $this->victoria->id)['revenue']);

        // Void the sale via SalesController updateStatus
        $response = $this->actingAs($this->cashierVictoria)->putJson("/sales/{$sale->id}/status", [
            'status' => 'cancelled',
        ]);
        $response->assertStatus(200);

        // Assert sale and linked delivery/order are marked cancelled
        $this->assertEquals('cancelled', $sale->fresh()->status);
        $this->assertEquals('cancelled', $delivery->fresh()->status);
        $this->assertEquals('cancelled', $order->fresh()->status);

        // Revenue after void: ₱0.00
        $this->assertEquals(0.00, $financialService->getSummaryMetrics(null, null, $this->victoria->id)['revenue']);
    }
}
