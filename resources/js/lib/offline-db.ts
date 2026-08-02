export interface OfflineOperationPayload {
    force?: boolean;
    quantity?: number;
    items?: Array<{ id: number | string; quantity: number; [key: string]: unknown }>;
    [key: string]: unknown;
}

export interface OfflineOperation {
    id: string;
    type: 'SALE' | 'INVENTORY_UPDATE' | 'RESTOCK';
    payload: OfflineOperationPayload;
    synced: boolean;
    created_at: string;
}

const DB_NAME = 'MakiDesuOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'operations';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

export async function getOfflineQueue(): Promise<OfflineOperation[]> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('IndexedDB open error:', e);
        return [];
    }
}

export async function addToOfflineQueue(op: Omit<OfflineOperation, 'synced' | 'created_at'>): Promise<void> {
    const db = await openDB();
    const fullOp: OfflineOperation = {
        ...op,
        synced: false,
        created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(fullOp);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

export async function clearOfflineQueue(): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
