<?php

namespace App\Services;

use App\Models\ModerationCase;
use App\Models\Rider;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AccountGovernanceService
{
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
