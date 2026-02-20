import { Head, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/core';
import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/layouts/app-layout';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiSearch, FiLayers, FiPackage } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useForm } from '@inertiajs/react';

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
  const { products, categories } = usePage().props as any;

  // --- Sync Logic ---
  const stateChannel = useMemo(() => new BroadcastChannel('app-state-updates'), []);

  useEffect(() => {
    // 1. Listen for updates from other tabs
    const handleMessage = (e: MessageEvent) => {
      if (e.data.type === 'inventory-updated' || e.data.type === 'products-updated') {
        router.reload({ only: ['products', 'categories'] });
      }
    };
    stateChannel.addEventListener('message', handleMessage);

    // 2. Refresh on window focus (Ensures data is fresh when switching back to this tab)
    const handleFocus = () => {
      router.reload({ only: ['products', 'categories'] });
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      stateChannel.removeEventListener('message', handleMessage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [stateChannel]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState('Dine-in');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

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

  const cartTotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);

  const { processing } = useForm();

  const handleCheckout = () => {
    if (cart.length === 0) return;
    router.post('/pos', {
      type: orderType,
      items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
      total: cartTotal,
      payment_method: paymentMethod,
      paid_amount: cartTotal,
    }, {
      onSuccess: () => {
        setCart([]);
        stateChannel.postMessage({ type: 'inventory-updated' });
        alert('Order completed successfully!');
      },
      onError: (err: any) => {
        alert(err.error || 'Checkout failed');
      }
    });
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

          {/* Header: Search */}
          <div className="p-4 bg-background border-b">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Search products..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Category Cards */}
            <div>
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mb-3">Sections</p>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {/* All Items Card */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group",
                    selectedCategory === null
                      ? "border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/30"
                      : "border-transparent hover:border-primary/30 hover:shadow-md"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center gap-1">
                    <FiLayers className={cn("size-6 transition-colors", selectedCategory === null ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-[9px] font-black uppercase tracking-wider leading-none text-center px-1", selectedCategory === null ? "text-primary" : "text-muted-foreground")}>
                      All Items
                    </span>
                  </div>
                </motion.button>

                {categories.map((c: Category) => (
                  <motion.button
                    key={c.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      "relative flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer group",
                      selectedCategory === c.id
                        ? "border-primary shadow-lg shadow-primary/30 ring-2 ring-primary/30"
                        : "border-transparent hover:border-primary/30 hover:shadow-md"
                    )}
                  >
                    {c.image_url ? (
                      <>
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        <FiLayers className="size-6 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-0 right-0 px-1 text-center">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider leading-none",
                        c.image_url ? "text-white drop-shadow-md" : "text-muted-foreground"
                      )}>
                        {c.name}
                      </span>
                    </div>
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
                  className="bg-background border rounded px-2 py-1 text-xs"
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                >
                  <option>Dine-in</option>
                  <option>Take-out</option>
                  <option>Delivery</option>
                </select>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Payment</span>
                <select
                  className="bg-background border rounded px-2 py-1 text-xs"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Card</option>
                  <option>G-Cash</option>
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
    </AppLayout>
  );
}
