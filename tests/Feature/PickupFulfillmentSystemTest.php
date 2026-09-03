<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\PickupOrderService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PickupFulfillmentSystemTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public User $customer;
    public User $cashier;
    public User $admin;
    public Product $product;
    public Ingredient $ingredient;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Branch with Pickup Enabled
        $this->branch = Branch::create([
            'name'                               => 'MAKI DESU - Main Branch',
            'address'                            => '123 Main St, Manila',
            'latitude'                           => 14.5995,
            'longitude'                          => 120.9842,
            'delivery_radius_km'                 => 10.0,
            'has_internal_riders'                => true,
            'base_delivery_fee'                  => 50.00,
            'per_km_fee'                         => 10.00,
            'pickup_enabled'                     => true,
            'pickup_lead_time_minutes'           => 20,
            'pickup_slot_interval_minutes'       => 15,
            'pickup_max_orders_per_slot'         => 10,
            'pickup_opening_time'                => '09:00:00',
            'pickup_closing_time'                => '21:00:00',
            'pickup_cutoff_before_close_minutes' => 30,
        ]);

        // 2. Create Users
        $this->customer = User::factory()->create([
            'role'          => 'customer',
            'mobile_number' => '09171112222',
            'branch_id'     => $this->branch->id,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => $this->branch->id,
        ]);

        // 3. Create Category and Product
        $category = Category::create(['name' => 'Maki Rolls']);
        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
            'selling_price' => 150.00,
            'stock'         => 50,
        ]);

        // 4. Create Ingredient & Stock
        $this->ingredient = Ingredient::create([
            'name' => 'Sushi Rice',
            'unit' => 'g',
        ]);

        IngredientStock::updateOrCreate(
            [
                'ingredient_id' => $this->ingredient->id,
                'branch_id'     => $this->branch->id,
            ],
            [
                'stock'           => 5000,
                'low_stock_level' => 100,
            ]
        );

        // Attach ingredient to product
        $this->product->ingredients()->attach($this->ingredient->id, [
            'quantity_required' => 100,
        ]);
    }

    /**
     * Test 1: Discover available pickup branches
     */
    public function test_get_pickup_branches_returns_enabled_branches(): void
    {
        $response = $this->getJson('/api/v1/customer/pickup-branches');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ])
            ->assertJsonFragment([
                'id'   => $this->branch->id,
                'name' => 'MAKI DESU - Main Branch',
            ]);
    }

    /**
     * Test 2: Calculate valid pickup time slots with lead time & operating hours
     */
    public function test_get_pickup_slots_returns_proper_time_slots(): void
    {
        $tomorrowManila = Carbon::now('Asia/Manila')->addDay()->toDateString();
        $response = $this->getJson("/api/v1/customer/pickup-slots?branch_id={$this->branch->id}&date={$tomorrowManila}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data'    => [
                    'branch_id'         => $this->branch->id,
                    'is_open'           => true,
                    'lead_time_minutes' => 20,
                    'interval_minutes'  => 15,
                ]
            ]);

        $this->assertNotEmpty($response->json('data.slots'));
    }

    /**
     * Test 3: Customer API places a Pickup order without delivery address or fee
     */
    public function test_customer_api_can_place_pickup_order_without_delivery_fields(): void
    {
        $scheduledPickupAt = Carbon::now('Asia/Manila')->addHours(2)->format('Y-m-d H:i:s');

        $payload = [
            'fulfillment_type'    => 'pickup',
            'branch_id'           => $this->branch->id,
            'scheduled_pickup_at' => $scheduledPickupAt,
            'customer_name'       => 'Maria Santos',
            'mobile_number'       => '09171112222',
            'payment_method'      => 'cash',
            'total_amount'        => 300.00,
            'pickup_notes'        => 'Please prepare extra wasabi',
            'items'               => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 2,
                    'price'      => 150.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success'          => true,
                'fulfillment_type' => 'pickup',
                'delivery_fee'     => 0.0,
            ]);

        $orderId = $response->json('order_id');
        $order = Order::find($orderId);

        $this->assertNotNull($order);
        $this->assertEquals('pickup', $order->fulfillment_type);
        $this->assertEquals(0.00, (float) ($order->delivery?->delivery_fee ?? 0));
        $this->assertNotNull($order->pickup_verification_code);
        $this->assertNull($order->delivery); // Delivery model skipped for pickup
    }

    /**
     * Test 4: Cashier creates manual Facebook/Messenger pickup order via admin controller
     */
    public function test_cashier_can_create_manual_facebook_pickup_order(): void
    {
        $scheduledPickupTime = Carbon::today('Asia/Manila')->setTime(14, 0, 0);
        if ($scheduledPickupTime->isPast()) {
            $scheduledPickupTime->addDay();
        }
        $scheduledPickupAt = $scheduledPickupTime->format('Y-m-d H:i:s');

        $payload = [
            'customer_name'               => 'Juan Dela Cruz',
            'contact_number'              => '09189998888',
            'order_source'                => 'facebook_messenger',
            'source_reference'            => 'FB: Juan Cruz / Thread #902',
            'branch_id'                   => $this->branch->id,
            'scheduled_pickup_at'         => $scheduledPickupAt,
            'estimated_prep_time_minutes' => 20,
            'payment_method'              => 'cash',
            'payment_status'              => 'unpaid',
            'pickup_notes'                => 'Customer will pick up after office hours',
            'items'                       => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ]
            ],
            'total_amount'                => 150.00,
        ];

        $response = $this->actingAs($this->cashier)
            ->post('/pickups/manual', $payload);

        $response->assertSessionHas('success');

        $createdOrder = Order::where('fulfillment_type', 'pickup')
            ->where('order_source', 'facebook_messenger')
            ->first();

        $this->assertNotNull($createdOrder);
        $this->assertEquals('Juan Dela Cruz', $createdOrder->customer_name);
        $this->assertEquals('FB: Juan Cruz / Thread #902', $createdOrder->source_reference);
        $this->assertEquals('unpaid', $createdOrder->payment_status);
        $this->assertNotNull($createdOrder->prep_start_at);
    }

    /**
     * Test 5: Pickup order state machine transitions correctly
     */
    public function test_pickup_order_lifecycle_from_preparing_to_ready_to_completed(): void
    {
        $order = Order::create([
            'order_number'             => 'PK-TEST-0001',
            'fulfillment_type'         => Order::FULFILLMENT_PICKUP,
            'order_source'             => Order::SOURCE_MOBILE_APP,
            'user_id'                  => $this->customer->id,
            'branch_id'                => $this->branch->id,
            'customer_name'            => 'Maria Santos',
            'contact_number'           => '09171112222',
            'total_amount'             => 150.00,
            'payment_method'           => 'cash',
            'payment_status'           => Order::PAYMENT_STATUS_UNPAID,
            'status'                   => 'pending',
            'pickup_verification_code' => 'PK9999',
            'scheduled_pickup_at'      => now()->addHour(),
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => 150.00,
        ]);

        $pickupService = app(PickupOrderService::class);

        // 1. Pending -> Confirmed
        $pickupService->transitionPickupStatus($order, 'confirmed', 'Confirmed by kitchen', $this->cashier);
        $this->assertEquals('confirmed', $order->fresh()->status);

        // 2. Confirmed -> Preparing
        $pickupService->transitionPickupStatus($order->fresh(), 'preparing', 'Chef started preparing', $this->cashier);
        $this->assertEquals('preparing', $order->fresh()->status);

        // 3. Preparing -> Ready for pickup
        $pickupService->transitionPickupStatus($order->fresh(), 'ready_for_pickup', 'Packaged on counter', $this->cashier);
        $this->assertEquals('ready_for_pickup', $order->fresh()->status);

        // 4. Ready for pickup -> Customer arrived
        $pickupService->transitionPickupStatus($order->fresh(), 'customer_arrived', 'Customer arrived at counter', $this->cashier);
        $this->assertEquals('customer_arrived', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->actual_customer_arrival_at);

        // 5. Customer arrived -> Completed
        $pickupService->transitionPickupStatus($order->fresh(), 'completed', 'Handed to customer', $this->cashier);
        $this->assertEquals('completed', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->pickup_completed_at);
    }

    /**
     * Test 6: Verification code verification and completion deducts inventory and creates authoritative Sale
     */
    public function test_pickup_completion_deducts_inventory_and_records_sale(): void
    {
        $initialStock = IngredientStock::where('ingredient_id', $this->ingredient->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');

        $order = Order::create([
            'order_number'             => 'PK-VERIFY-001',
            'fulfillment_type'         => Order::FULFILLMENT_PICKUP,
            'order_source'             => Order::SOURCE_MOBILE_APP,
            'user_id'                  => $this->customer->id,
            'branch_id'                => $this->branch->id,
            'customer_name'            => 'Maria Santos',
            'contact_number'           => '09171112222',
            'total_amount'             => 150.00,
            'payment_method'           => 'cash',
            'payment_status'           => Order::PAYMENT_STATUS_UNPAID,
            'status'                   => 'ready_for_pickup',
            'pickup_verification_code' => 'PK7890',
            'scheduled_pickup_at'      => now()->addMinutes(30),
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'price'      => 150.00,
        ]);

        // Complete via verification code
        $response = $this->actingAs($this->cashier)
            ->post("/pickups/{$order->id}/verify-complete", [
                'verification_code' => 'PK7890',
                'paid_amount'       => 150.00,
            ]);

        $response->assertSessionHas('success');

        $freshOrder = $order->fresh();
        $this->assertEquals('completed', $freshOrder->status);
        $this->assertEquals('paid', $freshOrder->payment_status);
        $this->assertTrue($freshOrder->inventory_deducted);

        // Check Ingredient stock was deducted
        $finalStock = IngredientStock::where('ingredient_id', $this->ingredient->id)
            ->where('branch_id', $this->branch->id)
            ->value('stock');
        $this->assertEquals($initialStock - 100, $finalStock);

        // Check authoritative Sale record was created with type 'pickup'
        $sale = Sale::where('order_id', $order->id)->first();
        $this->assertNotNull($sale);
        $this->assertEquals('pickup', $sale->type);
        $this->assertEquals(150.00, (float) $sale->total);
        $this->assertEquals(0.00, (float) $sale->delivery_fee);
    }

    /**
     * Test 7: Backward compatibility - Delivery orders continue to work with delivery records and fees
     */
    public function test_existing_delivery_orders_continue_working_without_regression(): void
    {
        $payload = [
            'fulfillment_type' => 'delivery',
            'branch_id'        => $this->branch->id,
            'customer_name'    => 'Delivery Customer',
            'mobile_number'    => '09173334444',
            'address'          => '456 Delivery Rd, Manila',
            'latitude'         => 14.6000,
            'longitude'        => 120.9850,
            'payment_method'   => 'cash',
            'total_amount'     => 150.00,
            'items'            => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ]
            ]
        ];

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success'          => true,
                'fulfillment_type' => 'delivery',
            ]);

        $orderId = $response->json('order_id');
        $order = Order::find($orderId);

        $this->assertNotNull($order);
        $this->assertEquals('delivery', $order->fulfillment_type);
        $this->assertNotNull($order->delivery); // Delivery model properly created
    }
}
