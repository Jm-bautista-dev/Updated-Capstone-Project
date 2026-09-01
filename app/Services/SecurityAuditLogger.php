<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Request;

class SecurityAuditLogger
{
    /**
     * Log a security or fraud-prevention event safely with sanitized parameters.
     */
    public static function logSecurityEvent(
        string $event,
        ?string $target = null,
        ?array $details = null,
        string $level = 'info'
    ): ?AuditLog {
        try {
            $sanitized = AuditLogger::sanitize($details);

            // 1. Structured application log
            match ($level) {
                'warning' => Log::warning("[SECURITY AUDIT] {$event}", ['target' => $target, 'details' => $sanitized, 'ip' => Request::ip()]),
                'error'   => Log::error("[SECURITY AUDIT] {$event}", ['target' => $target, 'details' => $sanitized, 'ip' => Request::ip()]),
                default   => Log::info("[SECURITY AUDIT] {$event}", ['target' => $target, 'details' => $sanitized, 'ip' => Request::ip()]),
            };

            // 2. AuditLog database record
            return AuditLogger::log(
                action: "SECURITY:{$event}",
                target: $target,
                beforeState: null,
                afterState: $sanitized
            );
        } catch (\Throwable $e) {
            // Fail gracefully so logging never blocks production execution
            return null;
        }
    }
}
