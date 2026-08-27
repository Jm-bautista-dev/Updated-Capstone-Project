# Real-Time Rider Active/Inactive Status — Mobile App Integration Specification & AI Prompt

## Executive Summary & Mobile Compatibility Statement

> [!IMPORTANT]
> **MOBILE APP COMPATIBILITY STATEMENT**:
> **`MOBILE APP CODE CHANGE NOT REQUIRED`** (if the mobile app already calls `PATCH /api/v1/rider/status` with Bearer auth).
>
> The backend was purposefully built to be **100% backward compatible** with the Rider Mobile App. The mobile app can send `{"status": "active" | "inactive"}` or `{"is_active": true | false}` or `{"status": "available" | "busy" | "offline"}`. The backend automatically updates the database within an atomic transaction, validates business logic, and immediately broadcasts the real-time `RiderStatusUpdated` event across all website private WebSocket channels.

---

## 1. Actual Backend & Website Implementation Reference

### 1. Exact Rider Status API Endpoint
- **URL Path**: `/api/v1/rider/status`
- **Full Route**: `https://<your-domain>/api/v1/rider/status`

### 2. HTTP Method
- **`PATCH`** (also registered for `PUT` if mobile framework requires)

### 3. Authentication Method
- **Laravel Sanctum Bearer Token** (`rider` token guard).
- The authenticated entity is resolved via `resolveRider($request)` through `$request->user()`.

### 4. Required Headers
```http
Authorization: Bearer <rider_sanctum_token>
Content-Type: application/json
Accept: application/json
```

### 5. Exact Request Body

The backend accepts any of the following formats without breaking:

**Option A: Simple Status String (Recommended for Mobile App)**:
```json
{
  "status": "inactive"
}
```
*(Valid values for `status`: `"active"`, `"inactive"`, `"available"`, `"busy"`, `"offline"` — case-insensitive)*

**Option B: Account Status String**:
```json
{
  "account_status": "inactive"
}
```
*(Valid values: `"active"`, `"inactive"`)*

**Option C: Boolean Account Flag**:
```json
{
  "is_active": false
}
```

### 6. Exact Response Body (`200 OK`)
```json
{
  "success": true,
  "message": "Rider status updated successfully.",
  "is_active": false,
  "account_status": "inactive",
  "status": "offline",
  "rider": {
    "id": 4,
    "name": "John Doe",
    "branch_id": 1,
    "branch_name": "Victoria Branch",
    "is_active": false,
    "account_status": "inactive",
    "status": "offline",
    "is_out_for_delivery": false,
    "can_be_assigned": false,
    "active_deliveries": 0,
    "last_active_at": "2026-08-27T14:45:00.000000Z"
  }
}
```

### 7. Exact Status Values

| Category | Field | Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| **Account Status** | `is_active` | `true`, `false` | Master account switch (`true` = ACTIVE, `false` = INACTIVE). |
| **Account Status String** | `account_status` | `'active'`, `'inactive'` | Human-readable string representation of `is_active`. |
| **Operational Availability** | `status` | `'available'`, `'busy'`, `'offline'` | Real-time working state for deliveries. |

### 8. Exact Database Fields Used (`riders` table)
- `riders.is_active` (`BOOLEAN`, default `true`): Rider account status.
- `riders.status` (`VARCHAR/ENUM`, default `'offline'`): Operational status (`'available'`, `'busy'`, `'offline'`).
- `riders.branch_id` (`BIGINT UNSIGNED`): Foreign key to `branches.id`.
- `riders.last_active_at` (`DATETIME/TIMESTAMP`): Timestamp of the last status change or heartbeat.
- `riders.updated_at` (`DATETIME/TIMESTAMP`): Standard Eloquent timestamp.

### 9. Exact Realtime Event Name
- **PHP Event Class**: `App\Events\RiderStatusUpdated`
- **Broadcast Name**: `rider.status.updated` (clients can listen to `.rider.status.updated` or `RiderStatusUpdated` or `App\Events\RiderStatusUpdated`)

### 10. Exact Realtime Channel Names
- **Admin Channel**: `private-admin.orders`
- **Branch Orders Channel**: `private-branch.{branchId}.orders`
- **Branch General Channel**: `private-branch.{branchId}`

### 11. Channel Authorization Rules (`routes/channels.php`)
- `private-admin.orders`: Authorized only for users where `$user->isAdmin() === true`.
- `private-branch.{branchId}.orders`: Authorized for `$user->isAdmin() === true` OR `$user->branch_id === (int) $branchId`.
- `private-branch.{branchId}`: Authorized for `$user->isAdmin() === true` OR `$user->branch_id === (int) $branchId`.

### 12. Exact Realtime Event Payload
```json
{
  "rider_id": 4,
  "id": 4,
  "name": "John Doe",
  "email": "john.rider@milktea.com",
  "phone": "09171234567",
  "branch_id": 1,
  "branch_name": "Victoria Branch",
  "is_active": false,
  "account_status": "inactive",
  "status": "offline",
  "is_out_for_delivery": false,
  "can_be_assigned": false,
  "active_deliveries": 0,
  "active_in_transit_count": 0,
  "last_active_at": "2026-08-27T14:45:00.000000Z",
  "updated_at": "2026-08-27T14:45:00.000000Z"
}
```

### 13. How Branch Authorization Works
- When a rider in **Victoria Branch** (`branch_id = 1`) changes status, the event is broadcasted strictly to `private-admin.orders`, `private-branch.1.orders`, and `private-branch.1`.
- Cashiers and staff in **Santa Cruz Branch** (`branch_id = 2`) do **NOT** receive this event.
- System Administrators receive all branch updates on `private-admin.orders`.

### 14. How Website Receives Status Changes
1. Admin and Cashier browsers maintain an authorized WebSocket connection via Laravel Echo.
2. When `RiderStatusUpdated` arrives:
   - **Zero-Latency Reactive UI**: React state (`localAvailableRiders`) updates instantly in memory.
   - **Inertia Props Reload**: `router.reload({ only: ['riders', 'availableRiders', 'allRiders', 'stats', 'branchStats'] })` fetches fresh partial data in the background.
   - **No Full Page Reload**: `window.location.reload()` is never called; all UI transitions are smooth and seamless.

### 15. How Rider Availability Is Determined
A rider can only be assigned to a new delivery order if all four criteria are met:
$$\text{can\_be\_assigned} = (\text{is\_active} == \text{true}) \land (\text{status} \neq \text{'offline'}) \land (\neg\text{hasInTransitDelivery}()) \land (\text{rider.branch\_id} == \text{order.branch\_id})$$

### 16. Difference Between ACTIVE and AVAILABLE
- **`ACTIVE` (`is_active = true`)**: The rider's account is turned ON and permitted to work.
- **`AVAILABLE` (`is_active = true` AND `status = 'available'`)**: The rider is active, online, has 0 conflicting active deliveries, and is waiting at the branch ready to receive a new order.

### 17. Difference Between ACTIVE and BUSY
- **`ACTIVE + AVAILABLE`**: Online with no active orders.
- **`ACTIVE + BUSY`**: The rider is active on duty, but is currently assigned to one or more deliveries or is currently on route.

### 18. What Happens When Rider Is INACTIVE
- `is_active` is set to `false`, `status` is set to `'offline'`.
- The rider cannot be manually or automatically assigned to any new delivery.
- On the website delivery assignment modal and riders list, the rider appears with an `Inactive / Offline` badge and the assignment action is disabled.
- Any attempt by an admin to force assignment to an inactive rider is rejected by backend validation with an HTTP session error: `"Rider '<name>' is currently inactive and cannot be assigned a new delivery."`

### 19. What Happens When Rider Becomes ACTIVE
- `is_active` is set to `true`, `status` becomes `'available'` (if they have no in-transit delivery).
- Website delivery dashboard and POS cashier system immediately unlock the rider and display them as available for new assignments.

### 20. What Happens If Rider Is Already OUT FOR DELIVERY
- If a rider has a delivery in `'in_transit'` status, `hasInTransitDelivery()` returns `true`.
- The rider is **LOCKED** (`is_out_for_delivery = true`, `can_be_assigned = false`).
- If the rider changes account status to `INACTIVE` while on the road:
  - **The active delivery is NOT cancelled or disrupted.**
  - The rider completes their current delivery.
  - Once the delivery is marked as delivered, the rider becomes fully inactive/offline.

### 21. What Happens When Realtime Connection Is Lost
- Laravel Echo automatically attempts reconnection with exponential backoff.
- The mobile app and website continue to use REST API as the source of truth.

### 22. Reconnection Behavior
- Upon reconnection, standard Inertia page visits or API fetches pull the fresh database state.
- Backend pessimistic locking (`lockForUpdate()`) ensures that stale client UI cannot cause double-assignments or invalid assignments during brief disconnections.

### 23. Error Responses

**Validation Error (`422 Unprocessable Content`)**:
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "status": ["The selected status is invalid."]
  }
}
```

**Unauthorized (`401 / 403 Forbidden`)**:
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

**Server Error (`500 Internal Server Error`)**:
```json
{
  "success": false,
  "message": "Update failed"
}
```

### 24. Any API Changes
- **Zero Breaking Changes**: Existing mobile status requests continue to succeed.
- **Enhanced Flexibility**: Mobile app can now send either string status (`"active"`, `"inactive"`) or boolean (`"is_active": true/false`).

### 25. Any New Environment Variables
- **No new environment variables** are required for the mobile app.

### 26. Any Mobile-Specific Requirements
- The mobile app UI toggle must **wait for the `200 OK` response** before confirming the UI switch.
- If the API returns an error (`4xx` or `5xx`), the mobile UI must revert the switch back to its previous state and show a toast error message.
- The mobile app must **never invent local statuses** that bypass the backend.

---

```
================================================================================
```

# COPY-PASTE PROMPT FOR RIDER MOBILE APP AI

```markdown
You are working on the Rider Mobile App. The backend and website have already implemented full real-time synchronization for the Rider ACTIVE/INACTIVE status.

Your task is to review the existing Rider Mobile App implementation and verify compatibility with the completed backend API.

============================================================
COMPATIBILITY STATEMENT
============================================================
"MOBILE APP CODE CHANGE NOT REQUIRED" if the mobile app already calls `PATCH /api/v1/rider/status` with Bearer token authentication and handles the 200 OK response.

============================================================
BACKEND API CONTRACT
============================================================
1. Endpoint: PATCH /api/v1/rider/status
2. Authentication: Authorization: Bearer <sanctum_token>
3. Headers:
   Content-Type: application/json
   Accept: application/json

4. Request Body (choose any of these supported formats):
   {
     "status": "active"   // or "inactive"
   }
   OR
   {
     "is_active": true    // or false
   }
   OR
   {
     "status": "available" // or "offline"
   }

5. Expected Success Response (200 OK):
   {
     "success": true,
     "message": "Rider status updated successfully.",
     "is_active": true,
     "account_status": "active",
     "status": "available",
     "rider": {
       "id": 4,
       "name": "John Doe",
       "branch_id": 1,
       "branch_name": "Victoria Branch",
       "is_active": true,
       "account_status": "active",
       "status": "available",
       "is_out_for_delivery": false,
       "can_be_assigned": true,
       "active_deliveries": 0,
       "last_active_at": "2026-08-27T14:45:00.000000Z"
     }
   }

============================================================
MOBILE APP RULES & IMPLEMENTATION GUIDELINES
============================================================
- Inspect the existing rider ACTIVE/INACTIVE status toggle in the app.
- Keep the existing UI component and styling intact.
- When the rider toggles the switch:
  1. Set loading state on the switch.
  2. Send PATCH /api/v1/rider/status with the new status.
  3. Wait for the 200 OK HTTP response.
  4. On success: Update local state with the returned `is_active` / `status` from `response.data`.
  5. On error (422, 401, 500, network failure): Revert the switch to its previous state and show an error notification.
- Do NOT generate or confirm status changes locally without backend confirmation.
- Do NOT invent new endpoints or status strings.
- If the app already adheres to this flow, confirm that "MOBILE APP CODE CHANGE NOT REQUIRED."
```
