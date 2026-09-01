# Real-Time Delivery Status & Delivery Sales Integration Guide

## 1. System Overview & Architecture

This document specifies the real-time synchronization contract between the **Rider Mobile App**, the **Laravel Backend**, and the **Web Admin & Cashier Portal** for Maki-Desu Operations.

```
┌─────────────────────────┐
│    Rider Mobile App     │
│ (React Native / Flutter)│
└────────────┬────────────┘
             │ 1. POST /api/v1/rider/orders/{id}/(pickup|transit|deliver)
             ▼
┌──────────────────────────────────────────────────────────┐
│                     Laravel Backend                      │
│                                                          │
│  1. Authenticate Rider & Validate State Transition       │
│  2. DB::transaction(function() {                         │
│       - Update deliveries / orders status                │
│       - Recognize Sale & compute financials (on deliver) │
│       - Deduct inventory idempotently (on deliver)       │
│     })                                                   │
│  3. Database Commit Finished                             │
│  4. Broadcast Events (ShouldBroadcastNow):               │
│       - OrderStatusUpdated                               │
│       - SaleCreated                                      │
│       - RiderStatusUpdated                               │
└────────────┬─────────────────────────────────────────────┘
             │ WebSocket via Reverb / Pusher / Echo
             ▼
┌──────────────────────────────────────────────────────────┐
│                 Web Admin & Cashier Portal               │
│                                                          │
│  1. Subscribed Channels:                                 │
│     - `private-admin.orders` (Admin / Super Admin)       │
│     - `private-branch.{branch_id}.orders` (Cashier)      │
│  2. Instantly updates React State (Zero Latency)         │
│  3. Partial Inertia reload (Preserves scroll & UI state) │
│  4. Deliveries, Sales, Dashboard & Reports update LIVE   │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Rider API Endpoints & Request Specifications

All rider endpoints require authentication using the Sanctum Bearer Token:
```http
Authorization: Bearer <RIDER_SANCTUM_TOKEN>
Accept: application/json
Content-Type: application/json
```

### A. Accept Order
- **Endpoint:** `POST /api/v1/rider/orders/{id}/accept`
- **Aliases:** `POST /api/v1/rider/accept/{id}`, `POST /api/v1/rider/deliveries/{id}/accept`
- **Payload:** None (or `{ "notes": "optional notes" }`)
- **Status Change:** `pending` / `preparing` / `ready_for_pickup` &rarr; `assigned_to_rider`
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order accepted successfully.",
  "data": {
    "id": 105,
    "order_id": 42,
    "sale_id": null,
    "order_number": "ORD-2026-0042",
    "status": "assigned_to_rider",
    "status_label": "Assigned to Rider",
    "rider_id": 7,
    "rider_name": "Juan Dela Cruz",
    "customer_name": "Maria Santos",
    "customer_phone": "09171234567",
    "customer_address": "123 Rizal St, Victoria, Laguna",
    "delivery_fee": 50.00,
    "total_amount": 450.00,
    "updated_at": "2026-09-01T09:30:00.000000Z"
  }
}
```

---

### B. Mark Picked Up
- **Endpoint:** `POST /api/v1/rider/orders/{id}/pickup`
- **Aliases:** `POST /api/v1/rider/pickup/{id}`, `POST /api/v1/rider/deliveries/{id}/pickup`
- **Payload:** None (or `{ "notes": "Picked up from kitchen counter" }`)
- **Status Change:** `assigned_to_rider` &rarr; `picked_up`
- **Idempotency:** Calling pickup on an order already `picked_up` or `in_transit` safely returns `200 OK` without throwing an error.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order marked as picked up.",
  "data": {
    "id": 105,
    "order_id": 42,
    "sale_id": null,
    "order_number": "ORD-2026-0042",
    "status": "picked_up",
    "status_label": "Picked Up",
    "rider_id": 7,
    "rider_name": "Juan Dela Cruz",
    "picked_up_at": "2026-09-01T09:35:10.000000Z",
    "updated_at": "2026-09-01T09:35:10.000000Z"
  }
}
```

---

### C. Start Transit / Out for Delivery
- **Endpoint:** `POST /api/v1/rider/orders/{id}/transit`
- **Aliases:** `POST /api/v1/rider/transit/{id}`, `POST /api/v1/rider/deliveries/{id}/transit`
- **Payload:** None (or `{ "latitude": 14.2281, "longitude": 121.3289 }`)
- **Status Change:** `picked_up` &rarr; `in_transit`
- **Idempotency:** Calling transit on an order already `in_transit` safely returns `200 OK`.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Delivery is now in transit.",
  "data": {
    "id": 105,
    "order_id": 42,
    "sale_id": null,
    "order_number": "ORD-2026-0042",
    "status": "in_transit",
    "status_label": "In Transit",
    "rider_id": 7,
    "rider_name": "Juan Dela Cruz",
    "transit_at": "2026-09-01T09:36:00.000000Z",
    "updated_at": "2026-09-01T09:36:00.000000Z"
  }
}
```

---

### D. Complete Delivery (Mark as Delivered)
- **Endpoint:** `POST /api/v1/rider/orders/{id}/deliver`
- **Aliases:** `POST /api/v1/rider/deliver/{id}`, `POST /api/v1/rider/deliveries/{id}/deliver`
- **Payload (Optional Multipart or JSON):**
```json
{
  "notes": "Delivered to customer in person",
  "proof_of_delivery": "optional_image_file_or_base64"
}
```
- **Status Change:** `in_transit` / `picked_up` &rarr; `delivered`
- **Financial Recognition:**
  1. Authoritative `Sale` record is created with:
     - `subtotal`: Items subtotal (excluding delivery fee).
     - `delivery_fee`: Rider delivery fee.
     - `total`: `subtotal + delivery_fee`.
     - `cost_total`: Cost of goods sold based on recipe ingredients.
     - `profit`: `subtotal - cost_total`.
     - `status`: `completed`.
  2. Ingredient inventory is deducted idempotently.
  3. Rider is returned to `available` status.
- **Idempotency:** Double-tapping or duplicate requests return `200 OK` with the existing `sale_id` and do NOT create duplicate sales or duplicate stock deductions.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Order marked as delivered successfully.",
  "data": {
    "id": 105,
    "order_id": 42,
    "sale_id": 89,
    "order_number": "ORD-2026-0042",
    "status": "delivered",
    "status_label": "Delivered",
    "is_delivered": true,
    "delivered_at": "2026-09-01T09:50:00.000000Z",
    "rider_id": 7,
    "rider_name": "Juan Dela Cruz",
    "proof_of_delivery_url": "https://makidesuoperation.site/storage/proofs/proof_105.jpg",
    "sale": {
      "id": 89,
      "subtotal": 400.00,
      "delivery_fee": 50.00,
      "total": 450.00,
      "payment_method": "cash",
      "status": "completed"
    }
  }
}
```

---

### E. Universal Status Dispatcher
- **Endpoint:** `POST /api/v1/rider/orders/{id}/status`
- **Aliases:** `PATCH /api/v1/rider/orders/{id}/status`, `PUT /api/v1/rider/orders/{id}/status`, `POST /api/v1/rider/deliveries/{id}/status`
- **Payload:**
```json
{
  "status": "picked_up" // Options: "accepted", "picked_up", "in_transit", "delivered", "rejected", "cancelled"
}
```

---

## 3. Real-Time WebSocket Event Contract

### Channel Subscriptions

| Channel Name | Authorized Role | Description |
| :--- | :--- | :--- |
| `private-admin.orders` | Admin / Super Admin | Receives all real-time order, delivery, sales, and cancellation events across all branches. |
| `private-branch.{branch_id}.orders` | Cashier (assigned to branch) | Receives events scoped specifically to that branch. |
| `private-customer.order.{order_id}` | Customer | Receives live progress updates for their specific order. |
| `private-rider.{rider_id}` | Rider | Receives assignment alerts and delivery updates for that rider. |

---

### Event 1: `OrderStatusUpdated` (and `.order-status-updated`)
Broadcasted immediately after order or delivery status changes in the database.

**Payload:**
```json
{
  "delivery_id": 105,
  "order_id": 42,
  "sale_id": 89,
  "order_number": "ORD-2026-0042",
  "status": "delivered",
  "status_label": "Delivered",
  "updated_by": "Juan Dela Cruz",
  "customer_name": "Maria Santos",
  "customer_phone": "09171234567",
  "customer_address": "123 Rizal St, Victoria, Laguna",
  "rider_id": 7,
  "rider_name": "Juan Dela Cruz",
  "rider_phone": "09171234567",
  "delivery_fee": 50.00,
  "proof_of_delivery_url": "https://makidesuoperation.site/storage/proofs/proof_105.jpg",
  "delivered_at": "2026-09-01T09:50:00.000000Z",
  "timestamp": "2026-09-01T09:50:00.000000Z",
  "branch_id": 1,
  "branch_name": "Victoria Branch"
}
```

---

### Event 2: `SaleCreated` (and `.SaleCreated`)
Broadcasted immediately when a delivery is completed and financially recognized as a `Sale`.

**Payload:**
```json
{
  "sale_id": 89,
  "order_id": 42,
  "order_number": "ORD-2026-0042",
  "branch_id": 1,
  "branch_name": "Victoria Branch",
  "subtotal": 400.00,
  "delivery_fee": 50.00,
  "total": 450.00,
  "cost_total": 120.00,
  "profit": 280.00,
  "payment_method": "cash",
  "type": "delivery",
  "timestamp": "2026-09-01T09:50:00.000000Z"
}
```

---

### Event 3: `RiderStatusUpdated` (and `.RiderStatusUpdated`)
Broadcasted when rider status or active deliveries change.

**Payload:**
```json
{
  "rider_id": 7,
  "id": 7,
  "name": "Juan Dela Cruz",
  "status": "available",
  "is_active": true,
  "account_status": "active",
  "is_out_for_delivery": false,
  "branch_id": 1,
  "branch_name": "Victoria Branch",
  "active_deliveries": 0,
  "timestamp": "2026-09-01T09:50:00.000000Z"
}
```

---

## 4. Copy-Paste AI Prompt for Rider Mobile App Developer

```markdown
# Instructions for Rider Mobile App AI / Developer

You are implementing or updating the delivery status synchronization in the Maki-Desu Rider Mobile App.

## 1. Authentication & Base URL
- **Base URL:** `https://makidesuoperation.site` (Production) or your local backend API host.
- Include header: `Authorization: Bearer <RIDER_TOKEN>`
- Include header: `Accept: application/json`
- Include header: `Content-Type: application/json`

## 2. Delivery Status Workflow & Endpoints

When the rider clicks status buttons on the app, send requests to the following endpoints:

1. **When Rider Accepts Order:**
   - `POST /api/v1/rider/orders/{delivery_id}/accept`
   - Moves order to `assigned_to_rider`.

2. **When Rider Arrives at Branch & Picks Up Food:**
   - `POST /api/v1/rider/orders/{delivery_id}/pickup`
   - Moves status to `picked_up`.

3. **When Rider Departs Branch & Starts Heading to Customer:**
   - `POST /api/v1/rider/orders/{delivery_id}/transit`
   - Moves status to `in_transit`.
   - Optionally send `{ "latitude": 14.228, "longitude": 121.328 }`.

4. **When Rider Hands Food to Customer (Delivered):**
   - `POST /api/v1/rider/orders/{delivery_id}/deliver`
   - Payload:
     ```json
     {
       "notes": "Delivered in person",
       "proof_of_delivery": "<optional file upload or base64 image>"
     }
     ```
   - This marks status as `delivered` and completes the sale on the backend in real-time.

5. **Universal Status Update Dispatcher (Alternative):**
   - `POST /api/v1/rider/orders/{delivery_id}/status`
   - Body: `{ "status": "picked_up" | "in_transit" | "delivered" | "rejected" }`

## 3. Best Practices
- **Network Resilience:** The backend endpoints are idempotent. If a request times out or is double-tapped, re-sending the same request is completely safe.
- **Local Optimistic Update:** You may update local app state immediately when the button is pressed, and rollback if the API responds with an error code (4xx / 5xx).
```
