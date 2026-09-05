<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SalesReportFiltersTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashierBranch1;
    protected User $cashierBranch2;
    protected Branch $branch1;
    protected Branch $branch2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create(['name' => 'Branch A - Santa Cruz', 'address' => 'Santa Cruz, Laguna']);
        $this->branch2 = Branch::create(['name' => 'Branch B - Victoria', 'address' => 'Victoria, Laguna']);

        // Admin assigned to Branch 1, but should be able to view Branch 1, Branch 2, or Both
        $this->admin = User::factory()->create([
            'name' => 'Super Admin',
            'role' => 'admin',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch1 = User::factory()->create([
            'name' => 'Cashier A',
            'role' => 'cashier',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch2 = User::factory()->create([
            'name' => 'Cashier B',
            'role' => 'cashier',
            'branch_id' => $this->branch2->id,
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

    private function createSale(Branch $branch, User $cashier, Carbon $date, float $total = 500.00, string $orderNum = 'ORD-001'): Sale
    {
        return Sale::create([
            'order_number'   => $orderNum,
            'user_id'        => $cashier->id,
            'branch_id'      => $branch->id,
            'type'           => 'dine-in',
            'subtotal'       => $total,
            'discount'       => 0.00,
            'delivery_fee'   => 0.00,
            'total'          => $total,
            'paid_amount'    => $total,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => $date,
            'updated_at'     => $date,
        ]);
    }

    /**
     * Test 1: Today + Branch A
     */
    public function test_today_plus_branch_a(): void
    {
        $today = Carbon::now('Asia/Manila');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->setTime(10, 0), 1000.00, 'A-TODAY');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->setTime(11, 0), 2000.00, 'B-TODAY');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(5), 1500.00, 'A-PAST');

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $today->format('Y-m-d'),
            'date_to'   => $today->format('Y-m-d'),
            'branch_id' => (string) $this->branch1->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'A-TODAY')
            ->where('filters.branch_id', (string) $this->branch1->id)
            ->where('filters.date_from', $today->format('Y-m-d'))
            ->where('filters.date_to', $today->format('Y-m-d'))
            ->where('total_revenue', 1000)
        );
    }

    /**
     * Test 2: Today + Branch B
     */
    public function test_today_plus_branch_b(): void
    {
        $today = Carbon::now('Asia/Manila');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->setTime(10, 0), 1000.00, 'A-TODAY');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->setTime(11, 0), 2000.00, 'B-TODAY');

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $today->format('Y-m-d'),
            'date_to'   => $today->format('Y-m-d'),
            'branch_id' => (string) $this->branch2->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'B-TODAY')
            ->where('filters.branch_id', (string) $this->branch2->id)
            ->where('total_revenue', 2000)
        );
    }

    /**
     * Test 3: Today + Both Branches
     */
    public function test_today_plus_both_branches(): void
    {
        $today = Carbon::now('Asia/Manila');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->setTime(10, 0), 1000.00, 'A-TODAY');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->setTime(11, 0), 2000.00, 'B-TODAY');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(5), 1500.00, 'A-PAST');

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $today->format('Y-m-d'),
            'date_to'   => $today->format('Y-m-d'),
            'branch_id' => 'all',
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 2)
            ->where('filters.branch_id', 'all')
            ->where('total_revenue', 3000)
        );
    }

    /**
     * Test 4: Last 7 Days + Branch A
     */
    public function test_last_7_days_plus_branch_a(): void
    {
        $today = Carbon::now('Asia/Manila');
        $from = $today->copy()->subDays(6)->format('Y-m-d');
        $to = $today->format('Y-m-d');

        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(2), 500.00, 'A-D2');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(5), 700.00, 'A-D5');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(3), 800.00, 'B-D3');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(10), 900.00, 'A-D10'); // Outside 7 days

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $from,
            'date_to'   => $to,
            'branch_id' => (string) $this->branch1->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 2)
            ->where('filters.branch_id', (string) $this->branch1->id)
            ->where('total_revenue', 1200)
        );
    }

    /**
     * Test 5: Last 30 Days + Branch A
     */
    public function test_last_30_days_plus_branch_a(): void
    {
        $today = Carbon::now('Asia/Manila');
        $from = $today->copy()->subDays(29)->format('Y-m-d');
        $to = $today->format('Y-m-d');

        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(15), 1100.00, 'A-D15');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(25), 1200.00, 'A-D25');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(15), 2000.00, 'B-D15');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(35), 3000.00, 'A-D35'); // Outside 30 days

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $from,
            'date_to'   => $to,
            'branch_id' => (string) $this->branch1->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 2)
            ->where('filters.branch_id', (string) $this->branch1->id)
            ->where('total_revenue', 2300)
        );
    }

    /**
     * Test 6: Last 30 Days + Branch B
     */
    public function test_last_30_days_plus_branch_b(): void
    {
        $today = Carbon::now('Asia/Manila');
        $from = $today->copy()->subDays(29)->format('Y-m-d');
        $to = $today->format('Y-m-d');

        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(15), 1100.00, 'A-D15');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(10), 1500.00, 'B-D10');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(20), 2500.00, 'B-D20');

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $from,
            'date_to'   => $to,
            'branch_id' => (string) $this->branch2->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 2)
            ->where('filters.branch_id', (string) $this->branch2->id)
            ->where('total_revenue', 4000)
        );
    }

    /**
     * Test 7: Last 30 Days + Both Branches
     */
    public function test_last_30_days_plus_both_branches(): void
    {
        $today = Carbon::now('Asia/Manila');
        $from = $today->copy()->subDays(29)->format('Y-m-d');
        $to = $today->format('Y-m-d');

        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(5), 1000.00, 'A-D5');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(12), 2000.00, 'B-D12');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(28), 3000.00, 'A-D28');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(35), 4000.00, 'B-D35'); // Outside

        $response = $this->actingAs($this->admin)->get('/reports?' . http_build_query([
            'date_from' => $from,
            'date_to'   => $to,
            'branch_id' => 'all',
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 3)
            ->where('filters.branch_id', 'all')
            ->where('total_revenue', 6000)
        );
    }

    /**
     * Test 8: Non-Admin Cashier is strictly scoped to their own branch
     */
    public function test_cashier_is_strictly_scoped_to_assigned_branch(): void
    {
        $today = Carbon::now('Asia/Manila');
        $this->createSale($this->branch1, $this->cashierBranch1, $today, 1000.00, 'A-TODAY');
        $this->createSale($this->branch2, $this->cashierBranch2, $today, 2000.00, 'B-TODAY');

        // Cashier 1 attempts to request branch 2 or all branches
        $response = $this->actingAs($this->cashierBranch1)->get('/reports?' . http_build_query([
            'branch_id' => (string) $this->branch2->id,
        ]));

        $response->assertOk();
        $response->assertInertia(fn($page) => $page
            ->component('Admin/Reports/Index')
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'A-TODAY')
            ->where('sales.data.0.branch.name', 'Branch A - Santa Cruz')
        );
    }

    /**
     * Test 9: Export Prepare respects Last 30 Days + Both Branches
     */
    public function test_export_prepare_respects_last_30_days_and_both_branches(): void
    {
        $today = Carbon::now('Asia/Manila');
        $from = $today->copy()->subDays(29)->format('Y-m-d');
        $to = $today->format('Y-m-d');

        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(5), 1000.00, 'A-D5');
        $this->createSale($this->branch2, $this->cashierBranch2, $today->copy()->subDays(15), 2000.00, 'B-D15');
        $this->createSale($this->branch1, $this->cashierBranch1, $today->copy()->subDays(40), 9999.00, 'A-D40'); // Outside

        $response = $this->actingAs($this->admin)->postJson('/reports/export/prepare', [
            'reportName' => 'Sales Performance Report',
            'scope' => 'all',
            'activeTab' => 'sales',
            'filters' => [
                'date_from' => $from,
                'date_to'   => $to,
                'branch_id' => 'all',
            ],
            'options' => [
                'format' => 'pdf',
                'scope' => 'all',
            ],
        ]);

        $response->assertOk();
        $token = $response->json('token');
        $this->assertNotEmpty($token);

        $cached = Cache::get('report_export_' . $token);
        $this->assertNotNull($cached);
        $this->assertCount(2, $cached['rows']);

        $orderNumbers = array_column($cached['rows'], 'order_number');
        $this->assertContains('A-D5', $orderNumbers);
        $this->assertContains('B-D15', $orderNumbers);
        $this->assertNotContains('A-D40', $orderNumbers);

        $branches = array_column($cached['rows'], 'branch');
        $this->assertContains('Branch A - Santa Cruz', $branches);
        $this->assertContains('Branch B - Victoria', $branches);
    }
}
