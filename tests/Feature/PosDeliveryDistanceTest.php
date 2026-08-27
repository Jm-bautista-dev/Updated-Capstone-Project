<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Product;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PosDeliveryDistanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected Rider $riderAvailable;
    protected Rider $riderBusy;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->branch = Branch::create([
            'name'                => 'Victoria Branch',
            'address'             => 'Poblacion, Victoria, Laguna',
            'latitude'            => 14.2307,
            'longitude'           => 121.3283,
            'delivery_radius_km'  => 15.0,
            'has_internal_riders' => true,
            'base_delivery_fee'   => 49.00,
            'per_km_fee'          => 15.00,
        ]);

        $this->cashier = User::factory()->create([
            'role'      => 'cashier',
            'branch_id' => $this->branch->id,
        ]);

        \App\Models\CashierShift::create([
            'cashier_id'      => $this->cashier->id,
            'branch_id'       => $this->branch->id,
            'status'          => 'open',
            'opening_balance' => 2000.00,
            'opened_at'       => now(),
        ]);

        $this->riderAvailable = Rider::create([
            'branch_id' => $this->branch->id,
            'name'      => 'Juan Dela Cruz',
            'email'     => 'juan.rider@example.com',
            'password'  => bcrypt('password123'),
            'phone'     => '09171234567',
            'is_active' => true,
            'status'    => 'available',
        ]);

        $this->riderBusy = Rider::create([
            'branch_id' => $this->branch->id,
            'name'      => 'Pedro Santos',
            'email'     => 'pedro.rider@example.com',
            'password'  => bcrypt('password123'),
            'phone'     => '09181234567',
            'is_active' => true,
            'status'    => 'busy',
        ]);

        $category = Category::create([
            'name' => 'Maki Rolls',
            'slug' => 'maki-rolls',
        ]);

        $this->product = Product::create([
            'category_id'   => $category->id,
            'branch_id'     => $this->branch->id,
            'name'          => 'California Maki',
            'sku'           => 'MAK-CAL-01',
            'selling_price' => 180.00,
            'stock'         => 50,
        ]);
    }

    public function test_calculate_delivery_distance_with_geocoding_and_osrm(): void
    {
        // Mock Nominatim geocoder and OSRM router
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([
                [
                    'lat'          => '14.2400',
                    'lon'          => '121.3400',
                    'display_name' => 'Barangay San Roque, Victoria, Laguna, Philippines',
                ]
            ], 200),
            'router.project-osrm.org/*' => Http::response([
                'code'   => 'Ok',
                'routes' => [
                    [
                        'distance' => 4800, // 4.8 km
                        'duration' => 720,  // 12 min
                        'geometry' => [
                            'coordinates' => [
                                [121.3283, 14.2307],
                                [121.3340, 14.2350],
                                [121.3400, 14.2400],
                            ]
                        ]
                    ]
                ]
            ], 200),
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/pos/calculate-delivery-distance', [
                'address'   => 'San Roque, Victoria, Laguna',
                'branch_id' => $this->branch->id,
            ]);

        $response->assertOk();
        $response->assertJson([
            'success'     => true,
            'distance_km' => 4.8,
        ]);

        // Branch base fee = 49 (first 1km free), per km = 15
        // 4.8 - 1.0 = 3.8 km * 15 = 57 + 49 = 106
        $data = $response->json();
        $this->assertEquals(106.00, (float) $data['delivery_fee']);
        $this->assertNotEmpty($data['route_coordinates']);
        $this->assertStringContainsString('min', $data['duration_text']);
    }

    public function test_calculate_delivery_distance_fails_for_invalid_address(): void
    {
        Http::fake([
            'nominatim.openstreetmap.org/*' => Http::response([], 200),
        ]);

        $response = $this->actingAs($this->cashier)
            ->postJson('/api/pos/calculate-delivery-distance', [
                'address'   => 'NonExistentPlaceZzzz12345',
                'branch_id' => $this->branch->id,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
        ]);
    }

    public function test_pos_store_delivery_with_preassigned_rider(): void
    {
        $response = $this->actingAs($this->cashier)
            ->post('/pos', [
                'type'           => 'delivery',
                'items'          => [
                    [
                        'id'       => $this->product->id,
                        'quantity' => 2,
                    ]
                ],
                'total'          => 466.00, // 360 products + 106 delivery fee
                'payment_method' => 'cash',
                'paid_amount'    => 500.00,
                'change_amount'  => 34.00,
                'delivery_info'  => [
                    'customer_name'    => 'Maria Santos',
                    'customer_phone'   => '09123456789',
                    'customer_address' => 'Barangay San Roque, Victoria, Laguna',
                    'delivery_type'    => 'internal',
                    'rider_id'         => $this->riderAvailable->id,
                    'distance_km'      => 4.8,
                    'delivery_fee'     => 106.00,
                ]
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('deliveries', [
            'rider_id'         => $this->riderAvailable->id,
            'customer_name'    => 'Maria Santos',
            'customer_address' => 'Barangay San Roque, Victoria, Laguna',
            'status'           => 'assigned_to_rider',
        ]);
    }
}
