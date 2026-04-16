# Packing List - Store Transfer Management System

Internal system for managing inventory transfers between store branches (B1, B2, B3).

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Transfer Rules

| From | To | Allowed |
|------|-----|---------|
| B1   | B2  | Yes     |
| B1   | B3  | Yes     |
| B2   | *   | No (B2 never sends) |
| B3   | B1  | Yes     |
| B3   | B2  | Yes     |

B2 pays the Four Season supplier on behalf of B1 and B3. The accountant reconciles invoices at month-end.

## Order Workflow

```
Draft -> Submitted -> Preparing -> Shipped -> Received -> Completed
                                                          (or Cancelled)
```

## Server Setup

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MySQL credentials

# Create the database
mysql -u root -p -e "CREATE DATABASE packing_list;"

# Run database migrations
npm run migrate

# Seed sample data
npm run seed

# Start the server
npm run dev
```

Server runs on http://localhost:3001

## Client Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Client runs on http://localhost:5173 (proxies API requests to server)

## Test Accounts

| Username   | Password | Role       | Store |
|------------|----------|------------|-------|
| admin      | password | Admin      | -     |
| user_b1    | password | B1 Staff   | B1    |
| user_b2    | password | B2 Staff   | B2    |
| user_b3    | password | B3 Staff   | B3    |
| accountant | password | Accountant | -     |

## Role Permissions

- **Admin**: Full access to all features
- **B1 Staff**: Create orders from B1, manage items, view own orders
- **B2 Staff**: Receive orders, manage invoices (B2 pays suppliers)
- **B3 Staff**: Create orders from B3, manage items, view own orders
- **Accountant**: View all orders, manage prices, invoices, summaries, reconciliation

## API Endpoints

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| POST   | /api/auth/login             | Login                    |
| GET    | /api/auth/me                | Current user info        |
| GET    | /api/dashboard/stats        | Dashboard statistics     |
| GET    | /api/stores                 | List stores              |
| GET    | /api/items                  | List items               |
| GET    | /api/prices                 | List prices              |
| GET    | /api/orders                 | List orders              |
| POST   | /api/orders                 | Create order             |
| POST   | /api/orders/:id/submit      | Submit order             |
| POST   | /api/orders/:id/prepare     | Start preparing          |
| POST   | /api/orders/:id/ship        | Mark shipped             |
| POST   | /api/orders/:id/receive     | Confirm received         |
| POST   | /api/orders/:id/complete    | Complete order           |
| POST   | /api/orders/:id/cancel      | Cancel order             |
| GET    | /api/notifications          | List notifications       |
| GET    | /api/summary/monthly        | Monthly summary          |
| GET    | /api/export/excel           | Export to Excel          |
| GET    | /api/export/pdf             | Export to PDF            |
| GET    | /api/invoices               | List invoices            |
| POST   | /api/invoices/:id/reconcile | Reconcile invoice        |
| GET    | /api/audit-logs             | List audit logs          |
| GET    | /api/users                  | List users               |

## Production Deployment

### Build the client

```bash
cd client
npm run build
```

### PM2 + Nginx

```bash
# Install PM2
npm install -g pm2

# Start server with PM2
cd server
pm2 start src/index.js --name packing-list

# Save PM2 process list
pm2 save
pm2 startup
```

### Nginx configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve client build
    location / {
        root /path/to/v2-react/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Tech Stack

- **Server**: Express.js, Sequelize ORM, MySQL, JWT authentication
- **Client**: React 18, React Router, Tailwind CSS, Axios
- **Exports**: ExcelJS (spreadsheets), PDFKit (PDF reports)
