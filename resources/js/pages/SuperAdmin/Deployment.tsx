import React from 'react';
import { Head } from '@inertiajs/react';
import { GitCommit, Server, Cpu, CheckCircle2, Code } from 'lucide-react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';
import { Badge } from '@/components/ui/badge';

interface DeploymentProps {
    deployment: {
        appName: string;
        appVersion: string;
        environment: string;
        laravelVersion: string;
        phpVersion: string;
        gitBranch: string;
        gitCommitHash: string;
        deploymentServer: string;
        nodeEnv: string;
        lastDeployedAt: string;
        buildTimestamp: string;
    };
}

export default function Deployment({ deployment }: DeploymentProps) {
    return (
        <SuperAdminLayout>
            <Head title="Super Admin — Deployment & Release Metadata" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                        <GitCommit className="size-6 text-rose-500" />
                        Deployment & Release Metadata
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Infrastructure environment parameters, Git commit release hashes, and build details
                    </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Release Version</span>
                            <p className="text-xl font-black text-white font-mono">{deployment.appVersion}</p>
                            <p className="text-slate-400">Environment: <span className="text-rose-400 font-mono font-bold">{deployment.environment}</span></p>
                        </div>

                        <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Git Commit Hash</span>
                            <p className="text-xl font-black text-amber-400 font-mono">#{deployment.gitCommitHash}</p>
                            <p className="text-slate-400">Branch: <span className="text-slate-200 font-mono font-bold">{deployment.gitBranch}</span></p>
                        </div>
                    </div>

                    <div className="border-t border-slate-800 pt-4 space-y-3 font-mono text-xs">
                        <div className="flex justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">Deployment Server:</span>
                            <span className="text-slate-200 font-bold">{deployment.deploymentServer}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">Framework Runtime:</span>
                            <span className="text-slate-200 font-bold">Laravel v{deployment.laravelVersion} (PHP {deployment.phpVersion})</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-800/60">
                            <span className="text-slate-400">Vite Build Timestamp:</span>
                            <span className="text-slate-200 font-bold">{deployment.buildTimestamp}</span>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
