<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RiderController extends Controller
{
    /**
     * Update the rider's operational status.
     * PATCH /api/v1/rider/status
     */
    public function updateStatus(Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:available,busy,offline',
        ]);

        $user = $request->user();

        // Ensure the authenticated user is actually a Rider instance
        if (!$user instanceof Rider) {
            return response()->json([
                'success' => false,
                'message' => 'Only riders can update operational status.'
            ], 403);
        }

        $user->update([
            'status' => $request->status,
            'last_active_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated to ' . $request->status,
            'status' => $user->status,
        ]);
    }

    /**
     * Heartbeat/Ping to update last_active_at.
     * POST /api/v1/rider/ping
     */
    public function ping(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user instanceof Rider) {
            return response()->json(['success' => false], 403);
        }

        $user->update(['last_active_at' => now()]);

        return response()->json([
            'success' => true,
            'status' => $user->status,
            'last_active_at' => $user->last_active_at,
        ]);
    }
}
