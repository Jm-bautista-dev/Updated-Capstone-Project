import { Head } from '@inertiajs/react';
import { Activity, Cpu, Database, HardDrive, RefreshCw, Server } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SystemStatusBadge } from '@/components/super-admin/SystemStatusBadge';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

interface StorageHealth {
    name: string;
    status: string;
    app_writable: boolean;
    logs_writable: boolean;
}

interface CacheHealth {
    name: string;
    status: string;
    driver: string;
    message: string;
}

interface DatabaseHealthData {
    name: string;
    connection: string;
    status: string;
    message: string;
    latency: number;
}

interface AppHealth {
    name: string;
    status: string;
    version: string;
    php_version: string;
    environment: string;
}

interface ExternalHealth {
    osrm_routing: { status: string; latency: number };
}

interface HealthData {
    database: DatabaseHealthData;
    application: AppHealth;
    storage: StorageHealth;
    cache: CacheHealth;
    external: ExternalHealth;
}

interface SystemHealthProps {
    initialHealth: HealthData;
}

export default function SystemHealth({ initialHealth }: SystemHealthProps) {
    const [health, setHealth] = useState<HealthData>(initialHealth);
    const [loading, setLoading] = useState(false);

    const refreshDiagnostics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/super-admin/system-health/check');
            const data = (await res.json()) as { success: boolean; health: HealthData };
            if (data.success) {
                setHealth(data.health);
            }
        } catch {
            /* handled gracefully */
        } finally {
            setLoading(false);
        }
    };

    return (
        <SuperAdminLayout>
            <Head title="Super Admin — System Health Diagnostics" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Activity className="size-6 text-rose-600 dark:text-rose-500" />
                        System Health & Subsystem Diagnostics
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Real-time latency, disk permissions, and connectivity telemetry across infrastructure components
                    </p>
                </div>

                <Button
                    onClick={() => void refreshDiagnostics()}
                    disabled={loading}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-lg shadow-rose-600/20 transition-all"
                >
                    <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Testing Subsystems...' : 'Refresh Health Diagnostics'}
                </Button>
            </div>

            {/* Subsystem Health Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Database Health Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                <Database className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{health.database.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Driver: {health.database.connection}</p>
                            </div>
                        </div>
                        <SystemStatusBadge status={health.database.status} />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{health.database.message}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Query Latency: {health.database.latency} ms</p>
                    </div>
                </div>

                {/* Application Runtime Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <Server className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{health.application.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Laravel v{health.application.version}</p>
                            </div>
                        </div>
                        <SystemStatusBadge status={health.application.status} />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">PHP Engine: {health.application.php_version}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Environment: {health.application.environment}</p>
                    </div>
                </div>

                {/* Disk & File Access Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <HardDrive className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{health.storage.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Disk Access & Write Permissions</p>
                            </div>
                        </div>
                        <SystemStatusBadge status={health.storage.status} />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">storage/app:</span>
                            <span className={health.storage.app_writable ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>
                                {health.storage.app_writable ? 'Writable' : 'Access Blocked'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">storage/logs:</span>
                            <span className={health.storage.logs_writable ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 font-bold'}>
                                {health.storage.logs_writable ? 'Writable' : 'Access Blocked'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cache Subsystem */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Cpu className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{health.cache.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Driver: {health.cache.driver}</p>
                            </div>
                        </div>
                        <SystemStatusBadge status={health.cache.status} />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                        <p className="text-slate-700 dark:text-slate-300 font-mono">{health.cache.message}</p>
                    </div>
                </div>

                {/* External OSRM Routing */}
                <div className="bg-white dark:bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Activity className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">OSRM Road Routing</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Distance Calculator API</p>
                            </div>
                        </div>
                        <SystemStatusBadge status={health.external.osrm_routing.status} />
                    </div>

                    <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
                        <p className="text-slate-700 dark:text-slate-300">
                            Service Latency: {health.external.osrm_routing.latency} ms
                        </p>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
