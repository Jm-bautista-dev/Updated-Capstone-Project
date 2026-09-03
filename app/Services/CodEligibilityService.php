<?php

namespace App\Services;

use App\Models\User;

class CodEligibilityService
{
    protected CustomerRiskService $riskService;

    public function __construct(CustomerRiskService $riskService)
    {
        $this->riskService = $riskService;
    }

    /**
     * Determine whether COD is available for a customer order.
     *
     * @param User|int|null $userOrId Authenticated user or null for guest
     * @param float $orderAmount Total order amount (items + delivery fee)
     * @param string|null $phone Mobile number
     * @return array { eligible: bool, risk_level: string, requires_verification: bool, max_cod_amount: float, reason: string }
     */
    public function checkEligibility($userOrId, float $orderAmount = 0.0, ?string $phone = null): array
    {
        if (!config('cod_security.enabled', true)) {
            return [
                'eligible'              => true,
                'risk_level'            => 'LOW_RISK',
                'requires_verification' => false,
                'max_cod_amount'        => 10000.00,
                'reason'                => 'Cash on Delivery is available.',
            ];
        }

        $user = $userOrId instanceof User ? $userOrId : ($userOrId ? User::find((int) $userOrId) : null);
        $userPhone = $user?->mobile_number ?? $phone;

        // 1. Evaluate customer risk & metrics
        $riskData = $this->riskService->evaluateCustomerRisk($user ?? 0, $userPhone);
        $riskLevel = $riskData['risk_level'];
        $metrics = $riskData['metrics'];

        // 2. Active Order Limits Check
        $maxActive = config('cod_security.max_active_orders_per_customer', 2);
        if ($metrics['active_orders_count'] >= $maxActive) {
            return [
                'eligible'              => false,
                'risk_level'            => $riskLevel,
                'requires_verification' => false,
                'max_cod_amount'        => 0.0,
                'reason'                => "You already have {$metrics['active_orders_count']} active delivery order(s) in progress. Please wait for them to arrive before placing a new COD order.",
            ];
        }

        // 3. Phone Verification Check (if required by policy)
        $requirePhone = config('cod_security.require_verified_phone_for_cod', true);
        $hasPhone = ($user && ($user->isPhoneVerified() || !empty($user->mobile_number))) || !empty($userPhone);

        if ($requirePhone && !$hasPhone) {
            return [
                'eligible'              => false,
                'risk_level'            => $riskLevel,
                'requires_verification' => true,
                'max_cod_amount'        => 0.0,
                'reason'                => 'Please add and verify your mobile number before placing a Cash on Delivery order.',
            ];
        }

        // 4. RESTRICTED Risk Level
        if ($riskLevel === 'RESTRICTED') {
            $reason = !empty($riskData['reason'])
                ? $riskData['reason']
                : 'Cash on Delivery is unavailable for this account. Please select an online payment method.';
            if (!empty($riskData['restriction_expires_at'])) {
                $expiresFormatted = \Illuminate\Support\Carbon::parse($riskData['restriction_expires_at'])->toFormattedDateString();
                $reason .= " (Temporary restriction until {$expiresFormatted})";
            }
            return [
                'eligible'               => false,
                'risk_level'             => 'RESTRICTED',
                'requires_verification'  => false,
                'max_cod_amount'         => 0.0,
                'reason'                 => $reason,
                'restriction_source'     => $riskData['restriction_source'] ?? null,
                'restriction_expires_at' => $riskData['restriction_expires_at'] ?? null,
            ];
        }

        // 5. HIGH_RISK Level
        if ($riskLevel === 'HIGH_RISK') {
            $highMax = (float) config('cod_security.max_cod_amount.HIGH_RISK', 500.00);
            if ($highMax <= 0 || ($orderAmount > 0 && $orderAmount > $highMax)) {
                return [
                    'eligible'              => false,
                    'risk_level'            => 'HIGH_RISK',
                    'requires_verification' => true,
                    'max_cod_amount'        => $highMax,
                    'reason'                => $highMax > 0
                        ? "Cash on Delivery for this account is limited to ₱" . number_format($highMax, 2) . ". Please use online payment for this order total."
                        : 'Cash on Delivery is temporarily unavailable for this account. Please use online payment.',
                ];
            }
        }

        // 6. MEDIUM_RISK Level
        if ($riskLevel === 'MEDIUM_RISK') {
            $mediumMax = (float) config('cod_security.max_cod_amount.MEDIUM_RISK', 1500.00);
            if ($orderAmount > 0 && $orderAmount > $mediumMax) {
                return [
                    'eligible'              => false,
                    'risk_level'            => 'MEDIUM_RISK',
                    'requires_verification' => false,
                    'max_cod_amount'        => $mediumMax,
                    'reason'                => "Cash on Delivery for this account is limited to ₱" . number_format($mediumMax, 2) . ". Please use online payment for this order total.",
                ];
            }
        }

        // 7. LOW_RISK Level
        $lowMax = (float) config('cod_security.max_cod_amount.LOW_RISK', 5000.00);
        if ($orderAmount > 0 && $orderAmount > $lowMax) {
            return [
                'eligible'              => false,
                'risk_level'            => 'LOW_RISK',
                'requires_verification' => false,
                'max_cod_amount'        => $lowMax,
                'reason'                => "Cash on Delivery limit of ₱" . number_format($lowMax, 2) . " exceeded. Please use online payment.",
            ];
        }

        // ELIGIBLE
        return [
            'eligible'              => true,
            'risk_level'            => $riskLevel,
            'requires_verification' => false,
            'max_cod_amount'        => match ($riskLevel) {
                'HIGH_RISK'   => (float) config('cod_security.max_cod_amount.HIGH_RISK', 500.00),
                'MEDIUM_RISK' => (float) config('cod_security.max_cod_amount.MEDIUM_RISK', 1500.00),
                default       => (float) config('cod_security.max_cod_amount.LOW_RISK', 5000.00),
            },
            'reason'                => 'Cash on Delivery is available.',
        ];
    }
}
