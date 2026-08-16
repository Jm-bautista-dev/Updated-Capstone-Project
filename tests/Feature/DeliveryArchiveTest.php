<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Order;
use App\Models\Branch;
use App\Models\Rider;
use App\Models\Delivery;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DeliveryArchiveTest extends TestCase
{
    use RefreshDatabase;

    public User $adminUser;
    public User $cashierSantaCruz;
    public Branch $branchSantaCruz;
    public Branch $branchVictoria;
    public Rider $rider1;
    public Rider $rider2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchSantaCruz = Branch::create([
            'name' => 'MAKI DESU STA CRUZ',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchVictoria = Branch::create([
            'name' => 'MAKI DESU VICTORIA',
            'latitude' => 14.6000,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->adminUser = User::factory()->create([
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->cashierSantaCruz = User::factory()->create([
            'role' => 'cashier',
            'branch_id' => $this->branchSantaCruz->id,
            'must_change_password' => false,
        ]);

        $this->rider1 = Rider::create([
            'name' => 'Rider John',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
            'phone' => '09170001111',
            'is_active' => true,
            'branch_id' => $this->branchSantaCruz->id,
        ]);

        $this->rider2 = Rider::create([
            'name' => 'Rider Mark',
            'email' => 'mark@example.com',
            'password' => bcrypt('password'),
            'phone' => '09170002222',
            'is_active' => true,
            'branch_id' => $this->branchVictoria->id,
        ]);
    }

    /**
     * Test Today Operational View displays active deliveries and today's completed deliveries only.
     */
    public function test_today_view_hides_yesterdays_delivered_orders()
    {
        // 1. Delivery completed today
        $orderToday = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Alice Today',
            'contact_number' => '09171111111',
            'address' => '123 Main St',
            'total_amount' => 300.00,
            'status' => 'completed',
        ]);
        $deliveryToday = Delivery::create([
            'order_id' => $orderToday->id,
            'customer_name' => 'Alice Today',
            'customer_address' => '123 Main St',
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        // 2. Delivery completed yesterday
        $orderYesterday = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Bob Yesterday',
            'contact_number' => '09172222222',
            'address' => '456 Side St',
            'total_amount' => 400.00,
            'status' => 'completed',
        ]);
        $deliveryYesterday = Delivery::create([
            'order_id' => $orderYesterday->id,
            'customer_name' => 'Bob Yesterday',
            'customer_address' => '456 Side St',
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
            'created_at' => now()->subDay(),
        ]);

        // 3. Active Delivery
        $orderActive = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Charlie Active',
            'contact_number' => '09173333333',
            'address' => '789 Broad St',
            'total_amount' => 200.00,
            'status' => 'preparing',
        ]);
        $deliveryActive = Delivery::create([
            'order_id' => $orderActive->id,
            'customer_name' => 'Charlie Active',
            'customer_address' => '789 Broad St',
            'status' => 'preparing',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get('/deliveries?view=today');

        $response->assertStatus(200);

        $deliveries = $response->original->getData()['page']['props']['deliveries']['data'];
        $deliveryIds = array_column($deliveries, 'id');

        $this->assertContains($deliveryToday->id, $deliveryIds);
        $this->assertContains($deliveryActive->id, $deliveryIds);
        $this->assertNotContains($deliveryYesterday->id, $deliveryIds);
    }

    /**
     * Test Archive View retrieves historical delivered orders across days.
     */
    public function test_archive_view_returns_historical_delivered_orders()
    {
        $orderYesterday = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Bob Yesterday',
            'contact_number' => '09172222222',
            'address' => '456 Side St',
            'total_amount' => 400.00,
            'status' => 'completed',
        ]);
        $deliveryYesterday = Delivery::create([
            'order_id' => $orderYesterday->id,
            'customer_name' => 'Bob Yesterday',
            'customer_address' => '456 Side St',
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
            'created_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get('/deliveries?view=archive');

        $response->assertStatus(200);

        $deliveries = $response->original->getData()['page']['props']['deliveries']['data'];
        $deliveryIds = array_column($deliveries, 'id');

        $this->assertContains($deliveryYesterday->id, $deliveryIds);
    }

    /**
     * Test Archive view date preset filtering (date_preset=yesterday).
     */
    public function test_archive_filtering_by_date_preset_yesterday()
    {
        $deliveryToday = Delivery::create([
            'customer_name' => 'Today Customer',
            'customer_address' => '123 Main St',
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        $deliveryYesterday = Delivery::create([
            'customer_name' => 'Yesterday Customer',
            'customer_address' => '456 Side St',
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
            'created_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->get('/deliveries?view=archive&date_preset=yesterday');

        $response->assertStatus(200);

        $deliveries = $response->original->getData()['page']['props']['deliveries']['data'];
        $deliveryIds = array_column($deliveries, 'id');

        $this->assertContains($deliveryYesterday->id, $deliveryIds);
        $this->assertNotContains($deliveryToday->id, $deliveryIds);
    }

    /**
     * Test Branch Isolation enforces strict security on archive queries.
     */
    public function test_branch_isolation_enforces_visibility_on_archive()
    {
        $orderSantaCruz = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchSantaCruz->id,
            'customer_name' => 'Sta Cruz Customer',
            'contact_number' => '09171111111',
            'address' => 'Sta Cruz St',
            'total_amount' => 100.00,
            'status' => 'completed',
        ]);
        $deliverySantaCruz = Delivery::create([
            'order_id' => $orderSantaCruz->id,
            'customer_name' => 'Sta Cruz Customer',
            'customer_address' => 'Sta Cruz St',
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
        ]);

        $orderVictoria = Order::create([
            'user_id' => $this->adminUser->id,
            'branch_id' => $this->branchVictoria->id,
            'customer_name' => 'Victoria Customer',
            'contact_number' => '09172222222',
            'address' => 'Victoria St',
            'total_amount' => 200.00,
            'status' => 'completed',
        ]);
        $deliveryVictoria = Delivery::create([
            'order_id' => $orderVictoria->id,
            'customer_name' => 'Victoria Customer',
            'customer_address' => 'Victoria St',
            'status' => 'delivered',
            'delivered_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->cashierSantaCruz)
            ->get('/deliveries?view=archive');

        $response->assertStatus(200);

        $deliveries = $response->original->getData()['page']['props']['deliveries']['data'];
        $deliveryIds = array_column($deliveries, 'id');

        $this->assertContains($deliverySantaCruz->id, $deliveryIds);
        $this->assertNotContains($deliveryVictoria->id, $deliveryIds);
    }
}
