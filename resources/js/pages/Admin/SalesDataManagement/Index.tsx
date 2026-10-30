import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Table,
    FileSpreadsheet,
    ShieldCheck,
    History,
} from 'lucide-react';
import React, { useState } from 'react';

import { AuditLogsCard, type AuditLogItem } from '@/components/sales-data/AuditLogsCard';
import { ImportHistoryCard, type ImportHistoryItem } from '@/components/sales-data/ImportHistoryCard';
import { ImportWizardCard, type ValidationReport, type ImportSummaryFlash } from '@/components/sales-data/ImportWizardCard';
import { SafetyBackupsCard, type BackupItem } from '@/components/sales-data/SafetyBackupsCard';
import { SalesDataHero } from '@/components/sales-data/SalesDataHero';
import {
    SalesRecordsExplorer,
    type PaginatedSalesResponse,
} from '@/components/sales-data/SalesRecordsExplorer';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export type ProductOption = {
    id: number;
    name: string;
    sku?: string | null;
};

export type BranchOption = {
    id: number;
    name: string;
    code?: string | null;
};

type PageProps = {
    stats: {
        total_sales_records: number;
        last_import_date: string | null;
        last_imported_by: string | null;
        duplicate_records_detected: number;
        data_integrity_status: string;
    };
    sales?: PaginatedSalesResponse;
    filteredSummary?: {
        total_revenue: number;
        orders_count: number;
    };
    filters?: {
        search: string;
        branch_id: string;
        date_from: string;
        date_to: string;
        status: string;
        source: string;
        sort_by: string;
        sort_dir: string;
        per_page: number;
    };
    importsHistory: ImportHistoryItem[];
    auditLogs: AuditLogItem[];
    backups: BackupItem[];
    branches?: BranchOption[];
    products?: ProductOption[];
    flash?: { importResult?: ImportSummaryFlash };
};

export default function SalesDataManagementIndex() {
    const {
        stats,
        sales = {
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
            from: null,
            to: null,
            prev_page_url: null,
            next_page_url: null,
            links: [],
        },
        filteredSummary = {
            total_revenue: 0,
            orders_count: 0,
        },
        filters = {
            search: '',
            branch_id: 'all',
            date_from: '',
            date_to: '',
            status: 'all',
            source: 'all',
            sort_by: 'created_at',
            sort_dir: 'desc',
            per_page: 15,
        },
        importsHistory,
        auditLogs,
        backups,
        branches = [],
        products = [],
    } = usePage<PageProps>().props;

    // Active View Tab
    const [activeTab, setActiveTab] = useState<'explorer' | 'import' | 'backups' | 'audit'>('explorer');

    // Wizard state
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Upload, 2: Validate/Configure, 3: Preview, 4: Summary
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isDeletingBackup, setIsDeletingBackup] = useState(false);

    // Validation report state
    const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
    const [productMappings, setProductMappings] = useState<Record<string, number>>({});

    // Import configuration parameters
    const [importMode, setImportMode] = useState<'add_new' | 'update' | 'replace_range' | 'replace_all'>('add_new');
    const [duplicateMode, setDuplicateMode] = useState<'skip' | 'update'>('skip');
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');
    const [confirmDeleteText, setConfirmDeleteText] = useState('');

    // Execution result state
    const [importSummary, setImportSummary] = useState<ImportSummaryFlash | null>(null);

    // Drag and Drop handlers
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
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
            alert('Invalid file format. Please upload CSV or Excel files.');
            return;
        }
        setFile(selectedFile);
        triggerValidation(selectedFile, {});
    };

    const triggerValidation = (uploadFile: File, mappingsToUse: Record<string, number> = productMappings) => {
        setIsValidating(true);
        setStep(2);

        const formData = new FormData();
        formData.append('file', uploadFile);
        if (Object.keys(mappingsToUse).length > 0) {
            formData.append('productMappings', JSON.stringify(mappingsToUse));
        }

        // Call validation endpoint via AJAX
        axios
            .post('/admin/sales-data/validate', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            })
            .then((response: { data: ValidationReport }) => {
                setValidationReport(response.data);
                setIsValidating(false);
            })
            .catch((err: { response?: { data?: { error?: string } } }) => {
                alert(err.response?.data?.error || 'Validation failed. Please verify file columns.');
                setFile(null);
                setStep(1);
                setIsValidating(false);
            });
    };

    const handleProductMappingChange = (unmatchedName: string, productId: number) => {
        setProductMappings((prev) => ({
            ...prev,
            [unmatchedName]: productId,
        }));
    };

    const handleRevalidateWithMappings = () => {
        if (file) {
            triggerValidation(file, productMappings);
        }
    };

    const executeImport = () => {
        if (!validationReport?.tempKey) return;

        if (importMode === 'replace_all' && confirmDeleteText !== 'DELETE ALL SALES') {
            alert('Please type the confirmation string exactly.');
            return;
        }

        setIsImporting(true);

        axios
            .post('/admin/sales-data/import', {
                tempKey: validationReport.tempKey,
                importMode,
                duplicateMode,
                dateRangeStart,
                dateRangeEnd,
                confirmText: confirmDeleteText,
                productMappings,
            })
            .then((response: {
                data: {
                    imported?: number;
                    updated?: number;
                    skipped?: number;
                    duration?: number;
                    backupCreated?: boolean;
                    source?: string;
                    dateRange?: string;
                };
            }) => {
                setIsImporting(false);
                const data = response.data;
                const summary: ImportSummaryFlash = {
                    imported: data.imported ?? 0,
                    updated: data.updated ?? 0,
                    skipped: data.skipped ?? 0,
                    duration: data.duration ?? 1.2,
                    backupCreated: data.backupCreated,
                    source: data.source ?? 'Loyverse',
                    dateRange: data.dateRange,
                };
                setImportSummary(summary);
                setStep(4);
            })
            .catch((err: { response?: { data?: { error?: string } } }) => {
                setIsImporting(false);
                alert(err.response?.data?.error || 'Import failed. Check logs for details.');
            });
    };

    const restoreSnapshot = (backupId: number) => {
        if (
            !confirm(
                'Are you sure you want to restore this database snapshot? All current sales records will be replaced with the snapshot data.'
            )
        ) {
            return;
        }

        setIsRestoring(true);
        router.post(
            '/admin/sales-data/restore/' + backupId,
            {},
            {
                onFinish: () => setIsRestoring(false),
                onSuccess: () => alert('Snapshot restored successfully!'),
            }
        );
    };

    const deleteSnapshot = (backupId: number) => {
        if (!confirm('Are you sure you want to permanently delete this snapshot backup file?')) {
            return;
        }

        setIsDeletingBackup(true);
        router.delete('/admin/sales-data/backup/' + backupId, {
            onFinish: () => setIsDeletingBackup(false),
            onSuccess: () => alert('Snapshot deleted.'),
        });
    };

    const cancelWizard = () => {
        setFile(null);
        setValidationReport(null);
        setImportSummary(null);
        setConfirmDeleteText('');
        setProductMappings({});
        setStep(1);
    };

    const downloadErrorReport = () => {
        if (!validationReport?.errors) return;

        let content = 'Maki Desu Sales Data Management - Validation Error Report\n';
        content += `File Name: ${validationReport.fileName}\n`;
        content += `Date: ${new Date().toLocaleString()}\n`;
        content += `Total Rows: ${validationReport.totalRows}\n`;
        content += `Valid Rows: ${validationReport.validRowsCount}\n`;
        content += `Invalid Rows: ${validationReport.invalidRowsCount}\n\n`;
        content += '=========================================================\n\n';

        validationReport.errors.forEach((err: { row: number; errors: string[] }) => {
            content += `Row ${err.row}:\n`;
            err.errors.forEach((e: string) => {
                content += `  - ${e}\n`;
            });
            content += '\n';
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation_errors_${validationReport.fileName.replace(/\.[^/.]+$/, '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Data Sales Management', href: '/admin/sales-data' }]}>
            <Head title="Data Sales Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                {/* Hero Header & KPI Metrics */}
                <SalesDataHero stats={stats} />

                {/* Tab Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2.5 p-1.5 rounded-2xl bg-[#FFF0F4]/80 dark:bg-white/5 border border-[#F8C8DC]/60 dark:border-white/10 w-fit">
                    <button
                        type="button"
                        onClick={() => setActiveTab('explorer')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer",
                            activeTab === 'explorer'
                                ? "bg-white dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] hover:bg-white/50"
                        )}
                    >
                        <Table className="size-3.5" />
                        <span>Sales Records Explorer</span>
                        <Badge
                            variant="secondary"
                            className={cn(
                                "text-[10px] px-1.5 py-0 h-4 font-mono font-bold",
                                activeTab === 'explorer'
                                    ? "bg-[#FFF0F4] text-[#E75480] dark:bg-[#FF4F81]/20 dark:text-[#FF4F81]"
                                    : "bg-slate-200/60 dark:bg-white/10"
                            )}
                        >
                            {sales.total || stats.total_sales_records || 0}
                        </Badge>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('import')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer",
                            activeTab === 'import'
                                ? "bg-white dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] hover:bg-white/50"
                        )}
                    >
                        <FileSpreadsheet className="size-3.5" />
                        <span>Data Import Wizard</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('backups')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer",
                            activeTab === 'backups'
                                ? "bg-white dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] hover:bg-white/50"
                        )}
                    >
                        <ShieldCheck className="size-3.5" />
                        <span>Safety Backups & History</span>
                        {backups && backups.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold bg-[#FFF0F4] text-[#E75480] dark:bg-[#FF4F81]/20 dark:text-[#FF4F81]"
                            >
                                {backups.length}
                            </Badge>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 cursor-pointer",
                            activeTab === 'audit'
                                ? "bg-white dark:bg-[#1C1C28] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                : "text-[#7D6B6E] dark:text-[#94A3B8] hover:text-[#E75480] hover:bg-white/50"
                        )}
                    >
                        <History className="size-3.5" />
                        <span>Administrative Audit Logs</span>
                    </button>
                </div>

                {/* Tab 1: Sales Records Explorer */}
                {activeTab === 'explorer' && (
                    <SalesRecordsExplorer
                        sales={sales}
                        filters={filters}
                        filteredSummary={filteredSummary}
                        branches={branches}
                    />
                )}

                {/* Tab 2: Data Import Wizard */}
                {activeTab === 'import' && (
                    <ImportWizardCard
                        step={step}
                        setStep={setStep}
                        file={file}
                        dragActive={dragActive}
                        handleDrag={handleDrag}
                        handleDrop={handleDrop}
                        handleFileChange={handleFileChange}
                        isValidating={isValidating}
                        isImporting={isImporting}
                        validationReport={validationReport}
                        importMode={importMode}
                        setImportMode={setImportMode}
                        duplicateMode={duplicateMode}
                        setDuplicateMode={setDuplicateMode}
                        dateRangeStart={dateRangeStart}
                        setDateRangeStart={setDateRangeStart}
                        dateRangeEnd={dateRangeEnd}
                        setDateRangeEnd={setDateRangeEnd}
                        confirmDeleteText={confirmDeleteText}
                        setConfirmDeleteText={setConfirmDeleteText}
                        importSummary={importSummary}
                        executeImport={executeImport}
                        cancelWizard={cancelWizard}
                        downloadErrorReport={downloadErrorReport}
                        onResetReturn={() => {
                            router.reload();
                            cancelWizard();
                        }}
                        products={products}
                        productMappings={productMappings}
                        onProductMappingChange={handleProductMappingChange}
                        onRevalidateWithMappings={handleRevalidateWithMappings}
                    />
                )}

                {/* Tab 3: Backups & History Section */}
                {activeTab === 'backups' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                        <div className="xl:col-span-1 flex flex-col">
                            <SafetyBackupsCard
                                backups={backups}
                                isRestoring={isRestoring}
                                isDeletingBackup={isDeletingBackup}
                                onRestore={restoreSnapshot}
                                onDelete={deleteSnapshot}
                            />
                        </div>
                        <div className="xl:col-span-2 flex flex-col">
                            <ImportHistoryCard importsHistory={importsHistory} />
                        </div>
                    </div>
                )}

                {/* Tab 4: Administrative Audit Logs */}
                {activeTab === 'audit' && (
                    <AuditLogsCard auditLogs={auditLogs} />
                )}
            </div>
        </AppLayout>
    );
}
