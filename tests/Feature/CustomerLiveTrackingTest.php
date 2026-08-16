<?php

use App\Models\Branch;
use App\Models\Delivery;
use App\Models\Order;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

it('requires authentication to access customer tracking endpoint', function () {
    $response = $this->getJson('/api/v1/customer/orders/1/tracking');
    $response->assertStatus(401);
});

it('prevents customer from tracking an order belonging to another customer', function () {
    $customerA = User::factory()->create(['role' => 'customer']);
    $customerB = User::factory()->create(['role' => 'customer']);

    $branch = Branch::create([
        'name' => 'Laguna Branch',
        'address' => 'Victoria Laguna',
        'latitude' => 14.229371,
        'longitude' => 121.328383,
        'delivery_radius_km' => 15,
    ]);

    $order = Order::create([
        'user_id'        => $customerB->id,
        'branch_id'      => $branch->id,
        'customer_name'  => 'Customer B',
        'contact_number' => '09170000002',
        'address'        => 'Calamba Laguna',
        'latitude'       => 14.210000,
        'longitude'      => 121.310000,
        'total_amount'   => 500,
        'status'         => 'in_transit',
    ]);

    $response = $this->actingAs($customerA, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/tracking");

    $response->assertStatus(403)
        ->assertJson([
            'success' => false,
            'message' => 'You are not authorized to track this order.',
        ]);
});

it('allows customer to track their own order and gates live GPS by delivery status', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $branch = Branch::create([
        'name' => 'Laguna Branch',
        'address' => 'Victoria Laguna',
        'latitude' => 14.229371,
        'longitude' => 121.328383,
        'delivery_radius_km' => 15,
    ]);

    $rider = Rider::create([
        'name' => 'Speedy Rider',
        'email' => 'speedy@example.com',
        'password' => 'password',
        'phone' => '09171112233',
        'branch_id' => $branch->id,
        'status' => 'busy',
        'latitude' => 14.231000,
        'longitude' => 121.330000,
        'accuracy' => 5.0,
        'speed' => 30.0,
        'heading' => 90.0,
        'location_updated_at' => now(),
    ]);

    $order = Order::create([
        'user_id'        => $customer->id,
        'branch_id'      => $branch->id,
        'customer_name'  => 'Customer Owner',
        'contact_number' => '09170000001',
        'address'        => 'Victoria Laguna',
        'latitude'       => 14.228000,
        'longitude'      => 121.327000,
        'total_amount'   => 350,
        'status'         => 'preparing',
    ]);

    $delivery = Delivery::create([
        'order_id'         => $order->id,
        'rider_id'         => $rider->id,
        'customer_name'    => 'Customer Owner',
        'customer_phone'   => '09170000001',
        'customer_address' => 'Victoria Laguna',
        'latitude'         => 14.228000,
        'longitude'        => 121.327000,
        'delivery_type'    => 'internal',
        'status'           => 'preparing',
    ]);

    // 1. When PREPARING: Live tracking is not active
    $respPreparing = $this->actingAs($customer, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/tracking");

    $respPreparing->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'order_id'              => $order->id,
                'is_tracking_available' => false,
                'tracking_state'        => 'waiting',
                'rider' => [
                    'latitude'  => null,
                    'longitude' => null,
                ],
            ]
        ]);

    // 2. When IN TRANSIT: Live tracking is ACTIVE with real-time GPS telemetry
    $delivery->update(['status' => 'in_transit']);
    $order->update(['status' => 'in_transit']);

    $respInTransit = $this->actingAs($customer, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/tracking");

    $respInTransit->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'order_id'              => $order->id,
                'is_tracking_available' => true,
                'tracking_state'        => 'active',
                'rider' => [
                    'name'          => 'Speedy Rider',
                    'latitude'      => 14.231000,
                    'longitude'     => 121.330000,
                    'signal_status' => 'live',
                ],
                'realtime' => [
                    'channel' => "private-customer.order.{$order->id}",
                    'event'   => 'rider.location.updated',
                ],
            ]
        ]);

    // 3. When DELIVERED: Live tracking stops and coordinates are stripped
    $delivery->update(['status' => 'delivered']);
    $order->update(['status' => 'delivered']);

    $respDelivered = $this->actingAs($customer, 'sanctum')
        ->getJson("/api/v1/customer/orders/{$order->id}/tracking");

    $respDelivered->assertStatus(200)
        ->assertJson([
            'success' => true,
            'data' => [
                'order_id'              => $order->id,
                'is_tracking_available' => false,
                'tracking_state'        => 'delivered',
                'rider' => [
                    'latitude'  => null,
                    'longitude' => null,
                ],
            ]
        ]);
});
