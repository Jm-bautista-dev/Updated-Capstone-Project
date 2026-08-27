<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    /**
     * GET /super-admin/settings
     */
    public function index(Request $request): Response
    {
        $settings = SystemSetting::with('updatedBy:id,name,email')
            ->orderBy('group')
            ->orderBy('key')
            ->get();

        return Inertia::render('SuperAdmin/Settings', [
            'settings' => $settings,
        ]);
    }

    /**
     * POST /super-admin/settings/update
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string|exists:system_settings,key',
            'settings.*.value' => 'nullable',
        ]);

        $userId = $request->user()->id;
        $updatedKeys = [];

        foreach ($validated['settings'] as $item) {
            $setting = SystemSetting::where('key', $item['key'])->first();
            if ($setting) {
                $before = $setting->value;
                $setting->update([
                    'value'      => is_array($item['value']) ? json_encode($item['value']) : (string) $item['value'],
                    'updated_by' => $userId,
                ]);
                \Illuminate\Support\Facades\Cache::forget("sys_setting_{$setting->key}");
                $updatedKeys[] = $setting->key;
            }
        }

        AuditLogger::log(
            action: 'system_settings.updated',
            target: 'System Settings',
            afterState: ['keys' => $updatedKeys]
        );

        return response()->json([
            'success' => true,
            'message' => 'System settings updated successfully.',
        ]);
    }
}
