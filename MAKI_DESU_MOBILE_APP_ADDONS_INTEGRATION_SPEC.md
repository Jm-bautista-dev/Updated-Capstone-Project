# Maki Desu Mobile App Integration: Global Add-on Catalog & Product-Specific Modifiers

This specification provides the architecture, data contracts, validation rules, and a **complete copy-paste AI prompt for the Mobile App Repository (Flutter / React Native)**.

---

## 📋 Part 1: Copy-Paste Prompt for the Mobile App AI Assistant

Copy and paste the entire markdown block below directly into your Mobile App's AI assistant:

```markdown
# 🍱 Maki Desu Mobile App: Global Add-on Catalog & Product Modifiers Integration

Please update the mobile application's menu, product detail modal, cart management, and order submission pipeline to support the **Global Add-on Catalog Architecture** implemented in the Laravel backend.

---

### 1. Data Contracts (Backend API)

#### A. Product Menu & Detail Responses
Endpoints:
- `GET /api/v1/products`
- `GET /api/v1/products/{id}`
- `GET /api/v1/customer/menu`
- `GET /api/v1/customer/products`

Each product object now contains its assigned add-ons and structured groups:
```json
{
  "id": 12,
  "name": "Chicken Teriyaki Bento",
  "price": 150.00,
  "selling_price": 150.00,
  "category": "Bento Boxes",
  "image": "https://domain.com/storage/products/teriyaki.png",
  "stock": 45,
  "is_available": true,
  "addons": [
    {
      "id": 1,
      "name": "Extra Rice",
      "price": 20.00,
      "is_active": true
    },
    {
      "id": 2,
      "name": "Extra Teriyaki Sauce",
      "price": 15.00,
      "is_active": true
    }
  ],
  "addon_groups": [
    {
      "id": 1,
      "name": "Choose Spice Level",
      "selection_type": "single",
      "is_required": true,
      "min_selections": 1,
      "max_selections": 1,
      "items": [
        { "id": 10, "name": "Mild", "price": 0.00 },
        { "id": 11, "name": "Spicy", "price": 10.00 }
      ]
    }
  ]
}
```

> **Key Rule**: If a product has NO assigned add-ons, the backend returns `"addons": []` and `"addon_groups": []`. **Never fall back to displaying the entire global catalog.** Only show modifiers explicitly present in the product's response.

---

### 2. Mobile UI / UX Requirements

#### A. Food Detail / Modifier Modal
1. **Trigger Condition**:
   - If `product.addons.length > 0` OR `product.addon_groups.length > 0`, tapping the product must open the **Food Detail / Modifier Bottom Sheet** rather than adding directly to cart.
2. **Group Rendering**:
   - For `selection_type == 'single'`: Render radio button options. Automatically select the first option or default if `is_required: true`.
   - For `selection_type == 'multi'`: Render checkbox options with optional quantity counter if `max_selections > 1`.
   - For direct `addons`: Render as a "Custom Add-ons" section with checkboxes and `+₱XX.XX` price tags.
3. **Live Total Calculation**:
   - Item Unit Price = `Base Product Price + Sum of Selected Addon Unit Prices`.
   - Total = `Item Unit Price * Selected Product Quantity`.
4. **Validation Guard**:
   - Disable the "Add to Cart" button and display helper text if any required group is unsatisfied (`is_required: true` with 0 selections) or if selected items exceed `max_selections`.

---

### 3. Cart State Management

1. **Unique Cart Line Keying (Composite Key)**:
   - Generate a composite cart key so that ordering the same product with different add-on combinations creates separate cart lines:
     ```typescript
     const cartItemKey = `${product.id}_${selectedAddons
       .map(a => `${a.id}:${a.quantity || 1}`)
       .sort()
       .join('_')}`;
     ```
2. **Cart Display**:
   - Display the base product name with indented sub-items listing each selected modifier:
     - `Chicken Teriyaki Bento (₱150.00) x 2`
       - `+ Extra Rice (₱20.00)`
       - `+ Extra Teriyaki Sauce (₱15.00)`
     - Line Subtotal: `(150 + 20 + 15) * 2 = ₱370.00`

---

### 4. Order Submission Payload (`POST /api/v1/customer/orders` or `POST /api/v1/orders`)

Send the order with `selected_addons` inside each item in the `items` array:

```json
{
  "branch_id": 1,
  "fulfillment_type": "delivery",
  "customer_name": "Juan Dela Cruz",
  "mobile_number": "09123456789",
  "address": "Unit 4B, Sakura Residence, Taguig",
  "latitude": 14.5547,
  "longitude": 121.0244,
  "payment_method": "cash",
  "total_amount": 370.00,
  "items": [
    {
      "product_id": 12,
      "quantity": 2,
      "price": 150.00,
      "selected_addons": [
        {
          "addon_id": 1,
          "name": "Extra Rice",
          "price": 20.00,
          "quantity": 1
        },
        {
          "addon_id": 2,
          "name": "Extra Teriyaki Sauce",
          "price": 15.00,
          "quantity": 1
        }
      ]
    }
  ]
}
```

> **Backend Authoritative Rule**: The backend validates each `addon_id` against the database catalog for availability on `product_id`. The backend calculates prices authoritatively, ignoring any client price modifications, and stores an immutable snapshot in the order record.

---

### 5. Historical Order Details & Buy Again

When fetching order history (`GET /api/v1/customer/orders/{id}`), `order_items` include `selected_addons`:
- Render the exact historical add-on snapshot and historical prices stored during checkout.
- On **"Buy Again" / Reorder**:
  - Pre-populate the cart with the product and its previously selected `addon_id`s after verifying active availability via `POST /api/v1/customer/orders/{id}/reorder-check`.
```

---

## 🛠️ Part 2: Backend Architecture Summary

| Component | Implementation Detail |
| :--- | :--- |
| **Catalog Storage** | `add_ons` table (reusable global modifiers with `name`, `price`, `cost_price`, `stock_linked`, `ingredient_id`, `is_active`). |
| **Product Assignment** | `product_addons` pivot table (`product_id`, `addon_id`, `max_quantity`, `is_required`, `sort_order`, `is_active`) and `product_addon_groups`. |
| **Backend Resolution** | `$product->getEffectiveAddons()` dynamically merges direct active add-ons + active modifier group items. Returns `[]` if none assigned. |
| **Authoritative Pricing** | `ApiOrderController::resolveItemsAndTotal()` & `SaleService::processSale()` look up `AddOn::find($addon_id)` in the database and recalculate totals authoritatively. |
| **Security & Snapshots** | Unassigned add-ons are rejected with `422 Unprocessable Entity`. Exact name, unit price, and cost price are saved into `order_items.selected_addons` JSON column. |
| **Web Admin Management** | Products Index (`/products`) includes Available Add-ons multi-select chips; Admin Addons (`/admin/addons`) includes Direct Product Assignments selector and badge counters. |
