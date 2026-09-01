import axios from 'axios';
import { useEffect, useState, useCallback } from 'react';

const LOCAL_BRIDGE_URL = 'http://127.0.0.1:18181';

export interface LocalPrintJobPayload {
    job_uuid: string;
    order_number: string;
    printer_name?: string;
    paper_width?: number;
    raw_escpos_base64?: string;
    formatted_text?: string;
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

    const checkStatus = useCallback(async () => {
        const isHealthy = await checkPrintBridgeHealth();
        setStatus(isHealthy ? 'ready' : 'offline');
        return isHealthy;
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 15000);
        return () => clearInterval(interval);
    }, [checkStatus]);

    return {
        status,
        isConnected: status === 'ready',
        checkNow: checkStatus,
    };
}
