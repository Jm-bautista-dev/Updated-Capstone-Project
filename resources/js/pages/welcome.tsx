import { Head, Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { FiArrowRight, FiShield } from 'react-icons/fi';

export default function Welcome() {
    const { auth } = usePage().props as any;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let petals: Petal[] = [];

        class Particle {
            x: number; y: number; size: number; speed: number; opacity: number;
            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.size = Math.random() * 2;
                this.speed = 0.2 + Math.random() * 0.3;
                this.opacity = 0.1 + Math.random() * 0.2;
            }
            update() {
                this.y -= this.speed;
                if (this.y < 0) this.y = canvas!.height;
            }
            draw() {
                ctx!.fillStyle = `rgba(231, 84, 128, ${this.opacity})`;
                ctx!.beginPath();
                ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx!.fill();
            }
        }

        class Petal {
            x: number; y: number; w: number; h: number; opacity: number; flip: number; xSpeed: number; ySpeed: number; flipSpeed: number;
            constructor() {
                this.x = Math.random() * canvas!.width;
                this.y = Math.random() * canvas!.height;
                this.w = 5 + Math.random() * 10;
                this.h = 10 + Math.random() * 5;
                this.opacity = 0.3 + Math.random() * 0.4;
                this.flip = Math.random();
                this.xSpeed = 0.2 + Math.random() * 0.5;
                this.ySpeed = 0.5 + Math.random() * 0.8;
                this.flipSpeed = 0.01 + Math.random() * 0.03;
            }
            update() {
                this.x += this.xSpeed;
                this.y += this.ySpeed;
                this.flip += this.flipSpeed;
                if (this.y > canvas!.height) this.y = -20;
                if (this.x > canvas!.width) this.x = -20;
            }
            draw() {
                ctx!.globalAlpha = this.opacity;
                ctx!.beginPath();
                ctx!.ellipse(this.x, this.y, this.w, this.h * Math.abs(Math.sin(this.flip)), Math.PI / 4, 0, 2 * Math.PI);
                ctx!.fillStyle = '#F8C8DC';
                ctx!.fill();
            }
        }

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = Array.from({ length: 30 }, () => new Particle());
            petals = Array.from({ length: 10 }, () => new Petal());
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            petals.forEach(p => { p.update(); p.draw(); });
            animationFrameId = requestAnimationFrame(render);
        };

        window.addEventListener('resize', resize);
        resize();
        render();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-white via-pink-50 to-white text-gray-900 font-['Outfit'] antialiased flex flex-col selection:bg-rose-100 transition-colors duration-300 relative overflow-hidden">
            <Head title="Welcome | Maki Desu Operations" />
            
            <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 will-change-transform" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/[0.03] blur-[120px] rounded-full pointer-events-none z-0" />

            <header className="w-full border-b border-primary/5 bg-white/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center text-sm">
                    <div className="flex items-center gap-6">
                        <span className="font-black text-lg tracking-tight uppercase italic flex items-center gap-2">
                             Maki <span className="text-primary">Desu</span>
                        </span>
                        <div className="h-4 w-px bg-primary/10 hidden sm:block" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/30 hidden sm:block">Operations platform</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 font-bold">System Online</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-6 w-full flex flex-col items-center justify-center py-20 relative z-10">
                {/* Torii Gate Hero Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="relative mb-12"
                >
                    <motion.svg 
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        width="240" height="180" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/10 transition-colors duration-500 hover:text-primary/20"
                    >
                        <path d="M20 40H220M40 60H200M70 60V160M170 60V160M10 20C40 30 200 30 230 20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                        <path d="M70 80H170" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                    </motion.svg>
                    <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150 -z-10" />
                </motion.div>

                {/* Hero Content */}
                <div className="text-center w-full max-w-2xl">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/10 shadow-sm mb-8">
                            <FiShield className="size-3 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/40">Authorized personnel gateway</span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter italic uppercase mb-6 leading-[0.9]">
                            Maki <span className="text-primary">Desu</span> <br/>
                            <span className="text-2xl md:text-3xl tracking-[0.2em] font-light text-gray-400 not-italic">Operations Platform</span>
                        </h1>
                        
                        <p className="text-xs text-primary/40 font-black uppercase tracking-[0.4em] mb-12 max-w-lg mx-auto leading-relaxed">
                            Internal shrine for POS, Inventory, and Enterprise Analytics. 
                        </p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                            className="flex justify-center flex-col sm:flex-row items-center gap-6"
                        >
                            {auth.user ? (
                                <Link 
                                    href="/dashboard" 
                                    className="h-16 px-16 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-primary transition-all duration-500 flex items-center gap-3 shadow-2xl shadow-gray-200 group"
                                >
                                    Enter Dashboard 
                                    <FiArrowRight className="size-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            ) : (
                                <Link 
                                    href="/login" 
                                    className="h-16 px-16 bg-primary text-white rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-gray-900 transition-all duration-500 flex items-center gap-3 shadow-2xl shadow-primary/20 group"
                                >
                                    Verify Identity
                                    <FiArrowRight className="size-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            <footer className="w-full border-t border-primary/5 py-12 bg-white/40">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="flex items-center gap-10">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">System state</span>
                            <span className="text-[11px] font-black text-gray-900 flex items-center gap-2 italic">
                                <span className="size-1.5 bg-emerald-500 rounded-full" />
                                Production Build 4.2
                            </span>
                        </div>
                        <div className="h-10 w-px bg-primary/10 hidden sm:block" />
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/30">Clearance level</span>
                            <span className="text-[11px] font-black text-primary italic uppercase tracking-widest underline decoration-2 underline-offset-4">Restricted</span>
                        </div>
                    </div>
                    
                    <div className="text-center md:text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/20">
                             Authorized personnel only • Secure terminal ID required
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
