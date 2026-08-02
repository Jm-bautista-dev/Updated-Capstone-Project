import axios from 'axios';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    FiUploadCloud,
    FiCamera,
    FiFileText,
    FiCheck,
    FiRefreshCw,
    FiAlertTriangle,
    FiTrash2,
    FiList,
    FiZap
} from 'react-icons/fi';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
    [key: string]: unknown;
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
    const [isAutoMode, setIsAutoMode] = useState(false);

    const [processingStage, setProcessingStage] = useState<'uploading' | 'ocr' | 'matching'>('uploading');
    const [receiptId, setReceiptId] = useState<number | null>(null);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [lowConfidenceWarning, setLowConfidenceWarning] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const resetScanState = () => {
        setScannedItems([]);
        setReceiptId(null);
        setLowConfidenceWarning(false);
        setSubmitting(false);
        setProcessingStage('uploading');
    };

    const uniqueIngredients = useMemo(() => {
        const seen = new Set();
        return (inventory || []).filter(ing => {
            if (!ing || seen.has(ing.id)) return false;
            seen.add(ing.id);
            return true;
        });
    }, [inventory]);

    useEffect(() => {
        if (open) {
            setMode('upload');
            setFile(null);
            setPreviewUrl(null);
            resetScanState();
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (selectedFile: File) => {
        if (!selectedFile) return;
        resetScanState();
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setFile(selectedFile);
        setPreviewUrl(URL.createObjectURL(selectedFile));
    };

    const handleUploadAndProcess = async () => {
        if (!file) {
            toast.error('Please select or capture a receipt first.');
            return;
        }

        resetScanState();
        setMode('processing');
        setProcessingStage('uploading');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('branch_id', String(branchId));

        try {
            const uploadRes = await axios.post('/api/receipts/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (!uploadRes.data.success) {
                throw new Error(uploadRes.data.message || 'Upload failed');
            }

            const uploadedReceiptId = uploadRes.data.receipt_id;
            setReceiptId(uploadedReceiptId);

            setProcessingStage('ocr');
            const processRes = await axios.post('/api/receipts/process', {
                receipt_id: uploadedReceiptId
            });

            if (!processRes.data.success) {
                throw new Error(processRes.data.message || 'OCR extraction failed');
            }

            setProcessingStage('matching');
            await new Promise((resolve) => setTimeout(resolve, 800));

            const items: ScannedItem[] = processRes.data.items || [];
            setScannedItems(items);
            setLowConfidenceWarning(processRes.data.low_confidence || false);

            setMode('review');
            toast.success('Receipt processed successfully!');
        } catch (err) {
            console.error(err);
            setMode('upload');
            const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : (err instanceof Error ? err.message : 'OCR processing failed.');
            toast.error(msg);
        }
    };

    const handleConfirmStockIn = async () => {
        const invalidItem = scannedItems.find(item => !item.suggested_match_id);
        if (invalidItem) {
            toast.error(`Please match "${invalidItem.item_name}" to a valid database product.`);
            return;
        }

        setSubmitting(true);

        const stockInPayload = {
            branch_id: branchId,
            receipt_id: receiptId,
            items: scannedItems.map(item => ({
                id: item.suggested_match_id,
                type: 'ingredient',
                quantity: item.detected_qty,
                unit: item.detected_unit,
                purchase_price: 0
            }))
        };

        try {
            const res = await axios.post('/api/inventory/stock-in', stockInPayload);
            if (res.data.success) {
                setMode('success');
                toast.success('Inventory restocked successfully!');
                if (onSuccess) onSuccess();
            } else {
                toast.error(res.data.message || 'Stock-in failed');
            }
        } catch (err) {
            console.error(err);
            const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Inventory stock-in failed.';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateRowMatch = (idx: number, ingredientId: number) => {
        const selectedIng = inventory.find(ing => ing.id === ingredientId);
        const newItems = [...scannedItems];
        newItems[idx].suggested_match_id = ingredientId;
        newItems[idx].suggested_match_name = selectedIng ? selectedIng.name : 'Unknown';
        newItems[idx].needs_review = false;

        const hasLowConf = newItems.some(i => i.needs_review || !i.suggested_match_id);
        setLowConfidenceWarning(hasLowConf);
        setScannedItems(newItems);
    };

    const handleUpdateRowQty = (idx: number, qty: string) => {
        const val = parseFloat(qty) || 0;
        const newItems = [...scannedItems];
        newItems[idx].detected_qty = val;
        setScannedItems(newItems);
    };

    const handleUpdateRowUnit = (idx: number, unit: string) => {
        const newItems = [...scannedItems];
        newItems[idx].detected_unit = unit;
        setScannedItems(newItems);
    };

    const handleRemoveRow = (idx: number) => {
        const newItems = scannedItems.filter((_, i) => i !== idx);
        setScannedItems(newItems);
        const hasLowConf = newItems.some(i => i.needs_review || !i.suggested_match_id);
        setLowConfidenceWarning(hasLowConf);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-175 max-h-[92vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl z-100">
                <DialogHeader className="bg-primary/5 p-6 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <FiFileText className="size-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold tracking-tight uppercase">Receipt Scanner</DialogTitle>
                                <DialogDescription className="text-xs font-medium">Automatic OCR-based Inventory Stock-In</DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAutoMode(false)}
                                className={cn(
                                    "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                                    !isAutoMode ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <FiList className="size-3 mr-1" /> Review Mode
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsAutoMode(true)}
                                className={cn(
                                    "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                                    isAutoMode ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-muted-foreground hover:text-amber-500"
                                )}
                            >
                                <FiZap className="size-3 mr-1" /> Auto Mode
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                {mode === 'upload' && (
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                        <div className="grid grid-cols-2 gap-4">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/2 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-50"
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                                        e.target.value = '';
                                    }}
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                />
                                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <FiUploadCloud className="size-6 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-bold">Upload Receipt File</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Supports PNG, JPG, PDF (Max 10MB)</span>
                            </div>

                            <div
                                onClick={() => cameraInputRef.current?.click()}
                                className="border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/2 transition-all rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer min-h-50"
                            >
                                <input
                                    type="file"
                                    ref={cameraInputRef}
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleFileChange(e.target.files[0]);
                                        e.target.value = '';
                                    }}
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                />
                                <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                                    <FiCamera className="size-6 text-muted-foreground" />
                                </div>
                                <span className="text-sm font-bold">Snap Camera Photo</span>
                                <span className="text-[10px] text-muted-foreground mt-1">Capture live photo from device camera</span>
                            </div>
                        </div>

                        {file && (
                            <div className="p-4 bg-muted/40 rounded-2xl border flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {previewUrl && file.type.startsWith('image/') ? (
                                        <img src={previewUrl} className="size-12 rounded-xl object-cover border" alt="Preview" />
                                    ) : (
                                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FiFileText className="size-6" /></div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold truncate max-w-62.5">{file.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreviewUrl(null); }} className="rounded-xl font-bold text-xs">Remove</Button>
                                    <Button onClick={handleUploadAndProcess} className="rounded-xl font-bold text-xs">Process Receipt</Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {mode === 'processing' && (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 flex-1">
                        <div className="relative size-16">
                            <span className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-base font-bold uppercase tracking-tight">
                                {processingStage === 'uploading' && 'Uploading Receipt...'}
                                {processingStage === 'ocr' && 'Extracting text using OCR...'}
                                {processingStage === 'matching' && 'Matching items to inventory...'}
                            </p>
                            <p className="text-xs text-muted-foreground max-w-75">
                                {processingStage === 'uploading' && 'Sending the receipt securely to the server.'}
                                {processingStage === 'ocr' && 'Converting image pixels to readable text blocks.'}
                                {processingStage === 'matching' && 'Aligning ingredients with Capstone records.'}
                            </p>
                        </div>
                    </div>
                )}

                {mode === 'review' && (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                            {lowConfidenceWarning && (
                                <Alert variant="destructive" className="bg-amber-500/5 border-amber-500/20 text-amber-600 rounded-2xl">
                                    <FiAlertTriangle className="size-4 text-amber-500" />
                                    <AlertDescription className="text-[10px] font-black uppercase tracking-tight ml-2">
                                        Low confidence detection. Manual review & alignment recommended.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {scannedItems.length === 0 ? (
                                <div className="py-20 text-center">
                                    <p className="text-sm font-bold text-muted-foreground">No readable items could be parsed from the receipt.</p>
                                    <Button variant="outline" onClick={() => setMode('upload')} className="rounded-xl mt-4 text-xs font-bold">Go Back</Button>
                                </div>
                            ) : (
                                <div className="border rounded-2xl overflow-hidden shadow-inner bg-card">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/30 border-b text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                <th className="p-3 pl-4">Detected Name</th>
                                                <th className="p-3">Suggested Match</th>
                                                <th className="p-3 text-right">Qty</th>
                                                <th className="p-3 text-center">Unit</th>
                                                <th className="p-3 text-center">Confidence</th>
                                                <th className="p-3 text-center pr-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {scannedItems.map((item, idx) => (
                                                <tr key={idx} className="hover:bg-muted/10 text-xs">
                                                    <td className="p-3 pl-4 font-bold text-muted-foreground max-w-37.5 truncate" title={item.item_name}>
                                                        {item.item_name}
                                                    </td>
                                                    <td className="p-3">
                                                        <select
                                                            value={item.suggested_match_id || ''}
                                                            onChange={(e) => handleUpdateRowMatch(idx, Number(e.target.value))}
                                                            className={cn(
                                                                "h-9 px-2 bg-muted/40 border-none ring-1 ring-border/50 text-xs font-bold uppercase rounded-lg w-full transition-all focus:ring-primary/50",
                                                                !item.suggested_match_id ? "ring-rose-500/50 bg-rose-500/3 text-rose-600" : "text-foreground"
                                                            )}
                                                        >
                                                            <option value="" disabled className="text-muted-foreground">-- Select Match --</option>
                                                            {uniqueIngredients.map((ing) => (
                                                                <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-right w-20">
                                                        <Input
                                                            type="number"
                                                            step="any"
                                                            value={item.detected_qty}
                                                            onChange={(e) => handleUpdateRowQty(idx, e.target.value)}
                                                            className="h-9 w-16 text-right font-black italic rounded-lg text-xs"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center w-24">
                                                        <select
                                                            value={item.detected_unit}
                                                            onChange={(e) => handleUpdateRowUnit(idx, e.target.value)}
                                                            className="h-9 px-2 bg-muted/45 border-none ring-1 ring-border/50 text-xs font-bold rounded-lg w-full focus:ring-primary/50"
                                                        >
                                                            <option value="g">g</option>
                                                            <option value="kg">kg</option>
                                                            <option value="ml">ml</option>
                                                            <option value="L">L</option>
                                                            <option value="pcs">pcs</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "text-[9px] font-black uppercase py-0.5",
                                                                item.confidence >= 80 ? "border-emerald-500/20 text-emerald-600 bg-emerald-500/2" :
                                                                item.confidence >= 50 ? "border-amber-500/20 text-amber-600 bg-amber-500/2" :
                                                                "border-rose-500/20 text-rose-600 bg-rose-500/2"
                                                            )}
                                                        >
                                                            {item.confidence}%
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-center pr-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleRemoveRow(idx)}
                                                            className="size-8 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                                        >
                                                            <FiTrash2 className="size-3.5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="p-6 bg-muted/20 border-t shrink-0">
                            <div className="flex gap-3 justify-end w-full">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        resetScanState();
                                        setFile(null);
                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                        if (cameraInputRef.current) cameraInputRef.current.value = '';
                                        setMode('upload');
                                    }}
                                    className="rounded-xl font-bold text-xs"
                                >
                                    Cancel and Reupload
                                </Button>
                                <Button
                                    onClick={handleConfirmStockIn}
                                    disabled={submitting || scannedItems.length === 0}
                                    className="rounded-xl font-bold text-xs gap-2"
                                >
                                    {submitting && <FiRefreshCw className="size-3.5 animate-spin" />}
                                    Confirm Stock-In
                                </Button>
                            </div>
                        </DialogFooter>
                    </div>
                )}

                {mode === 'success' && (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-6 flex-1">
                        <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <FiCheck className="size-8" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-base font-bold uppercase tracking-tight">Stock-in Completed!</p>
                            <p className="text-xs text-muted-foreground max-w-70">
                                The scanned items have been matched and restocked in the branch inventory.
                            </p>
                        </div>
                        <Button onClick={() => onOpenChange(false)} className="rounded-xl px-6 font-bold text-xs">Close</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
