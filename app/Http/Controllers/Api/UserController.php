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
                'avatar_id'     => $user->avatar_id ?? 1,
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
                    'role'  => 'customer',
                ]
            ]);
        }
    }

    /**
     * Update customer/user personal profile information.
     * PATCH|PUT|POST /api/v1/user
     */
    public function update(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'success' => false, 'message' => 'Unauthenticated'], 401);
            }

            // Check if rider
            $isRider = ($user instanceof Rider) || (isset($user->role) && $user->role === 'rider');

            if ($isRider) {
                $rider = ($user instanceof Rider) ? $user : Rider::where('id', $user->id)->orWhere('email', $user->email)->first();
                if (!$rider) {
                    return response()->json(['status' => 'error', 'success' => false, 'message' => 'Rider record not found'], 404);
                }

                $validated = $request->validate([
                    'name'  => 'sometimes|nullable|string|max:255',
                    'phone' => 'sometimes|nullable|string|max:30',
                ]);

                if (array_key_exists('name', $validated) && filled($validated['name'])) {
                    $rider->name = trim($validated['name']);
                }
                if (array_key_exists('phone', $validated)) {
                    $rider->phone = $validated['phone'] ? trim($validated['phone']) : null;
                }
                $rider->save();

                $branchName = $rider->branch_id ? DB::table('branches')->where('id', $rider->branch_id)->value('name') : null;

                $profile = [
                    'id'          => $rider->id,
                    'name'        => $rider->name,
                    'email'       => $rider->email,
                    'phone'       => $rider->phone,
                    'role'        => 'rider',
                    'branch_id'   => $rider->branch_id,
                    'branch_name' => $branchName,
                    'status'      => $rider->status,
                ];

                return response()->json([
                    'status'  => 'success',
                    'success' => true,
                    'message' => 'Profile updated successfully.',
                    'user'    => $profile,
                    'data'    => $profile,
                ]);
            }

            // Customer / Regular User
            $validated = $request->validate([
                'name'          => 'sometimes|nullable|string|max:255',
                'first_name'    => 'sometimes|nullable|string|max:255',
                'last_name'     => 'sometimes|nullable|string|max:255',
                'phone'         => 'sometimes|nullable|string|max:30',
                'mobile_number' => 'sometimes|nullable|string|max:30',
                'contact_number'=> 'sometimes|nullable|string|max:30',
            ]);

            // Handle name fields
            if (array_key_exists('first_name', $validated) || array_key_exists('last_name', $validated)) {
                if (array_key_exists('first_name', $validated)) {
                    $user->first_name = $validated['first_name'] ? trim($validated['first_name']) : null;
                }
                if (array_key_exists('last_name', $validated)) {
                    $user->last_name = $validated['last_name'] ? trim($validated['last_name']) : null;
                }
                $user->name = trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? ''));
            } elseif (array_key_exists('name', $validated) && filled($validated['name'])) {
                $trimmedName = trim($validated['name']);
                $user->name = $trimmedName;
                // If user didn't have first_name/last_name set, populate them
                $parts = explode(' ', $trimmedName, 2);
                $user->first_name = $parts[0] ?? $trimmedName;
                $user->last_name = $parts[1] ?? '';
            }

            // Handle phone/mobile number
            $phoneInput = $validated['mobile_number'] ?? $validated['phone'] ?? $validated['contact_number'] ?? null;
            if ($phoneInput !== null) {
                $user->mobile_number = trim($phoneInput);
            }

            $user->save();

            $branchId = $user->branch_id ?? null;
            $branchName = $branchId ? DB::table('branches')->where('id', $branchId)->value('name') : null;

            $firstName = $user->first_name ?? ($user->name ?? '');
            $lastName = $user->last_name ?? '';
            $fullName = $user->name ?? trim($firstName . ' ' . $lastName);
            $phone = $user->mobile_number ?? '';

            $userProfile = [
                'id'            => $user->id,
                'first_name'    => $firstName,
                'last_name'     => $lastName,
                'name'          => $fullName,
                'email'         => $user->email ?? '',
                'role'          => $user->role ?? 'customer',
                'mobile_number' => $phone,
                'phone'         => $phone,
                'avatar_id'     => $user->avatar_id ?? 1,
                'branch_id'     => $branchId,
                'branch_name'   => $branchName,
            ];

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Profile updated successfully.',
                'user'    => $userProfile,
                'data'    => $userProfile,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('UserController::update failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Failed to update profile: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update customer/user account password.
     * PATCH|PUT|POST /api/v1/user/password
     */
    public function updatePassword(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'success' => false, 'message' => 'Unauthenticated'], 401);
            }

            $request->validate([
                'current_password' => ['required', 'string'],
                'password'         => ['required', 'string', 'min:8', 'confirmed'],
            ], [
                'current_password.required' => 'Your current password is required.',
                'password.required'         => 'A new password is required.',
                'password.min'              => 'The new password must be at least 8 characters.',
                'password.confirmed'        => 'The password confirmation does not match.',
            ]);

            // Verify current password
            if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'The current password you entered is incorrect.',
                    'errors'  => [
                        'current_password' => ['The current password you entered is incorrect.']
                    ]
                ], 422);
            }

            // Securely hash and update
            $user->password = \Illuminate\Support\Facades\Hash::make($request->password);
            if (isset($user->must_change_password)) {
                $user->must_change_password = false;
            }
            $user->save();

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Password updated successfully.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('UserController::updatePassword failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Failed to update password: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Step 1: Send 6-digit verification code to user's email for account deletion.
     * POST /api/v1/user/delete-otp
     */
    public function requestDeleteOtp(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'success' => false, 'message' => 'Unauthenticated'], 401);
            }

            // Rule 1: Check active orders first before even sending OTP
            $activeOrdersExist = \App\Models\Order::where('user_id', $user->id)
                ->whereIn('status', [
                    'pending', 
                    'confirmed',
                    'accepted', 
                    'preparing', 
                    'ready_for_pickup', 
                    'out_for_delivery', 
                    'in_transit',
                    'picked_up',
                    'customer_arrived',
                    'cancellation_requested'
                ])
                ->exists();

            if ($activeOrdersExist) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'You cannot delete your account while you have active orders. Please wait until your orders are completed or cancelled.'
                ], 422);
            }

            // Generate a 6-digit OTP
            $otp = sprintf("%06d", mt_rand(100000, 999999));

            // Store OTP in cache for 10 minutes
            $cacheKey = 'account_deletion_otp_' . $user->id;
            \Illuminate\Support\Facades\Cache::put($cacheKey, $otp, now()->addMinutes(10));

            // Send Email
            try {
                if ($user->email) {
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(
                        new \App\Mail\DeleteAccountOtpMail($otp, $user->name ?? 'Valued Customer')
                    );
                }
            } catch (\Throwable $mailError) {
                Log::warning('DeleteAccountOtpMail could not be delivered: ' . $mailError->getMessage());
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'A 6-digit verification code has been sent to your email.'
            ], 200);
        } catch (\Throwable $e) {
            Log::error('UserController::requestDeleteOtp failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Failed to send verification code. Please try again.',
            ], 500);
        }
    }

    /**
     * Step 2: Confirm OTP and Permanently Delete Account.
     * DELETE /api/v1/user
     */
    public function destroy(Request $request)
    {
        try {
            $request->validate([
                'otp' => 'required|string|size:6',
            ], [
                'otp.required' => 'The verification code is required.',
                'otp.size'     => 'The verification code must be exactly 6 digits.',
            ]);

            $user = $request->user();

            if (!$user) {
                return response()->json(['status' => 'error', 'success' => false, 'message' => 'Unauthenticated'], 401);
            }

            // Rule 1: Check Active Orders
            $activeOrdersExist = \App\Models\Order::where('user_id', $user->id)
                ->whereIn('status', [
                    'pending', 
                    'confirmed',
                    'accepted', 
                    'preparing', 
                    'ready_for_pickup', 
                    'out_for_delivery', 
                    'in_transit',
                    'picked_up',
                    'customer_arrived',
                    'cancellation_requested'
                ])
                ->exists();

            if ($activeOrdersExist) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'You cannot delete your account while you have active orders. Please wait until your orders are completed or cancelled.'
                ], 422);
            }

            // Rule 2: Verify Email OTP Code
            $cacheKey = 'account_deletion_otp_' . $user->id;
            $storedOtp = \Illuminate\Support\Facades\Cache::get($cacheKey);

            if (!$storedOtp || (string) $storedOtp !== (string) $request->otp) {
                return response()->json([
                    'status'  => 'error',
                    'success' => false,
                    'message' => 'Invalid or expired verification code. Please request a new code.'
                ], 422);
            }

            // Clear OTP from Cache
            \Illuminate\Support\Facades\Cache::forget($cacheKey);

            // Revoke all API Tokens
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }

            // If user is linked to a rider profile, clean up rider or mark offline
            if ($user instanceof \App\Models\Rider) {
                $user->update(['status' => 'offline', 'is_active' => false]);
                $user->delete();
            } else {
                $linkedRider = \App\Models\Rider::where('user_id', $user->id)->first();
                if ($linkedRider) {
                    $linkedRider->update(['status' => 'offline', 'is_active' => false]);
                    $linkedRider->delete();
                }
                $user->delete();
            }

            return response()->json([
                'status'  => 'success',
                'success' => true,
                'message' => 'Your account has been permanently deleted.'
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Validation error',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('UserController::destroy failed', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => 'error',
                'success' => false,
                'message' => 'Failed to delete account: ' . $e->getMessage(),
            ], 500);
        }
    }
}

