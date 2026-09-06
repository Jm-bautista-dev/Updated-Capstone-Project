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
use Tests\TestCase;

class DeliveryAddonVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    public User $admin;
    public User $cashier;
    public User $customer;
    public Product $productA;
    public Product $productB;
    public AddOn $addonRice;
    public AddOn $addonSauce;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                => 'Victoria Branch',
            'code'                => 'VIC',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.229371,
            'longitude'           => 121.328383,
            'delivery_radius_km'  => 25,
            'base_delivery_fee'   => 50.00,
            'has_internal_riders' => true,
            'is_active'           => true,
        ]);

        $this->admin = User::factory()->create([
            'name'      => 'Super Admin',
            'email'     => 'admin@milktea.test',
            'role'      => 'admin',
            'branch_id' => null,
            'must_change_password' => false,
        ]);

        $this->cashier = User::factory()->create([
            'name'      => 'Cashier Victoria',
            'email'     => 'cashier@milktea.test',
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
            'must_change_password' => false,
        ]);

        $this->customer = User::factory()->create([
            'name'          => 'Customer Jane',
            'email'         => 'jane@customer.test',
            'mobile_number' => '09123456789',
            'role'          => 'customer',
            'branch_id'     => $this->branch->id,
            'must_change_password' => false,
        ]);

        $category = Category::create([
            'name' => 'Meals',
            'is_active' => true,
        ]);

        $this->productA = Product::create([
            'name'          => 'Pork Katsudon',
            'selling_price' => 150.00,
            'cost_price'    => 80.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
            'stock'         => 100,
            'status'        => 'available',
        ]);
        $this->productA->branches()->attach($this->branch->id, ['stock' => 100]);

        $this->productB = Product::create([
            'name'          => 'Chicken Teriyaki Bento',
            'selling_price' => 180.00,
            'cost_price'    => 90.00,
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
            'stock'         => 100,
            'status'        => 'available',
        ]);
        $this->productB->branches()->attach($this->branch->id, ['stock' => 100]);

        $this->addonRice = AddOn::create([
            'name'       => 'Extra Rice',
            'price'      => 20.00,
            'cost_price' => 10.00,
            'category'   => 'sides',
            'is_active'  => true,
        ]);

        $this->addonSauce = AddOn::create([
            'name'       => 'Extra Sauce',
            'price'      => 15.00,
            'cost_price' => 5.00,
            'category'   => 'sides',
            'is_active'  => true,
        ]);

        // Attach add-ons to products
        $this->productA->addons()->attach([
            $this->addonRice->id  => ['is_active' => true, 'max_quantity' => 5],
            $this->addonSauce->id => ['is_active' => true, 'max_quantity' => 5],
        ]);
        $this->productB->addons()->attach([
            $this->addonRice->id  => ['is_active' => true, 'max_quantity' => 5],
            $this->addonSauce->id => ['is_active' => true, 'max_quantity' => 5],
        ]);
    }

    /**
     * Test 1 & 2: Mobile delivery order with multiple add-ons correctly creates Order, OrderItems,
     * Delivery, and serializes selected_addons when loading the /deliveries dashboard.
     */
    public function test_mobile_delivery_order_with_addons_persists_and_loads_in_deliveries(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        $orderPayload = [
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => 'delivery',
            'address'          => '123 Main St, Victoria',
            'latitude'         => 14.229371,
            'longitude'        => 121.328383,
            'customer_name'    => 'Jane Customer',
            'mobile_number'    => '09123456789',
            'payment_method'   => 'cash',
            'delivery_fee'     => 50.00,
            'total_amount'     => 255.00, // 150 + (20*2 + 15) + 50 = 255
            'items'            => [
                [
                    'product_id'      => $this->productA->id,
                    'quantity'        => 1,
                    'price'           => 150.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonRice->id,
                            'quantity' => 2,
                        ],
                        [
                            'addon_id' => $this->addonSauce->id,
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/customer/orders', $orderPayload);
        $response->assertStatus(201);

        $orderId = $response->json('order_id');
        $this->assertNotNull($orderId);

        // Verify Order in DB
        $order = Order::with('items')->find($orderId);
        $this->assertNotNull($order);
        $this->assertCount(1, $order->items);

        $orderItem = $order->items->first();
        $this->assertNotNull($orderItem->selected_addons);
        $this->assertCount(2, $orderItem->selected_addons);
        $this->assertEquals(55.00, (float) $orderItem->addon_total); // (20*2) + (15*1) = 55

        // Verify Delivery record exists
        $delivery = Delivery::where('order_id', $orderId)->first();
        $this->assertNotNull($delivery);

        // Fetch /deliveries as Admin (Inertia view)
        $this->actingAs($this->admin);
        $pageResponse = $this->get('/deliveries');
        $pageResponse->assertStatus(200);

        $pageResponse->assertInertia(function ($page) use ($orderId) {
            $deliveries = $page->toArray()['props']['deliveries']['data'];
            $targetDelivery = collect($deliveries)->firstWhere('order_id', $orderId);

            $this->assertNotNull($targetDelivery, 'Delivery with order_id was found in deliveries props');
            $this->assertNotEmpty($targetDelivery['order']['items']);
            $firstItem = $targetDelivery['order']['items'][0];
            $this->assertArrayHasKey('selected_addons', $firstItem);
            $this->assertCount(2, $firstItem['selected_addons']);
            $this->assertEquals('Extra Rice', $firstItem['selected_addons'][0]['name']);
            $this->assertEquals(2, $firstItem['selected_addons'][0]['quantity']);
            $this->assertEquals('Extra Sauce', $firstItem['selected_addons'][1]['name']);
            $this->assertEquals(1, $firstItem['selected_addons'][1]['quantity']);
        });
    }

    /**
     * Test 4: Multiple products with distinct add-ons are correctly associated with their parent items.
     */
    public function test_multiple_products_with_distinct_addons_remain_associated(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        $orderPayload = [
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => 'delivery',
            'address'          => '456 Side St, Victoria',
            'latitude'         => 14.229371,
            'longitude'        => 121.328383,
            'customer_name'    => 'Jane Customer',
            'mobile_number'    => '09123456789',
            'payment_method'   => 'cash',
            'delivery_fee'     => 50.00,
            'total_amount'     => 580.00,
            'items'            => [
                [
                    'product_id'      => $this->productA->id,
                    'quantity'        => 2,
                    'price'           => 150.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonRice->id,
                            'quantity' => 1,
                        ],
                    ],
                ],
                [
                    'product_id'      => $this->productB->id,
                    'quantity'        => 1,
                    'price'           => 180.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonSauce->id,
                            'quantity' => 2,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/customer/orders', $orderPayload);
        $response->assertStatus(201);
        $orderId = $response->json('order_id');

        $this->actingAs($this->admin);
        $pageResponse = $this->get('/deliveries');
        $pageResponse->assertStatus(200);

        $pageResponse->assertInertia(function ($page) use ($orderId) {
            $deliveries = $page->toArray()['props']['deliveries']['data'];
            $targetDelivery = collect($deliveries)->firstWhere('order_id', $orderId);

            $this->assertNotNull($targetDelivery);
            $items = $targetDelivery['order']['items'];
            $this->assertCount(2, $items);

            // Item 1 (Product A) has Extra Rice only
            $itemA = collect($items)->firstWhere('product_id', $this->productA->id);
            $this->assertNotNull($itemA);
            $this->assertCount(1, $itemA['selected_addons']);
            $this->assertEquals('Extra Rice', $itemA['selected_addons'][0]['name']);

            // Item 2 (Product B) has Extra Sauce only
            $itemB = collect($items)->firstWhere('product_id', $this->productB->id);
            $this->assertNotNull($itemB);
            $this->assertCount(1, $itemB['selected_addons']);
            $this->assertEquals('Extra Sauce', $itemB['selected_addons'][0]['name']);
        });
    }

    /**
     * Test 5 & Legacy: Products without add-ons handle null/empty gracefully.
     */
    public function test_delivery_order_without_addons_handles_null_safely(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        $orderPayload = [
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => 'delivery',
            'address'          => '789 Elm St, Victoria',
            'latitude'         => 14.229371,
            'longitude'        => 121.328383,
            'customer_name'    => 'Jane Customer',
            'mobile_number'    => '09123456789',
            'payment_method'   => 'cash',
            'delivery_fee'     => 50.00,
            'total_amount'     => 200.00,
            'items'            => [
                [
                    'product_id' => $this->productA->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/customer/orders', $orderPayload);
        $response->assertStatus(201);
        $orderId = $response->json('order_id');

        $this->actingAs($this->admin);
        $pageResponse = $this->get('/deliveries');
        $pageResponse->assertStatus(200);

        $pageResponse->assertInertia(function ($page) use ($orderId) {
            $deliveries = $page->toArray()['props']['deliveries']['data'];
            $targetDelivery = collect($deliveries)->firstWhere('order_id', $orderId);

            $this->assertNotNull($targetDelivery);
            $firstItem = $targetDelivery['order']['items'][0];
            $this->assertTrue(empty($firstItem['selected_addons']));
        });
    }

    /**
     * Test 8 & Historical Snapshot: Add-on price snapshot represents purchase time, not catalog update.
     */
    public function test_historical_addon_price_remains_intact_when_catalog_price_changes(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        // Initial purchase with Extra Rice at ₱20.00
        $orderPayload = [
            'branch_id'        => $this->branch->id,
            'fulfillment_type' => 'delivery',
            'address'          => '999 Historical Rd, Victoria',
            'latitude'         => 14.229371,
            'longitude'        => 121.328383,
            'customer_name'    => 'Jane Customer',
            'mobile_number'    => '09123456789',
            'payment_method'   => 'cash',
            'delivery_fee'     => 50.00,
            'total_amount'     => 220.00,
            'items'            => [
                [
                    'product_id'      => $this->productA->id,
                    'quantity'        => 1,
                    'price'           => 150.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonRice->id,
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/customer/orders', $orderPayload);
        $response->assertStatus(201);
        $orderId = $response->json('order_id');

        // Now catalog price increases from ₱20.00 to ₱50.00
        $this->addonRice->update(['price' => 50.00]);

        // Query /deliveries as Admin
        $this->actingAs($this->admin);
        $pageResponse = $this->get('/deliveries');
        $pageResponse->assertStatus(200);

        $pageResponse->assertInertia(function ($page) use ($orderId) {
            $deliveries = $page->toArray()['props']['deliveries']['data'];
            $targetDelivery = collect($deliveries)->firstWhere('order_id', $orderId);

            $this->assertNotNull($targetDelivery);
            $addon = $targetDelivery['order']['items'][0]['selected_addons'][0];
            // Must remain the historical snapshot ₱20.00, NOT the new catalog price ₱50.00
            $this->assertEquals(20.00, (float) $addon['price']);
        });
    }

    /**
     * Test 7: POS delivery order with add-ons is persisted and loaded in Delivery queue with selected_addons.
     */
    public function test_pos_delivery_sale_with_addons_persists_and_loads_in_deliveries(): void
    {
        $this->actingAs($this->cashier);

        \App\Models\CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'status'          => 'open',
            'opening_balance' => 1000.00,
            'opened_at'       => now(),
        ]);

        $saleService = app(\App\Services\SaleService::class);

        $saleData = [
            'branch_id'      => $this->branch->id,
            'type'           => 'delivery',
            'payment_method' => 'cash',
            'paid_amount'    => 300.00,
            'delivery_fee'   => 50.00,
            'customer_name'  => 'POS Delivery Customer',
            'customer_phone' => '09123456789',
            'delivery_address' => '456 Market St, Victoria',
            'latitude'       => 14.229371,
            'longitude'      => 121.328383,
            'items'          => [
                [
                    'product_id'      => $this->productA->id,
                    'quantity'        => 1,
                    'unit_price'      => 150.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonRice->id,
                            'name'     => 'Extra Rice',
                            'price'    => 20.00,
                            'quantity' => 2,
                        ],
                    ],
                ],
            ],
        ];

        $sale = $saleService->processSale($saleData);
        $this->assertNotNull($sale);

        // Verify sale item has selected_addons
        $saleItem = $sale->items()->first();
        $this->assertNotNull($saleItem);
        $this->assertNotNull($saleItem->selected_addons);
        $this->assertCount(1, $saleItem->selected_addons);
        $this->assertEquals('Extra Rice', $saleItem->selected_addons[0]['name']);
        $this->assertEquals(2, $saleItem->selected_addons[0]['quantity']);

        // Create linked Delivery record for POS sale
        $delivery = Delivery::create([
            'sale_id'          => $sale->id,
            'delivery_type'    => 'internal',
            'customer_name'    => 'POS Delivery Customer',
            'customer_address' => '456 Market St, Victoria',
            'customer_phone'   => '09123456789',
            'delivery_fee'     => 50.00,
            'status'           => Delivery::STATUS_PENDING,
        ]);
        $this->assertNotNull($delivery);

        // Fetch /deliveries as Admin
        $this->actingAs($this->admin);
        $pageResponse = $this->get('/deliveries');
        $pageResponse->assertStatus(200);

        $pageResponse->assertInertia(function ($page) use ($sale) {
            $deliveries = $page->toArray()['props']['deliveries']['data'];
            $targetDelivery = collect($deliveries)->firstWhere('sale_id', $sale->id);

            $this->assertNotNull($targetDelivery);
            $this->assertNotEmpty($targetDelivery['sale']['items']);
            $firstItem = $targetDelivery['sale']['items'][0];
            $this->assertArrayHasKey('selected_addons', $firstItem);
            $this->assertCount(1, $firstItem['selected_addons']);
            $this->assertEquals('Extra Rice', $firstItem['selected_addons'][0]['name']);
            $this->assertEquals(2, $firstItem['selected_addons'][0]['quantity']);
        });
    }
}
