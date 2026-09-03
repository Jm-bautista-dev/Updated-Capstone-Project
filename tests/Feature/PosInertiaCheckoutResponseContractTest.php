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

class PosInertiaCheckoutResponseContractTest extends TestCase
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
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
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
            'cashier_id'    => $this->cashier->id,
            'branch_id'     => $this->branch->id,
            'starting_cash' => 1000.00,
            'opened_at'     => now(),
            'status'        => 'open',
        ]);
    }

    /**
     * TEST 1: POS Inertia Request receives a valid Inertia response (Redirect Back with session flash).
     * Must NOT return plain JSON.
     */
    public function test_pos_inertia_request_receives_valid_inertia_redirect_with_flashed_print_job(): void
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
                'X-Inertia' => 'true',
                'X-Requested-With' => 'XMLHttpRequest',
            ])
            ->post('/pos', $payload);

        // Inertia contract: redirect back (302)
        $response->assertStatus(302);
        $response->assertSessionHas('success', 'Order processed successfully');
        $response->assertSessionHas('print_job');

        $printJobData = session('print_job');
        $this->assertNotNull($printJobData);
        $this->assertNotEmpty($printJobData['job_uuid']);
        $this->assertNotEmpty($printJobData['order_number']);
        $this->assertNotEmpty($printJobData['raw_escpos_base64']);

        // Verify database transaction succeeded
        $this->assertDatabaseHas('sales', [
            'branch_id'      => $this->branch->id,
            'user_id'        => $this->cashier->id,
            'total'          => 300.00,
            'paid_amount'    => 500.00,
            'change_amount'  => 200.00,
            'status'         => 'completed',
        ]);
    }

    /**
     * TEST 2: POS Pure API Request (without X-Inertia) receives structured JSON response.
     */
    public function test_pos_api_request_receives_json_response(): void
    {
        $payload = [
            'type'           => 'takeout',
            'items'          => [
                ['id' => $this->product->id, 'quantity' => 1],
            ],
            'total'          => 150.00,
            'payment_method' => 'cash',
            'paid_amount'    => 150.00,
            'change_amount'  => 0.00,
        ];

        $response = $this->actingAs($this->cashier)
            ->withHeaders([
                'Accept' => 'application/json',
            ])
            ->postJson('/pos', $payload);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'message',
            'sale' => [
                'id',
                'order_number',
                'total',
                'items',
            ],
            'print_job' => [
                'id',
                'job_uuid',
                'order_number',
                'raw_escpos_base64',
            ],
        ]);
        $response->assertJson([
            'success' => true,
            'message' => 'Order processed successfully',
        ]);
    }

    /**
     * TEST 3: Validation Error via Inertia returns 302 redirect back with error bag.
     */
    public function test_pos_validation_error_via_inertia_returns_redirect_with_errors(): void
    {
        $response = $this->actingAs($this->cashier)
            ->withHeaders([
                'X-Inertia' => 'true',
            ])
            ->post('/pos', [
                'type' => 'dine-in',
                // missing required fields
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['items', 'payment_method', 'paid_amount']);
    }
}
