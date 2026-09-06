<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\FinancialMetricsService;
use App\Services\OrderFulfillmentService;
use App\Services\PickupOrderService;
use App\Services\TopPickService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PickupSalesAndCostInclusionTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public User $cashier;
    public User $customer;
    public Branch $branch1;
    public Branch $branch2;
    public Category $testCategory;
    public Product $productRoll;
    public Product $productNigiri;
    public Ingredient $ingredientFish;
    public Ingredient $ingredientRice;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create([
            'name'                     => 'Maki Desu Victoria',
            'address'                  => 'Victoria Laguna',
            'latitude'                 => 14.229371,
            'longitude'                => 121.328383,
            'is_main'                  => true,
            'pickup_enabled'           => true,
            'pickup_opening_time'      => '08:00:00',
            'pickup_closing_time'      => '22:00:00',
            'pickup_lead_time_minutes' => 20,
        ]);

        $this->branch2 = Branch::create([
            'name'                     => 'Maki Desu Sta. Cruz',
            'address'                  => 'Sta. Cruz Laguna',
            'latitude'                 => 14.2815,
            'longitude'                => 121.4172,
            'is_main'                  => false,
            'pickup_enabled'           => true,
            'pickup_opening_time'      => '08:00:00',
            'pickup_closing_time'      => '22:00:00',
            'pickup_lead_time_minutes' => 20,
        ]);

        $this->admin = User::create([
            'name'              => 'Admin User',
            'email'             => 'admin@makidesu.test',
            'password'          => bcrypt('password'),
            'role'              => 'admin',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->cashier = User::create([
            'name'              => 'Cashier Victoria',
            'email'             => 'cashier@makidesu.test',
            'password'          => bcrypt('password'),
            'role'              => 'cashier',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->customer = User::create([
            'name'              => 'Juan Dela Cruz',
            'email'             => 'juan@example.test',
            'password'          => bcrypt('password'),
            'role'              => 'customer',
            'branch_id'         => $this->branch1->id,
            'email_verified_at' => now(),
        ]);

        $this->testCategory = Category::create([
            'name'        => 'Maki Rolls',
            'slug'        => 'maki-rolls',
            'description' => 'Delicious rolls',
        ]);

        // Ingredients with defined costs
        $this->ingredientFish = Ingredient::create([
            'name'               => 'Fresh Tuna',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.50, // 0.50 per gram
        ]);

        $this->ingredientRice = Ingredient::create([
            'name'               => 'Sushi Rice',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.10, // 0.10 per gram
        ]);

        // Update stocks in branch 1
        IngredientStock::where('ingredient_id', $this->ingredientFish->id)
            ->where('branch_id', $this->branch1->id)
            ->update([
                'stock'           => 10000,
                'cost_per_unit'   => 0.50,
                'low_stock_level' => 500,
            ]);

        IngredientStock::where('ingredient_id', $this->ingredientRice->id)
            ->where('branch_id', $this->branch1->id)
            ->update([
                'stock'           => 20000,
                'cost_per_unit'   => 0.10,
                'low_stock_level' => 1000,
            ]);

        // Products with recipe ingredients
        // Product 1: Tuna Roll. Sells for 200. Cost = 100g Tuna (50) + 100g Rice (10) = 60. Profit = 140.
        $this->productRoll = Product::create([
            'name'          => 'Spicy Tuna Roll',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 200.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->branch1->id,
            'is_available'  => true,
            'stock'         => 100,
        ]);

        $this->productRoll->ingredients()->attach([
            $this->ingredientFish->id => ['quantity_required' => 100, 'unit' => 'g'],
            $this->ingredientRice->id => ['quantity_required' => 100, 'unit' => 'g'],
        ]);

        // Product 2: Tuna Nigiri. Sells for 150. Cost = 60g Tuna (30) + 50g Rice (5) = 35. Profit = 115.
        $this->productNigiri = Product::create([
            'name'          => 'Tuna Nigiri (2pcs)',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 150.00,
            'cost_price'    => 35.00,
            'branch_id'     => $this->branch1->id,
            'is_available'  => true,
            'stock'         => 100,
        ]);

        $this->productNigiri->ingredients()->attach([
            $this->ingredientFish->id => ['quantity_required' => 60, 'unit' => 'g'],
            $this->ingredientRice->id => ['quantity_required' => 50, 'unit' => 'g'],
        ]);
    }

    /**
     * Test 1: Completed Pickup Order creates authoritative Sale & SaleItem records with snapshot cost and profit.
     */
    public function test_completed_pickup_order_records_authoritative_sale_and_cogs(): void
    {
        $pickupService = app(PickupOrderService::class);
        $pickupDate = Carbon::now(PickupOrderService::DEFAULT_TIMEZONE)->addHours(2);
        if ($pickupDate->hour >= 21) {
            $pickupDate = Carbon::tomorrow(PickupOrderService::DEFAULT_TIMEZONE)->setTime(10, 0, 0);
        }

        $order = $pickupService->createManualPickupOrder([
            'customer_name'               => 'Juan Dela Cruz',
            'contact_number'              => '09171234567',
            'order_source'                => Order::SOURCE_FACEBOOK_MESSENGER,
            'branch_id'                   => $this->branch1->id,
            'scheduled_pickup_at'         => $pickupDate->format('Y-m-d H:i:s'),
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'items'                       => [
                ['product_id' => $this->productRoll->id, 'quantity' => 2, 'price' => 200.00], // Subtotal: 400, Cost: 120, Profit: 280
                ['product_id' => $this->productNigiri->id, 'quantity' => 1, 'price' => 150.00], // Subtotal: 150, Cost: 35, Profit: 115
            ],
            'total_amount'                => 550.00,
        ], $this->cashier);

        $this->assertEquals('pending', $order->status);
        $this->assertDatabaseMissing('sales', ['order_id' => $order->id]);

        // Complete the pickup order
        $result = $pickupService->verifyAndCompletePickup($order, $order->pickup_verification_code, $this->cashier, 550.00);
        $this->assertTrue($result['success']);

        // Assert Sale record was created
        $this->assertDatabaseHas('sales', [
            'order_id'       => $order->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'pickup',
            'status'         => 'completed',
            'subtotal'       => 550.00,
            'delivery_fee'   => 0.00,
            'total'          => 550.00,
            'cost_total'     => 155.00, // 2*60 + 1*35 = 155
            'profit'         => 395.00, // 550 - 155 = 395
        ]);

        $sale = Sale::where('order_id', $order->id)->with('items')->first();
        $this->assertNotNull($sale);
        $this->assertCount(2, $sale->items);

        $rollItem = $sale->items->firstWhere('product_id', $this->productRoll->id);
        $this->assertEquals(2, $rollItem->quantity);
        $this->assertEquals(200.00, (float) $rollItem->unit_price);
        $this->assertEquals(60.00, (float) $rollItem->cost_price);
        $this->assertEquals(400.00, (float) $rollItem->subtotal);
        $this->assertEquals(280.00, (float) $rollItem->profit);

        $nigiriItem = $sale->items->firstWhere('product_id', $this->productNigiri->id);
        $this->assertEquals(1, $nigiriItem->quantity);
        $this->assertEquals(150.00, (float) $nigiriItem->unit_price);
        $this->assertEquals(35.00, (float) $nigiriItem->cost_price);
        $this->assertEquals(150.00, (float) $nigiriItem->subtotal);
        $this->assertEquals(115.00, (float) $nigiriItem->profit);
    }

    /**
     * Test 2: Direct transitionTo('completed') on pickup order also triggers fulfillment sale recording.
     */
    public function test_direct_transition_to_completed_records_sale(): void
    {
        $order = Order::create([
            'order_number'        => 'PK-TEST-0001',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'order_source'        => Order::SOURCE_WALK_IN,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Maria Santos',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_UNPAID,
            'scheduled_pickup_at' => now()->addHour(),
            'total_amount'        => 400.00,
            'status'              => 'pending',
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 2,
            'price'      => 200.00,
        ]);

        // Sequential state transitions
        $order->transitionTo('confirmed');
        $order->transitionTo('preparing');
        $order->transitionTo('ready_for_pickup');
        $order->transitionTo('completed', 'Picked up by customer', $this->cashier->id);

        $this->assertDatabaseHas('sales', [
            'order_id'   => $order->id,
            'type'       => 'pickup',
            'status'     => 'completed',
            'total'      => 400.00,
            'cost_total' => 120.00,
            'profit'     => 280.00,
        ]);
    }

    /**
     * Test 3: Cancelled or Unpaid/Pending pickup orders are excluded from financial revenue, cost, and profit.
     */
    public function test_cancelled_and_pending_pickup_orders_excluded_from_financials(): void
    {
        // 1. Pending Pickup Order (Not completed)
        $pendingOrder = Order::create([
            'order_number'        => 'PK-PENDING',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'order_source'        => Order::SOURCE_WALK_IN,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Pending Customer',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_UNPAID,
            'scheduled_pickup_at' => now()->addHour(),
            'total_amount'        => 500.00,
            'status'              => 'pending',
        ]);

        // 2. Cancelled Pickup Order
        $cancelledOrder = Order::create([
            'order_number'        => 'PK-CANCELLED',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'order_source'        => Order::SOURCE_WALK_IN,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Cancelled Customer',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_UNPAID,
            'scheduled_pickup_at' => now()->addHour(),
            'total_amount'        => 600.00,
            'status'              => 'cancelled',
            'cancelled_at'        => now(),
        ]);

        // 3. Completed Pickup Order
        $completedOrder = Order::create([
            'order_number'        => 'PK-COMPLETED',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'order_source'        => Order::SOURCE_WALK_IN,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Valid Customer',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at' => now(),
            'pickup_completed_at' => now(),
            'total_amount'        => 200.00,
            'status'              => 'completed',
        ]);

        OrderItem::create([
            'order_id'   => $completedOrder->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 1,
            'price'      => 200.00,
        ]);

        app(OrderFulfillmentService::class)->onOrderPickedUp($completedOrder);

        // Check FinancialMetricsService
        $metricsService = app(FinancialMetricsService::class);
        $summary = $metricsService->getSummaryMetrics();

        $this->assertEquals(200.00, $summary['revenue']);
        $this->assertEquals(60.00, $summary['cogs']);
        $this->assertEquals(140.00, $summary['net_profit']);
        $this->assertEquals(1, $summary['total_orders']);

        // Neither pending nor cancelled order contributed
        $todayMetrics = $metricsService->getTodayRevenueMetrics($this->branch1->id);
        $this->assertEquals(200.00, $todayMetrics['today_revenue']);
        $this->assertEquals(1, $todayMetrics['completed_today']);
    }

    /**
     * Test 4: Financial metrics and branch stats include valid pickup orders and separate delivery fees correctly.
     */
    public function test_financial_metrics_and_branch_stats_include_pickup_and_delivery_accurately(): void
    {
        // Completed Pickup: 200 revenue, 0 delivery fee, 60 cost, 140 profit
        $pickupOrder = Order::create([
            'order_number'        => 'PK-001',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Pickup Buyer',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at' => now(),
            'pickup_completed_at' => now(),
            'total_amount'        => 200.00,
            'status'              => 'completed',
        ]);
        OrderItem::create([
            'order_id'   => $pickupOrder->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 1,
            'price'      => 200.00,
        ]);
        app(OrderFulfillmentService::class)->onOrderPickedUp($pickupOrder);

        // Completed Delivery: 150 product revenue, 50 delivery fee, 35 cost, 115 profit
        $deliveryOrder = Order::create([
            'order_number'        => 'DEL-001',
            'fulfillment_type'    => Order::FULFILLMENT_DELIVERY,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Delivery Buyer',
            'payment_method'      => 'online',
            'payment_status'      => Order::PAYMENT_STATUS_PAID,
            'total_amount'        => 200.00, // 150 item + 50 delivery fee
            'status'              => 'delivered',
        ]);
        OrderItem::create([
            'order_id'   => $deliveryOrder->id,
            'product_id' => $this->productNigiri->id,
            'quantity'   => 1,
            'price'      => 150.00,
        ]);
        $delivery = Delivery::create([
            'order_id'         => $deliveryOrder->id,
            'customer_name'    => 'Delivery Buyer',
            'customer_phone'   => '09181234567',
            'customer_address' => 'Victoria Laguna',
            'delivery_fee'     => 50.00,
            'distance_km'      => 2.5,
            'status'           => 'delivered',
            'delivered_at'     => now(),
        ]);
        app(OrderFulfillmentService::class)->onOrderDelivered($deliveryOrder, $delivery);

        // Total Product Revenue = 200 (pickup) + 150 (delivery product) = 350
        // Total Delivery Fees   = 0 (pickup) + 50 (delivery) = 50
        // Total Collected       = 400
        // Total COGS            = 60 (pickup) + 35 (delivery) = 95
        // Net Profit            = 350 - 95 = 255

        $metricsService = app(FinancialMetricsService::class);
        $summary = $metricsService->getSummaryMetrics();

        $this->assertEquals(350.00, $summary['revenue']);
        $this->assertEquals(50.00, $summary['delivery_fee_amount'] ?? $summary['delivery_fees']);
        $this->assertEquals(400.00, $summary['total_collected']);
        $this->assertEquals(95.00, $summary['cogs']);
        $this->assertEquals(255.00, $summary['net_profit']);
        $this->assertEquals(2, $summary['total_orders']);

        // Verify Branch Stats
        $branchStats = $metricsService->getBranchStats(collect([$this->branch1, $this->branch2]))->keyBy('id');
        $b1Stats = $branchStats->get($this->branch1->id);

        $this->assertEquals(350.00, $b1Stats['total_revenue']);
        $this->assertEquals(95.00, $b1Stats['cogs']);
        $this->assertEquals(255.00, $b1Stats['total_profit']);
        $this->assertEquals(2, $b1Stats['total_orders']);
    }

    /**
     * Test 5: Top picks service aggregates pickup sales without double counting.
     */
    public function test_top_picks_includes_pickup_sales_without_double_counting(): void
    {
        // 3 Tuna Rolls via Pickup
        $pickupOrder = Order::create([
            'order_number'        => 'PK-TOP1',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Roll Lover',
            'payment_status'      => Order::PAYMENT_STATUS_PAID,
            'total_amount'        => 600.00,
            'status'              => 'completed',
        ]);
        OrderItem::create([
            'order_id'   => $pickupOrder->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 3,
            'price'      => 200.00,
        ]);
        app(OrderFulfillmentService::class)->onOrderPickedUp($pickupOrder);

        // 1 Tuna Nigiri via In-Store POS
        $posSale = Sale::create([
            'order_number'   => 'POS-1001',
            'user_id'        => $this->cashier->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'pos',
            'subtotal'       => 150.00,
            'total'          => 150.00,
            'paid_amount'    => 150.00,
            'cost_total'     => 35.00,
            'profit'         => 115.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);
        \App\Models\SaleItem::create([
            'sale_id'    => $posSale->id,
            'product_id' => $this->productNigiri->id,
            'quantity'   => 1,
            'unit_price' => 150.00,
            'cost_price' => 35.00,
            'subtotal'   => 150.00,
            'profit'     => 115.00,
        ]);

        $topPickService = app(TopPickService::class);
        $topPicks = $topPickService->getTopPicks('today', $this->branch1->id);

        $this->assertNotEmpty($topPicks);
        $first = $topPicks[0];
        $this->assertEquals($this->productRoll->id, $first['id']);
        $this->assertEquals(3, $first['quantity_sold']); // Exactly 3 (not 6!)
        $this->assertEquals(600.00, $first['total_sales']);

        $second = $topPicks[1];
        $this->assertEquals($this->productNigiri->id, $second['id']);
        $this->assertEquals(1, $second['quantity_sold']);
        $this->assertEquals(150.00, $second['total_sales']);
    }

    /**
     * Test 6: Sales and Reports export includes Pickup sales with correct customer and order type.
     */
    public function test_sales_and_reports_export_includes_pickup_orders(): void
    {
        $pickupOrder = Order::create([
            'order_number'        => 'PK-EXP-01',
            'fulfillment_type'    => Order::FULFILLMENT_PICKUP,
            'branch_id'           => $this->branch1->id,
            'customer_name'       => 'Pedro Penduko',
            'payment_method'      => 'cash',
            'payment_status'      => Order::PAYMENT_STATUS_PAID,
            'scheduled_pickup_at' => now(),
            'pickup_completed_at' => now(),
            'total_amount'        => 350.00,
            'status'              => 'completed',
        ]);

        OrderItem::create([
            'order_id'   => $pickupOrder->id,
            'product_id' => $this->productRoll->id,
            'quantity'   => 1,
            'price'      => 200.00,
        ]);
        OrderItem::create([
            'order_id'   => $pickupOrder->id,
            'product_id' => $this->productNigiri->id,
            'quantity'   => 1,
            'price'      => 150.00,
        ]);

        app(OrderFulfillmentService::class)->onOrderPickedUp($pickupOrder);

        // Sales Export Summary endpoint
        $response = $this->actingAs($this->admin)->getJson('/sales/export/summary?branch_id=all&date_preset=today');
        $response->assertStatus(200);
        $response->assertJson([
            'success'         => true,
            'count'           => 1,
            'total_amount'    => 350.00,
            'subtotal_amount' => 350.00,
        ]);

        // CSV Export
        $csvResponse = $this->actingAs($this->admin)->get('/sales/export?branch_id=all&date_preset=today');
        $csvResponse->assertStatus(200);
        $content = $csvResponse->streamedContent();
        $this->assertStringContainsString('PK-EXP-01', $content);
        $this->assertStringContainsString('Pedro Penduko', $content);
        $this->assertStringContainsString('Pickup', $content);
        $this->assertStringContainsString('350.00', $content);
    }
}
