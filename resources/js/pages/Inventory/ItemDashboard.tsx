import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState } from 'react';
import { ResultModal } from '@/components/result-modal';
import { BreadcrumbItem } from '@/types';
import { 
  FiPackage, 
  FiActivity, 
  FiPlus, 
  FiSearch, 
  FiArrowRight,
  FiDroplet,
  FiBox,
  FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Inventory Dashboard', href: '/inventory-items' },
];

export default function ItemDashboard() {
  const { inventory } = usePage().props as any;
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { data, setData, post, processing, reset, errors } = useForm({
    name: '',
    type: 'solid',
    quantity: '',
  });

  const filteredInventory = inventory.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/inventory-items', {
      onSuccess: () => {
        setIsAddModalOpen(false);
        reset();
      }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Inventory - Weight & Volume" />
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-background dark:bg-zinc-950 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-foreground dark:text-white">
              <FiPackage className="text-primary dark:text-primary-foreground" />
               Stock Intelligence
            </h1>
            <p className="text-muted-foreground dark:text-zinc-400 mt-1 font-medium">Auto-converting weight and volume inventory management.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-zinc-500" />
                <Input 
                  placeholder="Search materials..." 
                  className="pl-10 w-64 bg-background dark:bg-zinc-900 shadow-sm border-none ring-1 ring-black/5 dark:ring-white/10 text-foreground dark:text-zinc-200" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <Button onClick={() => setIsAddModalOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
               <FiPlus /> New Record
             </Button>
          </div>
        </div>

        {/* Inventory Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredInventory.map((item: any) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-none shadow-xl ring-1 ring-black/5 dark:ring-white/5 hover:ring-primary/30 dark:hover:ring-primary/50 transition-all group bg-card dark:bg-zinc-900/50">
                  <div className={cn(
                    "h-2 w-full",
                    item.type === 'solid' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                          "size-10 rounded-2xl flex items-center justify-center shadow-inner",
                          item.type === 'solid' ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                        )}>
                           {item.type === 'solid' ? <FiBox className="size-5" /> : <FiDroplet className="size-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black group-hover:text-primary transition-colors truncate max-w-[150px] text-foreground dark:text-white" title={item.name}>{item.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50 dark:bg-zinc-800/50 text-muted-foreground dark:text-zinc-400">
                            {item.type}
                          </Badge>
                        </div>
                    </div>
                    <FiActivity className="text-muted-foreground/30 size-5" />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {/* Units Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 dark:bg-zinc-800/50 rounded-2xl p-4 border border-black/5 dark:border-white/5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground dark:text-zinc-500 tracking-widest mb-1">Storage Unit</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter text-foreground dark:text-zinc-100">{item.quantity}</span>
                                <span className="text-xs font-bold text-muted-foreground dark:text-zinc-500">{item.unit}</span>
                            </div>
                        </div>
                        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 border border-primary/10 dark:border-primary/20">
                            <p className="text-[10px] font-black uppercase text-primary dark:text-primary-foreground tracking-widest mb-1">POS Available</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter text-primary dark:text-primary-foreground">
                                  {item.pos_quantity.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-primary/70 dark:text-primary-foreground/70">{item.pos_unit}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar (Visual indicator of stock) */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span>Stock Health</span>
                        <span className={item.quantity > 5 ? "text-emerald-500" : "text-amber-500"}>
                          {item.quantity > 5 ? 'High' : 'Reorder Soon'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted dark:bg-zinc-800 rounded-full overflow-hidden flex shadow-inner">
                        <motion.div 
                          className={cn(
                            "h-full",
                            item.quantity > 5 ? "bg-emerald-500" : "bg-amber-500"
                          )}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, item.quantity * 10)}%` }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>

                    <Button variant="ghost" className="w-full text-xs font-bold gap-2 group/btn" asChild>
                       <a href="/pos/weight">
                         Process Deduction <FiArrowRight className="group-hover/btn:translate-x-1 transition-transform" />
                       </a>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredInventory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
             <FiPackage className="size-20 mb-4 stroke-1" />
             <p className="text-lg font-bold">No inventory items found.</p>
             <p className="text-sm">Start by adding a new material or ingredient.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Register Material</DialogTitle>
            <DialogDescription className="font-medium">
              Add a new bulk item to the inventory.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
             <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Item Name</label>
                <Input 
                  required
                  maxLength={50}
                  placeholder="e.g. Premium White Rice" 
                  value={data.name}
                  onChange={e => {
                    const cleaned = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    setData('name', cleaned);
                  }}
                  className={cn(
                    "h-12 border-none ring-1 shadow-sm transition-all",
                    errors.name ? "ring-destructive bg-destructive/5" : "ring-black/10 focus:ring-primary"
                  )}
                />
                {errors.name && <p className="text-[10px] text-destructive font-bold ml-1">{errors.name}</p>}
                {!errors.name && (
                  <p className="text-[10px] text-muted-foreground italic ml-1">
                    Letters and spaces only. Max 50 chars.
                  </p>
                )}
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Type</label>
                  <Select value={data.type} onValueChange={v => setData('type', v)}>
                    <SelectTrigger className="h-12 border-none ring-1 ring-black/10 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid (kg)</SelectItem>
                      <SelectItem value="liquid">Liquid (L)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Quantity ({data.type === 'solid' ? 'kg' : 'L'})
                  </label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10000"
                    required
                    placeholder="0.00"
                    value={data.quantity}
                    onChange={e => setData('quantity', e.target.value)}
                    className={cn(
                      "h-12 border-none ring-1 shadow-sm transition-all",
                      errors.quantity ? "ring-destructive bg-destructive/5" : "ring-black/10 focus:ring-primary"
                    )}
                  />
                  {errors.quantity && <p className="text-[10px] text-destructive font-bold ml-1">{errors.quantity}</p>}
                </div>
             </div>

             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); reset(); }}>Cancel</Button>
                <Button 
                    type="submit" 
                    disabled={processing || !data.name || !data.quantity || Number(data.quantity) <= 0 || Number(data.quantity) > 10000} 
                    className="px-8 font-bold gap-2"
                >
                  {processing && <FiRefreshCw className="animate-spin size-3" />}
                  {processing ? "Saving..." : "Add to Stock"}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
