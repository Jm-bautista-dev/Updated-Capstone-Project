import { useForm, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Calendar,
    Zap,
    AlertTriangle,
    CheckCircle2,
    X,
    CalendarDays,
    Building2,
    ShieldAlert,
    Trash2,
    Plus,
    Save,
    Sparkles,
    Sun,
    Moon,
    AlertCircle,
} from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export interface BranchScheduleItem {
    id?: number;
    branch_id?: number;
    day_of_week: number;
    day_name?: string;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
    formatted_hours?: string;
}

export interface BranchSpecialScheduleItem {
    id: number;
    branch_id: number;
    date: string;
    formatted_date?: string;
    is_closed_all_day: boolean;
    is_open_24_hours: boolean;
    open_time: string | null;
    close_time: string | null;
    reason: string | null;
    formatted_hours?: string;
}

export interface BranchOperatingStatus {
    branch_id: number;
    branch_name: string;
    status: 'OPEN' | 'CLOSED';
    is_open: boolean;
    is_accepting_orders: boolean;
    operating_mode: 'automatic' | 'force_open' | 'force_closed';
    is_override_active: boolean;
    mode_override_reason: string | null;
    mode_override_until: string | null;
    current_time_ph?: string;
    current_time_display?: string;
    today_hours_display?: string;
    today_opening_time?: string | null;
    today_closing_time?: string | null;
    today_is_closed?: boolean;
    today_is_24_hours?: boolean;
    is_special_schedule?: boolean;
    special_schedule_reason?: string | null;
    status_message?: string;
    next_opening_at?: string | null;
    next_opening_display?: string | null;
    next_closing_at?: string | null;
    next_closing_display?: string | null;
}

export interface ExtendedBranchData {
    id: number;
    name: string;
    address: string | null;
    operating_mode: 'automatic' | 'force_open' | 'force_closed';
    mode_override_reason: string | null;
    mode_override_until: string | null;
    operating_status?: BranchOperatingStatus;
    schedules?: BranchScheduleItem[];
    special_schedules?: BranchSpecialScheduleItem[];
}

interface BranchOperatingHoursModalProps {
    branch: ExtendedBranchData | null;
    open: boolean;
    onClose: () => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function BranchOperatingHoursModal({ branch, open, onClose }: BranchOperatingHoursModalProps) {
    if (!branch) return null;

    const [activeTab, setActiveTab] = useState<'mode' | 'weekly' | 'special'>('mode');
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        targetMode: 'automatic' | 'force_open' | 'force_closed';
        title: string;
        description: string;
    }>({
        isOpen: false,
        targetMode: 'automatic',
        title: '',
        description: '',
    });

    // ── Mode Form ───────────────────────────────────────────────────────────
    const modeForm = useForm({
        operating_mode: branch.operating_mode ?? 'automatic',
        reason: branch.mode_override_reason ?? '',
        duration_hours: '',
    });

    // ── Weekly Schedule Form ────────────────────────────────────────────────
    const defaultSchedules: BranchScheduleItem[] = Array.from({ length: 7 }, (_, i) => {
        const existing = branch.schedules?.find((s) => s.day_of_week === i);
        const isStaCruz = branch.name.toLowerCase().includes('sta') && branch.name.toLowerCase().includes('cruz');
        return {
            day_of_week: i,
            day_name: DAY_NAMES[i],
            open_time: existing?.open_time ? existing.open_time.substring(0, 5) : '10:00',
            close_time: existing?.close_time ? existing.close_time.substring(0, 5) : isStaCruz ? '19:45' : '20:00',
            is_closed: Boolean(existing?.is_closed),
        };
    });

    const weeklyForm = useForm({
        schedules: defaultSchedules,
    });

    // ── Special Schedule Form ───────────────────────────────────────────────
    const specialForm = useForm({
        date: '',
        type: 'closed_all_day' as 'closed_all_day' | 'open_24_hours' | 'custom_hours',
        open_time: '10:00',
        close_time: '23:59',
        reason: '',
    });

    const currentStatus = branch.operating_status;
    const isBranchOpen = currentStatus?.is_open ?? false;
    const currentMode = currentStatus?.operating_mode ?? branch.operating_mode ?? 'automatic';

    const handleModeSelect = (mode: 'automatic' | 'force_open' | 'force_closed') => {
        if (mode === currentMode) return;

        if (mode === 'force_closed') {
            setConfirmModal({
                isOpen: true,
                targetMode: 'force_closed',
                title: `Force Close ${branch.name}?`,
                description: 'Customers will no longer be able to place new orders while the branch is forced closed.',
            });
        } else if (mode === 'force_open') {
            setConfirmModal({
                isOpen: true,
                targetMode: 'force_open',
                title: `Force Open ${branch.name}?`,
                description: 'This will allow customers to place orders outside the regular schedule.',
            });
        } else {
            // Return to Automatic
            applyModeUpdate('automatic');
        }
    };

    const applyModeUpdate = (mode: 'automatic' | 'force_open' | 'force_closed') => {
        modeForm.setData('operating_mode', mode);
        modeForm.post(`/branches/${branch.id}/operating-mode`, {
            preserveScroll: true,
            onSuccess: () => {
                setConfirmModal({ isOpen: false, targetMode: 'automatic', title: '', description: '' });
            },
        });
    };

    const handleSaveWeeklySchedule = (e: React.FormEvent) => {
        e.preventDefault();
        weeklyForm.put(`/branches/${branch.id}/regular-hours`, {
            preserveScroll: true,
        });
    };

    const handleCreateSpecialSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        specialForm.post(`/branches/${branch.id}/special-hours`, {
            preserveScroll: true,
            data: {
                date: specialForm.data.date,
                is_closed_all_day: specialForm.data.type === 'closed_all_day',
                is_open_24_hours: specialForm.data.type === 'open_24_hours',
                open_time: specialForm.data.type === 'custom_hours' ? specialForm.data.open_time : null,
                close_time: specialForm.data.type === 'custom_hours' ? specialForm.data.close_time : null,
                reason: specialForm.data.reason,
            },
            onSuccess: () => {
                specialForm.reset();
            },
        });
    };

    const handleDeleteSpecialSchedule = (specialId: number, dateStr: string) => {
        if (confirm(`Remove special schedule override for ${dateStr}?`)) {
            router.delete(`/branches/${branch.id}/special-hours/${specialId}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] flex flex-col p-0 rounded-3xl bg-white dark:bg-[#121218] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xl overflow-hidden font-['Outfit']">
                {/* Header Section */}
                <div className="p-6 sm:p-7 bg-linear-to-br from-[#FFF5F7] via-white to-[#FADADD]/30 dark:from-[#1A1A26] dark:via-[#14141E] dark:to-[#181824] border-b border-[#F8C8DC]/50 dark:border-white/10 shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Branch Info & Live Status */}
                        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                            <div className="size-12 sm:size-13 rounded-2xl bg-linear-to-br from-[#FADADD]/70 to-[#FFF0F5] dark:from-[#E1062C]/20 dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] shadow-2xs shrink-0">
                                <Clock className="size-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DialogTitle className="text-xl sm:text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                                        {branch.name}
                                    </DialogTitle>
                                    <Badge
                                        className={`px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-full border shadow-2xs ${
                                            isBranchOpen
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                        }`}
                                    >
                                        <span className={`size-2 rounded-full mr-1.5 inline-block ${isBranchOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                        {isBranchOpen ? 'Open Now' : 'Closed'}
                                    </Badge>
                                </div>
                                <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span>Today: <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus?.today_hours_display ?? '10:00 AM — 8:00 PM'}</strong></span>
                                    <span>•</span>
                                    <span>Mode: <strong className="uppercase font-bold text-[#E75480] dark:text-[#FF4F81]">{currentMode.replace('_', ' ')}</strong></span>
                                    {currentStatus?.current_time_display && (
                                        <>
                                            <span>•</span>
                                            <span>PH Time: <strong className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus.current_time_display}</strong></span>
                                        </>
                                    )}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Tab Segmented Switcher */}
                        <div className="flex items-center gap-1 p-1 bg-[#FFF0F5] dark:bg-[#1E1E2C] border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl shrink-0">
                            <button
                                type="button"
                                onClick={() => setActiveTab('mode')}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    activeTab === 'mode'
                                        ? 'bg-[#E75480] text-white shadow-xs'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                                }`}
                            >
                                <Zap className="size-3.5" />
                                <span>Instant Override</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('weekly')}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    activeTab === 'weekly'
                                        ? 'bg-[#E75480] text-white shadow-xs'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                                }`}
                            >
                                <Calendar className="size-3.5" />
                                <span>Weekly Hours</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('special')}
                                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    activeTab === 'special'
                                        ? 'bg-[#E75480] text-white shadow-xs'
                                        : 'text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC]'
                                }`}
                            >
                                <Sparkles className="size-3.5" />
                                <span>Special Dates</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Contents - Scrollable Body */}
                <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
                    {/* Tab 1: Live Status & Override */}
                    {activeTab === 'mode' && (
                        <div className="space-y-6">
                            {/* Live Status Hero Card */}
                            <div className={`p-5 rounded-3xl border transition-all ${
                                currentMode === 'force_open'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-500/15'
                                    : currentMode === 'force_closed'
                                    ? 'bg-rose-500/10 border-rose-500/30 dark:bg-rose-500/15'
                                    : 'bg-[#FFF5F7]/80 dark:bg-[#181820]/80 border-[#F8C8DC]/60 dark:border-white/10'
                            }`}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`size-3 rounded-full ${isBranchOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                            <h3 className="text-lg sm:text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {currentStatus?.status_message || (isBranchOpen ? 'Store is Open' : 'Store is Closed')}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium leading-relaxed">
                                            Philippine Time: <strong className="font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus?.current_time_display ?? new Date().toLocaleTimeString()}</strong>
                                            {currentStatus?.next_closing_display && (
                                                <span> • Next closing: <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus.next_closing_display}</strong></span>
                                            )}
                                            {currentStatus?.next_opening_display && (
                                                <span> • Next opening: <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus.next_opening_display}</strong></span>
                                            )}
                                        </p>
                                    </div>

                                    <Badge variant="outline" className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl border-[#F8C8DC]/80 dark:border-white/20 self-start sm:self-auto uppercase tracking-wide">
                                        Mode: {currentMode.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </div>

                            {/* Mode Selection Cards */}
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Operating Mode Selection
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Automatic Card */}
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelect('automatic')}
                                        className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                            currentMode === 'automatic'
                                                ? 'bg-[#FFF5F7] dark:bg-[#E75480]/10 border-[#E75480] ring-2 ring-[#E75480]/30 shadow-md'
                                                : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/50 dark:border-white/10 hover:border-[#E75480]/60 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                                ⚙️
                                            </div>
                                            {currentMode === 'automatic' && (
                                                <Badge className="bg-[#E75480] hover:bg-[#E75480] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">ACTIVE</Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">Automatic</h4>
                                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-1 font-medium leading-relaxed">
                                                Follows standard weekly operating hours and special holiday overrides.
                                            </p>
                                        </div>
                                    </button>

                                    {/* Force Open Card */}
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelect('force_open')}
                                        className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                            currentMode === 'force_open'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md'
                                                : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/50 dark:border-white/10 hover:border-emerald-500/60 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                                                ⚡
                                            </div>
                                            {currentMode === 'force_open' && (
                                                <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">ACTIVE</Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">Force Open</h4>
                                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-1 font-medium leading-relaxed">
                                                Overrides schedule to stay open & accept orders outside normal hours.
                                            </p>
                                        </div>
                                    </button>

                                    {/* Force Closed Card */}
                                    <button
                                        type="button"
                                        onClick={() => handleModeSelect('force_closed')}
                                        className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                                            currentMode === 'force_closed'
                                                ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/30 shadow-md'
                                                : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/50 dark:border-white/10 hover:border-rose-500/60 hover:shadow-xs'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="size-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
                                                ⛔
                                            </div>
                                            {currentMode === 'force_closed' && (
                                                <Badge className="bg-rose-600 hover:bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">ACTIVE</Badge>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-base font-black text-[#3D2C2E] dark:text-[#F8FAFC]">Force Closed</h4>
                                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-1 font-medium leading-relaxed">
                                                Emergency shutdown. Immediately halts new customer mobile orders.
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Active Override Info Banner */}
                            {currentMode !== 'automatic' && (
                                <div className="p-5 rounded-2xl bg-[#FFF5F7] dark:bg-[#1C1C28] border border-[#F8C8DC]/60 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                Active Manual Override
                                            </h4>
                                        </div>
                                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                            Reason: <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{currentStatus?.mode_override_reason || 'Manual manager override'}</strong>
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => applyModeUpdate('automatic')}
                                        className="h-10 px-4 rounded-xl text-xs font-bold border-[#F8C8DC] hover:bg-white dark:border-white/10 cursor-pointer shadow-2xs shrink-0"
                                    >
                                        Return to Automatic Schedule
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Weekly Regular Hours */}
                    {activeTab === 'weekly' && (
                        <form onSubmit={handleSaveWeeklySchedule} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        Regular Weekly Operating Hours
                                    </h3>
                                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] mt-0.5">
                                        Set standard opening and closing times for each day of the week.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {weeklyForm.data.schedules.map((schedule, idx) => (
                                    <div
                                        key={schedule.day_of_week}
                                        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                            schedule.is_closed
                                                ? 'bg-black/5 dark:bg-white/5 border-dashed border-[#F8C8DC]/40 dark:border-white/10 opacity-75'
                                                : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs'
                                        }`}
                                    >
                                        <div className="w-32 font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC] flex items-center gap-2.5">
                                            <CalendarDays className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                            <span>{schedule.day_name}</span>
                                        </div>

                                        <div className="flex items-center gap-3 flex-1 justify-end flex-wrap sm:flex-nowrap">
                                            {!schedule.is_closed ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Open</span>
                                                        <Input
                                                            type="time"
                                                            value={schedule.open_time ?? '10:00'}
                                                            onChange={(e) => {
                                                                const updated = [...weeklyForm.data.schedules];
                                                                updated[idx].open_time = e.target.value;
                                                                weeklyForm.setData('schedules', updated);
                                                            }}
                                                            className="h-9 w-28 text-xs font-mono rounded-xl bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                                        />
                                                    </div>
                                                    <span className="text-[#7D6B6E] dark:text-[#94A3B8]">—</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] uppercase font-bold text-[#7D6B6E] dark:text-[#94A3B8]">Close</span>
                                                        <Input
                                                            type="time"
                                                            value={schedule.close_time ?? '20:00'}
                                                            onChange={(e) => {
                                                                const updated = [...weeklyForm.data.schedules];
                                                                updated[idx].close_time = e.target.value;
                                                                weeklyForm.setData('schedules', updated);
                                                            }}
                                                            className="h-9 w-28 text-xs font-mono rounded-xl bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider mr-4">
                                                    CLOSED ALL DAY
                                                </span>
                                            )}

                                            <label className="flex items-center gap-2 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] cursor-pointer select-none bg-[#FFF5F7] dark:bg-[#1E1E2C] px-3 py-1.5 rounded-xl border border-[#F8C8DC]/40 dark:border-white/10">
                                                <input
                                                    type="checkbox"
                                                    checked={schedule.is_closed}
                                                    onChange={(e) => {
                                                        const updated = [...weeklyForm.data.schedules];
                                                        updated[idx].is_closed = e.target.checked;
                                                        weeklyForm.setData('schedules', updated);
                                                    }}
                                                    className="rounded size-4 accent-[#E75480]"
                                                />
                                                <span>Closed</span>
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    type="submit"
                                    disabled={weeklyForm.processing}
                                    className="h-11 px-6 rounded-2xl font-black text-xs uppercase tracking-wider bg-[#E75480] hover:bg-[#D43F6B] text-white cursor-pointer shadow-xs gap-2"
                                >
                                    <Save className="size-4" />
                                    {weeklyForm.processing ? 'Saving...' : 'Save Weekly Schedule'}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Tab 3: Special Date Overrides */}
                    {activeTab === 'special' && (
                        <div className="space-y-6">
                            {/* New Special Schedule Form */}
                            <form onSubmit={handleCreateSpecialSchedule} className="p-5 sm:p-6 rounded-3xl bg-[#FFF5F7]/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-4 shadow-2xs">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        Add Special Date Override (Holidays / Special Events)
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">Target Date</label>
                                        <Input
                                            type="date"
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            value={specialForm.data.date}
                                            onChange={(e) => specialForm.setData('date', e.target.value)}
                                            className="mt-1 h-10 rounded-xl font-mono text-xs bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">Schedule Type</label>
                                        <select
                                            value={specialForm.data.type}
                                            onChange={(e) => specialForm.setData('type', e.target.value as any)}
                                            className="mt-1 w-full h-10 px-3 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] outline-none cursor-pointer"
                                        >
                                            <option value="closed_all_day">Closed All Day (Holiday / Maintenance)</option>
                                            <option value="open_24_hours">Open 24 Hours (All-Day Operation)</option>
                                            <option value="custom_hours">Custom Operating Hours</option>
                                        </select>
                                    </div>
                                </div>

                                {specialForm.data.type === 'custom_hours' && (
                                    <div className="grid grid-cols-2 gap-3.5 pt-1">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">Opening Time</label>
                                            <Input
                                                type="time"
                                                value={specialForm.data.open_time}
                                                onChange={(e) => specialForm.setData('open_time', e.target.value)}
                                                className="mt-1 h-10 rounded-xl font-mono text-xs bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">Closing Time</label>
                                            <Input
                                                type="time"
                                                value={specialForm.data.close_time}
                                                onChange={(e) => specialForm.setData('close_time', e.target.value)}
                                                className="mt-1 h-10 rounded-xl font-mono text-xs bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">Reason / Description (Optional)</label>
                                    <Input
                                        placeholder="e.g. National Heroes Day, Midnight Flash Sale"
                                        value={specialForm.data.reason}
                                        onChange={(e) => specialForm.setData('reason', e.target.value)}
                                        className="mt-1 h-10 rounded-xl text-xs bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10"
                                    />
                                </div>

                                <div className="flex justify-end pt-1">
                                    <Button
                                        type="submit"
                                        disabled={specialForm.processing || !specialForm.data.date}
                                        className="h-10 px-5 rounded-xl font-bold text-xs bg-[#E75480] hover:bg-[#D43F6B] text-white cursor-pointer shadow-xs gap-1.5"
                                    >
                                        <Plus className="size-4" />
                                        {specialForm.processing ? 'Adding...' : 'Add Date Override'}
                                    </Button>
                                </div>
                            </form>

                            {/* Existing Special Overrides List */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] ml-1">
                                    Configured Special Date Schedules ({branch.special_schedules?.length ?? 0})
                                </h4>

                                {(!branch.special_schedules || branch.special_schedules.length === 0) ? (
                                    <div className="p-6 rounded-2xl border border-dashed border-[#F8C8DC]/60 dark:border-white/10 text-center bg-white/50 dark:bg-white/5">
                                        <Calendar className="size-8 text-[#7D6B6E]/30 dark:text-[#94A3B8]/30 mx-auto mb-1.5" />
                                        <p className="text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">No Special Date Schedules</p>
                                        <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] mt-0.5">
                                            This branch currently follows its regular weekly schedule every day.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {branch.special_schedules.map((special) => (
                                            <div
                                                key={special.id}
                                                className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/50 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
                                            >
                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                            {special.formatted_date || special.date}
                                                        </span>
                                                        <Badge
                                                            className={`text-[9px] font-black uppercase ${
                                                                special.is_closed_all_day
                                                                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                                    : special.is_open_24_hours
                                                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                                                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                            }`}
                                                        >
                                                            {special.formatted_hours}
                                                        </Badge>
                                                    </div>
                                                    {special.reason && (
                                                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                                            Reason: {special.reason}
                                                        </p>
                                                    )}
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDeleteSpecialSchedule(special.id, special.date)}
                                                    className="size-8 p-0 rounded-xl text-rose-500 hover:bg-rose-500/10 border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer"
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Confirmation Dialog for Force Mode Changes */}
            <Dialog open={confirmModal.isOpen} onOpenChange={(open) => !open && setConfirmModal({ ...confirmModal, isOpen: false })}>
                <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#181820] border border-white/90 dark:border-white/10 font-['Outfit']">
                    <DialogHeader>
                        <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
                            <AlertTriangle className="size-6" />
                        </div>
                        <DialogTitle className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                            {confirmModal.title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] pt-1">
                            {confirmModal.description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Reason input for override */}
                    <div className="space-y-2 py-2">
                        <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                            Reason for Override (Recorded in Audit Log)
                        </label>
                        <Input
                            placeholder="e.g. Emergency electrical repair, Holiday extension"
                            value={modeForm.data.reason}
                            onChange={(e) => modeForm.setData('reason', e.target.value)}
                            className="h-10 rounded-xl text-xs bg-white dark:bg-[#121218]"
                        />

                        <label className="text-[10px] font-black uppercase text-[#7D6B6E] dark:text-[#94A3B8] pt-2 block">
                            Auto-Expire Override After (Optional)
                        </label>
                        <select
                            value={modeForm.data.duration_hours}
                            onChange={(e) => modeForm.setData('duration_hours', e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium bg-white dark:bg-[#121218] text-[#3D2C2E] dark:text-[#F8FAFC] outline-none"
                        >
                            <option value="">Indefinite (Until manually changed)</option>
                            <option value="1">1 Hour</option>
                            <option value="2">2 Hours</option>
                            <option value="4">4 Hours</option>
                            <option value="8">8 Hours</option>
                            <option value="24">24 Hours</option>
                        </select>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                            className="h-10 px-4 rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => applyModeUpdate(confirmModal.targetMode)}
                            disabled={modeForm.processing}
                            className={`h-10 px-5 rounded-xl font-black text-xs uppercase tracking-wider text-white cursor-pointer ${
                                confirmModal.targetMode === 'force_closed'
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                        >
                            {modeForm.processing ? 'Applying...' : 'Confirm Override'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
