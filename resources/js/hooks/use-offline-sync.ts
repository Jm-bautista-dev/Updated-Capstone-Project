import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getOfflineQueue, removeFromOfflineQueue } from '@/lib/offline-db';

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

export function useOfflineSync() {
    const [status, setStatus] = useState<ConnectionStatus>(
        navigator.onLine ? 'online' : 'offline'
    );
    const [pendingCount, setPendingCount] = useState(0);

    const refreshPendingCount = useCallback(async () => {
        const queue = await getOfflineQueue();
        setPendingCount(queue.length);
    }, []);

    const performSync = useCallback(async () => {
        const queue = await getOfflineQueue();
        if (queue.length === 0) {
            setStatus('online');
            setPendingCount(0);
            return;
        }

        setStatus('syncing');

        try {
            const response = await axios.post('/api/sync', { operations: queue });
            const { synced, conflicts } = response.data;

            // Remove successfully synced operations from IndexedDB
            if (Array.isArray(synced)) {
                for (const id of synced) {
                    await removeFromOfflineQueue(id);
                }
            }

            await refreshPendingCount();
            setStatus('online');

            // Broadcast conflicts if any exist
            if (Array.isArray(conflicts) && conflicts.length > 0) {
                const event = new CustomEvent('offline-sync-conflicts', {
                    detail: { conflicts }
                });
                window.dispatchEvent(event);
            }
        } catch (error) {
            console.error('Offline background sync failed:', error);
            setStatus('offline');
        }
    }, [refreshPendingCount]);

    useEffect(() => {
        refreshPendingCount();

        const handleOnline = () => {
            setStatus('syncing');
            performSync();
        };

        const handleOffline = () => {
            setStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodically check queue or sync (e.g. every 30 seconds if online)
        const interval = setInterval(() => {
            if (navigator.onLine && status === 'online') {
                performSync();
            } else {
                refreshPendingCount();
            }
        }, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, [performSync, status, refreshPendingCount]);

    return { status, pendingCount, performSync, refreshPendingCount };
}
