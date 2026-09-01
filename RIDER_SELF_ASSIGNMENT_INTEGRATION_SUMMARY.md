# Rider Self-Assignment Integration Summary

## 1. Overview & Architecture

The delivery workflow has been redesigned from manual/auto dispatch to a **Rider Self-Accept Delivery System** (similar in concept to Grab / Lalamove).

### Workflow Diagram

```
CUSTOMER MOBILE ORDER           POS WALK-IN ORDER
         │                             │
         └──────────────┬──────────────┘
                        │
                        ▼
                [ Order Created ]
                        │
                        ▼
                [ In Kitchen / Preparing ]
                        │
                        ▼
                [ READY FOR PICKUP ]
             (rider_id: null, unassigned)
                        │
                        ▼
       [ Available Deliveries Job Board / Map ]
                        │
                        ▼
            [ Rider Taps "ACCEPT DELIVERY" ]
                        │
                        ▼
        [ Atomic Concurrency & Branch Validation ]
             (Pessimistic Lock / Winner takes job)
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
 [ First Rider: ASSIGNED ]     [ Subsequent Rider: 409 Conflict ]
        │                       ("Delivery already accepted")
        ▼
 [ Realtime Broadcast to All Devices ]
  - Other Riders: Job removed from map & list
  - Web Dispatch: Shows assigned rider immediately
  - Customer App: Shows "Rider Assigned"
        │
        ▼
 [ Rider Arrives: PICK UP → picked_up ]
        │
        ▼
 [ Rider Departs: START TRANSIT → in_transit ]
        │
        ▼
 [ Rider Arrives at Customer: DELIVER → delivered ]
        │
        ▼
 [ Authoritative Sale, Profit & Fulfillment Recognition ]
```

---

## 2. API Specifications

### A. Available Deliveries Feed (Job Board / Map)

- **Endpoint**: `GET /api/v1/rider/available-deliveries` (Alias: `GET /api/v1/rider/orders`)
- **HTTP Method**: `GET`
- **Authentication**: `Bearer <sanctum_token>` (Rider instance)
- **Request Parameters**: None (query parameters optional for pagination if needed).
- **Backend Enforcements**:
  - Validates authenticated rider.
  - Rider must be `is_active: true`.
  - Rider must not be `status: 'offline'`.
  - Rider must not be currently out for delivery (`hasInTransitDelivery() === false`).
  - Branch Scoping: Filters deliveries matching the rider's `branch_id` (or all if global).
  - Status Scoping: Returns only `delivery_type: 'internal'`, `status: 'ready_for_pickup'`, and `rider_id: null`.
- **Response Structure (200 OK)**:
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": 101,
      "delivery_id": 45,
      "deliveryId": 45,
      "order_id": 101,
      "orderId": 101,
      "sale_id": null,
      "order_number": "ORD-101",
      "orderNumber": "ORD-101",
      "order_source": "mobile",
      "status": "ready_for_pickup",
      "order_status": "ready_for_pickup",
      "orderStatus": "ready_for_pickup",
      "status_label": "Ready for Pickup",
      "statusLabel": "Ready for Pickup",
      "is_available": true,
      "isAvailable": true,
      "rider_id": null,
      "rider_name": null,
      "accepted_at": null,
      "customer_name": "Alice Customer",
      "customerName": "Alice Customer",
      "customer_phone": null,
      "customerPhone": null,
      "customer_address": "Near Victoria Town Plaza",
      "customerAddress": "Near Victoria Town Plaza",
      "full_customer_address": null,
      "latitude": 14.2265,
      "longitude": 121.3295,
      "landmark": "Town Plaza",
      "notes": null,
      "maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.2265,121.3295",
      "delivery_fee": 50.00,
      "deliveryFee": 50.00,
      "earnings": 50.00,
      "fee": 50.00,
      "distance_km": 2.4,
      "total_amount": 250.00,
      "totalAmount": 250.00,
      "payment_method": "cash",
      "branch_id": 1,
      "branch_name": "MAKI DESU VICTORIA",
      "branchName": "MAKI DESU VICTORIA",
      "branch_address": "Victoria, Laguna",
      "branch_latitude": 14.2250,
      "branch_longitude": 121.3280,
      "branch_maps_url": "https://www.google.com/maps/dir/?api=1&destination=14.2250,121.3280",
      "items": [
        {
          "product_name": "Tonkotsu Ramen",
          "quantity": 1,
          "price": 200.00,
          "subtotal": 200.00
        }
      ],
      "items_count": 1,
      "created_at": "2026-09-01T14:30:00.000000Z",
      "updated_at": "2026-09-01T14:35:00.000000Z"
    }
  ]
}
```

---

### B. Accept Delivery API

- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/accept` (Alias: `POST /api/v1/rider/orders/{id}/accept`)
- **HTTP Method**: `POST`
- **Authentication**: `Bearer <sanctum_token>`
- **Request Body**: `{}` (Empty JSON object. Rider identity is strictly derived from token; client-supplied rider IDs are rejected).
- **Concurrency & State Behavior**:
  - Pessimistic Row Lock: `Delivery::where('id', $id)->lockForUpdate()->first()`
  - First Rider Wins: Atomically sets `rider_id = $rider->id`, `status = 'assigned_to_rider'`, `accepted_at = now()`.
  - Idempotency: If the same rider calls accept again on their assigned order, returns `200 OK` with `"Delivery is already assigned to you."`.
  - Duplicate Attempt by Another Rider: Returns `409 Conflict` with `"Delivery already accepted by another rider."`.
  - State Violation (e.g. order cancelled): Returns `422 Unprocessable Content`.
- **Response (200 OK - Successful Acceptance)**:
```json
{
  "success": true,
  "message": "Order accepted! Please head to the branch for pickup.",
  "data": {
    "id": 101,
    "delivery_id": 45,
    "order_id": 101,
    "order_number": "ORD-101",
    "status": "assigned_to_rider",
    "status_label": "Rider Assigned",
    "is_available": false,
    "rider_id": 7,
    "rider_name": "John Doe",
    "accepted_at": "2026-09-01T14:36:12.000000Z",
    "customer_name": "Alice Customer",
    "customer_phone": "09171112222",
    "customer_address": "Block 4 Lot 12, Victoria Poblacion",
    "full_customer_address": "Block 4 Lot 12, Victoria Poblacion",
    "latitude": 14.2265,
    "longitude": 121.3295,
    "delivery_fee": 50.00,
    "total_amount": 250.00,
    "payment_method": "cash",
    "branch_name": "MAKI DESU VICTORIA",
    "items_count": 1
  }
}
```
- **Response (409 Conflict - Already Taken)**:
```json
{
  "success": false,
  "message": "Delivery already accepted by another rider."
}
```

---

### C. Post-Acceptance Rider Lifecycle Endpoints

1. **Pick Up**: `POST /api/v1/rider/deliveries/{id}/pickup`
   - Transitions status: `assigned_to_rider` → `picked_up`
   - Records `picked_up_at = now()`
2. **Start Transit**: `POST /api/v1/rider/deliveries/{id}/transit`
   - Transitions status: `picked_up` → `in_transit`
   - Records `transit_at = now()`
   - Rider is now marked `hasInTransitDelivery() = true`
3. **Confirm Delivery**: `POST /api/v1/rider/deliveries/{id}/deliver`
   - Multipart form with optional `proof_of_delivery` photo
   - Transitions status: `in_transit` → `delivered`
   - Records `delivered_at = now()`
   - Triggers `OrderFulfillmentService` to recognize sales revenue, COGS, and profit
   - Returns rider to `available` status if no other active deliveries remain
4. **Cancellation Request**: `POST /api/v1/rider/orders/{id}/cancel`
   - Payload: `{"reason": "Flat tire", "notes": "Unable to proceed"}`
   - Transitions status: `cancellation_requested` for admin/cashier review

---

## 3. Real-Time WebSocket Events & Channels

Reverb / Pusher Broadcaster Configuration:

| Event Name | Channels | Payload Key Data |
| :--- | :--- | :--- |
| `order-status-updated` (`OrderStatusUpdated`) | `admin.orders`<br>`branch.{branchId}.orders`<br>`rider.{riderId}`<br>`user.{userId}`<br>`customer.order.{orderId}` | `delivery_id`, `order_number`, `status`, `rider_id`, `rider_name`, `branch_id`, `timestamp` |
| `OrderAssigned` | `admin.orders`<br>`branch.{branchId}.orders`<br>`rider.{riderId}`<br>`user.{userId}`<br>`customer.order.{orderId}` | `delivery_id`, `order_id`, `order_number`, `rider_id`, `rider_name`, `branch_name` |
| `RiderStatusUpdated` (`rider.status.updated`) | `admin.orders`<br>`branch.{branchId}.orders` | `id`, `name`, `status`, `is_active`, `is_out_for_delivery`, `active_deliveries` |

---

## 4. Summary of Code & Database Changes

### Database Changes
- Migration: `2026_09_01_150000_add_accepted_at_and_assignment_logs_to_deliveries.php`
- Added column `accepted_at` (nullable timestamp) to `deliveries` table.
- Created `delivery_assignment_logs` table for assignment auditing (`assigned_by_type`: `'rider_self_accept'`, `'admin_manual'`).

### Backend Files Changed
- [Delivery.php](file:///c:/xampp/htdocs/Capstone-Project/app/Models/Delivery.php): Added `accepted_at`, `assignmentLogs()`, `isAvailableForRiders()`.
- [DeliveryAssignmentLog.php](file:///c:/xampp/htdocs/Capstone-Project/app/Models/DeliveryAssignmentLog.php): Model for assignment logs.
- [DeliveryService.php](file:///c:/xampp/htdocs/Capstone-Project/app/Services/DeliveryService.php):
  - Removed auto-dispatch when food becomes ready.
  - Implemented atomic `acceptDelivery(Delivery $delivery, Rider $rider)`.
  - Added audit logging in `assignRider()`.
- [RiderController.php](file:///c:/xampp/htdocs/Capstone-Project/app/Http/Controllers/Api/RiderController.php):
  - Implemented `availableDeliveries` with eligibility & branch checks.
  - Implemented `acceptOrder` with 409 Conflict handling.
  - Privacy safeguards on unassigned delivery customer data.
- [api.php](file:///c:/xampp/htdocs/Capstone-Project/routes/api.php): Registered `/api/v1/rider/available-deliveries` and `/api/v1/rider/deliveries/{id}/accept`.
- [OrderAssigned.php](file:///c:/xampp/htdocs/Capstone-Project/app/Events/OrderAssigned.php): Broadcasts to customer channels.
- [Deliveries.tsx](file:///c:/xampp/htdocs/Capstone-Project/resources/js/pages/Admin/Deliveries.tsx): Realtime UI updates for `OrderAssigned`.

---

# COPY-PASTE PROMPT FOR RIDER MOBILE APP AI

```markdown
# TASK: Implement Rider Self-Accept Delivery System in Rider Mobile App

You are tasked with updating the Rider Mobile App to support the backend's new **Rider Self-Accept Delivery System** (similar to Grab / Lalamove).

## 1. Core Workflow
1. When an order (Customer Mobile App order or POS Walk-in delivery) is prepared, it reaches `ready_for_pickup` with `rider_id: null`.
2. Eligible riders see available delivery jobs on the **Job Board** and **Live Map**.
3. A rider views job details (pickup branch, general customer area, delivery fee / payout, item count, distance) and taps **[ ACCEPT DELIVERY ]**.
4. The app sends `POST /api/v1/rider/deliveries/{id}/accept`.
5. The backend validates branch eligibility, rider activity, out-for-delivery locks, and performs an atomic database claim.
6. Upon successful acceptance (200 OK):
   - The job is moved to "My Active Orders" (`assigned_to_rider`).
   - Full customer contact details and precise delivery address are unlocked.
   - The app navigates the rider to pickup / route screen.
7. If another rider accepted first (409 Conflict):
   - Show an immediate alert: *"This delivery has already been accepted by another rider."*
   - Remove the job from the map and list without crashing.
8. Real-time WebSockets (`echo`):
   - Listen to `branch.{branchId}.orders` or `rider.{riderId}` on events `order-status-updated` and `OrderAssigned`.
   - When a job is accepted by any rider or cancelled, remove it from the available job list / map immediately.

---

## 2. Exact Backend API Contracts

### A. Fetch Available Delivery Jobs
- **Endpoint**: `GET /api/v1/rider/available-deliveries` (or `GET /api/v1/rider/orders`)
- **Headers**:
  ```http
  Authorization: Bearer <sanctum_token>
  Accept: application/json
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 1,
    "data": [
      {
        "id": 101,
        "delivery_id": 45,
        "order_number": "ORD-101",
        "order_source": "mobile",
        "status": "ready_for_pickup",
        "status_label": "Ready for Pickup",
        "is_available": true,
        "customer_name": "Alice Customer",
        "customer_address": "Near Victoria Town Plaza",
        "latitude": 14.2265,
        "longitude": 121.3295,
        "landmark": "Town Plaza",
        "delivery_fee": 50.00,
        "earnings": 50.00,
        "distance_km": 2.4,
        "total_amount": 250.00,
        "payment_method": "cash",
        "branch_id": 1,
        "branch_name": "MAKI DESU VICTORIA",
        "branch_address": "Victoria, Laguna",
        "branch_latitude": 14.2250,
        "branch_longitude": 121.3280,
        "items_count": 2,
        "items": [
          {
            "product_name": "Tonkotsu Ramen",
            "quantity": 2,
            "price": 200.00
          }
        ]
      }
    ]
  }
  ```

---

### B. Accept Delivery
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/accept` (or `POST /api/v1/rider/orders/{id}/accept`)
- **Headers**:
  ```http
  Authorization: Bearer <sanctum_token>
  Accept: application/json
  Content-Type: application/json
  ```
- **Body**: `{}` (Empty JSON object).
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Order accepted! Please head to the branch for pickup.",
    "data": {
      "delivery_id": 45,
      "order_number": "ORD-101",
      "status": "assigned_to_rider",
      "rider_id": 7,
      "customer_name": "Alice Customer",
      "customer_phone": "09171112222",
      "customer_address": "Block 4 Lot 12, Victoria Poblacion",
      "full_customer_address": "Block 4 Lot 12, Victoria Poblacion",
      "delivery_fee": 50.00,
      "total_amount": 250.00
    }
  }
  ```
- **Conflict Response (409 Conflict - Taken by another rider)**:
  ```json
  {
    "success": false,
    "message": "Delivery already accepted by another rider."
  }
  ```
- **Error Response (422 Unprocessable Content - Inactive, Offline, or Out for Delivery)**:
  ```json
  {
    "success": false,
    "message": "You are currently out for delivery on an active route and cannot accept additional orders until your delivery route is completed."
  }
  ```

---

### C. Active Delivery Progression
1. **Mark Picked Up**: `POST /api/v1/rider/deliveries/{id}/pickup`
   - Trigger when rider arrives at branch and collects the food.
2. **Start Transit**: `POST /api/v1/rider/deliveries/{id}/transit`
   - Trigger when rider leaves the branch. Locks rider from accepting other jobs.
3. **Confirm Delivery**: `POST /api/v1/rider/deliveries/{id}/deliver`
   - Accepts multipart image `proof_of_delivery`. Completes order and returns rider to available status.

---

## 3. UI/UX & Mobile Implementation Requirements

1. **Job Board / Feed Tab**:
   - Create or update the "Available Jobs" tab.
   - Display cards with Order Number, Branch Name, Estimated Distance, Delivery Fee Payout (`₱XX.XX`), and Item Count.
   - Include a prominent **[ ACCEPT DELIVERY ]** button.
   - Show a loading spinner during acceptance and disable the button to prevent duplicate taps.
2. **Map Markers**:
   - Render available jobs as pickup icons on the rider map using `branch_latitude` and `branch_longitude`.
   - Tapping the marker opens the delivery preview sheet with the Accept button.
3. **Error & Conflict Handling**:
   - Catch 409 Conflict: Display a toast/modal `"Order already taken by another rider"`, remove the card from the list, and refresh the job feed.
   - Catch 422: Display the backend error message (e.g. offline status).
4. **Offline Protection**:
   - If device is offline, disable the Accept button and display `"Connect to internet to accept deliveries"`.
   - Never simulate offline acceptance as confirmed.
5. **Real-time Updates**:
   - On `OrderStatusUpdated` or `OrderAssigned`, if `status !== 'ready_for_pickup'` or `rider_id !== null`, remove the delivery from the available list.
   - On network reconnection, re-fetch `GET /api/v1/rider/available-deliveries` and `GET /api/v1/rider/my-orders`.
```
