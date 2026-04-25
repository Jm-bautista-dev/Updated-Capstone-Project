<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;

class UserController extends Controller
{
    /**
     * Optimized profile fetch. 
     * Removes profile picture logic for Riders to prevent crashes.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // RIDER LOGIC (No Profile Picture)
        if ($user instanceof Rider) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => 'rider',
                    'mobile_number' => $user->phone ?? '',
                    'branch_id' => $user->branch_id,
                ]
            ]);
        }

        // CUSTOMER LOGIC (Keep Picture Support)
        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'first_name' => $user->first_name ?? $user->name,
                'last_name' => $user->last_name ?? '',
                'email' => $user->email,
                'role' => 'customer',
                'mobile_number' => $user->mobile_number ?? '',
                'profile_photo_path' => $user->profile_photo_path ?? null,
                'branch_id' => $user->branch_id,
            ]
        ]);
    }
}
