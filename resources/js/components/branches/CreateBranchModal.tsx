import { useForm } from '@inertiajs/react';
import { Building2, MapPin, Navigation, Plus, Store, X } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    open: boolean;
    onClose: () => void;
}

export function CreateBranchModal({ open, onClose }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        delivery_radius_km: '10',
        has_internal_riders: false,
        base_delivery_fee: '49',
        per_km_fee: '15',
    });

    const [clientError, setClientError] = useState<string | null>(null);

    const handleClose = () => {
        reset();
        clearErrors();
        setClientError(null);
        onClose();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setClientError(null);

        // Frontend defensive validation
        if (!data.name.trim()) {
            setClientError('Branch name is required.');
            return;
        }

        const radius = parseFloat(data.delivery_radius_km);
        if (data.delivery_radius_km === '' || isNaN(radius)) {
            setClientError('Delivery radius is required and must be a number.');
            return;
        }
        if (radius <= 0) {
            setClientError('Delivery radius must be greater than zero.');
            return;
        }

        const baseFee = parseFloat(data.base_delivery_fee);
        if (data.base_delivery_fee === '' || isNaN(baseFee)) {
            setClientError('Base delivery fee is required and must be a number.');
            return;
        }
        if (baseFee < 0) {
            setClientError('Base delivery fee cannot be negative.');
            return;
        }

        post('/branches', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Branch "${data.name}" created successfully.`);
                handleClose();
            },
            onError: (errs) => {
                const first = Object.values(errs)[0];
                if (first) setClientError(String(first));
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="max-w-xl w-[94vw] p-0 overflow-hidden bg-white dark:bg-[#121218] border border-[#F8C8DC]/60 dark:border-white/10 rounded-3xl font-['Outfit'] shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between bg-linear-to-r from-[#FFF5F7] via-white to-white dark:from-[#181820] dark:via-[#14141A] dark:to-[#121218]">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-linear-to-br from-[#E75480] to-[#D43B66] text-white flex items-center justify-center shadow-md shadow-[#E75480]/20">
                            <Store className="size-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-black uppercase tracking-tight text-[#3D2C2E] dark:text-white">
                                Register New Branch Hub
                            </DialogTitle>
                            <DialogDescription className="text-xs text-[#7D6B6E] dark:text-zinc-400">
                                Configure operational geofence, coordinates, and delivery fees.
                            </DialogDescription>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="size-8 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/5 flex items-center justify-center text-[#7D6B6E] dark:text-zinc-400 cursor-pointer"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Error Alerts */}
                    {(clientError || Object.keys(errors).length > 0) && (
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                            {clientError || Object.values(errors)[0]}
                        </div>
                    )}

                    {/* Branch Name */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                            Branch Name <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            placeholder="e.g. Maki Desu San Pablo"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="rounded-xl h-10 bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium"
                            required
                        />
                    </div>

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                Latitude
                            </Label>
                            <div className="relative">
                                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                                <Input
                                    placeholder="e.g. 14.0683"
                                    value={data.latitude}
                                    onChange={(e) => setData('latitude', e.target.value)}
                                    className="pl-8.5 rounded-xl h-9 font-mono text-xs bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                Longitude
                            </Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                                <Input
                                    placeholder="e.g. 121.3256"
                                    value={data.longitude}
                                    onChange={(e) => setData('longitude', e.target.value)}
                                    className="pl-8.5 rounded-xl h-9 font-mono text-xs bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Physical Address */}
                    <div className="space-y-1">
                        <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                            Physical Address
                        </Label>
                        <Textarea
                            placeholder="Complete street address or landmark..."
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            className="rounded-xl h-16 bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10 text-xs resize-none"
                        />
                    </div>

                    {/* Operational Delivery Parameters */}
                    <div className="pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 space-y-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                            Delivery Parameters
                        </h4>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                    <span>Radius (km)</span>
                                    <span className="text-rose-500 font-black">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    max="200"
                                    placeholder="10"
                                    value={data.delivery_radius_km}
                                    onChange={(e) => setData('delivery_radius_km', e.target.value)}
                                    className="rounded-xl h-9 font-mono text-xs bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                    <span>Base Fee (₱)</span>
                                    <span className="text-rose-500 font-black">*</span>
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="49"
                                    value={data.base_delivery_fee}
                                    onChange={(e) => setData('base_delivery_fee', e.target.value)}
                                    className="rounded-xl h-9 font-mono text-xs bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                    Per KM (₱)
                                </Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="15"
                                    value={data.per_km_fee}
                                    onChange={(e) => setData('per_km_fee', e.target.value)}
                                    className="rounded-xl h-9 font-mono text-xs bg-[#FFF5F7]/40 dark:bg-[#181820] border-[#F8C8DC]/60 dark:border-white/10"
                                />
                            </div>
                        </div>

                        {/* Internal Fleet Toggle */}
                        <button
                            type="button"
                            onClick={() => setData('has_internal_riders', !data.has_internal_riders)}
                            className="flex items-center gap-2.5 pt-1 text-xs font-bold text-[#3D2C2E] dark:text-zinc-200 cursor-pointer"
                        >
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${data.has_internal_riders ? 'bg-[#E75480] dark:bg-[#FF4F81]' : 'bg-black/20 dark:bg-white/20'}`}>
                                <div className={`absolute top-0.5 size-3 bg-white rounded-full transition-all ${data.has_internal_riders ? 'left-4.5' : 'left-0.5'}`} />
                            </div>
                            <span>Internal Dedicated Fleet Enabled</span>
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="rounded-xl h-10 px-4 text-xs font-bold border-[#F8C8DC]/60 dark:border-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl h-10 px-5 text-xs font-black uppercase tracking-wider bg-[#E75480] hover:bg-[#D43B66] text-white shadow-md shadow-[#E75480]/20 cursor-pointer"
                        >
                            {processing ? 'Registering...' : 'Create Branch'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
