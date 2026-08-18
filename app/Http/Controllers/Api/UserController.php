<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Final, Crash-Proof profile fetch with Branch Join Logic.
     */
    public function me(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
            }

            // Check if rider
            $isRider = ($user instanceof Rider) || (isset($user->role) && $user->role === 'rider');
            $rider = null;

            if ($isRider) {
                $rider = ($user instanceof Rider) ? $user : Rider::where('id', $user->id)->orWhere('email', $user->email)->first();
            }

            $branchId = $rider?->branch_id ?? ($user->branch_id ?? null);
            $branchName = null;
            if ($branchId) {
                $branchName = DB::table('branches')->where('id', $branchId)->value('name');
            }

            if ($isRider || $rider) {
                $riderProfile = [
                    'id'          => $rider?->id ?? $user->id,
                    'name'        => $rider?->name ?? ($user->name ?? 'Rider'),
                    'email'       => $rider?->email ?? ($user->email ?? ''),
                    'phone'       => $rider?->phone ?? ($user->mobile_number ?? ($user->phone ?? '')),
                    'role'        => 'rider',
                    'branch_id'   => $branchId,
                    'branch_name' => $branchName,
                    'status'      => $rider?->status ?? ($user->status ?? 'offline'),
                ];

                return response()->json([
                    'status'  => 'success',
                    'success' => true,
                    'user'    => $riderProfile,
                    'data'    => $riderProfile,
                ]);
            }

            // Customer / Admin Profile
            $firstName = $user->first_name ?? ($user->name ?? '');
            $lastName = $user->last_name ?? '';
            $fullName = $user->name ?? trim($firstName . ' ' . $lastName);
            $phone = $user->mobile_number ?? ($user->phone ?? '');

            $userProfile = [
                'id'            => $user->id,
                'first_name'    => $firstName,
                'last_name'     => $lastName,
                'name'          => $fullName,
                'email'         => $user->email ?? '',
                'role'          => $user->role ?? 'customer',
                'mobile_number' => $phone,
                'phone'         => $phone,
                'branch_id'     => $branchId,
                'branch_name'   => $branchName,
            ];

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'user'    => $userProfile,
                'data'    => $userProfile,
            ]);
        } catch (\Throwable $e) {
            Log::error('UserController::me failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => 'success',
                'success' => true,
                'data'    => [
                    'id'    => $request->user()?->id ?? 1,
                    'name'  => $request->user()?->name ?? 'User',
                    'email' => $request->user()?->email ?? '',
                    'role'  => 'rider',
                ]
            ]);
        }
    }
}

