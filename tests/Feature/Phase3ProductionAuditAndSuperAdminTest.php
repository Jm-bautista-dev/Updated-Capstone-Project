<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\DeliveryAttempt;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rider;
use App\Models\User;
use App\Services\CustomerRiskService;
use App\Services\DeliveryService;
use App\Services\SecurityAuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class Phase3ProductionAuditAndSuperAdminTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $superAdmin;
    protected User $adminUser;
    protected User $cashierUser;
    protected User $customerA;
    protected User $customerB;
    protected Rider $riderA;
    protected Rider $riderB;
    protected Product $product;
    protected Ingredient $ingredient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                => 'Maki Desu Victoria',
            'code'                => 'MD-VIC',
            'address'             => 'Victoria Plaza, Laguna',
            'latitude'            => 14.2307,
            'longitude'           => 121.3283,
            'delivery_radius_km'  => 15.0,
            'base_delivery_fee'   => 50.00,
            'delivery_fee_per_km' => 10.00,
            'is_active'           => true,
            'has_internal_riders' => true,
        ]);

        $this->superAdmin = User::create([
            'name'              => 'Global Super Admin',
            'email'             => 'superadmin@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_SUPER_ADMIN,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->adminUser = User::create([
            'name'              => 'Branch Admin',
            'email'             => 'admin@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_ADMIN,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->cashierUser = User::create([
            'name'              => 'Cashier Staff',
            'email'             => 'cashier@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CASHIER,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->customerA = User::create([
            'name'              => 'Customer Alice',
            'email'             => 'alice@example.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CUSTOMER,
            'mobile_number'     => '09171112233',
            'phone_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->customerB = User::create([
            'name'              => 'Customer Bob',
            'email'             => 'bob@example.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CUSTOMER,
            'mobile_number'     => '09174445566',
            'phone_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->riderA = Rider::create([
            'name'      => 'Rider Alice',
            'email'     => 'riderA@example.com',
            'password'  => Hash::make('password123'),
            'status'    => 'available',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->riderB = Rider::create([
            'name'      => 'Rider Bob',
            'email'     => 'riderB@example.com',
            'password'  => Hash::make('password123'),
            'status'    => 'available',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        $this->ingredient = Ingredient::create([
            'name'                   => 'Fresh Salmon',
            'unit'                   => 'g',
            'cost_per_base_unit'     => 0.50,
            'avg_weight_per_piece'   => 1.0,
            'is_active'              => true,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 10000.0]
        );

        $this->product = Product::create([
            'name'          => 'Salmon Sushi Combo',
            'selling_price' => 200.00,
            'cost_price'    => 80.00,
            'branch_id'     => $this->branch->id,
            'is_available'  => true,
            'stock'         => 25,
        ]);

        $this->product->ingredients()->attach($this->ingredient->id, [
            'quantity_required' => 100.0,
            'unit'              => 'g',
        ]);
    }

    /**
     * TEST 1 — SUPER ADMIN CUSTOMER RISK LIST & METRICS CALCULATION
     */
    public function test_super_admin_can_view_customer_risk_list_and_metrics(): void
    {
        $this->actingAs($this->superAdmin);

        $res = $this->getJson('/super-admin/customer-risk');
        $res->assertStatus(200);
        $res->assertJsonStructure([
            'success',
            'customers' => [
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'mobile_number',
                        'risk_level',
                        'cod_restricted',
                        'metrics' => [
                            'completed_orders',
                            'customer_refusals',
                            'customer_attributable_failures',
                            'business_rider_system_failures',
                        ]
                    ]
                ]
            ]
        ]);
    }

    /**
     * TEST 2 — SUPER ADMIN MANUAL COD OVERRIDE WITH STRUCTURED AUDIT LOGGING
     */
    public function test_super_admin_can_manually_override_customer_cod_and_audit_log_is_recorded(): void
    {
        $this->actingAs($this->superAdmin);

        $payload = [
            'cod_restricted'      => true,
            'risk_level_override' => 'HIGH_RISK',
            'reason'              => 'Repeated fake delivery addresses reported by riders',
        ];

        $res = $this->postJson("/super-admin/customer-risk/{$this->customerA->id}/override", $payload);
        $res->assertStatus(200);
        $res->assertJson(['success' => true]);

        // Customer state updated in DB
        $this->customerA->refresh();
        $this->assertTrue((bool) $this->customerA->cod_restricted);
        $this->assertEquals('HIGH_RISK', $this->customerA->risk_level_override);
        $this->assertEquals('Repeated fake delivery addresses reported by riders', $this->customerA->cod_restriction_reason);

        // Verify security audit log
        $auditLog = AuditLog::where('action', 'SECURITY:COD_OVERRIDE_PERFORMED')
            ->where('target', "user:{$this->customerA->id}")
            ->first();

        $this->assertNotNull($auditLog);
        $this->assertEquals($this->superAdmin->id, $auditLog->actor_id);
        $this->assertEquals('Repeated fake delivery addresses reported by riders', $auditLog->after_state['reason']);
    }

    /**
     * TEST 3 — STAFF AND NORMAL ADMIN CANNOT OVERRIDE CUSTOMER RISK (403 FORBIDDEN)
     */
    public function test_staff_and_admin_cannot_override_customer_risk(): void
    {
        $payload = [
            'cod_restricted'      => true,
            'risk_level_override' => 'RESTRICTED',
            'reason'              => 'Unauthorized cashier action',
        ];

        // 1. Cashier attempt
        $this->actingAs($this->cashierUser);
        $res1 = $this->postJson("/super-admin/customer-risk/{$this->customerA->id}/override", $payload);
        $res1->assertStatus(403);

        // 2. Normal Admin attempt
        $this->actingAs($this->adminUser);
        $res2 = $this->postJson("/super-admin/customer-risk/{$this->customerA->id}/override", $payload);
        $res2->assertStatus(403);

        // Assert customer was NOT modified
        $this->customerA->refresh();
        $this->assertFalse((bool) $this->customerA->cod_restricted);
    }

    /**
     * TEST 4 — RIDER DELIVERY STATE MACHINE INTEGRITY
     */
    public function test_rider_cannot_jump_states_arbitrarily(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-STATE-1',
            'user_id'        => $this->customerA->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customerA->name,
            'contact_number' => $this->customerA->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 250.00,
            'payment_method' => 'cash',
            'status'         => 'ready_for_pickup',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->riderA->id,
            'customer_name'    => $this->customerA->name,
            'customer_phone'   => $this->customerA->mobile_number,
            'customer_address' => 'Victoria Plaza Laguna',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'assigned_to_rider', // Not picked up yet
        ]);

        Sanctum::actingAs($this->riderA);

        // 1. Attempt to jump directly to 'deliver' without being in_transit (must fail with 422)
        $resDirectDeliver = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/deliver");
        $resDirectDeliver->assertStatus(422);

        // 2. Attempt to start transit before pickup (must fail with 422)
        $resDirectTransit = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/transit");
        $resDirectTransit->assertStatus(422);

        // 3. Different rider (Rider B) attempting to pickup Rider A's assigned delivery (must fail with 403)
        Sanctum::actingAs($this->riderB);
        $resWrongRider = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/pickup");
        $resWrongRider->assertStatus(403);
    }

    /**
     * TEST 5 — ADMIN CAN VIEW DELIVERY ATTEMPTS HISTORY
     */
    public function test_admin_delivery_view_eager_loads_attempts(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-ATTEMPT-HIST-1',
            'user_id'        => $this->customerA->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customerA->name,
            'contact_number' => $this->customerA->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 250.00,
            'payment_method' => 'cash',
            'status'         => 'in_transit',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->riderA->id,
            'customer_name'    => $this->customerA->name,
            'customer_phone'   => $this->customerA->mobile_number,
            'customer_address' => 'Victoria Plaza Laguna',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'in_transit',
        ]);

        // Record 2 attempts
        app(DeliveryService::class)->recordDeliveryAttempt(
            delivery: $delivery,
            status: 'failed',
            failureReason: 'CUSTOMER_UNAVAILABLE',
            latitude: 14.2310,
            longitude: 121.3280,
            notes: 'Attempt 1: No answer at gate',
            riderId: $this->riderA->id
        );

        $this->actingAs($this->adminUser);

        $res = $this->get('/deliveries');
        $res->assertStatus(200);

        // Verify attempts exist in database
        $this->assertEquals(1, $delivery->fresh()->attempts()->count());
    }

    /**
     * TEST 6 — IDOR / BOLA PROTECTION ACROSS CUSTOMER ORDER TRACKING
     */
    public function test_customer_cannot_track_or_route_another_customers_order(): void
    {
        $orderB = Order::create([
            'order_number'   => 'ORD-BOB-999',
            'user_id'        => $this->customerB->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customerB->name,
            'contact_number' => $this->customerB->mobile_number,
            'address'        => 'Private Address B',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 500.00,
            'payment_method' => 'cash',
            'status'         => 'in_transit',
        ]);

        Delivery::create([
            'order_id'         => $orderB->id,
            'rider_id'         => $this->riderA->id,
            'customer_name'    => $this->customerB->name,
            'customer_phone'   => $this->customerB->mobile_number,
            'customer_address' => 'Private Address B',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'in_transit',
        ]);

        // Customer Alice acts
        Sanctum::actingAs($this->customerA);

        // Attempt tracking Bob's order -> 403 Forbidden
        $resTracking = $this->getJson("/api/v1/customer/orders/{$orderB->id}/tracking");
        $resTracking->assertStatus(403);

        // Attempt route Bob's order -> 403 Forbidden
        $resRoute = $this->getJson("/api/v1/customer/orders/{$orderB->id}/route");
        $resRoute->assertStatus(403);
    }
}
