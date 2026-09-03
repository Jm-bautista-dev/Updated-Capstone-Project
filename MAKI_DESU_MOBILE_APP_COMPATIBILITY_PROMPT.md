# MOBILE APP INTEGRATION COMPATIBILITY PROMPT FOR MAKI DESU CUSTOMER & RIDER APP

> **Copy-paste this exact document to the AI developer / mobile engineer working on the MAKI DESU React Native / Flutter / Android / iOS mobile applications.**

---

## 1. BASE URL & AUTHENTICATION
- **Base URL:** `https://your-domain.com/api/v1` (or local development: `http://<your-lan-ip>/Capstone-Project/public/api/v1`)
- **Authentication:** Laravel Sanctum Bearer Token
- **Headers Required:**
  ```http
  Authorization: Bearer <SANCTUM_TOKEN>
  Accept: application/json
  Content-Type: application/json
  X-Idempotency-Key: <UUIDv4> (Mandatory for order creation to prevent duplicate charges)
  ```

---

## 2. PRODUCT CATALOG & ADD-ONS CONTRACT

### `GET /api/v1/products`
Returns all products with dynamic stock calculations and available add-ons.

#### Query Parameters
| Parameter | Type | Required | Description |
|---|---|---|---|
| `branch_id` | integer | Optional | Branch ID to evaluate ingredient stock for (defaults to nearest/branch 1). |
| `category_id` | integer | Optional | Filter products by category ID. |
| `search` | string | Optional | Search by name or SKU. |

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": 12,
      "name": "Dragon Roll",
      "sku": "DRG-01",
      "selling_price": 350.00,
      "price": 350.00,
      "image": "https://your-domain.com/storage/products/dragon_roll.jpg",
      "category": "Special Rolls",
      "description": "Crispy ebi roll topped with ripe mango and Japanese mayo.",
      "unit": "roll",
      "stock": 42.0,
      "is_available": true,
      "is_low_stock": false,
      "limiting_item": null,
      "average_rating": 4.8,
      "review_count": 27,
      "quantity_sold": 150,
      "addons": [
        {
          "id": 1,
          "name": "Extra Sauce",
          "price": 20.00,
          "is_active": true
        },
        {
          "id": 2,
          "name": "Extra Wasabi",
          "price": 15.00,
          "is_active": true
        },
        {
          "id": 3,
          "name": "Extra Toppings",
          "price": 30.00,
          "is_active": true
        }
      ]
    }
  ]
}
```

> **Security Note:** Cashiers and mobile clients **never receive** product `cost_price` or ingredient margins.

---

## 3. CART API WITH ADD-ONS SUPPORT

### `GET /api/v1/cart`
Returns the customer's current cart items, add-ons, and calculated total.

#### Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "branch": {
      "id": 1,
      "name": "Maki Desu Victoria",
      "address": "Victoria, Laguna"
    },
    "items": [
      {
        "id": 105,
        "product_id": 12,
        "quantity": 2,
        "selected_addons": [
          {
            "addon_id": 1,
            "name": "Extra Sauce",
            "price": 20.00,
            "quantity": 1
          }
        ],
        "product": {
          "id": 12,
          "name": "Dragon Roll",
          "selling_price": 350.00
        }
      }
    ],
    "total_amount": 740.00
  }
}
```
*Calculation:* `(350 + 20) * 2 = 740.00`

---

### `POST /api/v1/cart/add`
Add an item to cart with optional add-on modifiers.

#### Request Payload
```json
{
  "product_id": 12,
  "quantity": 1,
  "branch_id": 1,
  "selected_addons": [
    {
      "addon_id": 1,
      "name": "Extra Sauce",
      "price": 20.00,
      "quantity": 1
    },
    {
      "addon_id": 3,
      "name": "Extra Toppings",
      "price": 30.00,
      "quantity": 1
    }
  ]
}
```

---

## 4. CHECKOUT & ORDER SUBMISSION

### `POST /api/v1/orders`
Submit an order. The backend enforces **strict server-authoritative pricing** and validates idempotency to prevent duplicate orders.

#### Headers
```http
X-Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
```

#### Request Payload
```json
{
  "branch_id": 1,
  "fulfillment_type": "delivery",
  "customer_name": "Juan Dela Cruz",
  "contact_number": "09171234567",
  "mobile_number": "09171234567",
  "address": "Poblacion IV, Victoria, Laguna",
  "latitude": 14.2305,
  "longitude": 121.3210,
  "payment_method": "cod",
  "landmark": "Near Town Plaza",
  "notes": "Please deliver with chopsticks",
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
  "total_amount": 790.00,
  "delivery_fee": 50.00,
  "distance_km": 1.2
}
```

#### Response (`201 Created`)
```json
{
  "success": true,
  "message": "Order created successfully",
  "order_id": 482,
  "order_number": "ORD-482",
  "total_amount": 790.00,
  "delivery_fee": 50.00,
  "status": "pending",
  "estimated_delivery_time": "30-45 mins"
}
```

---

## 5. REAL-TIME DELIVERY TRACKING & WEBSOCKETS

### Reverb / Pusher WebSocket Configuration
```ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const echo = new Echo({
  broadcaster: 'reverb',
  key: '<REVERB_APP_KEY>',
  wsHost: '<REVERB_HOST>',
  wsPort: 8080,
  wssPort: 443,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
});
```

### Channels & Events to Listen To:

#### 1. Customer Order Status Channel: `private-order.{orderId}`
- **Event:** `.OrderStatusUpdated`
- **Payload:**
  ```json
  {
    "order_id": 482,
    "status": "preparing",
    "updated_at": "2026-09-03T11:20:00Z"
  }
  ```

#### 2. Rider Live GPS & Delivery Channel: `private-delivery.{deliveryId}`
- **Event:** `.DeliveryStatusUpdated`
  ```json
  {
    "delivery_id": 88,
    "status": "out_for_delivery",
    "updated_at": "2026-09-03T11:25:00Z"
  }
  ```
- **Event:** `.RiderLocationUpdated`
  ```json
  {
    "delivery_id": 88,
    "rider_id": 5,
    "latitude": 14.2312,
    "longitude": 121.3225,
    "heading": 145.0,
    "speed": 22.5
  }
  ```

---

## 6. PRODUCT REVIEWS & AUTO-REPLY

### `POST /api/v1/reviews` (or `POST /api/v1/customer/reviews`)
Submit a rating and optional review for an ordered item.

#### Request Payload
```json
{
  "order_id": 482,
  "order_item_id": 105,
  "product_id": 12,
  "rating": 5,
  "comment": ""
}
```

#### Behavior & Response (`201 Created`)
- If `comment` is empty or omitted, backend **automatically attaches a thank-you response**:
  ```json
  {
    "success": true,
    "message": "Review submitted successfully",
    "data": {
      "id": 91,
      "rating": 5,
      "comment": null,
      "admin_response": "Thank you for your rating! We appreciate your feedback.",
      "admin_responded_at": "2026-09-03T11:26:00Z"
    }
  }
  ```
- If customer provides a written `comment`, the customer's comment is saved directly and will await manager review.

---

## 7. RECEIPT HEADERS COMPLIANCE RULE
All physical and digital customer receipts display only the specific branch name (e.g., `VICTORIA` or `STA. CRUZ`).
The brand prefix `MAKI DESU` is reserved for the logo; the branch heading line will never duplicate `MAKI DESU`.
