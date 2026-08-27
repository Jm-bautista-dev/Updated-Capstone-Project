import { Head } from '@inertiajs/react';
import { GitCommit } from 'lucide-react';
import React from 'react';
import SuperAdminLayout from '@/layouts/SuperAdminLayout';

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
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <GitCommit className="size-6 text-rose-600 dark:text-rose-500" />
                        Deployment & Release Metadata
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Infrastructure environment parameters, Git release hashes, and production build timestamps
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-6 shadow-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Release Version</span>
                            <p className="text-xl font-black text-slate-900 dark:text-white font-mono">{deployment.appVersion}</p>
                            <p className="text-slate-500 dark:text-slate-400">
                                Environment:{' '}
                                <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">{deployment.environment}</span>
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Git Commit Release</span>
                            <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">#{deployment.gitCommitHash}</p>
                            <p className="text-slate-500 dark:text-slate-400">
                                Branch: <span className="text-slate-900 dark:text-slate-200 font-mono font-bold">{deployment.gitBranch}</span>
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3 font-mono text-xs">
                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-500">Deployment Server:</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold">{deployment.deploymentServer}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-500">Framework Runtime:</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold">
                                Laravel v{deployment.laravelVersion} (PHP {deployment.phpVersion})
                            </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
                            <span className="text-slate-500">Vite Build Timestamp:</span>
                            <span className="text-slate-900 dark:text-slate-200 font-bold">{deployment.buildTimestamp}</span>
                        </div>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
