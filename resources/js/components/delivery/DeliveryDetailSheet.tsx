import { router } from '@inertiajs/react';
import {
    User, MapPin, Clock, Building2, Bike, Truck,
    Phone, ChevronRight, AlertCircle,
    Package, Navigation, CheckCircle2, FileText, Image,
    Maximize2, RefreshCw
} from 'lucide-react';
import React from 'react';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Delivery } from './types';
import { formatCurrency, formatTime, formatDate } from './types';

interface DeliveryDetailSheetProps {
    delivery: Delivery | null;
    open: boolean;
    onClose: () => void;
    onUpdateStatus: (id: number) => void;
    onAssignRider: (delivery: Delivery) => void;
}

// Full delivery status timeline (all 7 steps)
const STATUS_STEPS = [
    { key: 'pending',           label: 'Pending',      icon: Clock },
    { key: 'preparing',         label: 'Preparing',    icon: Package },
    { key: 'ready_for_pickup',  label: 'Ready',        icon: CheckCircle2 },
    { key: 'assigned_to_rider', label: 'Assigned',     icon: Bike },
    { key: 'picked_up',         label: 'Picked Up',    icon: Navigation },
    { key: 'in_transit',        label: 'In Transit',   icon: Truck },
    { key: 'delivered',         label: 'Delivered',    icon: CheckCircle2 },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
    const isFailed = currentStatus === 'failed_delivery';
    const isCancelled = currentStatus === 'cancelled';
    const normalizedStatus = currentStatus === 'waiting_for_kitchen' ? 'pending' : currentStatus;
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === normalizedStatus);

    return (
        <div className="w-full py-6 relative overflow-hidden group/timeline">
            {(isFailed || isCancelled) && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-between">
                    <span>{isFailed ? '⚠️ Delivery Attempt Failed — Requires Rider Reassignment' : '🚫 Delivery Cancelled'}</span>
                </div>
            )}
            {/* Custom Animation Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.95); }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
            ` }} />

            <div className="flex items-start justify-between w-full px-2 overflow-x-auto no-scrollbar relative">
                {/* Continuous Background Line (Fixed Position) */}
                <div className="absolute top-4.5 left-0 right-0 h-0.5 bg-(--ops-surface-sunken)/60 z-0 mx-8" />
                
                {STATUS_STEPS.map((step, i) => {
                    const isCompleted = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="flex flex-col items-center min-w-15 relative z-10">
                            {/* Step Icon */}
                            <div className={cn(
                                "size-9 rounded-xl flex items-center justify-center transition-all duration-700",
                                "relative border-2 border-transparent",
                                isCompleted ? "bg-emerald-100 text-emerald-600 border-emerald-200 shadow-sm" : "",
                                isCurrent ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30 scale-110 ring-4 ring-primary/10 animate-pulse-subtle" : "",
                                !isCompleted && !isCurrent ? "bg-(--ops-page-bg) border-muted text-(--ops-text-muted)/40" : ""
                            )}>
                                <Icon className={cn("size-4 transition-transform duration-500", isCurrent && "scale-110")} />
                                
                                {/* Progress Indicator on the line */}
                                {i < STATUS_STEPS.length - 1 && i < currentIndex && (
                                    <div className="absolute left-[calc(100%+2px)] top-1/2 -translate-y-1/2 w-[calc(100%+20px)] h-0.5 bg-emerald-300 z-[-1]" />
                                )}
                            </div>

                            {/* Status Label */}
                            <div className="mt-3 h-10 flex items-start justify-center">
                                <span className={cn(
                                    "text-[8px] sm:text-[9px] font-black uppercase tracking-tighter sm:tracking-widest text-center leading-[1.1] transition-all duration-500",
                                    isCurrent ? "text-primary scale-110" : "text-(--ops-text-muted)/60",
                                    isCompleted ? "text-emerald-600/80" : ""
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Zoomable proof-of-delivery image viewer */
function ProofOfDeliveryViewer({ url, deliveredAt, riderName }: {
    url?: string | null;
    deliveredAt?: string | null;
    riderName?: string;
}) {
    const [zoomed, setZoomed] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);

    // Format single valid URL (without trial loops)
    const formattedUrl = React.useMemo(() => {
        if (!url) return null;
        const trimmed = url.trim();
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            try {
                const parsed = new URL(trimmed);
                if (typeof window !== 'undefined' && (parsed.hostname === window.location.hostname || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1')) {
                    return parsed.pathname;
                }
                return trimmed;
            } catch {
                return trimmed;
            }
        }
        const clean = trimmed.replace(/^\/?(public\/)?/, '');
        if (clean.startsWith('storage/')) {
            return `/${clean}`;
        }
        return `/storage/${clean}`;
    }, [url]);

    const showPhoto = Boolean(formattedUrl) && !hasError;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                        <Image className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">Proof of Delivery</p>
                        {deliveredAt && (
                            <p className="text-xs text-(--ops-text-muted)">{formatDate(deliveredAt)} at {formatTime(deliveredAt)}</p>
                        )}
                    </div>
                </div>

                {showPhoto && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setZoomed(true)}
                        className="h-7 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1 rounded-lg font-bold cursor-pointer"
                    >
                        <Maximize2 className="size-3" /> Full screen
                    </Button>
                )}
            </div>

            {/* In-place Photo Card — Clickable to open full-screen view */}
            {showPhoto ? (
                <div
                    onClick={() => setZoomed(true)}
                    className="w-full rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800/40 hover:border-emerald-400 transition-all shadow-sm hover:shadow-md group relative bg-(--ops-surface-sunken)/20 cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setZoomed(true); }}
                    aria-label="Click to view full screen proof of delivery photo"
                >
                    <img
                        src={formattedUrl!}
                        alt="Proof of delivery"
                        onError={() => setHasError(true)}
                        className="w-full object-cover max-h-56 group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                        <div className="opacity-0 group-hover:opacity-100 bg-black/75 backdrop-blur-xs rounded-xl px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg scale-95 group-hover:scale-100">
                            <Maximize2 className="size-3.5" /> Click for full screen
                        </div>
                    </div>
                </div>
            ) : (
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Image className="size-4 shrink-0 opacity-70" />
                        <span>Proof photo unavailable on server</span>
                    </div>
                    {Boolean(url) && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setHasError(false)}
                            className="h-7 px-2.5 text-xs gap-1 rounded-lg font-medium border-amber-300 dark:border-amber-700/50 hover:bg-amber-100/50 dark:hover:bg-amber-900/30"
                        >
                            <RefreshCw className="size-3" /> Retry
                        </Button>
                    )}
                </div>
            )}

            {riderName && (
                <p className="text-xs text-(--ops-text-muted) font-medium px-1">
                    📸 Captured by <span className="font-bold text-(--ops-text-primary)">{riderName}</span>
                </p>
            )}

            {/* Dedicated Full Screen Modal (No new tab redirection) */}
            <Dialog open={zoomed} onOpenChange={setZoomed}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border bg-background/95 backdrop-blur-md shadow-2xl">
                    <DialogHeader className="p-4 border-b bg-muted/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-base font-bold flex items-center gap-2">
                                    <Image className="size-4 text-emerald-600" />
                                    Proof of Delivery Photo
                                </DialogTitle>
                                <DialogDescription className="text-xs mt-0.5">
                                    {riderName ? `Captured by ${riderName}` : 'Delivery proof photo'}
                                    {deliveredAt ? ` • ${formatDate(deliveredAt)} at ${formatTime(deliveredAt)}` : ''}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    
                    <div className="p-4 bg-black/90 dark:bg-black flex items-center justify-center min-h-75 max-h-[80vh] overflow-auto">
                        {formattedUrl && !hasError ? (
                            <img 
                                src={formattedUrl} 
                                alt="Proof of delivery full screen" 
                                onError={() => setHasError(true)}
                                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-2xl select-none" 
                            />
                        ) : (
                            <div className="py-12 text-center text-xs text-amber-500 font-semibold">
                                Photo file is unavailable on server.
                            </div>
                        )}
                    </div>

                    <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-muted-foreground px-4">
                        <span className="font-medium">
                            {riderName ? `Rider: ${riderName}` : 'Proof verified'}
                        </span>
                        <Button 
                            type="button" 
                            size="sm" 
                            variant="secondary" 
                            onClick={() => setZoomed(false)}
                            className="h-8 px-4 font-bold rounded-lg"
                        >
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3 text-sm">
            <div className="size-8 rounded-lg bg-(--ops-surface-sunken)/40 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="size-4 text-(--ops-text-muted)" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">{label}</p>
                <div className="mt-0.5 text-(--ops-text-primary)">{children}</div>
            </div>
        </div>
    );
}

const DeliveryDetailSheet = React.memo(function DeliveryDetailSheet({
    delivery,
    open,
    onClose,
    onUpdateStatus,
    onAssignRider,
}: DeliveryDetailSheetProps) {
    if (!delivery) return null;

    const TypeIcon = delivery.delivery_type === 'internal' ? Bike : Truck;
    const typeColor = delivery.delivery_type === 'internal' ? 'text-primary' : 'text-emerald-600';

    const isUnassignedInternal = delivery.delivery_type === 'internal' && !delivery.rider_id;

    return (
        <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-0">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${delivery.status_color}`}>
                            {delivery.status_label}
                        </Badge>
                        <Badge variant="outline" className={`rounded-full text-[10px] font-bold gap-1 ${typeColor}`}>
                            <TypeIcon className="size-3" />
                            {delivery.delivery_type === 'internal' ? 'Internal' : 'External'}
                        </Badge>
                    </div>
                    <SheetTitle className="text-xl font-black tracking-tight">
                        {delivery.sale?.order_number || delivery.order?.order_number || (delivery.order ? `Order #${delivery.order.id}` : 'Order Detail')}
                    </SheetTitle>
                    <SheetDescription>
                        {delivery.created_at 
                            ? `Created on ${formatDate(delivery.created_at)} at ${formatTime(delivery.created_at)}`
                            : 'Delivery transaction details and tracking information.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="px-6 space-y-6">
                    {/* Cancellation Request Alert Banner */}
                    {((delivery.status === 'cancellation_requested' || delivery.order?.status === 'cancellation_requested') || delivery.cancellation_request || delivery.order?.cancellation_request) && (
                        <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-300 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="size-5 text-amber-600 animate-pulse" />
                                    <span className="font-extrabold text-xs uppercase tracking-wide">Cancellation Requested</span>
                                </div>
                                <Badge className="bg-amber-500 text-white font-black text-[10px]">PENDING DECISION</Badge>
                            </div>

                            <div className="text-xs space-y-1 bg-white/70 dark:bg-black/40 p-3 rounded-2xl border border-amber-500/20">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Rider:</span>
                                    <span className="font-bold text-foreground">
                                        {delivery.cancellation_request?.requested_by_rider?.name || delivery.order?.cancellation_request?.requested_by_rider?.name || delivery.rider?.name || 'Assigned Rider'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Reason:</span>
                                    <span className="font-bold text-amber-700 dark:text-amber-400">
                                        {delivery.cancellation_request?.reason || delivery.order?.cancellation_request?.reason || 'Rider requested cancellation'}
                                    </span>
                                </div>
                                {(delivery.cancellation_request?.notes || delivery.order?.cancellation_request?.notes) && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-medium">Notes:</span>
                                        <span className="font-medium text-foreground">
                                            {delivery.cancellation_request?.notes || delivery.order?.cancellation_request?.notes}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                        const reqId = delivery.cancellation_request?.id || delivery.order?.cancellation_request?.id;
                                        if (!reqId) return;
                                        try {
                                            const res = await fetch(`/api/v1/cancellation-requests/${reqId}/reject`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                                    'Accept': 'application/json',
                                                },
                                                body: JSON.stringify({ rejection_reason: 'Rejected by cashier' })
                                            });
                                            const data = await res.json();
                                            if (res.ok && data.success) {
                                                onClose();
                                                router.reload();
                                            }
                                        } catch { /* rejected silently */ }
                                    }}
                                    className="flex-1 h-9 rounded-2xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200"
                                >
                                    REJECT
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        const reqId = delivery.cancellation_request?.id || delivery.order?.cancellation_request?.id;
                                        if (!reqId) return;
                                        try {
                                            const res = await fetch(`/api/v1/cancellation-requests/${reqId}/accept`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                                                    'Accept': 'application/json',
                                                },
                                            });
                                            const data = await res.json();
                                            if (res.ok && data.success) {
                                                onClose();
                                                router.reload();
                                            }
                                        } catch { /* accepted silently */ }
                                    }}
                                    className="flex-1 h-9 rounded-2xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    ACCEPT CANCELLATION
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Status Timeline */}
                    <StatusTimeline currentStatus={delivery.status} />

                    <Separator />

                    {/* Amount */}
                    <div className="bg-(--ops-surface-sunken)/60 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">Order Total</p>
                            <p className="text-2xl font-black text-primary tabular-nums">
                                {formatCurrency(delivery.sale?.total ?? delivery.order?.total_amount ?? 0)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-(--ops-text-muted) uppercase tracking-widest">Delivery Fee</p>
                            <p className="text-lg font-bold tabular-nums">{formatCurrency(delivery.delivery_fee)}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Customer Information</h4>

                        <InfoRow icon={User} label="Name">
                            <p className="font-bold">{delivery.customer_name}</p>
                        </InfoRow>

                        {delivery.customer_phone && (
                            <InfoRow icon={Phone} label="Phone">
                                <a
                                    href={`tel:${delivery.customer_phone}`}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    {delivery.customer_phone}
                                </a>
                            </InfoRow>
                        )}

                        <InfoRow icon={MapPin} label="Delivery Address">
                            <p className="font-medium leading-relaxed">{delivery.customer_address}</p>
                            {delivery.distance_km && (
                                <p className="text-xs text-(--ops-text-muted) mt-1">{delivery.distance_km}km from origin</p>
                            )}
                        </InfoRow>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Order Items</h4>
                            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-bold">
                                {((delivery.sale?.items || delivery.order?.items) || []).length} items
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {((delivery.sale?.items || delivery.order?.items) || []).map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-(--ops-surface-sunken)/20 p-2.5 rounded-xl border border-transparent hover:border-(--ops-border) transition-colors">
                                    <div className="size-10 rounded-lg bg-(--ops-page-bg) flex items-center justify-center shrink-0 border overflow-hidden">
                                        <ImageWithFallback 
                                            src={item.product?.image_url} 
                                            alt={item.product?.name || 'Product'} 
                                            className="w-full h-full object-cover" 
                                            fallbackIcon={<Package className="size-5 text-(--ops-text-muted)/40" />}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.product?.name || 'Product'}</p>
                                        <p className="text-xs text-(--ops-text-muted) font-medium">
                                            <span className="font-mono text-muted-foreground font-semibold">
                                                {formatCurrency(('unit_price' in item ? item.unit_price : item.price) || 0)}
                                            </span>
                                            <span className="mx-1">×</span>
                                            <span className="font-mono font-bold text-foreground">
                                                {formatCurrency(item.quantity * (('unit_price' in item ? item.unit_price : item.price) || 0))}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!delivery.sale?.items && !delivery.order?.items) && (
                                <p className="text-xs text-(--ops-text-muted) italic text-center py-4">No items listed for this order.</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Courier Info */}
                    <div className="space-y-4 pb-8">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-(--ops-text-muted)">Courier Details</h4>
                            {delivery.delivery_type === 'internal' && !delivery.is_cancelled && !delivery.is_delivered && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-7 rounded-lg text-[10px] font-black px-3 gap-1.5 transition-all",
                                        isUnassignedInternal 
                                            ? "bg-amber-500 text-white border-amber-600 hover:bg-amber-600 shadow-sm animate-bounce-subtle" 
                                            : "text-primary border-primary/20 hover:bg-primary/5"
                                    )}
                                    onClick={() => onAssignRider(delivery)}
                                >
                                    <Bike className="size-3" />
                                    {isUnassignedInternal ? 'ASSIGN RIDER' : 'REASSIGN'}
                                </Button>
                            )}
                        </div>

                        <InfoRow icon={TypeIcon} label={delivery.delivery_type === 'internal' ? 'Rider' : 'Service'}>
                            <div className="flex items-center justify-between group/courier">
                                <p className={cn("font-bold", isUnassignedInternal && "text-amber-600")}>
                                    {delivery.delivery_type === 'internal'
                                        ? (delivery.rider?.name || 'Unassigned')
                                        : (delivery.external_service?.toUpperCase() || 'External')}
                                </p>
                            </div>
                            {delivery.tracking_number && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-(--ops-surface-sunken)/60">
                                        {delivery.tracking_number}
                                    </Badge>
                                </div>
                            )}
                        </InfoRow>

                        <InfoRow icon={Building2} label="Origin Branch">
                            <p className="font-bold">{delivery.sale?.branch?.name || delivery.order?.branch?.name || 'Main Branch'}</p>
                        </InfoRow>

                        {delivery.external_notes && (
                            <InfoRow icon={FileText} label="Notes">
                                <p className="text-(--ops-text-muted)">{delivery.external_notes}</p>
                            </InfoRow>
                        )}

                        {/* Proof of Delivery — shown when delivered */}
                        {(delivery.proof_of_delivery_url || delivery.proof_of_delivery) ? (
                            <ProofOfDeliveryViewer
                                url={delivery.proof_of_delivery_url}
                                deliveredAt={delivery.delivered_at}
                                riderName={delivery.rider?.name}
                            />
                        ) : delivery.is_delivered ? (
                            <InfoRow icon={Image} label="Proof of Delivery">
                                <p className="text-xs text-amber-600 font-semibold">No proof image uploaded.</p>
                            </InfoRow>
                        ) : null}

                        {delivery.is_cancelled && (
                            <div className="bg-rose-50 dark:bg-rose-950/20 rounded-2xl p-4 border border-rose-100 dark:border-rose-900/30">
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Cancellation Reason</p>
                                <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 italic">
                                    "{delivery.cancellation_reason || 'No reason provided'}"
                                </p>
                                <p className="text-[9px] text-rose-600/60 mt-2 font-bold uppercase">
                                    Cancelled by {delivery.cancelled_by_name || 'System'} • {delivery.cancelled_at}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <SheetFooter className="p-6 pt-6 border-t mt-6 grid grid-cols-2 gap-3">
                    {delivery.next_statuses.length > 0 && !delivery.is_cancelled && (
                        <Button
                            className="col-span-2 h-12 rounded-2xl font-black gap-2 shadow-lg shadow-primary/20"
                            onClick={() => onUpdateStatus(delivery.id)}
                        >
                            Mark as {delivery.next_statuses[0].replace(/_/g, ' ').toUpperCase()}
                            <ChevronRight className="size-4" />
                        </Button>
                    )}

                    <Button 
                        variant="outline" 
                        className="rounded-2xl gap-2 font-bold"
                        onClick={() => window.print()}
                    >
                        <FileText className="size-4" />
                        Waybill
                    </Button>

                    {!delivery.is_delivered && !delivery.is_cancelled && (
                        <CancelOrderDialog 
                            deliveryId={delivery.id} 
                            onSuccess={onClose}
                        />
                    )}

                    <Button variant="ghost" className="col-span-2 rounded-2xl gap-2 text-(--ops-text-muted) hover:text-rose-600 hover:bg-rose-50 text-xs font-bold">
                        <AlertCircle className="size-3.5" />
                        Report Issue
                    </Button>
                </SheetFooter>
            </SheetContent>

            {/* 🖨️ PRINT-ONLY WAYBILL SECTION */}
            <div className="hidden print:block fixed inset-0 bg-(--ops-surface-raised) z-9999 p-8 text-black font-sans">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .print-content, .print-content * { visibility: visible; }
                        .print-content { position: absolute; left: 0; top: 0; width: 100%; }
                        @page { size: auto; margin: 0mm; }
                    }
                ` }} />
                
                <div className="print-content max-w-100 mx-auto border-2 border-black p-6 space-y-6">
                    {/* Header */}
                    <div className="text-center border-b border-[var(--ops-border)]-2 border-black pb-4">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">MAKI DESU</h1>
                        <p className="text-[10px] font-bold uppercase">Official Delivery Waybill</p>
                    </div>

                    {/* Order Meta */}
                    <div className="flex justify-between items-end border-b border-[var(--ops-border)]-2 border-dashed border-black pb-4">
                        <div>
                            <p className="text-[8px] font-black uppercase text-gray-500">Tracking / Order ID</p>
                            <p className="text-xl font-black italic">
                                {delivery.sale?.order_number || delivery.order?.order_number || `#ORD-${delivery.id}`}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-gray-500">Date Issued</p>
                            <p className="text-xs font-bold">{formatDate(delivery.created_at)}</p>
                        </div>
                    </div>

                    {/* Shipping Address */}
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase bg-black text-white px-2 py-1 inline-block">SHIP TO:</p>
                        <p className="text-lg font-black leading-none pt-2">{delivery.customer_name}</p>
                        <p className="text-sm font-bold leading-tight">{delivery.customer_address}</p>
                        <p className="text-sm font-black border-t border-black mt-2 pt-1">📞 {delivery.customer_phone}</p>
                    </div>

                    {/* Courier Section */}
                    <div className="grid grid-cols-2 gap-4 border-2 border-black p-3">
                        <div>
                            <p className="text-[8px] font-black uppercase text-gray-500">Courier / Service</p>
                            <p className="text-xs font-bold uppercase">{delivery.delivery_type}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase text-gray-500">Payment Status</p>
                            <p className="text-xs font-black uppercase">PAID / ONLINE</p>
                        </div>
                    </div>

                    {/* Footer / Barcode Placeholder */}
                    <div className="text-center pt-4 space-y-2">
                        <div className="h-12 bg-black w-full flex items-center justify-center">
                           <span className="text-white font-mono text-xs tracking-[0.5em]">{delivery.sale?.order_number || delivery.order?.order_number || delivery.id}</span>
                        </div>
                        <p className="text-[8px] font-bold uppercase">Thank you for ordering at Maki Desu!</p>
                    </div>
                </div>
            </div>
        </Sheet>
    );
});

// Separate component for the Cancel Dialog - now using centered Dialog
function CancelOrderDialog({ deliveryId, onSuccess }: { deliveryId: number; onSuccess: () => void }) {
    const [open, setOpen] = React.useState(false);
    const [reason, setReason] = React.useState('Customer requested cancellation');
    const [processing, setProcessing] = React.useState(false);

    const handleCancel = () => {
        setProcessing(true);
        router.post(`/deliveries/${deliveryId}/cancel`, { reason }, {
            onSuccess: () => {
                setOpen(false);
                onSuccess();
            },
            onFinish: () => setProcessing(false)
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button 
                variant="outline" 
                onClick={() => setOpen(true)}
                className="rounded-2xl gap-2 font-bold text-rose-500 border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
                <AlertCircle className="size-4" />
                Cancel
            </Button>

            <DialogContent className="sm:max-w-106.25 rounded-4xl p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center mb-2">
                            <AlertCircle className="size-8 text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Cancel Delivery?</h2>
                        <p className="text-sm text-(--ops-text-muted) leading-relaxed">
                            This will permanently stop the delivery process. <br/>
                            This action is final and will be logged.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-(--ops-text-muted) ml-1">Reason for Cancellation</label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full mt-1.5 p-4 rounded-2xl border bg-(--ops-surface-sunken)/20 text-sm min-h-25 focus:ring-2 focus:ring-rose-500/20 transition-all outline-none resize-none"
                                placeholder="Why is this order being cancelled?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="h-12 rounded-2xl font-bold"
                                onClick={() => setOpen(false)}
                            >
                                BACK
                            </Button>
                            <Button
                                variant="destructive"
                                className="h-12 rounded-2xl font-black shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700"
                                disabled={processing}
                                onClick={handleCancel}
                            >
                                {processing ? '...' : 'CONFIRM'}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default DeliveryDetailSheet;
