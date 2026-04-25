<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    /**
     * Final, Crash-Proof profile fetch with Branch Join Logic.
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        // 🏪 BRANCH JOIN LOGIC
        $branchName = null;
        if ($user->branch_id) {
            // This finds the Branch name based on the branch_id
            $branchName = DB::table('branches')->where('id', $user->branch_id)->value('name');
        }

        // 🏍️ RIDER LOGIC (Safe & Crash-Proof)
        if ($user->role === 'rider') {
            return response()->json([
                'status' => 'success',
                'data' => [
                    'id'          => $user->id,
                    'name'        => $user->name, // Fullname
                    'email'       => $user->email,
                    'phone'       => $user->phone, // Mobile Number
                    'role'        => 'rider',
                    'branch_id'   => $user->branch_id,
                    'branch_name' => $branchName, // The Name from the branches table
                    'status'      => $user->status ?? 'offline',
                ]
            ]);
        }

        // 👤 CUSTOMER LOGIC
        return response()->json([
            'status' => 'success',
            'data' => [
                'id'            => $user->id,
                'first_name'    => $user->first_name ?? $user->name,
                'last_name'     => $user->last_name ?? '',
                'email'         => $user->email,
                'role'          => 'customer',
                'mobile_number' => $user->mobile_number ?? '',
                'branch_id'     => $user->branch_id,
                'branch_name'   => $branchName,
            ]
        ]);
    }
}
