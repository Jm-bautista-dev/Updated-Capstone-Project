<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesPerProductDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $victoriaCashier;
    protected User $staCruzCashier;
    protected Branch $victoriaBranch;
    protected Branch $staCruzBranch;
    protected Product $californiaMaki;
    protected Product $spicyTunaRoll;
    protected Product $salmonNigiri;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Branches
        $this->victoriaBranch = Branch::create([
            'id'        => 1,
            'name'      => 'Maki Desu Victoria',
            'address'   => 'Victoria, Laguna',
            'is_active' => true,
        ]);

        $this->staCruzBranch = Branch::create([
            'id'        => 2,
            'name'      => 'Maki Desu Sta Cruz',
            'address'   => 'Sta Cruz, Laguna',
            'is_active' => true,
        ]);

        // 2. Create Users
        $this->adminUser = User::factory()->create([
            'name'           => 'Executive Admin',
            'role'           => User::ROLE_ADMIN,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => null,
        ]);

        $this->victoriaCashier = User::factory()->create([
            'name'           => 'Victoria Cashier',
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->victoriaBranch->id,
        ]);

        $this->staCruzCashier = User::factory()->create([
            'name'           => 'Sta Cruz Cashier',
            'role'           => User::ROLE_CASHIER,
            'account_status' => User::STATUS_ACTIVE,
            'branch_id'      => $this->staCruzBranch->id,
        ]);

        // 3. Create Categories and Products
        $category = Category::create([
            'name'        => 'Sushi Rolls',
            'description' => 'Specialty Maki Rolls',
            'is_active'   => true,
        ]);

        $this->californiaMaki = Product::create([
            'name'          => 'California Maki Supreme Deluxe Extra Long Name Edition',
            'sku'           => 'CAL-MAKI-01',
            'category_id'   => $category->id,
            'cost_price'    => 80.00,
            'selling_price' => 150.00,
            'is_active'     => true,
        ]);

        $this->spicyTunaRoll = Product::create([
            'name'          => 'Spicy Tuna Roll',
            'sku'           => 'SPICY-TUNA-02',
            'category_id'   => $category->id,
            'cost_price'    => 100.00,
            'selling_price' => 200.00,
            'is_active'     => true,
        ]);

        $this->salmonNigiri = Product::create([
            'name'          => 'Salmon Nigiri',
            'sku'           => 'SAL-NIG-03',
            'category_id'   => $category->id,
            'cost_price'    => 120.00,
            'selling_price' => 220.00,
            'is_active'     => true,
        ]);
    }

    /**
     * Helper to create a sale with items.
     */
    protected function createSale(
        Branch $branch,
        array $items,
        string $status = 'completed',
        ?Carbon $createdAt = null
    ): Sale {
        $createdAt = $createdAt ?? Carbon::now('Asia/Manila')->utc();
        $subtotal = 0;

        foreach ($items as $item) {
            $subtotal += ($item['product']->selling_price * $item['quantity']);
        }

        $sale = Sale::create([
            'order_number'   => 'ORD-' . strtoupper(uniqid()),
            'branch_id'      => $branch->id,
            'user_id'        => $this->adminUser->id,
            'type'           => 'dine_in',
            'status'         => $status,
            'subtotal'       => $subtotal,
            'total'          => $subtotal,
            'paid_amount'    => $subtotal,
            'change_amount'  => 0,
            'payment_method' => 'cash',
            'created_at'     => $createdAt,
            'updated_at'     => $createdAt,
        ]);

        foreach ($items as $item) {
            $qty = $item['quantity'];
            $price = $item['product']->selling_price;
            $lineSubtotal = $qty * $price;

            SaleItem::create([
                'sale_id'     => $sale->id,
                'product_id'  => $item['product']->id,
                'quantity'    => $qty,
                'unit_price'  => $price,
                'cost_price'  => $item['product']->cost_price,
                'subtotal'    => $lineSubtotal,
                'profit'      => $lineSubtotal - ($item['product']->cost_price * $qty),
                'created_at'  => $createdAt,
                'updated_at'  => $createdAt,
            ]);
        }

        return $sale;
    }

    public function test_branch_filter_victoria_returns_only_victoria_sales()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        // Victoria sale: 3 California Maki (3 * 150 = 450)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 3],
        ], 'completed', $now);

        // Sta Cruz sale: 5 Spicy Tuna Roll (5 * 200 = 1000)
        $this->createSale($this->staCruzBranch, [
            ['product' => $this->spicyTunaRoll, 'quantity' => 5],
        ], 'completed', $now);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', [
                'branch_id' => $this->victoriaBranch->id,
                'range'     => 'today',
            ]));

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals(450.00, $data['total_revenue']);
        $this->assertEquals(3.0, $data['total_units']);
        $this->assertCount(1, $data['products']);
        $this->assertEquals($this->californiaMaki->name, $data['products'][0]['name']);
        $this->assertEquals(450.00, $data['products'][0]['revenue']);
        $this->assertEquals(3.0, $data['products'][0]['total_sold']);
        $this->assertEquals(100.0, $data['products'][0]['percentage']);
    }

    public function test_branch_filter_sta_cruz_returns_only_sta_cruz_sales()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        // Victoria sale
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 2],
        ], 'completed', $now);

        // Sta Cruz sale: 4 Spicy Tuna Roll (4 * 200 = 800)
        $this->createSale($this->staCruzBranch, [
            ['product' => $this->spicyTunaRoll, 'quantity' => 4],
        ], 'completed', $now);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', [
                'branch_id' => $this->staCruzBranch->id,
                'range'     => 'today',
            ]));

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals(800.00, $data['total_revenue']);
        $this->assertEquals(4.0, $data['total_units']);
        $this->assertCount(1, $data['products']);
        $this->assertEquals($this->spicyTunaRoll->name, $data['products'][0]['name']);
        $this->assertEquals(800.00, $data['products'][0]['revenue']);
        $this->assertEquals(4.0, $data['products'][0]['total_sold']);
    }

    public function test_all_branches_returns_consolidated_totals_without_double_counting()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        // Victoria: 2 California Maki (300) + 1 Salmon Nigiri (220) = 520
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 2],
            ['product' => $this->salmonNigiri, 'quantity' => 1],
        ], 'completed', $now);

        // Sta Cruz: 3 California Maki (450) + 2 Spicy Tuna (400) = 850
        $this->createSale($this->staCruzBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 3],
            ['product' => $this->spicyTunaRoll, 'quantity' => 2],
        ], 'completed', $now);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', [
                'branch_id' => 'all',
                'range'     => 'today',
            ]));

        $response->assertStatus(200);
        $data = $response->json();

        // Total California Maki: (2 + 3) = 5 sold, revenue = 750
        // Total Spicy Tuna: 2 sold, revenue = 400
        // Total Salmon Nigiri: 1 sold, revenue = 220
        // Consolidated revenue: 750 + 400 + 220 = 1370
        $this->assertEquals(1370.00, $data['total_revenue']);
        $this->assertEquals(8.0, $data['total_units']);
        $this->assertCount(3, $data['products']);

        // California Maki should be top ranked by revenue
        $topProduct = $data['products'][0];
        $this->assertEquals($this->californiaMaki->name, $topProduct['name']);
        $this->assertEquals(750.00, $topProduct['revenue']);
        $this->assertEquals(5.0, $topProduct['total_sold']);
        $this->assertEquals(round((750 / 1370) * 100, 2), $topProduct['percentage']);
    }

    public function test_date_filtering_respects_range_parameters()
    {
        $tz = 'Asia/Manila';
        $today = Carbon::now($tz)->utc();
        $fiveDaysAgo = Carbon::now($tz)->subDays(5)->utc();
        $twentyDaysAgo = Carbon::now($tz)->subDays(20)->utc();

        // Today sale: 1 California Maki (150)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 1],
        ], 'completed', $today);

        // 5 days ago sale: 2 California Maki (300)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 2],
        ], 'completed', $fiveDaysAgo);

        // 20 days ago sale: 4 California Maki (600)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 4],
        ], 'completed', $twentyDaysAgo);

        // 1. Range = Today (Only today's sale)
        $resToday = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => 'today']));
        $this->assertEquals(150.00, $resToday->json('total_revenue'));
        $this->assertEquals(1.0, $resToday->json('total_units'));

        // 2. Range = 7 Days (Today + 5 days ago = 150 + 300 = 450)
        $res7 = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => '7']));
        $this->assertEquals(450.00, $res7->json('total_revenue'));
        $this->assertEquals(3.0, $res7->json('total_units'));

        // 3. Range = 30 Days (Today + 5 days + 20 days = 150 + 300 + 600 = 1050)
        $res30 = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => '30']));
        $this->assertEquals(1050.00, $res30->json('total_revenue'));
        $this->assertEquals(7.0, $res30->json('total_units'));

        // 4. Range = 365 / Annual
        $resAnnual = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => 'annual']));
        $this->assertEquals(1050.00, $resAnnual->json('total_revenue'));
    }

    public function test_cancelled_and_pending_transactions_are_excluded()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        // Completed sale: 2 California Maki (300)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 2],
        ], 'completed', $now);

        // Cancelled sale: 5 California Maki (750) - SHOULD BE EXCLUDED
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 5],
        ], 'cancelled', $now);

        // Pending sale: 3 California Maki (450) - SHOULD BE EXCLUDED
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 3],
        ], 'pending', $now);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => 'today']));

        $response->assertStatus(200);
        $this->assertEquals(300.00, $response->json('total_revenue'));
        $this->assertEquals(2.0, $response->json('total_units'));
    }

    public function test_non_admin_cashier_is_restricted_to_their_authorized_branch()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        // Victoria sale: 2 California Maki (300)
        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 2],
        ], 'completed', $now);

        // Sta Cruz sale: 5 Spicy Tuna (1000)
        $this->createSale($this->staCruzBranch, [
            ['product' => $this->spicyTunaRoll, 'quantity' => 5],
        ], 'completed', $now);

        // Victoria cashier tries to request "all" branches or branch 2 (Sta Cruz)
        $response = $this->actingAs($this->victoriaCashier)
            ->getJson(route('analytics.sales-per-product', [
                'branch_id' => $this->staCruzBranch->id, // Intentionally trying to request Sta Cruz
                'range'     => 'today',
            ]));

        $response->assertStatus(200);
        $data = $response->json();

        // Must be restricted to Victoria (branch 1)
        $this->assertEquals(300.00, $data['total_revenue']);
        $this->assertEquals(2.0, $data['total_units']);
        $this->assertEquals($this->californiaMaki->name, $data['products'][0]['name']);
        $this->assertEquals($this->victoriaBranch->id, $data['selected_branch_id']);
    }

    public function test_empty_period_returns_clean_empty_state_payload()
    {
        $response = $this->actingAs($this->adminUser)
            ->getJson(route('analytics.sales-per-product', ['range' => 'today']));

        $response->assertStatus(200);
        $data = $response->json();

        $this->assertEquals(0, $data['total_revenue']);
        $this->assertEquals(0, $data['total_units']);
        $this->assertEquals(0, $data['products_count']);
        $this->assertIsArray($data['products']);
        $this->assertEmpty($data['products']);
    }

    public function test_dashboard_inertia_page_includes_sales_per_product_props()
    {
        $now = Carbon::now('Asia/Manila')->utc();

        $this->createSale($this->victoriaBranch, [
            ['product' => $this->californiaMaki, 'quantity' => 3],
        ], 'completed', $now);

        $response = $this->actingAs($this->adminUser)->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Dashboard')
            ->has('salesPerProduct')
            ->has('salesPerProductMeta')
            ->where('salesPerProductMeta.total_revenue', 450)
            ->where('salesPerProductMeta.total_units', 3)
            ->has('branches')
        );
    }
}
