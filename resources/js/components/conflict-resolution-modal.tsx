import axios from 'axios';
import { useState, useEffect } from 'react';
import { FiAlertTriangle, FiTrash2, FiRefreshCw, FiEdit2 } from 'react-icons/fi';
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
import { getOfflineQueue, addToOfflineQueue, removeFromOfflineQueue } from '@/lib/offline-db';

interface SyncConflict {
    client_op_id: string;
    type: string;
    message: string;
    payload?: {
        quantity?: number;
        items?: Array<{ id: number | string; quantity: number }>;
        [key: string]: unknown;
    };
}

export function ConflictResolutionModal() {
    const [open, setOpen] = useState(false);
    const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [editQty, setEditQty] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const handleSyncConflicts = (e: Event) => {
            const customEvent = e as CustomEvent<{ conflicts?: SyncConflict[] }>;
            const list = customEvent.detail?.conflicts || [];
            if (list.length > 0) {
                setConflicts(list);
                setActiveIndex(0);
                setIsEditing(false);
                setOpen(true);
            }
        };

        window.addEventListener('offline-sync-conflicts', handleSyncConflicts);
        return () => window.removeEventListener('offline-sync-conflicts', handleSyncConflicts);
    }, []);

    const activeConflict = conflicts[activeIndex];

    const startEditing = () => {
        if (activeConflict) {
            if (activeConflict.type === 'SALE' && activeConflict.payload?.items?.[0]) {
                setEditQty(String(activeConflict.payload.items[0].quantity));
            } else if ((activeConflict.type === 'INVENTORY_UPDATE' || activeConflict.type === 'RESTOCK') && activeConflict.payload?.quantity !== undefined) {
                setEditQty(String(activeConflict.payload.quantity));
            } else {
                setEditQty('');
            }
        }
        setIsEditing(true);
    };

    const handleKeepServer = async () => {
        if (!activeConflict) return;
        try {
            await removeFromOfflineQueue(activeConflict.client_op_id);
            toast.success('Local transaction discarded. Server state preserved.');
            nextOrClose();
        } catch {
            toast.error('Failed to resolve conflict.');
        }
    };

    const handleOverrideLocal = async () => {
        if (!activeConflict) return;
        try {
            toast.loading('Applying local overrides...');
            const queue = await getOfflineQueue();
            const matchingOp = queue.find(op => op.id === activeConflict.client_op_id);
            if (matchingOp) {
                matchingOp.payload.force = true;
                await removeFromOfflineQueue(activeConflict.client_op_id);
                await addToOfflineQueue({
                    id: matchingOp.id,
                    type: matchingOp.type,
                    payload: matchingOp.payload
                });
                
                const response = await axios.post('/api/sync', { operations: [matchingOp] });
                const { synced } = response.data;
                
                if (synced && synced.includes(matchingOp.id)) {
                    await removeFromOfflineQueue(matchingOp.id);
                    toast.dismiss();
                    toast.success('Local change forced successfully.');
                } else {
                    toast.dismiss();
                    toast.error('Failed to override. Stock conditions still blocking.');
                }
            }
            nextOrClose();
        } catch {
            toast.dismiss();
            toast.error('Override attempt failed.');
        }
    };

    const handleMerge = async () => {
        if (!activeConflict) return;
        const qty = parseFloat(editQty);
        if (isNaN(qty) || qty <= 0) {
            toast.error('Please enter a valid quantity.');
            return;
        }

        try {
            const queue = await getOfflineQueue();
            const matchingOp = queue.find(op => op.id === activeConflict.client_op_id);
            if (matchingOp) {
                if (matchingOp.type === 'SALE' && matchingOp.payload.items?.[0]) {
                    matchingOp.payload.items[0].quantity = qty;
                } else if (matchingOp.type === 'INVENTORY_UPDATE' && matchingOp.payload) {
                    matchingOp.payload.quantity = qty;
                } else if (matchingOp.type === 'RESTOCK' && matchingOp.payload) {
                    matchingOp.payload.quantity = qty;
                }

                await removeFromOfflineQueue(matchingOp.id);
                await addToOfflineQueue({
                    id: matchingOp.id,
                    type: matchingOp.type,
                    payload: matchingOp.payload
                });

                toast.success('Transaction updated. Auto-sync will retry shortly.');
            }
            nextOrClose();
        } catch {
            toast.error('Merge failed.');
        }
    };

    const nextOrClose = () => {
        setIsEditing(false);
        if (activeIndex < conflicts.length - 1) {
            setActiveIndex(prev => prev + 1);
        } else {
            setOpen(false);
            setConflicts([]);
        }
    };

    if (!activeConflict) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-120 overflow-hidden rounded-3xl p-0 z-120">
                <DialogHeader className="bg-amber-500/10 p-6 pb-4 border-b border-amber-500/20">
                    <DialogTitle className="text-xl font-bold uppercase tracking-tight flex items-center gap-2 text-amber-600">
                        <FiAlertTriangle className="size-5" />
                        Sync Conflict Detected ({activeIndex + 1}/{conflicts.length})
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium text-amber-700/80">
                        A local transaction encountered an error during database sync.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-4">
                    {/* Error Box */}
                    <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Conflict Reason</span>
                        <p className="text-xs font-bold leading-tight">{activeConflict.message}</p>
                    </div>

                    {/* Conflict Summary details */}
                    <div className="p-4 rounded-2xl bg-muted/40 space-y-2 border">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Local Transaction Payload</span>
                        <div className="text-xs font-mono grid grid-cols-2 gap-2 opacity-80">
                            <div>Type: <span className="font-bold">{activeConflict.type}</span></div>
                            <div>ID: <span className="font-bold">{activeConflict.client_op_id}</span></div>
                            {activeConflict.type === 'SALE' && activeConflict.payload?.items?.[0] && (
                                <div className="col-span-2 border-t pt-1.5 mt-1">
                                    Product ID: <span className="font-bold">{activeConflict.payload.items[0].id}</span>, 
                                    Qty: <span className="font-bold">{activeConflict.payload.items[0].quantity}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Merge edit panel */}
                    {isEditing && (
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3 animate-in slide-in-from-top duration-300">
                            <label className="text-[10px] uppercase font-black text-primary tracking-widest block ml-1">Modify Quantity</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editQty}
                                    onChange={(e) => setEditQty(e.target.value)}
                                    className="h-11 rounded-xl bg-background border-none ring-1 ring-muted font-bold text-base"
                                />
                                <Button onClick={handleMerge} className="rounded-xl h-11 font-bold">
                                    Save & Merge
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-muted/30 p-6 border-t flex flex-col sm:flex-row gap-2">
                    {!isEditing && (
                        <Button variant="outline" onClick={startEditing} className="rounded-xl h-11 font-bold gap-2">
                            <FiEdit2 className="size-4" />
                            Merge / Edit
                        </Button>
                    )}
                    <Button variant="destructive" onClick={handleKeepServer} className="rounded-xl h-11 font-bold gap-2 shadow-lg shadow-rose-500/10">
                        <FiTrash2 className="size-4" />
                        Keep Server
                    </Button>
                    <Button onClick={handleOverrideLocal} className="rounded-xl h-11 font-bold gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-500/10">
                        <FiRefreshCw className="size-4" />
                        Override Local
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
