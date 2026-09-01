# Delivery Route Phase Integration Summary

## 1. Executive Summary & Core Concept

The Delivery Route behavior is structured around **Two Distinct Navigation Phases**:

```
[ READY FOR PICKUP ]
         ↓
   RIDER ACCEPTS
         ↓
  [ ASSIGNED ] ──────────► PHASE 1: RIDER ➔ MAKI DESU STORE (Pickup Point)
         ↓
  RIDER ARRIVES &
  TAPS "PICK UP"
         ↓
  [ PICKED_UP ]
         ↓
 [ IN_TRANSIT ] ─────────► PHASE 2: RIDER ➔ CUSTOMER ADDRESS (Delivery Point)
         ↓
  [ DELIVERED ] ─────────► COMPLETED (Route Cleared)
```

The customer destination is **NEVER** the active navigation route immediately upon acceptance. When accepted (`assigned_to_rider`), the active route leads strictly to the **Maki Desu Store / Branch** associated with the order. Once the rider physically collects the food and taps **"PICK UP ORDER"**, the active route switches to the **Customer**.

This exact logic applies identically to:
1. **Customer Mobile App Deliveries** (e.g. `ORD-19`)
2. **POS Walk-in Customer Deliveries** (e.g. `POS-WALKIN-88`)

---

## 2. Route Phase & State Architecture

| Database `status` | `route_phase` | Active Navigation Destination | Active Maps URL Target | Upcoming / Future Target | Action Button Label |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ready_for_pickup` | `unassigned` | None (Unassigned Job) | Overview | Customer Address | `[ ACCEPT DELIVERY ]` |
| `assigned_to_rider` | `rider_to_store` | **🏪 Maki Desu Store / Branch** | `branch_maps_url` | Customer Address | `[ PICK UP ORDER ]` |
| `picked_up` | `store_to_customer` | **🏠 Customer Address** | `customer_maps_url` | Store (Historical Origin) | `[ START DELIVERY ]` |
| `in_transit` | `rider_to_customer` | **🏠 Customer Address** | `customer_maps_url` | Store (Historical Origin) | `[ MARK AS DELIVERED ]` |
| `delivered` | `completed` | None (Completed) | None | None | `[ COMPLETED ]` |

---

## 3. Dynamic Branch Resolution & Isolation

The pickup destination is **NEVER hardcoded**. It is resolved dynamically from the order or sale record:

```php
$branch = $sale?->branch ?? $order?->branch;
$branchId = $branch?->id;
$branchName = $branch?->name;         // e.g. "MAKI DESU VICTORIA" or "MAKI DESU STA CRUZ"
$branchAddress = $branch?->address;   // e.g. "Victoria, Laguna"
$branchLat = (float) $branch?->latitude;
$branchLng = (float) $branch?->longitude;
```

- **Branch Isolation Guard**: A rider registered to Branch A cannot accept or fulfill deliveries originating from Branch B (returns `422 Unprocessable`).
- **Store Coordinates**: Provided in the `pickup` / `pickup_location` / `pickup_branch` object in all API responses.

---

## 4. API Endpoints & Request Contracts

### A. Accept Delivery (Enters Phase 1: Rider ➔ Store)
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/accept`
- **Resulting Status**: `assigned_to_rider`
- **Resulting Route Phase**: `rider_to_store`
- **Active Navigation Target**: `pickup` (Store)

### B. Pick Up Order (Transitions to Phase 2: Rider ➔ Customer)
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/pickup`
- **Preconditions**: Current status must be `assigned_to_rider`, authenticated rider must be the assigned rider.
- **Resulting Status**: `picked_up`
- **Resulting Route Phase**: `store_to_customer`
- **Active Navigation Target**: `customer_destination` (Customer)

### C. Start Transit (Out for Delivery)
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/transit`
- **Preconditions**: Current status must be `picked_up`.
- **Resulting Status**: `in_transit`
- **Resulting Route Phase**: `rider_to_customer`
- **Active Navigation Target**: `customer_destination` (Customer)

### D. Complete Delivery
- **Endpoint**: `POST /api/v1/rider/deliveries/{id}/deliver`
- **Payload**: Multipart form with optional `proof_of_delivery` image.
- **Resulting Status**: `delivered`
- **Resulting Route Phase**: `completed`

---

## 5. Authoritative Backend Response Payload Schema

Every delivery response (`accept`, `pickup`, `transit`, `deliver`, `orders`, `my-orders`) returns:

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

## 6. Real-Time WebSockets & Broadcast Events

### Broadcast Channels
- `admin.orders`: Web Admin Dashboard
- `branch.{branchId}.orders`: POS / Branch Terminal
- `rider.{riderId}`: Rider Mobile App
- `customer.order.{orderId}`: Customer Order Live Tracking
- `user.{userId}`: Customer Account Feed

### Broadcast Events
1. **`OrderAssigned`** (event name: `OrderAssigned`):
   - Dispatched immediately when a rider accepts.
   - Payload includes `route_phase: 'rider_to_store'`, `active_destination: pickupBranch`, `customer_destination`.
2. **`OrderStatusUpdated`** (event name: `order-status-updated`):
   - Dispatched on every lifecycle transition (`assigned_to_rider`, `picked_up`, `in_transit`, `delivered`).
   - Payload includes `route_phase`, `active_destination`, `pickup_branch`, `customer_destination`.
3. **`RiderStatusUpdated`** (event name: `rider.status.updated`):
   - Dispatched when rider switches between `available` and `busy`.

---

## 7. Road Routing & GPS Telemetry

1. **Routing Service**: Built-in Open Source Routing Machine (OSRM) with OpenRouteService support.
2. **Phase 1 Route Calculation**:
   - Origin: Rider GPS coordinates (`latitude`, `longitude`).
   - Destination: Store coordinates (`branch_latitude`, `branch_longitude`).
3. **Phase 2 Route Calculation**:
   - Origin: Rider GPS coordinates (`latitude`, `longitude`).
   - Destination: Customer coordinates (`destination_lat`, `destination_lng`).
4. **GPS Update Throttling**: The mobile app should send GPS pings every 5–10 seconds. Route geometries are recalculated only on phase changes or significant displacement (>25m) to preserve battery and respect routing API rate limits.
5. **Fallback**: If routing API is unreachable, the map draws straight-line vector overlay between GPS and active destination without disrupting order status transitions.

---

# COPY-PASTE PROMPT FOR RIDER MOBILE APP AI

```markdown
# TASK: Implement Two-Phase Delivery Routing in Rider Mobile App

You must update the Rider Mobile App so that delivery routing strictly adheres to **TWO DISTINCT NAVIGATION PHASES**:

## 1. Route Phase Workflow

### Phase 1: Rider ➔ Store (Pickup Phase)
- **When**: Delivery status is `assigned_to_rider` (immediately after tapping **[ ACCEPT DELIVERY ]**).
- **Active Navigation Target**: The Maki Desu Store / Branch (`active_destination` / `pickup`).
- **Map Polyline**: From Rider's Current GPS Location ➔ Maki Desu Branch Coordinates.
- **Customer Marker**: Displayed as a secondary/future pin on map, NOT the active destination.
- **Action Button**: Display **[ PICK UP ORDER ]**.
- **DO NOT** route to the customer yet. The food is still being prepared/waiting at the store!

### Phase 2: Rider ➔ Customer (Delivery Phase)
- **When**: Rider arrives at the store and taps **[ PICK UP ORDER ]** (backend returns `status: 'picked_up'` or `in_transit`).
- **Active Navigation Target**: The Customer's Address (`customer_destination`).
- **Map Polyline**: Clear the old store route, calculate new route from Rider's Current GPS Location ➔ Customer Coordinates.
- **Store Marker**: Becomes the origin / historical pickup point.
- **Action Button**: Display **[ START DELIVERY ]** (when `picked_up`), then **[ MARK AS DELIVERED ]** (when `in_transit`).

---

## 2. API Endpoints to Call

### 1. Accept Delivery:
- **POST** `/api/v1/rider/deliveries/{delivery_id}/accept`
- On Success:
  - Set state to `assigned_to_rider`.
  - Set active route to `data.active_destination` (Store).
  - Button becomes **[ PICK UP ORDER ]**.

### 2. Pick Up Order:
- **POST** `/api/v1/rider/deliveries/{delivery_id}/pickup`
- On Success:
  - Set state to `picked_up`.
  - Switch active route to `data.active_destination` (Customer).
  - Button becomes **[ START DELIVERY ]**.

### 3. Start Transit:
- **POST** `/api/v1/rider/deliveries/{delivery_id}/transit`
- On Success:
  - Set state to `in_transit`.
  - Button becomes **[ MARK AS DELIVERED ]**.

### 4. Confirm Delivery:
- **POST** `/api/v1/rider/deliveries/{delivery_id}/deliver`
- Multipart form with optional `proof_of_delivery` photo.
- On Success:
  - Clear active route.
  - Return to available job board.

---

## 3. Data Contract from Backend

Use the backend-provided destination objects directly:

```typescript
interface DeliveryResponse {
  delivery_id: number;
  order_number: string;
  status: 'ready_for_pickup' | 'assigned_to_rider' | 'picked_up' | 'in_transit' | 'delivered';
  route_phase: 'unassigned' | 'rider_to_store' | 'store_to_customer' | 'rider_to_customer' | 'completed';
  
  // Active Navigation Target for the current phase
  active_destination: {
    type: 'store' | 'customer';
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    maps_url: string;
  };
  
  // Store details
  pickup: {
    branch_id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    maps_url: string;
  };
  
  // Customer details
  customer_destination: {
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    latitude: number;
    longitude: number;
    landmark?: string;
    maps_url: string;
  };
}
```

---

## 4. Crucial Mobile App Rules
1. **Never Hardcode Coordinates**: Always use `pickup.latitude`/`pickup.longitude` for the store, and `customer_destination.latitude`/`customer_destination.longitude` for the customer.
2. **Do Not Switch Route Locally Without API Confirmation**: Wait for the backend response from `/pickup` before switching the active route from Store to Customer.
3. **Handle External Maps Navigation**: When the rider taps "Open in Google Maps", pass `data.maps_url` (which automatically points to the Store in Phase 1 and Customer in Phase 2).
4. **Feeds**:
   - `GET /api/v1/rider/available-deliveries` ➔ Available job board (`ready_for_pickup`).
   - `GET /api/v1/rider/my-orders` ➔ Active assigned deliveries (`assigned_to_rider`, `picked_up`, `in_transit`).
```
