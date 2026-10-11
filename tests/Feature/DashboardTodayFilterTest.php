<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTodayFilterTest extends TestCase
{
    use RefreshDatabase;

    public User $admin;
    public Branch $testBranch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'      => 'MAKI DESU STA CRUZ',
            'code'      => 'MDSC',
            'address'   => 'Santa Cruz, Laguna',
            'is_active' => true,
        ]);

        $this->admin = User::factory()->create([
            'role'      => 'admin',
            'branch_id' => null,
        ]);
    }

    /**
     * 1. Today is selected by default when the dashboard opens without any range parameter.
     */
    public function test_dashboard_defaults_to_today_filter(): void
    {
        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', 'today')
            ->where('filters.range', 'today')
            ->has('stats')
            ->has('branchStats')
            ->has('salesOverTime')
            ->has('salesPerProduct')
            ->has('salesByPaymentMethod')
        );
    }

    /**
     * 2. Today's metrics and records adhere strictly to Asia/Manila calendar day boundaries.
     */
    public function test_today_filter_scopes_sales_to_asia_manila_current_day(): void
    {
        $tz = 'Asia/Manila';
        $todayManila = Carbon::now($tz);

        $product = Product::create([
            'name'          => 'California Maki',
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
        ]);

        // Sale 1: Yesterday at 11:59:00 PM Manila (1 minute before today) -> Excluded from Today
        $yesterdayNearMidnight = $todayManila->copy()->startOfDay()->subMinute()->utc();
        $saleYesterday = Sale::create([
            'branch_id'      => $this->testBranch->id,
            'status'         => 'completed',
            'total'          => 300.00,
            'subtotal'       => 300.00,
            'paid_amount'    => 300.00,
            'payment_method' => 'cash',
            'user_id'        => $this->admin->id,
            'order_number'   => 'ORD-YEST',
            'created_at'     => $yesterdayNearMidnight,
            'updated_at'     => $yesterdayNearMidnight,
        ]);
        SaleItem::create([
            'sale_id'    => $saleYesterday->id,
            'product_id' => $product->id,
            'quantity'   => 2,
            'unit_price' => 150.00,
            'subtotal'   => 300.00,
            'cost_price' => 50.00,
        ]);

        // Sale 2: Today at 12:00:30 AM Manila (just after midnight) -> Included in Today
        $todayEarlyMorning = $todayManila->copy()->startOfDay()->addSeconds(30)->utc();
        $saleTodayEarly = Sale::create([
            'branch_id'      => $this->testBranch->id,
            'status'         => 'completed',
            'total'          => 150.00,
            'subtotal'       => 150.00,
            'paid_amount'    => 150.00,
            'payment_method' => 'cash',
            'user_id'        => $this->admin->id,
            'order_number'   => 'ORD-TODAY-1',
            'created_at'     => $todayEarlyMorning,
            'updated_at'     => $todayEarlyMorning,
        ]);
        SaleItem::create([
            'sale_id'    => $saleTodayEarly->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'unit_price' => 150.00,
            'subtotal'   => 150.00,
            'cost_price' => 50.00,
        ]);

        // Sale 3: Today at 2:00 PM Manila -> Included in Today
        $todayAfternoon = $todayManila->copy()->startOfDay()->addHours(14)->utc();
        $saleTodayMid = Sale::create([
            'branch_id'      => $this->testBranch->id,
            'status'         => 'completed',
            'total'          => 450.00,
            'subtotal'       => 450.00,
            'paid_amount'    => 450.00,
            'payment_method' => 'gcash',
            'user_id'        => $this->admin->id,
            'order_number'   => 'ORD-TODAY-2',
            'created_at'     => $todayAfternoon,
            'updated_at'     => $todayAfternoon,
        ]);
        SaleItem::create([
            'sale_id'    => $saleTodayMid->id,
            'product_id' => $product->id,
            'quantity'   => 3,
            'unit_price' => 150.00,
            'subtotal'   => 450.00,
            'cost_price' => 50.00,
        ]);

        // Request dashboard with range=today (or default)
        $response = $this->actingAs($this->admin)->get(route('dashboard', ['range' => 'today']));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', 'today')
            ->where('stats.total_revenue', fn($v) => (float)$v == 600.00) // 150 + 450 = 600 (saleYesterday 300 is excluded)
            ->where('stats.total_orders', 2)
            ->where('stats.revenue_delta.comparison_label', 'vs yesterday')
        );
    }

    /**
     * 3. Today's trajectory provides 24 hourly buckets synchronized with total revenue.
     */
    public function test_today_hourly_trajectory_synchronization(): void
    {
        $tz = 'Asia/Manila';
        $todayManila = Carbon::now($tz);

        $product = Product::create([
            'name'          => 'Spicy Tuna Maki',
            'selling_price' => 200.00,
            'cost_price'    => 70.00,
        ]);

        $saleTime = $todayManila->copy()->startOfDay()->addHours(11)->utc(); // 11 AM Manila
        $sale = Sale::create([
            'branch_id'      => $this->testBranch->id,
            'status'         => 'completed',
            'total'          => 400.00,
            'subtotal'       => 400.00,
            'paid_amount'    => 400.00,
            'payment_method' => 'cash',
            'user_id'        => $this->admin->id,
            'order_number'   => 'ORD-HOURLY',
            'created_at'     => $saleTime,
            'updated_at'     => $saleTime,
        ]);
        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 2,
            'unit_price' => 200.00,
            'subtotal'   => 400.00,
            'cost_price' => 70.00,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard', ['range' => 'today']));
        $response->assertOk();

        $page = $response->getOriginalContent()->getData()['page'];
        $salesOverTime = $page['props']['salesOverTime'];

        // Must have exactly 24 hours
        $this->assertCount(24, $salesOverTime);

        // Sum of hourly revenue equals 400.00
        $sumRev = collect($salesOverTime)->sum('revenue');
        $this->assertEquals(400.00, $sumRev);

        // Hour 11 (11 AM) has 400.00
        $hour11 = collect($salesOverTime)->firstWhere('date', '11 AM');
        $this->assertNotNull($hour11);
        $this->assertEquals(400.00, $hour11['revenue']);
        $this->assertEquals(140.00, $hour11['cogs']);
        $this->assertEquals(260.00, $hour11['profit']);
    }

    /**
     * 4. Switching to 7 Days, 30 Days, and Annual preserves their established reporting behavior.
     */
    public function test_switching_to_7_days_30_days_and_annual(): void
    {
        $tz = 'Asia/Manila';
        $todayManila = Carbon::now($tz);

        $product = Product::create([
            'name'          => 'Salmon Nigiri',
            'selling_price' => 250.00,
            'cost_price'    => 90.00,
        ]);

        // Sale 5 days ago
        $fiveDaysAgo = $todayManila->copy()->subDays(5)->startOfDay()->addHours(12)->utc();
        $sale5Days = Sale::create([
            'branch_id'      => $this->testBranch->id,
            'status'         => 'completed',
            'total'          => 250.00,
            'subtotal'       => 250.00,
            'paid_amount'    => 250.00,
            'payment_method' => 'cash',
            'user_id'        => $this->admin->id,
            'order_number'   => 'ORD-5DAYS',
            'created_at'     => $fiveDaysAgo,
            'updated_at'     => $fiveDaysAgo,
        ]);
        SaleItem::create([
            'sale_id'    => $sale5Days->id,
            'product_id' => $product->id,
            'quantity'   => 1,
            'unit_price' => 250.00,
            'subtotal'   => 250.00,
            'cost_price' => 90.00,
        ]);

        // 7 Days should include the 5-day-old sale
        $resp7 = $this->actingAs($this->admin)->get(route('dashboard', ['range' => '7']));
        $resp7->assertOk();
        $resp7->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', '7')
            ->where('filters.range', '7')
            ->where('stats.total_revenue', fn($v) => (float)$v == 250.00)
            ->where('stats.total_orders', 1)
        );

        // Today should exclude the 5-day-old sale
        $respToday = $this->actingAs($this->admin)->get(route('dashboard', ['range' => 'today']));
        $respToday->assertOk();
        $respToday->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', 'today')
            ->where('stats.total_revenue', fn($v) => (float)$v == 0.0)
            ->where('stats.total_orders', 0)
        );

        // 30 Days
        $resp30 = $this->actingAs($this->admin)->get(route('dashboard', ['range' => '30']));
        $resp30->assertOk();
        $resp30->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', '30')
            ->where('stats.total_revenue', fn($v) => (float)$v == 250.00)
        );

        // Annual (365)
        $respAnnual = $this->actingAs($this->admin)->get(route('dashboard', ['range' => '365']));
        $respAnnual->assertOk();
        $respAnnual->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', '365')
            ->where('stats.total_revenue', fn($v) => (float)$v == 250.00)
        );
    }

    /**
     * 5. Empty-day results and zero-state values handle gracefully without null or errors.
     */
    public function test_empty_day_zero_state_handled_gracefully(): void
    {
        $response = $this->actingAs($this->admin)->get(route('dashboard', ['range' => 'today']));
        $response->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Dashboard')
            ->where('range', 'today')
            ->where('stats.total_revenue', fn($v) => (float)$v == 0.0)
            ->where('stats.total_expenses', fn($v) => (float)$v == 0.0)
            ->where('stats.total_profit', fn($v) => (float)$v == 0.0)
            ->where('stats.total_orders', 0)
            ->where('stats.profit_margin', fn($v) => (float)$v == 0.0)
            ->has('salesOverTime', 24)
            ->has('salesPerProduct', 0)
            ->has('salesByPaymentMethod', 0)
        );
    }
}
