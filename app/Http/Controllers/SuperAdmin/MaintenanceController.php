<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends Controller
{
    /**
     * GET /super-admin/maintenance
     */
    public function index(Request $request): Response
    {
        return Inertia::render('SuperAdmin/Maintenance', [
            'maintenance' => [
                'isEnabled'                => (bool) SystemSetting::get('maintenance_mode', false),
                'title'                    => SystemSetting::get('maintenance_title', 'System Under Maintenance'),
                'message'                  => SystemSetting::get('maintenance_message', 'We are performing scheduled maintenance. Please check back shortly.'),
                'estimatedRestorationTime' => SystemSetting::get('estimated_restoration_time', '30 minutes'),
                'lastUpdated'              => SystemSetting::where('key', 'maintenance_mode')->first()?->updated_at?->toIso8601String(),
            ]
        ]);
    }

    /**
     * POST /super-admin/maintenance/toggle
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'enabled'                    => 'required|boolean',
            'title'                      => 'nullable|string|max:255',
            'message'                    => 'nullable|string|max:1000',
            'estimated_restoration_time' => 'nullable|string|max:100',
        ]);

        $before = [
            'maintenance_mode'           => SystemSetting::get('maintenance_mode', false),
            'title'                      => SystemSetting::get('maintenance_title'),
            'message'                    => SystemSetting::get('maintenance_message'),
            'estimated_restoration_time' => SystemSetting::get('estimated_restoration_time'),
        ];

        $userId = $request->user()->id;

        SystemSetting::set('maintenance_mode', $validated['enabled'], 'maintenance', 'boolean', 'Global Maintenance Mode', $userId);
        
        if (!empty($validated['title'])) {
            SystemSetting::set('maintenance_title', $validated['title'], 'maintenance', 'string', 'Maintenance Title', $userId);
        }
        if (!empty($validated['message'])) {
            SystemSetting::set('maintenance_message', $validated['message'], 'maintenance', 'string', 'Maintenance Message', $userId);
        }
        if (!empty($validated['estimated_restoration_time'])) {
            SystemSetting::set('estimated_restoration_time', $validated['estimated_restoration_time'], 'maintenance', 'string', 'Estimated Restoration Time', $userId);
        }

        $after = [
            'maintenance_mode'           => $validated['enabled'],
            'title'                      => $validated['title'] ?? $before['title'],
            'message'                    => $validated['message'] ?? $before['message'],
            'estimated_restoration_time' => $validated['estimated_restoration_time'] ?? $before['estimated_restoration_time'],
        ];

        AuditLogger::log(
            action: $validated['enabled'] ? 'maintenance.enabled' : 'maintenance.disabled',
            target: 'System Maintenance State',
            beforeState: $before,
            afterState: $after
        );

        return response()->json([
            'success'     => true,
            'message'     => $validated['enabled'] ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.',
            'is_enabled'  => $validated['enabled'],
        ]);
    }
}
