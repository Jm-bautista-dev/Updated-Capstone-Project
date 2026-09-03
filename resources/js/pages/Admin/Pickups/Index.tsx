import { Head, router } from '@inertiajs/react';
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    Plus,
    Search,
    RefreshCw,
    ChefHat,
    MessageCircle,
    Smartphone,
    PhoneCall,
    UserCheck,
    QrCode,
    DollarSign,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import CreatePickupOrderModal, { type PickupBranch, type PickupProduct } from '@/components/pickups/CreatePickupOrderModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import echo from '@/echo';
import AppLayout from '@/layouts/app-layout';

type ProductItem = PickupProduct;

type Branch = PickupBranch;

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: string | number;
    product?: {
        name: string;
    };
}

interface PickupOrder {
    id: number;
    order_number: string;
    fulfillment_type: string;
    order_source: string;
    source_reference?: string;
    customer_name: string;
    contact_number?: string;
    total_amount: string | number;
    status: string;
    payment_method: string;
    payment_status: string;
    scheduled_pickup_at?: string;
    prep_start_at?: string;
    estimated_prep_time_minutes?: number;
    pickup_verification_code?: string;
    pickup_notes?: string;
    internal_notes?: string;
    created_at: string;
    branch?: Branch;
    items: OrderItem[];
}

interface PaginatedPickups {
    data: PickupOrder[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Stats {
    today_total: number;
    pending_prep: number;
    preparing: number;
    ready: number;
    completed_today: number;
    no_shows: number;
}

interface Props {
    pickups: PaginatedPickups;
    stats: Stats;
    branches: Branch[];
    products: ProductItem[];
    filters: {
        view: string;
        status: string;
        source: string;
        branch_id?: number | string;
        search: string;
    };
    authBranchId?: number;
    isAdmin: boolean;
}

export default function PickupDashboard({
    pickups,
    stats,
    branches,
    products,
    filters,
    authBranchId,
    isAdmin,
}: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<PickupOrder | null>(null);

    // Verification Modal Form
    const [verifyCode, setVerifyCode] = useState('');
    const [collectedCash, setCollectedCash] = useState<string>('');

    // Reschedule Modal Form
    const [newPickupDate, setNewPickupDate] = useState('');
    const [newPickupTime, setNewPickupTime] = useState('');
    const [rescheduleReason, setRescheduleReason] = useState('');

<<<<<<< HEAD
    // Manual Order Form
    const { data: manualData, setData: setManualData, post: postManual, processing: manualProcessing, reset: resetManual } = useForm({
        customer_name: '',
        contact_number: '',
        order_source: 'facebook_messenger',
        source_reference: '',
        branch_id: authBranchId || (branches[0]?.id ?? 1),
        scheduled_pickup_at: '',
        estimated_prep_time_minutes: 20,
        payment_method: 'cash',
        payment_status: 'unpaid',
        pickup_notes: '',
        internal_notes: '',
        items: [] as Array<{ product_id: number; quantity: number; price: number; name: string }>,
        total_amount: 0,
    });

=======
>>>>>>> c1bcda7f (update)
    // Real-time Echo updates
    useEffect(() => {
        if (!echo) return;
        const echoClient = echo;

        const channelsToSubscribe: string[] = [];
        if (isAdmin) {
            channelsToSubscribe.push('admin.orders');
            if (filters.branch_id && filters.branch_id !== 'all') {
                channelsToSubscribe.push(`branch.${filters.branch_id}.orders`);
            }
        } else if (authBranchId) {
            channelsToSubscribe.push(`branch.${authBranchId}.orders`);
        }
        channelsToSubscribe.push('orders');

        const handlePickupEvent = (e: unknown) => {
            const eventData = e as { fulfillment_type?: string; is_pickup?: boolean };
            if (eventData?.fulfillment_type === 'delivery' && !eventData?.is_pickup) {
                // Ignore delivery orders in Pickup queue
                return;
            }
            router.reload({ only: ['pickups', 'stats'] });
        };

        const echoInstance = echo;
        const activeChannels = channelsToSubscribe.map(chName => {
<<<<<<< HEAD
            const ch = echoInstance.private(chName);
=======
            const ch = echoClient.private(chName);
>>>>>>> c1bcda7f (update)
            ch.listen('.OrderCreated', handlePickupEvent)
              .listen('OrderCreated', handlePickupEvent)
              .listen('App\\Events\\OrderCreated', handlePickupEvent)
              .listen('.order-status-updated', handlePickupEvent)
              .listen('OrderStatusUpdated', handlePickupEvent)
              .listen('App\\Events\\OrderStatusUpdated', handlePickupEvent);
            return chName;
        });

        return () => {
            activeChannels.forEach(chName => {
                echoClient.leave(chName);
            });
        };
    }, [isAdmin, filters.branch_id, authBranchId]);

    // Filter apply helper
    const applyFilter = (key: string, value: string | number) => {
        router.get(
            '/pickups',
            { ...filters, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    // Quick status transition
    const handleStatusTransition = (order: PickupOrder, newStatus: string, reason?: string) => {
        router.post(`/pickups/${order.id}/status`, {
            status: newStatus,
            reason: reason || `Updated via web queue to ${newStatus}`,
        }, {
            preserveScroll: true,
        });
    };

    // Verify & Complete Submit
    const handleVerifySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder) return;

        router.post(`/pickups/${selectedOrder.id}/verify-complete`, {
            verification_code: verifyCode,
            paid_amount: collectedCash ? parseFloat(collectedCash) : undefined,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsVerifyModalOpen(false);
                setVerifyCode('');
                setCollectedCash('');
                setSelectedOrder(null);
            },
        });
    };

    // Reschedule Submit
    const handleRescheduleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrder || !newPickupDate || !newPickupTime) return;

        const combinedDateTime = `${newPickupDate} ${newPickupTime}:00`;
        router.post(`/pickups/${selectedOrder.id}/reschedule`, {
            new_scheduled_pickup_at: combinedDateTime,
            reason: rescheduleReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsRescheduleModalOpen(false);
                setSelectedOrder(null);
                setNewPickupDate('');
                setNewPickupTime('');
                setRescheduleReason('');
            },
        });
    };

    const getSourceIcon = (source: string) => {
        switch (source) {
            case 'facebook_messenger':
                return <MessageCircle className="w-4 h-4 text-blue-500" />;
            case 'phone_call':
                return <PhoneCall className="w-4 h-4 text-emerald-500" />;
            case 'walk_in':
                return <UserCheck className="w-4 h-4 text-amber-500" />;
            default:
                return <Smartphone className="w-4 h-4 text-purple-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Pending</Badge>;
            case 'confirmed':
                return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Confirmed</Badge>;
            case 'preparing':
                return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 animate-pulse">Preparing</Badge>;
            case 'ready_for_pickup':
                return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Ready for Pickup</Badge>;
            case 'customer_arrived':
                return <Badge className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20">Customer Arrived</Badge>;
            case 'completed':
                return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Completed</Badge>;
            case 'no_show':
                return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">No Show</Badge>;
            case 'cancelled':
                return <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Pickup Orders & Queue', href: '/pickups' }]}>
            <Head title="Pickup Fulfillment Queue — MAKI DESU" />

            <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingBag className="w-8 h-8 text-primary" />
                            Pickup Orders & Kitchen Queue
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage scheduled customer pickups, Facebook Messenger orders, and live preparation queues.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.reload({ only: ['pickups', 'stats'] })}
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setIsManualModalOpen(true)}
                            className="gap-2 bg-primary hover:bg-primary/90 text-white font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            New Facebook / Phone Order
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-gray-500">Today Total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.today_total}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Pending Prep</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending_prep}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">In Kitchen</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.preparing}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Ready for Pickup</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.ready}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">Completed</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completed_today}</p>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 dark:border-gray-800">
                        <CardContent className="p-4">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">No Shows</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.no_shows}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* View Tabs & Search Filter */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                        <Button
                            variant={filters.view === 'today' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => applyFilter('view', 'today')}
                        >
                            📅 Today's Pickups
                        </Button>
                        <Button
                            variant={filters.view === 'prep_queue' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => applyFilter('view', 'prep_queue')}
                        >
                            🍳 Kitchen Prep Queue
                        </Button>
                        <Button
                            variant={filters.view === 'all' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => applyFilter('view', 'all')}
                        >
                            📋 All History
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {isAdmin && branches.length > 1 && (
                            <select
                                className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-gray-900 dark:text-white"
                                value={filters.branch_id || ''}
                                onChange={(e) => applyFilter('branch_id', e.target.value)}
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        )}

                        <select
                            className="text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent px-3 py-2 text-gray-900 dark:text-white"
                            value={filters.source || 'all'}
                            onChange={(e) => applyFilter('source', e.target.value)}
                        >
                            <option value="all">All Sources</option>
                            <option value="mobile_app">Mobile App</option>
                            <option value="facebook_messenger">Facebook Messenger</option>
                            <option value="phone_call">Phone Call</option>
                            <option value="walk_in">Walk-in</option>
                        </select>

                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                            <Input
                                placeholder="Search Order #, Code, Name..."
                                className="pl-9 text-xs w-48 lg:w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') applyFilter('search', searchQuery);
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Orders Grid / Queue View */}
                {pickups.data.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-400 opacity-50 mb-3" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">No pickup orders found</h3>
                        <p className="text-sm text-gray-500 mt-1">There are no orders matching your current view or filter criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pickups.data.map((order) => {
                            const pickupDate = order.scheduled_pickup_at ? new Date(order.scheduled_pickup_at) : null;
                            const isUnpaid = order.payment_status === 'unpaid';

                            return (
                                <Card key={order.id} className="border-gray-200 dark:border-gray-800 flex flex-col justify-between hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-base text-gray-900 dark:text-white">
                                                        #{order.order_number}
                                                    </span>
                                                    {getSourceIcon(order.order_source)}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                                                    {order.customer_name}
                                                </p>
                                                {order.contact_number && (
                                                    <p className="text-xs text-gray-500">{order.contact_number}</p>
                                                )}
                                                {order.source_reference && (
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                                                        Ref: {order.source_reference}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {getStatusBadge(order.status)}
                                                {order.pickup_verification_code && (
                                                    <div className="mt-1.5 inline-block bg-primary/10 text-primary font-mono font-bold text-xs px-2 py-0.5 rounded border border-primary/20">
                                                        Code: {order.pickup_verification_code}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pb-4">
                                        {/* Scheduled Time & Prep window */}
                                        <div className="bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg text-xs space-y-1">
                                            <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                                                <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                                                    <Clock className="w-3.5 h-3.5 text-primary" />
                                                    Pickup Time:
                                                </span>
                                                <span className="font-bold text-primary">
                                                    {pickupDate ? pickupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'ASAP'}
                                                    {pickupDate && ` (${pickupDate.toLocaleDateString([], { month: 'short', day: 'numeric' })})`}
                                                </span>
                                            </div>
                                            {order.prep_start_at && (
                                                <div className="flex items-center justify-between text-gray-500">
                                                    <span>Kitchen Prepare Around:</span>
                                                    <span className="font-mono">
                                                        {new Date(order.prep_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Order Items */}
                                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                                            {order.items.map((item) => (
                                                <div key={item.id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                                                    <span>{item.quantity}x {item.product?.name || 'Item'}</span>
                                                    <span className="font-mono">₱{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Financial & Payment Row */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="capitalize text-gray-500">{order.payment_method}</span>
                                                <Badge variant={isUnpaid ? 'destructive' : 'outline'} className="text-[10px] px-1.5 py-0">
                                                    {isUnpaid ? 'UNPAID' : 'PAID'}
                                                </Badge>
                                            </div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                ₱{Number(order.total_amount).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="pt-2 flex flex-wrap items-center gap-1.5">
                                            {order.status === 'pending' && (
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="w-full text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white"
                                                    onClick={() => handleStatusTransition(order, 'confirmed')}
                                                >
                                                    Confirm Order
                                                </Button>
                                            )}

                                            {(order.status === 'pending' || order.status === 'confirmed') && (
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs h-8 bg-orange-600 hover:bg-orange-700 text-white gap-1"
                                                    onClick={() => handleStatusTransition(order, 'preparing')}
                                                >
                                                    <ChefHat className="w-3.5 h-3.5" />
                                                    Start Preparing
                                                </Button>
                                            )}

                                            {order.status === 'preparing' && (
                                                <Button
                                                    size="sm"
                                                    className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                                    onClick={() => handleStatusTransition(order, 'ready_for_pickup')}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    Mark Ready for Pickup
                                                </Button>
                                            )}

                                            {(order.status === 'ready_for_pickup' || order.status === 'customer_arrived') && (
                                                <Button
                                                    size="sm"
                                                    className="flex-1 text-xs h-8 bg-primary hover:bg-primary/90 text-white gap-1"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setVerifyCode(order.pickup_verification_code || '');
                                                        setCollectedCash(isUnpaid ? String(order.total_amount) : '');
                                                        setIsVerifyModalOpen(true);
                                                    }}
                                                >
                                                    <QrCode className="w-3.5 h-3.5" />
                                                    Verify & Complete
                                                </Button>
                                            )}

                                            {order.status === 'ready_for_pickup' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs h-8 text-cyan-600 border-cyan-300 hover:bg-cyan-50"
                                                    onClick={() => handleStatusTransition(order, 'customer_arrived')}
                                                >
                                                    Customer Arrived
                                                </Button>
                                            )}

                                            {/* Reschedule button */}
                                            {['pending', 'confirmed', 'preparing', 'ready_for_pickup'].includes(order.status) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs h-8 text-gray-500"
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setIsRescheduleModalOpen(true);
                                                    }}
                                                >
                                                    Reschedule
                                                </Button>
                                            )}

                                            {/* No show button */}
                                            {['ready_for_pickup', 'customer_arrived'].includes(order.status) && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs h-8 text-red-500 hover:bg-red-50"
                                                    onClick={() => handleStatusTransition(order, 'no_show', 'Customer did not arrive')}
                                                >
                                                    No Show
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {pickups.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pickups.current_page <= 1}
                            onClick={() => applyFilter('page', pickups.current_page - 1)}
                        >
                            Previous
                        </Button>
                        <span className="text-xs text-gray-500">
                            Page {pickups.current_page} of {pickups.last_page}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={pickups.current_page >= pickups.last_page}
                            onClick={() => applyFilter('page', pickups.current_page + 1)}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Modal 1: Verify & Complete Pickup ─────────────────────────── */}
            <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-primary">
                            <CheckCircle2 className="w-5 h-5" />
                            Verify & Complete Pickup
                        </DialogTitle>
                        <DialogDescription>
                            Enter the customer's pickup verification code or order number to confirm handoff.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <form onSubmit={handleVerifySubmit} className="space-y-4 pt-2">
                            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-1">
                                <p><strong>Order:</strong> #{selectedOrder.order_number}</p>
                                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                                <p><strong>Total Due:</strong> ₱{Number(selectedOrder.total_amount).toFixed(2)}</p>
                                <p><strong>Payment Status:</strong> <span className="uppercase font-bold">{selectedOrder.payment_status}</span></p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="verify-code">Verification Code or Order #</Label>
                                <Input
                                    id="verify-code"
                                    placeholder="e.g. PK8A2D or MD-P10021"
                                    className="font-mono text-center text-lg uppercase tracking-wider font-bold"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value)}
                                    required
                                />
                            </div>

                            {selectedOrder.payment_status === 'unpaid' && (
                                <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <Label htmlFor="cash-amount" className="text-yellow-800 dark:text-yellow-300 font-semibold flex items-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        Cash Collected (₱)
                                    </Label>
                                    <Input
                                        id="cash-amount"
                                        type="number"
                                        step="0.01"
                                        placeholder={String(selectedOrder.total_amount)}
                                        value={collectedCash}
                                        onChange={(e) => setCollectedCash(e.target.value)}
                                        required
                                    />
                                    <p className="text-[11px] text-yellow-700 dark:text-yellow-400">
                                        Confirming will record cash collection and authoritatively mark order as PAID in Sales.
                                    </p>
                                </div>
                            )}

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsVerifyModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                                    Confirm Pickup Complete
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Modal 2: Reschedule Pickup ─────────────────────────────────── */}
            <Dialog open={isRescheduleModalOpen} onOpenChange={setIsRescheduleModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Reschedule Pickup Time
                        </DialogTitle>
                        <DialogDescription>
                            Adjust the expected customer pickup arrival timestamp.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedOrder && (
                        <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="reschedule-date">New Date</Label>
                                    <Input
                                        id="reschedule-date"
                                        type="date"
                                        value={newPickupDate}
                                        onChange={(e) => setNewPickupDate(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="reschedule-time">New Time</Label>
                                    <Input
                                        id="reschedule-time"
                                        type="time"
                                        value={newPickupTime}
                                        onChange={(e) => setNewPickupTime(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="reschedule-reason">Reason for Rescheduling</Label>
                                <Input
                                    id="reschedule-reason"
                                    placeholder="e.g. Customer messaged they are running 20 mins late"
                                    value={rescheduleReason}
                                    onChange={(e) => setRescheduleReason(e.target.value)}
                                    required
                                />
                            </div>

                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setIsRescheduleModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
                                    Save New Pickup Time
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Modal 3: Manual Facebook / Phone Pickup Order ─────────────── */}
            <CreatePickupOrderModal
                open={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                branches={branches}
                products={products}
                authBranchId={authBranchId}
            />
        </AppLayout>
    );
}
