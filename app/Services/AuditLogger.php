<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    /**
     * Log a privileged developer/Super Admin action.
     */
    public static function log(
        string $action,
        ?string $target = null,
        ?array $beforeState = null,
        ?array $afterState = null
    ): ?AuditLog {
        try {
            $user = Auth::user();

            return AuditLog::create([
                'actor_id'     => $user?->id,
                'actor_name'   => $user?->name ?? 'System',
                'actor_role'   => $user?->role ?? 'system',
                'action'       => $action,
                'target'       => $target,
                'before_state' => self::sanitize($beforeState),
                'after_state'  => self::sanitize($afterState),
                'ip_address'   => Request::ip(),
                'user_agent'   => Request::userAgent(),
            ]);
        } catch (\Throwable $e) {
            // Fail safely so audit logging never crashes the application
            return null;
        }
    }

    /**
     * Redact sensitive values (passwords, tokens, API keys, secrets) before logging.
     */
    public static function sanitize(?array $data): ?array
    {
        if (empty($data)) {
            return $data;
        }

        $sensitiveKeys = [
            'password', 'password_confirmation', 'secret', 'two_factor_secret',
            'token', 'api_key', 'authorization', 'bearer', 'db_password',
            'super_admin_password', 'credit_card', 'cvv'
        ];

        array_walk_recursive($data, function (&$value, $key) use ($sensitiveKeys) {
            if (is_string($key)) {
                $lowerKey = strtolower($key);
                foreach ($sensitiveKeys as $sensitive) {
                    if (str_contains($lowerKey, $sensitive)) {
                        $value = '[REDACTED]';
                        break;
                    }
                }
            }
        });

        return $data;
    }
}
