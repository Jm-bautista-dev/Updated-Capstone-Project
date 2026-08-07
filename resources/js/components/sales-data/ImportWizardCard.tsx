import { 
    AlertTriangle, CheckCircle2, Database, Download, Eye, FileText, 
    Maximize2, Minimize2, RefreshCw, Shield, UploadCloud, X 
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type ValidationReport = {
    tempKey: string;
    fileName: string;
    totalRows: number;
    validRowsCount: number;
    invalidRowsCount: number;
    duplicateCount: number;
    errors: { row: number; errors: string[] }[];
    preview: {
        row: number;
        is_valid: boolean;
        errors: string[];
        order_number: string;
        date: string;
        branch: string;
        product: string;
        quantity: number;
        unit_price: number;
        total: number;
        cashier: string | null;
    }[];
};

export type ImportSummaryFlash = {
    imported: number;
    updated: number;
    skipped: number;
    duration: number;
    backupCreated?: string;
};

interface ImportWizardCardProps {
    step: 1 | 2 | 3 | 4;
    setStep: (step: 1 | 2 | 3 | 4) => void;
    file: File | null;
    dragActive: boolean;
    handleDrag: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isValidating: boolean;
    isImporting: boolean;
    validationReport: ValidationReport | null;
    importMode: 'add_new' | 'update' | 'replace_range' | 'replace_all';
    setImportMode: (mode: 'add_new' | 'update' | 'replace_range' | 'replace_all') => void;
    duplicateMode: 'skip' | 'update';
    setDuplicateMode: (mode: 'skip' | 'update') => void;
    dateRangeStart: string;
    setDateRangeStart: (val: string) => void;
    dateRangeEnd: string;
    setDateRangeEnd: (val: string) => void;
    confirmDeleteText: string;
    setConfirmDeleteText: (val: string) => void;
    importSummary: ImportSummaryFlash | null;
    executeImport: () => void;
    cancelWizard: () => void;
    downloadErrorReport: () => void;
    onResetReturn: () => void;
}

export function ImportWizardCard({
    step,
    setStep,
    file,
    dragActive,
    handleDrag,
    handleDrop,
    handleFileChange,
    isValidating,
    isImporting,
    validationReport,
    importMode,
    setImportMode,
    duplicateMode,
    setDuplicateMode,
    dateRangeStart,
    setDateRangeStart,
    dateRangeEnd,
    setDateRangeEnd,
    confirmDeleteText,
    setConfirmDeleteText,
    importSummary,
    executeImport,
    cancelWizard,
    downloadErrorReport,
    onResetReturn,
}: ImportWizardCardProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

    return (
        <Card className="rounded-4xl bg-white/80 dark:bg-[#121218]/80 border border-white/90 dark:border-white/10 shadow-[0_15px_35px_-10px_rgba(231,84,128,0.07)] dark:shadow-[0_15px_35px_-10px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-2xl transition-colors duration-300">
            <CardHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 p-6 sm:p-8 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                        Import Sales Wizard
                    </CardTitle>
                    <CardDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1">
                        Multi-step dataset verification and database pipeline
                    </CardDescription>
                </div>

                {step > 1 && (
                    <Button
                        onClick={cancelWizard}
                        variant="ghost"
                        size="sm"
                        className="h-10 px-4 rounded-xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#3D2C2E] dark:hover:text-[#F8FAFC] cursor-pointer"
                    >
                        <X className="size-4 mr-1.5" /> Reset Wizard
                    </Button>
                )}
            </CardHeader>

            <CardContent className="p-6 sm:p-8">
                {/* Wizard Steps indicator */}
                <div className="flex items-center justify-center gap-4 sm:gap-10 mb-8 border-b border-[#F8C8DC]/40 dark:border-white/10 pb-6 text-xs font-bold uppercase tracking-wider select-none overflow-x-auto">
                    <span className={cn('flex items-center gap-2', step >= 1 ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-[#9E8B8E] dark:text-[#64748B]')}>
                        <div className={cn('size-6 rounded-full flex items-center justify-center border font-mono text-xs font-black', step >= 1 ? 'border-[#E75480] bg-[#E75480] text-white dark:border-[#FF4F81] dark:bg-[#FF4F81]' : 'border-[#F8C8DC] dark:border-white/20 bg-white/50 dark:bg-white/5')}>1</div>
                        <span>Upload File</span>
                    </span>
                    <div className="w-8 sm:w-12 h-0.5 bg-[#F8C8DC]/60 dark:bg-white/10 shrink-0" />
                    <span className={cn('flex items-center gap-2', step >= 2 ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-[#9E8B8E] dark:text-[#64748B]')}>
                        <div className={cn('size-6 rounded-full flex items-center justify-center border font-mono text-xs font-black', step >= 2 ? (isValidating ? 'border-amber-500 bg-amber-500 text-white animate-pulse' : 'border-[#E75480] bg-[#E75480] text-white dark:border-[#FF4F81] dark:bg-[#FF4F81]') : 'border-[#F8C8DC] dark:border-white/20 bg-white/50 dark:bg-white/5')}>2</div>
                        <span>Validate & Mode</span>
                    </span>
                    <div className="w-8 sm:w-12 h-0.5 bg-[#F8C8DC]/60 dark:bg-white/10 shrink-0" />
                    <span className={cn('flex items-center gap-2', step >= 3 ? 'text-[#E75480] dark:text-[#FF4F81]' : 'text-[#9E8B8E] dark:text-[#64748B]')}>
                        <div className={cn('size-6 rounded-full flex items-center justify-center border font-mono text-xs font-black', step >= 3 ? 'border-[#E75480] bg-[#E75480] text-white dark:border-[#FF4F81] dark:bg-[#FF4F81]' : 'border-[#F8C8DC] dark:border-white/20 bg-white/50 dark:bg-white/5')}>3</div>
                        <span>Preview</span>
                    </span>
                    <div className="w-8 sm:w-12 h-0.5 bg-[#F8C8DC]/60 dark:bg-white/10 shrink-0" />
                    <span className={cn('flex items-center gap-2', step >= 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[#9E8B8E] dark:text-[#64748B]')}>
                        <div className={cn('size-6 rounded-full flex items-center justify-center border font-mono text-xs font-black', step >= 4 ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-[#F8C8DC] dark:border-white/20 bg-white/50 dark:bg-white/5')}>4</div>
                        <span>Summary</span>
                    </span>
                </div>

                {/* Step 1: Upload File */}
                {step === 1 && (
                    <div
                        className={cn(
                            'border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center transition-all cursor-pointer space-y-4',
                            dragActive
                                ? 'border-[#E75480] dark:border-[#FF4F81] bg-[#FADADD]/20 dark:bg-[#E1062C]/10'
                                : 'border-[#F8C8DC]/80 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#181820]/40 hover:border-[#E75480]/50 dark:hover:border-white/20'
                        )}
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.txt"
                        />
                        <div className="size-16 rounded-full bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81] flex items-center justify-center mx-auto shadow-inner">
                            <UploadCloud className="size-8 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Drag & drop dataset file here
                            </h3>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium max-w-md mx-auto mt-1">
                                Supports Microsoft Excel (.xlsx, .xls) and standard Comma-Separated Values (.csv, .txt)
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                            }}
                            className="h-11 px-6 bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/10 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                        >
                            Browse Files
                        </Button>
                    </div>
                )}

                {/* Step 2: Validate & Configure */}
                {step === 2 && (
                    <div className="space-y-6">
                        {isValidating ? (
                            <div className="py-12 text-center space-y-4">
                                <RefreshCw className="size-10 text-[#E75480] dark:text-[#FF4F81] animate-spin mx-auto" />
                                <div>
                                    <h4 className="text-lg font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        Validating Uploaded File...
                                    </h4>
                                    <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-1">
                                        Running column checks, numeric conversions, and data integrity scans
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Uploaded File Details Banner */}
                                <div className="p-4 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 rounded-xl bg-[#FADADD]/40 dark:bg-[#E1062C]/15 text-[#E75480] dark:text-[#FF4F81]">
                                            <FileText className="size-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{file?.name}</p>
                                            <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] font-mono mt-0.5">
                                                {((file?.size || 0) / 1024).toFixed(1)} KB — CSV / Excel format
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold text-[10px] uppercase px-3 py-1 rounded-full">
                                        Uploaded
                                    </Badge>
                                </div>

                                {/* Validation Summary Grid */}
                                {validationReport && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-5 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl text-center shadow-2xs">
                                            <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Valid Rows</p>
                                            <h4 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                                                {validationReport.validRowsCount.toLocaleString()}
                                            </h4>
                                            <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] mt-1 font-medium">Ready for dataset import</p>
                                        </div>

                                        <div className="p-5 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl text-center shadow-2xs">
                                            <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Invalid Rows / Errors</p>
                                            <h4 className={cn('text-3xl font-black font-mono mt-1', validationReport.invalidRowsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#3D2C2E] dark:text-[#F8FAFC]')}>
                                                {validationReport.invalidRowsCount.toLocaleString()}
                                            </h4>
                                            <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] mt-1 font-medium">Format issues detected</p>
                                        </div>

                                        <div className="p-5 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl text-center shadow-2xs">
                                            <p className="text-xs font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">File Duplicates</p>
                                            <h4 className={cn('text-3xl font-black font-mono mt-1', validationReport.duplicateCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#3D2C2E] dark:text-[#F8FAFC]')}>
                                                {validationReport.duplicateCount.toLocaleString()}
                                            </h4>
                                            <p className="text-[11px] text-[#9E8B8E] dark:text-[#64748B] mt-1 font-medium">Matching transaction IDs</p>
                                        </div>
                                    </div>
                                )}

                                {/* Error Panel */}
                                {validationReport && validationReport.invalidRowsCount > 0 && (
                                    <div className="p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                                                <AlertTriangle className="size-4 text-rose-500" />
                                                <span>Validation Failures Detected</span>
                                            </div>
                                            <Button
                                                onClick={downloadErrorReport}
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-xl border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-[10px] font-bold uppercase tracking-wider gap-1.5 cursor-pointer"
                                            >
                                                <Download className="size-3.5" /> Error Report (.txt)
                                            </Button>
                                        </div>
                                        <p className="text-xs text-rose-800 dark:text-rose-300/80 font-medium">
                                            Please resolve invalid formatting (unassigned branches, missing products, invalid quantities) in your spreadsheet.
                                        </p>

                                        <div className="max-h-36 overflow-y-auto divide-y divide-rose-200 dark:divide-rose-900/30 text-xs font-mono space-y-1 pt-1">
                                            {validationReport.errors.slice(0, 10).map((err, idx) => (
                                                <div key={idx} className="pt-1.5 flex flex-col gap-0.5">
                                                    <span className="font-bold text-rose-700 dark:text-rose-400">Row {err.row}:</span>
                                                    {err.errors.map((e, eIdx) => (
                                                        <span key={eIdx} className="pl-3 text-rose-800 dark:text-rose-300/70">• {e}</span>
                                                    ))}
                                                </div>
                                            ))}
                                            {validationReport.errors.length > 10 && (
                                                <p className="pt-2 italic text-[#9E8B8E] text-[11px]">
                                                    ...and {validationReport.errors.length - 10} more row errors in file.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Import Strategy Configuration */}
                                {validationReport && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10">
                                        {/* Strategy Selection Cards */}
                                        <div className="space-y-3">
                                            <div>
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                    Import Strategy Mode
                                                </h4>
                                                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                                                    Choose how rows will be processed in the database
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                {[
                                                    { id: 'add_new', label: 'Add New Sales (Recommended)', desc: 'Only import sales that do not exist yet. Skip duplicates.' },
                                                    { id: 'update', label: 'Update Existing Sales', desc: 'If transaction exists, update fields; otherwise insert.' },
                                                    { id: 'replace_range', label: 'Replace Selected Date Range', desc: 'Wipes and replaces database records inside date brackets.' },
                                                    { id: 'replace_all', label: 'Replace All Sales', desc: 'Destructive format: Wipes entire sales table before loading.' },
                                                ].map((m) => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => setImportMode(m.id as 'add_new' | 'update' | 'replace_range' | 'replace_all')}
                                                        className={cn(
                                                            'w-full p-3.5 rounded-2xl border text-left flex flex-col gap-0.5 transition-all text-xs cursor-pointer',
                                                            importMode === m.id
                                                                ? 'bg-[#FFF5F7] dark:bg-[#181820] border-[#E75480] dark:border-[#FF4F81] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                                                : 'bg-white/60 dark:bg-[#181820]/40 border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0] hover:border-[#E75480]/40 dark:hover:border-white/20'
                                                        )}
                                                    >
                                                        <span className="font-bold">{m.label}</span>
                                                        <span className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8]">{m.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Dynamic Strategy Sub-options */}
                                        <div className="space-y-4">
                                            {/* Duplicate Handling Policy */}
                                            {(importMode === 'add_new' || importMode === 'update') && (
                                                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                            Duplicate Handling Strategy
                                                        </p>
                                                        <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                                                            When order number already exists in database
                                                        </p>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setDuplicateMode('skip')}
                                                            className={cn(
                                                                'flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all',
                                                                duplicateMode === 'skip'
                                                                    ? 'bg-[#E75480] dark:bg-[#E1062C] border-transparent text-white shadow-xs'
                                                                    : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]'
                                                            )}
                                                        >
                                                            Skip Duplicate Row
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDuplicateMode('update')}
                                                            className={cn(
                                                                'flex-1 h-9 rounded-xl text-xs font-bold uppercase tracking-wider border cursor-pointer transition-all',
                                                                duplicateMode === 'update'
                                                                    ? 'bg-[#E75480] dark:bg-[#E1062C] border-transparent text-white shadow-xs'
                                                                    : 'bg-white dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-[#7D6B6E] dark:text-[#94A3B8]'
                                                            )}
                                                        >
                                                            Overwrite Duplicate Row
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Date Range Inputs */}
                                            {importMode === 'replace_range' && (
                                                <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 space-y-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                            Target Date Brackets
                                                        </p>
                                                        <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                                                            Records within range are cleared prior to insertion
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Start Date</label>
                                                            <Input
                                                                type="date"
                                                                value={dateRangeStart}
                                                                onChange={(e) => setDateRangeStart(e.target.value)}
                                                                className="h-10 rounded-xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">End Date</label>
                                                            <Input
                                                                type="date"
                                                                value={dateRangeEnd}
                                                                onChange={(e) => setDateRangeEnd(e.target.value)}
                                                                className="h-10 rounded-xl bg-white/70 dark:bg-[#181820]/70 border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Destructive Replace Confirmation */}
                                            {importMode === 'replace_all' && (
                                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-300 space-y-2">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                            <AlertTriangle className="size-4 text-rose-500" /> Destructive Replace Operation
                                                        </p>
                                                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                                                            Type <span className="font-mono font-bold">DELETE ALL SALES</span> to authorize dataset replacement
                                                        </p>
                                                    </div>

                                                    <Input
                                                        value={confirmDeleteText}
                                                        onChange={(e) => setConfirmDeleteText(e.target.value)}
                                                        placeholder="DELETE ALL SALES"
                                                        className="h-10 bg-white dark:bg-[#181820] border-rose-300 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold tracking-widest placeholder-rose-300 uppercase rounded-xl"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Action Bar */}
                                <div className="flex justify-end gap-3 pt-6 border-t border-[#F8C8DC]/40 dark:border-white/10">
                                    <Button
                                        type="button"
                                        onClick={cancelWizard}
                                        variant="outline"
                                        className="h-11 px-6 rounded-2xl font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        disabled={(validationReport?.invalidRowsCount ?? 0) > 0}
                                        className="h-11 px-8 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#E75480]/20 flex items-center gap-2 cursor-pointer"
                                    >
                                        <span>Continue to Preview</span>
                                        <Eye className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Data Preview */}
                {step === 3 && (
                    <div className="space-y-6">
                        {/* File Metadata Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl text-xs shadow-2xs">
                            <div>
                                <p className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC] uppercase">{file?.name}</p>
                                <p className="text-[11px] text-[#7D6B6E] dark:text-[#94A3B8] font-medium mt-0.5">
                                    Mode: <span className="text-[#E75480] dark:text-[#FF4F81] font-bold uppercase">{importMode.replace('_', ' ')}</span> — Valid rows: {validationReport?.validRowsCount} / {validationReport?.totalRows}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex items-center border border-[#F8C8DC]/60 dark:border-white/10 rounded-xl p-1 bg-[#FFF5F7] dark:bg-[#181820]">
                                    <button
                                        type="button"
                                        onClick={() => setDensity('compact')}
                                        className={cn('p-1.5 rounded-lg transition-all cursor-pointer', density === 'compact' ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs' : 'text-[#7D6B6E] dark:text-[#94A3B8]')}
                                    >
                                        <Minimize2 className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDensity('comfortable')}
                                        className={cn('p-1.5 rounded-lg transition-all cursor-pointer', density === 'comfortable' ? 'bg-white dark:bg-[#252532] text-[#E75480] dark:text-[#FF4F81] shadow-xs' : 'text-[#7D6B6E] dark:text-[#94A3B8]')}
                                    >
                                        <Maximize2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid Table Preview */}
                        <div className="border border-[#F8C8DC]/60 dark:border-white/10 rounded-3xl bg-white/80 dark:bg-[#121218]/80 shadow-xs overflow-hidden max-h-96 overflow-y-auto">
                            <table className="w-full text-left border-collapse table-auto">
                                <thead className="bg-[#FFF9FA]/60 dark:bg-[#181820]/60 border-b border-[#F8C8DC]/40 dark:border-white/10 text-[11px] font-bold uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8] sticky top-0 z-10 backdrop-blur-md">
                                    <tr>
                                        <th className="py-3.5 px-5">Row</th>
                                        <th className="py-3.5 px-5">Transaction #</th>
                                        <th className="py-3.5 px-5">Date</th>
                                        <th className="py-3.5 px-5">Branch</th>
                                        <th className="py-3.5 px-5">Product</th>
                                        <th className="py-3.5 px-5 text-right">Qty</th>
                                        <th className="py-3.5 px-5 text-right">Unit Price</th>
                                        <th className="py-3.5 px-5 text-right">Total</th>
                                        <th className="py-3.5 px-5 text-center">Cashier</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F8C8DC]/30 dark:divide-white/5 text-xs">
                                    {validationReport?.preview.map((pRow, pIdx) => (
                                        <tr
                                            key={pIdx}
                                            className={cn(
                                                'hover:bg-[#FFF5F7]/70 dark:hover:bg-white/5 transition-all duration-150',
                                                !pRow.is_valid ? 'bg-rose-50 dark:bg-rose-950/20' : ''
                                            )}
                                        >
                                            <td className="py-3 px-5 font-mono text-[#9E8B8E] dark:text-[#64748B]">Row {pRow.row}</td>
                                            <td className="py-3 px-5 font-bold font-mono text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                {pRow.order_number}
                                            </td>
                                            <td className="py-3 px-5 text-[#7D6B6E] dark:text-[#94A3B8]">{pRow.date}</td>
                                            <td className="py-3 px-5 font-bold text-[#3D2C2E] dark:text-[#E2E8F0]">{pRow.branch}</td>
                                            <td className="py-3 px-5 font-bold text-[#3D2C2E] dark:text-[#F8FAFC] uppercase">{pRow.product}</td>
                                            <td className="py-3 px-5 text-right font-mono font-bold">{pRow.quantity}</td>
                                            <td className="py-3 px-5 text-right font-mono font-bold">{pRow.unit_price}</td>
                                            <td className="py-3 px-5 text-right font-mono font-black text-[#E75480] dark:text-[#FF4F81]">{pRow.total}</td>
                                            <td className="py-3 px-5 text-center text-[#9E8B8E] dark:text-[#64748B] italic">{pRow.cashier || 'System'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center pt-6 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">
                                Preview limit: first 100 entries
                            </span>
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    variant="outline"
                                    className="h-11 px-6 rounded-2xl font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={executeImport}
                                    disabled={isImporting}
                                    className="h-11 px-8 rounded-2xl bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#E75480]/20 flex items-center gap-2 cursor-pointer"
                                >
                                    {isImporting ? (
                                        <>Importing... <RefreshCw className="size-4 animate-spin" /></>
                                    ) : (
                                        <>Execute Dataset Import <Database className="size-4" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Summary Report */}
                {step === 4 && importSummary && (
                    <div className="py-8 text-center space-y-6 max-w-md mx-auto">
                        <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                            <CheckCircle2 className="size-10" />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC]">
                                Import Complete!
                            </h3>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
                                Processed in {importSummary.duration} seconds
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 border border-[#F8C8DC]/60 dark:border-white/10 p-5 rounded-2xl bg-white/80 dark:bg-[#181820]/80 shadow-2xs font-mono">
                            <div className="text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">Imported</span>
                                <p className="text-2xl font-black text-[#3D2C2E] dark:text-[#F8FAFC] mt-1">{importSummary.imported.toLocaleString()}</p>
                            </div>
                            <div className="text-center border-x border-[#F8C8DC]/40 dark:border-white/10">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">Updated</span>
                                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{importSummary.updated.toLocaleString()}</p>
                            </div>
                            <div className="text-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E8B8E] dark:text-[#64748B]">Skipped</span>
                                <p className="text-2xl font-black text-[#7D6B6E] dark:text-[#94A3B8] mt-1">{importSummary.skipped.toLocaleString()}</p>
                            </div>
                        </div>

                        {importSummary.backupCreated && (
                            <div className="p-4 bg-white/80 dark:bg-[#181820]/80 border border-[#F8C8DC]/60 dark:border-white/10 rounded-2xl flex items-center justify-between text-left text-xs gap-3 shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <Shield className="text-emerald-500 size-5 shrink-0" />
                                    <div>
                                        <p className="font-bold text-[10px] uppercase tracking-wider text-[#7D6B6E] dark:text-[#94A3B8]">Safety Snapshot Backup</p>
                                        <p className="font-mono text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{importSummary.backupCreated}</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase rounded-full">Active</Badge>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                onClick={cancelWizard}
                                className="flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-wider bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white shadow-lg shadow-[#E75480]/20 cursor-pointer"
                            >
                                Process Another File
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onResetReturn}
                                className="flex-1 h-12 rounded-2xl font-bold text-xs uppercase tracking-wider border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                            >
                                Done & Return
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
