# MAKI DESU MOBILE APP — SECURITY, COD ELIGIBILITY & RIDER LIFECYCLE COMPATIBILITY PROMPT

> **Target Audience**: Mobile Application Developers & AI Assistants working on the MAKI DESU Flutter/React Native/Native iOS & Android mobile apps.  
> **Backend Ecosystem Version**: MAKI DESU Production API v1.2 (Forgiving COD Risk & Rider Governance Architecture).

---

## 1. Executive Summary & Problem Resolution

In previous backend revisions, two major false positives affected mobile users:
1. **Rider False Restriction**: When a rider toggled off-duty or logged out of the mobile app, the backend incorrectly mapped `is_active = false` to `account_status = 'inactive'`, which caused web dashboards to display the rider as "Restricted/Deactivated" and blocked subsequent mobile logins with `"This account is currently inactive."`
2. **Customer COD Permanent Restriction**: Customers with past delivery failures from months ago were permanently locked out of Cash on Delivery even after having zero active orders.

**The backend has now been fully updated with a decoupled, forgiving governance engine.**

---

## 2. Rider State Architecture (Decoupled Governance vs. Presence)

The backend now strictly enforces 4 distinct lifecycle dimensions for riders:

| Dimension | Field | Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| **Authentication** | Bearer Token | `Active Token` / `Revoked` | Governed by Sanctum token on login/logout. |
| **Account Governance** | `account_status` | `active`, `under_review`, `restricted`, `suspended`, `deactivated` | Administrative security status. Default is **`active`**. |
| **Operational Duty** | `is_active` | `true`, `false` | Rider on-duty toggle (online vs off-duty). |
| **Presence State** | `status` | `available`, `busy`, `offline` | Real-time dispatching state. |

### Key Rules for Mobile Riders:
- **Logging out** (`POST /api/v1/logout`) or toggling off-duty (`PATCH /api/v1/rider/status`) sets `status = 'offline'` and `is_active = false`, but **NEVER touches `account_status`** (it remains `'active'`).
- **Logging in** (`POST /api/v1/login`) will **ALWAYS succeed** for active riders, automatically transitioning them to `status = 'available'` and `is_active = true`.
- **Logout During Active Delivery**: If a rider logs out while having an active in-transit delivery, the order is **preserved in transit** and an operational audit alert is logged on the dispatch dashboard.

---

## 3. Customer COD Risk & Eligibility Architecture

The Cash on Delivery engine has transitioned to a **60-day rolling window with automatic expiration**:

| Risk Tier | Max COD Limit | Trigger Conditions (Rolling 60 Days) | Notes |
| :--- | :--- | :--- | :--- |
| **`LOW_RISK`** | **₱5,000.00** | 0 refusals, < 2 failed events | Full COD privileges. |
| **`MEDIUM_RISK`** | **₱1,500.00** | 1 refusal OR 2-3 customer attributable failures | Capped order value. |
| **`HIGH_RISK`** | **₱500.00** | 2 refusals OR 3-4 customer attributable failures | Micro-order limit or online payment required. |
| **`RESTRICTED`** | **₱0.00** | 3+ refusals OR 5+ failures within 60 days | Algorithmic restriction auto-expires after **7 days** (`cod_restriction_expires_at`). |

### Key Rules for Mobile Customer Checkout:
- **Active Orders Limit**: Customers with **2 or more active delivery orders** (`pending`, `confirmed`, `preparing`, `assigned_to_rider`, `in_transit`) cannot place a new COD order until existing orders arrive. Once delivered, COD is immediately restored.
- **Trust Recovery**: Every **2 consecutive successful delivered orders** actively reduces the customer's risk level by 1 tier.
- **Explainable Prompts**: When COD is ineligible, the API returns human-friendly `reason` and `restriction_expires_at` timestamps to display directly in the mobile checkout modal.

---

## 4. API Endpoints & Request/Response Contracts

### A. Rider Login
- **Endpoint**: `POST /api/v1/login`
- **Request Body**:
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

### B. Rider Status Toggle / Go Offline
- **Endpoint**: `PATCH /api/v1/rider/status`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
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
  "status": "offline",
  "rider": {
    "id": 5,
    "name": "Juan Dela Cruz",
    "branch_id": 1,
    "branch_name": "Maki Desu Santa Cruz",
    "is_active": false,
    "account_status": "active",
    "status": "offline",
    "is_out_for_delivery": false,
    "can_be_assigned": false,
    "active_deliveries": 0,
    "last_active_at": "2026-09-03T13:30:00+00:00"
  }
}
```

---

### C. Rider Logout
- **Endpoint**: `POST /api/v1/logout`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### D. Customer COD Eligibility Pre-Check
- **Endpoint**: `POST /api/v1/checkout/cod-eligibility`
- **Headers**: `Authorization: Bearer <TOKEN>`
- **Request Body**:
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
- **Response `200 OK` (Temporary Restriction)**:
```json
{
  "success": true,
  "data": {
    "eligible": false,
    "risk_level": "RESTRICTED",
    "max_cod_amount": 0.0,
    "reason": "Account has 3 recorded delivery refusals within the last 60 days. (Temporary restriction until Sep 10, 2026)",
    "restriction_source": "AUTOMATIC",
    "restriction_expires_at": "2026-09-10T13:30:00+00:00"
  }
}
```

---

## 5. Mobile App Implementation Checklist

- [ ] **Rider Auth Store**: Ensure the mobile app checks `account_status` (not `is_active` or `status`) to determine if a rider's account is suspended/deactivated.
- [ ] **Offline Banner**: Show "You are currently off-duty" when `is_active == false` or `status == 'offline'`, with a simple toggle button to "Go Online".
- [ ] **Checkout COD Option**:
  - When selecting COD in the customer app, call `/api/v1/checkout/cod-eligibility`.
  - If `eligible: false`, display the returned `reason` clearly under the disabled COD radio button and guide the customer to Online Payment (GCash / Maya / Card).
