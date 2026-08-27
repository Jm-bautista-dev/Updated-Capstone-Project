import { Head } from '@inertiajs/react';
import { RefreshCw, Wrench } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';

interface MaintenanceErrorPageProps {
    title?: string;
    message?: string;
    estimatedRestorationTime?: string;
    applicationVersion?: string;
}

export default function Maintenance({
    title = 'System Under Maintenance',
    message = 'We are performing scheduled maintenance to upgrade our infrastructure and operational systems. Please check back shortly.',
    estimatedRestorationTime = '30 minutes',
    applicationVersion = '2.5.0',
}: MaintenanceErrorPageProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
            <Head title={`503 Service Unavailable — ${title}`} />

            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
                {/* Logo / Icon Header */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full scale-125" />
                        <img
                            src="/images/maki-desu-logo.png"
                            alt="Maki Desu Logo"
                            className="w-16 h-16 object-contain relative z-10 drop-shadow-xl"
                        />
                    </div>
                    <div>
                        <span className="font-black text-xl tracking-tighter uppercase italic text-white leading-none">
                            Maki <span className="text-rose-500">Desu</span>
                        </span>
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-rose-400/80 mt-1">
                            Operational Infrastructure
                        </p>
                    </div>
                </div>

                {/* Maintenance Icon Badge */}
                <div className="size-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                    <Wrench className="size-8 animate-pulse" />
                </div>

                {/* Main Notice */}
                <div className="space-y-2">
                    <h1 className="text-xl font-black text-white tracking-tight">{title}</h1>
                    <p className="text-xs text-slate-300 leading-relaxed">{message}</p>
                </div>

                {/* Restoration Time Card */}
                {estimatedRestorationTime && (
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-amber-400">
                        <span>Estimated Restoration: {estimatedRestorationTime}</span>
                    </div>
                )}

                {/* Refresh Button */}
                <div className="pt-2 space-y-3">
                    <Button
                        onClick={() => window.location.reload()}
                        className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-rose-500/20 gap-2"
                    >
                        <RefreshCw className="size-4" />
                        Check Back / Refresh Page
                    </Button>
                    <p className="text-[10px] text-slate-500 font-mono">Status: HTTP 503 Service Unavailable • v{applicationVersion}</p>
                </div>
            </div>
        </div>
    );
}
