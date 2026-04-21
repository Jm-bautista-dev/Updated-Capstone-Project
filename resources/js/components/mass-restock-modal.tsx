import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FiRefreshCw, FiAlertTriangle, FiCheck, FiInfo } from 'react-icons/fi';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface InventoryRow {
  id: number;
  name: string;
  unit: string;
  stock: number;
  low_stock_level: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  branch_id: number;
  display_unit?: string;
  display_stock?: number;
}

interface MassRestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  branchId: number;
  inventory: InventoryRow[];
}

export function MassRestockModal({ open, onOpenChange, branchName, branchId, inventory }: MassRestockModalProps) {
  // Filter only items that are low or out of stock for this branch
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => 
      item.branch_id === branchId && (item.is_low_stock || item.is_out_of_stock)
    );
  }, [inventory, branchId, open]);

  const { data, setData, post, processing, reset, errors } = useForm({
    branch_id: branchId,
    items: [] as { id: number, type: string, quantity: string, unit: string }[]
  });

  // Initialize form data when modal opens or branch changes
  useEffect(() => {
    if (open) {
      setData('items', lowStockItems.map(item => ({
        id: item.id,
        type: 'ingredient',
        quantity: '',
        unit: item.unit
      })));
    }
  }, [open, lowStockItems]);

  const handleQuantityChange = (id: number, value: string) => {
    const newItems = [...data.items];
    const index = newItems.findIndex(i => i.id === id);
    if (index > -1) {
      newItems[index].quantity = value;
      setData('items', newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out items with empty or zero quantity
    const itemsToSubmit = data.items.filter(item => Number(item.quantity) > 0);
    
    if (itemsToSubmit.length === 0) return;

    post('/inventory/mass-stock-in', {
      onSuccess: () => {
        onOpenChange(false);
        reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FiRefreshCw className={cn("size-5", processing && "animate-spin")} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                Mass Restock
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                Restocking critical items for <span className="text-primary">{branchName}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
            {lowStockItems.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <FiCheck className="size-8" />
                </div>
                <div>
                  <p className="text-lg font-black italic uppercase tracking-tighter text-foreground">All Set!</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase mt-1">All items in {branchName} are sufficiently stocked.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
                  <FiAlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-tight leading-relaxed">
                    Found <span className="font-black text-amber-600">{lowStockItems.length} items</span> that require immediate attention. Enter quantities below to restock in bulk.
                  </p>
                </div>

                <div className="divide-y divide-border/40">
                  {lowStockItems.map((item, idx) => {
                    const formItem = data.items.find(i => i.id === item.id);
                    return (
                      <motion.div 
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="py-4 flex items-center justify-between gap-6 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-black italic uppercase tracking-tighter text-foreground truncate group-hover:text-primary transition-colors">
                              {item.name}
                            </span>
                            {item.is_out_of_stock ? (
                              <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase tracking-tighter rounded-md h-4">Out</Badge>
                            ) : (
                              <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase tracking-tighter rounded-md h-4">Low</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase">
                            <span>Current: <span className={cn("tabular-nums", item.is_out_of_stock ? "text-rose-500" : "text-amber-600")}>{Number(item.display_stock ?? item.stock).toLocaleString()} {item.display_unit ?? item.unit}</span></span>
                            <span>•</span>
                            <span>Min: {item.low_stock_level} {item.unit}</span>
                          </div>
                        </div>

                        <div className="w-32 shrink-0">
                          <div className="relative">
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={formItem?.quantity || ''}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="h-10 pr-10 bg-muted/30 border-none ring-1 ring-border focus:ring-primary/40 font-black italic text-right tabular-nums rounded-xl text-xs"
                              min="0"
                              step="any"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black uppercase text-muted-foreground/40 pointer-events-none">
                              {item.display_unit ?? item.unit}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-8 pt-4 bg-muted/20 border-t border-border/40">
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest italic"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={processing || lowStockItems.length === 0 || !data.items.some(i => Number(i.quantity) > 0)}
              className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20 gap-2"
            >
              {processing ? (
                <FiRefreshCw className="size-3 animate-spin" />
              ) : (
                <FiRefreshCw className="size-3" />
              )}
              Confirm Restock
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
