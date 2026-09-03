# MAKI DESU MOBILE APP — RESTRICTION SYSTEM, CONSECUTIVE STREAKS & RIDER LIFECYCLE COMPATIBILITY PROMPT

> **Target Audience**: Mobile Application Developers & AI Assistants working on the MAKI DESU Flutter/React Native/Native iOS & Android mobile apps.  
> **Backend Ecosystem Version**: MAKI DESU Production API v1.3 (Consecutive Violation Streaks & Super Admin Override Engine).

---

## 1. Overview of Backend Upgrades

The MAKI DESU backend has been updated with a **forgiving, consecutive-only account restriction and governance engine**:

1. **Consecutive Cancellation Rule (Customer App)**:
   - Automatic restrictions **ONLY** trigger if a customer accumulates **10 consecutive qualifying cancellations**.
   - **Any successful delivered order immediately resets the cancellation streak to 0.**
   - Historical or non-consecutive cancellations across weeks/months do NOT lock out users.
2. **Consecutive Failure Rule (Rider App)**:
   - Automatic restrictions **ONLY** trigger if a rider accumulates **5 consecutive qualifying delivery failures**.
   - **Any successful delivery immediately resets the failure streak to 0.**
   - App logout, network drops, closing the app, or customer refusals **NEVER** count as rider delivery failures.
3. **Super Admin Instant Override**:
   - Super Admin can lift any active restriction at any time via the web management portal.
   - When a restriction is lifted, the user/rider account is restored to `active` and their violation streak is **reset to 0**.

---

## 2. Rider Mobile App Guidelines

### A. Lifecycle State Architecture (Decoupled Governance vs. Presence)

The backend strictly separates administrative governance from real-time presence:

| Dimension | Field | Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | Bearer Token | `Active Token` / `Revoked` | Governed by Sanctum token on login/logout. |
| **Account Governance** | `account_status` | `active`, `under_review`, `restricted`, `suspended`, `deactivated` | Administrative security status. Default is **`active`**. |
| **Operational Duty** | `is_active` | `true`, `false` | Rider on-duty toggle (online vs off-duty). |
| **Presence State** | `status` | `available`, `busy`, `offline` | Real-time dispatching state. |

### B. Mobile Rider Behavior & Best Practices:
- **Logging out** (`POST /api/v1/logout`) or toggling off-duty (`PATCH /api/v1/rider/status`) sets `status = 'offline'` and `is_active = false`, but **NEVER touches `account_status`** (it remains `'active'`).
- **Logging in** (`POST /api/v1/login`) will **ALWAYS succeed** for active riders, automatically transitioning them to `status = 'available'` and `is_active = true`.
- **Handling Restricted Riders**:
  - If a rider's `account_status` is `'restricted'`, the rider app should display a persistent banner:  
    > *"Your account has been temporarily restricted due to 5 consecutive delivery failures. Please contact your branch administrator to review and lift this restriction."*
  - Do NOT log the rider out forcefully; allow them to view past completed delivery logs and contact support.

---

## 3. Customer Mobile App Guidelines

### A. Consecutive Cancellation Handling
- When a customer attempts to cancel an order (`POST /api/v1/orders/{id}/cancel`), the backend safely checks order status.
- If a customer account is restricted (`account_status === 'restricted'` or `is_order_restricted === true`), attempting to checkout will return:
  ```json
  {
    "success": false,
    "message": "Your account is temporarily restricted from placing new orders due to repeated order cancellations. Please contact customer support."
  }
  ```
- **Mobile Action**: Display this message in an informative alert modal with a "Contact Support" button.

### B. Cash on Delivery (COD) Dynamic Eligibility
- Call `POST /api/v1/checkout/cod-eligibility` before presenting COD as a payment option.
- If `eligible: false`, render the returned `reason` beneath the disabled COD radio option and highlight Online Payment methods (GCash / Maya / Card).

---

## 4. API Endpoints & Contracts

### A. Rider Login
- **Endpoint**: `POST /api/v1/login`
- **Request**:
```json
{
  "email": "rider@makidesu.com",
  "password": "password123"
}
```
- **Response `200 OK`**:
```json
{
  "status": "success",
  "message": "Login successful.",
  "token": "123|abcdef123456...",
  "role": "rider",
  "user": {
    "id": 5,
    "name": "Juan Dela Cruz",
    "email": "rider@makidesu.com",
    "phone": "09171234567",
    "account_status": "active",
    "status": "available",
    "is_active": true
  }
}
```

---

### B. Rider Status Toggle
- **Endpoint**: `PATCH /api/v1/rider/status`
- **Request**:
```json
{
  "status": "offline",
  "is_active": false
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Rider status updated successfully.",
  "is_active": false,
  "account_status": "active",
  "status": "offline"
}
```

---

### C. Customer COD Eligibility Check
- **Endpoint**: `POST /api/v1/checkout/cod-eligibility`
- **Request**:
```json
{
  "order_amount": 1200.00,
  "phone": "09171234567"
}
```
- **Response `200 OK` (Eligible)**:
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "risk_level": "LOW_RISK",
    "max_cod_amount": 5000.0,
    "reason": "Cash on Delivery is available."
  }
}
```
- **Response `200 OK` (Temporarily Restricted)**:
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "risk_level": "RESTRICTED",
    "max_cod_amount": 0.0,
    "reason": "Account is temporarily restricted. Please select an online payment method.",
    "restriction_source": "AUTOMATIC",
    "restriction_expires_at": "2026-09-10T13:30:00+00:00"
  }
}
```

---

## 5. Mobile App Implementation Checklist

- [ ] **Rider Presence vs. Suspension**: Ensure the mobile app only blocks access if `account_status === 'suspended'` or `account_status === 'deactivated'`. An `is_active === false` or `status === 'offline'` state is simply the rider being off-duty.
- [ ] **Order Restriction Alert**: In Customer Checkout, handle 422/403 order restriction errors by showing a clean dialog with the backend reason and a quick link to Customer Support.
- [ ] **COD Disabled Tooltip**: In Customer Payment Selection, if COD is ineligible, show the backend `reason` in small italicized text under the disabled COD button and default selection to GCash/Card.
