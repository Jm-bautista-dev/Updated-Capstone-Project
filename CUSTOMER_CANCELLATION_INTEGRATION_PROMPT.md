# Customer Cancellation Notification — Mobile App Integration Prompt

> Copy-paste this entire document into the AI assistant building your **Customer Mobile App** so it can display cancellation status updates to the customer.

---

## Overview

When a rider requests cancellation of a customer's order, the customer should be notified of:
1. The cancellation request being submitted (order enters `cancellation_requested` state)
2. The final decision (approved = order cancelled, rejected = order continues)

The customer does **NOT** make the approval/rejection decision — that is handled by the branch cashier/admin.

---

## Real-Time Events (Pusher/Laravel Echo)

### Channel: `customer.order.{order_id}`

Listen on this channel for cancellation-related events.

---

### Event: `CancellationRequested`

Fired when a rider submits a cancellation request.

```json
{
    "cancellation_request_id": 42,
    "order_id": 123,
    "order_number": "ORD-00123",
    "delivery_id": 56,
    "rider_id": 7,
    "rider_name": "Juan Rider",
    "customer_name": "Maria Customer",
    "branch_id": 2,
    "branch_name": "Maki Desu Sta. Cruz",
    "reason": "Customer is unreachable",
    "notes": "Called 5 times, no answer.",
    "status": "pending",
    "requested_at": "2026-08-17T10:30:00.000000Z"
}
```

#### Suggested Customer UI:
- Show an in-app alert/banner: **"Your rider has requested to cancel this order. The restaurant is reviewing the request."**
- Update order status display to show: **"Cancellation Under Review"**
- Optionally show the rider's reason

---

### Event: `CancellationResolved`

Fired when the cashier/admin accepts or rejects the cancellation.

```json
{
    "cancellation_request_id": 42,
    "order_id": 123,
    "order_number": "ORD-00123",
    "cancellation_request_status": "approved",  // or "rejected"
    "order_status": "cancelled",                // or previous active status
    "reviewed_by_name": "John Cashier"
}
```

#### If `cancellation_request_status === "approved"`:
- Show alert: **"Your order has been cancelled by the restaurant."**
- Update order status to **"Cancelled"**
- Show refund information if applicable

#### If `cancellation_request_status === "rejected"`:
- Show alert: **"Good news! Your order is still being delivered."**
- Restore order tracking to the previous active state
- Resume normal delivery tracking UI

---

## Polling Fallback (if WebSocket is unavailable)

If the customer app cannot use WebSockets, poll the order status:

```
GET /api/v1/orders/{order_id}
```

Check the `status` field:
- `cancellation_requested` → Show "Cancellation Under Review"
- `cancelled` → Show "Order Cancelled"
- Any active status (`assigned_to_rider`, `picked_up`, `in_transit`) → Show normal tracking

---

## Important Notes

1. **The customer does NOT approve or reject the cancellation.** They only receive notifications.
2. **The customer should still be able to contact support** if they disagree with a cancellation.
3. **Refund handling** is outside the scope of this workflow — handle it in your payment/refund system.
