<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SalesBranchFilterTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashierSC;
    protected Branch $santaCruz;
    protected Branch $victoria;

    protected function setUp(): void
    {
        parent::setUp();

        $this->santaCruz = Branch::create(['name' => 'Maki Desu Sta Cruz', 'address' => 'Santa Cruz, Laguna']);
        $this->victoria  = Branch::create(['name' => 'Maki Desu Victoria', 'address' => 'Victoria, Laguna']);

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $this->santaCruz->id,
        ]);

        $this->cashierSC = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->santaCruz->id,
        ]);

        // Seed sales for Sta Cruz
        Sale::create([
            'order_number' => 'ORD-SC-001',
            'user_id' => $this->cashierSC->id,
            'branch_id' => $this->santaCruz->id,
            'type' => 'dine-in',
            'total' => 1500.00,
            'paid_amount' => 1500.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        Sale::create([
            'order_number' => 'ORD-SC-002',
            'user_id' => $this->cashierSC->id,
            'branch_id' => $this->santaCruz->id,
            'type' => 'take-out',
            'total' => 850.00,
            'paid_amount' => 850.00,
            'payment_method' => 'gcash',
            'status' => 'completed',
        ]);

        // Seed sales for Victoria
        Sale::create([
            'order_number' => 'ORD-VIC-001',
            'user_id' => $this->admin->id,
            'branch_id' => $this->victoria->id,
            'type' => 'delivery',
            'total' => 3200.00,
            'paid_amount' => 3200.00,
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);
    }

    public function test_1_default_all_branches_returns_all_sales()
    {
        $response = $this->actingAs($this->admin)->get('/sales');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 3)
            ->where('filters.branch_id', 'all')
        );
    }

    public function test_2_selecting_sta_cruz_returns_only_sta_cruz_sales()
    {
        $response = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->santaCruz->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 2)
            ->where('filters.branch_id', (string) $this->santaCruz->id)
            ->where('sales.data.0.branch_id', $this->santaCruz->id)
            ->where('sales.data.1.branch_id', $this->santaCruz->id)
        );
    }

    public function test_3_selecting_victoria_returns_only_victoria_sales()
    {
        $response = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->victoria->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 1)
            ->where('filters.branch_id', (string) $this->victoria->id)
            ->where('sales.data.0.branch_id', $this->victoria->id)
        );
    }

    public function test_4_reselecting_all_branches_returns_all_sales_again()
    {
        // 1. Query Sta Cruz
        $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->santaCruz->id);

        // 2. Query All Branches again
        $response = $this->actingAs($this->admin)->get('/sales?branch_id=all');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Sales/Index')
            ->has('sales.data', 3)
            ->where('filters.branch_id', 'all')
        );
    }

    public function test_5_full_transition_sequence_returns_correct_data_at_every_step()
    {
        // Step 1: All Branches -> 3 sales
        $res1 = $this->actingAs($this->admin)->get('/sales');
        $res1->assertInertia(fn ($p) => $p->has('sales.data', 3));

        // Step 2: Sta Cruz -> 2 sales
        $res2 = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->santaCruz->id);
        $res2->assertInertia(fn ($p) => $p->has('sales.data', 2));

        // Step 3: All Branches -> 3 sales
        $res3 = $this->actingAs($this->admin)->get('/sales?branch_id=all');
        $res3->assertInertia(fn ($p) => $p->has('sales.data', 3));

        // Step 4: Victoria -> 1 sale
        $res4 = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->victoria->id);
        $res4->assertInertia(fn ($p) => $p->has('sales.data', 1));

        // Step 5: All Branches -> 3 sales
        $res5 = $this->actingAs($this->admin)->get('/sales?branch_id=all');
        $res5->assertInertia(fn ($p) => $p->has('sales.data', 3));
    }

    public function test_6_pagination_resets_to_page_1_on_filter_change()
    {
        $response = $this->actingAs($this->admin)->get('/sales?branch_id=' . $this->santaCruz->id . '&page=1');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->where('sales.current_page', 1)
        );
    }

    public function test_7_search_with_branch_filter()
    {
        $response = $this->actingAs($this->admin)->get('/sales?search=ORD-SC-001&branch_id=' . $this->santaCruz->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('sales.data', 1)
            ->where('sales.data.0.order_number', 'ORD-SC-001')
        );
    }

    public function test_8_csv_export_respects_branch_filter()
    {
        $response = $this->actingAs($this->admin)->get('/sales/export?date_preset=7_days&branch_id=' . $this->santaCruz->id);

        $response->assertStatus(200);
        $content = $response->streamedContent();

        $this->assertStringContainsString('ORD-SC-001', $content);
        $this->assertStringContainsString('ORD-SC-002', $content);
        $this->assertStringNotContainsString('ORD-VIC-001', $content);
    }
}
