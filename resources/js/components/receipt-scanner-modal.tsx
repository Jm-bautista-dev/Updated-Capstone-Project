import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';
import {
    FiUploadCloud,
    FiCamera,
    FiFileText,
    FiCheck,
    FiRefreshCw,
    FiTrash2,
    FiList,
    FiZap
} from 'react-icons/fi';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

interface InventoryItem {
    id: number;
    name: string;
    unit?: string;
}

interface ReceiptScannerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    branchId: number;
    inventory: InventoryItem[];
    onSuccess?: () => void;
}

type Mode = 'upload' | 'processing' | 'review' | 'success';

interface ScannedItem {
    raw_line: string;
    item_name: string;
    detected_qty: number;
    detected_unit: string;
    suggested_match_id: number | null;
    suggested_match_name: string | null;
    confidence: number;
    needs_review: boolean;
}

export function ReceiptScannerModal({ open, onOpenChange, branchId, inventory, onSuccess }: ReceiptScannerModalProps) {
    const [mode, setMode] = useState<Mode>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [processingStage, setProcessingStage] = useState<'uploading' | 'ocr' | 'matching'>('uploading');
    const [receiptId, setReceiptId] = useState<number | null>(null);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [selectedMatches, setSelectedMatches] = useState<Record<number, number | null>>({});
    const [editedQty, setEditedQty] = useState<Record<number, number>>({});
    const [editedUnits, setEditedUnits] = useState<Record<number, string>>({});
    const [supplierName, setSupplierName] = useState<string>('');
    const [receiptDate, setReceiptDate] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Drag-and-drop & Camera File Inputs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!open) {
            setMode('upload');
            setFile(null);
            setPreviewUrl((prevUrl) => {
                if (prevUrl) URL.revokeObjectURL(prevUrl);
                return null;
            });
            setScannedItems([]);
            setSelectedMatches({});
            setEditedQty({});
            setEditedUnits({});
            setSupplierName('');
            setReceiptDate('');
            setIsSubmitting(false);
        }
    }, [open]);

    const handleFileSelect = (selectedFile: File) => {
        if (!selectedFile.type.startsWith('image/')) {
            toast.error('Please upload an image file (JPEG, PNG, WebP).');
            return;
        }
        if (selectedFile.size > 10 * 1024 * 1024) {
            toast.error('File size exceeds 10MB limit.');
            return;
        }
        setFile(selectedFile);
        setPreviewUrl((prevUrl) => {
            if (prevUrl) URL.revokeObjectURL(prevUrl);
            return URL.createObjectURL(selectedFile);
        });
    };

    const handleStartScan = async (autoApply: boolean = false) => {
        if (!file) {
            toast.error('Please select or capture a receipt image first.');
            return;
        }

        setMode('processing');
        setProcessingStage('uploading');

        const formData = new FormData();
        formData.append('receipt_image', file);

        try {
            // Stage 1: Uploading & OCR
            setProcessingStage('ocr');
            const res = await axios.post('/inventory/scan-receipt', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!res.data.success) {
                toast.error(res.data.message || 'Failed to process receipt.');
                setMode('upload');
                return;
            }

            // Stage 2: Fuzzy Matching
            setProcessingStage('matching');
            const items: ScannedItem[] = res.data.items || [];
            setReceiptId(res.data.receipt_id || null);
            setSupplierName(res.data.supplier_name || '');
            setReceiptDate(res.data.receipt_date || '');

            const initialMatches: Record<number, number | null> = {};
            const initialQty: Record<number, number> = {};
            const initialUnits: Record<number, string> = {};

            items.forEach((item, index) => {
                initialMatches[index] = item.suggested_match_id;
                initialQty[index] = item.detected_qty;
                initialUnits[index] = item.detected_unit;
            });

            setScannedItems(items);
            setSelectedMatches(initialMatches);
            setEditedQty(initialQty);
            setEditedUnits(initialUnits);

            // Auto-Apply Flow vs Manual Review
            if (autoApply) {
                // Instantly apply high-confidence matches (> 70%)
                const autoPayload = items
                    .map((item, index) => ({
                        ingredient_id: initialMatches[index],
                        quantity: initialQty[index],
                        unit: initialUnits[index],
                        confidence: item.confidence
                    }))
                    .filter(row => row.ingredient_id && row.quantity > 0 && row.confidence >= 70);

                if (autoPayload.length === 0) {
                    toast.info('No high-confidence matches found for auto-apply. Please review items manually.');
                    setMode('review');
                    return;
                }

                await submitStockAdjustments(autoPayload, res.data.receipt_id);
            } else {
                setMode('review');
            }
        } catch (err: unknown) {
            console.error('Scan receipt error:', err);
            const errResponse = (err as { response?: { data?: { message?: string } } })?.response;
            toast.error(errResponse?.data?.message || 'Server error while scanning receipt.');
            setMode('upload');
        }
    };

    const submitStockAdjustments = async (
        itemsToSubmit: Array<{ ingredient_id: number | null; quantity: number; unit: string }>,
        recId: number | null
    ) => {
        setIsSubmitting(true);
        try {
            const validRows = itemsToSubmit.filter(r => r.ingredient_id && r.quantity > 0);

            if (validRows.length === 0) {
                toast.error('No valid matched items to restock.');
                setIsSubmitting(false);
                return;
            }

            const res = await axios.post('/inventory/apply-receipt-restock', {
                branch_id: branchId,
                receipt_id: recId,
                items: validRows
            });

            if (res.data.success) {
                setMode('success');
                toast.success(res.data.message || 'Receipt restock applied successfully!');
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.data.message || 'Failed to apply restock.');
            }
        } catch (err: unknown) {
            console.error('Apply receipt restock error:', err);
            const errResponse = (err as { response?: { data?: { message?: string } } })?.response;
            toast.error(errResponse?.data?.message || 'Error applying restock.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleManualConfirm = () => {
        const payload = scannedItems.map((item, index) => ({
            ingredient_id: selectedMatches[index] || null,
            quantity: Number(editedQty[index] || 0),
            unit: editedUnits[index] || 'g'
        }));
        submitStockAdjustments(payload, receiptId);
    };

    const handleRemoveItem = (indexToRemove: number) => {
        setScannedItems(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#F8FAFC] rounded-3xl p-6 shadow-2xl font-['Outfit'] transition-all">
                <DialogHeader className="border-b border-[#F8C8DC]/40 dark:border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                                <FiFileText className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold">AI Receipt Restock Scanner</DialogTitle>
                                <DialogDescription className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">
                                    Upload delivery receipts or supplier invoices for automated stock-in.
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* MODE 1: UPLOAD & CAPTURE */}
                {mode === 'upload' && (
                    <div className="space-y-5 pt-2">
                        {/* Drag and Drop Zone */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[#F8C8DC] dark:border-white/20 hover:border-[#E75480] dark:hover:border-[#FF4F81] rounded-3xl p-8 text-center cursor-pointer transition-all bg-[#FFF5F7]/50 dark:bg-[#181820]/50 hover:bg-[#FFF5F7] dark:hover:bg-[#181820] flex flex-col items-center justify-center gap-3 group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
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
                                <div className="relative w-full max-h-56 rounded-2xl overflow-hidden border border-[#F8C8DC] dark:border-white/10">
                                    <img src={previewUrl} alt="Receipt Preview" className="w-full h-full object-contain max-h-56 mx-auto" />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-2">
                                        <FiRefreshCw className="size-4" /> Change Image
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="size-14 rounded-2xl bg-white dark:bg-[#20202C] shadow-md border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-center text-[#E75480] dark:text-[#FF4F81] group-hover:scale-110 transition-transform">
                                        <FiUploadCloud className="size-7" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">Click to upload or drag & drop receipt</p>
                                        <p className="text-xs text-[#9E8B8E] dark:text-[#64748B] mt-0.5">Supports PNG, JPG, WebP up to 10MB</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => cameraInputRef.current?.click()}
                                className="flex-1 h-12 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-bold gap-2 text-[#3D2C2E] dark:text-[#E2E8F0] hover:bg-[#FFF5F7] dark:hover:bg-white/5"
                            >
                                <FiCamera className="size-4 text-[#E75480] dark:text-[#FF4F81]" /> Take Camera Snap
                            </Button>
                        </div>

                        <DialogFooter className="pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-[#E2E8F0]"
                            >
                                Cancel
                            </Button>
                            
                            <Button
                                type="button"
                                disabled={!file}
                                onClick={() => handleStartScan(false)}
                                className="rounded-xl h-11 px-5 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                            >
                                <FiList className="size-4" /> Scan & Review
                            </Button>

                            <Button
                                type="button"
                                disabled={!file}
                                onClick={() => handleStartScan(true)}
                                className="rounded-xl h-11 px-5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-2 cursor-pointer shadow-xs"
                            >
                                <FiZap className="size-4" /> Auto Scan & Restock
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* MODE 2: PROCESSING OCR */}
                {mode === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <div className="size-16 rounded-full border-4 border-[#F8C8DC] dark:border-white/10 border-t-[#E75480] dark:border-t-[#FF4F81] animate-spin" />
                            <FiFileText className="size-6 text-[#E75480] dark:text-[#FF4F81] absolute inset-0 m-auto animate-pulse" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">
                                {processingStage === 'uploading' && 'Uploading Receipt Image...'}
                                {processingStage === 'ocr' && 'Extracting Receipt Text via Tesseract OCR...'}
                                {processingStage === 'matching' && 'Matching Items with Inventory Database...'}
                            </h3>
                            <p className="text-xs text-[#9E8B8E] dark:text-[#64748B]">Please hold on while AI parses line items and quantities.</p>
                        </div>
                    </div>
                )}

                {/* MODE 3: REVIEW DETECTED ITEMS */}
                {mode === 'review' && (
                    <div className="space-y-4 pt-2">
                        {/* Receipt Meta Summary */}
                        <div className="p-3 rounded-2xl bg-[#FFF5F7] dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-between text-xs font-medium">
                            <div>
                                <span className="text-[#9E8B8E] dark:text-[#64748B]">Detected Supplier: </span>
                                <strong className="text-[#3D2C2E] dark:text-[#F8FAFC]">{supplierName || 'Unknown Vendor'}</strong>
                            </div>
                            <div>
                                <span className="text-[#9E8B8E] dark:text-[#64748B]">Date: </span>
                                <strong className="text-[#3D2C2E] dark:text-[#F8FAFC] font-mono">{receiptDate || 'Today'}</strong>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="max-h-72 overflow-y-auto rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 divide-y divide-[#F8C8DC]/30 dark:divide-white/5">
                            {scannedItems.map((item, idx) => {
                                const confidencePct = Math.round(item.confidence || 0);

                                return (
                                    <div key={idx} className="p-3 bg-white dark:bg-[#181820] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-[#3D2C2E] dark:text-[#F8FAFC]">{item.item_name}</span>
                                                <Badge
                                                    className={cn(
                                                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border-0',
                                                        confidencePct >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                                        confidencePct >= 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                                                        'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                                    )}
                                                >
                                                    {confidencePct}% match
                                                </Badge>
                                            </div>
                                            <p className="text-[11px] font-mono text-[#9E8B8E] dark:text-[#64748B] truncate">OCR Raw: "{item.raw_line}"</p>
                                        </div>

                                        {/* Match Dropdown */}
                                        <div className="w-48 shrink-0">
                                            <select
                                                value={selectedMatches[idx] ?? ''}
                                                onChange={(e) => setSelectedMatches(prev => ({ ...prev, [idx]: e.target.value ? Number(e.target.value) : null }))}
                                                className="w-full h-9 px-2 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] text-xs font-bold text-[#3D2C2E] dark:text-[#F8FAFC] appearance-none"
                                            >
                                                <option value="">-- Ignore Item --</option>
                                                {inventory.map(inv => (
                                                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Qty & Unit Input */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                value={editedQty[idx] ?? item.detected_qty}
                                                onChange={(e) => setEditedQty(prev => ({ ...prev, [idx]: Number(e.target.value) }))}
                                                className="w-20 h-9 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 bg-white dark:bg-[#121218] font-mono text-xs font-bold"
                                            />
                                            <span className="font-mono text-xs font-bold text-[#7D6B6E] dark:text-[#94A3B8] w-8">{editedUnits[idx] || item.detected_unit}</span>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleRemoveItem(idx)}
                                                className="size-8 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                            >
                                                <FiTrash2 className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <DialogFooter className="pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10">
                            <Button type="button" variant="outline" onClick={() => setMode('upload')} className="rounded-xl h-11 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10">
                                Back to Upload
                            </Button>
                            <Button
                                type="button"
                                disabled={isSubmitting}
                                onClick={handleManualConfirm}
                                className="rounded-xl h-11 px-5 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold cursor-pointer"
                            >
                                {isSubmitting ? 'Applying Restock...' : 'Confirm Restock'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* MODE 4: SUCCESS */}
                {mode === 'success' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
                            <FiCheck className="size-8" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-extrabold text-[#3D2C2E] dark:text-[#F8FAFC]">Receipt Restock Applied!</h3>
                            <p className="text-xs text-[#7D6B6E] dark:text-[#94A3B8]">Matched inventory stock quantities have been updated in the database.</p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl h-11 px-6 bg-[#E75480] dark:bg-[#E1062C] hover:bg-[#D43F6B] text-white text-xs font-bold cursor-pointer"
                        >
                            Close Window
                        </Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
