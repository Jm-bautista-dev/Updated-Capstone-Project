<?php

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use App\Services\RoutingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function () {
    Cache::flush();
});

it('parses osrm geojson response and returns road-following coordinates', function () {
    Http::fake([
        'router.project-osrm.org/*' => Http::response([
            'code' => 'Ok',
            'routes' => [
                [
                    'geometry' => [
                        'coordinates' => [
                            [121.3283, 14.2293],
                            [121.3290, 14.2300],
                            [121.3300, 14.2310],
                        ],
                        'type' => 'LineString',
                    ],
                    'distance' => 2450.5,
                    'duration' => 360,
                ]
            ],
        ], 200),
    ]);

    $service = new RoutingService();
    $result = $service->getRoute(14.2293, 121.3283, 14.2310, 121.3300);

    expect($result['success'])->toBeTrue();
    expect($result['provider'])->toBe('osrm');
    expect($result['distance_km'])->toBe(2.45);
    expect($result['duration_minutes'])->toBe(6);
    expect($result['coordinates'])->toHaveCount(3);
    // Verify Leaflet [lat, lng] format
    expect($result['coordinates'][0])->toBe([14.2293, 121.3283]);
    expect($result['coordinates'][2])->toBe([14.2310, 121.3300]);
});

it('handles provider failure with graceful linear fallback without crashing', function () {
    Http::fake([
        '*' => Http::response(null, 500),
    ]);

    $service = new RoutingService();
    $result = $service->getRoute(14.2500, 121.3500, 14.2600, 121.3600);

    expect($result['success'])->toBeFalse();
    expect($result['is_fallback'])->toBeTrue();
    expect($result['provider'])->toBe('fallback_linear');
    expect($result['coordinates'])->toHaveCount(2);
    expect($result['coordinates'][0])->toBe([14.2500, 121.3500]);
    expect($result['coordinates'][1])->toBe([14.2600, 121.3600]);
});

it('requires authentication to access customer route endpoint', function () {
    $response = $this->getJson('/api/v1/customer/orders/1/route');
    $response->assertStatus(401);
});

it('prevents customer from accessing route of another customer', function () {
    $customerA = User::factory()->create(['role' => 'customer']);
    $customerB = User::factory()->create(['role' => 'customer']);

    $branch = Branch::create([
        'name'               => 'Laguna Hub',
        'address'            => 'Victoria Laguna',
        'latitude'           => 14.229371,
        'longitude'          => 121.328383,
        'delivery_radius_km' => 15,
    ]);

    $order = Order::create([
        'user_id'        => $customerA->id,
        'branch_id'      => $branch->id,
        'customer_name'  => 'Customer A',
        'contact_number' => '09170000001',
        'address'        => 'Victoria Town Center',
        'latitude'       => 14.2300,
        'longitude'      => 121.3300,
        'total_amount'   => 450,
        'status'         => 'in_transit',
    ]);

    $response = $this->actingAs($customerB, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/route");

    $response->assertStatus(403);
});

it('allows customer to access road route of own active order', function () {
    Http::fake([
        'router.project-osrm.org/*' => Http::response([
            'code' => 'Ok',
            'routes' => [
                [
                    'geometry' => [
                        'coordinates' => [
                            [121.3283, 14.2293],
                            [121.3300, 14.2310],
                        ],
                        'type' => 'LineString',
                    ],
                    'distance' => 1200.0,
                    'duration' => 180,
                ]
            ],
        ], 200),
    ]);

    $branch = Branch::create([
        'name'               => 'Laguna Hub',
        'address'            => 'Victoria Laguna',
        'latitude'           => 14.229371,
        'longitude'          => 121.328383,
        'delivery_radius_km' => 15,
    ]);

    $customer = User::factory()->create(['role' => 'customer']);

    $rider = Rider::create([
        'name'               => 'Rider Marco',
        'email'              => 'rider_marco@test.com',
        'password'           => bcrypt('password'),
        'phone'              => '09180000001',
        'vehicle_type'       => 'motorcycle',
        'plate_number'       => 'ABC-1234',
        'branch_id'          => $branch->id,
        'latitude'           => 14.2293,
        'longitude'          => 121.3283,
        'accuracy'           => 5.0,
        'is_active'          => true,
        'status'             => 'busy',
        'last_location_time' => now(),
    ]);

    $order = Order::create([
        'user_id'        => $customer->id,
        'branch_id'      => $branch->id,
        'customer_name'  => 'Customer Juan',
        'contact_number' => '09170000003',
        'address'        => 'Victoria Laguna',
        'latitude'       => 14.2310,
        'longitude'      => 121.3300,
        'total_amount'   => 750,
        'status'         => 'in_transit',
    ]);

    $delivery = Delivery::create([
        'order_id'         => $order->id,
        'rider_id'         => $rider->id,
        'delivery_type'    => 'internal',
        'status'           => 'in_transit',
        'customer_name'    => 'Customer Juan',
        'customer_phone'   => '09170000003',
        'customer_address' => 'Victoria Laguna',
        'latitude'         => 14.2310,
        'longitude'        => 121.3300,
        'tracking_number'  => 'TRK-ROUTE-001',
        'order_number'     => $order->order_number ?? "ORD-{$order->id}",
    ]);

    $response = $this->actingAs($customer, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/route");

    $response->assertStatus(200)
        ->assertJson([
            'success'  => true,
            'order_id' => $order->id,
            'status'   => 'in_transit',
            'rider'    => [
                'id' => $rider->id,
            ],
            'destination' => [
                'latitude'  => 14.2310,
                'longitude' => 121.3300,
            ],
            'route' => [
                'success'  => true,
                'provider' => 'osrm',
            ],
        ]);
});

it('allows admin to query road route for any active delivery', function () {
    Http::fake([
        'router.project-osrm.org/*' => Http::response([
            'code' => 'Ok',
            'routes' => [
                [
                    'geometry' => [
                        'coordinates' => [
                            [121.3283, 14.2293],
                            [121.3300, 14.2310],
                        ],
                        'type' => 'LineString',
                    ],
                    'distance' => 1200.0,
                    'duration' => 180,
                ]
            ],
        ], 200),
    ]);

    $admin = User::factory()->create(['role' => 'admin']);
    $branch = Branch::create([
        'name'               => 'Admin Hub',
        'address'            => 'Victoria Laguna',
        'latitude'           => 14.229371,
        'longitude'          => 121.328383,
        'delivery_radius_km' => 15,
    ]);

    $rider = Rider::create([
        'name'               => 'Rider Admin Fleet',
        'email'              => 'rider_admin_fleet@test.com',
        'password'           => bcrypt('password'),
        'phone'              => '09180000002',
        'vehicle_type'       => 'motorcycle',
        'plate_number'       => 'XYZ-9876',
        'branch_id'          => $branch->id,
        'latitude'           => 14.2293,
        'longitude'          => 121.3283,
        'accuracy'           => 6.0,
        'is_active'          => true,
        'status'             => 'busy',
        'last_location_time' => now(),
    ]);

    $delivery = Delivery::create([
        'rider_id'         => $rider->id,
        'delivery_type'    => 'internal',
        'status'           => 'in_transit',
        'customer_name'    => 'Admin Customer',
        'customer_phone'   => '09170000099',
        'customer_address' => 'Victoria Laguna',
        'latitude'         => 14.2310,
        'longitude'        => 121.3300,
        'tracking_number'  => 'TRK-ROUTE-ADMIN-001',
        'order_number'     => 'ORD-ADMIN-001',
    ]);

    $response = $this->actingAs($admin)
        ->getJson("/deliveries/{$delivery->id}/route");

    $response->assertStatus(200)
        ->assertJson([
            'success'     => true,
            'delivery_id' => $delivery->id,
            'status'      => 'in_transit',
            'route' => [
                'success'     => true,
                'coordinates' => [
                    [14.2293, 121.3283],
                    [14.2310, 121.3300],
                ],
            ],
        ]);
});
