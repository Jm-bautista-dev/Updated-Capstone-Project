<?php

use App\Models\Branch;
use App\Models\Rider;
use App\Models\Sale;
use App\Models\User;
use App\Services\DeliveryService;

it('recommends internal delivery when branch has available riders within radius', function () {
    $branch = Branch::create([
        'name' => 'Central Hub',
        'address' => 'Test Address',
        'latitude' => 14.5995,
        'longitude' => 120.9842,
        'delivery_radius_km' => 10,
        'has_internal_riders' => true,
        'base_delivery_fee' => 49.00,
        'per_km_fee' => 15.00,
    ]);

    Rider::create([
        'name' => 'Rider One',
        'phone' => '+639171234567',
        'branch_id' => $branch->id,
        'status' => 'available',
    ]);

    $service = app(DeliveryService::class);
    $recommendation = $service->recommend($branch, 3.0);

    expect($recommendation['type'])->toBe('internal');
    expect($recommendation['available_riders'])->toBe(1);
    expect($recommendation['fee'])->toBe(64.00);
    expect($recommendation['recommended_rider'])->not->toBeNull();
});

it('locks selected rider and marks them busy when creating internal delivery', function () {
    $branch = Branch::create([
        'name' => 'Central Hub',
        'address' => 'Test Address',
        'latitude' => 14.5995,
        'longitude' => 120.9842,
        'delivery_radius_km' => 10,
        'has_internal_riders' => true,
        'base_delivery_fee' => 49.00,
        'per_km_fee' => 15.00,
    ]);

    $user = User::factory()->create(['branch_id' => $branch->id]);
    $this->actingAs($user);

    $rider = Rider::create([
        'name' => 'Rider Lock',
        'phone' => '+639171234568',
        'branch_id' => $branch->id,
        'status' => 'available',
    ]);

    $sale = Sale::create([
        'order_number' => 'TEST-001',
        'user_id' => $user->id,
        'branch_id' => $branch->id,
        'type' => 'delivery',
        'total' => 100,
        'cost_total' => 50,
        'profit' => 50,
        'paid_amount' => 100,
        'change_amount' => 0,
        'payment_method' => 'cash',
        'status' => 'completed',
    ]);

    $service = app(DeliveryService::class);
    $delivery = $service->createDelivery([
        'sale_id' => $sale->id,
        'delivery_type' => 'internal',
        'customer_name' => 'Test Customer',
        'customer_phone' => '+639171234567',
        'customer_address' => '123 Test St',
        'distance_km' => 4.0,
        'delivery_fee' => 79.00,
        'rider_id' => $rider->id,
    ]);

    expect($delivery->isInternal())->toBeTrue();
    expect($delivery->rider_id)->toBe($rider->id);
    expect($rider->fresh()->status)->toBe('busy');
});
