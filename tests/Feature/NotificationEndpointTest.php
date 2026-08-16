<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_notifications_endpoint_returns_401(): void
    {
        $response = $this->getJson('/api/v1/notifications');

        $response->assertStatus(401);
    }

    public function test_authenticated_notifications_endpoint_returns_200(): void
    {
        $branch = Branch::create(['name' => 'Test Branch', 'address' => 'Test Address']);
        $user = User::factory()->create([
            'role' => 'admin',
            'branch_id' => $branch->id,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/notifications');

        $response->assertOk()
            ->assertJsonStructure([
                'notifications',
                'unread_count',
            ]);
    }
}
