import React, { useState, useEffect } from 'react';
import { 
    FiPrinter, 
    FiCheckCircle, 
    FiAlertTriangle, 
    FiRotateCw, 
    FiWifi, 
    FiCpu, 
    FiSmartphone,
    FiSettings, 
    FiDownloadCloud, 
    FiHelpCircle,
    FiCheck,
    FiZap,
    FiPower,
    FiRefreshCw,
    FiRadio
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
import { Input } from '@/components/ui/input';
import { 
    usePrinterStatus, 
    sendTestPrint,
    scanAndRequestWebSerialPrinter,
    type PrinterConfig, 
    type DetectedPrinter,
    type RegisteredBridge,
    type PrinterConnectionType
} from '@/lib/pos-print-bridge';
import { cn } from '@/lib/utils';

export interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    branchName?: string;
    branchId?: number;
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
    isOpen,
    onClose,
    branchName = 'VICTORIA',
    branchId = 1,
}) => {
    const {
        status,
        isConnected,
        config,
        printers,
        bridges,
        isScanning,
        activeDirectPrinter,
        directUsbCapabilities,
        updateConfig,
        checkNow,
        scanForPrinters,
        disconnectCurrentPrinter,
    } = usePrinterStatus(branchId);

    const [formConfig, setFormConfig] = useState<PrinterConfig>(config);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [availableDetectedPrinters, setAvailableDetectedPrinters] = useState<DetectedPrinter[]>([]);
    const [showSerialFallback, setShowSerialFallback] = useState(false);

    // Synchronize local form configuration when modal opens or external state changes
    useEffect(() => {
        if (isOpen) {
            setFormConfig(config);
            setTestResult(null);
            setScanMessage(null);
            checkNow();
            if (printers.length > 0) {
                setAvailableDetectedPrinters(printers);
            }
        }
    }, [isOpen, config, checkNow, printers]);

    const handleSave = () => {
        updateConfig(formConfig);
        toast.success('Thermal printer configuration saved');
        onClose();
    };

    /**
     * Trigger Live Hardware Scanner
     */
    const handleScan = async (overrideMode?: PrinterConnectionType) => {
        const mode = overrideMode || formConfig.connection_type;
        setScanMessage(null);
        setTestResult(null);

        const res = await scanForPrinters(mode);
        if (res.success && res.printers.length > 0) {
            setAvailableDetectedPrinters(res.printers);
            const first = res.printers[0];
            setFormConfig(prev => ({
                ...prev,
                connection_type: mode,
                printer_name: first.name,
            }));
            toast.success(res.message || `Detected: ${first.name}`);
        } else {
            setScanMessage(res.message || 'No compatible printers detected.');
            if (mode === 'direct_usb') {
                setShowSerialFallback(true);
            }
        }
    };

    /**
     * Scan via WebSerial (for USB-to-COM virtual serial ports)
     */
    const handleScanSerial = async () => {
        setScanMessage(null);
        const res = await scanAndRequestWebSerialPrinter(formConfig.baud_rate || 9600);
        if (res.success && res.printer) {
            setAvailableDetectedPrinters([res.printer]);
            setFormConfig(prev => ({
                ...prev,
                connection_type: 'direct_usb',
                printer_name: res.printer?.name || 'Serial Thermal Printer',
            }));
            toast.success(`Connected to ${res.printer.name}`);
        } else {
            setScanMessage(res.message || 'Serial port connection cancelled.');
        }
    };

    /**
     * Dispatch One-Click Test Print
     */
    const handleRunTestPrint = async () => {
        setIsTesting(true);
        setTestResult(null);

        // Commit active form changes first
        updateConfig(formConfig);

        try {
            const res = await sendTestPrint(branchName, formConfig, branchId);
            setTestResult(res);
            if (res.success) {
                toast.success('✓ 58mm test receipt printed successfully!');
            } else {
                toast.error(`Test print failed: ${res.message}`);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Test print failed';
            setTestResult({ success: false, message: msg });
            toast.error(`Test print error: ${msg}`);
        } finally {
            setIsTesting(false);
        }
    };

    const connectedPrinterName = formConfig.connection_type === 'direct_usb'
        ? (activeDirectPrinter?.name || formConfig.printer_name || 'Direct USB Thermal Printer')
        : (formConfig.printer_name || 'Default System Thermal Printer');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-100 font-['Outfit'] shadow-2xl rounded-3xl">
                
                {/* ── HEADER ── */}
                <DialogHeader className="p-5 sm:p-6 bg-linear-to-b from-[#FFF5F7] to-white dark:from-[#181824] dark:to-[#121218] border-b border-[#F8C8DC]/40 dark:border-white/10 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-11 rounded-2xl bg-[#E75480]/10 dark:bg-[#FF4F81]/15 text-[#E75480] dark:text-[#FF4F81] flex items-center justify-center shrink-0">
                                <FiPrinter className="size-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg sm:text-xl font-black text-[#3D2C2E] dark:text-white flex items-center gap-2">
                                    <span>Thermal Printer Settings</span>
                                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E75480]/10 text-[#E75480] dark:bg-[#FF4F81]/20 dark:text-[#FF4F81]">
                                        58mm ESC/POS
                                    </span>
                                </DialogTitle>
                                <DialogDescription className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                                    Direct hardware printing & discovery for branch: <strong className="text-gray-800 dark:text-zinc-200">{branchName}</strong>
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Live Recheck Button */}
                        <button
                            type="button"
                            onClick={() => checkNow()}
                            disabled={isScanning}
                            title="Recheck hardware connection"
                            className="p-2.5 rounded-xl bg-white dark:bg-[#1E1E28] border border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] text-gray-600 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
                        >
                            <FiRefreshCw className={cn("size-4", (status === 'checking' || isScanning) && "animate-spin text-[#E75480]")} />
                        </button>
                    </div>

                    {/* ── ACTIVE CONNECTED PRINTER STATUS CARD ── */}
                    <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#1A1A24] border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "size-2.5 rounded-full",
                                        isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-400"
                                    )} />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                                        Connected Printer
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                        isConnected
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}>
                                        {isConnected ? 'Ready' : 'Disconnected'}
                                    </span>
                                </div>
                                <div className="text-sm font-extrabold text-[#3D2C2E] dark:text-white flex items-center gap-2">
                                    <span>{isConnected ? connectedPrinterName : 'No printer connected'}</span>
                                    {isConnected && formConfig.connection_type === 'direct_usb' && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                            Direct WebUSB
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                {isConnected ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={disconnectCurrentPrinter}
                                        className="h-8 px-3 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 text-xs font-bold cursor-pointer"
                                    >
                                        <FiPower className="size-3 mr-1.5" />
                                        Disconnect
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleScan()}
                                        disabled={isScanning}
                                        className="h-8 px-3.5 rounded-xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-extrabold cursor-pointer shadow-xs"
                                    >
                                        <FiRadio className={cn("size-3 mr-1.5", isScanning && "animate-spin")} />
                                        {isScanning ? 'Scanning...' : 'Scan for Printers'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

                    {/* Section 1: Connection Architecture Selector */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <FiCpu className="size-3.5 text-[#E75480]" />
                            <span>Select Connection Type</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Option 1: Direct WebUSB / WebSerial (Zero Software) */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormConfig(prev => ({ ...prev, connection_type: 'direct_usb' }));
                                    setScanMessage(null);
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                                    formConfig.connection_type === 'direct_usb'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1.5">
                                        <FiZap className="size-3.5 text-[#E75480]" />
                                        Direct USB (WebUSB)
                                    </span>
                                    {formConfig.connection_type === 'direct_usb' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                                    Direct hardware access from browser. Zero print dialog or install.
                                </span>
                            </button>

                            {/* Option 2: Local Windows Print Bridge */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormConfig(prev => ({ ...prev, connection_type: 'usb' }));
                                    setScanMessage(null);
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                                    formConfig.connection_type === 'usb'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1.5">
                                        <FiPrinter className="size-3.5 text-blue-500" />
                                        Local Print Bridge
                                    </span>
                                    {formConfig.connection_type === 'usb' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                                    Windows spooler bridge agent (127.0.0.1:18181) for locked drivers.
                                </span>
                            </button>

                            {/* Option 3: Android Companion Bridge */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormConfig(prev => ({ ...prev, connection_type: 'android_bridge' }));
                                    setScanMessage(null);
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                                    formConfig.connection_type === 'android_bridge'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1.5">
                                        <FiSmartphone className="size-3.5 text-emerald-600" />
                                        Android Bridge
                                    </span>
                                    {formConfig.connection_type === 'android_bridge' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400 leading-tight">
                                    Bluetooth companion app on Android branch tablet / phone.
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Scanning & Discovery Interface */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                                <FiRadio className="size-4 text-[#E75480]" />
                                <span>Hardware Discovery</span>
                            </label>
                            
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => handleScan()}
                                disabled={isScanning}
                                className="h-8 px-4 rounded-xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-bold cursor-pointer transition-all"
                            >
                                <FiRadio className={cn("size-3.5 mr-1.5", isScanning && "animate-spin")} />
                                {isScanning ? 'Scanning Hardware...' : 'Scan for Printers'}
                            </Button>
                        </div>

                        {/* Scanning Active Banner */}
                        {isScanning && (
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                                <FiRotateCw className="size-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Scanning for thermal printers...</p>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-300/80">
                                        Looking for connected USB ESC/POS thermal printers and local print bridges.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Available Printers List */}
                        {!isScanning && availableDetectedPrinters.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Available Printers:</p>
                                {availableDetectedPrinters.map((p, idx) => (
                                    <div
                                        key={p.id || idx}
                                        className="p-3 rounded-xl bg-white dark:bg-[#20202C] border border-gray-200 dark:border-zinc-700/60 flex items-center justify-between shadow-2xs"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                <FiPrinter className="size-4 text-[#E75480]" />
                                                <span className="text-xs font-extrabold text-[#3D2C2E] dark:text-white">{p.name}</span>
                                                {p.isDefault && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 pl-6">{p.port || 'USB Direct'}</p>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={() => {
                                                setFormConfig(prev => ({
                                                    ...prev,
                                                    printer_name: p.name,
                                                }));
                                                updateConfig({
                                                    printer_name: p.name,
                                                    connection_type: formConfig.connection_type,
                                                });
                                                toast.success(`Selected ${p.name}`);
                                            }}
                                            className={cn(
                                                "h-7 px-3 rounded-lg text-xs font-bold",
                                                formConfig.printer_name === p.name
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-[#E75480] text-white hover:bg-[#D43D69]"
                                            )}
                                        >
                                            {formConfig.printer_name === p.name ? 'Connected' : 'Connect'}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Scanner Diagnostic Feedback */}
                        {scanMessage && !isScanning && (
                            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                                <div className="flex items-center gap-2 font-bold">
                                    <FiAlertTriangle className="size-4 text-amber-600 shrink-0" />
                                    <span>{scanMessage}</span>
                                </div>
                                <ul className="list-disc list-inside text-[11px] text-amber-800/90 dark:text-amber-300/80 space-y-1 pl-1">
                                    <li>Ensure your thermal printer is turned on and connected via USB.</li>
                                    <li>If browser device access was cancelled, click <strong>Scan for Printers</strong> to retry.</li>
                                    <li>If Windows has already claimed the USB driver, switch to <strong>Local Print Bridge</strong> mode.</li>
                                </ul>

                                {showSerialFallback && directUsbCapabilities.isWebSerialSupported && (
                                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
                                        <span className="text-[11px] font-semibold">Using a USB-to-Serial / COM thermal printer?</span>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleScanSerial}
                                            className="h-7 px-3 text-[11px] font-bold rounded-lg border-amber-400 bg-amber-100/60 text-amber-900 hover:bg-amber-200"
                                        >
                                            Scan Serial / COM Port
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 3: Paper Size & Auto-Print Preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                        {/* Paper Width Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Paper Width Standard:</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formConfig.paper_width === 58 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFormConfig(prev => ({ ...prev, paper_width: 58 }))}
                                    className={cn(
                                        "flex-1 h-10 rounded-xl text-xs font-bold cursor-pointer",
                                        formConfig.paper_width === 58
                                            ? "bg-[#E75480] text-white hover:bg-[#D43D69]"
                                            : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300"
                                    )}
                                >
                                    58mm (Standard)
                                </Button>
                                <Button
                                    type="button"
                                    variant={formConfig.paper_width === 80 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFormConfig(prev => ({ ...prev, paper_width: 80 }))}
                                    className={cn(
                                        "flex-1 h-10 rounded-xl text-xs font-bold cursor-pointer",
                                        formConfig.paper_width === 80
                                            ? "bg-[#E75480] text-white hover:bg-[#D43D69]"
                                            : "border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-zinc-300"
                                    )}
                                >
                                    80mm (Wide)
                                </Button>
                            </div>
                        </div>

                        {/* Auto-Print Toggle */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Checkout Behavior:</label>
                            <label className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formConfig.auto_print}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, auto_print: e.target.checked }))}
                                    className="size-4 rounded accent-[#E75480] cursor-pointer"
                                />
                                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                    Auto-print receipt silently upon checkout
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Section 4: Test Print Diagnostic Results */}
                    {testResult && (
                        <div className={cn(
                            "p-3.5 rounded-2xl border text-xs flex items-center gap-2.5",
                            testResult.success
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300"
                                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300"
                        )}>
                            {testResult.success ? (
                                <FiCheckCircle className="size-4 shrink-0 text-emerald-600" />
                            ) : (
                                <FiAlertTriangle className="size-4 shrink-0 text-rose-600" />
                            )}
                            <span className="font-semibold">{testResult.message}</span>
                        </div>
                    )}
                </div>

                {/* ── FOOTER CONTROLS ── */}
                <DialogFooter className="p-4 sm:p-5 bg-gray-50 dark:bg-[#15151C] border-t border-[#F8C8DC]/40 dark:border-white/10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    
                    {/* Test Print Diagnostic Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRunTestPrint}
                        disabled={isTesting}
                        className="h-11 px-5 rounded-2xl border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold gap-2 cursor-pointer transition-all"
                        title="Send a sample 58mm test receipt directly to verify printer output"
                    >
                        <FiPrinter className={cn("size-4", isTesting && "animate-pulse text-purple-600")} />
                        <span>{isTesting ? 'Printing Test...' : 'Test Print (58mm)'}</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-5 rounded-2xl border-gray-200 dark:border-zinc-800 text-xs font-bold cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="h-11 px-6 rounded-2xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-extrabold shadow-md shadow-[#E75480]/20 cursor-pointer"
                        >
                            Save Settings
                        </Button>
                    </div>
                </DialogFooter>

            </DialogContent>
        </Dialog>
    );
};

export default PrinterSettingsModal;
