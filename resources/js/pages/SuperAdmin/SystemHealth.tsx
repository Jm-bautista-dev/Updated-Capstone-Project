import { Head } from '@inertiajs/react';
import { Activity, Cpu, Database, HardDrive, RefreshCw, Server } from 'lucide-react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    const [health, setHealth] = React.useState<HealthData>(initialHealth);
    const [loading, setLoading] = React.useState(false);

    const refreshDiagnostics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/super-admin/system-health/check');
            const data = await res.json() as { success: boolean; health: HealthData };
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

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <Activity className="size-6 text-rose-500" />
                        System Health & Subsystem Diagnostics
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Real-time latency and connectivity tests for all backend services</p>
                </div>

                <Button
                    onClick={refreshDiagnostics}
                    disabled={loading}
                    className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs h-10 px-4 rounded-xl gap-2 shadow-lg shadow-rose-500/20"
                >
                    <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Testing...' : 'Refresh Diagnostics'}
                </Button>
            </div>

            {/* Health Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Database Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                                <Database className="size-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{health.database.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Driver: {health.database.connection}</p>
                            </div>
                        </div>
                        <Badge className={`text-[10px] font-black uppercase ${
                            health.database.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                            {health.database.status}
                        </Badge>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-xs text-slate-300 font-medium">{health.database.message}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Connection Latency: {health.database.latency}ms</p>
                    </div>
                </div>

                {/* Application Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                <Server className="size-5 text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{health.application.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Laravel v{health.application.version}</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
                            {health.application.status}
                        </Badge>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1">
                        <p className="text-xs text-slate-300 font-medium">PHP Engine: {health.application.php_version}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Env: {health.application.environment}</p>
                    </div>
                </div>

                {/* Storage Writable Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                <HardDrive className="size-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{health.storage.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Disk Access & Permissions</p>
                            </div>
                        </div>
                        <Badge className={`text-[10px] font-black uppercase ${
                            health.storage.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }`}>
                            {health.storage.status}
                        </Badge>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs space-y-1 font-mono">
                        <div className="flex justify-between">
                            <span className="text-slate-400">storage/app:</span>
                            <span className={health.storage.app_writable ? 'text-emerald-400' : 'text-rose-400'}>{health.storage.app_writable ? 'Writable' : 'Blocked'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-400">storage/logs:</span>
                            <span className={health.storage.logs_writable ? 'text-emerald-400' : 'text-rose-400'}>{health.storage.logs_writable ? 'Writable' : 'Blocked'}</span>
                        </div>
                    </div>
                </div>

                {/* Cache Subsystem */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                                <Cpu className="size-5 text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">{health.cache.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Driver: {health.cache.driver}</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
                            {health.cache.status}
                        </Badge>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs">
                        <p className="text-slate-300 font-mono">{health.cache.message}</p>
                    </div>
                </div>

                {/* External OSRM Routing */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Activity className="size-5 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-white">OSRM Road Routing</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Distance Calculator</p>
                            </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-black uppercase">
                            {health.external.osrm_routing.status}
                        </Badge>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs font-mono">
                        <p className="text-slate-300">Latency: {health.external.osrm_routing.latency}ms</p>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
