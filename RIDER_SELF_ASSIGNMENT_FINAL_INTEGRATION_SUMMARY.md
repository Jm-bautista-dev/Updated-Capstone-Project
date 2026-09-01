# Rider Self-Assignment & Unified Delivery Architecture — Final Integration Summary

## 1. Canonical Rider Identity & Single Unified Workflow

There is now **ONLY ONE delivery assignment architecture** across the entire platform:
**First-Come-First-Served Rider Self-Acceptance via the Rider Mobile App**.

- **No "Internal Rider" / "Website Rider" segregation**: All riders are canonical `Rider` accounts registered in the database (`riders` table).
- **No Manual Assignment in Normal Operations**: The web admin/cashier delivery dashboard no longer displays manual assign dropdowns or assignment modals during standard operations.
- **Unified Delivery Lifecycle**:
  ```
  Customer Mobile Order (ORD-19)
             OR
  POS Walk-In Delivery (POS-88)
             │
             ▼
     READY FOR PICKUP (Unassigned)
             │
             ▼
      AVAILABLE JOBS (Rider App Map / List)
             │
             ▼
      FIRST RIDER TO ACCEPT
             │ (Atomic DB Lock: First Claim Wins)
             ▼
          ASSIGNED
             │
      PHASE 1 NAVIGATION: Rider ➔ Maki Desu Pickup Branch
             │
         PICK UP ORDER (Rider arrives at store)
             │
         PICKED UP
             │
       START TRANSIT (Rider departs store)
             │
        IN TRANSIT
             │
      PHASE 2 NAVIGATION: Rider ➔ Customer Address
             │
     MARK AS DELIVERED (Rider hands food to customer)
             │
         DELIVERED (Completed & Settled)
  ```

---

## 2. Rider Account Management & Authentication

- **Rider Model**: `App\Models\Rider` (Authenticatable with Laravel Sanctum).
- **Authentication Endpoint**: `POST /api/v1/rider/login` (email + password).
- **Token Type**: Bearer Token via Sanctum.
- **Account Management**: Admin / Branch Manager creates and manages rider accounts via the web admin portal. The rider installs the Rider Mobile App and logs in with their single canonical account.
- **Account Deletion / Retirement**: Handled via soft-deletes and `is_active` flag. Historical deliveries, GPS logs, audit logs, and sales remain 100% intact.

---

## 3. Rider Feeds & Action Endpoints

| Purpose | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Available Jobs** | `GET` | `/api/v1/rider/available-deliveries` | Returns unassigned `ready_for_pickup` deliveries eligible for the authenticated rider's branch. |
| **My Assigned Deliveries** | `GET` | `/api/v1/rider/my-orders` | Returns active deliveries assigned to the authenticated rider (`assigned_to_rider`, `picked_up`, `in_transit`). |
| **Accept Delivery** | `POST` | `/api/v1/rider/deliveries/{id}/accept` | Atomically claims job. Transitions to `assigned_to_rider`. Route phase: `rider_to_store`. |
| **Pick Up Order** | `POST` | `/api/v1/rider/deliveries/{id}/pickup` | Confirms physical collection at store. Transitions to `picked_up`. Route phase: `store_to_customer`. |
| **Start Transit** | `POST` | `/api/v1/rider/deliveries/{id}/transit` | Confirms rider has departed towards customer. Transitions to `in_transit`. Route phase: `rider_to_customer`. |
| **Complete Delivery** | `POST` | `/api/v1/rider/deliveries/{id}/deliver` | Submits proof photo and marks `delivered`. Route phase: `completed`. |
| **Cancel Request** | `POST` | `/api/v1/rider/orders/{id}/cancel` | Submits branch-reviewed cancellation request. |
| **Toggle Status** | `POST` | `/api/v1/rider/status/toggle` | Toggles rider between `available` (online) and `offline` (inactive). |
| **GPS Telemetry** | `POST` | `/api/v1/rider/location` | Broadcasts real-time rider latitude, longitude, heading, speed. |

---

## 4. Backend Request & Response Payload Contract

### Response Payload Structure (Unified across all status endpoints)
```json
{
  "success": true,
  "message": "Order accepted! Please head to the branch for pickup.",
  "data": {
    "delivery_id": 19,
    "order_id": 19,
    "order_number": "ORD-19",
    "order_source": "mobile",
    "status": "assigned_to_rider",
    "current_state": "assigned_to_rider",
    "status_label": "Rider Assigned",
    "route_phase": "rider_to_store",
    "next_action": "pickup",
    "next_action_label": "Pick Up Order",
    "next_endpoint": "/api/v1/rider/deliveries/19/pickup",
    
    "active_destination": {
      "type": "store",
      "branch_id": 1,
      "name": "MAKI DESU VICTORIA",
      "address": "Poblacion, Victoria, Laguna",
      "latitude": 14.225000,
      "longitude": 121.328000,
      "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.225,121.328"
    },
    
    "pickup": {
      "branch_id": 1,
      "name": "MAKI DESU VICTORIA",
      "address": "Poblacion, Victoria, Laguna",
      "latitude": 14.225000,
      "longitude": 121.328000,
      "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.225,121.328"
    },
    
    "customer_destination": {
      "customer_name": "Alice Customer",
      "customer_phone": "09170001919",
      "customer_address": "Barangay San Benito, Victoria, Laguna",
      "latitude": 14.240000,
      "longitude": 121.350000,
      "landmark": "Near Church",
      "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.240,121.350"
    },
    
    "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.225,121.328",
    "rider_id": 7,
    "rider_name": "Rider Marco",
    "delivery_fee": 50.00,
    "total_amount": 250.00
  }
}
```

---

## 5. Eligibility & Business Rules

1. **Strict Rider Authentication**: Rider is derived strictly from the authenticated Sanctum token (`$request->user()`). The client cannot specify a `rider_id`.
2. **Account Status (`is_active`)**: Must be active (`is_active = true`). Deactivated riders receive `403 Forbidden`.
3. **Availability (`status`)**:
   - `available`: Eligible to view and accept jobs.
   - `busy`: Assigned an active job.
   - `offline`: Inactive; cannot view or accept jobs.
4. **Active ≠ Available Workload Protection**:
   - A rider who is already `in_transit` (out for delivery) is blocked from accepting additional jobs (`422 Unprocessable`).
5. **Branch Isolation**:
   - Deliveries originating from Branch A (e.g. Victoria) are only visible and claimable by riders registered to Branch A.
   - Cross-branch acceptance is strictly rejected (`422 Unprocessable`).
6. **First-Come-First-Served Concurrency**:
   - Enforced by database transaction with pessimistic locking (`SELECT ... FOR UPDATE`).
   - The first transaction to commit assigns the delivery.
   - Subsequent or concurrent requests by other riders are rejected with `409 Conflict` ("Delivery already accepted by another rider.").
7. **Idempotency**:
   - If the assigned rider re-submits the `accept` or `pickup` request, the backend cleanly returns `200 OK` with the current state without duplicating transitions.

---

## 6. Real-Time WebSockets Architecture

### Channels
- `admin.orders`: Web Admin Dashboard.
- `branch.{branchId}.orders`: Cashier / Branch POS Terminal.
- `rider.{riderId}`: Rider Mobile App private channel.
- `customer.order.{orderId}`: Customer Live Order Tracking.
- `user.{userId}`: Customer Account feed.

### Events
1. **`OrderAssigned`** (`OrderAssigned`):
   - Broadcast when a rider self-accepts.
   - Notifies branch/admin and informs other riders to remove the job from their available job feed.
2. **`OrderStatusUpdated`** (`order-status-updated`):
   - Broadcast on every stage progression (`ready_for_pickup`, `assigned_to_rider`, `picked_up`, `in_transit`, `delivered`).
   - Carries `route_phase`, `active_destination`, `pickup_branch`, and `customer_destination`.
3. **`RiderStatusUpdated`** (`rider.status.updated`):
   - Broadcast when rider toggles online/offline or transitions between available/busy.

---

## 7. Delivery Route Two-Phase Architecture

- **Phase 1 (`assigned_to_rider`)**:
  - Route destination: **Maki Desu Store / Branch**.
  - Action button: `[ PICK UP ORDER ]`.
  - Customer destination is displayed as upcoming.
- **Phase 2 (`picked_up` / `in_transit`)**:
  - Route destination: **Customer Address**.
  - Action button: `[ START DELIVERY ]` ➔ `[ MARK AS DELIVERED ]`.
  - Store becomes historical origin.
- **Delivered (`delivered`)**:
  - Route cleared. Rider status returns to `available`.

---

## 8. Financial & Historical Data Integrity

- **Historical Deliveries**: Preserved with `rider_id`, timestamps, GPS logs, and delivery fees.
- **Sales & COGS**: Deliveries are operational fulfillment records; product revenue and delivery fees are tracked without inflation or duplication.
- **POS Walk-in & Customer Mobile**: Both leverage the same backend state engine, ensuring 100% financial and inventory parity.

---

# COPY-PASTE PROMPT FOR RIDER MOBILE APP AI

```markdown
# TASK: Implement First-Come-First-Served Self-Acceptance & Two-Phase Delivery Routing in Rider Mobile App

The backend has finalized the single unified delivery architecture:
**Manual dispatcher assignment is removed.** All deliveries are claimed via **First-Come-First-Served Rider Self-Acceptance**.

---

## 1. Complete Delivery State Machine

```
READY FOR PICKUP (Unassigned)
         ↓
  Rider taps [ ACCEPT DELIVERY ]
         ↓
      ASSIGNED (Route: Rider ➔ Store)
         ↓
  Rider taps [ PICK UP ORDER ]
         ↓
     PICKED UP
         ↓
  Rider taps [ START DELIVERY ]
         ↓
    IN TRANSIT (Route: Rider ➔ Customer)
         ↓
  Rider taps [ MARK AS DELIVERED ]
         ↓
     DELIVERED (Completed)
```

---

## 2. API Endpoints & Request Contracts

### A. Available Deliveries Feed
- **Endpoint**: `GET /api/v1/rider/available-deliveries`
- **Headers**: `Authorization: Bearer <SANCTUM_TOKEN>`
- **Response**: Array of unassigned orders for your branch.
- **Action**: Render on the Available Jobs board / map.

### B. My Active Deliveries Feed
- **Endpoint**: `GET /api/v1/rider/my-orders`
- **Headers**: `Authorization: Bearer <SANCTUM_TOKEN>`
- **Response**: Array of orders currently assigned to you (`assigned_to_rider`, `picked_up`, `in_transit`).

### C. Accept Delivery (First-Come-First-Served)
- **Endpoint**: `POST /api/v1/rider/deliveries/{delivery_id}/accept`
- **Behavior**:
  - If you WIN the claim: Returns `200 OK`, `status: "assigned_to_rider"`, `route_phase: "rider_to_store"`, `active_destination: store_details`.
  - If another rider claimed first: Returns `409 Conflict` (`"Delivery already accepted by another rider."`). Alert user and remove card.
  - If offline: Alert "You're offline. Connect to internet to accept delivery."

### D. Pick Up Order (At Store)
- **Endpoint**: `POST /api/v1/rider/deliveries/{delivery_id}/pickup`
- **Behavior**:
  - Returns `200 OK`, `status: "picked_up"`, `route_phase: "store_to_customer"`, `active_destination: customer_details`.
  - Map route switches from Store to Customer.

### E. Start Transit (Out for Delivery)
- **Endpoint**: `POST /api/v1/rider/deliveries/{delivery_id}/transit`
- **Behavior**: Returns `200 OK`, `status: "in_transit"`, `route_phase: "rider_to_customer"`.

### F. Complete Delivery (Handed to Customer)
- **Endpoint**: `POST /api/v1/rider/deliveries/{delivery_id}/deliver`
- **Payload**: Multipart form with optional `proof_of_delivery` photo file.
- **Behavior**: Returns `200 OK`, `status: "delivered"`. Route cleared.

---

## 3. Real-Time WebSockets Synchronization

Listen on your private rider channel: `rider.{riderId}` and branch channel `branch.{branchId}.orders`:
1. **`OrderAssigned`**: If another rider claimed a job on your screen, remove it from the Available feed immediately.
2. **`order-status-updated`**: Updates order lifecycle metadata and route phase.
3. **`rider.status.updated`**: Reflects online/offline/busy status.

---

## 4. Key Rules for Mobile App
1. **Never Hardcode Store or Customer Coordinates**: Always use `data.active_destination.latitude` and `data.active_destination.longitude`.
2. **Do Not Speculatively Assign Locally**: Wait for `POST /accept` to return `200 OK` before switching UI to `ASSIGNED`.
3. **Handle Reconnection**: On app resume or reconnect, query `GET /api/v1/rider/my-orders` to sync active job state.
4. **Google Maps Intent**: Open `data.maps_url` when the rider taps "Navigate in External Maps".
```
