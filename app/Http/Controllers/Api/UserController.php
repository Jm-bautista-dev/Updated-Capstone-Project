<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Final, Professional Profile Fetch.
     * Includes Branch Name and safe fallbacks for both Rider and Customer dashboards.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // Load branch name safely without needing complex relationships
        $branchName = null;
        if ($user->branch_id) {
            $branchName = DB::table('branches')->where('id', $user->branch_id)->value('name');
        }

        // RIDER LOGIC
        if ($user->role === 'rider' || $user instanceof Rider) {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id'                 => $user->id,
                    'name'               => $user->name,
                    'email'              => $user->email,
                    'role'               => 'rider',
                    'phone'              => $user->phone ?? '', // Using 'phone' from riders table
                    'branch_id'          => $user->branch_id,
                    'branch_name'        => $branchName, // Sending Branch Name to the App
                    'status'             => $user->status ?? 'offline',
                ]
            ]);
        }

        // CUSTOMER LOGIC
        return response()->json([
            'status' => 'success',
            'data' => [
                'id'                 => $user->id,
                'first_name'         => $user->first_name ?? $user->name,
                'last_name'          => $user->last_name ?? '',
                'email'              => $user->email,
                'role'               => 'customer',
                'mobile_number'      => $user->mobile_number ?? '',
                'profile_photo_path' => $user->profile_photo_path ?? null,
                'branch_id'          => $user->branch_id,
                'branch_name'        => $branchName,
            ]
        ]);
    }
}
