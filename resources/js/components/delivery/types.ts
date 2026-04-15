export interface Delivery {
    id: number;
    sale_id: number;
    delivery_type: 'internal' | 'external';
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
    next_statuses: string[];
    sale?: {
        order_number: string;
        total: number;
        branch: { name: string };
    } | null;
    order?: {
        id: number;
        total_amount: number;
        branch?: { name: string } | null;
    } | null;
    rider?: { name: string };
    external_notes?: string | null;
    proof_of_delivery_url?: string | null;
}

export interface DeliveryPagination {
    data: Delivery[];
    links: any[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
}

export interface DeliveryFilters {
    status?: string;
    type?: string;
    branch_id?: string;
    search?: string;
}

export interface DeliveryStatsData {
    pending: number;
    active: number;
    delivered: number;
    delayed: number;
}

export interface Branch {
    id: number;
    name: string;
}

export type ViewMode = 'card' | 'table';

export const STATUS_GROUPS = [
    { key: 'pending', label: 'Pending', statuses: ['pending'], color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-500/20' },
    { key: 'preparing', label: 'Preparing', statuses: ['preparing'], color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-blue-500/20' },
    { key: 'in_transit', label: 'In Transit', statuses: ['out_for_delivery'], color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', ring: 'ring-violet-500/20' },
    { key: 'delivered', label: 'Delivered', statuses: ['delivered'], color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-500/20' },
] as const;

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

export const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
