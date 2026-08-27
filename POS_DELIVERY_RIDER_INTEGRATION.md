# POS WALK-IN DELIVERY & MOBILE RIDER APP INTEGRATION ARCHITECTURE

## 1. Executive Summary

MakiCaps supports delivery dispatching from two distinct order sources that converge into a **Single Unified Delivery Domain**:
1. **Source 1: Mobile App Customer Deliveries** (`order_id` references `orders.id`, `sale_id` created upon delivery completion)
2. **Source 2: POS Walk-in Counter Deliveries** (`sale_id` references `sales.id`, `order_id = null`)

Both sources use the **same Delivery lifecycle, same rider assignment rules, same pickup endpoints, and same realtime events**.

```
                ORDER SOURCE
                     │
           ┌─────────┴─────────┐
           ↓                   ↓
    CUSTOMER MOBILE           POS
     APP ORDER          WALK-IN ORDER
     (orders table)      (sales table)
           │                   │
           └─────────┬─────────┘
                     ↓
             deliveries TABLE
        (Unified Delivery Record)
                     ↓
             ASSIGN RIDER (Web)
                     ↓
        RIDER MOBILE APP (Assigned)
                     ↓
             PICK UP (HTTP POST)
                     ↓
         OUT FOR DELIVERY (Transit)
                     ↓
           DELIVERED (Completed)
```

---

## 2. Database Schema & Dual-Source Resolution

### `deliveries` Table Columns
- `id` (BIGINT, Primary Key) — **The unique, permanent delivery ID**.
- `order_id` (BIGINT, Nullable, Foreign Key -> `orders.id`) — Populated for Mobile App orders.
- `sale_id` (BIGINT, Nullable, Foreign Key -> `sales.id`) — Populated for POS Walk-in Counter deliveries.
- `rider_id` (BIGINT, Nullable, Foreign Key -> `riders.id`).
- `status` (VARCHAR(50)) — Current delivery status:
  - `ready_for_pickup`
  - `assigned_to_rider`
  - `picked_up`
  - `in_transit`
  - `delivered`
  - `cancelled`
  - `cancellation_requested`
- `customer_name` (VARCHAR)
- `customer_phone` (VARCHAR, Nullable)
- `customer_address` (TEXT)
- `latitude` / `longitude` (DECIMAL(11,8), Nullable)
- `delivery_fee` (DECIMAL(8,2))
- `proof_of_delivery` (VARCHAR, Nullable)
- `picked_up_at` / `transit_at` / `delivered_at` (TIMESTAMP, Nullable)

---

## 3. Rider API Endpoints & Actions

All endpoints require `Authorization: Bearer <Sanctum_Token>` for an active Rider account.

### 1. Active Task Queue
- **Endpoint**: `GET /api/v1/rider/my-orders` (Alias: `GET /api/v1/orders/my`)
- **Description**: Returns all active deliveries assigned to the authenticated rider (both POS and Mobile).
- **Sort Order**: `in_transit` (1) → `picked_up` (2) → `assigned_to_rider` (3) → `ready_for_pickup` (4).

### 2. Available Orders Feed (Pickup Pool)
- **Endpoint**: `GET /api/v1/rider/orders` (Alias: `GET /api/v1/orders/ready`)
- **Description**: Returns unassigned orders for the rider's branch.

### 3. Pick Up Action
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/pickup` (Alias: `POST /api/v1/rider/orders/{id}/pickup`)
- **Parameter `{id}`**: Accepts `delivery_id`, `order_id`, or `sale_id`.
- **Backend Behavior**:
  1. Validates rider authentication & branch authorization.
  2. Ensures rider is not currently on an active route (`in_transit`).
  3. Transitions `Delivery.status` → `picked_up`, sets `picked_up_at = now()`.
  4. If `$delivery->order` exists, transitions `Order.status` → `picked_up`.
  5. If `$delivery->sale` exists, updates `Sale.status` → `picked_up`.
  6. Dispatches `OrderStatusUpdated` and `RiderStatusUpdated` realtime events.
- **Success Response (HTTP 200)**:
```json
{
  "success": true,
  "message": "Order marked as picked up! Please head to the customer.",
  "data": {
    "id": 15,
    "delivery_id": 15,
    "order_id": null,
    "sale_id": 42,
    "order_number": "POS-66CF12",
    "order_source": "pos",
    "status": "picked_up",
    "status_label": "Picked Up",
    "customer_name": "Walk-in Customer John",
    "customer_phone": "09187654321",
    "customer_address": "Victoria Residenza Blk 4",
    "total_amount": 300.00,
    "delivery_fee": 50.00,
    "items": [
      {
        "product_name": "Classic Pearl Milk Tea",
        "quantity": 2,
        "price": 150.00,
        "subtotal": 300.00
      }
    ]
  }
}
```

### 4. Start Transit (Out for Delivery)
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/transit` (Alias: `POST /api/v1/rider/orders/{id}/transit`)
- **Backend Behavior**: Updates `Delivery`, `Order`, and `Sale` status to `in_transit`, locks rider from accepting/picking up additional deliveries.

### 5. Deliver (Complete Delivery)
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/deliver` (Alias: `POST /api/v1/rider/orders/{id}/deliver`)
- **Multipart Form Data**:
  - `proof_of_delivery`: (Image file, optional/recommended)
  - `notes`: (String, optional)
- **Backend Behavior**: Marks `Delivery`, `Order`, and `Sale` as `delivered`, sets `delivered_at = now()`, frees up the rider to `available` status if no active tasks remain.

---

## 4. Inventory & Financial Integrity

1. **Inventory Deduction Timing**:
   - **POS Walk-in Orders**: Ingredients/stocks are deducted immediately during POS cashier checkout. **Pickup does NOT deduct stock a second time**.
   - **Customer Mobile Orders**: Stock is reserved and confirmed during order placement / fulfillment.
2. **Sales Recognition**:
   - POS Walk-in Orders are registered into `sales` table at cashier checkout. Delivery completion records final fulfillment without creating duplicate sales rows.

---

## 5. Realtime Broadcasting Architecture

- **Channel**: `private-rider.{rider_id}`
- **Broadcast Events**:
  - `order-status-updated` (Alias: `OrderStatusUpdated`): Triggers live UI state update on Website Delivery dashboard and Rider App.
  - `RiderStatusUpdated`: Triggers rider active/busy status updates across Dispatchers.
  - `OrderAssigned`: Triggers instant assignment notification sound/card in Rider App.
