<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rider;
use App\Models\EmailVerification;
use App\Services\SecurityAuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Register a new customer user.
     * POST /api/v1/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'email'         => 'required|email|unique:users,email|max:255',
            'password'      => 'required|string|min:6',
        ]);

        $email = strtolower(trim($validated['email']));

        // Verify OTP was completed for this exact email
        $verified = EmailVerification::where('email', $email)
            ->where('is_verified', true)
            ->first();

        if (!$verified) {
            Log::warning('[AUTH SYSTEM] Registration rejected - Unverified Email', [
                'email' => $email,
                'ip'    => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Email not verified. Please verify your OTP code first.'
            ], 403);
        }

        $user = User::create([
            'first_name'    => $validated['first_name'],
            'last_name'     => $validated['last_name'],
            'name'          => $validated['first_name'] . ' ' . $validated['last_name'],
            'mobile_number' => $validated['mobile_number'],
            'email'         => $email,
            'password'      => Hash::make($validated['password']),
            'role'          => User::ROLE_CUSTOMER,
        ]);

        // Clean up consumed email verification record
        $verified->delete();

        Log::info('[AUTH SYSTEM] Customer Registered Successfully', [
            'user_id' => $user->id,
            'email'   => $email,
            'ip'      => $request->ip(),
        ]);

        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registration successful.',
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ], 201);
    }

    /**
     * Login an existing user (Mobile).
     * POST /api/v1/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $email = strtolower(trim($request->email));

        /** @var User $user */
        $user = User::where('email', $email)->first();

        // Fallback for riders table compatibility
        if (!$user) {
            /** @var Rider $user */
            $user = Rider::where('email', $email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            Log::warning('[AUTH SYSTEM] Failed Login Attempt', [
                'email' => $email,
                'ip'    => $request->ip(),
            ]);

            return response()->json([
                'status'  => 'error',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (method_exists($user, 'isSuspended') && $user->isSuspended()) {
            return response()->json([
                'status'         => 'error',
                'account_status' => 'suspended',
                'message'        => 'Your account has been suspended. Please contact MAKI DESU support.',
            ], 403);
        }

        if (method_exists($user, 'isDeactivated') && $user->isDeactivated()) {
            return response()->json([
                'status'         => 'error',
                'account_status' => 'deactivated',
                'message'        => 'This account is currently inactive. Please contact MAKI DESU support.',
            ], 403);
        }

        if ($user instanceof Rider) {
            $user->update([
                'is_active'      => true,
                'status'         => 'available',
                'last_active_at' => now(),
            ]);
        }

        $token = $user->createToken('mobile-token')->plainTextToken;

        Log::info('[AUTH SYSTEM] Login Successful', [
            'user_id' => $user->id,
            'email'   => $email,
            'role'    => $user->role ?? 'user',
        ]);

        return response()->json([
            'status'               => 'success',
            'message'              => 'Login successful.',
            'token'                => $token,
            'role'                 => $user->role ?? 'user',
            'must_change_password' => (bool) ($user->must_change_password ?? false),
            'user'                 => $this->formatUser($user),
        ]);
    }

    /**
     * Logout (revoke current token).
     * POST /api/v1/logout
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if ($user instanceof Rider) {
                $activeDeliveries = method_exists($user, 'activeDeliveriesCount') ? $user->activeDeliveriesCount() : 0;

                // Set operational presence to offline, but account_status remains ACTIVE
                $user->update([
                    'status'         => 'offline',
                    'is_active'      => false,
                    'last_active_at' => now(),
                ]);

                if ($activeDeliveries > 0) {
                    Log::warning('[RIDER LOGOUT DURING ACTIVE DELIVERY]', [
                        'rider_id'          => $user->id,
                        'rider_name'        => $user->name,
                        'active_deliveries' => $activeDeliveries,
                    ]);
                    SecurityAuditLogger::logSecurityEvent(
                        event: 'RIDER_LOGOUT_ACTIVE_DELIVERY_WARNING',
                        target: "rider:{$user->id}",
                        details: [
                            'rider_id'          => $user->id,
                            'rider_name'        => $user->name,
                            'active_deliveries' => $activeDeliveries,
                            'account_status'    => $user->account_status ?? 'active',
                            'note'              => 'Rider logged out while carrying active delivery. Account status remains active; delivery assignment preserved.',
                        ],
                        level: 'warning'
                    );
                } else {
                    SecurityAuditLogger::logSecurityEvent(
                        event: 'RIDER_LOGOUT',
                        target: "rider:{$user->id}",
                        details: [
                            'rider_id'       => $user->id,
                            'rider_name'     => $user->name,
                            'account_status' => $user->account_status ?? 'active',
                            'result'         => 'NO_ACCOUNT_RESTRICTION',
                        ],
                        level: 'info'
                    );
                }
            }

            if ($user && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }

            return response()->json(['success' => true, 'message' => 'Logged out successfully']);
        } catch (\Exception $e) {
            return response()->json(['success' => true, 'message' => 'Logged out (Force)']);
        }
    }

    /**
     * Get the currently authenticated user.
     * GET /api/v1/user
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'user'    => $this->formatUser($request->user()),
        ]);
    }

    /**
     * Refresh the current token.
     * POST /api/v1/token/refresh
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        
        $user->currentAccessToken()->delete();
        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ]);
    }

    /**
     * Reset user password via verified OTP.
     * POST /api/v1/reset-password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email|exists:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $email = strtolower(trim($request->email));

        $verified = EmailVerification::where('email', $email)
            ->where('is_verified', true)
            ->first();

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'OTP not verified. Please verify your email code first.'
            ], 403);
        }

        User::where('email', $email)
            ->update([
                'password' => Hash::make($request->password)
            ]);

        // Consume verification
        $verified->delete();

        Log::info('[AUTH SYSTEM] Password Reset Successful', ['email' => $email]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successful. You can now login.'
        ]);
    }

    /**
     * Format user data for API response.
     */
    private function formatUser($user): array
    {
        if (!$user) return [];

        return [
            'id'            => $user->id ?? 0,
            'first_name'    => $user->first_name ?? $user->name ?? 'User',
            'last_name'     => $user->last_name ?? '',
            'full_name'     => $user->name ?? ($user->first_name . ' ' . $user->last_name),
            'email'         => $user->email ?? '',
            'mobile_number' => $user->mobile_number ?? $user->phone ?? '',
            'role'          => $user->role ?? ($user instanceof Rider ? 'rider' : 'customer'),
            'branch_id'     => $user->branch_id ?? null,
        ];
    }
}
