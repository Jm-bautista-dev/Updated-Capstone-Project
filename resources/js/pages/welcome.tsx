import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShield } from 'react-icons/fi';

export default function Welcome() {
    const { auth } = usePage().props as any;

    return (
        <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-['Outfit'] antialiased flex flex-col selection:bg-rose-100 selection:text-rose-900 transition-colors duration-300">
            <Head title="Operations Gateway | Maki Desu" />
            
            {/* Sakura Background Glow (Matching System Design) */}
            <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-500/[0.03] dark:bg-rose-500/[0.08] blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-5%] left-[-10%] w-[500px] h-[500px] bg-rose-500/[0.02] dark:bg-rose-500/[0.06] blur-[100px] rounded-full pointer-events-none" />

            {/* Top Bar (Internal System Header) */}
            <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <span className="font-black text-lg tracking-tight uppercase italic text-gray-900 dark:text-white flex items-center gap-2">
                             Maki <span className="text-rose-600 dark:text-rose-500">Desu</span>
                        </span>
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 hidden sm:block">Operations Platform</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 font-bold">System Online</span>
                        </div>
                        {auth.user && (
                            <div className="flex items-center gap-3 pl-6 border-l border-gray-200 dark:border-gray-800">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Authenticated:</span>
                                <span className="text-[11px] font-bold text-gray-900 dark:text-gray-100">{auth.user.name}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl mx-auto px-6 w-full flex flex-col items-center justify-center py-20 relative z-10">
                
                {/* Hero Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center w-full max-w-2xl mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm mb-8 transition-colors">
                        <FiShield className="size-3 text-rose-600 dark:text-rose-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">Authorized Personnel Access Only</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight italic uppercase mb-4 leading-tight">
                        Maki Desu Operations Platform
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-[0.2em] mb-12">
                        Internal POS • Inventory • Recipe Costing • Analytics System
                    </p>

                    <div className="flex justify-center flex-col sm:flex-row items-center gap-4">
                        {auth.user ? (
                            <Link 
                                href="/dashboard" 
                                className="h-14 px-12 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-600 dark:hover:bg-rose-500 transition-all duration-300 flex items-center gap-3 shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Enter Dashboard 
                                <FiArrowRight className="size-4" />
                            </Link>
                        ) : (
                            <Link 
                                href="/login" 
                                className="h-14 px-12 bg-rose-600 dark:bg-rose-500 text-white dark:text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-700 dark:hover:bg-rose-600 transition-all duration-300 flex items-center gap-3 shadow-lg shadow-rose-100 dark:shadow-none"
                            >
                                Staff Login / Verify Identity
                                <FiArrowRight className="size-4" />
                            </Link>
                        )}
                    </div>
                </motion.div>
            </main>

            {/* System Footer (Control Info) */}
            <footer className="w-full border-t border-gray-200 dark:border-gray-800 py-10 bg-white/30 dark:bg-gray-900/30 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-sm">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Environment</span>
                            <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100">Production Build v4.2</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Security Level</span>
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-500 italic">RESTRICTED ACCESS</span>
                        </div>
                    </div>
                    
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                             Authorized Personnel Only • IP Logged
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
