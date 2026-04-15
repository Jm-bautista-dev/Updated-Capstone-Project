import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Category {
    id: number | string;
    name: string;
    slug: string;
    image: string | null;
}

interface CategoryBarProps {
    categories: Category[];
    activeCategory: string;
    onCategoryChange: (slug: string) => void;
    isLoading: boolean;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
    categories,
    activeCategory,
    onCategoryChange,
    isLoading
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll active category into view
    useEffect(() => {
        if (scrollRef.current) {
            const activeElement = scrollRef.current.querySelector('[data-active="true"]');
            if (activeElement) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center',
                });
            }
        }
    }, [activeCategory]);

    if (isLoading && categories.length === 0) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4 py-6 bg-background/80 backdrop-blur-md border-b">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-shrink-0 w-24 h-24 rounded-2xl bg-muted animate-pulse" />
                ))}
            </div>
        );
    }

    // Add "All" category at the beginning
    const allCategories: Category[] = [
        { id: 'all', name: 'All', slug: 'all', image: null },
        ...categories
    ];

    return (
        <div className="bg-background/95 backdrop-blur-md border-b">
            <div 
                ref={scrollRef}
                className="flex items-center gap-4 overflow-x-auto py-6 px-4 scrollbar-hide no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {allCategories.map((category) => {
                    const isActive = activeCategory === category.slug;
                    return (
                        <motion.button
                            key={category.id}
                            data-active={isActive}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onCategoryChange(category.slug)}
                            className={cn(
                                "flex-shrink-0 flex flex-col items-center gap-2 group",
                                "transition-all duration-300"
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center p-3 relative",
                                "shadow-sm border transition-all duration-300",
                                isActive 
                                    ? "bg-primary border-primary shadow-lg shadow-primary/30 ring-4 ring-primary/10" 
                                    : "bg-card border-border hover:border-primary/50"
                            )}>
                                {category.slug === 'all' ? (
                                    <svg 
                                        className={cn("w-8 h-8", isActive ? "text-primary-foreground" : "text-muted-foreground")} 
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                ) : (
                                    category.image ? (
                                        <img 
                                            src={category.image} 
                                            alt={category.name} 
                                            className="w-full h-full object-contain filter group-hover:drop-shadow-md"
                                        />
                                    ) : (
                                        <div className={cn("w-full h-full rounded-md", isActive ? "bg-primary-foreground/20" : "bg-muted")} />
                                    )
                                )}
                                
                                {isActive && (
                                    <motion.div 
                                        layoutId="glow"
                                        className="absolute inset-0 rounded-2xl bg-primary/20 blur-lg -z-10"
                                    />
                                )}
                            </div>
                            <span className={cn(
                                "text-[12px] font-bold tracking-tight transition-colors truncate w-20 text-center",
                                isActive ? "text-primary ml-0" : "text-muted-foreground group-hover:text-foreground"
                            )}>
                                {category.name}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
