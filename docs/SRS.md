# Software Requirements Specification (SRS)
# Packing List Web App

**Version:** 1.0
**Date:** 2026-03-31
**Author:** Bakudan Team

---

## 1. System Architecture

### 1.1 Version 1 (Laravel)
```
┌─────────────────────────────────────┐
│           Browser (Client)          │
│     Blade Templates + Tailwind      │
└──────────────┬──────────────────────┘
               │ HTTP
┌──────────────▼──────────────────────┐
│         Laravel 11 Application      │
│  ┌─────────┐ ┌──────────┐ ┌──────┐ │
│  │ Routes  │ │Controller│ │Models│ │
│  │         │→│          │→│      │ │
│  └─────────┘ └──────────┘ └──┬───┘ │
│                              │     │
│  ┌──────────┐ ┌──────────┐  │     │
│  │Middleware│ │ Services │  │     │
│  └──────────┘ └──────────┘  │     │
└──────────────────────────┬──┘─────┘
                           │
┌──────────────────────────▼─────────┐
│            MySQL 8.0               │
└────────────────────────────────────┘
```

### 1.2 Version 2 (React + Express)
```
┌─────────────────────────────────────┐
│       React 18 + Vite (SPA)        │
│      React Router + Tailwind       │
└──────────────┬──────────────────────┘
               │ REST API (JSON)
┌──────────────▼──────────────────────┐
│       Express.js API Server        │
│  ┌─────────┐ ┌──────────┐ ┌──────┐ │
│  │ Routes  │ │Controller│ │Models│ │
│  │         │→│          │→│(Seq.)│ │
│  └─────────┘ └──────────┘ └──┬───┘ │
│                              │     │
│  ┌──────────┐ ┌──────────┐  │     │
│  │JWT Auth  │ │ Services │  │     │
│  └──────────┘ └──────────┘  │     │
└──────────────────────────┬──┘─────┘
                           │
┌──────────────────────────▼─────────┐
│            MySQL 8.0               │
└────────────────────────────────────┘
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
stores 1──N users
stores 1──N orders (from_store)
stores 1──N orders (to_store)
items  1──N price_master
items  1──N order_lines
orders 1──N order_lines
orders 1──N notifications
users  1──N notifications
users  1──N audit_logs
invoices 1──N invoice_lines
items  1──N invoice_lines
```

### 2.2 Table Definitions

#### `stores`
| Column     | Type         | Constraints          |
|------------|-------------|----------------------|
| id         | BIGINT(PK)  | AUTO_INCREMENT       |
| code       | VARCHAR(10) | UNIQUE, NOT NULL     |
| name       | VARCHAR(100)| NOT NULL             |
| address    | TEXT        | NULLABLE             |
| phone      | VARCHAR(20) | NULLABLE             |
| active     | BOOLEAN     | DEFAULT true         |
| created_at | TIMESTAMP   |                      |
| updated_at | TIMESTAMP   |                      |

#### `users`
| Column     | Type         | Constraints          |
|------------|-------------|----------------------|
| id         | BIGINT(PK)  | AUTO_INCREMENT       |
| name       | VARCHAR(100)| NOT NULL             |
| email      | VARCHAR(150)| UNIQUE, NOT NULL     |
| password   | VARCHAR(255)| NOT NULL (hashed)    |
| role       | ENUM        | admin,b1,b2,b3,accountant |
| store_id   | BIGINT(FK)  | NULLABLE (→stores)   |
| active     | BOOLEAN     | DEFAULT true         |
| created_at | TIMESTAMP   |                      |
| updated_at | TIMESTAMP   |                      |

#### `items`
| Column     | Type         | Constraints          |
|------------|-------------|----------------------|
| id         | BIGINT(PK)  | AUTO_INCREMENT       |
| code       | VARCHAR(20) | UNIQUE, NOT NULL     |
| name       | VARCHAR(150)| NOT NULL             |
| unit       | VARCHAR(20) | NOT NULL (kg,pcs,box,bottle,can,pack) |
| category   | VARCHAR(50) | NULLABLE             |
| active     | BOOLEAN     | DEFAULT true         |
| created_at | TIMESTAMP   |                      |
| updated_at | TIMESTAMP   |                      |

#### `price_master`
| Column        | Type         | Constraints          |
|---------------|-------------|----------------------|
| id            | BIGINT(PK)  | AUTO_INCREMENT       |
| item_id       | BIGINT(FK)  | NOT NULL (→items)    |
| price         | DECIMAL(12,2)| NOT NULL            |
| effective_from| DATE        | NOT NULL             |
| effective_to  | DATE        | NULLABLE             |
| created_by    | BIGINT(FK)  | NOT NULL (→users)    |
| created_at    | TIMESTAMP   |                      |
| updated_at    | TIMESTAMP   |                      |

#### `orders`
| Column        | Type         | Constraints          |
|---------------|-------------|----------------------|
| id            | BIGINT(PK)  | AUTO_INCREMENT       |
| order_number  | VARCHAR(20) | UNIQUE, NOT NULL     |
| from_store_id | BIGINT(FK)  | NOT NULL (→stores)   |
| to_store_id   | BIGINT(FK)  | NOT NULL (→stores)   |
| status        | ENUM        | draft,submitted,preparing,shipped,received,completed,cancelled |
| created_by    | BIGINT(FK)  | NOT NULL (→users)    |
| submitted_at  | TIMESTAMP   | NULLABLE             |
| shipped_at    | TIMESTAMP   | NULLABLE             |
| received_at   | TIMESTAMP   | NULLABLE             |
| completed_at  | TIMESTAMP   | NULLABLE             |
| notes         | TEXT        | NULLABLE             |
| cancel_reason | TEXT        | NULLABLE             |
| created_at    | TIMESTAMP   |                      |
| updated_at    | TIMESTAMP   |                      |

#### `order_lines`
| Column       | Type          | Constraints          |
|--------------|--------------|----------------------|
| id           | BIGINT(PK)   | AUTO_INCREMENT       |
| order_id     | BIGINT(FK)   | NOT NULL (→orders)   |
| item_id      | BIGINT(FK)   | NOT NULL (→items)    |
| requested_qty| DECIMAL(10,2)| NOT NULL             |
| shipped_qty  | DECIMAL(10,2)| NULLABLE             |
| received_qty | DECIMAL(10,2)| NULLABLE             |
| unit_price   | DECIMAL(12,2)| NULLABLE (snapshot)  |
| line_total   | DECIMAL(14,2)| NULLABLE (computed)  |
| notes        | TEXT         | NULLABLE             |
| created_at   | TIMESTAMP    |                      |
| updated_at   | TIMESTAMP    |                      |

#### `notifications`
| Column     | Type         | Constraints          |
|------------|-------------|----------------------|
| id         | BIGINT(PK)  | AUTO_INCREMENT       |
| user_id    | BIGINT(FK)  | NOT NULL (→users)    |
| order_id   | BIGINT(FK)  | NULLABLE (→orders)   |
| type       | VARCHAR(50) | NOT NULL             |
| title      | VARCHAR(200)| NOT NULL             |
| message    | TEXT        | NOT NULL             |
| is_read    | BOOLEAN     | DEFAULT false        |
| created_at | TIMESTAMP   |                      |

#### `monthly_summaries`
| Column        | Type          | Constraints          |
|---------------|--------------|----------------------|
| id            | BIGINT(PK)   | AUTO_INCREMENT       |
| year          | INT          | NOT NULL             |
| month         | INT          | NOT NULL             |
| from_store_id | BIGINT(FK)   | NOT NULL (→stores)   |
| to_store_id   | BIGINT(FK)   | NOT NULL (→stores)   |
| total_orders  | INT          | DEFAULT 0            |
| total_amount  | DECIMAL(14,2)| DEFAULT 0            |
| generated_at  | TIMESTAMP    |                      |
| created_at    | TIMESTAMP    |                      |
| updated_at    | TIMESTAMP    |                      |

**UNIQUE constraint:** (year, month, from_store_id, to_store_id)

#### `invoices`
| Column         | Type          | Constraints          |
|----------------|--------------|----------------------|
| id             | BIGINT(PK)   | AUTO_INCREMENT       |
| supplier       | VARCHAR(100) | NOT NULL             |
| invoice_number | VARCHAR(50)  | NOT NULL             |
| invoice_date   | DATE         | NOT NULL             |
| total_amount   | DECIMAL(14,2)| NOT NULL             |
| store_id       | BIGINT(FK)   | NULLABLE (→stores)   |
| reconciled     | BOOLEAN      | DEFAULT false        |
| reconciled_at  | TIMESTAMP    | NULLABLE             |
| reconciled_by  | BIGINT(FK)   | NULLABLE (→users)    |
| notes          | TEXT         | NULLABLE             |
| created_at     | TIMESTAMP    |                      |
| updated_at     | TIMESTAMP    |                      |

#### `invoice_lines`
| Column     | Type          | Constraints          |
|------------|--------------|----------------------|
| id         | BIGINT(PK)   | AUTO_INCREMENT       |
| invoice_id | BIGINT(FK)   | NOT NULL (→invoices) |
| item_id    | BIGINT(FK)   | NULLABLE (→items)    |
| description| VARCHAR(200) | NULLABLE             |
| qty        | DECIMAL(10,2)| NOT NULL             |
| unit_price | DECIMAL(12,2)| NOT NULL             |
| line_total | DECIMAL(14,2)| NOT NULL             |
| matched    | BOOLEAN      | DEFAULT false        |
| created_at | TIMESTAMP    |                      |
| updated_at | TIMESTAMP    |                      |

#### `audit_logs`
| Column      | Type         | Constraints          |
|-------------|-------------|----------------------|
| id          | BIGINT(PK)  | AUTO_INCREMENT       |
| user_id     | BIGINT(FK)  | NULLABLE (→users)    |
| action      | VARCHAR(20) | NOT NULL (create/update/delete) |
| table_name  | VARCHAR(50) | NOT NULL             |
| record_id   | BIGINT      | NOT NULL             |
| old_values  | JSON        | NULLABLE             |
| new_values  | JSON        | NULLABLE             |
| ip_address  | VARCHAR(45) | NULLABLE             |
| user_agent  | VARCHAR(255)| NULLABLE             |
| created_at  | TIMESTAMP   |                      |

---

## 3. API Specification

### 3.1 Authentication
| Method | Endpoint         | Description     | Auth |
|--------|-----------------|-----------------|------|
| POST   | /api/auth/login  | Login           | No   |
| POST   | /api/auth/logout | Logout          | Yes  |
| GET    | /api/auth/me     | Current user    | Yes  |

**POST /api/auth/login**
```json
// Request
{ "email": "b1@packinglist.com", "password": "password" }
// Response 200
{ "token": "jwt...", "user": { "id": 1, "name": "B1 User", "role": "b1", "store": { "id": 1, "code": "B1" } } }
```

### 3.2 Stores
| Method | Endpoint        | Description      | Auth   |
|--------|----------------|------------------|--------|
| GET    | /api/stores     | List stores      | Yes    |
| POST   | /api/stores     | Create store     | Admin  |
| GET    | /api/stores/:id | Get store        | Yes    |
| PUT    | /api/stores/:id | Update store     | Admin  |
| DELETE | /api/stores/:id | Soft delete      | Admin  |

### 3.3 Items
| Method | Endpoint       | Description      | Auth   |
|--------|---------------|------------------|--------|
| GET    | /api/items     | List items       | Yes    |
| POST   | /api/items     | Create item      | Admin  |
| GET    | /api/items/:id | Get item         | Yes    |
| PUT    | /api/items/:id | Update item      | Admin  |
| DELETE | /api/items/:id | Soft delete      | Admin  |

### 3.4 Prices
| Method | Endpoint                | Description        | Auth   |
|--------|------------------------|--------------------|--------|
| GET    | /api/prices            | List active prices | Yes    |
| POST   | /api/prices            | Set new price      | Admin  |
| GET    | /api/prices/:id        | Get price          | Yes    |
| GET    | /api/prices/item/:id   | Price history      | Yes    |

### 3.5 Orders
| Method | Endpoint                    | Description         | Auth      |
|--------|-----------------------------|---------------------|-----------|
| GET    | /api/orders                 | List orders         | Yes       |
| POST   | /api/orders                 | Create order        | Store     |
| GET    | /api/orders/:id             | Get order detail    | Yes       |
| PUT    | /api/orders/:id             | Update draft        | Owner     |
| POST   | /api/orders/:id/submit      | Submit order        | Owner     |
| POST   | /api/orders/:id/prepare     | Start preparing     | Sender    |
| POST   | /api/orders/:id/ship        | Ship order          | Sender    |
| POST   | /api/orders/:id/receive     | Receive order       | Receiver  |
| POST   | /api/orders/:id/complete    | Complete order      | Receiver  |
| POST   | /api/orders/:id/cancel      | Cancel order        | Owner     |

**POST /api/orders**
```json
// Request
{
  "to_store_id": 2,
  "notes": "Monthly supply",
  "lines": [
    { "item_id": 1, "requested_qty": 10 },
    { "item_id": 3, "requested_qty": 5.5 }
  ]
}
// Response 201
{
  "id": 1,
  "order_number": "PL-20260301-001",
  "from_store": { "id": 1, "code": "B1" },
  "to_store": { "id": 2, "code": "B2" },
  "status": "draft",
  "lines": [...]
}
```

**POST /api/orders/:id/ship**
```json
// Request
{
  "lines": [
    { "id": 1, "shipped_qty": 10 },
    { "id": 2, "shipped_qty": 5 }
  ]
}
```

**POST /api/orders/:id/receive**
```json
// Request
{
  "lines": [
    { "id": 1, "received_qty": 10 },
    { "id": 2, "received_qty": 4.5, "notes": "1 bottle damaged" }
  ]
}
```

### 3.6 Notifications
| Method | Endpoint                        | Description         | Auth |
|--------|--------------------------------|---------------------|------|
| GET    | /api/notifications             | List notifications  | Yes  |
| GET    | /api/notifications/unread-count| Unread count        | Yes  |
| PUT    | /api/notifications/:id/read    | Mark as read        | Yes  |
| PUT    | /api/notifications/read-all    | Mark all as read    | Yes  |

### 3.7 Summary
| Method | Endpoint                   | Description           | Auth       |
|--------|---------------------------|-----------------------|------------|
| GET    | /api/summary/monthly      | Monthly summary       | Accountant |
| GET    | /api/summary/yearly       | Yearly summary        | Accountant |
| GET    | /api/summary/pair/:pair   | Summary by pair       | Accountant |
| GET    | /api/summary/export/excel | Export Excel           | Accountant |
| GET    | /api/summary/export/pdf   | Export PDF             | Accountant |

**Query params:** `?year=2026&month=3&pair=B1-B2`

### 3.8 Invoices
| Method | Endpoint                    | Description       | Auth       |
|--------|----------------------------|--------------------|------------|
| GET    | /api/invoices              | List invoices      | Accountant |
| POST   | /api/invoices              | Create invoice     | Accountant |
| GET    | /api/invoices/:id          | Get invoice        | Accountant |
| PUT    | /api/invoices/:id          | Update invoice     | Accountant |
| POST   | /api/invoices/:id/reconcile| Reconcile          | Accountant |

### 3.9 Statistics
| Method | Endpoint              | Description        | Auth |
|--------|-----------------------|--------------------|------|
| GET    | /api/stats/dashboard  | Dashboard stats    | Yes  |
| GET    | /api/stats/monthly    | Monthly stats      | Yes  |
| GET    | /api/stats/yearly     | Yearly stats       | Yes  |

### 3.10 Audit Logs
| Method | Endpoint         | Description    | Auth  |
|--------|-----------------|----------------|-------|
| GET    | /api/audit-logs  | List logs      | Admin |

### 3.11 Export
| Method | Endpoint                    | Description      | Auth |
|--------|----------------------------|------------------|------|
| GET    | /api/export/orders/excel    | Export orders     | Yes  |
| GET    | /api/export/orders/pdf      | Export order PDF  | Yes  |
| GET    | /api/export/summary/excel   | Export summary    | Acct |
| GET    | /api/export/summary/pdf     | Export summary    | Acct |

---

## 4. Order Number Format
`PL-YYYYMMDD-NNN`
- PL: Packing List prefix
- YYYYMMDD: Date created
- NNN: Sequential number per day (001, 002, ...)

---

## 5. Notification Types

| Type              | Trigger                    | Recipients        |
|-------------------|---------------------------|--------------------|
| order_submitted   | Order submitted           | Receiver store     |
| order_preparing   | Sender starts preparing   | Receiver store     |
| order_shipped     | Order shipped             | Receiver store     |
| order_received    | Order received            | Sender store       |
| order_adjusted    | Received qty differs      | Sender store       |
| order_completed   | Order completed           | Accountant         |
| order_cancelled   | Order cancelled           | Other party        |

---

## 6. Price Snapshot Logic

When an order is marked as **completed**:
1. For each order line, fetch the current active price for the item
2. Store `unit_price` = active price at completion time
3. Calculate `line_total` = `received_qty * unit_price`
4. These values are immutable after completion

If no active price exists at completion time:
- Set `unit_price` = 0
- Flag the order line for admin review

---

## 7. Monthly Summary Calculation

Generated from completed orders only:

```sql
SELECT
  from_store_id,
  to_store_id,
  COUNT(*) as total_orders,
  SUM(ol.line_total) as total_amount
FROM orders o
JOIN order_lines ol ON o.id = ol.order_id
WHERE o.status = 'completed'
  AND YEAR(o.completed_at) = ?
  AND MONTH(o.completed_at) = ?
GROUP BY from_store_id, to_store_id
```

### Net Balance Calculation (per pair per month):
```
B1→B2 amount: SUM where from=B1, to=B2
B2→B1 amount: SUM where from=B2, to=B1 (always 0 per rules)
Net: B1 owes B2 = B1→B2 amount
```

---

## 8. Security Requirements

### 8.1 Authentication
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with 24h expiry (v2) or session-based (v1)
- CSRF token on all forms (v1)

### 8.2 Authorization Middleware
```
admin      → full access
b1         → own store orders + allowed transfers
b2         → own store orders + allowed transfers
b3         → own store orders + allowed transfers
accountant → read-only + summary + invoice + export
```

### 8.3 Input Validation
- All inputs sanitized and validated
- Numeric fields: min 0, max 999999.99
- String fields: max length enforced
- File upload: only xlsx, csv, pdf (invoices)

---

## 9. Test Accounts

| Email                     | Password | Role       | Store |
|---------------------------|----------|------------|-------|
| admin@packinglist.com     | password | admin      | -     |
| b1@packinglist.com        | password | b1         | B1    |
| b2@packinglist.com        | password | b2         | B2    |
| b3@packinglist.com        | password | b3         | B3    |
| accountant@packinglist.com| password | accountant | -     |

---

## 10. Seed Data

### Items (20+)
| Code   | Name              | Unit   | Category  |
|--------|-------------------|--------|-----------|
| ITM001 | Coca Cola 330ml   | can    | Beverage  |
| ITM002 | Pepsi 330ml       | can    | Beverage  |
| ITM003 | Heineken 330ml    | bottle | Beverage  |
| ITM004 | Tiger 330ml       | bottle | Beverage  |
| ITM005 | Red Bull 250ml    | can    | Beverage  |
| ITM006 | Water 500ml       | bottle | Beverage  |
| ITM007 | Orange Juice 1L   | bottle | Beverage  |
| ITM008 | Rice 5kg          | bag    | Food      |
| ITM009 | Cooking Oil 1L    | bottle | Food      |
| ITM010 | Soy Sauce 500ml   | bottle | Food      |
| ITM011 | Fish Sauce 500ml  | bottle | Food      |
| ITM012 | Sugar 1kg         | bag    | Food      |
| ITM013 | Salt 500g         | bag    | Food      |
| ITM014 | Napkins (100pk)   | pack   | Supply    |
| ITM015 | Plastic Cups 50pk | pack   | Supply    |
| ITM016 | Straws 100pk      | pack   | Supply    |
| ITM017 | Trash Bags 20pk   | pack   | Supply    |
| ITM018 | Dish Soap 750ml   | bottle | Supply    |
| ITM019 | Hand Soap 500ml   | bottle | Supply    |
| ITM020 | Paper Towels 6pk  | pack   | Supply    |
| ITM021 | Coffee Beans 1kg  | bag    | Beverage  |
| ITM022 | Tea Bags 100pk    | box    | Beverage  |
| ITM023 | Milk 1L           | carton | Beverage  |
| ITM024 | Butter 250g       | block  | Food      |
| ITM025 | Flour 1kg         | bag    | Food      |
