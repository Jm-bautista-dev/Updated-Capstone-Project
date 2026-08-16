# REALTIME ORDER INTEGRATION SUMMARY

## 1. Existing Order Creation Flow
When a mobile customer places an order:
1. Customer Mobile App sends `POST /api/v1/orders` request with order items and delivery details.
2. `ApiOrderController::store` creates the `Order` record and `Delivery` record within a `DB::transaction` block.
3. **Post-Commit Real-Time Dispatch**: Immediately after the transaction successfully commits to MySQL, the backend dispatches `OrderCreated` and `OrderStatusUpdated` real-time WebSocket events.

---

## 2. Real-Time Technology Used
- **Backend**: Laravel Broadcasting (`ShouldBroadcastNow`), Pusher / Laravel Reverb.
- **Frontend**: Laravel Echo (`resources/js/echo.ts`) with `pusher-js`.

---

## 3. Exact Event Name
- Event Class: `App\Events\OrderCreated`
- Broadcast Event Name (`broadcastAs`): `OrderCreated` / `.OrderCreated`
- Status Update Event Class: `App\Events\OrderStatusUpdated` (`order-status-updated` / `.order-status-updated`)

---

## 4. Exact Channel Structure
- **Admin Users**: `private-admin.orders`
- **Branch Staff / Cashiers**: `private-branch.{branchId}.orders`

---

## 5. Channel Authorization (`routes/channels.php`)
```php
// Admin-wide order channel
Broadcast::channel('admin.orders', function ($user) {
    return $user->isAdmin();
});

// Branch-specific order channel
Broadcast::channel('branch.{id}.orders', function ($user, $id) {
    if ($user->isAdmin()) return true;
    return (int) $user->branch_id === (int) $id;
});
```

---

## 6. Event Payload
```json
{
  "order_id": 1042,
  "branch_id": 1,
  "customer_name": "Jane Doe",
  "total_amount": 500.00,
  "branch_name": "MAKI DESU STA CRUZ",
  "timestamp": "2026-08-17 01:08:40",
  "message": "New Order #1042 received!"
}
```

---

## 7. Website Listeners (`resources/js/hooks/use-real-time.tsx`)
The shared `useRealTime` hook is included in `AppSidebarLayout` wrapping all website pages:
- Subscribes to `private-admin.orders` (for Admins) or `private-branch.{userBranchId}.orders` (for Branch Cashiers).
- Triggers non-blocking Sonner toast alerts with custom UI (`Order #...`, `Customer Name`, `Branch`, and a "View Order" button navigating to `/deliveries`).

---

## 8. Notification & State Integration
- **Deduplication**: `notifiedOrderIds` Set tracks processed `order_id`s to prevent duplicate sounds, alerts, or state refreshes.
- **Audio Chime**: `playNotificationSound()` plays audio chime (`/notification.mp3`).
- **Partial Inertia Prop Update**: Executes `router.reload({ only: ['summary', 'recentOrders', 'orders', 'deliveries', 'stats'] })` to update UI state without a full page refresh (`window.location.reload()`).

---

## 9. Branch Authorization Security
- **Branch Isolation**: Orders for Branch A (`MAKI DESU STA CRUZ`) are broadcast ONLY on `private-branch.1.orders`. Cashiers assigned to Branch B (`MAKI DESU VICTORIA`) never receive Branch A orders.

---

## 10. Reconnection Behavior
- `echo.ts` auto-reconnects with activity/pong timeouts.
- Duplicate alerts upon reconnect are blocked by `notifiedOrderIds` set.

---

## 11. Fallback Behavior
- If WebSockets are unavailable or disconnected, `router.reload` on user navigation or tab focus synchronizes state from the backend.

---

## 12. Files Changed
- [`app/Http/Controllers/Api/ApiOrderController.php`](file:///c:/xampp/htdocs/Capstone-Project/app/Http/Controllers/Api/ApiOrderController.php)
- [`app/Events/OrderCreated.php`](file:///c:/xampp/htdocs/Capstone-Project/app/Events/OrderCreated.php)
- [`resources/js/hooks/use-real-time.tsx`](file:///c:/xampp/htdocs/Capstone-Project/resources/js/hooks/use-real-time.tsx)
- [`tests/Feature/RealTimeMobileOrderSyncTest.php`](file:///c:/xampp/htdocs/Capstone-Project/tests/Feature/RealTimeMobileOrderSyncTest.php)

---

## 13. Dependencies Changed
- None (reused existing `laravel-echo` and `pusher-js` dependencies).

---

## 14. Environment Variables / Configuration
- `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`.

---

## 15. Testing Performed
- `php artisan test tests/Feature/RealTimeMobileOrderSyncTest.php` $\rightarrow$ **3/3 passed (15 assertions)**.
- `php artisan test tests/Feature/CustomerOrderCancellationTest.php` $\rightarrow$ **3/3 passed (13 assertions)**.
- `php artisan test tests/Feature/AutomaticProductCostAndStockTest.php` $\rightarrow$ **16/16 passed (51 assertions)**.
- `npx tsc --noEmit` $\rightarrow$ **0 errors**.
- `npm run build` $\rightarrow$ **Clean build in 8.61s**.

---

## MOBILE APP CHANGE STATUS

**MOBILE APP CHANGE NOT REQUIRED**

*The customer mobile app already creates orders via `POST /api/v1/orders`. The backend automatically broadcasts the real-time `OrderCreated` event post-commit to authorized website channels without requiring any changes to the mobile app.*
