<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get authenticated user profile
     * This is the "Crash-Proof" version suggested by the App AI.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated'
            ], 401);
        }

        // This is the "Best Way" because it works even if 
        // columns like 'role' are missing in your database.
        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name ?? ($user->first_name . ' ' . $user->last_name),
                'first_name' => $user->first_name ?? $user->name,
                'last_name' => $user->last_name ?? '',
                'email' => $user->email,
                'mobile_number' => $user->mobile_number ?? $user->contact_number ?? '',
                'role' => $user->role ?? 'customer', // Default to customer if column is missing
                'branch_id' => $user->branch_id ?? null,
            ]
        ]);
    }
}
