# Restaurant Operation System

> **Formerly:** Packing List
> **Document version:** 2.0 — 2026-04-17
> **Development team:** Bakudan Team
> **Language:** English

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Project Structure](#3-project-structure)
4. [Tech Stack](#4-tech-stack)
5. [Two Versions: Laravel vs React](#5-two-versions-laravel-vs-react)
6. [Transfer Rules & Order Workflow](#6-transfer-rules--order-workflow)
7. [User Roles (RBAC)](#7-user-roles-rbac)
8. [Key Features](#8-key-features)
9. [Database Schema](#9-database-schema)
10. [Test Accounts](#10-test-accounts)
11. [How to Run](#11-how-to-run)
12. [Further Reading](#12-further-reading)

---

## 1. Project Overview

**Restaurant Operation System** (formerly "Packing List") is a web application for managing internal goods transfers and restaurant operations across three retail locations (B1, B2, B3) in the restaurant supply chain.

| Attribute | Detail |
|-----------|--------|
| **Project name** | Restaurant Operation System |
| **Former name** | Packing List |
| **Development team** | Bakudan Team |
| **Date created** | 2026-03-31 |
| **Database** | MySQL 8.0 |
| **Default DB port** | 3306 |

---

## 2. System Architecture

The project has **two parallel versions**:

### Version 1 — Laravel (Monolith)

```
Browser (Blade + Inertia + React hybrid)
        │ HTTP
Laravel 11 Application
  Routes → Controllers → Models
  Middleware + Services
        │
    MySQL 8.0
```

### Version 2 — React + Express (SPA)

```
React 18 + Vite (SPA)
   React Router + Tailwind
        │ REST API
Express.js API Server
  JWT Auth + Services
  Sequelize ORM
        │
    MySQL 8.0
```

---

## 3. Project Structure

```
restaurant-operation-system/
├── docker-compose.yml          ← MySQL container
├── README.md                   ← (this file)
│
├── v1-laravel/                 ← Version 1: Laravel 11 (Monolith)
│   ├── app/Domains/            ← Domain-based architecture
│   │   ├── Audit/              ← AuditLog model, service, observer
│   │   ├── CostEngine/         ← Raw materials, recipes, cost engine
│   │   ├── Dashboard/
│   │   ├── Inventory/           ← Items, PriceMaster, InventoryService
│   │   ├── Invoice/             ← Invoice, InvoiceLine, InvoiceService
│   │   ├── InvoiceScan/         ← Vendors, scan jobs, mapping
│   │   ├── Notification/        ← Notification model + service
│   │   ├── Order/              ← Order, OrderLine, OrderService
│   │   ├── Packing/            ← PackingJob, PackingItem, PackingService
│   │   ├── Report/             ← SummaryService, ExportService
│   │   └── User/               ← User, Store models + controllers
│   ├── config/packinglist.php  ← Transfer rules, statuses, roles
│   ├── database/migrations/    ← 15 migration files (incl. packing tables)
│   └── routes/web.php
│
├── v2-react/                  ← Version 2: React + Express (SPA)
│   ├── client/src/
│   │   ├── domains/           ← Domain-organized pages
│   │   │   ├── inventory/
│   │   │   ├── invoice/
│   │   │   ├── notification/
│   │   │   ├── order/
│   │   │   ├── packing/        ← Packing pages
│   │   │   └── user/
│   │   ├── components/
│   │   ├── api/
│   │   └── hooks/
│   └── server/src/
│       ├── domains/            ← Domain-organized code
│       │   ├── inventory/
│       │   ├── invoice/
│       │   ├── order/
│       │   ├── packing/        ← Packing controller + models
│       │   └── ...
│       ├── controllers/
│       ├── models/             ← Sequelize models + associations
│       ├── routes/
│       ├── middleware/
│       └── services/            ← orderService, invoiceService, etc.
│
├── docs/
│   ├── SRS.md
│   ├── PRD.md
│   └── GUIDE.md
│
└── tests/
    └── simulation.js
```

---

## 4. Tech Stack

### Version 1 — Laravel

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | PHP | 8.2+ |
| Framework | Laravel | 11 |
| Frontend | Blade + Inertia + React (hybrid) | — |
| Build | Vite | 5 |
| CSS | Tailwind CSS | 3.4 |
| ORM | Eloquent | — |
| Database | MySQL | 8.0 |
| Excel Export | PhpSpreadsheet (Maatwebsite) | 3.1 |
| PDF Export | DomPDF | 2.0 |
| Testing | PHPUnit | 11 |

### Version 2 — React + Express

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | 6.21 |
| Build | Vite | 5.0 |
| CSS | Tailwind CSS | 3.4 |
| HTTP | Axios | 1.6 |
| Backend | Express.js | 4.18 |
| Auth | JWT (jsonwebtoken) | 9.0 |
| ORM | Sequelize | 6.35 |
| DB Driver | mysql2 | 3.6 |
| Excel | ExcelJS | 4.4 |
| PDF | PDFKit | 0.14 |

---

## 5. Two Versions: Laravel vs React

| Criterion | v1-laravel | v2-react |
|----------|-----------|---------|
| **Architecture** | Monolith (server-rendered) | SPA + REST API |
| **Frontend** | Blade + Inertia + React | React SPA |
| **Backend** | Laravel 11 controllers | Express.js |
| **Database access** | Eloquent ORM | Sequelize ORM |
| **Auth** | Session + CSRF | JWT token |
| **Port default** | 8000 | Client: 5173 / Server: 3001 |

---

## 6. Transfer Rules & Order Workflow

### 6.1 Transfer Matrix

| From \ To | B1 | B2 | B3 |
|-----------|----|----|-----|
| **B1** | — | ✅ | ✅ |
| **B2** | ❌ | — | ❌ |
| **B3** | ✅ | ✅ | — |

- **B2 cannot send shipments** — B2 only receives from B1 and B3
- **B2 pays Four Season invoices on behalf of B1 and B3**

### 6.2 Order Workflow

```
Draft → Submitted → Processing → Ready to Ship → In Transit
  → Received (Pending Confirmation) → Completed
  │
  └── Cancelled ◀── Disputed
```

| Status | Description | Actor |
|--------|-------------|-------|
| `draft` | Draft, not yet submitted | Creator |
| `submitted` | Submitted, awaiting processing | Creator |
| `processing` | Order is being prepared | Sender |
| `ready_to_ship` | Ready for delivery | Sender |
| `in_transit` | Currently being shipped | Sender |
| `received_pending_confirmation` | Received, awaiting confirmation | Receiver |
| `completed` | Completed (price snapshot taken) | Receiver |
| `cancelled` | Cancelled | Creator |
| `disputed` | Disputed | Receiver |

> When an order transitions to `completed`, the system automatically snapshots prices: `line_total = received_qty × unit_price` at the time of completion. This data is used for monthly financial reporting.

---

## 7. User Roles (RBAC)

| Role | Permissions |
|------|------------|
| **admin** | Full access: users, stores, items, prices, audit logs |
| **b1** | Create orders → B2, B3. Receive from B3 |
| **b2** | Receive orders only. Cannot create outbound orders |
| **b3** | Create orders → B1, B2. Receive from B1 |
| **accountant** | View completed orders, summaries, reconciliation, export |

---

## 8. Key Features

### ✅ MVP (Complete)

- ✅ Authentication & Authorization (RBAC)
- ✅ Store Management — CRUD (Admin)
- ✅ Item Management — CRUD (Admin)
- ✅ Price Management — Date-effective pricing (Admin)
- ✅ Full Order Workflow
- ✅ In-App Notifications (polling)
- ✅ Accounting Summary (monthly/yearly by store pair)
- ✅ Excel Export
- ✅ Four Season Invoice Reconciliation
- ✅ Audit Log CRUD (Admin)
- ✅ **Packing System** — Create/manange packing jobs, track item packing status, generate checklists, ship integration

### ⏳ Extended (Next Phase)

- PDF Export, Email Notifications, Charts Dashboard, Browser Push Notifications

### 🧩 Laravel-Only Modules

| Module | Description |
|--------|-------------|
| **Cost Engine** | Product cost calculation formulas |
| **Raw Materials** | Raw materials + price tables |
| **Invoice Scan** | OCR invoice scanning + auto item mapping |
| **Vendors** | Vendor management |

---

## 9. Database Schema

### Entity Relationship

```
stores 1──N users
stores 1──N orders (from_store / to_store)
items  1──N price_master
items  1──N order_lines
items  1──N packing_items
orders 1──N order_lines
orders 1──N notifications
orders 1──N packing_jobs
users  1──N notifications
users  1──N audit_logs
invoices 1──N invoice_lines
packing_jobs 1──N packing_items
packing_templates 1──N packing_template_items
```

### Core Tables

| Table | Description |
|-------|-------------|
| `stores` | Locations B1, B2, B3 |
| `users` | Users (5 roles) |
| `items` | 25 seeded items |
| `price_master` | Date-effective price table |
| `orders` | Transfer orders |
| `order_lines` | Order line items |
| `notifications` | In-app notifications |
| `monthly_summaries` | Monthly aggregates (cached) |
| `invoices` | Four Season invoices |
| `invoice_lines` | Invoice line items |
| `audit_logs` | Operation audit trail |
| `packing_jobs` | Packing jobs (shipment/transfer/event) |
| `packing_items` | Items within a packing job |
| `packing_templates` | Reusable packing templates |
| `packing_template_items` | Items in a packing template |

### Order Number Format

```
PL-YYYYMMDD-NNN
```
**Example:** `PL-20260414-007` = 7th order on April 14, 2026

---

## 10. Test Accounts

| Email | Password | Role | Store |
|-------|----------|------|-------|
| `admin@restaurant.com` | `password` | admin | — |
| `b1@restaurant.com` | `password` | b1 | B1 |
| `b2@restaurant.com` | `password` | b2 | B2 |
| `b3@restaurant.com` | `password` | b3 | B3 |
| `accountant@restaurant.com` | `password` | accountant | — |

> ⚠️ All test passwords are `password` — **DO NOT use on production!**

---

## 11. How to Run

### Initialize Database (Docker)

```bash
cd /e/Project/Master/packing-list
docker compose up -d
```

### Option 1: Laravel (v1-laravel)

```bash
cd /e/Project/Master/packing-list/v1-laravel

composer install
cp .env.example .env
php artisan key:generate
# Edit .env: DB_DATABASE=packing_list, DB_USERNAME=root, DB_PASSWORD=password
mysql -u root -p -e "CREATE DATABASE packing_list"
php artisan migrate
php artisan db:seed
npm install && npm run build
php artisan serve
# → Open http://localhost:8000
```

### Option 2: React + Express (v2-react)

```bash
# --- Terminal 1: API Server ---
cd /e/Project/Master/packing-list/v2-react/server
npm install
cp .env.example .env
mysql -u root -p -e "CREATE DATABASE packing_list"
npm run migrate
npm run seed
npm run dev  # API at http://localhost:3001

# --- Terminal 2: React Client ---
cd /e/Project/Master/packing-list/v2-react/client
npm install
npm run dev  # Frontend at http://localhost:5173
```

### Run Load Simulation

```bash
node /e/Project/Master/packing-list/tests/simulation.js
# Simulates 500 concurrent users × 100 operations
```

---

## 12. Further Reading

| File | Description |
|------|-------------|
| `docs/SRS.md` | Database schema, API spec, test accounts |
| `docs/PRD.md` | Business logic, user stories, workflow |
| `docs/GUIDE.md` | Detailed guide for v2-react |
| `v1-laravel/config/packinglist.php` | Transfer rules, statuses, roles, units |
| `docker-compose.yml` | MySQL container configuration |

---

## Getting Started for New Developers

1. **Read `docs/SRS.md`** — understand database schema and business logic
2. **Read `docs/PRD.md`** — understand user stories and business processes
3. Clone project → `docker compose up -d` → follow Section 11
4. Log in with test accounts to experience each role

---

*Copyright © 2026 Bakudan Team — Internal use only, not for public distribution.*
