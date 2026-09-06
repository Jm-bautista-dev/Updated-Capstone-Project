import { router } from '@inertiajs/core';
import { Head, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { 
  FiShoppingCart, 
  FiPlus, 
  FiMinus, 
  FiTrash2, 
  FiSearch, 
  FiPackage, 
  FiLock, 
  FiUnlock, 
  FiActivity, 
  FiPrinter, 
  FiArrowLeft,
  FiCreditCard,
  FiDollarSign,
  FiSmartphone,
  FiChevronRight
} from 'react-icons/fi';
import { toast } from 'sonner';
import { NotificationBell } from '@/components/notification-bell';
import { ApplyDiscountModal, type PosDiscount } from '@/components/pos/ApplyDiscountModal';
import { PosDeliverySection, type PosDeliveryInfo } from '@/components/pos/PosDeliverySection';
import { ProductModifierModal, type ModifierGroup, type ProductForModifier, type SelectedModifier } from '@/components/pos/ProductModifierModal';
import { ResultModal } from '@/components/result-modal';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { addToOfflineQueue } from '@/lib/offline-db';
import { usePrinterStatus, sendToLocalPrintBridge, type LocalPrintJobPayload } from '@/lib/pos-print-bridge';
import { cn, formatCurrency } from '@/lib/utils';

type Category = {
  id: number;
  name: string;
  image_url: string | null;
};

export interface SelectedAddon {
  addon_id?: number;
  name: string;
  price: number;
  quantity?: number;
  group_id?: number | string;
  group_name?: string;
}

type Product = {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  selling_price: number;
  stock: number;
  is_low_stock?: boolean;
  image_url: string | null;
  available_addons?: { id: number; name: string; price: number }[];
  addon_groups?: ModifierGroup[];
};

type CartItem = Product & { 
  quantity: number;
  selected_addons?: SelectedAddon[];
};

interface ActiveShift {
  id: number;
  opening_balance: number;
  opened_at: string;
  expected_balance?: number;
  total_cash_sales?: number;
}

interface BranchInfo {
  id: number;
  name: string;
  address?: string;
  base_delivery_fee?: string | number;
  per_km_fee?: string | number;
}

interface PosRider {
  id: number;
  name: string;
  phone?: string;
  status?: string;
  is_active?: boolean;
}

interface PosPageProps {
  products?: Product[];
  categories?: Category[];
  branch?: BranchInfo;
  availableRiders?: PosRider[];
  allRiders?: PosRider[];
  activeShift?: ActiveShift | null;
  [key: string]: unknown;
}

type KioskStep = 'browse' | 'review' | 'checkout';

function generateOfflineId(): string {
  return 'local_' + Date.now().toString(36);
}

export default function PosIndex() {
  const { products = [], categories = [], branch, activeShift } = usePage().props as unknown as PosPageProps;

  // --- Real-time Printer Status Hook ---
  const { isConnected: isPrinterReady, checkNow: checkPrinterNow } = usePrinterStatus();

  // --- Real-time Sync Logic ---
  useEffect(() => {
    const handleFocus = () => {
      router.reload({ only: ['products', 'categories'] });
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // --- Main Kiosk Flow State ---
  const [kioskStep, setKioskStep] = useState<KioskStep>('browse');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState('dine-in');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Modal States
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertModal, setAlertModal] = useState<{ type: 'error' | 'warning'; title: string; message: string }>({
    type: 'warning', title: '', message: '',
  });
  const [cashReceived, setCashReceived] = useState('');

  // Shift Management States
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(!activeShift);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [openingCash, setOpeningCash] = useState('2000');
  const [closingCash, setClosingCash] = useState('');
  const [varianceReason, setVarianceReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');

  const getCsrfToken = () => {
    const props = (typeof window !== 'undefined' ? (window as unknown as { __inertia_props?: Record<string, unknown> })?.__inertia_props : null) || {};
    if (props?.csrf_token && typeof props.csrf_token === 'string') {
      return props.csrf_token;
    }
    if (typeof document !== 'undefined') {
      return (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content || '';
    }
    return '';
  };

  const handleOpenShift = () => {
    const token = getCsrfToken();
    router.post('/shifts/open', { 
      opening_balance: openingCash,
      ...(token ? { _token: token } : {})
    }, {
      onSuccess: () => setIsShiftModalOpen(false),
      onError: (err: Record<string, string>) => {
        setAlertModal({ type: 'error', title: 'Shift Error', message: err.shift || 'Could not open shift.' });
        setIsAlertModalOpen(true);
      }
    });
  };

  const handleCloseShift = () => {
    const token = getCsrfToken();
    router.post('/shifts/close', { 
      closing_balance: closingCash, 
      notes: varianceReason,
      ...(token ? { _token: token } : {})
    }, {
      onSuccess: () => {
        setIsCloseShiftModalOpen(false);
        setClosingCash('');
        setVarianceReason('');
      },
      onError: (err: Record<string, string>) => {
        setAlertModal({ type: 'error', title: 'Shift Error', message: err.notes || 'Could not close shift.' });
        setIsAlertModalOpen(true);
      }
    });
  };

  const handleAdjustment = () => {
    const token = getCsrfToken();
    router.post('/shifts/adjust', {
      type: adjustmentType,
      amount: adjustmentAmount,
      notes: adjustmentNotes,
      ...(token ? { _token: token } : {})
    }, {
      onSuccess: () => {
        setIsAdjustmentModalOpen(false);
        setAdjustmentAmount('');
        setAdjustmentNotes('');
      },
      onError: () => {
        setAlertModal({ type: 'error', title: 'Adjustment Error', message: 'Could not record adjustment.' });
        setIsAlertModalOpen(true);
      }
    });
  };


  // Discount State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [activeDiscount, setActiveDiscount] = useState<PosDiscount | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Delivery State ---
  const [deliveryInfo, setDeliveryInfo] = useState<PosDeliveryInfo>({
    customer_name: '',
    customer_phone: '',
    customer_address: '',
    delivery_type: 'internal',
    external_service: 'grab',
    rider_id: '',
    tracking_number: '',
    distance_km: '',
    external_notes: '',
    latitude: null,
    longitude: null,
  });
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const deliveryFee = useMemo(() => {
    if (orderType !== 'delivery') return 0;
    if (calculatedDeliveryFee !== null) return calculatedDeliveryFee;
    const distance = parseFloat(String(deliveryInfo.distance_km)) || 0;
    const base = parseFloat(String(branch?.base_delivery_fee ?? 49)) || 49;
    const perKm = parseFloat(String(branch?.per_km_fee ?? 15)) || 15;
    const freeKm = 1.0;

    if (distance === 0) return 0;
    if (distance <= freeKm) return Math.round(base * 100) / 100;
    const computed = base + (distance - freeKm) * perKm;
    return Math.round(computed * 100) / 100;
  }, [orderType, calculatedDeliveryFee, deliveryInfo.distance_km, branch?.base_delivery_fee, branch?.per_km_fee]);

  const cartTotalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartBaseSubtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0), [cart]);
  const cartAddonsTotal = useMemo(() => cart.reduce((sum, item) => {
    const addonsSum = (item.selected_addons || []).reduce((aSum, a) => aSum + (a.price * (a.quantity || 1)), 0);
    return sum + (addonsSum * item.quantity);
  }, 0), [cart]);
  const cartSubtotal = useMemo(() => cartBaseSubtotal + cartAddonsTotal, [cartBaseSubtotal, cartAddonsTotal]);

  // Dynamic Discount Calculation based on current cart
  const discountAmount = useMemo(() => {
    if (!activeDiscount || cart.length === 0) return 0;
    const eligibleItems = activeDiscount.eligibleItemIds && activeDiscount.eligibleItemIds.length > 0
      ? cart.filter((it) => activeDiscount.eligibleItemIds.includes(it.id))
      : cart;
    const eligibleBase = eligibleItems.reduce((acc, it) => acc + (it.selling_price * it.quantity), 0);

    if (activeDiscount.type === 'custom_fixed' || activeDiscount.mode === 'fixed' || (activeDiscount.fixedAmount !== undefined && activeDiscount.fixedAmount > 0)) {
      const fixed = Math.min(eligibleBase, Math.max(0, activeDiscount.fixedAmount || 0));
      return Math.round(fixed * 100) / 100;
    }
    const rate = Math.min(100, Math.max(0, activeDiscount.percentage || 0));
    const calculated = (eligibleBase * rate) / 100;
    return Math.round(calculated * 100) / 100;
  }, [cart, activeDiscount]);

  const netProductSubtotal = useMemo(() => {
    const raw = Math.max(0, cartSubtotal - discountAmount);
    return Math.round(raw * 100) / 100;
  }, [cartSubtotal, discountAmount]);

  const cartTotal = useMemo(() => {
    const fee = orderType === 'delivery' ? deliveryFee : 0;
    const raw = netProductSubtotal + fee;
    return Math.round(raw * 100) / 100;
  }, [netProductSubtotal, orderType, deliveryFee]);

  const changeDue = useMemo(() => {
    const cash = parseFloat(cashReceived) || 0;
    const raw = Math.max(0, cash - cartTotal);
    return Math.round(raw * 100) / 100;
  }, [cashReceived, cartTotal]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: Product) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error(`"${product.name}" is currently sold out.`);
      return;
    }

    const hasAddons = (product.addon_groups && product.addon_groups.length > 0) ||
                      (product.available_addons && product.available_addons.length > 0);

    if (hasAddons) {
      setModifierProduct(product);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && (!item.selected_addons || item.selected_addons.length === 0));
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Maximum available stock (${product.stock}) reached for ${product.name}.`);
          return prev;
        }
        toast.success(`✓ Added another ${product.name}`);
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + 1 } : item);
      }
      toast.success(`✓ Added ${product.name}`);
      return [...prev, { ...product, quantity: 1, selected_addons: [] }];
    });
  };

  const handleConfirmModifierProduct = (product: ProductForModifier, qty: number, selectedAddons: SelectedModifier[]) => {
    const fullProduct = products.find((p: Product) => p.id === product.id) || product;

    setCart(prev => {
      // Find matching item with identical addons
      const addonsKey = JSON.stringify(selectedAddons.map(a => ({ id: a.addon_id, qty: a.quantity })).sort((a, b) => a.id - b.id));
      const existing = prev.find(item => {
        if (item.id !== product.id) return false;
        const itemKey = JSON.stringify((item.selected_addons || []).map(a => ({ id: a.addon_id || 0, qty: a.quantity || 1 })).sort((a, b) => a.id - b.id));
        return addonsKey === itemKey;
      });

      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > product.stock) {
          toast.warning(`Maximum available stock (${product.stock}) reached for ${product.name}.`);
          return prev;
        }
        toast.success(`✓ Added ${qty}x ${product.name}`);
        return prev.map(item => item === existing ? { ...item, quantity: newQty } : item);
      }

      toast.success(`✓ Added ${product.name} with ${selectedAddons.length} modifier(s)`);
      return [...prev, {
        ...(fullProduct as Product),
        quantity: qty,
        selected_addons: selectedAddons.map(a => ({
          addon_id: a.addon_id,
          name: a.name,
          price: a.price,
          quantity: a.quantity,
          group_id: a.group_id,
          group_name: a.group_name,
        })),
      }];
    });
  };

  const updateQuantity = (cartIndex: number, delta: number) => {
    setCart(prev => prev.map((item, idx) => {
      if (idx === cartIndex) {
        const newQty = item.quantity + delta;
        const product = products.find((p: Product) => p.id === item.id);
        const maxStock = product?.stock || 0;
        
        if (newQty > maxStock) {
          toast.warning(`Cannot exceed available stock of ${maxStock}`);
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartIndex: number) => {
    setCart(prev => prev.filter((_, idx) => idx !== cartIndex));
  };

  const handleProceedToCheckout = () => {
    if (!activeShift) {
      setAlertModal({ type: 'warning', title: 'Shift Required', message: 'You must open a shift before processing sales.' });
      setIsAlertModalOpen(true);
      setIsShiftModalOpen(true);
      return;
    }
    if (cart.length === 0) {
      toast.error('Cart is empty. Please select products first.');
      return;
    }

    if (orderType === 'delivery') {
      if (!deliveryInfo.customer_name || !deliveryInfo.customer_address) {
        setAlertModal({ type: 'warning', title: 'Missing Info', message: 'Customer name and address are required for delivery.' });
        setIsAlertModalOpen(true);
        return;
      }
      if (!deliveryInfo.distance_km) {
        setAlertModal({ type: 'warning', title: 'Locate Address', message: 'Please enter a valid customer address so road distance and delivery fees can be calculated.' });
        setIsAlertModalOpen(true);
        return;
      }
      if (deliveryInfo.delivery_type === 'external' && !deliveryInfo.tracking_number) {
        setAlertModal({ type: 'warning', title: 'No Tracking', message: 'Tracking number is required for external delivery.' });
        setIsAlertModalOpen(true);
        return;
      }
    }

    setKioskStep('checkout');
  };

  const confirmPayment = () => {
    if (isSubmitting) return;

    const paid = paymentMethod === 'cash' ? (parseFloat(cashReceived) || 0) : cartTotal;

    if (paymentMethod === 'cash' && paid < cartTotal) {
      setAlertModal({ type: 'warning', title: 'Insufficient Cash', message: `You need at least ${formatCurrency(cartTotal)} to complete this order.` });
      setIsAlertModalOpen(true);
      return;
    }

    if (!navigator.onLine) {
      const opId = generateOfflineId();
      const salePayload = {
        type: orderType,
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        discount_type: activeDiscount?.type || null,
        discount_details: activeDiscount ? {
          type_name: activeDiscount.typeName,
          percentage: activeDiscount.percentage,
          fixed_amount: activeDiscount.fixedAmount,
          customer_name: activeDiscount.customerName,
          id_number: activeDiscount.idNumber,
          eligible_item_ids: activeDiscount.eligibleItemIds,
          notes: activeDiscount.notes,
        } : null,
        total: cartTotal,
        payment_method: paymentMethod,
        paid_amount: paid,
        change_amount: paymentMethod === 'cash' ? changeDue : 0,
        delivery_info: orderType === 'delivery' ? { ...deliveryInfo, delivery_fee: deliveryFee } : null
      };

      addToOfflineQueue({
        id: opId,
        type: 'SALE',
        payload: salePayload
      }).then(() => {
        toast.success(`✓ Offline Order #${opId.toUpperCase()} Saved Locally`, {
          description: 'It will auto-sync and print when online.',
          duration: 4000,
        });
        setCart([]);
        setActiveDiscount(null);
        setCashReceived('');
        setProofFile(null);
        setKioskStep('browse');
        setOrderType('dine-in');
      }).catch(() => {
        toast.error('Offline Mode: Failed to save order locally.');
      });
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    const token = getCsrfToken();
    if (token) {
      formData.append('_token', token);
    }
    const idempotencyKey = 'pos_sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    formData.append('idempotency_key', idempotencyKey);

    formData.append('type', orderType);
    formData.append('items', JSON.stringify(cart.map(item => ({ 
      id: item.id, 
      quantity: item.quantity,
      selected_addons: item.selected_addons || [] 
    }))));
    formData.append('total', String(cartTotal));
    formData.append('payment_method', paymentMethod);
    formData.append('paid_amount', String(paid));
    formData.append('change_amount', String(paymentMethod === 'cash' ? changeDue : 0));

    if (discountAmount > 0 && activeDiscount) {
      formData.append('discount', String(discountAmount));
      formData.append('discount_type', activeDiscount.type);
      formData.append('discount_details', JSON.stringify({
        type_name: activeDiscount.typeName,
        percentage: activeDiscount.percentage,
        fixed_amount: activeDiscount.fixedAmount,
        customer_name: activeDiscount.customerName,
        id_number: activeDiscount.idNumber,
        eligible_item_ids: activeDiscount.eligibleItemIds,
        notes: activeDiscount.notes,
      }));
    }

    if (orderType === 'delivery') {
      cart.forEach((item, index) => {
        formData.append(`items[${index}][id]`, String(item.id));
        formData.append(`items[${index}][quantity]`, String(item.quantity));
        if (item.selected_addons && item.selected_addons.length > 0) {
          formData.append(`items[${index}][selected_addons]`, JSON.stringify(item.selected_addons));
        }
      });

      Object.entries({ ...deliveryInfo, delivery_fee: deliveryFee }).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        formData.append(`delivery_info[${key}]`, String(value));
      });

      if (proofFile) {
        formData.append('delivery_info[proof_of_delivery]', proofFile);
      }
    } else {
      cart.forEach((item, index) => {
        formData.append(`items[${index}][id]`, String(item.id));
        formData.append(`items[${index}][quantity]`, String(item.quantity));
        if (item.selected_addons && item.selected_addons.length > 0) {
          formData.append(`items[${index}][selected_addons]`, JSON.stringify(item.selected_addons));
        }
      });
    }

    router.post('/pos', formData, {
      forceFormData: true,
      onSuccess: async (page) => {
        setIsSubmitting(false);
        const flash = (page.props as unknown as { flash?: { print_job?: LocalPrintJobPayload; success?: string } })?.flash;
        const printJob = flash?.print_job;
        const sale = ((page.props as unknown) as { recentOrders?: Record<string, unknown>[] }).recentOrders?.[0] || null;
        const orderNum = printJob?.order_number || (sale?.order_number as string) || 'POS-ORDER';

        // 1. Immediately reset cart and kiosk view to ready state
        setCart([]);
        setActiveDiscount(null);
        setCashReceived('');
        setProofFile(null);
        setDeliveryInfo(prev => ({
          ...prev,
          customer_name: '',
          customer_phone: '',
          customer_address: '',
          rider_id: '',
          tracking_number: '',
          distance_km: '',
          delivery_fee: 0,
          delivery_notes: '',
          external_notes: ''
        }));
        setKioskStep('browse');
        setOrderType('dine-in');

        // 2. Dispatch silent print to local thermal bridge if connected
        if (printJob && printJob.raw_escpos_base64 && isPrinterReady) {
          const printResult = await sendToLocalPrintBridge(printJob);
          if (printResult.success) {
            toast.success(`✓ Order #${orderNum} Completed (Receipt printed)`, {
              duration: 3500,
            });
          } else {
            toast.warning(`✓ Order #${orderNum} Completed (Printer offline)`, {
              description: 'Order saved successfully.',
              duration: 4000,
            });
          }
        } else {
          toast.success(`✓ Order #${orderNum} Completed`, {
            duration: 3500,
          });
        }
      },
      onError: (err: Record<string, string>) => {
        setIsSubmitting(false);
        const errMsg = err?.error || Object.values(err)[0] || 'Something went wrong during checkout. Please try again.';
        setAlertModal({ type: 'error', title: 'Checkout Failed', message: String(errMsg) });
        setIsAlertModalOpen(true);
      },
      onFinish: () => {
        setIsSubmitting(false);
      }
    });
  };

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('donburi') || lower.includes('rice')) return '🍱';
    if (lower.includes('maki') || lower.includes('roll')) return '🍣';
    if (lower.includes('ramen') || lower.includes('noodle')) return '🍜';
    if (lower.includes('sashimi') || lower.includes('nigiri')) return '🥢';
    if (lower.includes('side') || lower.includes('appetizer')) return '🍟';
    if (lower.includes('drink') || lower.includes('beverage')) return '🍹';
    if (lower.includes('dessert')) return '🍡';
    return '🍙';
  };

  return (
    <AppLayout breadcrumbs={[{ title: 'POS Kiosk', href: '/pos' }]} hideFloatingBell={true}>
      <Head title="Point of Sale Kiosk" />

      {/* Main Kiosk Container: Responsive Light & Dark Mode */}
      <div className="flex flex-col h-screen overflow-hidden bg-[#FFFDFE] dark:bg-[#0F0F11] text-[#3D2C2E] dark:text-zinc-100 font-['Outfit',sans-serif] antialiased transition-colors duration-300 relative selection:bg-[#E75480]/20">
        
        {/* TOP KIOSK HEADER */}
        <header className="h-16 px-4 sm:px-6 border-b border-[#F8C8DC]/60 dark:border-[#26262A] bg-white/90 dark:bg-[#171719]/90 backdrop-blur-xl flex items-center justify-between z-20 shrink-0 gap-4 transition-colors">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-[#E75480] text-white flex items-center justify-center font-black shadow-md shadow-[#E75480]/20">
              POS
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-[#3D2C2E] dark:text-white uppercase">
                {branch?.name || 'Maki Desu Victoria'}
              </h1>
              <p className="text-[10px] font-bold text-[#E75480] uppercase tracking-widest">
                {kioskStep === 'browse' ? 'PRODUCT CATALOG' : kioskStep === 'review' ? 'ORDER REVIEW' : 'CHECKOUT'}
              </p>
            </div>
          </div>

          {/* Operational Shift & Notification Controls */}
          <div className="flex items-center gap-3">
            {activeShift && (
              <div className="flex items-center gap-2 bg-[#FFF5F7] dark:bg-[#1E1E21] p-1.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-[#26262A]">
                <div className="px-3 py-0.5 flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#7D6B6E] dark:text-zinc-400">Shift Cash</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(activeShift.expected_balance || 0)}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-xl text-xs gap-1.5 border-[#F8C8DC]/60 dark:border-[#26262A] bg-white dark:bg-[#26262A] text-[#3D2C2E] dark:text-zinc-200 hover:bg-[#FFF5F7] dark:hover:bg-zinc-800"
                  onClick={() => setIsAdjustmentModalOpen(true)}
                >
                  <FiActivity className="size-3.5 text-[#E75480]" />
                  <span className="hidden sm:inline">Adjust</span>
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="h-8 rounded-xl text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                  onClick={() => setIsCloseShiftModalOpen(true)}
                >
                  <FiLock className="size-3.5" />
                  <span className="hidden sm:inline">End Shift</span>
                </Button>
              </div>
            )}
            {/* Printer Bridge Status Indicator */}
            <button
              type="button"
              onClick={() => checkPrinterNow()}
              title={isPrinterReady ? "Thermal Printer Ready" : "Thermal Print Bridge Offline - Click to re-check"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer",
                isPrinterReady
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 animate-pulse"
              )}
            >
              <span className={cn("size-2 rounded-full", isPrinterReady ? "bg-emerald-500" : "bg-amber-500")} />
              <FiPrinter className="size-3.5 text-[#E75480] dark:text-[#FF4F81]" />
              <span className="hidden md:inline font-extrabold">{isPrinterReady ? "Printer Ready" : "Printer Offline"}</span>
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* MAIN KIOSK CONTENT CONTAINER */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* ========================================================================= */}
          {/* STEP 1: FULL-WIDTH PRODUCT CATALOG SCREEN (NO PERMANENT RIGHT CART) */}
          {/* ========================================================================= */}
          {kioskStep === 'browse' && (
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden relative">
              
              {/* Compact Category Navigation Rail (Desktop) */}
              <div className="hidden lg:flex w-28 shrink-0 flex-col items-center py-4 gap-3 bg-white dark:bg-[#171719] border-r border-[#F8C8DC]/60 dark:border-[#26262A] z-10 transition-colors">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "w-22 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 border text-center cursor-pointer",
                    selectedCategory === null 
                      ? "bg-[#E75480] text-white border-[#E75480] shadow-md shadow-[#E75480]/20 font-bold" 
                      : "bg-[#FFF5F7] dark:bg-[#1E1E21] text-[#7D6B6E] dark:text-zinc-400 border-[#F8C8DC]/60 dark:border-[#26262A] hover:bg-[#FFF5F7]/80 dark:hover:bg-[#26262A] hover:text-[#E75480] dark:hover:text-white"
                  )}
                >
                  <span className="text-xl">🍱</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">ALL</span>
                </button>

                <div className="w-12 h-px bg-[#F8C8DC]/60 dark:bg-[#26262A] my-1" />

                <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-3 scrollbar-hide px-2">
                  {categories.map((c: Category) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={cn(
                        "w-22 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all duration-200 border text-center cursor-pointer",
                        selectedCategory === c.id 
                          ? "bg-[#E75480] text-white border-[#E75480] shadow-md shadow-[#E75480]/20 font-bold" 
                          : "bg-[#FFF5F7] dark:bg-[#1E1E21] text-[#7D6B6E] dark:text-zinc-400 border-[#F8C8DC]/60 dark:border-[#26262A] hover:bg-[#FFF5F7]/80 dark:hover:bg-[#26262A] hover:text-[#E75480] dark:hover:text-white"
                      )}
                    >
                      <span className="text-xl">{getCategoryIcon(c.name)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider line-clamp-2 w-full px-1">
                        {c.name.replace('& NOODLES', '').replace('& BEVERAGES', '').replace('& NIGIRI', '')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Center Main Product Grid & Search */}
              <div className="flex-1 flex flex-col min-w-0 bg-[#FFFDFE] dark:bg-[#0F0F11] overflow-hidden relative transition-colors">
                
                {/* Search Bar Container */}
                <div className="p-4 sm:px-6 border-b border-[#F8C8DC]/60 dark:border-[#26262A] flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/70 dark:bg-[#171719]/50 shrink-0">
                  <div className="relative w-full sm:w-96 group">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7D6B6E] dark:text-zinc-400 size-4 group-focus-within:text-[#E75480] transition-colors" />
                    <Input
                      placeholder="🔍 Search products or scan SKU..."
                      className="pl-11 h-12 bg-white dark:bg-[#1E1E21] border border-[#F8C8DC]/60 dark:border-[#26262A] rounded-2xl text-[#3D2C2E] dark:text-white placeholder:text-[#7D6B6E]/70 dark:placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[#E75480]/30 focus-visible:border-[#E75480] transition-all text-sm font-medium shadow-2xs"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  {/* Category Pills (Mobile & Tablet) */}
                  <div className="lg:hidden w-full flex gap-2 overflow-x-auto scrollbar-hide py-1 shrink-0">
                    <Button 
                      variant={selectedCategory === null ? "default" : "outline"} 
                      size="sm" 
                      className={cn("rounded-xl px-4 h-9 text-xs font-bold uppercase shrink-0 border-[#F8C8DC]/60 dark:border-[#26262A]", selectedCategory === null && "bg-[#E75480] text-white")}
                      onClick={() => setSelectedCategory(null)}
                    >
                      All
                    </Button>
                    {categories.map((c: Category) => (
                      <Button 
                        key={c.id}
                        variant={selectedCategory === c.id ? "default" : "outline"} 
                        size="sm" 
                        className={cn("rounded-xl px-4 h-9 text-xs font-bold uppercase shrink-0 border-[#F8C8DC]/60 dark:border-[#26262A]", selectedCategory === c.id && "bg-[#E75480] text-white")}
                        onClick={() => setSelectedCategory(c.id)}
                      >
                        {c.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* RESPONSIVE PRODUCT CATALOG GRID (5 cols desktop, 4 md, 3 sm, 2 xs) */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 scrollbar-hide pb-28">
                  <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                      {filteredProducts.map((p: Product) => {
                        const inCartCount = cart.find(i => i.id === p.id)?.quantity || 0;
                        const isOutOfStock = p.stock <= 0;
                        const isLowStock = p.stock > 0 && (p.stock <= 5 || p.is_low_stock);

                        return (
                          <motion.div
                            key={p.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            whileHover={!isOutOfStock ? { y: -4 } : {}}
                            whileTap={!isOutOfStock ? { scale: 0.98 } : {}}
                            onClick={() => addToCart(p)}
                            className={cn(
                              "group flex flex-col bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] rounded-2xl cursor-pointer shadow-[0_4px_20px_-4px_rgba(231,84,128,0.08)] dark:shadow-md hover:shadow-lg hover:border-[#E75480]/60 transition-all duration-200 overflow-hidden relative",
                              isOutOfStock && "opacity-50 grayscale pointer-events-none"
                            )}
                          >
                            {/* Product Image Area (Aspect 4/3, fixed) */}
                            <div className="relative aspect-4/3 rounded-t-2xl overflow-hidden bg-[#FFF5F7] dark:bg-[#1E1E21] shrink-0 border-b border-[#F8C8DC]/40 dark:border-[#26262A] flex items-center justify-center">
                              <ImageWithFallback
                                src={p.image_url}
                                alt={p.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 relative z-10"
                                fallbackIcon={<FiPackage className="size-8 text-zinc-400 opacity-40" />}
                              />

                              {/* Cart Count Overlay Badge */}
                              {inCartCount > 0 && (
                                <div className="absolute top-2 left-2 bg-[#E75480] text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                                  <FiShoppingCart className="size-3" />
                                  <span>{inCartCount} in cart</span>
                                </div>
                              )}

                              {/* Stock Status Badge */}
                              <div className="absolute top-2 right-2">
                                {isOutOfStock ? (
                                  <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                                    SOLD OUT
                                  </span>
                                ) : isLowStock ? (
                                  <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                                    LOW STOCK ({p.stock})
                                  </span>
                                ) : (
                                  <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-md">
                                    AVAILABLE
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Product Info Section */}
                            <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                              <div>
                                <h3 className="text-[#3D2C2E] dark:text-zinc-100 font-bold text-xs sm:text-sm line-clamp-1 leading-tight group-hover:text-[#E75480] transition-colors">
                                  {p.name}
                                </h3>
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <span className="text-[10px] font-semibold text-[#7D6B6E] dark:text-zinc-500 block">
                                    SKU: {p.sku || `PROD-${p.id}`}
                                  </span>
                                  {((p.addon_groups && p.addon_groups.length > 0) || (p.available_addons && p.available_addons.length > 0)) && (
                                    <span className="text-[9px] font-bold text-[#E75480] bg-[#FFF5F7] dark:bg-[#E75480]/15 px-1.5 py-0.5 rounded border border-[#F8C8DC]/60 dark:border-[#E75480]/30 shrink-0">
                                      + Customizations
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Price & Add Button Row */}
                              <div className="flex items-center justify-between border-t border-[#F8C8DC]/40 dark:border-[#26262A] pt-2.5 mt-auto">
                                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                  {formatCurrency(p.selling_price)}
                                </span>

                                <Button
                                  size="icon"
                                  className="size-9 rounded-xl bg-[#E75480] hover:bg-[#E75480]/90 text-white shadow-md active:scale-95 transition-all"
                                  disabled={isOutOfStock}
                                >
                                  <FiPlus className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                      {filteredProducts.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-[#7D6B6E] dark:text-zinc-500 gap-3">
                          <FiPackage className="size-10 opacity-30" />
                          <p className="text-xs font-bold tracking-wider uppercase text-[#7D6B6E] dark:text-zinc-400">No products match search criteria</p>
                        </div>
                      )}
                    </div>
                  </AnimatePresence>
                </div>

                {/* FLOATING STICKY ORDER BUTTON (Bottom-Right Badge) */}
                <AnimatePresence>
                  {cart.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 50, scale: 0.95 }}
                      className="fixed bottom-6 right-6 left-6 lg:left-auto lg:w-96 bg-white/95 dark:bg-[#171719]/95 border-2 border-[#E75480] rounded-2xl p-4 shadow-2xl backdrop-blur-2xl z-30 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-11 rounded-xl bg-[#E75480] text-white flex items-center justify-center font-bold text-base shadow shrink-0">
                          <FiShoppingCart className="size-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-[#7D6B6E] dark:text-zinc-400 uppercase tracking-wider">
                            🛒 {cartTotalItems} {cartTotalItems === 1 ? 'ITEM' : 'ITEMS'}
                          </p>
                          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 truncate">
                            {formatCurrency(cartSubtotal)}
                          </p>
                        </div>
                      </div>

                      <Button
                        size="lg"
                        className="h-12 px-5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E75480] hover:bg-[#E75480]/90 text-white shadow-lg flex items-center gap-2 shrink-0 active:scale-95 transition-all"
                        onClick={() => setKioskStep('review')}
                      >
                        <span>VIEW ORDER</span>
                        <FiChevronRight className="size-4" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: DEDICATED ORDER REVIEW SCREEN */}
          {/* ========================================================================= */}
          {kioskStep === 'review' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col h-full bg-[#FFFDFE] dark:bg-[#0F0F11] overflow-hidden transition-colors"
            >
              {/* Review Header */}
              <div className="p-4 sm:px-6 py-4 border-b border-[#F8C8DC]/60 dark:border-[#26262A] bg-white dark:bg-[#171719] flex items-center justify-between shrink-0">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] gap-2 text-[#3D2C2E] dark:text-zinc-300 hover:bg-[#FFF5F7] dark:hover:bg-[#26262A]"
                  onClick={() => setKioskStep('browse')}
                >
                  <FiArrowLeft className="size-4 text-[#E75480]" />
                  <span>ADD MORE ITEMS</span>
                </Button>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#3D2C2E] dark:text-white">YOUR ORDER</h2>
                  <p className="text-xs text-[#7D6B6E] dark:text-zinc-400 font-bold uppercase">{cartTotalItems} Items in Order</p>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl text-xs gap-1 font-bold"
                  onClick={() => setCart([])}
                >
                  <FiTrash2 className="size-4" /> Clear Cart
                </Button>
              </div>

              {/* Review Content */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 scrollbar-hide pb-28">
                {/* Left: Cart Items List */}
                <div className="lg:col-span-8 space-y-4">
                  {cart.map((item, cartIndex) => (
                    <div 
                      key={`${item.id}_${cartIndex}`}
                      className="p-4 rounded-2xl bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="size-16 rounded-xl overflow-hidden bg-[#FFF5F7] dark:bg-[#1E1E21] border border-[#F8C8DC]/40 dark:border-[#26262A] shrink-0 flex items-center justify-center relative">
                          <ImageWithFallback
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover relative z-10"
                            fallbackIcon={<FiPackage className="size-6 text-zinc-400 opacity-50" />}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold uppercase text-[#3D2C2E] dark:text-white tracking-tight">{item.name}</h4>
                          <p className="text-xs font-medium text-[#7D6B6E] dark:text-zinc-400 mt-0.5">Base: {formatCurrency(item.selling_price)}</p>
                          
                          {/* Modifiers Sub-lines */}
                          {item.selected_addons && item.selected_addons.length > 0 && (
                            <div className="mt-2 space-y-1 pl-2.5 border-l-2 border-[#E75480]/60 dark:border-[#FF4F81]/60">
                              {item.selected_addons.map((ad, idx) => (
                                <div key={idx} className="text-xs font-bold text-[#E75480] dark:text-[#FF4F81] flex items-center gap-2">
                                  <span>+ {ad.name} {ad.quantity && ad.quantity > 1 ? `(${ad.quantity}x)` : ''}</span>
                                  <span className="text-muted-foreground font-normal text-[11px]">+{formatCurrency(ad.price * (ad.quantity || 1))}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const prod = products.find(p => p.id === item.id) || item;
                                setModifierProduct(prod);
                              }}
                              className="text-[11px] font-extrabold text-[#E75480] hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>⚙ Customize</span>
                            </button>
                            <span className="text-[#7D6B6E]/40">•</span>
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              Subtotal: {formatCurrency(((item.selling_price + (item.selected_addons || []).reduce((aSum, a) => aSum + (a.price * (a.quantity || 1)), 0))) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between w-full sm:w-auto border-t sm:border-t-0 border-[#F8C8DC]/40 dark:border-[#26262A] pt-3 sm:pt-0 gap-4">
                        {/* Quantity Controls */}
                        <div className="flex items-center bg-[#FFF5F7] dark:bg-[#1E1E21] rounded-xl border border-[#F8C8DC]/60 dark:border-[#26262A] p-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300"
                            onClick={() => updateQuantity(cartIndex, -1)}
                          >
                            <FiMinus className="size-3.5" />
                          </Button>
                          <span className="w-8 text-center font-extrabold text-sm text-[#3D2C2E] dark:text-white">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="size-8 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300"
                            onClick={() => updateQuantity(cartIndex, 1)}
                          >
                            <FiPlus className="size-3.5" />
                          </Button>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-9 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => removeFromCart(cartIndex)}
                        >
                          <FiTrash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-[#F8C8DC]/60 dark:border-[#26262A] rounded-2xl text-center space-y-4">
                      <FiShoppingCart className="size-10 text-[#7D6B6E] dark:text-zinc-600 mx-auto" />
                      <p className="text-[#7D6B6E] dark:text-zinc-400 text-xs font-bold uppercase">Your order is empty</p>
                      <Button className="rounded-xl bg-[#E75480] text-white" onClick={() => setKioskStep('browse')}>Browse Products</Button>
                    </div>
                  )}
                </div>

                {/* Right: Summary & Order Settings */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] space-y-4 shadow-2xs">
                    <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 block">Order Settings</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-[#FFF5F7] dark:bg-[#1E1E21] rounded-xl border border-[#F8C8DC]/40 dark:border-[#26262A]">
                      {['dine-in', 'take-out', 'delivery'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setOrderType(type)}
                          className={cn(
                            "py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all cursor-pointer",
                            orderType === type 
                              ? "bg-[#E75480] text-white shadow-xs" 
                              : "text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white"
                          )}
                        >
                          {type.replace('-', ' ')}
                        </button>
                      ))}
                    </div>

                    {/* Delivery Form */}
                    {orderType === 'delivery' && (
                      <div className="pt-3 border-t border-[#F8C8DC]/40 dark:border-[#26262A]">
                        <PosDeliverySection
                          deliveryInfo={deliveryInfo}
                          onChange={setDeliveryInfo}
                          onDeliveryFeeChange={(fee) => setCalculatedDeliveryFee(fee)}
                          branch={branch}
                        />
                      </div>
                    )}
                  </div>

                  {/* Discount Trigger Card */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                        activeDiscount
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : "bg-[#FFF5F7] dark:bg-[#1E1E21] text-[#E75480] dark:text-[#FF4F81] border-[#F8C8DC]/60 dark:border-white/10"
                      )}>
                        <Tag className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-extrabold uppercase text-[#3D2C2E] dark:text-white truncate">
                            {activeDiscount ? activeDiscount.typeName : 'Customer Discount'}
                          </h4>
                          {activeDiscount && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7D6B6E] dark:text-zinc-400 truncate">
                          {activeDiscount
                            ? (activeDiscount.customerName ? `${activeDiscount.customerName} • ${activeDiscount.idNumber}` : `-${formatCurrency(discountAmount)} applied`)
                            : 'Senior, PWD, Solo Parent, Employee'}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsDiscountModalOpen(true)}
                      className="h-8 px-3 rounded-xl border-[#E75480]/40 text-[#E75480] hover:bg-[#E75480] hover:text-white font-bold text-xs cursor-pointer shrink-0 transition-all"
                    >
                      {activeDiscount ? 'EDIT DISCOUNT' : '+ APPLY DISCOUNT'}
                    </Button>
                  </div>

                  {/* Summary Card */}
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] space-y-3 shadow-2xs">
                    <h3 className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Order Totals</h3>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-[#7D6B6E] dark:text-zinc-300">
                        <span>Base Subtotal</span>
                        <span className="font-extrabold text-[#3D2C2E] dark:text-white">{formatCurrency(cartBaseSubtotal)}</span>
                      </div>

                      {cartAddonsTotal > 0 && (
                        <div className="flex justify-between text-[#E75480] dark:text-[#FF4F81] font-semibold">
                          <span>Add-ons Total</span>
                          <span className="font-extrabold">+{formatCurrency(cartAddonsTotal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-[#7D6B6E] dark:text-zinc-300 font-bold">
                        <span>Subtotal</span>
                        <span className="font-extrabold text-[#3D2C2E] dark:text-white">{formatCurrency(cartSubtotal)}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                          <span className="flex items-center gap-1">
                            <Tag className="size-3" />
                            <span>Discount ({activeDiscount?.typeName || 'Applied'})</span>
                          </span>
                          <span className="font-mono font-extrabold">-{formatCurrency(discountAmount)}</span>
                        </div>
                      )}

                      {orderType === 'delivery' && (
                        <div className="flex justify-between text-[#7D6B6E] dark:text-zinc-300">
                          <span>Delivery Fee</span>
                          <span className="font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(deliveryFee)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-black pt-3 border-t border-[#F8C8DC]/40 dark:border-[#26262A] text-[#3D2C2E] dark:text-white">
                        <span>TOTAL</span>
                        <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(cartTotal)}</span>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full h-13 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#E75480] hover:bg-[#E75480]/90 text-white shadow-md mt-4 active:scale-95 transition-all cursor-pointer"
                      disabled={cart.length === 0}
                      onClick={handleProceedToCheckout}
                    >
                      PROCEED TO CHECKOUT →
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: DEDICATED CHECKOUT SCREEN */}
          {/* ========================================================================= */}
          {kioskStep === 'checkout' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex-1 flex flex-col h-full bg-[#FFFDFE] dark:bg-[#0F0F11] overflow-hidden transition-colors"
            >
              {/* Header */}
              <div className="p-4 sm:px-6 py-4 border-b border-[#F8C8DC]/60 dark:border-[#26262A] bg-white dark:bg-[#171719] flex items-center justify-between shrink-0">
                <Button 
                  variant="outline" 
                  className="rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] gap-2 text-[#3D2C2E] dark:text-zinc-300 hover:bg-[#FFF5F7] dark:hover:bg-[#26262A]"
                  onClick={() => setKioskStep('review')}
                >
                  <FiArrowLeft className="size-4 text-[#E75480]" />
                  <span>BACK TO ORDER</span>
                </Button>
                <div className="text-center">
                  <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#3D2C2E] dark:text-white">CHECKOUT</h2>
                  <p className="text-xs text-[#7D6B6E] dark:text-zinc-400 font-bold uppercase">Select payment method below</p>
                </div>
                <div className="w-24" />
              </div>

              {/* Checkout Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full space-y-6 scrollbar-hide pb-28">
                {/* Total Banner */}
                <div className="p-6 rounded-2xl bg-white dark:bg-[#171719] border-2 border-[#E75480]/50 text-center shadow-md relative overflow-hidden space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#E75480]">ORDER TOTAL</span>
                  <h2 className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {formatCurrency(cartTotal)}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <span className="text-xs text-[#7D6B6E] dark:text-zinc-400 font-bold uppercase tracking-wider">
                      {cartTotalItems} Items • {orderType.toUpperCase()}
                    </span>
                    {discountAmount > 0 && activeDiscount && (
                      <button
                        type="button"
                        onClick={() => setIsDiscountModalOpen(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        <Tag className="size-3" />
                        <span>-{formatCurrency(discountAmount)} ({activeDiscount.typeName})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 block">Payment Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'cash', label: 'CASH', icon: FiDollarSign, desc: 'Pay with cash bill' },
                      { id: 'card', label: 'CARD', icon: FiCreditCard, desc: 'Credit / Debit terminal' },
                      { id: 'e-wallet', label: 'E-WALLET', icon: FiSmartphone, desc: 'GCash / PayMaya QR' },
                    ].map(pm => {
                      const Icon = pm.icon;
                      const isSelected = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          onClick={() => setPaymentMethod(pm.id)}
                          className={cn(
                            "p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all cursor-pointer",
                            isSelected 
                              ? "bg-[#FFF5F7] dark:bg-[#E75480]/15 border-[#E75480] text-[#3D2C2E] dark:text-white shadow-xs font-bold" 
                              : "bg-white dark:bg-[#171719] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#7D6B6E] dark:text-zinc-400 hover:border-[#E75480]/40 hover:text-[#3D2C2E] dark:hover:text-white"
                          )}
                        >
                          <div className={cn(
                            "size-10 rounded-xl flex items-center justify-center transition-all",
                            isSelected ? "bg-[#E75480] text-white" : "bg-[#FFF5F7] dark:bg-[#1E1E21] text-[#E75480] dark:text-zinc-400"
                          )}>
                            <Icon className="size-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-wider">{pm.label}</h4>
                            <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-500 font-medium mt-0.5">{pm.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash Details */}
                {paymentMethod === 'cash' && (
                  <div className="p-5 rounded-2xl bg-white dark:bg-[#171719] border border-[#F8C8DC]/60 dark:border-[#26262A] space-y-5 shadow-2xs">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-300">Amount Received</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl text-[#7D6B6E] dark:text-zinc-400">₱</span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="pl-10 h-14 text-2xl font-black rounded-xl bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-emerald-600 dark:text-emerald-400 placeholder:text-[#7D6B6E]/50 focus-visible:ring-2 focus-visible:ring-[#E75480]/30"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Quick Tender Presets */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-500">Quick Amount Tender</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { label: 'Exact', val: cartTotal },
                          { label: '₱500', val: 500 },
                          { label: '₱1,000', val: 1000 },
                          { label: '₱2,000', val: 2000 },
                        ].map((preset, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            className="h-11 rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] bg-[#FFF5F7] dark:bg-[#1E1E21] text-xs font-bold text-[#3D2C2E] dark:text-white hover:bg-[#E75480] hover:text-white transition-all"
                            onClick={() => setCashReceived(String(preset.val))}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Change Indicator */}
                    <div className="p-3.5 rounded-xl bg-[#FFF5F7] dark:bg-[#1E1E21] border border-[#F8C8DC]/60 dark:border-[#26262A] flex items-center justify-between">
                      <span className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Change</span>
                      <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(changeDue)}</span>
                    </div>
                  </div>
                )}

                {/* Non-Cash Instructions */}
                {paymentMethod !== 'cash' && (
                  <div className="p-8 border-2 border-dashed border-[#F8C8DC]/60 dark:border-[#26262A] rounded-2xl flex flex-col items-center justify-center text-center gap-2 text-[#7D6B6E] dark:text-zinc-400">
                    <FiCreditCard className="size-10 text-[#E75480]" />
                    <h4 className="font-bold text-[#3D2C2E] dark:text-white text-sm uppercase">External Payment Terminal</h4>
                    <p className="text-xs text-[#7D6B6E] dark:text-zinc-500 font-medium">
                      Please process payment of <strong className="text-[#3D2C2E] dark:text-white">{formatCurrency(cartTotal)}</strong> on the payment terminal. Click Complete Order below once processed.
                    </p>
                  </div>
                )}

                {/* Complete Order Action */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="h-13 flex-1 rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] text-xs font-bold uppercase text-[#3D2C2E] dark:text-zinc-300 bg-white dark:bg-[#1E1E21]"
                    onClick={() => setKioskStep('review')}
                  >
                    Go Back
                  </Button>
                  <Button
                    className="h-13 flex-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md disabled:opacity-50 cursor-pointer"
                    disabled={isSubmitting || (paymentMethod === 'cash' && (!cashReceived || parseFloat(cashReceived) < cartTotal))}
                    onClick={confirmPayment}
                  >
                    {isSubmitting ? 'Processing...' : 'COMPLETE ORDER'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Result Modal (Errors/Warnings) */}
        <ResultModal
          open={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          type={alertModal.type}
          title={alertModal.title}
          message={alertModal.message}
        />

        {/* Opening Shift Modal */}
        <Dialog open={isShiftModalOpen} onOpenChange={() => {}}>
          <DialogContent className="max-w-md bg-white dark:bg-[#171719] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <div className="size-14 rounded-full bg-[#FFF5F7] dark:bg-[#E75480]/20 text-[#E75480] flex items-center justify-center mb-3 mx-auto border border-[#F8C8DC]/60 dark:border-[#E75480]/30">
                <FiUnlock className="size-7" />
              </div>
              <DialogTitle className="text-center text-xl font-extrabold text-[#3D2C2E] dark:text-white">Open Cashier Shift</DialogTitle>
              <DialogDescription className="text-center text-[#7D6B6E] dark:text-zinc-400 text-xs font-medium">
                Enter initial cash balance in your drawer to start shift.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Opening Cash</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#7D6B6E] dark:text-zinc-400">₱</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10 h-13 text-xl font-black rounded-xl bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white"
                    value={openingCash}
                    onChange={(e) => setOpeningCash(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {[100, 500, 1000, 2000].map(amount => (
                  <Button 
                    key={amount} 
                    variant="outline" 
                    className="h-11 rounded-xl font-bold border-[#F8C8DC]/60 dark:border-[#26262A] bg-[#FFF5F7] dark:bg-[#1E1E21] text-[#3D2C2E] dark:text-white hover:bg-[#E75480] hover:text-white"
                    onClick={() => setOpeningCash(String(amount))}
                  >
                    ₱{amount}
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button 
                className="w-full h-13 text-xs font-bold uppercase tracking-wider rounded-xl bg-[#E75480] text-white shadow-md cursor-pointer"
                onClick={handleOpenShift}
                disabled={!openingCash || parseFloat(openingCash) < 0}
              >
                Start Shift
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Close Shift Modal */}
        <Dialog open={isCloseShiftModalOpen} onOpenChange={setIsCloseShiftModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-[#171719] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white">
            <DialogHeader>
              <div className="size-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 mx-auto border border-rose-200 dark:border-rose-800/40">
                <FiLock className="size-7" />
              </div>
              <DialogTitle className="text-center text-xl font-extrabold text-[#3D2C2E] dark:text-white">End Cashier Shift</DialogTitle>
              <DialogDescription className="text-center text-[#7D6B6E] dark:text-zinc-400 text-xs font-medium">
                Count actual cash in drawer for shift reconciliation.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#FFF5F7] dark:bg-[#1E1E21] rounded-xl border border-[#F8C8DC]/60 dark:border-[#26262A] text-center">
                  <p className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 mb-0.5">Expected</p>
                  <p className="text-base font-extrabold text-[#3D2C2E] dark:text-white">{formatCurrency(activeShift?.expected_balance || 0)}</p>
                </div>
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-center">
                  <p className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400 mb-0.5">Cash Sales</p>
                  <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(activeShift?.total_cash_sales || 0)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Actual Cash Count</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#7D6B6E] dark:text-zinc-400">₱</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10 h-13 text-xl font-black rounded-xl bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white"
                    value={closingCash}
                    onChange={(e) => setClosingCash(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              {closingCash && (parseFloat(closingCash) - (activeShift?.expected_balance || 0)) !== 0 && (
                <div className="space-y-3">
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center justify-between text-xs font-bold",
                    (parseFloat(closingCash) - (activeShift?.expected_balance || 0)) > 0 
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400" 
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400"
                  )}>
                    <span className="uppercase">
                      {(parseFloat(closingCash) - (activeShift?.expected_balance || 0)) > 0 ? "Overage" : "Shortage"} Detected
                    </span>
                    <span className="text-base font-extrabold">
                      {formatCurrency(Math.abs(parseFloat(closingCash) - (activeShift?.expected_balance || 0)))}
                    </span>
                  </div>
                  
                  <Input
                    placeholder="Explain variance..."
                    className="rounded-xl h-11 bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white text-xs"
                    value={varianceReason}
                    onChange={(e) => setVarianceReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                className="h-11 rounded-xl font-bold border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-zinc-300 bg-[#FFF5F7] dark:bg-[#1E1E21]" 
                onClick={() => setIsCloseShiftModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="h-11 flex-1 text-xs font-bold uppercase rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer"
                onClick={handleCloseShift}
                disabled={!closingCash || ((parseFloat(closingCash) - (activeShift?.expected_balance || 0)) !== 0 && !varianceReason)}
              >
                Close Cash Drawer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Adjustment Modal */}
        <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
          <DialogContent className="max-w-md bg-white dark:bg-[#171719] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#3D2C2E] dark:text-white">Add/Remove Cash</DialogTitle>
              <DialogDescription className="text-[#7D6B6E] dark:text-zinc-400 text-xs font-medium">Record cash added to or taken from drawer.</DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              <div className="flex p-1 bg-[#FFF5F7] dark:bg-[#1E1E21] rounded-xl border border-[#F8C8DC]/40 dark:border-[#26262A] relative">
                {(['in', 'out'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAdjustmentType(type)}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-xs font-bold uppercase transition-all z-10 cursor-pointer",
                      adjustmentType === type ? "text-white bg-[#E75480] shadow-xs" : "text-[#7D6B6E] dark:text-zinc-400"
                    )}
                  >
                    Cash {type.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[#7D6B6E] dark:text-zinc-400">₱</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-10 h-12 text-xl font-bold rounded-xl bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white"
                      value={adjustmentAmount}
                      onChange={(e) => setAdjustmentAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">Notes / Reason</label>
                  <Input
                    placeholder="e.g. For office supplies..."
                    className="rounded-xl h-11 bg-[#FFF5F7] dark:bg-[#1E1E21] border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-white text-xs"
                    value={adjustmentNotes}
                    onChange={(e) => setAdjustmentNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" className="h-11 rounded-xl border-[#F8C8DC]/60 dark:border-[#26262A] text-[#3D2C2E] dark:text-zinc-300 bg-[#FFF5F7] dark:bg-[#1E1E21]" onClick={() => setIsAdjustmentModalOpen(false)}>Cancel</Button>
              <Button 
                className={cn(
                  "h-11 flex-1 rounded-xl font-bold uppercase text-white text-xs cursor-pointer shadow-md",
                  adjustmentType === 'in' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                )}
                onClick={handleAdjustment}
                disabled={!adjustmentAmount || !adjustmentNotes}
              >
                Confirm Cash {adjustmentType === 'in' ? 'Added' : 'Removed'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Apply Discount Modal */}
        <ApplyDiscountModal
          open={isDiscountModalOpen}
          onClose={() => setIsDiscountModalOpen(false)}
          cart={cart}
          currentDiscount={activeDiscount}
          onApplyDiscount={(discount) => {
            setActiveDiscount(discount);
            toast.success(`Applied ${discount.typeName} (-${formatCurrency(discount.discountAmount)})`);
          }}
          onRemoveDiscount={() => {
            setActiveDiscount(null);
            toast.info('Discount removed.');
          }}
        />

        {/* Advanced Modifier & Add-ons Selection Modal */}
        <ProductModifierModal
          isOpen={!!modifierProduct}
          onClose={() => setModifierProduct(null)}
          product={modifierProduct}
          onConfirm={handleConfirmModifierProduct}
        />
      </div>
    </AppLayout>
  );
}
