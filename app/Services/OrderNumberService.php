<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderNumberService
{
    /**
     * Terminal statuses where an order number is eligible for reuse.
     */
    public const TERMINAL_STATUSES = ['delivered', 'cancelled'];

    /**
     * Atomically allocate the smallest available customer order number for a branch.
     *
     * Format: ORD-1, ORD-2, ORD-3, ...
     * Scope: Branch-specific active order pool.
     * Guaranteed: No active order in the branch holds the allocated number simultaneously.
     *
     * @param int|null $branchId
     * @return string
     */
    public function allocateForBranch(?int $branchId): string
    {
        $query = Order::whereNotIn('status', self::TERMINAL_STATUSES);

        if ($branchId) {
            $query->where('branch_id', $branchId);
        } else {
            $query->whereNull('branch_id');
        }

        // Retrieve active numbers under lock within the current transaction
        $activeNumbers = $query->lockForUpdate()->pluck('order_number')->filter()->toArray();

        $usedNumbers = [];
        foreach ($activeNumbers as $numStr) {
            if (preg_match('/^ORD-(\d+)$/i', $numStr, $matches)) {
                $usedNumbers[(int) $matches[1]] = true;
            }
        }

        $candidate = 1;
        while (isset($usedNumbers[$candidate])) {
            $candidate++;
        }

        return 'ORD-' . $candidate;
    }
}
