<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use App\Models\Rider;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Delivery;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\ProductReview;

class TransactionHistoryCleanupTest extends TestCase
{
    use RefreshDatabase;

    public function test_transaction_history_cleanup_preserves_master_data_and_cleans_transactions(): void
    {
        // 1. Setup Master Data
        $branch = Branch::firstOrCreate(
            ['id' => 991],
            ['name' => 'Victoria Test Branch', 'code' => 'VIC', 'address' => 'Victoria Laguna', 'is_active' => true]
        );

        $category = Category::firstOrCreate(
            ['id' => 991],
            ['name' => 'Maki Rolls', 'is_active' => true]
        );

        $superAdmin = User::create([
            'first_name'     => 'Super',
            'last_name'      => 'Admin',
            'name'           => 'Super Admin',
            'email'          => 'test_superadmin@makidesu.test',
            'password'       => Hash::make('Password123!'),
            'role'           => User::ROLE_SUPER_ADMIN,
            'account_status' => 'active',
        ]);

        $admin = User::create([
            'first_name'     => 'Branch',
            'last_name'      => 'Manager',
            'name'           => 'Branch Manager',
            'email'          => 'test_admin@makidesu.test',
            'password'       => Hash::make('Password123!'),
            'role'           => User::ROLE_ADMIN,
            'branch_id'      => $branch->id,
            'account_status' => 'active',
        ]);

        $customer = User::create([
            'first_name'     => 'Juan',
            'last_name'      => 'Dela Cruz',
            'name'           => 'Juan Dela Cruz',
            'email'          => 'test_customer@makidesu.test',
            'mobile_number'  => '09171234567',
            'password'       => Hash::make('Password123!'),
            'role'           => User::ROLE_CUSTOMER,
            'account_status' => 'active',
        ]);

        $rider = Rider::create([
            'name'           => 'Speedy Rider',
            'email'          => 'test_rider@makidesu.test',
            'phone'          => '09181234567',
            'password'       => Hash::make('RiderPass123!'),
            'branch_id'      => $branch->id,
            'status'         => 'busy', // Deliberately set to busy from a past delivery
            'account_status' => 'active',
            'is_active'      => true,
        ]);

        $product = Product::create([
            'name'          => 'California Maki Roll',
            'sku'           => 'TEST-MAK-001',
            'selling_price' => 180.00,
            'cost_price'    => 65.00,
            'category_id'   => $category->id,
            'branch_id'     => $branch->id,
            'stock'         => 25.0,
            'unit'          => 'pcs',
        ]);

        // Branch product pivot stock
        DB::table('branch_product')->insert([
            'product_id' => $product->id,
            'branch_id'  => $branch->id,
            'stock'      => 25.0,
            'price'      => 180.00,
            'is_active'  => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $ingredient = Ingredient::create([
            'name'               => 'Nori Sheets',
            'unit'               => 'pcs',
            'cost_per_base_unit' => 2.50,
        ]);

        $ingredientStock = IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $branch->id],
            ['stock' => 150.0, 'low_stock_level' => 20.0]
        );

        // 2. Setup Historical Transactions (Completed/Delivered)
        $order = Order::create([
            'order_number'     => 'ORD-TEST-0001',
            'user_id'          => $customer->id,
            'branch_id'        => $branch->id,
            'fulfillment_type' => 'delivery',
            'order_source'     => 'mobile_app',
            'customer_name'    => $customer->name,
            'contact_number'   => $customer->mobile_number,
            'status'           => 'delivered',
            'payment_status'   => 'paid',
            'total_amount'     => 360.00,
        ]);

        $orderItem = OrderItem::create([
            'order_id'   => $order->id,
            'product_id' => $product->id,
            'quantity'   => 2,
            'price'      => 180.00,
            'unit_price' => 180.00,
            'line_total' => 360.00,
        ]);

        $sale = Sale::create([
            'order_id'       => $order->id,
            'order_number'   => $order->order_number,
            'user_id'        => $admin->id,
            'branch_id'      => $branch->id,
            'type'           => 'delivery',
            'subtotal'       => 360.00,
            'total'          => 360.00,
            'paid_amount'    => 360.00,
            'change_amount'  => 0.00,
            'payment_method' => 'cash',
            'status'         => 'completed',
        ]);

        $saleItem = SaleItem::create([
            'sale_id'    => $sale->id,
            'product_id' => $product->id,
            'quantity'   => 2,
            'unit_price' => 180.00,
            'cost_price' => 65.00,
            'subtotal'   => 360.00,
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'sale_id'          => $sale->id,
            'rider_id'         => $rider->id,
            'customer_name'    => $customer->name,
            'customer_phone'   => $customer->mobile_number,
            'customer_address' => 'Sample Address',
            'status'           => 'delivered',
        ]);

        ProductReview::create([
            'user_id'       => $customer->id,
            'product_id'    => $product->id,
            'order_id'      => $order->id,
            'order_item_id' => $orderItem->id,
            'branch_id'     => $branch->id,
            'rating'        => 5,
            'comment'       => 'Great food!',
            'status'        => 'published',
        ]);

        // 3. Execute Cleanup Command
        $exitCode = Artisan::call('makidesu:clean-transaction-history', [
            '--force'     => true,
            '--no-backup' => true,
        ]);

        $this->assertEquals(0, $exitCode, 'Artisan cleanup command should exit with status 0');

        // 4. Assert Protected Master Data & Accounts are PRESERVED
        $this->assertDatabaseHas('users', [
            'id'    => $superAdmin->id,
            'email' => 'test_superadmin@makidesu.test',
            'role'  => User::ROLE_SUPER_ADMIN,
        ]);
        $this->assertDatabaseHas('users', [
            'id'    => $admin->id,
            'email' => 'test_admin@makidesu.test',
            'role'  => User::ROLE_ADMIN,
        ]);
        $this->assertDatabaseHas('users', [
            'id'    => $customer->id,
            'email' => 'test_customer@makidesu.test',
            'role'  => User::ROLE_CUSTOMER,
        ]);

        // Customer can still authenticate with original password
        $freshCustomer = User::find($customer->id);
        $this->assertTrue(Hash::check('Password123!', $freshCustomer->password));

        // Rider preserved and operational state normalized from busy -> available
        $freshRider = Rider::find($rider->id);
        $this->assertNotNull($freshRider);
        $this->assertTrue(Hash::check('RiderPass123!', $freshRider->password));
        $this->assertEquals('available', $freshRider->status, 'Rider status should be normalized to available');

        // Product & Ingredient Preserved
        $this->assertDatabaseHas('products', [
            'id'   => $product->id,
            'name' => 'California Maki Roll',
        ]);
        $this->assertDatabaseHas('ingredients', [
            'id'   => $ingredient->id,
            'name' => 'Nori Sheets',
        ]);

        // 5. Assert Inventory Stock is 100% INTACT
        $freshProductPivot = DB::table('branch_product')
            ->where('product_id', $product->id)
            ->where('branch_id', $branch->id)
            ->first();
        $this->assertEquals(25.0, (float) $freshProductPivot->stock, 'Product branch stock must remain unchanged');

        $freshIngredientStock = IngredientStock::find($ingredientStock->id);
        $this->assertEquals(150.0, (float) $freshIngredientStock->stock, 'Ingredient stock must remain unchanged');

        // 6. Assert Historical Transaction Data is CLEANED
        $this->assertEquals(0, Order::count(), 'Orders should be 0');
        $this->assertEquals(0, OrderItem::count(), 'OrderItems should be 0');
        $this->assertEquals(0, Sale::count(), 'Sales should be 0');
        $this->assertEquals(0, SaleItem::count(), 'SaleItems should be 0');
        $this->assertEquals(0, Delivery::count(), 'Deliveries should be 0');
        $this->assertEquals(0, ProductReview::count(), 'Reviews should be 0');

        // 7. Verify System Can Create A Fresh New Order After Cleanup
        $newOrder = Order::create([
            'order_number'     => 'ORD-FRESH-0001',
            'user_id'          => $customer->id,
            'branch_id'        => $branch->id,
            'fulfillment_type' => 'pickup',
            'order_source'     => 'mobile_app',
            'customer_name'    => $customer->name,
            'contact_number'   => $customer->mobile_number,
            'status'           => 'pending',
            'payment_status'   => 'unpaid',
            'total_amount'     => 180.00,
        ]);

        $this->assertDatabaseHas('orders', [
            'order_number' => 'ORD-FRESH-0001',
            'status'       => 'pending',
        ]);

        // Clean up test records
        $newOrder->delete();
        $product->forceDelete();
        $ingredient->forceDelete();
        $ingredientStock->delete();
        $customer->forceDelete();
        $rider->forceDelete();
        $admin->forceDelete();
        $superAdmin->forceDelete();
        DB::table('branch_product')->where('product_id', $product->id)->delete();
        $category->delete();
        $branch->delete();
    }

    public function test_cleanup_aborts_when_active_orders_exist_unless_forced(): void
    {
        $branch = Branch::firstOrCreate(
            ['id' => 992],
            ['name' => 'Sta Cruz Test Branch', 'code' => 'STC', 'address' => 'Sta Cruz Laguna', 'is_active' => true]
        );

        $order = Order::create([
            'order_number'     => 'ORD-ACTIVE-0001',
            'branch_id'        => $branch->id,
            'fulfillment_type' => 'delivery',
            'order_source'     => 'mobile_app',
            'customer_name'    => 'Active Customer',
            'contact_number'   => '09170000000',
            'status'           => 'preparing', // Active in-flight order
            'payment_status'   => 'paid',
            'total_amount'     => 500.00,
        ]);

        // Attempt cleanup without --force-active-orders
        $exitCode = Artisan::call('makidesu:clean-transaction-history', [
            '--force'     => true,
            '--no-backup' => true,
        ]);

        $this->assertEquals(1, $exitCode, 'Should abort with exit code 1 when active orders exist');
        $this->assertDatabaseHas('orders', ['order_number' => 'ORD-ACTIVE-0001']);

        // Now run with --force-active-orders
        $forceExitCode = Artisan::call('makidesu:clean-transaction-history', [
            '--force'               => true,
            '--force-active-orders' => true,
            '--no-backup'           => true,
        ]);

        $this->assertEquals(0, $forceExitCode, 'Should succeed when --force-active-orders is provided');
        $this->assertDatabaseMissing('orders', ['order_number' => 'ORD-ACTIVE-0001']);

        $branch->delete();
    }
}
