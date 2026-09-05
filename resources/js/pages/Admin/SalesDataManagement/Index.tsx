import type { Page } from '@inertiajs/core';
import { Head, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import React, { useState } from 'react';

import { AuditLogsCard, type AuditLogItem } from '@/components/sales-data/AuditLogsCard';
import { ImportHistoryCard, type ImportHistoryItem } from '@/components/sales-data/ImportHistoryCard';
import { ImportWizardCard, type ValidationReport, type ImportSummaryFlash } from '@/components/sales-data/ImportWizardCard';
import { SafetyBackupsCard, type BackupItem } from '@/components/sales-data/SafetyBackupsCard';
import { SalesDataHero } from '@/components/sales-data/SalesDataHero';
import AppLayout from '@/layouts/app-layout';

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
    const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);

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
        triggerValidation(selectedFile);
    };

    const triggerValidation = (uploadFile: File) => {
        setIsValidating(true);
        setStep(2);

        const formData = new FormData();
        formData.append('file', uploadFile);

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

    const executeImport = () => {
        if (!validationReport?.tempKey) return;

        if (importMode === 'replace_all' && confirmDeleteText !== 'DELETE ALL SALES') {
            alert('Please type the confirmation string exactly.');
            return;
        }

        setIsImporting(true);

        router.post(
            '/admin/sales-data/import',
            {
                tempKey: validationReport.tempKey,
                importMode,
                duplicateMode,
                dateRangeStart,
                dateRangeEnd,
                confirmText: confirmDeleteText,
            },
            {
                onSuccess: (page: Page) => {
                    setIsImporting(false);

                    // Grab import result details from response (passed back on completion)
                    const summary: ImportSummaryFlash = (page.props.flash as PageProps['flash'])?.importResult ?? {
                        imported: validationReport?.validRowsCount ?? 0,
                        updated: importMode === 'update' ? (validationReport?.duplicateCount ?? 0) : 0,
                        skipped: importMode === 'add_new' ? (validationReport?.duplicateCount ?? 0) : 0,
                        duration: 1.2,
                    };

                    setImportSummary(summary);
                    setStep(4);
                },
                onError: (errors: Record<string, string>) => {
                    setIsImporting(false);
                    alert(errors.error || 'Import failed. Check logs for details.');
                },
            }
        );
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
        <AppLayout breadcrumbs={[{ title: 'Sales Data Management', href: '/admin/sales-data' }]}>
            <Head title="Sales Data Management" />

            <div className="p-6 sm:p-8 lg:p-10 space-y-8 bg-[#FFFDFE] dark:bg-[#050505] text-[#5D4A4D] dark:text-[#E2E8F0] min-h-screen overflow-x-hidden font-['Outfit'] antialiased transition-colors duration-300">
                {/* Hero Header & KPI Metrics */}
                <SalesDataHero stats={stats} />

                {/* Import Wizard Module */}
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
                />

                {/* Backups & History Section */}
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

                {/* Administrative Audit Logs */}
                <AuditLogsCard auditLogs={auditLogs} />
            </div>
        </AppLayout>
    );
}
