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
    ChevronLeft,
    ChevronRight,
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
            const matchesSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, productSearch]);

    // ── Cart Manipulations ───────────────────────────────────────────────────
    const handleAddToCart = (product: PickupProduct) => {
        if (product.stock <= 0) {
            toast.warning(`"${product.name}" is currently out of stock.`);
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
                toast.error(typeof firstErr === 'string' ? firstErr : 'Failed to create pickup order. Please verify input.');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] p-0 overflow-hidden bg-white dark:bg-[#121218] border border-[#F8C8DC]/60 dark:border-white/10 rounded-3xl font-['Outfit'] shadow-2xl flex flex-col">
                {/* ── Modal Header ────────────────────────────────────────── */}
                <div className="px-6 py-4.5 border-b border-[#F8C8DC]/40 dark:border-white/10 flex items-center justify-between bg-linear-to-r from-[#FFF5F7] via-white to-white dark:from-[#181820] dark:via-[#14141A] dark:to-[#121218] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-11 rounded-2xl bg-linear-to-br from-[#E75480] to-[#D43B66] text-white flex items-center justify-center shadow-md shadow-[#E75480]/20">
                            <Store className="size-5.5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-lg font-black uppercase tracking-tight text-[#3D2C2E] dark:text-white">
                                    Create External Pickup Order
                                </DialogTitle>
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#E75480]/15 text-[#E75480] dark:text-[#FF4F81] border border-[#E75480]/30">
                                    FB / Phone / Walk-in
                                </span>
                            </div>
                            <DialogDescription className="text-xs text-[#7D6B6E] dark:text-zinc-400">
                                Enter customer details, choose a branch-configured pickup slot, and assemble the order.
                            </DialogDescription>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="size-8 rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 hover:bg-[#FFF5F7] dark:hover:bg-white/5 flex items-center justify-center text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white transition-colors cursor-pointer"
                    >
                        <X className="size-4.5" />
                    </button>
                </div>

                {/* ── Main Content: 2-Column POS Layout ───────────────────── */}
                <form onSubmit={handleSubmit} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                    {/* ── LEFT COLUMN: Configuration & Product Catalog ─────── */}
                    <div className="lg:col-span-7 xl:col-span-8 overflow-y-auto p-5 sm:p-6 space-y-6 border-r border-[#F8C8DC]/40 dark:border-white/10 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                        
                        {/* 1. Customer Details */}
                        <div className="bg-white dark:bg-[#181820] p-4.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 space-y-3.5 shadow-2xs">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <User className="size-4 text-[#E75480]" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                    Customer Information
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Customer Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        placeholder="e.g. Maria Santos"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="rounded-xl h-10 bg-[#FFF5F7]/50 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Contact Number
                                    </Label>
                                    <Input
                                        placeholder="e.g. 0917 123 4567"
                                        value={contactNumber}
                                        onChange={(e) => setContactNumber(e.target.value)}
                                        className="rounded-xl h-10 bg-[#FFF5F7]/50 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Order Channel <span className="text-rose-500">*</span>
                                    </Label>
                                    <select
                                        value={orderSource}
                                        onChange={(e) => setOrderSource(e.target.value)}
                                        className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/50 dark:bg-[#121218] px-3 h-10 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480]"
                                    >
                                        <option value="facebook_messenger">Facebook / Messenger</option>
                                        <option value="phone_call">Phone Call</option>
                                        <option value="walk_in">Walk-in Counter</option>
                                        <option value="other">Other External Channel</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Source Reference / Profile
                                    </Label>
                                    <Input
                                        placeholder="e.g. FB: Maria S / Thread #89"
                                        value={sourceReference}
                                        onChange={(e) => setSourceReference(e.target.value)}
                                        className="rounded-xl h-10 bg-[#FFF5F7]/50 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Pickup Scheduling & Modern Date/Time Picker */}
                        <div className="bg-white dark:bg-[#181820] p-4.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 space-y-4 shadow-2xs">
                            <div className="flex items-center justify-between pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-[#E75480]" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                        Pickup Branch & Scheduling
                                    </h3>
                                </div>
                                {activeBranch && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF5F7] dark:bg-[#121218] text-[#E75480] dark:text-[#FF4F81] border border-[#F8C8DC]/60 dark:border-white/10">
                                        Prep Lead Time: {leadTimeMinutes} mins
                                    </span>
                                )}
                            </div>

                            {/* Branch Selection */}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                    Select Fulfillment Branch <span className="text-rose-500">*</span>
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {branches.map((b) => {
                                        const isSelected = b.id === selectedBranchId;
                                        return (
                                            <button
                                                key={b.id}
                                                type="button"
                                                onClick={() => setSelectedBranchId(b.id)}
                                                className={cn(
                                                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                                                    isSelected
                                                        ? "bg-[#E75480]/10 border-[#E75480] text-[#E75480] dark:text-[#FF4F81] shadow-xs"
                                                        : "bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/40 text-[#3D2C2E] dark:text-zinc-300"
                                                )}
                                            >
                                                <div className="font-extrabold text-xs flex items-center justify-between">
                                                    <span>{b.name}</span>
                                                    {isSelected && <CheckCircle2 className="size-3.5 text-[#E75480]" />}
                                                </div>
                                                <div className="text-[10px] opacity-75 truncate mt-0.5">
                                                    {b.address || 'Standard Location'}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Date Picker & Time Slots Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
                                {/* Calendar Component */}
                                <div className="lg:col-span-5 bg-[#FFF5F7]/50 dark:bg-[#121218] p-3.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-xs font-extrabold text-[#3D2C2E] dark:text-white capitalize">
                                            {format(currentMonth, 'MMMM yyyy')}
                                        </h4>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={prevMonth}
                                                className="size-7 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#7D6B6E] dark:text-zinc-400"
                                            >
                                                <ChevronLeft className="size-3.5" />
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={nextMonth}
                                                className="size-7 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-[#7D6B6E] dark:text-zinc-400"
                                            >
                                                <ChevronRight className="size-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Weekday Labels */}
                                    <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[#7D6B6E] dark:text-zinc-500 mb-1">
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
                                                        "h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all relative cursor-pointer",
                                                        !isCurrentMonth && "text-zinc-300 dark:text-zinc-700 pointer-events-none",
                                                        isPast && "opacity-30 cursor-not-allowed pointer-events-none line-through",
                                                        isSelected
                                                            ? "bg-[#E75480] text-white font-black shadow-xs"
                                                            : "hover:bg-white dark:hover:bg-zinc-800 text-[#3D2C2E] dark:text-zinc-300",
                                                        isDayToday && !isSelected && "border border-[#E75480]/50 text-[#E75480] font-bold"
                                                    )}
                                                >
                                                    <span>{format(day, 'd')}</span>
                                                    {isDayToday && !isSelected && (
                                                        <span className="size-1 rounded-full bg-[#E75480] absolute bottom-0.5" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-2.5 pt-2 border-t border-[#F8C8DC]/30 dark:border-white/5 text-[10px] text-center text-[#7D6B6E] dark:text-zinc-400 font-medium">
                                        Selected Date: <strong className="text-[#3D2C2E] dark:text-white">{format(selectedDate, 'EEE, MMM d, yyyy')}</strong>
                                    </div>
                                </div>

                                {/* Dynamic Time Slot Picker */}
                                <div className="lg:col-span-7 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                            Pickup Time Slots
                                        </Label>
                                        <span className="text-[10px] text-[#7D6B6E] dark:text-zinc-400">
                                            {isLoadingSlots ? 'Checking slots...' : `${timeSlots.filter(s => s.is_available).length} available`}
                                        </span>
                                    </div>

                                    {/* Slots List */}
                                    <div className="flex-1 max-h-56 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-2 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                        {isLoadingSlots ? (
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <div key={i} className="h-13 rounded-xl bg-gray-100 dark:bg-zinc-800/50 animate-pulse" />
                                            ))
                                        ) : timeSlots.length === 0 ? (
                                            <div className="col-span-3 py-6 text-center text-xs text-[#7D6B6E] dark:text-zinc-400">
                                                No pickup slots scheduled for this date.
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
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={cn(
                                                            "p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer h-13",
                                                            isSelected
                                                                ? "bg-[#E75480] text-white border-[#E75480] shadow-sm font-black"
                                                                : slot.is_available
                                                                ? "bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-300 hover:border-[#E75480]/50"
                                                                : "bg-gray-100 dark:bg-zinc-900/50 border-gray-200 dark:border-zinc-800 opacity-40 cursor-not-allowed"
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="text-xs font-bold tracking-tight">
                                                                {slot.display_time}
                                                            </span>
                                                            {isSelected && <CheckCircle2 className="size-3 text-white" />}
                                                        </div>

                                                        <div className="flex items-center justify-between text-[9px] font-medium mt-0.5">
                                                            <span>
                                                                {isFull ? (
                                                                    <span className="text-rose-600 dark:text-rose-400 font-extrabold">FULL</span>
                                                                ) : slot.is_available ? (
                                                                    <span className={isSelected ? "text-white/80" : "text-emerald-600 dark:text-emerald-400 font-bold"}>
                                                                        {slot.remaining_capacity} left
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-zinc-400">Unavailable</span>
                                                                )}
                                                            </span>
                                                            <span className={isSelected ? "text-white/70" : "text-zinc-400"}>
                                                                {slot.booked_count} booked
                                                            </span>
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>

                                    {/* Operational Kitchen Insight */}
                                    {selectedSlot && (
                                        <div className="mt-3 p-2.5 rounded-xl bg-linear-to-r from-[#FFF5F7] to-pink-50/50 dark:from-[#1E1A22] dark:to-[#181820] border border-[#F8C8DC]/80 dark:border-white/10 flex items-center gap-2.5 text-xs">
                                            <ChefHat className="size-4 text-[#E75480] shrink-0" />
                                            <div className="text-[11px] text-[#3D2C2E] dark:text-zinc-300">
                                                <span>Pickup Time: <strong>{selectedSlot.display_time}</strong></span>
                                                <span className="mx-1.5 opacity-40">•</span>
                                                <span>Kitchen Prep Starts: <strong className="text-[#E75480] dark:text-[#FF4F81]">{kitchenPrepTime}</strong></span>
                                                <span className="text-[10px] text-[#7D6B6E] dark:text-zinc-400 block sm:inline sm:ml-1">
                                                    ({leadTimeMinutes}-min lead time)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 3. Product Catalog Selection */}
                        <div className="bg-white dark:bg-[#181820] p-4.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 space-y-3.5 shadow-2xs">
                            <div className="flex items-center justify-between pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <ShoppingBag className="size-4 text-[#E75480]" />
                                    <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                        Select Menu Products <span className="text-rose-500">*</span>
                                    </h3>
                                </div>
                                <span className="text-[10px] font-bold text-[#7D6B6E] dark:text-zinc-400">
                                    Click card to add to order
                                </span>
                            </div>

                            {/* Search & Category Pills */}
                            <div className="space-y-2.5">
                                <div className="relative">
                                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D6B6E] dark:text-zinc-400" />
                                    <Input
                                        placeholder="Search by product name..."
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        className="pl-8.5 rounded-xl h-9 bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs"
                                    />
                                </div>

                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                                    {categories.map((cat) => {
                                        const isSelected = selectedCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={cn(
                                                    "px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                                                    isSelected
                                                        ? "bg-[#E75480] text-white shadow-xs"
                                                        : "bg-[#FFF5F7]/60 dark:bg-[#121218] text-[#7D6B6E] dark:text-zinc-400 hover:text-[#3D2C2E] dark:hover:text-white border border-[#F8C8DC]/40 dark:border-white/5"
                                                )}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Product Cards Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                {filteredProducts.length === 0 ? (
                                    <div className="col-span-3 py-8 text-center text-xs text-[#7D6B6E] dark:text-zinc-400">
                                        No products found matching your search.
                                    </div>
                                ) : (
                                    filteredProducts.map((product) => {
                                        const inCart = cartItems.find(i => i.product_id === product.id);
                                        const isSoldOut = product.stock <= 0;

                                        return (
                                            <button
                                                key={product.id}
                                                type="button"
                                                disabled={isSoldOut}
                                                onClick={() => handleAddToCart(product)}
                                                className={cn(
                                                    "p-2.5 rounded-2xl border text-left flex items-center gap-2.5 transition-all cursor-pointer relative overflow-hidden group",
                                                    inCart
                                                        ? "bg-[#E75480]/10 border-[#E75480] shadow-xs"
                                                        : isSoldOut
                                                        ? "bg-gray-50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800 opacity-50 cursor-not-allowed"
                                                        : "bg-[#FFF5F7]/30 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 hover:border-[#E75480]/50 hover:bg-white dark:hover:bg-[#181820]"
                                                )}
                                            >
                                                <div className="size-11 rounded-xl bg-white dark:bg-zinc-800 border border-[#F8C8DC]/40 dark:border-white/10 overflow-hidden shrink-0 flex items-center justify-center relative">
                                                    <ImageWithFallback
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                        fallbackIcon={<ShoppingBag className="size-4 text-zinc-400" />}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h4 className="text-xs font-extrabold uppercase text-[#3D2C2E] dark:text-white truncate">
                                                        {product.name}
                                                    </h4>
                                                    <p className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                                        {formatCurrency(product.selling_price)}
                                                    </p>
                                                    <span className="text-[10px] text-[#7D6B6E] dark:text-zinc-500 block truncate">
                                                        {isSoldOut ? 'Sold out' : `Stock: ${product.stock}`}
                                                    </span>
                                                </div>

                                                {inCart && (
                                                    <span className="absolute top-1.5 right-1.5 size-5 rounded-full bg-[#E75480] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                                                        {inCart.quantity}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* 4. Notes & Operational Instructions */}
                        <div className="bg-white dark:bg-[#181820] p-4.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 space-y-3.5 shadow-2xs">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <MessageCircle className="size-4 text-[#E75480]" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                    Notes & Instructions
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                        <span>Customer Pickup Notes</span>
                                        <span className="text-[9px] font-normal text-zinc-400">(Customer visible)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="e.g. Extra chopsticks, separate sauce cups, no spicy mayo..."
                                        value={pickupNotes}
                                        onChange={(e) => setPickupNotes(e.target.value)}
                                        className="h-18 rounded-xl bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs resize-none"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400 flex items-center justify-between">
                                        <span>Internal Kitchen / POS Notes</span>
                                        <span className="text-[9px] text-rose-500 font-bold">(Staff only)</span>
                                    </Label>
                                    <Textarea
                                        placeholder="e.g. Pre-ordered via FB Messenger thread #42. Confirmed by Cashier."
                                        value={internalNotes}
                                        onChange={(e) => setInternalNotes(e.target.value)}
                                        className="h-18 rounded-xl bg-[#FFF5F7]/40 dark:bg-[#121218] border-[#F8C8DC]/60 dark:border-white/10 text-xs resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Payment Configuration */}
                        <div className="bg-white dark:bg-[#181820] p-4.5 rounded-2xl border border-[#F8C8DC]/60 dark:border-white/10 space-y-3.5 shadow-2xs">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#F8C8DC]/30 dark:border-white/5">
                                <DollarSign className="size-4 text-[#E75480]" />
                                <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2C2E] dark:text-zinc-200">
                                    Payment Method & Status
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Payment Method
                                    </Label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/50 dark:bg-[#121218] px-3 h-10 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480]"
                                    >
                                        <option value="cash">Cash on Counter</option>
                                        <option value="gcash">GCash QR</option>
                                        <option value="maya">Maya</option>
                                        <option value="card">Credit / Debit Card</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-bold uppercase text-[#7D6B6E] dark:text-zinc-400">
                                        Payment Status
                                    </Label>
                                    <select
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                        className="w-full text-xs font-medium rounded-xl border border-[#F8C8DC]/60 dark:border-white/10 bg-[#FFF5F7]/50 dark:bg-[#121218] px-3 h-10 text-[#3D2C2E] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#E75480]"
                                    >
                                        <option value="unpaid">Unpaid (Pay on Pickup)</option>
                                        <option value="paid">Paid (Verified Receipt Attached)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* ── RIGHT COLUMN: Sticky Order Summary & Actions ────── */}
                    <div className="lg:col-span-5 xl:col-span-4 p-5 sm:p-6 bg-linear-to-b from-[#FFF5F7]/50 to-white dark:from-[#16161D] dark:to-[#121218] flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                        <div className="space-y-4">
                            {/* Summary Title */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#F8C8DC]/40 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-black uppercase tracking-tight text-[#3D2C2E] dark:text-white">
                                        Order Summary
                                    </h3>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E75480] text-white">
                                        {cartTotalItems} items
                                    </span>
                                </div>

                                {cartItems.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setCartItems([])}
                                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
                                    >
                                        <Trash2 className="size-3" /> Clear
                                    </button>
                                )}
                            </div>

                            {/* Scheduled Pickup Banner */}
                            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 space-y-1.5 shadow-2xs">
                                <div className="flex items-center justify-between text-xs font-extrabold text-[#3D2C2E] dark:text-white">
                                    <span>{activeBranch?.name || 'Selected Branch'}</span>
                                    <Badge variant="outline" className="text-[9px] border-[#E75480]/40 text-[#E75480] uppercase">
                                        Pickup
                                    </Badge>
                                </div>
                                <div className="text-xs text-[#7D6B6E] dark:text-zinc-400 flex items-center gap-1.5">
                                    <CalendarIcon className="size-3 text-[#E75480]" />
                                    <span>{format(selectedDate, 'MMM dd, yyyy')}</span>
                                    <span className="opacity-40">•</span>
                                    <Clock className="size-3 text-[#E75480]" />
                                    <span className="font-bold text-[#3D2C2E] dark:text-white">
                                        {selectedSlot ? selectedSlot.display_time : 'Time not selected'}
                                    </span>
                                </div>
                            </div>

                            {/* Selected Items List */}
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-pink-200 dark:scrollbar-thumb-zinc-800">
                                {cartItems.length === 0 ? (
                                    <div className="py-12 text-center rounded-2xl border border-dashed border-[#F8C8DC]/60 dark:border-white/10 p-4">
                                        <ShoppingBag className="size-8 text-[#E75480]/40 mx-auto mb-2" />
                                        <p className="text-xs font-bold text-[#3D2C2E] dark:text-zinc-300">Your order is empty</p>
                                        <p className="text-[10px] text-[#7D6B6E] dark:text-zinc-500 mt-0.5">
                                            Select products from the menu catalog on the left to add items.
                                        </p>
                                    </div>
                                ) : (
                                    cartItems.map((item) => (
                                        <div
                                            key={item.product_id}
                                            className="p-3 rounded-2xl bg-white dark:bg-[#181820] border border-[#F8C8DC]/60 dark:border-white/10 flex items-center justify-between gap-3 shadow-2xs"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-extrabold uppercase text-[#3D2C2E] dark:text-white truncate">
                                                    {item.name}
                                                </h4>
                                                <p className="text-[11px] font-medium text-[#7D6B6E] dark:text-zinc-400">
                                                    {formatCurrency(item.price)} × {item.quantity} = <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(item.price * item.quantity)}</strong>
                                                </p>
                                            </div>

                                            {/* Quantity Adjuster */}
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
                                                    className="size-6 rounded-lg hover:bg-rose-50 text-rose-500 ml-0.5"
                                                >
                                                    <Trash2 className="size-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Financial Summary & Action Buttons */}
                        <div className="pt-4 border-t border-[#F8C8DC]/40 dark:border-white/10 space-y-3 mt-4">
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between text-[#7D6B6E] dark:text-zinc-400">
                                    <span>Subtotal</span>
                                    <span className="font-bold text-[#3D2C2E] dark:text-white font-mono">
                                        {formatCurrency(cartTotalAmount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-base font-black pt-2 border-t border-[#F8C8DC]/40 dark:border-white/10 text-[#3D2C2E] dark:text-white">
                                    <span>TOTAL</span>
                                    <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {formatCurrency(cartTotalAmount)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    className="h-11 rounded-xl border-[#F8C8DC]/60 dark:border-white/10 text-[#3D2C2E] dark:text-zinc-300 font-bold text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || cartItems.length === 0 || !selectedSlot || !customerName.trim()}
                                    className="flex-1 h-11 rounded-xl bg-linear-to-r from-[#E75480] to-[#D43B66] hover:from-[#D43B66] hover:to-[#C02E58] text-white font-extrabold uppercase text-xs shadow-md shadow-[#E75480]/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Creating Pickup Order...' : 'Create Pickup Order'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
