export interface Delivery {
    id: number;
    order_id?: number | null;
    sale_id?: number | null;
    fulfillment_type?: 'delivery' | 'pickup';
    is_pickup?: boolean;
    delivery_type: 'internal' | 'external' | 'pickup';
    order_source?: 'pos' | 'mobile';
    external_service: 'grab' | 'lalamove' | null;
    tracking_number: string | null;
    status: string;
    status_label: string;
    status_color: string;
    customer_name: string;
    customer_address: string;
    customer_phone: string | null;
    distance_km: number | null;
    delivery_fee: number;
    created_at: string;
    updated_at: string;
    delivered_at?: string | null;
    next_statuses: string[];
    is_cancelled: boolean;
    is_delivered: boolean;
    is_failed?: boolean;
    can_mark_failed?: boolean;
    waiting_minutes?: number;
    queue_position?: number | null;
    cancellation_reason?: string | null;
    cancelled_at?: string | null;
    cancelled_by_name?: string | null;
    scheduled_pickup_at?: string | null;
    scheduled_pickup_display?: string | null;
    pickup_verification_code?: string | null;
    estimated_prep_time_minutes?: number;
    prep_start_at?: string | null;
    // Location fields from GPS
    latitude?: number | null;
    longitude?: number | null;
    landmark?: string | null;
    notes?: string | null;
    sale?: {
        order_number: string;
        total: number;
        branch: { name: string };
        items?: Array<{
            id: number;
            product: { name: string; image_url?: string };
            quantity: number;
            unit_price: number;
            subtotal: number;
        }>;
    } | null;
    cancellation_request?: {
        id: number;
        reason: string;
        notes?: string | null;
        status: string;
        requested_at?: string | null;
        requested_by_rider?: { name: string } | null;
    } | null;
    order?: {
        id: number;
        order_number?: string;
        total_amount: number;
        status?: string;
        branch?: { name: string; latitude?: number; longitude?: number } | null;
        cancellation_request?: {
            id: number;
            reason: string;
            notes?: string | null;
            status: string;
            requested_at?: string | null;
            requested_by_rider?: { name: string } | null;
        } | null;
        items?: Array<{
            id: number;
            product: { name: string; image_url?: string };
            quantity: number;
            price: number;
        }>;
    } | null;
    rider_id: number | null;
    rider?: { id?: number; name: string; phone?: string };
    external_notes?: string | null;
    delivery_notes?: string | null;
    // Proof of delivery
    proof_of_delivery?: string | null;
    proof_of_delivery_url?: string | null;
}

export interface DeliveryPagination {
    data: Delivery[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export interface DeliveryFilters {
    view?: 'today' | 'archive';
    status?: string;
    type?: string;
    branch_id?: string;
    rider_id?: string;
    search?: string;
    date_preset?: 'all' | 'today' | 'yesterday' | 'last_7_days' | 'this_month' | 'custom';
    start_date?: string;
    end_date?: string;
}

export interface DeliveryStatsData {
    all_count?: number;
    delivery_count?: number;
    pickup_count?: number;
    waiting?: number;
    preparing?: number;
    ready?: number;
    assigned?: number;
    in_transit?: number;
    delivered: number;
    delivered_today?: number;
    total_historical?: number;
    failed?: number;
    delayed: number;
    pending: number;
    active: number;
}

export interface Branch {
    id: number;
    name: string;
}

export type ViewMode = 'card' | 'table';

export interface Rider {
    id: number;
    name: string;
    phone?: string;
    is_active?: boolean;
    account_status?: 'active' | 'inactive';
    status: 'available' | 'busy' | 'offline';
    branch_id?: number | null;
    branch_name: string;
    active_deliveries: number;
    active_in_transit_count?: number;
    active_pickup_count?: number;
    is_out_for_delivery?: boolean;
    can_be_assigned?: boolean;
}

export const STATUS_GROUPS = [
    { key: 'waiting_for_kitchen', label: 'New Orders',     statuses: ['waiting_for_kitchen', 'pending'], color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-200 dark:border-orange-900/30', ring: 'ring-orange-500/10' },
    { key: 'preparing',           label: 'Preparing',      statuses: ['preparing'],         color: 'text-blue-600 dark:text-blue-400',     bg: 'bg-blue-50 dark:bg-blue-950/20',      border: 'border-blue-200 dark:border-blue-900/30',   ring: 'ring-blue-500/10' },
    { key: 'ready_for_pickup',    label: 'Ready for Pickup', statuses: ['ready_for_pickup'],  color: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/20',     border: 'border-amber-200 dark:border-amber-900/30',  ring: 'ring-amber-500/10' },
    { key: 'assigned_to_rider',   label: 'Rider Assigned', statuses: ['assigned_to_rider'], color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20',  border: 'border-indigo-200 dark:border-indigo-900/30', ring: 'ring-indigo-500/10' },
    { key: 'in_transit',          label: 'In Transit',     statuses: ['picked_up', 'in_transit'], color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950/20', border: 'border-violet-200 dark:border-violet-900/30', ring: 'ring-violet-500/10' },
    { key: 'failed_delivery',     label: 'Failed / Reassign', statuses: ['failed_delivery'], color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200 dark:border-red-900/30', ring: 'ring-red-500/10' },
    { key: 'delivered',           label: 'Delivered',      statuses: ['delivered'],         color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-900/30', ring: 'ring-emerald-500/10' },
    { key: 'cancelled',           label: 'Cancelled',      statuses: ['cancelled'],         color: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-950/20',      border: 'border-rose-200 dark:border-rose-900/30',   ring: 'ring-rose-500/10' },
] as const;

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
