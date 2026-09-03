/**
 * MAKI DESU — Global Notification & Toast Manager
 * 
 * Features:
 * - Controlled FIFO queue with maximum 3 visible notifications.
 * - 5-second auto-dismissal with pause on hover/focus and resume on blur/leave.
 * - Deduplication against WebSockets, Echo reconnects, polling, and re-renders.
 * - Persistent dismissal memory via localStorage (cross-navigation and page reloads).
 * - Cross-tab synchronization via BroadcastChannel.
 * - Clear All action for rapid dismissal of visible + queued notifications.
 * - Dedicated non-blocking layer support.
 */

import { playOrderNotificationSound } from './order-audio';

export interface GlobalNotificationItem {
    id: string | number; // Unique identifier (e.g., order_id, "order_101", "cancel_req_42")
    type: 'order' | 'pickup' | 'cancellation' | 'info' | 'warning';
    title: string;
    order_number?: string;
    customer_name?: string;
    branch_name?: string;
    total_amount?: string | number;
    items_count?: number;
    reason?: string;
    details?: string;
    link_url?: string;
    link_text?: string;
    cancellation_request_id?: number;
    auto_dismiss?: boolean; // default true
    duration_ms?: number; // default 5000ms
    created_at: number; // timestamp
}

type NotificationChangeListener = (state: {
    visible: GlobalNotificationItem[];
    queueCount: number;
    totalActive: number;
}) => void;

interface TimerRecord {
    timeoutId: ReturnType<typeof setTimeout> | null;
    remainingMs: number;
    startedAt: number;
    durationMs: number;
    isPaused: boolean;
}

const MAX_VISIBLE_COUNT = 3;
const DEFAULT_AUTO_DISMISS_MS = 5000;
const STORAGE_DISMISSED_KEY = 'makidesu_dismissed_toast_ids_v1';
const MAX_PERSISTED_DISMISSED = 200;

class GlobalNotificationManager {
    private visibleList: GlobalNotificationItem[] = [];
    private queueList: GlobalNotificationItem[] = [];
    private timers: Map<string | number, TimerRecord> = new Map();
    private seenIds: Set<string | number> = new Set();
    private dismissedIds: Set<string | number> = new Set();
    private listeners: Set<NotificationChangeListener> = new Set();
    private broadcastChannel: BroadcastChannel | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.loadDismissedIds();

            // Setup Cross-tab Broadcast Channel
            if ('BroadcastChannel' in window) {
                try {
                    this.broadcastChannel = new BroadcastChannel('makidesu_global_toasts_channel');
                    this.broadcastChannel.onmessage = (event) => {
                        this.handleBroadcast(event.data);
                    };
                } catch {
                    // Fallback gracefully
                }
            }

            // Sync with storage events across tabs
            window.addEventListener('storage', (e) => {
                if (e.key === STORAGE_DISMISSED_KEY && e.newValue) {
                    try {
                        const ids: (string | number)[] = JSON.parse(e.newValue);
                        ids.forEach((id) => this.dismiss(id, false));
                    } catch {
                        // ignore
                    }
                }
            });
        }
    }

    private loadDismissedIds(): void {
        try {
            const raw = localStorage.getItem(STORAGE_DISMISSED_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) {
                    list.forEach((id) => this.dismissedIds.add(id));
                }
            }
        } catch {
            // ignore
        }
    }

    private persistDismissedId(id: string | number): void {
        this.dismissedIds.add(id);
        try {
            const list = Array.from(this.dismissedIds);
            if (list.length > MAX_PERSISTED_DISMISSED) {
                list.splice(0, list.length - MAX_PERSISTED_DISMISSED);
                this.dismissedIds = new Set(list);
            }
            localStorage.setItem(STORAGE_DISMISSED_KEY, JSON.stringify(list));
        } catch {
            // ignore
        }
    }

    private handleBroadcast(data: { type: string; payload?: unknown }): void {
        if (!data || typeof data !== 'object') return;

        if (data.type === 'NOTIFY') {
            const item = data.payload as GlobalNotificationItem;
            if (item && item.id && !this.dismissedIds.has(item.id)) {
                this.notify(item, false);
            }
        } else if (data.type === 'DISMISS') {
            const id = data.payload as string | number;
            if (id) {
                this.dismiss(id, false);
            }
        } else if (data.type === 'CLEAR_ALL') {
            this.clearAll(false);
        }
    }

    /**
     * Post an order or cancellation notification into the managed queue pipeline.
     */
    public notify(item: GlobalNotificationItem, broadcast: boolean = true): void {
        if (!item || item.id === undefined || item.id === null) return;

        const normalizedId = item.id;

        // 1. Deduplication checks
        if (this.dismissedIds.has(normalizedId) || this.seenIds.has(normalizedId)) {
            return;
        }

        this.seenIds.add(normalizedId);
        if (this.seenIds.size > 500) {
            const first = this.seenIds.values().next().value;
            if (first !== undefined) this.seenIds.delete(first);
        }

        // 2. Play sound ONCE per unique event
        playOrderNotificationSound();

        const toastItem: GlobalNotificationItem = {
            ...item,
            auto_dismiss: item.auto_dismiss ?? true,
            duration_ms: item.duration_ms || DEFAULT_AUTO_DISMISS_MS,
            created_at: item.created_at || Date.now(),
        };

        // 3. Pipeline placement
        if (this.visibleList.length < MAX_VISIBLE_COUNT) {
            this.visibleList.push(toastItem);
            this.startTimer(toastItem);
        } else {
            this.queueList.push(toastItem);
        }

        this.emitChange();

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'NOTIFY', payload: toastItem });
            } catch {
                // ignore
            }
        }
    }

    /**
     * Start auto-dismissal countdown timer for a visible toast.
     */
    private startTimer(item: GlobalNotificationItem): void {
        if (!item.auto_dismiss) return;

        const duration = item.duration_ms || DEFAULT_AUTO_DISMISS_MS;
        const startedAt = Date.now();

        const timeoutId = setTimeout(() => {
            this.dismiss(item.id, true);
        }, duration);

        this.timers.set(item.id, {
            timeoutId,
            remainingMs: duration,
            startedAt,
            durationMs: duration,
            isPaused: false,
        });
    }

    /**
     * Pause auto-dismissal timer on hover or focus.
     */
    public pauseTimer(id: string | number): void {
        const record = this.timers.get(id);
        if (!record || record.isPaused) return;

        if (record.timeoutId) {
            clearTimeout(record.timeoutId);
            record.timeoutId = null;
        }

        const elapsed = Date.now() - record.startedAt;
        record.remainingMs = Math.max(1000, record.remainingMs - elapsed);
        record.isPaused = true;
    }

    /**
     * Resume auto-dismissal timer when pointer/focus leaves.
     */
    public resumeTimer(id: string | number): void {
        const record = this.timers.get(id);
        if (!record || !record.isPaused) return;

        record.startedAt = Date.now();
        record.isPaused = false;
        record.timeoutId = setTimeout(() => {
            this.dismiss(id, true);
        }, record.remainingMs);
    }

    /**
     * Dismiss an individual notification and slide next queued item into visible stack.
     */
    public dismiss(id: string | number, broadcast: boolean = true): void {
        // Clear active timer
        const timer = this.timers.get(id);
        if (timer?.timeoutId) {
            clearTimeout(timer.timeoutId);
        }
        this.timers.delete(id);

        // Remember dismissal
        this.persistDismissedId(id);

        // Remove from visible
        const prevVisibleCount = this.visibleList.length;
        this.visibleList = this.visibleList.filter((item) => item.id !== id);
        this.queueList = this.queueList.filter((item) => item.id !== id);

        // If a slot opened up, advance the next queued notification
        if (this.visibleList.length < MAX_VISIBLE_COUNT && this.queueList.length > 0) {
            const nextItem = this.queueList.shift()!;
            this.visibleList.push(nextItem);
            this.startTimer(nextItem);
        }

        this.emitChange();

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'DISMISS', payload: id });
            } catch {
                // ignore
            }
        }
    }

    /**
     * Clear all visible and queued notifications at once.
     */
    public clearAll(broadcast: boolean = true): void {
        // Clear all timers
        this.timers.forEach((t) => {
            if (t.timeoutId) clearTimeout(t.timeoutId);
        });
        this.timers.clear();

        // Remember dismissals for all current items
        this.visibleList.forEach((item) => this.persistDismissedId(item.id));
        this.queueList.forEach((item) => this.persistDismissedId(item.id));

        this.visibleList = [];
        this.queueList = [];

        this.emitChange();

        if (broadcast && this.broadcastChannel) {
            try {
                this.broadcastChannel.postMessage({ type: 'CLEAR_ALL' });
            } catch {
                // ignore
            }
        }
    }

    public getState() {
        return {
            visible: [...this.visibleList],
            queueCount: this.queueList.length,
            totalActive: this.visibleList.length + this.queueList.length,
        };
    }

    public subscribe(listener: NotificationChangeListener): () => void {
        this.listeners.add(listener);
        listener(this.getState());
        return () => {
            this.listeners.delete(listener);
        };
    }

    private emitChange(): void {
        const state = this.getState();
        this.listeners.forEach((listener) => {
            try {
                listener(state);
            } catch (err) {
                console.error('GlobalNotificationManager listener error:', err);
            }
        });
    }
}

export const globalNotificationManager = new GlobalNotificationManager();
