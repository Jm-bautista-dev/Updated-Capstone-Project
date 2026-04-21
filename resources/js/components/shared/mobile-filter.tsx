import React from 'react';
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription,
    SheetFooter,
    SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FiFilter, FiX } from 'react-icons/fi';
import { cn } from '@/lib/utils';

interface MobileFilterProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    activeFilterCount?: number;
    activeFilterSummary?: string;
    onClear?: () => void;
    onApply?: () => void;
    className?: string;
}

export function MobileFilter({
    children,
    title = "Filters",
    description = "Refine your view with the options below.",
    activeFilterCount = 0,
    activeFilterSummary,
    onClear,
    onApply,
    className
}: MobileFilterProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <div className={cn("flex md:hidden items-center gap-2", className)}>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-10 px-3 gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all rounded-xl relative group"
                    >
                        <FiFilter className={cn("size-4 transition-colors", activeFilterCount > 0 ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">Filter</span>
                        {activeFilterCount > 0 && (
                            <Badge 
                                className="absolute -top-2 -right-2 size-5 flex items-center justify-center p-0 text-[10px] bg-primary text-white border-2 border-background animate-in zoom-in duration-300"
                            >
                                {activeFilterCount}
                            </Badge>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-[2.5rem] border-t-0 p-0 overflow-hidden bg-background dark:bg-zinc-950 flex flex-col max-h-[90vh]">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-muted/30 rounded-full" />
                    
                    <SheetHeader className="p-8 pb-4 text-left">
                        <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                            <FiFilter className="text-primary" />
                            {title}
                        </SheetTitle>
                        <SheetDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                            {description}
                        </SheetDescription>
                    </SheetHeader>

                    {activeFilterSummary && (
                        <div className="px-8 pb-4">
                            <div className="flex flex-wrap gap-2 items-center p-3 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                                <span className="text-[9px] font-black uppercase text-primary/70 tracking-widest">Active:</span>
                                <Badge variant="secondary" className="bg-background dark:bg-zinc-900 text-[10px] font-bold py-1 px-3 rounded-lg border-none shadow-sm">
                                    {activeFilterSummary}
                                </Badge>
                                {onClear && (
                                    <button 
                                        onClick={onClear}
                                        className="ml-auto text-primary hover:text-primary/70 p-1 transition-colors"
                                    >
                                        <FiX className="size-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
                        {children}
                    </div>

                    <SheetFooter className="p-8 pt-4 bg-muted/10 dark:bg-zinc-900/50 border-t dark:border-zinc-800 gap-3 mt-auto">
                        {onClear && (
                            <Button 
                                variant="ghost" 
                                onClick={() => {
                                    onClear();
                                    setOpen(false);
                                }}
                                className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest rounded-2xl"
                            >
                                Reset All
                            </Button>
                        )}
                        <Button 
                            onClick={() => {
                                if (onApply) onApply();
                                setOpen(false);
                            }}
                            className="flex-[2] h-14 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-lg shadow-primary/20"
                        >
                            Apply Filters
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
