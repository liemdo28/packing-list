# Packing List -- Complete Guide

**Version:** 1.0
**Last Updated:** April 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [User Roles and Permissions](#3-user-roles-and-permissions)
4. [Transfer Rules](#4-transfer-rules)
5. [Complete Order Workflow](#5-complete-order-workflow)
6. [Module Guide](#6-module-guide)
7. [Installation Guide](#7-installation-guide)
8. [Test Accounts](#8-test-accounts)
9. [Business Rules Reference](#9-business-rules-reference)
10. [Database Schema](#10-database-schema)
11. [API Reference (V2 Only)](#11-api-reference-v2-only)
12. [Troubleshooting and FAQ](#12-troubleshooting-and-faq)

---

## 1. Introduction

### What is Packing List?

Packing List is an internal web application designed to manage stock transfers between
three retail stores: **B1**, **B2**, and **B3**. It replaces manual spreadsheet-based
tracking with a structured digital workflow that covers order creation, shipment,
receiving, and financial reconciliation.

### Who Is This For?

| Audience          | How They Use the App                                         |
|-------------------|--------------------------------------------------------------|
| Store Managers    | Create and fulfill transfer orders between stores            |
| Accountant        | Review completed orders, reconcile invoices, export reports  |
| Admin             | Manage users, stores, items, prices, and review audit logs   |

### Key Value Proposition

- **Eliminate spreadsheets.** Every transfer is tracked with a formal order lifecycle.
- **Real-time visibility.** Each participant sees order status as it changes.
- **Accurate pricing.** Prices are locked at order completion, ensuring consistent records.
- **Audit trail.** Every change is logged with user, timestamp, and before/after values.
- **Automated summaries.** Monthly and yearly summaries are generated from completed orders.
- **Invoice reconciliation.** Match supplier invoices against completed order data.

---

## 2. System Overview

### Architecture

The Packing List application is available in two independent versions. Both share the
same database schema, business logic, and user interface design. Choose the version that
best fits your team's technology stack.

```
+-------------------------------------------------+
|              Packing List Application            |
+-------------------------------------------------+
|                                                  |
|   V1 - Laravel (Full-Stack)                      |
|   +-----------+    +----------+    +---------+   |
|   | Blade/JS  |--->| Laravel  |--->| MySQL   |   |
|   | Frontend  |    | Backend  |    | 8.0+    |   |
|   +-----------+    +----------+    +---------+   |
|                                                  |
|   V2 - React + Express (Decoupled)               |
|   +-----------+    +----------+    +---------+   |
|   | React SPA |--->| Express  |--->| MySQL   |   |
|   | (Vite)    |    | REST API |    | 8.0+    |   |
|   +-----------+    +----------+    +---------+   |
|                                                  |
+-------------------------------------------------+
```

### Tech Stack

| Component       | V1 -- Laravel                        | V2 -- React + Express                |
|-----------------|--------------------------------------|--------------------------------------|
| Language        | PHP 8.2+                             | Node.js 18+                         |
| Backend         | Laravel 11                           | Express 4.18                         |
| Frontend        | Blade templates, Tailwind CSS, Vite  | React 18 SPA, Tailwind CSS, Vite    |
| Database        | MySQL 8.0+                           | MySQL 8.0+ (via Sequelize ORM)      |
| Authentication  | Laravel session-based auth           | JWT (jsonwebtoken)                   |
| Excel Export    | Maatwebsite Excel 3.1                | ExcelJS 4.4                          |
| PDF Export      | Laravel DomPDF 2.0                   | PDFKit 0.14                          |
| UI Components   | Alpine.js / vanilla JS               | Headless UI, Heroicons              |

### System Requirements

**V1 -- Laravel**

- PHP 8.2 or higher with extensions: OpenSSL, PDO, Mbstring, Tokenizer, XML, Ctype, JSON, BCMath
- Composer 2.x
- MySQL 8.0 or higher
- Node.js 18+ and npm (for frontend asset compilation)
- Web server: Apache or Nginx (development: `php artisan serve`)

**V2 -- React + Express**

- Node.js 18 or higher
- npm 9+ or yarn 1.22+
- MySQL 8.0 or higher

**Browser Requirements (Both Versions)**

- Google Chrome 90+ (recommended)
- Mozilla Firefox 90+
- Microsoft Edge 90+
- Safari 15+
- JavaScript must be enabled

---

## 3. User Roles and Permissions

The application defines five roles. Each role has a fixed set of permissions that control
which modules are accessible and what actions can be performed.

### Permission Matrix

| Feature / Action              | Admin | B1    | B2    | B3    | Accountant |
|-------------------------------|-------|-------|-------|-------|------------|
| **Dashboard**                 | Full  | Own   | Own   | Own   | Summary    |
| **View Orders**               | All   | Own   | Own   | Own   | All (read) |
| **Create Orders**             | Yes   | Yes   | No    | Yes   | No         |
| **Process Orders (workflow)** | Yes   | Own   | Own   | Own   | No         |
| **Manage Stores**             | CRUD  | --    | --    | --    | --         |
| **Manage Items**              | CRUD  | --    | --    | --    | --         |
| **Manage Prices**             | CRUD  | --    | --    | --    | --         |
| **Manage Users**              | CRUD  | --    | --    | --    | --         |
| **View Summary**              | Yes   | --    | --    | --    | Yes        |
| **Export Summary**             | Yes   | --    | --    | --    | Yes        |
| **Invoice Reconciliation**    | Yes   | --    | --    | --    | Yes        |
| **Audit Logs**                | Yes   | --    | --    | --    | --         |
| **Notifications**             | Yes   | Yes   | Yes   | Yes   | Yes        |
| **Export Orders (Excel/PDF)** | Yes   | Yes   | Yes   | Yes   | Yes        |

### Role Descriptions

**Admin**
Full system access. Manages the master data (stores, items, prices, users), views all
orders regardless of store, and has access to audit logs. The Admin can also perform any
store-level action.

**B1 (Store B1 Manager)**
Can send orders to B2 and B3. Can receive orders from B3. Creates and manages orders
where B1 is the sending store. Sees only orders involving B1.

**B2 (Store B2 Manager)**
Receives orders from B1 and B3. Cannot initiate outgoing transfers. B2 serves as the
Four Season payment hub -- all supplier payments for Four Season products flow through
B2. Sees only orders involving B2.

**B3 (Store B3 Manager)**
Can send orders to B1 and B2. Can receive orders from B1. Creates and manages orders
where B3 is the sending store. Sees only orders involving B3.

**Accountant**
Read-only access to all orders. Views monthly and yearly summaries with store-pair
breakdowns. Performs invoice reconciliation. Can export data to Excel and PDF. Cannot
create, modify, or process any orders.

---

## 4. Transfer Rules

### Transfer Direction Matrix

Not all stores can send to every other store. The following matrix defines the allowed
transfer directions.

```
              RECEIVER
              B1      B2      B3
  S   B1      --      Yes     Yes
  E   B2      --      --      --
  N   B3      Yes     Yes     --
  D
  E
  R
```

| From | To  | Allowed | Notes                                    |
|------|-----|---------|------------------------------------------|
| B1   | B2  | Yes     | Standard transfer                        |
| B1   | B3  | Yes     | Standard transfer                        |
| B2   | B1  | No      | B2 is receive-only                       |
| B2   | B3  | No      | B2 is receive-only                       |
| B3   | B1  | Yes     | Standard transfer                        |
| B3   | B2  | Yes     | Standard transfer                        |

### B2 as Four Season Payment Hub

Store B2 acts as the central payment hub for Four Season supplier invoices. When B1 or B3
transfer Four Season products to B2, those transfers are tracked so that B2's payments to
the Four Season supplier can be reconciled against the goods actually received from the
other stores.

This means:
- B2 never sends goods outward; it only receives.
- Financial summaries for B1-B2 and B3-B2 pairs reflect the net transfer value that B2
  has received.
- The Accountant uses invoice reconciliation to match Four Season invoices against
  completed orders destined for B2.

---

## 5. Complete Order Workflow

### Order Lifecycle

An order moves through a defined set of statuses. Each transition is triggered by a
specific user action.

```
  +-------+     +----------+     +-----------+     +---------+
  | Draft |---->| Submitted|---->| Preparing |---->| Shipped |
  +-------+     +----------+     +-----------+     +---------+
      |              |                                   |
      |   +----------+                                   |
      |   |                                              v
      v   v                                        +-----------+
  +-----------+                                    | Received  |
  | Cancelled |                                    +-----------+
  +-----------+                                          |
                                                         v
                                                   +-----------+
                                                   | Completed |
                                                   +-----------+
```

### Step-by-Step Workflow

#### Step 1: Create Order (Sender)

The sender creates a new order in **Draft** status.

- Navigate to **Orders** and click **Create Order**.
- Select the destination store from the dropdown (only valid destinations appear based on
  transfer rules).
- Add line items: select an item from the item master, enter the requested quantity.
- Multiple items can be added to a single order.
- Optionally add notes for the receiver.
- Save the order. Status: **Draft**.

> **Who can do this:** B1, B3, Admin

#### Step 2: Submit Order (Sender)

The sender reviews the draft and submits it to the receiving store.

- Open the draft order and click **Submit**.
- The system validates that at least one line item exists.
- Status changes to **Submitted**.
- A notification is sent to the receiving store.

> **Who can do this:** The user who created the order (or Admin)

#### Step 3: Prepare Order (Sender)

The sender gathers the items and enters the actual quantities being shipped.

- Open the submitted order and click **Prepare**.
- For each line item, enter the **shipped quantity** (may differ from requested quantity
  due to stock availability).
- Status changes to **Preparing**.

> **Who can do this:** Sender store users, Admin

#### Step 4: Ship Order (Sender)

The sender confirms that the goods have been dispatched.

- Open the preparing order and click **Ship**.
- The system records the shipment timestamp.
- Status changes to **Shipped**.
- A notification is sent to the receiving store.

> **Who can do this:** Sender store users, Admin

#### Step 5: Receive Order (Receiver)

The receiving store acknowledges receipt and records the actual quantities received.

- Open the shipped order and click **Receive**.
- For each line item, enter the **received quantity**.
- If the received quantity differs from the shipped quantity, add a note explaining the
  discrepancy.
- Status changes to **Received**.

> **Who can do this:** Receiver store users, Admin

#### Step 6: Complete Order (Receiver / System)

The order is finalized. Prices are locked and the order becomes immutable.

- Open the received order and click **Complete**.
- The system snapshots the current price for each item from the price master.
- `unit_price` and `line_total` are written to each order line.
- Status changes to **Completed**.
- The Accountant is notified.
- The order data is now available in monthly summaries.

> **Who can do this:** Receiver store users, Admin

#### Step 7: Cancel Order

An order can be cancelled only from **Draft** or **Submitted** status.

- Open the order and click **Cancel**.
- Enter a cancellation reason (required).
- Status changes to **Cancelled**.
- A notification is sent to the other party.

> **Who can do this:** Sender store users, Admin
> **When:** Only in Draft or Submitted status

---

## 6. Module Guide

### 6.1 Dashboard

The Dashboard is the landing page after login. Its content varies by role.

**Admin Dashboard:**
- Total orders (all statuses)
- Orders by status breakdown
- Recent orders across all stores
- Quick-access links to all modules

**Store Manager Dashboard (B1, B2, B3):**
- Order count for the user's store (sent and received)
- Pending actions (orders awaiting action from this store)
- Recent orders involving the user's store

**Accountant Dashboard:**
- Summary statistics for the current month
- Count of completed orders awaiting reconciliation
- Quick links to Summary and Invoice modules

### 6.2 Orders

The Orders module is the core of the application.

**Order List Page**
- Displays all orders visible to the current user.
- Filter by: status, date range, source store, destination store.
- Sort by: order number, date, status.
- Each row shows: order number, from/to stores, status, creation date, item count.

**Order Detail Page**
- Full order header: order number, from store, to store, status, timestamps for each
  status transition.
- Status timeline showing the progression through each stage.
- Line items table: item code, item name, unit, requested quantity, shipped quantity,
  received quantity, unit price, line total.
- Notes section.
- Action buttons appropriate to the current status and user role.
- Export options: download as PDF.

**Creating an Order**
1. Click **Create Order** from the order list.
2. Select the destination store.
3. Add items using the item search/dropdown.
4. Enter requested quantities for each item.
5. Click **Save as Draft** or **Save and Submit**.

### 6.3 Notifications

Notifications keep all users informed about order activity.

**Notification Bell**
- Located in the top navigation bar.
- Displays a badge with the unread notification count.
- Clicking the bell shows a dropdown with recent notifications.

**Notification Types**
| Type              | Recipient         | Trigger                            |
|-------------------|-------------------|------------------------------------|
| Order Submitted   | Receiver store    | Sender submits an order            |
| Order Shipped     | Receiver store    | Sender ships an order              |
| Order Received    | Sender store      | Receiver acknowledges receipt      |
| Order Completed   | Sender, Accountant| Receiver completes the order       |
| Order Cancelled   | Other party       | Either party cancels the order     |

**Actions**
- Mark individual notifications as read.
- Mark all notifications as read.

### 6.4 Store Management (Admin Only)

Manage the store master data.

**Fields:**
| Field   | Description                | Required |
|---------|----------------------------|----------|
| Code    | Unique store code (e.g. B1)| Yes      |
| Name    | Display name               | Yes      |
| Address | Store address              | No       |
| Phone   | Contact phone number       | No       |
| Active  | Enable/disable the store   | Yes      |

**Operations:** Create, Read, Update, Delete (CRUD).

> **Note:** Deactivating a store does not delete existing orders. It prevents new orders
> from being created for that store.

### 6.5 Item Master (Admin Only)

Manage the catalog of items that can be transferred between stores.

**Fields:**
| Field    | Description                        | Required |
|----------|------------------------------------|----------|
| Code     | Unique item code (e.g. FS-001)     | Yes      |
| Name     | Item name                          | Yes      |
| Unit     | Unit of measure (e.g. pcs, kg, box)| Yes      |
| Category | Item category for grouping         | No       |
| Active   | Enable/disable the item            | Yes      |

**Operations:** Create, Read, Update, Delete (CRUD).

> **Note:** Deactivated items cannot be added to new orders but remain visible on
> existing orders.

### 6.6 Price Master (Admin Only)

Set and manage item prices with effective date ranges.

**Fields:**
| Field          | Description                             | Required |
|----------------|-----------------------------------------|----------|
| Item           | Reference to an item                    | Yes      |
| Price          | Unit price (up to 12 digits, 2 decimal) | Yes      |
| Effective From | Start date for this price               | Yes      |
| Effective To   | End date (null = indefinite)            | No       |

**Price History**
- View the complete price history for any item.
- Prices are ordered by effective date.
- Only the price effective at the time of order completion is used for line total
  calculations.

**Key Behavior:**
- When an order is completed, the system looks up the active price for each item based on
  the completion date.
- This price is stored directly on the order line (`unit_price` field), creating an
  immutable snapshot.
- Changing a price after completion does not affect previously completed orders.

### 6.7 Summary (Admin, Accountant)

The Summary module provides financial overviews of completed transfers.

**Monthly View**
- Select a year and month.
- Displays total orders and total amount for each store pair.
- Organized in tabs by store pair: B1-B2, B1-B3, B2-B3.

**Yearly View**
- Select a year.
- Shows month-by-month breakdown for each store pair.
- Annual totals per pair.

**Store Pair Tabs**
Each tab shows:
- Transfers in one direction (e.g., B1 to B2) with order count and total value.
- Transfers in the other direction (e.g., B2 to B1) -- if applicable per transfer rules.
- Net balance between the two stores.

**Export**
- Export the current summary view to Excel.
- File includes all visible data with proper formatting.

### 6.8 Invoice Reconciliation (Admin, Accountant)

Match supplier invoices against completed orders to verify amounts.

**Creating an Invoice Record**
1. Navigate to **Invoices** and click **Create Invoice**.
2. Enter: supplier name, invoice number, invoice date, total amount, associated store.
3. Add invoice line items: item, description, quantity, unit price, line total.
4. Save the invoice.

**Reconciliation Process**
1. Open an invoice and click **Reconcile**.
2. The system displays the invoice lines alongside matching completed order data.
3. Review each line: the system attempts to match by item and quantity.
4. Mark lines as matched or note discrepancies.
5. Complete the reconciliation. The invoice is marked as reconciled with a timestamp and
   the reconciling user.

### 6.9 Audit Log (Admin Only)

Every data change in the system is recorded in the audit log.

**Logged Information:**
| Field       | Description                            |
|-------------|----------------------------------------|
| User        | Who made the change                    |
| Action      | create, update, delete, or workflow action |
| Table       | Which database table was affected      |
| Record ID   | The ID of the affected record          |
| Old Values  | Previous values (JSON, for updates)    |
| New Values  | New values (JSON)                      |
| IP Address  | IP address of the user                 |
| User Agent  | Browser information                    |
| Timestamp   | When the change occurred               |

**Filtering:**
- Filter by user, action type, table name, date range.
- Search by record ID.

### 6.10 Export

The application supports exporting data in Excel and PDF formats.

**Excel Export**
- Export filtered order lists to Excel (.xlsx).
- Export monthly/yearly summary data to Excel.
- Available from the Orders list and Summary pages.

**PDF Export**
- Export individual order details as a PDF document.
- Includes: order header, status information, line items with prices, totals, and notes.
- Suitable for printing or archiving.

---

## 7. Installation Guide

### 7.1 V1 -- Laravel

#### Prerequisites

- PHP 8.2+ with required extensions
- Composer 2.x
- MySQL 8.0+
- Node.js 18+ and npm

#### Step-by-Step Installation

```bash
# 1. Navigate to the v1 directory
cd packing-list/v1-laravel

# 2. Install PHP dependencies
composer install

# 3. Install frontend dependencies
npm install

# 4. Create environment file
cp .env.example .env

# 5. Generate application key
php artisan key:generate

# 6. Configure database in .env
#    Edit .env and set:
#    DB_DATABASE=packing_list
#    DB_USERNAME=your_username
#    DB_PASSWORD=your_password

# 7. Create the database
mysql -u root -p -e "CREATE DATABASE packing_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 8. Run migrations
php artisan migrate

# 9. Seed test data
php artisan db:seed

# 10. Build frontend assets
npm run build
```

#### Running the Development Server

```bash
# Start the Laravel development server
php artisan serve

# In a separate terminal, start the Vite dev server for hot-reload
npm run dev
```

The application will be available at `http://localhost:8000`.

#### Production Deployment (Shared Hosting)

```bash
# 1. Build frontend assets for production
npm run build

# 2. Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# 3. Set the document root to the /public directory

# 4. Ensure storage and bootstrap/cache are writable
chmod -R 775 storage bootstrap/cache

# 5. Set up a cron job for Laravel scheduler (if needed)
# * * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

### 7.2 V2 -- React + Express

#### Prerequisites

- Node.js 18+
- npm 9+ or yarn
- MySQL 8.0+

#### Step-by-Step Installation

**Server Setup**

```bash
# 1. Navigate to the server directory
cd packing-list/v2-react/server

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Configure .env
#    DB_HOST=localhost
#    DB_PORT=3306
#    DB_NAME=packing_list
#    DB_USER=your_username
#    DB_PASS=your_password
#    JWT_SECRET=your_secret_key
#    PORT=3001

# 5. Create the database
mysql -u root -p -e "CREATE DATABASE packing_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 6. Run migrations (tables are auto-created via Sequelize sync)
npm run migrate

# 7. Seed test data
npm run seed
```

**Client Setup**

```bash
# 1. Navigate to the client directory
cd packing-list/v2-react/client

# 2. Install dependencies
npm install

# 3. Create environment file (if needed)
#    Set VITE_API_URL=http://localhost:3001/api
```

#### Running Development Servers

```bash
# Terminal 1: Start the Express API server
cd v2-react/server
npm run dev

# Terminal 2: Start the React development server
cd v2-react/client
npm run dev
```

The API server runs at `http://localhost:3001` and the React app at `http://localhost:5173`.

#### Production Deployment (PM2 + Nginx)

**Build the React Client**

```bash
cd v2-react/client
npm run build
# Output goes to dist/ directory
```

**Set Up PM2 for the Express Server**

```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
cd v2-react/server
pm2 start src/index.js --name packing-list-api

# Save PM2 process list for auto-restart
pm2 save
pm2 startup
```

**Nginx Configuration**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve React static files
    location / {
        root /path/to/v2-react/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Express
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 8. Test Accounts

After running the database seeder, the following test accounts are available. All
accounts use the same password.

| Email                       | Password   | Role       | Store | Description          |
|-----------------------------|------------|------------|-------|----------------------|
| admin@packinglist.com       | password   | Admin      | --    | Full system access   |
| b1@packinglist.com          | password   | B1         | B1    | Store B1 manager     |
| b2@packinglist.com          | password   | B2         | B2    | Store B2 manager     |
| b3@packinglist.com          | password   | B3         | B3    | Store B3 manager     |
| accountant@packinglist.com  | password   | Accountant | --    | Financial oversight  |

> **Important:** Change all passwords before deploying to a production environment.

---

## 9. Business Rules Reference

### 9.1 Transfer Rule Matrix

| From | To B1 | To B2 | To B3 |
|------|-------|-------|-------|
| B1   | --    | Yes   | Yes   |
| B2   | No    | --    | No    |
| B3   | Yes   | Yes   | --    |

B2 is receive-only. It does not originate transfers.

### 9.2 Order Number Format

```
PL-YYYYMMDD-NNN

PL         Fixed prefix
YYYYMMDD   Date the order was created
NNN        Sequential number for that date, zero-padded
```

Example: `PL-20260401-003` is the third order created on April 1, 2026.

### 9.3 Price Snapshot Logic

Prices are not applied to order lines until the order reaches **Completed** status.

1. When an order is completed, the system queries the `price_master` table for each
   item on the order.
2. It finds the price record where `effective_from <= completion_date` and either
   `effective_to IS NULL` or `effective_to >= completion_date`.
3. The matching `price` value is written to the order line's `unit_price` field.
4. The `line_total` is calculated as `received_qty * unit_price`.
5. These values are immutable after completion. Subsequent price changes do not affect
   completed orders.

### 9.4 Summary Calculation

Monthly summaries are derived exclusively from **completed** orders.

- The system groups completed orders by year, month, source store, and destination store.
- For each group, it calculates:
  - `total_orders`: count of completed orders in the group.
  - `total_amount`: sum of all `line_total` values across those orders.
- Results are stored in the `monthly_summaries` table for fast retrieval.

### 9.5 Net Balance Formula

For any store pair (e.g., B1 and B3), the net balance for a given period is:

```
Net Balance = SUM(transfers from A to B) - SUM(transfers from B to A)
```

A positive balance means Store A has sent more value to Store B than it has received.
A negative balance means Store A has received more value from Store B.

> **Note:** Since B2 cannot send, the B1-B2 and B3-B2 pairs will always show a one-
> directional total.

---

## 10. Database Schema

The application uses 11 tables (excluding the sessions table). Below is a summary of
each table and its purpose.

### Table Overview

| #  | Table              | Description                                              |
|----|--------------------|----------------------------------------------------------|
| 1  | `stores`           | Store master data (code, name, address, phone)           |
| 2  | `users`            | User accounts with role and store assignment             |
| 3  | `sessions`         | Laravel session storage (V1 only)                        |
| 4  | `items`            | Item catalog (code, name, unit, category)                |
| 5  | `price_master`     | Item price history with effective date ranges            |
| 6  | `orders`           | Transfer order headers with status tracking              |
| 7  | `order_lines`      | Individual line items within an order                    |
| 8  | `notifications`    | In-app notifications linked to users and orders          |
| 9  | `monthly_summaries`| Pre-calculated monthly totals per store pair             |
| 10 | `invoices`         | Supplier invoice headers for reconciliation              |
| 11 | `invoice_lines`    | Individual line items within an invoice                  |
| 12 | `audit_logs`       | Change history for all data modifications                |

### Key Relationships

```
stores
  |-- users.store_id
  |-- orders.from_store_id
  |-- orders.to_store_id
  |-- invoices.store_id
  |-- monthly_summaries.from_store_id
  |-- monthly_summaries.to_store_id

users
  |-- orders.created_by
  |-- price_master.created_by
  |-- notifications.user_id
  |-- invoices.reconciled_by
  |-- audit_logs.user_id

items
  |-- price_master.item_id
  |-- order_lines.item_id
  |-- invoice_lines.item_id

orders
  |-- order_lines.order_id
  |-- notifications.order_id
```

### Table Details

**stores**

| Column    | Type         | Constraints       |
|-----------|--------------|-------------------|
| id        | BIGINT       | PK, auto-increment|
| code      | VARCHAR(10)  | UNIQUE, NOT NULL  |
| name      | VARCHAR(100) | NOT NULL          |
| address   | TEXT         | NULLABLE          |
| phone     | VARCHAR(20)  | NULLABLE          |
| active    | BOOLEAN      | DEFAULT true      |
| timestamps| DATETIME     | created/updated   |

**users**

| Column    | Type         | Constraints                              |
|-----------|--------------|------------------------------------------|
| id        | BIGINT       | PK, auto-increment                       |
| name      | VARCHAR(100) | NOT NULL                                 |
| email     | VARCHAR(150) | UNIQUE, NOT NULL                         |
| password  | VARCHAR      | NOT NULL (hashed)                        |
| role      | ENUM         | admin, b1, b2, b3, accountant            |
| store_id  | BIGINT       | FK to stores, NULLABLE (null for admin/accountant) |
| active    | BOOLEAN      | DEFAULT true                             |
| timestamps| DATETIME     | created/updated                          |

**orders**

| Column        | Type         | Constraints                  |
|---------------|--------------|------------------------------|
| id            | BIGINT       | PK, auto-increment           |
| order_number  | VARCHAR(20)  | UNIQUE, NOT NULL             |
| from_store_id | BIGINT       | FK to stores, NOT NULL       |
| to_store_id   | BIGINT       | FK to stores, NOT NULL       |
| status        | ENUM         | draft, submitted, preparing, shipped, received, completed, cancelled |
| created_by    | BIGINT       | FK to users, NOT NULL        |
| submitted_at  | TIMESTAMP    | NULLABLE                     |
| shipped_at    | TIMESTAMP    | NULLABLE                     |
| received_at   | TIMESTAMP    | NULLABLE                     |
| completed_at  | TIMESTAMP    | NULLABLE                     |
| notes         | TEXT         | NULLABLE                     |
| cancel_reason | TEXT         | NULLABLE                     |
| timestamps    | DATETIME     | created/updated              |

**order_lines**

| Column        | Type          | Constraints              |
|---------------|---------------|--------------------------|
| id            | BIGINT        | PK, auto-increment       |
| order_id      | BIGINT        | FK to orders, CASCADE    |
| item_id       | BIGINT        | FK to items, NOT NULL    |
| requested_qty | DECIMAL(10,2) | NOT NULL                 |
| shipped_qty   | DECIMAL(10,2) | NULLABLE                 |
| received_qty  | DECIMAL(10,2) | NULLABLE                 |
| unit_price    | DECIMAL(12,2) | NULLABLE (set on complete)|
| line_total    | DECIMAL(14,2) | NULLABLE (set on complete)|
| notes         | TEXT          | NULLABLE                 |
| timestamps    | DATETIME      | created/updated          |

---

## 11. API Reference (V2 Only)

All API endpoints are prefixed with `/api`. Authentication is via JWT tokens sent in the
`Authorization: Bearer <token>` header.

### Authentication

| Method | Endpoint         | Description                | Auth Required |
|--------|------------------|----------------------------|---------------|
| POST   | `/api/auth/login`  | Log in, receive JWT token  | No            |
| POST   | `/api/auth/logout` | Invalidate current token   | Yes           |
| GET    | `/api/auth/me`     | Get current user profile   | Yes           |

**Login Request Body:**

```json
{
  "email": "admin@packinglist.com",
  "password": "password"
}
```

**Login Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@packinglist.com",
    "role": "admin",
    "store_id": null
  }
}
```

### Dashboard

| Method | Endpoint               | Description               | Roles     |
|--------|------------------------|---------------------------|-----------|
| GET    | `/api/dashboard/stats` | Get dashboard statistics  | All       |

### Stores

| Method | Endpoint            | Description         | Roles     |
|--------|---------------------|----------------------|-----------|
| GET    | `/api/stores`       | List all stores      | All       |
| GET    | `/api/stores/:id`   | Get store details    | All       |
| POST   | `/api/stores`       | Create a store       | Admin     |
| PUT    | `/api/stores/:id`   | Update a store       | Admin     |
| DELETE | `/api/stores/:id`   | Delete a store       | Admin     |

### Items

| Method | Endpoint            | Description         | Roles              |
|--------|---------------------|----------------------|--------------------|
| GET    | `/api/items`        | List all items       | All                |
| GET    | `/api/items/:id`    | Get item details     | All                |
| POST   | `/api/items`        | Create an item       | Admin, B1, B2, B3  |
| PUT    | `/api/items/:id`    | Update an item       | Admin, B1, B2, B3  |
| DELETE | `/api/items/:id`    | Delete an item       | Admin              |

### Prices

| Method | Endpoint                    | Description              | Roles             |
|--------|-----------------------------|--------------------------|--------------------|
| GET    | `/api/prices`               | List all prices          | All                |
| GET    | `/api/prices/:id`           | Get price details        | All                |
| GET    | `/api/prices/history/:itemId` | Get price history for item | All            |
| POST   | `/api/prices`               | Create a price entry     | Admin, Accountant  |

### Orders

| Method | Endpoint                    | Description                  | Roles              |
|--------|-----------------------------|------------------------------|---------------------|
| GET    | `/api/orders`               | List orders (filtered by role)| All                |
| GET    | `/api/orders/:id`           | Get order details            | All                |
| POST   | `/api/orders`               | Create a new order           | Admin, B1, B3      |
| PUT    | `/api/orders/:id`           | Update order (draft only)    | Admin, B1, B3      |
| POST   | `/api/orders/:id/submit`    | Submit order                 | Sender             |
| POST   | `/api/orders/:id/prepare`   | Mark as preparing            | Sender             |
| POST   | `/api/orders/:id/ship`      | Mark as shipped              | Sender             |
| POST   | `/api/orders/:id/receive`   | Mark as received             | Receiver           |
| POST   | `/api/orders/:id/complete`  | Mark as completed            | Receiver           |
| POST   | `/api/orders/:id/cancel`    | Cancel order                 | Sender             |

**Create Order Request Body:**

```json
{
  "to_store_id": 2,
  "notes": "Monthly Four Season restock",
  "lines": [
    { "item_id": 1, "requested_qty": 50 },
    { "item_id": 3, "requested_qty": 25 }
  ]
}
```

### Notifications

| Method | Endpoint                          | Description                  | Roles |
|--------|-----------------------------------|------------------------------|-------|
| GET    | `/api/notifications`              | List user notifications      | All   |
| GET    | `/api/notifications/unread-count` | Get unread count             | All   |
| PUT    | `/api/notifications/:id/read`     | Mark notification as read    | All   |
| PUT    | `/api/notifications/read-all`     | Mark all as read             | All   |

### Summary

| Method | Endpoint                          | Description                  | Roles             |
|--------|-----------------------------------|------------------------------|--------------------|
| GET    | `/api/summary/monthly`            | Monthly summary data         | Admin, Accountant  |
| GET    | `/api/summary/yearly`             | Yearly summary data          | Admin, Accountant  |
| GET    | `/api/summary/pair/:from/:to`     | Summary for a store pair     | Admin, Accountant  |

**Query Parameters for Monthly:**

| Parameter | Type   | Description         |
|-----------|--------|---------------------|
| year      | number | Year (e.g. 2026)    |
| month     | number | Month (1-12)        |

### Invoices

| Method | Endpoint                        | Description              | Roles                  |
|--------|---------------------------------|--------------------------|------------------------|
| GET    | `/api/invoices`                 | List all invoices        | All                    |
| GET    | `/api/invoices/:id`             | Get invoice details      | All                    |
| POST   | `/api/invoices`                 | Create an invoice        | Admin, Accountant, B2  |
| PUT    | `/api/invoices/:id`             | Update an invoice        | Admin, Accountant, B2  |
| POST   | `/api/invoices/:id/reconcile`   | Reconcile an invoice     | Admin, Accountant      |

### Audit Logs

| Method | Endpoint            | Description          | Roles             |
|--------|---------------------|----------------------|--------------------|
| GET    | `/api/audit-logs`   | List audit log entries| Admin, Accountant  |

**Query Parameters:**

| Parameter  | Type   | Description                          |
|------------|--------|--------------------------------------|
| user_id    | number | Filter by user                       |
| action     | string | Filter by action (create/update/delete) |
| table_name | string | Filter by table                      |
| from_date  | string | Start date (ISO 8601)                |
| to_date    | string | End date (ISO 8601)                  |

### Users (Admin Only)

| Method | Endpoint            | Description         | Roles |
|--------|---------------------|----------------------|-------|
| GET    | `/api/users`        | List all users       | Admin |
| GET    | `/api/users/:id`    | Get user details     | Admin |
| POST   | `/api/users`        | Create a user        | Admin |
| PUT    | `/api/users/:id`    | Update a user        | Admin |
| DELETE | `/api/users/:id`    | Delete a user        | Admin |

### Export

| Method | Endpoint              | Description               | Roles             |
|--------|-----------------------|---------------------------|--------------------|
| GET    | `/api/export/excel`   | Export summary to Excel   | Admin, Accountant  |
| GET    | `/api/export/pdf`     | Export summary to PDF     | Admin, Accountant  |

---

## 12. Troubleshooting and FAQ

### Common Setup Issues

**Q: `php artisan migrate` fails with "Access denied for user"**

Verify your `.env` file has the correct database credentials. Ensure the MySQL user has
CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, and SELECT privileges on the target database.

```bash
# Test the connection
mysql -u your_username -p your_database
```

**Q: `npm run build` fails with "out of memory"**

Increase Node.js memory limit:

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Q: The Vite dev server does not hot-reload**

Ensure you are running both `php artisan serve` (V1) and `npm run dev` simultaneously in
separate terminals. Check that the Vite configuration points to the correct host and port.

**Q: "CORS error" when running V2 in development**

Ensure the Express server has CORS configured to allow requests from the Vite dev server
origin (`http://localhost:5173`). Check the server `.env` for a `CORS_ORIGIN` variable.

### Migration Errors

**Q: "Table already exists" error during migration**

If you need to start fresh, drop all tables and re-run migrations:

```bash
# V1 - Laravel
php artisan migrate:fresh --seed

# V2 - Express
# Drop the database and recreate it, then run seed
mysql -u root -p -e "DROP DATABASE packing_list; CREATE DATABASE packing_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run seed
```

**Q: Foreign key constraint errors during migration**

Ensure migrations run in the correct order. The migration files are numbered to enforce
the proper sequence. If running manually, create tables in this order: stores, users,
items, price_master, orders, order_lines, notifications, monthly_summaries, invoices,
invoice_lines, audit_logs.

### Permission Issues

**Q: "Unauthorized" error when accessing a page**

Verify that the logged-in user has the correct role for the requested resource. Refer to
the Permission Matrix in Section 3. Admin has access to all resources.

**Q: Store user cannot create an order**

Check the transfer rules. B2 users cannot create orders (B2 is receive-only). B1 can
send to B2 and B3. B3 can send to B1 and B2.

**Q: Accountant cannot modify orders**

This is by design. The Accountant role has read-only access to orders and is limited to
viewing summaries, reconciling invoices, and exporting data.

### How to Reset Test Data

**V1 -- Laravel**

```bash
# Reset database and reseed all test data
php artisan migrate:fresh --seed
```

**V2 -- React + Express**

```bash
# From the server directory
cd v2-react/server

# Drop and recreate the database, then seed
mysql -u root -p -e "DROP DATABASE packing_list; CREATE DATABASE packing_list CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run seed
```

This will recreate the three stores (B1, B2, B3), the five test user accounts, sample
items, and initial price entries.

### General FAQ

**Q: Can I change the transfer rules (e.g., allow B2 to send)?**

The transfer rules are enforced in the application logic (controller/service layer). To
modify them, update the validation logic in the order creation controller and adjust the
UI dropdowns accordingly. This requires code changes in both versions.

**Q: How are prices applied to old orders?**

Prices are only applied at the moment an order is completed. The price effective on the
completion date is used. Once written to the order line, the price is immutable. Changing
a price in the price master has no retroactive effect.

**Q: Can an order be re-opened after completion?**

No. Completed orders are final. If a correction is needed, create a new order to account
for the difference.

**Q: What happens if an item has no price when an order is completed?**

The system will either assign a zero price or raise a warning (depending on
configuration). It is recommended to ensure all active items have a valid price entry
before completing orders.

**Q: Can I use a different database (PostgreSQL, SQLite)?**

V1 (Laravel) supports multiple database drivers with minor configuration changes. V2
(Express + Sequelize) also supports PostgreSQL and SQLite through Sequelize dialect
configuration. However, the application has been tested primarily with MySQL 8.0.

---

*End of Document*
