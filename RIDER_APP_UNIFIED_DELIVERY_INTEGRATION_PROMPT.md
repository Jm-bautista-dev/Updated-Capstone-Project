# ============================================================
# MASTER PROMPT — MAKI CAPS RIDER MOBILE APP
# UNIFIED POS + MOBILE DELIVERIES & REAL-TIME DISPATCH INTEGRATION
# ============================================================

**Target Application**: React Native / Expo Mobile Application (Rider Subsystem)  
**Backend Framework**: Laravel 11 + Sanctum + Pusher / Laravel Echo  
**Backend Base URL**: `https://makidesuoperation.site`

---

## 🎯 OBJECTIVE

Update the **Rider Mobile Application** so that it seamlessly receives, displays, and executes deliveries originating from **both Customer Mobile Orders and POS Counter Deliveries** in real time without requiring manual pull-to-refresh.

---

## 1. REAL-TIME EVENT SUBSCRIPTION (Laravel Echo / Pusher)

Every rider must subscribe to their private channel upon login:

### Private Channel: `private-rider.{rider_id}`

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js/react-native';

export const initRiderEcho = (token: string, riderId: number) => {
    const echo = new Echo({
        broadcaster: 'pusher',
        key: process.env.EXPO_PUBLIC_PUSHER_APP_KEY,
        cluster: process.env.EXPO_PUBLIC_PUSHER_APP_CLUSTER || 'ap1',
        forceTLS: true,
        authEndpoint: 'https://makidesuoperation.site/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });

    const channel = echo.private(`rider.${riderId}`);

    // 1. When a new delivery is assigned to this rider (from Web Dispatcher or POS)
    channel.listen('OrderStatusUpdated', (event: any) => {
        console.log('[Echo] OrderStatusUpdated received:', event);
        // Event payload contains: delivery_id, order_id, order_number, order_source ('pos' | 'mobile'),
        // status, customer_name, customer_phone, customer_address, total_amount, payment_method, etc.
        useRiderStore.getState().handleOrderStatusUpdate(event);
    });

    // 2. When rider's active/inactive or available/busy status is updated
    channel.listen('RiderStatusUpdated', (event: any) => {
        console.log('[Echo] RiderStatusUpdated received:', event);
        // Event payload contains: rider_id, status, is_active, can_be_assigned
        useRiderStore.getState().updateRiderStatus(event);
    });

    // 3. When a cancellation request is resolved by the cashier/manager
    channel.listen('CancellationResolved', (event: any) => {
        console.log('[Echo] CancellationResolved received:', event);
        useRiderStore.getState().handleCancellationResolved(event);
    });

    return () => {
        echo.leave(`rider.${riderId}`);
    };
};
```

---

## 2. UNIFIED ORDER DATA STRUCTURE (Supports POS & Mobile)

Rider deliveries now include an `order_source` field:
* `order_source: 'pos'` (Created at cashier counter / POS terminal)
* `order_source: 'mobile'` (Created by customer via Mobile App)

```typescript
export interface RiderDelivery {
    id: number;                          // Delivery ID
    order_id?: number | null;            // Mobile Order ID (if mobile)
    sale_id?: number | null;             // POS Sale ID (if POS)
    order_number: string;                // e.g. "ORD-1001" or "POS-66CF12"
    order_source: 'pos' | 'mobile';      // 'pos' = In-store counter delivery, 'mobile' = App order
    status: 'assigned_to_rider' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled' | 'cancellation_requested';
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    delivery_fee: number;
    total_amount: number;
    payment_method: string;              // 'cash', 'cod', 'gcash', etc.
    payment_status?: string;             // 'paid', 'unpaid', 'pending'
    items: Array<{
        id: number;
        product_name: string;
        quantity: number;
        price: number;
        image_url?: string;
    }>;
    created_at: string;
    updated_at: string;
}
```

---

## 3. UI BADGE & ORDER SOURCE DISPLAY

In your Rider Order Card and Delivery Details screen, render clear source indicators:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const OrderSourceBadge = ({ source }: { source?: 'pos' | 'mobile' }) => {
    const isPos = source === 'pos';
    return (
        <View style={[styles.badge, isPos ? styles.posBadge : styles.mobileBadge]}>
            <Text style={[styles.badgeText, isPos ? styles.posText : styles.mobileText]}>
                {isPos ? '🖥️ POS COUNTER' : '📱 MOBILE ORDER'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    posBadge: {
        backgroundColor: '#EDE9FE', // Light Purple
        borderColor: '#DDD6FE',
        borderWidth: 1,
    },
    posText: {
        color: '#6D28D9',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mobileBadge: {
        backgroundColor: '#E0F2FE', // Light Blue
        borderColor: '#BAE6FD',
        borderWidth: 1,
    },
    mobileText: {
        color: '#0369A1',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
});
```

---

## 4. API WORKFLOW ENDPOINTS (Sanctum Authenticated)

All endpoints accept Bearer token authentication: `Authorization: Bearer <token>` and `Accept: application/json`.

### 1. Active / Inactive Status Toggle (Real-Time Synchronized with Web Nav)
* **Endpoint**: `POST /api/v1/rider/status` or `PATCH /api/v1/rider/status`
* **Payload**:
```json
{
  "is_active": true
}
```
* **Response**:
```json
{
  "success": true,
  "is_active": true,
  "status": "available",
  "message": "Status updated to available"
}
```

---

### 2. Fetch Assigned / Active Tasks
* **Endpoint**: `GET /api/v1/rider/my-orders`
* **Response**:
```json
{
  "success": true,
  "orders": [
    {
      "id": 501,
      "order_number": "POS-89AB12",
      "order_source": "pos",
      "status": "assigned_to_rider",
      "customer_name": "Juan Dela Cruz",
      "customer_phone": "09171234567",
      "customer_address": "123 Rizal St, Victoria",
      "total_amount": 250.00,
      "delivery_fee": 50.00,
      "items": [...]
    }
  ]
}
```

---

### 3. Order Workflow Status Transitions
When the rider progresses through the delivery milestones:

| Action | HTTP Method & Route | Description |
| :--- | :--- | :--- |
| **Accept** | `POST /api/v1/rider/orders/{id}/accept` | Rider accepts assigned delivery |
| **Pick Up** | `POST /api/v1/rider/orders/{id}/pickup` | Rider arrives at branch and collects items |
| **Start Transit** | `POST /api/v1/rider/orders/{id}/transit` | Rider leaves branch -> Out for Delivery (Locks rider) |
| **Deliver** | `POST /api/v1/rider/orders/{id}/deliver` | Delivers to customer (Frees rider to 'available') |
| **Cancel Request** | `POST /api/v1/rider/orders/{id}/cancel` | Rider requests order cancellation with reason |

---

### 4. Completing Delivery with Proof of Delivery Photo
* **Endpoint**: `POST /api/v1/rider/orders/{id}/deliver`
* **Content-Type**: `multipart/form-data`
* **Form Data**:
  * `proof_of_delivery`: Image file (jpg, png, webp - max 5MB)
  * `notes`: Optional string (e.g. "Left with guard")

```typescript
export const deliverOrderWithProof = async (orderId: number, photoUri?: string, notes?: string) => {
    const formData = new FormData();
    if (photoUri) {
        const filename = photoUri.split('/').pop() || 'proof.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('proof_of_delivery', {
            uri: photoUri,
            name: filename,
            type,
        } as any);
    }
    if (notes) {
        formData.append('notes', notes);
    }

    const response = await api.post(`/api/v1/rider/orders/${orderId}/deliver`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
```

---

### 5. Rider Cancellation Request
* **Endpoint**: `POST /api/v1/rider/orders/{id}/cancel`
* **Payload**:
```json
{
  "reason": "Customer unreachable at delivery address",
  "notes": "Called 5 times, guard says tenant is out of town",
  "idempotency_key": "cancel-order-501-1724810000"
}
```

---

## 5. ZUSTAND / STORE REAL-TIME HANDLER (No Refresh Needed)

```typescript
import { create } from 'zustand';

interface RiderState {
    isActive: boolean;
    availability: 'available' | 'busy' | 'offline';
    activeDeliveries: RiderDelivery[];
    completedDeliveries: RiderDelivery[];
    
    // Actions
    setRiderState: (isActive: boolean, availability: 'available' | 'busy' | 'offline') => void;
    handleOrderStatusUpdate: (event: any) => void;
    updateRiderStatus: (event: any) => void;
    handleCancellationResolved: (event: any) => void;
}

export const useRiderStore = create<RiderState>((set, get) => ({
    isActive: true,
    availability: 'available',
    activeDeliveries: [],
    completedDeliveries: [],

    setRiderState: (isActive, availability) => set({ isActive, availability }),

    handleOrderStatusUpdate: (event) => {
        const { delivery_id, order_id, status } = event;
        set((state) => {
            const currentList = [...state.activeDeliveries];
            const index = currentList.findIndex(d => d.id === delivery_id || d.order_id === order_id);

            if (status === 'delivered' || status === 'cancelled') {
                // Remove from active tasks and move to completed
                const completedItem = currentList[index];
                return {
                    activeDeliveries: currentList.filter((_, i) => i !== index),
                    completedDeliveries: completedItem ? [completedItem, ...state.completedDeliveries] : state.completedDeliveries,
                };
            }

            if (index >= 0) {
                // Update existing delivery
                currentList[index] = { ...currentList[index], ...event, status };
                return { activeDeliveries: currentList };
            } else if (event.rider_id) {
                // Newly assigned delivery received via real-time
                return { activeDeliveries: [event as RiderDelivery, ...currentList] };
            }

            return state;
        });
    },

    updateRiderStatus: (event) => {
        set({
            isActive: event.is_active ?? get().isActive,
            availability: event.status ?? get().availability,
        });
    },

    handleCancellationResolved: (event) => {
        const { order_id, cancellation_request_status } = event;
        if (cancellation_request_status === 'approved') {
            set((state) => ({
                activeDeliveries: state.activeDeliveries.filter(d => d.order_id !== order_id && d.id !== event.delivery_id),
            }));
        }
    },
}));
```

---

## 6. VERIFICATION CHECKLIST

- [ ] Assigned POS deliveries appear immediately in Rider App task list via `private-rider.{id}`.
- [ ] Assigned Mobile orders appear immediately in Rider App task list.
- [ ] `order_source` displays `🖥️ POS COUNTER` or `📱 MOBILE ORDER` on each task card.
- [ ] Rider toggling **Active / Inactive** updates the Web Dispatcher table immediately without web refresh.
- [ ] Rider advancing statuses (`Pick Up` -> `Start Transit` -> `Deliver`) updates Web Delivery Nav in real time.
- [ ] Submitting proof of delivery photo successfully completes the delivery and frees the rider to `available`.
