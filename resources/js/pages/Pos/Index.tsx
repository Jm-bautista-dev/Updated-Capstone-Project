import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { ResultModal } from '@/components/result-modal';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiSearch, FiLayers, FiPackage } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from '@/components/ui/dialog';
import { FiCheckCircle, FiPrinter, FiPlusCircle } from 'react-icons/fi';
import { format } from 'date-fns';

type Category = {
 id: number;
 name: string;
 image_url: string | null;
};

type Product = {
 id: number;
 name: string;
 sku: string;
 category_id: number;
 selling_price: number;
 stock: number;
 image_url: string | null;
};

type CartItem = Product & { quantity: number };

export default function PosIndex() {
 const { products, categories, branch, availableRiders } = usePage().props as any;

 // --- Real-time Sync Logic (Now handled globally by useRealTime hook in AppLayout) ---
 useEffect(() => {
 // Refresh on window focus (Ensures data is fresh when switching back to this tab)
 const handleFocus = () => {
 router.reload({ only: ['products', 'categories'], preserveScroll: true, preserveState: true } as any);
 };

 window.addEventListener('focus', handleFocus);

 return () => window.removeEventListener('focus', handleFocus);
 }, []);


 const [search, setSearch] = useState('');
 const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
 const [cart, setCart] = useState<CartItem[]>([]);
 const [orderType, setOrderType] = useState('dine-in');
 const [paymentMethod, setPaymentMethod] = useState('cash');

 // Modal States
 const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
 const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
 const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
 const [alertModal, setAlertModal] = useState<{ type: 'error' | 'warning'; title: string; message: string }>({
 type: 'warning', title: '', message: '',
 });
 const [cashReceived, setCashReceived] = useState('');
 const [lastSale, setLastSale] = useState<any>(null);

 // --- Delivery State ---
 const [deliveryInfo, setDeliveryInfo] = useState({
 customer_name: '',
 customer_phone: '',
 customer_address: '',
 delivery_type: 'internal' as 'internal' | 'external',
 external_service: 'grab' as 'grab' | 'lalamove',
 rider_id: '' as string | number,
 tracking_number: '',
 distance_km: '' as string | number,
 delivery_fee: 0,
 delivery_notes: '',
 external_notes: '',
 });
 const [deliveryRecommendation, setDeliveryRecommendation] = useState<null | {
 type: 'internal' | 'external';
 reason: string;
 fee: number;
 available_riders: number;
 recommended_rider: { id: number; name: string; phone: string } | null;
 }>(null);
 const [recommendationLoading, setRecommendationLoading] = useState(false);
 const [proofFile, setProofFile] = useState<File | null>(null);
 const [proofPreview, setProofPreview] = useState<string | null>(null);

 const deliveryFee = useMemo(() => {
 if (orderType !== 'delivery') return 0;
 const distance = parseFloat(String(deliveryInfo.distance_km)) || 0;
 const base = parseFloat(branch?.base_delivery_fee) || 49;
 const perKm = parseFloat(branch?.per_km_fee) || 15;
 const freeKm = 2.0;

 if (distance === 0) return 0;
 if (distance <= freeKm) return base;
 return Math.round(base + (distance - freeKm) * perKm);
 }, [orderType, deliveryInfo.distance_km, branch]);

 useEffect(() => {
 setDeliveryInfo(prev => ({ ...prev, delivery_fee: deliveryFee }));
 }, [deliveryFee]);

 useEffect(() => {
 if (orderType !== 'delivery' || !branch) {
 setDeliveryRecommendation(null);
 return;
 }

 const distance = parseFloat(String(deliveryInfo.distance_km));
 if (Number.isNaN(distance) || distance <= 0) {
 setDeliveryRecommendation(null);
 return;
 }

 const timeout = window.setTimeout(async () => {
 setRecommendationLoading(true);
 try {
 const response = await fetch(`/deliveries/recommend?branch_id=${branch.id}&distance_km=${distance}`, {
 method: 'GET',
 credentials: 'same-origin',
 headers: {
 'Accept': 'application/json',
 },
 });

 if (response.ok) {
 const data = await response.json();
 setDeliveryRecommendation(data.recommendation);
 }
 } finally {
 setRecommendationLoading(false);
 }
 }, 300);

 return () => window.clearTimeout(timeout);
 }, [orderType, deliveryInfo.distance_km, branch]);

 const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0) + (orderType === 'delivery' ? deliveryFee : 0);

 const changeDue = useMemo(() => {
 const cash = parseFloat(cashReceived) || 0;
 return Math.max(0, cash - cartTotal);
 }, [cashReceived, cartTotal]);

 const filteredProducts = useMemo(() => {
 return products.filter((p: Product) => {
 const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
 const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
 return matchesSearch && matchesCategory;
 });
 }, [products, search, selectedCategory]);

 const addToCart = (product: Product) => {
 if (product.stock <= 0) return;
 setCart(prev => {
 const existing = prev.find(item => item.id === product.id);
 if (existing) {
 if (existing.quantity >= product.stock) return prev;
 return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
 }
 return [...prev, { ...product, quantity: 1 }];
 });
 };

 const updateQuantity = (id: number, delta: number) => {
 setCart(prev => prev.map(item => {
 if (item.id === id) {
 const newQty = Math.max(0, item.quantity + delta);
 const product = products.find((p: Product) => p.id === id);
 if (newQty > (product?.stock || 0)) return item;
 return { ...item, quantity: newQty };
 }
 return item;
 }).filter(item => item.quantity > 0));
 };

 const removeFromCart = (id: number) => {
 setCart(prev => prev.filter(item => item.id !== id));
 };


 const { processing } = useForm();

 const handleCheckout = () => {
 if (cart.length === 0) return;

 if (orderType === 'delivery') {
 if (!deliveryInfo.customer_name || !deliveryInfo.customer_address) {
 setAlertModal({ type: 'warning', title: 'Missing Info', message: 'Customer name and address are required for delivery.' });
 setIsAlertModalOpen(true);
 return;
 }
 if (!deliveryInfo.distance_km) {
 setAlertModal({ type: 'warning', title: 'Missing Distance', message: 'Please enter delivery distance to calculate fees.' });
 setIsAlertModalOpen(true);
 return;
 }
 if (deliveryInfo.delivery_type === 'internal' && !deliveryInfo.rider_id) {
 setAlertModal({ type: 'warning', title: 'No Rider', message: 'Please assign an internal rider.' });
 setIsAlertModalOpen(true);
 return;
 }
 if (deliveryInfo.delivery_type === 'external' && !deliveryInfo.tracking_number) {
 setAlertModal({ type: 'warning', title: 'No Tracking', message: 'Tracking number is required for external delivery.' });
 setIsAlertModalOpen(true);
 return;
 }
 }

 setIsPaymentModalOpen(true);
 };

 const confirmPayment = () => {
 const paid = paymentMethod === 'cash' ? parseFloat(cashReceived) : cartTotal;

 if (paymentMethod === 'cash' && paid < cartTotal) {
 setAlertModal({ type: 'warning', title: 'Insufficient Cash', message: `You need at least ${formatCurrency(cartTotal)} to complete this order.` });
 setIsAlertModalOpen(true);
 return;
 }

 const formData = new FormData();
 formData.append('type', orderType);
 formData.append('items', JSON.stringify(cart.map(item => ({ id: item.id, quantity: item.quantity }))));
 formData.append('total', String(cartTotal));
 formData.append('payment_method', paymentMethod);
 formData.append('paid_amount', String(paid));
 formData.append('change_amount', String(paymentMethod === 'cash' ? changeDue : 0));

 if (orderType === 'delivery') {
 cart.forEach((item, index) => {
 formData.append(`items[${index}][id]`, String(item.id));
 formData.append(`items[${index}][quantity]`, String(item.quantity));
 });

 Object.entries(deliveryInfo).forEach(([key, value]) => {
 if (value === null || value === undefined || value === '') {
 return;
 }

 formData.append(`delivery_info[${key}]`, String(value));
 });

 if (proofFile) {
 formData.append('delivery_info[proof_of_delivery]', proofFile);
 }
 } else {
 cart.forEach((item, index) => {
 formData.append(`items[${index}][id]`, String(item.id));
 formData.append(`items[${index}][quantity]`, String(item.quantity));
 });
 }

 router.post('/pos', formData, {
 forceFormData: true,
 onSuccess: (page) => {
 const sale = (page.props as any).recentOrders[0];
 setLastSale(sale);
 setCart([]);
 setCashReceived('');
 setProofFile(null);
 setProofPreview(null);
 setDeliveryInfo(prev => ({ ...prev, customer_name: '', customer_phone: '', customer_address: '', rider_id: '', tracking_number: '', distance_km: '', delivery_fee: 0, delivery_notes: '', external_notes: '' }));
 setIsPaymentModalOpen(false);
 setIsSuccessModalOpen(true);
 },
 onError: (err: any) => {
 setAlertModal({ type: 'error', title: 'Checkout Failed', message: err.error || 'Something went wrong. Please try again.' });
 setIsAlertModalOpen(true);
 }
 });
 };

 const handleNewOrder = () => {
 setIsSuccessModalOpen(false);
 setLastSale(null);
 };

 const formatCurrency = (amount: number) => {
 return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
 };

 return (
 <AppLayout breadcrumbs={[{ title: 'POS', href: '/pos' }]}>
 <Head title="Point of Sale" />

 <div className="flex flex-col lg:flex-row gap-3 p-3 h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground/90 font-sans relative selection:bg-primary/30">
 {/* Ambient Background Gradients */}
 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
 <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

 {/* FAR LEFT: Vertical Category Rail (Floating) */}
 <div className="hidden lg:flex w-16 xl:w-20 shrink-0 flex-col items-center py-4 gap-4 bg-card/70 border border-border/50 rounded-3xl backdrop-blur-2xl shadow-xl z-10">
 <motion.button
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => setSelectedCategory(null)}
 className={cn(
 "relative size-10 xl:size-12 rounded-2xl flex items-center justify-center transition-all duration-300",
  selectedCategory === null ?"bg-primary text-primary-foreground shadow-md shadow-primary/40" :"bg-card/50 text-muted-foreground hover:bg-accent hover:text-foreground/90"
 )}
 >
 <FiLayers className="size-4 xl:size-5" />
  <span className="absolute -bottom-5 text-[9px] font-bold tracking-widest uppercase opacity-80 hidden xl:block">All</span>
 </motion.button>

 <div className="w-8 h-[1px] bg-accent my-2" />

 <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-6 scrollbar-hide pb-6">
 {categories.map((c: Category) => (
 <motion.button
 key={c.id}
 whileHover={{ scale: 1.1 }}
 whileTap={{ scale: 0.9 }}
 onClick={() => setSelectedCategory(c.id)}
 className={cn(
 "relative size-10 xl:size-12 rounded-2xl flex items-center justify-center transition-all duration-300 border border-border group",
  selectedCategory === c.id ?"ring-2 ring-primary ring-offset-2 ring-offset-background" :"opacity-70 hover:opacity-100"
 )}
 >
 {c.image_url ? (
 <img src={c.image_url} alt={c.name} className="w-full h-full object-cover rounded-2xl" />
 ) : (
 <div className="w-full h-full bg-card/50 rounded-2xl flex items-center justify-center">
 <span className="text-xs font-bold">{c.name.substring(0, 2)}</span>
 </div>
 )}
 <span className="absolute -bottom-5 text-[9px] font-bold tracking-widest uppercase text-center w-16 xl:w-20 truncate opacity-80 group-hover:opacity-100 hidden xl:block">
  {c.name}
  </span>
 </motion.button>
 ))}
 </div>
 </div>

 {/* CENTER LEFT: Products Panel */}
 <div className="flex-1 flex flex-col min-w-0 bg-card/70 border border-border/50 rounded-3xl backdrop-blur-2xl shadow-xl z-10 overflow-hidden relative min-h-0">
 {/* Header */}
 <div className="h-14 lg:h-18 px-4 lg:px-8 flex items-center justify-between border-b border-border/50 bg-transparent gap-3">
 <div>
 <h1 className="text-lg lg:text-2xl font-black tracking-tight text-foreground drop-shadow-md">Menu</h1>
  <p className="text-[10px] lg:text-xs font-medium text-muted-foreground/80 uppercase tracking-widest mt-0.5 hidden sm:block">{filteredProducts.length} Available</p>
 </div>
 <div className="flex items-center gap-4">
 {/* Search Bar (Apple Style) */}
 <div className="relative group">
 <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground size-4 group-focus-within:text-primary transition-colors" />
 <Input
 placeholder="Search..."
 className="pl-11 h-10 w-40 sm:w-52 lg:w-64 bg-muted border border-border rounded-2xl text-foreground/90 placeholder:text-muted-foreground/80 focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all shadow-inner"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>
 </div>
 </div>

 {/* Mobile Category Scroller */}
 <div className="lg:hidden px-4 py-3 border-b border-border/50 bg-card/30 flex gap-2 overflow-x-auto scrollbar-hide shrink-0">
 <Button 
 variant={selectedCategory === null ? "default" : "outline"} 
 size="sm" 
 className="rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest shrink-0"
 onClick={() => setSelectedCategory(null)}
 >
 All
 </Button>
 {categories.map((c: Category) => (
 <Button 
 key={c.id}
 variant={selectedCategory === c.id ? "default" : "outline"} 
 size="sm" 
 className="rounded-xl px-4 h-9 text-[10px] font-black uppercase tracking-widest shrink-0"
 onClick={() => setSelectedCategory(c.id)}
 >
 {c.name}
 </Button>
 ))}
 </div>

 {/* Grid */}
 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
 <AnimatePresence mode="popLayout">
 <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-5">
 {filteredProducts.map((p: Product) => (
 <motion.div
 key={p.id}
 layout
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9 }}
 transition={{ type: 'spring', damping: 25, stiffness: 300 }}
 whileHover={p.stock > 0 ? { y: -8, scale: 1.02 } : {}}
 whileTap={p.stock > 0 ? { scale: 0.98 } : {}}
 onClick={() => addToCart(p)}
 className={cn(
"group relative rounded-3xl overflow-hidden cursor-pointer shadow-lg transition-all duration-500",
 p.stock > 0 ?"hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] hover:ring-1 hover:ring-white/20" :"opacity-40 grayscale pointer-events-none"
 )}
 style={{ aspectRatio: '4/5' }}
 >
 {/* Hero Image Background */}
 <div className="absolute inset-0 bg-muted">
 {p.image_url ? (
 <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
 ) : (
 <div className="w-full h-full bg-gradient-to-tr from-[#18181b] to-[#27272a] flex items-center justify-center">
 <FiPackage className="size-12 text-foreground/10" />
 </div>
 )}
 {/* Rich dark gradient for text legibility */}
 <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
 </div>

 {/* Price Badge */}
 <div className="absolute top-2 left-2 bg-muted/90 backdrop-blur-md border border-border px-2 py-1 rounded-lg shadow-lg max-w-[90%]">
  <span className="text-foreground font-black text-xs lg:text-sm tracking-tight truncate block">{formatCurrency(p.selling_price)}</span>
 </div>

 {/* Add Button - Reveal on Hover */}
 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
 <div className="size-14 rounded-full bg-primary/90 backdrop-blur-sm text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/50 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
 <FiPlus className="size-6" />
 </div>
 </div>

 {/* Stock Warning */}
 {p.stock <= 5 && p.stock > 0 && (
 <div className="absolute top-4 right-4 bg-amber-500/80 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] font-black text-foreground uppercase tracking-wider shadow-lg">
 Low
 </div>
 )}

 {/* Details */}
 <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 transform transition-transform duration-300">
  <h3 className="text-white font-bold text-xs lg:text-sm leading-tight drop-shadow-md group-hover:text-primary-foreground transition-colors line-clamp-2">{p.name}</h3>
  <p className="text-white/80 text-[10px] font-medium mt-0.5 truncate drop-shadow-md hidden sm:block">{p.sku}</p>
  </div>
 </motion.div>
 ))}
 
 {filteredProducts.length === 0 && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="col-span-full flex flex-col items-center justify-center py-24 text-muted-foreground/80 gap-4"
 >
 <div className="size-24 rounded-full border border-dashed border-border flex items-center justify-center bg-card/70">
 <FiPackage className="size-10 opacity-50" />
 </div>
 <p className="text-sm font-medium tracking-widest uppercase">No products found</p>
 </motion.div>
 )}
 </div>
 </AnimatePresence>
 </div>
 </div>

 {/* CENTER RIGHT: Cart Container */}
 <div className="w-full lg:w-[280px] xl:w-[320px] shrink-0 flex flex-col bg-card/70 border border-border/50 rounded-3xl backdrop-blur-2xl shadow-xl z-20 overflow-hidden relative min-h-0 lg:max-h-full max-h-[280px]">
 <div className="h-14 px-4 flex items-center justify-between border-b border-border/50 bg-transparent shrink-0">
 <div className="flex items-center gap-3">
 <div className="size-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/20">
 <FiShoppingCart className="size-5" />
 </div>
 <div>
 <h2 className="text-lg font-black text-foreground tracking-tight">Order</h2>
 <p className="text-[10px] uppercase tracking-widest text-muted-foreground/80 font-bold">{cart.length} Items</p>
 </div>
 </div>
 <Button variant="ghost" size="icon" className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-xl" onClick={() => setCart([])}>
 <FiTrash2 className="size-4" />
 </Button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
 <AnimatePresence>
 {cart.map(item => (
 <motion.div
 key={item.id}
 layout
 initial={{ opacity: 0, x: 20, scale: 0.95 }}
 animate={{ opacity: 1, x: 0, scale: 1 }}
 exit={{ opacity: 0, x: -20, scale: 0.95 }}
 className="group flex flex-col gap-3 p-3 rounded-2xl bg-card border border-border/50 hover:bg-accent hover:border-border transition-all shadow-sm"
 >
 <div className="flex gap-3">
 <div className="size-14 rounded-xl overflow-hidden bg-muted border border-border/50">
 {item.image_url ? (
 <img src={item.image_url} className="w-full h-full object-cover" />
 ) : (
 <FiPackage className="size-5 text-foreground/20 m-auto h-full mt-4" />
 )}
 </div>
 <div className="flex-1 min-w-0 flex flex-col justify-center">
 <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
 <p className="text-primary font-black text-xs mt-0.5">{formatCurrency(item.selling_price)}</p>
 </div>
 </div>
 
 <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-1">
 <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">Qty</span>
 <div className="flex items-center bg-muted rounded-xl border border-border p-0.5">
 <Button variant="ghost" size="icon" className="h-7 w-8 rounded-lg hover:bg-accent text-muted-foreground" onClick={() => updateQuantity(item.id, -1)}>
 <FiMinus className="size-3" />
 </Button>
 <span className="w-8 text-center text-sm font-black text-foreground">{item.quantity}</span>
 <Button variant="ghost" size="icon" className="h-7 w-8 rounded-lg hover:bg-accent text-muted-foreground" onClick={() => updateQuantity(item.id, 1)}>
 <FiPlus className="size-3" />
 </Button>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 {cart.length === 0 && (
 <div className="h-full flex flex-col items-center justify-center text-muted-foreground/80 gap-4 opacity-50">
 <div className="size-20 rounded-full border border-dashed border-border/80 flex items-center justify-center">
 <FiShoppingCart className="size-8" />
 </div>
 <p className="text-sm font-medium tracking-wide">Select an item to add</p>
 </div>
 )}
 </div>
 </div>

 {/* FAR RIGHT: Checkout Panel */}
 <div className="w-full lg:w-[270px] xl:w-[310px] shrink-0 flex flex-col bg-card/70 border border-border/50 rounded-3xl backdrop-blur-2xl shadow-xl z-20 overflow-hidden relative min-h-0">
 <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
 
 {/* Order Type Toggle (Linear style Segmented Control) */}
 <div className="space-y-3">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Order Type</label>
 <div className="flex p-1 bg-muted rounded-2xl border border-border/50 relative">
 {['dine-in', 'take-out'].map((type) => (
 <button
 key={type}
 onClick={() => setOrderType(type)}
 className={cn(
"flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all z-10",
 orderType === type ?"text-foreground drop-shadow-md" :"text-muted-foreground/80 hover:text-muted-foreground"
 )}
 >
 {type.replace('-', ' ')}
 </button>
 ))}
 <div 
 className="absolute top-1 bottom-1 bg-accent rounded-xl border border-border shadow-sm transition-all duration-300"
 style={{
 width: 'calc(50% - 4px)',
 left: orderType === 'dine-in' ? '4px' : 'calc(50% + 2px)'
 }}
 />
 </div>
 </div>

 {/* Payment Selection */}
 <div className="space-y-3">
 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 ml-1">Payment</label>
 <div className="grid grid-cols-3 gap-2">
 {['cash', 'card', 'e-wallet'].map((method) => (
 <button
 key={method}
 onClick={() => setPaymentMethod(method)}
 className={cn(
"py-4 rounded-2xl border flex flex-col items-center gap-2 transition-all duration-300",
 paymentMethod === method
 ?"bg-primary/20 border-primary shadow-sm shadow-primary/20"
 :"bg-card border-border/50 hover:bg-accent/80 hover:border-border/80 text-muted-foreground"
 )}
 >
 <div className={cn("size-8 rounded-full flex items-center justify-center border transition-colors", paymentMethod === method ?"border-primary/50 text-primary bg-primary/10" :"border-border text-muted-foreground/80 bg-muted")}>
 {method === 'cash' ? <span className="text-sm font-bold">₱</span> : method === 'card' ? <FiPackage className="size-3"/> : <FiLayers className="size-3"/>}
 </div>
 <span className={cn("text-[9px] font-bold uppercase tracking-widest", paymentMethod === method ?"text-primary" :"")}>{method}</span>
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Sticky Bottom Total & Checkout */}
 <div className="p-5 bg-background/80 backdrop-blur-2xl border-t border-border space-y-4">
 <div className="space-y-2.5">
 <div className="flex justify-between items-center text-muted-foreground text-sm font-medium">
 <span>Subtotal</span>
 <span className="text-foreground/90">{formatCurrency(cartTotal)}</span>
 </div>
 <div className="flex justify-between items-center pt-3 border-t border-border gap-2">
  <span className="text-sm font-black uppercase tracking-widest text-foreground shrink-0">Total</span>
  <span className="text-xl xl:text-2xl font-black text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.4)] text-right truncate">{formatCurrency(cartTotal)}</span>
  </div>
 </div>

 <Button
 className="w-full h-12 lg:h-14 text-sm lg:text-lg font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/60 hover:shadow-xl shadow-primary/80 active:scale-[0.98] transition-all disabled:opacity-50 border border-primary/50 relative overflow-hidden group"
 disabled={cart.length === 0 || processing}
 onClick={handleCheckout}
 >
 <span className="relative z-10 text-foreground">{processing ? 'Processing...' : 'Checkout'}</span>
 <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent z-0" />
 <div className="absolute top-0 left-0 right-0 h-1/2 bg-accent/80 rounded-b-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
 </Button>
 </div>
 </div>
</div>

 {/* Payment Modal */}
 <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
 <DialogContent className="max-w-md">
 <DialogHeader>
 <DialogTitle>Payment Details</DialogTitle>
 <DialogDescription>Select payment method and enter amount</DialogDescription>
 </DialogHeader>

 <div className="space-y-6 py-4">
 <div className="flex justify-between items-center p-4 bg-primary/5 rounded-2xl border border-primary/10">
 <span className="text-muted-foreground font-medium">Total Payable</span>
 <span className="text-3xl font-black text-primary">{formatCurrency(cartTotal)}</span>
 </div>

 {paymentMethod === 'cash' && (
 <div className="space-y-4">
 <div className="space-y-2">
 <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Amount Received</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₱</span>
 <Input
 type="number"
 placeholder="0.00"
 className="pl-8 h-12 text-xl font-bold rounded-xl"
 value={cashReceived}
 onChange={(e) => setCashReceived(e.target.value)}
 autoFocus
 />
 </div>
 </div>

 <div className="flex justify-between items-center p-4 bg-muted/50 rounded-2xl border">
 <span className="text-muted-foreground font-medium">Change Due</span>
 <span className="text-2xl font-black text-amber-600">{formatCurrency(changeDue)}</span>
 </div>
 </div>
 )}

 {paymentMethod !== 'cash' && (
 <div className="p-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
 <FiPackage className="size-8 opacity-20" />
 <p className="text-sm font-medium">Process via external terminal</p>
 </div>
 )}
 </div>

 <DialogFooter>
 <Button variant="outline" className="h-11 rounded-xl" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
 <Button
 className="h-11 rounded-xl px-8 font-bold"
 disabled={processing || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < cartTotal))}
 onClick={confirmPayment}
 >
 Confirm Payment
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>

 {/* Success & Receipt Modal */}
 <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
 <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
 <div className="flex flex-col items-center text-center py-4">
 <motion.div
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ type: 'spring', damping: 12 }}
 className="size-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"
 >
 <FiCheckCircle className="size-8 text-green-500" />
 </motion.div>
 <DialogTitle className="text-2xl font-black">Transaction Complete</DialogTitle>
 <DialogDescription>Order #{lastSale?.order_number} has been recorded</DialogDescription>
 </div>

 {/* Receipt Preview Area */}
 <div className="bg-white text-black p-6 rounded-xl border-t-4 border-primary shadow-sm space-y-4 font-mono text-xs">
 <div className="text-center border-b pb-4 space-y-1">
 <h3 className="font-bold text-lg uppercase tracking-tight">{branch?.name || 'Maki Desu'}</h3>
 <p className="text-muted-foreground text-[10px]">{branch?.address || 'Restaurant POS System'}</p>
 </div>

 <div className="flex justify-between">
 <span>Date: {lastSale ? format(new Date(lastSale.created_at), 'MMM dd, yyyy HH:mm') : ''}</span>
 <span className="font-bold uppercase">{lastSale?.type}</span>
 </div>

 <div className="border-y py-3 space-y-2">
 <div className="flex justify-between font-bold border-b pb-1">
 <span>Item</span>
 <div className="flex gap-8">
 <span>Qty</span>
 <span>Price</span>
 </div>
 </div>
 {lastSale?.items?.map((item: any) => (
 <div key={item.id} className="flex justify-between">
 <span className="truncate max-w-[150px]">{item.product?.name}</span>
 <div className="flex gap-10">
 <span>{item.quantity}</span>
 <span>{formatCurrency(item.unit_price)}</span>
 </div>
 </div>
 ))}
 </div>

 <div className="space-y-1 text-sm border-b pb-4">
 <div className="flex justify-between font-black">
 <span>TOTAL</span>
 <span>{formatCurrency(lastSale?.total || 0)}</span>
 </div>
 <div className="flex justify-between text-xs pt-2">
 <span className="capitalize">{lastSale?.payment_method} Received</span>
 <span>{formatCurrency(lastSale?.paid_amount || 0)}</span>
 </div>
 <div className="flex justify-between text-xs font-bold">
 <span>CHANGE</span>
 <span>{formatCurrency(lastSale?.change_amount || 0)}</span>
 </div>
 </div>

 <div className="text-center pt-2 italic text-[10px] space-y-1">
 <p>Thank you for dining with us!</p>
 <p>Cashier: {lastSale?.cashier?.name || 'Staff'}</p>
 </div>
 </div>

 <DialogFooter className="grid grid-cols-2 gap-3 sm:gap-0">
 <Button variant="outline" className="h-11 rounded-xl gap-2 font-bold" onClick={() => window.print()}>
 <FiPrinter className="size-4" /> Print Receipt
 </Button>
 <Button className="h-11 rounded-xl gap-2 font-bold" onClick={handleNewOrder}>
 <FiPlusCircle className="size-4" /> New Order
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 {/* Result Modal (Errors/Warnings) */}
 <ResultModal
 open={isAlertModalOpen}
 onClose={() => setIsAlertModalOpen(false)}
 type={alertModal.type}
 title={alertModal.title}
 message={alertModal.message}
 />
 </AppLayout>
 );
}

