<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Http\Request;

class IdempotencyService
{
    /**
     * Extract and sanitize the idempotency key from the request.
     */
    public function extractKey(Request $request): ?string
    {
        $key = $request->header('X-Idempotency-Key')
            ?? $request->input('idempotency_key')
            ?? $request->input('request_id');

        if (!$key || !is_string($key)) {
            return null;
        }

        $trimmed = trim($key);
        return strlen($trimmed) > 0 ? substr($trimmed, 0, 64) : null;
    }

    /**
     * Find an existing order created with the given idempotency key for this user or phone.
     */
    public function findExistingOrder(?string $key, ?int $userId = null, ?string $phone = null): ?Order
    {
        if (empty($key)) {
            return null;
        }

        $query = Order::with(['delivery', 'items.product', 'branch'])
            ->where('idempotency_key', $key)
            ->where('created_at', '>=', now()->subHours(24));

        if ($userId) {
            $query->where('user_id', $userId);
        } elseif ($phone) {
            $query->where('contact_number', $phone);
        }

        return $query->first();
    }
}
