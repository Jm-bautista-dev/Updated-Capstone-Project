<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;

class UserController extends Controller
{
    /**
     * Get authenticated user profile (Split logic for Rider vs Customer)
     * This ensures zero crashes by only accessing columns present in each table.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // RIDER LOGIC (Simple Full Name)
        if ($user instanceof Rider) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $user->id,
                    'name' => $user->name, // Displays as Full Name
                    'email' => $user->email,
                    'role' => 'rider',
                    'mobile_number' => $user->phone ?? '',
                    'profile_photo_path' => $user->profile_photo_path ?? null,
                    'branch_id' => $user->branch_id,
                ]
            ]);
        }

        // CUSTOMER LOGIC (First/Last Names)
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
