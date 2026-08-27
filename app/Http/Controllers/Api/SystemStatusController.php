<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;

class SystemStatusController extends Controller
{
    /**
     * Public, safe system status endpoint for mobile app compatibility and status checks.
     * GET /api/v1/system/status
     */
    public function status(): JsonResponse
    {
        $isMaintenance = (bool) SystemSetting::get('maintenance_mode', false);
        $title         = SystemSetting::get('maintenance_title', 'System Under Maintenance');
        $message       = SystemSetting::get('maintenance_message', 'We are performing scheduled maintenance. Please check back shortly.');
        $eta           = SystemSetting::get('estimated_restoration_time', '30 minutes');
        $appVersion    = SystemSetting::get('app_version', '2.5.0');
        $minSupported  = SystemSetting::get('min_supported_app_version', '1.0.0');

        $statusCode = $isMaintenance ? 503 : 200;

        return response()->json([
            'status'                     => $isMaintenance ? 'maintenance' : 'online',
            'success'                    => !$isMaintenance,
            'maintenance'                => $isMaintenance,
            'maintenance_title'          => $title,
            'maintenance_message'        => $message,
            'estimated_restoration_time' => $eta,
            'application_version'        => $appVersion,
            'min_supported_app_version'  => $minSupported,
            'server_time'                => now()->toIso8601String(),
        ], $statusCode);
    }
}
