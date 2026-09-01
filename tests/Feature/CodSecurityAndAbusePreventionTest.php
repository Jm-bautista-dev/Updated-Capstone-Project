<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\DeliveryAttempt;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\Order;
use App\Models\Product;
use App\Models\Rider;
use App\Models\User;
use App\Services\CodEligibilityService;
use App\Services\CustomerRiskService;
use App\Services\CustomerTrustService;
use App\Services\DeliveryService;
use App\Services\SecurityAuditLogger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CodSecurityAndAbusePreventionTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
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

        $this->customer = User::create([
            'name'              => 'Trustworthy Customer',
            'email'             => 'trust@example.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CUSTOMER,
            'mobile_number'     => '09171234567',
            'phone_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $this->rider = Rider::create([
            'name'      => 'Express Rider',
            'email'     => 'rider@example.com',
            'password'  => Hash::make('password123'),
            'status'    => 'available',
            'branch_id' => $this->branch->id,
            'is_active' => true,
        ]);

        // Create ingredient and stock in canonical base units (grams)
        $this->ingredient = Ingredient::create([
            'name'                   => 'Fresh Salmon',
            'unit'                   => 'g',
            'cost_per_base_unit'     => 0.50,
            'avg_weight_per_piece'   => 1.0,
            'is_active'              => true,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->ingredient->id, 'branch_id' => $this->branch->id],
            ['stock' => 10000.0] // 10,000 grams
        );

        // Create product linked to ingredient (selling price = 150.00)
        $this->product = Product::create([
            'name'          => 'Salmon Roll Special',
            'selling_price' => 150.00,
            'cost_price'    => 60.00,
            'branch_id'     => $this->branch->id,
            'is_available'  => true,
            'stock'         => 20,
        ]);

        $this->product->ingredients()->attach($this->ingredient->id, [
            'quantity_required' => 100.0, // 100g per roll
            'unit'              => 'g',
        ]);
    }

    /**
     * TEST 1 — NORMAL CUSTOMER ALLOWED COD
     */
    public function test_normal_verified_customer_with_clean_history_is_allowed_cod(): void
    {
        Sanctum::actingAs($this->customer);

        $res = $this->getJson('/api/v1/customer/cod-eligibility?amount=450');
        $res->assertStatus(200);
        $res->assertJson([
            'success'      => true,
            'eligible'     => true,
            'cod_eligible' => true,
            'risk_level'   => 'LOW_RISK',
        ]);
    }

    /**
     * TEST 2 — MANIPULATED PRICE SENT BY CLIENT IS REJECTED / SERVER-SIDE PRICE IS ENFORCED
     */
    public function test_manipulated_item_price_is_ignored_and_authoritative_price_is_used(): void
    {
        Sanctum::actingAs($this->customer);

        // Client attempts to claim the ₱150 product costs ₱1.00
        $payload = [
            'customer_name'  => 'Trustworthy Customer',
            'mobile_number'  => '09171234567',
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 2,
                    'price'      => 1.00, // FAKE CLIENT PRICE
                ],
            ],
            'total_amount'   => 2.00, // FAKE TOTAL
        ];

        $res = $this->postJson('/api/v1/orders', $payload);
        $res->assertStatus(201);

        $order = Order::latest()->first();
        // Server price ₱150 * 2 = ₱300 + delivery fee (approx ₱50) = ₱350.00
        $this->assertGreaterThan(300.00, (float) $order->total_amount);
        $this->assertEquals(150.00, (float) $order->items->first()->unit_price);
        $this->assertEquals(300.00, (float) $order->items->first()->line_total);
    }

    /**
     * TEST 3 — MANIPULATED TOTAL IS RECALCULATED SERVER-SIDE
     */
    public function test_manipulated_total_is_strictly_recalculated(): void
    {
        Sanctum::actingAs($this->customer);

        $payload = [
            'customer_name'  => 'Trustworthy Customer',
            'mobile_number'  => '09171234567',
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'   => 0.01, // Client claims total is 1 cent
        ];

        $res = $this->postJson('/api/v1/orders', $payload);
        $res->assertStatus(201);

        $order = Order::latest()->first();
        $this->assertGreaterThanOrEqual(150.00, (float) $order->total_amount);
    }

    /**
     * TEST 4 — IDEMPOTENCY KEY PREVENTS DUPLICATE ORDERS
     */
    public function test_idempotency_key_prevents_duplicate_orders_and_returns_existing_order(): void
    {
        Sanctum::actingAs($this->customer);

        $idempotencyKey = 'unique-req-uuid-999-aaa';
        $payload = [
            'customer_name'  => 'Trustworthy Customer',
            'mobile_number'  => '09171234567',
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'   => 200.00,
        ];

        // 1st request
        $res1 = $this->withHeader('X-Idempotency-Key', $idempotencyKey)
            ->postJson('/api/v1/orders', $payload);
        $res1->assertStatus(201);
        $firstOrderId = $res1->json('order_id');

        $initialOrdersCount = Order::count();

        // 2nd duplicate request with same idempotency key
        $res2 = $this->withHeader('X-Idempotency-Key', $idempotencyKey)
            ->postJson('/api/v1/orders', $payload);
        $res2->assertStatus(200);
        $this->assertTrue($res2->json('is_duplicate'));
        $this->assertEquals($firstOrderId, $res2->json('order_id'));

        // Assert no new order was created in DB
        $this->assertEquals($initialOrdersCount, Order::count());
    }

    /**
     * TEST 5 — CONCURRENCY & STOCK RACE PROTECTION
     */
    public function test_stock_race_protects_inventory_from_going_negative(): void
    {
        // Set exact stock of ingredient to 100.0 g (only 1 product can be made)
        IngredientStock::where('ingredient_id', $this->ingredient->id)->update(['stock' => 100.0]);

        Sanctum::actingAs($this->customer);

        $payload = [
            'customer_name'  => 'Customer A',
            'mobile_number'  => '09171234567',
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'   => 200.00,
        ];

        // First customer orders 1 unit (succeeds)
        $res1 = $this->postJson('/api/v1/orders', $payload);
        $res1->assertStatus(201);

        // Deduct inventory as fulfilled
        IngredientStock::where('ingredient_id', $this->ingredient->id)->update(['stock' => 0.0]);

        // Second customer orders 1 unit (must fail with 422 stock error)
        $res2 = $this->postJson('/api/v1/orders', $payload);
        $res2->assertStatus(422);

        $finalStock = IngredientStock::where('ingredient_id', $this->ingredient->id)->value('stock');
        $this->assertGreaterThanOrEqual(0.0, (float) $finalStock);
    }

    /**
     * TEST 6 — HIGH-RISK / RESTRICTED CUSTOMER HAS COD BLOCKED
     */
    public function test_restricted_customer_is_blocked_from_cod(): void
    {
        $restrictedCustomer = User::create([
            'name'                   => 'Abusive Customer',
            'email'                  => 'abuser@example.com',
            'password'               => Hash::make('password123'),
            'role'                   => User::ROLE_CUSTOMER,
            'mobile_number'          => '09998887777',
            'phone_verified_at'      => now(),
            'cod_restricted'         => true,
            'cod_restriction_reason' => 'Multiple refused deliveries',
            'branch_id'              => $this->branch->id,
        ]);

        Sanctum::actingAs($restrictedCustomer);

        // Check eligibility API
        $resCheck = $this->getJson('/api/v1/customer/cod-eligibility?amount=300');
        $resCheck->assertStatus(200);
        $this->assertFalse($resCheck->json('eligible'));
        $this->assertEquals('RESTRICTED', $resCheck->json('risk_level'));

        // Attempt placing COD order
        $payload = [
            'customer_name'  => 'Abusive Customer',
            'mobile_number'  => '09998887777',
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'   => 200.00,
        ];

        $resOrder = $this->postJson('/api/v1/orders', $payload);
        $resOrder->assertStatus(422);
        $this->assertFalse($resOrder->json('cod_eligible'));
    }

    /**
     * TEST 7 — IDOR / BOLA AUTHORIZATION SECURITY
     */
    public function test_customer_a_cannot_view_or_access_customer_b_order(): void
    {
        $otherCustomer = User::create([
            'name'              => 'Customer B',
            'email'             => 'customerB@example.com',
            'password'          => Hash::make('password123'),
            'role'              => User::ROLE_CUSTOMER,
            'mobile_number'     => '09887766554',
            'phone_verified_at' => now(),
            'branch_id'         => $this->branch->id,
        ]);

        $orderB = Order::create([
            'order_number'   => 'ORD-SECRET-999',
            'user_id'        => $otherCustomer->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => 'Customer B',
            'contact_number' => '09887766554',
            'address'        => 'Private Address B',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 500.00,
            'payment_method' => 'cash',
            'status'         => 'pending',
        ]);

        // Customer A acts as themselves
        Sanctum::actingAs($this->customer);

        // Customer A attempts to fetch Order B via /orders/{id}
        $res1 = $this->getJson("/api/v1/orders/{$orderB->id}");
        $res1->assertStatus(403);

        // Customer A attempts to fetch Order B via /customer/orders/{id}
        $res2 = $this->getJson("/api/v1/customer/orders/{$orderB->id}");
        $res2->assertStatus(404);
    }

    /**
     * TEST 8 — BUSINESS / RIDER DELAYS DO NOT PENALIZE CUSTOMER RISK SCORE
     */
    public function test_business_and_rider_delays_do_not_penalize_customer_risk(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-BIZ-FAIL-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customer->name,
            'contact_number' => $this->customer->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 300.00,
            'payment_method' => 'cash',
            'is_cod'         => true,
            'status'         => 'in_transit',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => $this->customer->name,
            'customer_phone'   => $this->customer->mobile_number,
            'customer_address' => 'Victoria Plaza Laguna',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'in_transit',
        ]);

        $deliveryService = app(DeliveryService::class);

        // Record a failure due to BUSINESS_DELAY (restaurant problem)
        $deliveryService->recordDeliveryAttempt(
            delivery: $delivery,
            status: 'failed',
            failureReason: 'BUSINESS_DELAY',
            latitude: 14.2310,
            longitude: 121.3280,
            notes: 'Kitchen power outage',
            riderId: $this->rider->id
        );

        $riskService = app(CustomerRiskService::class);
        $risk = $riskService->evaluateCustomerRisk($this->customer);

        // Risk MUST remain LOW_RISK
        $this->assertEquals('LOW_RISK', $risk['risk_level']);
        $this->assertEquals(0, $risk['metrics']['customer_attributable_failures']);
        $this->assertEquals(1, $risk['metrics']['business_rider_system_failures']);
    }

    /**
     * TEST 9 — CUSTOMER REFUSAL INCREMENTS RISK LEVEL ACCORDING TO RULES
     */
    public function test_customer_refusal_is_recorded_and_increases_risk(): void
    {
        $deliveryService = app(DeliveryService::class);

        // Create 2 refused deliveries
        for ($i = 1; $i <= 2; $i++) {
            $order = Order::create([
                'order_number'   => "ORD-REFUSED-{$i}",
                'user_id'        => $this->customer->id,
                'branch_id'      => $this->branch->id,
                'customer_name'  => $this->customer->name,
                'contact_number' => $this->customer->mobile_number,
                'address'        => 'Victoria Plaza Laguna',
                'latitude'       => 14.2310,
                'longitude'      => 121.3280,
                'total_amount'   => 300.00,
                'payment_method' => 'cash',
                'is_cod'         => true,
                'status'         => 'in_transit',
            ]);

            $delivery = Delivery::create([
                'order_id'         => $order->id,
                'rider_id'         => $this->rider->id,
                'customer_name'    => $this->customer->name,
                'customer_phone'   => $this->customer->mobile_number,
                'customer_address' => 'Victoria Plaza Laguna',
                'latitude'         => 14.2310,
                'longitude'        => 121.3280,
                'status'           => 'in_transit',
            ]);

            $deliveryService->recordDeliveryAttempt(
                delivery: $delivery,
                status: 'failed',
                failureReason: 'CUSTOMER_REFUSED_ORDER',
                latitude: 14.2310,
                longitude: 121.3280,
                notes: 'Customer changed mind upon delivery',
                riderId: $this->rider->id
            );
        }

        $riskService = app(CustomerRiskService::class);
        $risk = $riskService->evaluateCustomerRisk($this->customer);

        // 2 refusals = HIGH_RISK
        $this->assertEquals('HIGH_RISK', $risk['risk_level']);
        $this->assertEquals(2, $risk['metrics']['customer_refusals']);
    }

    /**
     * TEST 10 — ACTIVE ORDER LIMIT PREVENTS COD SPAMMING
     */
    public function test_customer_cannot_exceed_max_active_orders_limit(): void
    {
        // Create 2 currently active orders in progress for customer
        for ($i = 1; $i <= 2; $i++) {
            Order::create([
                'order_number'   => "ORD-ACTIVE-{$i}",
                'user_id'        => $this->customer->id,
                'branch_id'      => $this->branch->id,
                'customer_name'  => $this->customer->name,
                'contact_number' => $this->customer->mobile_number,
                'address'        => 'Victoria Plaza Laguna',
                'latitude'       => 14.2310,
                'longitude'      => 121.3280,
                'total_amount'   => 250.00,
                'payment_method' => 'cash',
                'is_cod'         => true,
                'status'         => 'preparing',
            ]);
        }

        Sanctum::actingAs($this->customer);

        // Preflight check
        $resCheck = $this->getJson('/api/v1/customer/cod-eligibility?amount=200');
        $resCheck->assertStatus(200);
        $this->assertFalse($resCheck->json('eligible'));
        $this->assertStringContainsString('active delivery order', $resCheck->json('reason'));

        // Attempt placing 3rd order
        $payload = [
            'customer_name'  => $this->customer->name,
            'mobile_number'  => $this->customer->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'payment_method' => 'cash',
            'branch_id'      => $this->branch->id,
            'items'          => [
                [
                    'product_id' => $this->product->id,
                    'quantity'   => 1,
                    'price'      => 150.00,
                ],
            ],
            'total_amount'   => 200.00,
        ];

        $resOrder = $this->postJson('/api/v1/orders', $payload);
        $resOrder->assertStatus(422);
    }

    /**
     * TEST 11 — SECURITY AUDIT LOG REDACTS SENSITIVE CREDENTIALS
     */
    public function test_security_audit_logger_redacts_passwords_and_tokens(): void
    {
        $log = SecurityAuditLogger::logSecurityEvent(
            event: 'SUSPICIOUS_LOGIN_ATTEMPT',
            target: 'user:123',
            details: [
                'email'       => 'test@example.com',
                'password'    => 'SuperSecret123',
                'token'       => '1|abcdef123456',
                'device_name' => 'Pixel 7',
            ],
            level: 'warning'
        );

        $this->assertNotNull($log);
        $this->assertEquals('SECURITY:SUSPICIOUS_LOGIN_ATTEMPT', $log->action);
        $this->assertEquals('[REDACTED]', $log->after_state['password']);
        $this->assertEquals('[REDACTED]', $log->after_state['token']);
        $this->assertEquals('test@example.com', $log->after_state['email']);
    }

    /**
     * TEST 12 — RIDER CAN RECORD DELIVERY ATTEMPT VIA API
     */
    public function test_rider_can_record_delivery_attempt_via_api(): void
    {
        $order = Order::create([
            'order_number'   => 'ORD-RIDER-ATTEMPT-1',
            'user_id'        => $this->customer->id,
            'branch_id'      => $this->branch->id,
            'customer_name'  => $this->customer->name,
            'contact_number' => $this->customer->mobile_number,
            'address'        => 'Victoria Plaza Laguna',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'total_amount'   => 300.00,
            'payment_method' => 'cash',
            'is_cod'         => true,
            'status'         => 'in_transit',
        ]);

        $delivery = Delivery::create([
            'order_id'         => $order->id,
            'rider_id'         => $this->rider->id,
            'customer_name'    => $this->customer->name,
            'customer_phone'   => $this->customer->mobile_number,
            'customer_address' => 'Victoria Plaza Laguna',
            'latitude'         => 14.2310,
            'longitude'        => 121.3280,
            'status'           => 'in_transit',
        ]);

        Sanctum::actingAs($this->rider);

        $res = $this->postJson("/api/v1/rider/deliveries/{$delivery->id}/attempt", [
            'status'         => 'failed',
            'failure_reason' => 'CUSTOMER_UNAVAILABLE',
            'latitude'       => 14.2310,
            'longitude'      => 121.3280,
            'notes'          => 'Gate locked, waited 15 mins, no answer on phone.',
        ]);

        $res->assertStatus(200);
        $this->assertTrue($res->json('success'));
        $this->assertEquals('CUSTOMER_UNAVAILABLE', $res->json('attempt.failure_reason'));
        $this->assertEquals('failed_delivery', $delivery->fresh()->status);
        $this->assertEquals('available', $this->rider->fresh()->status); // Rider freed
    }
}
