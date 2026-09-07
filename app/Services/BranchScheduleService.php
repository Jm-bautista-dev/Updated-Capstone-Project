<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\BranchSchedule;
use App\Models\BranchSpecialSchedule;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BranchScheduleService
{
    const TIMEZONE = 'Asia/Manila';

    const MODE_AUTOMATIC    = 'automatic';
    const MODE_FORCE_OPEN   = 'force_open';
    const MODE_FORCE_CLOSED = 'force_closed';

    /**
     * Get authoritative real-time operating status of a branch.
     *
     * @param Branch $branch
     * @param Carbon|null $now
     * @return array
     */
    public function getBranchOperatingStatus(Branch $branch, ?Carbon $now = null): array
    {
        $tz = self::TIMEZONE;
        $currentTime = $now ? $now->copy()->setTimezone($tz) : Carbon::now($tz);
        $todayDateStr = $currentTime->toDateString();
        $dayOfWeek = $currentTime->dayOfWeek; // 0 = Sunday, ..., 6 = Saturday

        $mode = $branch->operating_mode ?? self::MODE_AUTOMATIC;
        $overrideReason = $branch->mode_override_reason;
        
        $overrideUntil = null;
        if ($branch->mode_override_until instanceof \Carbon\CarbonInterface) {
            $overrideUntil = Carbon::parse($branch->mode_override_until->format('Y-m-d H:i:s'), $tz);
        } elseif (!empty($branch->mode_override_until)) {
            $overrideUntil = Carbon::parse($branch->mode_override_until, $tz);
        }

        $overrideAt = null;
        if ($branch->mode_override_at instanceof \Carbon\CarbonInterface) {
            $overrideAt = Carbon::parse($branch->mode_override_at->format('Y-m-d H:i:s'), $tz);
        } elseif (!empty($branch->mode_override_at)) {
            $overrideAt = Carbon::parse($branch->mode_override_at, $tz);
        }

        // Check if temporary manual override has expired
        $isOverrideExpired = false;
        if ($overrideUntil && $currentTime->gte($overrideUntil)) {
            $isOverrideExpired = true;
            $mode = self::MODE_AUTOMATIC;
            $overrideReason = null;
        }

        $scheduleForToday = $this->getOperatingScheduleForDate($branch, $currentTime);

        $isOpen = false;
        $isAcceptingOrders = false;
        $statusLabel = 'CLOSED';
        $statusMessage = '';
        $isOverrideActive = false;

        if ($mode === self::MODE_FORCE_OPEN) {
            $isOpen = true;
            $isAcceptingOrders = true;
            $statusLabel = 'OPEN';
            $isOverrideActive = true;
            $statusMessage = 'Force Open Active • Accepting Orders';
            if ($overrideReason) {
                $statusMessage .= " ({$overrideReason})";
            }
        } elseif ($mode === self::MODE_FORCE_CLOSED) {
            $isOpen = false;
            $isAcceptingOrders = false;
            $statusLabel = 'CLOSED';
            $isOverrideActive = true;
            $statusMessage = 'Force Closed Active • Not Accepting Orders';
            if ($overrideReason) {
                $statusMessage .= " ({$overrideReason})";
            }
        } else {
            // AUTOMATIC MODE
            if ($scheduleForToday['is_closed_all_day']) {
                $isOpen = false;
                $isAcceptingOrders = false;
                $statusLabel = 'CLOSED';
                $statusMessage = $scheduleForToday['is_special']
                    ? "Closed All Day ({$scheduleForToday['reason']})"
                    : 'Closed Today';
            } elseif ($scheduleForToday['is_open_24_hours']) {
                $isOpen = true;
                $isAcceptingOrders = true;
                $statusLabel = 'OPEN';
                $statusMessage = $scheduleForToday['is_special']
                    ? "Open 24 Hours ({$scheduleForToday['reason']})"
                    : 'Open 24 Hours';
            } else {
                $openTimeStr = $scheduleForToday['open_time'] ?? '10:00:00';
                $closeTimeStr = $scheduleForToday['close_time'] ?? '20:00:00';

                $openDateTime = Carbon::parse("{$todayDateStr} {$openTimeStr}", $tz);
                $closeDateTime = Carbon::parse("{$todayDateStr} {$closeTimeStr}", $tz);

                // Handle normal vs overnight time ranges
                if ($openDateTime->lte($closeDateTime)) {
                    // Normal schedule: e.g. 10:00:00 to 20:00:00
                    if ($currentTime->gte($openDateTime) && $currentTime->lt($closeDateTime)) {
                        $isOpen = true;
                        $isAcceptingOrders = true;
                        $statusLabel = 'OPEN';
                        $statusMessage = "Open • Closes at {$closeDateTime->format('g:i A')}";
                    } elseif ($currentTime->lt($openDateTime)) {
                        $isOpen = false;
                        $isAcceptingOrders = false;
                        $statusLabel = 'CLOSED';
                        $statusMessage = "Closed • Opens at {$openDateTime->format('g:i A')}";
                    } else {
                        $isOpen = false;
                        $isAcceptingOrders = false;
                        $statusLabel = 'CLOSED';
                        $statusMessage = "Closed for the day • Closed at {$closeDateTime->format('g:i A')}";
                    }
                } else {
                    // Overnight schedule: e.g. 22:00:00 to 02:00:00 next day
                    if ($currentTime->gte($openDateTime) || $currentTime->lt($closeDateTime)) {
                        $isOpen = true;
                        $isAcceptingOrders = true;
                        $statusLabel = 'OPEN';
                        $statusMessage = "Open • Closes at {$closeDateTime->format('g:i A')}";
                    } else {
                        $isOpen = false;
                        $isAcceptingOrders = false;
                        $statusLabel = 'CLOSED';
                        $statusMessage = "Closed • Opens at {$openDateTime->format('g:i A')}";
                    }
                }
            }
        }

        // Calculate next opening and closing times
        $nextOpening = $this->calculateNextOpeningTime($branch, $currentTime, $mode, $scheduleForToday);
        $nextClosing = $this->calculateNextClosingTime($branch, $currentTime, $mode, $scheduleForToday);

        $reasonType = ($mode !== self::MODE_AUTOMATIC)
            ? 'manual_override'
            : ($scheduleForToday['is_special'] ? 'special_override' : 'regular_schedule');

        return [
            'branch_id'               => (int) $branch->id,
            'branch_name'             => $branch->name,
            'status'                  => $statusLabel,
            'is_open'                 => $isOpen,
            'is_accepting_orders'     => $isAcceptingOrders,
            'operating_mode'          => $mode,
            'is_override_active'      => $isOverrideActive,
            'reason_type'             => $reasonType,
            'override_reason'         => $overrideReason,
            'mode_override_reason'    => $overrideReason,
            'mode_override_until'     => $overrideUntil?->toIso8601String(),
            'mode_override_at'        => $overrideAt?->toIso8601String(),
            'current_time_ph'         => $currentTime->toIso8601String(),
            'current_time_display'    => $currentTime->format('g:i A'),
            'today_hours_display'     => $scheduleForToday['formatted_hours'],
            'today_opening_time'      => $scheduleForToday['open_time'],
            'today_closing_time'      => $scheduleForToday['close_time'],
            'today_is_closed'         => $scheduleForToday['is_closed_all_day'],
            'today_is_24_hours'       => $scheduleForToday['is_open_24_hours'],
            'is_special_schedule'     => $scheduleForToday['is_special'],
            'special_schedule_reason' => $scheduleForToday['reason'],
            'status_message'          => $statusMessage,
            'next_opening_at'         => $nextOpening?->toIso8601String(),
            'next_opening_display'    => $nextOpening ? $nextOpening->format('M j, g:i A') : null,
            'next_closing_at'         => $nextClosing?->toIso8601String(),
            'next_closing_display'    => $nextClosing ? $nextClosing->format('M j, g:i A') : null,
        ];
    }

    /**
     * Get computed operating schedule for a specific branch and calendar date.
     *
     * @param Branch $branch
     * @param Carbon $targetDate
     * @return array
     */
    public function getOperatingScheduleForDate(Branch $branch, Carbon $targetDate): array
    {
        $tz = self::TIMEZONE;
        $date = $targetDate->copy()->setTimezone($tz);
        $dateStr = $date->toDateString();
        $dayOfWeek = $date->dayOfWeek;

        // 1. Check for Special Date Override
        /** @var BranchSpecialSchedule|null $special */
        $special = null;
        try {
            $special = BranchSpecialSchedule::where('branch_id', $branch->id)
                ->whereDate('date', $dateStr)
                ->first();
        } catch (\Throwable $e) {
            $special = null;
        }

        if ($special) {
            if ($special->is_closed_all_day) {
                return [
                    'date'              => $dateStr,
                    'is_special'        => true,
                    'is_closed_all_day' => true,
                    'is_open_24_hours'  => false,
                    'open_time'         => null,
                    'close_time'        => null,
                    'reason'            => $special->reason ?? 'Special Closed Day',
                    'formatted_hours'   => 'Closed All Day',
                ];
            }

            if ($special->is_open_24_hours) {
                return [
                    'date'              => $dateStr,
                    'is_special'        => true,
                    'is_closed_all_day' => false,
                    'is_open_24_hours'  => true,
                    'open_time'         => '00:00:00',
                    'close_time'        => '23:59:59',
                    'reason'            => $special->reason ?? '24 Hours Operation',
                    'formatted_hours'   => 'Open 24 Hours',
                ];
            }

            $open = $special->open_time ? date('H:i:s', strtotime($special->open_time)) : '10:00:00';
            $close = $special->close_time ? date('H:i:s', strtotime($special->close_time)) : '20:00:00';
            $openFormatted = date('g:i A', strtotime($open));
            $closeFormatted = date('g:i A', strtotime($close));

            return [
                'date'              => $dateStr,
                'is_special'        => true,
                'is_closed_all_day' => false,
                'is_open_24_hours'  => false,
                'open_time'         => $open,
                'close_time'        => $close,
                'reason'            => $special->reason,
                'formatted_hours'   => "{$openFormatted} — {$closeFormatted}",
            ];
        }

        // 2. Check for Regular Weekly Schedule
        /** @var BranchSchedule|null $regular */
        $regular = null;
        try {
            $regular = BranchSchedule::where('branch_id', $branch->id)
                ->where('day_of_week', $dayOfWeek)
                ->first();
        } catch (\Throwable $e) {
            $regular = null;
        }

        if ($regular) {
            if ($regular->is_closed) {
                return [
                    'date'              => $dateStr,
                    'is_special'        => false,
                    'is_closed_all_day' => true,
                    'is_open_24_hours'  => false,
                    'open_time'         => null,
                    'close_time'        => null,
                    'reason'            => null,
                    'formatted_hours'   => 'Closed',
                ];
            }

            $open = $regular->open_time ? date('H:i:s', strtotime($regular->open_time)) : '10:00:00';
            $close = $regular->close_time ? date('H:i:s', strtotime($regular->close_time)) : '20:00:00';
            $openFormatted = date('g:i A', strtotime($open));
            $closeFormatted = date('g:i A', strtotime($close));

            return [
                'date'              => $dateStr,
                'is_special'        => false,
                'is_closed_all_day' => false,
                'is_open_24_hours'  => false,
                'open_time'         => $open,
                'close_time'        => $close,
                'reason'            => null,
                'formatted_hours'   => "{$openFormatted} — {$closeFormatted}",
            ];
        }

        // 3. Fallback defaults (Victoria: 10am-8pm, Sta Cruz: 10am-7:45pm)
        $isStaCruz = (str_contains(strtolower($branch->name), 'sta') && str_contains(strtolower($branch->name), 'cruz')) || $branch->id == 2;
        $fallbackOpen = '10:00:00';
        $fallbackClose = $isStaCruz ? '19:45:00' : '20:00:00';
        $openFormatted = date('g:i A', strtotime($fallbackOpen));
        $closeFormatted = date('g:i A', strtotime($fallbackClose));

        return [
            'date'              => $dateStr,
            'is_special'        => false,
            'is_closed_all_day' => false,
            'is_open_24_hours'  => false,
            'open_time'         => $fallbackOpen,
            'close_time'        => $fallbackClose,
            'reason'            => null,
            'formatted_hours'   => "{$openFormatted} — {$closeFormatted}",
        ];
    }

    /**
     * Authoritative check whether an order can be accepted by the branch.
     *
     * @param Branch $branch
     * @param string $fulfillmentType 'delivery' or 'pickup'
     * @param Carbon|null $scheduledAt
     * @return array ['allowed' => bool, 'reason' => ?string]
     */
    public function canAcceptOrder(Branch $branch, string $fulfillmentType = 'delivery', ?Carbon $scheduledAt = null): array
    {
        $tz = self::TIMEZONE;
        $now = Carbon::now($tz);

        if ($fulfillmentType === 'pickup' && $scheduledAt) {
            $pickupTime = $scheduledAt->copy()->setTimezone($tz);
            $isToday = $pickupTime->isToday();

            // If scheduled for today, verify if branch is under immediate manual emergency FORCE CLOSED
            if ($isToday) {
                $statusToday = $this->getBranchOperatingStatus($branch, $now);
                if ($statusToday['operating_mode'] === self::MODE_FORCE_CLOSED && $statusToday['is_override_active']) {
                    $reason = $statusToday['mode_override_reason'] ? " ({$statusToday['mode_override_reason']})" : "";
                    return [
                        'allowed' => false,
                        'reason'  => "{$branch->name} is temporarily closed today by store management{$reason}.",
                    ];
                }
            }

            // Check target date's operating hours
            $schedule = $this->getOperatingScheduleForDate($branch, $pickupTime);

            if ($schedule['is_closed_all_day']) {
                $reasonText = $schedule['reason'] ? " ({$schedule['reason']})" : "";
                return [
                    'allowed' => false,
                    'reason'  => "{$branch->name} is closed on {$pickupTime->format('M d, Y')}{$reasonText}.",
                ];
            }

            if ($schedule['is_open_24_hours']) {
                return ['allowed' => true, 'reason' => null];
            }

            $openDateTime = Carbon::parse("{$pickupTime->toDateString()} {$schedule['open_time']}", $tz);
            $closeDateTime = Carbon::parse("{$pickupTime->toDateString()} {$schedule['close_time']}", $tz);

            $cutoffMin = (int) ($branch->pickup_cutoff_before_close_minutes ?? 30);
            $lastPickupSlot = $closeDateTime->copy()->subMinutes($cutoffMin);

            if ($pickupTime->lt($openDateTime) || $pickupTime->gt($lastPickupSlot)) {
                return [
                    'allowed' => false,
                    'reason'  => "Selected pickup time ({$pickupTime->format('g:i A')}) is outside branch pickup hours / operating hours for {$pickupTime->format('M d, Y')} ({$openDateTime->format('g:i A')} to {$lastPickupSlot->format('g:i A')}).",
                ];
            }

            return ['allowed' => true, 'reason' => null];
        }

        // On-demand Delivery: Must be currently accepting orders right now
        $status = $this->getBranchOperatingStatus($branch, $now);

        if (!$status['is_accepting_orders']) {
            $hoursInfo = $status['today_hours_display'] ?? '';
            $reason = "{$branch->name} is currently closed and not accepting new orders.";
            if ($status['status_message']) {
                $reason .= " ({$status['status_message']})";
            }
            return [
                'allowed' => false,
                'reason'  => $reason,
            ];
        }

        return ['allowed' => true, 'reason' => null];
    }

    /**
     * Change operating mode (AUTOMATIC, FORCE_OPEN, FORCE_CLOSED) with audit logging.
     *
     * @param Branch $branch
     * @param string $mode
     * @param string|null $reason
     * @param Carbon|null $expiresAt
     * @param User|null $actor
     * @return Branch
     */
    public function setOperatingMode(
        Branch $branch,
        string $mode,
        ?string $reason = null,
        ?Carbon $expiresAt = null,
        ?User $actor = null
    ): Branch {
        $allowedModes = [self::MODE_AUTOMATIC, self::MODE_FORCE_OPEN, self::MODE_FORCE_CLOSED];
        if (!in_array($mode, $allowedModes, true)) {
            throw new \InvalidArgumentException("Invalid operating mode '{$mode}'. Allowed: " . implode(', ', $allowedModes));
        }

        $beforeState = [
            'operating_mode'       => $branch->operating_mode,
            'mode_override_reason' => $branch->mode_override_reason,
            'mode_override_until'  => $branch->mode_override_until,
            'mode_override_by'     => $branch->mode_override_by,
        ];

        $tz = self::TIMEZONE;
        $updateData = [
            'operating_mode'       => $mode,
            'mode_override_reason' => ($mode === self::MODE_AUTOMATIC) ? null : $reason,
            'mode_override_until'  => ($mode === self::MODE_AUTOMATIC) ? null : ($expiresAt ? $expiresAt->copy() : null),
            'mode_override_at'     => ($mode === self::MODE_AUTOMATIC) ? null : Carbon::now($tz),
            'mode_override_by'     => ($mode === self::MODE_AUTOMATIC) ? null : $actor?->id,
        ];

        $branch->update($updateData);

        SecurityAuditLogger::logSecurityEvent(
            event: 'BRANCH_OPERATING_MODE_CHANGED',
            target: "branch:{$branch->id}",
            details: [
                'branch_id'   => $branch->id,
                'branch_name' => $branch->name,
                'old_mode'    => $beforeState['operating_mode'],
                'new_mode'    => $mode,
                'reason'      => $reason,
                'expires_at'  => $expiresAt?->toIso8601String(),
                'actor_id'    => $actor?->id,
                'actor_name'  => $actor?->name ?? 'System',
            ],
            level: 'info'
        );

        return $branch->fresh(['schedules', 'specialSchedules', 'modeOverrideBy']);
    }

    /**
     * Update 7-day regular weekly schedule for a branch.
     *
     * @param Branch $branch
     * @param array $schedules Array of ['day_of_week' => int, 'open_time' => string, 'close_time' => string, 'is_closed' => bool]
     * @param User|null $actor
     * @return void
     */
    public function updateRegularSchedule(Branch $branch, array $schedules, ?User $actor = null): void
    {
        DB::transaction(function () use ($branch, $schedules, $actor) {
            foreach ($schedules as $sched) {
                $dayOfWeek = (int) $sched['day_of_week'];
                if ($dayOfWeek < 0 || $dayOfWeek > 6) {
                    throw new \InvalidArgumentException("Invalid day_of_week '{$dayOfWeek}'. Must be between 0 (Sunday) and 6 (Saturday).");
                }

                $isClosed = (bool) ($sched['is_closed'] ?? false);
                $openTime = !empty($sched['open_time']) ? date('H:i:s', strtotime($sched['open_time'])) : '10:00:00';
                $closeTime = !empty($sched['close_time']) ? date('H:i:s', strtotime($sched['close_time'])) : '20:00:00';

                BranchSchedule::updateOrCreate(
                    [
                        'branch_id'   => $branch->id,
                        'day_of_week' => $dayOfWeek,
                    ],
                    [
                        'open_time'   => $openTime,
                        'close_time'  => $closeTime,
                        'is_closed'   => $isClosed,
                    ]
                );
            }

            // Sync legacy branch pickup hours for backward compatibility
            $sampleSchedule = BranchSchedule::where('branch_id', $branch->id)->where('is_closed', false)->first();
            if ($sampleSchedule) {
                $branch->update([
                    'pickup_opening_time' => $sampleSchedule->open_time,
                    'pickup_closing_time' => $sampleSchedule->close_time,
                ]);
            }

            SecurityAuditLogger::logSecurityEvent(
                event: 'BRANCH_REGULAR_SCHEDULE_UPDATED',
                target: "branch:{$branch->id}",
                details: [
                    'branch_id'   => $branch->id,
                    'branch_name' => $branch->name,
                    'actor_id'    => $actor?->id,
                    'actor_name'  => $actor?->name ?? 'System',
                ],
                level: 'info'
            );
        });
    }

    /**
     * Create or update a date-specific special schedule override.
     *
     * @param Branch $branch
     * @param array $data
     * @param User|null $actor
     * @return BranchSpecialSchedule
     */
    public function createOrUpdateSpecialSchedule(Branch $branch, array $data, ?User $actor = null): BranchSpecialSchedule
    {
        $date = Carbon::parse($data['date'], self::TIMEZONE)->toDateString();
        $isClosedAllDay = (bool) ($data['is_closed_all_day'] ?? false);
        $isOpen24Hours = (bool) ($data['is_open_24_hours'] ?? false);

        $special = BranchSpecialSchedule::updateOrCreate(
            [
                'branch_id' => $branch->id,
                'date'      => $date,
            ],
            [
                'is_closed_all_day' => $isClosedAllDay,
                'is_open_24_hours'  => $isOpen24Hours,
                'open_time'         => ($isClosedAllDay || $isOpen24Hours) ? null : ($data['open_time'] ?? null),
                'close_time'        => ($isClosedAllDay || $isOpen24Hours) ? null : ($data['close_time'] ?? null),
                'reason'            => $data['reason'] ?? null,
                'created_by'        => $actor?->id,
                'updated_by'        => $actor?->id,
            ]
        );

        SecurityAuditLogger::logSecurityEvent(
            event: 'BRANCH_SPECIAL_SCHEDULE_SAVED',
            target: "branch:{$branch->id}",
            details: [
                'branch_id'         => $branch->id,
                'branch_name'       => $branch->name,
                'date'              => $date,
                'is_closed_all_day' => $isClosedAllDay,
                'is_open_24_hours'  => $isOpen24Hours,
                'reason'            => $data['reason'] ?? null,
                'actor_id'          => $actor?->id,
                'actor_name'        => $actor?->name ?? 'System',
            ],
            level: 'info'
        );

        return $special;
    }

    /**
     * Remove a special schedule override.
     *
     * @param int $specialScheduleId
     * @param Branch $branch
     * @param User|null $actor
     * @return bool
     */
    public function deleteSpecialSchedule(int $specialScheduleId, Branch $branch, ?User $actor = null): bool
    {
        $special = BranchSpecialSchedule::where('branch_id', $branch->id)->where('id', $specialScheduleId)->first();
        if (!$special) {
            return false;
        }

        $date = $special->date;
        $reason = $special->reason;
        $special->delete();

        SecurityAuditLogger::logSecurityEvent(
            event: 'BRANCH_SPECIAL_SCHEDULE_DELETED',
            target: "branch:{$branch->id}",
            details: [
                'branch_id'   => $branch->id,
                'branch_name' => $branch->name,
                'date'        => $date,
                'reason'      => $reason,
                'actor_id'    => $actor?->id,
                'actor_name'  => $actor?->name ?? 'System',
            ],
            level: 'info'
        );

        return true;
    }

    /**
     * Calculate next opening time if currently closed.
     */
    protected function calculateNextOpeningTime(Branch $branch, Carbon $now, string $mode, array $todaySchedule): ?Carbon
    {
        $tz = self::TIMEZONE;
        $todayDateStr = $now->toDateString();

        if ($mode === self::MODE_FORCE_OPEN) {
            return $now;
        }

        if (!$todaySchedule['is_closed_all_day'] && !$todaySchedule['is_open_24_hours']) {
            $todayOpen = Carbon::parse("{$todayDateStr} {$todaySchedule['open_time']}", $tz);
            if ($now->lt($todayOpen)) {
                return $todayOpen;
            }
        }

        // Look forward up to 7 days
        for ($i = 1; $i <= 7; $i++) {
            $nextDate = $now->copy()->addDays($i);
            $nextSchedule = $this->getOperatingScheduleForDate($branch, $nextDate);
            if (!$nextSchedule['is_closed_all_day']) {
                $openTime = $nextSchedule['is_open_24_hours'] ? '00:00:00' : ($nextSchedule['open_time'] ?? '10:00:00');
                return Carbon::parse("{$nextDate->toDateString()} {$openTime}", $tz);
            }
        }

        return null;
    }

    /**
     * Calculate next closing time if currently open.
     */
    protected function calculateNextClosingTime(Branch $branch, Carbon $now, string $mode, array $todaySchedule): ?Carbon
    {
        $tz = self::TIMEZONE;
        $todayDateStr = $now->toDateString();

        if ($mode === self::MODE_FORCE_OPEN) {
            if ($branch->mode_override_until) {
                return Carbon::parse($branch->mode_override_until, 'UTC')->setTimezone($tz);
            }
            return null; // Open indefinitely
        }

        if ($todaySchedule['is_open_24_hours']) {
            return Carbon::parse("{$todayDateStr} 23:59:59", $tz);
        }

        if (!$todaySchedule['is_closed_all_day'] && $todaySchedule['close_time']) {
            $todayClose = Carbon::parse("{$todayDateStr} {$todaySchedule['close_time']}", $tz);
            return $todayClose;
        }

        return null;
    }
}
