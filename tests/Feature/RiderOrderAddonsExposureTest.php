<?php

namespace Tests\Feature;

use App\Models\AddOn;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RiderOrderAddonsExposureTest extends TestCase
{
    use RefreshDatabase;

    public Rider $rider;
    public User $customer;
    public Product $product1;
    public Product $product2;
    public AddOn $addonRice;
    public AddOn $addonCheese;
    public AddOn $addonEgg;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'               => 'Maki Desu Central',
            'code'               => 'CENTRAL',
            'address'            => '100 Main Avenue',
            'latitude'           => 14.5995,
            'longitude'          => 120.9842,
            'delivery_radius_km' => 20.0,
            'is_active'          => true,
        ]);

        $this->rider = Rider::create([
            'name'           => 'Rider Kenji',
            'email'          => 'kenji.rider@makidesu.test',
            'phone'          => '09171112233',
            'password'       => bcrypt('password123'),
            'branch_id'      => $this->branch->id,
            'is_active'      => true,
            'status'         => 'available',
        ]);

        $this->customer = User::factory()->create([
            'name'           => 'Alice Customer',
            'role'           => User::ROLE_CUSTOMER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
        ]);

        $this->category = Category::create([
            'name' => 'Rice Meals',
        ]);

        $this->product1 = Product::create([
            'name'          => 'Chicken Teriyaki',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'description'   => 'Grilled chicken with teriyaki glaze',
            'branch_id'     => $this->branch->id,
            'stock'         => 50,
            'is_available'  => true,
        ]);

        $this->product2 = Product::create([
            'name'          => 'Beef Bento',
            'category_id'   => $this->category->id,
            'selling_price' => 220.00,
            'unit'          => 'pcs',
            'description'   => 'Premium beef bento with side salad',
            'branch_id'     => $this->branch->id,
            'stock'         => 30,
            'is_available'  => true,
        ]);

        $this->addonRice = AddOn::create([
            'name'       => 'Extra Rice',
            'price'      => 20.00,
            'cost_price' => 5.00,
            'is_active'  => true,
        ]);

        $this->addonCheese = AddOn::create([
            'name'       => 'Cheese',
            'price'      => 15.00,
            'cost_price' => 4.00,
            'is_active'  => true,
        ]);

        $this->addonEgg = AddOn::create([
            'name'       => 'Extra Egg',
            'price'      => 25.00,
            'cost_price' => 8.00,
            'is_active'  => true,
        ]);
    }

    /**
     * Test 1 — Product without add-ons
     */
    public function test_rider_order_without_addons_returns_empty_addons_array_and_correct_totals(): void
    {
        $order = Order::create([
            'order_number'        => 'ORD-1001',
            'fulfillment_type'    => Order::FULFILLMENT_DELIVERY,
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'customer_name'       => 'Alice Customer',
            'contact_number'      => '09170001111',
            'address'             => 'Block 1 Lot 2, Quezon City',
            'total_amount'        => 190.00, // 150 + 40 delivery fee
            'status'              => 'ready_for_pickup',
        ]);

        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product1->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'price'           => 150.00,
            'unit_price'      => 150.00,
            'line_total'      => 150.00,
            'addon_total'     => 0.00,
            'selected_addons' => null,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => null,
            'status'           => Delivery::STATUS_READY,
            'delivery_type'    => 'internal',
            'delivery_fee'     => 40.00,
            'distance_km'      => 3.5,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Block 1 Lot 2, Quezon City',
            'is_active'        => true,
        ]);

        Sanctum::actingAs($this->rider);

        $response = $this->getJson('/api/v1/rider/available-deliveries');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $deliveries = $response->json('data');
        $target = collect($deliveries)->firstWhere('delivery_id', $delivery->id);
        $this->assertNotNull($target);

        $this->assertCount(1, $target['items']);
        $item = $target['items'][0];
        $this->assertEquals('Chicken Teriyaki', $item['product_name']);
        $this->assertEquals(1, $item['quantity']);
        $this->assertEquals(150.00, $item['price']);
        $this->assertEquals(150.00, $item['subtotal']);
        $this->assertEquals(0.00, $item['addon_total']);
        $this->assertIsArray($item['selected_addons']);
        $this->assertEmpty($item['selected_addons']);
        $this->assertIsArray($item['addons']);
        $this->assertEmpty($item['addons']);
    }

    /**
     * Test 2 — Product with 1 add-on
     */
    public function test_rider_order_with_single_addon_exposes_normalized_addon_and_correct_subtotal(): void
    {
        $order = Order::create([
            'order_number'        => 'ORD-1002',
            'fulfillment_type'    => Order::FULFILLMENT_DELIVERY,
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'customer_name'       => 'Alice Customer',
            'contact_number'      => '09170001111',
            'address'             => 'Block 1 Lot 2, Quezon City',
            'total_amount'        => 210.00, // 150 + 20 addon + 40 fee
            'status'              => 'assigned_to_rider',
            'rider_id'            => $this->rider->id,
        ]);

        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product1->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'price'           => 150.00,
            'unit_price'      => 150.00,
            'line_total'      => 170.00, // 150 + 20
            'addon_total'     => 20.00,
            'selected_addons' => [
                [
                    'addon_id'   => $this->addonRice->id,
                    'name'       => 'Extra Rice',
                    'price'      => 20.00,
                    'unit_price' => 20.00,
                    'quantity'   => 1,
                    'subtotal'   => 20.00,
                ]
            ],
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 40.00,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Block 1 Lot 2, Quezon City',
            'is_active'        => true,
        ]);

        Sanctum::actingAs($this->rider);

        $response = $this->getJson('/api/v1/rider/my-orders');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $deliveries = $response->json('data');
        $target = collect($deliveries)->firstWhere('delivery_id', $delivery->id);
        $this->assertNotNull($target);

        $item = $target['items'][0];
        $this->assertEquals('Chicken Teriyaki', $item['product_name']);
        $this->assertEquals(150.00, $item['price']);
        $this->assertEquals(20.00, $item['addon_total']);
        $this->assertEquals(170.00, $item['subtotal']);
        $this->assertCount(1, $item['selected_addons']);
        $this->assertEquals('Extra Rice', $item['selected_addons'][0]['name']);
        $this->assertEquals(20.00, $item['selected_addons'][0]['price']);
        $this->assertEquals(1, $item['selected_addons'][0]['quantity']);
    }

    /**
     * Test 3 — Product with multiple add-ons
     */
    public function test_rider_order_with_multiple_addons_exposes_all_selected_addons(): void
    {
        $order = Order::create([
            'order_number'        => 'ORD-1003',
            'fulfillment_type'    => Order::FULFILLMENT_DELIVERY,
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'customer_name'       => 'Alice Customer',
            'contact_number'      => '09170001111',
            'address'             => 'Block 1 Lot 2, Quezon City',
            'total_amount'        => 225.00, // 150 + (20+15) + 40 fee
            'status'              => 'assigned_to_rider',
            'rider_id'            => $this->rider->id,
        ]);

        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product1->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'price'           => 150.00,
            'unit_price'      => 150.00,
            'line_total'      => 185.00, // 150 + 20 + 15
            'addon_total'     => 35.00,
            'selected_addons' => [
                [
                    'addon_id'   => $this->addonRice->id,
                    'name'       => 'Extra Rice',
                    'price'      => 20.00,
                    'unit_price' => 20.00,
                    'quantity'   => 1,
                    'subtotal'   => 20.00,
                ],
                [
                    'addon_id'   => $this->addonCheese->id,
                    'name'       => 'Cheese',
                    'price'      => 15.00,
                    'unit_price' => 15.00,
                    'quantity'   => 1,
                    'subtotal'   => 15.00,
                ]
            ],
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 40.00,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Block 1 Lot 2, Quezon City',
            'is_active'        => true,
        ]);

        Sanctum::actingAs($this->rider);

        $response = $this->getJson('/api/v1/rider/my-orders');
        $target = collect($response->json('data'))->firstWhere('delivery_id', $delivery->id);

        $item = $target['items'][0];
        $this->assertEquals(35.00, $item['addon_total']);
        $this->assertEquals(185.00, $item['subtotal']);
        $this->assertCount(2, $item['addons']);
        $this->assertEquals(['Extra Rice', 'Cheese'], collect($item['addons'])->pluck('name')->all());
    }

    /**
     * Test 4 — Multiple products with distinct add-ons
     */
    public function test_rider_order_with_multiple_products_keeps_addons_strictly_attached_to_correct_item(): void
    {
        $order = Order::create([
            'order_number'        => 'ORD-1004',
            'fulfillment_type'    => Order::FULFILLMENT_DELIVERY,
            'user_id'             => $this->customer->id,
            'branch_id'           => $this->branch->id,
            'customer_name'       => 'Alice Customer',
            'contact_number'      => '09170001111',
            'address'             => 'Block 1 Lot 2, Quezon City',
            'total_amount'        => 480.00,
            'status'              => 'assigned_to_rider',
            'rider_id'            => $this->rider->id,
        ]);

        // Item 1: Chicken Teriyaki with Extra Rice and Cheese
        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product1->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'price'           => 150.00,
            'unit_price'      => 150.00,
            'line_total'      => 185.00,
            'addon_total'     => 35.00,
            'selected_addons' => [
                ['addon_id' => $this->addonRice->id, 'name' => 'Extra Rice', 'price' => 20.00, 'quantity' => 1, 'subtotal' => 20.00],
                ['addon_id' => $this->addonCheese->id, 'name' => 'Cheese', 'price' => 15.00, 'quantity' => 1, 'subtotal' => 15.00],
            ],
        ]);

        // Item 2: Beef Bento with Extra Egg (2x)
        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product2->id,
            'product_name'    => 'Beef Bento',
            'quantity'        => 1,
            'price'           => 220.00,
            'unit_price'      => 220.00,
            'line_total'      => 270.00, // 220 + (25 * 2)
            'addon_total'     => 50.00,
            'selected_addons' => [
                ['addon_id' => $this->addonEgg->id, 'name' => 'Extra Egg', 'price' => 25.00, 'quantity' => 2, 'subtotal' => 50.00],
            ],
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'status'           => 'assigned_to_rider',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 25.00,
            'customer_name'    => 'Alice Customer',
            'customer_phone'   => '09170001111',
            'customer_address' => 'Block 1 Lot 2, Quezon City',
            'is_active'        => true,
        ]);

        Sanctum::actingAs($this->rider);

        $response = $this->getJson('/api/v1/rider/my-orders');
        $target = collect($response->json('data'))->firstWhere('delivery_id', $delivery->id);

        $this->assertCount(2, $target['items']);

        $item1 = collect($target['items'])->firstWhere('product_name', 'Chicken Teriyaki');
        $this->assertEquals(185.00, $item1['subtotal']);
        $this->assertCount(2, $item1['addons']);
        $this->assertEquals(['Extra Rice', 'Cheese'], collect($item1['addons'])->pluck('name')->all());

        $item2 = collect($target['items'])->firstWhere('product_name', 'Beef Bento');
        $this->assertEquals(270.00, $item2['subtotal']);
        $this->assertCount(1, $item2['addons']);
        $this->assertEquals('Extra Egg', $item2['addons'][0]['name']);
        $this->assertEquals(2, $item2['addons'][0]['quantity']);
        $this->assertEquals(50.00, $item2['addons'][0]['subtotal']);
    }

    /**
     * Test 5 — Sale/POS delivery with add-ons
     */
    public function test_rider_sale_delivery_with_addons_formats_correctly(): void
    {
        $sale = Sale::create([
            'order_number'    => 'SALE-5001',
            'branch_id'       => $this->branch->id,
            'user_id'         => $this->customer->id,
            'type'            => 'delivery',
            'subtotal'        => 185.00,
            'total'           => 225.00,
            'paid_amount'     => 225.00,
            'change_amount'   => 0.00,
            'delivery_fee'    => 40.00,
            'payment_method'  => 'cash',
            'status'          => 'completed',
        ]);

        SaleItem::create([
            'sale_id'         => $sale->id,
            'product_id'      => $this->product1->id,
            'quantity'        => 1,
            'unit_price'      => 150.00,
            'cost_price'      => 60.00,
            'subtotal'        => 185.00,
            'addon_total'     => 35.00,
            'selected_addons' => [
                ['addon_id' => $this->addonRice->id, 'name' => 'Extra Rice', 'price' => 20.00, 'quantity' => 1, 'subtotal' => 20.00],
                ['addon_id' => $this->addonCheese->id, 'name' => 'Cheese', 'price' => 15.00, 'quantity' => 1, 'subtotal' => 15.00],
            ],
            'profit'          => 125.00,
        ]);

        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'rider_id'         => $this->rider->id,
            'status'           => 'in_transit',
            'delivery_type'    => 'internal',
            'delivery_fee'     => 40.00,
            'customer_name'    => 'Walk-in Phone Order',
            'customer_phone'   => '09179998888',
            'customer_address' => '77 Pioneer St, Pasig City',
            'is_active'        => true,
        ]);

        Sanctum::actingAs($this->rider);

        $response = $this->getJson('/api/v1/rider/my-orders');
        $target = collect($response->json('data'))->firstWhere('delivery_id', $delivery->id);

        $this->assertNotNull($target);
        $this->assertCount(1, $target['items']);
        $item = $target['items'][0];
        $this->assertEquals('Chicken Teriyaki', $item['product_name']);
        $this->assertEquals(185.00, $item['subtotal']);
        $this->assertEquals(35.00, $item['addon_total']);
        $this->assertCount(2, $item['addons']);
    }

    /**
     * Test 6 — Customer order show endpoint exposes add-ons
     */
    public function test_customer_order_detail_endpoint_exposes_selected_addons(): void
    {
        $order = Order::create([
            'order_number'     => 'ORD-2001',
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->branch->id,
            'customer_name'    => 'Alice Customer',
            'contact_number'   => '09170001111',
            'address'          => 'Block 1 Lot 2, Quezon City',
            'total_amount'     => 195.00,
            'status'           => 'pending',
        ]);

        OrderItem::create([
            'order_id'        => $order->id,
            'product_id'      => $this->product1->id,
            'product_name'    => 'Chicken Teriyaki',
            'quantity'        => 1,
            'price'           => 150.00,
            'unit_price'      => 150.00,
            'line_total'      => 170.00,
            'addon_total'     => 20.00,
            'selected_addons' => [
                ['addon_id' => $this->addonRice->id, 'name' => 'Extra Rice', 'price' => 20.00, 'quantity' => 1, 'subtotal' => 20.00]
            ],
        ]);

        Sanctum::actingAs($this->customer);

        $response = $this->getJson("/api/v1/customer/orders/{$order->id}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $item = $response->json('data.items.0');
        $this->assertEquals('Chicken Teriyaki', $item['product_name']);
        $this->assertEquals(20.00, $item['addon_total']);
        $this->assertEquals(170.00, $item['line_total']);
        $this->assertCount(1, $item['selected_addons']);
        $this->assertEquals('Extra Rice', $item['selected_addons'][0]['name']);
    }
}
