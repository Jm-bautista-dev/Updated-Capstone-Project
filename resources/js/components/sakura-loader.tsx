import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export const SakuraLoader = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const start = () => {
            setShouldRender(true);
            setTimeout(() => setIsVisible(true), 10);
        };

        const end = () => {
            setIsVisible(false);
            timeout = setTimeout(() => setShouldRender(false), 500);
        };

        const unbindStart = router.on('start', start);
        const unbindFinish = router.on('finish', end);

        return () => {
            unbindStart();
            unbindFinish();
            clearTimeout(timeout);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div 
            className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            <div className="relative size-48">
                {/* Swirling Petals Container */}
                <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
                    {[...Array(12)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute left-1/2 top-1/2 size-6 rounded-[150%_0_150%_0] bg-[#FADADD] opacity-80"
                            style={{
                                transform: `rotate(${i * 30}deg) translate(60px, 0) rotate(${i * 45}deg)`,
                                animation: `swirl-${i % 3} 4s ease-in-out infinite alternate`,
                                animationDelay: `${i * 0.2}s`,
                                filter: 'blur(0.5px)',
                                boxShadow: '0 0 10px rgba(231, 84, 128, 0.2)',
                            }}
                        />
                    ))}
                </div>
                
                {/* Center Accent Petal */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="size-10 animate-pulse rounded-[150%_0_150%_0] bg-[#E75480] shadow-[0_0_20px_rgba(231, 84, 128, 0.4)]" />
                </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-2">
                <span className="text-lg font-medium tracking-widest text-[#E75480] uppercase">
                    Maki Desu
                </span>
                <span className="text-xs font-light tracking-[0.3em] text-[#8B7E7E] uppercase animate-pulse">
                    Preparing your experience
                </span>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes swirl-0 {
                    0% { transform: rotate(0deg) translate(60px, 0) scale(1); }
                    100% { transform: rotate(180deg) translate(40px, 20px) scale(0.8); }
                }
                @keyframes swirl-1 {
                    0% { transform: rotate(120deg) translate(55px, -10px) scale(0.9); }
                    100% { transform: rotate(300deg) translate(65px, 10px) scale(1.1); }
                }
                @keyframes swirl-2 {
                    0% { transform: rotate(240deg) translate(50px, 10px) scale(1.1); }
                    100% { transform: rotate(60deg) translate(70px, -20px) scale(0.7); }
                }
            `}} />
        </div>
    );
};
