<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PosCashReceivedValidationTest extends TestCase
{
    use RefreshDatabase;

    protected Branch $testBranch;
    protected User $cashier;
    protected Product $ramen;
    protected Ingredient $noodles;
    protected CashierShift $shift;

    protected function setUp(): void
    {
        parent::setUp();

        $this->testBranch = Branch::create([
            'name'                => 'MAKI DESU VICTORIA',
            'address'             => 'Victoria, Laguna',
            'latitude'            => 14.2250,
            'longitude'           => 121.3280,
            'delivery_radius_km'  => 10,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 50.00,
            'per_km_fee'          => 10.00,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->testBranch->id,
        ]);

        $this->noodles = Ingredient::create([
            'name'               => 'Noodles',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.40,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $this->noodles->id, 'branch_id' => $this->testBranch->id],
            [
                'stock'             => 500000,
                'cost_per_unit'     => 0.40,
                'total_stock_value' => 200000,
                'low_stock_level'   => 1000,
            ]
        );

        $category = Category::create(['name' => 'Ramen']);

        $this->ramen = Product::create([
            'name'          => 'Tonkotsu Ramen',
            'sku'           => 'RAM-200',
            'category_id'   => $category->id,
            'selling_price' => 200.00,
            'cost_price'    => 80.00,
            'branch_id'     => $this->testBranch->id,
            'unit'          => 'bowl',
            'stock'         => 1000,
            'status'        => 'available',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $this->ramen->id,
            'ingredient_id'     => $this->noodles->id,
            'quantity_required' => 200,
            'unit'              => 'g',
        ]);

        $this->shift = CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->testBranch->id,
            'opening_balance' => 2000.00,
            'expected_balance'=> 2000.00,
            'total_cash_sales'=> 0.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);
    }

    protected function createPosPayload(mixed $paidAmount, float $quantity = 1.0): array
    {
        return [
            'type'           => 'dine-in',
            'items'          => [
                [
                    'id'       => $this->ramen->id,
                    'quantity' => $quantity,
                ]
            ],
            'payment_method' => 'cash',
            'paid_amount'    => $paidAmount,
        ];
    }

    /**
     * TEST 1: Exact cash amount accepted and change is 0.
     */
    public function test_exact_cash_amount_accepted_with_zero_change(): void
    {
        $payload = $this->createPosPayload(200.00);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', [
            'user_id'       => $this->cashier->id,
            'total'         => 200.00,
            'paid_amount'   => 200.00,
            'change_amount' => 0.00,
        ]);
    }

    /**
     * TEST 2: Cash greater than total calculates correct change amount.
     */
    public function test_greater_cash_amount_calculates_correct_change(): void
    {
        $payload = $this->createPosPayload(500.00);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', [
            'user_id'       => $this->cashier->id,
            'total'         => 200.00,
            'paid_amount'   => 500.00,
            'change_amount' => 300.00,
        ]);
    }

    /**
     * TEST 3: Decimal cash amount calculates accurate decimal change.
     */
    public function test_decimal_cash_amount_calculates_accurate_change(): void
    {
        $payload = $this->createPosPayload(250.75);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', [
            'user_id'       => $this->cashier->id,
            'total'         => 200.00,
            'paid_amount'   => 250.75,
            'change_amount' => 50.75,
        ]);
    }

    /**
     * TEST 4: Cash less than total is rejected with insufficient payment message.
     */
    public function test_cash_less_than_total_is_rejected(): void
    {
        $payload = $this->createPosPayload(150.00);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['error']);
        $error = session('errors')->first('error');
        $this->assertStringContainsString('Insufficient payment', $error);
    }

    /**
     * TEST 5: Zero cash is rejected for order with total > 0.
     */
    public function test_zero_cash_is_rejected(): void
    {
        $payload = $this->createPosPayload(0.00);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['error']);
        $error = session('errors')->first('error');
        $this->assertStringContainsString('Insufficient payment', $error);
    }

    /**
     * TEST 6: Negative cash is rejected cleanly without SQL errors.
     */
    public function test_negative_cash_is_rejected(): void
    {
        $payload = $this->createPosPayload(-50.00);

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['paid_amount']);
        $error = session('errors')->first('paid_amount');
        $this->assertStringContainsString('Cash amount cannot be negative', $error);
    }

    /**
     * TEST 7: Empty cash is rejected cleanly.
     */
    public function test_empty_cash_is_rejected(): void
    {
        $payload = $this->createPosPayload('');

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['paid_amount']);
        $error = session('errors')->first('paid_amount');
        $this->assertStringContainsString('Please enter a valid cash amount', $error);
    }

    /**
     * TEST 8: Non-numeric cash is rejected.
     */
    public function test_non_numeric_cash_is_rejected(): void
    {
        $payload = $this->createPosPayload('five_hundred');

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['paid_amount']);
        $error = session('errors')->first('paid_amount');
        $this->assertStringContainsString('Please enter a valid cash amount', $error);
    }

    /**
     * TEST 9: Malformed decimal with >2 decimal places is rejected.
     */
    public function test_malformed_decimal_with_more_than_two_decimals_is_rejected(): void
    {
        $payload = $this->createPosPayload('200.555');

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['paid_amount']);
        $error = session('errors')->first('paid_amount');
        $this->assertStringContainsString('valid monetary amount with up to 2 decimal places', $error);
    }

    /**
     * TEST 10: Excessively large cash amount exceeding maximum supported precision is rejected.
     */
    public function test_excessively_large_cash_amount_is_rejected(): void
    {
        $payload = $this->createPosPayload('100000000.00'); // 100M exceeds 99,999,999.99

        $response = $this->actingAs($this->cashier)
            ->post('/pos', $payload);

        $response->assertSessionHasErrors(['paid_amount']);
        $error = session('errors')->first('paid_amount');
        $this->assertStringContainsString('cannot exceed ₱99,999,999.99', $error);
        $this->assertStringNotContainsString('SQLSTATE', $error);
    }

    /**
     * TEST 11: Direct API JSON request exceeding maximum limit returns HTTP 422 with clean JSON error.
     */
    public function test_api_json_excessive_cash_returns_422_without_raw_sql(): void
    {
        $payload = $this->createPosPayload('99999999999999999999');

        $response = $this->actingAs($this->cashier)
            ->postJson('/pos', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['paid_amount']);
        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('Numeric value out of range', $response->getContent());
    }

    /**
     * TEST 12: Repeated consecutive checkouts succeed and accurately update shift totals.
     */
    public function test_repeated_checkouts_succeed_and_update_shift_totals(): void
    {
        // 1st order: ₱200 (paid ₱500, change ₱300)
        $this->actingAs($this->cashier)->post('/pos', $this->createPosPayload(500.00))->assertSessionHasNoErrors();

        // 2nd order: ₱200 (paid ₱200, change ₱0)
        $this->actingAs($this->cashier)->post('/pos', $this->createPosPayload(200.00))->assertSessionHasNoErrors();

        // 3rd order: ₱400 (2x ramen, paid ₱1000, change ₱600)
        $this->actingAs($this->cashier)->post('/pos', $this->createPosPayload(1000.00, 2.0))->assertSessionHasNoErrors();

        $this->shift->refresh();
        $this->assertEquals(3, Sale::count());
        $this->assertEquals(800.00, (float) $this->shift->total_cash_sales);
        $this->assertEquals(2800.00, (float) $this->shift->expected_balance);
    }
}
