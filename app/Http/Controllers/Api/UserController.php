<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Minimalist profile fetch to prevent any possible 500 errors.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name ?? 'User',
                'email' => $user->email,
                'role' => $user->role ?? 'customer',
                'profile_picture_url' => 'https://ui-avatars.com/api/?name=' . urlencode($user->name ?? 'U') . '&color=7F9CF5&background=EBF4FF',
            ]
        ]);
    }
}
