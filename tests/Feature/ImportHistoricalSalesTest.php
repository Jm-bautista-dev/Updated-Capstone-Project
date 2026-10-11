<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Models\CashierShift;

class ImportHistoricalSalesTest extends TestCase
{
    use RefreshDatabase;

    protected string $tempCsvPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempCsvPath = sys_get_temp_dir() . '/test_historical_sales_' . uniqid() . '.csv';
    }

    protected function tearDown(): void
    {
        if (file_exists($this->tempCsvPath)) {
            @unlink($this->tempCsvPath);
        }
        parent::tearDown();
    }

    protected function createBranchAndCashier(): array
    {
        $branch = Branch::create([
            'name' => 'Maki Desu Sta Cruz',
            'address' => 'Sta Cruz, Laguna',
            'latitude' => 14.2800,
            'longitude' => 121.4150,
            'delivery_radius_km' => 10,
        ]);

        $cashier = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $branch->id,
        ]);

        return [$branch, $cashier];
    }

    protected function createProduct(string $name, float $price = 99.0): Product
    {
        return Product::create([
            'name' => $name,
            'selling_price' => $price,
            'cost_price' => 50,
            'unit' => 'pcs',
        ]);
    }

    public function test_import_generates_stable_timestamps_within_9am_to_7pm(): void
    {
        [$branch, $cashier] = $this->createBranchAndCashier();
        $product = $this->createProduct('Student Meal', 99.0);

        $csvContent = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
            . "Sta Cruz,{$product->name},2,198,Cash,September 15 2026\n"
            . "Sta Cruz,{$product->name},3,297,Cash,September 15 2026\n";

        file_put_contents($this->tempCsvPath, $csvContent);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
            '--skip-duplicates' => true,
        ])->assertExitCode(0);

        $sales = Sale::whereDate('created_at', '2026-09-15')->get();
        $this->assertCount(2, $sales);

        foreach ($sales as $sale) {
            $time = Carbon::parse($sale->created_at)->format('H:i:s');
            $this->assertGreaterThanOrEqual('09:00:00', $time, "Sale {$sale->order_number} occurred before 9:00 AM");
            $this->assertLessThanOrEqual('19:00:00', $time, "Sale {$sale->order_number} occurred after 7:00 PM");
            $this->assertEquals('2026-09-15', Carbon::parse($sale->created_at)->format('Y-m-d'));
            $this->assertStringStartsWith('POS-SC-20260915-', $sale->order_number);
        }
    }

    public function test_import_creates_daily_cashier_shift_with_1500_float(): void
    {
        [$branch, $cashier] = $this->createBranchAndCashier();
        $product = $this->createProduct('Classic California Maki (8pcs)', 100.0);

        $csvContent = "Branch,Product,Quantity,Total Price,Payment Method,Date\n"
            . "Sta Cruz,{$product->name},1,100,Cash,September 16 2026\n"
            . "Sta Cruz,{$product->name},2,200,Cash,September 16 2026\n";

        file_put_contents($this->tempCsvPath, $csvContent);

        $this->artisan('makidesu:import-historical-sales', [
            'file' => $this->tempCsvPath,
            '--cashier-float' => 1500,
            '--skip-duplicates' => true,
        ])->assertExitCode(0);

        $shift = CashierShift::where('branch_id', $branch->id)
            ->whereDate('opened_at', '2026-09-16')
            ->first();

        $this->assertNotNull($shift, 'CashierShift for 2026-09-16 was not created');
        $this->assertEquals(1500.00, (float)$shift->opening_balance);
        $this->assertEquals(300.00, (float)$shift->total_cash_sales);
        $this->assertEquals(1800.00, (float)$shift->closing_balance);
        $this->assertEquals(1800.00, (float)$shift->expected_balance);
        $this->assertEquals(0.00, (float)$shift->variance);
        $this->assertEquals('closed', $shift->status);
        $this->assertEquals('09:00:00', Carbon::parse($shift->opened_at)->format('H:i:s'));
        $this->assertEquals('19:00:00', Carbon::parse($shift->closed_at)->format('H:i:s'));
    }
}
