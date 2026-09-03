<?php

namespace App\Services;

use App\Models\ModerationCase;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountGovernanceService
{
    /**
     * Lift any active restriction (Automatic or Manual) from a User or Rider account.
     * Enforces Super Admin authorization, clears restriction flags, resets consecutive streaks to 0,
     * and records an immutable security audit trail.
     */
    public function liftRestriction(User|Rider $target, string $reason, User $actor): array
    {
        // 1. Authorization: Only Super Admin can lift account restrictions
        if (!$actor->isSuperAdmin()) {
            throw new \RuntimeException('Unauthorized: Only Super Admins can remove account restrictions.');
        }

        // 2. Privilege hierarchy check
        if ($target instanceof User && $target->isSuperAdmin() && (int) $target->id !== (int) $actor->id && !$actor->isSuperAdmin()) {
            throw new \RuntimeException('Unauthorized: Only Super Admins can manage Super Admin accounts.');
        }

        $prevStatus = $target->account_status ?? User::STATUS_ACTIVE;
        $prevReason = $target->status_reason ?? $target->restriction_reason ?? null;
        $prevSource = $target->restriction_source ?? 'MANUAL';
        $prevStreak = $target instanceof User ? (int) $target->consecutive_cancellations : (int) $target->consecutive_delivery_failures;
        $targetType = $target instanceof Rider ? 'rider' : 'user';

        return DB::transaction(function () use ($target, $targetType, $prevStatus, $prevReason, $prevSource, $prevStreak, $reason, $actor) {
            // Lift restriction and reset consecutive streak
            $target->liftAccountRestriction($actor, $reason);

            // If target is a rider, broadcast updated status
            if ($target instanceof Rider) {
                try {
                    broadcast(new \App\Events\RiderStatusUpdated($target->fresh()));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast error on liftRestriction: ' . $e->getMessage());
                }
            }

            // Record security audit log
            SecurityAuditLogger::logSecurityEvent(
                event: 'RESTRICTION_REMOVED',
                target: "{$targetType}:{$target->id}",
                details: [
                    'actor_id'                 => $actor->id,
                    'actor_name'               => $actor->name,
                    'actor_role'               => $actor->role,
                    'target_id'                => $target->id,
                    'target_type'              => $targetType,
                    'target_name'              => $target->name,
                    'target_email'             => $target->email,
                    'previous_status'          => $prevStatus,
                    'previous_reason'          => $prevReason,
                    'previous_source'          => $prevSource,
                    'previous_streak'          => $prevStreak,
                    'reason'                   => $reason,
                    'consecutive_streak_reset' => 0,
                ],
                level: 'info'
            );

            return [
                'success'         => true,
                'target'          => $target->fresh(),
                'previous_status' => $prevStatus,
                'new_status'      => User::STATUS_ACTIVE,
                'message'         => "Restriction lifted successfully for {$target->name}. Consecutive streak reset to 0.",
            ];
        });
    }

    /**
     * Manually restrict a User or Rider account by Super Admin.
     */
    public function restrictAccount(User|Rider $target, string $reason, User $actor, array $options = []): array
    {
        // 1. Authorization: Only Super Admin can manually restrict accounts
        if (!$actor->isSuperAdmin()) {
            throw new \RuntimeException('Unauthorized: Only Super Admins can manually restrict accounts.');
        }

        // 2. Self-lockout check
        if ($actor instanceof User && $target instanceof User && (int) $actor->id === (int) $target->id) {
            throw new \RuntimeException('Self-lockout protection: You cannot restrict your own account.');
        }

        if (empty(trim($reason))) {
            throw new \InvalidArgumentException('A mandatory reason is required to restrict an account.');
        }

        $prevStatus = $target->account_status ?? User::STATUS_ACTIVE;
        $targetType = $target instanceof Rider ? 'rider' : 'user';

        return DB::transaction(function () use ($target, $targetType, $prevStatus, $reason, $actor, $options) {
            $target->applyManualAccountRestriction($actor, $reason);

            if ($target instanceof Rider) {
                if (!empty($options['restrict_new_only'])) {
                    $target->update(['is_delivery_restricted' => true]);
                }
                try {
                    broadcast(new \App\Events\RiderStatusUpdated($target->fresh()));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast error on restrictAccount: ' . $e->getMessage());
                }
            }

            SecurityAuditLogger::logSecurityEvent(
                event: 'MANUAL_RESTRICTION_APPLIED',
                target: "{$targetType}:{$target->id}",
                details: [
                    'actor_id'        => $actor->id,
                    'actor_name'      => $actor->name,
                    'actor_role'      => $actor->role,
                    'target_id'       => $target->id,
                    'target_type'     => $targetType,
                    'target_name'     => $target->name,
                    'previous_status' => $prevStatus,
                    'new_status'      => User::STATUS_RESTRICTED,
                    'reason'          => $reason,
                    'source'          => 'MANUAL',
                ],
                level: 'warning'
            );

            return [
                'success'         => true,
                'target'          => $target->fresh(),
                'previous_status' => $prevStatus,
                'new_status'      => User::STATUS_RESTRICTED,
                'message'         => "Account successfully restricted.",
            ];
        });
    }

    /**
     * Record a qualifying customer cancellation and evaluate the consecutive cancellation threshold (10 cancellations).
     */
    public function recordCustomerCancellation(User|int $userOrId, string $reason, ?\App\Models\Order $order = null): void
    {
        $user = $userOrId instanceof User ? $userOrId : User::find((int) $userOrId);
        if (!$user) return;

        // Only evaluate customers who are not already restricted/suspended/deactivated
        if ($user->isRestricted() || $user->isSuspended() || $user->isDeactivated()) {
            return;
        }

        DB::transaction(function () use ($user, $reason, $order) {
            $freshUser = User::where('id', $user->id)->lockForUpdate()->first();
            if (!$freshUser) return;

            $newStreak = ((int) $freshUser->consecutive_cancellations) + 1;
            $freshUser->update(['consecutive_cancellations' => $newStreak]);

            // Threshold: 10 consecutive qualifying cancellations triggers automatic restriction
            if ($newStreak >= 10 && $freshUser->account_status === User::STATUS_ACTIVE) {
                $restrictionReason = "10 consecutive order cancellations. Last cancellation reason: {$reason}";
                $freshUser->applyConsecutiveCancellationRestriction($restrictionReason);

                SecurityAuditLogger::logSecurityEvent(
                    event: 'AUTOMATIC_ACCOUNT_RESTRICTED',
                    target: "user:{$freshUser->id}",
                    details: [
                        'target_id'             => $freshUser->id,
                        'target_name'           => $freshUser->name,
                        'consecutive_streak'    => $newStreak,
                        'threshold'             => 10,
                        'last_order_id'         => $order?->id,
                        'reason'                => $restrictionReason,
                        'source'                => 'AUTOMATIC',
                    ],
                    level: 'warning'
                );
            }
        });
    }

    /**
     * Record a customer successful delivered order, which atomically resets the cancellation streak to 0.
     */
    public function recordCustomerSuccessfulOrder(User|int $userOrId, ?\App\Models\Order $order = null): void
    {
        $user = $userOrId instanceof User ? $userOrId : User::find((int) $userOrId);
        if (!$user) return;

        $user->resetCancellationStreak();
    }

    /**
     * Record a qualifying rider delivery failure and evaluate the consecutive failure threshold (5 failures).
     */
    public function recordRiderDeliveryFailure(Rider|int $riderOrId, string $reason, ?\App\Models\Delivery $delivery = null): void
    {
        $rider = $riderOrId instanceof Rider ? $riderOrId : Rider::find((int) $riderOrId);
        if (!$rider) return;

        if ($rider->isRestricted() || $rider->isSuspended() || $rider->isDeactivated()) {
            return;
        }

        DB::transaction(function () use ($rider, $reason, $delivery) {
            $freshRider = Rider::where('id', $rider->id)->lockForUpdate()->first();
            if (!$freshRider) return;

            $newStreak = ((int) $freshRider->consecutive_delivery_failures) + 1;
            $freshRider->update(['consecutive_delivery_failures' => $newStreak]);

            // Threshold: 5 consecutive qualifying delivery failures triggers automatic restriction
            if ($newStreak >= 5 && $freshRider->account_status === Rider::STATUS_ACTIVE) {
                $restrictionReason = "5 consecutive failed deliveries. Last failure reason: {$reason}";
                $freshRider->applyConsecutiveFailureRestriction($restrictionReason);

                try {
                    broadcast(new \App\Events\RiderStatusUpdated($freshRider->fresh()));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('RiderStatusUpdated broadcast error on auto-restrict: ' . $e->getMessage());
                }

                SecurityAuditLogger::logSecurityEvent(
                    event: 'AUTOMATIC_RIDER_RESTRICTED',
                    target: "rider:{$freshRider->id}",
                    details: [
                        'target_id'          => $freshRider->id,
                        'target_name'        => $freshRider->name,
                        'consecutive_streak' => $newStreak,
                        'threshold'          => 5,
                        'last_delivery_id'   => $delivery?->id,
                        'reason'             => $restrictionReason,
                        'source'             => 'AUTOMATIC',
                    ],
                    level: 'warning'
                );
            }
        });
    }

    /**
     * Record a rider successful delivery, which atomically resets the failure streak to 0.
     */
    public function recordRiderSuccessfulDelivery(Rider|int $riderOrId, ?\App\Models\Delivery $delivery = null): void
    {
        $rider = $riderOrId instanceof Rider ? $riderOrId : Rider::find((int) $riderOrId);
        if (!$rider) return;

        $rider->resetFailureStreak();
    }
    /**
     * Change the account status of a user or rider with strict safety checks.
     */
    public function changeStatus(
        User|Rider $target,
        string $newStatus,
        string $reason,
        User $actor,
        array $options = []
    ): array {
        // 1. Self-lockout prevention
        if ($actor instanceof User && $target instanceof User && (int) $actor->id === (int) $target->id) {
            throw new \RuntimeException('Self-lockout protection: You cannot restrict, suspend, or deactivate your own account.');
        }

        // 2. Privilege hierarchy check
        if ($target instanceof User && $target->isSuperAdmin() && !$actor->isSuperAdmin()) {
            throw new \RuntimeException('Unauthorized: Only Super Admins can manage Super Admin accounts.');
        }

        $validStatuses = [
            User::STATUS_ACTIVE,
            User::STATUS_UNDER_REVIEW,
            User::STATUS_RESTRICTED,
            User::STATUS_SUSPENDED,
            User::STATUS_DEACTIVATED,
        ];

        if (!in_array($newStatus, $validStatuses, true)) {
            throw new \InvalidArgumentException("Invalid status: {$newStatus}");
        }

        if (empty(trim($reason)) && $newStatus !== User::STATUS_ACTIVE) {
            throw new \InvalidArgumentException('A mandatory reason is required for status changes.');
        }

        $prevStatus = $target->account_status ?? User::STATUS_ACTIVE;
        $targetType = $target instanceof Rider ? 'rider' : 'user';

        // 3. Active Delivery Protection for Riders
        if ($target instanceof Rider && in_array($newStatus, [User::STATUS_RESTRICTED, User::STATUS_SUSPENDED, User::STATUS_DEACTIVATED], true)) {
            $activeDeliveries = $target->activeDeliveriesCount();
            $force = $options['force'] ?? false;
            $restrictNewOnly = $options['restrict_new_only'] ?? false;

            if ($activeDeliveries > 0 && !$force && !$restrictNewOnly) {
                return [
                    'success'                 => false,
                    'requires_confirmation'   => true,
                    'active_deliveries_count' => $activeDeliveries,
                    'message'                 => "This rider currently has {$activeDeliveries} active delivery(ies) in progress. Please choose how to proceed.",
                ];
            }

            if ($restrictNewOnly) {
                $target->update(['is_delivery_restricted' => true]);
            }
        }

        // 4. Perform Transactional State Transition
        return DB::transaction(function () use ($target, $targetType, $newStatus, $prevStatus, $reason, $actor, $options) {
            $updateData = [
                'account_status'    => $newStatus,
                'status_reason'     => $newStatus === User::STATUS_ACTIVE ? null : $reason,
                'status_changed_by' => $actor->id,
            ];

            match ($newStatus) {
                User::STATUS_RESTRICTED   => $updateData['restricted_at'] = now(),
                User::STATUS_SUSPENDED    => $updateData['suspended_at'] = now(),
                User::STATUS_DEACTIVATED  => $updateData['deactivated_at'] = now(),
                User::STATUS_ACTIVE       => array_merge($updateData, [
                    'restricted_at'          => null,
                    'suspended_at'           => null,
                    'deactivated_at'         => null,
                    'is_order_restricted'    => false,
                    'is_delivery_restricted' => false,
                ]),
                default => null,
            };

            // Order restriction flag for customers
            if (isset($options['is_order_restricted'])) {
                $updateData['is_order_restricted'] = (bool) $options['is_order_restricted'];
            }

            // Delivery restriction flag for riders
            if (!empty($options['restrict_new_only']) || isset($options['is_delivery_restricted'])) {
                $updateData['is_delivery_restricted'] = !empty($options['restrict_new_only']) || (bool) ($options['is_delivery_restricted'] ?? false);
            }

            // Invalidate API tokens if suspended or deactivated
            if (in_array($newStatus, [User::STATUS_SUSPENDED, User::STATUS_DEACTIVATED], true)) {
                $target->tokens()->delete();
                if ($target instanceof Rider) {
                    $updateData['is_active'] = false;
                    $updateData['status'] = 'offline';
                }
            } elseif ($newStatus === User::STATUS_ACTIVE && $target instanceof Rider) {
                $updateData['is_active'] = true;
                $updateData['is_delivery_restricted'] = false;
            }

            $target->update($updateData);

            // 5. Security Audit Logging
            SecurityAuditLogger::logSecurityEvent(
                event: 'ACCOUNT_STATUS_CHANGED',
                target: "{$targetType}:{$target->id}",
                details: [
                    'actor_id'        => $actor->id,
                    'actor_name'      => $actor->name,
                    'actor_role'      => $actor->role,
                    'target_id'       => $target->id,
                    'target_type'     => $targetType,
                    'target_name'     => $target->name,
                    'target_email'    => $target->email,
                    'previous_status' => $prevStatus,
                    'new_status'      => $newStatus,
                    'reason'          => $reason,
                ],
                level: in_array($newStatus, [User::STATUS_SUSPENDED, User::STATUS_DEACTIVATED]) ? 'warning' : 'info'
            );

            return [
                'success'         => true,
                'target'          => $target->fresh(),
                'previous_status' => $prevStatus,
                'new_status'      => $newStatus,
                'message'         => "Account status updated to {$newStatus}.",
            ];
        });
    }

    /**
     * Report/flag an account creating a moderation case.
     */
    public function flagAccount(
        User|Rider $target,
        string $reasonCategory,
        string $title,
        string $description,
        ?string $evidenceNotes,
        User $reporter,
        bool $markUnderReview = false
    ): ModerationCase {
        $targetType = $target instanceof Rider ? 'rider' : 'user';

        $case = ModerationCase::create([
            'target_type'     => $targetType,
            'target_id'       => $target->id,
            'reported_by_id'  => $reporter->id,
            'reason_category' => $reasonCategory,
            'title'           => $title,
            'description'     => $description,
            'evidence_notes'  => $evidenceNotes,
            'status'          => ModerationCase::STATUS_OPEN,
        ]);

        if ($markUnderReview && ($target->account_status ?? 'active') === 'active') {
            $this->changeStatus(
                target: $target,
                newStatus: User::STATUS_UNDER_REVIEW,
                reason: "Case #{$case->case_number}: {$title}",
                actor: $reporter
            );
        }

        SecurityAuditLogger::logSecurityEvent(
            event: 'MODERATION_CASE_CREATED',
            target: "case:{$case->case_number}",
            details: [
                'case_id'         => $case->id,
                'case_number'     => $case->case_number,
                'target_type'     => $targetType,
                'target_id'       => $target->id,
                'target_name'     => $target->name,
                'reported_by'     => $reporter->name,
                'reason_category' => $reasonCategory,
                'title'           => $title,
            ],
            level: 'info'
        );

        return $case;
    }

    /**
     * Resolve a moderation case with a formal administrative decision.
     */
    public function resolveCase(
        ModerationCase $case,
        string $decision,
        string $notes,
        User $actor
    ): ModerationCase {
        if (!$actor->isSuperAdmin() && !$actor->isAdmin()) {
            throw new \RuntimeException('Unauthorized to resolve moderation cases.');
        }

        /** @var Rider|User|null $target */
        $target = $case->target_type === 'rider'
            ? Rider::find($case->target_id)
            : User::find($case->target_id);

        if ($target instanceof User || $target instanceof Rider) {
            match ($decision) {
                'clear'      => $this->changeStatus($target, User::STATUS_ACTIVE, "Case #{$case->case_number} cleared: {$notes}", $actor),
                'restrict'   => $this->changeStatus($target, User::STATUS_RESTRICTED, "Case #{$case->case_number} restricted: {$notes}", $actor),
                'suspend'    => $this->changeStatus($target, User::STATUS_SUSPENDED, "Case #{$case->case_number} suspended: {$notes}", $actor, ['force' => true]),
                'deactivate' => $this->changeStatus($target, User::STATUS_DEACTIVATED, "Case #{$case->case_number} deactivated: {$notes}", $actor, ['force' => true]),
                default      => null,
            };
        }

        $newStatus = ($decision === 'dismiss') ? ModerationCase::STATUS_DISMISSED : ModerationCase::STATUS_RESOLVED;

        $case->update([
            'status'              => $newStatus,
            'resolution_decision' => $decision,
            'resolution_notes'    => $notes,
            'resolved_by_id'      => $actor->id,
            'resolved_at'         => now(),
        ]);

        SecurityAuditLogger::logSecurityEvent(
            event: 'MODERATION_CASE_RESOLVED',
            target: "case:{$case->case_number}",
            details: [
                'case_number' => $case->case_number,
                'decision'    => $decision,
                'resolved_by' => $actor->name,
                'notes'       => $notes,
            ],
            level: 'info'
        );

        return $case->fresh();
    }

    /**
     * Safe Account Deletion with Zero-Data-Loss Protection.
     */
    public function safeDelete(User|Rider $target, string $reason, User $actor): array
    {
        // 1. Self-lockout check
        if ($actor instanceof User && $target instanceof User && (int) $actor->id === (int) $target->id) {
            throw new \RuntimeException('Self-lockout protection: You cannot delete your own account.');
        }

        // 2. Check if account has historical business relationships
        if ($target->hasHistoricalBusinessRecords()) {
            $this->changeStatus(
                target: $target,
                newStatus: User::STATUS_DEACTIVATED,
                reason: "Deactivated instead of deleted to preserve historical business records. Reason: {$reason}",
                actor: $actor,
                options: ['force' => true]
            );

            return [
                'success' => true,
                'action'  => 'deactivated',
                'message' => 'Account has historical business data (orders/sales/deliveries/logs) and was safely deactivated instead of hard deleted.',
                'target'  => $target->fresh(),
            ];
        }

        // 3. Clean record with 0 business history -> safe to delete
        $targetType = $target instanceof Rider ? 'rider' : 'user';
        $targetId = $target->id;
        $targetName = $target->name;
        $targetEmail = $target->email;

        $target->tokens()->delete();
        $target->delete();

        SecurityAuditLogger::logSecurityEvent(
            event: 'ACCOUNT_DELETED',
            target: "{$targetType}:{$targetId}",
            details: [
                'actor_id'    => $actor->id,
                'actor_name'  => $actor->name,
                'target_id'   => $targetId,
                'target_name' => $targetName,
                'target_email'=> $targetEmail,
                'reason'      => $reason,
            ],
            level: 'warning'
        );

        return [
            'success' => true,
            'action'  => 'deleted',
            'message' => 'Account permanently deleted.',
        ];
    }
}
