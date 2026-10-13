<?php

namespace App\Services;

use App\Models\IngredientBatch;
use App\Models\Ingredient;
use App\Models\IngredientLog;
use App\Models\SystemSetting;
use App\Utils\UnitConverter;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ExpirationAlertService
{
    /**
     * Get the default warning window in days.
     */
    public function getDefaultWarningDays(): int
    {
        return (int) SystemSetting::get('inventory_expiry_warning_days', 7);
    }

    /**
     * Set the default warning window in days (Admin only).
     */
    public function setDefaultWarningDays(int $days, ?int $userId = null): void
    {
        SystemSetting::set(
            'inventory_expiry_warning_days',
            $days,
            'inventory',
            'integer',
            'Number of days before expiration to trigger expiring-soon alerts',
            $userId
        );
    }

    /**
     * Scan and retrieve active expiration alerts for a branch or all branches.
     */
    public function getActiveAlerts(?int $branchId = null): array
    {
        $now = Carbon::now(config('app.timezone', 'Asia/Manila'));
        $defaultWarningDays = $this->getDefaultWarningDays();

        $query = IngredientBatch::with(['ingredient', 'branch'])
            ->where('current_quantity', '>', 0)
            ->whereNull('deleted_at');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        /** @var \Illuminate\Database\Eloquent\Collection<int, \App\Models\IngredientBatch> $batches */
        $batches = $query->get();

        $expired = [];
        $expiringToday = [];
        $expiringSoon = [];
        $quarantined = [];
        $missingExpiry = [];

        /** @var \App\Models\IngredientBatch $batch */
        foreach ($batches as $batch) {
            $ingredient = $batch->ingredient;
            if (!$ingredient) {
                continue;
            }

            $displayUnit = strtolower(trim($ingredient->unit));
            $displayQty = UnitConverter::convertFromBaseQuantity((float) $batch->current_quantity, $displayUnit);

            $batchSummary = [
                'batch_id'             => $batch->id,
                'batch_code'           => $batch->batch_code,
                'lot_number'           => $batch->lot_number ?: 'N/A',
                'ingredient_id'        => $ingredient->id,
                'ingredient_name'      => $ingredient->name,
                'branch_id'            => $batch->branch_id,
                'branch_name'          => $batch->branch?->name ?? "Branch #{$batch->branch_id}",
                'current_quantity'     => $displayQty,
                'current_quantity_base'=> (float) $batch->current_quantity,
                'unit'                 => $displayUnit,
                'expiration_date'      => $batch->expiration_date ? $batch->expiration_date->toIso8601String() : null,
                'expiration_date_formatted' => $batch->expiration_date ? $batch->expiration_date->format('M d, Y') : null,
                'days_remaining'       => $batch->days_until_expiration,
                'status'               => $batch->status,
                'notes'                => $batch->notes,
            ];

            // 1. Quarantined
            if ($batch->status === 'quarantined') {
                $quarantined[] = array_merge($batchSummary, [
                    'severity' => 'warning',
                    'message'  => "Batch {$batch->batch_code} ({$ingredient->name}) is quarantined and excluded from sales.",
                ]);
                continue;
            }

            // 2. Missing expiration when tracking is required
            if ($ingredient->requires_expiration_tracking && !$batch->expiration_date && !$batch->is_legacy) {
                $missingExpiry[] = array_merge($batchSummary, [
                    'severity' => 'info',
                    'message'  => "Batch {$batch->batch_code} ({$ingredient->name}) requires expiration tracking but has no expiration date set.",
                ]);
            }

            // 3. Expiration checks
            if ($batch->expiration_date) {
                if ($batch->isExpired($now)) {
                    $expired[] = array_merge($batchSummary, [
                        'severity' => 'critical',
                        'message'  => "Batch {$batch->batch_code} ({$ingredient->name}) expired on {$batch->expiration_date->format('M d, Y')}. Immediate disposal required.",
                    ]);
                } elseif ($batch->isExpiringToday($now)) {
                    $expiringToday[] = array_merge($batchSummary, [
                        'severity' => 'high',
                        'message'  => "Batch {$batch->batch_code} ({$ingredient->name}) expires today! Priority FEFO consumption required.",
                    ]);
                } else {
                    $warningWindow = $ingredient->expiry_warning_days ?: $defaultWarningDays;
                    if ($batch->isExpiringSoon($warningWindow, $now)) {
                        $days = $batch->days_until_expiration;
                        $expiringSoon[] = array_merge($batchSummary, [
                            'severity' => 'medium',
                            'message'  => "Batch {$batch->batch_code} ({$ingredient->name}) expires in {$days} days ({$batch->expiration_date->format('M d, Y')}).",
                        ]);
                    }
                }
            }
        }

        return [
            'summary' => [
                'expired_count'        => count($expired),
                'expiring_today_count' => count($expiringToday),
                'expiring_soon_count'  => count($expiringSoon),
                'quarantined_count'    => count($quarantined),
                'missing_expiry_count' => count($missingExpiry),
                'total_alerts'         => count($expired) + count($expiringToday) + count($expiringSoon) + count($quarantined) + count($missingExpiry),
            ],
            'expired'        => $expired,
            'expiring_today' => $expiringToday,
            'expiring_soon'  => $expiringSoon,
            'quarantined'    => $quarantined,
            'missing_expiry' => $missingExpiry,
        ];
    }

    /**
     * Dispatch idempotent notifications for critical expiration events without flooding logs.
     * Uses cache deduplication per batch and state.
     */
    public function syncExpirationAlertNotifications(?int $branchId = null): void
    {
        $alerts = $this->getActiveAlerts($branchId);

        // Deduplicated alert logging for expired batches
        foreach ($alerts['expired'] as $item) {
            $cacheKey = "batch_exp_notif_{$item['batch_id']}_expired";
            if (!Cache::has($cacheKey)) {
                IngredientLog::create([
                    'ingredient_id' => $item['ingredient_id'],
                    'user_id'       => Auth::id() ?: 1,
                    'branch_id'     => $item['branch_id'],
                    'change_qty'    => 0,
                    'reason'        => "FEFO Alert: Batch {$item['batch_code']} has expired on {$item['expiration_date_formatted']}.",
                ]);
                Cache::put($cacheKey, true, now()->addHours(24));
            }
        }
    }
}
