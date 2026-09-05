<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Exports\SalesExport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SalesReportExportDataMappingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashierBranch1;
    protected User $cashierBranch2;
    protected User $customerUser;
    protected Branch $branch1;
    protected Branch $branch2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create(['name' => 'Santa Cruz Branch', 'address' => 'Santa Cruz, Laguna']);
        $this->branch2 = Branch::create(['name' => 'Victoria Branch', 'address' => 'Victoria, Laguna']);

        $this->admin = User::factory()->create([
            'name' => 'Admin Boss',
            'role' => 'admin',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch1 = User::factory()->create([
            'name' => 'Maria Cashier',
            'role' => 'cashier',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch2 = User::factory()->create([
            'name' => 'Pedro Cashier',
            'role' => 'cashier',
            'branch_id' => $this->branch2->id,
        ]);

        $this->customerUser = User::factory()->create([
            'name' => 'Juan Dela Cruz (Customer)',
            'role' => 'customer',
        ]);

        \App\Models\Category::create(['name' => 'Maki']);
        \App\Models\Product::create([
            'name' => 'California Maki',
            'category_id' => 1,
            'selling_price' => 100.00,
            'cost_price' => 50.00,
            'status' => 'available',
        ]);
    }

    private function createPOSSale(array $attributes = []): Sale
    {
        static $seq = 100;
        $seq++;

        return Sale::create(array_merge([
            'order_number'   => "POS-{$seq}",
            'user_id'        => $this->cashierBranch1->id,
            'branch_id'      => $this->branch1->id,
            'type'           => 'dine-in',
            'subtotal'       => 500.00,
            'discount'       => 0.00,
            'delivery_fee'   => 0.00,
            'total'          => 500.00,
            'paid_amount'    => 500.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => now(),
        ], $attributes));
    }

    private function createOnlineSale(array $attributes = []): Sale
    {
        static $seq = 500;
        $seq++;

        $order = Order::create([
            'order_number'    => "ORD-{$seq}",
            'user_id'         => $this->customerUser->id,
            'branch_id'       => $attributes['branch_id'] ?? $this->branch1->id,
            'customer_name'   => 'Clara Online Customer',
            'order_source'    => Order::SOURCE_MOBILE_APP,
            'fulfillment_type' => Order::FULFILLMENT_DELIVERY,
            'total_amount'    => 750.00,
            'status'          => 'delivered',
            'payment_method'  => 'online',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'customer_name'    => 'Clara Online Customer',
            'customer_address' => '456 Rizal St, Santa Cruz',
            'delivery_fee'     => 50.00,
            'status'           => Delivery::STATUS_DELIVERED,
        ]);

        $sale = Sale::create(array_merge([
            'order_id'       => $order->id,
            'order_number'   => $order->order_number,
            'user_id'        => $this->customerUser->id,
            'branch_id'      => $order->branch_id,
            'type'           => 'delivery',
            'subtotal'       => 700.00,
            'discount'       => 0.00,
            'delivery_fee'   => 50.00,
            'total'          => 750.00,
            'paid_amount'    => 750.00,
            'payment_method' => 'online',
            'status'         => 'completed',
            'created_at'     => now(),
        ], $attributes));

        $delivery->update(['sale_id' => $sale->id]);

        return $sale;
    }

    /**
     * Test 1 — Branch A: Export Branch A only
     */
    public function test_export_branch_a_only()
    {
        $saleA = $this->createPOSSale([
            'branch_id' => $this->branch1->id,
            'user_id'   => $this->cashierBranch1->id,
            'total'     => 1200.00,
        ]);

        $saleB = $this->createPOSSale([
            'branch_id' => $this->branch2->id,
            'user_id'   => $this->cashierBranch2->id,
            'total'     => 800.00,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => [
                'branch_id' => (string) $this->branch1->id,
            ],
            'options'   => [
                'scope' => 'all',
            ],
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');
        $this->assertNotEmpty($token);

        $cached = Cache::get('report_export_' . $token);
        $this->assertCount(1, $cached['rows']);
        $this->assertEquals('Santa Cruz Branch', $cached['rows'][0]['branch']);
        $this->assertEquals('Maria Cashier', $cached['rows'][0]['cashier']);
        $this->assertEquals('Walk-in Customer', $cached['rows'][0]['customer']);
    }

    /**
     * Test 2 — Branch B: Export Branch B only
     */
    public function test_export_branch_b_only()
    {
        $saleA = $this->createPOSSale([
            'branch_id' => $this->branch1->id,
            'user_id'   => $this->cashierBranch1->id,
        ]);

        $saleB = $this->createPOSSale([
            'branch_id' => $this->branch2->id,
            'user_id'   => $this->cashierBranch2->id,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => [
                'branch_id' => (string) $this->branch2->id,
            ],
            'options'   => [
                'scope' => 'all',
            ],
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');
        $cached = Cache::get('report_export_' . $token);

        $this->assertCount(1, $cached['rows']);
        $this->assertEquals('Victoria Branch', $cached['rows'][0]['branch']);
        $this->assertEquals('Pedro Cashier', $cached['rows'][0]['cashier']);
    }

    /**
     * Test 3 — Both Branches / All Branches: Export contains sales from all branches
     */
    public function test_export_both_branches_contains_all_authorized_branches()
    {
        $saleA = $this->createPOSSale([
            'branch_id' => $this->branch1->id,
            'user_id'   => $this->cashierBranch1->id,
        ]);

        $saleB = $this->createPOSSale([
            'branch_id' => $this->branch2->id,
            'user_id'   => $this->cashierBranch2->id,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => [
                'branch_id' => 'all',
            ],
            'options'   => [
                'scope' => 'all',
            ],
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');
        $cached = Cache::get('report_export_' . $token);

        $this->assertCount(2, $cached['rows']);
        $branchesInExport = collect($cached['rows'])->pluck('branch')->all();
        $this->assertContains('Santa Cruz Branch', $branchesInExport);
        $this->assertContains('Victoria Branch', $branchesInExport);
    }

    /**
     * Test 4 — Cashier vs Customer: Distinct people must never be swapped
     */
    public function test_cashier_and_customer_are_distinct_and_never_swapped()
    {
        $order = Order::create([
            'order_number'    => 'ORD-CUSTOM',
            'branch_id'       => $this->branch1->id,
            'customer_name'   => 'Sir Isaac Newton',
            'order_source'    => Order::SOURCE_WALK_IN,
            'total_amount'    => 350.00,
            'status'          => 'completed',
        ]);

        $sale = $this->createPOSSale([
            'order_id'       => $order->id,
            'order_number'   => 'ORD-CUSTOM',
            'user_id'        => $this->cashierBranch1->id, // Maria Cashier
            'branch_id'      => $this->branch1->id,
            'total'          => 350.00,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => ['branch_id' => 'all'],
            'options'   => ['scope' => 'all'],
        ]);

        $cached = Cache::get('report_export_' . $response->json('token'));
        $row = $cached['rows'][0];

        $this->assertEquals('Maria Cashier', $row['cashier'], 'Cashier must be the employee');
        $this->assertEquals('Sir Isaac Newton', $row['customer'], 'Customer must be the customer');
        $this->assertNotEquals($row['cashier'], $row['customer']);
    }

    /**
     * Test 5 — Online Order without cashier: Explicit Online Order designation, never customer as cashier
     */
    public function test_online_order_has_online_order_cashier_and_correct_customer()
    {
        $onlineSale = $this->createOnlineSale([
            'branch_id' => $this->branch1->id,
        ]);

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => ['branch_id' => 'all'],
            'options'   => ['scope' => 'all'],
        ]);

        $cached = Cache::get('report_export_' . $response->json('token'));
        $row = $cached['rows'][0];

        $this->assertEquals('Online Order', $row['cashier'], 'Online order must have Online Order as cashier');
        $this->assertEquals('Clara Online Customer', $row['customer'], 'Customer name must be preserved');
    }

    /**
     * Test 6 — Duplicate Rows Prevention: Joins/eager loading must not duplicate rows
     */
    public function test_no_duplicate_rows_with_multiple_items_and_relationships()
    {
        $sale = $this->createPOSSale([
            'branch_id' => $this->branch1->id,
            'total'     => 1000.00,
        ]);

        // Add 5 sale items to test that it does not multiply rows
        for ($i = 1; $i <= 5; $i++) {
            SaleItem::create([
                'sale_id'    => $sale->id,
                'product_id' => 1,
                'quantity'   => 2,
                'unit_price' => 100.00,
                'subtotal'   => 200.00,
            ]);
        }

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'scope'     => 'all',
            'activeTab' => 'sales',
            'filters'   => ['branch_id' => 'all'],
            'options'   => ['scope' => 'all'],
        ]);

        $cached = Cache::get('report_export_' . $response->json('token'));
        $this->assertCount(1, $cached['rows'], 'Must return exactly 1 row despite 5 sale items');
    }

    /**
     * Test 7 — CSV Export in SalesController has correct cashier, customer, and columns
     */
    public function test_sales_csv_export_format_and_fields()
    {
        $posSale = $this->createPOSSale([
            'branch_id' => $this->branch1->id,
            'user_id'   => $this->cashierBranch1->id,
            'total'     => 450.00,
        ]);

        $onlineSale = $this->createOnlineSale([
            'branch_id' => $this->branch2->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->get('/sales/export?date_preset=today&branch_id=all');

        $response->assertStatus(200);
        $content = $response->streamedContent();

        // Check header row contains both Cashier and Customer
        $this->assertStringContainsString('Cashier', $content);
        $this->assertStringContainsString('Customer', $content);
        $this->assertStringContainsString('Discount (PHP)', $content);

        // Check POS sale row
        $this->assertStringContainsString('Maria Cashier', $content);
        $this->assertStringContainsString('Walk-in Customer', $content);

        // Check Online sale row
        $this->assertStringContainsString('Online Order', $content);
        $this->assertStringContainsString('Clara Online Customer', $content);
    }
}
