# Product Requirements Document (PRD)
# Packing List Web App

**Version:** 1.0
**Date:** 2026-03-31
**Author:** Bakudan Team
**Status:** Approved

---

## 1. Executive Summary

### 1.1 Product Overview
Packing List is a responsive web application designed to manage internal product transfers between three stores (B1, B2, B3). The app streamlines the order workflow from creation to completion, provides real-time notifications, and generates financial summaries for the Accountant to perform end-of-month reconciliation.

### 1.2 Business Problem
Currently, inter-store transfers are tracked manually (paper/spreadsheet), leading to:
- Missing or incorrect transfer records
- Delayed notifications when goods are shipped/received
- Difficulty reconciling payments between stores
- No centralized view for the Accountant
- No audit trail for dispute resolution

### 1.3 Success Metrics
- 100% of inter-store transfers tracked digitally
- Notification delivery within 30 seconds of status change
- Monthly reconciliation time reduced by 80%
- Zero data discrepancy between stores

---

## 2. User Roles & Personas

### 2.1 Store B1 (Role: b1)
- Creates orders to send items to B2 and B3
- Receives orders from B3
- Views own store's order history and statistics

### 2.2 Store B2 (Role: b2)
- Receives orders from B1 and B3
- Handles Four Season payment on behalf of B1 and B3
- Views own store's order history and statistics

### 2.3 Store B3 (Role: b3)
- Creates orders to send items to B1 and B2
- Receives orders from B1
- Views own store's order history and statistics

### 2.4 Accountant (Role: accountant)
- Views all completed orders
- Accesses monthly/yearly summaries by store pair
- Reconciles invoices from Four Season
- Exports reports (Excel/PDF)
- No order creation/modification capability

### 2.5 Admin (Role: admin)
- Full system access
- Manages users, stores, items, prices
- Views audit logs
- System configuration

---

## 3. Transfer Rules Matrix

| From \ To | B1 | B2 | B3 |
|-----------|----|----|-----|
| **B1**    | -  | YES | YES |
| **B2**    | NO | -   | NO  |
| **B3**    | YES| YES | -   |

**Key Rule:** B2 pays Four Season on behalf of B1 and B3. At month-end, the Accountant uses completed order data to calculate net amounts owed between stores.

---

## 4. Core Features

### 4.1 Authentication & Authorization
- Email/password login
- Role-based access control (RBAC)
- Session management
- Password reset capability

### 4.2 Store Management (Admin)
- CRUD operations for stores
- Store code (B1, B2, B3), name, address, phone
- Assign users to stores

### 4.3 Item Master (Admin)
- CRUD operations for items
- Item code, name, unit (kg, pcs, box, etc.), category
- Active/inactive status

### 4.4 Price Master (Admin)
- Centralized price management
- Effective date range (from/to)
- Price history tracking
- Auto-expire old prices when new one is set

### 4.5 Order Workflow
**States:** Draft → Submitted → Preparing → Shipped → Received → Completed

#### 4.5.1 Create Order (Sender)
- Select destination store (filtered by business rules)
- Add items with requested quantities
- Save as draft or submit immediately

#### 4.5.2 Submit Order (Sender)
- Submit draft order
- System sends notification to destination store

#### 4.5.3 Prepare Order (Sender)
- Enter actual shipped quantities (may differ from requested)
- Add notes per line item

#### 4.5.4 Ship Order (Sender)
- Confirm shipment
- System sends notification to receiver

#### 4.5.5 Receive Order (Receiver)
- View shipped items and quantities
- Enter actual received quantities
- Accept or adjust with notes
- System sends notification to sender if adjusted

#### 4.5.6 Complete Order (System/Receiver)
- Mark order as completed
- System snapshots current prices into order lines
- System sends notification to Accountant
- Order data becomes available in summaries

#### 4.5.7 Cancel Order
- Only from Draft or Submitted status
- Requires cancellation reason
- System sends notification to relevant parties

### 4.6 Notification Center
- In-app notifications (mandatory)
- Notification bell with unread count
- Mark as read (individual/all)
- Notification types:
  - Order submitted (to receiver)
  - Order shipped (to receiver)
  - Order received (to sender)
  - Order completed (to accountant)
  - Order adjusted (to sender)
  - Order cancelled (to relevant parties)

### 4.7 Accountant Summary
- Monthly summary by store pair:
  - B1 ↔ B2
  - B1 ↔ B3
  - B2 ↔ B3
- Shows total orders, total amount, net balance
- Only includes completed orders
- Drill-down to individual orders
- Export to Excel/PDF

### 4.8 Monthly/Yearly Statistics
- Order count by status
- Total transfer value
- Top items by quantity/value
- Trends over time
- Filter by store, date range

### 4.9 Invoice Reconciliation
- Upload Four Season invoices
- Match invoice lines against completed orders
- Highlight discrepancies
- Mark as reconciled

### 4.10 Export/Reports
- Excel export for order lists, summaries
- PDF export for individual orders, monthly reports
- Printable packing list format

### 4.11 Audit Log
- Track all create/update/delete operations
- User, timestamp, action, old/new values
- Searchable and filterable
- Admin access only

---

## 5. User Stories

### Store User (B1/B2/B3)
- US-01: As a store user, I can log in with my email and password
- US-02: As a store user, I can view my dashboard with pending actions
- US-03: As a sender, I can create a new transfer order to an allowed store
- US-04: As a sender, I can add/remove items and quantities to my order
- US-05: As a sender, I can save order as draft for later
- US-06: As a sender, I can submit an order, triggering notification to receiver
- US-07: As a sender, I can enter actual shipped quantities
- US-08: As a receiver, I receive notification when an order is submitted/shipped
- US-09: As a receiver, I can enter actual received quantities
- US-10: As a receiver, I can accept or adjust received quantities with notes
- US-11: As a store user, I can view my order history with filters
- US-12: As a store user, I can view notifications and mark them as read

### Accountant
- US-20: As an accountant, I can view all completed orders
- US-21: As an accountant, I receive notification when an order is completed
- US-22: As an accountant, I can view monthly summary by store pair
- US-23: As an accountant, I can export summary to Excel/PDF
- US-24: As an accountant, I can upload and reconcile Four Season invoices

### Admin
- US-30: As an admin, I can manage users (CRUD)
- US-31: As an admin, I can manage stores (CRUD)
- US-32: As an admin, I can manage items (CRUD)
- US-33: As an admin, I can manage prices with effective dates
- US-34: As an admin, I can view audit logs

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load < 2 seconds
- API response < 500ms
- Support 20+ concurrent users

### 6.2 Security
- Password hashing (bcrypt)
- CSRF protection
- SQL injection prevention (ORM)
- XSS protection
- Rate limiting on login

### 6.3 Responsiveness
- Desktop (1280px+)
- Tablet (768px-1279px)
- Mobile (320px-767px)
- Touch-friendly UI elements

### 6.4 Compatibility
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- iOS Safari, Chrome Mobile

---

## 7. Phases

### Phase 1: MVP
- Auth + Role management
- Store/Item/Price master
- Full order workflow
- In-app notifications
- Basic accountant summary
- Export Excel

### Phase 2: Enhancement
- Invoice reconciliation
- PDF export
- Monthly/yearly statistics charts
- Email notifications
- Browser push notifications
- Advanced audit log search

### Phase 3: Scale
- Multi-language support
- API for mobile app
- Dashboard analytics
- Barcode/QR scanning for items
