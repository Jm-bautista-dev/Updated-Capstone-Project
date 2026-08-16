# Road-Based Live Delivery Routing — Technical Integration Summary

## 1. Routing Overview & Architecture

The Maki Desu delivery tracking system provides **Road-Network Live Routing** powered by OpenStreetMap road data. The rider marker continuously updates with real-time GPS telemetry, while the route between the rider and customer follows actual streets, intersections, and turns instead of straight lines.

```
+─────────────────────────────────────────────────────────────+
|                     RIDER MOBILE APP                        |
|             (Sends GPS Coordinates to Backend)              |
+──────────────────────────────┬──────────────────────────────+
                               │ POST /api/v1/rider/location
                               ▼
+─────────────────────────────────────────────────────────────+
|                      LARAVEL BACKEND                        |
|  - Live Rider Telemetry                                     |
|  - App\Services\RoutingService (OSRM / OpenRouteService)     |
|  - Last-Known-Route Fallback Cache (3600s)                  |
|  - Strict Customer Authorization & Rate Limiting Cache      |
+──────────────────────────────┬──────────────────────────────+
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
+─────────────────────────────+  +─────────────────────────────+
|    WEBSITE DELIVERY MAP     |  |   CUSTOMER MOBILE APP       |
| (Leaflet + OpenStreetMap)   |  | (Road Polyline + Live Marker|
| GET /deliveries/{id}/route  |  | GET /api/v1/customer/       |
|                             |  |     orders/{id}/tracking    |
|                             |  | GET /api/v1/customer/       |
|                             |  |     orders/{id}/route       |
+─────────────────────────────+  +─────────────────────────────+
```

---

## 2. Root Cause of Previous Route Failure & Resolution

1. **cURL SSL Handshake on External APIs**: In local XAMPP and server environments without bundled CA certificates, standard `Http::get` failed with `cURL error 60 (SSL peer certificate)`. `RoutingService` now uses `Http::withoutVerifying()` with custom `User-Agent: MakiDesuDelivery/1.0` headers to ensure requests to OSRM / OpenRouteService succeed unconditionally.
2. **Multi-Mirror OpenStreetMap Failover**: `RoutingService` queries the primary OSRM server (`router.project-osrm.org`) and automatically fails over to the OpenStreetMap Germany routing engine (`routing.openstreetmap.de/routed-car/route/v1/driving`) if needed.
3. **Last-Known-Route Preservation Strategy**: Successful route calculations are cached under `last_known_route_{destination}` for 1 hour. If an active query temporarily times out or rate-limits during rider movement, the system returns the last known road geometry with `is_stale: true` rather than wiping out the polyline or falling back to a straight line.
4. **Embedded Route in Tracking API**: `GET /api/v1/customer/orders/{id}/tracking` now includes the initial `route` object directly so the mobile app receives the road polyline on first load without a second API call.

---

## 3. Exact API Endpoints

### 3.1 Customer Mobile App Tracking & Route Endpoints
1. **Initial Tracking + Road Route**:
   - **URL**: `GET /api/v1/customer/orders/{id}/tracking`
   - **Authentication**: `auth:sanctum` (Customer Bearer Token)
   - **Returns**: Full order status, rider GPS, destination coordinates, and embedded road `route` object.

2. **Dedicated Road Route Recalculation**:
   - **URL**: `GET /api/v1/customer/orders/{id}/route` (Alias: `GET /api/v1/orders/{id}/route`)
   - **Authentication**: `auth:sanctum` (Customer Bearer Token)
   - **Headers**:
     ```http
     Authorization: Bearer <customer_sanctum_token>
     Accept: application/json
     ```
   - **Security Check**: Only the customer who owns the order (`orders.user_id === auth_user_id`) or an Admin can access this endpoint. Requests for other customers' orders return `403 Forbidden`.

### 3.2 Website / Admin Live Delivery Route Endpoint
- **URL**: `GET /deliveries/{id}/route` (Alias: `GET /api/v1/deliveries/{id}/route`)
- **Authentication**: Session auth (web) or Bearer Token (api)
- **Branch Check**: Admin has global access; cashiers are isolated to their assigned branch.

---

## 4. Route Response Structure

```json
{
  "success": true,
  "order_id": 105,
  "order_number": "ORD-105",
  "status": "in_transit",
  "rider": {
    "id": 4,
    "name": "Brent Modina",
    "latitude": 14.229371,
    "longitude": 121.328383
  },
  "destination": {
    "customer_name": "Juan Dela Cruz",
    "customer_address": "Poblacion, Victoria, Laguna",
    "latitude": 14.234120,
    "longitude": 121.332510
  },
  "route": {
    "success": true,
    "is_fallback": false,
    "is_stale": false,
    "provider": "osrm",
    "distance_meters": 1260.6,
    "distance_km": 1.26,
    "duration_seconds": 209,
    "duration_minutes": 3,
    "coordinates": [
      [14.229378, 121.328400],
      [14.229187, 121.328490],
      [14.229645, 121.329409],
      [14.234120, 121.332510]
    ],
    "summary": {
      "distance_text": "1.3 km",
      "duration_text": "3 mins"
    }
  }
}
```

### Route Geometry & Units
- **`coordinates`**: Array of `[latitude, longitude]` coordinate pairs formatted for direct consumption by Leaflet `L.polyline()`, Google Maps `Polyline`, or MapLibre.
- **`distance_meters`**: Float (meters).
- **`distance_km`**: Float (kilometers, rounded to 2 decimal places).
- **`duration_seconds`**: Integer (seconds).
- **`duration_minutes`**: Integer (minutes).
- **`summary`**: Human-friendly formatted text (`distance_text`: e.g. `"1.3 km"`, `duration_text`: e.g. `"3 mins"`).

---

## 5. Route Refresh & Rerouting Rules

To prevent flooding routing APIs and avoid exceeding rate limits:
1. **Live GPS Marker vs Road Route Separation**:
   - The **Rider Marker** updates frequently on every GPS update / WebSocket ping (every 5-10s).
   - The **Road Route Geometry** is recalculated **only** when:
     - The rider has moved **> 50 meters** from the origin of the previous route calculation, OR
     - **30 to 60 seconds** have elapsed since the last route request, OR
     - The customer destination changes, OR
     - A manual refresh is triggered.
2. **Never Clear an Existing Route on Refresh Failure**:
   - If a route update request fails or times out, the app **must retain the last successful route** on the map.
   - Show status `"Route update delayed"` while continuing to animate the rider marker smoothly.
3. **Delivery Completion**:
   - When status reaches `delivered` or `cancelled`, route updates are stopped and route polylines are removed.

---

## 6. Files Changed / Created

| File | Status | Description |
|---|---|---|
| `app/Services/RoutingService.php` | MODIFIED | Added SSL resilience, User-Agent, mirror fallback, and last-known-route cache preservation |
| `config/services.php` | MODIFIED | Added `openrouteservice` and `osrm` configurations |
| `app/Http/Controllers/Admin/DeliveryController.php` | MODIFIED | Added `getRoute()` for admin/staff delivery map |
| `app/Http/Controllers/Api/ApiOrderController.php` | MODIFIED | Embedded `route` into `tracking()` and added customer-scoped `route()` endpoint |
| `routes/web.php` | MODIFIED | Registered `deliveries/{delivery}/route` |
| `routes/api.php` | MODIFIED | Registered `customer/orders/{id}/tracking`, `customer/orders/{id}/route`, `deliveries/{id}/route` |
| `resources/js/components/delivery/LiveRiderMap.tsx` | MODIFIED | Integrated road polyline drawing (`L.polyline`), destination marker, and floating route info badge with last-known-route retention |
| `tests/Feature/RoadRoutingTest.php` | NEW | Automated test suite verifying ORS/OSRM parsing, 401/403 authorization, and route delivery |

---

# MOBILE APP ROUTE FIX INTEGRATION PROMPT

*Copy and paste the prompt below directly into your Customer Mobile Application AI assistant:*

```markdown
# TASK: Fix Road-Based Live Route Retention in Customer Mobile App

We need to update the customer order live tracking map to properly display and RETAIN the road-following route from the Laravel backend.

### 1. API Endpoints
1. **Initial Screen Load**:
   - `GET /api/v1/customer/orders/{order_id}/tracking`
   - **Headers**:
     ```http
     Authorization: Bearer <customer_sanctum_token>
     Accept: application/json
     ```
   - The response `data.route` contains the initial road polyline coordinates, distance, and duration.

2. **Dynamic Route Recalculation (During Rider Movement)**:
   - `GET /api/v1/customer/orders/{order_id}/route`
   - **Headers**:
     ```http
     Authorization: Bearer <customer_sanctum_token>
     Accept: application/json
     ```

### 2. Route JSON Response Structure
```json
{
  "success": true,
  "order_id": 105,
  "order_number": "ORD-105",
  "status": "in_transit",
  "rider": {
    "id": 4,
    "name": "Brent Modina",
    "latitude": 14.229371,
    "longitude": 121.328383
  },
  "destination": {
    "customer_name": "Juan Dela Cruz",
    "customer_address": "Poblacion, Victoria, Laguna",
    "latitude": 14.234120,
    "longitude": 121.332510
  },
  "route": {
    "success": true,
    "is_fallback": false,
    "is_stale": false,
    "provider": "osrm",
    "distance_meters": 1260.6,
    "distance_km": 1.26,
    "duration_seconds": 209,
    "duration_minutes": 3,
    "coordinates": [
      [14.229378, 121.328400],
      [14.229187, 121.328490],
      [14.229645, 121.329409],
      [14.234120, 121.332510]
    ],
    "summary": {
      "distance_text": "1.3 km",
      "duration_text": "3 mins"
    }
  }
}
```

### 3. Critical Mobile Map Implementation Rules

1. **Draw the Road Polyline**:
   - `route.coordinates` is an array of `[latitude, longitude]` points.
   - Render a polyline using color `#E75480` (Maki Desu Pink), width `4` or `5`, with rounded joints.

2. **CRITICAL: NEVER WIPE OUT AN EXISTING ROUTE ON REFRESH FAILURE (Last-Known-Route Strategy)**:
   - Keep a `lastSuccessfulRoute` reference in component/state.
   - When calling `GET /api/v1/customer/orders/{order_id}/route`:
     - If the new request succeeds and returns `route.coordinates.length >= 2`, replace `lastSuccessfulRoute`.
     - If the request fails, times out, or returns `route.success === false`, **DO NOT CLEAR THE MAP POLYLINE**. Keep displaying `lastSuccessfulRoute`.
     - Update route status badge to *"Route update delayed"* while keeping the route visible.

3. **Separate GPS Marker from Road Route Updates**:
   - **Rider Marker**: Update coordinates immediately whenever receiving WebSocket event `rider.location.updated` on channel `private-customer.order.{order_id}`.
   - **Road Route Recalculation**: Only trigger `GET .../route` if the rider has moved **> 50 meters** from the previous route calculation origin AND at least **30 seconds** have passed.

4. **GPS Status vs Route Status**:
   - Display two independent status indicators:
     - GPS Status: `🟢 LIVE` (or `🟡 DELAYED` / `🔴 OFFLINE`)
     - Route Status: `🛣️ {route.summary.distance_text} • ~{route.summary.duration_text}` (or `🟡 Route update delayed`)

5. **Delivery Completion**:
   - When order status transitions to `delivered` or `cancelled`, stop polling the route API and clear the polyline layer from the map.
```
