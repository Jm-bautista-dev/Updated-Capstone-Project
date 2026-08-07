import { Activity, BarChart2, Layers, RefreshCw, Zap, Download, Calendar } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ReportsNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    dateRange: string;
    onDateRangeChange: (range: string) => void;
    onExportData?: () => void;
    onSyncIntel?: () => void;
}

export function ReportsNavigation({
    activeTab,
    onTabChange,
    dateRange,
    onDateRangeChange,
    onExportData,
    onSyncIntel,
}: ReportsNavigationProps) {
    const tabs = [
        { id: 'overview', label: 'Executive Overview', icon: Activity },
        { id: 'sales', label: 'Sales Intelligence', icon: BarChart2 },
        { id: 'inventory', label: 'Inventory Valuation', icon: Layers },
        { id: 'insights', label: 'AI Predictive Insights', icon: Zap },
        { id: 'activity', label: 'Audit & Telemetry Logs', icon: RefreshCw },
    ];

    return (
        <div className="rounded-3xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 p-5 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors duration-300 space-y-4 font-['Outfit']">
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Category Navigation Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                type="button"
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    'px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-2 shrink-0 border',
                                    isActive
                                        ? 'bg-[#E75480] dark:bg-[#E1062C] text-white border-transparent shadow-xs'
                                        : 'bg-white dark:bg-[#181820] text-[#7D6B6E] dark:text-[#94A3B8] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/40 dark:hover:border-white/20'
                                )}
                            >
                                <Icon className="size-3.5" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right Date Range & Export Controls */}
                <div className="flex items-center gap-3 self-end lg:self-auto flex-wrap">
                    
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-[#7D6B6E] dark:text-[#94A3B8]" />
                        <Select value={dateRange} onValueChange={onDateRangeChange}>
                            <SelectTrigger className="w-36 h-10 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] text-xs font-bold">
                                <SelectValue placeholder="Date Range" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0]">
                                <SelectItem value="7d" className="text-xs font-bold">Last 7 Days</SelectItem>
                                <SelectItem value="30d" className="text-xs font-bold">Last 30 Days</SelectItem>
                                <SelectItem value="90d" className="text-xs font-bold">Last Quarter</SelectItem>
                                <SelectItem value="year" className="text-xs font-bold">Year to Date</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Export & Sync CTAs */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onExportData}
                        className="h-10 px-3.5 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] text-xs font-bold gap-2 cursor-pointer shadow-2xs"
                    >
                        <Download className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
                        <span>Export Report</span>
                    </Button>

                    <Button
                        type="button"
                        onClick={onSyncIntel}
                        className="h-10 px-4 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                    >
                        <RefreshCw className="size-3.5" />
                        <span>Sync Telemetry</span>
                    </Button>

                </div>

            </div>

        </div>
    );
}
