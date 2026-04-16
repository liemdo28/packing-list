# Packing List - Laravel Version

Internal store transfer management system built with Laravel 11 + Blade + Tailwind CSS.

## Prerequisites

- PHP 8.2+
- Composer 2.x
- MySQL 8.0+
- Node.js 18+ (for Vite/Tailwind)

## Installation

```bash
# 1. Install PHP dependencies
composer install

# 2. Copy environment file
cp .env.example .env

# 3. Generate application key
php artisan key:generate

# 4. Configure database in .env
# DB_DATABASE=packing_list
# DB_USERNAME=root
# DB_PASSWORD=

# 5. Create database
mysql -u root -e "CREATE DATABASE packing_list"

# 6. Run migrations
php artisan migrate

# 7. Seed test data
php artisan db:seed

# 8. Install frontend dependencies
npm install

# 9. Build assets (or run dev server)
npm run dev
```

## Running

```bash
# Terminal 1: Laravel server
php artisan serve

# Terminal 2: Vite dev server (for hot reload)
npm run dev
```

Visit: http://localhost:8000

## Test Accounts

| Email | Password | Role | Store |
|---|---|---|---|
| admin@packinglist.com | password | Admin | - |
| b1@packinglist.com | password | B1 | Store B1 |
| b2@packinglist.com | password | B2 | Store B2 |
| b3@packinglist.com | password | B3 | Store B3 |
| accountant@packinglist.com | password | Accountant | - |

## Transfer Rules

| From | Can Send To |
|------|------------|
| B1 | B2, B3 |
| B2 | (cannot send) |
| B3 | B1, B2 |

## Order Workflow

Draft -> Submitted -> Preparing -> Shipped -> Received -> Completed

## Features

- Role-based access control (Admin, B1, B2, B3, Accountant)
- Full order workflow with status tracking
- Real-time notification system (polling)
- Price management with snapshots on order completion
- Accountant summary by store pair (B1-B2, B1-B3, B2-B3)
- Invoice reconciliation for Four Season
- Excel/PDF export
- Audit logging
- Mobile responsive UI

## Production Deployment (Shared Hosting)

```bash
# 1. Upload files to server
# 2. Point domain to /public directory
# 3. Set permissions
chmod -R 775 storage bootstrap/cache

# 4. Install dependencies
composer install --optimize-autoloader --no-dev

# 5. Build assets
npm run build

# 6. Configure .env
# Set APP_ENV=production, APP_DEBUG=false

# 7. Run migrations
php artisan migrate --force

# 8. Seed data
php artisan db:seed

# 9. Cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Tech Stack

- **Backend:** Laravel 11, PHP 8.2
- **Frontend:** Blade, Tailwind CSS 3, Alpine.js 3
- **Database:** MySQL 8.0
- **Build:** Vite 5
- **Export:** PhpSpreadsheet (Excel), DomPDF (PDF)
