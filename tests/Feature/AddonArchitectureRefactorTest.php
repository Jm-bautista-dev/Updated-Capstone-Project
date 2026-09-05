<?php

namespace Tests\Feature;

use App\Models\AddOn;
use App\Models\Branch;
use App\Models\Category;
use App\Models\CashierShift;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddonArchitectureRefactorTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public User $cashier;
    public User $customer;
    public $branch;
    public $category;
    public Product $productA;
    public Product $productB;
    public Product $productC;
    public AddOn $addonRice;
    public AddOn $addonSauce;
    public AddOn $addonCheese;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name' => 'Main Test Branch',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->branch->id,
            'must_change_password' => false,
        ]);

        $this->cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch->id,
            'must_change_password' => false,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
            'must_change_password' => false,
        ]);

        $this->category = Category::create([
            'name' => 'Japanese Specialties',
            'is_active' => true,
        ]);

        // Products
        $this->productA = Product::create([
            'name' => 'Chicken Teriyaki Bento',
            'selling_price' => 150.00,
            'cost_price' => 80.00,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'stock' => 50,
            'status' => 'available',
        ]);
        $this->productA->branches()->attach($this->branch->id, ['stock' => 50]);

        $this->productB = Product::create([
            'name' => 'Beef Ramen Deluxe',
            'selling_price' => 220.00,
            'cost_price' => 110.00,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'stock' => 50,
            'status' => 'available',
        ]);
        $this->productB->branches()->attach($this->branch->id, ['stock' => 50]);

        $this->productC = Product::create([
            'name' => 'Plain Green Tea',
            'selling_price' => 50.00,
            'cost_price' => 20.00,
            'category_id' => $this->category->id,
            'branch_id' => $this->branch->id,
            'stock' => 50,
            'status' => 'available',
        ]);
        $this->productC->branches()->attach($this->branch->id, ['stock' => 50]);

        // Global Add-ons Catalog
        $this->addonRice = AddOn::create([
            'name' => 'Extra Rice',
            'price' => 20.00,
            'cost_price' => 5.00,
            'is_active' => true,
        ]);

        $this->addonSauce = AddOn::create([
            'name' => 'Extra Teriyaki Sauce',
            'price' => 15.00,
            'cost_price' => 3.00,
            'is_active' => true,
        ]);

        $this->addonCheese = AddOn::create([
            'name' => 'Melted Mozzarella Cheese',
            'price' => 35.00,
            'cost_price' => 12.00,
            'is_active' => true,
        ]);

        // Assign to Product A: Rice, Sauce
        $this->productA->addons()->attach([
            $this->addonRice->id => ['max_quantity' => 2],
            $this->addonSauce->id => ['max_quantity' => 3],
        ]);

        // Assign to Product B: Sauce, Cheese
        $this->productB->addons()->attach([
            $this->addonSauce->id => ['max_quantity' => 2],
            $this->addonCheese->id => ['max_quantity' => 1],
        ]);

        // Product C has NO add-ons assigned!

        CashierShift::create([
            'cashier_id' => $this->cashier->id,
            'branch_id' => $this->branch->id,
            'status' => 'open',
            'opening_balance' => 1000.00,
            'opened_at' => now(),
        ]);
    }

    public function test_global_addon_catalog_reuse_across_multiple_products(): void
    {
        // Assert Extra Teriyaki Sauce is attached to both Product A and Product B
        $this->assertTrue($this->addonSauce->products->contains($this->productA->id));
        $this->assertTrue($this->addonSauce->products->contains($this->productB->id));

        // Assert Extra Rice is only attached to Product A
        $this->assertTrue($this->addonRice->products->contains($this->productA->id));
        $this->assertFalse($this->addonRice->products->contains($this->productB->id));

        // Assert Product C has 0 direct addons
        $this->assertCount(0, $this->productC->addons);
    }

    public function test_product_detail_and_menu_api_returns_only_assigned_addons(): void
    {
        // 1. Check Product A detail endpoint
        $responseA = $this->getJson("/api/v1/products/{$this->productA->id}");
        $responseA->assertOk();
        $dataA = $responseA->json();
        $addonsA = $dataA['data']['addons'] ?? [];

        $this->assertCount(2, $addonsA);
        $addonNamesA = array_column($addonsA, 'name');
        $this->assertContains('Extra Rice', $addonNamesA);
        $this->assertContains('Extra Teriyaki Sauce', $addonNamesA);
        $this->assertNotContains('Melted Mozzarella Cheese', $addonNamesA);

        // 2. Check Product C (unassigned) returns empty addons array
        $responseC = $this->getJson("/api/v1/products/{$this->productC->id}");
        $responseC->assertOk();
        $dataC = $responseC->json();
        $addonsC = $dataC['data']['addons'] ?? [];

        $this->assertIsArray($addonsC);
        $this->assertCount(0, $addonsC);
    }

    public function test_unassigned_addon_rejected_during_api_order_placement(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        // Attempt to order Product C (Plain Green Tea) with Extra Rice (not assigned to Product C)
        $orderPayload = [
            'branch_id' => $this->branch->id,
            'fulfillment_type' => 'pickup',
            'scheduled_pickup_at' => now()->addHour()->toDateTimeString(),
            'customer_name' => 'John Doe',
            'mobile_number' => '09123456789',
            'payment_method' => 'cash',
            'total_amount' => 70.00,
            'items' => [
                [
                    'product_id' => $this->productC->id,
                    'quantity' => 1,
                    'price' => 50.00,
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

        // Must reject with 422 Unprocessable Entity
        $response->assertStatus(422);
        $response->assertJsonFragment([
            'message' => "Add-on 'Extra Rice' is not assigned to product 'Plain Green Tea'.",
        ]);
    }

    public function test_authoritative_backend_pricing_prevents_tampering(): void
    {
        $this->actingAs($this->customer, 'sanctum');

        // Client attempts to pass a tampered price of ₱0.01 for Extra Rice (catalog price is ₱20.00)
        $orderPayload = [
            'branch_id' => $this->branch->id,
            'fulfillment_type' => 'pickup',
            'scheduled_pickup_at' => now()->addHour()->toDateTimeString(),
            'customer_name' => 'John Doe',
            'mobile_number' => '09123456789',
            'payment_method' => 'cash',
            'total_amount' => 150.01,
            'items' => [
                [
                    'product_id' => $this->productA->id,
                    'quantity' => 1,
                    'price' => 150.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonRice->id,
                            'name' => 'Extra Rice',
                            'price' => 0.01, // Tampered client price!
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/v1/customer/orders', $orderPayload);
        $response->assertStatus(201);

        $totalAmount = (float) $response->json('total_amount');
        $orderId = $response->json('order_id');
        
        // Product A (150.00) + Extra Rice (20.00) = 170.00 (NOT 150.01)
        $this->assertEquals(170.00, $totalAmount);

        // Check the persisted order item
        $orderItem = \App\Models\OrderItem::where('order_id', $orderId)->first();
        $this->assertNotNull($orderItem);
        $this->assertEquals(150.00, (float) $orderItem->unit_price);
        $this->assertEquals(20.00, (float) $orderItem->addon_total);
        $this->assertEquals(170.00, (float) $orderItem->line_total);

        // Check snapshot inside selected_addons
        $selectedAddons = is_string($orderItem->selected_addons)
            ? json_decode($orderItem->selected_addons, true)
            : $orderItem->selected_addons;

        $this->assertCount(1, $selectedAddons);
        $this->assertEquals(20.00, (float) $selectedAddons[0]['price']);
        $this->assertEquals('Extra Rice', $selectedAddons[0]['name']);
    }

    public function test_pos_sale_checkout_enforces_authoritative_addon_pricing(): void
    {
        $this->actingAs($this->cashier);
        $saleService = app(SaleService::class);

        $saleData = [
            'branch_id' => $this->branch->id,
            'type' => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount' => 300.00,
            'items' => [
                [
                    'product_id' => $this->productB->id,
                    'quantity' => 1,
                    'unit_price' => 220.00,
                    'selected_addons' => [
                        [
                            'addon_id' => $this->addonCheese->id,
                            'price' => 1.00, // Tampered price
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ];

        $sale = $saleService->processSale($saleData);

        // Product B (220.00) + Cheese (35.00) = 255.00
        $this->assertEquals(255.00, (float) $sale->total);

        $saleItem = $sale->items->first();
        $this->assertEquals(35.00, (float) $saleItem->addon_total);
        $this->assertEquals(255.00, (float) $saleItem->subtotal);

        $addons = is_string($saleItem->selected_addons)
            ? json_decode($saleItem->selected_addons, true)
            : $saleItem->selected_addons;

        $this->assertEquals(35.00, (float) $addons[0]['price']);
        $this->assertEquals('Melted Mozzarella Cheese', $addons[0]['name']);
    }

    public function test_admin_can_assign_products_to_addon_via_assign_endpoint(): void
    {
        $this->actingAs($this->admin);

        // Assign Product C to addonRice
        $response = $this->post("/admin/addons/{$this->addonRice->id}/assign-products", [
            'product_ids' => [$this->productA->id, $this->productC->id],
        ]);

        $response->assertRedirect();

        // Refresh model relations
        $this->addonRice->refresh();
        $this->assertTrue($this->addonRice->products->contains($this->productC->id));
        $this->assertTrue($this->addonRice->products->contains($this->productA->id));

        // Now Product C API detail should include Extra Rice
        $responseC = $this->getJson("/api/v1/products/{$this->productC->id}");
        $responseC->assertOk();
        $addonsC = $responseC->json('data.addons');
        $this->assertCount(1, $addonsC);
        $this->assertEquals('Extra Rice', $addonsC[0]['name']);
    }

    public function test_product_update_syncs_direct_addon_ids(): void
    {
        $this->actingAs($this->admin);

        // Update Product C through web controller to attach Cheese
        $response = $this->put("/products/{$this->productC->id}", [
            'name' => 'Plain Green Tea Special',
            'selling_price' => 55.00,
            'cost_price' => 22.00,
            'category_id' => $this->category->id,
            'branch_option' => 'single',
            'branch_id' => $this->branch->id,
            'branch_ids' => [$this->branch->id],
            'unit' => 'pcs',
            'addon_ids' => [$this->addonCheese->id],
        ]);

        $response->assertRedirect();

        $this->productC->refresh();
        $this->assertCount(1, $this->productC->addons);
        $this->assertEquals($this->addonCheese->id, $this->productC->addons->first()->id);
    }
}
