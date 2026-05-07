# Project Review — Packing List v2 (React + Express)

> **Reviewer:** Claude Code  
> **Review date:** 2026-04-16  
> **Branch:** `claude/project-review-TTFN9`  
> **Scope:** v2-react (client + server). v1-laravel used as reference for intended behaviour.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Assessment](#2-architecture-assessment)
3. [Bugs & Defects](#3-bugs--defects)
4. [Security Issues](#4-security-issues)
5. [RBAC / Business-Logic Gaps](#5-rbac--business-logic-gaps)
6. [Performance Issues](#6-performance-issues)
7. [Code Quality](#7-code-quality)
8. [Missing Features (v1 vs v2 delta)](#8-missing-features-v1-vs-v2-delta)
9. [Positive Observations](#9-positive-observations)
10. [Recommended Fix Priority](#10-recommended-fix-priority)

---

## 1. Executive Summary

v2-react is a solid first iteration. The separation of concerns (Routes → Controllers → Services → Models), the transaction handling in `orderService`, and the audit middleware are all good foundations. However, there are several issues that need to be addressed before the system is reliable enough for production:

| Severity | Count | Examples |
|----------|-------|---------|
| **Critical** | 3 | Audit logs expose plaintext passwords; no RBAC on state transitions; race condition in order-number generation |
| **High** | 4 | Status-model mismatch; `disputed` workflow missing; item CRUD RBAC wrong; no input validation on orders |
| **Medium** | 4 | Dashboard N+1 queries; `sequelize.sync()` in production; no rate limiting; missing quantity fields |
| **Low** | 3 | Missing price-edit route; no `cancelled_by` field; no tests |

---

## 2. Architecture Assessment

### What's good

```
Routes → authenticate → (authorize) → auditLog → Controller → Service → Model
```

The layering is consistent. Business logic sits in services (`orderService`, `notificationService`, `summaryService`, `exportService`) and controllers are thin. This makes unit-testing each layer straightforward.

### What needs attention

- `sequelize.sync()` runs on every server start (see §7.1). In production, any schema drift silently alters or creates tables.
- The `--migrate` flag runs `sequelize.sync({ alter: true })` then exits, but this is not a proper migration system. A tool like `umzug` or `sequelize-cli` migrations would give versioned, reversible schema changes.
- No test directory exists for v2-react. The `tests/simulation.js` at the repo root is a load simulation, not a unit/integration test suite.

---

## 3. Bugs & Defects

### 3.1 Race Condition — Order Number Generation (Critical)

**File:** `v2-react/server/src/services/orderService.js:7-23`

```js
// Two concurrent requests on the same day will both read the same
// lastOrder and both generate the same order_number
const lastOrder = await Order.findOne({
  where: { order_number: { [Op.like]: `${prefix}%` } },
  order: [['order_number', 'DESC']],
});
```

The unique constraint on `orders.order_number` will catch a collision and throw an unhandled DB error (not a clean 400). Under the 500-user load test defined in `tests/simulation.js` this will fail regularly.

**Fix:** Wrap the generate-and-insert in a serializable transaction, or use a database sequence / auto-increment counter table per date.

---

### 3.2 Status Enum Mismatch — v2 vs v1 / SRS (High)

**Files:** `v2-react/server/src/models/Order.js:24`, `v2-react/server/src/config/app.js:8-16`

The SRS and README define 9 statuses:

```
draft, submitted, processing, ready_to_ship, in_transit,
received_pending_confirmation, completed, cancelled, disputed
```

v2 implements only 7:

```
draft, submitted, preparing, shipped, received, completed, cancelled
```

Three statuses are missing or renamed without documentation:
- `processing` → renamed `preparing` (acceptable, but undocumented)
- `ready_to_ship` / `in_transit` → collapsed into `shipped` (loses a tracking step)
- `received_pending_confirmation` → renamed `received` (acceptable)
- `disputed` → **entirely absent**

The missing `disputed` status means receivers have no way to flag a discrepancy, which is a documented business requirement (PRD §4.6).

---

### 3.3 OrderLine Missing `shipped_qty` Field (Medium)

**File:** `v2-react/server/src/models/OrderLine.js`

The model has `quantity` (requested) and `received_quantity`, but the SRS specifies three quantity fields:

| SRS field | Model field | Status |
|-----------|-------------|--------|
| `requested_qty` | `quantity` | Present (renamed) |
| `shipped_qty` | — | **Missing** |
| `received_qty` | `received_quantity` | Present (renamed) |

Without `shipped_qty`, the system cannot detect partial shipments and the receiving store cannot compare what was shipped vs. what arrived.

---

### 3.4 `receive` Controller Uses Wrong Field Name (High)

**File:** `v2-react/server/src/controllers/orderController.js:179`

```js
await OrderLine.update(
  { received_quantity: lineData.received_quantity },   // model field
  { where: { id: lineData.id } }
);
```

The model defines `received_quantity` (line 33 of `OrderLine.js`) so this is consistent today. However, the SRS calls it `received_qty` and the `snapshotPrices` service reads neither field — it reads only `quantity` for its calculation (`parseFloat(line.quantity)`), so received quantities have no effect on `line_total`. Price snapshots are therefore always computed on the original requested quantity, not what was actually received.

**Fix in `orderService.js:148`:**

```js
// Current (wrong):
const totalPrice = unitPrice * parseFloat(line.quantity);

// Correct — use received quantity, fall back to requested:
const qty = parseFloat(line.received_quantity ?? line.quantity);
const totalPrice = unitPrice * qty;
```

---

## 4. Security Issues

### 4.1 Audit Logs Record Plaintext Passwords (Critical)

**File:** `v2-react/server/src/middleware/audit.js:18`

```js
new_values: req.body || null,
```

`req.body` for `POST /api/users` and `PUT /api/users/:id` includes the raw `password` field before hashing. This writes the plaintext password to the `audit_logs` table, defeating bcrypt entirely.

**Fix:** Strip sensitive fields before logging.

```js
const sanitize = (body) => {
  const { password, token, ...safe } = body || {};
  return safe;
};

new_values: sanitize(req.body),
```

---

### 4.2 No Role Authorization on Order State Transitions (Critical)

**File:** `v2-react/server/src/routes/orders.js`

```js
router.use(authenticate);    // ← only authentication, no authorization

router.post('/:id/prepare', auditLog('prepare', 'order'), orderController.prepare);
router.post('/:id/ship',    auditLog('ship',    'order'), orderController.ship);
router.post('/:id/receive', auditLog('receive', 'order'), orderController.receive);
router.post('/:id/complete', auditLog('complete','order'), orderController.complete);
```

Any authenticated user (including B2, which cannot send shipments) can call any transition. Per the PRD:

| Transition | Allowed roles |
|-----------|--------------|
| submit | creator (b1/b3/admin) |
| prepare → ship | from-store users |
| receive → complete | to-store users |
| cancel | creator or admin |

The `authorize` middleware exists (`v2-react/server/src/middleware/role.js`) but is not applied to these routes. The `orderController` also has no store-ownership check inside transition handlers.

---

### 4.3 No Rate Limiting (Medium)

Login (`POST /api/auth/login`) has no rate limiting. A brute-force attack against any account is trivially possible. Express plugins like `express-rate-limit` are already a dependency candidate given the README mentions "Rate limiting ready (infrastructure)."

---

## 5. RBAC / Business-Logic Gaps

### 5.1 Item CRUD — Wrong Roles on Client Routes (High)

**File:** `v2-react/client/src/App.jsx:68-69`

```jsx
<Route path="items/new"      element={<ProtectedRoute roles={['admin', 'b1', 'b2', 'b3']}> ...
<Route path="items/:id/edit" element={<ProtectedRoute roles={['admin', 'b1', 'b2', 'b3']}> ...
```

The README and PRD clearly state item management (CRUD) is **admin-only**. B1/B2/B3 store users should only view items when creating orders.

The server-side item routes should be checked for the same issue.

---

### 5.2 Disputed Status — No Workflow in v2 (High)

Per the PRD, a receiver can `dispute` an order if quantities or items don't match. The `disputed` status exists in v1-laravel but is completely absent from v2 (no status enum value, no transition, no controller action, no UI).

---

### 5.3 B2 Cannot Create Orders — Partially Enforced (Medium)

The client correctly guards `/orders/new` with `roles={['admin', 'b1', 'b3']}`. However, the server's `POST /api/orders` has no role check — a B2 user with a direct API call can create an order. The `validateTransfer` in `orderService` would catch `B2 → anything` because B2 has no allowed destinations in `TRANSFER_RULES`, but the error message would be confusing ("Transfer from B2 to X is not allowed") rather than a proper 403.

---

### 5.4 Price Edit Route Missing (Low)

**File:** `v2-react/client/src/App.jsx:72-74`

There is no `/prices/:id/edit` route. The `PriceFormPage` exists and presumably supports edit mode, but there is no way to navigate to it. Whether prices should be editable or only created+expired is a business decision that should be documented explicitly. Currently the UI only allows creating new price records.

---

## 6. Performance Issues

### 6.1 Dashboard — N+1 Status Count Queries (Medium)

**File:** `v2-react/server/src/controllers/dashboardController.js:64-68`

```js
for (const status of Object.values(ORDER_STATUSES)) {
  statusCounts[status] = await Order.count({ where: { ...storeFilter, status } });
}
```

This fires 7 sequential `SELECT COUNT(*)` queries. Replace with a single GROUP BY:

```js
const counts = await Order.findAll({
  where: storeFilter,
  attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
  group: ['status'],
  raw: true,
});
const statusCounts = Object.fromEntries(counts.map(r => [r.status, parseInt(r.count)]));
```

---

### 6.2 Notification Fan-out — No Bulk Protection (Medium)

**File:** `v2-react/server/src/services/notificationService.js:15-34`

`notifyStoreUsers` correctly uses `Notification.bulkCreate`. However, `notifyOrderStatusChange` calls it three times (from-store, to-store, admins/accountants) inside the same request cycle, all awaited sequentially. If notification volume grows this will delay every order transition. Consider offloading to a background job or message queue.

---

## 7. Code Quality

### 7.1 `sequelize.sync()` on Every Boot (Medium)

**File:** `v2-react/server/src/index.js:55`

```js
await sequelize.sync();   // silently creates missing tables in production
```

`sync()` without `force` or `alter` will not update existing tables but it will create new ones if they're missing. This is unpredictable behaviour in a production environment. Use migration files instead.

---

### 7.2 No Input Validation on Order Routes (High)

**File:** `v2-react/server/src/routes/orders.js`

The `validate` middleware (`v2-react/server/src/middleware/validate.js`) exists but is not applied to any order routes. `POST /api/orders` accepts arbitrary `lines` array without validating that:
- `item_id` values are positive integers
- `quantity` values are positive numbers
- `from_store_id !== to_store_id`
- The lines array is non-empty

The service throws descriptive errors for some of these, but unvalidated input reaching the service layer is risky (especially `quantity: 0` or negative values).

---

### 7.3 Missing `cancelled_by` Field (Low)

The `Order` model has `cancel_reason` (text) but no `cancelled_by` (FK to users). Combined with the audit log, you can reconstruct who cancelled an order, but this makes direct querying and reporting harder.

---

### 7.4 Error Responses Are Inconsistent (Low)

Controllers mix `res.status(400).json({ error: '...' })` and `res.status(500).json({ error: '...' })` without a shared error handler pattern. Downstream client code must handle two different shapes. A centralized error class and a single global error-handling middleware would standardize this.

---

## 8. Missing Features (v1 vs v2 Delta)

The following v1-laravel modules have **no equivalent** in v2:

| Module | Description | Priority |
|--------|-------------|----------|
| `disputed` order status | Receiver can flag discrepancies | **High** |
| PDF export per order | Individual order PDF | Medium |
| Cost Engine | Recipe + raw-material cost calculations | Low (advanced) |
| Raw Materials | Raw material + price tables | Low (advanced) |
| Invoice Scan (OCR) | Auto-map scanned invoices to items | Low (advanced) |
| Vendor Management | Vendor CRUD | Low (advanced) |
| Email notifications | Email on status change | Medium |
| Browser push notifications | Real-time push | Low |

The first two (`disputed` status and per-order PDF) are listed in the v2 PRD as requirements; the others are v1-only extensions.

---

## 9. Positive Observations

These are done well and should be preserved as patterns.

| Area | Detail |
|------|--------|
| **Transaction handling** | `orderService.createOrder` and `updateOrderLines` both use Sequelize transactions with proper rollback |
| **Price snapshot** | `snapshotPrices` correctly captures unit price at completion time, not creation time |
| **Transfer rule enforcement** | `isValidTransfer` in `config/app.js` is clean and easy to update |
| **Status machine** | `STATUS_TRANSITIONS` map in `config/app.js` makes legal transitions declarative |
| **Audit middleware** | Wrapping `res.json` to intercept successful responses is clever and keeps controllers clean |
| **Notification bulk insert** | `bulkCreate` in `notificationService` avoids N individual inserts |
| **JWT error handling** | Auth middleware distinguishes `TokenExpiredError` vs `JsonWebTokenError` and returns different messages |
| **CORS** | Properly locked to specific origins per environment |
| **Role-based list filtering** | `orderController.list` correctly scopes orders to the requesting user's store |
| **Health check** | `GET /health` endpoint makes container readiness probes trivial |

---

## 10. Recommended Fix Priority

### Immediate (before any user testing)

1. **Strip passwords from audit logs** — `middleware/audit.js` sanitize `req.body` before persisting.
2. **Add RBAC to state-transition routes** — apply `authorize` middleware in `routes/orders.js` and add store-ownership checks in the controller.
3. **Fix price-snapshot quantity** — `orderService.snapshotPrices` must use `received_quantity`, not `quantity`.

### Before production

4. **Fix item CRUD roles** — remove `b1`, `b2`, `b3` from item create/edit routes.
5. **Add input validation to order routes** — apply `validate` middleware for `POST /api/orders`.
6. **Fix order-number race condition** — use an atomic DB-level counter or a serializable transaction.
7. **Implement `disputed` status** — add enum value, transition, controller action, and UI.
8. **Add rate limiting to `/api/auth/login`**.

### Near term

9. **Replace `sequelize.sync()` with migrations** — use `sequelize-cli` or `umzug`.
10. **Fix dashboard N+1 queries** — single GROUP BY query.
11. **Add `shipped_quantity` to `OrderLine`** — enable partial shipment tracking.
12. **Add `cancelled_by` FK to `Order`**.
13. **Standardize error responses** — shared error class + single error middleware.

### Eventually

14. Add a test suite (at minimum: `orderService` unit tests, auth middleware tests).
15. PDF export per individual order.
16. Rate-limit notification fan-out (background queue).
