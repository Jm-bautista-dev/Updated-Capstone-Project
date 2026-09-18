import React, { useState, useEffect } from 'react';
import { 
    FiCheckCircle, 
    FiAlertTriangle, 
    FiPrinter, 
    FiRotateCw,
    FiSettings
} from 'react-icons/fi';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { 
    printReceiptToThermalPrinter, 
    triggerBrowserThermalPrint, 
    getPrinterConfig,
    type LocalPrintJobPayload 
} from '@/lib/pos-print-bridge';
import { cn, formatCurrency } from '@/lib/utils';
import { PrinterSettingsModal } from './PrinterSettingsModal';
import { ThermalReceipt58mm } from './ThermalReceipt58mm';

export type PrintStatus = 'idle' | 'printing' | 'success' | 'failed' | 'bridge_offline';

export interface PostCheckoutReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    printJob: LocalPrintJobPayload | null;
    initialStatus?: PrintStatus;
    isBridgeConnected?: boolean;
    branchName?: string;
    branchId?: number;
    saleSummary?: {
        orderNumber?: string;
        total?: number;
        paidAmount?: number;
        changeAmount?: number;
        paymentMethod?: string;
    } | null;
}

export const PostCheckoutReceiptModal: React.FC<PostCheckoutReceiptModalProps> = ({
    isOpen,
    onClose,
    printJob,
    initialStatus = 'idle',
    isBridgeConnected = false,
    branchName = 'VICTORIA',
    branchId,
    saleSummary,
}) => {
    const [status, setStatus] = useState<PrintStatus>(initialStatus);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isRetrying, setIsRetrying] = useState<boolean>(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

    const config = getPrinterConfig();
    const isUniversalMode = config.connection_type === 'universal_browser';

    useEffect(() => {
        setStatus(initialStatus);
        if (initialStatus === 'failed') {
            setStatusMessage('Direct printer link unavailable. You can print via Universal 58mm Web Print.');
        } else if (initialStatus === 'bridge_offline') {
            setStatusMessage(isUniversalMode ? 'Receipt ready for universal 58mm thermal printing.' : 'Print bridge service is offline. You can print via Universal Web Print.');
        } else if (initialStatus === 'success') {
            setStatusMessage('Receipt prepared for 58mm thermal printer.');
        } else if (initialStatus === 'idle') {
            setStatusMessage('Receipt ready for printing.');
        }
    }, [initialStatus, isOpen, isBridgeConnected, isUniversalMode]);

    const orderNum = printJob?.order_number || saleSummary?.orderNumber || 'POS-ORDER';
    const totalAmount = printJob?.receipt_data?.total ?? saleSummary?.total ?? 0;
    const changeAmount = printJob?.receipt_data?.change_amount ?? saleSummary?.changeAmount ?? 0;

    /**
     * Safe Retry Silent Print:
     * Dispatches to direct hardware or print bridge.
     * Guaranteed zero effect on sales, inventory, or payments.
     */
    const handleRetrySilentPrint = async () => {
        if (!printJob) {
            toast.error('No receipt payload available for reprinting.');
            return;
        }

        const currentConfig = getPrinterConfig();
        setIsRetrying(true);
        setStatus('printing');
        setStatusMessage('Sending receipt to thermal printer...');

        try {
            const res = await printReceiptToThermalPrinter(printJob, currentConfig);
            if (res.success) {
                setStatus('success');
                setStatusMessage('Receipt sent to printer.');
                toast.success(`✓ Thermal receipt ready for #${orderNum}`);
            } else {
                setStatus('failed');
                setStatusMessage(res.message || 'Direct hardware unavailable. Tap Print via Browser below.');
                toast.warning(`Direct print failed: ${res.message}`);
            }
        } catch (err: unknown) {
            setStatus('failed');
            const msg = err instanceof Error ? err.message : 'Error sending receipt to printer.';
            setStatusMessage(`Printing failed: ${msg}`);
            toast.error('Failed to communicate with printer.');
        } finally {
            setIsRetrying(false);
        }
    };

    /**
     * Native Browser 58mm Thermal Print:
     * Triggers the OS print dialog for the paired Bluetooth/USB thermal printer
     * using the exact 58mm layout rules.
     */
    const handleBrowserPrint = () => {
        triggerBrowserThermalPrint();
        toast.info('Opening print dialog for 58mm receipt...');
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#151518] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-100 font-['Outfit'] shadow-2xl rounded-3xl">
                    
                    {/* Header */}
                    <DialogHeader className="p-5 sm:p-6 bg-linear-to-b from-[#FFF5F7] to-white dark:from-[#1E1E24] dark:to-[#151518] border-b border-[#F8C8DC]/40 dark:border-white/10 shrink-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="size-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                                    <FiCheckCircle className="size-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg sm:text-xl font-black text-[#3D2C2E] dark:text-white flex items-center gap-2">
                                        <span>Payment Successful</span>
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#E75480]/10 text-[#E75480] dark:bg-[#FF4F81]/15 dark:text-[#FF4F81]">
                                            #{orderNum}
                                        </span>
                                    </DialogTitle>
                                    <DialogDescription className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                                        Sale recorded successfully. Transaction total: <strong className="text-gray-800 dark:text-gray-200">{formatCurrency(totalAmount)}</strong>
                                        {changeAmount > 0 && (
                                            <span> • Change: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(changeAmount)}</strong></span>
                                        )}
                                    </DialogDescription>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="h-8 px-2.5 rounded-xl border-[#F8C8DC]/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 text-xs font-bold gap-1.5 cursor-pointer hover:bg-[#FFF5F7]"
                                title="Open thermal printer settings"
                            >
                                <FiSettings className="size-3.5 text-[#E75480]" />
                                <span className="hidden sm:inline">Settings</span>
                            </Button>
                        </div>

                        {/* Printer Status Banner */}
                        <div className="mt-4">
                            {(status === 'success' || status === 'idle' || (status === 'bridge_offline' && isUniversalMode)) && (
                                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                    <FiCheckCircle className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>{statusMessage || '✓ Receipt ready for 58mm thermal print.'}</span>
                                </div>
                            )}

                            {status === 'failed' && (
                                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FiAlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <span>Direct print unavailable. Tap <strong>Print 58mm Receipt</strong> below.</span>
                                    </div>
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleBrowserPrint}
                                        className="h-7 px-3 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                                    >
                                        <FiPrinter className="size-3 mr-1" />
                                        Print Now
                                    </Button>
                                </div>
                            )}

                            {status === 'bridge_offline' && !isUniversalMode && (
                                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <FiAlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <span>Print bridge offline. Tap <strong>Print 58mm Receipt</strong> for zero-install print.</span>
                                    </div>
                                </div>
                            )}

                            {status === 'printing' && (
                                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 text-xs font-semibold">
                                    <FiRotateCw className="size-4 shrink-0 text-blue-600 dark:text-blue-400 animate-spin" />
                                    <span>{statusMessage || 'Preparing receipt for thermal printer...'}</span>
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    {/* Body: Thermal 58mm Receipt Preview */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/70 dark:bg-black/20 flex flex-col items-center">
                        <div className="w-full max-w-[320px] bg-white text-black p-4 rounded-2xl shadow-md border border-slate-200 dark:border-zinc-800 flex flex-col items-center">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 pb-2 border-b w-full text-center mb-2">
                                58mm Thermal Receipt Preview
                            </div>
                            <ThermalReceipt58mm
                                receiptData={printJob?.receipt_data}
                                formattedText={printJob?.formatted_text}
                                className="shadow-none border-0"
                            />
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <DialogFooter className="p-4 sm:p-5 bg-white dark:bg-[#171719] border-t border-[#F8C8DC]/40 dark:border-white/10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-1">
                            {/* Primary Universal 58mm Print Button */}
                            <Button
                                type="button"
                                onClick={handleBrowserPrint}
                                className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/20"
                                title="Print using the device's paired thermal printer (Zero Install)"
                            >
                                <FiPrinter className="size-4" />
                                <span>Print 58mm Receipt</span>
                            </Button>

                            {/* Optional Direct Retry Button if in hardware mode */}
                            {!isUniversalMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRetrySilentPrint}
                                    disabled={isRetrying || !printJob}
                                    className="h-11 px-4 rounded-xl border-[#F8C8DC]/60 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[#3D2C2E] dark:text-zinc-200 hover:bg-[#FFF5F7] dark:hover:bg-zinc-800 text-xs font-bold gap-1.5 cursor-pointer transition-all"
                                    title="Retry sending receipt silently through the hardware port"
                                >
                                    <FiRotateCw className={cn("size-3.5", isRetrying && "animate-spin text-[#E75480]")} />
                                    <span>Silent Retry</span>
                                </Button>
                            )}
                        </div>

                        {/* New Order / Dismiss Button */}
                        <Button
                            type="button"
                            onClick={onClose}
                            className="h-11 px-6 rounded-xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-extrabold cursor-pointer transition-all shadow-md shadow-[#E75480]/20"
                        >
                            <span>New Order</span>
                        </Button>
                    </DialogFooter>

                </DialogContent>
            </Dialog>

            {/* Nested Printer Settings Modal */}
            <PrinterSettingsModal
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                branchName={branchName}
                branchId={branchId}
            />
        </>
    );
};

export default PostCheckoutReceiptModal;
