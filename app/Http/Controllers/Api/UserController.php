<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;

class UserController extends Controller
{
    /**
     * Get authenticated user profile (Unified for Customer and Rider)
     * GET /api/v1/user
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthenticated'
                ], 401);
            }

            // We only return columns that exist in your database safely
            $data = [
                'id'            => $user->id,
                'first_name'    => $user->first_name ?? $user->name ?? 'User',
                'last_name'     => $user->last_name ?? '',
                'name'          => $user->name ?? ($user->first_name . ' ' . $user->last_name),
                'email'         => $user->email,
                'mobile_number' => $user->mobile_number ?? $user->phone ?? '',
                'role'          => $user->role ?? ($user instanceof Rider ? 'rider' : 'customer'),
                'branch_id'     => $user->branch_id ?? null,
            ];

            return response()->json([
                'status' => 'success',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Server Error: ' . $e->getMessage(),
                'debug' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }
}
