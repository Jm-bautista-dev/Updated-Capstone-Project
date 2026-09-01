<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\ModerationCase;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rider;
use App\Models\User;
use App\Services\AccountGovernanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountGovernanceAndModerationTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $superAdmin;
    protected User $adminUser;
    protected User $cashierUser;
    protected User $customer;
    protected Rider $rider;
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
            'name'              => 'Master Super Admin',
            'email'             => 'super@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_SUPER_ADMIN,
            'account_status'    => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->adminUser = User::create([
            'name'              => 'Branch Admin',
            'email'             => 'admin@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_ADMIN,
            'account_status'    => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->cashierUser = User::create([
            'name'              => 'Cashier User',
            'email'             => 'cashier@makidesu.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CASHIER,
            'account_status'    => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->customer = User::create([
            'name'              => 'Customer Carlos',
            'email'             => 'carlos@example.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CUSTOMER,
            'account_status'    => User::STATUS_ACTIVE,
            'mobile_number'     => '09179998877',
            'phone_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->rider = Rider::create([
            'name'           => 'Rider Rodrigo',
            'email'          => 'rodrigo@example.com',
            'password'       => Hash::make('password123'),
            'phone'          => '09181112233',
            'status'         => 'available',
            'account_status' => Rider::STATUS_ACTIVE,
            'branch_id'      => $this->branch->id,
            'is_active'      => true,
        ]);

        $this->ingredient = Ingredient::create([
            'name'                 => 'Sushi Rice',
            'unit'                 => 'g',
            'cost_per_base_unit'   => 0.10,
            'avg_weight_per_piece' => 1.0,
            'is_active'            => true,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 10000.0]
        );

        $this->product = Product::create([
            'name'          => 'California Maki Roll',
            'selling_price' => 180.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->branch->id,
            'is_available'  => true,
            'stock'         => 50,
        ]);

        $this->product->ingredients()->attach($this->ingredient->id, [
            'quantity_required' => 50.0,
            'unit'              => 'g',
        ]);
    }

    /**
     * TEST 1 — SUPER ADMIN SELF-LOCKOUT PROTECTION
     */
    public function test_super_admin_cannot_suspend_or_deactivate_own_account(): void
    {
        $this->actingAs($this->superAdmin);

        $res = $this->postJson("/super-admin/accounts/user/{$this->superAdmin->id}/status", [
            'status' => 'suspended',
            'reason' => 'Testing self-lockout',
        ]);

        $res->assertStatus(422);
        $res->assertJsonFragment(['success' => false]);
        $this->assertStringContainsString('Self-lockout', $res->json('message'));

        $this->superAdmin->refresh();
        $this->assertEquals(User::STATUS_ACTIVE, $this->superAdmin->account_status);
    }

    /**
     * TEST 2 — ACCOUNT STATUS TRANSITION LIFECYCLE (ACTIVE -> SUSPENDED -> RESTORED)
     */
    public function test_super_admin_can_suspend_and_restore_customer_account(): void
    {
        $this->actingAs($this->superAdmin);

        // 1. Suspend Customer
        $resSuspend = $this->postJson("/super-admin/accounts/user/{$this->customer->id}/status", [
            'status' => 'suspended',
            'reason' => 'Repeated fraudulent activity reported on delivery',
        ]);
        $resSuspend->assertStatus(200);

        $this->customer->refresh();
        $this->assertEquals(User::STATUS_SUSPENDED, $this->customer->account_status);
        $this->assertEquals('Repeated fraudulent activity reported on delivery', $this->customer->status_reason);
        $this->assertNotNull($this->customer->suspended_at);

        // Verify audit log
        $auditLog = AuditLog::where('action', 'SECURITY:ACCOUNT_STATUS_CHANGED')
            ->where('target', "user:{$this->customer->id}")
            ->first();
        $this->assertNotNull($auditLog);
        $this->assertEquals('suspended', $auditLog->after_state['new_status']);

        // 2. Restore Customer
        $resRestore = $this->postJson("/super-admin/accounts/user/{$this->customer->id}/restore", [
            'reason' => 'Customer verified legitimate identity with support',
        ]);
        $resRestore->assertStatus(200);

        $this->customer->refresh();
        $this->assertEquals(User::STATUS_ACTIVE, $this->customer->account_status);
        $this->assertNull($this->customer->status_reason);
    }

    /**
     * TEST 3 — SUSPENDED AND DEACTIVATED USERS CANNOT LOGIN (HTTP 403)
     */
    public function test_suspended_user_is_blocked_from_logging_in(): void
    {
        $this->customer->update([
            'account_status' => User::STATUS_SUSPENDED,
            'status_reason'  => 'Account suspended due to policy violation',
        ]);

        // API login attempt
        $res = $this->postJson('/api/v1/login', [
            'email'    => $this->customer->email,
            'password' => 'password123',
        ]);

        $res->assertStatus(403);
        $res->assertJson([
            'account_status' => 'suspended',
            'message'        => 'Your account has been suspended. Please contact MAKI DESU support.',
        ]);
    }

    /**
     * TEST 4 — SUSPENDED CUSTOMER CANNOT PLACE ORDERS (HTTP 403)
     */
    public function test_suspended_customer_cannot_place_order(): void
    {
        $this->customer->update([
            'account_status' => User::STATUS_SUSPENDED,
        ]);

        Sanctum::actingAs($this->customer);

        $res = $this->postJson('/api/v1/orders', [
            'customer_name' => $this->customer->name,
            'mobile_number' => $this->customer->mobile_number,
            'address'       => 'Victoria Plaza Laguna',
            'latitude'      => 14.2310,
            'longitude'     => 121.3280,
            'total_amount'  => 180.00,
            'items'         => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 180.00,
                ]
            ]
        ]);

        $res->assertStatus(403);
        $res->assertJsonFragment(['account_status' => 'suspended']);
    }

    /**
     * TEST 5 — ACTIVE DELIVERY PROTECTION FOR RIDERS
     */
    public function test_rider_with_active_deliveries_triggers_protection_warning(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-ACTIVE-RIDER-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customer->name,
            'contact_number' => $this->customer->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 180.00,
            'status'         => 'in_transit',
        ]);

        Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => $this->customer->name,
            'customer_phone'   => $this->customer->mobile_number,
            'customer_address' => 'Victoria Plaza Laguna',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'in_transit',
        ]);

        $this->actingAs($this->superAdmin);

        // Attempting to suspend without force returns warning
        $res = $this->postJson("/super-admin/accounts/rider/{$this->rider->id}/status", [
            'status' => 'suspended',
            'reason' => 'Customer complaints regarding delivery timing',
        ]);

        $res->assertStatus(422);
        $res->assertJson([
            'success'                 => false,
            'requires_confirmation'   => true,
            'active_deliveries_count' => 1,
        ]);

        // Restrict new deliveries only (keeps in-flight deliveries active)
        $resRestrictNew = $this->postJson("/super-admin/accounts/rider/{$this->rider->id}/status", [
            'status'            => 'restricted',
            'reason'            => 'Block new assignments until active delivery finishes',
            'restrict_new_only' => true,
        ]);
        $resRestrictNew->assertStatus(200);

        $this->rider->refresh();
        $this->assertTrue((bool) $this->rider->is_delivery_restricted);
        $this->assertFalse($this->rider->canAcceptDeliveries());
    }

    /**
     * TEST 6 — ADMIN ACCOUNT FLAGGING CREATES MODERATION CASE
     */
    public function test_admin_can_flag_account_creating_moderation_case(): void
    {
        $this->actingAs($this->adminUser);

        $payload = [
            'target_type'     => 'rider',
            'target_id'       => $this->rider->id,
            'reason_category' => 'suspected_fraud',
            'title'           => 'Suspicious GPS jumping reported',
            'description'     => 'Rider location telemetry showed abrupt 10km jump during active delivery.',
            'evidence_notes'  => 'GPS log coordinates: [14.23, 121.32] to [14.35, 121.45] in 2 seconds.',
            'under_review'    => true,
        ];

        $res = $this->postJson('/accounts/flag', $payload);
        $res->assertStatus(201);
        $res->assertJsonStructure([
            'success',
            'case_number',
            'case' => ['id', 'case_number', 'status'],
        ]);

        $caseNumber = $res->json('case_number');
        $case = ModerationCase::where('case_number', $caseNumber)->first();
        $this->assertNotNull($case);
        $this->assertEquals('open', $case->status);
        $this->assertEquals($this->adminUser->id, $case->reported_by_id);

        // Target rider marked as under_review
        $this->rider->refresh();
        $this->assertEquals(Rider::STATUS_UNDER_REVIEW, $this->rider->account_status);
    }

    /**
     * TEST 7 — SUPER ADMIN CASE RESOLUTION WORKFLOW
     */
    public function test_super_admin_can_resolve_moderation_case_with_sanction(): void
    {
        $case = ModerationCase::create([
            'target_type'     => 'rider',
            'target_id'       => $this->rider->id,
            'reported_by_id'  => $this->adminUser->id,
            'reason_category' => 'cod_abuse',
            'title'           => 'Customer cash collection discrepancy',
            'description'     => 'Customer reported paying PHP 500 but rider claimed COD failure.',
            'status'          => 'open',
        ]);

        $this->actingAs($this->superAdmin);

        $res = $this->postJson("/super-admin/moderation-cases/{$case->id}/resolve", [
            'decision' => 'suspend',
            'notes'    => 'Confirmed fraudulent COD failure claim with cashier receipts and customer statement.',
        ]);

        $res->assertStatus(200);
        $res->assertJson(['success' => true]);

        $case->refresh();
        $this->assertEquals('resolved', $case->status);
        $this->assertEquals('suspend', $case->resolution_decision);
        $this->assertEquals($this->superAdmin->id, $case->resolved_by_id);

        // Target rider updated to suspended
        $this->rider->refresh();
        $this->assertEquals(Rider::STATUS_SUSPENDED, $this->rider->account_status);
    }

    /**
     * TEST 8 — SAFE DELETION BLOCKS HARD DELETION WHEN HISTORICAL RECORDS EXIST
     */
    public function test_safe_deletion_auto_deactivates_user_with_historical_orders(): void
    {
        // Attach an order to customer
        Order::create([
            'order_number'   => 'ORD-HIST-SAFE-DEL',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customer->name,
            'contact_number' => $this->customer->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 180.00,
            'status'         => 'delivered',
        ]);

        $this->actingAs($this->superAdmin);

        $res = $this->deleteJson("/super-admin/accounts/user/{$this->customer->id}", [
            'reason' => 'Customer requested account closure',
        ]);

        $res->assertStatus(200);
        $res->assertJson([
            'success' => true,
            'action'  => 'deactivated',
        ]);

        // Customer still exists in DB, safely marked as deactivated
        $this->assertDatabaseHas('users', [
            'id'             => $this->customer->id,
            'account_status' => User::STATUS_DEACTIVATED,
        ]);
    }
}
