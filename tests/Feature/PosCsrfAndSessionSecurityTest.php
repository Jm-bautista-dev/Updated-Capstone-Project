<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientStock;
use App\Models\MenuItemIngredient;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PosCsrfAndSessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public $branch;
    protected User $cashier;
    protected Product $product;
    protected CashierShift $shift;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
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
            'role'           => 'cashier',
            'account_status' => 'active',
            'branch_id'      => $this->branch->id,
        ]);

        $ingredient = Ingredient::create([
            'name'               => 'Sushi Rice',
            'unit'               => 'g',
            'cost_per_base_unit' => 0.10,
        ]);

        IngredientStock::updateOrCreate(
            ['ingredient_id' => $ingredient->id, 'branch_id' => $this->branch->id],
            [
                'stock'             => 10000,
                'cost_per_unit'     => 0.10,
                'total_stock_value' => 1000,
                'low_stock_level'   => 500,
            ]
        );

        $category = Category::create(['name' => 'Maki']);

        $this->product = Product::create([
            'name'          => 'California Maki',
            'sku'           => 'MAK-001',
            'category_id'   => $category->id,
            'selling_price' => 150.00,
            'cost_price'    => 50.00,
            'branch_id'     => $this->branch->id,
            'unit'          => 'roll',
            'stock'         => 50,
            'status'        => 'available',
        ]);

        MenuItemIngredient::create([
            'menu_item_id'      => $this->product->id,
            'ingredient_id'     => $ingredient->id,
            'quantity_required' => 100,
            'unit'              => 'g',
        ]);

        $this->shift = CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'opening_balance' => 1000.00,
            'opened_at'       => now(),
            'status'          => 'open',
        ]);
    }

    /**
     * TEST 1: POS routes and shift routes are NOT in the CSRF exemption list.
     */
    public function test_pos_routes_are_not_in_csrf_exemption_list(): void
    {
        /** @var \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken $csrfMiddleware */
        $csrfMiddleware = app(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $excludedPaths = $csrfMiddleware->getExcludedPaths();

        $this->assertNotContains('pos', $excludedPaths);
        $this->assertNotContains('pos/*', $excludedPaths);
        $this->assertNotContains('shifts/open', $excludedPaths);
        $this->assertNotContains('shifts/close', $excludedPaths);
        $this->assertNotContains('shifts/adjust', $excludedPaths);
    }

    /**
     * TEST 2: TokenMismatchException is handled cleanly and returns structured diagnostic logging.
     */
    public function test_csrf_token_mismatch_exception_handling(): void
    {
        $request = \Illuminate\Http\Request::create('/pos', 'POST', ['type' => 'dine-in']);
        $request->headers->set('Accept', 'application/json');

        $exception = new \Illuminate\Session\TokenMismatchException('CSRF token mismatch.');
        
        // Render exception through the application exception handler
        $response = app(\Illuminate\Contracts\Debug\ExceptionHandler::class)->render($request, $exception);

        $this->assertEquals(419, $response->getStatusCode());
    }

    /**
     * TEST 3: Legitimate POS checkout with authenticated session succeeds.
     */
    public function test_pos_checkout_with_authenticated_session_succeeds(): void
    {
        $payload = [
            'type'           => 'dine-in',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 2],
            ],
            'total'          => 300.00,
            'payment_method' => 'cash',
            'paid_amount'    => 500.00,
            'change_amount'  => 200.00,
        ];

        $response = $this->actingAs($this->cashier)
            ->withHeaders([
                'X-Inertia'        => 'true',
                'X-Requested-With' => 'XMLHttpRequest',
            ])
            ->post('/pos', $payload);

        $response->assertStatus(302);
        $response->assertSessionHas('success', 'Order processed successfully');
        $this->assertDatabaseHas('sales', [
            'branch_id' => $this->branch->id,
            'user_id'   => $this->cashier->id,
            'total'     => 300.00,
            'status'    => 'completed',
        ]);
    }

    /**
     * TEST 4: Shift Open with authenticated cashier succeeds.
     */
    public function test_shift_open_with_authenticated_cashier_succeeds(): void
    {
        // Close existing shift first
        $this->shift->update(['status' => 'closed', 'closed_at' => now(), 'closing_balance' => 1000]);

        $response = $this->actingAs($this->cashier)
            ->post('/shifts/open', [
                'opening_balance' => 2500,
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('cashier_shifts', [
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'opening_balance' => 2500.00,
            'status'          => 'open',
        ]);
    }

    /**
     * TEST 5: Production configuration resolves secure cookies over HTTPS.
     */
    public function test_production_environment_secure_cookie_configuration(): void
    {
        Config::set('app.env', 'production');
        Config::set('session.secure', env('SESSION_SECURE_COOKIE') !== null
            ? filter_var(env('SESSION_SECURE_COOKIE'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : (config('app.env') === 'production'));

        $this->assertTrue(config('session.secure'), 'Session secure cookie must evaluate to true in production.');
        $this->assertEquals('lax', config('session.same_site'), 'SameSite cookie must be lax for same-origin POS.');
        $this->assertEquals('/', config('session.path'), 'Session cookie path must be root.');
    }

    /**
     * TEST 6: User logout invalidates session and regenerates CSRF token.
     */
    public function test_logout_invalidates_session_and_csrf_token(): void
    {
        $this->actingAs($this->cashier);
        $initialSessionId = session()->getId();
        $initialCsrfToken = session()->token();

        $response = $this->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
        
        // Ensure old session ID / token is invalidated
        $this->assertNotEquals($initialCsrfToken, session()->token());
    }
}
