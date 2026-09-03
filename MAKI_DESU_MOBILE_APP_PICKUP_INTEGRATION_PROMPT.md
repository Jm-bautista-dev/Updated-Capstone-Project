# MOBILE APP INTEGRATION COMPATIBILITY PROMPT — PICKUP FULFILLMENT & TIME SLOTS

> **Copy-paste this exact prompt to the AI developer / mobile engineer working on the MAKI DESU React Native / Flutter / Android / iOS mobile application.**

---

## CONTEXT & INSTRUCTIONS FOR MOBILE AI
The web and backend team has implemented a production-ready pickup fulfillment and dynamic time slot engine for MAKI DESU. 

Before making any mobile changes:
1. **Inspect your existing mobile implementation first**: Check your current cart, checkout, branch selection, and order submission screens.
2. **Do NOT invent API endpoints or payload structures**: Use only the exact backend contracts specified below.
3. **Ensure strict compatibility** with the branch configuration and server-authoritative slot validation.

---

## 1. BRANCH PICKUP CAPABILITY & SETTINGS

### `GET /api/v1/customer/pickup-branches`
Returns active branches configured for pickup fulfillment along with operating hours and scheduling rules.

#### Response (`200 OK`)
```json
{
  "success": true,
  "branches": [
    {
      "id": 1,
      "name": "Maki Desu Victoria",
      "address": "Victoria, Laguna",
      "latitude": 14.2300,
      "longitude": 121.3200,
      "pickup_opening_time": "09:00:00",
      "pickup_closing_time": "21:00:00",
      "pickup_lead_time_minutes": 20,
      "pickup_slot_interval_minutes": 15
    },
    {
      "id": 2,
      "name": "Maki Desu Sta. Cruz",
      "address": "Sta. Cruz, Laguna",
      "latitude": 14.2800,
      "longitude": 121.4100,
      "pickup_opening_time": "09:00:00",
      "pickup_closing_time": "21:00:00",
      "pickup_lead_time_minutes": 20,
      "pickup_slot_interval_minutes": 15
    }
  ]
}
```

---

## 2. REAL-TIME PICKUP TIME SLOTS & CAPACITY

### `GET /api/v1/customer/pickup-slots`
Fetch available time slots for a branch on a selected date. The backend dynamically calculates capacity, books counts, lead times, and operating cutoffs.

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `branch_id` | integer | **Yes** | Branch ID (e.g. `1`). |
| `date` | string | Optional | `YYYY-MM-DD` (defaults to today in `Asia/Manila`). Disallows past dates. |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "branch_id": 1,
    "branch_name": "Maki Desu Victoria",
    "date": "2026-09-04",
    "is_open": true,
    "lead_time_minutes": 20,
    "interval_minutes": 15,
    "slots": [
      {
        "time": "10:00",
        "display_time": "10:00 AM",
        "datetime": "2026-09-04T10:00:00+08:00",
        "datetime_raw": "2026-09-04 10:00:00",
        "is_available": true,
        "remaining_capacity": 8,
        "booked_count": 2,
        "is_asap": false
      },
      {
        "time": "10:15",
        "display_time": "10:15 AM",
        "datetime": "2026-09-04T10:15:00+08:00",
        "datetime_raw": "2026-09-04 10:15:00",
        "is_available": false,
        "remaining_capacity": 0,
        "booked_count": 10,
        "is_asap": false
      }
    ]
  }
}
```

#### Slot Behavior Rules for Mobile UI:
1. **Available Slot (`is_available: true`)**:
   - Display as a selectable card/button.
   - Show `display_time` (e.g., `10:00 AM`).
   - Show remaining capacity if low (e.g., `3 slots left`).
2. **Full Slot (`remaining_capacity: 0`)**:
   - Disable card.
   - Display `FULL` badge.
3. **Past / Too Soon (`is_available: false` and `remaining_capacity > 0`)**:
   - For today's date, slots earlier than `now + pickup_lead_time_minutes` are automatically disabled by the backend.
   - Display as disabled/unavailable.

---

## 3. CHECKOUT & PICKUP ORDER SUBMISSION

### `POST /api/v1/orders`
Place a customer pickup order.

#### Headers
```http
Authorization: Bearer <SANCTUM_TOKEN>
Content-Type: application/json
Accept: application/json
X-Idempotency-Key: <UUIDv4>
```

#### Request Payload
```json
{
  "fulfillment_type": "pickup",
  "branch_id": 1,
  "customer_name": "Maria Santos",
  "contact_number": "09171234567",
  "mobile_number": "09171234567",
  "scheduled_pickup_at": "2026-09-04 17:00:00",
  "payment_method": "cash",
  "pickup_notes": "Extra napkins and separate wasabi cups please",
  "items": [
    {
      "product_id": 12,
      "quantity": 2,
      "price": 350.00,
      "selected_addons": [
        {
          "addon_id": 1,
          "name": "Extra Sauce",
          "price": 20.00,
          "quantity": 1
        }
      ]
    }
  ],
  "total_amount": 740.00
}
```

> **Important Notes for Mobile Checkout:**
> - `fulfillment_type` must be explicitly set to `"pickup"`.
> - Do **NOT** send `delivery_fee`, `latitude`, `longitude`, or `address` for pickup orders (they are strictly delivery fields).
> - `scheduled_pickup_at` must match the selected slot's `datetime_raw` format (`YYYY-MM-DD HH:mm:00`).
> - The backend validates `pickup_max_orders_per_slot` with race-condition protection. If another user books the last slot in the same second, the backend responds with `422 Unprocessable Content` stating the slot is fully booked. The app should prompt the user to choose another time slot.

---

## 4. PICKUP ORDER TRACKING & VERIFICATION CODE

### `GET /api/v1/customer/orders/{id}/pickup-status`
Retrieve real-time pickup preparation status and customer verification code.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "order_id": 482,
    "order_number": "ORD-482",
    "status": "ready_for_pickup",
    "status_label": "Ready for Pickup",
    "pickup_verification_code": "MK84F2",
    "scheduled_pickup_at": "2026-09-04 17:00:00",
    "scheduled_pickup_formatted": "Sep 04, 2026 • 5:00 PM",
    "prep_start_at": "2026-09-04 16:40:00",
    "pickup_notes": "Extra napkins and separate wasabi cups please",
    "branch": {
      "id": 1,
      "name": "Maki Desu Victoria",
      "address": "Victoria, Laguna",
      "latitude": 14.2300,
      "longitude": 121.3200
    },
    "message": "Your order is ready! Present verification code MK84F2 to the counter cashier."
  }
}
```

### Real-Time WebSocket Channel:
- **Private Channel:** `private-order.{orderId}`
- **Event:** `.OrderStatusUpdated`
- **Statuses to Handle in Mobile UI:**
  - `pending` -> Order Received
  - `confirmed` -> Order Confirmed
  - `preparing` -> Kitchen Preparing (Starts at `prep_start_at`)
  - `ready_for_pickup` -> Ready at Counter (Show Verification Code)
  - `completed` -> Picked Up & Completed
