import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import {
  FiDownload,
  FiCalendar,
  FiAlertCircle,
  FiLoader,
  FiFilter,
  FiShoppingBag,
  FiCheckCircle,
  FiFileText
} from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface SalesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStatus: string;
  activeBranch: string;
  activeSearch: string;
  branches: Array<{ id: number; name: string }>;
  isAdmin: boolean;
}

interface ExportSummaryResponse {
  success: boolean;
  preset: string;
  label: string;
  from: string;
  to: string;
  count: number;
  total_amount: number;
  branch_name: string;
  status: string;
  error?: string;
}

export function SalesExportModal({
  isOpen,
  onClose,
  activeStatus,
  activeBranch,
  activeSearch,
  branches,
  isAdmin,
}: SalesExportModalProps) {
  const [datePreset, setDatePreset] = useState<string>('today');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>(activeBranch || 'all');
  
  const [summary, setSummary] = useState<ExportSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize date inputs for custom preset
  useEffect(() => {
    if (isOpen) {
      const todayStr = new Date().toISOString().slice(0, 10);
      setDateFrom(todayStr);
      setDateTo(todayStr);
      setSelectedBranch(activeBranch || 'all');
      setValidationError(null);
    }
  }, [isOpen, activeBranch]);

  // Fetch summary estimate
  const fetchSummary = useCallback(async () => {
    setValidationError(null);

    if (datePreset === 'custom') {
      if (!dateFrom || !dateTo) {
        setValidationError('Both start and end dates are required.');
        setSummary(null);
        return;
      }
      if (dateFrom > dateTo) {
        setValidationError('Start date must be earlier than or equal to the end date.');
        setSummary(null);
        return;
      }
    }

    setIsLoadingSummary(true);
    try {
      const params: Record<string, string> = {
        date_preset: datePreset,
        status: activeStatus,
        branch_id: selectedBranch,
        search: activeSearch,
      };

      if (datePreset === 'custom') {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      }

      const response = await axios.get<ExportSummaryResponse>('/sales/export/summary', { params });
      setSummary(response.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setValidationError(err.response.data.error);
      } else {
        setValidationError('Failed to calculate export preview.');
      }
      setSummary(null);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [datePreset, dateFrom, dateTo, selectedBranch, activeStatus, activeSearch]);

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
    }
  }, [isOpen, fetchSummary]);

  const handleExecuteExport = () => {
    if (validationError || (summary && summary.count === 0)) return;

    const params = new URLSearchParams({
      date_preset: datePreset,
      status: activeStatus,
      branch_id: selectedBranch,
      search: activeSearch,
    });

    if (datePreset === 'custom') {
      params.append('date_from', dateFrom);
      params.append('date_to', dateTo);
    }

    const downloadUrl = `/sales/export?${params.toString()}`;
    
    // Trigger download link
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onClose();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-125 bg-white dark:bg-[#0f0f10] border border-rose-100 dark:border-rose-950/40 text-foreground rounded-2xl p-6 shadow-2xl space-y-5">
        
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2 text-[#E75480] dark:text-[#FF4F81]">
            <FiFileText className="size-5" />
            <DialogTitle className="text-lg font-black uppercase tracking-tight">
              Export Sales History
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            Select a date range preset and filter options to download a comprehensive CSV report.
          </DialogDescription>
        </DialogHeader>

        {/* Configuration Controls */}
        <div className="space-y-4">
          
          {/* Preset Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FiCalendar className="size-3.5 text-primary" />
              Date Range Preset
            </Label>
            <Select value={datePreset} onValueChange={(val) => setDatePreset(val)}>
              <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl">
                <SelectItem value="today" className="text-xs font-bold">Today (00:00 – 23:59)</SelectItem>
                <SelectItem value="7_days" className="text-xs font-bold">Last 7 Days (Today + 6 Days)</SelectItem>
                <SelectItem value="30_days" className="text-xs font-bold">Last 30 Days (1 Month)</SelectItem>
                <SelectItem value="1_year" className="text-xs font-bold">Last 1 Year (365 Days)</SelectItem>
                <SelectItem value="custom" className="text-xs font-bold text-primary">Custom Date Range...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range Pickers */}
          {datePreset === 'custom' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-primary/5 border border-primary/15 rounded-xl animate-in fade-in-50 duration-200">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-semibold rounded-lg"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-semibold rounded-lg"
                />
              </div>
            </div>
          )}

          {/* Branch Filter (Admin Only) */}
          {isAdmin && (
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FiFilter className="size-3.5 text-primary" />
                Target Branch Scope
              </Label>
              <Select value={selectedBranch} onValueChange={(val) => setSelectedBranch(val)}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-xs font-bold rounded-xl">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 rounded-xl">
                  <SelectItem value="all" className="text-xs font-bold">All Authorized Branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold">
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Validation Alert */}
          {validationError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold flex items-center gap-2">
              <FiAlertCircle className="size-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Pre-Export Preview Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Export Summary Preview</span>
              {isLoadingSummary && <FiLoader className="size-3.5 text-primary animate-spin" />}
            </div>

            {isLoadingSummary ? (
              <div className="space-y-2 py-1">
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded animate-pulse w-1/2" />
              </div>
            ) : summary ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Selected Range:</span>
                  <span className="font-bold text-foreground">{summary.label}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Branch:</span>
                  <span className="font-bold text-foreground">{summary.branch_name}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Active Status Filter:</span>
                  <span className="font-bold uppercase text-primary">{summary.status}</span>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <FiShoppingBag className="size-3 text-primary" /> Transactions
                    </span>
                    <p className="text-base font-black text-foreground mt-0.5">{summary.count}</p>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg">
                    <span className="text-[9px] font-black uppercase text-muted-foreground flex items-center gap-1">
                      <FiCheckCircle className="size-3 text-emerald-500" /> Total Revenue
                    </span>
                    <p className="text-base font-black text-emerald-500 mt-0.5">{formatCurrency(summary.total_amount)}</p>
                  </div>
                </div>

                {summary.count === 0 && (
                  <p className="text-xs font-semibold text-amber-500 pt-1 text-center">
                    No sales transactions found for the selected period.
                  </p>
                )}
              </div>
            ) : null}
          </div>

        </div>

        {/* Action Buttons */}
        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9.5 px-4 rounded-xl text-xs font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleExecuteExport}
            disabled={isLoadingSummary || !!validationError || (summary !== null && summary.count === 0)}
            className="h-9.5 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md shadow-primary/10"
          >
            <FiDownload className="size-4" />
            Export CSV
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
