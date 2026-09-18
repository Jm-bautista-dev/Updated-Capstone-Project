import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

export const LOCAL_BRIDGE_URL = 'http://127.0.0.1:18181';
export const STORAGE_KEY_PRINTER_CONFIG = 'makidesu_pos_printer_config';

export interface PrinterConfig {
    printer_name: string;
    connection_type: 'usb' | 'network' | 'serial' | 'android_bridge';
    tcp_host: string;
    tcp_port: number;
    com_port: string;
    paper_width: 58 | 80;
    auto_print: boolean;
    cut_paper: boolean;
    encoding: string;
    selected_bridge_uuid?: string;
}

export const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
    printer_name: '',
    connection_type: 'usb',
    tcp_host: '192.168.1.100',
    tcp_port: 9100,
    com_port: 'COM1',
    paper_width: 58,
    auto_print: true,
    cut_paper: true,
    encoding: 'CP437',
    selected_bridge_uuid: '',
};

export interface RegisteredBridge {
    id: number;
    bridge_uuid: string;
    name: string;
    branch_id: number;
    terminal_id?: string;
    device_type: 'android' | 'windows' | 'network';
    paired_printer_name?: string;
    paired_printer_address?: string;
    connection_type: string;
    status: string;
    is_online: boolean;
    battery_level?: number;
    last_heartbeat_at?: string;
}

export interface DetectedPrinter {
    name: string;
    isDefault: boolean;
    port: string;
}

export interface ReceiptItemPayload {
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    addons?: Array<{ name: string; price: number }>;
}

export interface ReceiptDataPayload {
    branch_id?: number;
    branch_name?: string;
    branch_address?: string;
    order_number?: string;
    date_time?: string;
    fulfillment_type?: string;
    cashier_name?: string;
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    items?: ReceiptItemPayload[];
    subtotal?: number;
    discount?: number;
    discount_type?: string;
    delivery_fee?: number;
    total?: number;
    payment_method?: string;
    paid_amount?: number;
    change_amount?: number;
    paper_width?: number;
    is_reprint?: boolean;
    reprint_reason?: string;
    reprinted_at?: string;
}

export interface LocalPrintJobPayload {
    id?: number;
    job_uuid: string;
    order_number: string;
    printer_name?: string;
    connection_type?: 'usb' | 'network' | 'serial';
    tcp_host?: string;
    tcp_port?: number;
    paper_width?: number;
    raw_escpos_base64?: string;
    formatted_text?: string;
    receipt_data?: ReceiptDataPayload;
}

export type PrinterBridgeStatus = 'ready' | 'offline' | 'checking';

/**
 * Retrieve saved printer configuration from terminal's localStorage
 */
export function getPrinterConfig(): PrinterConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_PRINTER_CONFIG;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY_PRINTER_CONFIG);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_PRINTER_CONFIG,
                ...parsed,
                paper_width: parsed.paper_width === 80 ? 80 : 58,
                auto_print: typeof parsed.auto_print === 'boolean' ? parsed.auto_print : true,
            };
        }
    } catch {
        // Fallback on corrupt JSON
    }
    return DEFAULT_PRINTER_CONFIG;
}

/**
 * Save updated printer configuration to terminal's localStorage
 */
export function savePrinterConfig(updates: Partial<PrinterConfig>): PrinterConfig {
    if (typeof window === 'undefined') {
        return DEFAULT_PRINTER_CONFIG;
    }
    const current = getPrinterConfig();
    const merged: PrinterConfig = {
        ...current,
        ...updates,
    };
    try {
        localStorage.setItem(STORAGE_KEY_PRINTER_CONFIG, JSON.stringify(merged));
    } catch {
        // Storage quota exceeded fallback
    }
    return merged;
}

/**
 * Probe local print bridge health
 */
export async function checkPrintBridgeHealth(): Promise<{ isHealthy: boolean; uptime?: number; queuePending?: number }> {
    try {
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/health`, {
            timeout: 1800,
        });
        if (res.status === 200 && res.data?.status === 'ok') {
            return {
                isHealthy: true,
                uptime: res.data?.uptime_seconds,
                queuePending: res.data?.queue_pending,
            };
        }
        return { isHealthy: false };
    } catch {
        return { isHealthy: false };
    }
}

/**
 * Fetch list of detected OS printers from local print bridge
 */
export async function getAvailablePrinters(): Promise<{ success: boolean; printers: DetectedPrinter[]; message?: string }> {
    try {
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/printers`, {
            timeout: 3000,
        });
        if (res.status === 200 && res.data?.success && Array.isArray(res.data?.printers)) {
            return {
                success: true,
                printers: res.data.printers,
            };
        }
        return {
            success: false,
            printers: [],
            message: res.data?.message || 'Failed to detect printers',
        };
    } catch (err: unknown) {
        return {
            success: false,
            printers: [],
            message: axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Print bridge unreachable',
        };
    }
}

/**
 * Fetch list of registered companion print bridges from Laravel Cloud API
 */
export async function fetchRegisteredBridges(branchId?: number): Promise<{ success: boolean; bridges: RegisteredBridge[] }> {
    try {
        const url = branchId ? `/api/v1/pos/print-bridges?branch_id=${branchId}` : '/api/v1/pos/print-bridges';
        const res = await axios.get(url, { timeout: 4000 });
        if (res.status === 200 && res.data?.success && Array.isArray(res.data?.bridges)) {
            return {
                success: true,
                bridges: res.data.bridges,
            };
        }
        return { success: false, bridges: [] };
    } catch {
        return { success: false, bridges: [] };
    }
}

/**
 * Dispatch cloud-based diagnostic test print job for Android Companion Bridge
 */
export async function sendCloudTestPrintJob(branchId: number, terminalId?: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.post('/api/v1/pos/print-jobs/test', {
            branch_id: branchId,
            terminal_id: terminalId,
        }, { timeout: 5000 });

        if (res.status === 200 && res.data?.success) {
            return {
                success: true,
                message: 'Test print job queued. The Android Companion Bridge will print it automatically.',
            };
        }
        return {
            success: false,
            message: res.data?.message || 'Failed to queue test print job',
        };
    } catch (err: unknown) {
        const msg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Server communication error';
        return {
            success: false,
            message: msg,
        };
    }
}

/**
 * Dispatch test print job to local thermal printer
 */
export async function sendTestPrint(
    branchName = 'VICTORIA',
    customConfig?: Partial<PrinterConfig>,
    branchId?: number
): Promise<{ success: boolean; message: string }> {
    const config = { ...getPrinterConfig(), ...customConfig };

    if (config.connection_type === 'android_bridge' && branchId) {
        return await sendCloudTestPrintJob(branchId, config.selected_bridge_uuid);
    }

    try {
        const res = await axios.post(`${LOCAL_BRIDGE_URL}/test-print`, {
            branch_name: branchName,
            printer_name: config.printer_name,
            connection_type: config.connection_type,
            tcp_host: config.tcp_host,
            tcp_port: config.tcp_port,
            paper_width: config.paper_width,
        }, {
            timeout: 8000,
        });

        if (res.status === 200 && res.data?.success) {
            return {
                success: true,
                message: res.data.message || 'Test receipt spooled successfully',
            };
        }
        return {
            success: false,
            message: res.data?.message || 'Test print failed',
        };
    } catch (err: unknown) {
        const errMsg = axios.isAxiosError(err) 
            ? (err.response?.data?.message || err.message) 
            : 'Print bridge unreachable. Please verify that the bridge service is running.';
        return {
            success: false,
            message: errMsg,
        };
    }
}

/**
 * Dispatch POS receipt print job to local print bridge
 */
export async function sendToLocalPrintBridge(
    job: LocalPrintJobPayload,
    customConfig?: Partial<PrinterConfig>
): Promise<{ success: boolean; message: string }> {
    const config = { ...getPrinterConfig(), ...customConfig };

    const payload = {
        job_uuid: job.job_uuid,
        order_number: job.order_number,
        printer_name: config.printer_name || job.printer_name,
        connection_type: config.connection_type || job.connection_type || 'usb',
        tcp_host: config.tcp_host || job.tcp_host,
        tcp_port: config.tcp_port || job.tcp_port,
        paper_width: config.paper_width || job.paper_width || 58,
        raw_escpos_base64: job.raw_escpos_base64,
        formatted_text: job.formatted_text,
    };

    try {
        const res = await axios.post(`${LOCAL_BRIDGE_URL}/print`, payload, {
            timeout: 10000,
        });

        const isSuccess = res.status === 200 && res.data?.success;

        // Notify backend of status asynchronously
        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: isSuccess ? 'printed' : 'failed',
                error: isSuccess ? null : (res.data?.message || 'Spooling failed'),
            }).catch(() => {});
        }

        return {
            success: isSuccess,
            message: res.data?.message || 'Receipt sent to thermal printer',
        };
    } catch (err: unknown) {
        const errMsg = axios.isAxiosError(err) 
            ? (err.response?.data?.message || err.message) 
            : 'Local print bridge is unreachable. Please make sure the print service is running.';

        // Notify backend of failure
        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: 'failed',
                error: errMsg,
            }).catch(() => {});
        }

        return {
            success: false,
            message: errMsg,
        };
    }
}

/**
 * React Hook for tracking physical printer readiness and managing configuration
 */
export function usePrinterStatus(branchId?: number) {
    const [status, setStatus] = useState<PrinterBridgeStatus>('checking');
    const [config, setConfig] = useState<PrinterConfig>(getPrinterConfig);
    const [printers, setPrinters] = useState<DetectedPrinter[]>([]);
    const [bridges, setBridges] = useState<RegisteredBridge[]>([]);
    const [isFetchingPrinters, setIsFetchingPrinters] = useState(false);
    const [isFetchingBridges, setIsFetchingBridges] = useState(false);

    const updateConfig = useCallback((updates: Partial<PrinterConfig>) => {
        const updated = savePrinterConfig(updates);
        setConfig(updated);
        return updated;
    }, []);

    const fetchPrinters = useCallback(async () => {
        setIsFetchingPrinters(true);
        const res = await getAvailablePrinters();
        if (res.success) {
            setPrinters(res.printers);
            // Auto-select default printer if not configured yet
            if (!config.printer_name && res.printers.length > 0) {
                const defaultP = res.printers.find(p => p.isDefault) || res.printers[0];
                if (defaultP) {
                    updateConfig({ printer_name: defaultP.name });
                }
            }
        }
        setIsFetchingPrinters(false);
        return res.printers;
    }, [config.printer_name, updateConfig]);

    const fetchBridges = useCallback(async () => {
        setIsFetchingBridges(true);
        const res = await fetchRegisteredBridges(branchId);
        if (res.success) {
            setBridges(res.bridges);
            // Auto-select active android bridge if using android_bridge mode
            if (config.connection_type === 'android_bridge' && !config.selected_bridge_uuid && res.bridges.length > 0) {
                const onlineB = res.bridges.find(b => b.is_online) || res.bridges[0];
                if (onlineB) {
                    updateConfig({ selected_bridge_uuid: onlineB.bridge_uuid });
                }
            }
        }
        setIsFetchingBridges(false);
        return res.bridges;
    }, [branchId, config.connection_type, config.selected_bridge_uuid, updateConfig]);

    const checkNow = useCallback(async () => {
        const health = await checkPrintBridgeHealth();
        setStatus(health.isHealthy ? 'ready' : 'offline');
        if (health.isHealthy) {
            fetchPrinters();
        }
        fetchBridges();
        return health.isHealthy;
    }, [fetchPrinters, fetchBridges]);

    useEffect(() => {
        let isMounted = true;

        const runCheck = async () => {
            const health = await checkPrintBridgeHealth();
            if (isMounted) {
                setStatus(health.isHealthy ? 'ready' : 'offline');
                if (health.isHealthy) {
                    const printerRes = await getAvailablePrinters();
                    if (isMounted && printerRes.success) {
                        setPrinters(printerRes.printers);
                    }
                }
                const bridgeRes = await fetchRegisteredBridges(branchId);
                if (isMounted && bridgeRes.success) {
                    setBridges(bridgeRes.bridges);
                }
            }
        };

        runCheck();
        const interval = setInterval(runCheck, 20000);

        const handleFocus = () => {
            runCheck();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [branchId]);

    const hasActiveAndroidBridge = bridges.some(b => b.is_online);

    return {
        status,
        isConnected: status === 'ready' || (config.connection_type === 'android_bridge' && hasActiveAndroidBridge),
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
    };
}

/**
 * Trigger native browser thermal print targeting the 58mm receipt layout
 */
export function triggerBrowserThermalPrint(): void {
    if (typeof window !== 'undefined') {
        window.print();
    }
}
