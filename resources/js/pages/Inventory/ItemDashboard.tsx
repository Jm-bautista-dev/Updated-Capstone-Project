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
  FiBox 
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
      
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 bg-muted/10 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <FiPackage className="text-primary" />
               Stock Intelligence
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">Auto-converting weight and volume inventory management.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search materials..." 
                  className="pl-10 w-64 bg-background shadow-sm border-none ring-1 ring-black/5" 
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
                <Card className="overflow-hidden border-none shadow-xl ring-1 ring-black/5 hover:ring-primary/30 transition-all group">
                  <div className={cn(
                    "h-2 w-full",
                    item.type === 'solid' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                          "size-10 rounded-2xl flex items-center justify-center shadow-inner",
                          item.type === 'solid' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                        )}>
                           {item.type === 'solid' ? <FiBox className="size-5" /> : <FiDroplet className="size-5" />}
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black group-hover:text-primary transition-colors">{item.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-muted/50">
                            {item.type}
                          </Badge>
                        </div>
                    </div>
                    <FiActivity className="text-muted-foreground/30 size-5" />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {/* Units Display */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 rounded-2xl p-4 border border-black/5">
                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Storage Unit</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter">{item.quantity}</span>
                                <span className="text-xs font-bold text-muted-foreground">{item.unit}</span>
                            </div>
                        </div>
                        <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                            <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">POS Available</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tighter text-primary">
                                  {item.pos_quantity.toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-primary/70">{item.pos_unit}</span>
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
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex shadow-inner">
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
                  placeholder="e.g. Premium White Rice" 
                  value={data.name}
                  onChange={e => setData('name', e.target.value)}
                  className="h-12 border-none ring-1 ring-black/10 focus:ring-primary shadow-sm"
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
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
                    required
                    placeholder="0.00"
                    value={data.quantity}
                    onChange={e => setData('quantity', e.target.value)}
                    className="h-12 border-none ring-1 ring-black/10 focus:ring-primary shadow-sm"
                  />
                  {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
                </div>
             </div>

             <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={processing} className="px-8 font-bold">
                  {processing ? "Saving..." : "Add to Stock"}
                </Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
