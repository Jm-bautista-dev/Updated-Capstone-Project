# Rider Cancellation Request — Mobile App Integration Prompt

> Copy-paste this entire document into the AI assistant building your **Rider Mobile App** so it can integrate the cancellation request workflow.

---

## Overview

When a rider wants to cancel a customer's order, the rider does **NOT** directly cancel it. Instead, the rider submits a **Cancellation Request** which must be approved or rejected by the branch cashier/admin.

---

## API Endpoint

```
POST /api/v1/rider/orders/{order_id}/cancel
```

### Headers
```
Authorization: Bearer {rider_token}
Content-Type: application/json
Accept: application/json
```

### Request Body
```json
{
    "reason": "Customer is unreachable",
    "notes": "Called 5 times, no answer. Waited 15 minutes at delivery address."
}
```

| Field    | Type   | Required | Description                                     |
|----------|--------|----------|-------------------------------------------------|
| `reason` | string | **Yes**  | Primary reason for cancellation                 |
| `notes`  | string | No       | Additional details or context                   |

### Suggested Reason Options (for UI dropdown/selection)
- Customer is unreachable
- Wrong delivery address
- Customer refused delivery
- Safety concern at delivery location
- Vehicle breakdown
- Weather conditions too dangerous
- Order items damaged during transit
- Other (allow free text)

---

## Success Response (201)

```json
{
    "success": true,
    "message": "Cancellation request submitted. Waiting for branch approval.",
    "cancellation_request": {
        "id": 42,
        "order_id": 123,
        "status": "pending",
        "reason": "Customer is unreachable",
        "notes": "Called 5 times, no answer.",
        "requested_at": "2026-08-17T10:30:00.000000Z"
    }
}
```

---

## Error Responses

### 422 — Validation Error
```json
{
    "success": false,
    "message": "The reason field is required."
}
```

### 400 — Invalid Order State
```json
{
    "success": false,
    "message": "Order cannot be cancelled from its current state."
}
```

### 409 — Already Requested
```json
{
    "success": false,
    "message": "A cancellation request is already pending for this order."
}
```

### 403 — Unauthorized
```json
{
    "success": false,
    "message": "You are not authorized to cancel this order."
}
```

---

## Real-Time Events (Pusher/Laravel Echo)

### Channel: `rider.{rider_id}`

The rider should listen on their private channel for resolution events:

#### Event: `CancellationResolved`

```json
{
    "cancellation_request_id": 42,
    "order_id": 123,
    "order_number": "ORD-00123",
    "cancellation_request_status": "approved",  // or "rejected"
    "order_status": "cancelled",                // or previous status
    "reviewed_by_name": "John Cashier"
}
```

---

## Rider App UI Flow

### 1. Cancel Button
- Show a "Request Cancellation" button on the active delivery screen
- Only visible when order is in: `assigned_to_rider`, `picked_up`, or `in_transit`

### 2. Cancellation Form
- Reason selector (dropdown or radio buttons from suggested reasons above)
- Optional notes text area
- "Submit Request" button
- "Go Back" button

### 3. Pending State
- After submitting, show the order with status: **"Cancellation Requested — Awaiting Approval"**
- The rider should NOT be able to submit another cancellation request for the same order
- The rider can still see the order details but cannot perform delivery actions

### 4. Resolution
- Listen for `CancellationResolved` event on `rider.{rider_id}` channel
- If **approved**: Show success message, remove order from active deliveries
- If **rejected**: Show info message ("Your cancellation was rejected. Please continue the delivery."), restore order to active state

---

## Important Notes

1. **The rider CANNOT directly cancel an order.** The API will create a pending request, not an immediate cancellation.
2. **Only ONE pending request per order.** If a request already exists, the API returns 409.
3. **The rider should disable delivery actions** while a cancellation request is pending (no pickup, transit, or deliver actions).
4. **Poll or listen** for the resolution. The cashier may take a few minutes to decide.
