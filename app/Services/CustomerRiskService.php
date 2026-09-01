<?php

namespace App\Services;

use App\Models\User;

class CustomerRiskService
{
    protected CustomerTrustService $trustService;

    public function __construct(CustomerTrustService $trustService)
    {
        $this->trustService = $trustService;
    }

    /**
     * Determine the risk level of a customer.
     * Returns: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK' | 'RESTRICTED'
     */
    public function evaluateCustomerRisk(User|int $userOrId, ?string $fallbackPhone = null): array
    {
        $user = $userOrId instanceof User ? $userOrId : User::find((int) $userOrId);
        $metrics = $this->trustService->getCustomerMetrics($user ?? $userOrId, $fallbackPhone);

        // 1. Check explicit manual restrictions
        if ($user && $user->isCodRestricted()) {
            return [
                'risk_level' => 'RESTRICTED',
                'is_restricted' => true,
                'score' => 100,
                'reason' => $user->cod_restriction_reason ?: 'Account COD privileges have been restricted by administration.',
                'metrics' => $metrics,
            ];
        }

        // 2. Check explicit manual risk level override
        if ($user && !empty($user->risk_level_override)) {
            return [
                'risk_level' => strtoupper($user->risk_level_override),
                'is_restricted' => strtoupper($user->risk_level_override) === 'RESTRICTED',
                'score' => match (strtoupper($user->risk_level_override)) {
                    'RESTRICTED' => 100,
                    'HIGH_RISK' => 75,
                    'MEDIUM_RISK' => 45,
                    default => 10,
                },
                'reason' => 'Administrative risk level assignment.',
                'metrics' => $metrics,
            ];
        }

        $thresholds = config('cod_security.risk_thresholds', []);
        $refusals = $metrics['customer_refusals'];
        $failures = $metrics['customer_attributable_failures'];
        $totalOrders = $metrics['total_orders'];
        $failedCodOrders = $metrics['failed_cod_orders'];
        $consecutiveSuccess = $metrics['consecutive_successful_orders'];

        $riskLevel = 'LOW_RISK';
        $reasons = [];

        // Evaluate refusals (most severe customer-attributable signal)
        if ($refusals >= ($thresholds['restricted_refusals'] ?? 3)) {
            $riskLevel = 'RESTRICTED';
            $reasons[] = "Account has {$refusals} repeated delivery refusals.";
        } elseif ($refusals >= ($thresholds['high_risk_refusals'] ?? 2)) {
            $riskLevel = 'HIGH_RISK';
            $reasons[] = "Account has {$refusals} customer delivery refusals.";
        } elseif ($refusals >= ($thresholds['medium_risk_refusals'] ?? 1)) {
            $riskLevel = 'MEDIUM_RISK';
            $reasons[] = "Account has 1 recorded delivery refusal.";
        }

        // Evaluate cumulative customer-attributable failed events
        if ($riskLevel !== 'RESTRICTED') {
            if ($failures >= ($thresholds['restricted_failed_events'] ?? 6)) {
                $riskLevel = 'RESTRICTED';
                $reasons[] = "Account has {$failures} repeated delivery failure events.";
            } elseif ($failures >= ($thresholds['high_risk_failed_events'] ?? 4) && $riskLevel !== 'HIGH_RISK') {
                $riskLevel = 'HIGH_RISK';
                $reasons[] = "Account has {$failures} delivery failure events.";
            } elseif ($failures >= ($thresholds['medium_risk_failed_events'] ?? 2) && $riskLevel === 'LOW_RISK') {
                $riskLevel = 'MEDIUM_RISK';
                $reasons[] = "Account has {$failures} delivery failure events.";
            }
        }

        // Evaluate Failed COD Ratio (for accounts with at least 3 orders)
        $minOrders = $thresholds['minimum_orders_for_ratio'] ?? 3;
        $failedRatioThreshold = $thresholds['high_risk_failed_ratio'] ?? 0.40;

        if ($totalOrders >= $minOrders && $riskLevel === 'LOW_RISK') {
            $ratio = $failedCodOrders / max(1, $totalOrders);
            if ($ratio >= $failedRatioThreshold) {
                $riskLevel = 'MEDIUM_RISK';
                $reasons[] = 'Elevated proportion of uncompleted COD deliveries.';
            }
        }

        // Trust Restoration: Consecutive successful deliveries can lower risk
        $restoreThreshold = config('cod_security.trust_restoration.consecutive_successful_to_demote', 3);
        if ($consecutiveSuccess >= $restoreThreshold && $refusals < 3) {
            if ($riskLevel === 'HIGH_RISK') {
                $riskLevel = 'MEDIUM_RISK';
                $reasons[] = "Risk demoted to MEDIUM due to {$consecutiveSuccess} consecutive successful deliveries.";
            } elseif ($riskLevel === 'MEDIUM_RISK') {
                $riskLevel = 'LOW_RISK';
                $reasons[] = "Risk restored to LOW due to {$consecutiveSuccess} consecutive successful deliveries.";
            }
        }

        $score = match ($riskLevel) {
            'RESTRICTED'  => 100,
            'HIGH_RISK'   => 75,
            'MEDIUM_RISK' => 45,
            default       => 10,
        };

        return [
            'risk_level'    => $riskLevel,
            'is_restricted' => $riskLevel === 'RESTRICTED',
            'score'         => $score,
            'reasons'       => $reasons,
            'metrics'       => $metrics,
        ];
    }
}
