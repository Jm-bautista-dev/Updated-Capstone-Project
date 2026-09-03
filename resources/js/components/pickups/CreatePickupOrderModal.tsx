import { router } from '@inertiajs/react';
import axios from 'axios';
import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isBefore,
    isSameDay,
    isSameMonth,
    isToday,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    ChefHat,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    DollarSign,
    MessageCircle,
    Minus,
    Plus,
    Search,
    ShoppingBag,
    Store,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency, cn } from '@/lib/utils';

export interface PickupBranch {
    id: number;
    name: string;
    address: string;
    pickup_opening_time?: string;
    pickup_closing_time?: string;
    pickup_lead_time_minutes?: number;
    pickup_slot_interval_minutes?: number;
    pickup_max_orders_per_slot?: number;
    pickup_cutoff_before_close_minutes?: number;
}

export interface PickupProduct {
    id: number;
    name: string;
    selling_price: number;
    category: string;
    stock: number;
    image_url?: string | null;
}

export interface SelectedItem {
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url?: string | null;
}

export interface TimeSlot {
    time: string;
    display_time: string;
    datetime: string;
    datetime_raw: string;
    is_available: boolean;
    remaining_capacity: number;
    booked_count: number;
    is_asap?: boolean;
}

interface Props {
    open: boolean;
    onClose: () => void;
    branches: PickupBranch[];
    products: PickupProduct[];
    authBranchId?: number;
}

export default function CreatePickupOrderModal({
    open,
    onClose,
    branches,
    products,
    authBranchId,
}: Props) {
    // ── Form State ───────────────────────────────────────────────────────────
    const [customerName, setCustomerName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [orderSource, setOrderSource] = useState('facebook_messenger');
    const [sourceReference, setSourceReference] = useState('');

    // Default to authorized branch or first branch
    const [selectedBranchId, setSelectedBranchId] = useState<number>(() => {
        return authBranchId || branches[0]?.id || 1;
    });

    // Calendar & Time Slots
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSlotPickerExpanded, setIsSlotPickerExpanded] = useState(true);

    // Products & Cart
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [cartItems, setCartItems] = useState<SelectedItem[]>([]);

    // Notes & Payment
    const [pickupNotes, setPickupNotes] = useState('');
    const [internalNotes, setInternalNotes] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentStatus, setPaymentStatus] = useState('unpaid');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // ── Active Branch Settings ───────────────────────────────────────────────
    const activeBranch = useMemo(() => {
        return branches.find(b => b.id === selectedBranchId) || branches[0];
    }, [branches, selectedBranchId]);

    const leadTimeMinutes = activeBranch?.pickup_lead_time_minutes ?? 20;

    // ── Fetch Time Slots for Selected Date & Branch ──────────────────────────
    useEffect(() => {
        if (!open || !selectedBranchId) return;

        let isMounted = true;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        queueMicrotask(() => {
            if (isMounted) setIsLoadingSlots(true);
        });

        axios.get('/pickups/slots', {
            params: {
                branch_id: selectedBranchId,
                date: dateStr,
            }
        }).then(res => {
            if (!isMounted) return;
            if (res.data?.success && Array.isArray(res.data?.data?.slots)) {
                const fetchedSlots = res.data.data.slots as TimeSlot[];
                setTimeSlots(fetchedSlots);
                // Functional state update: safely preserve selected slot if still valid
                setSelectedSlot(prev => {
                    if (!prev) return null;
                    const match = fetchedSlots.find((s: TimeSlot) => s.time === prev.time);
                    if (!match || !match.is_available) {
                        return null;
                    }
                    return match;
                });
            } else {
                setTimeSlots([]);
                setSelectedSlot(null);
            }
        }).catch(err => {
            if (!isMounted) return;
            console.error('Failed to fetch pickup time slots', err);
            setTimeSlots([]);
        }).finally(() => {
            if (isMounted) setIsLoadingSlots(false);
        });

        return () => {
            isMounted = false;
        };
    }, [open, selectedBranchId, selectedDate]);

    // ── Reset Form when Modal Closes ─────────────────────────────────────────
    const handleClose = () => {
        setCustomerName('');
        setContactNumber('');
        setSourceReference('');
        setOrderSource('facebook_messenger');
        setCartItems([]);
        setSelectedSlot(null);
        setPickupNotes('');
        setInternalNotes('');
        setPaymentMethod('cash');
        setPaymentStatus('unpaid');
        setIsSlotPickerExpanded(true);
        onClose();
    };

    // ── Calendar Navigation & Generation ─────────────────────────────────────
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => {
        const prev = subMonths(currentMonth, 1);
        if (!isBefore(endOfMonth(prev), startOfDay(new Date()))) {
            setCurrentMonth(prev);
        }
    };

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    // ── Categories Extraction ────────────────────────────────────────────────
    const categories = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => {
            if (p.category) set.add(p.category);
        });
        return ['All', ...Array.from(set)];
    }, [products]);

    // ── Filtered Products ────────────────────────────────────────────────────
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
            const matchesSearch = !productSearch.trim() || 
                p.name.toLowerCase().includes(productSearch.toLowerCase().trim()) ||
                (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase().trim()));
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, productSearch]);

    // ── Cart Manipulations ───────────────────────────────────────────────────
    const handleAddToCart = (product: PickupProduct) => {
        if (product.stock <= 0) {
            toast.error(`${product.name} is currently out of stock.`);
            return;
        }

        setCartItems(prev => {
            const existing = prev.find(i => i.product_id === product.id);
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.warning(`Cannot exceed available stock (${product.stock}) for ${product.name}`);
                    return prev;
                }
                return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [
                ...prev,
                {
                    product_id: product.id,
                    name: product.name,
                    price: product.selling_price,
                    quantity: 1,
                    image_url: product.image_url,
                }
            ];
        });
    };

    const handleUpdateQuantity = (productId: number, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.product_id === productId) {
                const prod = products.find(p => p.id === productId);
                const maxStock = prod?.stock ?? 999;
                const newQty = item.quantity + delta;
                if (newQty > maxStock) {
                    toast.warning(`Cannot exceed available stock of ${maxStock}`);
                    return item;
                }
                return { ...item, quantity: Math.max(0, newQty) };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const handleRemoveItem = (productId: number) => {
        setCartItems(prev => prev.filter(i => i.product_id !== productId));
    };

    // ── Financial Totals ─────────────────────────────────────────────────────
    const cartTotalItems = useMemo(() => cartItems.reduce((acc, i) => acc + i.quantity, 0), [cartItems]);
    const cartTotalAmount = useMemo(() => cartItems.reduce((acc, i) => acc + (i.price * i.quantity), 0), [cartItems]);

    // ── Kitchen Preparation Time Calculation ─────────────────────────────────
    const kitchenPrepTime = useMemo(() => {
        if (!selectedSlot) return null;
        try {
            const slotDate = new Date(`${format(selectedDate, 'yyyy-MM-dd')}T${selectedSlot.time}:00`);
            const prepDate = new Date(slotDate.getTime() - (leadTimeMinutes * 60 * 1000));
            return format(prepDate, 'h:mm a');
        } catch {
            return null;
        }
    }, [selectedSlot, selectedDate, leadTimeMinutes]);

    // ── Form Validation ──────────────────────────────────────────────────────
    const isFormValid = useMemo(() => {
        return Boolean(
            customerName.trim() &&
            selectedBranchId &&
            selectedDate &&
            selectedSlot &&
            cartItems.length > 0 &&
            paymentMethod
        );
    }, [customerName, selectedBranchId, selectedDate, selectedSlot, cartItems.length, paymentMethod]);

    // ── Form Submission ──────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!customerName.trim()) {
            toast.error('Customer name is required.');
            return;
        }

        if (!selectedSlot) {
            toast.error('Please select an available pickup time slot.');
            return;
        }

        if (cartItems.length === 0) {
            toast.error('Please select at least one menu item.');
            return;
        }

        const scheduledDateTime = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedSlot.time}:00`;

        setIsSubmitting(true);

        router.post('/pickups/manual', {
            customer_name: customerName.trim(),
            contact_number: contactNumber.trim() || null,
            order_source: orderSource,
            source_reference: sourceReference.trim() || null,
            branch_id: selectedBranchId,
            scheduled_pickup_at: scheduledDateTime,
            estimated_prep_time_minutes: leadTimeMinutes,
            payment_method: paymentMethod,
            payment_status: paymentStatus,
            pickup_notes: pickupNotes.trim() || null,
            internal_notes: internalNotes.trim() || null,
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price,
            })),
            total_amount: cartTotalAmount,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pickup order created successfully!');
                handleClose();
            },
            onError: (errors) => {
                const firstErr = Object.values(errors)[0];
                toast.error(typeof firstErr === 'string' ? firstErr : 'Failed to create pickup order.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            {/* ── Widescreen POS Dialog Container (Section 2 & 17) ────────────── */}
            <DialogContent
                style={{ width: 'min(1400px, calc(100vw - 32px))', maxWidth: 'min(1400px, calc(100vw - 32px))', height: '92vh', maxHeight: '920px' }}
                className="flex! flex-col! p-0! gap-0! max-w-none! overflow-hidden bg-[#FAFAFA] dark:bg-[#101015] border border-[#F8C8DC]/60 dark:border-white/10 rounded-3xl font-['Outfit'] shadow-2xl"
            >
                
                {/* ── 1. Fixed Header (Section 15 & 17) ───────────────────────── */}
                <header className="px-6 py-4 border-b border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#14141C] shrink-0">
                    <div className="flex items-center gap-3.5">
                        <div className="size-11 rounded-2xl bg-linear-to-br from-[#E75480] to-[#D43B66] text-white flex items-center justify-center shadow-md shadow-[#E75480]/20 shrink-0">
                            <Store className="size-5.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <DialogTitle className="text-lg font-black uppercase tracking-tight text-[#3D2C2E] dark:text-white">
                                    Create Pickup Order
                                </DialogTitle>
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#E75480]/15 text-[#E75480] dark:text-[#FF4F81] border border-[#E75480]/30 tracking-wider">
                                    FB / Phone / Walk-in
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-[#7D6B6E] dark:text-zinc-400 font-medium">
                                High-efficiency order entry with live inventory & branch schedule validation.
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="size-9 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/5 flex items-center justify-center text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white transition-colors cursor-pointer"
                            aria-label="Close modal"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </header>

                {/* ── 2. Two-Column Scrollable Body (Sections 3, 4, 9) ───────── */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
                    
                    {/* ══════════════════════════════════════════════════════════
                        LEFT COLUMN: Product Catalog (65–70% width) + Notes + Payment
                        ══════════════════════════════════════════════════════════ */}
                    <div className="flex-1 min-w-0 overflow-y-auto p-5 sm:p-6 space-y-6 border-r border-[#F8C8DC]/40 dark:border-white/10 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                        
                        {/* ── SECTION A: Product Catalog (Section 4, 5, 6, 7, 8) ─── */}
                        <div className="bg-white dark:bg-[#16161E] p-5 sm:p-6 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-xl bg-[#FFF5F7] dark:bg-[#201D26] text-[#E75480] flex items-center justify-center border border-[#F8C8DC]/40 dark:border-white/5">
                                        <ShoppingBag className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-100">
                                            Product Catalog <span className="text-rose-500">*</span>
                                        </h3>
                                        <p className="text-[11px] text-[#7D6B6E] dark:text-zinc-400">
                                            Select products to add to this pickup order
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-xs font-bold text-[#7D6B6E] dark:text-zinc-400">
                                    <span className="px-2.5 py-1 rounded-full bg-[#FFF5F7] dark:bg-[#1F1E26] border border-[#F8C8DC]/40 dark:border-white/5 text-[11px]">
                                        {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} available
                                    </span>
                                </div>
                            </div>

                            {/* Full-width Search Bar (Section 7) */}
                            <div className="relative">
                                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D6B6E] dark:text-zinc-400 pointer-events-none" />
                                <Input
                                    placeholder="Search products by name or category..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="pl-10 pr-10 rounded-xl h-11 bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/70 dark:border-white/10 text-xs font-medium focus-visible:ring-[#E75480]"
                                />
                                {productSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearch('')}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Horizontally Scrollable Categories (Section 8) */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                                {categories.map((cat) => {
                                    const isSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat)}
                                            className={cn(
                                                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0",
                                                isSelected
                                                    ? "bg-[#E75480] text-white shadow-sm shadow-[#E75480]/25 font-extrabold"
                                                    : "bg-[#FFF5F7]/70 dark:bg-[#121218] text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white border border-[#F8C8DC]/40 dark:border-white/5 hover:border-[#E75480]/40"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Spacious Responsive Product Grid (Section 5, 6) */}
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5 max-h-115 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                {filteredProducts.length === 0 ? (
                                    <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/30 dark:bg-white/2">
                                        <ShoppingBag className="size-10 text-[#E75480]/40 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#3D2C2E] dark:text-zinc-200">No products found</p>
                                        <p className="text-[11px] text-[#7D6B6E] dark:text-zinc-500 mt-0.5">
                                            Try adjusting your search query or category filter.
                                        </p>
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const inCart = cartItems.find(i => i.product_id === product.id);
                                        const isSoldOut = product.stock <= 0;
                                        const isLowStock = product.stock > 0 && product.stock <= 5;

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                disabled={isSoldOut}
                                                onClick={() => handleAddToCart(product)}
                                                className={cn(
                                                    "group p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden bg-white dark:bg-[#1A1A24] hover:shadow-md",
                                                    inCart
                                                        ? "border-[#E75480] ring-1 ring-[#E75480] bg-[#FFF5F7]/40 dark:bg-[#201722]"
                                                        : isSoldOut
                                                        ? "border-gray-200 dark:border-zinc-800 opacity-50 cursor-not-allowed bg-gray-50/60 dark:bg-zinc-900/40"
                                                        : "border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/60 hover:-translate-y-0.5"
                                                )}
                                            >
                                                {/* Top Image Container */}
                                                <div className="w-full aspect-4/3 rounded-xl overflow-hidden relative bg-[#FFF5F7]/50 dark:bg-zinc-800/60 border border-[#F8C8DC]/30 dark:border-white/5 shrink-0 flex items-center justify-center">
                                                    <ImageWithFallback
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        fallbackIcon={<ShoppingBag className="size-6 text-zinc-300 dark:text-zinc-600" />}
                                                    />
                                                    
                                                    {/* In-Cart Quantity Badge */}
                                                    {inCart && (
                                                        <span className="absolute top-2 right-2 size-6 rounded-full bg-[#E75480] text-white text-xs font-black flex items-center justify-center shadow-md">
                                                            {inCart.quantity}
                                                        </span>
                                                    )}

                                                    {/* Availability Pill */}
                                                    <div className="absolute bottom-2 left-2">
                                                        {isSoldOut ? (
                                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-600 text-white shadow-xs">
                                                                Sold Out
                                                            </span>
                                                        ) : isLowStock ? (
                                                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-amber-500/90 text-white shadow-xs">
                                                                Low: {product.stock}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                {/* Product Info */}
                                                <div className="mt-2.5 flex-1 flex flex-col justify-between w-full">
                                                    <div>
                                                        <h4 className="text-xs font-bold uppercase text-[#3D2C2E] dark:text-zinc-100 line-clamp-2 leading-snug">
                                                            {product.name}
                                                        </h4>
                                                        <span className="text-[10px] text-[#7D6B6E] dark:text-zinc-400 block mt-0.5">
                                                            {product.category || 'Rolls & Specials'}
                                                        </span>
                                                    </div>

                                                    <div className="mt-2 pt-2 border-t border-[#F8C8DC]/20 dark:border-white/5 flex items-center justify-between">
                                                        <p className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                            {formatCurrency(product.selling_price)}
                                                        </p>
                                                        
                                                        <span className={cn(
                                                            "size-6 rounded-lg flex items-center justify-center transition-colors",
                                                            inCart
                                                                ? "bg-[#E75480] text-white"
                                                                : "bg-[#FFF5F7] dark:bg-zinc-800 text-[#E75480] group-hover:bg-[#E75480] group-hover:text-white"
                                                        )}>
                                                            <Plus className="size-3.5" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* ── SECTION B: Notes & Instructions (Section 13) ───────── */}
                        <div className="bg-white dark:bg-[#16161E] p-5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs space-y-3.5">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <MessageCircle className="size-4 text-[#E75480]" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                    Notes & Instructions
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                        <span>Customer Pickup Notes</span>
                                        <span className="text-[10px] font-normal text-zinc-400">(Visible on receipt)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="e.g. Extra chopsticks, separate sauce cups, mild spiciness..."
                                        value={pickupNotes}
                                        onChange={(e) => setPickupNotes(e.target.value)}
                                        className="h-20 rounded-xl bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs resize-none font-medium"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                        <span>Internal Kitchen / POS Notes</span>
                                        <span className="text-[10px] text-rose-500 font-bold">(Staff only)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="e.g. Pre-ordered via FB Messenger thread #42. Confirmed by cashier."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        className="h-20 rounded-xl bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs resize-none font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── SECTION C: Payment Method & Status (Section 14) ────── */}
                        <div className="bg-white dark:bg-[#16161E] p-5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-xs space-y-3.5">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <DollarSign className="size-4 text-[#E75480]" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                    Payment Configuration
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Payment Method <span className="text-rose-500">*</span>
                                    </Label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#121218] px-3.5 h-10 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480] cursor-pointer"
                                    >
                                        <option value="cash">Cash on Counter</option>
                                        <option value="gcash">GCash QR Payment</option>
                                        <option value="maya">Maya</option>
                                        <option value="card">Credit / Debit Card</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Payment Status <span className="text-rose-500">*</span>
                                    </Label>
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#121218] px-3.5 h-10 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480] cursor-pointer"
                                    >
                                        <option value="unpaid">Unpaid (Pay on Pickup)</option>
                                        <option value="paid">Paid (Verified Receipt Attached)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ══════════════════════════════════════════════════════════
                        RIGHT COLUMN: Order Summary & Pickup Details (30–35% width)
                        ══════════════════════════════════════════════════════════ */}
                    <div className="w-full lg:w-95 xl:w-105 shrink-0 bg-linear-to-b from-[#FFF5F7]/40 via-white to-white dark:from-[#16161D] dark:via-[#14141A] dark:to-[#121218] flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800 p-5 sm:p-6 space-y-5">
                        
                        <div className="space-y-5">
                            {/* Order Summary Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#F8C8DC]/40 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-[#3D2C2E] dark:text-white">
                                        Order Summary
                                    </h3>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E75480] text-white">
                                        {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
                                    </span>
                                </div>

                                {cartItems.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setCartItems([])}
                                        className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="size-3.5" /> Clear
                                    </button>
                                )}
                            </div>

                            {/* ── Pickup Logistics & Customer Details Card ──────── */}
                            <div className="bg-white dark:bg-[#181822] p-4 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs space-y-3.5">
                                <div className="flex items-center justify-between pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                    <div className="flex items-center gap-2">
                                        <User className="size-4 text-[#E75480]" />
                                        <span className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                            Pickup Logistics
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] border-[#E75480]/40 text-[#E75480] uppercase">
                                        Pickup
                                    </Badge>
                                </div>

                                {/* Customer Fields */}
                                <div className="space-y-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                                Customer Name <span className="text-rose-500">*</span>
                                            </Label>
                                            <Input
                                                placeholder="e.g. Maria Santos"
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                className="h-8.5 text-xs rounded-xl bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 font-medium"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                                Contact No.
                                            </Label>
                                            <Input
                                                placeholder="0917 123 4567"
                                                value={contactNumber}
                                                onChange={(e) => setContactNumber(e.target.value)}
                                                className="h-8.5 text-xs rounded-xl bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                                Channel <span className="text-rose-500">*</span>
                                            </Label>
                                            <select
                                                value={orderSource}
                                                onChange={(e) => setOrderSource(e.target.value)}
                                                className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/30 dark:bg-[#121218] px-2.5 h-8.5 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480] cursor-pointer"
                                            >
                                                <option value="facebook_messenger">FB Messenger</option>
                                                <option value="phone_call">Phone Call</option>
                                                <option value="walk_in">Walk-in Counter</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                                Source Reference
                                            </Label>
                                            <Input
                                                placeholder="Thread / profile"
                                                value={sourceReference}
                                                onChange={(e) => setSourceReference(e.target.value)}
                                                className="h-8.5 text-xs rounded-xl bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Branch Selection */}
                                <div className="space-y-1 pt-1 border-t border-[#F8C8DC]/30 dark:border-white/5">
                                    <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                        <span>Fulfillment Branch <span className="text-rose-500">*</span></span>
                                        <span className="text-[9px] text-[#E75480]">Lead: {leadTimeMinutes}m</span>
                                    </Label>
                                    <select
                                        value={selectedBranchId}
                                        onChange={(e) => setSelectedBranchId(Number(e.target.value))}
                                        className="w-full text-xs font-bold rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/40 dark:bg-[#121218] px-3 h-9 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480] cursor-pointer"
                                    >
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>
                                                {b.name} ({b.address || 'Standard Hub'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Pickup Date & Slot Toggle Selector */}
                                <div className="space-y-2 pt-1 border-t border-[#F8C8DC]/30 dark:border-white/5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                            Pickup Date & Time Slot <span className="text-rose-500">*</span>
                                        </Label>
                                        <button
                                            type="button"
                                            onClick={() => setIsSlotPickerExpanded(!isSlotPickerExpanded)}
                                            className="text-[10px] font-bold text-[#E75480] hover:underline flex items-center gap-1 cursor-pointer"
                                        >
                                            {isSlotPickerExpanded ? 'Hide Calendar' : 'Change Date / Slot'}
                                            {isSlotPickerExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                        </button>
                                    </div>

                                    {/* Active Selection Display Banner */}
                                    <div
                                        onClick={() => setIsSlotPickerExpanded(!isSlotPickerExpanded)}
                                        className={cn(
                                            "p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all",
                                            selectedSlot
                                                ? "bg-[#FFF5F7] dark:bg-[#1E1924] border-[#E75480]/50"
                                                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <CalendarIcon className="size-4 text-[#E75480] shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-extrabold text-[#3D2C2E] dark:text-white truncate">
                                                    {format(selectedDate, 'EEE, MMM d, yyyy')}
                                                </p>
                                                <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-400 truncate flex items-center gap-1">
                                                    <Clock className="size-3 inline text-[#E75480]" />
                                                    {selectedSlot ? (
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {selectedSlot.display_time} ({selectedSlot.remaining_capacity} left)
                                                        </span>
                                                    ) : (
                                                        <span className="text-rose-500 font-bold">Please select a time slot</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#E75480] shrink-0">
                                            {isSlotPickerExpanded ? 'Close' : 'Select'}
                                        </span>
                                    </div>

                                    {/* Expandable Calendar & Slots Picker */}
                                    {isSlotPickerExpanded && (
                                        <div className="pt-2 space-y-3 bg-[#FFF5F7]/30 dark:bg-[#121218] p-3 rounded-2xl border border-[#F8C8DC]/40 dark:border-white/5">
                                            {/* Month Navigation */}
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-[#3D2C2E] dark:text-white capitalize">
                                                    {format(currentMonth, 'MMMM yyyy')}
                                                </h4>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={prevMonth}
                                                        className="size-6.5 rounded-lg text-[#7D6B6E] dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800"
                                                    >
                                                        <ChevronLeft className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={nextMonth}
                                                        className="size-6.5 rounded-lg text-[#7D6B6E] dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800"
                                                    >
                                                        <ChevronRight className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Weekday Headers */}
                                            <div className="grid grid-cols-7 text-center text-[9px] font-extrabold text-[#7D6B6E] dark:text-zinc-500">
                                                <span>Su</span>
                                                <span>Mo</span>
                                                <span>Tu</span>
                                                <span>We</span>
                                                <span>Th</span>
                                                <span>Fr</span>
                                                <span>Sa</span>
                                            </div>

                                            {/* Days Grid */}
                                            <div className="grid grid-cols-7 gap-1">
                                                {calendarDays.map((day, idx) => {
                                                    const isSelected = isSameDay(day, selectedDate);
                                                    const isCurrentMonth = isSameMonth(day, currentMonth);
                                                    const isPast = isBefore(day, startOfDay(new Date()));
                                                    const isDayToday = isToday(day);

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            disabled={isPast}
                                                            onClick={() => setSelectedDate(day)}
                                                            className={cn(
                                                                "h-6.5 rounded-lg text-[11px] font-semibold flex items-center justify-center transition-all relative cursor-pointer",
                                                                !isCurrentMonth && "text-zinc-300 dark:text-zinc-700 pointer-events-none",
                                                                isPast && "opacity-25 cursor-not-allowed pointer-events-none line-through",
                                                                isSelected
                                                                    ? "bg-[#E75480] text-white font-black shadow-xs"
                                                                    : "hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300",
                                                                isDayToday && !isSelected && "border border-[#E75480]/50 text-[#E75480] font-bold"
                                                            )}
                                                        >
                                                            <span>{format(day, 'd')}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Time Slots Grid */}
                                            <div className="space-y-1.5 pt-2 border-t border-[#F8C8DC]/30 dark:border-white/5">
                                                <div className="flex items-center justify-between text-[10px] font-bold text-[#7D6B6E] dark:text-zinc-400">
                                                    <span>Available Slots for {format(selectedDate, 'MMM d')}:</span>
                                                    <span>{isLoadingSlots ? 'Checking...' : `${timeSlots.filter(s => s.is_available).length} open`}</span>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                                    {isLoadingSlots ? (
                                                        Array.from({ length: 6 }).map((_, i) => (
                                                            <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-zinc-800/50 animate-pulse" />
                                                        ))
                                                    ) : timeSlots.length === 0 ? (
                                                        <div className="col-span-full py-4 text-center text-xs text-[#7D6B6E] dark:text-zinc-400">
                                                            No pickup slots on this date.
                                                        </div>
                                                    ) : (
                                                        timeSlots.map((slot) => {
                                                            const isSelected = selectedSlot?.time === slot.time;
                                                            const isFull = slot.remaining_capacity <= 0;

                                                            return (
                                                                <button
                                                                    key={slot.time}
                                                                    type="button"
                                                                    disabled={!slot.is_available}
                                                                    onClick={() => {
                                                                        setSelectedSlot(slot);
                                                                        setIsSlotPickerExpanded(false);
                                                                    }}
                                                                    className={cn(
                                                                        "p-1.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer h-10",
                                                                        isSelected
                                                                            ? "bg-[#E75480] text-white border-[#E75480] shadow-xs font-bold"
                                                                            : slot.is_available
                                                                            ? "bg-white dark:bg-[#1A1A24] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/50"
                                                                            : "bg-gray-100 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 opacity-40 cursor-not-allowed"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <span className="text-[11px] font-black tracking-tight">
                                                                            {slot.display_time}
                                                                        </span>
                                                                        {isSelected && <CheckCircle2 className="size-2.5 text-white" />}
                                                                    </div>
                                                                    <span className="text-[8px] font-semibold mt-0.5 block">
                                                                        {isFull ? (
                                                                            <span className="text-rose-600 font-bold">FULL</span>
                                                                        ) : (
                                                                            <span className={isSelected ? "text-white/80" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                                                                                {slot.remaining_capacity} left
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            {/* Kitchen Prep Insight */}
                                            {selectedSlot && (
                                                <div className="p-2 rounded-xl bg-linear-to-r from-[#FFF5F7] to-pink-50/50 dark:from-[#1E1A22] dark:to-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center gap-2 text-[10px]">
                                                    <ChefHat className="size-3.5 text-[#E75480] shrink-0" />
                                                    <div className="text-[#3D2C2E] dark:text-zinc-300">
                                                        <span>Prep Starts: <strong className="text-[#E75480] dark:text-[#FF4F81]">{kitchenPrepTime}</strong></span>
                                                        <span className="text-zinc-400 ml-1">({leadTimeMinutes}m lead)</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ── Selected Items Section (Section 11, 12) ────────── */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                    <span>Selected Menu Items</span>
                                    <span>{cartTotalItems} items</span>
                                </div>

                                <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                    {cartItems.length === 0 ? (
                                        <div className="py-8 text-center rounded-2xl border border-dashed border-[#F8C8DC]/60 dark:border-white/10 bg-white/60 dark:bg-zinc-900/30 p-4">
                                            <ShoppingBag className="size-7 text-[#E75480]/40 mx-auto mb-1.5" />
                                            <p className="text-xs font-bold text-[#3D2C2E] dark:text-zinc-200">No items yet</p>
                                            <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-500 mt-0.5">
                                                Select products from the catalog to build this pickup order.
                                            </p>
                                        </div>
                                    ) : (
                                        cartItems.map((item) => (
                                            <div
                                                key={item.product_id}
                                                className="p-3 rounded-2xl bg-white dark:bg-[#181822] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-extrabold uppercase text-[#3D2C2E] dark:text-white truncate">
                                                        {item.name}
                                                    </h4>
                                                    <p className="text-[11px] font-medium text-[#7D6B6E] dark:text-zinc-400">
                                                        {formatCurrency(item.price)} × {item.quantity} = <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(item.price * item.quantity)}</strong>
                                                    </p>
                                                </div>

                                                {/* Touch-Friendly Quantity Adjusters (Section 11) */}
                                                <div className="flex items-center gap-1 bg-[#FFF5F7] dark:bg-[#121218] p-1 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 shrink-0">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdateQuantity(item.product_id, -1)}
                                                        className="size-6 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300"
                                                    >
                                                        <Minus className="size-3" />
                                                    </Button>
                                                    <span className="w-5 text-center text-xs font-black text-[#3D2C2E] dark:text-white">
                                                        {item.quantity}
                                                    </span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleUpdateQuantity(item.product_id, 1)}
                                                        className="size-6 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300"
                                                    >
                                                        <Plus className="size-3" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(item.product_id)}
                                                        className="size-6 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 ml-0.5"
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Financial Summary Breakdown (Section 9, 10) ────────── */}
                        <div className="space-y-2.5 bg-white dark:bg-[#181822] p-4 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 shadow-2xs">
                            <div className="flex justify-between text-xs text-[#7D6B6E] dark:text-zinc-400">
                                <span>Subtotal</span>
                                <span className="font-bold text-[#3D2C2E] dark:text-white font-mono">
                                    {formatCurrency(cartTotalAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs text-[#7D6B6E] dark:text-zinc-400">
                                <span>Pickup Fee</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                    ₱0.00
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-black pt-2 border-t border-[#F8C8DC]/30 dark:border-white/5 text-[#3D2C2E] dark:text-white">
                                <span className="uppercase tracking-wider">Total</span>
                                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                    {formatCurrency(cartTotalAmount)}
                                </span>
                            </div>
                        </div>

                    </div>

                </form>

                {/* ── 3. Fixed Footer / Action Bar (Section 16 & 17) ──────────── */}
                <footer className="px-6 py-4 border-t border-[#F8C8DC]/40 dark:border-white/10 bg-white dark:bg-[#14141C] shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                    {/* Left: Live Status / Validation Indicator */}
                    <div className="flex items-center gap-2.5 text-xs text-[#7D6B6E] dark:text-zinc-400">
                        <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-bold text-[#3D2C2E] dark:text-zinc-200">
                            {cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(cartTotalAmount)}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-50">
                            {selectedSlot ? `${format(selectedDate, 'MMM d')} @ ${selectedSlot.display_time}` : 'No pickup slot selected'}
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 sm:flex-none h-11 px-5 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-300 font-bold text-xs hover:bg-[#FFF5F7] dark:hover:bg-white/5"
                        >
                            Cancel
                        </Button>

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isFormValid}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-linear-to-r from-[#E75480] to-[#D43B66] hover:from-[#D43B66] hover:to-[#C02E58] text-white font-black uppercase tracking-wider text-xs shadow-md shadow-[#E75480]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Order...
                                </span>
                            ) : (
                                'Create Pickup Order'
                            )}
                        </Button>
                    </div>
                </footer>

            </DialogContent>
        </Dialog>
    );
}
