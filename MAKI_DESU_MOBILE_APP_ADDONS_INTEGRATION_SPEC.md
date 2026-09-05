# Maki Desu Mobile App Integration: Add-ons / Modifiers & Account Deletion Specification

This document provides both the **Developer Integration Guide** and a **Copy-Paste AI Prompt for the Flutter / React Native Mobile Repository**.

---

## Part 1: Ready-to-Use Prompt for the Mobile App Repository

Copy and paste the prompt below into your mobile app AI assistant:

```markdown
### 🍣 Maki Desu Mobile App: Add-ons / Modifiers & Secure Account Deletion Implementation

Please implement Add-ons (Modifiers) support and the Secure Account Deletion with Email OTP workflow in the mobile app, fully compatible with the Laravel backend.

---

### Feature 1: Product Add-ons (Modifiers) Support

#### 1. API Menu / Catalog Data Contract
When fetching menu/products from `GET /api/v1/products` or `GET /api/v1/categories`, each product item may contain an `addon_groups` array:

```json
{
  "id": 12,
  "name": "California Maki Roll",
  "selling_price": 120.00,
  "addon_groups": [
    {
      "id": 1,
      "name": "Select Spice Level",
      "selection_type": "single",
      "is_required": true,
      "min_selections": 1,
      "max_selections": 1,
      "items": [
        { "id": 101, "name": "Mild Spicy", "price": 0.00 },
        { "id": 102, "name": "Extra Spicy", "price": 10.00 }
      ]
    },
    {
      "id": 2,
      "name": "Extra Toppings & Sauces",
      "selection_type": "multi",
      "is_required": false,
      "min_selections": 0,
      "max_selections": 3,
      "items": [
        { "id": 103, "name": "Extra Japanese Mayo", "price": 15.00 },
        { "id": 104, "name": "Ebiko / Fish Roe", "price": 25.00 },
        { "id": 105, "name": "Cream Cheese Swirl", "price": 20.00 }
      ]
    }
  ]
}
```

#### 2. Mobile UI & Cart Requirements:
1. **Modifier Bottom Sheet / Modal**:
   - When tapping a product that has `addon_groups.length > 0`, open a customizable Modifier Bottom Sheet instead of directly adding to cart.
   - For `selection_type == 'single'`: Render Radio buttons (only 1 selection allowed).
   - For `selection_type == 'multi'`: Render Checkboxes with optional quantity steppers if allowed by `max_selections`.
   - Live Validation: Disable the "Add to Cart" button if any `is_required: true` group has 0 selections, or if selections violate `min_selections` / `max_selections`.
   - Calculate live line total: `(Base Price + Sum(Addon Prices)) * Product Quantity`.

2. **Cart Display**:
   - Distinct cart line item keying (composite key `productId + selectedAddonsHash` so the same item with different toppings is added as separate cart lines).
   - Display selected modifiers as indented sub-lines under the product title, displaying their individual addon price (e.g., `+ Extra Mayo (₱15.00)`).

3. **Order Submission Payload (`POST /api/v1/orders`)**:
Send the selected modifiers in `selected_addons` for each order item:

```json
{
  "branch_id": 1,
  "fulfillment_type": "delivery",
  "payment_method": "cash_on_delivery",
  "customer_name": "Maria Santos",
  "contact_number": "09171234567",
  "address": "123 Cherry Blossom St, Taguig",
  "items": [
    {
      "product_id": 12,
      "quantity": 2,
      "price": 120.00,
      "selected_addons": [
        {
          "id": 102,
          "name": "Extra Spicy",
          "price": 10.00,
          "quantity": 1,
          "group_id": 1,
          "group_name": "Select Spice Level"
        },
        {
          "id": 103,
          "name": "Extra Japanese Mayo",
          "price": 15.00,
          "quantity": 1,
          "group_id": 2,
          "group_name": "Extra Toppings & Sauces"
        }
      ]
    }
  ]
}
```

---

### Feature 2: Secure Account Deletion with Email OTP

#### 1. Request OTP Code (`POST /api/v1/user/delete-otp`)
- Headers: `Authorization: Bearer <TOKEN>`
- Checks if the user has ongoing active orders (`pending`, `accepted`, `preparing`, `ready_for_pickup`, `out_for_delivery`, `in_transit`, `picked_up`, `customer_arrived`, `cancellation_requested`).
- **If active orders exist**: Returns HTTP 422:
  ```json
  {
    "status": "error",
    "success": false,
    "message": "You cannot delete your account while you have active orders. Please wait until your orders are completed or cancelled."
  }
  ```
  Display an alert dialog informing the user they must wait until active orders finish.
- **If no active orders**: Returns HTTP 200:
  ```json
  {
    "status": "success",
    "success": true,
    "message": "A 6-digit verification code has been sent to your email address."
  }
  ```
  Open an OTP Verification dialog/screen.

#### 2. Confirm Deletion (`DELETE /api/v1/user`)
- Headers: `Authorization: Bearer <TOKEN>`
- Request Body:
  ```json
  {
    "otp": "123456"
  }
  ```
- **If OTP is invalid/expired**: Returns HTTP 422:
  ```json
  {
    "status": "error",
    "success": false,
    "message": "Invalid or expired verification code. Please request a new code."
  }
  ```
- **If successful**: Returns HTTP 200:
  ```json
  {
    "status": "success",
    "success": true,
    "message": "Your account has been permanently deleted."
  }
  ```
  Clear secure storage / auth tokens, reset app state, and navigate user back to the Onboarding / Login screen.
```

---

## Part 2: Backend Architecture & Implementation Summary

| Component | Implementation Detail |
| :--- | :--- |
| **Data Models** | `add_ons`, `addon_groups`, `addon_group_items`, `product_addon_groups` |
| **POS UI** | Modern Modifier Selection Modal with radio/checkbox constraints and cart sub-lines |
| **Inventory Link** | Automatically validates and deducts `IngredientStock` for `stock_linked: true` modifiers |
| **Historical Snapshots** | `SaleItem::selected_addons` & `OrderItem::selected_addons` permanently snapshot modifier names & pricing at transaction time |
| **Admin Panel** | CRUD for add-ons, groups, and product links at `/admin/addons` |
| **Reports Telemetry** | "Top Add-on Modifiers & Customizations" analytics card in executive dashboard |
| **Account Deletion** | Dual protection via active orders verification + 6-digit email OTP workflow |
| **Automated Tests** | 511 passing tests across the test suite |
