<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesExportDateRangeTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashierBranch1;
    protected Branch $branch1;
    protected Branch $branch2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch1 = Branch::create(['name' => 'Santa Cruz', 'address' => 'Santa Cruz, Laguna']);
        $this->branch2 = Branch::create(['name' => 'Victoria', 'address' => 'Victoria, Laguna']);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->branch1->id,
        ]);

        $this->cashierBranch1 = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branch1->id,
        ]);
    }

    private function createTestSale(array $attributes = []): Sale
    {
        static $orderSeq = 1000;
        $orderSeq++;

        $sale = Sale::create(array_merge([
            'order_number' => "ORD-{$orderSeq}",
            'user_id' => $this->cashierBranch1->id,
            'branch_id' => $this->branch1->id,
            'type' => 'dine-in',
            'total' => 1000.00,
            'subtotal' => 1000.00,
            'discount' => 0.00,
            'paid_amount' => 1000.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ], $attributes));

        if (isset($attributes['created_at'])) {
            $sale->created_at = $attributes['created_at'];
            $sale->save();
        }

        return $sale;
    }

    public function test_export_summary_today_preset()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Sale created today
        $this->createTestSale([
            'total' => 1500,
            'created_at' => $now->copy()->subHours(2),
        ]);

        // Sale created 3 days ago
        $this->createTestSale([
            'total' => 2000,
            'created_at' => $now->copy()->subDays(3),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/sales/export/summary?date_preset=today');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'preset' => 'today',
                'count' => 1,
                'total_amount' => 1500,
            ]);
    }

    public function test_export_summary_last_7_days_preset()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Sale 2 days ago
        $this->createTestSale([
            'total' => 1000,
            'created_at' => $now->copy()->subDays(2),
        ]);

        // Sale 5 days ago
        $this->createTestSale([
            'total' => 2500,
            'created_at' => $now->copy()->subDays(5),
        ]);

        // Sale 10 days ago (outside 7 days)
        $this->createTestSale([
            'total' => 5000,
            'created_at' => $now->copy()->subDays(10),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/sales/export/summary?date_preset=7_days');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'preset' => '7_days',
                'count' => 2,
                'total_amount' => 3500,
            ]);
    }

    public function test_export_summary_last_30_days_preset()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Sale 20 days ago
        $this->createTestSale([
            'total' => 4000,
            'created_at' => $now->copy()->subDays(20),
        ]);

        // Sale 40 days ago (outside 30 days)
        $this->createTestSale([
            'total' => 9000,
            'created_at' => $now->copy()->subDays(40),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/sales/export/summary?date_preset=30_days');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'preset' => '30_days',
                'count' => 1,
                'total_amount' => 4000,
            ]);
    }

    public function test_export_summary_last_1_year_preset()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Sale 200 days ago
        $this->createTestSale([
            'total' => 7500,
            'created_at' => $now->copy()->subDays(200),
        ]);

        // Sale 400 days ago (outside 1 year)
        $this->createTestSale([
            'total' => 12000,
            'created_at' => $now->copy()->subDays(400),
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson('/sales/export/summary?date_preset=1_year');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'preset' => '1_year',
                'count' => 1,
                'total_amount' => 7500,
            ]);
    }

    public function test_export_summary_custom_date_range()
    {
        $from = '2026-08-01';
        $to = '2026-08-10';

        $this->createTestSale([
            'total' => 3000,
            'created_at' => '2026-08-05 14:00:00',
        ]);

        $this->createTestSale([
            'total' => 4500,
            'created_at' => '2026-08-15 14:00:00',
        ]);

        $response = $this->actingAs($this->admin)
            ->getJson("/sales/export/summary?date_preset=custom&date_from={$from}&date_to={$to}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'preset' => 'custom',
                'count' => 1,
                'total_amount' => 3000,
            ]);
    }

    public function test_custom_range_invalid_start_after_end()
    {
        $from = '2026-08-17';
        $to = '2026-08-01';

        $response = $this->actingAs($this->admin)
            ->getJson("/sales/export/summary?date_preset=custom&date_from={$from}&date_to={$to}");

        $response->assertStatus(422)
            ->assertJson([
                'error' => 'Start date must be earlier than or equal to the end date.',
            ]);
    }

    public function test_branch_filtering_in_export()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Branch 1 Sale
        $this->createTestSale([
            'branch_id' => $this->branch1->id,
            'total' => 1200,
            'created_at' => $now->copy()->subHours(1),
        ]);

        // Branch 2 Sale
        $this->createTestSale([
            'branch_id' => $this->branch2->id,
            'total' => 8800,
            'created_at' => $now->copy()->subHours(1),
        ]);

        // Query Branch 1 specifically
        $responseBranch1 = $this->actingAs($this->admin)
            ->getJson("/sales/export/summary?date_preset=today&branch_id={$this->branch1->id}");

        $responseBranch1->assertStatus(200)
            ->assertJson([
                'count' => 1,
                'total_amount' => 1200,
                'branch_name' => 'Santa Cruz',
            ]);

        // Query All Branches
        $responseAll = $this->actingAs($this->admin)
            ->getJson('/sales/export/summary?date_preset=today&branch_id=all');

        $responseAll->assertStatus(200)
            ->assertJson([
                'count' => 2,
                'total_amount' => 10000,
                'branch_name' => 'All Branches',
            ]);
    }

    public function test_cashier_branch_authorization_isolation()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        // Cashier 1 Sale
        $this->createTestSale([
            'branch_id' => $this->branch1->id,
            'user_id' => $this->cashierBranch1->id,
            'total' => 1500,
            'created_at' => $now->copy()->subHours(1),
        ]);

        // Other Sale in Branch 2
        $this->createTestSale([
            'branch_id' => $this->branch2->id,
            'total' => 9900,
            'created_at' => $now->copy()->subHours(1),
        ]);

        // Cashier attempts to request Branch 2 in query
        $response = $this->actingAs($this->cashierBranch1)
            ->getJson("/sales/export/summary?date_preset=today&branch_id={$this->branch2->id}");

        $response->assertStatus(200)
            ->assertJson([
                'count' => 1,
                'total_amount' => 1500,
                'branch_name' => 'Santa Cruz',
            ]);
    }

    public function test_csv_export_stream_downloads_file_with_correct_filename()
    {
        $tz = config('app.timezone', 'Asia/Manila');
        $now = Carbon::now($tz);

        $this->createTestSale([
            'order_number' => 'ORD-9999',
            'branch_id' => $this->branch1->id,
            'total' => 2750,
            'created_at' => $now->copy()->subHours(1),
        ]);

        $response = $this->actingAs($this->admin)
            ->get("/sales/export?date_preset=7_days&branch_id={$this->branch1->id}");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('sales_santa-cruz_last_7_days.csv', $response->headers->get('content-disposition'));
        $this->assertStringContainsString('ORD-9999', $response->streamedContent());
    }
}
