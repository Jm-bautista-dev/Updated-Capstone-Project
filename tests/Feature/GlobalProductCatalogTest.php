<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\ProductService;
use App\Services\InventoryService;
use App\Services\SaleService;

class GlobalProductCatalogTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $staCruz;
    protected User $admin;
    protected User $customer;
    protected ProductService $productService;
    protected InventoryService $inventoryService;
    protected SaleService $saleService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create([
            'name'                => 'Maki Desu Victoria',
            'code'                => 'VIC',
            'address'             => 'Victoria, Laguna',
            'is_active'           => true,
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49.00,
        ]);

        $this->staCruz = Branch::create([
            'name'                => 'Maki Desu Sta. Cruz',
            'code'                => 'STC',
            'address'             => 'Sta. Cruz, Laguna',
            'is_active'           => true,
            'delivery_radius_km'  => 10,
            'base_delivery_fee'   => 49.00,
        ]);

        $this->category = Category::create([
            'name'      => 'Maki & Rolls',
            'is_active' => true,
        ]);

        $this->admin = User::create([
            'name'           => 'Admin User',
            'first_name'     => 'Admin',
            'last_name'      => 'User',
            'email'          => 'admin@makidesu.test',
            'password'       => bcrypt('Password123!'),
            'role'           => User::ROLE_ADMIN,
            'branch_id'      => $this->victoria->id,
            'account_status' => 'active',
        ]);

        $this->customer = User::create([
            'name'           => 'Juan Dela Cruz',
            'first_name'     => 'Juan',
            'last_name'      => 'Dela Cruz',
            'email'          => 'customer@makidesu.test',
            'password'       => bcrypt('Password123!'),
            'role'           => User::ROLE_CUSTOMER,
            'account_status' => 'active',
        ]);

        $this->productService = app(ProductService::class);
        $this->inventoryService = app(InventoryService::class);
        $this->saleService = app(SaleService::class);
    }

    /**
     * Test 1 — Create product in one branch.
     * Expected: 1 product, 1 branch inventory record with stock 10.
     */
    public function test_1_create_product_in_one_branch(): void
    {
        $payload = [
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 10,
            'branch_ids'    => [$this->victoria->id],
            'branch_option' => 'single',
            'branch_id'     => $this->victoria->id,
        ];

        $product = $this->productService->store($payload, null, [$this->victoria]);

        // Asserts
        $this->assertEquals(1, Product::where('name', 'Test Roll')->count(), 'Expected exactly 1 product record.');
        $this->assertNull($product->branch_id, 'Global product must have branch_id = null.');

        $branchProducts = DB::table('branch_product')->where('product_id', $product->id)->get();
        $this->assertEquals(1, $branchProducts->count(), 'Expected 1 branch inventory record.');
        $this->assertEquals($this->victoria->id, $branchProducts->first()->branch_id);
        $this->assertEquals(10.00, (float) $branchProducts->first()->stock);

        $availVictoria = $product->dynamicAvailability($this->victoria->id);
        $this->assertEquals(10, $availVictoria['available']);
        $this->assertTrue($availVictoria['is_available']);
    }

    /**
     * Test 2 — Add same product to second branch.
     * Expected: Still 1 product record, Victoria: 10, Sta. Cruz: 5, Total: 15. NOT 2 products.
     */
    public function test_2_add_same_product_to_second_branch(): void
    {
        // 1. Create in Victoria
        $product = $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 10,
            'branch_ids'    => [$this->victoria->id],
        ], null, [$this->victoria]);

        // 2. Add to Sta. Cruz
        $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 5,
            'branch_ids'    => [$this->staCruz->id],
        ], null, [$this->staCruz]);

        // Asserts
        $this->assertEquals(1, Product::where('name', 'Test Roll')->count(), 'DO NOT create duplicate product records.');

        $stockVictoria = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->victoria->id)
            ->value('stock');

        $stockStaCruz = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->staCruz->id)
            ->value('stock');

        $this->assertEquals(10.00, $stockVictoria, 'Victoria stock must be 10.');
        $this->assertEquals(5.00, $stockStaCruz, 'Sta. Cruz stock must be 5.');

        // Total calculated stock
        $globalAvail = $product->dynamicAvailability(null);
        $this->assertEquals(15.00, $globalAvail['total_stock'], 'Total stock must be sum: 10 + 5 = 15.');
        $this->assertEquals(15.00, $product->computed_stock, 'computed_stock must equal 15.');
    }

    /**
     * Test 3 — Order from Victoria.
     * Before: Victoria: 10, Sta. Cruz: 5, Total: 15.
     * Order: Victoria x 1.
     * Expected: Victoria: 9, Sta. Cruz: 5, Total: 14.
     */
    public function test_3_order_from_victoria(): void
    {
        $product = $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 10,
            'branch_ids'    => [$this->victoria->id],
        ], null, [$this->victoria]);

        $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 5,
            'branch_ids'    => [$this->staCruz->id],
        ], null, [$this->staCruz]);

        // Place Order from Victoria x 1
        $order = Order::create([
            'order_number'     => 'ORD-VIC-001',
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->victoria->id,
            'customer_name'    => 'Juan Dela Cruz',
            'status'           => 'pending',
            'fulfillment_type' => 'pickup',
            'subtotal'         => 150.00,
            'total'            => 150.00,
            'total_amount'     => 150.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'price'      => 150.00,
            'subtotal'   => 150.00,
        ]);

        // Deduct for order
        $this->inventoryService->deductForOrder($order);

        $stockVictoria = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->victoria->id)
            ->value('stock');

        $stockStaCruz = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->staCruz->id)
            ->value('stock');

        $this->assertEquals(9.00, $stockVictoria, 'Victoria stock must decrease from 10 to 9.');
        $this->assertEquals(5.00, $stockStaCruz, 'Sta. Cruz stock must remain 5.');

        $globalAvail = $product->dynamicAvailability(null);
        $this->assertEquals(14.00, $globalAvail['total_stock'], 'Total stock must be 9 + 5 = 14.');
    }

    /**
     * Test 4 — Order from Sta. Cruz.
     * Before: Victoria: 9, Sta. Cruz: 5, Total: 14.
     * Order: Sta. Cruz x 2.
     * Expected: Victoria: 9, Sta. Cruz: 3, Total: 12.
     */
    public function test_4_order_from_sta_cruz(): void
    {
        $product = $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 9,
            'branch_ids'    => [$this->victoria->id],
        ], null, [$this->victoria]);

        $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 5,
            'branch_ids'    => [$this->staCruz->id],
        ], null, [$this->staCruz]);

        // Place Order from Sta. Cruz x 2
        $order = Order::create([
            'order_number'     => 'ORD-STC-002',
            'user_id'          => $this->customer->id,
            'branch_id'        => $this->staCruz->id,
            'customer_name'    => 'Juan Dela Cruz',
            'status'           => 'pending',
            'fulfillment_type' => 'delivery',
            'subtotal'         => 300.00,
            'total'            => 349.00,
            'total_amount'     => 349.00,
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
            'quantity'   => 2,
            'price'      => 150.00,
            'subtotal'   => 300.00,
        ]);

        $this->inventoryService->deductForOrder($order);

        $stockVictoria = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->victoria->id)
            ->value('stock');

        $stockStaCruz = (float) DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $this->staCruz->id)
            ->value('stock');

        $this->assertEquals(9.00, $stockVictoria, 'Victoria stock must remain unchanged at 9.');
        $this->assertEquals(3.00, $stockStaCruz, 'Sta. Cruz stock must decrease from 5 to 3.');

        $globalAvail = $product->dynamicAvailability(null);
        $this->assertEquals(12.00, $globalAvail['total_stock'], 'Total stock must be 9 + 3 = 12.');
    }

    /**
     * Test 5 — Insufficient branch stock.
     * Victoria: 2, Sta. Cruz: 10.
     * Attempt: Victoria order = 3.
     * Expected: ORDER REJECTED because Victoria only has 2 (must not use Sta. Cruz stock).
     */
    public function test_5_insufficient_branch_stock(): void
    {
        $product = $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 2,
            'branch_ids'    => [$this->victoria->id],
        ], null, [$this->victoria]);

        $this->productService->store([
            'name'          => 'Test Roll',
            'sku'           => 'TEST-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 150.00,
            'unit'          => 'pcs',
            'stock'         => 10,
            'branch_ids'    => [$this->staCruz->id],
        ], null, [$this->staCruz]);

        // Attempt stock check for quantity 3 in Victoria
        $stockCheck = $product->simpleStockCheck(3, $this->victoria->id);
        $this->assertFalse($stockCheck['success'], 'Order for 3 must fail because Victoria only has 2.');
        $this->assertStringContainsString('Insufficient physical stock', $stockCheck['message']);

        // Attempt batch stock check
        $batchCheck = Product::validateBatchStock($this->victoria->id, [
            ['product_id' => $product->id, 'quantity' => 3]
        ]);
        $this->assertFalse($batchCheck['success'], 'Batch check must fail for Victoria.');

        // Verify Sta. Cruz allows ordering 3
        $staCruzCheck = $product->simpleStockCheck(3, $this->staCruz->id);
        $this->assertTrue($staCruzCheck['success'], 'Sta. Cruz has 10, so ordering 3 should succeed.');
    }

    /**
     * Test 6 — Mobile API Branch Scoping.
     * Verifies that GET /api/v1/products?branch_id=... returns the single global product with branch-specific availability.
     */
    public function test_6_mobile_api_branch_scoping(): void
    {
        $product = $this->productService->store([
            'name'          => 'Sample Roll',
            'sku'           => 'SAMPLE-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 200.00,
            'unit'          => 'pcs',
            'stock'         => 4,
            'branch_ids'    => [$this->victoria->id],
        ], null, [$this->victoria]);

        $this->productService->store([
            'name'          => 'Sample Roll',
            'sku'           => 'SAMPLE-ROLL-001',
            'category_id'   => $this->category->id,
            'selling_price' => 200.00,
            'unit'          => 'pcs',
            'stock'         => 7,
            'branch_ids'    => [$this->staCruz->id],
        ], null, [$this->staCruz]);

        // Query Victoria
        $responseVic = $this->getJson("/api/v1/products?branch_id={$this->victoria->id}");
        $responseVic->assertStatus(200);
        $vicData = collect($responseVic->json('products'))->firstWhere('id', $product->id);
        $this->assertNotNull($vicData);
        $this->assertEquals(4.0, (float) $vicData['stock'], 'Mobile API must return Victoria stock (4) for Victoria.');

        // Query Sta. Cruz
        $responseStc = $this->getJson("/api/v1/products?branch_id={$this->staCruz->id}");
        $responseStc->assertStatus(200);
        $stcData = collect($responseStc->json('products'))->firstWhere('id', $product->id);
        $this->assertNotNull($stcData);
        $this->assertEquals(7.0, (float) $stcData['stock'], 'Mobile API must return Sta. Cruz stock (7) for Sta. Cruz.');
    }

    /**
     * Test 7 — Safe Duplicate Consolidation Command.
     */
    public function test_7_safe_duplicate_consolidation(): void
    {
        // Setup legacy duplicate products
        $prodA = Product::create([
            'name'          => 'Duplicate Roll',
            'sku'           => 'DUP-001-A',
            'category_id'   => $this->category->id,
            'selling_price' => 120.00,
            'branch_id'     => $this->victoria->id,
            'stock'         => 5,
        ]);

        $prodB = Product::create([
            'name'          => 'Duplicate Roll',
            'sku'           => 'DUP-001-B',
            'category_id'   => $this->category->id,
            'selling_price' => 120.00,
            'branch_id'     => $this->staCruz->id,
            'stock'         => 5,
        ]);

        $this->artisan('makidesu:consolidate-products --force')
            ->assertExitCode(0);

        // Prod A should be master with branch_id = null
        $prodA->refresh();
        $this->assertNull($prodA->branch_id);

        // Prod B should be soft deleted
        $this->assertNotNull(Product::withTrashed()->find($prodB->id)->deleted_at);

        // Stock in branch_product
        $vStock = (float) DB::table('branch_product')->where('product_id', $prodA->id)->where('branch_id', $this->victoria->id)->value('stock');
        $sStock = (float) DB::table('branch_product')->where('product_id', $prodA->id)->where('branch_id', $this->staCruz->id)->value('stock');

        $this->assertEquals(5.0, $vStock);
        $this->assertEquals(5.0, $sStock);

        $avail = $prodA->dynamicAvailability(null);
        $this->assertEquals(10.0, $avail['total_stock'], 'Consolidated total stock must equal 5 + 5 = 10.');
    }
}
