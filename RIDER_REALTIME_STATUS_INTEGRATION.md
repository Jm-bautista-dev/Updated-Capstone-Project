# Real-Time Rider Active/Inactive Status Integration Documentation

## Compatibility Summary

> [!IMPORTANT]
> **MOBILE APP COMPATIBILITY STATEMENT**:
> **`MOBILE APP CHANGE NOT REQUIRED`**
> 
> The existing mobile app endpoint `PATCH /api/v1/rider/status` continues to work seamlessly without requiring any breaking changes or forced app updates. The backend automatically translates both account status (`is_active` / `active` / `inactive`) and operational availability (`available` / `busy` / `offline`), validates state under transaction locks, updates the database, and immediately broadcasts the `RiderStatusUpdated` event over private WebSocket channels (`admin.orders`, `branch.{branchId}.orders`, `branch.{branchId}`).

---

## 1. Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │            RIDER MOBILE APP             │
                      │   PATCH /api/v1/rider/status            │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │         LARAVEL BACKEND API             │
                      │  1. Resolve Rider & Authenticate Token  │
                      │  2. Normalize is_active & status        │
                      │  3. DB::transaction() Commit            │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │       RiderStatusUpdated Event          │
                      │  Dispatched over Private Channels:      │
                      │  • private-admin.orders                 │
                      │  • private-branch.{branchId}.orders     │
                      │  • private-branch.{branchId}            │
                      └────────────────────┬────────────────────┘
                                           │
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │          WEBSITE FRONTEND               │
                      │  • Laravel Echo Listener                │
                      │  • Instant React State Sync (0 latency) │
                      │  • Inertia Partial Reload (No refresh)  │
                      │  • Assignment Modal & Fleet Updates     │
                      └─────────────────────────────────────────┘
```

---

## 2. API Endpoints & Request/Response Contracts

### `PATCH /api/v1/rider/status`

**Authentication**: Bearer Token via Laravel Sanctum (Rider Guard).

#### Request Body Options (Flexible & Backward Compatible)
1. **Status String (Legacy & New)**:
   ```json
   {
     "status": "inactive" // Allowed: "active", "inactive", "available", "busy", "offline"
   }
   ```
2. **Account Status String**:
   ```json
   {
     "account_status": "inactive" // Allowed: "active", "inactive"
   }
   ```
3. **Boolean Flag**:
   ```json
   {
     "is_active": false
   }
   ```

#### Response Payload (`200 OK`)
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

---

## 3. Real-Time Broadcast Event: `RiderStatusUpdated`

- **Event Class**: `App\Events\RiderStatusUpdated`
- **Broadcast Name**: `rider.status.updated` (also listens to `RiderStatusUpdated`)
- **Implements**: `Illuminate\Contracts\Broadcasting\ShouldBroadcast`

### Channel Routing & Authorization

| Channel Name | Target Audience | Authorization Rule |
| :--- | :--- | :--- |
| `private-admin.orders` | System Administrators | `$user->isAdmin()` |
| `private-branch.{branchId}.orders` | Branch Cashiers & Staff | `$user->isAdmin()` OR `$user->branch_id === $branchId` |
| `private-branch.{branchId}` | General Branch Listeners (POS, Fleet) | `$user->isAdmin()` OR `$user->branch_id === $branchId` |

### Broadcast Payload Schema
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

---

## 4. Core Business Rules: Status vs Availability

The system strictly enforces three distinct concepts:

1. **Account Status (`is_active`)**:
   - `true` (`ACTIVE`): Rider account is operational.
   - `false` (`INACTIVE`): Rider account is offline/inactive and cannot receive assignments.
2. **Operational Availability (`status`)**:
   - `'available'`: Online and ready to accept new assignments.
   - `'busy'`: Online but assigned tasks.
   - `'offline'`: Offline.
3. **Delivery Route State (`is_out_for_delivery` / `hasInTransitDelivery()`)**:
   - `'in_transit'` / `'picked_up'`: Rider is actively navigating on the road.
   - **Rule**: Even if `is_active === true`, a rider with an active in-transit delivery is **LOCKED** and **CANNOT** be assigned additional orders.

### Assignment Eligibility Formula
```
can_be_assigned = (is_active === true) 
                  AND (status !== 'offline') 
                  AND (!hasInTransitDelivery()) 
                  AND (rider.branch_id === delivery.branch_id)
```

---

## 5. Backend Assignment Validation & Concurrency Protection

In `App\Services\DeliveryService::assignRider()`:
- Pessimistic Row Lock: `Rider::where('id', $riderId)->lockForUpdate()->first()`
- Validation sequence:
  1. Rider existence check $\rightarrow$ `"Rider not found."`
  2. Account active check $\rightarrow$ `"Rider '{name}' is currently inactive and cannot be assigned a new delivery."`
  3. Operational status check $\rightarrow$ `"Rider '{name}' is currently offline and cannot be assigned a new delivery."`
  4. Branch authorization check $\rightarrow$ `"Rider '{name}' belongs to a different branch and cannot take this delivery."`
  5. In-transit check $\rightarrow$ `"Rider '{name}' is currently out for delivery and cannot be assigned additional orders."`

---

## 6. Frontend Real-Time Listeners

### `resources/js/hooks/use-real-time.tsx`
Listens on `admin.orders`, `branch.{branchId}.orders`, and `branch.{branchId}` for `RiderStatusUpdated` and seamlessly refreshes Inertia page props (`['riders', 'availableRiders', 'allRiders', 'stats', 'branchStats']`) without full page reloads.

### `resources/js/pages/Admin/Deliveries.tsx`
Maintains reactive `localAvailableRiders` state that immediately mutates on WebSocket event arrival, ensuring manual assignment modals and fleet cards reflect real-time rider status with zero delay.

### `resources/js/pages/Admin/Riders/Index.tsx`
Renders real-time rider table and grid cards with distinct badges for `ACTIVE` vs `INACTIVE` account states and `AVAILABLE`, `ON DELIVERY`, and `OFFLINE` operational states.

---

## 7. Automated Test Suite

Test suite located at `tests/Feature/RealTimeRiderStatusSyncTest.php`:
1. `test_mobile_api_can_switch_rider_from_active_to_inactive_and_broadcasts_event`
2. `test_mobile_api_can_switch_rider_from_inactive_to_active_and_broadcasts_event`
3. `test_admin_cannot_assign_delivery_to_inactive_rider`
4. `test_admin_can_assign_delivery_to_active_available_rider`
5. `test_admin_cannot_assign_delivery_to_rider_who_is_out_for_delivery`
6. `test_admin_cannot_assign_delivery_to_rider_from_another_branch`
7. `test_realtime_broadcast_channels_are_branch_isolated`
8. `test_admin_rider_update_broadcasts_realtime_status_event`
9. `test_rider_inactivity_does_not_corrupt_or_cancel_existing_deliveries`
10. `test_pos_available_riders_excludes_inactive_and_busy_riders`
