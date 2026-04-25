<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * The "Ultimate Crash-Proof" profile fetch.
     * Uses only basic fields and handles missing columns/relationships safely.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // Return only the basic fields that are guaranteed to exist or have safe defaults
        $data = [
            'id'                  => $user->id,
            'name'                => $user->name ?? 'User',
            'email'               => $user->email,
            'role'                => $user->role ?? 'customer',
            'branch_id'           => $user->branch_id ?? null,
            'profile_photo_path'  => $user->profile_photo_path ?? null,
            'profile_picture_url' => ($user->profile_photo_path) 
                ? asset('storage/' . $user->profile_photo_path) 
                : 'https://ui-avatars.com/api/?name=' . urlencode($user->name ?? 'U') . '&color=7F9CF5&background=EBF4FF',
        ];

        return response()->json([
            'status' => 'success',
            'data' => $data
        ]);
    }
}
