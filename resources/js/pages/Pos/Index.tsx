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

      <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-muted/20">
        {/* Left: Product Catalog */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* Header: Search & Branch */}
          <div className="p-4 bg-background border-b flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Search products..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {branch && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 rounded-xl border border-primary/10 shrink-0">
                <FiPackage className="size-3.5 text-primary" />
                <span className="text-xs font-black text-primary uppercase tracking-tight">{branch.name}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Category Navigation (McDonald's Style) */}
            <div className="bg-background/80 backdrop-blur-md border-b px-4 py-4 sticky top-0 z-10 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide px-2">
                    {/* All Items Card */}
                    <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                            "flex-shrink-0 w-24 h-28 rounded-2xl flex flex-col items-center justify-between p-3 transition-all duration-300 border-2",
                            selectedCategory === null
                                ? "bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/5"
                                : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-muted-foreground/20"
                        )}
                    >
                        <div className={cn(
                            "size-12 rounded-full flex items-center justify-center transition-colors",
                            selectedCategory === null ? "bg-primary text-white" : "bg-muted-foreground/10 text-muted-foreground/60"
                        )}>
                            <FiLayers className="size-6" />
                        </div>
                        <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest text-center leading-tight",
                            selectedCategory === null ? "text-primary" : "text-muted-foreground/70 decoration-transparent"
                        )}>
                            All Items
                        </span>
                    </motion.button>

                    {/* Category Cards */}
                    {categories.map((c: Category) => (
                        <motion.button
                            key={c.id}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCategory(c.id)}
                            className={cn(
                                "flex-shrink-0 w-24 h-28 rounded-2xl flex flex-col items-center justify-between p-3 transition-all duration-300 border-2 group",
                                selectedCategory === c.id
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/20 ring-4 ring-primary/5"
                                    : "bg-muted/30 border-transparent hover:bg-muted/50 hover:border-muted-foreground/20"
                            )}
                        >
                            <div className="size-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/50 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {c.image_url ? (
                                    <img src={c.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                        <FiLayers className="size-6 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest text-center leading-tight truncate w-full",
                                selectedCategory === c.id ? "text-primary" : "text-muted-foreground/70"
                            )}>
                                {c.name}
                            </span>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-3">
                Menu <span className="text-primary">({filteredProducts.length})</span>
              </p>
              <AnimatePresence mode="popLayout">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {filteredProducts.map((p: Product) => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={p.stock > 0 ? { scale: 1.04, y: -2 } : {}}
                      whileTap={p.stock > 0 ? { scale: 0.97 } : {}}
                      onClick={() => addToCart(p)}
                      className={cn(
                        "group relative rounded-2xl overflow-hidden border bg-background cursor-pointer transition-shadow duration-300",
                        p.stock > 0
                          ? "hover:shadow-xl hover:shadow-black/10 hover:border-primary/30"
                          : "opacity-50 grayscale pointer-events-none",
                      )}
                      style={{ aspectRatio: '1 / 1' }}
                    >
                      {/* Product Image or Fallback */}
                      <div className="absolute inset-0">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center">
                            <FiPackage className="size-10 text-muted-foreground/30" />
                          </div>
                        )}
                        {/* Subtle overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      </div>

                      {/* Add button top-right */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
                        <div className="size-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                          <FiPlus className="size-3 text-white" />
                        </div>
                      </div>

                      {/* Stock badge */}
                      {p.stock <= 5 && p.stock > 0 && (
                        <Badge className="absolute top-2 left-2 bg-amber-500/90 hover:bg-amber-500 text-white text-[9px] h-4 px-1.5 font-bold backdrop-blur-sm">
                          Low
                        </Badge>
                      )}
                      {p.stock <= 0 && (
                        <Badge variant="destructive" className="absolute top-2 left-2 text-[9px] h-4 px-1.5 font-bold">
                          Sold Out
                        </Badge>
                      )}

                      {/* Info at bottom */}
                      <div className="absolute bottom-0 left-0 right-0 p-2.5">
                        <p className="text-white font-bold text-xs leading-tight truncate drop-shadow-md">{p.name}</p>
                        <p className="text-primary font-black text-sm leading-tight drop-shadow-md">{formatCurrency(p.selling_price)}</p>
                      </div>
                    </motion.div>
                  ))}

                  {filteredProducts.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground/50 gap-3"
                    >
                      <FiPackage className="size-12" />
                      <p className="text-sm font-medium">No products found</p>
                    </motion.div>
                  )}
                </div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-80 lg:w-96 flex flex-col bg-background border-l">
          {/* Cart Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold">
              <FiShoppingCart className="text-primary" />
              Current Order
            </div>
            <Badge variant="secondary">{cart.length} items</Badge>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2">
                <FiShoppingCart className="size-12" />
                <p className="text-sm">Tap products to add</p>
              </div>
            ) : (
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex gap-3 items-center bg-muted/30 rounded-xl p-2.5"
                  >
                    {/* Product thumbnail in cart */}
                    <div className="size-10 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FiPackage className="size-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{item.name}</p>
                      <p className="text-xs text-primary font-bold">{formatCurrency(item.selling_price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center bg-background rounded-lg px-1 border">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, -1)}>
                          <FiMinus className="size-3" />
                        </Button>
                        <span className="w-5 text-center text-xs font-bold">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, 1)}>
                          <FiPlus className="size-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => removeFromCart(item.id)}>
                        <FiTrash2 className="size-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Footer: Summary & Controls */}
          <div className="p-4 border-t bg-muted/10 space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Order Type</span>
                <select
                  className="bg-background border rounded px-2 py-1 text-xs font-bold"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                >
                  <option value="dine-in">Dine-in</option>
                  <option value="take-out">Take-out</option>
                  <option value="delivery">Delivery</option>
                </select>
              </div>

              {/* Delivery Details Panel */}
              {orderType === 'delivery' && (
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-1">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Delivery Info</span>
                      <Badge variant="outline" className="text-[9px] bg-white font-bold h-5">
                        {parseFloat(String(deliveryInfo.distance_km)) <= (parseFloat(branch?.delivery_radius_km) || 5) ? 'Within Radius' : 'Outside Radius'}
                      </Badge>
                    </div>

                    {deliveryRecommendation && (
                      <div className="rounded-2xl border border-primary/20 bg-white/80 p-3 text-xs text-slate-700">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-bold uppercase tracking-widest text-primary">Recommended</span>
                          <Badge className="text-[9px] uppercase bg-slate-100 text-slate-700">
                            {deliveryRecommendation.type === 'internal' ? 'Internal' : 'External'}
                          </Badge>
                        </div>
                        <p className="mt-2 leading-5 text-[11px] text-slate-600">{deliveryRecommendation.reason}</p>
                        <div className="mt-2 flex flex-col gap-1 text-[11px] text-slate-500">
                          <span>Fee: {formatCurrency(deliveryRecommendation.fee)}</span>
                          <span>Available riders: {deliveryRecommendation.available_riders}</span>
                          {deliveryRecommendation.recommended_rider && (
                            <span>Suggested rider: {deliveryRecommendation.recommended_rider.name} ({deliveryRecommendation.recommended_rider.phone})</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Input 
                      placeholder="Customer Name" 
                      className="h-8 text-xs rounded-lg bg-background border-none shadow-sm"
                      value={deliveryInfo.customer_name}
                      onChange={e => setDeliveryInfo(p => ({ ...p, customer_name: e.target.value }))}
                    />
                    <Input 
                      placeholder="Address" 
                      className="h-8 text-xs rounded-lg bg-background border-none shadow-sm"
                      value={deliveryInfo.customer_address}
                      onChange={e => setDeliveryInfo(p => ({ ...p, customer_address: e.target.value }))}
                    />
                    
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input 
                          placeholder="Dist (km)" 
                          type="number"
                          step="0.1"
                          className="h-8 text-xs rounded-lg bg-background border-none shadow-sm pr-6"
                          value={deliveryInfo.distance_km}
                          onChange={e => setDeliveryInfo(p => ({ ...p, distance_km: e.target.value }))}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-muted-foreground">KM</span>
                      </div>
                      <div className="flex-1">
                         <select
                            className="w-full h-8 bg-background border-none shadow-sm rounded-lg text-xs px-2"
                            value={deliveryInfo.delivery_type}
                            onChange={e => setDeliveryInfo(p => ({ ...p, delivery_type: e.target.value as any }))}
                          >
                            <option value="internal">Internal</option>
                            <option value="external">External</option>
                          </select>
                      </div>
                    </div>

                    {deliveryRecommendation && deliveryInfo.delivery_type === 'internal' && deliveryRecommendation.type === 'external' && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700">
                        The system recommends external delivery for the current distance, but you may override manually.
                      </div>
                    )}

                    {deliveryInfo.delivery_type === 'internal' ? (
                       <select
                          className="h-8 bg-background border-none shadow-sm rounded-lg text-xs px-2"
                          value={deliveryInfo.rider_id}
                          onChange={e => setDeliveryInfo(p => ({ ...p, rider_id: e.target.value }))}
                        >
                          <option value="">Assign Rider</option>
                          {availableRiders?.map((r: any) => (
                            <option key={r.id} value={r.id}>{r.name} ({r.phone})</option>
                          ))}
                        </select>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <select
                            className="flex-1 h-8 bg-background border-none shadow-sm rounded-lg text-xs px-2"
                            value={deliveryInfo.external_service}
                            onChange={e => setDeliveryInfo(p => ({ ...p, external_service: e.target.value as any }))}
                          >
                            <option value="grab">Grab</option>
                            <option value="lalamove">Lalamove</option>
                          </select>
                          <Input 
                            placeholder="Tracking #" 
                            className="flex-1 h-8 text-xs rounded-lg bg-background border-none shadow-sm"
                            value={deliveryInfo.tracking_number}
                            onChange={e => setDeliveryInfo(p => ({ ...p, tracking_number: e.target.value }))}
                          />
                        </div>

                        <div className="grid gap-2">
                          <Input
                            placeholder="External notes (optional)"
                            className="h-8 text-xs rounded-lg bg-background border-none shadow-sm"
                            value={deliveryInfo.external_notes}
                            onChange={e => setDeliveryInfo(p => ({ ...p, external_notes: e.target.value }))}
                          />
                          <label className="block text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                            Proof of delivery (optional)
                          </label>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setProofFile(file);
                              setProofPreview(file ? URL.createObjectURL(file) : null);
                            }}
                            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer transition-all border border-input rounded-lg p-2 bg-background"
                          />
                          {proofPreview && (
                            <div className="rounded-xl border border-primary/20 bg-white p-2 text-[11px] text-slate-700">
                              <p className="font-semibold">Selected proof image</p>
                              <p className="truncate">{proofFile?.name}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-1 flex justify-between items-center bg-white/50 rounded-lg p-2 border border-black/5">
                    <span className="text-[10px] font-bold text-muted-foreground">Delivery Fee</span>
                    <span className="text-sm font-black text-primary">{formatCurrency(deliveryFee)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment</span>
                <select
                  className="bg-background border rounded px-2 py-1 text-xs"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="e-wallet">E-Wallet</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-medium text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
              </div>
              <Button
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                disabled={cart.length === 0 || processing}
                onClick={handleCheckout}
              >
                {processing ? 'Processing...' : 'Complete Sale'}
              </Button>
            </div>
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

