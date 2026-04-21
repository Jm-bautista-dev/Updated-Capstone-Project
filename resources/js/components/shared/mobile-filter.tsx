import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { FiFilter, FiX, FiCheck } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MobileFilterProps {
    title?: string;
    description?: string;
    activeFilterCount?: number;
    activeFilterSummary?: string;
    onApply?: () => void;
    onClear?: () => void;
    children: React.Node;
    className?: string;
}

export function MobileFilter({
    title = "Filters",
    description,
    activeFilterCount,
    activeFilterSummary,
    onApply,
    onClear,
    children,
    className
}: MobileFilterProps) {
    return (
        <div className={cn("flex flex-col gap-2 w-full md:w-auto", className)}>
            {/* Desktop View: Show children directly */}
            <div className="hidden md:flex items-center gap-3">
                {children}
            </div>

            {/* Mobile View: Show Filter Button and Sheet */}
            <div className="flex md:hidden flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 flex-1 gap-2 font-black uppercase text-[10px] tracking-widest italic border-border/50 bg-card dark:bg-zinc-900 shadow-sm">
                                <FiFilter className="size-4 text-primary" />
                                {title}
                                {activeFilterCount && activeFilterCount > 0 ? (
                                    <Badge className="ml-1 h-5 min-w-[20px] px-1 flex items-center justify-center rounded-full bg-primary text-[10px] text-white border-none">
                                        {activeFilterCount}
                                    </Badge>
                                ) : null}
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[85vh] rounded-t-[2.5rem] p-0 border-none shadow-2xl focus:outline-none">
                            <div className="flex flex-col h-full bg-background dark:bg-zinc-950">
                                {/* Drag Handle */}
                                <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mt-4 mb-2 opacity-50 flex-shrink-0" />
                                
                                <SheetHeader className="px-6 py-4 border-b dark:border-zinc-800 flex-shrink-0">
                                    <div className="flex items-center justify-between">
                                        <SheetTitle className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-2">
                                            <FiFilter className="text-primary size-5" />
                                            {title}
                                        </SheetTitle>
                                        <SheetClose asChild>
                                            <Button variant="ghost" size="icon" className="rounded-full size-8">
                                                <FiX className="size-5" />
                                            </Button>
                                        </SheetClose>
                                    </div>
                                    {description && <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{description}</p>}
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 mobile-filters-container">
                                    {children}
                                </div>

                                <SheetFooter className="p-6 border-t dark:border-zinc-800 bg-muted/20 dark:bg-zinc-900/50 flex flex-row gap-3 sm:flex-row flex-shrink-0">
                                    {onClear && (
                                        <Button variant="outline" onClick={onClear} className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest italic border-border/50">
                                            Clear Filters
                                        </Button>
                                    )}
                                    <SheetClose asChild>
                                        <Button onClick={onApply} className="flex-[2] h-12 rounded-xl font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20 bg-primary text-white hover:bg-primary/90">
                                            <FiCheck className="mr-2 size-4" /> Apply Filters
                                        </Button>
                                    </SheetClose>
                                </SheetFooter>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
                
                {/* Active Filter Summary Bar */}
                {activeFilterSummary && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 overflow-hidden">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary shrink-0 italic">Active:</span>
                        <p className="text-[9px] font-bold text-primary/80 uppercase tracking-tight truncate italic">
                            {activeFilterSummary}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
