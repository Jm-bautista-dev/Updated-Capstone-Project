import { useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiInfo, 
  FiCheckCircle, 
  FiPackage, 
  FiSlash,
  FiCalendar,
  FiFileText,
  FiArrowRight,
  FiCheck,
  FiEdit3
} from 'react-icons/fi';
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

const getTodayManila = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export function MassRestockModal({ open, onOpenChange, branchName, branchId, inventory, initialQuantities }: MassRestockModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [submittedDate, setSubmittedDate] = useState<string>('');

  // Get all items for this branch
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
    received_at: getTodayManila(),
    reference: '',
    idempotency_token: '',
    items: [] as { id: number, type: string, quantity: string, unit: string, purchase_price: string }[]
  });

  // Initialize form data with ALL branch items when modal opens
  useEffect(() => {
    if (open) {
      setIsReviewMode(false);
      setShowSuccess(false);
      const today = getTodayManila();
      setData({
        branch_id: branchId,
        received_at: today,
        reference: '',
        idempotency_token: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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

  // Filter items with quantity > 0
  const activeItemsToRestock = useMemo(() => {
    return data.items.filter(item => Number(item.quantity) > 0);
  }, [data.items]);

  // Total estimated restock cost
  const totalCost = useMemo(() => {
    return activeItemsToRestock.reduce((acc, item) => {
      const q = Number(item.quantity) || 0;
      const p = Number(item.purchase_price) || 0;
      return acc + (q * p);
    }, 0);
  }, [activeItemsToRestock]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if we have anything to submit (at least one item with qty > 0) and a valid branch
    if (activeItemsToRestock.length === 0 || !branchId || Number(branchId) <= 0) return;

    setSubmittedDate(data.received_at);

    transform((formData) => ({
      ...formData,
      items: formData.items.filter(item => Number(item.quantity) > 0)
    }));

    post('/inventory/mass-stock-in', {
      onSuccess: () => {
        setShowSuccess(true);
        reset();
      },
      onError: (errs) => {
        console.error("Restock failed:", errs);
        setIsReviewMode(false);
      },
      preserveState: true
    });
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setIsReviewMode(false);
    onOpenChange(false);
  };

  const typedErrors = errors as Record<string, string>;

  return (
    <>
      <ResultModal 
        open={showSuccess}
        onClose={handleCloseSuccess}
        type="success"
        title="Mass Restock Successful"
        message={`Bulk restock for ${branchName} successfully recorded on ${formatDisplayDate(submittedDate || data.received_at)}. Traceable batch records and inventory history ledgers have been updated.`}
      />

      <Dialog open={open} onOpenChange={(isOpen) => {
        if (isOpen) {
          setShowSuccess(false);
          setIsReviewMode(false);
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
                  {typedErrors.error || typedErrors.received_at || "Validation failed. Please check quantities and restock date."}
                  {Object.entries(errors).map(([key, val]) => (
                    key !== 'error' && <div key={key} className="mt-1 font-bold lowercase first-letter:uppercase text-[8px]">{val}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FiRefreshCw className={cn("size-5", processing && "animate-spin")} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-foreground flex items-center gap-2">
                    Mass Restock
                    {isReviewMode && (
                      <Badge className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-wider h-5">
                        Review Summary
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Bulk restocking for <span className="text-primary">{branchName}</span>
                  </DialogDescription>
                </div>
              </div>

              {/* Restock Date & Reference Bar */}
              <div className="flex items-center flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-muted/40 dark:bg-white/5 border border-border/50 px-3 py-1.5 rounded-xl">
                  <FiCalendar className="size-3.5 text-primary shrink-0" />
                  <label htmlFor="mass-restock-received-at" className="text-[9px] font-black uppercase text-muted-foreground tracking-wider cursor-pointer">
                    Restock Date:
                  </label>
                  <input
                    id="mass-restock-received-at"
                    type="date"
                    max={getTodayManila()}
                    value={data.received_at}
                    onChange={(e) => setData('received_at', e.target.value)}
                    disabled={isReviewMode}
                    className="bg-transparent text-xs font-mono font-bold text-foreground focus:outline-none cursor-pointer disabled:opacity-75"
                    title="Authoritative Restock Date in Asia/Manila"
                  />
                </div>

                <div className="hidden sm:flex items-center gap-2 bg-muted/40 dark:bg-white/5 border border-border/50 px-3 py-1.5 rounded-xl">
                  <FiFileText className="size-3.5 text-muted-foreground shrink-0" />
                  <label htmlFor="mass-restock-reference" className="text-[9px] font-black uppercase text-muted-foreground tracking-wider cursor-pointer">
                    Ref:
                  </label>
                  <input
                    id="mass-restock-reference"
                    type="text"
                    placeholder="Auto-assigned"
                    value={data.reference}
                    onChange={(e) => setData('reference', e.target.value)}
                    disabled={isReviewMode}
                    className="bg-transparent text-xs font-mono font-medium text-foreground focus:outline-none w-28 placeholder:text-muted-foreground/40 disabled:opacity-75"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* Quick Filters (Shown only in edit mode) */}
            {!isReviewMode && (
              <div className="flex items-center justify-between pt-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Fill quantities for ingredients to restock
                </p>
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl ring-1 ring-border/50">
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFilter('all')}
                    className={cn(
                      "h-7 rounded-lg px-2.5 text-[9px] font-black uppercase tracking-tighter transition-all",
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
                      "h-7 rounded-lg px-2.5 text-[9px] font-black uppercase tracking-tighter transition-all",
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
                      "h-7 rounded-lg px-2.5 text-[9px] font-black uppercase tracking-tighter transition-all",
                      filter === 'out' ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" : "text-muted-foreground hover:text-rose-500"
                    )}
                  >
                    Out of Stock
                  </Button>
                </div>
              </div>
            )}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-8 py-4 no-scrollbar">
              {isReviewMode ? (
                /* REVIEW SUMMARY VIEW (Requirement 6) */
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="rounded-2xl p-5 bg-primary/5 border border-primary/20 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-primary/10">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
                          <FiCheckCircle className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-foreground">
                            Restock Confirmation Summary
                          </h4>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Review receiving date and quantities before persisting
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-primary/30 text-primary font-black text-[9px] uppercase px-2 py-0.5">
                        Authoritative Record
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-background/80 p-3 rounded-xl border border-border/40">
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block mb-1">
                          Destination Branch
                        </span>
                        <span className="font-black text-foreground">{branchName}</span>
                      </div>

                      <div className="bg-background/80 p-3 rounded-xl border border-border/40">
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider mb-1 flex items-center gap-1">
                          <FiCalendar className="size-3 text-primary" />
                          Restock Date (PH Time)
                        </span>
                        <span className="font-black text-primary font-mono">
                          {formatDisplayDate(data.received_at)}
                        </span>
                        <span className="block text-[8px] text-muted-foreground font-bold mt-0.5">Asia/Manila</span>
                      </div>

                      <div className="bg-background/80 p-3 rounded-xl border border-border/40">
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block mb-1">
                          Items to Restock
                        </span>
                        <span className="font-black text-foreground font-mono">
                          {activeItemsToRestock.length} items
                        </span>
                      </div>

                      <div className="bg-background/80 p-3 rounded-xl border border-border/40">
                        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-wider block mb-1">
                          Est. Total Cost
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          ₱{totalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-muted/40 rounded-xl text-[10px] text-muted-foreground flex items-center justify-between gap-2 border border-border/30">
                      <span>Operation Reference: <strong className="font-mono text-foreground">{data.reference || 'Auto-generated unified batch code'}</strong></span>
                      <span className="italic text-[9px]">Server-authoritative timestamping</span>
                    </div>
                  </div>

                  {/* Summary Items Table */}
                  <div className="rounded-2xl border border-border/40 overflow-hidden bg-background">
                    <div className="p-3 bg-muted/30 border-b border-border/40 text-[9px] font-black uppercase text-muted-foreground tracking-wider grid grid-cols-12 gap-2">
                      <span className="col-span-5">Ingredient</span>
                      <span className="col-span-3 text-right">Quantity to Add</span>
                      <span className="col-span-2 text-right">Unit Cost</span>
                      <span className="col-span-2 text-right">Subtotal</span>
                    </div>
                    <div className="divide-y divide-border/30 max-h-60 overflow-y-auto no-scrollbar">
                      {activeItemsToRestock.map((formItem) => {
                        const item = branchItems.find(i => i.id === formItem.id);
                        const subtotal = Number(formItem.quantity) * Number(formItem.purchase_price || 0);
                        return (
                          <div key={formItem.id} className="p-3 text-xs grid grid-cols-12 gap-2 items-center hover:bg-muted/10">
                            <div className="col-span-5 font-bold truncate">
                              <span className="text-foreground">{item?.name || `Item #${formItem.id}`}</span>
                              <span className="block text-[9px] text-muted-foreground font-medium">
                                Current: {Number(item?.display_stock ?? item?.stock ?? 0).toLocaleString()} {item?.display_unit ?? item?.unit}
                              </span>
                            </div>
                            <div className="col-span-3 text-right font-black font-mono text-primary">
                              +{formItem.quantity} {formItem.unit}
                            </div>
                            <div className="col-span-2 text-right font-mono text-muted-foreground">
                              {Number(formItem.purchase_price) > 0 ? `₱${Number(formItem.purchase_price).toFixed(2)}` : '—'}
                            </div>
                            <div className="col-span-2 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {subtotal > 0 ? `₱${subtotal.toFixed(2)}` : '—'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] leading-relaxed">
                    <strong>Note:</strong> Restock date reflects when ingredients were received into physical inventory. Perishable expiration dates and FEFO consumption priority remain independent from the restock receipt date.
                  </div>
                </div>
              ) : (
                /* EDITING / INPUT VIEW */
                <>
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
                </>
              )}
            </div>

            <DialogFooter className="p-8 pt-4 bg-muted/20 border-t border-border/40">
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 hidden sm:block">
                  {activeItemsToRestock.length > 0 && (
                    <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2">
                      <p className="text-[10px] font-black uppercase text-foreground tracking-wider italic">
                        Selected: <span className="text-primary font-black">{activeItemsToRestock.length} items</span>
                        {totalCost > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 ml-2">
                            (₱{totalCost.toFixed(2)})
                          </span>
                        )}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        Restock Date: <span className="text-foreground font-mono">{formatDisplayDate(data.received_at)}</span>
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!isReviewMode ? (
                    <>
                      <Button 
                        type="button"
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none rounded-xl font-black uppercase text-[10px] tracking-widest italic"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        disabled={branchItems.length === 0 || activeItemsToRestock.length === 0 || !branchId || Number(branchId) <= 0}
                        onClick={() => setIsReviewMode(true)}
                        className="flex-1 sm:flex-none rounded-xl px-7 font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-primary/20 gap-2 h-11"
                      >
                        <FiArrowRight className="size-3.5" />
                        Review Summary
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setIsReviewMode(false)}
                        className="flex-1 sm:flex-none rounded-xl font-black uppercase text-[10px] tracking-widest italic gap-1.5"
                      >
                        <FiEdit3 className="size-3" />
                        Modify Entries
                      </Button>
                      <Button 
                        type="submit"
                        disabled={processing || activeItemsToRestock.length === 0 || !branchId || Number(branchId) <= 0}
                        className="flex-1 sm:flex-none rounded-xl px-8 font-black uppercase text-[10px] tracking-widest italic shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11"
                      >
                        {processing ? (
                          <FiRefreshCw className="size-3 animate-spin" />
                        ) : (
                          <FiCheck className="size-3.5" />
                        )}
                        Confirm & Post Restock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
