import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:18181';

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
    paper_width?: number;
    raw_escpos_base64?: string;
    formatted_text?: string;
    receipt_data?: ReceiptDataPayload;
}

export type PrinterBridgeStatus = 'ready' | 'offline' | 'checking';

/**
 * Probe local print bridge health
 */
export async function checkPrintBridgeHealth(): Promise<boolean> {
    try {
        const res = await axios.get(`${LOCAL_BRIDGE_URL}/health`, {
            timeout: 1500,
        });
        return res.status === 200 && res.data?.status === 'ok';
    } catch {
        return false;
    }
}

/**
 * Dispatch raw print job to local print bridge
 */
export async function sendToLocalPrintBridge(job: LocalPrintJobPayload): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.post(`${LOCAL_BRIDGE_URL}/print`, {
            job_uuid: job.job_uuid,
            order_number: job.order_number,
            printer_name: job.printer_name,
            paper_width: job.paper_width || 80,
            raw_escpos_base64: job.raw_escpos_base64,
            formatted_text: job.formatted_text,
        }, {
            timeout: 6000,
        });

        const isSuccess = res.status === 200 && res.data?.success;

        // Notify backend of status
        if (job.job_uuid) {
            axios.post(`/api/v1/pos/print-jobs/${job.job_uuid}/status`, {
                status: isSuccess ? 'printed' : 'failed',
                error: isSuccess ? null : (res.data?.message || 'Spooling failed'),
            }).catch(() => {});
        }

        return {
            success: isSuccess,
            message: res.data?.message || 'Receipt sent to printer',
        };
    } catch (err: unknown) {
        const errMsg = axios.isAxiosError(err) ? (err.response?.data?.message || err.message) : 'Print bridge unreachable';

        // Notify backend of failure so it stays in pending/failed queue
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
 * React Hook for tracking physical printer readiness
 */
export function usePrinterStatus() {
    const [status, setStatus] = useState<PrinterBridgeStatus>('checking');

    const checkNow = useCallback(async () => {
        const isHealthy = await checkPrintBridgeHealth();
        setStatus(isHealthy ? 'ready' : 'offline');
        return isHealthy;
    }, []);

    useEffect(() => {
        let isMounted = true;

        const runCheck = async () => {
            const isHealthy = await checkPrintBridgeHealth();
            if (isMounted) {
                setStatus(isHealthy ? 'ready' : 'offline');
            }
        };

        runCheck();
        const interval = setInterval(runCheck, 60000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return {
        status,
        isConnected: status === 'ready',
        checkNow,
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

