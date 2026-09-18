import React, { useState } from 'react';
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
    FiBatteryCharging
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
    type PrinterConfig, 
    type DetectedPrinter,
    type RegisteredBridge 
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
        hasActiveAndroidBridge,
        isFetchingPrinters,
        isFetchingBridges,
        updateConfig,
        checkNow,
        fetchPrinters,
        fetchBridges,
    } = usePrinterStatus(branchId);

    const [formConfig, setFormConfig] = useState<PrinterConfig>(config);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    // Sync form config whenever modal opens or external config changes
    React.useEffect(() => {
        if (isOpen) {
            setFormConfig(config);
            setTestResult(null);
            checkNow();
        }
    }, [isOpen, config, checkNow]);

    const handleSave = () => {
        updateConfig(formConfig);
        toast.success('Thermal printer settings saved successfully');
        onClose();
    };

    const handleRunTestPrint = async () => {
        setIsTesting(true);
        setTestResult(null);

        // Save active form configuration first
        updateConfig(formConfig);

        try {
            const res = await sendTestPrint(branchName, formConfig, branchId);
            setTestResult(res);
            if (res.success) {
                toast.success('✓ 58mm test receipt dispatched to thermal printer!');
            } else {
                toast.error(`Test print failed: ${res.message}`);
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unknown test print error';
            setTestResult({ success: false, message: msg });
            toast.error(`Test print error: ${msg}`);
        } finally {
            setIsTesting(false);
        }
    };

    const activeAndroidBridges = bridges.filter(b => b.is_online);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-100 font-['Outfit'] shadow-2xl rounded-3xl">
                
                {/* Header */}
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
                                    Configure silent thermal receipt printing for branch: <strong className="text-gray-800 dark:text-zinc-200">{branchName}</strong>
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Live Health Badge & Refresh */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    checkNow();
                                    fetchPrinters();
                                    fetchBridges();
                                }}
                                disabled={isFetchingPrinters || isFetchingBridges}
                                title="Recheck printer bridge connection"
                                className="p-2 rounded-xl bg-white dark:bg-[#1E1E28] border border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] text-gray-600 dark:text-zinc-300 transition-all cursor-pointer"
                            >
                                <FiRotateCw className={cn("size-3.5", (status === 'checking' || isFetchingPrinters || isFetchingBridges) && "animate-spin text-[#E75480]")} />
                            </button>
                        </div>
                    </div>

                    {/* Status Alert Banner */}
                    <div className="mt-4">
                        {isConnected ? (
                            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <FiCheckCircle className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <span>
                                        {formConfig.connection_type === 'android_bridge'
                                            ? `Android Companion Bridge Online (${activeAndroidBridges.length} active device${activeAndroidBridges.length !== 1 ? 's' : ''})`
                                            : 'Desktop Print Bridge Online & Ready (127.0.0.1:18181)'}
                                    </span>
                                </div>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">
                                    Ready
                                </span>
                            </div>
                        ) : (
                            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between font-bold text-amber-800 dark:text-amber-300">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-amber-500" />
                                        <FiAlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                                        <span>
                                            {formConfig.connection_type === 'android_bridge'
                                                ? 'No Android Print Bridge Connected'
                                                : 'Local Desktop Print Bridge is Offline'}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowGuide(prev => !prev)}
                                        className="h-6 px-2 text-[10px] font-extrabold rounded-lg border-amber-300 bg-amber-100/60 text-amber-900 hover:bg-amber-200"
                                    >
                                        <FiHelpCircle className="size-3 mr-1" />
                                        {showGuide ? 'Hide Guide' : 'Setup Guide'}
                                    </Button>
                                </div>
                                <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/90 pl-6">
                                    {formConfig.connection_type === 'android_bridge'
                                        ? 'Launch the MAKI DESU Print Bridge app on your Android tablet or phone to enable automatic Bluetooth thermal printing.'
                                        : 'The local print bridge agent is not currently running on this computer. Start the bridge using start-print-bridge.bat.'}
                                </p>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

                    {/* Collapsible Setup Guide */}
                    {showGuide && (
                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2 font-bold text-blue-800 dark:text-blue-300 text-sm">
                                <FiDownloadCloud className="size-4" />
                                <span>Android Companion Bridge Setup (Recommended for Bluetooth)</span>
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-[11.5px] leading-relaxed pl-1 text-blue-900/90 dark:text-blue-200/90">
                                <li>Open <strong>Settings → Bluetooth</strong> on your Android tablet and pair your 58mm thermal printer (PIN: 0000 or 1234).</li>
                                <li>Open the <strong>MAKI DESU Print Bridge</strong> app, select your Branch (<strong>{branchName}</strong>), and select your paired Bluetooth printer.</li>
                                <li>Tap <strong>START SERVICE</strong>. Receipts created on this POS will automatically print silently within 1–2 seconds.</li>
                            </ol>
                        </div>
                    )}

                    {/* Section 1: Connection Mode Tabs */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <FiCpu className="size-3.5 text-[#E75480]" />
                            <span>Connection Architecture</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {/* Option 1: Android Companion Bridge (Loyverse architecture) */}
                            <button
                                type="button"
                                onClick={() => setFormConfig(prev => ({ ...prev, connection_type: 'android_bridge' }))}
                                className={cn(
                                    "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                                    formConfig.connection_type === 'android_bridge'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1">
                                        <FiSmartphone className="size-3.5 text-emerald-600" />
                                        Android Bridge
                                    </span>
                                    {formConfig.connection_type === 'android_bridge' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400">Bluetooth SPP via Android companion (Recommended)</span>
                            </button>

                            {/* Option 2: USB / Windows Spooler */}
                            <button
                                type="button"
                                onClick={() => setFormConfig(prev => ({ ...prev, connection_type: 'usb' }))}
                                className={cn(
                                    "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                                    formConfig.connection_type === 'usb'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1">
                                        <FiPrinter className="size-3.5 text-[#E75480]" />
                                        USB / Desktop
                                    </span>
                                    {formConfig.connection_type === 'usb' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400">Direct USB via Windows spooler bridge</span>
                            </button>

                            {/* Option 3: Network / LAN IP */}
                            <button
                                type="button"
                                onClick={() => setFormConfig(prev => ({ ...prev, connection_type: 'network' }))}
                                className={cn(
                                    "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1",
                                    formConfig.connection_type === 'network'
                                        ? "border-[#E75480] bg-[#FFF5F7] dark:bg-[#FF4F81]/10 text-[#3D2C2E] dark:text-white shadow-xs ring-1 ring-[#E75480]/30"
                                        : "border-gray-200 dark:border-zinc-800 hover:border-gray-300 text-gray-600 dark:text-zinc-400"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold flex items-center gap-1">
                                        <FiWifi className="size-3.5 text-blue-500" />
                                        Network IP
                                    </span>
                                    {formConfig.connection_type === 'network' && <FiCheck className="size-3.5 text-[#E75480]" />}
                                </div>
                                <span className="text-[10px] text-gray-500 dark:text-zinc-400">Direct TCP socket over Wi-Fi / Ethernet (Port 9100)</span>
                            </button>
                        </div>
                    </div>

                    {/* Section 2: Mode Details */}
                    {formConfig.connection_type === 'android_bridge' && (
                        <div className="space-y-3 p-4 rounded-2xl bg-gray-50 dark:bg-[#181824] border border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                                    <FiSmartphone className="size-3.5 text-emerald-600" />
                                    <span>Active Android Print Bridges ({branchName}):</span>
                                </label>
                                <span className="text-[10px] text-gray-400">Auto-routed via Central Queue</span>
                            </div>

                            {bridges.length > 0 ? (
                                <div className="space-y-2">
                                    {bridges.map((b: RegisteredBridge) => (
                                        <div
                                            key={b.id}
                                            className={cn(
                                                "p-3 rounded-xl border flex items-center justify-between transition-all",
                                                b.is_online
                                                    ? "bg-white dark:bg-[#20202C] border-emerald-300/70 dark:border-emerald-800/50 shadow-2xs"
                                                    : "bg-gray-100/60 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 opacity-70"
                                            )}
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className={cn("size-2 rounded-full", b.is_online ? "bg-emerald-500 animate-pulse" : "bg-gray-400")} />
                                                    <span className="text-xs font-bold text-gray-900 dark:text-white">{b.name}</span>
                                                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400">
                                                        {b.bridge_uuid}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-zinc-400 pl-4">
                                                    Printer: <strong className="text-gray-700 dark:text-zinc-300">{b.paired_printer_name || 'Bluetooth Printer'}</strong>
                                                    {b.battery_level !== undefined && b.battery_level !== null && (
                                                        <span className="ml-2 font-mono text-[10px]">🔋 {b.battery_level}%</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                                    b.is_online ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-gray-200 text-gray-600"
                                                )}>
                                                    {b.is_online ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 space-y-2">
                                    <FiSmartphone className="size-8 mx-auto text-gray-400 animate-bounce" />
                                    <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400">
                                        No Android Companion Bridge registered for {branchName} yet.
                                    </p>
                                    <p className="text-[11px] text-gray-400 dark:text-zinc-500 max-w-md mx-auto">
                                        Open the <strong>MAKI DESU Print Bridge</strong> app on the branch tablet and tap <strong>START SERVICE</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {formConfig.connection_type === 'usb' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                                Select Installed Desktop Thermal Printer:
                            </label>
                            
                            {printers.length > 0 ? (
                                <select
                                    value={formConfig.printer_name}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, printer_name: e.target.value }))}
                                    className="w-full h-11 px-3.5 rounded-2xl bg-white dark:bg-[#181824] border border-[#F8C8DC]/60 dark:border-white/10 text-xs font-semibold text-[#3D2C2E] dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-[#E75480]/30"
                                >
                                    <option value="">(Default Windows Printer)</option>
                                    {printers.map((p: DetectedPrinter, idx) => (
                                        <option key={idx} value={p.name}>
                                            {p.name} {p.isDefault ? '— (Default)' : ''} {p.port ? `[${p.port}]` : ''}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    placeholder="e.g. POS-58, XP-58C, or leave blank for default"
                                    value={formConfig.printer_name}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, printer_name: e.target.value }))}
                                    className="h-11 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-xs"
                                />
                            )}
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                Leave blank to automatically route to the default Windows printer via local bridge.
                            </p>
                        </div>
                    )}

                    {formConfig.connection_type === 'network' && (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-1">
                                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Printer IP Address:</label>
                                <Input
                                    placeholder="192.168.1.100"
                                    value={formConfig.tcp_host}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, tcp_host: e.target.value }))}
                                    className="h-11 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Port:</label>
                                <Input
                                    type="number"
                                    placeholder="9100"
                                    value={formConfig.tcp_port}
                                    onChange={(e) => setFormConfig(prev => ({ ...prev, tcp_port: parseInt(e.target.value || '9100', 10) }))}
                                    className="h-11 rounded-2xl border-[#F8C8DC]/60 dark:border-white/10 text-xs font-mono"
                                />
                            </div>
                        </div>
                    )}

                    {/* Section 3: Paper Width & Auto-print preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                        {/* Paper Width */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 dark:text-zinc-300">Paper Width Standard:</label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={formConfig.paper_width === 58 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setFormConfig(prev => ({ ...prev, paper_width: 58 }))}
                                    className={cn(
                                        "flex-1 h-10 rounded-xl text-xs font-bold",
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
                                        "flex-1 h-10 rounded-xl text-xs font-bold",
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

                    {/* Section 4: Test Print Diagnostic Feedback */}
                    {testResult && (
                        <div className={cn(
                            "p-3 rounded-2xl border text-xs flex items-center gap-2",
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

                {/* Footer Controls */}
                <DialogFooter className="p-4 sm:p-5 bg-gray-50 dark:bg-[#15151C] border-t border-[#F8C8DC]/40 dark:border-white/10 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    
                    {/* Test Printer Diagnostic Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleRunTestPrint}
                        disabled={isTesting}
                        className="h-11 px-5 rounded-2xl border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold gap-2 cursor-pointer transition-all"
                        title="Send a sample 58mm test receipt to verify printer output"
                    >
                        <FiPrinter className={cn("size-4", isTesting && "animate-pulse text-purple-600")} />
                        <span>{isTesting ? 'Dispatching Test...' : 'Test Printer (58mm)'}</span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-11 px-5 rounded-2xl border-gray-200 dark:border-zinc-800 text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            className="h-11 px-6 rounded-2xl bg-[#E75480] hover:bg-[#D43D69] text-white text-xs font-extrabold shadow-md shadow-[#E75480]/20"
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
