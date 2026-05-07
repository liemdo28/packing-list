# Restaurant Operations System - User Guide

**Version 2.0**
**Last Updated: May 2026**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Orders Management](#3-orders-management)
4. [Notifications](#4-notifications)
5. [Packing](#5-packing)
6. [FAQ & Troubleshooting](#6-faq--troubleshooting)

---

## 1. Getting Started

### 1.1 Login

1. Open the application URL in your browser
2. Enter your **Username** and **Password**
3. Click **Sign In**
4. You will be redirected to the Dashboard

### 1.2 User Roles

The system supports the following roles:

| Role | Description |
|------|-------------|
| **Admin** | Full system access, manage users, stores, settings |
| **B1 (Branch 1)** | Create orders, manage items, view reports |
| **B2 (Branch 2)** | Manage orders, invoices, packing |
| **B3 (Branch 3)** | Supplier role, receive and fulfill orders |
| **Accountant** | View invoices, pricing, financial reports |

### 1.3 Navigation

- **Left Sidebar**: Main menu with all sections
- **Top Right**: Notification bell and user profile
- **Main Content Area**: Displays current section

---

## 2. Dashboard

The Dashboard provides a quick overview of your daily activities.

### 2.1 Dashboard Widgets

- **Today's Orders**: Number of orders created today
- **Pending Actions**: Orders waiting for your action
- **Recent Activity**: Latest order status changes
- **Quick Actions**: Create new order, view pending items

### 2.2 Quick Actions

From the dashboard, you can:
- Create a new order
- View your pending tasks
- Check delayed orders
- Access recent orders

---

## 3. Orders Management

### 3.1 Order Workflow

Orders follow this workflow:

```
DRAFT → SUBMITTED → PREPARING → SHIPPING → RECEIVED → COMPLETED
                    ↓
                 CANCELLED
```

### 3.2 Creating an Order (B1 Role)

1. Go to **Orders** in the sidebar
2. Click **Create Order**
3. Select **From Store** (your store) and **To Store** (supplier)
4. Add items with quantities
5. Add optional notes
6. Click **Create Order**

**Important**: Orders start as Draft and must be submitted to begin processing.

### 3.3 Order Actions by Role

#### For B1 (Requester Store):

| Status | Actions Available |
|--------|-------------------|
| Draft | Edit, Delete, Submit |
| Submitted | Cancel (with reason) |
| Preparing | View progress |
| Shipped | Acknowledge receipt |
| Completed | View invoice |
| Cancelled | View cancellation reason |

#### For B3 (Supplier Store):

| Status | Actions Available |
|--------|-------------------|
| Submitted | Review & Accept or Reject |
| Accepted | Start Preparing |
| Preparing | Mark as Ready |
| Ready | Confirm Shipment |

### 3.4 Order Detail Page

Click on any order to view:
- Order number and date
- Source and destination stores
- Item list with quantities
- Current status
- Activity timeline
- Notes and comments

### 3.5 Filtering Orders

Use the filter options to find orders by:
- Status (Draft, Submitted, Preparing, etc.)
- Store (From/To)
- Date range
- Order number search

---

## 4. Notifications

### 4.1 Notification Bell

The notification bell is located in the **top-right corner** of the screen.

- **Red badge**: Shows number of unread notifications
- **Click**: Opens notification dropdown

### 4.2 Notification Types

| Type | Description | Color |
|------|-------------|-------|
| Order | Order status updates | Blue |
| Shipment | Shipping/delivery updates | Purple |
| Discrepancy | Quantity mismatch alerts | Red |
| Alert | Important system alerts | Orange |

### 4.3 Severity Levels

| Level | Meaning |
|-------|---------|
| **Low** | Informational only |
| **Medium** | Normal workflow updates |
| **High** | Needs attention soon |
| **Critical** | Immediate action required |

### 4.4 Viewing Notifications

1. Click the **bell icon** in the top-right
2. View recent notifications in the dropdown
3. Click any notification to open the related order
4. Click **"View all notifications"** for full history

### 4.5 Notification Page

Navigate to **Notifications** from the sidebar for:
- Full notification history
- Filter by type, status, severity
- Mark as read
- Mark all as read

### 4.6 What Triggers Notifications

You will receive notifications when:

| Event | Who Receives |
|-------|-------------|
| New order created | Supplier store users |
| Order submitted | Supplier store users |
| Order accepted | Requester store users |
| Order rejected | Requester store users + Admin |
| Quantity changed | Requester store users |
| Order shipped | Requester store users |
| Order received | Supplier store users |
| Order completed | Both stores + Admin |
| Discrepancy detected | Supplier + Admin |

---

## 5. Packing

### 5.1 Packing Overview

The Packing feature helps manage physical packing and delivery of orders.

### 5.2 Creating a Packing Job

1. Go to **Packing** in the sidebar
2. Click **Create Packing**
3. Select the order to pack
4. Add items with actual packed quantities
5. Save the packing job

### 5.3 Packing Templates

Create reusable templates for common packing configurations:
1. Go to **Packing Templates**
2. Click **Create Template**
3. Define template name and items
4. Save for future use

---

## 6. FAQ & Troubleshooting

### Q: I can't see the Orders menu
**A:** Your role may not have order permissions. Contact your administrator.

### Q: Why isn't my notification bell updating?
**A:** Refresh the page. Notifications update every 15 seconds automatically.

### Q: I created an order but the supplier hasn't seen it
**A:** Make sure you clicked **Submit** after creating the order. Draft orders are not sent to suppliers.

### Q: Can I edit an order after submitting?
**A:** Only draft orders can be edited. Once submitted, contact the supplier to reject and recreate.

### Q: What happens if quantities are wrong?
**A:** If a discrepancy is detected during receiving, an alert is sent to the supplier and admin.

### Q: How do I cancel an order?
**A:** For draft orders, click Delete. For submitted orders, click Cancel and provide a reason.

---

## Quick Reference

### Order Status Meanings

| Status | Meaning |
|--------|---------|
| Draft | Created but not submitted |
| Submitted | Sent to supplier, awaiting review |
| Preparing | Supplier is preparing the order |
| Ready to Ship | Order packed and ready |
| Shipped | Order in transit |
| Received | Order arrived at destination |
| Completed | Order fully processed |
| Cancelled | Order cancelled |

### Common Actions

| Task | Location |
|------|----------|
| Create Order | Orders → Create Order |
| Submit Order | Order Detail → Submit button |
| View Notifications | Top-right bell icon |
| Change Password | User menu (top-right) |
| Contact Admin | Use /admin command or email |

---

## Support

For technical issues or questions:
- Contact your system administrator
- Email: admin@yourcompany.com
- Internal Support: @admin

---

*This guide is for the Restaurant Operations System v2.0*
