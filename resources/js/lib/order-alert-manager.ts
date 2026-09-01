import { useEffect, useState } from 'react';
import { startRepeatingAlertSound, stopRepeatingAlertSound } from './order-audio';

export interface PendingOrderAlert {
    id: number; // Internal permanent order_id (e.g. 9281)
    order_number: string; // e.g. "ORD-19"
    customer_name: string;
    branch_id?: number;
    branch_name: string;
    total_amount: number;
    items_count: number;
    timestamp: string; // e.g. "8:31 PM"
    received_at: number; // epoch ms
}

type AlertListener = (alerts: PendingOrderAlert[]) => void;

class OrderAlertManager {
    private alerts: PendingOrderAlert[] = [];
    private listeners: Set<AlertListener> = new Set();
    private broadcastChannel: BroadcastChannel | null = null;
    private acknowledgedIds: Set<number> = new Set();

    constructor() {
        if (typeof window !== 'undefined') {
            // Cross-tab synchronization via BroadcastChannel
            if ('BroadcastChannel' in window) {
                try {
                    this.broadcastChannel = new BroadcastChannel('makidesu_order_alerts_channel');
                    this.broadcastChannel.onmessage = (event) => {
                        this.handleBroadcastMessage(event.data);
                    };
                } catch {
                    // Fallback to local only if BroadcastChannel fails
                }
            }

            // Sync with localStorage on cross-tab storage events
            window.addEventListener('storage', (e) => {
                if (e.key === 'makidesu_acknowledged_orders') {
                    try {
                        const acked: number[] = JSON.parse(e.newValue || '[]');
                        acked.forEach((id) => this.acknowledgeAlert(id, false));
                    } catch {
                        // Silently ignore malformed storage data
                    }
                }
            });
        }
    }

    private handleBroadcastMessage(message: { type: string; payload?: unknown }): void {
        if (!message || typeof message !== 'object') return;

        if (message.type === 'NEW_ALERT') {
            const alert = message.payload as PendingOrderAlert;
            if (alert && alert.id && !this.acknowledgedIds.has(alert.id)) {
                this.addAlert(alert, false);
            }
        } else if (message.type === 'ACKNOWLEDGE_ALERT') {
            const orderId = message.payload as number;
            if (orderId) {
                this.acknowledgeAlert(orderId, false);
            }
        } else if (message.type === 'ACKNOWLEDGE_ALL') {
            this.acknowledgeAll(false);
        }
    }

    public getAlerts(): PendingOrderAlert[] {
        return [...this.alerts];
    }

    public hasPendingAlerts(): boolean {
        return this.alerts.length > 0;
    }

    public addAlert(alert: PendingOrderAlert, broadcast: boolean = true): void {
        if (!alert || !alert.id) return;

        // Skip if already acknowledged in this session
        if (this.acknowledgedIds.has(alert.id)) {
            return;
        }

        // Deduplicate using permanent internal order ID
        const exists = this.alerts.some((a) => a.id === alert.id);
        if (exists) {
            return;
        }

        this.alerts = [alert, ...this.alerts];
        this.notifyListeners();

        // Start controlled repeating sound loop
        startRepeatingAlertSound();

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'NEW_ALERT', payload: alert });
            } catch {
                // Ignore broadcast error
            }
        }
    }

    public acknowledgeAlert(orderId: number, broadcast: boolean = true): void {
        if (!orderId) return;

        this.acknowledgedIds.add(orderId);
        this.alerts = this.alerts.filter((a) => a.id !== orderId);
        this.notifyListeners();

        // If no more unacknowledged orders, stop the repeating sound immediately
        if (this.alerts.length === 0) {
            stopRepeatingAlertSound();
        }

        // Persist acknowledgement locally to handle reloads/tab sync
        this.persistAcknowledgedId(orderId);

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'ACKNOWLEDGE_ALERT', payload: orderId });
            } catch {
                // Ignore broadcast error
            }
        }
    }

    public acknowledgeAll(broadcast: boolean = true): void {
        this.alerts.forEach((a) => this.acknowledgedIds.add(a.id));
        this.alerts = [];
        this.notifyListeners();

        // Stop sound immediately
        stopRepeatingAlertSound();

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'ACKNOWLEDGE_ALL' });
            } catch {
                // Ignore broadcast error
            }
        }
    }

    private persistAcknowledgedId(orderId: number): void {
        if (typeof window === 'undefined') return;
        try {
            const raw = localStorage.getItem('makidesu_acknowledged_orders');
            const list: number[] = raw ? JSON.parse(raw) : [];
            if (!list.includes(orderId)) {
                list.push(orderId);
                // Keep last 100 acknowledged orders in storage
                if (list.length > 100) list.shift();
                localStorage.setItem('makidesu_acknowledged_orders', JSON.stringify(list));
            }
        } catch {
            // Silently fail
        }
    }

    public subscribe(listener: AlertListener): () => void {
        this.listeners.add(listener);
        listener(this.getAlerts());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notifyListeners(): void {
        const currentAlerts = this.getAlerts();
        this.listeners.forEach((listener) => {
            try {
                listener(currentAlerts);
            } catch (err) {
                console.error('OrderAlertManager listener error:', err);
            }
        });
    }
}

export const orderAlertManager = new OrderAlertManager();

/**
 * React hook to observe unacknowledged order alerts in real-time.
 */
export function useOrderAlerts(): {
    alerts: PendingOrderAlert[];
    hasAlerts: boolean;
    acknowledgeAlert: (orderId: number) => void;
    acknowledgeAll: () => void;
} {
    const [alerts, setAlerts] = useState<PendingOrderAlert[]>(() => orderAlertManager.getAlerts());

    useEffect(() => {
        return orderAlertManager.subscribe((latestAlerts) => {
            setAlerts(latestAlerts);
        });
    }, []);

    return {
        alerts,
        hasAlerts: alerts.length > 0,
        acknowledgeAlert: (id: number) => orderAlertManager.acknowledgeAlert(id),
        acknowledgeAll: () => orderAlertManager.acknowledgeAll(),
    };
}
