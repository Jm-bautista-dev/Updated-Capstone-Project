# Delivery State Machine Integration Summary

## 1. Root Cause Analysis of the Loop Bug

### What Happened
1. **Misinterpreted Action vs. State in Mobile UI**:
   - When the rider tapped **ACCEPT**, the delivery status changed to `assigned_to_rider`.
   - The Mobile UI incorrectly treated `assigned_to_rider` as an already-completed pickup, or labeled the button with past tense (`"PICKED UP"`) instead of an imperative action (`"PICK UP ORDER"`).
2. **Re-fetching Wrong Endpoint / Query Key**:
   - When the pickup endpoint was triggered, the delivery transitioned to `picked_up`.
   - The Mobile App re-queried `GET /api/v1/rider/orders` (which returns only **available unassigned** orders where `rider_id IS NULL`).
   - Because the delivery was now assigned/picked up, it disappeared from the `/orders` feed, causing the mobile screen to revert back to the initial state with the **[ ACCEPT ]** button.

### How It Has Been Fixed
1. **Strict One-Way State Machine**:
   - `ready_for_pickup` (unassigned) ➔ `assigned_to_rider` ➔ `picked_up` ➔ `in_transit` ➔ `delivered`.
2. **Explicit Next Action & Route Metadata**:
   - Every API response now returns:
     - `status`: Exact database status string.
     - `next_action`: `'accept'` | `'pickup'` | `'transit'` | `'deliver'` | `null`.
     - `next_action_label`: `'Accept Delivery'` | `'Pick Up Order'` | `'Start Delivery'` | `'Mark as Delivered'` | `'Delivered'`.
     - `next_endpoint`: Exact URL for the next action.
     - `route_phase`: `'unassigned'` | `'rider_to_store'` | `'store_to_customer'` | `'rider_to_customer'` | `'completed'`.
     - `route_destination`: Target store or customer object with address and GPS coordinates.
3. **Strict Separation of Feeds**:
   - `GET /api/v1/rider/available-deliveries` ➔ Only `ready_for_pickup` with `rider_id: null`.
   - `GET /api/v1/rider/my-orders` ➔ Only active orders for the authenticated rider (`assigned_to_rider`, `picked_up`, `in_transit`).

---

## 2. Exact Authoritative Delivery Statuses

| State Constant | Status String | Description | Allowed Next State | Next Action | Button Label | Active Route |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `STATUS_READY` | `ready_for_pickup` | Food ready at store, unassigned (`rider_id: null`) | `assigned_to_rider` | `accept` | `[ ACCEPT DELIVERY ]` | None (Unassigned) |
| `STATUS_ASSIGNED` | `assigned_to_rider` | Rider accepted job; heading to store | `picked_up` | `pickup` | `[ PICK UP ORDER ]` | Rider ➔ Store |
| `STATUS_PICKED_UP` | `picked_up` | Food collected from store; ready to depart | `in_transit` | `transit` | `[ START DELIVERY ]` | Store ➔ Customer |
| `STATUS_OUT_FOR_DELIVERY` | `in_transit` | Rider on the road delivering to customer | `delivered` | `deliver` | `[ MARK AS DELIVERED ]` | Rider ➔ Customer |
| `STATUS_DELIVERED` | `delivered` | Food handed to customer; order completed | None (Terminal) | `null` | `[ COMPLETED ]` | None |

---

## 3. Endpoints & API Contract

### A. Accept Delivery
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/accept` (or `POST /api/v1/rider/orders/{id}/accept`)
- **Preconditions**: Current status must be `ready_for_pickup` and `rider_id` must be `null`.
- **Resulting State**: `assigned_to_rider` (`rider_id` = authenticated rider).
- **Idempotency**: Rapid duplicate tap returns `200 OK` (`"Delivery is already assigned to you."`).
- **Conflict**: If another rider won the race, returns `409 Conflict` (`"Delivery already accepted by another rider."`).

### B. Pick Up Order
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/pickup` (or `POST /api/v1/rider/orders/{id}/pickup`)
- **Preconditions**: Current status must be `assigned_to_rider` and `rider_id` must match authenticated rider.
- **Resulting State**: `picked_up` (`picked_up_at` = timestamp).
- **Idempotency**: Duplicate tap returns `200 OK` (`"Order is already marked as picked up."`).
- **Invalid Transition**: If called when `ready_for_pickup`, returns `422 Unprocessable` (`"Delivery must be accepted before it can be picked up."`).

### C. Start Transit
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/transit` (or `POST /api/v1/rider/orders/{id}/transit`)
- **Preconditions**: Current status must be `picked_up` and `rider_id` must match authenticated rider.
- **Resulting State**: `in_transit` (`transit_at` = timestamp).
- **Idempotency**: Duplicate tap returns `200 OK` (`"Delivery is already in transit."`).
- **Invalid Transition**: If called when `assigned_to_rider`, returns `422 Unprocessable` (`"Delivery must be picked up at the store before starting transit."`).

### D. Deliver Order
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/deliver` (or `POST /api/v1/rider/orders/{id}/deliver`)
- **Preconditions**: Current status must be `in_transit` and `rider_id` must match authenticated rider.
- **Payload**: Optional multipart form with `proof_of_delivery` image.
- **Resulting State**: `delivered` (`delivered_at` = timestamp).
- **Idempotency**: Duplicate tap returns `200 OK` (`"Delivery already marked as delivered."`).
- **Invalid Transition**: If called when `picked_up` or earlier, returns `422 Unprocessable` (`"Delivery must be in transit before it can be marked as delivered."`).

---

## 4. Response Payload Schema

All rider endpoints return standardized metadata:

```json
{
  "success": true,
  "message": "Order marked as picked up! Please head to the customer.",
  "data": {
    "delivery_id": 45,
    "order_id": 101,
    "order_number": "ORD-101",
    "order_source": "mobile",
    "status": "picked_up",
    "current_state": "picked_up",
    "status_label": "Picked Up",
    "is_available": false,
    "next_action": "transit",
    "next_action_label": "Start Delivery",
    "next_endpoint": "/api/v1/rider/deliveries/45/transit",
    "route_phase": "store_to_customer",
    "route_destination": {
      "type": "customer",
      "name": "Alice Customer",
      "phone": "09171112222",
      "address": "Block 4 Lot 12, Victoria Laguna",
      "latitude": 14.2265,
      "longitude": 121.3295,
      "landmark": "Town Plaza",
      "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.2265,121.3295"
    },
    "rider_id": 7,
    "rider_name": "Bob Rider",
    "delivery_fee": 50.00,
    "total_amount": 250.00,
    "items_count": 2
  }
}
```

---

## 5. Real-Time WebSockets & Cache Ordering

- **Channels**: `admin.orders`, `branch.{branchId}.orders`, `rider.{riderId}`, `user.{userId}`, `customer.order.{orderId}`.
- **Events**:
  - `OrderStatusUpdated` (`order-status-updated`): Dispatched on all status changes.
  - `OrderAssigned`: Dispatched immediately when a rider accepts.
  - `RiderStatusUpdated` (`rider.status.updated`): Dispatched when rider status changes (`busy` vs `available`).
- **Stale Event Prevention**: Compare `updated_at` timestamps or numerical state weights:
  `ready_for_pickup (1) < assigned_to_rider (2) < picked_up (3) < in_transit (4) < delivered (5)`. Newer states are never overwritten by older events.

---

# COPY-PASTE PROMPT FOR RIDER MOBILE APP AI

```markdown
# TASK: Fix Delivery State Machine & Action Transitions in Rider Mobile App

You must update the Rider Mobile App to strictly follow the backend's **authoritative delivery state machine**.

## 1. Core Rule: One-Way Progression (Never Loop Backward)

The delivery follows a strict forward sequence:
1. `ready_for_pickup` ➔ Rider taps **[ ACCEPT DELIVERY ]** ➔ Status becomes `assigned_to_rider`.
2. `assigned_to_rider` ➔ Button shows **[ PICK UP ORDER ]** (Route: Rider ➔ Store).
3. Rider arrives at store and taps **[ PICK UP ORDER ]** ➔ Status becomes `picked_up`.
4. `picked_up` ➔ Button shows **[ START DELIVERY ]** (Route: Store ➔ Customer).
5. Rider leaves store and taps **[ START DELIVERY ]** ➔ Status becomes `in_transit`.
6. `in_transit` ➔ Button shows **[ MARK AS DELIVERED ]** (Route: Rider ➔ Customer).
7. Rider arrives at customer and confirms ➔ Status becomes `delivered` (Terminal; order completed).

**CRITICAL BUG FIX**:
- DO NOT set button to "PICKED UP" when the rider accepts. The rider has NOT picked up the food yet! The button must say **"PICK UP ORDER"**.
- DO NOT return the button to "ACCEPT" after pickup.
- DO NOT re-query `GET /api/v1/rider/orders` for active orders. Use `GET /api/v1/rider/my-orders` for active deliveries.

---

## 2. API Endpoints & Request Mapping

### Action 1: Accept Delivery
- **Method**: `POST`
- **URL**: `/api/v1/rider/deliveries/{delivery_id}/accept`
- **Body**: `{}`
- **On 200 OK**:
  - Update delivery state to `assigned_to_rider`.
  - Set active action button to **[ PICK UP ORDER ]**.
  - Set route destination to Store (`branch_latitude`, `branch_longitude`).
  - Move order from "Available Feed" to "My Active Orders".
- **On 409 Conflict**:
  - Show alert: *"This delivery has already been accepted by another rider."*
  - Remove delivery from feed/map.

### Action 2: Pick Up Order
- **Method**: `POST`
- **URL**: `/api/v1/rider/deliveries/{delivery_id}/pickup`
- **Body**: `{}`
- **On 200 OK**:
  - Update delivery state to `picked_up`.
  - Set active action button to **[ START DELIVERY ]**.
  - Set route destination to Customer (`latitude`, `longitude`).

### Action 3: Start Delivery (In Transit)
- **Method**: `POST`
- **URL**: `/api/v1/rider/deliveries/{delivery_id}/transit`
- **Body**: `{}`
- **On 200 OK**:
  - Update delivery state to `in_transit`.
  - Set active action button to **[ MARK AS DELIVERED ]**.

### Action 4: Confirm Delivery
- **Method**: `POST`
- **URL**: `/api/v1/rider/deliveries/{delivery_id}/deliver`
- **Body**: FormData with optional `proof_of_delivery` photo.
- **On 200 OK**:
  - Update delivery state to `delivered`.
  - Show completion modal / return to Home feed.

---

## 3. UI Button & Route State Matrix

| Backend `status` | Display Label | Action Button Text | On Tap Calls | Map Destination |
| :--- | :--- | :--- | :--- | :--- |
| `ready_for_pickup` | Ready for Pickup | **[ ACCEPT DELIVERY ]** | `/deliveries/{id}/accept` | None / Overview |
| `assigned_to_rider` | Assigned to You | **[ PICK UP ORDER ]** | `/deliveries/{id}/pickup` | Store (Pickup Point) |
| `picked_up` | Food Picked Up | **[ START DELIVERY ]** | `/deliveries/{id}/transit` | Customer Address |
| `in_transit` | On the Way | **[ MARK AS DELIVERED ]** | `/deliveries/{id}/deliver` | Customer Address |
| `delivered` | Delivered | None | None | Completed |

---

## 4. Query Feeds & Cache Rules
1. **Available Jobs Tab**:
   - Queries `GET /api/v1/rider/available-deliveries`.
   - Shows only unassigned jobs (`status: 'ready_for_pickup'`, `rider_id: null`).
2. **Active Orders Tab**:
   - Queries `GET /api/v1/rider/my-orders`.
   - Shows rider's assigned orders (`status`: `assigned_to_rider`, `picked_up`, `in_transit`).
3. **When an action completes**:
   - Invalidate both `['available-deliveries']` and `['my-orders']` queries.
   - Do NOT reset local screen state to default `ACCEPT`. Use the returned `data.status` and `data.next_action`.
```
