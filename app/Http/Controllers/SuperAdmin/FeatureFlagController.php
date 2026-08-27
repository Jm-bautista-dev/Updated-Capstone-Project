<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\FeatureFlag;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeatureFlagController extends Controller
{
    /**
     * GET /super-admin/features
     */
    public function index(Request $request): Response
    {
        $flags = FeatureFlag::with('updatedBy:id,name,email')
            ->orderBy('key')
            ->get();

        return Inertia::render('SuperAdmin/FeatureFlags', [
            'flags' => $flags,
        ]);
    }

    /**
     * POST /super-admin/features/{id}/toggle
     */
    public function toggle(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'is_enabled' => 'required|boolean',
        ]);

        $flag = FeatureFlag::findOrFail($id);
        $before = ['key' => $flag->key, 'is_enabled' => $flag->is_enabled];

        $flag->update([
            'is_enabled' => $validated['is_enabled'],
            'updated_by' => $request->user()->id,
        ]);

        \Illuminate\Support\Facades\Cache::forget("feature_flag_{$flag->key}");

        $after = ['key' => $flag->key, 'is_enabled' => $validated['is_enabled']];

        AuditLogger::log(
            action: 'feature_flag.toggled',
            target: "Feature Flag: {$flag->name} ({$flag->key})",
            beforeState: $before,
            afterState: $after
        );

        return response()->json([
            'success'    => true,
            'message'    => "Feature '{$flag->name}' " . ($validated['is_enabled'] ? 'enabled' : 'disabled') . '.',
            'is_enabled' => $validated['is_enabled'],
        ]);
    }
}
