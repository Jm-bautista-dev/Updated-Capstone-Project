import { Calendar, Download, Filter, TrendingUp } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface BranchOption {
    id: number;
    name: string;
}

interface PerformanceHeroProps {
    range: string;
    branchId: string;
    branches?: BranchOption[];
    onRangeChange: (val: string) => void;
    onBranchChange: (val: string) => void;
    onExport: () => void;
}

export function PerformanceHero({
    range,
    branchId,
    branches = [],
    onRangeChange,
    onBranchChange,
    onExport,
}: PerformanceHeroProps) {
    return (
        <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-white via-[#FFF5F7]/80 to-[#FADADD]/40 dark:from-[#121218] dark:via-[#161622]/90 dark:to-[#0A0A10] p-6 sm:p-8 lg:p-10 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_-15px_rgba(231,84,128,0.12)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] backdrop-blur-2xl transition-colors duration-300">
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-linear-to-br from-[#E75480]/20 to-transparent dark:from-[#E1062C]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-linear-to-tr from-[#F8C8DC]/30 to-transparent dark:from-[#FF4F81]/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#FFF5F7] dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                                <TrendingUp className="size-3.5" />
                                Performance Analytics Center
                            </span>
                            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-mono">Live Operational Telemetry</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC] tracking-tight">
                            Staff & Branch Performance
                        </h1>
                        <p className="text-xs sm:text-sm font-medium text-[#7D6B6E] dark:text-[#94A3B8] max-w-xl">
                            Real-time sales velocity, register transaction volume, cashier efficiency rankings, and branch benchmarking.
                        </p>
                    </div>

                    {/* Filter & Export Controls */}
                    <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
                        {/* Range Selector */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold shadow-2xs">
                            <Calendar className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <Select value={range} onValueChange={onRangeChange}>
                                <SelectTrigger className="h-7 border-none bg-transparent shadow-none focus:ring-0 p-0 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] w-28">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="7">Last 7 Days</SelectItem>
                                    <SelectItem value="30">Last 30 Days</SelectItem>
                                    <SelectItem value="all">All Time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Branch Selector */}
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold shadow-2xs">
                            <Filter className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                            <Select value={branchId} onValueChange={onBranchChange}>
                                <SelectTrigger className="h-7 border-none bg-transparent shadow-none focus:ring-0 p-0 text-xs font-bold text-[#3D2C2E] dark:text-[#E2E8F0] w-32">
                                    <SelectValue placeholder="All Branches" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-bold">
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((b) => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Export Button */}
                        <Button
                            onClick={onExport}
                            className="h-10 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                        >
                            <Download className="size-4" />
                            <span>Export Log</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
