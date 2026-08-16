# Customer Mobile App Live Delivery Tracking Integration Guide

This document defines the exact production API contract, WebSocket channels, and mobile client implementation rules for real-time live rider tracking in the **Customer Mobile App**.

---

## 1. Overview & Single Source of Truth

The tracking system relies on a single unified backend architecture:
- The **Rider Mobile App** pings GPS coordinates to `POST /api/v1/rider/location`.
- The **Laravel Backend** stores coordinates in the `riders` table and `rider_location_logs`.
- The **Broadcasting Service** pushes updates to the Admin Delivery Map on `Channel('deliveries')` and to the authenticated customer on `PrivateChannel('customer.order.{orderId}')`.
- The **Customer Mobile App** consumes live telemetry via WebSocket with an automatic HTTP polling fallback.

---

## 2. Customer Tracking HTTP API

### Endpoint Specification

| Property | Value |
| :--- | :--- |
| **Endpoint** | `GET /api/v1/customer/orders/{id}/tracking` (alias: `GET /api/v1/orders/{id}/tracking`) |
| **HTTP Method** | `GET` |
| **Authentication** | Bearer Token (`auth:sanctum`) |
| **Required Headers** | `Authorization: Bearer <customer_sanctum_token>`<br>`Accept: application/json` |
| **Path Parameter** | `{id}`: The integer ID of the customer's order |

### Security & Access Control
- The backend validates that `Auth::user()->id === Order::user_id`.
- If unauthenticated: Returns `401 Unauthorized`.
- If attempting to track another customer's order: Returns `403 Forbidden`.
- If order ID does not exist: Returns `404 Not Found`.

---

## 3. Delivery Lifecycle & Tracking States

| Delivery Status (`delivery_status`) | `tracking_state` | `is_tracking_available` | Live Coordinates | Description |
| :--- | :--- | :--- | :--- | :--- |
| `waiting_for_kitchen`, `pending`, `confirmed`, `preparing`, `ready_for_pickup` | `waiting` | `false` | `null` | Order is in the store/kitchen. No live GPS map. |
| `assigned_to_rider` | `assigned` | `false` | `null` | Rider assigned, heading to store. Rider details available. |
| `picked_up`, `in_transit` | `active` | **`true`** | **`float` (Lat/Lng)** | **Live tracking active**. Rider marker rendered on map. |
| `delivered` | `delivered` | `false` | `null` | Delivery complete. Live GPS stripped. Shows proof of delivery URL. |
| `cancelled`, `failed_delivery` | `cancelled` | `false` | `null` | Delivery cancelled or failed. Live GPS stripped. |

---

## 4. API Response Formats

### A. Active Delivery (In Transit / Picked Up) — Status 200 OK

```json
{
  "success": true,
  "data": {
    "order_id": 1042,
    "order_number": "ORD-1042",
    "order_status": "in_transit",
    "delivery_id": 58,
    "delivery_status": "in_transit",
    "delivery_status_label": "In Transit",
    "delivery_type": "internal",
    "is_tracking_available": true,
    "tracking_state": "active",
    "rider": {
      "id": 7,
      "name": "John Dela Cruz",
      "phone": "09171234567",
      "latitude": 14.234567,
      "longitude": 121.332145,
      "accuracy": 8.5,
      "speed": 24.2,
      "heading": 135.0,
      "signal_status": "live",
      "seconds_ago": 6,
      "last_updated_at": "2026-08-16T14:15:30.000000Z",
      "last_updated_human": "6 seconds ago"
    },
    "destination": {
      "customer_name": "Maria Santos",
      "customer_phone": "09189876543",
      "customer_address": "Block 4 Lot 12, Victoria Greens Subd., Laguna",
      "latitude": 14.228910,
      "longitude": 121.325400,
      "landmark": "Near yellow gate"
    },
    "branch": {
      "id": 1,
      "name": "Victoria Branch",
      "latitude": 14.229371,
      "longitude": 121.328383
    },
    "realtime": {
      "channel": "private-customer.order.1042",
      "event": "rider.location.updated",
      "status_event": "order-status-updated"
    },
    "proof_of_delivery_url": null,
    "created_at": "2026-08-16T13:50:00.000000Z",
    "updated_at": "2026-08-16T14:15:30.000000Z"
  }
}
```

### B. Waiting for Kitchen / Preparation — Status 200 OK

```json
{
  "success": true,
  "data": {
    "order_id": 1042,
    "order_number": "ORD-1042",
    "order_status": "preparing",
    "delivery_id": 58,
    "delivery_status": "preparing",
    "delivery_status_label": "Preparing",
    "delivery_type": "internal",
    "is_tracking_available": false,
    "tracking_state": "waiting",
    "rider": null,
    "destination": {
      "customer_name": "Maria Santos",
      "customer_phone": "09189876543",
      "customer_address": "Block 4 Lot 12, Victoria Greens Subd., Laguna",
      "latitude": 14.228910,
      "longitude": 121.325400,
      "landmark": "Near yellow gate"
    },
    "branch": {
      "id": 1,
      "name": "Victoria Branch",
      "latitude": 14.229371,
      "longitude": 121.328383
    },
    "realtime": {
      "channel": "private-customer.order.1042",
      "event": "rider.location.updated",
      "status_event": "order-status-updated"
    },
    "proof_of_delivery_url": null,
    "created_at": "2026-08-16T13:50:00.000000Z",
    "updated_at": "2026-08-16T13:55:00.000000Z"
  }
}
```

### C. Delivered Order — Status 200 OK

```json
{
  "success": true,
  "data": {
    "order_id": 1042,
    "order_number": "ORD-1042",
    "order_status": "delivered",
    "delivery_id": 58,
    "delivery_status": "delivered",
    "delivery_status_label": "Delivered",
    "delivery_type": "internal",
    "is_tracking_available": false,
    "tracking_state": "delivered",
    "rider": {
      "id": 7,
      "name": "John Dela Cruz",
      "phone": "09171234567",
      "latitude": null,
      "longitude": null,
      "accuracy": null,
      "speed": null,
      "heading": null,
      "signal_status": null,
      "seconds_ago": null,
      "last_updated_at": null,
      "last_updated_human": null
    },
    "destination": {
      "customer_name": "Maria Santos",
      "customer_phone": "09189876543",
      "customer_address": "Block 4 Lot 12, Victoria Greens Subd., Laguna",
      "latitude": 14.228910,
      "longitude": 121.325400,
      "landmark": "Near yellow gate"
    },
    "branch": {
      "id": 1,
      "name": "Victoria Branch",
      "latitude": 14.229371,
      "longitude": 121.328383
    },
    "realtime": {
      "channel": "private-customer.order.1042",
      "event": "rider.location.updated",
      "status_event": "order-status-updated"
    },
    "proof_of_delivery_url": "https://yourdomain.com/storage/deliveries/proof_58.jpg",
    "created_at": "2026-08-16T13:50:00.000000Z",
    "updated_at": "2026-08-16T14:30:00.000000Z"
  }
}
```

### D. Error Responses

- **401 Unauthorized**:
  ```json
  {
    "message": "Unauthenticated."
  }
  ```
- **403 Forbidden** (Accessing another user's order):
  ```json
  {
    "success": false,
    "message": "You are not authorized to track this order."
  }
  ```
- **404 Not Found**:
  ```json
  {
    "success": false,
    "message": "Order not found."
  }
  ```

---

## 5. Real-Time WebSockets & Channels

### Channel Authentication Endpoint
- **URL**: `/broadcasting/auth` (or `/api/broadcasting/auth`)
- **Headers**:
  - `Authorization: Bearer <customer_token>`
  - `Accept: application/json`

### Channel Name
- Format: `private-customer.order.{orderId}`
- Example: `private-customer.order.1042`

### Event 1: `rider.location.updated` (GPS Telemetry)
Fires whenever the rider mobile app records a new GPS coordinate while on active delivery.

```json
{
  "order_id": 1042,
  "order_number": "ORD-1042",
  "delivery_id": 58,
  "delivery_status": "in_transit",
  "rider_id": 7,
  "name": "John Dela Cruz",
  "phone": "09171234567",
  "latitude": 14.235120,
  "longitude": 121.331890,
  "accuracy": 7.2,
  "speed": 26.5,
  "heading": 140.0,
  "signal_status": "live",
  "seconds_ago": 3,
  "location_updated_at": "2026-08-16T14:16:00.000000Z"
}
```

### Event 2: `order-status-updated` (Delivery Lifecycle Change)
Fires whenever delivery status changes (e.g. from `preparing` to `picked_up`, or `in_transit` to `delivered`).

```json
{
  "event": "order-status-updated",
  "delivery_id": 58,
  "order_id": 1042,
  "order_number": "ORD-1042",
  "status": "delivered",
  "status_label": "Delivered",
  "previous_status": "in_transit",
  "rider_id": 7,
  "rider_name": "John Dela Cruz",
  "proof_of_delivery_url": "https://yourdomain.com/storage/deliveries/proof_58.jpg",
  "timestamp": "2026-08-16T14:30:00.000000Z"
}
```

---

## 6. Location Signal Freshness Classification

| `seconds_ago` | `signal_status` | UI Indicator | Meaning |
| :--- | :--- | :--- | :--- |
| `< 30` seconds | `live` | 🟢 Green badge: **LIVE** | Rider GPS is updating normally. |
| `30 – 120` seconds | `signal_delayed` | 🟡 Amber badge: **DELAYED** | Network latency or brief signal pause. |
| `> 120` seconds | `offline` | 🔴 Red badge: **SIGNAL PAUSED** | Rider disconnected or GPS signal lost. |

---

## 7. Polling Fallback Architecture

If WebSockets disconnect or are blocked by mobile carriers:
1. Initialize WebSocket connection to `private-customer.order.{orderId}`.
2. If WebSocket connection drops or fails:
   - Poll `GET /api/v1/customer/orders/{id}/tracking` every **8 seconds**.
3. When `tracking_state` changes to `delivered` or `cancelled`:
   - Immediately unsubscribe from channel and cancel polling.

---

# CUSTOMER MOBILE APP INTEGRATION PROMPT

Copy and paste the following prompt directly to your Customer Mobile App AI developer:

```text
You are developing the Live Order Tracking Screen in our Customer Mobile App (React Native / Flutter / Expo / Ionic).

Integrate live delivery tracking using the existing Laravel backend API and WebSockets:

============================================================
1. API ENDPOINT & AUTHENTICATION
============================================================
- Endpoint: GET /api/v1/customer/orders/{orderId}/tracking
- Method: GET
- Headers:
    Authorization: Bearer <CUSTOMER_SANCTUM_TOKEN>
    Accept: application/json

============================================================
2. REAL-TIME WEBSOCKET (LARAVEL ECHO / REVERB / PUSHER)
============================================================
- Channel: private-customer.order.{orderId}
- Channel Auth Endpoint: /broadcasting/auth (Bearer Token auth)
- Event 1: rider.location.updated
    Payload includes:
    {
      "order_id": 1042,
      "delivery_status": "in_transit",
      "rider_id": 7,
      "name": "John Dela Cruz",
      "phone": "09171234567",
      "latitude": 14.234567,
      "longitude": 121.332145,
      "accuracy": 8.5,
      "speed": 24.2,
      "heading": 135.0,
      "signal_status": "live" | "signal_delayed" | "offline",
      "seconds_ago": 6,
      "location_updated_at": "..."
    }
- Event 2: order-status-updated
    Payload includes:
    {
      "status": "delivered" | "cancelled" | "in_transit" | "picked_up",
      "status_label": "Delivered",
      "proof_of_delivery_url": "https://..."
    }

============================================================
3. LIFECYCLE & SCREEN BEHAVIOR
============================================================
A. On Mount:
   1. Fetch initial status via GET /api/v1/customer/orders/{orderId}/tracking.
   2. Check `data.tracking_state`:
      - "waiting" (preparing/ready): Show status steps (e.g. "Kitchen is preparing your order"). Map is hidden or shows store location.
      - "assigned" (assigned_to_rider): Show rider assigned card with name & phone.
      - "active" (picked_up / in_transit): Show full live interactive map with moving rider marker (🛵), destination marker (📍), and store marker (🏪).
      - "delivered": Show delivery complete banner, delivered time, and proof of delivery photo.
      - "cancelled": Show order cancelled notice.
   3. Subscribe to private channel `private-customer.order.{orderId}`.

B. On `rider.location.updated` Event:
   1. Smoothly animate rider marker to new `latitude` and `longitude` (bearing/rotation = `heading`).
   2. Update GPS signal badge according to `signal_status` ("LIVE", "SIGNAL DELAYED", "SIGNAL PAUSED").
   3. Update "Last updated X seconds ago" indicator.

C. On `order-status-updated` Event:
   1. Update order status banner.
   2. If status is `delivered` or `cancelled`:
      - Stop tracking, unsubscribe from WebSocket channel, and render the final delivery/proof state.

D. Fallback Mechanism:
   - If WebSocket fails to connect or disconnects, poll `GET /api/v1/customer/orders/{orderId}/tracking` every 8 seconds while `tracking_state === 'active'`.

============================================================
4. MAP COMPONENT & UX GUIDELINES
============================================================
- Use OpenStreetMap / Leaflet compatible mobile map component (e.g. react-native-maps with OSM tile overlay, flutter_map, or leaflet webview).
- Do NOT collect customer GPS or rider GPS on the customer app. The customer app ONLY consumes the rider telemetry from the backend.
- Handle edge cases:
  - Missing GPS: Show "Waiting for rider GPS signal...".
  - Network error: Auto-retry with backoff.
  - 403 Forbidden: Display "Unauthorized order tracking".
```
