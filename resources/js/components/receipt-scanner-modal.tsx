import axios from 'axios';
import {
    AlertTriangle,
    Camera,
    Check,
    FileSpreadsheet,
    FileText,
    History,
    Plus,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Store,
    Trash2,
    UploadCloud,
    Zap,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface InventoryItem {
    id: number;
    name: string;
    unit?: string | null;
    avg_weight_per_piece?: number | null;
    cost_per_unit?: number | null;
}

export interface BranchOption {
    id: number;
    name: string;
}

interface ReceiptScannerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: number;
    inventory: InventoryItem[];
    branches?: BranchOption[];
    isAdmin?: boolean;
    onSuccess?: () => void;
}

type StepMode = 'upload' | 'processing' | 'review' | 'success';

interface ReviewLineItem {
    id?: number;
    raw_line: string;
    description: string;
    quantity: number;
    unit: string;
    unit_price: number;
    line_total: number;
    suggested_ingredient_id: number | null;
    suggested_ingredient_name: string | null;
    ingredient_base_unit: string | null;
    normalized_quantity: number;
    confidence_tier: 'HIGH' | 'MEDIUM' | 'LOW';
    match_score: number;
    needs_review: boolean;
    is_arithmetic_consistent: boolean;
    arithmetic_warning: string | null;
    is_unit_compatible: boolean;
    unit_warning: string | null;
}

interface ReceiptHistoryRecord {
    id: number;
    supplier_name: string | null;
    invoice_number: string | null;
    receipt_date: string | null;
    grand_total: number | null;
    status: string;
    created_at: string;
    branch?: { id: number; name: string };
    user?: { id: number; name: string };
    processor?: { id: number; name: string };
}

export function ReceiptScannerModal({
    open,
    onOpenChange,
    branchId,
    inventory,
    branches = [],
    isAdmin = true,
    onSuccess,
}: ReceiptScannerModalProps) {
    const [tab, setTab] = useState<'scanner' | 'history'>('scanner');
    const [step, setStep] = useState<StepMode>('upload');

    // Document & Upload state
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<number>(branchId);

    // AI Processing State
    const [processingStage, setProcessingStage] = useState<number>(1);
    const [receiptId, setReceiptId] = useState<number | null>(null);

    // Extracted Header State
    const [supplierName, setSupplierName] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState<string>('');
    const [receiptDate, setReceiptDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [taxAmount, setTaxAmount] = useState<number>(0);
    const [discountAmount, setDiscountAmount] = useState<number>(0);
    const [extractedGrandTotal, setExtractedGrandTotal] = useState<number>(0);

    // Duplicate & Arithmetic Flags
    const [isDuplicateWarning, setIsDuplicateWarning] = useState<boolean>(false);
    const [duplicateReason, setDuplicateReason] = useState<string | null>(null);

    // Extracted Lines State
    const [lineItems, setLineItems] = useState<ReviewLineItem[]>([]);

    // Confirmation Modal
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
    const [isSubmittingStockIn, setIsSubmittingStockIn] = useState<boolean>(false);

    // History Records
    const [historyList, setHistoryList] = useState<ReceiptHistoryRecord[]>([]);
    const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

    // File Input Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Sync branch prop
    useEffect(() => {
        if (branchId) setSelectedBranchId(branchId);
    }, [branchId]);

    // Reset state on modal close
    useEffect(() => {
        if (!open) {
            setTab('scanner');
            setStep('upload');
            setFile(null);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setLineItems([]);
            setReceiptId(null);
            setSupplierName('');
            setInvoiceNumber('');
            setTaxAmount(0);
            setDiscountAmount(0);
            setExtractedGrandTotal(0);
            setIsDuplicateWarning(false);
            setDuplicateReason(null);
            setConfirmModalOpen(false);
            setIsSubmittingStockIn(false);
        }
    }, [open]);

    // File Selection Handler
    const handleFileSelect = (selectedFile: File) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(selectedFile.type)) {
            toast.error('Invalid document format. Please upload a JPG, PNG, WebP, or PDF.');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds the 10MB limit.');
            return;
        }

        setFile(selectedFile);
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        if (selectedFile.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selectedFile));
        } else {
            setPreviewUrl(null);
        }
    };

    // Trigger AI Scan Pipeline
    const handleStartScan = async () => {
        if (!file) {
            toast.error('Please select or capture a receipt document first.');
            return;
        }

        setStep('processing');
        setProcessingStage(1);

        try {
            // Stage 1: Upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('branch_id', String(selectedBranchId));

            const uploadRes = await axios.post('/inventory/scan-receipt/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (!uploadRes.data.success) {
                toast.error(uploadRes.data.message || 'Failed to upload receipt.');
                setStep('upload');
                return;
            }

            const recId = uploadRes.data.receipt_id;
            setReceiptId(recId);

            // Stage 2 & 3: OCR & Extraction
            setProcessingStage(2);
            await new Promise((r) => setTimeout(r, 400));
            setProcessingStage(3);

            const processRes = await axios.post('/inventory/scan-receipt/process', {
                receipt_id: recId,
                branch_id: selectedBranchId,
            });

            if (!processRes.data.success) {
                toast.error(processRes.data.message || 'Unable to process receipt.');
                setStep('upload');
                return;
            }

            // Stage 4 & 5: Matching & Validation
            setProcessingStage(4);
            await new Promise((r) => setTimeout(r, 300));
            setProcessingStage(5);

            const data = processRes.data;
            setSupplierName(data.supplier_name || '');
            setInvoiceNumber(data.invoice_number || '');
            setReceiptDate(data.receipt_date || new Date().toISOString().split('T')[0]);
            setTaxAmount(data.tax || 0);
            setDiscountAmount(data.discount || 0);
            setExtractedGrandTotal(data.grand_total || 0);
            setIsDuplicateWarning(!!data.is_duplicate_warning);
            setDuplicateReason(data.duplicate_reason || null);

            const items: ReviewLineItem[] = (data.items || []).map((it: ReviewLineItem, idx: number) => ({
                ...it,
                id: idx,
                quantity: Number(it.quantity) || 1,
                unit: it.unit || 'pcs',
                unit_price: Number(it.unit_price) || 0,
                line_total: Number(it.line_total) || 0,
            }));

            setLineItems(items);
            setStep('review');

            if (data.is_duplicate_warning) {
                toast.warning('Duplicate Receipt Warning: This document may have already been processed.');
            }
        } catch (err: unknown) {
            console.error('Scan error:', err);
            const errRes = (err as { response?: { data?: { message?: string } } })?.response;
            toast.error(errRes?.data?.message || 'Server error while processing receipt.');
            setStep('upload');
        }
    };

    // Calculate Summary Values
    const calculatedSubtotal = lineItems.reduce((acc, row) => acc + (Number(row.line_total) || 0), 0);
    const calculatedGrandTotal = Math.max(0, calculatedSubtotal + Number(taxAmount || 0) - Number(discountAmount || 0));
    const hasTotalMismatch = extractedGrandTotal > 0 && Math.abs(calculatedGrandTotal - extractedGrandTotal) > 0.05;

    // Line Item Mutators
    const updateLineItem = (index: number, updates: Partial<ReviewLineItem>) => {
        setLineItems((prev) =>
            prev.map((item, idx) => {
                if (idx !== index) return item;

                const updated = { ...item, ...updates };

                // Recalculate line total if qty or unit price changed
                if ('quantity' in updates || 'unit_price' in updates) {
                    const qty = Number(updated.quantity) || 0;
                    const price = Number(updated.unit_price) || 0;
                    updated.line_total = Math.round(qty * price * 100) / 100;
                    updated.is_arithmetic_consistent = true;
                    updated.arithmetic_warning = null;
                }

                // If ingredient match changed, update suggested name and base unit
                if ('suggested_ingredient_id' in updates) {
                    const selectedIng = inventory.find((inv) => inv.id === updates.suggested_ingredient_id);
                    if (selectedIng) {
                        updated.suggested_ingredient_name = selectedIng.name;
                        updated.ingredient_base_unit = selectedIng.unit || 'pcs';
                        updated.needs_review = false;
                        updated.confidence_tier = 'HIGH';
                        updated.is_unit_compatible = true;
                        updated.unit_warning = null;
                    } else {
                        updated.suggested_ingredient_name = null;
                        updated.ingredient_base_unit = null;
                        updated.needs_review = true;
                        updated.confidence_tier = 'LOW';
                    }
                }

                return updated;
            })
        );
    };

    const removeLineItem = (index: number) => {
        setLineItems((prev) => prev.filter((_, idx) => idx !== index));
    };

    const addNewLineItem = () => {
        const newItem: ReviewLineItem = {
            id: Date.now(),
            raw_line: 'Manual Entry',
            description: '',
            quantity: 1,
            unit: 'kg',
            unit_price: 0,
            line_total: 0,
            suggested_ingredient_id: null,
            suggested_ingredient_name: null,
            ingredient_base_unit: null,
            normalized_quantity: 1,
            confidence_tier: 'LOW',
            match_score: 0,
            needs_review: true,
            is_arithmetic_consistent: true,
            arithmetic_warning: null,
            is_unit_compatible: true,
            unit_warning: null,
        };
        setLineItems((prev) => [...prev, newItem]);
    };

    // Open Confirmation Dialog
    const handleProceedToConfirm = () => {
        if (lineItems.length === 0) {
            toast.error('No line items to stock in.');
            return;
        }

        const unmatched = lineItems.filter((i) => !i.suggested_ingredient_id);
        if (unmatched.length > 0) {
            toast.error(`Please match all ingredients before confirming (${unmatched.length} unmatched).`);
            return;
        }

        setConfirmModalOpen(true);
    };

    // Submit Stock-In
    const handleFinalStockIn = async () => {
        setIsSubmittingStockIn(true);
        try {
            const payloadItems = lineItems.map((it) => ({
                ingredient_id: it.suggested_ingredient_id,
                quantity: Number(it.quantity),
                unit: it.unit,
                purchase_price: Number(it.line_total),
                unit_price: Number(it.unit_price),
            }));

            const res = await axios.post('/inventory/scan-receipt/confirm', {
                branch_id: selectedBranchId,
                receipt_id: receiptId,
                supplier_name: supplierName || 'Supplier',
                invoice_number: invoiceNumber || 'N/A',
                receipt_date: receiptDate,
                items: payloadItems,
            });

            if (res.data.success) {
                setConfirmModalOpen(false);
                setStep('success');
                toast.success('Stock-In successfully executed and recorded to inventory!');
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.data.message || 'Stock-in failed.');
            }
        } catch (err: unknown) {
            console.error('Final stock-in error:', err);
            const errRes = (err as { response?: { data?: { message?: string } } })?.response;
            toast.error(errRes?.data?.message || 'Error completing stock-in.');
        } finally {
            setIsSubmittingStockIn(false);
        }
    };

    // Fetch History
    const fetchHistory = useCallback(async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get('/inventory/scan-receipt/history', {
                params: { branch_id: selectedBranchId },
            });
            if (res.data.success && res.data.receipts) {
                setHistoryList(res.data.receipts.data || []);
            }
        } catch {
            toast.error('Failed to load scan history.');
        } finally {
            setLoadingHistory(false);
        }
    }, [selectedBranchId]);

    useEffect(() => {
        if (open && tab === 'history') {
            fetchHistory();
        }
    }, [open, tab, fetchHistory]);

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-4xl p-6 sm:p-8 shadow-2xl font-['Outfit'] transition-all max-h-[92vh] flex flex-col">
                    {/* Header */}
                    <DialogHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 pb-4 shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-[#E75480]/10 dark:bg-[#E1062C]/20 text-[#E75480] dark:text-[#FF4F81]">
                                    <FileSpreadsheet className="size-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                        AI Receipt Restock Scanner
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                        Upload delivery receipts or supplier invoices for automated stock-in review.
                                    </DialogDescription>
                                </div>
                            </div>

                            {/* View Switcher Tabs */}
                            <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setTab('scanner')}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer',
                                        tab === 'scanner'
                                            ? 'bg-white dark:bg-[#181820] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    )}
                                >
                                    <Zap className="size-3.5" /> Scanner
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTab('history');
                                        fetchHistory();
                                    }}
                                    className={cn(
                                        'px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer',
                                        tab === 'history'
                                            ? 'bg-white dark:bg-[#181820] text-[#E75480] dark:text-[#FF4F81] shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                    )}
                                >
                                    <History className="size-3.5" /> Scan History
                                </button>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* TAB 1: SCANNER WORKFLOW */}
                    {tab === 'scanner' && (
                        <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
                            {/* STEP 1: UPLOAD & BRANCH SELECTION */}
                            {step === 'upload' && (
                                <div className="space-y-5 pt-2">
                                    {/* Branch Selector Bar */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10">
                                        <div className="flex items-center gap-2">
                                            <Store className="size-4 text-[#E75480] dark:text-[#FF4F81]" />
                                            <span className="text-xs font-bold text-[#5D4A4D] dark:text-[#94A3B8]">Target Restock Branch:</span>
                                        </div>

                                        <div className="w-full sm:w-64">
                                            {isAdmin && branches.length > 0 ? (
                                                <Select
                                                    value={String(selectedBranchId)}
                                                    onValueChange={(val) => setSelectedBranchId(Number(val))}
                                                >
                                                    <SelectTrigger className="h-10 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-bold">
                                                        <SelectValue placeholder="Select Branch" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map((b) => (
                                                            <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold">
                                                                {b.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="outline" className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white dark:bg-[#121218]">
                                                    {branches.find((b) => b.id === selectedBranchId)?.name || 'Authorized Branch'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Drag & Drop Upload Zone */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-[#F8C8DC] dark:border-white/20 hover:border-[#E75480] dark:hover:border-[#FF4F81] rounded-4xl p-8 text-center cursor-pointer transition-all bg-[#FFF5F7]/40 dark:bg-[#181820]/40 hover:bg-[#FFF5F7] dark:hover:bg-[#181820] flex flex-col items-center justify-center gap-3 group"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        />
                                        <input
                                            type="file"
                                            ref={cameraInputRef}
                                            accept="image/*"
                                            capture="environment"
                                            className="hidden"
                                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                        />

                                        {previewUrl ? (
                                            <div className="relative w-full max-h-56 rounded-3xl overflow-hidden border border-[#F8C8DC] dark:border-white/10">
                                                <img
                                                    src={previewUrl}
                                                    alt="Receipt Preview"
                                                    className="w-full h-full object-contain max-h-56 mx-auto"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                                    <RefreshCw className="size-4" /> Change Receipt File
                                                </div>
                                            </div>
                                        ) : file ? (
                                            <div className="py-6 flex flex-col items-center gap-2">
                                                <FileText className="size-12 text-[#E75480] dark:text-[#FF4F81]" />
                                                <p className="text-sm font-bold">{file.name}</p>
                                                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB PDF Document</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="size-16 rounded-3xl bg-white dark:bg-[#20202C] shadow-md border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] group-hover:scale-110 transition-transform">
                                                    <UploadCloud className="size-8" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                        Click to upload or drag & drop supplier receipt
                                                    </p>
                                                    <p className="text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                                        Supports JPG, PNG, WebP, and PDF invoices up to 10MB
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => cameraInputRef.current?.click()}
                                            className="flex-1 h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold gap-2 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/5"
                                        >
                                            <Camera className="size-4 text-[#E75480] dark:text-[#FF4F81]" /> Snap Photo via Camera
                                        </Button>
                                    </div>

                                    <DialogFooter className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10"
                                        >
                                            Cancel
                                        </Button>

                                        <Button
                                            type="button"
                                            disabled={!file}
                                            onClick={handleStartScan}
                                            className="rounded-xl h-11 px-6 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 shadow-sm cursor-pointer"
                                        >
                                            <Zap className="size-4" /> Start AI Extraction & Review
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {/* STEP 2: PROCESSING ANIMATION */}
                            {step === 'processing' && (
                                <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
                                    <div className="relative">
                                        <div className="size-20 rounded-full border-4 border-[#F8C8DC] dark:border-white/10 border-t-[#E75480] dark:border-t-[#FF4F81] animate-spin" />
                                        <FileSpreadsheet className="size-8 text-[#E75480] dark:text-[#FF4F81] absolute inset-0 m-auto animate-pulse" />
                                    </div>

                                    <div className="space-y-2 max-w-md">
                                        <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            {processingStage === 1 && 'Uploading Receipt Document...'}
                                            {processingStage === 2 && 'Performing Optical Character Recognition (OCR)...'}
                                            {processingStage === 3 && 'Extracting Items, Quantities & Financial Totals...'}
                                            {processingStage === 4 && 'Matching with Active Ingredient Catalog...'}
                                            {processingStage === 5 && 'Verifying Arithmetic & Duplicate Prevention...'}
                                        </h3>
                                        <p className="text-xs text-[#9E8B8E] dark:text-[#64748B]">
                                            Please wait while AI structures the receipt data into a safe review draft.
                                        </p>
                                    </div>

                                    {/* Steps Progress Pills */}
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <div
                                                key={s}
                                                className={cn(
                                                    'h-2 rounded-full transition-all',
                                                    s <= processingStage
                                                        ? 'w-8 bg-[#E75480] dark:bg-[#FF4F81]'
                                                        : 'w-2 bg-slate-200 dark:bg-white/10'
                                                )}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: STRUCTURED REVIEW TABLE (DRAFT) */}
                            {step === 'review' && (
                                <div className="space-y-4 pt-1">
                                    {/* Warnings Banner */}
                                    {isDuplicateWarning && (
                                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
                                            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                            <div>
                                                <strong className="font-bold">Duplicate Warning:</strong>{' '}
                                                {duplicateReason || 'This document or invoice number has already been processed.'}
                                            </div>
                                        </div>
                                    )}

                                    {hasTotalMismatch && (
                                        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-300">
                                            <ShieldAlert className="size-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                                            <div>
                                                <strong className="font-bold">Receipt Total Mismatch:</strong> Extracted Grand Total is{' '}
                                                <strong className="font-mono">₱{extractedGrandTotal.toFixed(2)}</strong>, but the calculated line sum is{' '}
                                                <strong className="font-mono">₱{calculatedGrandTotal.toFixed(2)}</strong>. Please verify line totals.
                                            </div>
                                        </div>
                                    )}

                                    {/* Receipt Metadata Header */}
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-3xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 text-xs">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Supplier Name
                                            </label>
                                            <Input
                                                value={supplierName}
                                                onChange={(e) => setSupplierName(e.target.value)}
                                                placeholder="e.g. ABC Food Supplies"
                                                className="h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Invoice / Receipt #
                                            </label>
                                            <Input
                                                value={invoiceNumber}
                                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                                placeholder="INV-1049"
                                                className="h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-mono font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Receipt Date
                                            </label>
                                            <Input
                                                type="date"
                                                value={receiptDate}
                                                onChange={(e) => setReceiptDate(e.target.value)}
                                                className="h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-mono font-bold"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-[#94A3B8]">
                                                Target Branch
                                            </label>
                                            {isAdmin && branches.length > 0 ? (
                                                <Select
                                                    value={String(selectedBranchId)}
                                                    onValueChange={(val) => setSelectedBranchId(Number(val))}
                                                >
                                                    <SelectTrigger className="h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {branches.map((b) => (
                                                            <SelectItem key={b.id} value={String(b.id)} className="text-xs font-bold">
                                                                {b.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <div className="h-9 flex items-center px-3 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] font-bold text-xs">
                                                    {branches.find((b) => b.id === selectedBranchId)?.name || 'Current Branch'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Line Items Table */}
                                    <div className="rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden">
                                        <div className="p-3 bg-slate-50 dark:bg-[#181820] border-b border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between">
                                            <span className="text-xs font-extrabold uppercase text-[#5D4A4D] dark:text-[#94A3B8]">
                                                Extracted Items ({lineItems.length})
                                            </span>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={addNewLineItem}
                                                className="h-7 text-xs font-bold text-[#E75480] dark:text-[#FF4F81] gap-1 hover:bg-[#FFF5F7] dark:hover:bg-white/5 rounded-xl"
                                            >
                                                <Plus className="size-3.5" /> Add Item
                                            </Button>
                                        </div>

                                        <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                                            {lineItems.length === 0 ? (
                                                <div className="p-8 text-center text-xs text-slate-400">
                                                    No line items detected. Click "+ Add Item" to manually register items.
                                                </div>
                                            ) : (
                                                lineItems.map((item, idx) => {
                                                    const isMatched = !!item.suggested_ingredient_id;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={cn(
                                                                'p-3.5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs',
                                                                !isMatched
                                                                    ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                                                    : 'bg-white dark:bg-[#121218] hover:bg-slate-50/50 dark:hover:bg-[#181820]/50'
                                                            )}
                                                        >
                                                            {/* Item Description & Raw Line */}
                                                            <div className="w-full sm:w-1/4 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                                                        {item.description || 'Custom Item'}
                                                                    </span>
                                                                    <Badge
                                                                        className={cn(
                                                                            'text-[9px] font-mono px-2 py-0.5 rounded-full border-0',
                                                                            item.confidence_tier === 'HIGH'
                                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                                                                                : item.confidence_tier === 'MEDIUM'
                                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                                        )}
                                                                    >
                                                                        {item.confidence_tier} ({item.match_score || 0}%)
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-[10px] font-mono text-slate-400 truncate">
                                                                    Raw: "{item.raw_line}"
                                                                </p>
                                                            </div>

                                                            {/* Matched Ingredient Dropdown */}
                                                            <div className="w-full sm:w-1/3">
                                                                <select
                                                                    value={item.suggested_ingredient_id ?? ''}
                                                                    onChange={(e) =>
                                                                        updateLineItem(idx, {
                                                                            suggested_ingredient_id: e.target.value
                                                                                ? Number(e.target.value)
                                                                                : null,
                                                                        })
                                                                    }
                                                                    className={cn(
                                                                        'w-full h-9 px-2.5 rounded-xl border text-xs font-bold appearance-none bg-white dark:bg-[#181820]',
                                                                        !isMatched
                                                                            ? 'border-amber-400 text-amber-800 dark:text-amber-300'
                                                                            : 'border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]'
                                                                    )}
                                                                >
                                                                    <option value="">-- Select Matched Ingredient --</option>
                                                                    {inventory.map((inv) => (
                                                                        <option key={inv.id} value={inv.id}>
                                                                            {inv.name} ({inv.unit || 'pcs'})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {/* Quantity & Unit */}
                                                            <div className="flex items-center gap-1.5 w-full sm:w-36">
                                                                <Input
                                                                    type="number"
                                                                    step="0.0001"
                                                                    value={item.quantity}
                                                                    onChange={(e) =>
                                                                        updateLineItem(idx, {
                                                                            quantity: Number(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="w-20 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-mono font-bold"
                                                                />
                                                                <select
                                                                    value={item.unit}
                                                                    onChange={(e) => updateLineItem(idx, { unit: e.target.value })}
                                                                    className="h-9 px-1.5 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-[11px] font-mono font-bold appearance-none"
                                                                >
                                                                    <option value="kg">kg</option>
                                                                    <option value="g">g</option>
                                                                    <option value="mg">mg</option>
                                                                    <option value="L">L</option>
                                                                    <option value="ml">ml</option>
                                                                    <option value="pcs">pcs</option>
                                                                    <option value="box">box</option>
                                                                    <option value="pack">pack</option>
                                                                </select>
                                                            </div>

                                                            {/* Price / Line Total */}
                                                            <div className="flex items-center gap-1.5 w-full sm:w-44">
                                                                <div className="space-y-0.5 flex-1">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-[10px] text-slate-400 font-mono">₱</span>
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={item.line_total}
                                                                            onChange={(e) => {
                                                                                const total = Number(e.target.value) || 0;
                                                                                const qty = Number(item.quantity) || 1;
                                                                                updateLineItem(idx, {
                                                                                    line_total: total,
                                                                                    unit_price: qty > 0 ? total / qty : 0,
                                                                                });
                                                                            }}
                                                                            className="h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#181820] text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400"
                                                                        />
                                                                    </div>
                                                                    <p className="text-[9px] font-mono text-slate-400 text-right">
                                                                        @ ₱{Number(item.unit_price || 0).toFixed(2)}/{item.unit}
                                                                    </p>
                                                                </div>

                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => removeLineItem(idx)}
                                                                    className="size-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl shrink-0"
                                                                >
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Financial Totals Footer */}
                                        <div className="p-4 bg-slate-50 dark:bg-[#181820] border-t border-[#F8C8DC]/40 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                                            <div className="flex items-center gap-4">
                                                <div>
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Line Items:</span>{' '}
                                                    <strong className="font-mono">{lineItems.length}</strong>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Subtotal:</span>{' '}
                                                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                                        ₱{calculatedSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </strong>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Tax (₱):</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={taxAmount}
                                                        onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                                                        className="w-18 h-8 rounded-xl font-mono text-xs"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] uppercase text-slate-400 font-bold">Discount (₱):</span>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={discountAmount}
                                                        onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                                                        className="w-18 h-8 rounded-xl font-mono text-xs"
                                                    />
                                                </div>

                                                <div className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-3">
                                                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                                        Calculated Total:
                                                    </span>{' '}
                                                    <strong className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                                                        ₱{calculatedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Footers */}
                                    <DialogFooter className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10 gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep('upload')}
                                            className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10"
                                        >
                                            Back to Upload
                                        </Button>

                                        <Button
                                            type="button"
                                            disabled={lineItems.length === 0}
                                            onClick={handleProceedToConfirm}
                                            className="rounded-xl h-11 px-6 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-sm"
                                        >
                                            <ShieldCheck className="size-4" /> Review & Confirm Stock-In
                                        </Button>
                                    </DialogFooter>
                                </div>
                            )}

                            {/* STEP 4: SUCCESS VIEW */}
                            {step === 'success' && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                                        <Check className="size-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                            Stock-In Successfully Executed!
                                        </h3>
                                        <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                            All items have been added to{' '}
                                            <strong>{branches.find((b) => b.id === selectedBranchId)?.name || 'the branch'}</strong>{' '}
                                            inventory with Weighted Average Costing updated.
                                        </p>
                                    </div>
                                    <div className="pt-2 flex items-center gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep('upload')}
                                            className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10"
                                        >
                                            Scan Another Receipt
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={() => onOpenChange(false)}
                                            className="rounded-xl h-11 px-6 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold cursor-pointer"
                                        >
                                            Close & View Inventory
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: SCAN HISTORY */}
                    {tab === 'history' && (
                        <div className="flex-1 overflow-y-auto py-2 space-y-3 pr-1">
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-[#181820] text-xs font-bold">
                                <span>Recent Receipt Scans & Audits</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={fetchHistory}
                                    className="h-7 text-xs font-bold gap-1 rounded-xl"
                                >
                                    <RefreshCw className="size-3" /> Refresh
                                </Button>
                            </div>

                            {loadingHistory ? (
                                <div className="py-12 text-center text-xs text-slate-400">Loading receipt history...</div>
                            ) : historyList.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    No previously scanned receipts found for this branch.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-white/5 rounded-3xl border border-[#F8C8DC]/60 dark:border-white/10 overflow-hidden text-xs">
                                    {historyList.map((rec) => (
                                        <div key={rec.id} className="p-3.5 bg-white dark:bg-[#121218] flex items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <strong className="font-bold">{rec.supplier_name || 'Vendor'}</strong>
                                                    <span className="font-mono text-[11px] text-slate-400">
                                                        #{rec.invoice_number || `REC-${rec.id}`}
                                                    </span>
                                                    <Badge
                                                        className={cn(
                                                            'text-[10px] font-bold px-2 py-0.5 rounded-full border-0',
                                                            rec.status === 'completed'
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                                : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                                                        )}
                                                    >
                                                        {rec.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                                                    <span>Branch: {rec.branch?.name || 'N/A'}</span>
                                                    <span>Date: {rec.receipt_date || 'N/A'}</span>
                                                    <span>Processed by: {rec.processor?.name || rec.user?.name || 'Staff'}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                    ₱{Number(rec.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {new Date(rec.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* CONFIRMATION MODAL */}
            <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
                <DialogContent className="max-w-md rounded-4xl bg-white dark:bg-[#121218] p-6 font-['Outfit'] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                            Confirm Receipt Stock-In
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                            Please confirm updating inventory stock for{' '}
                            <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Branch'}
                            </strong>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-3 space-y-2 text-xs">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#181820] space-y-1.5 font-medium">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Supplier:</span>
                                <strong>{supplierName || 'Unknown Vendor'}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Invoice Number:</span>
                                <strong className="font-mono">{invoiceNumber || 'N/A'}</strong>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Items to Stock In:</span>
                                <strong>{lineItems.length} ingredients</strong>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 dark:border-white/10 pt-1.5">
                                <span className="text-slate-400 font-bold">Total Purchase Cost:</span>
                                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                                    ₱{calculatedGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-2 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmModalOpen(false)}
                            className="rounded-xl text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={isSubmittingStockIn}
                            onClick={handleFinalStockIn}
                            className="rounded-xl text-xs font-bold bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white"
                        >
                            {isSubmittingStockIn ? 'Posting to Inventory...' : 'Confirm Stock-In'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
