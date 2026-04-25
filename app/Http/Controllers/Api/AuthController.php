<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Rider;
use App\Models\EmailVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new mobile user.
     * POST /api/v1/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name'    => 'required|string|max:255',
            'last_name'     => 'required|string|max:255',
            'mobile_number' => 'required|string|max:20',
            'email'         => 'required|email|unique:users,email',
            'password'      => 'required|string|min:6',
        ]);

        // Verify OTP
        $verified = EmailVerification::where('email', $validated['email'])
            ->where('is_verified', true)
            ->first();

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email not verified. Please verify your OTP first.'
            ], 403);
        }

        $user = User::create([
            'first_name'    => $validated['first_name'],
            'last_name'     => $validated['last_name'],
            'name'          => $validated['first_name'] . ' ' . $validated['last_name'],
            'mobile_number' => $validated['mobile_number'],
            'email'         => $validated['email'],
            'password'      => Hash::make($validated['password']),
            'role'          => User::ROLE_CUSTOMER,
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
     * 
     * Handles both standard users and riders via the unified users table.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        /** @var User $user */
        $user = User::where('email', $request->email)->first();

        // If not found in users, check riders table (fallback for backward compatibility if data exists)
        if (!$user) {
            /** @var Rider $user */
            $user = Rider::where('email', $request->email)->first();
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Check if account is active
        if (isset($user->is_active) && !$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'Your account has been deactivated.',
            ], 403);
        }

        // ONE TOKEN SYSTEM: Optional: Clear existing tokens for single session
        // $user->tokens()->delete();

        $token = $user->createToken('mobile-token')->plainTextToken;

        // Auto-set status for Riders on Login
        if ($user instanceof Rider || (isset($user->role) && $user->role === 'rider')) {
            if ($user instanceof Rider) {
                $user->update(['status' => 'available', 'last_active_at' => now()]);
            }
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Login successful.',
            'token'   => $token,
            'role'    => $user->role ?? 'user',
            'user'    => $this->formatUser($user),
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
            if ($user && $user->currentAccessToken()) {
                $user->currentAccessToken()->delete();
            }
            return response()->json(['success' => true, 'message' => 'Logged out']);
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
     * Refresh the current token (revoke old and issue new).
     * POST /api/v1/token/refresh
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // Revoke the current token
        $user->currentAccessToken()->delete();

        // Create a new one
        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'token'   => $token,
            'user'    => $this->formatUser($user),
        ]);
    }

    /**
     * Reset user password.
     * POST /api/v1/reset-password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $verified = EmailVerification::where('email', $request->email)
            ->where('is_verified', true)
            ->first();

        if (!$verified) {
            return response()->json([
                'success' => false,
                'message' => 'OTP not verified. Please verify your email first.'
            ], 403);
        }

        User::where('email', $request->email)
            ->update([
                'password' => Hash::make($request->password)
            ]);

        // Consume verification
        $verified->delete();

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
