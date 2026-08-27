<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class SecurityController extends Controller
{
    /**
     * GET /super-admin/security
     */
    public function index(Request $request): Response
    {
        $superAdminUsers = User::where('role', User::ROLE_SUPER_ADMIN)->get(['id', 'name', 'email', 'updated_at']);

        $recentSecurityLogs = AuditLog::whereIn('action', [
            'super_admin.login',
            'super_admin.failed_login',
            'super_admin.password_changed',
            'maintenance.enabled',
            'maintenance.disabled',
            'security.settings_updated'
        ])
        ->orderBy('created_at', 'desc')
        ->take(15)
        ->get();

        return Inertia::render('SuperAdmin/Security', [
            'superAdmins'        => $superAdminUsers,
            'recentSecurityLogs' => $recentSecurityLogs,
            'securityStats'      => [
                'totalSuperAdmins' => $superAdminUsers->count(),
                'twoFactorEnabled' => $request->user()->two_factor_secret ? true : false,
                'lastPasswordChange' => $request->user()->updated_at?->toIso8601String(),
            ]
        ]);
    }

    /**
     * POST /super-admin/security/password
     * Change Super Admin Password securely.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['current_password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password does not match.',
            ], 422);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        AuditLogger::log(
            action: 'super_admin.password_changed',
            target: "User #{$user->id} ({$user->email})"
        );

        return response()->json([
            'success' => true,
            'message' => 'Super Admin password updated successfully.',
        ]);
    }
}
