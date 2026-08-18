<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\OrderFulfillmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierSalesAndReportsBranchScopingTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoria;
    protected Branch $santaCruz;
    protected User $cashierVictoria;
    protected User $cashierSantaCruz;
    protected User $admin;
    protected User $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoria = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);
        $this->santaCruz = Branch::create(['name' => 'Maki Desu Santa Cruz', 'address' => 'Santa Cruz, Laguna']);

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

        $cat = Category::create(['name' => 'Sushi Rolls']);
        $this->product = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'MAK-001',
            'category_id'   => $cat->id,
            'selling_price' => 150.00,
            'status'        => 'in_stock',
        ]);
    }

    public function test_delivered_mobile_order_appears_in_victoria_cashier_sales_and_reports()
    {
        // 1. Customer places online delivery order for Victoria branch
        $order = Order::create([
            'order_number'    => 'ORD-19',
            'user_id'         => $this->customer->id,
            'branch_id'       => $this->victoria->id,
            'customer_name'   => 'Alice Wonderland',
            'customer_phone'  => '09123456789',
            'delivery_address'=> '123 Main St, Victoria',
            'payment_method'  => 'online',
            'total_amount'    => 300.00,
            'status'          => 'pending',
        ]);

        OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $this->product->id,
            'quantity'   => 2,
            'price'      => 150.00,
            'subtotal'   => 300.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'status'           => 'pending',
            'customer_name'    => 'Alice Wonderland',
            'customer_phone'   => '09123456789',
            'customer_address' => '123 Main St, Victoria',
            'tracking_no'      => 'TRK-ORD-19',
        ]);

        // 2. Mark order as delivered via OrderFulfillmentService
        app(OrderFulfillmentService::class)->onOrderDelivered($order, $delivery);

        // 3. Verify Sale record was created with order_number ORD-19 and branch_id of Victoria
        $sale = Sale::where('order_number', 'ORD-19')->first();
        $this->assertNotNull($sale);
        $this->assertEquals($this->victoria->id, $sale->branch_id);
        $this->assertEquals(300.00, (float) $sale->total);

        // Verify no duplicate sales records created
        $this->assertEquals(1, Sale::where('order_number', 'ORD-19')->count());

        // 4. Victoria Cashier accesses /sales -> MUST see ORD-19
        $responseVic = $this->actingAs($this->cashierVictoria)->get('/sales');
        $responseVic->assertStatus(200);
        $responseVic->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-19')
            ->where('sales.data.0.branch_id', $this->victoria->id)
        );

        // 5. Santa Cruz Cashier accesses /sales -> MUST NOT see Victoria's ORD-19
        $responseSC = $this->actingAs($this->cashierSantaCruz)->get('/sales');
        $responseSC->assertStatus(200);
        $responseSC->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 0)
        );

        // 6. Victoria Cashier accesses /reports -> MUST include ORD-19 in reports
        $responseReportsVic = $this->actingAs($this->cashierVictoria)->get('/reports');
        $responseReportsVic->assertStatus(200);
        $responseReportsVic->assertInertia(fn ($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-19')
            ->where('today_sales', 300)
        );

        // 7. Santa Cruz Cashier accesses /reports -> MUST NOT include Victoria sales
        $responseReportsSC = $this->actingAs($this->cashierSantaCruz)->get('/reports');
        $responseReportsSC->assertStatus(200);
        $responseReportsSC->assertInertia(fn ($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 0)
            ->where('today_sales', 0)
        );
    }
}
