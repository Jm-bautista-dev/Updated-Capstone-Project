# Real-Time Order Synchronization Summary (New Orders & Cancellations)

This document describes the **Real-Time Order Lifecycle Architecture** covering both **Live New Orders** and **Live Order Cancellations** from the Mobile App to the Web Dashboard.

---

## 1. System Architecture & Flow

```
MOBILE APP                          BACKEND                              WEB DASHBOARD
  │                                    │                                      │
  ├─── POST /api/v1/orders ───────────►│ (Validate & DB::transaction)         │
  │                                    ├── DB::commit()                       │
  │                                    └── broadcast(OrderCreated) ──────────►│ (Live Order Appears)
  │                                    │                                      │
  └─── POST /.../orders/{id}/cancel ──►│ (Validate Ownership & State)         │
                                       ├── Restore Stock & DB::commit()       │
                                       └── broadcast(OrderStatusUpdated) ────►│ (Order Updates to CANCELLED)
```

---

## 2. Event Contracts & Channels

### A. New Order Created (`OrderCreated`)
- **Channels**: `admin.orders` (Private), `branch.{branch_id}.orders` (Private)
- **Event Name**: `OrderCreated` / `.OrderCreated`
- **Payload**:
```json
{
  "order_id": 1042,
  "order_number": "ORD-2",
  "branch_id": 1,
  "customer_name": "Jane Doe",
  "total_amount": 300.00,
  "branch_name": "MAKI DESU STA CRUZ",
  "timestamp": "2026-08-17 01:30:00",
  "message": "New Order #ORD-2 received!"
}
```

### B. Order Status Updated / Cancelled (`OrderStatusUpdated`)
- **Channels**: `deliveries` (Public), `orders` (Public), `admin.orders` (Private), `branch.{branch_id}.orders` (Private), `customer.order.{order_id}` (Private)
- **Event Name**: `order-status-updated` / `OrderStatusUpdated`
- **Payload**:
```json
{
  "event": "order-status-updated",
  "delivery_id": 85,
  "order_id": 1042,
  "order_number": "ORD-2",
  "status": "cancelled",
  "status_label": "Cancelled",
  "previous_status": "pending",
  "rider_id": null,
  "branch_id": 1,
  "branch_name": "MAKI DESU STA CRUZ",
  "timestamp": "2026-08-17 01:53:00"
}
```

---

## 3. Web Dashboard Listener Implementation

In `Deliveries.tsx` & `use-real-time.tsx`:
- Subscribes to Echo channels `deliveries`, `admin.orders`, and `branch.{branch_id}.orders`.
- Listens for `.order-status-updated` and `OrderStatusUpdated`.
- Instantly updates React state (`setAccumulatedDeliveries`) for 0ms visual update, and triggers Inertia `router.reload({ only: ['deliveries', 'stats'], preserveScroll: true, preserveState: true })`.

---

## 4. Mobile App Integration Status

### **MOBILE APP CHANGE NOT REQUIRED**

- The Customer Mobile App calls the existing endpoint `POST /api/v1/customer/orders/{orderId}/cancel`.
- The backend handles validation, stock restoration, database commit, and broadcasting automatically.
- No changes to mobile app code or WebSocket logic are required for cancellation synchronization.
