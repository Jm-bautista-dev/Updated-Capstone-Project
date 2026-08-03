import React, { useState, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import type { Page } from '@inertiajs/core';
import axios from 'axios';
import { format } from 'date-fns';
import {
  FiDatabase,
  FiUploadCloud,
  FiCheckCircle,
  FiAlertTriangle,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiClock,
  FiFileText,
  FiDownload,
  FiX,
  FiUser,
  FiCalendar,
  FiShield,
  FiMaximize2,
  FiMinimize2
} from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type ImportHistoryItem = {
  id: number;
  uploaded_by: number;
  file_name: string;
  import_mode: string;
  records_imported: number;
  records_updated: number;
  records_skipped: number;
  status: 'success' | 'failed' | 'rolled_back';
  created_at: string;
  user?: {
    name: string;
  };
};

type AuditLogItem = {
  id: number;
  user_id: number;
  ip_address: string | null;
  action: string;
  details: string;
  created_at: string;
  user?: {
    name: string;
  };
};

type BackupItem = {
  id: number;
  backup_name: string;
  file_path: string;
  records_count: number;
  created_at: string;
};

type ImportSummaryFlash = {
  imported: number;
  updated: number;
  skipped: number;
  duration: number;
  backupCreated?: string;
};

type PageProps = {
  stats: {
    total_sales_records: number;
    last_import_date: string | null;
    last_imported_by: string | null;
    duplicate_records_detected: number;
    data_integrity_status: string;
  };
  importsHistory: ImportHistoryItem[];
  auditLogs: AuditLogItem[];
  backups: BackupItem[];
  flash?: { importResult?: ImportSummaryFlash };
};

export default function SalesDataManagementIndex() {
  const { stats, importsHistory, auditLogs, backups } = usePage<PageProps>().props;

  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Validate/Configure, 3: Preview, 4: Summary
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingBackup, setIsDeletingBackup] = useState(false);

  // Validation report state
  type ValidationReport = {
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
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

  // Import configuration parameters
  const [importMode, setImportMode] = useState<'add_new' | 'update' | 'replace_range' | 'replace_all'>('add_new');
  const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [confirmDeleteText, setConfirmDeleteText] = useState('');

  // Execution result state
  const [importSummary, setImportSummary] = useState<ImportSummaryFlash | null>(null);

  // Density control
  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable');

  const fileInputRef = useRef<HTMLInputElement>(null);



  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelected(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext || '')) {
      alert("Invalid file format. Please upload CSV or Excel files.");
      return;
    }
    setFile(selectedFile);
    triggerValidation(selectedFile);
  };

  const triggerValidation = (uploadFile: File) => {
    setIsValidating(true);
    setStep(2);
    
    const formData = new FormData();
    formData.append('file', uploadFile);

    // Call validation endpoint via AJAX
    axios.post('/admin/sales-data/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then((response: { data: ValidationReport }) => {
      setValidationReport(response.data);
      setIsValidating(false);
    })
    .catch((err: { response?: { data?: { error?: string } } }) => {
      alert(err.response?.data?.error || "Validation failed. Please verify file columns.");
      setFile(null);
      setStep(1);
      setIsValidating(false);
    });
  };

  const executeImport = () => {
    if (!validationReport?.tempKey) return;
    
    if (importMode === 'replace_all' && confirmDeleteText !== 'DELETE ALL SALES') {
      alert("Please type the confirmation string exactly.");
      return;
    }

    setIsImporting(true);

    router.post('/admin/sales-data/import', {
      tempKey: validationReport.tempKey,
      importMode,
      duplicateMode,
      dateRangeStart,
      dateRangeEnd,
      confirmText: confirmDeleteText
    }, {
      onSuccess: (page: Page<PageProps>) => {
        setIsImporting(false);

        // Grab import result details from response (passed back on completion)
        const summary: ImportSummaryFlash = (page.props.flash as PageProps['flash'])?.importResult ?? {
          imported: validationReport?.validRowsCount ?? 0,
          updated: importMode === 'update' ? (validationReport?.duplicateCount ?? 0) : 0,
          skipped: importMode === 'add_new' ? (validationReport?.duplicateCount ?? 0) : 0,
          duration: 1.2
        };

        setImportSummary(summary);
        setStep(4);
      },
      onError: (errors: Record<string, string>) => {
        setIsImporting(false);
        alert(errors.error || "Import failed. Check logs for details.");
      }
    });
  };

  const restoreSnapshot = (backupId: number) => {
    if (!confirm("Are you sure you want to restore this database snapshot? All current sales records will be replaced with the snapshot data.")) {
      return;
    }

    setIsRestoring(true);
    router.post('/admin/sales-data/restore/' + backupId, {}, {
      onFinish: () => setIsRestoring(false),
      onSuccess: () => alert("Snapshot restored successfully!")
    });
  };

  const deleteSnapshot = (backupId: number) => {
    if (!confirm("Are you sure you want to permanently delete this snapshot backup file?")) {
      return;
    }

    setIsDeletingBackup(true);
    router.delete('/admin/sales-data/backup/' + backupId, {
      onFinish: () => setIsDeletingBackup(false),
      onSuccess: () => alert("Snapshot deleted.")
    });
  };

  const cancelWizard = () => {
    setFile(null);
    setValidationReport(null);
    setImportSummary(null);
    setConfirmDeleteText('');
    setStep(1);
  };

  const downloadErrorReport = () => {
    if (!validationReport?.errors) return;
    
    let content = "Maki Desu Sales Data Management - Validation Error Report\n";
    content += `File Name: ${validationReport.fileName}\n`;
    content += `Date: ${new Date().toLocaleString()}\n`;
    content += `Total Rows: ${validationReport.totalRows}\n`;
    content += `Valid Rows: ${validationReport.validRowsCount}\n`;
    content += `Invalid Rows: ${validationReport.invalidRowsCount}\n\n`;
    content += "=========================================================\n\n";

    validationReport.errors.forEach((err: { row: number; errors: string[] }) => {
      content += `Row ${err.row}:\n`;
      err.errors.forEach((e: string) => {
        content += `  - ${e}\n`;
      });
      content += "\n";
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validation_errors_${validationReport.fileName.replace(/\.[^/.]+$/, "")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'Sales Data Management', href: '/admin/sales-data' }]}>
      <Head title="Sales Data Management" />

      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background font-sans text-(--ops-text-secondary)">
        
        {/* -- Header Area -- */}
        <div className="flex flex-row items-center justify-between gap-4 p-4 sm:p-6 sm:px-8 bg-(--ops-surface-sunken) border-b border-(--ops-border) shrink-0">
          <div className="flex items-center gap-3">
            <FiDatabase className="text-primary size-6 animate-pulse" />
            <div>
              <h1 className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter text-foreground leading-none">Sales Data Management</h1>
              <p className="hidden sm:block text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">
                Dataset import, validation, maintenance, audits, and database recovery
              </p>
            </div>
          </div>
        </div>

        {/* -- Content Layout -- */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
            <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-23.75">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Total Sales Records</p>
                <FiDatabase className="size-3.5 text-(--ops-text-secondary)" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-foreground tabular-nums leading-none">{stats.total_sales_records.toLocaleString()}</h3>
                <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Active database rows</p>
              </div>
            </div>

            <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-23.75">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Last Import Date</p>
                <FiCalendar className="size-3.5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-black text-foreground leading-none">
                  {stats.last_import_date ? format(new Date(stats.last_import_date), 'MMM dd, HH:mm') : 'Never'}
                </h3>
                <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">Telemetry last sync</p>
              </div>
            </div>

            <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-23.75">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Last Imported By</p>
                <FiUser className="size-3.5 text-(--ops-text-secondary)" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground truncate leading-none">{stats.last_imported_by || 'None'}</h3>
                <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1.5 tracking-widest">Admin operator</p>
              </div>
            </div>

            <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-23.75">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Duplicates Detected</p>
                <FiAlertTriangle className={cn("size-3.5", stats.duplicate_records_detected > 0 ? "text-amber-500" : "text-(--ops-text-faint)")} />
              </div>
              <div>
                <h3 className={cn("text-2xl font-black tabular-nums leading-none", stats.duplicate_records_detected > 0 ? "text-amber-500" : "text-foreground")}>
                  {stats.duplicate_records_detected}
                </h3>
                <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-widest">In database records</p>
              </div>
            </div>

            <div className="bg-(--ops-surface-raised) border border-(--ops-border) rounded-[14px] p-4 relative shadow-sm flex flex-col justify-between min-h-23.75">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--ops-text-muted)">Data Integrity</p>
                <FiShield className="size-3.5 text-emerald-500" />
              </div>
              <div>
                <Badge className={cn(
                  "font-black text-[9px] uppercase px-2 py-0.5 rounded-[6px] border bg-transparent leading-none",
                  stats.data_integrity_status === 'Optimal' 
                    ? "text-emerald-500 border-emerald-500/10" 
                    : "text-amber-500 border-amber-500/10"
                )}>
                  {stats.data_integrity_status}
                </Badge>
                <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1.5 tracking-widest">Dataset validation scale</p>
              </div>
            </div>
          </div>

          {/* IMPORT WIZARD MODULE */}
          <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden shadow-sm">
            <CardHeader className="border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Import Sales Wizard</CardTitle>
                <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Multi-step operations pipeline</CardDescription>
              </div>
              {step > 1 && (
                <Button 
                  onClick={cancelWizard} 
                  variant="ghost" 
                  size="sm" 
                  className="h-8.5 rounded-[8px] bg-(--ops-surface-sunken) border border-(--ops-border) text-[9px] font-black uppercase text-(--ops-text-secondary) hover:text-foreground"
                >
                  <FiX className="size-3 mr-1" /> Reset Wizard
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-6">
              
              {/* Wizard Steps indicator */}
              <div className="flex items-center justify-center gap-10 mb-8 border-b border-(--ops-border-subtle) pb-6 text-(--ops-text-muted) font-bold text-[10px] uppercase select-none">
                <span className={cn("flex items-center gap-2", step >= 1 ? "text-foreground font-black" : "")}>
                  <div className={cn("size-5 rounded-full flex items-center justify-center border font-mono", step >= 1 ? "border-primary bg-primary text-foreground" : "border-(--ops-border-subtle) bg-(--ops-surface-sunken)")}>1</div>
                  Upload File
                </span>
                <div className="w-12 h-0.5 bg-(--ops-chip-active-bg)" />
                <span className={cn("flex items-center gap-2", step >= 2 ? "text-foreground font-black" : "")}>
                  <div className={cn("size-5 rounded-full flex items-center justify-center border font-mono", step >= 2 ? (isValidating ? "border-amber-500 bg-amber-500 animate-pulse text-foreground" : "border-primary bg-primary text-foreground") : "border-(--ops-border-subtle) bg-(--ops-surface-sunken)")}>2</div>
                  Validate & Mode
                </span>
                <div className="w-12 h-0.5 bg-(--ops-chip-active-bg)" />
                <span className={cn("flex items-center gap-2", step >= 3 ? "text-foreground font-black" : "")}>
                  <div className={cn("size-5 rounded-full flex items-center justify-center border font-mono", step >= 3 ? "border-primary bg-primary text-foreground" : "border-(--ops-border-subtle) bg-(--ops-surface-sunken)")}>3</div>
                  Preview
                </span>
                <div className="w-12 h-0.5 bg-(--ops-chip-active-bg)" />
                <span className={cn("flex items-center gap-2", step >= 4 ? "text-foreground font-black" : "")}>
                  <div className={cn("size-5 rounded-full flex items-center justify-center border font-mono", step >= 4 ? "border-emerald-500 bg-emerald-500 text-foreground" : "border-(--ops-border-subtle) bg-(--ops-surface-sunken)")}>4</div>
                  Summary
                </span>
              </div>

              {/* Step 1: Upload File */}
              {step === 1 && (
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
                    dragActive ? "border-primary bg-primary/5" : "border-(--ops-border) bg-(--ops-surface-sunken) hover:border-zinc-700"
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
                  <FiUploadCloud className="size-12 text-(--ops-text-faint) mx-auto mb-4 animate-pulse" />
                  <p className="text-base font-black italic uppercase tracking-tighter text-foreground">Drag & drop dataset file here</p>
                  <p className="text-[9px] text-(--ops-text-muted) font-bold uppercase tracking-widest mt-1">Supports Excel (.xlsx, .xls) and standard Comma-Separated Values (.csv)</p>
                  
                  <Button 
                    className="mt-6 h-9.5 rounded-[10px] px-6 bg-(--ops-surface-sunken) border border-(--ops-border) text-[10px] font-black uppercase tracking-wider text-(--ops-text-secondary) hover:text-foreground"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Browse Files
                  </Button>
                </div>
              )}

              {/* Step 2: Validate & Configure */}
              {step === 2 && (
                <div className="space-y-6">
                  
                  {isValidating ? (
                    <div className="py-10 text-center space-y-4">
                      <FiRefreshCw className="size-10 text-primary animate-spin mx-auto" />
                      <div>
                        <p className="text-base font-black italic uppercase tracking-tighter text-(--ops-text-secondary)">Validating Uploaded File...</p>
                        <p className="text-[9px] text-(--ops-text-faint) font-bold uppercase tracking-wider mt-1">Running column check, data conversions, and integrity scans</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* File Details */}
                      <div className="p-4 bg-(--ops-thead-bg) border border-(--ops-border-subtle) rounded-[10px] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <FiFileText className="size-5 text-primary" />
                          <div>
                            <p className="font-bold text-foreground uppercase">{file?.name}</p>
                            <p className="text-[9px] text-(--ops-text-muted) font-mono mt-0.5">{((file?.size || 0) / 1024).toFixed(1)} KB � CSV / Excel format</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 font-black text-[8px] uppercase px-2 py-0.5 rounded-[6px]">Uploaded</Badge>
                      </div>

                      {/* Validation results summary */}
                      {validationReport && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-(--ops-surface-sunken)/30 border border-(--ops-border-subtle) rounded-[10px] text-center">
                            <p className="text-[8px] font-black uppercase text-(--ops-text-muted) tracking-wider">Valid Rows</p>
                            <h4 className="text-2xl font-black text-emerald-500 font-mono mt-1">{validationReport.validRowsCount.toLocaleString()}</h4>
                            <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-wider">Ready to import</p>
                          </div>
                          
                          <div className="p-4 bg-(--ops-surface-sunken)/30 border border-(--ops-border-subtle) rounded-[10px] text-center">
                            <p className="text-[8px] font-black uppercase text-(--ops-text-muted) tracking-wider">Invalid Rows / Errors</p>
                            <h4 className={cn("text-2xl font-black font-mono mt-1", validationReport.invalidRowsCount > 0 ? "text-rose-500" : "text-foreground")}>
                              {validationReport.invalidRowsCount.toLocaleString()}
                            </h4>
                            <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-wider">Format errors found</p>
                          </div>

                          <div className="p-4 bg-(--ops-surface-sunken)/30 border border-(--ops-border-subtle) rounded-[10px] text-center">
                            <p className="text-[8px] font-black uppercase text-(--ops-text-muted) tracking-wider">File Duplicates</p>
                            <h4 className={cn("text-2xl font-black font-mono mt-1", validationReport.duplicateCount > 0 ? "text-amber-500" : "text-foreground")}>
                              {validationReport.duplicateCount.toLocaleString()}
                            </h4>
                            <p className="text-[7px] text-(--ops-text-faint) font-bold uppercase mt-1 tracking-wider">Duplicate Transaction IDs</p>
                          </div>
                        </div>
                      )}

                      {/* Error panel if invalid rows exist */}
                      {validationReport && validationReport.invalidRowsCount > 0 && (
                        <div className="p-4.5 bg-rose-500/5 border border-rose-500/15 rounded-xl text-rose-500 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FiAlertTriangle className="size-4" />
                              <span className="text-[10px] font-black uppercase tracking-wider">Validation Failures Detected</span>
                            </div>
                            <Button 
                              onClick={downloadErrorReport} 
                              variant="outline" 
                              size="sm" 
                              className="h-7.5 rounded-[8px] border-rose-500/20 bg-rose-950/20 hover:bg-rose-900 hover:text-foreground text-[8px] font-black uppercase"
                            >
                              <FiDownload className="size-3.5 mr-1" /> Error Report (.txt)
                            </Button>
                          </div>
                          <p className="text-[10px] leading-normal font-semibold text-(--ops-text-secondary)">
                            Please fix format issues (invalid branches, missing product names, invalid quantity sizes, duplicate orders) inside your spreadsheet before final import. Widespread database import is prevented if invalid records exist.
                          </p>
                          
                          <div className="max-h-36 overflow-y-auto divide-y divide-rose-500/10 font-mono text-[9px] text-(--ops-text-secondary) space-y-1.5">
                            {validationReport.errors.slice(0, 10).map((err: { row: number; errors: string[] }, idx: number) => (
                              <div key={idx} className="pt-1.5 flex flex-col gap-0.5">
                                <span className="font-bold text-rose-500">Row {err.row}:</span>
                                {err.errors.map((e: string, eIdx: number) => (
                                  <span key={eIdx} className="pl-3">� {e}</span>
                                ))}
                              </div>
                            ))}
                            {validationReport.errors.length > 10 && (
                              <p className="pt-2 italic text-(--ops-text-muted)">...and {validationReport.errors.length - 10} more row errors in file.</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Configurations Block */}
                      {validationReport && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-(--ops-border-subtle)">
                          
                          {/* Mode Configuration */}
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-foreground">Import Configuration Mode</p>
                              <p className="text-[8px] font-bold text-(--ops-text-muted) uppercase tracking-wide mt-0.5">Select how rows are processed in DB</p>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {[
                                { id: 'add_new', label: 'Add New Sales (Recommended)', desc: 'Only import sales that do not exist yet. Skip duplicates.' },
                                { id: 'update', label: 'Update Existing Sales', desc: 'If transaction exists, update fields; otherwise insert.' },
                                { id: 'replace_range', label: 'Replace Selected Date Range', desc: 'Wipes and replaces database records inside date brackets.' },
                                { id: 'replace_all', label: 'Replace All Sales', desc: 'Destructive format: Wipes entire sales table before loading.' }
                              ].map(m => (
                                <button
                                  key={m.id}
                                  onClick={() => setImportMode(m.id as 'add_new' | 'update' | 'replace_range' | 'replace_all')}
                                  className={cn(
                                    "p-3 rounded-lg border text-left flex flex-col gap-0.5 transition-all text-xs",
                                    importMode === m.id 
                                      ? "bg-primary/5 border-primary text-foreground" 
                                      : "bg-(--ops-surface-sunken)/30 border-(--ops-border-subtle) text-(--ops-text-secondary) hover:border-(--ops-border) hover:text-foreground"
                                  )}
                                >
                                  <span className="font-black tracking-tight">{m.label}</span>
                                  <span className="text-[9px] text-(--ops-text-muted)">{m.desc}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Dynamic Input Details based on mode */}
                          <div className="space-y-4">
                            
                            {/* Duplicate Policy */}
                            {(importMode === 'add_new' || importMode === 'update') && (
                              <div className="space-y-2 bg-(--ops-surface-sunken)/20 p-4 border border-(--ops-border-subtle) rounded-[10px]">
                                <div>
                                  <p className="text-[9px] font-black uppercase text-(--ops-text-secondary)">Duplicate Handling Strategy</p>
                                  <p className="text-[7px] text-(--ops-text-muted) font-bold uppercase mt-0.5">When matching order number exists in database</p>
                                </div>
                                <div className="flex gap-2.5 pt-1.5">
                                  <button
                                    onClick={() => setDuplicateMode('skip')}
                                    className={cn(
                                      "flex-1 h-8 rounded-[8px] text-[8px] font-black uppercase tracking-wider border",
                                      duplicateMode === 'skip' 
                                        ? "bg-(--ops-chip-active-bg) border-zinc-700 text-foreground" 
                                        : "bg-(--ops-surface-sunken) border-(--ops-border-subtle) text-(--ops-text-muted) hover:text-foreground"
                                    )}
                                  >
                                    Skip Duplicate Row
                                  </button>
                                  <button
                                    onClick={() => setDuplicateMode('update')}
                                    className={cn(
                                      "flex-1 h-8 rounded-[8px] text-[8px] font-black uppercase tracking-wider border",
                                      duplicateMode === 'update' 
                                        ? "bg-(--ops-chip-active-bg) border-zinc-700 text-foreground" 
                                        : "bg-(--ops-surface-sunken) border-(--ops-border-subtle) text-(--ops-text-muted) hover:text-foreground"
                                    )}
                                  >
                                    Overwrite Duplicate Row
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Replace Range date inputs */}
                            {importMode === 'replace_range' && (
                              <div className="space-y-3 bg-(--ops-surface-sunken)/20 p-4 border border-(--ops-border-subtle) rounded-[10px]">
                                <div>
                                  <p className="text-[9px] font-black uppercase text-(--ops-text-secondary)">Select Date Target brackets</p>
                                  <p className="text-[7px] text-(--ops-text-muted) font-bold uppercase mt-0.5">Records in range are cleared before insert</p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 pt-1.5">
                                  <div>
                                    <label className="text-[8px] text-(--ops-text-muted) font-black uppercase tracking-wider">Start Date</label>
                                    <Input 
                                      type="date" 
                                      value={dateRangeStart} 
                                      onChange={(e) => setDateRangeStart(e.target.value)} 
                                      className="h-8.5 bg-(--ops-surface-sunken) border-(--ops-border) rounded-[8px] text-[10px] font-bold text-foreground mt-1" 
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] text-(--ops-text-muted) font-black uppercase tracking-wider">End Date</label>
                                    <Input 
                                      type="date" 
                                      value={dateRangeEnd} 
                                      onChange={(e) => setDateRangeEnd(e.target.value)} 
                                      className="h-8.5 bg-(--ops-surface-sunken) border-(--ops-border) rounded-[8px] text-[10px] font-bold text-foreground mt-1" 
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* WIPE CONFIRMATION */}
                            {importMode === 'replace_all' && (
                              <div className="space-y-3 bg-rose-500/5 border border-rose-500/15 p-4 rounded-[10px] text-rose-500">
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5"><FiAlertTriangle className="size-3.5" /> Destructive Replace Operation</p>
                                  <p className="text-[8px] text-(--ops-text-muted) font-bold uppercase tracking-wide mt-0.5">Please type 'DELETE ALL SALES' to proceed</p>
                                </div>
                                <Input 
                                  value={confirmDeleteText} 
                                  onChange={(e) => setConfirmDeleteText(e.target.value)} 
                                  placeholder="DELETE ALL SALES"
                                  className="h-9 bg-(--ops-surface-sunken) border-rose-500/20 text-rose-500 font-mono text-[10px] font-black tracking-widest placeholder-rose-900/50 uppercase rounded-[8px] mt-2" 
                                />
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                      {/* Navigation group */}
                      <div className="flex justify-end gap-3 pt-6 border-t border-(--ops-border-subtle)">
                        <Button 
                          onClick={cancelWizard} 
                          variant="ghost" 
                          className="h-9.5 rounded-[10px] bg-(--ops-surface-sunken) border border-(--ops-border) text-[10px] font-black uppercase text-(--ops-text-secondary) hover:text-foreground"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => setStep(3)} 
                          disabled={(validationReport?.invalidRowsCount ?? 0) > 0}
                          className="h-9.5 px-6 rounded-[10px] bg-primary hover:bg-primary-hover text-foreground text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/10"
                        >
                          Continue to Preview <FiEye className="size-3.5" />
                        </Button>
                      </div>

                    </div>
                  )}

                </div>
              )}

              {/* Step 3: Preview */}
              {step === 3 && (
                <div className="space-y-6">
                  
                  {/* File Metadata */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 bg-(--ops-thead-bg) border border-(--ops-border-subtle) rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-foreground uppercase">{file?.name}</p>
                      <p className="text-[9px] text-(--ops-text-muted) uppercase font-bold mt-1">
                        Mode: <span className="text-primary italic font-black">{importMode.replace('_', ' ')}</span> � Valid rows: {validationReport?.validRowsCount} / {validationReport?.totalRows}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border border-(--ops-border) rounded-[10px] p-0.5 bg-(--ops-surface-sunken)">
                        <button
                          onClick={() => setDensity('compact')}
                          className={cn("p-1.5 rounded-[8px]", density === 'compact' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted)")}
                        >
                          <FiMinimize2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDensity('comfortable')}
                          className={cn("p-1.5 rounded-[8px]", density === 'comfortable' ? "bg-(--ops-chip-active-bg) text-foreground" : "text-(--ops-text-muted)")}
                        >
                          <FiMaximize2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Grid Table Preview first 100 rows */}
                  <div className="border border-(--ops-border) rounded-[14px] bg-(--ops-surface-sunken) shadow-sm overflow-hidden max-h-87.5 overflow-y-auto">
                    <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                      <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[9px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none sticky top-0 z-10">
                        <tr>
                          <th className="px-5 py-3.5">Row</th>
                          <th className="px-5 py-3.5">Transaction #</th>
                          <th className="px-5 py-3.5">Date</th>
                          <th className="px-5 py-3.5">Branch</th>
                          <th className="px-5 py-3.5">Product</th>
                          <th className="px-5 py-3.5 text-right">Qty</th>
                          <th className="px-5 py-3.5 text-right">Unit Price</th>
                          <th className="px-5 py-3.5 text-right">Total</th>
                          <th className="px-5 py-3.5 text-center">Cashier</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-(--ops-border-subtle)">
                        {validationReport?.preview.map((pRow, pIdx) => (
                          <tr 
                            key={pIdx} 
                            className={cn(
                              "hover:bg-(--ops-surface-raised) transition-colors duration-150 relative",
                              !pRow.is_valid ? "bg-rose-500/3 hover:bg-rose-950/20" : ""
                            )}
                            title={!pRow.is_valid ? pRow.errors.join(', ') : ''}
                          >
                            <td className="px-5 py-2.5 text-[10px] font-bold text-(--ops-text-muted) font-mono">Row {pRow.row}</td>
                            <td className="px-5 py-2.5 font-bold text-foreground text-xs flex items-center gap-1.5">
                              {!pRow.is_valid && <span className="size-1.5 rounded-full bg-rose-500" />}
                              {pRow.order_number}
                            </td>
                            <td className="px-5 py-2.5 text-[10px] text-(--ops-text-secondary)">{pRow.date}</td>
                            <td className="px-5 py-2.5 text-[10px] font-bold text-zinc-350">{pRow.branch}</td>
                            <td className="px-5 py-2.5 text-[10px] font-black uppercase tracking-tight text-foreground">{pRow.product}</td>
                            <td className="px-5 py-2.5 text-right font-mono font-bold text-xs text-(--ops-text-secondary)">{pRow.quantity}</td>
                            <td className="px-5 py-2.5 text-right font-mono font-bold text-xs text-(--ops-text-secondary)">{pRow.unit_price}</td>
                            <td className="px-5 py-2.5 text-right font-mono font-black text-xs text-primary">{pRow.total}</td>
                            <td className="px-5 py-2.5 text-center text-[10px] text-(--ops-text-muted) italic">{pRow.cashier || 'System'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Wizard actions */}
                  <div className="flex justify-between items-center pt-6 border-t border-(--ops-border-subtle)">
                    <span className="text-[8px] font-black uppercase text-(--ops-text-muted) tracking-wider">Preview limit: first 100 entries</span>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setStep(2)} 
                        variant="ghost" 
                        className="h-9.5 rounded-[10px] bg-(--ops-surface-sunken) border border-(--ops-border) text-[10px] font-black uppercase text-(--ops-text-secondary) hover:text-foreground"
                      >
                        Back
                      </Button>
                      <Button 
                        onClick={executeImport} 
                        disabled={isImporting}
                        className="h-9.5 px-8 rounded-[10px] bg-primary hover:bg-primary-hover text-foreground text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-primary/10 animate-pulse"
                      >
                        {isImporting ? (
                          <>Importing... <FiRefreshCw className="size-3.5 animate-spin" /></>
                        ) : (
                          <>Execute Dataset Import <FiDatabase className="size-3.5" /></>
                        )}
                      </Button>
                    </div>
                  </div>

                </div>
              )}

              {/* Step 4: Summary Report */}
              {step === 4 && importSummary && (
                <div className="py-6 text-center space-y-6 max-w-md mx-auto">
                  <div className="size-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto animate-bounce">
                    <FiCheckCircle className="size-9" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-foreground">Import Complete</h3>
                    <p className="text-[10px] text-(--ops-text-muted) font-bold uppercase tracking-wider">Processed in {importSummary.duration} seconds</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 border border-(--ops-border-subtle) p-4 rounded-xl bg-(--ops-surface-sunken)/20 text-xs font-bold font-mono">
                    <div className="text-center">
                      <span className="text-[8px] text-(--ops-text-muted) font-black uppercase font-sans">Imported</span>
                      <p className="text-lg font-black text-foreground mt-1">{importSummary.imported.toLocaleString()}</p>
                    </div>
                    <div className="text-center border-x border-(--ops-border-subtle)">
                      <span className="text-[8px] text-(--ops-text-muted) font-black uppercase font-sans">Updated</span>
                      <p className="text-lg font-black text-amber-500 mt-1">{importSummary.updated.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] text-(--ops-text-muted) font-black uppercase font-sans">Skipped</span>
                      <p className="text-lg font-black text-(--ops-text-secondary) mt-1">{importSummary.skipped.toLocaleString()}</p>
                    </div>
                  </div>

                  {importSummary.backupCreated && (
                    <div className="p-3 bg-(--ops-surface-sunken) border border-(--ops-border-subtle) rounded-xl flex items-center justify-between text-left text-xs gap-3">
                      <div className="flex items-center gap-2 text-(--ops-text-secondary)">
                        <FiShield className="text-emerald-500 size-4.5" />
                        <div>
                          <p className="font-bold text-[9px] uppercase tracking-wider text-(--ops-text-muted)">Safety Snapshot Backup</p>
                          <p className="font-mono text-[9px] text-zinc-350">{importSummary.backupCreated}</p>
                        </div>
                      </div>
                      <Badge className="bg-zinc-850 text-(--ops-text-secondary) border border-(--ops-border) text-[8px] font-black uppercase rounded-lg">Active</Badge>
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-4">
                    <Button 
                      onClick={cancelWizard}
                      className="flex-1 h-10 rounded-[10px] bg-primary hover:bg-primary-hover text-foreground text-[10px] font-black uppercase tracking-wider italic"
                    >
                      Process Another File
                    </Button>
                    <Button 
                      onClick={() => { router.reload(); cancelWizard(); }}
                      variant="outline"
                      className="flex-1 h-10 rounded-[10px] bg-(--ops-surface-sunken) border border-(--ops-border) text-[10px] font-black uppercase text-(--ops-text-secondary) hover:text-foreground"
                    >
                      Done & Return
                    </Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* DATABASE SNAPSHOTS BACKUP REGISTRY */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
            
            {/* Database Backups List */}
            <Card className="xl:col-span-1 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
              <CardHeader className="bg-(--ops-surface-sunken)/30 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Safety Backups</CardTitle>
                  <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Snapshot rolls before replacements</CardDescription>
                </div>
                <FiShield className="size-4 text-emerald-500" />
              </CardHeader>
              <div className="flex-1 overflow-y-auto max-h-75 divide-y divide-(--ops-border-subtle)">
                {backups.length === 0 ? (
                  <div className="p-12 text-center text-xs text-(--ops-text-muted) uppercase italic">No backup snapshots generated.</div>
                ) : (
                  backups.map((bk: BackupItem) => (
                    <div key={bk.id} className="p-4 flex items-center justify-between gap-4 hover:bg-(--ops-surface-sunken)/20 transition-colors">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate uppercase font-mono">{bk.backup_name}</p>
                        <p className="text-[9px] text-(--ops-text-muted) mt-1 uppercase font-bold">
                          {format(new Date(bk.created_at), 'MMM dd, HH:mm')} � {bk.records_count.toLocaleString()} Records
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button 
                          onClick={() => restoreSnapshot(bk.id)} 
                          disabled={isRestoring}
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-2.5 bg-(--ops-surface-sunken) border border-(--ops-border-subtle) hover:bg-(--ops-chip-active-bg) text-[8px] font-black uppercase text-emerald-500"
                        >
                          Restore
                        </Button>
                        <Button 
                          onClick={() => deleteSnapshot(bk.id)} 
                          disabled={isDeletingBackup}
                          variant="ghost" 
                          size="icon" 
                          className="size-8 rounded-[8px] hover:bg-(--ops-hover) hover:text-rose-500 text-(--ops-text-muted)"
                        >
                          <FiTrash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Import History Table */}
            <Card className="xl:col-span-2 border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden flex flex-col shadow-sm">
              <CardHeader className="bg-(--ops-surface-sunken)/30 border-b border-(--ops-border-subtle) px-6 py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Import History</CardTitle>
                  <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Audit log of sales updates</CardDescription>
                </div>
                <FiClock className="size-4 text-primary" />
              </CardHeader>
              <div className="flex-1 overflow-x-auto max-h-75 overflow-y-auto">
                <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                  <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[8px] font-black uppercase tracking-[0.15em] text-(--ops-text-muted) select-none sticky top-0">
                    <tr>
                      <th className="px-5 py-3">File Name</th>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Mode</th>
                      <th className="px-5 py-3 text-right">Processed</th>
                      <th className="px-5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--ops-border-subtle) text-[10px]">
                    {importsHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-(--ops-text-muted) uppercase italic">No import history matches</td>
                      </tr>
                    ) : (
                      importsHistory.map((hItem: ImportHistoryItem) => (
                        <tr key={hItem.id} className="hover:bg-(--ops-surface-sunken)/20 transition-colors">
                          <td className="px-5 py-3">
                            <span className="font-bold text-foreground text-xs block truncate max-w-50">{hItem.file_name}</span>
                            <span className="text-[8px] text-(--ops-text-muted) font-bold uppercase mt-0.5">{format(new Date(hItem.created_at), 'yyyy-MM-dd HH:mm')}</span>
                          </td>
                          <td className="px-5 py-3 font-semibold text-(--ops-text-secondary)">{hItem.user?.name || 'System'}</td>
                          <td className="px-5 py-3">
                            <Badge variant="outline" className="text-[7px] font-black uppercase tracking-wider rounded-lg bg-(--ops-surface-sunken) border-(--ops-border) text-(--ops-text-secondary)">
                              {hItem.import_mode.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-[9px] text-(--ops-text-secondary) leading-normal">
                            <span className="text-emerald-500">+{hItem.records_imported}</span> � <span className="text-amber-500">*{hItem.records_updated}</span> � <span className="text-(--ops-text-muted)">#{hItem.records_skipped}</span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge className={cn(
                              "text-[7px] font-black uppercase rounded-lg px-1.5 py-0 border bg-transparent",
                              hItem.status === 'success' 
                                ? "text-emerald-500 border-emerald-500/10" 
                                : "text-rose-500 border-rose-500/10"
                            )}>
                              {hItem.status}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>

          {/* ADMINISTRATIVE DATA AUDIT TRAIL LOGS */}
          <Card className="border border-(--ops-border) bg-(--ops-surface-raised) rounded-[14px] overflow-hidden shadow-sm">
            <CardHeader className="bg-(--ops-surface-sunken)/30 border-b border-(--ops-border-subtle) px-6 py-4">
              <CardTitle className="text-sm font-black uppercase tracking-wider text-foreground">Administrative Audit Trail</CardTitle>
              <CardDescription className="text-[9px] font-black uppercase tracking-wider text-(--ops-text-muted) mt-1">Immutable security ledger for file syncs</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-75 overflow-y-auto">
                <table className="w-full text-left border-collapse table-auto text-(--ops-text-secondary)">
                  <thead className="bg-(--ops-thead-bg) border-b border-(--ops-border) text-[8px] font-black uppercase tracking-[0.15em] text-(--ops-text-secondary) select-none">
                    <tr>
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Operator</th>
                      <th className="px-5 py-3">Action</th>
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3">System Execution Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-(--ops-border-subtle) text-[10px] font-medium text-(--ops-text-secondary)">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-zinc-555 uppercase italic">No audit trail recorded.</td>
                      </tr>
                    ) : (
                      auditLogs.map((log: AuditLogItem) => (
                        <tr key={log.id} className="hover:bg-(--ops-surface-sunken) transition-colors">
                          <td className="px-5 py-3 font-mono text-[9px] text-(--ops-text-muted) select-none">
                            {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                          </td>
                          <td className="px-5 py-3 font-bold text-foreground">{log.user?.name || 'System'}</td>
                          <td className="px-5 py-3">
                            <Badge className="bg-(--ops-surface-sunken) border border-(--ops-border) text-(--ops-text-secondary) text-[7px] font-black uppercase px-1.5 py-0 rounded-lg">
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 font-mono text-[9px] text-(--ops-text-muted)">{log.ip_address || 'Localhost'}</td>
                          <td className="px-5 py-3 text-zinc-350 italic">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </AppLayout>
  );
}

