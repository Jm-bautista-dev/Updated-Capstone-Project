import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';
import { FiRefreshCw, FiAlertTriangle, FiInfo, FiCheckCircle, FiPackage, FiSlash } from 'react-icons/fi';
import { ResultModal } from '@/components/result-modal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { getCompatibleUnits } from '@/lib/unit-converter';
import { cn } from '@/lib/utils';

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
  cost_per_base_unit?: number;
}

interface MassRestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName: string;
  branchId: number;
  inventory: InventoryRow[];
  initialQuantities?: Record<number, { quantity: string, unit: string, purchase_price?: string }>;
}

export function MassRestockModal({ open, onOpenChange, branchName, branchId, inventory, initialQuantities }: MassRestockModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Get all items for this branch - Using loose equality for safety with ID types
  const branchItems = useMemo(() => {
    return (inventory || []).filter(item => Number(item.branch_id) === Number(branchId));
  }, [inventory, branchId]);

  // Apply visual filtering for the display
  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'low':
        return branchItems.filter(item => item.is_low_stock || item.is_out_of_stock);
      case 'out':
        return branchItems.filter(item => item.is_out_of_stock);
      default:
        return branchItems;
    }
  }, [branchItems, filter]);

  const { data, setData, post, processing, reset, errors, transform } = useForm({
    branch_id: branchId,
    items: [] as { id: number, type: string, quantity: string, unit: string, purchase_price: string }[]
  });

  // Initialize form data with ALL branch items when modal opens
  useEffect(() => {
    if (open) {
      setData({
        branch_id: branchId,
        items: branchItems.map(item => {
          const prefilled = initialQuantities?.[item.id];
          return {
            id: item.id,
            type: 'ingredient',
            quantity: prefilled?.quantity || '',
            unit: prefilled?.unit || item.unit,
            purchase_price: prefilled?.purchase_price || (item.cost_per_base_unit ? String(item.cost_per_base_unit) : '')
          };
        })
      });
    }
  }, [open, branchId, branchItems, initialQuantities, setData]);

  const handlePriceChange = (id: number, value: string) => {
    const newItems = [...data.items];
    const index = newItems.findIndex(i => i.id === id);
    if (index > -1) {
      newItems[index].purchase_price = value;
      setData('items', newItems);
    }
  };

  const handleQuantityChange = (id: number, value: string) => {
    const newItems = [...data.items];
    const index = newItems.findIndex(i => i.id === id);
    if (index > -1) {
      newItems[index].quantity = value;
      setData('items', newItems);
    }
  };

  const handleUnitChange = (id: number, value: string) => {
    const newItems = [...data.items];
    const index = newItems.findIndex(i => i.id === id);
    if (index > -1) {
      newItems[index].unit = value;
      setData('items', newItems);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we have anything to submit (at least one item with qty > 0)
    const hasItems = data.items.some(item => Number(item.quantity) > 0);
    if (!hasItems) return;

    transform((data) => ({
      ...data,
      items: data.items.filter(item => Number(item.quantity) > 0)
    }));

    post('/inventory/mass-stock-in', {
      onSuccess: () => {
        setShowSuccess(true);
        reset();
      },
      onError: (errors) => {
        console.error("Restock failed:", errors);
      },
      preserveState: true
    });
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    onOpenChange(false);
  };

  const typedErrors = errors as Record<string, string>;

  return (
    <>
      <ResultModal 
        open={showSuccess}
        onClose={handleCloseSuccess}
        type="success"
        title="Restock Successful"
        message={`Bulk restock for ${branchName} has been processed and logged.`}
      />

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (isOpen) {
          setShowSuccess(false);
          setFilter('all');
        }
        onOpenChange(isOpen);
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive" className="mb-4 bg-rose-500/10 border-rose-500/20 text-rose-600 rounded-2xl">
                <FiAlertTriangle className="size-4" />
                <AlertDescription className="text-[10px] font-black uppercase tracking-tight ml-2">
                  {typedErrors.error || "Validation failed. Please check quantities."}
                  {Object.entries(errors).map(([key, val]) => (
                    key !== 'error' && <div key={key} className="mt-1 font-bold lowercase first-letter:uppercase text-[8px]">{val}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <FiRefreshCw className={cn("size-5", processing && "animate-spin")} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
                    Mass Restock
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Bulk restocking for <span className="text-primary">{branchName}</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl ring-1 ring-border/50">
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilter('all')}
                  className={cn(
                    "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                    filter === 'all' ? "bg-background text-primary shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All Items
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilter('low')}
                  className={cn(
                    "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                    filter === 'low' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-muted-foreground hover:text-amber-500"
                  )}
                >
                  Low Stock
                </Button>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => setFilter('out')}
                  className={cn(
                    "h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-tighter transition-all",
                    filter === 'out' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-rose-500"
                  )}
                >
                  Out of Stock
                </Button>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
              {branchItems.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="size-16 rounded-full bg-muted/30 text-muted-foreground/40 flex items-center justify-center mx-auto border-2 border-dashed border-border">
                    <FiPackage className="size-8" />
                  </div>
                  <div>
                    <p className="text-lg font-black italic uppercase tracking-tighter text-foreground">No Items Found</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase mt-1">
                      No ingredients found for this branch in the system.
                    </p>
                  </div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="size-16 rounded-full bg-muted/30 text-muted-foreground/40 flex items-center justify-center mx-auto border-2 border-dashed border-border">
                    <FiPackage className="size-8" />
                  </div>
                  <div>
                    <p className="text-lg font-black italic uppercase tracking-tighter text-foreground">Filter Empty</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase mt-1">
                      No ingredients currently match the <span className="text-primary">{filter}</span> stock filter.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className={cn(
                    "rounded-2xl p-4 flex gap-3 items-start border shadow-sm transition-all duration-300",
                    filter === 'all' ? "bg-blue-500/5 border-blue-500/20" : 
                    filter === 'low' ? "bg-amber-500/5 border-amber-500/20" : 
                    "bg-rose-500/5 border-rose-500/20"
                  )}>
                    <div className={cn(
                      "size-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      filter === 'all' ? "bg-blue-500/10 text-blue-500" : 
                      filter === 'low' ? "bg-amber-500/10 text-amber-500" : 
                      "bg-rose-500/10 text-rose-500"
                    )}>
                      {filter === 'all' ? <FiInfo className="size-4" /> : 
                       filter === 'low' ? <FiAlertTriangle className="size-4" /> : 
                       <FiSlash className="size-4" />}
                    </div>
                    <div>
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        filter === 'all' ? "text-blue-600" : 
                        filter === 'low' ? "text-amber-600" : 
                        "text-rose-600"
                      )}>
                        {filter === 'all' ? "Full Control Mode" : 
                         filter === 'low' ? "Low Stock Focus" : 
                         "Critical Stock Focus"}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-tight leading-relaxed mt-0.5">
                        Displaying <span className="font-black text-foreground">{filteredItems.length} items</span> based on your selection. Enter any quantity to restock.
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {filteredItems.map((item, idx) => {
                      const formItem = data.items.find(i => i.id === item.id);
                      const isCritical = item.is_low_stock || item.is_out_of_stock;
                      
                      return (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(idx * 0.03, 0.5) }}
                          className={cn(
                            "py-4 flex items-center justify-between gap-6 group transition-all rounded-xl px-2 -mx-2",
                            Number(formItem?.quantity) > 0 ? "bg-primary/5 ring-1 ring-primary/10" : "hover:bg-muted/30"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-sm font-black italic uppercase tracking-tighter transition-colors tabular-nums",
                                Number(formItem?.quantity) > 0 ? "text-primary" : "text-foreground group-hover:text-primary"
                              )}>
                                {item.name}
                              </span>
                              {item.is_out_of_stock && (
                                <Badge className="bg-rose-500 text-white border-none text-[8px] font-black uppercase tracking-tighter rounded-md h-4 px-1.5 shadow-sm">Out</Badge>
                              )}
                              {item.is_low_stock && !item.is_out_of_stock && (
                                <Badge className="bg-amber-500 text-white border-none text-[8px] font-black uppercase tracking-tighter rounded-md h-4 px-1.5 shadow-sm">Low</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tight">
                              <span className="flex items-center gap-1">
                                Current: 
                                <span className={cn(
                                  "font-black tabular-nums",
                                  item.is_out_of_stock ? "text-rose-500" : isCritical ? "text-amber-500" : "text-emerald-500"
                                )}>
                                  {Number(item.display_stock ?? item.stock).toLocaleString()} {item.display_unit ?? item.unit}
                                </span>
                              </span>
                              <span className="opacity-20">•</span>
                              <span>Target: <span className="text-foreground/40">{item.low_stock_level} {item.unit}</span></span>
                            </div>
                          </div>

                          <div className="w-80 shrink-0 flex items-center gap-2">
                            <div className="relative group/input flex-1">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={formItem?.quantity || ''}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                className={cn(
                                  "h-11 px-3 bg-muted/40 border-none ring-1 transition-all font-black italic text-right tabular-nums rounded-xl text-xs",
                                  Number(formItem?.quantity) > 0 ? "ring-primary/50 bg-primary/5 shadow-inner" : "ring-border/50 group-hover/input:ring-border"
                                )}
                                min="0"
                                step="any"
                              />
                            </div>
                            <div className="w-16 shrink-0">
                              <select
                                value={formItem?.unit || item.unit}
                                onChange={(e) => handleUnitChange(item.id, e.target.value)}
                                className={cn(
                                  "h-11 w-full bg-muted/40 border-none ring-1 transition-all font-black text-center uppercase rounded-xl text-xs cursor-pointer",
                                  Number(formItem?.quantity) > 0 ? "ring-primary/50 bg-primary/5 shadow-inner text-primary" : "ring-border/50 text-muted-foreground hover:ring-border"
                                )}
                              >
                                {getCompatibleUnits(item.unit).map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-24 shrink-0">
                              <Input
                                type="number"
                                placeholder="₱ Cost"
                                value={formItem?.purchase_price || ''}
                                onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                className={cn(
                                  "h-11 px-2 bg-muted/40 border-none ring-1 transition-all font-mono font-bold text-right tabular-nums rounded-xl text-xs text-emerald-600 dark:text-emerald-400",
                                  Number(formItem?.quantity) > 0 ? "ring-emerald-500/50 bg-emerald-500/5" : "ring-border/50"
                                )}
                                min="0"
                                step="any"
                              />
                            </div>
                            <div className="w-20 text-right font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                              {Number(formItem?.quantity) > 0 && Number(formItem?.purchase_price) > 0 ? (
                                `₱${(Number(formItem?.quantity ?? 0) * Number(formItem?.purchase_price ?? 0)).toFixed(2)}`
                              ) : (
                                '—'
                              )}
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
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 hidden sm:block">
                  {data.items.filter(i => Number(i.quantity) > 0).length > 0 && (
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic animate-in fade-in slide-in-from-left-2">
                      Ready to restock <span className="text-primary font-black">{data.items.filter(i => Number(i.quantity) > 0).length} items</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button 
                    type="button"
                    variant="ghost" 
                    onClick={() => onOpenChange(false)}
                    className="flex-1 sm:flex-none rounded-xl font-black uppercase text-[10px] tracking-widest italic"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={processing || branchItems.length === 0 || !data.items.some(i => Number(i.quantity) > 0)}
                    className="flex-1 sm:flex-none rounded-xl px-8 font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20 gap-2 h-11"
                  >
                    {processing ? (
                      <FiRefreshCw className="size-3 animate-spin" />
                    ) : (
                      <FiCheckCircle className="size-3" />
                    )}
                    Confirm Restock
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
