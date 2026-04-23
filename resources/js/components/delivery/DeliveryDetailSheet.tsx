import React from 'react';
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { router } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    User, MapPin, Clock, Building2, Bike, Truck,
    ExternalLink, Phone, ChevronRight, AlertCircle,
    Package, Navigation, CheckCircle2, FileText, Image
} from 'lucide-react';
import type { Delivery } from './types';
import { formatCurrency, formatTime, formatDate } from './types';

interface DeliveryDetailSheetProps {
    delivery: Delivery | null;
    open: boolean;
    onClose: () => void;
    onUpdateStatus: (id: number) => void;
}

// Status timeline
const STATUS_STEPS = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'out_for_delivery', label: 'In Transit', icon: Navigation },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);

    return (
        <div className="flex items-center gap-1 py-4">
            {STATUS_STEPS.map((step, i) => {
                const isCompleted = i < currentIndex;
                const isCurrent = i === currentIndex;
                const Icon = step.icon;

                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`
                                size-8 rounded-xl flex items-center justify-center transition-all
                                ${isCompleted ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30' : ''}
                                ${isCurrent ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110' : ''}
                                ${!isCompleted && !isCurrent ? 'bg-muted/50 text-muted-foreground' : ''}
                            `}>
                                <Icon className="size-3.5" />
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 rounded-full mx-1 mb-5 ${i < currentIndex ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-muted'}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="size-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">{label}</p>
                <div className="text-sm">{children}</div>
            </div>
        </div>
    );
}

const DeliveryDetailSheet = React.memo(function DeliveryDetailSheet({
    delivery,
    open,
    onClose,
    onUpdateStatus,
}: DeliveryDetailSheetProps) {
    if (!delivery) return null;

    const TypeIcon = delivery.delivery_type === 'internal' ? Bike : Truck;
    const typeColor = delivery.delivery_type === 'internal' ? 'text-primary' : 'text-emerald-600';

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
                        {delivery.sale?.order_number || (delivery.order ? `Order #${delivery.order.id}` : 'Order Detail')}
                    </SheetTitle>
                    <SheetDescription>
                        {delivery.created_at 
                            ? `Created on ${formatDate(delivery.created_at)} at ${formatTime(delivery.created_at)}`
                            : 'Delivery transaction details and tracking information.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="px-6 space-y-6">
                    {/* Status Timeline */}
                    <StatusTimeline currentStatus={delivery.status} />

                    <Separator />

                    {/* Amount */}
                    <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Order Total</p>
                            <p className="text-2xl font-black text-primary tabular-nums">
                                {formatCurrency(delivery.sale?.total ?? delivery.order?.total_amount ?? 0)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Delivery Fee</p>
                            <p className="text-lg font-bold tabular-nums">{formatCurrency(delivery.delivery_fee)}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Customer Information</h4>

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
                                <p className="text-xs text-muted-foreground mt-1">{delivery.distance_km}km from origin</p>
                            )}
                        </InfoRow>
                    </div>

                    <Separator />

                    {/* Order Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Items</h4>
                            <Badge variant="secondary" className="rounded-full px-2 py-0 text-[10px] font-bold">
                                {((delivery.sale?.items || delivery.order?.items) || []).length} items
                            </Badge>
                        </div>

                        <div className="space-y-2">
                            {((delivery.sale?.items || delivery.order?.items) || []).map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border border-transparent hover:border-border transition-colors">
                                    <div className="size-10 rounded-lg bg-background flex items-center justify-center shrink-0 border overflow-hidden">
                                        <Package className="size-5 text-muted-foreground/40" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold truncate">{item.product?.name || 'Product'}</p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {formatCurrency(item.unit_price ?? item.price ?? 0)} × {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black tabular-nums">
                                            {formatCurrency((item.unit_price ?? item.price ?? 0) * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {(!delivery.sale?.items && !delivery.order?.items) && (
                                <p className="text-xs text-muted-foreground italic text-center py-4">No items listed for this order.</p>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Courier Info */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Courier Details</h4>

                        <InfoRow icon={TypeIcon} label={delivery.delivery_type === 'internal' ? 'Rider' : 'Service'}>
                            <p className="font-bold">
                                {delivery.delivery_type === 'internal'
                                    ? (delivery.rider?.name || 'Unassigned')
                                    : (delivery.external_service?.toUpperCase() || 'External')}
                            </p>
                            {delivery.tracking_number && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/30">
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
                                <p className="text-muted-foreground">{delivery.external_notes}</p>
                            </InfoRow>
                        )}

                        {delivery.proof_of_delivery_url && (
                            <InfoRow icon={Image} label="Proof of Delivery">
                                <a
                                    href={delivery.proof_of_delivery_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
                                >
                                    View Proof <ExternalLink className="size-3" />
                                </a>
                            </InfoRow>
                        )}

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

                    <Button variant="ghost" className="col-span-2 rounded-2xl gap-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 text-xs font-bold">
                        <AlertCircle className="size-3.5" />
                        Report Issue
                    </Button>
                </SheetFooter>
            </SheetContent>

            {/* 🖨️ PRINT-ONLY WAYBILL SECTION */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8 text-black font-sans">
                <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .print-content, .print-content * { visibility: visible; }
                        .print-content { position: absolute; left: 0; top: 0; width: 100%; }
                        @page { size: auto; margin: 0mm; }
                    }
                ` }} />
                
                <div className="print-content max-w-[400px] mx-auto border-2 border-black p-6 space-y-6">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-4">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">MAKI DESU</h1>
                        <p className="text-[10px] font-bold uppercase">Official Delivery Waybill</p>
                    </div>

                    {/* Order Meta */}
                    <div className="flex justify-between items-end border-b-2 border-dashed border-black pb-4">
                        <div>
                            <p className="text-[8px] font-black uppercase text-gray-500">Tracking / Order ID</p>
                            <p className="text-xl font-black italic">
                                {delivery.sale?.order_number || `#ORD-${delivery.id}`}
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
                           <span className="text-white font-mono text-xs tracking-[0.5em]">{delivery.sale?.order_number || delivery.id}</span>
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

            <DialogContent className="sm:max-w-[425px] rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="p-8 space-y-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className="size-16 rounded-full bg-rose-50 flex items-center justify-center mb-2">
                            <AlertCircle className="size-8 text-rose-600" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Cancel Delivery?</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            This will permanently stop the delivery process. <br/>
                            This action is final and will be logged.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reason for Cancellation</label>
                            <textarea
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full mt-1.5 p-4 rounded-2xl border bg-muted/20 text-sm min-h-[100px] focus:ring-2 focus:ring-rose-500/20 transition-all outline-none resize-none"
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
