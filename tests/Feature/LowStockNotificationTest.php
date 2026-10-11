<?php

namespace Tests\Feature;

use App\Events\LowStockAlert;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\IngredientLog;
use App\Models\Product;
use App\Models\User;
use App\Models\CashierShift;
use App\Services\LowStockAlertService;
use App\Services\SaleService;
use App\Utils\UnitConverter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class LowStockNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $branchMain;
    protected Branch $branchNorth;
    protected User $admin;
    protected User $cashierMain;
    protected User $cashierNorth;
    public Category $testCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branchMain = Branch::create([
            'name' => 'MAKI DESU MAIN',
            'latitude' => 14.5995,
            'longitude' => 120.9842,
            'delivery_radius_km' => 10,
        ]);

        $this->branchNorth = Branch::create([
            'name' => 'MAKI DESU NORTH',
            'latitude' => 14.6500,
            'longitude' => 120.9900,
            'delivery_radius_km' => 10,
        ]);

        $this->testCategory = Category::create([
            'name' => 'Sushi Rolls',
        ]);

        $this->admin = User::factory()->create([
            'name' => 'System Admin',
            'role' => 'admin',
            'must_change_password' => false,
        ]);

        $this->cashierMain = User::factory()->create([
            'name' => 'Cashier Main',
            'role' => 'cashier',
            'branch_id' => $this->branchMain->id,
            'must_change_password' => false,
        ]);

        $this->cashierNorth = User::factory()->create([
            'name' => 'Cashier North',
            'role' => 'cashier',
            'branch_id' => $this->branchNorth->id,
            'must_change_password' => false,
        ]);
    }

    /**
     * Test 1: When an inventory item drops to or below threshold, alert is detected
     * and correctly served via the notifications API with accurate details.
     */
    public function test_low_stock_threshold_generates_alert_with_item_unit_and_branch_details(): void
    {
        Event::fake([LowStockAlert::class]);

        $nori = Ingredient::create([
            'name' => 'Nori Seaweed',
            'unit' => 'pcs',
            'cost_per_base_unit' => 5.00,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $nori->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 10,
            'low_stock_level' => 10, // Stock is at low threshold
            'cost_per_unit'   => 5.00,
        ]);

        $alertService = app(LowStockAlertService::class);
        $log = $alertService->evaluateStockRow($stockRow, $this->cashierMain->id);

        $this->assertNotNull($log);
        $stockRow->refresh();
        $this->assertTrue($stockRow->is_low_stock_notified);
        $this->assertFalse($stockRow->is_out_of_stock_notified);

        Event::assertDispatched(LowStockAlert::class, function ($event) use ($nori) {
            return $event->ingredientName === 'Nori Seaweed'
                && $event->branchId === $this->branchMain->id
                && $event->type === 'low_stock';
        });

        // Cashier of Main branch polls notifications
        $response = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $response->assertOk();

        $notifications = $response->json('notifications');
        $lowStockNotifs = collect($notifications)->where('type', 'low_stock');
        $this->assertCount(1, $lowStockNotifs);

        $item = $lowStockNotifs->first();
        $this->assertEquals('Nori Seaweed', $item['ingredient_name']);
        $this->assertEquals('10 pcs', $item['current_stock']);
        $this->assertEquals('10 pcs', $item['threshold']);
        $this->assertEquals($this->branchMain->id, $item['branch_id']);
        $this->assertEquals('MAKI DESU MAIN', $item['branch_name']);
        $this->assertEquals('/inventory', $item['url']);
    }

    /**
     * Test 2: Strict branch isolation — Cashier in Branch North cannot receive Branch Main alerts,
     * while Admin receives alerts across branches.
     */
    public function test_strict_branch_isolation_for_cashier_and_broad_access_for_admin(): void
    {
        $salmon = Ingredient::create([
            'name' => 'Atlantic Salmon',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.80,
        ]);

        // Branch Main: Salmon drops to 2kg (Threshold: 5kg) -> LOW STOCK in Main
        $stockMain = IngredientStock::updateOrCreate([
            'ingredient_id'   => $salmon->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 2000, // 2kg in base grams
            'low_stock_level' => 5000, // 5kg threshold
            'cost_per_unit'   => 0.80,
        ]);

        // Branch North: Salmon is 20kg (Threshold: 5kg) -> HEALTHY in North
        $stockNorth = IngredientStock::updateOrCreate([
            'ingredient_id'   => $salmon->id,
            'branch_id'       => $this->branchNorth->id,
        ], [
            'stock'           => 20000, // 20kg in base grams
            'low_stock_level' => 5000, // 5kg threshold
            'cost_per_unit'   => 0.80,
        ]);

        $alertService = app(LowStockAlertService::class);
        $alertService->evaluateStockRow($stockMain);
        $alertService->evaluateStockRow($stockNorth);

        // 1. Cashier North polls -> MUST NOT see Branch Main low stock alert
        $northResponse = $this->actingAs($this->cashierNorth)->getJson('/api/v1/notifications');
        $northResponse->assertOk();
        $northAlerts = collect($northResponse->json('notifications'))
            ->where('ingredient_name', 'Atlantic Salmon');
        $this->assertCount(0, $northAlerts, 'Cashier in North branch should not see alerts for Main branch');

        // 2. Cashier Main polls -> MUST see Branch Main alert
        $mainResponse = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $mainResponse->assertOk();
        $mainAlerts = collect($mainResponse->json('notifications'))
            ->where('ingredient_name', 'Atlantic Salmon');
        $this->assertCount(1, $mainAlerts);
        $this->assertEquals($this->branchMain->id, $mainAlerts->first()['branch_id']);

        // 3. Admin polls -> Receives alert for Main branch with correct branch branding
        $adminResponse = $this->actingAs($this->admin)->getJson('/api/v1/notifications');
        $adminResponse->assertOk();
        $adminAlerts = collect($adminResponse->json('notifications'))
            ->where('ingredient_name', 'Atlantic Salmon');
        $this->assertCount(1, $adminAlerts);
        $this->assertEquals('MAKI DESU MAIN', $adminAlerts->first()['branch_name']);
    }

    /**
     * Test 3: Idempotency — While an item remains in the same low stock condition,
     * repeated evaluations and polls do NOT produce duplicate alerts.
     */
    public function test_repeated_evaluations_do_not_produce_duplicate_alerts_while_stock_remains_low(): void
    {
        $rice = Ingredient::create([
            'name' => 'Sushi Rice',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.05,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $rice->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 3000, // 3kg
            'low_stock_level' => 5000, // 5kg
            'cost_per_unit'   => 0.05,
        ]);

        $alertService = app(LowStockAlertService::class);

        // First evaluation: generates log
        $log1 = $alertService->evaluateStockRow($stockRow);
        $this->assertNotNull($log1);

        // Repeated evaluations: idempotent, no duplicate log created
        $stockRow->refresh();
        $log2 = $alertService->evaluateStockRow($stockRow);
        $this->assertNull($log2);

        $stockRow->decrement('stock', 500); // stock drops to 2.5kg (still low stock)
        $stockRow->refresh();
        $log3 = $alertService->evaluateStockRow($stockRow);
        $this->assertNull($log3);

        $totalLogs = IngredientLog::where('ingredient_id', $rice->id)
            ->where('branch_id', $this->branchMain->id)
            ->where('reason', 'like', '%Low Stock%')
            ->count();
        $this->assertEquals(1, $totalLogs, 'Only 1 alert log should exist while condition remains low');

        // Repeated polls return single authoritative alert item
        $response = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $riceAlerts = collect($response->json('notifications'))->where('ingredient_name', 'Sushi Rice');
        $this->assertCount(1, $riceAlerts);
    }

    /**
     * Test 4: Recovery and re-alerting — Raising stock above threshold clears alert flags,
     * and lowering stock again generates a fresh alert.
     */
    public function test_stock_recovery_resets_flags_and_subsequent_drop_triggers_new_alert(): void
    {
        $avocado = Ingredient::create([
            'name' => 'Ripe Avocado',
            'unit' => 'pcs',
            'cost_per_base_unit' => 20.00,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $avocado->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 4,
            'low_stock_level' => 10,
            'cost_per_unit'   => 20.00,
        ]);

        $alertService = app(LowStockAlertService::class);

        // Drop 1: Triggers alert 1
        $log1 = $alertService->evaluateStockRow($stockRow);
        $this->assertNotNull($log1);
        $stockRow->refresh();
        $this->assertTrue($stockRow->is_low_stock_notified);

        // Recovery: Restock to 25 pcs (> 10 pcs)
        $stockRow->update(['stock' => 25]);
        $stockRow->refresh();
        $alertService->evaluateStockRow($stockRow);

        $stockRow->refresh();
        $this->assertFalse($stockRow->is_low_stock_notified, 'Alert flag must be cleared upon recovery');
        $this->assertFalse($stockRow->is_out_of_stock_notified);

        // Drop 2: Stock drops back to 5 pcs (<= 10 pcs)
        $stockRow->update(['stock' => 5]);
        $stockRow->refresh();
        $log2 = $alertService->evaluateStockRow($stockRow);

        $this->assertNotNull($log2, 'Fresh alert must be generated when stock drops again');
        $this->assertNotEquals($log1->id, $log2->id);

        $stockRow->refresh();
        $this->assertTrue($stockRow->is_low_stock_notified);
    }

    /**
     * Test 5: Out of stock (stock <= 0) generates high-severity 'out_of_stock' alert.
     */
    public function test_out_of_stock_item_generates_out_of_stock_severity_alert(): void
    {
        $wasabi = Ingredient::create([
            'name' => 'Fresh Wasabi',
            'unit' => 'g',
            'cost_per_base_unit' => 0.50,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $wasabi->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 0,
            'low_stock_level' => 500,
            'cost_per_unit'   => 0.50,
        ]);

        $alertService = app(LowStockAlertService::class);
        $log = $alertService->evaluateStockRow($stockRow);

        $this->assertNotNull($log);
        $this->assertStringContainsString('Out of Stock Alert', $log->reason);

        $stockRow->refresh();
        $this->assertTrue($stockRow->is_out_of_stock_notified);

        $response = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $response->assertOk();

        $wasabiAlert = collect($response->json('notifications'))->firstWhere('ingredient_name', 'Fresh Wasabi');
        $this->assertNotNull($wasabiAlert);
        $this->assertEquals('out_of_stock', $wasabiAlert['type']);
        $this->assertEquals('0 g', $wasabiAlert['current_stock']);
    }

    /**
     * Test 6: Normal inventory (> threshold) generates no alert.
     */
    public function test_healthy_inventory_does_not_generate_low_stock_alerts(): void
    {
        $ginger = Ingredient::create([
            'name' => 'Pickled Ginger',
            'unit' => 'kg',
            'cost_per_base_unit' => 0.10,
        ]);

        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $ginger->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 10000, // 10kg
            'low_stock_level' => 2000,  // 2kg threshold
            'cost_per_unit'   => 0.10,
        ]);

        $alertService = app(LowStockAlertService::class);
        $log = $alertService->evaluateStockRow($stockRow);

        $this->assertNull($log);

        $response = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $gingerAlert = collect($response->json('notifications'))->firstWhere('ingredient_name', 'Pickled Ginger');
        $this->assertNull($gingerAlert);
    }

    /**
     * Test 7: POS checkout successfully deducts stock and triggers low stock alert
     * without interrupting checkout.
     */
    public function test_pos_checkout_stock_deduction_triggers_low_stock_alert_smoothly(): void
    {
        // 1. Create product and ingredient
        $tuna = Ingredient::create([
            'name' => 'Yellowfin Tuna',
            'unit' => 'g',
            'cost_per_base_unit' => 0.30,
        ]);

        // Branch Main starts with 150g Tuna (Threshold: 100g)
        $stockRow = IngredientStock::updateOrCreate([
            'ingredient_id'   => $tuna->id,
            'branch_id'       => $this->branchMain->id,
        ], [
            'stock'           => 150,
            'low_stock_level' => 100,
            'cost_per_unit'   => 0.30,
        ]);

        $product = Product::create([
            'name'          => 'Spicy Tuna Roll',
            'category_id'   => $this->testCategory->id,
            'selling_price' => 180.00,
            'branch_id'     => $this->branchMain->id,
            'type'          => 'prepared',
            'stock'         => 0,
            'cost_price'    => 30.00,
        ]);

        // Product requires 80g Tuna per roll
        $product->ingredients()->attach($tuna->id, [
            'quantity_required' => 80,
            'unit'              => 'g',
        ]);

        // Open shift for cashier
        CashierShift::create([
            'cashier_id'    => $this->cashierMain->id,
            'branch_id'     => $this->branchMain->id,
            'opening_float' => 1000.00,
            'opened_at'     => now(),
            'status'        => 'open',
        ]);

        // Process POS sale of 1 Spicy Tuna Roll (will deduct 80g Tuna: 150g - 80g = 70g <= 100g threshold)
        $saleService = app(SaleService::class);
        $sale = $this->actingAs($this->cashierMain)->saleServiceProcessSale($saleService, [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 1,
                    'price'      => 180.00,
                    'subtotal'   => 180.00,
                ]
            ],
            'type'           => 'dine-in',
            'payment_method' => 'cash',
            'paid_amount'    => 200.00,
        ]);

        $this->assertNotNull($sale);
        $this->assertEquals(180.00, (float) $sale->total);

        // Verify stock deducted to 70g
        $stockRow->refresh();
        $this->assertEquals(70.0, (float) $stockRow->stock);
        $this->assertTrue($stockRow->is_low_stock_notified);

        // Cashier receives low stock alert
        $response = $this->actingAs($this->cashierMain)->getJson('/api/v1/notifications');
        $response->assertOk();

        $tunaAlert = collect($response->json('notifications'))->firstWhere('ingredient_name', 'Yellowfin Tuna');
        $this->assertNotNull($tunaAlert);
        $this->assertEquals('low_stock', $tunaAlert['type']);
        $this->assertEquals('70 g', $tunaAlert['current_stock']);
        $this->assertEquals('100 g', $tunaAlert['threshold']);
    }

    /**
     * Helper to invoke SaleService::processSale as authenticated user.
     */
    protected function saleServiceProcessSale(SaleService $service, array $data)
    {
        return $service->processSale($data);
    }
}
