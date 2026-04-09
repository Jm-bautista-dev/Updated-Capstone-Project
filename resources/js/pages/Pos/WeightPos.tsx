import { Head, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import React, { useState, useMemo } from 'react';
import { BreadcrumbItem } from '@/types';
import { 
  FiShoppingCart, 
  FiArrowDown, 
  FiZap,
  FiSearch,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'POS - Weight Sales', href: '/pos/weight' },
];

export default function WeightPos() {
  const { inventory } = usePage().props as any;
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [search, setSearch] = useState('');

  const { data, setData, post, processing, reset, errors } = useForm({
    item_id: '',
    quantity_sold: '',
    sale_price: '',
  });

  const filteredInventory = inventory.filter((item: any) => 
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const conversionDetails = useMemo(() => {
    if (!selectedItem || !data.quantity_sold) return null;
    const qty = parseFloat(data.quantity_sold);
    if (isNaN(qty)) return null;

    const deduction = (qty / 1000).toFixed(4);
    const unit = selectedItem.type === 'solid' ? 'kg' : 'L';
    const posUnit = selectedItem.type === 'solid' ? 'g' : 'ml';

    return {
      qty,
      posUnit,
      deduction,
      unit,
      isPossible: qty <= selectedItem.pos_quantity
    };
  }, [selectedItem, data.quantity_sold]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setData('item_id', item.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/pos/inventory-sale', {
        onSuccess: () => {
            reset();
            setSelectedItem(null);
        }
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="POS - Weight & Volume" />
      
      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
        
        {/* Left Side: Item Selection */}
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
             <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black tracking-tight">Select Material</h1>
                <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                        placeholder="Search items..." 
                        className="pl-10 w-64 bg-background shadow-sm border-none ring-1 ring-black/5" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
             </div>

             <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
                <AnimatePresence>
                    {filteredInventory.map((item: any) => (
                        <motion.button
                            key={item.id}
                            layout
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSelectItem(item)}
                            className={cn(
                                "flex flex-col text-left p-4 rounded-3xl transition-all duration-300 ring-1 ring-black/5 shadow-sm",
                                selectedItem?.id === item.id 
                                    ? "bg-primary text-white shadow-xl shadow-primary/30 ring-primary" 
                                    : "bg-background hover:bg-primary/5 hover:ring-primary/20"
                            )}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="font-black tracking-tight text-lg">{item.name}</span>
                                <Badge className={cn(
                                    "text-[10px] uppercase font-bold tracking-widest",
                                    selectedItem?.id === item.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {item.type}
                                </Badge>
                            </div>
                            <div className="mt-auto">
                                <p className={cn(
                                    "text-[10px] font-black uppercase tracking-widest opacity-60 mb-1",
                                    selectedItem?.id === item.id ? "text-white" : "text-muted-foreground"
                                )}>Available Pool</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black">{item.pos_quantity.toLocaleString()}</span>
                                    <span className="text-xs font-bold opacity-70">{item.pos_unit}</span>
                                </div>
                            </div>
                        </motion.button>
                    ))}
                </AnimatePresence>
             </div>
        </div>

        {/* Right Side: Order Panel */}
        <div className="w-[400px] bg-background border-l p-8 flex flex-col space-y-8">
            <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <FiShoppingCart className="size-5" />
                </div>
                <div>
                   <h2 className="text-xl font-black tracking-tight">Order Panel</h2>
                   <p className="text-xs font-medium text-muted-foreground">Process accurate deductions.</p>
                </div>
            </div>

            {selectedItem ? (
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8">
                    {/* Item Summary */}
                    <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 relative overflow-hidden group">
                        <FiZap className="absolute -right-4 -top-4 size-24 text-primary/5 group-hover:rotate-12 transition-transform duration-500" />
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Active Item</p>
                        <h3 className="text-2xl font-black text-primary tracking-tight">{selectedItem.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                           <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">{selectedItem.unit} Unit</Badge>
                           <span className="text-xs font-bold text-muted-foreground italic">
                            Stored in {selectedItem.unit === 'kg' ? 'bags/containers' : 'tanks'}
                           </span>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Order Quantity ({selectedItem.pos_unit})</label>
                            <Input 
                                type="number"
                                step="any"
                                autoFocus
                                required
                                value={data.quantity_sold}
                                onChange={e => setData('quantity_sold', e.target.value)}
                                className="h-14 text-2xl font-black border-none ring-2 ring-black/5 focus:ring-primary bg-muted/20"
                                placeholder={`0.00 ${selectedItem.pos_unit}`}
                            />
                            {errors.quantity_sold && <p className="text-xs text-destructive font-bold">{errors.quantity_sold}</p>}
                        </div>

                        {/* Automatic Conversion Preview */}
                        <AnimatePresence>
                            {conversionDetails && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={cn(
                                        "p-4 rounded-2xl border flex items-center gap-4",
                                        conversionDetails.isPossible ? "bg-emerald-50 border-emerald-100" : "bg-destructive/5 border-destructive/10"
                                    )}
                                >
                                    <div className={cn(
                                        "size-10 rounded-xl flex items-center justify-center shrink-0",
                                        conversionDetails.isPossible ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                                    )}>
                                        {conversionDetails.isPossible ? <FiCheckCircle /> : <FiAlertCircle />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-xs font-black uppercase tracking-widest", conversionDetails.isPossible ? "text-emerald-700" : "text-destructive")}>
                                            {conversionDetails.isPossible ? "Smart Conversion" : "Inventory Shortage"}
                                        </p>
                                        <p className="text-[11px] font-medium text-slate-600 truncate">
                                            {conversionDetails.qty}{conversionDetails.posUnit} order =
                                            <span className="font-black text-slate-900 mx-1 underline decoration-primary decoration-2 antialiased">
                                                {conversionDetails.deduction}{conversionDetails.unit}
                                            </span>
                                            stock deduction.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mt-auto space-y-4 pt-6 divide-y border-t border-dashed">
                        <div className="flex justify-between items-end pt-4">
                            <span className="text-sm font-bold text-muted-foreground italic">Conversion Factor</span>
                            <span className="text-sm font-black text-slate-900">1 {selectedItem.unit} : 1000 {selectedItem.pos_unit}</span>
                        </div>
                        <Button 
                            className="w-full h-16 rounded-3xl text-xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform active:scale-95"
                            disabled={processing || !conversionDetails?.isPossible}
                        >
                            {processing ? "Syncing Stock..." : "Complete Order"}
                        </Button>
                        <Button 
                            type="button"
                            variant="ghost" 
                            className="w-full h-12 rounded-2xl text-xs font-bold text-muted-foreground"
                            onClick={() => {
                                setSelectedItem(null);
                                reset();
                            }}
                        >
                            Cancel & Select Different
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40 italic">
                    <FiShoppingCart className="size-16 stroke-1" />
                    <p className="text-sm font-bold max-w-[200px]">Select an item from the left to begin the weight-based order process.</p>
                </div>
            )}
        </div>
      </div>
    </AppLayout>
  );
}
