export interface ProductItem {
    id: number;
    name: string;
    sku: string | null;
    selling_price: number;
    category_name: string;
    branch_name: string;
    image_url: string | null;
    total_reviews: number;
    unseen_count: number;
    average_rating: number;
    rating_distribution: Record<string, number>;
}

export interface ReviewItem {
    id: number;
    user_id: number;
    product_id: number;
    order_id: number | null;
    order_number: string | null;
    branch_id: number | null;
    rating: number;
    comment: string | null;
    status: 'published' | 'hidden' | 'flagged' | 'pending';
    is_seen: boolean;
    seen_at: string | null;
    is_verified_purchase: boolean;
    admin_response: string | null;
    is_auto_reply?: boolean;
    admin_responded_at: string | null;
    created_at: string | null;
    user: { id: number; name: string; email: string } | null;
    product: { id: number; name: string; image_path?: string | null } | null;
    branch: { id: number; name: string } | null;
    responder: { id: number; name: string } | null;
    seen_by: { id: number; name: string } | null;
}

export interface ReviewStats {
    total_products: number;
    total_reviews: number;
    unseen_reviews: number;
    average_rating: number;
    published_count: number;
    flagged_count: number;
}

export interface ReviewFilters {
    status?: string;
    rating?: string;
    product_id?: string;
    seen_status?: string;
    verified_purchase?: string;
    branch_id?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
}

export interface PaginatedReviews {
    data: ReviewItem[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from?: number | null;
    to?: number | null;
}
