import React, { useState, useEffect } from 'react';
import { 
    FiPrinter, 
    FiCheckCircle, 
    FiAlertTriangle, 
    FiRotateCw, 
    FiCpu, 
    FiCheck,
    FiZap,
    FiPower,
    FiRefreshCw,
    FiRadio,
    FiBluetooth,
    FiTerminal,
    FiChevronDown,
    FiChevronUp
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
    usePrinterStatus, 
    sendTestPrint,
    scanAndRequestWebBluetoothPrinter,
    scanAndRequestBluetoothSppPrinter,
    connectDirectDevice,
    getAuthorizedDirectPrinters,
    getPrinterDiagnostics,
    type PrinterConfig, 
    type DetectedPrinter,
    type PrinterConnectionType,
    type PrinterDiagnosticsInfo
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
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [scanMessage, setScanMessage] = useState<string | null>(null);
    const [availableDetectedPrinters, setAvailableDetectedPrinters] = useState<DetectedPrinter[]>([]);
    const [diagnostics, setDiagnostics] = useState<PrinterDiagnosticsInfo | null>(null);
    const [showDiagnostics, setShowDiagnostics] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormConfig(config);
            setTestResult(null);
            setScanMessage(null);
            checkNow();
            getPrinterDiagnostics(config).then(setDiagnostics);

            if (printers.length > 0) {
                setAvailableDetectedPrinters(printers);
            }

            // Instantly discover any already authorized USB or Bluetooth serial ports
            getAuthorizedDirectPrinters().then(authPrinters => {
                if (authPrinters.length > 0) {
                    setAvailableDetectedPrinters(prev => {
                        const merged = [...authPrinters];
                        for (const p of prev) {
                            if (!merged.some(m => m.id === p.id || m.name === p.name)) {
                                merged.push(p);
                            }
                        }
                        return merged;
                    });
                }
            });
        }
    }, [isOpen, config, checkNow, printers]);

    const handleSave = () => {
        updateConfig(formConfig);
        toast.success('Thermal printer configuration saved');
        onClose();
    };

    /**
     * Connect to a specific detected hardware printer immediately
     */
    const handleConnectPrinter = async (p: DetectedPrinter) => {
        setConnectingId(p.id || p.name);
        setScanMessage(null);
        try {
            const res = await connectDirectDevice(p, formConfig.baud_rate || 9600);
            if (res.success) {
                const newConnectionType = p.type === 'webusb' 
                    ? 'direct_usb' 
                    : (p.type === 'webserial' || p.type === 'webbluetooth' ? 'direct_bluetooth' : formConfig.connection_type);

                setFormConfig(prev => ({
                    ...prev,
                    connection_type: newConnectionType,
                    printer_name: p.name,
                }));
                updateConfig({
                    connection_type: newConnectionType,
                    printer_name: p.name,
                });
                await checkNow();
                toast.success(res.message);
            } else {
                toast.error(res.message);
                setScanMessage(res.message);
            }
        } finally {
            setConnectingId(null);
        }
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
            await checkNow();
            toast.success(res.message || `Connected to: ${first.name}`);
        } else {
            setScanMessage(res.message || 'No compatible printers detected.');
        }
    };

    /**
     * Scan via Bluetooth Classic SPP (Web Serial for POS58D)
     */
    const handleScanBluetoothSpp = async () => {
        setScanMessage(null);
        const res = await scanAndRequestBluetoothSppPrinter(formConfig.baud_rate || 9600);
        if (res.success && res.printer) {
            setAvailableDetectedPrinters([res.printer]);
            setFormConfig(prev => ({
                ...prev,
                connection_type: 'direct_bluetooth',
                printer_name: res.printer?.name || 'POS58D Bluetooth Printer',
            }));
            await checkNow();
            toast.success(`Connected to ${res.printer.name}`);
        } else {
            setScanMessage(res.message || 'Bluetooth SPP connection cancelled.');
        }
    };

    /**
     * Scan via Web Bluetooth (BLE GATT)
     */
    const handleScanWebBluetooth = async () => {
        setScanMessage(null);
        const res = await scanAndRequestWebBluetoothPrinter();
        if (res.success && res.printer) {
            setAvailableDetectedPrinters([res.printer]);
            setFormConfig(prev => ({
                ...prev,
                connection_type: 'direct_bluetooth',
                printer_name: res.printer?.name || 'BLE Thermal Printer',
            }));
            await checkNow();
            toast.success(`Connected to ${res.printer.name}`);
        } else {
            setScanMessage(res.message || 'Web Bluetooth scan cancelled.');
        }
    };

    /**
     * Dispatch One-Click Test Print
     */
    const handleRunTestPrint = async () => {
        setIsTesting(true);
        setTestResult(null);

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

    const connectedPrinterName = formConfig.connection_type === 'universal_browser'
        ? (formConfig.printer_name || 'Universal 58mm Web Thermal Printer')
        : (formConfig.connection_type === 'direct_bluetooth' || formConfig.connection_type === 'direct_usb'
            ? (activeDirectPrinter?.name || formConfig.printer_name || (formConfig.connection_type === 'direct_bluetooth' ? 'Direct Bluetooth Printer' : 'Direct USB Printer'))
            : (formConfig.printer_name || 'Default System Thermal Printer'));

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-100 font-['Outfit'] shadow-2xl rounded-3xl">
                
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
                                    Universal zero-install printing for branch: <strong className="text-gray-800 dark:text-zinc-200">{branchName}</strong>
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
                                        Current Mode
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase",
                                        isConnected
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400"
                                    )}>
                                        {isConnected ? 'Ready to Print' : 'Disconnected'}
                                    </span>
                                </div>
                                <div className="text-sm font-extrabold text-[#3D2C2E] dark:text-white flex items-center gap-2">
                                    <span>{isConnected ? connectedPrinterName : 'No printer configured'}</span>
                                    {isConnected && formConfig.connection_type === 'universal_browser' && (
                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-md font-mono font-bold flex items-center gap-1">
                                            <FiCheck className="size-3" /> Zero Install • Universal
                                        </span>
                                    )}
                                    {isConnected && formConfig.connection_type === 'direct_bluetooth' && (
                                        <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                                            <FiBluetooth className="size-3" /> Direct Bluetooth
                                        </span>
                                    )}
                                    {isConnected && formConfig.connection_type === 'direct_usb' && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 px-1.5 py-0.2 rounded font-mono font-bold">
                                            Direct WebUSB
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                {isConnected && formConfig.connection_type !== 'universal_browser' ? (
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
                                        {isScanning ? 'Checking...' : 'Refresh Status'}
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
                            <span>Select Connection Mode</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {/* Option 1: Universal Web Print (Zero Install) */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormConfig(prev => ({ 
                                        ...prev, 
                                        connection_type: 'universal_browser',
                                        printer_name: 'Universal 58mm Web Thermal Printer'
                                    }));
                                    setScanMessage(null);
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                                    formConfig.connection_type === 'universal_browser'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black flex items-center gap-1.5 text-[#E75480] dark:text-[#FF4F81]">
                                        <FiPrinter className="size-4" />
                                        Universal Web Print
                                    </span>
                                    {formConfig.connection_type === 'universal_browser' ? (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            Recommended
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400">
                                            Zero Install
                                        </span>
                                    )}
                                </div>
                                <span className="text-[11px] text-gray-600 dark:text-zinc-300 leading-snug">
                                    Zero install! Works on 100% of Android phones, iPhones, tablets, laptops, and PCs.
                                </span>
                            </button>

                            {/* Option 2: Direct Bluetooth (SPP & BLE) */}
                            <button
                                type="button"
                                onClick={() => {
                                    setFormConfig(prev => ({ ...prev, connection_type: 'direct_bluetooth' }));
                                    setScanMessage(null);
                                }}
                                className={cn(
                                    "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2",
                                    formConfig.connection_type === 'direct_bluetooth'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-black flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                        <FiBluetooth className="size-4" />
                                        Direct Bluetooth
                                    </span>
                                    {formConfig.connection_type === 'direct_bluetooth' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[11px] text-gray-600 dark:text-zinc-300 leading-snug">
                                    In-browser Bluetooth SPP (POS58D) or BLE GATT without software.
                                </span>
                            </button>

                            {/* Option 3: Direct USB (WebUSB) */}
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
                                    <span className="text-xs font-black flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                                        <FiZap className="size-4" />
                                        Direct WebUSB
                                    </span>
                                    {formConfig.connection_type === 'direct_usb' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[11px] text-gray-600 dark:text-zinc-300 leading-snug">
                                    WebUSB hardware link on supported desktop browsers.
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Scanning & Discovery Interface */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <label className="text-xs font-bold text-gray-800 dark:text-zinc-200 flex items-center gap-2">
                                <FiRadio className="size-4 text-[#E75480] shrink-0" />
                                <span>Hardware Setup & Status</span>
                            </label>
                            
                            <div className="flex flex-wrap items-center gap-2">
                                {formConfig.connection_type === 'direct_bluetooth' ? (
                                    <>
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleScanBluetoothSpp}
                                            disabled={isScanning}
                                            className="h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                                            title="Scan Bluetooth SPP / RFCOMM Link (Compatible with Android Chrome & Desktop Windows)"
                                        >
                                            <FiBluetooth className="size-3 mr-1 shrink-0" />
                                            <span>Scan Bluetooth (SPP)</span>
                                        </Button>
                                        {directUsbCapabilities.isWebBluetoothSupported && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={handleScanWebBluetooth}
                                                disabled={isScanning}
                                                className="h-8 px-3 rounded-xl text-xs font-bold cursor-pointer"
                                                title="Scan Bluetooth Low Energy (BLE) thermal printers"
                                            >
                                                Scan BLE
                                            </Button>
                                        )}
                                    </>
                                ) : formConfig.connection_type === 'direct_usb' ? (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => handleScan('direct_usb')}
                                        disabled={isScanning}
                                        className="h-8 px-4 rounded-xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                                    >
                                        <FiZap className={cn("size-3.5 mr-1.5", isScanning && "animate-spin")} />
                                        {isScanning ? 'Scanning...' : 'Pair USB Printer'}
                                    </Button>
                                ) : (
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleRunTestPrint}
                                        disabled={isTesting}
                                        className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all shadow-xs"
                                    >
                                        <FiPrinter className={cn("size-3.5 mr-1.5", isTesting && "animate-pulse")} />
                                        {isTesting ? 'Testing...' : 'Test Universal Print'}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Universal Web Mode Info Banner */}
                        {formConfig.connection_type === 'universal_browser' && (
                            <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200 text-xs space-y-2">
                                <div className="flex items-center gap-2 font-black text-emerald-800 dark:text-emerald-300">
                                    <FiCheckCircle className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>Universal Zero-Install Printing Active</span>
                                </div>
                                <p className="text-[11.5px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                                    No app or print bridge software is required! When you complete an order or tap Test Print:
                                </p>
                                <ul className="list-disc list-inside text-[11px] text-emerald-800/90 dark:text-emerald-300/80 space-y-1 pl-1">
                                    <li><strong>1. Pair Thermal Printer:</strong> Ensure your 58mm printer (Bluetooth or USB) is paired in your phone or PC settings.</li>
                                    <li><strong>2. Auto-Formatted:</strong> Receipts are pre-sized to 58mm with zero margins and sanitized branch headers.</li>
                                    <li><strong>3. 1-Tap Print:</strong> The print popup appears seamlessly with no background errors.</li>
                                </ul>
                            </div>
                        )}

                        {/* Scanning Active Banner */}
                        {isScanning && (
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-3">
                                <FiRotateCw className="size-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Scanning for thermal printers...</p>
                                    <p className="text-[11px] text-blue-700 dark:text-blue-300/80">
                                        Detecting Bluetooth SPP / BLE devices, USB thermal printers, and local print bridges.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Available Printers List */}
                        {!isScanning && availableDetectedPrinters.length > 0 && formConfig.connection_type !== 'universal_browser' && (
                            <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Available Printers:</p>
                                {availableDetectedPrinters.map((p, idx) => (
                                    <div
                                        key={p.id || idx}
                                        className="p-3 rounded-xl bg-white dark:bg-[#20202C] border border-gray-200 dark:border-zinc-700/60 flex items-center justify-between shadow-2xs"
                                    >
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                                {p.type === 'webbluetooth' || p.type === 'webserial' ? (
                                                    <FiBluetooth className="size-4 text-blue-500 shrink-0" />
                                                ) : (
                                                    <FiPrinter className="size-4 text-[#E75480] shrink-0" />
                                                )}
                                                <span className="text-xs font-extrabold text-[#3D2C2E] dark:text-white">{p.name}</span>
                                                {p.isDefault && (
                                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 pl-6">{p.port || 'Bluetooth / USB'}</p>
                                        </div>

                                        <Button
                                            type="button"
                                            size="sm"
                                            disabled={connectingId !== null}
                                            onClick={() => handleConnectPrinter(p)}
                                            className={cn(
                                                "h-7 px-3.5 rounded-lg text-xs font-bold cursor-pointer transition-all",
                                                formConfig.printer_name === p.name && isConnected
                                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    : "bg-[#E75480] text-white hover:bg-[#D43D69]"
                                            )}
                                        >
                                            {connectingId === (p.id || p.name) ? (
                                                <span className="flex items-center gap-1">
                                                    <FiRotateCw className="size-3 animate-spin" />
                                                    Connecting...
                                                </span>
                                            ) : (
                                                formConfig.printer_name === p.name && isConnected ? '✓ Connected' : 'Connect'
                                            )}
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
                                    <li>Ensure your thermal printer is turned on and paired in your device's Bluetooth settings.</li>
                                    <li>Or select <strong>Universal Web Print</strong> above for 100% universal zero-install printing.</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Paper Size & Auto-Print Preferences */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-3 border-t border-gray-100 dark:border-zinc-800">
                        {/* Paper Width Selector */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800 space-y-2.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block">
                                Paper Width Standard:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setFormConfig(prev => ({ ...prev, paper_width: 58 }))}
                                    className={cn(
                                        "h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                        formConfig.paper_width === 58
                                            ? "bg-[#E75480] text-white shadow-xs"
                                            : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100"
                                    )}
                                >
                                    <span>58mm</span>
                                    <span className="text-[10px] opacity-80">(Standard)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormConfig(prev => ({ ...prev, paper_width: 80 }))}
                                    className={cn(
                                        "h-10 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5",
                                        formConfig.paper_width === 80
                                            ? "bg-[#E75480] text-white shadow-xs"
                                            : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100"
                                    )}
                                >
                                    <span>80mm</span>
                                    <span className="text-[10px] opacity-80">(Wide)</span>
                                </button>
                            </div>
                        </div>

                        {/* Auto-Print Toggle */}
                        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800 flex flex-col justify-between space-y-2.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 block">
                                Checkout Behavior:
                            </label>
                            <label className="flex items-center gap-2.5 h-10 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={formConfig.auto_print}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, auto_print: e.target.checked }))}
                                    className="size-4 rounded accent-[#E75480] cursor-pointer shrink-0"
                                />
                                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300 truncate">
                                    Auto-print silently on checkout
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

                    {/* Section 5: Developer & System Diagnostics Panel */}
                    <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => setShowDiagnostics(prev => !prev)}
                            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gray-100/70 dark:bg-zinc-800/40 hover:bg-gray-100 dark:hover:bg-zinc-800/70 text-gray-700 dark:text-zinc-300 text-xs font-bold transition-all cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FiTerminal className="size-4 text-[#E75480]" />
                                <span>Developer & Hardware Diagnostics</span>
                                {diagnostics && (
                                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700">
                                        {diagnostics.platform} • {diagnostics.browser}
                                    </span>
                                )}
                            </span>
                            {showDiagnostics ? <FiChevronUp className="size-4" /> : <FiChevronDown className="size-4" />}
                        </button>

                        {showDiagnostics && diagnostics && (
                            <div className="mt-2.5 p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono space-y-2.5 shadow-inner">
                                <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                                    <span className="text-slate-400 font-sans font-bold">SYSTEM ENVIRONMENT & TELEMETRY</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">LIVE STATUS</span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">Platform:</span>
                                        <span className="font-bold text-white">{diagnostics.platform}</span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">Browser:</span>
                                        <span className="font-bold text-white">{diagnostics.browser}</span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">Web Serial API:</span>
                                        <span className={cn("font-bold", diagnostics.isWebSerialSupported ? "text-emerald-400" : "text-rose-400")}>
                                            {diagnostics.isWebSerialSupported ? 'Supported (SPP 0x1101)' : 'Not Supported'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">Web Bluetooth API:</span>
                                        <span className={cn("font-bold", diagnostics.isWebBluetoothSupported ? "text-emerald-400" : "text-rose-400")}>
                                            {diagnostics.isWebBluetoothSupported ? 'Supported (BLE GATT)' : 'Not Supported'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">WebUSB API:</span>
                                        <span className={cn("font-bold", diagnostics.isWebUsbSupported ? "text-emerald-400" : "text-rose-400")}>
                                            {diagnostics.isWebUsbSupported ? 'Supported' : 'Not Supported'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60">
                                        <span className="text-slate-400">Flutter / WebView Bridge:</span>
                                        <span className={cn("font-bold", diagnostics.isFlutterWebView ? "text-emerald-400" : "text-slate-400")}>
                                            {diagnostics.isFlutterWebView ? 'Active Bridge' : 'None (Browser Mode)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between p-1.5 rounded bg-slate-800/60 sm:col-span-2">
                                        <span className="text-slate-400">Active Connection / Port:</span>
                                        <span className="font-bold text-amber-300 truncate max-w-60">{connectedPrinterName}</span>
                                    </div>
                                </div>

                                <div className="text-[10px] text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
                                    <span>Android filter: Serial Port Profile (0x1101 / RFCOMM)</span>
                                    <button
                                        type="button"
                                        onClick={() => getPrinterDiagnostics(formConfig).then(setDiagnostics)}
                                        className="text-xs text-[#FF4F81] hover:underline font-bold cursor-pointer"
                                    >
                                        Refresh Telemetry
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── FOOTER CONTROLS ── */}
                <DialogFooter className="p-4 sm:p-5 bg-gray-50 dark:bg-[#15151C] border-t border-[#F8C8DC]/40 dark:border-white/10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    
                    {/* Test Print Diagnostic Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRunTestPrint}
                        disabled={isTesting}
                        className="w-full sm:w-auto h-11 px-5 rounded-2xl border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold gap-2 cursor-pointer transition-all"
                        title="Send a sample 58mm test receipt directly to verify printer output"
                    >
                        <FiPrinter className={cn("size-4", isTesting && "animate-pulse text-purple-600")} />
                        <span>{isTesting ? 'Printing Test...' : 'Test Print (58mm)'}</span>
                    </Button>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 sm:flex-initial h-11 px-5 rounded-2xl border-gray-200 dark:border-zinc-800 text-xs font-bold cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="flex-1 sm:flex-initial h-11 px-6 rounded-2xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-extrabold shadow-md shadow-[#E75480]/20 cursor-pointer"
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
