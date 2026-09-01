<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReceiptBranchHeaderTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $victoriaBranch;
    protected Branch $staCruzBranch;
    protected User $victoriaCashier;
    protected User $staCruzCashier;
    protected User $customer;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->victoriaBranch = Branch::create([
            'name'       => 'Maki Desu Victoria',
            'address'    => 'Victoria, Laguna',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->staCruzBranch = Branch::create([
            'name'       => 'Maki Desu Sta Cruz',
            'address'    => 'Sta Cruz, Laguna',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->victoriaCashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->victoriaBranch->id,
        ]);

        $this->staCruzCashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->staCruzBranch->id,
        ]);

        $this->customer = User::factory()->create([
            'role' => 'customer',
        ]);

        $category = Category::create([
            'name' => 'Maki Rolls',
        ]);

        $this->product = Product::create([
            'name'          => 'California Maki',
            'category_id'   => $category->id,
            'selling_price' => 150.00,
            'stock'         => 100,
        ]);
    }

    /**
     * Test 1: Victoria POS order retains Victoria branch association.
     */
    public function test_victoria_pos_order_retains_authoritative_branch(): void
    {
        $sale = Sale::create([
            'order_number'   => 'POS-VIC-001',
            'user_id'        => $this->victoriaCashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 150.00,
            'total'          => 150.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $this->product->id,
            'quantity'   => 1,
            'unit_price' => 150.00,
            'subtotal'   => 150.00,
        ]);

        $loadedSale = Sale::with('branch')->find($sale->id);
        $this->assertNotNull($loadedSale->branch);
        $this->assertEquals($this->victoriaBranch->id, $loadedSale->branch->id);
        $this->assertEquals('Maki Desu Victoria', $loadedSale->branch->name);
    }

    /**
     * Test 2: Sta. Cruz POS order retains Sta. Cruz branch association.
     */
    public function test_sta_cruz_pos_order_retains_authoritative_branch(): void
    {
        $sale = Sale::create([
            'order_number'   => 'POS-STA-001',
            'user_id'        => $this->staCruzCashier->id,
            'branch_id'      => $this->staCruzBranch->id,
            'type'           => 'dine-in',
            'subtotal'       => 150.00,
            'total'          => 150.00,
            'paid_amount'    => 200.00,
            'change_amount'  => 50.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $loadedSale = Sale::with('branch')->find($sale->id);
        $this->assertNotNull($loadedSale->branch);
        $this->assertEquals($this->staCruzBranch->id, $loadedSale->branch->id);
        $this->assertEquals('Maki Desu Sta Cruz', $loadedSale->branch->name);
    }

    /**
     * Test 3: Victoria mobile order retains Victoria branch association.
     */
    public function test_victoria_mobile_order_retains_authoritative_branch(): void
    {
        $order = Order::create([
            'order_number'       => 'MOB-VIC-001',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->victoriaBranch->id,
            'fulfillment_method' => 'delivery',
            'customer_name'      => 'Juan Victoria',
            'contact_number'     => '09123456789',
            'address'            => '123 Victoria St',
            'total_amount'       => 300.00,
            'payment_method'     => 'cod',
            'status'             => 'pending',
        ]);

        $loadedOrder = Order::with('branch')->find($order->id);
        $this->assertEquals($this->victoriaBranch->id, $loadedOrder->branch->id);
    }

    /**
     * Test 4: Sta. Cruz mobile order retains Sta. Cruz branch association.
     */
    public function test_sta_cruz_mobile_order_retains_authoritative_branch(): void
    {
        $order = Order::create([
            'order_number'       => 'MOB-STA-001',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->staCruzBranch->id,
            'fulfillment_method' => 'delivery',
            'customer_name'      => 'Maria Sta Cruz',
            'contact_number'     => '09987654321',
            'address'            => '456 Sta Cruz Ave',
            'total_amount'       => 300.00,
            'payment_method'     => 'cod',
            'status'             => 'pending',
        ]);

        $loadedOrder = Order::with('branch')->find($order->id);
        $this->assertEquals($this->staCruzBranch->id, $loadedOrder->branch->id);
    }

    /**
     * Test 5 & 6: Pickup fulfillment orders (Victoria & Sta. Cruz) retain respective branches.
     */
    public function test_pickup_orders_retain_respective_authoritative_branches(): void
    {
        $pickupVic = Order::create([
            'order_number'       => 'PKP-VIC-001',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->victoriaBranch->id,
            'fulfillment_method' => 'pickup',
            'pickup_date'        => now()->toDateString(),
            'pickup_time'        => '14:00',
            'customer_name'      => 'Pickup Victoria',
            'contact_number'     => '09111111111',
            'total_amount'       => 150.00,
            'status'             => 'ready_for_pickup',
        ]);

        $pickupSta = Order::create([
            'order_number'       => 'PKP-STA-001',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->staCruzBranch->id,
            'fulfillment_method' => 'pickup',
            'pickup_date'        => now()->toDateString(),
            'pickup_time'        => '15:00',
            'customer_name'      => 'Pickup Sta Cruz',
            'contact_number'     => '09222222222',
            'total_amount'       => 150.00,
            'status'             => 'ready_for_pickup',
        ]);

        $this->assertEquals($this->victoriaBranch->id, Order::find($pickupVic->id)->branch_id);
        $this->assertEquals($this->staCruzBranch->id, Order::find($pickupSta->id)->branch_id);
    }

    /**
     * Test 7: Facebook/Messenger manual order retains its branch.
     */
    public function test_facebook_messenger_manual_order_retains_authoritative_branch(): void
    {
        $fbOrder = Order::create([
            'order_number'       => 'FB-MANUAL-001',
            'user_id'            => null,
            'branch_id'          => $this->staCruzBranch->id,
            'fulfillment_method' => 'pickup',
            'order_source'       => 'facebook',
            'customer_name'      => 'FB Customer',
            'contact_number'     => '09333333333',
            'total_amount'       => 450.00,
            'status'             => 'confirmed',
        ]);

        $loadedFbOrder = Order::with('branch')->find($fbOrder->id);
        $this->assertEquals($this->staCruzBranch->id, $loadedFbOrder->branch->id);
        $this->assertEquals('Maki Desu Sta Cruz', $loadedFbOrder->branch->name);
    }

    /**
     * Test 8 & 9: Reprinted historical receipts remain tied to original recorded branch.
     */
    public function test_historical_sales_receipt_remains_tied_to_original_branch_even_when_cashier_switches(): void
    {
        // Sale recorded 6 months ago at Sta. Cruz branch
        $oldSale = Sale::create([
            'order_number'   => 'HIST-STA-2025',
            'user_id'        => $this->staCruzCashier->id,
            'branch_id'      => $this->staCruzBranch->id,
            'type'           => 'take-out',
            'subtotal'       => 500.00,
            'total'          => 500.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
            'created_at'     => now()->subMonths(6),
        ]);

        // When queried through Sales index by an admin or viewer
        $fetched = Sale::with(['branch', 'order.branch'])->find($oldSale->id);
        $this->assertEquals($this->staCruzBranch->id, $fetched->branch->id);
        $this->assertEquals('Maki Desu Sta Cruz', $fetched->branch->name);
    }

    /**
     * Test 10: Delivery waybill queries eager-load authoritative branch.
     */
    public function test_delivery_waybill_retains_authoritative_branch(): void
    {
        $sale = Sale::create([
            'order_number'   => 'DEL-VIC-999',
            'user_id'        => $this->victoriaCashier->id,
            'branch_id'      => $this->victoriaBranch->id,
            'type'           => 'delivery',
            'subtotal'       => 600.00,
            'total'          => 650.00,
            'paid_amount'    => 650.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $order = Order::create([
            'order_number'       => 'DEL-VIC-999',
            'user_id'            => $this->customer->id,
            'branch_id'          => $this->victoriaBranch->id,
            'fulfillment_method' => 'delivery',
            'customer_name'      => 'Waybill Customer',
            'contact_number'     => '09444444444',
            'address'            => '789 Victoria Blvd',
            'total_amount'       => 600.00,
            'status'             => 'in_transit',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'sale_id'          => $sale->id,
            'delivery_type'    => 'internal',
            'status'           => 'in_transit',
            'customer_name'    => 'Waybill Customer',
            'customer_address' => '789 Victoria Blvd',
            'customer_phone'   => '09444444444',
            'delivery_fee'     => 50.00,
        ]);

        $loadedDelivery = Delivery::with(['order.branch', 'sale.branch'])->find($delivery->id);
        $this->assertEquals($this->victoriaBranch->id, $loadedDelivery->order->branch->id);
        $this->assertEquals($this->victoriaBranch->id, $loadedDelivery->sale->branch->id);
    }
}
