# Order Number Architecture & Integration Summary

This document describes the **Reusable Customer-Facing Order Number System** (`ORD-1`, `ORD-2`, etc.) coexisting with the **Permanent Internal Order Primary Key** (`id`).

---

## 1. Dual Identification Architecture

| Identifier | Column / Field | Characteristics | Primary Use Cases |
| :--- | :--- | :--- | :--- |
| **Internal Order ID** | `id` (integer) | Permanent, immutable, unique, never recycled | Foreign keys, DB relationships, API parameters, payments, inventory deductions, sales, delivery references, audit logs |
| **Customer Order Number** | `order_number` (string) | Short, human-readable, reusable (`ORD-1`, `ORD-2`, ..., `ORD-N`) | Mobile app display, Website operational display, Receipts, Delivery rider app, Notifications, Customer verbal communication |

---

## 2. Reusable Number Allocation & Release Rules

1. **Format**: `ORD-1`, `ORD-2`, `ORD-3`, ..., `ORD-N`.
2. **Scope**: Branch-specific active order pool (`branch_id`).
3. **Active State Reservation**:
   - While an order is in an **active** status (`pending`, `confirmed`, `preparing`, `ready_for_pickup`, `assigned_to_rider`, `picked_up`, `in_transit`), its customer order number (`ORD-X`) remains **strictly reserved**.
   - An active order number is **never** assigned to another active order in the same branch simultaneously.
4. **Terminal Release & Reuse**:
   - When an order reaches a **terminal status** (`delivered` or `cancelled`), its customer-facing number (`ORD-X`) becomes **eligible for reuse** by subsequent new orders.
   - Deterministic Allocation: Allocates the smallest positive integer $N \ge 1$ (`ORD-N`) not currently held by an active order in that branch scope.
5. **Concurrency & Atomic Locks**:
   - Number allocation is wrapped in a `DB::transaction` with row locking (`lockForUpdate()`) to guarantee concurrency safety during peak submission volumes.

---

## 3. API Payload & Event Structures

### A. Order Placement Endpoint (`POST /api/v1/orders`)
**Response Payload (`201 Created`)**:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order_id": 1042,
  "order_number": "ORD-2"
}
```

### B. Real-Time Broadcast Event (`OrderCreated`)
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

---

## 4. Mobile App Integration Instructions

### Do Mobile App Changes Required?
- **MINIMAL COMPATIBILITY CHANGE**: The customer mobile app receives `order_number` in the API response upon creation and in order history/status endpoints.
- **Rules for Mobile App Developers**:
  1. **Display `order_number` (`ORD-2`)** to the customer on UI screens, receipts, and order tracking headers.
  2. **Use `order_id` (`1042`)** internally when calling API endpoints (such as `POST /api/v1/customer/orders/{orderId}/cancel` or `GET /api/v1/orders/{orderId}`).
  3. **DO NOT** generate or increment order numbers on the client side. The backend is the single source of truth.

---

# MOBILE APP ORDER NUMBER INTEGRATION PROMPT

```markdown
# TASK: Integrate Reusable Customer Order Numbers in Mobile App

We have implemented a Reusable Customer Order Number System in the backend.

### 1. Dual Identifiers
- `order_id` (integer): Permanent unique internal ID. Use this for ALL API parameters, navigation parameters, and local storage keys.
- `order_number` (string): Short human-readable customer order number (e.g. `ORD-1`, `ORD-2`). Use this ONLY for display to the customer (headers, cards, receipts, status tracking).

### 2. API Response Update (`POST /api/v1/orders`)
The order creation endpoint returns:
```json
{
  "success": true,
  "message": "Order placed successfully",
  "order_id": 1042,
  "order_number": "ORD-2"
}
```

### 3. Requirements
- Display `order_number` (e.g. "Order ORD-2") on order confirmation, tracking, and history list screens.
- Keep `order_id` as the primary identifier when fetching order details (`GET /api/v1/customer/orders/{order_id}`) or cancelling orders (`POST /api/v1/customer/orders/{order_id}/cancel`).
- Do NOT generate or increment order numbers on the mobile device.
```
