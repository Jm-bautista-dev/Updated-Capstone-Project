<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Order;
use App\Models\User;

class ClearPosSalesHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    protected function createTestBranch(): Branch
    {
        return Branch::create([
            'name' => 'Maki Desu Sta Cruz',
            'address' => 'Sta Cruz, Laguna',
            'latitude' => 14.2800,
            'longitude' => 121.4150,
            'delivery_radius_km' => 10,
        ]);
    }

    protected function createTestProduct(): Product
    {
        return Product::create([
            'name' => 'Test Item',
            'selling_price' => 100,
            'cost_price' => 50,
            'unit' => 'pcs',
        ]);
    }

    protected function createTestCashier(Branch $branch): User
    {
        return User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $branch->id,
        ]);
    }

    public function test_dry_run_does_not_delete_pos_sales(): void
    {
        $branch = $this->createTestBranch();
        $product = $this->createTestProduct();
        $user = $this->createTestCashier($branch);

        $sale = Sale::create([
            'order_number' => 'POS-DRY-RUN-1',
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'type' => 'dine-in',
            'subtotal' => 100,
            'total' => 100,
            'paid_amount' => 100,
            'status' => 'completed',
            'source' => 'pos',
        ]);

        SaleItem::create([
            'sale_id' => $sale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 100,
            'cost_price' => 50,
            'subtotal' => 100,
            'profit' => 50,
        ]);

        $this->artisan('makidesu:clear-pos-sales-history', ['--dry-run' => true])
            ->assertExitCode(0);

        $this->assertDatabaseHas('sales', ['id' => $sale->id]);
        $this->assertDatabaseHas('sale_items', ['sale_id' => $sale->id]);
    }

    public function test_clears_pos_sales_while_strictly_preserving_delivery_and_orders(): void
    {
        $branch = $this->createTestBranch();
        $product = $this->createTestProduct();
        $user = $this->createTestCashier($branch);

        // 1. POS Sale (Target for deletion)
        $posSale = Sale::create([
            'order_number' => 'POS-TARGET-DEL-1',
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'type' => 'dine-in',
            'subtotal' => 150,
            'total' => 150,
            'paid_amount' => 150,
            'status' => 'completed',
            'source' => 'pos',
        ]);
        SaleItem::create([
            'sale_id' => $posSale->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'unit_price' => 150,
            'cost_price' => 70,
            'subtotal' => 150,
            'profit' => 80,
        ]);

        // 2. Simulated Preserved Delivery Order with linked Sale
        $order = Order::create([
            'order_number' => 'ORD-PRESERVED-1',
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'status' => 'completed',
            'fulfillment_type' => 'delivery',
            'customer_name' => 'Maria Santos',
            'customer_phone' => '09123456789',
            'delivery_address' => 'Sta Cruz, Laguna',
            'total_amount' => 300,
            'subtotal' => 300,
        ]);

        $deliverySale = Sale::create([
            'order_id' => $order->id,
            'order_number' => 'DEL-PRESERVED-1',
            'user_id' => $user->id,
            'branch_id' => $branch->id,
            'type' => 'delivery',
            'subtotal' => 300,
            'total' => 300,
            'paid_amount' => 300,
            'status' => 'completed',
            'source' => 'online',
        ]);
        SaleItem::create([
            'sale_id' => $deliverySale->id,
            'product_id' => $product->id,
            'quantity' => 2,
            'unit_price' => 150,
            'cost_price' => 70,
            'subtotal' => 300,
            'profit' => 160,
        ]);

        // Run deletion with --force
        $this->artisan('makidesu:clear-pos-sales-history', ['--force' => true])
            ->assertExitCode(0);

        // Assert POS sale was deleted
        $this->assertDatabaseMissing('sales', ['id' => $posSale->id]);
        $this->assertDatabaseMissing('sale_items', ['sale_id' => $posSale->id]);

        // Assert Delivery sale and customer Order were strictly PRESERVED
        $this->assertDatabaseHas('sales', ['id' => $deliverySale->id]);
        $this->assertDatabaseHas('sale_items', ['sale_id' => $deliverySale->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id]);
    }
}
